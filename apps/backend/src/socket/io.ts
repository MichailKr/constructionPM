// ⚠️ ПЕРВАЯ СТРОКА - ОБЯЗАТЕЛЬНО грузим .env
import 'dotenv/config';

import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';  // ← Default export!

console.log('🔐 socket/io.ts loaded');
console.log('   JWT_SECRET length:', process.env.JWT_SECRET?.length || 'UNDEFINED');
console.log('   REDIS_URL:', process.env.REDIS_URL || 'not set');

let io: Server;

// 🔹 ioredis клиент (подключается автоматически!)
const pubClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const subClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// 🔹 Обработчики ошибок
pubClient.on('error', (err) => console.warn('⚠️ Redis pub error:', err.message));
subClient.on('error', (err) => console.warn('⚠️ Redis sub error:', err.message));

export function initSocket(httpServer: any) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      credentials: true
    },
    adapter: createAdapter(pubClient, subClient),
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token ||
                    socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        console.log('❌ Socket auth: no token provided');
        return next(new Error('Authentication error'));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('❌ CRITICAL: JWT_SECRET is undefined');
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, secret) as any;
      console.log('🔍 Token payload keys:', Object.keys(decoded).join(', '));

      const userId = decoded.sub || decoded.userId || decoded.id || decoded.email;

      if (!userId) {
        console.error('❌ No user identifier in token');
        return next(new Error('Invalid token payload'));
      }

      const whereClause: any = userId.includes('@')
        ? { email: userId }
        : { id: userId };

      const user = await prisma.user.findUnique({
        where: whereClause,
        select: { id: true, email: true, role: true, name: true }
      });

      if (!user) {
        console.log('❌ User not found in DB:', userId);
        return next(new Error('User not found'));
      }

      (socket as any).user = {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      };

      console.log(`✅ Socket auth OK: ${user.email} (${user.role})`);
      next();

    } catch (err: any) {
      console.error('❌ JWT verify failed:', err.name, '-', err.message);

      if (err.name === 'TokenExpiredError') {
        return next(new Error('Token expired'));
      }
      if (err.name === 'JsonWebTokenError') {
        return next(new Error('Invalid token format'));
      }

      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`🟢 User connected: ${user.name}`);

    socket.join(`user:${user.id}`);

    socket.on('subscribe:project', async (projectId: string, ack?: (err?: string) => void) => {
      try {
        socket.join(`project:${projectId}`);
        socket.join(`project:${projectId}:tasks`);
        console.log(`📥 ${user.name} subscribed to project ${projectId}`);
        ack?.();
      } catch (e) {
        ack?.('Subscription failed');
      }
    });

    socket.on('subscribe:task', async (taskId: string, ack?: (err?: string) => void) => {
      try {
        socket.join(`task:${taskId}`);
        ack?.();
      } catch (e) {
        ack?.('Subscription failed');
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔴 User disconnected: ${user.name}`);
    });
  });

  console.log('✅ Socket.io server initialized');
  return io;
}

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};