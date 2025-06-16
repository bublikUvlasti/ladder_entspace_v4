// Импортируем настройки окружения первым делом
require('./lib/env');

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const GameServer = require('./websocket-server');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Создаем Next.js приложение
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  console.log('📦 Next.js приложение готово');
  
  // Создаем HTTP сервер
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Создаем и запускаем WebSocket игровой сервер на отдельном порту
  console.log('🎮 Создание WebSocket сервера...');
  try {
    const gameServer = new GameServer();
    gameServer.start(3001);
    console.log('✅ WebSocket сервер создан успешно');
  } catch (error) {
    console.error('❌ Ошибка создания WebSocket сервера:', error);
    process.exit(1);
  }

  // Запускаем основной HTTP сервер
  httpServer.listen(port, (err) => {
    if (err) {
      console.error('❌ Ошибка запуска HTTP сервера:', err);
      throw err;
    }
    console.log(`✅ HTTP сервер запущен: http://${hostname}:${port}`);
    console.log(`✅ WebSocket сервер работает на порту 3001`);
    console.log('🚀 Приложение готово к работе!');
  });

  // Обработка сигналов завершения
  process.on('SIGTERM', () => {
    console.log('🛑 Получен сигнал SIGTERM, завершение работы...');
    httpServer.close(() => {
      console.log('✅ HTTP сервер остановлен');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 Получен сигнал SIGINT, завершение работы...');
    httpServer.close(() => {
      console.log('✅ HTTP сервер остановлен');
      process.exit(0);
    });
  });

}).catch((error) => {
  console.error('❌ Ошибка подготовки Next.js приложения:', error);
  process.exit(1);
}); 