import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Компоненты Layout
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// Страницы
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Projects from './pages/Projects';
import Teams from './pages/Teams';
import Equipment from './pages/Equipment';
import Reports from './pages/Reports';
import WorkerDashboard from './pages/WorkerDashboard';

// 🔹 Компонент редиректа на основе роли (с replace: true)
function RoleRedirect() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role;

    // 🔹 Работник / Сотрудник → личный дашборд
    if (role === 'WORKER' || role === 'EMPLOYEE') {
      return <Navigate to="/worker" replace />;
    }
    // 🔹 Админ / Менеджер / Прораб → общий дашборд
    return <Navigate to="/dashboard" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
}

// 🔹 Компонент защиты роутов по роли
function RoleGuard({ allowedRoles, children }: {
  allowedRoles: string[];
  children: React.ReactNode
}) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role;

    if (!allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }
    return <>{children}</>;
  } catch {
    return <Navigate to="/login" replace />;
  }
}

// 🔹 Обёртка Layout (Сайдбар + Хедер)
function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// 🔹 Страница "Доступ запрещён" — с умной кнопкой "На главную"
function Unauthorized() {
  const handleBack = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;

      // 🔹 Редирект на правильный дашборд по роли
      if (role === 'WORKER' || role === 'EMPLOYEE') {
        window.location.href = '/worker';
      } else {
        window.location.href = '/dashboard';
      }
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
        <div className="text-6xl mb-4">⛔</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещён</h1>
        <p className="text-gray-600 mb-6">
          У вас нет прав для просмотра этой страницы.
        </p>
        <button onClick={handleBack} className="btn-primary">
          🏠 На главную
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <Routes>
        {/* 🌍 Публичные роуты */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 🔐 Защищённые роуты */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* 🔹 Редирект на основе роли (при входе на /) */}
          <Route index element={<RoleRedirect />} />

          {/* 📊 Дашборды */}
          <Route path="dashboard" element={
            <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'FOREMAN']}>
              <Dashboard />
            </RoleGuard>
          } />

          <Route path="worker" element={
            <RoleGuard allowedRoles={['WORKER', 'EMPLOYEE']}>
              <WorkerDashboard />
            </RoleGuard>
          } />

          {/* 📋 Задачи (доступны всем авторизованным) */}
          <Route path="tasks" element={<Tasks />} />

          {/* 🔧 Админ-разделы (только для управления) */}
          <Route path="projects" element={
            <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'FOREMAN']}>
              <Projects />
            </RoleGuard>
          } />
          <Route path="teams" element={
            <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'FOREMAN']}>
              <Teams />
            </RoleGuard>
          } />
          <Route path="equipment" element={
            <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'FOREMAN']}>
              <Equipment />
            </RoleGuard>
          } />

          {/* 📈 Отчёты (доступны всем) */}
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* 🚫 Все неизвестные роуты → редирект на дашборд по роли */}
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}