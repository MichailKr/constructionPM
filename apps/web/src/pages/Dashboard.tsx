import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api';
import { FolderKanban, CheckSquare, TrendingUp, Clock, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => get('/projects'),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => get('/tasks'),
  });

  if (projectsLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  const projectCount = projects?.data?.length || 0;
  const activeTasks = tasks?.data?.filter((t: any) => t.status !== 'COMPLETED').length || 0;
  const completedTasks = tasks?.data?.filter((t: any) => t.status === 'COMPLETED').length || 0;
  const overdueTasks = tasks?.data?.filter((t: any) => t.status === 'OVERDUE').length || 0;

  const stats = [
    { label: 'Проектов', value: projectCount, icon: FolderKanban, color: 'bg-blue-500' },
    { label: 'Активных задач', value: activeTasks, icon: CheckSquare, color: 'bg-green-500' },
    { label: 'Завершено', value: completedTasks, icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Просрочено', value: overdueTasks, icon: Clock, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Приветствие */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Добро пожаловать, {user?.name}! 👋</h1>
        <p className="text-gray-500 mt-1">Вот что происходит в ваших проектах сегодня</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Быстрые действия */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/tasks" className="group flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-blue-50 transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200">
              <CheckSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-blue-700">Задачи</h3>
              <p className="text-sm text-gray-500 mt-1">Управление задачами</p>
            </div>
          </a>

          <a href="/projects" className="group flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200">
              <FolderKanban className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-orange-700">Проекты</h3>
              <p className="text-sm text-gray-500 mt-1">Управление проектами</p>
            </div>
          </a>

          <a href="/reports" className="group flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-purple-700">Отчёты</h3>
              <p className="text-sm text-gray-500 mt-1">Аналитика и статистика</p>
            </div>
          </a>
        </div>
      </div>

      {/* Последние задачи */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Последние задачи</h2>
        {tasks?.data?.slice(0, 5).map((task: any) => (
          <div key={task.id} className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0">
            <div>
              <h3 className="font-medium text-gray-900">{task.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {new Date(task.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
              task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
              task.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {task.status === 'PLANNED' && 'Планируется'}
              {task.status === 'IN_PROGRESS' && 'В работе'}
              {task.status === 'COMPLETED' && 'Завершено'}
              {task.status === 'ON_HOLD' && 'На удержании'}
              {task.status === 'OVERDUE' && 'Просрочено'}
            </span>
          </div>
        ))}
        {(!tasks?.data || tasks.data.length === 0) && (
          <p className="text-gray-500 text-center py-8">Нет задач</p>
        )}
      </div>
    </div>
  );
}