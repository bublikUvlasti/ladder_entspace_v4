const { newDb } = require('pg-mem');

// Создаем глобальную базу данных
let globalPgClient = null;
let globalDb = null;

async function getPgClient() {
  if (globalPgClient) {
    console.log('🔄 Возвращаю существующий PostgreSQL клиент');
    return globalPgClient;
  }

  try {
    console.log('🔧 Инициализация in-memory PostgreSQL...');
    
    // Создаем in-memory PostgreSQL базу данных
    console.log('📦 Создание базы данных...');
    globalDb = newDb();
    console.log('✅ База данных создана');
    
    // Создаем PostgreSQL адаптер и клиент
    console.log('🔌 Создание адаптера...');
    const pgAdapter = globalDb.adapters.createPg();
    console.log('✅ Адаптер создан');
    
    console.log('🔗 Создание клиента...');
    globalPgClient = new pgAdapter.Client();
    console.log('✅ Клиент создан');
    
    console.log('🔌 Подключение клиента...');
    await globalPgClient.connect();
    console.log('✅ Клиент подключен');
    
    // Создаем схему базы данных
    console.log('🏗️ Создание таблиц...');
    await globalPgClient.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        "emailVerified" TIMESTAMP,
        image TEXT,
        password TEXT NOT NULL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Таблица User создана');
    
    await globalPgClient.query(`
      CREATE TABLE IF NOT EXISTS "Account" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        UNIQUE(provider, "providerAccountId")
      );
    `);
    console.log('✅ Таблица Account создана');

    await globalPgClient.query(`
      CREATE TABLE IF NOT EXISTS "Session" (
        id TEXT PRIMARY KEY,
        "sessionToken" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        expires TIMESTAMP NOT NULL
      );
    `);
    console.log('✅ Таблица Session создана');

    await globalPgClient.query(`
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        identifier TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires TIMESTAMP NOT NULL,
        UNIQUE(identifier, token)
      );
    `);
    console.log('✅ Таблица VerificationToken создана');
    
    await globalPgClient.query(`
      CREATE TABLE IF NOT EXISTS "Game" (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'WAITING',
        "ballPosition" INTEGER DEFAULT 0,
        balance1 INTEGER DEFAULT 50,
        balance2 INTEGER DEFAULT 50,
        move1 INTEGER,
        move2 INTEGER,
        round INTEGER DEFAULT 1,
        "player1Id" TEXT NOT NULL,
        "player2Id" TEXT,
        "winnerId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "finishedAt" TIMESTAMP
      );
    `);
    console.log('✅ Таблица Game создана');
    
    // Добавляем тестовых пользователей
    console.log('👥 Добавление тестовых пользователей...');
    try {
      await globalPgClient.query(`
        INSERT INTO "User" (id, email, password, name, wins, losses) 
        VALUES 
          ('user1', 'test1@example.com', 'password123', 'Игрок 1', 5, 2),
          ('user2', 'test2@example.com', 'password123', 'Игрок 2', 3, 4),
          ('user3', 'admin@example.com', 'admin123', 'Администратор', 10, 1)
        ON CONFLICT (email) DO NOTHING;
      `);
      console.log('✅ Тестовые пользователи добавлены');
      
      // Создаем несколько тестовых игр
      console.log('🎮 Добавление тестовых игр...');
      await globalPgClient.query(`
        INSERT INTO "Game" (id, code, status, "player1Id", "player2Id", "ballPosition", balance1, balance2, round) 
        VALUES 
          ('game1', 'TEST001', 'FINISHED', 'user1', 'user2', 7, 30, 70, 5),
          ('game2', 'TEST002', 'IN_PROGRESS', 'user2', 'user3', 3, 60, 40, 3),
          ('game3', 'TEST003', 'WAITING', 'user1', NULL, 0, 50, 50, 1)
        ON CONFLICT (code) DO NOTHING;
      `);
      console.log('✅ Тестовые игры добавлены');
    } catch (error) {
      console.log('⚠️ Ошибка добавления тестовых данных (возможно, уже существуют):', error.message);
    }
    
    console.log('✅ PostgreSQL база данных полностью готова');
    return globalPgClient;
    
  } catch (error) {
    console.error('❌ Ошибка инициализации PostgreSQL:', error);
    throw error;
  }
}

module.exports = { getPgClient, globalDb: () => globalDb }; 