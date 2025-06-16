'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../../lib/useSocket';
import type { GameSession, GameEvent } from '../../../lib/types';

export default function GameClient({ code }: { code: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [stones, setStones] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  
  const { 
    connected, 
    authenticated, 
    currentGame, 
    gameEvents, 
    makeMove,
    joinGame 
  } = useSocket(session?.user?.id);

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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!session) {
    return null;
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
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-xl mb-4">Загрузка игры...</p>
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

  const game = currentGame as GameSession;
  const isPlayer1 = game.player1Id === session.user.id;
  const isPlayer2 = game.player2Id === session.user.id;
  const isMyTurn = (isPlayer1 && !game.move1) || (isPlayer2 && !game.move2);
  const canMove = game.status === 'IN_PROGRESS' && isMyTurn && !isSubmitting;

  const opponent = isPlayer1 ? game.player2 : game.player1;
  const myBalance = isPlayer1 ? game.balance1 : game.balance2;

  // Calculate stone position percentage for animation (позиции: -2 до +2)
  // Преобразуем диапазон -2..+2 в проценты 0..100
  const stonePositionPercent = ((game.ballPosition + 2) / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header with connection status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-slate-200 to-white bg-clip-text text-transparent">
            Скифская лестница
          </h1>
          <p className="text-lg text-gray-300">Код игры: {code}</p>
          
          {/* WebSocket connection status */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${
              connected && authenticated ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-sm text-gray-400">
              {connected && authenticated ? 'Подключено' : 'Отключено'}
            </span>
          </div>
        </motion.div>

        {/* Game Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          {game.status === 'WAITING' && (
            <div className="bg-blue-500/20 border border-blue-400 rounded-lg p-4">
              <p className="text-blue-200 text-lg">Ожидание второго игрока...</p>
              <p className="text-blue-300 text-sm mt-2">Поделитесь кодом игры: <span className="font-mono font-bold">{code}</span></p>
            </div>
          )}
          
          {game.status === 'IN_PROGRESS' && (
            <div className="bg-slate-600/30 border border-slate-400 rounded-lg p-4">
              <p className="text-slate-200 text-lg">
                {isMyTurn ? 'Ваш ход!' : `Ход ${opponent?.name}`}
              </p>
            </div>
          )}
          
          {game.status === 'FINISHED' && (
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className={`${
                game.winner?.id === session.user.id 
                  ? 'bg-green-500/20 border-green-400' 
                  : game.winner
                  ? 'bg-red-500/20 border-red-400'
                  : 'bg-gray-600/20 border-gray-400'
              } border rounded-lg p-6`}
            >
              <h2 className="text-2xl font-bold mb-2 text-white">
                {game.winner?.id === session.user.id ? '🏆 Вы победили!' : 
                 game.winner ? `${game.winner.name} победил!` : 'Ничья!'}
              </h2>
              <p className="text-gray-300 mb-4">
                Финальная позиция камня: {game.ballPosition}
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition border border-blue-500/30"
              >
                Вернуться на главную
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Players Info */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className={`bg-slate-800/40 border border-slate-600/40 rounded-lg p-6 ${isPlayer1 ? 'ring-2 ring-blue-400' : ''}`}
          >
            <h3 className="text-xl font-bold mb-2 text-slate-100">{game.player1.name}</h3>
            <p className="text-gray-300">Побед: {game.player1.wins}</p>
            <p className="text-gray-300">Баланс: {game.balance1}</p>
            {game.move1 && isPlayer1 && (
              <p className="text-blue-400 font-semibold">Поставил: {game.move1}</p>
            )}
            {game.move1 && !isPlayer1 && (
              <p className="text-blue-400 font-semibold">Ход сделан</p>
            )}
            {isPlayer1 && (
              <p className="text-blue-300 text-sm mt-2">👤 Вы</p>
            )}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className={`bg-slate-800/40 border border-slate-600/40 rounded-lg p-6 ${isPlayer2 ? 'ring-2 ring-slate-400' : ''}`}
          >
            {game.player2 ? (
              <>
                <h3 className="text-xl font-bold mb-2 text-slate-100">{game.player2.name}</h3>
                <p className="text-gray-300">Побед: {game.player2.wins}</p>
                <p className="text-gray-300">Баланс: {game.balance2}</p>
                {game.move2 && isPlayer2 && (
                  <p className="text-slate-300 font-semibold">Поставил: {game.move2}</p>
                )}
                {game.move2 && !isPlayer2 && (
                  <p className="text-slate-300 font-semibold">Ход сделан</p>
                )}
                {isPlayer2 && (
                  <p className="text-slate-300 text-sm mt-2">👤 Вы</p>
                )}
              </>
            ) : (
              <p className="text-gray-400">Ожидание игрока...</p>
            )}
          </motion.div>
        </div>

        {/* Game Board */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/40 border border-slate-600/40 rounded-lg p-6 mb-8"
        >
          <h3 className="text-xl font-bold text-center mb-6 text-slate-100">Позиция камня</h3>
          
          {/* Scale */}
          <div className="relative bg-slate-600 h-12 rounded-full mb-4 border border-slate-500/30">
            <div className="absolute inset-0 flex items-center justify-between px-4">
              <span className="text-sm font-bold text-white drop-shadow-sm">-2</span>
              <span className="text-sm font-bold text-white drop-shadow-sm">-1</span>
              <span className="text-sm font-bold text-white drop-shadow-sm">0</span>
              <span className="text-sm font-bold text-white drop-shadow-sm">1</span>
              <span className="text-sm font-bold text-white drop-shadow-sm">2</span>
            </div>
            
            {/* Stone */}
            <motion.div
              animate={{ left: `${stonePositionPercent}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute top-1/2 w-8 h-8 bg-white rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 flex items-center justify-center border-2 border-gray-300"
            >
              ⚫
            </motion.div>
          </div>
          
          <p className="text-center text-lg text-slate-200">
            Позиция: <span className="font-bold text-white">{game.ballPosition}</span>
          </p>
          <p className="text-center text-sm text-gray-400 mt-2">
            Левый игрок толкает к -2, правый игрок толкает к +2
          </p>
        </motion.div>

        {/* Move Input */}
        {game.status === 'IN_PROGRESS' && (isPlayer1 || isPlayer2) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/40 border border-slate-600/40 rounded-lg p-6"
          >
            {canMove ? (
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4 text-slate-100">Ваш ход</h3>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <label className="text-lg text-slate-200">Камней (1-{Math.min(48, myBalance)}):</label>
                  <input
                    type="number"
                    min={1}
                    max={Math.min(48, myBalance)}
                    value={stones}
                    onChange={(e) => setStones(Math.max(1, Math.min(Math.min(48, myBalance), Number(e.target.value))))}
                    className="w-20 px-3 py-2 bg-slate-700/60 border border-slate-500/50 rounded-lg text-center text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleMove}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 border border-blue-500/30"
                >
                  {isSubmitting ? 'Ставлю...' : 'Поставить камни'}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg text-gray-300">
                  {game.move1 && game.move2 
                    ? 'Ожидание обработки хода...' 
                    : 'Ожидание хода противника...'}
                </p>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-slate-400/30 border-t-slate-200 rounded-full mx-auto mt-4"
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Game Events */}
        {gameEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-slate-800/40 border border-slate-600/40 rounded-lg p-6"
          >
            <h3 className="text-lg font-bold mb-4 text-slate-100">События игры</h3>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {gameEvents.slice(-5).map((event, index) => {
                const gameEvent = event as GameEvent;
                return (
                  <p key={`event-${gameEvent.id}-${index}`} className="text-sm text-gray-300">
                    <span className="text-gray-500">
                      {new Date(gameEvent.timestamp).toLocaleTimeString()}
                    </span>
                    {' '}{gameEvent.message}
                  </p>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-4 right-4 bg-red-800 border border-red-600 text-white px-6 py-3 rounded-lg shadow-lg"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 