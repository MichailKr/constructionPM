/**
 * Socket.io server instance
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { logger } from './logger.js';

export function setupSocketIO(httpServer: HTTPServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    // TODO: Implement authentication & event handlers

    socket.on('disconnect', () => {
      logger.info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export type { SocketServer };