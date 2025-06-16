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
            where: { id: userId },
            select: { id: true, name: true, fullName: true, wins: true, losses: true }
          });

          if (!user) {
            socket.emit('error', { message: 'User not found' });
            return;
          }

          socket.userId = userId;
          socket.userName = user.name;
          socket.userFullName = user.fullName;
          this.userSockets.set(userId, socket);
          
          socket.emit('authenticated', { user: { id: user.id, name: user.name, fullName: user.fullName, wins: user.wins, losses: user.losses } });
          console.log(`👤 Пользователь аутентифицирован: ${user.fullName || user.name} (${userId})`);
        } catch (error) {
          console.error('❌ Ошибка аутентификации:', error);
          socket.emit('error', { message: 'Authentication failed' });
        }
      });

      // Создание игры
      socket.on('createGame', async () => {
        try {
          console.log(`🎮 Получен запрос на создание игры от пользователя ${socket.userFullName || socket.userName} (${socket.userId})`);
          
          if (!socket.userId) {
            console.log('❌ Пользователь не аутентифицирован');
            socket.emit('error', { message: 'Not authenticated' });
            return;
          }

          const gameCode = this.generateGameCode();
          console.log(`🎮 Сгенерирован код игры: ${gameCode}`);
          
          // Создаем игру в базе данных
          console.log(`🎮 Создание игры в базе данных...`);
          const game = await prisma.game.create({
            data: {
              code: gameCode,
              player1Id: socket.userId,
              status: 'WAITING'
            },
            include: {
              player1: { select: { id: true, name: true, fullName: true, wins: true, losses: true } },
              player2: { select: { id: true, name: true, fullName: true, wins: true, losses: true } }
            }
          });
          console.log(`🎮 Игра создана в базе данных:`, game);

          // Сохраняем игру в памяти
          this.games.set(gameCode, {
            ...game,
            sockets: { player1: socket }
          });
          console.log(`🎮 Игра сохранена в памяти`);

          socket.join(`game_${gameCode}`);
          console.log(`🎮 Сокет присоединен к комнате game_${gameCode}`);
          
          const sanitizedGame = this.sanitizeGameData(game);
          console.log(`🎮 Отправка события gameCreated:`, { code: gameCode, game: sanitizedGame });
          
          socket.emit('gameCreated', { 
            code: gameCode, 
            game: sanitizedGame 
          });
          
          console.log(`🎮 Игра создана: ${gameCode} пользователем ${socket.userFullName || socket.userName}`);
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

          console.log(`🔍 Игрок ${socket.userFullName || socket.userName} пытается присоединиться к игре ${code}`);

          // Проверяем игру в базе данных
          let game = await prisma.game.findUnique({
            where: { code },
            include: {
              player1: { select: { id: true, name: true, fullName: true, wins: true, losses: true } },
              player2: { select: { id: true, name: true, fullName: true, wins: true, losses: true } }
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
            console.log(`🎮 Создатель игры ${socket.userFullName || socket.userName} переподключился к игре ${code}`);
            return;
          }

          // Если это второй игрок, который уже участвует в игре
          if (game.player2Id === socket.userId) {
            socket.join(`game_${code}`);
            socket.emit('gameUpdated', this.sanitizeGameData(game));
            console.log(`🎮 Игрок 2 ${socket.userFullName || socket.userName} переподключился к игре ${code}`);
            return;
          }

          if (game.status === 'FINISHED') {
            socket.emit('error', { message: 'Game has already finished' });
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
              player1: { select: { id: true, name: true, fullName: true, wins: true, losses: true } },
              player2: { select: { id: true, name: true, fullName: true, wins: true, losses: true } }
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
          
          console.log(`🎮 Игрок ${socket.userFullName || socket.userName} присоединился к игре ${code}`);
        } catch (error) {
          console.error('❌ Ошибка присоединения к игре:', error);
          socket.emit('error', { message: 'Failed to join game' });
        }
      });

      // Получение информации об игре
      socket.on('getGame', async (data) => {
        try {
          const { code } = data;
          if (!code) {
            socket.emit('error', { message: 'Game code required' });
            return;
          }

          const game = await prisma.game.findUnique({
            where: { code },
            include: {
              player1: { select: { id: true, name: true, fullName: true, wins: true, losses: true } },
              player2: { select: { id: true, name: true, fullName: true, wins: true, losses: true } }
            }
          });

          if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
          }

          socket.emit('gameData', this.sanitizeGameData(game));
        } catch (error) {
          console.error('❌ Ошибка получения игры:', error);
          socket.emit('error', { message: 'Failed to get game' });
        }
      });

      // Ход игрока
      socket.on('makeMove', async (data) => {
        try {
          const { code, move } = data;
          if (!socket.userId || !code || move === undefined) {
            socket.emit('error', { message: 'Invalid move data' });
            return;
          }

          console.log(`🎯 Игрок ${socket.userFullName || socket.userName} делает ход ${move} в игре ${code}`);

          // Получаем игру из базы данных
          const game = await prisma.game.findUnique({
            where: { code },
            include: {
              player1: { select: { id: true, name: true, fullName: true, wins: true, losses: true } },
              player2: { select: { id: true, name: true, fullName: true, wins: true, losses: true } }
            }
          });

          if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
          }

          if (game.status !== 'IN_PROGRESS') {
            socket.emit('error', { message: 'Game is not in progress' });
            return;
          }

          // Определяем, какой игрок делает ход
          let updateData = {};
          if (game.player1Id === socket.userId) {
            if (game.move1 !== null) {
              socket.emit('error', { message: 'You have already made your move' });
              return;
            }
            updateData.move1 = move;
          } else if (game.player2Id === socket.userId) {
            if (game.move2 !== null) {
              socket.emit('error', { message: 'You have already made your move' });
              return;
            }
            updateData.move2 = move;
          } else {
            socket.emit('error', { message: 'You are not a player in this game' });
            return;
          }

          // Обновляем игру в базе данных
          const updatedGame = await prisma.game.update({
            where: { id: game.id },
            data: updateData,
            include: {
              player1: { select: { id: true, name: true, fullName: true, wins: true, losses: true } },
              player2: { select: { id: true, name: true, fullName: true, wins: true, losses: true } }
            }
          });

          // Обновляем игру в памяти
          this.games.set(code, { ...this.games.get(code), ...updatedGame });

          // Уведомляем игроков об обновлении
          this.io.to(`game_${code}`).emit('gameUpdated', this.sanitizeGameData(updatedGame));

          console.log(`🎯 Ход принят. Игра ${code}: move1=${updatedGame.move1}, move2=${updatedGame.move2}`);

          // Если оба игрока сделали ходы, обрабатываем раунд
          if (updatedGame.move1 !== null && updatedGame.move2 !== null) {
            console.log(`🎮 Оба игрока сделали ходы в игре ${code}. Обрабатываем раунд...`);
            await this.processGameRound(code, updatedGame);
          }

        } catch (error) {
          console.error('❌ Ошибка хода:', error);
          socket.emit('error', { message: 'Failed to make move' });
        }
      });

      // Heartbeat для поддержания соединения
      socket.on('heartbeat', () => {
        socket.lastHeartbeat = Date.now();
      });

      // Отключение клиента
      socket.on('disconnect', async () => {
        console.log(`🔌 Клиент отключен: ${socket.id}`);
        
        if (socket.userId) {
          console.log(`👤 Пользователь ${socket.userFullName || socket.userName} отключился`);
          
          // Очищаем игры пользователя в статусе WAITING
          await this.cleanupUserWaitingGames(socket.userId, socket.userFullName || socket.userName);
          
          this.userSockets.delete(socket.userId);
        }
      });
    });
  }

  // Обработка раунда игры
  async processGameRound(code, game) {
    try {
      const move1 = game.move1;
      const move2 = game.move2;
      
      console.log(`🎮 Обработка раунда игры ${code}: Игрок1=${move1}, Игрок2=${move2}`);

      // Новая интуитивная механика (как в API):
      // - Левый игрок (Player 1) толкает камень влево (позиция уменьшается)
      // - Правый игрок (Player 2) толкает камень вправо (позиция увеличивается)
      let newBallPosition = game.ballPosition;
      
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
      
      // Вычисляем новые балансы
      const newBalance1 = Math.max(0, game.balance1 - move1);
      const newBalance2 = Math.max(0, game.balance2 - move2);
      
      console.log(`🎮 Результат раунда: позиция мяча ${game.ballPosition} -> ${newBallPosition}, балансы ${game.balance1}/${game.balance2} -> ${newBalance1}/${newBalance2}`);

      // Определяем статус игры и победителя
      let gameStatus = 'IN_PROGRESS';
      let winnerId = null;
      
      if (newBallPosition <= -2) {
        // Player 1 wins - камень достиг позиции -2 (левая сторона)
        gameStatus = 'FINISHED';
        winnerId = game.player1Id;
        console.log(`🏆 Игрок 1 (левый) победил в игре ${code}!`);
      } else if (newBallPosition >= 2) {
        // Player 2 wins - камень достиг позиции +2 (правая сторона)
        gameStatus = 'FINISHED';
        winnerId = game.player2Id;
        console.log(`🏆 Игрок 2 (правый) победил в игре ${code}!`);
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
        console.log(`🏆 Игра ${code} завершена по исчерпанию ресурсов. Победитель: ${winnerId ? (winnerId === game.player1Id ? 'Игрок 1' : 'Игрок 2') : 'Ничья'}`);
      } else if (newBalance1 <= 0) {
        // Player 1 out of stones, Player 2 wins
        gameStatus = 'FINISHED';
        winnerId = game.player2Id;
        console.log(`🏆 Игрок 2 победил в игре ${code} (у игрока 1 закончились камешки)!`);
      } else if (newBalance2 <= 0) {
        // Player 2 out of stones, Player 1 wins
        gameStatus = 'FINISHED';
        winnerId = game.player1Id;
        console.log(`🏆 Игрок 1 победил в игре ${code} (у игрока 2 закончились камешки)!`);
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
          player1: { select: { id: true, name: true, fullName: true, wins: true, losses: true } },
          player2: { select: { id: true, name: true, fullName: true, wins: true, losses: true } },
          winner: { select: { id: true, name: true, fullName: true, wins: true, losses: true } }
        }
      });

      // Обновляем игру в памяти
      this.games.set(code, { ...this.games.get(code), ...updatedGame });

      // Если игра завершена, обновляем статистику игроков
      if (gameStatus === 'FINISHED') {
        if (winnerId) {
          // Обновляем статистику победителя
          await prisma.user.update({
            where: { id: winnerId },
            data: { wins: { increment: 1 } }
          });
          
          // Обновляем статистику проигравшего
          const loserId = winnerId === game.player1Id ? game.player2Id : game.player1Id;
          await prisma.user.update({
            where: { id: loserId },
            data: { losses: { increment: 1 } }
          });
        } else {
          // Ничья - обновляем статистику поражений для обоих
          await prisma.user.update({
            where: { id: game.player1Id },
            data: { losses: { increment: 1 } }
          });
          await prisma.user.update({
            where: { id: game.player2Id },
            data: { losses: { increment: 1 } }
          });
        }
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
        console.log(`🏆 Игра ${code} завершена. Победитель: ${updatedGame.winner?.fullName || updatedGame.winner?.name || 'Ничья'}`);
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
    this.httpServer.listen(port, '0.0.0.0', () => {
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
    
    this.httpServer.on('error', (error) => {
      console.error('❌ Ошибка WebSocket сервера:', error);
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
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      // Находим старые игры в статусе WAITING
      const oldWaitingGames = await prisma.game.findMany({
        where: {
          status: 'WAITING',
          createdAt: {
            lt: tenMinutesAgo
          }
        }
      });

      if (oldWaitingGames.length > 0) {
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
        oldWaitingGames.forEach(game => {
          this.games.delete(game.code);
        });

        console.log(`🧹 Очищено ${oldWaitingGames.length} старых WAITING игр (>10 минут)`);
      }

      // Очищаем завершенные игры из памяти (но не из базы данных) старше 30 минут
      const oldFinishedGames = await prisma.game.findMany({
        where: {
          status: 'FINISHED',
          updatedAt: {
            lt: thirtyMinutesAgo
          }
        },
        select: {
          code: true
        }
      });

      if (oldFinishedGames.length > 0) {
        // Удаляем только из памяти, в базе данных оставляем для статистики
        oldFinishedGames.forEach(game => {
          this.games.delete(game.code);
        });

        console.log(`🧹 Очищено ${oldFinishedGames.length} завершенных игр из памяти (>30 минут)`);
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
        console.log(`💔 Heartbeat timeout для пользователя ${socket.userFullName || socket.userName}`);
        
        // Очищаем игры пользователя
        await this.cleanupUserWaitingGames(userId, socket.userFullName || socket.userName);
        
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