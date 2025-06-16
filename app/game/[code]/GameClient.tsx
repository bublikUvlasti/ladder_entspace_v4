'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
// import { motion, AnimatePresence } from 'framer-motion';
import { useSocketContext } from '@/lib/socket-context';
import { GameEvent, GameSession } from '@/lib/types';

interface GameClientProps {
  code: string;
}

interface Player {
  id: string;
  name: string;
  fullName?: string;
  balance: number;
  isReady: boolean;
}

export default function GameClient({ code }: GameClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stones, setStones] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const { 
    connected, 
    authenticated, 
    currentGame, 
    gameEvents, 
    makeMove,
    joinGame,
    setCurrentGame
  } = useSocketContext();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Автоматически присоединяемся к игре при загрузке (только если еще не в игре)
  useEffect(() => {
    if (authenticated && code && !gameLoaded) {
      // Если у нас уже есть текущая игра с тем же кодом, не присоединяемся повторно
      if (currentGame && currentGame.code === code) {
        setGameLoaded(true);
        return;
      }
      
      // Если игры нет или код другой, присоединяемся
      console.log('🎮 GameClient joining game:', code);
      joinGame(code);
      setGameLoaded(true);
    }
  }, [authenticated, code, currentGame, joinGame, gameLoaded]);

  // Отслеживаем ошибки из WebSocket событий
  useEffect(() => {
    if (gameEvents.length > 0) {
      const lastEvent = gameEvents[gameEvents.length - 1] as GameEvent;
      if (lastEvent.message.includes('Ошибка:')) {
        setError(lastEvent.message.replace('Ошибка: ', ''));
        setTimeout(() => setError(null), 5000);
      }
    }
  }, [gameEvents]);

  // Отслеживаем изменения currentGame
  useEffect(() => {
    console.log('🎮 GameClient - currentGame changed:', {
      game: currentGame,
      status: currentGame?.status,
      winner: currentGame?.winner,
      hasGame: !!currentGame
    });
  }, [currentGame]);

  // Добавляем эффект для автоматического перехода после завершения игры
  useEffect(() => {
    console.log('🎯 GameClient useEffect - checking game status:', {
      status: currentGame?.status,
      countdown: countdown,
      hasWinner: !!currentGame?.winner,
      currentGame: currentGame,
      gameId: currentGame?.id,
      gameCode: currentGame?.code
    });
    
    // Детальная проверка условий
    const gameStatus = currentGame?.status;
    const isFinished = gameStatus === 'FINISHED';
    const countdownIsNull = countdown === null;
    const shouldStartCountdown = isFinished && countdownIsNull;
    
    console.log('🎯 Detailed condition check:', {
      gameStatus,
      isFinished,
      countdownIsNull,
      shouldStartCountdown,
      gameStatusType: typeof gameStatus,
      gameStatusValue: JSON.stringify(gameStatus),
      countdownType: typeof countdown,
      countdownValue: JSON.stringify(countdown)
    });
    
    if (shouldStartCountdown) {
      console.log('🎯 Starting countdown for finished game');
      console.log('🎯 Game details:', {
        id: currentGame.id,
        code: currentGame.code,
        status: currentGame.status,
        winner: currentGame.winner,
        player1: currentGame.player1,
        player2: currentGame.player2
      });
      
      setCountdown(7);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          console.log('🎯 Countdown tick:', prev);
          if (prev === null || prev <= 1) {
            console.log('🎯 Countdown finished, redirecting to home');
            clearInterval(timer);
            // Очищаем состояние игры и переходим на главную
            setCurrentGame(null);
            router.push('/');
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        console.log('🎯 Cleaning up countdown timer');
        clearInterval(timer);
      };
    } else {
      console.log('🎯 Not starting countdown because:', {
        gameStatus: currentGame?.status,
        isFinished: currentGame?.status === 'FINISHED',
        countdownIsNull: countdown === null,
        shouldStart: currentGame?.status === 'FINISHED' && countdown === null,
        gameExists: !!currentGame
      });
    }
  }, [currentGame?.status, countdown, setCurrentGame, router, currentGame]);

  // Сброс таймера при изменении игры
  useEffect(() => {
    console.log('🎯 GameClient useEffect - game status changed:', currentGame?.status);
    if (currentGame?.status !== 'FINISHED') {
      if (countdown !== null) {
        console.log('🎯 Resetting countdown because game is not finished');
        setCountdown(null);
      }
    }
  }, [currentGame?.status, countdown]);

  const handleMove = async () => {
    if (!currentGame || !session?.user?.id || !authenticated) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      makeMove(code, stones);
      setStones(1);
    } catch {
      setError('Ошибка при отправке хода');
    } finally {
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Загрузка игры...</p>
        </div>
      </div>
    );
  }

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

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black">
        <div className="text-center text-white">
          <p className="text-red-400 text-xl mb-4">WebSocket не подключен</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  if (!currentGame) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Загрузка игры...</p>
        </div>
      </div>
    );
  }

  const game = currentGame;
  const isPlayer1 = game.player1Id === session.user.id;
  const isPlayer2 = game.player2Id === session.user.id;
  const isMyTurn = (isPlayer1 && !game.move1) || (isPlayer2 && !game.move2);
  const canMove = game.status === 'IN_PROGRESS' && isMyTurn && !isSubmitting;

  const myBalance = isPlayer1 ? game.balance1 : game.balance2;
  const opponentBalance = isPlayer1 ? game.balance2 : game.balance1;

  // Проверяем, является ли текущий пользователь победителем
  const isWinner = game.status === 'FINISHED' && game.winner && 
    ((game.winner as any).id === session.user.id);

  // Calculate stone position percentage for animation (позиции: -2 до +2)
  // Преобразуем диапазон -2..+2 в проценты 0..100, но с точным позиционированием по маркерам
  const stonePositionMap: Record<string, number> = {
    '-2': 0,    // Левый край (0%)
    '-1': 25,   // 25% от левого края
    '0': 50,    // Центр (50%)
    '1': 75,    // 75% от левого края
    '2': 100,   // Правый край (100%)
  };
  
  // Используем точные позиции из карты вместо процентного расчета
  const stonePositionPercent = stonePositionMap[game.ballPosition.toString()] || 50;
  
  // Debug info
  console.log('🎯 Ball position:', game.ballPosition, 'Percent:', stonePositionPercent);

  // Если игра завершена и текущий пользователь победил - показываем большое зеленое окно
  if (game.status === 'FINISHED' && isWinner) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/30 border-2 border-green-400/50 rounded-3xl p-8 max-w-md w-full mx-4 text-center backdrop-blur-md shadow-2xl">
          {/* Иконка победы */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Заголовок */}
          <h1 className="text-4xl font-bold text-green-400 mb-4">
            🎉 Вы победили! 🎉
          </h1>

          {/* Подзаголовок */}
          <p className="text-xl text-white mb-6">
            Поздравляем с победой в игре!
          </p>

          {/* Информация об игре */}
          <div className="bg-black/20 rounded-xl p-4 mb-6">
            <p className="text-gray-300 mb-2">Код игры: <span className="text-white font-bold">{game.code}</span></p>
            <p className="text-gray-300">Ваши камешки: <span className="text-white font-bold">{myBalance}</span></p>
          </div>

          {/* Countdown */}
          {countdown !== null && (
            <p className="text-sm text-gray-300 mb-6">
              Автоматический переход через {countdown} сек.
            </p>
          )}

          {/* Кнопка перехода в главное меню */}
          <button
            onClick={() => {
              setCurrentGame(null);
              router.push('/');
            }}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-blue-500/25 hover:scale-105"
          >
            Перейти в главное меню
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
            Скифская Лестница
          </h1>
          <p className="text-gray-400">Код игры: {game.code}</p>
          
          {/* Connection Status */}
          <div className="mt-2">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                connected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {connected ? 'Подключено' : 'Отключено'}
            </div>
          </div>
        </div>

        {/* Game Status */}
        <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 mb-6 backdrop-blur-sm">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">
              {game.status === 'WAITING' && 'Ожидание второго игрока'}
              {game.status === 'IN_PROGRESS' && 'Игра в процессе'}
              {game.status === 'FINISHED' && 'Игра завершена'}
            </h2>

            {/* Результат игры для проигравшего или наблюдателя */}
            {game.status === 'FINISHED' && game.winner && !isWinner && (
              <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-xl font-bold text-red-400 mb-4">
                  Победитель: {(game.winner as any).fullName || game.winner.name}
                </p>
                <p className="text-gray-300 mb-4">
                  К сожалению, в этот раз удача была не на вашей стороне.
                </p>
                {countdown !== null && (
                  <p className="text-sm text-gray-300 mb-3">
                    Автоматический переход на главную через {countdown} сек.
                  </p>
                )}
                <button
                  onClick={() => {
                    setCurrentGame(null);
                    router.push('/');
                  }}
                  className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Выйти в главное меню сейчас
                </button>
              </div>
            )}

            {/* Ничья */}
            {game.status === 'FINISHED' && !game.winner && (
              <div className="bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 rounded-lg p-4 mb-4">
                <p className="text-xl font-bold text-gray-400 mb-4">
                  Игра завершена - Ничья!
                </p>
                {countdown !== null && (
                  <p className="text-sm text-gray-300 mb-3">
                    Автоматический переход на главную через {countdown} сек.
                  </p>
                )}
                <button
                  onClick={() => {
                    setCurrentGame(null);
                    router.push('/');
                  }}
                  className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Выйти в главное меню сейчас
                </button>
              </div>
            )}
          </div>

          {/* Players Info */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Left Player */}
            <div className={`text-center p-4 rounded-lg border-2 ${
              isPlayer1 ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-700/20'
            }`}>
              <div className="text-lg font-bold text-blue-400 mb-2">
                Левый игрок {isPlayer1 ? '(Вы)' : ''}
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                {game.player1?.name || 'Ожидание...'}
              </div>
              <div className="text-gray-300">
                Камешки: <span className="font-bold text-white">{game.balance1}</span>
              </div>
              {/* Показываем ход только если это мой ход или если оба игрока уже сделали ходы */}
              {game.move1 && (isPlayer1 || (game.move1 && game.move2)) && (
                <div className="mt-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  Поставил: {game.move1}
                </div>
              )}
              {/* Показываем что игрок сделал ход, но не показываем количество */}
              {game.move1 && !isPlayer1 && !(game.move1 && game.move2) && (
                <div className="mt-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  Ход сделан
                </div>
              )}
              {game.status === 'IN_PROGRESS' && isPlayer1 && !game.move1 && (
                <div className="mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm animate-pulse">
                  Ваш ход
                </div>
              )}
            </div>

            {/* Right Player */}
            <div className={`text-center p-4 rounded-lg border-2 ${
              isPlayer2 ? 'border-green-500 bg-green-500/10' : 'border-slate-600 bg-slate-700/20'
            }`}>
              <div className="text-lg font-bold text-green-400 mb-2">
                Правый игрок {isPlayer2 ? '(Вы)' : ''}
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                {game.player2?.name || 'Ожидание...'}
              </div>
              <div className="text-gray-300">
                Камешки: <span className="font-bold text-white">{game.balance2}</span>
              </div>
              {/* Показываем ход только если это мой ход или если оба игрока уже сделали ходы */}
              {game.move2 && (isPlayer2 || (game.move1 && game.move2)) && (
                <div className="mt-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  Поставил: {game.move2}
                </div>
              )}
              {/* Показываем что игрок сделал ход, но не показываем количество */}
              {game.move2 && !isPlayer2 && !(game.move1 && game.move2) && (
                <div className="mt-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  Ход сделан
                </div>
              )}
              {game.status === 'IN_PROGRESS' && isPlayer2 && !game.move2 && (
                <div className="mt-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm animate-pulse">
                  Ваш ход
                </div>
              )}
            </div>
          </div>

          {/* Big Stone Position */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-white mb-2">Большой камень</h3>
              <p className="text-lg text-gray-300">Позиция: <span className="font-bold text-white">{game.ballPosition}</span></p>
            </div>
            
            {/* Stone Track */}
            <div className="relative w-full max-w-2xl mx-auto bg-gray-700 h-16 rounded-full border border-gray-600">
              {/* Position markers */}
              <div className="absolute inset-0 flex items-center justify-between px-8">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">-2</div>
                  <div className="text-xs text-gray-400 mt-1">Левый</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-300">-1</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-300">0</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-300">1</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">2</div>
                  <div className="text-xs text-gray-400 mt-1">Правый</div>
                </div>
              </div>
              
              {/* Big Stone */}
              <div
                className="absolute top-1/2 w-12 h-12 bg-blue-500 rounded-full shadow-lg transform -translate-y-1/2 border-2 border-blue-400 game-ball"
                style={{ 
                  left: `${stonePositionPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
              </div>
            </div>
          </div>
        </div>

        {/* Move Input */}
        {game.status === 'IN_PROGRESS' && canMove && (
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 mb-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4 text-center">Ваш ход</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Сколько камешков поставить? (1-{Math.min(48, myBalance)})
                </label>
                
                {/* Input field and slider container */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <input
                      type="range"
                      min={1}
                      max={Math.min(48, myBalance)}
                      value={stones}
                      onChange={(e) => setStones(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min={1}
                      max={Math.min(48, myBalance)}
                      value={stones}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const clampedValue = Math.max(1, Math.min(Math.min(48, myBalance), value));
                        setStones(clampedValue);
                      }}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-400">
                  <span>1</span>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">{stones}</div>
                    <div className="text-xs">камешков</div>
                  </div>
                  <span>{Math.min(48, myBalance)}</span>
                </div>
              </div>

              <button
                onClick={handleMove}
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  isSubmitting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-blue-500/25 hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Ставлю камешки...
                  </div>
                ) : (
                  `Поставить ${stones} камешков`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Waiting Message */}
        {game.status === 'IN_PROGRESS' && !canMove && (
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 mb-6 backdrop-blur-sm text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {!isPlayer1 && !isPlayer2 && 'Наблюдаем за игрой...'}
              {isPlayer1 && game.move1 && 'Ждем хода правого игрока...'}
              {isPlayer2 && game.move2 && 'Ждем хода левого игрока...'}
              {(game.move1 && game.move2) && 'Обрабатываем ходы...'}
            </p>
          </div>
        )}

        {/* Game Rules */}
        {game.status === 'WAITING' && (
          <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 mb-6 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-4 text-center">Правила игры</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <p>• Каждый игрок начинает с 50 камешков</p>
                <p>• В каждом раунде ставьте от 1 до 48 камешков</p>
                <p>• Кто поставил больше - к тому двигается большой камень</p>
              </div>
              <div>
                <p>• Большой камень стартует в позиции 0</p>
                <p>• Левый игрок побеждает при позиции -2</p>
                <p>• Правый игрок побеждает при позиции +2</p>
              </div>
            </div>
          </div>
        )}

        {/* Game Events */}
        {gameEvents.length > 0 && (
          <div className="bg-slate-800/40 border border-slate-600/40 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 text-slate-100">События игры</h3>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {gameEvents.slice(-8).map((event, index) => {
                const gameEvent = event as GameEvent;
                return (
                  <p key={`event-${gameEvent.id}-${index}`} className="text-sm text-gray-300 p-2 bg-slate-700/30 rounded">
                    <span className="text-gray-500 text-xs">
                      {new Date(gameEvent.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="ml-2">{gameEvent.message}</span>
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-red-800 border border-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
            Ошибка: {error}
          </div>
        )}
      </div>
    </div>
  );
}