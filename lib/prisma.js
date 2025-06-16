// Import environment setup first
require('./env');

const { PrismaClient } = require('../app/generated/prisma');

const globalForPrisma = globalThis;

// Создаем Prisma клиент
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error']
});

// Инициализируем базу данных при первом создании клиента
if (!globalForPrisma.dbInitialized) {
  setTimeout(async () => {
    try {
      await initializeDatabase();
      globalForPrisma.dbInitialized = true;
      console.log('✅ База данных инициализирована');
    } catch (error) {
      console.error('❌ Ошибка инициализации базы данных:', error.message);
    }
  }, 1000);
}

async function initializeDatabase() {
  try {
    // Проверяем подключение к базе данных
    await prisma.$connect();
    console.log('✅ Подключение к базе данных успешно');
    
    // Создаем тестовых пользователей если их нет
    const userCount = await prisma.user.count();
    
    if (userCount === 0) {
      console.log('🔧 Создание тестовых пользователей...');
      
      // Создаем тестовых пользователей
      await prisma.user.createMany({
        data: [
          {
            id: 'test1',
            email: 'test1@example.com',
            name: 'Test User 1',
            password: 'password123'
          },
          {
            id: 'test2',
            email: 'test2@example.com',
            name: 'Test User 2',
            password: 'password123'
          },
          {
            id: 'admin',
            email: 'admin@example.com',
            name: 'Admin',
            password: 'admin123'
          }
        ]
      });
      
      console.log('👥 Тестовые пользователи созданы');
    }
    
    // Создаем тестовые игры если их нет
    const gameCount = await prisma.game.count();
    
    if (gameCount === 0) {
      console.log('🎮 Создание тестовых игр...');
      
      await prisma.game.createMany({
        data: [
          {
            id: 'game1',
            code: 'GAME1',
            player1Id: 'test1'
          },
          {
            id: 'game2',
            code: 'GAME2',
            player1Id: 'test2'
          },
          {
            id: 'game3',
            code: 'GAME3',
            player1Id: 'admin'
          }
        ]
      });
      
      console.log('🎮 Тестовые игры созданы');
    }
    
    console.log(`📊 Пользователей в базе: ${await prisma.user.count()}`);
    console.log(`🎮 Игр в базе: ${await prisma.game.count()}`);
    
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

module.exports = { prisma, initializeDatabase }; 