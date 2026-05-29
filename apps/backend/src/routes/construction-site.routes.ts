import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/construction-sites
router.get('/', async (_req: Request, res: Response) => {
  try {
    const sites = await prisma.constructionSite.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
      },
    });

    res.json({ success: true, data: sites });
  } catch (error) {
    console.error('Error fetching construction sites:', error);
    res.status(500).json({
      error: 'Failed to fetch construction sites',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/construction-sites
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, address, city, projectId } = req.body;

    if (!name || !address || !city || !projectId) {
      return res.status(400).json({ error: 'name, address, city и projectId обязательны' });
    }

    const site = await prisma.constructionSite.create({
      data: {
        name,
        address,
        city,
        projectId,
      },
    });

    res.status(201).json({ success: true, data: site });
  } catch (error) {
    console.error('Error creating construction site:', error);
    res.status(500).json({
      error: 'Failed to create construction site',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;