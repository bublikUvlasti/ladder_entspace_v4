#!/bin/sh

# Ждем пока база данных станет доступна
echo "🔍 Ожидание базы данных..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ База данных доступна"

# Применяем миграции
echo "📦 Применяем схему базы данных..."
npx prisma db push

# Запускаем WebSocket сервер в фоне
echo "🚀 Запускаем WebSocket сервер..."
node websocket-server.js &

# Запускаем Next.js приложение
echo "🚀 Запускаем Next.js приложение..."
exec npm start 