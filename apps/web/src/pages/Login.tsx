import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 🔹 Важно: предотвращаем стандартную отправку!
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Пытаемся войти:', { email });
      await login(email, password);
      console.log('✅ Успешный вход!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('❌ Ошибка входа:', err);
      setError(err.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold text-center">ConstructionPM</h1>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border px-3 py-2"
              required
              placeholder="admin@test.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border px-3 py-2"
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"  // 🔹 type="submit", не "button"!
            disabled={loading}
            className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Тестовый аккаунт:</p>
          <p>admin@test.com / Admin12345</p>
        </div>
      </div>
    </div>
  );
}