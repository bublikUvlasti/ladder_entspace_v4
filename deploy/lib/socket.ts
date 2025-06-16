import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { Socket } from 'socket.io';

let io: SocketIOServer;

export const getSocketServer = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const initSocket = (server: HTTPServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Присоединение к комнате игры
    socket.on('join-game', (gameCode: string) => {
      socket.join(`game:${gameCode}`);
      console.log(`Client ${socket.id} joined game ${gameCode}`);
    });

    // Выход из комнаты игры
    socket.on('leave-game', (gameCode: string) => {
      socket.leave(`game:${gameCode}`);
      console.log(`Client ${socket.id} left game ${gameCode}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Функция для отправки обновлений игры всем участникам
export const broadcastGameUpdate = (gameCode: string, gameData: any) => {
  if (io) {
    io.to(`game:${gameCode}`).emit('game-update', gameData);
    console.log(`Broadcasted game update for ${gameCode}`);
  }
}; 