import toast from 'react-hot-toast';

export const notify = {
  success: (msg: string) => toast.success(msg, { duration: 4000 }),
  error: (msg: string) => toast.error(msg, { duration: 6000 }),
  info: (msg: string) => toast(msg, { duration: 4000 }),

  // 🔹 Специальные уведомления из сокетов
  taskUpdated: (data: { message: string }) => {
    toast.info(`📋 ${data.message}`, { duration: 5000 });
  },
  deadlineApproaching: (data: { taskTitle: string; daysLeft: number }) => {
    toast.error(`⏰ "${data.taskTitle}" — дедлайн через ${data.daysLeft} дн.!`, { duration: 8000 });
  },
};