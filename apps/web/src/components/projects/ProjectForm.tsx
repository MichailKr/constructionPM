import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '../../lib/api';
import toast from 'react-hot-toast';

const projectSchema = z.object({
  name: z.string().min(3, 'Минимум 3 символа'),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProjectForm({ onSuccess, onCancel }: ProjectFormProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { status: 'PLANNING' }
  });

  const mutation = useMutation({
    mutationFn: (data: ProjectFormData) => {
      console.log('📤 Отправляем проект:', data);
      return post('/projects', data);
    },
    onSuccess: () => {
      console.log('✅ Проект создан');
      toast.success('Проект успешно создан!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error('❌ Ошибка:', error);
      toast.error(error.response?.data?.error || 'Не удалось создать проект');
    }
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg animate-fade-in">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Новый проект</h2>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="label">Название проекта *</label>
            <input
              {...register('name')}
              className="input"
              placeholder="Например: ЖК Солнечный"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Описание</label>
            <textarea
              {...register('description')}
              className="input"
              rows={3}
              placeholder="Описание проекта"
            />
          </div>

          <div>
            <label className="label">Статус</label>
            <select {...register('status')} className="input">
              <option value="PLANNING">Планирование</option>
              <option value="ACTIVE">Активен</option>
              <option value="ON_HOLD">На паузе</option>
              <option value="COMPLETED">Завершён</option>
              <option value="CANCELLED">Отменён</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Дата начала</label>
              <input type="date" {...register('startDate')} className="input" />
            </div>
            <div>
              <label className="label">Дата окончания</label>
              <input type="date" {...register('endDate')} className="input" />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="btn-primary flex-1"
            >
              {isSubmitting || mutation.isPending ? 'Создание...' : 'Создать проект'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}