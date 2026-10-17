import { Router } from 'express';
import { TablesController } from './tables.controller';
import { authenticateToken, requireRoles } from '../../middleware/auth';

const router = Router();

// Public: QR token verification for customer mobile app
router.get('/validate-token', TablesController.validateQrToken);

// Protected: Staff views
router.get('/', authenticateToken, TablesController.getAllTables);
router.get('/:tableCode/qr', authenticateToken, TablesController.getTableQrAsset);

// Restricted to MAIN_ADMIN / MANAGER: Regenerate QR / Table status
router.post(
  '/:tableCode/regenerate-qr',
  authenticateToken,
  requireRoles(['MAIN_ADMIN', 'MANAGER']),
  TablesController.regenerateQrToken
);
router.patch(
  '/:tableCode/status',
  authenticateToken,
  requireRoles(['MAIN_ADMIN', 'MANAGER']),
  TablesController.updateTableStatus
);

export default router;
