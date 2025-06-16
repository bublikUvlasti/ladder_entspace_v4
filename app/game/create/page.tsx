'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
// import { motion } from 'framer-motion';
import { useSocketContext } from '../../../lib/socket-context';

export default function CreateGame() {
  const { data: session } = useSession();
  const router = useRouter();
  const { createGame, currentGame, connected, setCurrentGame } = useSocketContext();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    console.log('🎮 CreateGame useEffect - currentGame changed:', currentGame);
    // Перенаправляем только если игра активна (не завершена)
    if (currentGame && currentGame.code && currentGame.status !== 'FINISHED') {
      console.log('🎮 Redirecting to active game:', currentGame.code);
      setIsCreating(false);
      // Используем replace вместо push для более плавного перехода
      router.replace(`/game/${currentGame.code}`);
    }
  }, [currentGame, router]);

  const handleCreateGame = async () => {
    console.log('🎮 handleCreateGame called');
    console.log('🎮 Connected:', connected);
    console.log('🎮 isCreating:', isCreating);
    
    if (!connected || isCreating) {
      console.log('❌ Cannot create game - not connected or already creating');
      return;
    }
    
    // Очищаем только завершенные игры перед созданием новой
    if (currentGame && currentGame.status === 'FINISHED') {
      console.log('🧹 Clearing finished game state before creating new game');
      setCurrentGame(null);
    }
    
    setIsCreating(true);
    console.log('🎮 Set isCreating to true');
    
    try {
      console.log('🎮 Calling createGame...');
      createGame();
      console.log('🎮 createGame called successfully');
      
      // Добавляем таймаут для сброса состояния загрузки в случае проблем
      setTimeout(() => {
        console.log('🎮 Timeout reached, checking if still creating...');
        if (isCreating && !currentGame) {
          console.log('❌ Game creation timeout - resetting state');
          setIsCreating(false);
        }
      }, 10000); // 10 секунд таймаут
      
    } catch (error) {
      console.error('❌ Ошибка создания игры:', error);
      setIsCreating(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
            Создание игры
          </h1>
          <p className="text-gray-400">
            Нажмите кнопку ниже, чтобы создать новую игру
          </p>
        </div>

        <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm space-y-6">
          {/* Game Info */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">Настройки игры</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>• Каждый игрок начинает с 50 камешков</p>
              <p>• Можно ставить от 1 до 48 камешков за ход</p>
              <p>• Победа при достижении большим камнем края (-2 или +2)</p>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateGame}
            disabled={!connected || isCreating}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300 border ${
              connected && !isCreating
                ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:shadow-blue-500/25 border-blue-500/30 hover:scale-105' 
                : 'bg-gray-600 text-gray-400 border-gray-500/30 cursor-not-allowed'
            }`}
          >
            {isCreating ? (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Создание игры...
              </div>
            ) : (
              'Создать игру'
            )}
          </button>

          {/* Connection Status */}
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                connected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {connected ? 'Подключено к серверу' : 'Отключено от сервера'}
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 text-gray-400 hover:text-gray-300 transition-colors text-center border border-gray-600/30 rounded-xl hover:bg-gray-800/20"
          >
            Назад на главную
          </button>
        </div>
      </div>
    </div>
  );
} 