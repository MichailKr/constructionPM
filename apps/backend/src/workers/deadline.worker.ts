import { prisma } from '../lib/prisma.js';
import { getIO } from '../socket/io.js';
import { TaskStatus } from '@prisma/client';  // ← ИМПОРТ ЭНУМА!

export function startDeadlineWorker() {
  console.log('⏰ Deadline worker started (checking every 6 hours)');

  // Запускаем сразу и потом по таймеру
  checkDeadlines();
  setInterval(checkDeadlines, 6 * 60 * 60 * 1000);
}

async function checkDeadlines() {
  try {
    const now = new Date();

    // Ищем задачи, где дедлайн через 1-3 дня и статус не "Завершено"
    const tasks = await prisma.task.findMany({
      where: {
        // ← ИСПОЛЬЗУЕМ ЭНУМЫ, а не строки!
        status: {
          notIn: [TaskStatus.COMPLETED]  // ← Убрал CANCELLED (его нет в схеме!)
        },
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // +3 дня
        }
      },
      include: {
        assignee: true,
        project: true
      }
    });

    if (tasks.length > 0) {
      console.log(`🔔 Found ${tasks.length} tasks with approaching deadlines`);

      const io = getIO();

      for (const task of tasks) {
        // Отправляем уведомление исполнителю
        if (task.assignee) {
          io.to(`user:${task.assignee.id}`).emit('notification:deadline', {
            message: `Дедлайн задачи "${task.title}" приближается!`,
            taskId: task.id,
            dueDate: task.dueDate
          });
        }
      }
    }
  } catch (err) {
    console.error('❌ Deadline worker error:', err);
  }
}