/**
 * ConstructionPM Backend API
 * Main entry point - Express + Prisma
 */

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { APP_VERSION } from '@constructionpm/shared';

// Config
const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL;

// Init
const app = express();
const prisma = new PrismaClient();

console.log('🏗️  ConstructionPM Backend API');
console.log(`📦 Version: ${APP_VERSION}`);
console.log(`🔌 Server starting on port ${PORT}...`);

// Проверка конфигурации
if (DATABASE_URL) {
  console.log('✅ Database URL configured');
} else {
  console.warn('⚠️  DATABASE_URL not set');
}

if (REDIS_URL) {
  console.log('✅ Redis URL configured');
} else {
  console.warn('⚠️  REDIS_URL not set');
}

// Middleware
app.use(cors());
app.use(express.json());

// 🟢 Health Check (root)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'ConstructionPM API',
    version: APP_VERSION,
    timestamp: new Date().toISOString()
  });
});

// 🟢 Health Check (explicit)
app.get('/health', async (req, res) => {
  try {
    // Проверка подключения к БД
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      database: 'connected',
      version: APP_VERSION,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

// 👥 Get all users (тестовый эндпоинт)
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('❌ Failed to fetch users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// 📊 Get project stats (ещё один тест)
app.get('/projects/stats', async (req, res) => {
  try {
    const [total, active, completed] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.project.count({ where: { status: 'COMPLETED' } })
    ]);

    res.json({
      success: true,
      data: { total, active, completed }
    });
  } catch (error) {
    console.error('❌ Failed to fetch project stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch project stats'
    });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📝 API Docs: http://localhost:${PORT}/`);
  console.log(`🩺 Health: http://localhost:${PORT}/health`);
  console.log(`👥 Users: http://localhost:${PORT}/users`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('👋 Interrupt received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});