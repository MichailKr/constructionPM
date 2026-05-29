import { prisma } from '../lib/prisma.js';
import { canManageProject } from './permissions.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { CreateProjectDto } from '../dtos/project.dto.js';
import { UserRole } from '@prisma/client';
import { parsePagination, PaginatedResponse } from '../utils/pagination.js';

export class ProjectService {
  async list(role: UserRole, query: any) {
    const pagination = parsePagination(query);
    const where = canManageProject(role) ? {} : { managerId: undefined }; // Упрощённо: все читают, менеджеры редактируют

    const [data, total] = await Promise.all([
      prisma.project.findMany({ ...pagination, where, include: { sites: { select: { id: true, name: true } } } }),
      prisma.project.count({ where })
    ]);

    return {
      data,
      total,
      page: pagination.skip / pagination.take + 1,
      limit: pagination.take,
      totalPages: Math.ceil(total / pagination.take)
    } as PaginatedResponse<any>;
  }

  async create(data: any, userId: string, role: UserRole) {
    if (!canManageProject(role)) throw new AppError('Доступ запрещён', 403, 'FORBIDDEN');
    return prisma.project.create({ data: { ...data, managerId: userId } });
  }

  async update(id: string, data: any, role: UserRole) {
    // Проверка прав
    //if (!canManageProject(role)) {
    //    throw new AppError('Доступ запрещён', 403, 'FORBIDDEN');
    //}

    // Преобразуем budget в BigInt если есть
    const updateData: any = { ...data };
    if (updateData.budget !== undefined) {
        updateData.budget = BigInt(updateData.budget);
    }

    return prisma.project.update({
        where: { id },
        data: updateData,
        include: { manager: { select: { id: true, name: true } } }
    });
  }

  async updateSite(projectId: string, siteId: string, data: any, role: UserRole) {
    if (!canManageProject(role)) {
        throw new AppError('Доступ запрещён', 403, 'FORBIDDEN');
    }

    return prisma.constructionSite.update({
        where: { id: siteId, projectId },
        data,
    });
  }

  async createSite(projectId: string, data: any, role: UserRole) {
    if (!canManageProject(role)) {
        throw new AppError('Доступ запрещён', 403, 'FORBIDDEN');
    }

    return prisma.constructionSite.create({
        data: { ...data, projectId },
    });
  }

  async deleteSite(projectId: string, siteId: string, role: UserRole) {
    if (!canManageProject(role)) {
        throw new AppError('Доступ запрещён', 403, 'FORBIDDEN');
    }

    return prisma.constructionSite.delete({
        where: { id: siteId, projectId },
    });
  }

  async delete(id: string, userId: string, role: UserRole) {
    if (!canManageProject(role)) throw new AppError('Доступ запрещён', 403, 'FORBIDDEN');
    // Prisma автоматически удалит связанные объекты благодаря cascade в схеме
    return prisma.project.delete({ where: { id } });
  }
}