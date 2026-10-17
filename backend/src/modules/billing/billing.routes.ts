import { Router } from 'express';
import { BillingController } from './billing.controller';
import { authenticateToken, requireRoles } from '../../middleware/auth';

const router = Router();

// Restricted to CASHIER, MANAGER, MAIN_ADMIN
router.use(authenticateToken, requireRoles(['CASHIER', 'MANAGER', 'MAIN_ADMIN']));

// Table unpaid orders lookup (latest 3 to 5)
router.get('/tables/:tableCode/unpaid', BillingController.getUnpaidOrdersForTable);

// Bill preview
router.get('/orders/:orderId/preview', BillingController.getBillPreview);

// Confirm payment (Cashier PIN required)
router.post('/orders/:orderId/confirm-payment', BillingController.confirmPayment);

// Reprint invoice (Cashier PIN + Reason required)
router.post('/invoices/:invoiceId/reprint', BillingController.reprintInvoice);

// Apply Manager discount
router.post(
  '/orders/:orderId/discount',
  requireRoles(['MANAGER', 'MAIN_ADMIN']),
  BillingController.applyDiscount
);

// Process Refund (Restricted to MAIN_ADMIN / MANAGER)
router.post(
  '/invoices/:invoiceId/refund',
  requireRoles(['MAIN_ADMIN', 'MANAGER']),
  BillingController.processRefund
);

export default router;
