# Ladder Enterprise Space

Многопользовательская игра в реальном времени с системой аутентификации и WebSocket интеграцией.

## 🎮 Описание

Ladder Enterprise Space - это веб-игра, где два игрока соревнуются, управляя виртуальным мячом на поле. Игроки делают ставки и пытаются довести мяч до своей зоны для победы.

## ✨ Особенности

- 🔐 Безопасная система регистрации и авторизации
- 🎯 Игровая механика с балансом и ставками
- ⚡ Real-time обновления через WebSocket
- 📱 Адаптивный дизайн для всех устройств
- 📊 Статистика игроков (побед/поражений)
- 🎨 Современный UI с анимациями

## 🛠️ Технологии

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Socket.IO, NextAuth.js
- **Database**: SQLite, Prisma ORM
- **Styling**: Framer Motion для анимаций
- **Testing**: Jest, Supertest

## 🚀 Запуск

### Требования
- Node.js 18+

### Установка
```bash
npm install
```

### Настройка базы данных
```bash
# Применение схемы (SQLite создается автоматически)
npm run db:push
```

### Запуск приложения
```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## 🎯 Игровой процесс

1. Регистрация или вход в систему
2. Создание игровой комнаты или присоединение по коду
3. Ожидание второго игрока
4. Игра: делайте ставки и двигайте мяч к своей зоне
5. Победа достается тому, кто доведет мяч до края поля

## 🔧 Команды

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для продакшена
npm run start        # Запуск продакшен версии
npm run db:studio    # Prisma Studio
npm run db:push      # Применение схемы БД
npm run test         # Запуск тестов
```

## 📁 Структура проекта

```
ladder_entspace/
├── app/                 # Next.js App Router
│   ├── api/            # API маршруты
│   ├── auth/           # Страницы аутентификации
│   ├── game/           # Игровые страницы
│   └── generated/      # Сгенерированный Prisma клиент
├── lib/                # Утилиты и конфигурация
├── prisma/             # Схема базы данных
├── public/             # Статические файлы
└── __tests__/          # Тесты
```

## 🔧 Разработка

Проект использует современный стек технологий с TypeScript и SQLite для простоты развертывания. База данных создается автоматически при первом запуске.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
