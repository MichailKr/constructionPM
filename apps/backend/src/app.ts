/**
 * Express application factory
 * Separates app creation from server startup for testing
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { apiRouter } from './routes/api.router.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './lib/logger.js';

export function createApp() {
  const app = express();

  // 🔐 Security middleware
  app.use(helmet());

  // 🌐 CORS
  app.use(cors({
    origin: env.CORS_ORIGIN.split(','),
    credentials: true,
  }));

  // 📦 Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 📝 Request logging (dev only)
  if (env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      logger.http(`📥 ${req.method} ${req.path}`);
      next();
    });
  }

  // Middleware для сериализации BigInt
  app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        return originalJson.call(this, JSON.parse(JSON.stringify(data, (key, value) =>
          typeof value === 'bigint' ? Number(value) : value
        )));
    };
    next();
   });

  // 🛣️ Routes
  app.use(apiRouter);

  // 404 handler for all unmatched routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
        error: 'Route not found',
        code: 'NOT_FOUND',
        path: _req.path,
    });
  });

  // 🚨 Global error handler (must be last)
  app.use(errorHandler);

  return app;
}