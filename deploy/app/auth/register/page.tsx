'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white flex items-center justify-center p-4">
      <divdiv
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800/40 border border-slate-600/40 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md"
      >
        {!success ? (
          <>
            <divdiv
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-slate-200 to-white bg-clip-text text-transparent">
                Регистрация
              </h1>
              <p className="text-gray-300">Создайте аккаунт для игры в Скифскую лестницу</p>
            </divdiv>

            <divform
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Имя пользователя
                  </label>
                  <divinput
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    placeholder="Введите ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/60 border border-slate-500/50 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <divinput
                    whileFocus={{ scale: 1.02 }}
                    type="email"
                    placeholder="Введите ваш email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/60 border border-slate-500/50 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-white placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Пароль
                  </label>
                  <divinput
                    whileFocus={{ scale: 1.02 }}
                    type="password"
                    placeholder="Создайте пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/60 border border-slate-500/50 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-white placeholder-gray-400"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-400 mt-1">Минимум 6 символов</p>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <divdiv
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gray-700/40 border border-gray-600 rounded-lg p-3 text-gray-200 text-sm text-center"
                  >
                    {error}
                  </divdiv>
                )}
              </AnimatePresence>

              <divbutton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-slate-500/25 transition-all duration-300 disabled:opacity-50 border border-slate-500/30"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <divdiv
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Регистрация...
                  </div>
                ) : (
                  'Создать аккаунт'
                )}
              </divbutton>
            </divform>

            <divdiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-center"
            >
              <p className="text-gray-400">
                Уже есть аккаунт?{' '}
                <Link 
                  href="/auth/login" 
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Войти
                </Link>
              </p>
            </divdiv>
          </>
        ) : (
          <divdiv
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="text-center space-y-6"
          >
            <div className="text-6xl mb-4 text-blue-400">!</div>
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Регистрация завершена!</h2>
            
            <div className="bg-blue-500/20 border border-blue-400 rounded-xl p-6">
              <p className="text-blue-200 mb-2">Добро пожаловать, {name}!</p>
              <divdiv
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-4xl text-blue-400"
              >
                ✓
              </divdiv>
              <p className="text-sm text-gray-300 mt-2">Ваш аккаунт успешно создан</p>
            </div>

            <div className="bg-slate-600/20 border border-slate-500/30 rounded-xl p-4">
              <p className="text-sm text-slate-200">
                Перенаправление на страницу входа через 2 секунды...
              </p>
              <divdiv
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "linear" }}
                className="h-1 bg-blue-500 rounded-full mt-2"
              />
            </div>
          </divdiv>
        )}
      </divdiv>
    </div>
  );
} 
