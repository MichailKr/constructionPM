import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api';
import { Wrench } from 'lucide-react';
import { EquipmentForm } from '../components/equipment/EquipmentForm';

export default function Equipment() {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => get('/equipment'),
  });

  if (isLoading) return <div className="p-4 text-gray-600">Загрузка...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title">🔧 Оборудование</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Добавить оборудование
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Тип</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Описание</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data?.data?.map((eq: any) => (
              <tr key={eq.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{eq.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{eq.type}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    eq.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                    eq.status === 'IN_USE' ? 'bg-blue-100 text-blue-700' :
                    eq.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {eq.status === 'AVAILABLE' ? 'Доступно' :
                     eq.status === 'IN_USE' ? 'В работе' :
                     eq.status === 'MAINTENANCE' ? 'Обслуживание' : 'Сломано'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{eq.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!data?.data || data.data.length === 0) && (
          <div className="p-8 text-center text-gray-500">Список пуст</div>
        )}
      </div>

      {showForm && <EquipmentForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />}
    </div>
  );
}