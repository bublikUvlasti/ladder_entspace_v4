# Многоэтапная сборка для минимизации размера

# Этап 1: Сборка зависимостей
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем только файлы пакетов для установки зависимостей
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Этап 2: Сборка приложения
FROM node:20-alpine AS builder
WORKDIR /app

# Копируем зависимости из предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./

# Устанавливаем dev зависимости для сборки
RUN npm ci

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Этап 3: Финальный образ (только для продакшена)
FROM node:20-alpine AS runner
WORKDIR /app

# Устанавливаем только необходимые системные зависимости
RUN apk add --no-cache netcat-openbsd

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем только необходимые файлы для работы
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/websocket-server.js ./
COPY --from=deps /app/node_modules ./node_modules

# Меняем владельца файлов
RUN chown -R nextjs:nodejs /app
USER nextjs

# Открываем порты
EXPOSE 3000 3001

# Копируем и настраиваем скрипт запуска
COPY --chown=nextjs:nodejs start.sh ./
USER root
RUN chmod +x start.sh
USER nextjs

# Запускаем приложение
CMD ["./start.sh"] 