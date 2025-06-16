# Исправления для успешного деплоя на AMVERA

## Все исправленные проблемы:

### 1. ❌ Google Fonts timeout errors → ✅ System fonts
**Проблема**: Google Fonts не загружаются за время таймаута при деплое
**Решение**: 
- Удалены все импорты Google Fonts из `app/layout.tsx`
- В `app/globals.css` заменены на системные шрифты: `system-ui, -apple-system, sans-serif`

### 2. ❌ Missing package-lock.json → ✅ Fixed dependencies
**Проблема**: `npm ci` не может найти package-lock.json
**Решение**: 
- Скопирован корректный package-lock.json из основного проекта
- Добавлены все необходимые зависимости для production сборки

### 3. ❌ Autoprefixer missing → ✅ Added to dependencies  
**Проблема**: `Cannot find module 'autoprefixer'` при сборке
**Решение**:
- Добавлен `autoprefixer: "^10.4.20"` в dependencies
- Добавлен `postcss: "^8.4.49"` в dependencies
- Перенесен `tailwindcss: "^3.4.17"` в dependencies для сборки

### 4. ❌ Next.js config warnings → ✅ Fixed configuration
**Проблема**: Invalid next.config.ts options detected
**Решение**:
- Убраны недействительные опции (`serverComponentsExternalPackages` перенесен в `serverExternalPackages`)
- Исправлены экспериментальные настройки
- Убраны неподдерживаемые опции (`api`, `optimizeCss` на верхнем уровне)

### 5. ❌ Prisma adapter-pg missing → ✅ Standard PrismaClient  
**Проблема**: `@prisma/adapter-pg` не найден в зависимостях
**Решение**: Упрощен `lib/prisma.ts` до стандартного PrismaClient без адаптеров

### 6. ❌ Database localhost connection → ✅ Required env vars
**Проблема**: В production пытается подключиться к localhost
**Решение**: `lib/env.js` требует все переменные окружения без fallback на localhost

### 7. ❌ Framer Motion webpack errors → ✅ Webpack alias
**Проблема**: Cannot find module './vendor-chunks/framer-motion.js'
**Решение**: Добавлен webpack alias для корректного разрешения framer-motion

### 8. ❌ TailwindCSS v4 → ✅ Stable v3.4.17
**Проблема**: Указана несуществующая версия TailwindCSS v4
**Решение**: Используется стабильная версия `tailwindcss: "^3.4.17"`

## Текущий статус: 🟢 ГОТОВ К ДЕПЛОЮ

Все критические ошибки исправлены. Проект готов к деплою на Amvera.

## Переменные окружения для Amvera:

```env
DATABASE_URL=postgresql://ladder_user:ladder_password_2024@amvera-artemtuchkov-cnpg-skif-ladder-bd-rw:5432/ladder_entspace
NEXTAUTH_SECRET=15fde3038fe0c0eba67ef53cccd61615c95a3197eb8049db661b796b66cfc471
NEXTAUTH_URL=https://ваш-домен.amvera.ru  
WEBSOCKET_URL=wss://ваш-домен.amvera.ru
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

## Docker настройки для Amvera:
- containerPort: 3000
- persistenceMount: /app/logs
- dockerfile: Dockerfile

## Последовательность деплоя:
1. Удалить все файлы из репозитория Amvera
2. Загрузить все файлы из папки `deploy/`
3. Настроить переменные окружения  
4. Настроить Docker параметры
5. Деплоить проект 