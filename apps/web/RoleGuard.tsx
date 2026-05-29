// src/components/layout/RoleGuard.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

<Route path="/unauthorized" element={
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-2">⛔ Доступ запрещён</h1>
      <p className="text-gray-600">У вас нет прав для просмотра этой страницы</p>
      <button onClick={() => window.history.back()} className="btn-primary mt-4">
        ← Назад
      </button>
    </div>
  </div>
} />