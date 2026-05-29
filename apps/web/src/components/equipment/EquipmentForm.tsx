import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from '../../lib/api';
import toast from 'react-hot-toast';

const EQUIPMENT_TYPES = [
  { value: 'VEHICLE', label: 'Транспорт' },
  { value: 'MACHINERY', label: 'Тяжелая техника' },
  { value: 'TOOL', label: 'Инструмент' },
  { value: 'SAFETY', label: 'Средства защиты' },
  { value: 'OTHER', label: 'Другое' },
];

const equipmentSchema = z.object({
  name: z.string().min(3, 'Минимум 3 символа'),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  type: z.enum(['VEHICLE', 'MACHINERY', 'TOOL', 'SAFETY', 'OTHER']),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN']).default('AVAILABLE'),
  location: z.string().optional(),
  specifications: z.string().optional(), // Описание как текст
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function EquipmentForm({ onSuccess, onCancel }: EquipmentFormProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      type: 'MACHINERY',
      status: 'AVAILABLE'
    }
  });

  const mutation = useMutation({
    mutationFn: (data: EquipmentFormData) => {
      // Преобразуем specifications в JSON (или null)
      const payload = {
        ...data,
        specifications: data.specifications ? { description: data.specifications } : null
      };
      return post('/equipment', payload);
    },
    onSuccess: () => {
      toast.success('Оборудование добавлено!');
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      onSuccess();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Ошибка создания'),
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md animate-fade-in">
        <h2 className="text-xl font-bold mb-4 text-gray-900">🚜 Новое оборудование</h2>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div>
            <label className="label">Название *</label>
            <input {...register('name')} className="input" placeholder="Например: Экскаватор CAT" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Модель</label>
              <input {...register('model')} className="input" placeholder="CAT-320" />
            </div>
            <div>
              <label className="label">Серийный номер</label>
              <input {...register('serialNumber')} className="input" placeholder="SN123456" />
            </div>
          </div>

          <div>
            <label className="label">Тип *</label>
            <select {...register('type')} className="input">
              {EQUIPMENT_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.type && <p className="text-red-500 text-xs mt-1">Выберите тип</p>}
          </div>

          <div>
            <label className="label">Статус</label>
            <select {...register('status')} className="input">
              <option value="AVAILABLE">Доступно</option>
              <option value="IN_USE">В использовании</option>
              <option value="MAINTENANCE">На обслуживании</option>
              <option value="BROKEN">Сломано</option>
            </select>
          </div>

          <div>
            <label className="label">Местоположение</label>
            <input {...register('location')} className="input" placeholder="Участок №3, Склад А" />
          </div>

          <div>
            <label className="label">Описание / Характеристики</label>
            <textarea
              {...register('specifications')}
              className="input"
              rows={3}
              placeholder="Грузоподъемность: 20т, Год выпуска: 2020..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
              {isSubmitting ? 'Добавление...' : 'Добавить'}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}