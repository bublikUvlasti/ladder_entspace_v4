#!/usr/bin/env node

// Import environment setup
require('./lib/env');

console.log('🔧 Setting up database...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const { getPgClient } = require('./lib/prisma-adapter');

async function initializeDatabase() {
  try {
    console.log('🔧 Инициализация PostgreSQL базы данных...');
    
    // Получаем PostgreSQL клиент
    console.log('📡 Получение PostgreSQL клиента...');
    const pgClient = await getPgClient();
    console.log('✅ Подключение к PostgreSQL установлено');

    // Проверяем существование таблиц
    console.log('🔍 Проверка существующих таблиц...');
    const result = await pgClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `);
    
    console.log(`📊 Найдено таблиц в базе данных: ${result.rows.length}`);
    
    if (result.rows.length === 0) {
      console.log('⚠️  Таблицы не найдены. Схема будет создана автоматически.');
    } else {
      console.log('✅ База данных готова к работе');
      
      // Проверяем количество пользователей
      console.log('👥 Подсчет пользователей...');
      const userCount = await pgClient.query('SELECT COUNT(*) as count FROM "User"');
      console.log(`👥 Пользователей в системе: ${userCount.rows[0].count}`);
      
      // Проверяем количество игр
      console.log('🎮 Подсчет игр...');
      const gameCount = await pgClient.query('SELECT COUNT(*) as count FROM "Game"');
      console.log(`🎮 Игр в системе: ${gameCount.rows[0].count}`);
    }
    
    console.log('✅ PostgreSQL база данных полностью готова к работе!');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Запускаем инициализацию
console.log('🚀 Запуск инициализации...');
initializeDatabase()
  .then(() => {
    console.log('🎉 Инициализация завершена успешно!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  }); 