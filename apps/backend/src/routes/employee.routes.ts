import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

const router = Router();

// 📋 GET /api/employees - Список сотрудников
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        team: { select: { id: true, name: true } }
      },
      orderBy: { tabNumber: 'asc' }
    });
    res.json({ success: true, data: employees, total: employees.length });
  } catch (err) { next(err); }
});


// ➕ POST /api/employees - Создать сотрудника
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;  // ← Берём из токена!
    const { tabNumber, position, department, hireDate, status, hourlyRate, skills, certifications, emergencyContact, teamId } = req.body;

    // Если userId не передан — используем текущего пользователя
    const userIdToUse = req.body.userId || user.id;

    // Проверка существования пользователя
    const userExists = await prisma.user.findUnique({ where: { id: userIdToUse } });
    if (!userExists) {
      throw new AppError('Пользователь не найден', 404, 'NOT_FOUND');
    }

    // Проверка уникальности табельного номера
    const existing = await prisma.employee.findUnique({ where: { tabNumber } });
    if (existing) {
      throw new AppError('Сотрудник с таким табельным номером уже существует', 409, 'CONFLICT');
    }

    const employee = await prisma.employee.create({
      data: {
        tabNumber,
        position,
        department,
        hireDate: new Date(hireDate),
        status: status || 'ACTIVE',
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        skills: skills || [],
        certifications: certifications || [],
        emergencyContact,
        userId: userIdToUse,  // ← Гарантированно не null
        teamId
      },
      include: {
        user: { select: { name: true, email: true } },
        team: { select: { name: true } }
      }
    });

    res.status(201).json({ success: true, data: employee });
  } catch (err) { next(err); }
});

// 🔍 GET /api/employees/:id - Получить сотрудника
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true } },
        equipment: { select: { id: true, name: true, status: true } }
      }
    });

    if (!employee) throw new AppError('Сотрудник не найден', 404, 'NOT_FOUND');
    res.json({ success: true, data: employee });
  } catch (err) { next(err); }
});

// ✏️ PUT /api/employees/:id - Обновить сотрудника
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { position, department, status, hourlyRate, skills, certifications } = req.body;

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        position,
        department,
        status,
        hourlyRate: hourlyRate ? Decimal(hourlyRate) : undefined,
        skills,
        certifications
      },
      include: { user: { select: { name: true } } }
    });

    res.json({ success: true, data: employee });
  } catch (err) { next(err); }
});

// 🗑️ DELETE /api/employees/:id - Удалить сотрудника
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.employee.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Сотрудник удалён' });
  } catch (err) { next(err); }
});

export default router;