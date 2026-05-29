import { Router } from 'express';
import { TaskService } from '../services/task.service.js';
import { TeamService } from '../services/team.service.js';
import { EquipmentService } from '../services/equipment.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { AppError } from '../middleware/errorHandler.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { CreateTaskDto, UpdateTaskStatusDto } from '../dtos/project.dto.js';
import { prisma } from '../lib/prisma.js';
import { TaskStatus } from '@prisma/client';

const router = Router();
const taskSvc = new TaskService();
const teamSvc = new TeamService();
const equipSvc = new EquipmentService();

// 🔹 GET /api/tasks/my — СПЕЦИАЛЬНО ДЛЯ РАБОТНИКА
// Возвращает задачи, где работник — исполнитель, ИЛИ задачи его бригады
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;

    // 1. Находим сотрудника в базе по userId
    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      select: { teamId: true }
    });

    // 2. Формируем условия поиска (OR: личные задачи ИЛИ задачи бригады)
    const whereClause: any = {
      OR: [
        { assigneeId: user.id } // Задачи, где я исполнитель
      ]
    };

    // Если работник состоит в бригаде, добавляем задачи этой бригады
    if (employee && employee.teamId) {
      whereClause.OR.push({ teamId: employee.teamId });
    }

    // 3. Загружаем задачи
    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          include: {
            user: { select: { id: true, name: true } }
          }
        },
        team: {
          select: { id: true, name: true }
        },
        project: { select: { id: true, name: true } },
        constructionSite: { select: { id: true, name: true } }
      },
      orderBy: { dueDate: 'asc' } // Сначала те, где дедлайн ближе
    });

    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error('Error fetching worker tasks:', err);
    next(err);
  }
});

// 📋 GET /api/tasks - Общий список (для админов)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const result = await taskSvc.list(user.id, user.role, req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// ➕ POST /api/tasks - Создать задачу
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = CreateTaskDto.parse(req.body);
    const result = await taskSvc.create(data, user.id, user.role);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

// 🔍 GET /api/tasks/:id - Получить задачу по ID
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        constructionSite: { select: { id: true, name: true, address: true } },
        workType: true,
        team: { select: { id: true, name: true } },
        statusLogs: {
          orderBy: { createdAt: 'desc' },
          include: { changedByUser: { select: { name: true } } }
        }
      }
    });
    if (!task) throw new AppError('Задача не найдена', 404, 'NOT_FOUND');
    res.json({ success: true, data: task });
  } catch (err) { next(err); }
});

// ✏️ PUT /api/tasks/:id/status - Обновить статус
router.put('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = UpdateTaskStatusDto.parse(req.body);
    const result = await taskSvc.updateStatus(req.params.id, data, user.id, user.role);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ✏️ PUT /api/tasks/:id - Обновить задачу (поля, даты)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { canManageProject } = await import('../services/permissions.service.js');

    // Разрешаем обновлять даты даже менеджерам, но для полных прав нужна проверка
    // Если нужно разрешить работникам менять даты СВОИХ задач, логику можно упростить
    // Но пока оставим как есть:
    // if (!canManageProject(user.role)) { throw new AppError(...) }

    // Преобразуем даты
    const updateData: any = { ...req.body };
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true } },
        constructionSite: { select: { id: true, name: true } }
      }
    });

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
});

// 🗑️ DELETE /api/tasks/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { canManageProject } = await import('../services/permissions.service.js');

    if (!canManageProject(user.role)) {
      throw new AppError('Доступ запрещён', 403, 'FORBIDDEN');
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Задача удалена' });
  } catch (err) { next(err); }
});

// 👥 POST /api/tasks/:id/assign-team — Закрепление бригады
router.post('/:id/assign-team', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { teamId } = req.body;

    if (!teamId) throw new AppError('Укажите teamId', 400, 'BAD_REQUEST');

    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      select: { startDate: true, dueDate: true, status: true }
    });

    if (!task) throw new AppError('Задача не найдена', 404, 'NOT_FOUND');
    if (!task.startDate || !task.dueDate) {
      throw new AppError('У задачи должны быть заполнены startDate и dueDate', 400, 'BAD_REQUEST');
    }

    // Проверка пересечений
    const overlap = await prisma.task.findFirst({
        where: {
          teamId,
          id: { not: req.params.id },
          status: { notIn: ['COMPLETED'] },
          startDate: { lte: task.dueDate! },
          dueDate: { gte: task.startDate! }
        }
    });
    if (overlap) {
      throw new AppError('Бригада уже занята в этот период', 409, 'CONFLICT');
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { teamId },
      include: { team: { select: { id: true, name: true } } }
    });

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// 🚜 POST /api/tasks/:id/request-equipment — Запрос оборудования
router.post('/:id/request-equipment', requireAuth, async (req, res, next) => {
  try {
    const { equipmentId, notes } = req.body;

    if (!equipmentId) throw new AppError('Укажите equipmentId', 400, 'BAD_REQUEST');

    const result = await equipSvc.requestForTask(equipmentId, req.params.id, notes);
    res.status(201).json(result);
  } catch (err) { next(err); }
});

// 🔄 POST /api/tasks/equipment/return/:taskEquipmentId — Возврат
router.post('/equipment/return/:taskEquipmentId', requireAuth, async (req, res, next) => {
  try {
    const result = await equipSvc.returnFromTask(req.params.taskEquipmentId);
    res.json(result);
  } catch (err) { next(err); }
});

export const taskRouter = router;