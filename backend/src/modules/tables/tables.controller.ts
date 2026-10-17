import { Request, Response } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { prisma } from '../../db/prisma';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { CONFIG } from '../../config';

export class TablesController {
  /**
   * Get all tables with real-time operational status, unpaid order counts and totals
   */
  static async getAllTables(req: Request, res: Response) {
    try {
      const tables = await prisma.restaurantTable.findMany({
        orderBy: { tableCode: 'asc' },
        include: {
          orders: {
            where: {
              billingStatus: 'UNPAID',
              fulfillmentStatus: { not: 'CANCELLED' },
            },
            select: {
              id: true,
              customerCode: true,
              grandTotalPaise: true,
              createdAt: true,
              fulfillmentStatus: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      const enriched = tables.map((t) => {
        const unpaidCount = t.orders.length;
        const unpaidTotalPaise = t.orders.reduce((sum, o) => sum + o.grandTotalPaise, 0);
        const latestOrderTime = t.orders.length > 0 ? t.orders[0].createdAt : null;

        // Determine derived operational status
        let derivedStatus = t.status;
        if (t.status !== 'DISABLED') {
          if (unpaidCount > 0) {
            const hasReadyOrServed = t.orders.some(
              (o) => o.fulfillmentStatus === 'READY' || o.fulfillmentStatus === 'SERVED'
            );
            derivedStatus = hasReadyOrServed ? 'BILL_PENDING' : 'ACTIVE_ORDER';
          } else {
            derivedStatus = 'AVAILABLE';
          }
        }

        return {
          id: t.id,
          tableCode: t.tableCode,
          displayName: t.displayName,
          capacity: t.capacity,
          qrActive: t.qrActive,
          status: derivedStatus,
          lastQrRegeneratedAt: t.lastQrRegeneratedAt,
          unpaidCount,
          unpaidTotalPaise,
          latestOrderTime,
          latestOrders: t.orders.slice(0, 5),
        };
      });

      return res.status(200).json(enriched);
    } catch (error) {
      console.error('Error fetching tables:', error);
      return res.status(500).json({ error: 'Failed to fetch table list.' });
    }
  }

  /**
   * Validate QR token for customer mobile landing
   */
  static async validateQrToken(req: Request, res: Response) {
    const { tableCode, token } = req.query;

    if (!tableCode || !token) {
      return res.status(400).json({ error: 'Table code and security token are required.' });
    }

    try {
      const table = await prisma.restaurantTable.findUnique({
        where: { tableCode: String(tableCode).toUpperCase() },
      });

      if (!table) {
        return res.status(404).json({ error: 'Restaurant table not found.' });
      }

      if (!table.qrActive) {
        return res.status(403).json({ error: 'This QR code is currently deactivated. Please contact counter.' });
      }

      if (table.qrToken !== token) {
        return res.status(403).json({
          error: 'Invalid, expired, or regenerated QR token. Please rescan the physical table QR code.',
        });
      }

      return res.status(200).json({
        valid: true,
        table: {
          id: table.id,
          tableCode: table.tableCode,
          displayName: table.displayName,
          capacity: table.capacity,
          status: table.status,
        },
      });
    } catch (error) {
      console.error('QR token validation error:', error);
      return res.status(500).json({ error: 'Server error validating QR token.' });
    }
  }

  /**
   * Generate downloadable high-resolution QR asset with prominent table code
   */
  static async getTableQrAsset(req: Request, res: Response) {
    const { tableCode } = req.params;

    try {
      const table = await prisma.restaurantTable.findUnique({
        where: { tableCode: tableCode.toUpperCase() },
      });

      if (!table) {
        return res.status(404).json({ error: 'Table not found.' });
      }

      const qrTargetUrl = `${CONFIG.FRONTEND_URL}/order/table/${table.tableCode}?token=${table.qrToken}`;
      
      // Generate High-Res Data URL PNG
      const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: '#16191D',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });

      // Generate SVG string for vector printing
      const qrSvg = await QRCode.toString(qrTargetUrl, {
        type: 'svg',
        margin: 2,
        color: {
          dark: '#16191D',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });

      return res.status(200).json({
        tableCode: table.tableCode,
        displayName: table.displayName,
        qrToken: table.qrToken,
        qrTargetUrl,
        qrDataUrl,
        qrSvg,
        lastRegeneratedAt: table.lastQrRegeneratedAt,
      });
    } catch (error) {
      console.error('Error generating QR asset:', error);
      return res.status(500).json({ error: 'Failed to generate QR asset.' });
    }
  }

  /**
   * Regenerate QR token for a table (Instantly revokes prior QR token)
   */
  static async regenerateQrToken(req: AuthenticatedRequest, res: Response) {
    const { tableCode } = req.params;
    const { reason } = req.body;

    try {
      const table = await prisma.restaurantTable.findUnique({
        where: { tableCode: tableCode.toUpperCase() },
      });

      if (!table) {
        return res.status(404).json({ error: 'Table not found.' });
      }

      const oldToken = table.qrToken;
      const newToken = `qr_${table.tableCode.toLowerCase()}_${crypto.randomBytes(24).toString('hex')}`;
      const now = new Date();

      // Deactivate old token in history
      await prisma.tableQrToken.updateMany({
        where: { tableId: table.id, token: oldToken },
        data: {
          isActive: false,
          revokedAt: now,
          revokedBy: req.user?.username || 'SYSTEM',
        },
      });

      // Create new token in history
      await prisma.tableQrToken.create({
        data: {
          tableId: table.id,
          token: newToken,
          isActive: true,
          generatedAt: now,
        },
      });

      // Update table
      const updatedTable = await prisma.restaurantTable.update({
        where: { id: table.id },
        data: {
          qrToken: newToken,
          lastQrRegeneratedAt: now,
        },
      });

      // Immutable Audit Log
      await AuditService.record({
        userId: req.user?.id,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'QR_TOKEN_REGENERATED',
        module: 'TABLE_QR',
        entityType: 'TABLE',
        entityId: table.id,
        tableCode: table.tableCode,
        beforeSnapshot: { tokenPrefix: oldToken.slice(0, 10) + '...' },
        afterSnapshot: { tokenPrefix: newToken.slice(0, 10) + '...' },
        reason: reason || 'Manual admin regeneration for security rotation',
        result: 'SUCCESS',
      });

      return res.status(200).json({
        message: `QR code for ${table.tableCode} successfully regenerated. Previous QR link is now invalid.`,
        table: updatedTable,
      });
    } catch (error) {
      console.error('Error regenerating QR token:', error);
      return res.status(500).json({ error: 'Failed to regenerate table QR token.' });
    }
  }

  /**
   * Toggle Table active or maintenance status
   */
  static async updateTableStatus(req: AuthenticatedRequest, res: Response) {
    const { tableCode } = req.params;
    const { status, qrActive } = req.body;

    try {
      const table = await prisma.restaurantTable.findUnique({
        where: { tableCode: tableCode.toUpperCase() },
      });

      if (!table) {
        return res.status(404).json({ error: 'Table not found.' });
      }

      const updated = await prisma.restaurantTable.update({
        where: { id: table.id },
        data: {
          status: status || table.status,
          qrActive: typeof qrActive === 'boolean' ? qrActive : table.qrActive,
        },
      });

      await AuditService.record({
        userId: req.user?.id,
        usernameSnapshot: req.user?.username,
        roleSnapshot: req.user?.role,
        actionType: 'TABLE_STATUS_UPDATED',
        module: 'TABLE_QR',
        entityId: table.id,
        tableCode: table.tableCode,
        beforeSnapshot: { status: table.status, qrActive: table.qrActive },
        afterSnapshot: { status: updated.status, qrActive: updated.qrActive },
        result: 'SUCCESS',
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating table status:', error);
      return res.status(500).json({ error: 'Failed to update table status.' });
    }
  }
}
