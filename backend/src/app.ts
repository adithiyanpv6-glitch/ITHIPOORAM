import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { CONFIG } from './config';
import authRoutes from './modules/auth/auth.routes';
import tablesRoutes from './modules/tables/tables.routes';
import menuRoutes from './modules/menu/menu.routes';
import ordersRoutes from './modules/orders/orders.routes';
import kitchenRoutes from './modules/kitchen/kitchen.routes';
import billingRoutes from './modules/billing/billing.routes';
import adminRoutes from './modules/admin/admin.routes';
import auditRoutes from './modules/audit/audit.routes';
import { getKolkataTime } from './utils/date';

export function createApp() {
  const app = express();

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Allows flexible integration with Next.js frontend
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: '*',
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      service: 'Ithi Pooram Restaurant Core Backend Engine',
      timezone: CONFIG.TIMEZONE,
      currentTimeKolkata: getKolkataTime().toISOString(),
      version: '1.0.0',
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/tables', tablesRoutes);
  app.use('/api/menu', menuRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/kitchen', kitchenRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/audit', auditRoutes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
  });

  // Centralized Error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
      error: 'An unexpected internal server error occurred.',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  });

  return app;
}
