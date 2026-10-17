import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../db/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AuditService } from '../audit/audit.service';
import { getBusinessDate } from '../../utils/date';
import { formatINR } from '../../utils/currency';

export class AdminController {
  /**
   * Executive Dashboard Overview KPIs
   */
  static async getOverview(req: AuthenticatedRequest, res: Response) {
    try {
      const businessDate = getBusinessDate();

      const [
        ordersToday,
        invoicesToday,
        menuItems,
        tables,
        recentPayments,
      ] = await Promise.all([
        prisma.order.findMany({
          where: { businessDate },
          include: { items: true },
        }),
        prisma.invoice.findMany({
          where: {
            order: { businessDate },
          },
          include: { items: true, cashier: { select: { fullName: true, username: true } } },
        }),
        prisma.menuItem.findMany({
          include: { category: true },
        }),
        prisma.restaurantTable.findMany(),
        prisma.payment.findMany({
          where: { order: { businessDate } },
          include: { cashier: { select: { fullName: true, username: true } } },
        }),
      ]);

      const totalOrdersCount = ordersToday.length;
      const cancelledOrders = ordersToday.filter((o) => o.fulfillmentStatus === 'CANCELLED');
      const paidOrders = ordersToday.filter((o) => o.billingStatus === 'PAID');
      const unpaidOrders = ordersToday.filter((o) => o.billingStatus === 'UNPAID' && o.fulfillmentStatus !== 'CANCELLED');

      const grossSalesPaise = invoicesToday.reduce((sum, inv) => sum + inv.grandTotalPaise, 0);
      const subtotalPaise = invoicesToday.reduce((sum, inv) => sum + inv.subtotalPaise, 0);
      const discountPaise = invoicesToday.reduce((sum, inv) => sum + inv.discountPaise, 0);
      const averageOrderValuePaise = paidOrders.length > 0 ? Math.round(grossSalesPaise / paidOrders.length) : 0;

      // Payment Breakdown
      const salesByPaymentType: Record<string, number> = {};
      for (const p of recentPayments) {
        if (p.paymentStatus === 'SUCCESS') {
          salesByPaymentType[p.paymentMode] = (salesByPaymentType[p.paymentMode] || 0) + p.amountPaise;
        }
      }

      // Top Selling Items
      const itemCounts: Record<string, { name: string; quantity: number; totalPaise: number }> = {};
      for (const inv of invoicesToday) {
        for (const it of inv.items) {
          if (!itemCounts[it.itemName]) {
            itemCounts[it.itemName] = { name: it.itemName, quantity: 0, totalPaise: 0 };
          }
          itemCounts[it.itemName].quantity += it.quantity;
          itemCounts[it.itemName].totalPaise += it.lineTotalPaise;
        }
      }
      const topSellingItems = Object.values(itemCounts)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8);

      // Low Stock / Out of Stock Items
      const stockAlerts = menuItems
        .filter((item) => !item.isAvailable || (item.currentStock !== null && item.currentStock <= 5))
        .map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category.name,
          isAvailable: item.isAvailable,
          currentStock: item.currentStock,
        }));

      // Table-wise sales
      const tableSales: Record<string, { tableCode: string; orderCount: number; totalPaise: number }> = {};
      for (const inv of invoicesToday) {
        if (!tableSales[inv.tableCodeSnapshot]) {
          tableSales[inv.tableCodeSnapshot] = { tableCode: inv.tableCodeSnapshot, orderCount: 0, totalPaise: 0 };
        }
        tableSales[inv.tableCodeSnapshot].orderCount += 1;
        tableSales[inv.tableCodeSnapshot].totalPaise += inv.grandTotalPaise;
      }

      // Staff billing activity
      const staffBilling: Record<string, { name: string; invoiceCount: number; totalPaise: number }> = {};
      for (const inv of invoicesToday) {
        const key = inv.cashierNameSnapshot;
        if (!staffBilling[key]) {
          staffBilling[key] = { name: key, invoiceCount: 0, totalPaise: 0 };
        }
        staffBilling[key].invoiceCount += 1;
        staffBilling[key].totalPaise += inv.grandTotalPaise;
      }

      return res.status(200).json({
        businessDate,
        kpis: {
          grossSalesPaise,
          subtotalPaise,
          discountPaise,
          netSalesPaise: grossSalesPaise,
          totalOrdersCount,
          paidOrdersCount: paidOrders.length,
          unpaidOrdersCount: unpaidOrders.length,
          cancelledOrdersCount: cancelledOrders.length,
          averageOrderValuePaise,
        },
        salesByPaymentType,
        topSellingItems,
        stockAlerts,
        tableWiseSales: Object.values(tableSales),
        staffBillingActivity: Object.values(staffBilling),
      });
    } catch (error) {
      console.error('Error fetching admin overview:', error);
      return res.status(500).json({ error: 'Failed to fetch executive dashboard overview.' });
    }
  }

  /**
   * Export reports to CSV
   */
  static async exportReportCsv(req: AuthenticatedRequest, res: Response) {
    const { reportType, businessDate } = req.query;
    const targetDate = typeof businessDate === 'string' ? businessDate : getBusinessDate();

    try {
      let csvContent = '';
      let filename = `ithipooram-report-${targetDate}.csv`;

      if (reportType === 'sales') {
        const invoices = await prisma.invoice.findMany({
          where: { order: { businessDate: targetDate } },
          include: { order: true },
          orderBy: { createdAt: 'desc' },
        });

        filename = `sales-report-${targetDate}.csv`;
        csvContent = 'Invoice Number,Order Code,Table,Time (Kolkata),Subtotal (INR),Discount (INR),Tax (INR),Grand Total (INR),Payment Mode,Cashier\n';
        for (const inv of invoices) {
          const tax = inv.grandTotalPaise - inv.subtotalPaise + inv.discountPaise;
          csvContent += `"${inv.invoiceNumber}","${inv.order.customerCode}","${inv.tableCodeSnapshot}","${inv.createdAt.toISOString()}","${inv.subtotalPaise / 100}","${inv.discountPaise / 100}","${tax / 100}","${inv.grandTotalPaise / 100}","${inv.paymentModeSnapshot}","${inv.cashierNameSnapshot}"\n`;
        }
      } else if (reportType === 'audit') {
        const logs = await prisma.auditLog.findMany({
          orderBy: { timestamp: 'desc' },
          take: 200,
        });

        filename = `audit-logs-${targetDate}.csv`;
        csvContent = 'Timestamp (UTC),User,Role,Action Type,Module,Table,Order,Invoice,Reason,Result\n';
        for (const l of logs) {
          csvContent += `"${l.timestamp.toISOString()}","${l.usernameSnapshot || 'System'}","${l.roleSnapshot || ''}","${l.actionType}","${l.module}","${l.tableCode || ''}","${l.orderCode || ''}","${l.invoiceNumber || ''}","${(l.reason || '').replace(/"/g, '""')}","${l.result}"\n`;
        }
      } else {
        // Default items summary
        const items = await prisma.invoiceItem.findMany({
          where: { invoice: { order: { businessDate: targetDate } } },
        });
        const summary: Record<string, { qty: number; total: number }> = {};
        for (const it of items) {
          if (!summary[it.itemName]) summary[it.itemName] = { qty: 0, total: 0 };
          summary[it.itemName].qty += it.quantity;
          summary[it.itemName].total += it.lineTotalPaise;
        }

        filename = `item-sales-${targetDate}.csv`;
        csvContent = 'Item Name,Total Quantity Sold,Total Revenue (INR)\n';
        for (const [name, val] of Object.entries(summary)) {
          csvContent += `"${name.replace(/"/g, '""')}",${val.qty},${val.total / 100}\n`;
        }
      }

      await AuditService.record({
        userId: req.user?.id,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'REPORT_EXPORTED',
        module: 'REPORT',
        reason: `Exported ${reportType || 'general'} CSV report for date ${targetDate}`,
        result: 'SUCCESS',
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.status(200).send(csvContent);
    } catch (error) {
      console.error('Error exporting CSV report:', error);
      return res.status(500).json({ error: 'Failed to export CSV report.' });
    }
  }

  /**
   * User Management: List all staff accounts
   */
  static async getUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          phone: true,
          isActive: true,
          pinHash: true,
          failedLoginAttempts: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const sanitized = users.map((u) => ({
        ...u,
        hasPin: !!u.pinHash,
        pinHash: undefined,
      }));

      return res.status(200).json(sanitized);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch employee list.' });
    }
  }

  /**
   * Create new employee account
   */
  static async createUser(req: AuthenticatedRequest, res: Response) {
    const { username, password, fullName, role, phone, pin } = req.body;

    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Username, password, full name, and role are required.' });
    }

    try {
      const existing = await prisma.user.findUnique({
        where: { username: username.trim().toLowerCase() },
      });

      if (existing) {
        return res.status(409).json({ error: 'Username already taken.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const pinHash = pin ? await bcrypt.hash(pin, salt) : null;

      const newUser = await prisma.user.create({
        data: {
          username: username.trim().toLowerCase(),
          passwordHash,
          pinHash,
          fullName: fullName.trim(),
          role,
          phone: phone || null,
          isActive: true,
        },
      });

      await AuditService.record({
        userId: req.user?.id,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'ACCOUNT_CREATED',
        module: 'AUTH',
        entityType: 'USER',
        entityId: newUser.id,
        afterSnapshot: { username: newUser.username, role: newUser.role },
        result: 'SUCCESS',
      });

      return res.status(201).json({
        message: `Employee ${newUser.fullName} created successfully.`,
        user: {
          id: newUser.id,
          username: newUser.username,
          fullName: newUser.fullName,
          role: newUser.role,
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Failed to create employee account.' });
    }
  }

  /**
   * Update staff account (Role, Active Status, PIN, Password)
   */
  static async updateUser(req: AuthenticatedRequest, res: Response) {
    const { userId } = req.params;
    const { role, isActive, password, pin, fullName, phone } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const updateData: any = {};
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
      if (fullName) updateData.fullName = fullName;
      if (phone !== undefined) updateData.phone = phone;

      const salt = await bcrypt.genSalt(10);
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, salt);
      }
      if (pin) {
        updateData.pinHash = await bcrypt.hash(pin, salt);
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      // Audit Log
      await AuditService.record({
        userId: req.user?.id,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: typeof isActive === 'boolean' && !isActive ? 'ACCOUNT_DISABLED' : 'USER_UPDATED',
        module: 'AUTH',
        entityType: 'USER',
        entityId: user.id,
        beforeSnapshot: { username: user.username, role: user.role, isActive: user.isActive },
        afterSnapshot: { username: updated.username, role: updated.role, isActive: updated.isActive },
        result: 'SUCCESS',
      });

      return res.status(200).json({
        message: 'Employee account updated successfully.',
        user: {
          id: updated.id,
          username: updated.username,
          fullName: updated.fullName,
          role: updated.role,
          isActive: updated.isActive,
        },
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Failed to update employee account.' });
    }
  }

  /**
   * Get restaurant business settings
   */
  static async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const settings = await prisma.businessSettings.findUnique({
        where: { id: 'default-settings' },
      });
      return res.status(200).json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ error: 'Failed to load business settings.' });
    }
  }

  /**
   * Update restaurant settings (MAIN_ADMIN only)
   */
  static async updateSettings(req: AuthenticatedRequest, res: Response) {
    const {
      restaurantName,
      malayalamName,
      address,
      phone,
      gstNumber,
      fssaiNumber,
      cgstPercent,
      sgstPercent,
      businessDayCutoffHour,
    } = req.body;

    try {
      const oldSettings = await prisma.businessSettings.findUnique({ where: { id: 'default-settings' } });

      const updated = await prisma.businessSettings.upsert({
        where: { id: 'default-settings' },
        update: {
          restaurantName: restaurantName || oldSettings?.restaurantName,
          malayalamName: malayalamName || oldSettings?.malayalamName,
          address: address || oldSettings?.address,
          phone: phone || oldSettings?.phone,
          gstNumber: gstNumber || oldSettings?.gstNumber,
          fssaiNumber: fssaiNumber || oldSettings?.fssaiNumber,
          cgstPercent: cgstPercent !== undefined ? cgstPercent : oldSettings?.cgstPercent,
          sgstPercent: sgstPercent !== undefined ? sgstPercent : oldSettings?.sgstPercent,
          businessDayCutoffHour: businessDayCutoffHour !== undefined ? businessDayCutoffHour : oldSettings?.businessDayCutoffHour,
        },
        create: {
          id: 'default-settings',
          restaurantName: restaurantName || 'Ithi Pooram',
          malayalamName: malayalamName || 'ഇത്തിപ്പൂരം',
          address: address || 'Trivandrum',
          phone: phone || '+91 471 233 4567',
          gstNumber: gstNumber || '32AAAAI0000A1Z5',
          fssaiNumber: fssaiNumber || '11324007000890',
        },
      });

      await AuditService.record({
        userId: req.user?.id,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'SETTINGS_UPDATED',
        module: 'SETTINGS',
        beforeSnapshot: oldSettings as any,
        afterSnapshot: updated as any,
        result: 'SUCCESS',
      });

      return res.status(200).json({
        message: 'Business settings updated successfully.',
        settings: updated,
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      return res.status(500).json({ error: 'Failed to update settings.' });
    }
  }
}
