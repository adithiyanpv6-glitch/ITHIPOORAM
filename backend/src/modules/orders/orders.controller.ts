import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { getBusinessDate, formatCustomerOrderCode, formatInternalOrderId } from '../../utils/date';
import { calculateTaxes } from '../../utils/currency';
import { AuditService } from '../audit/audit.service';
import { SocketEvents } from '../../sockets';

export class OrdersController {
  /**
   * Place an order from customer mobile QR session
   */
  static async createOrder(req: Request, res: Response) {
    const { tableCode, qrToken, items, customerNotes, idempotencyKey } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    if (!tableCode || !qrToken) {
      return res.status(400).json({ error: 'Table code and valid QR token are required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    try {
      // 1. Verify Table and QR Token
      const table = await prisma.restaurantTable.findUnique({
        where: { tableCode: String(tableCode).toUpperCase() },
      });

      if (!table) {
        return res.status(404).json({ error: 'Table not found.' });
      }

      if (!table.qrActive || table.qrToken !== qrToken) {
        await AuditService.record({
          actionType: 'TAMPERED_QR_ORDER_ATTEMPT',
          module: 'ORDER',
          tableCode: table.tableCode,
          ipAddress,
          reason: 'Token mismatch or inactive QR code',
          result: 'FAILURE',
        });
        return res.status(403).json({
          error: 'QR token is invalid, expired, or regenerated. Please scan the QR stand at your table.',
        });
      }

      // 2. Check Idempotency Key
      if (idempotencyKey) {
        const existingOrder = await prisma.order.findUnique({
          where: { idempotencyKey },
          include: {
            items: true,
            table: { select: { tableCode: true, displayName: true } },
          },
        });
        if (existingOrder) {
          return res.status(200).json({
            message: 'Order already received (idempotent submission).',
            order: existingOrder,
          });
        }
      }

      // 3. Process Items and Verify Availability & Stock
      const itemIds = items.map((i: any) => i.menuItemId);
      const dbMenuItems = await prisma.menuItem.findMany({
        where: { id: { in: itemIds } },
        include: { station: true },
      });

      const dbItemMap = new Map(dbMenuItems.map((item) => [item.id, item]));

      let subtotalPaise = 0;
      const orderItemsToCreate: Array<{
        menuItemId: string;
        itemNameSnapshot: string;
        itemPriceSnapshotPaise: number;
        quantity: number;
        itemNotes?: string;
        lineTotalPaise: number;
      }> = [];

      for (const reqItem of items) {
        const dbItem = dbItemMap.get(reqItem.menuItemId);
        if (!dbItem) {
          return res.status(400).json({ error: `Menu item with ID ${reqItem.menuItemId} does not exist.` });
        }

        if (!dbItem.isAvailable) {
          return res.status(400).json({
            error: `"${dbItem.name}" is currently unavailable. Please remove it from your cart.`,
          });
        }

        if (dbItem.currentStock !== null && dbItem.currentStock < reqItem.quantity) {
          return res.status(400).json({
            error: `Insufficient stock for "${dbItem.name}". Only ${dbItem.currentStock} remaining.`,
          });
        }

        const quantity = parseInt(reqItem.quantity, 10);
        if (isNaN(quantity) || quantity <= 0) {
          return res.status(400).json({ error: 'Quantity must be a positive integer.' });
        }

        const lineTotalPaise = dbItem.pricePaise * quantity;
        subtotalPaise += lineTotalPaise;

        orderItemsToCreate.push({
          menuItemId: dbItem.id,
          itemNameSnapshot: dbItem.name,
          itemPriceSnapshotPaise: dbItem.pricePaise,
          quantity,
          itemNotes: reqItem.itemNotes || null,
          lineTotalPaise,
        });
      }

      // 4. Calculate Taxes and Grand Total
      const { totalTaxPaise, grandTotalPaise } = calculateTaxes(subtotalPaise, 0);
      const businessDate = getBusinessDate();

      // 5. Database Transaction: Sequence Allocation, Order Creation, Stock Decrement
      const newOrder = await prisma.$transaction(async (tx) => {
        // Allocate next daily sequence for this table
        let counter = await tx.dailyBusinessCounter.findUnique({
          where: {
            businessDate_tableCode: {
              businessDate,
              tableCode: table.tableCode,
            },
          },
        });

        const nextSequence = (counter?.lastSequence || 0) + 1;

        if (counter) {
          await tx.dailyBusinessCounter.update({
            where: { id: counter.id },
            data: { lastSequence: nextSequence },
          });
        } else {
          await tx.dailyBusinessCounter.create({
            data: {
              businessDate,
              tableCode: table.tableCode,
              lastSequence: nextSequence,
            },
          });
        }

        const customerCode = formatCustomerOrderCode(table.tableCode, nextSequence);
        const internalId = formatInternalOrderId(businessDate, table.tableCode, nextSequence);

        // Create the order with immutable snapshot items
        const order = await tx.order.create({
          data: {
            internalId,
            customerCode,
            tableId: table.id,
            fulfillmentStatus: 'NEW',
            billingStatus: 'UNPAID',
            customerNotes: customerNotes ? customerNotes.trim() : null,
            subtotalPaise,
            taxPaise: totalTaxPaise,
            discountPaise: 0,
            grandTotalPaise,
            idempotencyKey: idempotencyKey || null,
            businessDate,
            sequenceNumber: nextSequence,
            items: {
              create: orderItemsToCreate,
            },
            statusHistory: {
              create: {
                fromStatus: 'NONE',
                toStatus: 'NEW',
                reason: 'Customer placed order via QR',
              },
            },
          },
          include: {
            items: true,
            table: { select: { tableCode: true, displayName: true } },
          },
        });

        // Decrement stock where applicable
        for (const reqItem of items) {
          const dbItem = dbItemMap.get(reqItem.menuItemId);
          if (dbItem && dbItem.currentStock !== null) {
            await tx.menuItem.update({
              where: { id: dbItem.id },
              data: {
                currentStock: Math.max(0, dbItem.currentStock - reqItem.quantity),
              },
            });
          }
        }

        // Update table operational status
        await tx.restaurantTable.update({
          where: { id: table.id },
          data: { status: 'ACTIVE_ORDER' },
        });

        return order;
      });

      // 6. Record Audit Log
      await AuditService.record({
        actionType: 'CUSTOMER_ORDER_CREATED',
        module: 'ORDER',
        entityType: 'ORDER',
        entityId: newOrder.id,
        tableCode: table.tableCode,
        orderCode: newOrder.customerCode,
        ipAddress,
        afterSnapshot: {
          internalId: newOrder.internalId,
          grandTotalPaise: newOrder.grandTotalPaise,
          itemCount: newOrder.items.length,
        },
        result: 'SUCCESS',
      });

      // 7. Emit Real-time Sockets to Kitchen Display & Billing Counters
      SocketEvents.notifyOrderCreated(newOrder);

      return res.status(201).json({
        message: 'Order placed successfully and sent to kitchen display.',
        order: newOrder,
      });
    } catch (error) {
      console.error('Order placement error:', error);
      return res.status(500).json({ error: 'Failed to place order. Please contact restaurant counter.' });
    }
  }

  /**
   * Get all orders for a table session
   */
  static async getOrdersByTable(req: Request, res: Response) {
    const { tableCode } = req.params;
    const { businessDate } = req.query;

    try {
      const targetDate = typeof businessDate === 'string' ? businessDate : getBusinessDate();

      const orders = await prisma.order.findMany({
        where: {
          table: { tableCode: tableCode.toUpperCase() },
          businessDate: targetDate,
        },
        include: {
          items: true,
          table: { select: { tableCode: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching table orders:', error);
      return res.status(500).json({ error: 'Failed to fetch table orders.' });
    }
  }

  /**
   * Get single order status by ID
   */
  static async getOrderById(req: Request, res: Response) {
    const { orderId } = req.params;

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          table: { select: { tableCode: true, displayName: true } },
          statusHistory: { orderBy: { timestamp: 'asc' } },
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      return res.status(200).json(order);
    } catch (error) {
      console.error('Error fetching order status:', error);
      return res.status(500).json({ error: 'Failed to fetch order.' });
    }
  }
}
