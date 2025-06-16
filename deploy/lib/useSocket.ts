import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameEvent, GameSession, Player, SocketHookReturn } from './types';

export function useSocket(userId?: string): SocketHookReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<Player | null>(null);
  const [currentGame, setCurrentGame] = useState<GameSession | null>(null);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Определяем URL WebSocket сервера
    const isProduction = process.env.NODE_ENV === 'production';
    const websocketUrl = isProduction 
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
      : 'http://localhost:3001';

    // Создаем подключение к WebSocket серверу
    const newSocket = io(websocketUrl, {
      transports: ['websocket'],
      autoConnect: true
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Обработчики подключения
    newSocket.on('connect', () => {
      console.log('🔌 Connected to game server');
      setConnected(true);
      
      // Аутентифицируемся
      newSocket.emit('authenticate', { userId });
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from game server');
      setConnected(false);
      setAuthenticated(false);
      
      // Очищаем heartbeat при отключении
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    });

    newSocket.on('authenticated', (data: { user: Player }) => {
      console.log('👤 Authenticated:', data.user);
      setAuthenticated(true);
      setUser(data.user);
      
      // Запускаем heartbeat после аутентификации
      startHeartbeat(newSocket);
    });

    // Heartbeat acknowledgment
    newSocket.on('heartbeat_ack', () => {
      // Heartbeat подтвержден сервером
      // console.log('💓 Heartbeat acknowledged');
    });

    // Игровые события
    newSocket.on('gameCreated', (data: { code: string; game: GameSession }) => {
      console.log('🎮 Game created:', data);
      setCurrentGame(data.game);
      addGameEvent(`Игра ${data.code} создана!`);
    });

    newSocket.on('gameUpdated', (game: GameSession) => {
      console.log('🎮 Game updated:', game);
      console.log('🎮 Game status:', game?.status);
      console.log('🎮 Player1:', game?.player1?.name);
      console.log('🎮 Player2:', game?.player2?.name);
      setCurrentGame(game);
    });

    newSocket.on('gameStarted', (data: { message: string }) => {
      console.log('🎮 Game started:', data);
      addGameEvent(data.message);
    });

    newSocket.on('moveReceived', (data: { player: string; move: number }) => {
      console.log('🎯 Move received:', data);
      addGameEvent(`${data.player === 'player1' ? 'Игрок 1' : 'Игрок 2'} сделал ход: ${data.move}`);
    });

    newSocket.on('roundResult', (data: { ballPosition: number; balance1: number; balance2: number }) => {
      console.log('🏁 Round result:', data);
      addGameEvent(`Раунд завершен! Позиция мяча: ${data.ballPosition}`);
      addGameEvent(`Баланс 1: ${data.balance1}, Баланс 2: ${data.balance2}`);
    });

    newSocket.on('gameFinished', (data: { winner?: Player }) => {
      console.log('🏆 Game finished:', data);
      addGameEvent(`Игра завершена! Победитель: ${data.winner?.name || 'Ничья'}`);
    });

    newSocket.on('error', (error: any) => {
      console.log('❌ Socket error received:', error);
      
      // Проверяем, что это реальная ошибка, а не пустой объект
      if (error && (error.message || Object.keys(error).length > 0)) {
        const errorMessage = typeof error === 'object' && error?.message ? error.message : 'Unknown error';
        console.log('📝 Adding error event:', errorMessage);
        addGameEvent(`Ошибка: ${errorMessage}`);
      } else {
        console.log('❓ Ignoring empty error event');
      }
    });

    // Обработчик ошибок подключения
    newSocket.on('connect_error', (error: any) => {
      console.error('❌ Connection error:', error);
      addGameEvent(`Ошибка подключения: ${error.message || 'Connection failed'}`);
    });

    // Cleanup при размонтировании
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      newSocket.close();
    };
  }, [userId]);

  // Запуск heartbeat
  const startHeartbeat = (socket: Socket) => {
    // Очищаем предыдущий интервал если есть
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    // Отправляем heartbeat каждую минуту
    heartbeatIntervalRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat');
      }
    }, 60 * 1000); // 60 секунд
    
    console.log('💓 Heartbeat started');
  };

  const addGameEvent = (message: string) => {
    setGameEvents(prev => [...prev, {
      id: Date.now() + Math.random(),
      message,
      timestamp: new Date()
    }]);
  };

  const createGame = () => {
    if (socket && authenticated) {
      socket.emit('createGame');
    }
  };

  const joinGame = (code: string) => {
    if (socket && authenticated) {
      socket.emit('joinGame', { code });
    }
  };

  const joinGameByCode = (code: string) => {
    if (socket && authenticated) {
      socket.emit('joinGame', { code });
    }
  };

  const makeMove = (code: string, move: number) => {
    if (socket && authenticated) {
      socket.emit('makeMove', { code, move });
    }
  };

  const clearEvents = () => {
    setGameEvents([]);
  };

  return {
    socket,
    connected,
    authenticated,
    user,
    currentGame,
    gameEvents,
    createGame,
    joinGame,
    joinGameByCode,
    makeMove,
    clearEvents
  };
} 