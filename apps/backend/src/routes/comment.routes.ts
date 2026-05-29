import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthenticatedRequest } from '../types/auth.types.js';

const router = Router();

// Получить комментарии задачи
router.get('/tasks/:taskId/comments', requireAuth, async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { taskId: req.params.taskId },
      include: { author: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json({ success: true, data: comments, total: comments.length });
  } catch (err) { next(err); }
});

// Создать комментарий
router.post('/comments', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { content, taskId, projectId } = req.body;

    if (!taskId && !projectId) {
      throw new AppError('Укажите taskId или projectId', 400, 'BAD_REQUEST');
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        projectId,
        authorId: user.id
      },
      include: { author: { select: { id: true, name: true } } }
    });

    res.json({ success: true, data: comment });
  } catch (err) { next(err); }
});

// Обновить комментарий
router.put('/comments/:id', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const { content } = req.body;

    const comment = await prisma.comment.update({
      where: { id: req.params.id },
      data: { content, isEdited: true },
      include: { author: { select: { id: true, name: true } } }
    });

    res.json({ success: true, data: comment });
  } catch (err) { next(err); }
});

// Удалить комментарий
router.delete('/comments/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.comment.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;