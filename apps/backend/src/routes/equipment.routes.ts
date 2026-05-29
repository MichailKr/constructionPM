import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { EquipmentType, EquipmentStatus } from '@prisma/client';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const data = await prisma.equipment.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { name, type, status, model, serialNumber, location, specifications } = req.body;

    const validTypes = Object.values(EquipmentType);
    const validStatuses = Object.values(EquipmentStatus);

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Неверный тип. Допустимые: ${validTypes.join(', ')}`
      });
    }

    const equipment = await prisma.equipment.create({
      data: {
        name,
        type: type as EquipmentType,
        status: (validStatuses.includes(status) ? status : 'AVAILABLE') as EquipmentStatus,
        model: model || null,
        serialNumber: serialNumber || null,
        location: location || null,
        specifications: specifications || null,
        purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : null,
        warrantyEndDate: req.body.warrantyEndDate ? new Date(req.body.warrantyEndDate) : null,
      }
    });

    res.status(201).json({ success: true, data: equipment });
  } catch (err) {
    console.error('Equipment creation error:', err);
    next(err);
  }
});

export const equipmentRouter = router;