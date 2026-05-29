import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api';
import { CheckCircle, Clock, AlertCircle, Package, Users, HardHat } from 'lucide-react';

export default function WorkerDashboard() {
  const { user } = useAuth();

  // 🔹 Загружаем задачи через специальный эндпоинт бэкенда
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['my-tasks', user?.id],
    queryFn: () => get('/tasks/my'),
    enabled: !!user?.id,
  });

  const allTasks = tasksData?.data || [];

  // Разделяем на категории
  const personalTasks = allTasks.filter((t: any) => t.assigneeId === user?.id);
  const teamTasks = allTasks.filter((t: any) => t.assigneeId !== user?.id); // Те, где я в составе команды, но не ответственный

  // Статистика
  const stats = {
    total: allTasks.length,
    inProgress: allTasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
    completed: allTasks.filter((t: any) => t.status === 'COMPLETED').length,
    overdue: allTasks.filter((t: any) => {
      if (!t.dueDate || t.status === 'COMPLETED') return false;
      return new Date(t.dueDate) < new Date();
    }).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 animate-pulse">Загрузка задач...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Приветствие */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HardHat className="w-8 h-8" />
          Привет, {user?.name}!
        </h1>
        <p className="text-blue-100 mt-1">Вот твой план работ на сегодня</p>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Package />} label="Всего задач" value={stats.total} color="blue" />
        <StatCard icon={<Clock />} label="В работе" value={stats.inProgress} color="yellow" />
        <StatCard icon={<CheckCircle />} label="Завершено" value={stats.completed} color="green" />
        <StatCard icon={<AlertCircle />} label="Просрочено" value={stats.overdue} color="red" />
      </div>

      {/* 🔹 Мои ЛИЧНЫЕ задачи (где я ответственный) */}
      {personalTasks.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Мои личные задачи
          </h2>
          <TaskList tasks={personalTasks} isPersonal={true} />
        </section>
      )}

      {/* 🔹 Задачи МОЕЙ БРИГАДЫ (где я участник) */}
      {teamTasks.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <HardHat className="w-5 h-5 text-orange-600" />
            Задачи моей бригады
          </h2>
          <TaskList tasks={teamTasks} isPersonal={false} />
        </section>
      )}

      {/* Пустое состояние */}
      {allTasks.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Задач пока нет</h3>
          <p className="text-gray-500 mt-2">
            Менеджер ещё не назначил вам задач или задач по бригаде.
          </p>
        </div>
      )}
    </div>
  );
}

// 🔹 Компонент карточки статистики
function StatCard({ icon, label, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// 🔹 Компонент списка задач
function TaskList({ tasks, isPersonal }: { tasks: any[]; isPersonal: boolean }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Задача</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Приоритет</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дедлайн</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {tasks.map((task: any) => (
            <tr key={task.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{task.title}</div>
                {task.description && (
                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</div>
                )}
                {!isPersonal && (
                  <div className="text-xs text-orange-600 mt-1 font-medium">
                    🧑‍🔧 Отв: {task.assignee?.user?.name || 'Бригада'}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                  task.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {task.status === 'PLANNED' ? 'Планируется' :
                   task.status === 'IN_PROGRESS' ? 'В работе' :
                   task.status === 'COMPLETED' ? 'Завершено' : 'Просрочено'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  task.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                  task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                  task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.priority === 'LOW' ? 'Низкий' :
                   task.priority === 'MEDIUM' ? 'Средний' :
                   task.priority === 'HIGH' ? 'Высокий' : 'Критический'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru-RU') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}