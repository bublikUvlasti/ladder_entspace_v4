const { Server } = require('socket.io');
const { createServer } = require('http');
const { PrismaClient } = require('./app/generated/prisma');

// Импортируем настройки окружения
require('./lib/env');

const prisma = new PrismaClient();

class GameServer {
  constructor() {
    this.httpServer = createServer();
    this.io = new Server(this.httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.NEXTAUTH_URL, process.env.FRONTEND_URL].filter(Boolean)
          : "*",
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    
    this.games = new Map(); // Активные игры в памяти
    this.userSockets = new Map(); // Связь пользователь -> сокет
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Клиент подключен: ${socket.id}`);

      // Аутентификация пользователя
      socket.on('authenticate', async (data) => {
        try {
          const { userId } = data;
          if (!userId) {
            socket.emit('error', { message: 'User ID required' });
            return;
          }

          // Проверяем пользователя в базе
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });

          if (!user) {
            socket.emit('error', { message: 'User not found' });
            return;
          }

          socket.userId = userId;
          socket.userName = user.name;
          this.userSockets.set(userId, socket);
          
          socket.emit('authenticated', { user: { id: user.id, name: user.name, wins: user.wins } });
          console.log(`👤 Пользователь аутентифицирован: ${user.name} (${userId})`);
        } catch (error) {
          console.error('❌ Ошибка аутентификации:', error);
          socket.emit('error', { message: 'Authentication failed' });
        }
      });

      // Создание игры
      socket.on('createGame', async () => {
        try {
          if (!socket.userId) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const gameCode = this.generateGameCode();
          
          // Создаем игру в базе данных
          const game = await prisma.game.create({
            data: {
              code: gameCode,
              player1Id: socket.userId,
              status: 'WAITING'
            },
            include: {
              player1: { select: { id: true, name: true, wins: true } },
              player2: { select: { id: true, name: true, wins: true } }
            }
          });

          // Сохраняем игру в памяти
          this.games.set(gameCode, {
            ...game,
            sockets: { player1: socket }
          });

          socket.join(`game_${gameCode}`);
          socket.emit('gameCreated', { 
            code: gameCode, 
            game: this.sanitizeGameData(game) 
          });
          
          console.log(`🎮 Игра создана: ${gameCode} пользователем ${socket.userName}`);
        } catch (error) {
          console.error('❌ Ошибка создания игры:', error);
          socket.emit('error', { message: 'Failed to create game' });
        }
      });

      // Присоединение к игре
      socket.on('joinGame', async (data) => {
        try {
          const { code } = data;
          if (!socket.userId || !code) {
            socket.emit('error', { message: 'Invalid request' });
            return;
          }

          console.log(`🔍 Игрок ${socket.userName} пытается присоединиться к игре ${code}`);

          // Проверяем игру в базе данных
          let game = await prisma.game.findUnique({
            where: { code },
            include: {
              player1: { select: { id: true, name: true, wins: true } },
              player2: { select: { id: true, name: true, wins: true } }
            }
          });

          if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
          }

          // Если это создатель игры, просто отправляем ему данные об игре
          if (game.player1Id === socket.userId) {
            socket.join(`game_${code}`);
            socket.emit('gameUpdated', this.sanitizeGameData(game));
            console.log(`🎮 Создатель игры ${socket.userName} переподключился к игре ${code}`);
            return;
          }

          // Если это второй игрок, который уже участвует в игре
          if (game.player2Id === socket.userId) {
            socket.join(`game_${code}`);
            socket.emit('gameUpdated', this.sanitizeGameData(game));
            console.log(`🎮 Игрок 2 ${socket.userName} переподключился к игре ${code}`);
            return;
          }

          if (game.status !== 'WAITING') {
            socket.emit('error', { message: 'Game is not available for joining' });
            return;
          }

          if (game.player2Id) {
            socket.emit('error', { message: 'Game is full' });
            return;
          }

          // Обновляем игру в базе данных
          game = await prisma.game.update({
            where: { id: game.id },
            data: {
              player2Id: socket.userId,
              status: 'IN_PROGRESS'
            },
            include: {
              player1: { select: { id: true, name: true, wins: true } },
              player2: { select: { id: true, name: true, wins: true } }
            }
          });

          // Обновляем игру в памяти
          const gameInMemory = this.games.get(code) || {};
          this.games.set(code, {
            ...game,
            sockets: {
              ...gameInMemory.sockets,
              player2: socket
            }
          });

          socket.join(`game_${code}`);
          
          // Сначала отправляем данные об игре второму игроку
          socket.emit('gameUpdated', this.sanitizeGameData(game));
          
          // Затем уведомляем всех игроков об обновлении и старте
          this.io.to(`game_${code}`).emit('gameUpdated', this.sanitizeGameData(game));
          this.io.to(`game_${code}`).emit('gameStarted', { message: 'Игра началась!' });
          
          console.log(`🎮 Игрок ${socket.userName} присоединился к игре ${code}`);
        } catch (error) {
          console.error('❌ Ошибка присоединения к игре:', error);
          socket.emit('error', { message: 'Failed to join game' });
        }
      });

      // Игровой ход
      socket.on('makeMove', async (data) => {
        try {
          const { code, move } = data;
          if (!socket.userId || !code || typeof move !== 'number') {
            socket.emit('error', { message: 'Invalid move data' });
            return;
          }

          const game = this.games.get(code);
          if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
          }

          if (game.status !== 'IN_PROGRESS') {
            socket.emit('error', { message: 'Game is not active' });
            return;
          }

          // Определяем, какой игрок делает ход
          const isPlayer1 = game.player1Id === socket.userId;
          const isPlayer2 = game.player2Id === socket.userId;

          if (!isPlayer1 && !isPlayer2) {
            socket.emit('error', { message: 'You are not a player in this game' });
            return;
          }

          // Сохраняем ход
          const updateData = {};
          if (isPlayer1) updateData.move1 = move;
          if (isPlayer2) updateData.move2 = move;

          const updatedGame = await prisma.game.update({
            where: { id: game.id },
            data: updateData,
            include: {
              player1: { select: { id: true, name: true, wins: true } },
              player2: { select: { id: true, name: true, wins: true } }
            }
          });

          // Обновляем игру в памяти
          this.games.set(code, { ...this.games.get(code), ...updatedGame });

          // Если оба игрока сделали ходы, обрабатываем раунд
          if (updatedGame.move1 !== null && updatedGame.move2 !== null) {
            await this.processGameRound(code, updatedGame);
          } else {
            // Уведомляем о ходе
            this.io.to(`game_${code}`).emit('gameUpdated', this.sanitizeGameData(updatedGame));
            this.io.to(`game_${code}`).emit('moveReceived', {
              player: isPlayer1 ? 'player1' : 'player2',
              move: move
            });
          }

          console.log(`🎯 Ход в игре ${code}: ${socket.userName} -> ${move}`);
        } catch (error) {
          console.error('❌ Ошибка хода:', error);
          socket.emit('error', { message: 'Failed to make move' });
        }
      });

      // Отключение сокета
      socket.on('disconnect', async () => {
        console.log(`🔌 Клиент отключен: ${socket.id}`);
        if (socket.userId) {
          // Очищаем игры в статусе WAITING, созданные этим пользователем
          await this.cleanupUserWaitingGames(socket.userId, socket.userName);
          this.userSockets.delete(socket.userId);
        }
      });

      // Heartbeat для проверки активности
      socket.on('heartbeat', () => {
        socket.lastHeartbeat = Date.now();
        socket.emit('heartbeat_ack');
      });

      // Инициализируем heartbeat для нового подключения
      socket.lastHeartbeat = Date.now();
    });
  }

  async processGameRound(code, game) {
    try {
      const move1 = game.move1;
      const move2 = game.move2;
      
      // Игровая логика (камень движется на 1 позицию в зависимости от того кто больше поставил)
      let newBallPosition = game.ballPosition;
      let newBalance1 = game.balance1;
      let newBalance2 = game.balance2;

      // Простая логика: кто больше поставил, тот толкает камень в свою сторону на 1 позицию
      if (move1 > move2) {
        // Player 1 поставил больше - камень двигается влево (позиция уменьшается)
        newBallPosition -= 1;
      } else if (move2 > move1) {
        // Player 2 поставил больше - камень двигается вправо (позиция увеличивается)
        newBallPosition += 1;
      }
      // Если равно, камень не двигается

      // Ограничиваем позицию камня: -2, -1, 0, 1, 2
      newBallPosition = Math.max(-2, Math.min(2, newBallPosition));

      // Уменьшаем балансы на основе ходов
      newBalance1 = Math.max(0, newBalance1 - Math.abs(move1));
      newBalance2 = Math.max(0, newBalance2 - Math.abs(move2));

      let gameStatus = 'IN_PROGRESS';
      let winnerId = null;

      // Проверяем условия победы
      if (newBallPosition <= -2) {
        // Player 1 wins - камень достиг позиции -2 (левая сторона)
        gameStatus = 'FINISHED';
        winnerId = game.player1Id;
      } else if (newBallPosition >= 2) {
        // Player 2 wins - камень достиг позиции +2 (правая сторона)
        gameStatus = 'FINISHED';
        winnerId = game.player2Id;
      } else if (newBalance1 <= 0 && newBalance2 <= 0) {
        // Both players out of stones - winner is who has stone closer to their side
        gameStatus = 'FINISHED';
        if (newBallPosition < 0) {
          // Камень ближе к левой стороне - выигрывает левый игрок
          winnerId = game.player1Id;
        } else if (newBallPosition > 0) {
          // Камень ближе к правой стороне - выигрывает правый игрок
          winnerId = game.player2Id;
        }
        // If position is 0, it's a draw (no winner)
      } else if (newBalance1 <= 0) {
        gameStatus = 'FINISHED';
        winnerId = game.player2Id;
      } else if (newBalance2 <= 0) {
        gameStatus = 'FINISHED';
        winnerId = game.player1Id;
      }

      // Обновляем игру в базе данных
      const updatedGame = await prisma.game.update({
        where: { id: game.id },
        data: {
          ballPosition: newBallPosition,
          balance1: newBalance1,
          balance2: newBalance2,
          move1: null, // Сбрасываем ходы для следующего раунда
          move2: null,
          status: gameStatus,
          winnerId: winnerId
        },
        include: {
          player1: { select: { id: true, name: true, wins: true } },
          player2: { select: { id: true, name: true, wins: true } },
          winner: { select: { id: true, name: true } }
        }
      });

      // Обновляем игру в памяти
      this.games.set(code, { ...this.games.get(code), ...updatedGame });

      // Если игра завершена, обновляем статистику победителя
      if (gameStatus === 'FINISHED' && winnerId) {
        await prisma.user.update({
          where: { id: winnerId },
          data: { wins: { increment: 1 } }
        });
      }

      // Уведомляем игроков о результате раунда
      this.io.to(`game_${code}`).emit('gameUpdated', this.sanitizeGameData(updatedGame));
      this.io.to(`game_${code}`).emit('roundResult', {
        move1,
        move2,
        ballPosition: newBallPosition,
        balance1: newBalance1,
        balance2: newBalance2,
        gameStatus,
        winner: winnerId ? updatedGame.winner : null
      });

      if (gameStatus === 'FINISHED') {
        this.io.to(`game_${code}`).emit('gameFinished', {
          winner: updatedGame.winner,
          finalPosition: newBallPosition
        });
        console.log(`🏆 Игра ${code} завершена. Победитель: ${updatedGame.winner?.name || 'Ничья'}`);
      }

    } catch (error) {
      console.error('❌ Ошибка обработки раунда:', error);
      this.io.to(`game_${code}`).emit('error', { message: 'Failed to process round' });
    }
  }

  generateGameCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  sanitizeGameData(game) {
    return {
      id: game.id,
      code: game.code,
      status: game.status,
      ballPosition: game.ballPosition,
      balance1: game.balance1,
      balance2: game.balance2,
      move1: game.move1,
      move2: game.move2,
      player1: game.player1,
      player2: game.player2,
      player1Id: game.player1Id,
      player2Id: game.player2Id,
      winner: game.winner,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt
    };
  }

  start(port = 3001) {
    this.httpServer.listen(port, () => {
      console.log(`🚀 WebSocket сервер запущен на порту ${port}`);
      
      // Запускаем периодическую очистку старых игр каждые 5 минут
      setInterval(() => {
        this.cleanupOldGames();
      }, 5 * 60 * 1000);
      
      // Проверяем heartbeat каждую минуту
      setInterval(() => {
        this.checkHeartbeats();
      }, 60 * 1000);
      
      console.log(`🧹 Система автоочистки игр запущена`);
    });
  }

  // Очистка игр в статусе WAITING при отключении пользователя
  async cleanupUserWaitingGames(userId, userName) {
    try {
      // Находим все игры пользователя в статусе WAITING
      const waitingGames = await prisma.game.findMany({
        where: {
          player1Id: userId,
          status: 'WAITING'
        }
      });

      if (waitingGames.length > 0) {
        // Удаляем игры из базы данных
        await prisma.game.deleteMany({
          where: {
            player1Id: userId,
            status: 'WAITING'
          }
        });

        // Удаляем игры из памяти
        waitingGames.forEach(game => {
          this.games.delete(game.code);
        });

        console.log(`🧹 Очищено ${waitingGames.length} WAITING игр пользователя ${userName}`);
      }
    } catch (error) {
      console.error('❌ Ошибка очистки игр:', error);
    }
  }

  // Очистка старых игр (автоматическое удаление по времени)
  async cleanupOldGames() {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      // Находим старые игры в статусе WAITING
      const oldGames = await prisma.game.findMany({
        where: {
          status: 'WAITING',
          createdAt: {
            lt: tenMinutesAgo
          }
        }
      });

      if (oldGames.length > 0) {
        // Удаляем старые игры
        await prisma.game.deleteMany({
          where: {
            status: 'WAITING',
            createdAt: {
              lt: tenMinutesAgo
            }
          }
        });

        // Удаляем из памяти
        oldGames.forEach(game => {
          this.games.delete(game.code);
        });

        console.log(`🧹 Очищено ${oldGames.length} старых WAITING игр (>10 минут)`);
      }
    } catch (error) {
      console.error('❌ Ошибка очистки старых игр:', error);
    }
  }

  // Проверка heartbeat и очистка неактивных подключений
  async checkHeartbeats() {
    const now = Date.now();
    const timeout = 2 * 60 * 1000; // 2 минуты

    for (const [userId, socket] of this.userSockets.entries()) {
      if (now - socket.lastHeartbeat > timeout) {
        console.log(`💔 Heartbeat timeout для пользователя ${socket.userName}`);
        
        // Очищаем игры пользователя
        await this.cleanupUserWaitingGames(userId, socket.userName);
        
        // Отключаем сокет
        socket.disconnect();
        this.userSockets.delete(userId);
      }
    }
  }
}

module.exports = GameServer;

// Если файл запускается напрямую
if (require.main === module) {
  const gameServer = new GameServer();
  const port = process.env.WEBSOCKET_PORT || 3001;
  gameServer.start(port);
} 