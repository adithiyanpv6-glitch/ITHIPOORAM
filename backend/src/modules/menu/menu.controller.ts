import { Request, Response } from 'express';
import { prisma } from '../../db/prisma';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { SocketEvents } from '../../sockets';

export class MenuController {
  /**
   * Public customer menu for today
   */
  static async getTodayMenu(req: Request, res: Response) {
    try {
      const categories = await prisma.menuCategory.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        include: {
          items: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      // Filter and format items for customer
      const formatted = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        malayalamName: cat.malayalamName,
        slug: cat.slug,
        items: cat.items.map((item) => ({
          id: item.id,
          name: item.name,
          malayalamName: item.malayalamName,
          description: item.description,
          pricePaise: item.pricePaise,
          dietary: item.dietary,
          imageUrl: item.imageUrl,
          isAvailable: item.isAvailable && (item.currentStock === null || item.currentStock > 0),
          currentStock: item.currentStock,
        })),
      }));

      return res.status(200).json(formatted);
    } catch (error) {
      console.error('Error fetching today menu:', error);
      return res.status(500).json({ error: 'Failed to fetch menu.' });
    }
  }

  /**
   * Staff menu view with stock levels and stations
   */
  static async getStaffMenu(req: AuthenticatedRequest, res: Response) {
    try {
      const categories = await prisma.menuCategory.findMany({
        orderBy: { displayOrder: 'asc' },
        include: {
          items: {
            orderBy: { displayOrder: 'asc' },
            include: {
              station: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });

      return res.status(200).json(categories);
    } catch (error) {
      console.error('Error fetching staff menu:', error);
      return res.status(500).json({ error: 'Failed to fetch menu for staff.' });
    }
  }

  /**
   * Toggle item availability and/or daily stock count
   */
  static async updateAvailability(req: AuthenticatedRequest, res: Response) {
    const { itemId } = req.params;
    const { isAvailable, currentStock, dailyStockLimit } = req.body;

    try {
      const item = await prisma.menuItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        return res.status(404).json({ error: 'Menu item not found.' });
      }

      const updated = await prisma.menuItem.update({
        where: { id: itemId },
        data: {
          isAvailable: typeof isAvailable === 'boolean' ? isAvailable : item.isAvailable,
          currentStock: currentStock !== undefined ? currentStock : item.currentStock,
          dailyStockLimit: dailyStockLimit !== undefined ? dailyStockLimit : item.dailyStockLimit,
        },
      });

      // Audit log
      await AuditService.record({
        userId: req.user?.id,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'MENU_AVAILABILITY_CHANGED',
        module: 'MENU',
        entityType: 'MENU_ITEM',
        entityId: item.id,
        beforeSnapshot: { isAvailable: item.isAvailable, currentStock: item.currentStock },
        afterSnapshot: { isAvailable: updated.isAvailable, currentStock: updated.currentStock },
        reason: req.body.reason || 'Inventory / shift stock toggle',
        result: 'SUCCESS',
      });

      // Notify clients
      SocketEvents.notifyMenuUpdated(updated);

      return res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating menu availability:', error);
      return res.status(500).json({ error: 'Failed to update menu item availability.' });
    }
  }

  /**
   * Update item price (Requires MAIN_ADMIN or authorized role, audited with old and new price)
   */
  static async updatePrice(req: AuthenticatedRequest, res: Response) {
    const { itemId } = req.params;
    const { newPricePaise, reason } = req.body;

    if (newPricePaise === undefined || newPricePaise < 0) {
      return res.status(400).json({ error: 'A valid price in paise is required.' });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Reason is strictly required for auditing price changes.' });
    }

    try {
      const item = await prisma.menuItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        return res.status(404).json({ error: 'Menu item not found.' });
      }

      const oldPricePaise = item.pricePaise;

      const updated = await prisma.menuItem.update({
        where: { id: itemId },
        data: { pricePaise: newPricePaise },
      });

      // Audit price change
      await AuditService.record({
        userId: req.user?.id,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'MENU_PRICE_CHANGED',
        module: 'MENU',
        entityType: 'MENU_ITEM',
        entityId: item.id,
        beforeSnapshot: { name: item.name, pricePaise: oldPricePaise },
        afterSnapshot: { name: updated.name, pricePaise: updated.pricePaise },
        reason: reason.trim(),
        result: 'SUCCESS',
      });

      // Notify clients
      SocketEvents.notifyMenuUpdated(updated);

      return res.status(200).json({
        message: `Price for ${item.name} updated from ₹${oldPricePaise / 100} to ₹${newPricePaise / 100}.`,
        item: updated,
      });
    } catch (error) {
      console.error('Error updating menu item price:', error);
      return res.status(500).json({ error: 'Failed to update menu item price.' });
    }
  }
}
