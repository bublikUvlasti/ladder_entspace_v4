// Environment configuration module
// This module ensures that required environment variables are set

const isProduction = process.env.NODE_ENV === 'production'

// В production все переменные обязательны, в development используем значения по умолчанию
export const DATABASE_URL = process.env.DATABASE_URL || 
  (isProduction ? (() => { throw new Error('DATABASE_URL is required in production') })() : 'postgresql://postgres:password@localhost:5433/ladder_entspace')

export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 
  (isProduction ? (() => { throw new Error('NEXTAUTH_SECRET is required in production') })() : 'development-secret-key-change-in-production')

export const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 
  (isProduction ? (() => { throw new Error('NEXTAUTH_URL is required in production') })() : 'http://localhost:3000')

export const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 
  (isProduction ? (() => { throw new Error('WEBSOCKET_URL is required in production') })() : 'ws://localhost:3001')

console.log('🔧 Environment configuration loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: DATABASE_URL ? '✅ Configured' : '❌ Missing',
  NEXTAUTH_SECRET: NEXTAUTH_SECRET ? '✅ Configured' : '❌ Missing',
  NEXTAUTH_URL: NEXTAUTH_URL ? '✅ Configured' : '❌ Missing',
  WEBSOCKET_URL: WEBSOCKET_URL ? '✅ Configured' : '❌ Missing',
})

function setupEnvironment() {
  // Для разработки можно использовать дефолтные значения
  // Для продакшена все переменные должны быть установлены в окружении
  
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ DATABASE_URL не установлен! Добавьте переменную окружения.');
      throw new Error('DATABASE_URL environment variable is required');
    } else {
      process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/ladder_entspace";
      console.log('🔧 DATABASE_URL set to PostgreSQL:', process.env.DATABASE_URL);
    }
  }
  
  if (!process.env.NEXTAUTH_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ NEXTAUTH_SECRET не установлен! Добавьте переменную окружения.');
      throw new Error('NEXTAUTH_SECRET environment variable is required');
    } else {
      process.env.NEXTAUTH_SECRET = "your-secret-key-change-in-production";
      console.log('🔧 NEXTAUTH_SECRET set to default');
    }
  }
  
  if (!process.env.NEXTAUTH_URL) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ NEXTAUTH_URL не установлен! Добавьте переменную окружения.');
      throw new Error('NEXTAUTH_URL environment variable is required');
    } else {
      process.env.NEXTAUTH_URL = "http://localhost:3000";
      console.log('🔧 NEXTAUTH_URL set to default:', process.env.NEXTAUTH_URL);
    }
  }
  
  console.log('✅ Переменные окружения настроены');
}

// Auto-setup when module is imported
setupEnvironment();

module.exports = {
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  setupEnvironment
}; 