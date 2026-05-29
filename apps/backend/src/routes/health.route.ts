/**
 * Health check route
 */

import { Router } from 'express';
import { checkDatabase } from '../lib/prisma.js';
import { APP_VERSION } from '@constructionpm/shared';

export const healthRouter = Router();

healthRouter.get('/health', async (req, res) => {
  const dbOk = await checkDatabase();

  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'healthy' : 'degraded',
    service: 'ConstructionPM API',
    version: APP_VERSION,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbOk ? 'connected' : 'disconnected',
  });
});

healthRouter.get('/', (req, res) => {
  res.json({
    service: 'ConstructionPM API',
    version: APP_VERSION,
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});