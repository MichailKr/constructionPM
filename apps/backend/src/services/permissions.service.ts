import { UserRole } from '@prisma/client';

export function canManageProject(role: UserRole | string): boolean {
  const r = String(role).toUpperCase();  // Гарантируем строку в верхнем регистре
  return r === 'ADMIN' || r === 'MANAGER';
}

export function getTaskVisibilityFilter(userId: string, role: UserRole, prisma: any) {
  // ADMIN/MANAGER: видят всё
  if (['ADMIN', 'MANAGER'].includes(role)) return {};

  // FOREMAN: видит задачи своих бригад
  if (role === 'FOREMAN') {
    return prisma.team.findMany({
      where: { leaderId: userId },
      select: { id: true }
    }).then(teams => ({
      assignee: { teamId: { in: teams.map((t: any) => t.id) } }
    }));
  }

  // EMPLOYEE: видит только свои задачи
  return { assigneeId: userId };
}