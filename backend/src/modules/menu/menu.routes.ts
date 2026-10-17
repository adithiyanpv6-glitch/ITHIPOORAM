import { Router } from 'express';
import { MenuController } from './menu.controller';
import { authenticateToken, requireRoles } from '../../middleware/auth';

const router = Router();

// Public: Customer mobile menu
router.get('/today', MenuController.getTodayMenu);

// Protected: Staff view
router.get('/staff', authenticateToken, MenuController.getStaffMenu);

// Protected: Toggle availability (MENU_EDITOR, MANAGER, MAIN_ADMIN)
router.patch(
  '/items/:itemId/availability',
  authenticateToken,
  requireRoles(['MAIN_ADMIN', 'MANAGER', 'MENU_EDITOR']),
  MenuController.updateAvailability
);

// Protected: Update price (Restricted to MAIN_ADMIN and authorized MANAGER)
router.patch(
  '/items/:itemId/price',
  authenticateToken,
  requireRoles(['MAIN_ADMIN', 'MANAGER']),
  MenuController.updatePrice
);

export default router;
