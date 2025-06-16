# АВТОДЕПЛОЙ НА VPS ИЗ WINDOWS
# Использование: .\deploy-to-vps.ps1 user@server-ip

param(
    [Parameter(Mandatory=$true)]
    [string]$Server
)

$AppDir = "/opt/ladder_game"

Write-Host "🚀 Деплой на $Server..." -ForegroundColor Green

# 1. Копируем файлы через SCP
Write-Host "📁 Копируем файлы..." -ForegroundColor Yellow
scp -r * ${Server}:~/ladder_temp/

# 2. Выполняем команды на сервере
ssh $Server @"
# Создаем папку приложения
sudo mkdir -p $AppDir
sudo mv ~/ladder_temp/* $AppDir/
cd $AppDir

# Устанавливаем Node.js если нет
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Устанавливаем PM2
sudo npm install -g pm2

# Устанавливаем зависимости
npm install

# Генерируем Prisma
npx prisma generate

# Запускаем
pm2 delete ladder-game 2>/dev/null || true
pm2 start npm --name 'ladder-game' -- start
pm2 startup
pm2 save

echo '✅ Готово! Приложение запущено на порту 3000'
"@

Write-Host "🎉 Деплой завершен!" -ForegroundColor Green
Write-Host "🌐 Приложение доступно на: http://$($Server.Split('@')[1]):3000" -ForegroundColor Cyan 