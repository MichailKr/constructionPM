import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { get, post } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'FOREMAN' | 'EMPLOYEE'; // 🔹 Оставляем как у тебя
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: User['role'][]) => boolean;
  loading: boolean;
  refreshUser: () => Promise<void>; // 🔹 Добавили
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // 🔹 Новая функция: перезагрузить данные пользователя с сервера
  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await get<{ data: User }>('/auth/me');
      setUser(res.data);
      // Также обновим в localStorage, если там храним
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch {
      // Если ошибка — возможно токен протух
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    if (token) {
      get<{ data: User }>('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await post<{ data: { token: string; user: User } }>('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);

    window.history.replaceState(null, '', '/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // 🔹 Твой hasRole уже идеальный — ничего не меняем!
  const hasRole = (...roles: User['role'][]) => {
    return user ? roles.includes(user.role) : false;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};