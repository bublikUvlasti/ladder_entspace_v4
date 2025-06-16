#!/bin/bash

# АВТОДЕПЛОЙ НА VPS
# Использование: ./deploy-to-vps.sh user@your-server-ip

if [ -z "$1" ]; then
    echo "❌ Укажите сервер: ./deploy-to-vps.sh user@server-ip"
    exit 1
fi

SERVER=$1
APP_DIR="/opt/ladder_game"

echo "🚀 Деплой на $SERVER..."

# 1. Создаем папку на сервере
ssh $SERVER "sudo mkdir -p $APP_DIR && sudo chown \$USER:$USER $APP_DIR"

# 2. Копируем файлы
echo "📁 Копируем файлы..."
rsync -avz --exclude=node_modules --exclude=.next ./ $SERVER:$APP_DIR/

# 3. Устанавливаем зависимости и запускаем
ssh $SERVER << 'EOF'
cd /opt/ladder_game

# Устанавливаем Node.js если нет
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Устанавливаем PM2 для автозапуска
sudo npm install -g pm2

# Устанавливаем зависимости
npm install

# Генерируем Prisma
npx prisma generate

# Останавливаем старую версию
pm2 stop ladder-game 2>/dev/null || true

# Запускаем приложение
pm2 start npm --name "ladder-game" -- start

# Автозапуск при перезагрузке
pm2 startup
pm2 save

echo "✅ Приложение запущено!"
echo "🌐 Доступно на: http://$(curl -s ifconfig.me):3000"
EOF

echo "🎉 Деплой завершен!" 