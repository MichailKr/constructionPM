/**
 * Main API router - mounts all versioned routes
 */

import { Router, Request, Response } from 'express';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { healthRouter } from './health.route.js';
import { usersRouter } from './users.route.js';
import { authRouter } from './auth.routes.js';
import { projectRouter } from './project.routes.js';
import { taskRouter } from './task.routes.js';
import commentRouter from './comment.routes.js';
import teamRouter from './team.routes.js';
import employeeRouter from './employee.routes.js';
import constructionSiteRouter from './construction-site.routes.js';
import { equipmentRouter } from './equipment.routes.js';
import { teamRouter } from './team.routes.js';


export const apiRouter = Router();

// Apply rate limiting to all API routes
apiRouter.use(apiLimiter);

// Mount health routes (public)
apiRouter.use(healthRouter);

// Public auth routes - БЕЗ префикса /api!
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);

// 🔥 ВАЖНО: Сначала КОНКРЕТНЫЕ пути, потом ОБЩИЕ!
apiRouter.use('/projects', projectRouter);
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/teams', teamRouter);
apiRouter.use('/employees', employeeRouter);
apiRouter.use('/comments', commentRouter);
apiRouter.use('/construction-sites', constructionSiteRouter);
apiRouter.use('/equipment', equipmentRouter);
apiRouter.use('/teams', teamRouter);

// Work types справочник
apiRouter.get('/work-types', async (_req, res) => {
  const workTypes = [
    'Земляные работы',
    'Бетонные работы',
    'Монтажные работы',
    'Отделочные работы',
    'Инженерные сети',
    'Кровельные работы'
  ];
  res.json({ success: true, data: workTypes });
});

// Catch-all для несуществующих эндпоинтов (в самом конце!)
apiRouter.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: _req.path,
  });
});

export default apiRouter;