import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 🔹 Пока грузится — показываем спиннер
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  // 🔹 Нет пользователя — редирект на логин
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🔹 Всё ок — рендерим дети
  return <>{children}</>;
}