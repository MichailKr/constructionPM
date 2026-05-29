import { prisma } from '../lib/prisma.js';
import { canManageProject } from './permissions.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { CreateSiteDto } from '../dtos/project.dto.js';
import { UserRole } from '@prisma/client';
import { parsePagination, PaginatedResponse } from '../utils/pagination.js';

export class SiteService {
  async listByProject(projectId: string, query: any) {
    const pagination = parsePagination(query);
    const [data, total] = await Promise.all([
      prisma.constructionSite.findMany({ ...pagination, where: { projectId } }),
      prisma.constructionSite.count({ where: { projectId } })
    ]);
    return { data, total, page: pagination.skip / pagination.take + 1, limit: pagination.take, totalPages: Math.ceil(total / pagination.take) } as PaginatedResponse<any>;
  }

  async create(projectId: string, data: any, role: UserRole) {
    if (!canManageProject(role)) throw new AppError('Доступ запрещён', 403, 'FORBIDDEN');
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new AppError('Проект не найден', 404, 'NOT_FOUND');
    return prisma.constructionSite.create({ data: { ...data, projectId } });
  }

  async delete(id: string, role: UserRole) {
    if (!canManageProject(role)) throw new AppError('Доступ запрещён', 403, 'FORBIDDEN');
    return prisma.constructionSite.delete({ where: { id } });
  }
}