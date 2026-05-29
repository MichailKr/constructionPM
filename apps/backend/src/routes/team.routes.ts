import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { TeamService } from '../services/team.service.js';
import { AuthenticatedRequest } from '../types/auth.types.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
const teamSvc = new TeamService();

// 📋 GET /api/teams
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const data = await teamSvc.list(req.query.projectId as string);
    res.json({ success: true, data, total: data.length });
  } catch (err) { next(err); }
});

// ➕ POST /api/teams
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = await teamSvc.create(req.body, user.id);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

// 🔹 GET /api/teams/available-employees
router.get('/available-employees', requireAuth, async (req, res, next) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { teamId: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // 🔹 Форматируем ответ: берём имя из user
    const formatted = employees.map((emp: any) => ({
      id: emp.id,
      name: emp.user?.name || `Сотрудник #${emp.tabNumber || emp.id.slice(0, 4)}`,
      position: emp.department || 'Не указана',
      email: emp.user?.email || ''
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// 🔹 PUT /api/teams/:id/members
router.put('/:id/members', requireAuth, async (req, res, next) => {
  try {
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds)) {
      return res.status(400).json({ error: 'memberIds должен быть массивом ID сотрудников' });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: req.params.id },
      data: {
        members: {
          set: memberIds.map((id: string) => ({ id }))
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // 🔹 Форматируем участников для фронтенда
    const formattedMembers = updatedTeam.members.map((m: any) => ({
      id: m.id,
      name: m.user?.name || `Сотрудник #${m.tabNumber || m.id.slice(0, 4)}`,
      position: m.department || 'Не указана',
      email: m.user?.email || ''
    }));

    res.json({
      success: true,
      data: {
        ...updatedTeam,
        members: formattedMembers
      }
    });
  } catch (err) {
    console.error('Error updating team members:', err);
    next(err);
  }
});

// ️🗑️ DELETE /api/teams/:id (исправлено: был POST, стал DELETE)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    // Сначала очищаем связи
    await prisma.team.update({
      where: { id: req.params.id },
      data: { members: { set: [] } }
    });

    // Затем удаляем бригаду
    await prisma.team.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true, message: 'Бригада удалена' });
  } catch (err) {
    console.error('Error deleting team:', err);
    next(err);
  }
});

export const teamRouter = router;