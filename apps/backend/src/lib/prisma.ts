/**
 * Prisma Client singleton with graceful shutdown
 */

import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handler
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('🔌 Prisma disconnected');
  } catch (error) {
    logger.error('❌ Prisma disconnect error:', error);
  }
}

// Health check for DB
export async function checkDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}