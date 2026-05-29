import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { UserRole } from '@prisma/client';

export class TeamService {
  async list(projectId?: string) {
    const where = projectId ? { projectId } : {};
    return prisma.team.findMany({
      where,
      include: { leader: { select: { id: true, name: true } }, members: { select: { id: true, position: true } } }
    });
  }

  async create(data: any, userId: string) {
    return prisma.team.create({
      data: { ...data, leaderId: userId },
      include: { leader: { select: { name: true } } }
    });
  }

  async addEmployee(teamId: string, employeeId: string) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new AppError('Сотрудник не найден', 404, 'NOT_FOUND');
    if (emp.teamId && emp.teamId !== teamId) {
      throw new AppError('Сотрудник уже в другой бригаде', 409, 'CONFLICT');
    }
    return prisma.employee.update({ where: { id: employeeId }, data: { teamId } });
  }

  async removeEmployee(employeeId: string) {
    return prisma.employee.update({ where: { id: employeeId }, data: { teamId: null } });
  }

  async delete(id: string) {
    // Освобождаем сотрудников перед удалением бригады
    await prisma.employee.updateMany({ where: { teamId: id }, data: { teamId: null } });
    return prisma.team.delete({ where: { id } });
  }
}