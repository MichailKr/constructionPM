import { z } from 'zod';
import { PROJECT_STATUSES, SITE_STATUSES, TASK_STATUSES } from '@constructionpm/shared';

const dateRefinement = (data: { startDate: Date; endDate: Date }) =>
  data.startDate < data.endDate;

export const CreateProjectDto = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  budget: z.coerce.number().int().positive().optional(),  // BigInt преобразуем
  currency: z.string().optional().default("RUB"),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).default('PLANNING'),
  managerId: z.string().uuid().optional(),
});

export const UpdateProjectDto = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budget: z.coerce.number().int().positive().optional(),
  currency: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
});

export const CreateTaskDto = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  status: z.enum(Object.values(TASK_STATUSES) as [string, ...string[]]).default('PLANNED'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date(),
  projectId: z.string().uuid('Неверный projectId'),
  constructionSiteId: z.string().uuid().optional().nullable(),
  assigneeId: z.string().uuid().optional(),
  workTypeId: z.string().uuid().optional(),
})//.refine(dateRefinement, { message: 'Дата начала должна быть раньше даты окончания' });

export const UpdateTaskStatusDto = z.object({
  status: z.enum(Object.values(TASK_STATUSES) as [string, ...string[]]),
  comment: z.string().optional(),
});

export const UpdateSiteDto = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CLOSED']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  description: z.string().optional(),
});

export const CreateSiteDto = z.object({
  name: z.string().min(2).max(100),
  address: z.string().min(5),
  city: z.string(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CLOSED']).default('ACTIVE'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  description: z.string().optional(),
});