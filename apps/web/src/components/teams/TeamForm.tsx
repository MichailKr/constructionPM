import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '../../lib/api';
import toast from 'react-hot-toast';

const teamSchema = z.object({
  name: z.string().min(3, 'Минимум 3 символа'),
  description: z.string().optional(),
});

type TeamFormData = z.infer<typeof teamSchema>;

interface TeamFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function TeamForm({ onSuccess, onCancel }: TeamFormProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TeamFormData>({
    resolver: zodResolver(teamSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: TeamFormData) => post('/teams', data),
    onSuccess: () => {
      toast.success('Бригада создана!');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onSuccess();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Ошибка создания'),
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-fade-in">
        <h2 className="text-xl font-bold mb-4 text-gray-900">👥 Новая бригада</h2>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="label">Название бригады *</label>
            <input {...register('name')} className="input" placeholder="Например: Бригада №5" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Описание / Специализация</label>
            <textarea {...register('description')} className="input" rows={3} placeholder="Монолитчики, отделочники..." />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Создание...' : 'Создать'}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}