// ⚠️ MUST BE FIRST: Load environment variables
import 'dotenv/config';

import { createServer } from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { initSocket } from './socket/io.js';  // ← Используем НОВЫЙ сокет
import { logger } from './lib/logger.js';
import { prisma, disconnectPrisma } from './lib/prisma.js';
import { startDeadlineWorker } from './workers/deadline.worker.js';
import { APP_VERSION } from '@constructionpm/shared';
import { scheduleDeadlineChecks, closeQueue } from './lib/queue.js';

async function startServer() {
  try {
    logger.info('🔹 Starting server initialization...');

    const app = createApp();

    // ✅ ОДИН раз создаём HTTP сервер
    const httpServer = createServer(app);
    logger.info('🔹 HTTP server created');

    // ✅ Инициализируем НОВЫЕ сокеты (с авторизацией и комнатами)
    initSocket(httpServer);
    logger.info('🔹 Socket.io initialized with auth & rooms');

    scheduleDeadlineChecks();
    logger.info('🔹 BullMQ deadline scheduler started');

    // ✅ Запускаем воркер дедлайнов
    startDeadlineWorker();
    logger.info('🔹 Deadline worker started');

    // Start HTTP server
    const listenHost = env.HOST || '0.0.0.0';

    httpServer.listen(env.PORT, listenHost, () => {
      logger.info('🔹 Listen callback executed');

      const addr = httpServer.address();
      const port = typeof addr === 'string' ? addr : addr?.port;

      logger.info(`🚀 Server is running`, {
        url: `http://localhost:${port}`,
        environment: env.NODE_ENV,
        version: APP_VERSION,
      });

      console.log(`\n✅ Server ready!`);
      console.log(`🌐 http://localhost:${port}`);
      console.log(`🩺 Health: http://localhost:${port}/health\n`);
      console.log(`🔌 Socket.io: ws://localhost:${port}\n`);
    });

    // Обработка ошибок сервера
    httpServer.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${env.PORT} is already in use`);
      } else {
        logger.error('❌ HTTP server error:', err);
      }
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`👋 Received ${signal}, shutting down...`);

      httpServer.close(async () => {
        logger.info('🔌 HTTP server closed');
        await closeQueue();
        await disconnectPrisma();
        logger.info('✅ Shutdown complete');
        process.exit(0);
      });

      // Force exit after 10s
      setTimeout(() => {
        logger.error('💥 Force shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    logger.info('🔹 Event handlers registered, server starting...');

  } catch (error) {
    logger.error('💥 Fatal error during startup:', error);
    process.exit(1);
  }
}

// 🚀 ЗАПУСКАЕМ
startServer();

export { startServer };