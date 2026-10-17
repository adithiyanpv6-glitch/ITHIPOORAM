import { Router, Response } from 'express';
import { AuditService } from './audit.service';
import { authenticateToken, requireRoles, AuthenticatedRequest } from '../../middleware/auth';

const router = Router();

// Only MAIN_ADMIN can inspect security audit logs
router.get(
  '/logs',
  authenticateToken,
  requireRoles(['MAIN_ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { module, actionType, tableCode, userId, startDate, endDate, limit, offset } = req.query;

      const result = await AuditService.queryLogs({
        module: module ? String(module) : undefined,
        actionType: actionType ? String(actionType) : undefined,
        tableCode: tableCode ? String(tableCode) : undefined,
        userId: userId ? String(userId) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        limit: limit ? parseInt(String(limit), 10) : 50,
        offset: offset ? parseInt(String(offset), 10) : 0,
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error querying audit logs:', error);
      return res.status(500).json({ error: 'Failed to retrieve audit trail.' });
    }
  }
);

export default router;
