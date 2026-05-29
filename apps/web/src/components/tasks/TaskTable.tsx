import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put } from '../../lib/api';
import toast from 'react-hot-toast';

export function TaskTable({ projectId }: { projectId?: string }) {
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [showAssignTeam, setShowAssignTeam] = useState<string | null>(null);
  const [showRequestEquip, setShowRequestEquip] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Загрузка задач
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (projectId) params.projectId = projectId;
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;

      const res = await get('/tasks', { params });
      return res;
    },
    retry: 1,
  });

  // Загрузка бригад
  const { data: teamsData } = useQuery({
    queryKey: ['teams'],
    queryFn: () => get('/teams'),
  });

  // Загрузка оборудования
  const { data: equipmentData } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => get('/equipment'),
  });

  // Обновление статуса задачи
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      put(`/tasks/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // 🔹 Обновление дат задачи
  const updateTaskDates = useMutation({
    mutationFn: ({ id, startDate, dueDate }: { id: string; startDate?: string; dueDate?: string }) =>
      put(`/tasks/${id}`, { startDate, dueDate }),
    onSuccess: () => {
      toast.success('Даты обновлены!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Ошибка обновления');
    },
  });

  // Назначение бригады
  const assignTeam = useMutation({
    mutationFn: ({ taskId, teamId }: { taskId: string; teamId: string }) =>
      post(`/tasks/${taskId}/assign-team`, { teamId }),
    onSuccess: () => {
      toast.success('Бригада назначена!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowAssignTeam(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Ошибка назначения');
    },
  });

  // Открепление бригады
  const removeTeam = useMutation({
    mutationFn: (taskId: string) =>
      put(`/tasks/${taskId}`, { teamId: null }),
    onSuccess: () => {
      toast.success('Бригада откреплена');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Ошибка');
    },
  });

  // Запрос оборудования
  const requestEquipment = useMutation({
    mutationFn: ({ taskId, equipmentId }: { taskId: string; equipmentId: string }) =>
      post(`/tasks/${taskId}/request-equipment`, { equipmentId }),
    onSuccess: () => {
      toast.success('Оборудование запрошено!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowRequestEquip(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Ошибка запроса');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Загрузка задач...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded">
        Ошибка: {(error as Error).message}
      </div>
    );
  }

  const tasks = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Фильтры */}
      <div className="flex gap-2">
        <select
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
          className="border rounded px-3 py-2"
        >
          <option value="">Все статусы</option>
          <option value="PLANNED">Планируется</option>
          <option value="IN_PROGRESS">В работе</option>
          <option value="COMPLETED">Завершено</option>
          <option value="ON_HOLD">На удержании</option>
          <option value="OVERDUE">Просрочено</option>
        </select>

        <select
          value={filters.priority}
          onChange={(e) => setFilters(f => ({ ...f, priority: e.target.value }))}
          className="border rounded px-3 py-2"
        >
          <option value="">Все приоритеты</option>
          <option value="LOW">Низкий</option>
          <option value="MEDIUM">Средний</option>
          <option value="HIGH">Высокий</option>
          <option value="CRITICAL">Критический</option>
        </select>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Задача
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Приоритет
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата начала
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дедлайн
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ресурсы
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {tasks.map((task: any) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-sm text-gray-500">{task.description}</div>
                  )}
                </td>

                {/* Статус */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={task.status}
                    onChange={(e) => updateStatus.mutate({
                      id: task.id,
                      status: e.target.value
                    })}
                    className={`text-sm rounded px-2 py-1 border ${
                      task.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-300' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                      task.status === 'OVERDUE' ? 'bg-red-100 text-red-700 border-red-300' :
                      'bg-gray-100 text-gray-700 border-gray-300'
                    }`}
                  >
                    <option value="PLANNED">Планируется</option>
                    <option value="IN_PROGRESS">В работе</option>
                    <option value="COMPLETED">Завершено</option>
                    <option value="ON_HOLD">На удержании</option>
                    <option value="OVERDUE">Просрочено</option>
                  </select>
                </td>

                {/* Приоритет */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    task.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.priority}
                  </span>
                </td>

                {/* Дата начала (редактируемая) */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="date"
                    defaultValue={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      updateTaskDates.mutate({
                        id: task.id,
                        startDate: e.target.value || null,
                        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined
                      });
                    }}
                    className="text-sm border rounded px-2 py-1"
                  />
                </td>

                {/* Дедлайн (редактируемый) */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="date"
                    defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      updateTaskDates.mutate({
                        id: task.id,
                        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : undefined,
                        dueDate: e.target.value || null
                      });
                    }}
                    className="text-sm border rounded px-2 py-1"
                  />
                </td>

                {/* 🔹 Ресурсы (Бригада + Оборудование) */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    {/* Бригада */}
                    <div className="flex items-center gap-2">
                      {task.team ? (
                        <>
                          <span className="text-sm text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded">
                            👥 {task.team.name}
                          </span>
                          <button
                            onClick={() => removeTeam.mutate(task.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                            title="Открепить бригаду"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowAssignTeam(task.id)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                          + Назначить бригаду
                        </button>
                      )}
                    </div>

                    {/* Оборудование */}
                    <div className="flex items-center gap-2">
                      {task.equipment && task.equipment.length > 0 ? (
                        <>
                          <span className="text-sm text-orange-700 font-medium bg-orange-50 px-2 py-1 rounded">
                            🚜 {task.equipment.length} ед.
                          </span>
                          <button
                            onClick={() => setShowRequestEquip(task.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                            title="Добавить ещё"
                          >
                            +
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowRequestEquip(task.id)}
                          className="text-sm text-orange-600 hover:text-orange-800 font-medium underline"
                        >
                          + Запросить оборудование
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Нет задач для отображения
          </div>
        )}
      </div>

      {/* 🔹 Модальное окно: Назначение бригады */}
      {showAssignTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4 text-gray-900">👥 Назначить бригаду</h3>

            <select
              className="input w-full mb-4"
              onChange={(e) => {
                if (e.target.value) {
                  assignTeam.mutate({ taskId: showAssignTeam, teamId: e.target.value });
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>Выберите бригаду</option>
              {teamsData?.data?.map((team: any) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>

            {(!teamsData?.data || teamsData.data.length === 0) && (
              <p className="text-gray-500 text-sm mb-4">Бригады не найдены</p>
            )}

            <button
              onClick={() => setShowAssignTeam(null)}
              className="btn-secondary w-full"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* 🔹 Модальное окно: Запрос оборудования */}
      {showRequestEquip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4 text-gray-900">🚜 Запросить оборудование</h3>

            <select
              className="input w-full mb-4"
              onChange={(e) => {
                if (e.target.value) {
                  requestEquipment.mutate({ taskId: showRequestEquip, equipmentId: e.target.value });
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>Выберите оборудование</option>
              {equipmentData?.data?.map((eq: any) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.status})
                </option>
              ))}
            </select>

            {(!equipmentData?.data || equipmentData.data.length === 0) && (
              <p className="text-gray-500 text-sm mb-4">Оборудование не найдено</p>
            )}

            <button
              onClick={() => setShowRequestEquip(null)}
              className="btn-secondary w-full"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}