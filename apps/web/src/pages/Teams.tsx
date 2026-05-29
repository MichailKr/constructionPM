import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, put } from '../lib/api';
import { Users, UserPlus, X, Edit2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { TeamForm } from '../components/teams/TeamForm';

export default function Teams() {
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const queryClient = useQueryClient();

  // Загрузка бригад
  const { data: teamsData, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => get('/teams'),
  });

  // 🔹 Загрузка сотрудников БЕЗ бригады (для добавления)
  const { data: availableEmployeesData } = useQuery({
    queryKey: ['available-employees'],
    queryFn: () => get('/teams/available-employees'),
  });

  // Создание бригады
  const createTeam = useMutation({
    mutationFn: (data: any) => post('/teams', data),
    onSuccess: () => {
      toast.success('Бригада создана!');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-employees'] });
      setShowForm(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Ошибка создания'),
  });

  // Обновление бригады (состав участников)
  const updateTeamMembers = useMutation({
    mutationFn: ({ teamId, memberIds }: { teamId: string; memberIds: string[] }) =>
      put(`/teams/${teamId}/members`, { memberIds }),
    onSuccess: () => {
      toast.success('Состав бригады обновлён!');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-employees'] });
      setEditingTeam(null);
      setSelectedMembers([]);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Ошибка обновления'),
  });

  // Удаление бригады
  const deleteTeam = useMutation({
    mutationFn: (teamId: string) =>
        fetch(`/api/teams/${teamId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        }).then(res => res.json()),
    onSuccess: () => {
      toast.success('Бригада удалена');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['available-employees'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Ошибка удаления'),
  });

  // Открыть редактирование состава
  const handleEditMembers = (team: any) => {
    setEditingTeam(team.id);
    setSelectedMembers(team.members?.map((m: any) => m.id) || []);
  };

  // Переключить участника
  const toggleMember = (employeeId: string) => {
    setSelectedMembers(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Сохранить состав
  const handleSaveMembers = () => {
    if (editingTeam) {
      updateTeamMembers.mutate({ teamId: editingTeam, memberIds: selectedMembers });
    }
  };

  // Отмена редактирования
  const handleCancelEdit = () => {
    setEditingTeam(null);
    setSelectedMembers([]);
  };

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Загрузка бригад...</div>
      </div>
    );
  }

  const teams = teamsData?.data || [];
  const availableEmployees = availableEmployeesData?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 Бригады</h1>
          <p className="text-gray-500 mt-1">Управление составом команд</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <UserPlus className="w-4 h-4 mr-2" />
          Новая бригада
        </button>
      </div>

      {/* Сетка бригад */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team: any) => (
          <div
            key={team.id}
            className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Шапка карточки */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{team.name}</h3>
                    {team.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{team.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Режим просмотра */}
            {editingTeam !== team.id ? (
              <>
                {/* Статистика */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Участников:</span>
                    <span className="font-bold text-gray-900">
                      {team.members?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Список участников (превью) */}
                {team.members && team.members.length > 0 && (
                  <div className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      {team.members.slice(0, 4).map((member: any) => (
                        <span
                          key={member.id}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                        >
                          {member.name}
                        </span>
                      ))}
                      {team.members.length > 4 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                          +{team.members.length - 4} ещё
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Кнопки действий */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-2">
                  <button
                    onClick={() => handleEditMembers(team)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Редактировать
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Удалить бригаду?')) {
                        deleteTeam.mutate(team.id);
                      }
                    }}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* Режим редактирования состава */
              <div className="p-5">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Состав бригады
                </h4>

                {/* Список доступных сотрудников для выбора */}
                <div className="space-y-2 max-h-64 overflow-auto mb-4">
                  {availableEmployees.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Нет свободных сотрудников
                    </p>
                  ) : (
                    availableEmployees.map((employee: any) => (
                      <label
                        key={employee.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedMembers.includes(employee.id)
                            ? 'bg-purple-50 border-purple-300 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(employee.id)}
                          onChange={() => toggleMember(employee.id)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {employee.name}
                          </p>
                          <p className="text-xs text-gray-500">{employee.position || 'Сотрудник'}</p>
                        </div>
                        {selectedMembers.includes(employee.id) && (
                          <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                            <Save className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </label>
                    ))
                  )}
                </div>

                {/* Счётчик выбранных */}
                <div className="mb-4 px-3 py-2 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">
                    Выбрано участников: <span className="font-bold">{selectedMembers.length}</span>
                  </p>
                </div>

                {/* Кнопки сохранения/отмены */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveMembers}
                    disabled={updateTeamMembers.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {updateTeamMembers.isPending ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Пустое состояние */}
      {teams.length === 0 && (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Бригады пока не созданы</p>
          <p className="text-sm text-gray-400 mt-1">
            Создайте первую бригаду для управления составом
          </p>
        </div>
      )}

      {/* Модальное окно создания бригады */}
      {showForm && (
        <TeamForm
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}