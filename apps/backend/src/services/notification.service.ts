import { getIO } from '../socket/io.js';
import { prisma } from '../lib/prisma.js';
import { TaskStatus, NotificationType } from '@prisma/client';

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

export class NotificationService {
  // 🔔 Отправка в комнату проекта (БЕЗ сохранения в БД)
  async notifyProject(projectId: string, event: string, payload: NotificationPayload) {
    const io = getIO();

    console.log(`📤 Project ${projectId}: ${event}`);

    // Отправляем через сокет
    io.to(`project:${projectId}`).emit(event, {
      ...payload,
      timestamp: new Date().toISOString()
    });
  }

  // 🔔 Персональное уведомление (С сохранением в БД!)
  async notifyUser(userId: string, event: string, payload: NotificationPayload) {
    const io = getIO();

    // Маппинг event → NotificationType
    const typeMap: Record<string, NotificationType> = {
      'task:status_changed': NotificationType.TASK_UPDATED,
      'equipment:requested': NotificationType.SYSTEM,
      'deadline:approaching': NotificationType.DEADLINE_APPROACHING,
      'notification:deadline': NotificationType.DEADLINE_APPROACHING
    };

    const notificationType = typeMap[event] || NotificationType.SYSTEM;

    // Сохраняем в БД с ПРАВИЛЬНЫМИ полями
    await prisma.notification.create({
      data: {
        userId,
        type: notificationType,
        title: payload.title,
        message: payload.message,
        isRead: false,
        relatedEntity: payload.data || null
      }
    }).catch(err => console.warn('⚠️ Failed to save notification:', err.message));

    // Отправляем через сокет
    io.to(`user:${userId}`).emit(event, {
      ...payload,
      timestamp: new Date().toISOString()
    });
  }

  // 🔔 Уведомление о смене статуса задачи
  async notifyTaskStatusChange(taskId: string, newStatus: TaskStatus, changedBy: string, reason?: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { id: true, name: true, managerId: true } },
        team: { select: { leaderId: true } },
        assignee: { select: { id: true, name: true } }
      }
    });

    if (!task) return;

    const recipients = new Set<string>();

    if (task.project.managerId) recipients.add(task.project.managerId);
    if (task.team?.leaderId) recipients.add(task.team.leaderId);
    if (task.assigneeId && task.assigneeId !== changedBy) {
      recipients.add(task.assigneeId);
    }

    recipients.delete(changedBy);

    const notification: NotificationPayload = {
      type: 'status_change',
      title: `Статус задачи изменён`,
      message: `"${task.title}" → ${newStatus}${reason ? `: ${reason}` : ''}`,
      data: { taskId, newStatus, projectName: task.project.name },
      priority: newStatus === 'OVERDUE' ? 'high' : 'medium'
    };

    for (const userId of recipients) {
      await this.notifyUser(userId, 'task:status_changed', notification);
    }

    await this.notifyProject(task.project.id, 'task:updated', {
      type: 'task_update',
      title: 'Задача обновлена',
      message: `Статус: ${newStatus}`,
      data: { taskId, newStatus }
    });
  }

  // 🔔 Назначение бригады
  async notifyTeamAssigned(taskId: string, teamId: string, assignedBy: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { id: true, name: true } }, team: { select: { name: true } } }
    });

    if (!task) return;

    await this.notifyProject(task.project.id, 'team:assigned', {
      type: 'team_assignment',
      title: 'Бригада назначена',
      message: `Бригада "${task.team?.name}" назначена на задачу "${task.title}"`,
      data: { taskId, teamId, teamName: task.team?.name }
    });
  }

  // 🔔 Запрос оборудования
  async notifyEquipmentRequested(equipmentId: string, taskId: string, requestedBy: string, notes?: string) {
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: { project: { select: { id: true, name: true, managerId: true } } }
    });

    if (!equipment?.project?.managerId) return;

    await this.notifyUser(equipment.project.managerId, 'equipment:requested', {
      type: 'equipment_request',
      title: 'Запрошено оборудование',
      message: `Оборудование "${equipment.name}" запрошено для задачи`,
      data: { equipmentId, taskId, notes },
      priority: 'high'
    });
  }
}

export const notificationSvc = new NotificationService();