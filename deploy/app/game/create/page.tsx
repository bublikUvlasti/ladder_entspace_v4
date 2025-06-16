'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { useSocket } from '../../../lib/useSocket';

export default function CreateGamePage() {
  const [loading, setLoading] = useState(false);
  const [gameCreated, setGameCreated] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { connected, authenticated, createGame, currentGame, gameEvents } = useSocket(session?.user?.id);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Отслеживаем создание игры через WebSocket
  useEffect(() => {
    if (currentGame && currentGame.code && !gameCreated) {
      setGameCreated(true);
      setLoading(false);
      // Переходим сразу на страницу игры (зал ожидания)
      router.push(`/game/${currentGame.code}`);
    }
  }, [currentGame, gameCreated, router]);

  // Отслеживаем начало игры
  useEffect(() => {
    if (currentGame && currentGame.status === 'IN_PROGRESS') {
      // Игра уже началась, остаемся на странице игры
      console.log('Игра начинается!');
    }
  }, [currentGame]);

  const handleCreate = async () => {
    if (!session?.user) {
      alert('Необходимо войти в систему');
      router.push('/');
      return;
    }

    if (!authenticated) {
      alert('WebSocket не подключен. Попробуйте позже.');
      return;
    }

    setLoading(true);
    createGame();
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black">
        <divdiv
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white flex items-center justify-center p-4">
      {/* WebSocket Status */}
      <div className="absolute top-4 right-4">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg backdrop-blur-sm border ${
          connected && authenticated 
            ? 'bg-green-900/40 border-green-500/30 text-green-300' 
            : 'bg-red-900/40 border-red-500/30 text-red-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            connected && authenticated ? 'bg-green-400' : 'bg-red-400'
          }`} />
          <span className="text-sm font-medium">
            {connected && authenticated ? 'Подключен' : 'Отключен'}
          </span>
        </div>
      </div>

      <divdiv
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800/40 border border-slate-600/40 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md text-center"
      >
        <divdiv
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-slate-200 to-white bg-clip-text text-transparent">
            Создание игры
          </h1>
          <p className="text-gray-300 mb-8">Создайте новую игру и ждите соперника</p>
        </divdiv>

        {!gameCreated ? (
          <divdiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-6">
              <div className="text-4xl mb-4 text-blue-400">🎮</div>
              <p className="text-gray-300">Создайте игровую комнату и ждите, пока к вам присоединится соперник</p>
            </div>

            <divbutton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreate}
              disabled={loading || !authenticated}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 border ${
                authenticated && !loading
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-blue-500/25 border-blue-500/30'
                  : 'bg-gray-600 text-gray-400 border-gray-500/30 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <divdiv
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Создание игры...
                </div>
              ) : !authenticated ? (
                'WebSocket не подключен'
              ) : (
                'Создать игру'
              )}
            </divbutton>

            <divbutton
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/')}
              className="w-full py-3 text-gray-400 hover:text-gray-300 transition-colors border border-gray-600/30 rounded-xl hover:bg-gray-800/20"
            >
              ← Вернуться на главную
            </divbutton>
          </divdiv>
        ) : (
          <divdiv
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="space-y-6"
          >
            <div className="text-6xl mb-4 text-blue-400">✓</div>
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Игра создана!</h2>
            
            <div className="bg-blue-500/20 border border-blue-400 rounded-xl p-6">
              <p className="text-gray-300 mb-2">Переход в зал ожидания...</p>
              <divdiv
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-4xl text-blue-300"
              >
                ⏳
              </divdiv>
            </div>

            <div className="bg-slate-600/20 border border-slate-500/30 rounded-xl p-4">
              <p className="text-sm text-slate-200">
                Ждите присоединения соперника...
              </p>
            </div>

            {/* Game Events */}
            {gameEvents.length > 0 && (
              <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-4 max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-400 mb-2">События:</p>
                {gameEvents.slice(-3).map((event, index) => (
                  <p key={`create-event-${event.id}-${index}`} className="text-xs text-gray-300">
                    {event.message}
                  </p>
                ))}
              </div>
            )}
          </divdiv>
        )}
      </divdiv>
    </div>
  );
} 
