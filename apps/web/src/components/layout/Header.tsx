import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Bell, LogOut, User, X, Home, Briefcase } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, put } from '../../lib/api';
import { Link } from 'react-router-dom';

export function Header() {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const queryClient = useQueryClient();

  // Загружаем уведомления
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => get('/notifications'),
    enabled: showNotifications,
  });

  // Пометить как прочитанное
  const markAsRead = useMutation({
    mutationFn: (id: string) => put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.read).length;

  // 🔹 Цвет бейджа роли
  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-700 border-red-200';
      case 'MANAGER': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'WORKER': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // 🔹 Текст роли на русском
  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'Администратор';
      case 'MANAGER': return 'Менеджер';
      case 'WORKER': return 'Работник';
      default: return 'Пользователь';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900">ConstructionPM</h1>

        {/* 🔹 Быстрая ссылка для работника */}
        {user?.role === 'WORKER' && (
          <Link
            to="/worker"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Мои задачи
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* 🔔 Уведомления */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Уведомления"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Выпадающий список уведомлений */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fade-in">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Уведомления</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-96 overflow-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-gray-500 text-sm">Нет новых уведомлений</p>
                ) : (
                  notifications.map((notif: any) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notif.read ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                      }`}
                      onClick={() => markAsRead.mutate(notif.id)}
                    >
                      <p className="text-sm text-gray-900 font-medium">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notif.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 👤 Профиль пользователя */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <div className="flex items-center gap-2 justify-end">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user?.role)}`}>
                {getRoleLabel(user?.role)}
              </span>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            user?.role === 'WORKER' ? 'bg-green-100' :
            user?.role === 'MANAGER' ? 'bg-blue-100' :
            user?.role === 'ADMIN' ? 'bg-red-100' :
            'bg-primary-100'
          }`}>
            <User className={`w-5 h-5 ${
              user?.role === 'WORKER' ? 'text-green-600' :
              user?.role === 'MANAGER' ? 'text-blue-600' :
              user?.role === 'ADMIN' ? 'text-red-600' :
              'text-primary-600'
            }`} />
          </div>
        </div>

        {/* 🔘 Кнопка выхода */}
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors ml-2 px-3 py-1.5 rounded-lg hover:bg-red-50"
          title="Выйти из аккаунта"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Выйти</span>
        </button>
      </div>
    </header>
  );
}