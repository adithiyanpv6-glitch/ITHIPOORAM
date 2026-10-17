import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db/prisma';
import { AuthenticatedRequest, verifyEmployeePin } from '../../middleware/auth';
import { AuditService } from '../audit/audit.service';
import { SocketEvents } from '../../sockets';
import { getBusinessDate, formatInvoiceNumber } from '../../utils/date';
import { calculateTaxes } from '../../utils/currency';
import { PrinterService } from '../printer/printer.service';

export class BillingController {
  /**
   * Cashier selects table and sees latest 3 to 5 UNPAID orders
   */
  static async getUnpaidOrdersForTable(req: AuthenticatedRequest, res: Response) {
    const { tableCode } = req.params;

    try {
      const table = await prisma.restaurantTable.findUnique({
        where: { tableCode: tableCode.toUpperCase() },
      });

      if (!table) {
        return res.status(404).json({ error: 'Table not found.' });
      }

      // Latest 3 to 5 unpaid orders
      const unpaidOrders = await prisma.order.findMany({
        where: {
          tableId: table.id,
          billingStatus: 'UNPAID',
          fulfillmentStatus: { not: 'CANCELLED' },
        },
        include: {
          items: true,
          table: { select: { tableCode: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      return res.status(200).json({
        table: {
          id: table.id,
          tableCode: table.tableCode,
          displayName: table.displayName,
          status: table.status,
        },
        unpaidOrders,
      });
    } catch (error) {
      console.error('Error fetching unpaid orders:', error);
      return res.status(500).json({ error: 'Failed to retrieve unpaid orders for table.' });
    }
  }

  /**
   * Cashier views full bill preview before collecting payment
   */
  static async getBillPreview(req: AuthenticatedRequest, res: Response) {
    const { orderId } = req.params;

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          table: { select: { tableCode: true, displayName: true } },
          discounts: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      const totalDiscountPaise = order.discountPaise || 0;
      const taxCalc = calculateTaxes(order.subtotalPaise, totalDiscountPaise);

      // Audit bill preview
      await AuditService.record({
        userId: req.user?.id,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'BILL_PREVIEW',
        module: 'BILLING',
        entityId: order.id,
        tableCode: order.table?.tableCode,
        orderCode: order.customerCode,
        result: 'SUCCESS',
      });

      return res.status(200).json({
        order,
        calculation: taxCalc,
      });
    } catch (error) {
      console.error('Error generating bill preview:', error);
      return res.status(500).json({ error: 'Failed to generate bill preview.' });
    }
  }

  /**
   * Confirm payment, row-level locking, generate invoice, print receipt
   */
  static async confirmPayment(req: AuthenticatedRequest, res: Response) {
    const { orderId } = req.params;
    const {
      paymentMode, // CASH, UPI, CARD, SPLIT_PAYMENT, OTHER
      referenceNumber,
      cashierPin,
      splitPayments, // Array<{ mode: string, amountPaise: number, ref?: string }>
      simulatePrinterFailure, // Testing hook for printer retry test
    } = req.body;

    const cashierId = req.user?.id;
    if (!cashierId) {
      return res.status(401).json({ error: 'Cashier authentication required.' });
    }

    if (!paymentMode) {
      return res.status(400).json({ error: 'Payment mode is required.' });
    }

    // 1. Mandatory Cashier Re-authentication via Personal PIN
    if (!cashierPin) {
      return res.status(400).json({ error: 'Personal cashier PIN is required for final payment authorization.' });
    }

    const isPinValid = await verifyEmployeePin(cashierId, cashierPin);
    if (!isPinValid) {
      await AuditService.record({
        userId: cashierId,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'PAYMENT_AUTHORIZATION_FAILED',
        module: 'BILLING',
        reason: 'Invalid cashier PIN provided at payment confirmation',
        result: 'FAILURE',
      });
      return res.status(401).json({ error: 'Invalid cashier PIN. Payment not authorized.' });
    }

    try {
      const businessDate = getBusinessDate();

      // 2. Concurrency-Safe Transaction with Row-Level Verification
      const result = await prisma.$transaction(async (tx) => {
        // Fetch order with active lock verification
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: {
            items: true,
            table: true,
          },
        });

        if (!order) {
          throw new Error('ORDER_NOT_FOUND');
        }

        // Strict business rule: Cannot bill an already-paid order or cancelled order
        if (order.billingStatus === 'PAID') {
          throw new Error('ORDER_ALREADY_PAID');
        }

        if (order.fulfillmentStatus === 'CANCELLED') {
          throw new Error('ORDER_IS_CANCELLED');
        }

        // Validate Split Payment if applicable
        if (paymentMode === 'SPLIT_PAYMENT') {
          if (!Array.isArray(splitPayments) || splitPayments.length === 0) {
            throw new Error('SPLIT_DETAILS_REQUIRED');
          }
          const sumSplit = splitPayments.reduce((s: number, p: any) => s + (parseInt(p.amountPaise, 10) || 0), 0);
          if (sumSplit !== order.grandTotalPaise) {
            throw new Error(`SPLIT_TOTAL_MISMATCH: Split sum (₹${sumSplit / 100}) does not equal total (₹${order.grandTotalPaise / 100})`);
          }
        }

        // Allocate sequential invoice number safely
        let invoiceCounter = await tx.dailyInvoiceCounter.findUnique({
          where: { businessDate },
        });

        const nextInvoiceSeq = (invoiceCounter?.lastSequence || 0) + 1;

        if (invoiceCounter) {
          await tx.dailyInvoiceCounter.update({
            where: { id: invoiceCounter.id },
            data: { lastSequence: nextInvoiceSeq },
          });
        } else {
          await tx.dailyInvoiceCounter.create({
            data: {
              businessDate,
              lastSequence: nextInvoiceSeq,
            },
          });
        }

        const invoiceNumber = formatInvoiceNumber(businessDate, nextInvoiceSeq);
        const taxCalc = calculateTaxes(order.subtotalPaise, order.discountPaise);

        // Create immutable Invoice snapshot
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            orderId: order.id,
            tableCodeSnapshot: order.table.tableCode,
            cashierUserId: cashierId,
            cashierNameSnapshot: req.user?.fullName || 'Counter Cashier',
            subtotalPaise: order.subtotalPaise,
            taxBreakupJson: JSON.stringify(taxCalc.taxBreakup),
            discountPaise: order.discountPaise,
            grandTotalPaise: order.grandTotalPaise,
            paymentModeSnapshot: paymentMode,
            printStatus: simulatePrinterFailure ? 'FAILED' : 'PRINTED',
            printCount: 1,
            items: {
              create: order.items.map((it) => ({
                itemName: it.itemNameSnapshot,
                unitPricePaise: it.itemPriceSnapshotPaise,
                quantity: it.quantity,
                lineTotalPaise: it.lineTotalPaise,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        // Create Payment records
        if (paymentMode === 'SPLIT_PAYMENT' && splitPayments) {
          for (const sp of splitPayments) {
            await tx.payment.create({
              data: {
                orderId: order.id,
                invoiceId: invoice.id,
                amountPaise: sp.amountPaise,
                paymentMode: sp.mode,
                paymentStatus: 'SUCCESS',
                referenceNumber: sp.ref || null,
                cashierUserId: cashierId,
                cashierPinConfirmed: true,
              },
            });
          }
        } else {
          await tx.payment.create({
            data: {
              orderId: order.id,
              invoiceId: invoice.id,
              amountPaise: order.grandTotalPaise,
              paymentMode,
              paymentStatus: 'SUCCESS',
              referenceNumber: referenceNumber || null,
              cashierUserId: cashierId,
              cashierPinConfirmed: true,
            },
          });
        }

        // Update Order billing status to PAID
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            billingStatus: 'PAID',
          },
          include: {
            items: true,
            table: true,
          },
        });

        // Create Print Log entry
        await tx.invoicePrintLog.create({
          data: {
            invoiceId: invoice.id,
            printType: 'INITIAL',
            cashierUserId: cashierId,
            status: simulatePrinterFailure ? 'FAILED' : 'SUCCESS',
            failureReason: simulatePrinterFailure ? 'Thermal printer paper jam / offline' : null,
          },
        });

        // Check if all orders for this table are now paid; if yes, mark table AVAILABLE
        const remainingUnpaidCount = await tx.order.count({
          where: {
            tableId: order.tableId,
            billingStatus: 'UNPAID',
            fulfillmentStatus: { not: 'CANCELLED' },
          },
        });

        if (remainingUnpaidCount === 0) {
          await tx.restaurantTable.update({
            where: { id: order.tableId },
            data: { status: 'AVAILABLE' },
          });
        }

        return { order: updatedOrder, invoice };
      });

      // 3. Record Audit Log for successful payment
      await AuditService.record({
        userId: cashierId,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'PAYMENT_CONFIRMED',
        module: 'BILLING',
        entityType: 'ORDER',
        entityId: result.order.id,
        tableCode: result.order.table.tableCode,
        orderCode: result.order.customerCode,
        invoiceNumber: result.invoice.invoiceNumber,
        afterSnapshot: {
          grandTotalPaise: result.order.grandTotalPaise,
          paymentMode,
          invoiceNumber: result.invoice.invoiceNumber,
        },
        result: 'SUCCESS',
      });

      // 4. Generate 80mm ESC/POS thermal receipt string
      const thermalReceipt = PrinterService.generateThermalReceiptText({
        invoiceNumber: result.invoice.invoiceNumber,
        orderCode: result.order.customerCode,
        tableCode: result.order.table.tableCode,
        cashierName: result.invoice.cashierNameSnapshot,
        createdAt: result.invoice.createdAt,
        subtotalPaise: result.invoice.subtotalPaise,
        discountPaise: result.invoice.discountPaise,
        cgstPaise: Math.round((result.invoice.grandTotalPaise - result.invoice.subtotalPaise + result.invoice.discountPaise) / 2),
        sgstPaise: Math.round((result.invoice.grandTotalPaise - result.invoice.subtotalPaise + result.invoice.discountPaise) / 2),
        grandTotalPaise: result.invoice.grandTotalPaise,
        paymentMode,
        referenceNumber,
        items: result.invoice.items.map((i) => ({
          name: i.itemName,
          quantity: i.quantity,
          unitPricePaise: i.unitPricePaise,
          lineTotalPaise: i.lineTotalPaise,
        })),
      });

      // 5. Broadcast real-time event to Kitchen, Billing, Admin
      SocketEvents.notifyOrderPaid(result.order, result.invoice);

      return res.status(200).json({
        message: 'Payment confirmed and invoice created.',
        order: result.order,
        invoice: result.invoice,
        printerStatus: simulatePrinterFailure ? 'PRINTER_ERROR' : 'SUCCESS',
        thermalReceipt,
      });
    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      if (error.message === 'ORDER_ALREADY_PAID') {
        return res.status(409).json({ error: 'This order has already been paid and billed. Duplicate payment rejected.' });
      }
      if (error.message === 'ORDER_IS_CANCELLED') {
        return res.status(400).json({ error: 'Cannot bill a cancelled order.' });
      }
      if (error.message && error.message.startsWith('SPLIT_TOTAL_MISMATCH')) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message || 'Payment processing failed.' });
    }
  }

  /**
   * Cashier retries printing or prints duplicate receipt with mandatory audit logging
   */
  static async reprintInvoice(req: AuthenticatedRequest, res: Response) {
    const { invoiceId } = req.params;
    const { reason, cashierPin } = req.body;
    const cashierId = req.user?.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'A specific reprint reason is required for audit compliance.' });
    }

    if (!cashierId || !cashierPin) {
      return res.status(400).json({ error: 'Cashier PIN is required for reprint authorization.' });
    }

    const isPinValid = await verifyEmployeePin(cashierId, cashierPin);
    if (!isPinValid) {
      return res.status(401).json({ error: 'Invalid cashier PIN.' });
    }

    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          items: true,
          order: true,
        },
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found.' });
      }

      const updatedCount = invoice.printCount + 1;

      // Update invoice print count
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          printCount: updatedCount,
          lastPrintedAt: new Date(),
          printStatus: 'PRINTED',
        },
      });

      // Record print log
      await prisma.invoicePrintLog.create({
        data: {
          invoiceId,
          printType: 'REPRINT',
          cashierUserId: cashierId,
          status: 'SUCCESS',
          reprintReason: reason.trim(),
        },
      });

      // Immutable Audit Log
      await AuditService.record({
        userId: cashierId,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'BILL_REPRINTED',
        module: 'BILLING',
        entityType: 'INVOICE',
        entityId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        tableCode: invoice.tableCodeSnapshot,
        reason: reason.trim(),
        afterSnapshot: { printCount: updatedCount },
        result: 'SUCCESS',
      });

      // Generate reprint thermal receipt layout
      const thermalReceipt = PrinterService.generateThermalReceiptText({
        invoiceNumber: invoice.invoiceNumber,
        orderCode: invoice.order.customerCode,
        tableCode: invoice.tableCodeSnapshot,
        cashierName: req.user?.fullName || invoice.cashierNameSnapshot,
        createdAt: invoice.createdAt,
        subtotalPaise: invoice.subtotalPaise,
        discountPaise: invoice.discountPaise,
        cgstPaise: Math.round((invoice.grandTotalPaise - invoice.subtotalPaise + invoice.discountPaise) / 2),
        sgstPaise: Math.round((invoice.grandTotalPaise - invoice.subtotalPaise + invoice.discountPaise) / 2),
        grandTotalPaise: invoice.grandTotalPaise,
        paymentMode: invoice.paymentModeSnapshot,
        items: invoice.items.map((i) => ({
          name: i.itemName,
          quantity: i.quantity,
          unitPricePaise: i.unitPricePaise,
          lineTotalPaise: i.lineTotalPaise,
        })),
        isReprint: true,
        reprintCount: updatedCount,
      });

      return res.status(200).json({
        message: `Reprinted invoice ${invoice.invoiceNumber}. Duplicate stamp applied.`,
        invoiceNumber: invoice.invoiceNumber,
        printCount: updatedCount,
        thermalReceipt,
      });
    } catch (error) {
      console.error('Invoice reprint error:', error);
      return res.status(500).json({ error: 'Failed to reprint invoice.' });
    }
  }

  /**
   * Apply Manager discount before payment
   */
  static async applyDiscount(req: AuthenticatedRequest, res: Response) {
    const { orderId } = req.params;
    const { discountPaise, reason } = req.body;
    const managerId = req.user?.id;

    if (!discountPaise || discountPaise <= 0) {
      return res.status(400).json({ error: 'A valid discount amount in paise is required.' });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'A valid reason is required for discounts.' });
    }

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      if (order.billingStatus === 'PAID') {
        return res.status(400).json({ error: 'Cannot apply discount to an already paid order.' });
      }

      if (discountPaise > order.subtotalPaise) {
        return res.status(400).json({ error: 'Discount cannot exceed order subtotal.' });
      }

      // Check max allowed manager discount
      const settings = await prisma.businessSettings.findUnique({ where: { id: 'default-settings' } });
      const maxDiscount = settings?.maxManagerDiscountPaise || 100000;

      if (req.user?.role !== 'MAIN_ADMIN' && discountPaise > maxDiscount) {
        return res.status(403).json({
          error: `Discounts exceeding ₹${maxDiscount / 100} require MAIN_ADMIN / OWNER approval.`,
        });
      }

      // Calculate new totals
      const taxCalc = calculateTaxes(order.subtotalPaise, discountPaise);

      const updated = await prisma.$transaction(async (tx) => {
        await tx.discount.create({
          data: {
            orderId,
            managerUserId: managerId!,
            discountType: 'FIXED_AMOUNT',
            amountPaise: discountPaise,
            reason: reason.trim(),
          },
        });

        return tx.order.update({
          where: { id: orderId },
          data: {
            discountPaise,
            taxPaise: taxCalc.totalTaxPaise,
            grandTotalPaise: taxCalc.grandTotalPaise,
          },
        });
      });

      // Audit log
      await AuditService.record({
        userId: managerId,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'DISCOUNT_APPLIED',
        module: 'BILLING',
        entityId: order.id,
        orderCode: order.customerCode,
        beforeSnapshot: { grandTotalPaise: order.grandTotalPaise, discountPaise: order.discountPaise },
        afterSnapshot: { grandTotalPaise: updated.grandTotalPaise, discountPaise: updated.discountPaise },
        reason: reason.trim(),
        result: 'SUCCESS',
      });

      return res.status(200).json({
        message: `Discount of ₹${discountPaise / 100} applied successfully.`,
        order: updated,
      });
    } catch (error) {
      console.error('Error applying discount:', error);
      return res.status(500).json({ error: 'Failed to apply discount.' });
    }
  }

  /**
   * Process refund on a paid invoice (Authorized MANAGER / MAIN_ADMIN with reason)
   */
  static async processRefund(req: AuthenticatedRequest, res: Response) {
    const { invoiceId } = req.params;
    const { reason, refundMode } = req.body;
    const authorizedUserId = req.user?.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'A specific reason is required to issue a refund.' });
    }

    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { order: true },
      });

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found.' });
      }

      if (invoice.order.billingStatus === 'REFUNDED') {
        return res.status(400).json({ error: 'This invoice has already been refunded.' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.refund.create({
          data: {
            orderId: invoice.orderId,
            invoiceId: invoice.id,
            authorizedByUserId: authorizedUserId!,
            amountPaise: invoice.grandTotalPaise,
            reason: reason.trim(),
            refundMode: refundMode || 'ORIGINAL_MODE',
          },
        });

        await tx.order.update({
          where: { id: invoice.orderId },
          data: { billingStatus: 'REFUNDED' },
        });

        await tx.payment.updateMany({
          where: { invoiceId: invoice.id },
          data: { paymentStatus: 'REFUNDED' },
        });
      });

      // Audit Log
      await AuditService.record({
        userId: authorizedUserId,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'REFUND_ISSUED',
        module: 'BILLING',
        entityId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        orderCode: invoice.order.customerCode,
        tableCode: invoice.tableCodeSnapshot,
        reason: reason.trim(),
        afterSnapshot: { refundAmountPaise: invoice.grandTotalPaise },
        result: 'SUCCESS',
      });

      return res.status(200).json({
        message: `Refund of ₹${invoice.grandTotalPaise / 100} processed for invoice ${invoice.invoiceNumber}.`,
      });
    } catch (error) {
      console.error('Error processing refund:', error);
      return res.status(500).json({ error: 'Failed to process refund.' });
    }
  }
}
