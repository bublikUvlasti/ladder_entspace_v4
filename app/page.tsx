'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import { motion } from 'framer-motion';
import { useSocket } from '../lib/useSocket';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { connected, authenticated, user } = useSocket(session?.user?.id);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 pt-20">
        {/* Main Title */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-slate-200 to-white bg-clip-text text-transparent">
            Скифская
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-300 to-blue-500 bg-clip-text text-transparent">
            Лестница
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto">
            Древняя игра стратегии и удачи. Бросайте камни, двигайте большой камень, побеждайте противника!
          </p>
        </div>

        {/* Game Area */}
        <div className="w-full max-w-md">
          {!session ? (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold mb-4 text-slate-100">Начните играть</h3>
                <p className="text-gray-400">Войдите или зарегистрируйтесь для игры</p>
              </div>
              
              <div className="space-y-4">
                <Link href="/auth/login">
                  <button className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-blue-500/25 transition-all duration-300 border border-blue-500/30 hover:scale-105">
                    Войти в игру
                  </button>
                </Link>
                
                <Link href="/auth/register">
                  <button className="w-full py-4 px-6 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-slate-500/25 transition-all duration-300 border border-slate-500/30 hover:scale-105">
                    Регистрация
                  </button>
                </Link>

                <Link href="/about">
                  <button className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium text-base shadow-lg hover:shadow-purple-500/25 transition-all duration-300 border border-purple-500/30 hover:scale-105">
                    📖 Узнать о игре
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="text-center mb-8 bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-2 text-slate-100">Добро пожаловать!</h3>
                <p className="text-xl text-blue-300 font-semibold">{session.user.name}</p>
                <p className="text-gray-400 mt-2">Готовы к битве?</p>
              </div>

              {/* Game Actions */}
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/game/create')}
                  disabled={!authenticated}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 border hover:scale-105 ${
                    authenticated 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:shadow-blue-500/25 border-blue-500/30' 
                      : 'bg-gray-600 text-gray-400 border-gray-500/30 cursor-not-allowed'
                  }`}
                >
                  🎮 Создать игру
                </button>
                
                <button
                  onClick={() => router.push('/game/join')}
                  disabled={!authenticated}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 border hover:scale-105 ${
                    authenticated 
                      ? 'bg-gradient-to-r from-slate-600 to-gray-700 text-white hover:shadow-slate-500/25 border-slate-500/30' 
                      : 'bg-gray-600 text-gray-400 border-gray-500/30 cursor-not-allowed'
                  }`}
                >
                  🚪 Присоединиться к игре
                </button>
              </div>

              {/* User Stats */}
              <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-4 backdrop-blur-sm text-center">
                <p className="text-gray-400 text-sm mb-2">Ваша статистика</p>
                <div className="flex justify-center gap-6">
                  <div>
                    <p className="text-2xl font-bold text-green-400">
                      {user?.wins || 0}
                    </p>
                    <p className="text-xs text-gray-400">Побед</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-400">
                      {user?.losses || 0}
                    </p>
                    <p className="text-xs text-gray-400">Поражений</p>
                  </div>
                </div>
              </div>

              {/* Quick Navigation */}
              <div className="grid grid-cols-3 gap-3">
                <Link href="/about">
                  <button className="w-full py-3 px-4 bg-slate-700/40 border border-slate-600/30 rounded-lg text-white hover:bg-slate-600/40 transition-all duration-200 text-sm font-medium">
                    📖 О игре
                  </button>
                </Link>
                <Link href="/profile">
                  <button className="w-full py-3 px-4 bg-slate-700/40 border border-slate-600/30 rounded-lg text-white hover:bg-slate-600/40 transition-all duration-200 text-sm font-medium">
                    👤 Профиль
                  </button>
                </Link>
                <Link href="/leaderboard">
                  <button className="w-full py-3 px-4 bg-slate-700/40 border border-slate-600/30 rounded-lg text-white hover:bg-slate-600/40 transition-all duration-200 text-sm font-medium">
                    🏆 Рейтинг
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Rules Section */}
        <div className="mt-12 max-w-2xl text-center">
          <h4 className="text-xl font-semibold mb-4 text-slate-200">Как играть:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
            <div className="bg-slate-800/30 border border-slate-600/20 rounded-lg p-4 hover:bg-slate-800/40 transition-colors">
              <div className="text-2xl mb-2 text-blue-400">•</div>
              <p>Ставьте от 1 до 48 камешков каждый ход</p>
            </div>
            <div className="bg-slate-800/30 border border-slate-600/20 rounded-lg p-4 hover:bg-slate-800/40 transition-colors">
              <div className="text-2xl mb-2 text-slate-300">●</div>
              <p>Больше камешков - толкаете большой камень в свою сторону</p>
            </div>
            <div className="bg-slate-800/30 border border-slate-600/20 rounded-lg p-4 hover:bg-slate-800/40 transition-colors">
              <div className="text-2xl mb-2 text-blue-400">!</div>
              <p>Левый игрок: камень к -2, правый игрок: камень к +2</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-8 text-center">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              connected ? 'bg-green-400' : 'bg-red-400'
            }`} />
            {connected ? 'Подключено к серверу' : 'Отключено от сервера'}
          </div>
        </div>
      </div>
    </div>
  );
}
