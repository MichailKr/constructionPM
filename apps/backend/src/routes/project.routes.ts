import { Router } from 'express';
import { ProjectService } from '../services/project.service.js';
import { SiteService } from '../services/site.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { CreateProjectDto, UpdateProjectDto, UpdateSiteDto, CreateSiteDto } from '../dtos/project.dto.js';

const router = Router();
const projectSvc = new ProjectService();
const siteSvc = new SiteService();

// 📋 GET /api/projects
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const result = await projectSvc.list(user.role, req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

// ➕ POST /api/projects
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = CreateProjectDto.parse(req.body);
    const result = await projectSvc.create(data, user.id, user.role);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

//  PUT /api/projects/:id
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = UpdateProjectDto.parse(req.body);
    const result = await projectSvc.update(req.params.id, data, user.id, user.role);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// 🗑️ DELETE /api/projects/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    await projectSvc.delete(req.params.id, user.id, user.role);
    res.json({ success: true, message: 'Проект удалён' });
  } catch (err) { next(err); }
});

// 🏗️ Объекты внутри проекта
router.get('/:projectId/sites', requireAuth, async (req, res, next) => {
  try {
    const result = await siteSvc.listByProject(req.params.projectId, req.query);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.post('/:projectId/sites', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = CreateSiteDto.parse(req.body);
    const result = await siteSvc.create(req.params.projectId, data, user.role);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Обновление объекта
router.put('/:projectId/sites/:siteId', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = UpdateSiteDto.parse(req.body);
    const result = await projectSvc.updateSite(req.params.projectId, req.params.siteId, data, user.role);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Создание объекта
router.post('/:projectId/sites', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    const data = CreateSiteDto.parse(req.body);
    const result = await projectSvc.createSite(req.params.projectId, data, user.role);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// Удаление объекта
router.delete('/:projectId/sites/:siteId', requireAuth, async (req, res, next) => {
  try {
    const { user } = req as AuthenticatedRequest;
    await projectSvc.deleteSite(req.params.projectId, req.params.siteId, user.role);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export const projectRouter = router;