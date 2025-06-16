# Multi-stage build для оптимизации размера образа
FROM node:20-alpine AS base

# Устанавливаем необходимые системные зависимости
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Копируем файлы для установки зависимостей
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production --no-audit --no-fund

# Build stage
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем необходимые файлы из builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/websocket-server.js ./

# Копируем зависимости
COPY --from=deps /app/node_modules ./node_modules

# Копируем script для запуска
COPY --from=builder /app/package.json ./package.json

# Создаем папку для логов с правильными правами
RUN mkdir -p /app/logs && chown nextjs:nodejs /app/logs

# Переключаемся на пользователя nextjs
USER nextjs

# Открываем порты
EXPOSE 3000 3001

# Переменные окружения по умолчанию
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Команда запуска
CMD ["sh", "-c", "npx prisma migrate deploy && node websocket-server.js & node server.js"] 