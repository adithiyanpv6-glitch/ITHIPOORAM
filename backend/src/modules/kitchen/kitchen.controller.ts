import { Response } from 'express';
import { prisma } from '../../db/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AuditService } from '../audit/audit.service';
import { SocketEvents } from '../../sockets';
import { getBusinessDate } from '../../utils/date';

export class KitchenController {
  /**
   * Get all active kitchen orders
   */
  static async getActiveOrders(req: AuthenticatedRequest, res: Response) {
    const { stationCode } = req.query;

    try {
      const businessDate = getBusinessDate();

      const whereClause: any = {
        businessDate,
        fulfillmentStatus: {
          in: ['NEW', 'ACCEPTED', 'PREPARING', 'READY'],
        },
      };

      if (stationCode) {
        whereClause.station = { code: String(stationCode) };
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          items: true,
          table: { select: { tableCode: true, displayName: true } },
          station: { select: { id: true, code: true, name: true } },
        },
        orderBy: { createdAt: 'asc' }, // Oldest pending first
      });

      return res.status(200).json(orders);
    } catch (error) {
      console.error('Error fetching active kitchen orders:', error);
      return res.status(500).json({ error: 'Failed to fetch active kitchen orders.' });
    }
  }

  /**
   * Update order fulfillment status (NEW -> ACCEPTED -> PREPARING -> READY -> SERVED / CANCELLED)
   */
  static async updateOrderStatus(req: AuthenticatedRequest, res: Response) {
    const { orderId } = req.params;
    const { status, reason } = req.body;

    const allowedStatuses = ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status '${status}'. Allowed: ${allowedStatuses.join(', ')}`,
      });
    }

    if (status === 'CANCELLED' && (!reason || reason.trim().length === 0)) {
      return res.status(400).json({ error: 'A cancellation reason is required.' });
    }

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          table: { select: { tableCode: true, displayName: true } },
          items: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
      }

      // If already served or cancelled, reject invalid backwards transitions
      if (order.fulfillmentStatus === 'CANCELLED') {
        return res.status(400).json({ error: 'Order is already cancelled and cannot be modified.' });
      }

      const oldStatus = order.fulfillmentStatus;

      // Update in transaction
      const updatedOrder = await prisma.$transaction(async (tx) => {
        const o = await tx.order.update({
          where: { id: orderId },
          data: {
            fulfillmentStatus: status,
            cancelledReason: status === 'CANCELLED' ? reason.trim() : order.cancelledReason,
            cancelledByUserId: status === 'CANCELLED' ? req.user?.id : order.cancelledByUserId,
          },
          include: {
            table: { select: { tableCode: true, displayName: true } },
            items: true,
            station: true,
          },
        });

        // Record status history
        await tx.orderStatusHistory.create({
          data: {
            orderId,
            fromStatus: oldStatus,
            toStatus: status,
            changedByUserId: req.user?.id || null,
            reason: reason || `Kitchen workflow status transitioned to ${status}`,
          },
        });

        // If cancelled, restore stock
        if (status === 'CANCELLED') {
          for (const item of order.items) {
            await tx.menuItem.updateMany({
              where: { id: item.menuItemId, currentStock: { not: null } },
              data: {
                currentStock: { increment: item.quantity },
              },
            });
          }
        }

        return o;
      });

      // Audit Log
      await AuditService.record({
        userId: req.user?.id,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: status === 'CANCELLED' ? 'ORDER_CANCELLED' : 'KITCHEN_STATUS_CHANGED',
        module: 'KITCHEN',
        entityType: 'ORDER',
        entityId: order.id,
        tableCode: order.table?.tableCode,
        orderCode: order.customerCode,
        beforeSnapshot: { fulfillmentStatus: oldStatus },
        afterSnapshot: { fulfillmentStatus: status },
        reason: reason || null,
        result: 'SUCCESS',
      });

      // Broadcast update
      SocketEvents.notifyOrderStatusUpdated(updatedOrder, {
        from: oldStatus,
        to: status,
        reason,
      });

      return res.status(200).json({
        message: `Order ${order.customerCode} moved from ${oldStatus} to ${status}.`,
        order: updatedOrder,
      });
    } catch (error) {
      console.error('Error updating kitchen status:', error);
      return res.status(500).json({ error: 'Failed to update order status.' });
    }
  }

  /**
   * Get all kitchen stations
   */
  static async getStations(req: AuthenticatedRequest, res: Response) {
    try {
      const stations = await prisma.kitchenStation.findMany({
        where: { isActive: true },
      });
      return res.status(200).json(stations);
    } catch (error) {
      console.error('Error fetching stations:', error);
      return res.status(500).json({ error: 'Failed to fetch kitchen stations.' });
    }
  }
}
