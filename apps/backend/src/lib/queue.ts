import { Queue, Worker } from 'bullmq';
import { createClient } from 'redis';
import { notificationSvc } from '../services/notification.service.js';
import { prisma } from '../lib/prisma.js';

const connection = {
  url: process.env.REDIS_URL || 'redis://localhost:6379'
};

// 🔹 Очередь дедлайнов
export const deadlineQueue = new Queue('deadline-checks', { connection });

// 🔹 Воркер обработки
export const deadlineWorker = new Worker('deadline-checks', async job => {
  const { type, data } = job.data;

  if (type === 'check_deadlines') {
    await checkAndNotifyDeadlines();
  }
}, { connection });

// 🔹 Логика проверки
async function checkAndNotifyDeadlines() {
  const now = new Date();
  const tasks = await prisma.task.findMany({
    where: {
      status: { notIn: ['COMPLETED'] },
      dueDate: {
        gte: now,
        lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      }
    },
    include: { assignee: true, project: true }
  });

  for (const task of tasks) {
    const daysLeft = Math.ceil((task.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if ([1, 3].includes(daysLeft)) {
      await notificationSvc.notifyUser(
        task.assigneeId || task.project.managerId!,
        'deadline:approaching',
        {
          type: 'deadline_reminder',
          title: '⏰ Дедлайн приближается!',
          message: `Задача "${task.title}" — осталось ${daysLeft} дн.`,
          data: { taskId: task.id, dueDate: task.dueDate, daysLeft },
          priority: daysLeft === 1 ? 'high' : 'medium'
        }
      );
      console.log(`🔔 Deadline reminder: ${task.id} (${daysLeft} days)`);
    }
  }
}

// 🔹 Планировщик: добавляем задачу в очередь каждые 6 часов
export function scheduleDeadlineChecks() {
  // Первый запуск через 1 минуту после старта
  setTimeout(() => {
    deadlineQueue.add('check_deadlines', { type: 'check_deadlines' }, {
      repeat: { every: 6 * 60 * 60 * 1000 } // 6 часов
    });
    console.log('⏰ Deadline checks scheduled (every 6 hours)');
  }, 60_000);
}

// 🔹 Graceful shutdown
export async function closeQueue() {
  await deadlineQueue.close();
  await deadlineWorker.close();
}