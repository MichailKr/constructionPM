import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { notificationSvc } from './notification.service.js';

export class EquipmentService {
  async getAvailable(projectId?: string) {
    const where: any = { status: 'AVAILABLE' };
    if (projectId) where.projectId = projectId;
    return prisma.equipment.findMany({ where });
  }

  async requestForTask(equipmentId: string, taskId: string, notes?: string) {
    const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!equipment) throw new AppError('Оборудование не найдено', 404, 'NOT_FOUND');
    if (equipment.status !== 'AVAILABLE') {
      throw new AppError(`Оборудование занято: ${equipment.status}`, 409, 'CONFLICT');
    }

    try {
      // Транзакция: запись в журнал + смена статуса
      await prisma.$transaction([
        prisma.taskEquipment.create({
          data: { equipmentId, taskId, notes, assignedDate: new Date() }
        }),
        prisma.equipment.update({
          where: { id: equipmentId },
          data: { status: 'IN_USE' }
        })
      ]);
      await notificationSvc.notifyEquipmentRequested(equipmentId, taskId, requestedBy, notes);
      return { success: true, message: 'Оборудование выдано' };
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new AppError('Это оборудование уже закреплено за данной задачей', 409, 'CONFLICT');
      }
      throw err;
    }
  }

  async returnFromTask(taskEquipmentId: string) {
    const record = await prisma.taskEquipment.findUnique({ where: { id: taskEquipmentId } });
    if (!record || record.returnDate) {
      throw new AppError('Запись не найдена или уже возвращена', 404, 'NOT_FOUND');
    }

    await prisma.$transaction([
      prisma.taskEquipment.update({ where: { id: taskEquipmentId }, data: { returnDate: new Date() } }),
      prisma.equipment.update({ where: { id: record.equipmentId }, data: { status: 'AVAILABLE' } })
    ]);


    return { success: true, message: 'Оборудование возвращено' };
  }
}