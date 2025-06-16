'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
// import { motion, AnimatePresence } from 'framer-motion';
import { useSocketContext } from '../../../lib/socket-context';

interface Game {
  id: string;
  code: string;
  player1Name: string;
  player1Wins: number;
  createdAt: string;
}

export default function JoinGame() {
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { joinGameByCode, connected } = useSocketContext();

  const fetchAvailableGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/game/available');
      if (response.ok) {
        const games = await response.json();
        // API теперь возвращает массив напрямую
        setAvailableGames(Array.isArray(games) ? games : []);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Ошибка получения игр:', error);
      setError('Не удалось загрузить список игр');
      setAvailableGames([]); // Устанавливаем пустой массив при ошибке
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableGames();
    const interval = setInterval(fetchAvailableGames, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinGame = async (gameCode: string) => {
    if (!connected || joining) return;
    
    setJoining(gameCode);
    try {
      await joinGameByCode(gameCode);
      router.push(`/game/${gameCode}`);
    } catch (error) {
      console.error('Ошибка присоединения:', error);
      setJoining(null);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Требуется авторизация</h1>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
            Присоединиться к игре
          </h1>
          <p className="text-gray-400">
            Выберите игру из списка ожидающих противника
          </p>
        </div>

        {/* Connection Status */}
        <div className="text-center mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-3 h-3 rounded-full mr-2 ${
              connected ? 'bg-green-400' : 'bg-red-400'
            }`} />
            {connected ? 'Подключено к серверу' : 'Отключено от сервера'}
          </div>
        </div>

        {/* Games List */}
        <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Загружаем доступные игры...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 text-red-500">⚠️</div>
              <h3 className="text-xl font-semibold mb-2 text-red-400">Ошибка загрузки</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={fetchAvailableGames}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:bg-blue-800 transition-all duration-300 hover:scale-105"
              >
                Попробовать снова
              </button>
            </div>
          ) : availableGames.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 text-gray-500">🎮</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-300">Нет доступных игр</h3>
              <p className="text-gray-400 mb-6">
                В данный момент нет игр, ожидающих игроков
              </p>
              <button
                onClick={() => router.push('/game/create')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:bg-blue-800 transition-all duration-300 hover:scale-105"
              >
                Создать игру
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4 text-center">
                Доступные игры ({availableGames.length})
              </h3>
              
              {availableGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-slate-700/40 border border-slate-600/40 rounded-lg p-4 hover:bg-slate-700/60 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {game.player1Name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg text-white">
                            {game.player1Name}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Побед: {game.player1Wins}</span>
                            <span>•</span>
                            <span>
                              Создана: {new Date(game.createdAt).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinGame(game.code)}
                      disabled={!connected || joining === game.code}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                        connected && joining !== game.code
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-green-500/25 hover:scale-105'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {joining === game.code ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Подключение...
                        </div>
                      ) : (
                        'Присоединиться'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 text-gray-400 hover:text-gray-300 transition-colors border border-gray-600/30 rounded-xl hover:bg-gray-800/20"
          >
            Назад на главную
          </button>
        </div>
      </div>
    </div>
  );
} 