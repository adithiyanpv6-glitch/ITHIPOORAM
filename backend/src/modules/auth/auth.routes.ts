import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticateToken } from '../../middleware/auth';
import { loginLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/login', loginLimiter, AuthController.login);
router.post('/logout', authenticateToken, AuthController.logout);
router.post('/verify-pin', authenticateToken, AuthController.verifyPin);
router.get('/me', authenticateToken, AuthController.me);

export default router;
