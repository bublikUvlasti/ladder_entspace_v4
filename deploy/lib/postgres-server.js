const { newDb } = require('pg-mem');
const { Client } = require('pg');

// Создаем in-memory PostgreSQL базу данных
const db = newDb();

// Создаем PostgreSQL клиент
const client = db.adapters.createPg();

// Экспортируем клиент для использования в приложении
module.exports = {
  client,
  db,
  
  // Функция для инициализации базы данных
  async initDatabase() {
    console.log('🔧 Инициализация in-memory PostgreSQL...');
    
    // Создаем схему базы данных
    await client.query(`
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
    
    await client.query(`
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
        "finishedAt" TIMESTAMP,
        FOREIGN KEY ("player1Id") REFERENCES "User"(id),
        FOREIGN KEY ("player2Id") REFERENCES "User"(id),
        FOREIGN KEY ("winnerId") REFERENCES "User"(id)
      );
    `);
    
    await client.query(`
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
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
        UNIQUE(provider, "providerAccountId")
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Session" (
        id TEXT PRIMARY KEY,
        "sessionToken" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL,
        expires TIMESTAMP NOT NULL,
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
      );
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        identifier TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires TIMESTAMP NOT NULL,
        UNIQUE(identifier, token)
      );
    `);
    
    console.log('✅ In-memory PostgreSQL база данных готова');
    return client;
  }
}; 