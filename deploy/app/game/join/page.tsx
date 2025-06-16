'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { useSocket } from '../../../lib/useSocket';

interface AvailableGame {
  id: string;
  code: string;
  player1: {
    id: string;
    name: string;
    wins: number;
  };
  createdAt: string;
}

export default function JoinGamePage() {
  const [availableGames, setAvailableGames] = useState<AvailableGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { connected, authenticated, joinGameByCode, currentGame, gameEvents } = useSocket(session?.user?.id);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Тихое обновление списка игр без визуальных индикаторов
  const updateAvailableGames = async (showInitialLoading = false) => {
    try {
      if (showInitialLoading) {
        setInitialLoading(true);
      }
      
      const response = await fetch('/api/game/available');
      const data = await response.json();
      
      if (response.ok) {
        // Сравниваем новые игры с текущими для умного обновления
        const newGames = data.games;
        setAvailableGames(prevGames => {
          // Создаем Set из ID текущих игр для быстрого поиска
          const currentGameIds = new Set(prevGames.map((game: AvailableGame) => game.id));
          const newGameIds = new Set(newGames.map((game: AvailableGame) => game.id));
          
          // Если списки одинаковые, не обновляем состояние
          if (currentGameIds.size === newGameIds.size && 
              [...currentGameIds].every(id => newGameIds.has(id))) {
            return prevGames;
          }
          
          return newGames;
        });
        setError(null);
      } else {
        setError(data.error || 'Ошибка загрузки игр');
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setError('Ошибка подключения к серверу');
    } finally {
      if (showInitialLoading) {
        setInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      // Первоначальная загрузка с отображением загрузки
      updateAvailableGames(true);
      
      // Тихо обновляем список каждые 3 секунды
      const interval = setInterval(() => updateAvailableGames(false), 3000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Отслеживаем присоединение к игре через WebSocket
  useEffect(() => {
    if (currentGame && currentGame.code) {
      console.log('Переход на страницу игры:', currentGame.code, 'статус:', currentGame.status);
      router.push(`/game/${currentGame.code}`);
    }
  }, [currentGame, router]);

  // Отслеживаем ошибки WebSocket
  useEffect(() => {
    if (gameEvents.length > 0) {
      const lastEvent = gameEvents[gameEvents.length - 1] as any;
      console.log('Получено событие:', lastEvent);
      if (lastEvent.message.includes('Ошибка:')) {
        setError(lastEvent.message.replace('Ошибка: ', ''));
        setJoiningGameId(null);
      }
    }
  }, [gameEvents]);

  const handleJoinGame = async (game: AvailableGame) => {
    if (!authenticated) {
      setError('WebSocket не подключен. Попробуйте позже.');
      return;
    }
    
    setJoiningGameId(game.id);
    setError(null);
    
    console.log('Попытка присоединения к игре:', game.code);
    joinGameByCode(game.code);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white p-4">
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

      <div className="container mx-auto max-w-4xl pt-8">
        <divdiv
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-slate-200 via-blue-300 to-blue-500 bg-clip-text text-transparent">
            Присоединиться к игре
          </h1>
          <p className="text-gray-300">Выберите игру из списка доступных</p>
        </divdiv>

        {/* Back Button */}
        <divdiv
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors border border-gray-600/30 rounded-lg hover:bg-gray-800/20"
          >
            ← Вернуться на главную
          </button>
        </divdiv>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <divdiv
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-900/40 border border-red-500/30 rounded-lg p-4 text-red-200 text-center mb-6"
            >
              {error}
            </divdiv>
          )}
        </AnimatePresence>

        {/* Initial Loading State */}
        {initialLoading && (
          <divdiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <divdiv
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3"
            />
            <span className="text-gray-300">Загрузка доступных игр...</span>
          </divdiv>
        )}

        {/* Available Games List */}
        {!initialLoading && (
          <divdiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {availableGames.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-2xl font-semibold mb-2 text-gray-300">Нет доступных игр</h3>
                <p className="text-gray-400 mb-6">В данный момент никто не ждет соперника</p>
                <button
                  onClick={() => router.push('/game/create')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-blue-500/25 transition-all duration-300"
                >
                  Создать свою игру
                </button>
              </div>
            ) : (
              <>
                <div className="text-center text-gray-400 mb-4">
                  Найдено игр: {availableGames.length}
                </div>
                <AnimatePresence mode="popLayout">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {availableGames.map((game, index) => (
                      <divdiv
                        key={game.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="bg-slate-800/40 border border-slate-600/40 backdrop-blur-sm rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-2xl">🎮</div>
                          <div className="text-sm text-gray-400">
                            {new Date(game.createdAt).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-white mb-2">
                            Игрок: {game.player1.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Побед: {game.player1.wins}</span>
                            <span>•</span>
                            <span>Код: {game.code}</span>
                          </div>
                        </div>

                        <divbutton
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleJoinGame(game)}
                          disabled={!authenticated || joiningGameId === game.id}
                          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                            joiningGameId === game.id
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : authenticated
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-blue-500/25'
                              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {joiningGameId === game.id ? (
                            <div className="flex items-center justify-center gap-2">
                              <divdiv
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                              />
                              Присоединение...
                            </div>
                          ) : !authenticated ? (
                            'WebSocket не подключен'
                          ) : (
                            'Присоединиться'
                          )}
                        </divbutton>
                      </divdiv>
                    ))}
                  </div>
                </AnimatePresence>
              </>
            )}
          </divdiv>
        )}
      </div>
    </div>
  );
} 
