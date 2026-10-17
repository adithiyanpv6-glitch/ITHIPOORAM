import { Router } from 'express';
import { OrdersController } from './orders.controller';
import { orderLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Public: Customer creates order with validated QR token
router.post('/', orderLimiter, OrdersController.createOrder);

// Public: Customer checks orders for their table session
router.get('/table/:tableCode', OrdersController.getOrdersByTable);

// Public: Customer checks single order status
router.get('/:orderId', OrdersController.getOrderById);

export default router;
