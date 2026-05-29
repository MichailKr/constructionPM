import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { post, get } from '../../lib/api';
import toast from 'react-hot-toast';

const taskSchema = z.object({
  title: z.string().min(3, 'Минимум 3 символа'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED']),
  startDate: z.string().optional(),
  dueDate: z.string(),
  projectId: z.string().uuid('Выберите проект'),
  constructionSiteId: z.string().uuid().optional().nullable(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  projectId?: string;
}

export function TaskForm({ onSuccess, onCancel, projectId }: TaskFormProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'MEDIUM',
      status: 'PLANNED',
      projectId: projectId || undefined,
    }
  });

  // Загружаем проекты
  const { data: projectsData } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => get('/projects'),
  });

  const mutation = useMutation({
    mutationFn: (data: TaskFormData) => {
      console.log('📤 Отправляем задачу:', data);
      return post('/tasks', data);
    },
    onSuccess: () => {
      toast.success('Задача создана!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      reset();
      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Ошибка:', error);
      toast.error(error.response?.data?.error || 'Не удалось создать');
    }
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Новая задача</h2>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="label">Название *</label>
            <input {...register('title')} className="input" />
            {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
          </div>

          <div>
            <label className="label">Описание</label>
            <textarea {...register('description')} className="input" rows={3} />
          </div>

          {/* 🔹 ВЫБОР ПРОЕКТА (ОБЯЗАТЕЛЬНО) */}
          <div>
            <label className="label">Проект *</label>
            <select {...register('projectId')} className="input">
              <option value="">Выберите проект</option>
              {projectsData?.data?.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.projectId && <p className="text-red-500 text-xs">{errors.projectId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Приоритет</label>
              <select {...register('priority')} className="input">
                <option value="LOW">Низкий</option>
                <option value="MEDIUM">Средний</option>
                <option value="HIGH">Высокий</option>
                <option value="CRITICAL">Критический</option>
              </select>
            </div>
            <div>
              <label className="label">Статус</label>
              <select {...register('status')} className="input">
                <option value="PLANNED">Планируется</option>
                <option value="IN_PROGRESS">В работе</option>
                <option value="ON_HOLD">На удержании</option>
                <option value="COMPLETED">Завершено</option>
              </select>
            </div>
          </div>

          {/* 🔹 ДАТЫ (ОБЯЗАТЕЛЬНО для назначения бригады) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Дата начала</label>
              <input type="date" {...register('startDate')} className="input" />
            </div>
            <div>
              <label className="label">Дедлайн *</label>
              <input type="date" {...register('dueDate')} className="input" required />
              {errors.dueDate && <p className="text-red-500 text-xs">{errors.dueDate.message}</p>}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Создание...' : 'Создать'}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}