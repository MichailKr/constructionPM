import { prisma } from '../lib/prisma.js';
import { canManageProject, getTaskVisibilityFilter } from './permissions.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { CreateTaskDto, UpdateTaskStatusDto } from '../dtos/project.dto.js';
import { UserRole } from '@prisma/client';
import { parsePagination, PaginatedResponse } from '../utils/pagination.js';
import { notificationSvc } from './notification.service.js';

export class TaskService {
  async list(userId: string, role: UserRole, query: any) {
    const pagination = parsePagination(query);
    const visibilityFilter = await getTaskVisibilityFilter(userId, role, prisma);

    // Дополнительные фильтры
    const where: any = { ...visibilityFilter };
    if (query.siteId) where.siteId = query.siteId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.startDate) where.startDate = { gte: new Date(query.startDate) };
    if (query.endDate) where.dueDate = { lte: new Date(query.endDate) };

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        ...pagination,
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          constructionSite: { select: { id: true, name: true } },
          workType: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          equipment: {
            select: {
            id: true,
            equipment: { select: { id: true, name: true } }
            }
          }
        }
      }),
      prisma.task.count({ where })
    ]);

    return {
      data,
      total,
      page: Math.floor(pagination.skip / pagination.take) + 1,
      limit: pagination.take,
      totalPages: Math.ceil(total / pagination.take)
    } as PaginatedResponse<any>;
  }

  async create(data: any, role: UserRole) {
    // 🔹 ЛОГИРОВАНИЕ: что пришло
    console.log('🔍 [TaskService.create] Входные данные:', {
      title: data.title,
      projectId: data.projectId,
      constructionSiteId: data.constructionSiteId,
      type_projectId: typeof data.projectId,
    });

    // 🔹 ПРОВЕРКА 1: Существует ли проект?
    if (!data.projectId) {
      throw new AppError('projectId обязателен', 400, 'BAD_REQUEST');
    }

    const project = await prisma.project.findUnique({
      where: { id: data.projectId }
    });

    console.log('🔍 [TaskService.create] Проект найден:', project ? `✅ ${project.name}` : '❌ НЕТ');

    if (!project) {
      // Попробуем вывести все проекты для отладки
      const allProjects = await prisma.project.findMany({ select: { id: true, name: true } });
      console.log('📋 [TaskService.create] Все проекты в БД:', allProjects);

      throw new AppError(`Проект с ID "${data.projectId}" не найден в базе`, 404, 'NOT_FOUND');
    }

    // 🔹 ПРОВЕРКА 2: Существует ли объект строительства (если передан)
    if (data.constructionSiteId) {
      const site = await prisma.constructionSite.findUnique({
        where: { id: data.constructionSiteId }
      });
      console.log('🔍 [TaskService.create] Объект найден:', site ? `✅ ${site.name}` : '❌ НЕТ');

      if (!site) {
        throw new AppError('Объект строительства не найден', 404, 'NOT_FOUND');
      }
    }

    // 🔹 Формируем данные явно, поле по полю
    const taskData: any = {
      title: String(data.title),
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      progress: data.progress || 0,

      // Даты
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,

      // 🔥 Foreign Keys — только ID, строкой!
      projectId: String(data.projectId),
      constructionSiteId: data.constructionSiteId ? String(data.constructionSiteId) : null,

      // Опциональные связи
      workTypeId: data.workTypeId || null,
      assigneeId: data.assigneeId || null,
      teamId: data.teamId || null,
      parentId: data.parentId || null,

      // Локация
      locationZone: data.locationZone || null,
      locationFloor: data.locationFloor || null,
      locationRoom: data.locationRoom || null,
    };

    console.log('📤 [TaskService.create] Отправляем в Prisma:', {
      projectId: taskData.projectId,
      constructionSiteId: taskData.constructionSiteId,
    });

    // 🔹 Создаём задачу
    try {
      const task = await prisma.task.create({
        data: taskData,
      });
      console.log('✅ [TaskService.create] Задача создана:', task.id);
      return task;
    } catch (error: any) {
      console.error('❌ [TaskService.create] Ошибка Prisma:', {
        code: error.code,
        message: error.message,
        meta: error.meta,
      });
      throw error;
    }
  }

  async updateStatus(id: string, data: any, userId: string, role: UserRole) {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new AppError('Задача не найдена', 404, 'NOT_FOUND');
    }

    // Проверка прав на обновление статуса
    const visibility = await getTaskVisibilityFilter(userId, role, prisma);
    const canAccess = await prisma.task.findFirst({
      where: { id, ...visibility }
    });

    if (!canAccess && !['ADMIN', 'MANAGER'].includes(role)) {
      throw new AppError('Нет прав на изменение задачи', 403, 'FORBIDDEN');
    }

    // Создаём лог изменения статуса
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: data.status,
        statusLogs: {
          create: {
            changedBy: userId,
            fromStatus: task.status,
            toStatus: data.status,
            reason: data.comment
          }
        }
      },
      include: {
        statusLogs: {
          include: { changedByUser: { select: { name: true, email: true } } }
        }
      }
    });

    await notificationSvc.notifyTaskStatusChange(id, data.status, userId, data.comment);
    return updatedTask;
  }
}