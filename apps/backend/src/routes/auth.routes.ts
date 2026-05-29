import { Router } from 'express';
import { AuthService } from '../services/auth.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();
const authService = new AuthService();

router.post('/register', requireAuth, async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const creatorRole = (req as AuthenticatedRequest).user.role;
    const result = await authService.register(email, password, name, role, creatorRole);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const result = await authService.getMe(userId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export const authRouter = router;