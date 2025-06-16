'use client';
import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Неверный email или пароль');
      } else {
        // Wait for session to update
        await getSession();
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Произошла ошибка при входе');
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
        <divdiv
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-slate-200 to-white bg-clip-text text-transparent">
            Вход в игру
          </h1>
          <p className="text-gray-300">Войдите в свой аккаунт для игры</p>
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
                placeholder="Введите ваш пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/60 border border-slate-500/50 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-white placeholder-gray-400"
                required
              />
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
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 border border-blue-500/30"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <divdiv
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Вход...
              </div>
            ) : (
              'Войти в игру'
            )}
          </divbutton>
        </divform>

        <divdiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 space-y-4"
        >
          <div className="text-center">
            <p className="text-gray-400">
              Нет аккаунта?{' '}
              <Link 
                href="/auth/register" 
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>

          <div className="text-center">
            <Link 
              href="/" 
              className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
            >
              ← Вернуться на главную
            </Link>
          </div>

          <divdiv
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-4 mt-6"
          >
            <h3 className="text-sm font-medium text-slate-200 mb-2">i Демо аккаунты</h3>
            <p className="text-xs text-gray-400 mb-2">
              Для тестирования можете создать 2 аккаунта и играть с друзьями
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-600/30 border border-slate-500/20 rounded p-2">
                <p className="text-blue-300">Игрок 1</p>
                <p className="text-gray-400">alice@example.com</p>
              </div>
              <div className="bg-slate-600/30 border border-slate-500/20 rounded p-2">
                <p className="text-slate-300">Игрок 2</p>
                <p className="text-gray-400">bob@example.com</p>
              </div>
            </div>
          </divdiv>
        </divdiv>
      </divdiv>
    </div>
  );
} 
