'use client';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameEvent, GameSession, Player } from './types';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  authenticated: boolean;
  user: Player | null;
  currentGame: GameSession | null;
  gameEvents: GameEvent[];
  createGame: () => void;
  joinGame: (code: string) => void;
  joinGameByCode: (code: string) => void;
  makeMove: (code: string, move: number) => void;
  clearEvents: () => void;
  setCurrentGame: (game: GameSession | null) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children, userId }: { children: React.ReactNode; userId?: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<Player | null>(null);
  const [currentGame, setCurrentGame] = useState<GameSession | null>(null);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) {
      // Если нет userId, очищаем соединение
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
        setAuthenticated(false);
        setUser(null);
      }
      return;
    }

    // Если уже есть соединение для этого пользователя, не создаем новое
    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    // Определяем URL WebSocket сервера
    const isProduction = process.env.NODE_ENV === 'production';
    const websocketUrl = isProduction 
      ? `${window.location.protocol}//${window.location.host}`
      : 'http://localhost:3001';

    console.log('🔧 SocketProvider connecting to:', websocketUrl);
    console.log('🔧 Environment:', process.env.NODE_ENV);
    console.log('🔧 Is production:', isProduction);

    // Создаем подключение к WebSocket серверу
    const newSocket = io(websocketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: false, // Не форсируем новое соединение
      timeout: 20000
    });

    console.log('🔧 SocketProvider instance created');

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Обработчики подключения
    newSocket.on('connect', () => {
      console.log('🔌 SocketProvider connected to game server');
      setConnected(true);
      
      // Аутентифицируемся
      newSocket.emit('authenticate', { userId });
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 SocketProvider disconnected from game server');
      setConnected(false);
      setAuthenticated(false);
      
      // Очищаем heartbeat при отключении
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    });

    newSocket.on('authenticated', (data: { user: Player }) => {
      console.log('👤 SocketProvider authenticated:', data.user);
      setAuthenticated(true);
      setUser(data.user);
      
      // Запускаем heartbeat после аутентификации
      startHeartbeat(newSocket);
    });

    // Heartbeat acknowledgment
    newSocket.on('heartbeat_ack', () => {
      // Heartbeat подтвержден сервером
    });

    // Игровые события
    newSocket.on('gameCreated', (data: { code: string; game: GameSession }) => {
      console.log('🎮 SocketProvider game created event received:', data);
      setCurrentGame(data.game);
      addGameEvent(`Игра ${data.code} создана!`);
    });

    newSocket.on('gameUpdated', (game: GameSession) => {
      console.log('🎮 SocketProvider game updated:', game);
      console.log('🎮 Game status:', game.status, 'Winner:', game.winner);
      setCurrentGame(game);
    });

    newSocket.on('gameStarted', (data: { message: string }) => {
      console.log('🎮 SocketProvider game started:', data);
      addGameEvent(data.message);
    });

    newSocket.on('moveReceived', (data: { player: string; move: number }) => {
      console.log('🎯 SocketProvider move received:', data);
      addGameEvent(`${data.player === 'player1' ? 'Игрок 1' : 'Игрок 2'} сделал ход: ${data.move}`);
    });

    newSocket.on('roundResult', (data: { ballPosition: number; balance1: number; balance2: number }) => {
      console.log('🏁 SocketProvider round result:', data);
      addGameEvent(`Раунд завершен! Позиция мяча: ${data.ballPosition}`);
      addGameEvent(`Баланс 1: ${data.balance1}, Баланс 2: ${data.balance2}`);
    });

    newSocket.on('gameFinished', (data: { winner?: Player }) => {
      console.log('🏆 SocketProvider game finished:', data);
      console.log('🏆 Current game before finish:', currentGame);
      addGameEvent(`Игра завершена! Победитель: ${data.winner?.name || 'Ничья'}`);
      
      // НЕ очищаем currentGame автоматически - пусть компонент сам управляет переходом
      // Это предотвращает бесконечную загрузку
      console.log('🏆 Game finished event processed, currentGame should remain');
    });

    newSocket.on('error', (error: any) => {
      console.log('❌ SocketProvider error received:', error);
      
      if (error && (error.message || Object.keys(error).length > 0)) {
        const errorMessage = typeof error === 'object' && error?.message ? error.message : 'Unknown error';
        addGameEvent(`Ошибка: ${errorMessage}`);
      }
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('❌ SocketProvider connection error:', error);
      addGameEvent(`Ошибка подключения: ${error.message || 'Connection failed'}`);
    });

    // НЕ закрываем соединение при размонтировании - оно должно быть глобальным
    return () => {
      // Только очищаем heartbeat, но не закрываем соединение
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [userId]);

  // Запуск heartbeat
  const startHeartbeat = (socket: Socket) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat');
      }
    }, 60 * 1000);
    
    console.log('💓 SocketProvider heartbeat started');
  };

  const addGameEvent = (message: string) => {
    setGameEvents(prev => [...prev, {
      id: Date.now() + Math.random(),
      message,
      timestamp: new Date()
    }]);
  };

  const createGame = () => {
    console.log('🎮 SocketProvider createGame called');
    
    if (socket && authenticated) {
      console.log('🎮 SocketProvider emitting createGame event...');
      socket.emit('createGame');
    } else {
      console.log('❌ SocketProvider cannot create game - socket or authentication missing');
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

  const contextValue: SocketContextType = {
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
    clearEvents,
    setCurrentGame
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}

// Функция для закрытия глобального соединения (например, при выходе из системы)
export function closeGlobalSocket() {
  // Эта функция будет вызываться при выходе пользователя из системы
  if (typeof window !== 'undefined') {
    const socketInstance = (window as any).__globalSocket;
    if (socketInstance) {
      socketInstance.close();
      (window as any).__globalSocket = null;
    }
  }
} 