# 🚀 Деплой проекта "Ladder Enterprise Space"

## 📋 Обзор архитектуры

Проект содержит:
- **Next.js 15** - фронтенд и API routes
- **WebSocket сервер** - реальное время игр 
- **PostgreSQL** - база данных
- **Prisma ORM** - работа с БД
- **NextAuth.js** - аутентификация

## 🌐 Варианты хостинга

### 1. Railway (Рекомендуется)

#### Шаг 1: Подготовка
```bash
# Установите Railway CLI
npm install -g @railway/cli

# Войдите в аккаунт
railway login
```

#### Шаг 2: Инициализация проекта
```bash
# В папке проекта
railway init

# Создайте PostgreSQL базу
railway add postgresql
```

#### Шаг 3: Настройка переменных окружения
В Railway dashboard добавьте переменные:
```
DATABASE_URL=postgresql://postgres:password@host:port/database
NEXTAUTH_URL=https://your-app.railway.app
NEXTAUTH_SECRET=your-super-secret-key-32-characters
NODE_ENV=production
PORT=3000
WEBSOCKET_PORT=3001
```

#### Шаг 4: Деплой
```bash
# Деплой приложения
railway up

# Применить схему БД
railway run npx prisma db push
```

### 2. Render

#### Шаг 1: Создание сервисов
1. **Web Service** - для Next.js приложения
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: Node.js

2. **Background Worker** - для WebSocket сервера
   - Start Command: `npm run start:websocket`

3. **PostgreSQL** - база данных

#### Шаг 2: Переменные окружения
Добавьте в настройках каждого сервиса:
```
DATABASE_URL=postgresql://user:pass@host:port/database
NEXTAUTH_URL=https://your-app.onrender.com
NEXTAUTH_SECRET=your-secret-key
```

### 3. Vercel + Отдельный WebSocket

#### Шаг 1: Деплой Next.js на Vercel
```bash
# Установите Vercel CLI
npm i -g vercel

# Деплой
vercel --prod
```

#### Шаг 2: WebSocket на Railway/Render
- Создайте отдельный проект только для WebSocket сервера
- Используйте тот же DATABASE_URL

## 🔧 Настройка после деплоя

### 1. Инициализация базы данных
```bash
# Применить схему
npx prisma db push

# Генерировать клиент
npx prisma generate
```

### 2. Проверка работы
- Откройте ваш сайт
- Зайдите в раздел регистрации
- Создайте тестового пользователя
- Создайте игру

### 3. Мониторинг
- Проверьте логи сервера
- Убедитесь что WebSocket подключения работают
- Протестируйте создание и присоединение к играм

## 🛡️ Безопасность на продакшене

### 1. Переменные окружения
```bash
# Генерация секретного ключа
openssl rand -base64 32
```

### 2. CORS настройки
Обновите `websocket-server.js`:
```javascript
cors: {
  origin: process.env.NODE_ENV === 'production' 
    ? "https://your-domain.com" 
    : "*",
  methods: ["GET", "POST"]
}
```

### 3. Rate Limiting
Добавьте ограничения на API endpoints

## 🚨 Общие проблемы

### 1. WebSocket не подключается
- Проверьте CORS настройки
- Убедитесь что порты открыты
- Проверьте URL подключения (ws/wss)

### 2. База данных не доступна
- Проверьте DATABASE_URL
- Убедитесь что применили миграции
- Проверьте подключение к PostgreSQL

### 3. Ошибки аутентификации
- Проверьте NEXTAUTH_URL
- Убедитесь что NEXTAUTH_SECRET установлен
- Проверьте callback URLs

## 📊 Мониторинг и логи

### Railway
```bash
# Просмотр логов
railway logs

# Подключение к БД
railway connect postgresql
```

### Render
- Логи доступны в dashboard
- Подключение к БД через внешние клиенты

## 🔄 Обновления

### Автоматический деплой
1. Подключите GitHub к хостингу
2. Настройте auto-deploy на push в main ветку
3. Добавьте GitHub Actions (опционально)

### Ручной деплой
```bash
# Railway
railway up

# Vercel  
vercel --prod
```

## 📈 Масштабирование

При росте пользователей:
1. **База данных**: Connection pooling, реплики для чтения
2. **WebSocket**: Кластеризация, Redis для shared state
3. **CDN**: Для статических файлов
4. **Load Balancer**: Для распределения нагрузки 