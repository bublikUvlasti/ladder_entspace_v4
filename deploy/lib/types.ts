import type { Socket } from 'socket.io-client';

export interface GameEvent {
  id: number;
  message: string;
  timestamp: Date;
}

export interface Player {
  id: string;
  name: string;
  wins: number;
}

export interface GameSession {
  id: string;
  code: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  player1Id: string;
  player2Id?: string;
  ballPosition: number;
  balance1: number;
  balance2: number;
  player1: Player;
  player2?: Player;
  winner?: Player;
  move1?: number;
  move2?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocketHookReturn {
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
} 