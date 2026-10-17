import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticateToken, requireRoles } from '../../middleware/auth';

const router = Router();

// Executive KPIs and Analytics (MANAGER & MAIN_ADMIN)
router.get('/overview', authenticateToken, requireRoles(['MAIN_ADMIN', 'MANAGER']), AdminController.getOverview);
router.get('/reports/export-csv', authenticateToken, requireRoles(['MAIN_ADMIN', 'MANAGER']), AdminController.exportReportCsv);
router.get('/settings', authenticateToken, AdminController.getSettings);

// Staff and Configuration Management (MAIN_ADMIN / OWNER only)
router.get('/users', authenticateToken, requireRoles(['MAIN_ADMIN']), AdminController.getUsers);
router.post('/users', authenticateToken, requireRoles(['MAIN_ADMIN']), AdminController.createUser);
router.patch('/users/:userId', authenticateToken, requireRoles(['MAIN_ADMIN']), AdminController.updateUser);
router.patch('/settings', authenticateToken, requireRoles(['MAIN_ADMIN']), AdminController.updateSettings);

export default router;
