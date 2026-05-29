import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api';

export default function Reports() {
  // Запрашиваем данные параллельно
  const { data: tasks } = useQuery({ queryKey: ['tasks'], queryFn: () => get('/tasks') });
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: () => get('/projects') });

  const totalTasks = tasks?.data?.length || 0;
  const completedTasks = tasks?.data?.filter((t: any) => t.status === 'COMPLETED').length || 0;
  const overdueTasks = tasks?.data?.filter((t: any) => t.status === 'OVERDUE').length || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">📊 Отчёты</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-500">Всего задач</h3>
          <p className="text-4xl font-bold mt-2">{totalTasks}</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-500">Завершено</h3>
          <p className="text-4xl font-bold mt-2 text-green-600">{completedTasks}</p>
          <p className="text-sm text-gray-400">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</p>
        </div>
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-gray-500">Просрочено</h3>
          <p className="text-4xl font-bold mt-2 text-red-600">{overdueTasks}</p>
        </div>
      </div>
    </div>
  );
}