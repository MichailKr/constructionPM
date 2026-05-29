import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Wrench,
  FileBarChart,
  Home,
  CheckSquare,
  Shield
} from 'lucide-react';

// 🔹 Конфигурация меню: путь, название, иконка, доступные роли
const menuItems = [
  // 🔸 Общие для всех авторизованных
  {
    to: '/worker',
    label: 'Мои задачи',
    icon: Home,
    roles: ['WORKER'],
    description: 'Личные задания'
  },
  {
    to: '/tasks',
    label: 'Все задачи',
    icon: CheckSquare,
    roles: ['ADMIN', 'MANAGER', 'FOREMAN', 'WORKER'],
    description: 'Общий список'
  },
  {
    to: '/reports',
    label: 'Отчёты',
    icon: FileBarChart,
    roles: ['ADMIN', 'MANAGER', 'FOREMAN', 'WORKER'],
    description: 'Статистика'
  },

  // 🔸 Только для управления (скрыто от рабочих)
  {
    to: '/dashboard',
    label: 'Дашборд',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'MANAGER', 'FOREMAN'],
    description: 'Обзор проекта',
    adminOnly: true
  },
  {
    to: '/projects',
    label: 'Проекты',
    icon: FolderKanban,
    roles: ['ADMIN', 'MANAGER', 'FOREMAN'],
    description: 'Управление объектами',
    adminOnly: true
  },
  {
    to: '/teams',
    label: 'Бригады',
    icon: Users,
    roles: ['ADMIN', 'MANAGER', 'FOREMAN'],
    description: 'Состав команд',
    adminOnly: true
  },
  {
    to: '/equipment',
    label: 'Оборудование',
    icon: Wrench,
    roles: ['ADMIN', 'MANAGER', 'FOREMAN'],
    description: 'Техника и инструменты',
    adminOnly: true
  },
];

export function Sidebar() {
  const { user, hasRole } = useAuth();

  // Фильтруем пункты меню по роли
  const visibleItems = menuItems.filter(item =>
    item.roles.some(role => hasRole(role))
  );

  // 🔹 Цвет бейджа роли для футера
  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-500/20 text-red-200 border-red-400/30';
      case 'MANAGER': return 'bg-blue-500/20 text-blue-200 border-blue-400/30';
      case 'FOREMAN': return 'bg-purple-500/20 text-purple-200 border-purple-400/30';
      case 'WORKER': return 'bg-green-500/20 text-green-200 border-green-400/30';
      default: return 'bg-gray-500/20 text-gray-200 border-gray-400/30';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'Администратор';
      case 'MANAGER': return 'Менеджер';
      case 'FOREMAN': return 'Прораб';
      case 'WORKER': return 'Работник';
      default: return 'Пользователь';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Логотип / Заголовок */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">ConstructionPM</h1>
            <p className="text-xs text-gray-500">Система управления</p>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map(({ to, label, icon: Icon, description, adminOnly }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `group flex items-start gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className={`w-5 h-5 mt-0.5 transition-colors ${
              adminOnly ? 'text-purple-500' : 'text-gray-400 group-hover:text-gray-600'
            }`} />
            <div className="flex-1 min-w-0">
              <span className="font-medium block truncate">{label}</span>
              {description && (
                <span className="text-xs text-gray-400 block truncate">{description}</span>
              )}
            </div>
            {adminOnly && (
              <span className="text-[10px] font-medium text-purple-400 bg-purple-50 px-1.5 py-0.5 rounded">
                ADM
              </span>
            )}
          </NavLink>
        ))}

        {/* Если меню пустое (крайний случай) */}
        {visibleItems.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            Нет доступных разделов
          </div>
        )}
      </nav>

      {/* Футер сайдбара: информация о пользователе */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className={`rounded-lg p-3 border ${getRoleBadgeStyle(user?.role)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                Текущая роль
              </p>
              <p className="text-sm font-bold mt-0.5">
                {getRoleLabel(user?.role)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>

          {/* Подсказка для работника */}
          {user?.role === 'WORKER' && (
            <p className="text-xs mt-2 opacity-90 leading-tight">
              💡 Вы видите только свои задачи
            </p>
          )}
        </div>

        <p className="text-[10px] text-center text-gray-400 mt-3">
          v0.1.0
        </p>
      </div>
    </aside>
  );
}