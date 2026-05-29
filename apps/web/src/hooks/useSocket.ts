import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface SocketEvents {
  'task:updated': (data: { taskId: string; newStatus: string }) => void;
  'task:status_changed': (data: { message: string; taskId: string }) => void;
  'team:assigned': (data: { teamName: string }) => void;
  'equipment:requested': (data: { equipmentName: string }) => void;
  'deadline:approaching': (data: { daysLeft: number; taskTitle: string }) => void;
}

export function useSocket(projectId?: string) {
  const { token } = useAuth();
  const socketRef = useRef<Socket>();

  useEffect(() => {
    if (!token) return;

    socketRef.current = io('/', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected');
      if (projectId) {
        socketRef.current?.emit('subscribe:project', projectId);
      }
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('❌ Socket error:', err.message);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token, projectId]);

  const on = <K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) => {
    socketRef.current?.on(event, callback as any);
    return () => socketRef.current?.off(event, callback as any);
  };

  return { on, socket: socketRef.current };
}