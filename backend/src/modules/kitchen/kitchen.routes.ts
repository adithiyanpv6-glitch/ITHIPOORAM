import { Router } from 'express';
import { KitchenController } from './kitchen.controller';
import { authenticateToken, requireRoles } from '../../middleware/auth';

const router = Router();

// Restricted to KITCHEN_STAFF, MANAGER, MAIN_ADMIN
router.use(authenticateToken, requireRoles(['KITCHEN_STAFF', 'MANAGER', 'MAIN_ADMIN']));

router.get('/active', KitchenController.getActiveOrders);
router.get('/stations', KitchenController.getStations);
router.patch('/orders/:orderId/status', KitchenController.updateOrderStatus);

export default router;
