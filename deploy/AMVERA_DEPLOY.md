# Деплой на Amvera

## Шаг 1: Подготовка переменных окружения

В настройках приложения на Amvera добавьте следующие переменные:

```
DATABASE_URL=postgresql://ladder_user:ladder_password_2024@amvera-artemtuchkov-cnpg-skif-ladder-bd-rw:5432/ladder_entspace
NEXTAUTH_SECRET=super-secret-key-32-characters-minimum-for-production-use
NEXTAUTH_URL=https://ваш-домен.amvera.ru
WEBSOCKET_URL=wss://ваш-домен.amvera.ru
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

⚠️ **ВАЖНО**: Замените `ваш-домен.amvera.ru` на ваш реальный домен!

## Шаг 2: Настройки Docker на Amvera

В настройках приложения укажите:

- **containerPort**: `3000`
- **persistenceMount**: `/app/logs`
- **dockerfile**: `Dockerfile`

## Шаг 3: Настройки базы данных

Убедитесь, что PostgreSQL настроена с параметрами:
- **Database name**: `ladder_entspace`
- **Username**: `ladder_user`
- **Password**: `ladder_password_2024`
- **Host**: `amvera-artemtuchkov-cnpg-skif-ladder-bd-rw`
- **Port**: `5432`

## Шаг 4: Деплой

1. Удалите все файлы из вашего репозитория на Amvera
2. Загрузите все файлы из папки `deploy/`
3. Запустите деплой

## Проверка работы

После успешного деплоя:
1. Откройте ваш сайт в браузере
2. Проверьте регистрацию нового пользователя
3. Создайте тестовую игру
4. Проверьте подключение по WebSocket

## Возможные проблемы

### 1. Ошибка подключения к базе данных
- Проверьте правильность `DATABASE_URL`
- Убедитесь, что база данных создана и доступна

### 2. Ошибки WebSocket
- Убедитесь, что nginx.conf загружен
- Проверьте корректность `WEBSOCKET_URL`

### 3. Ошибки аутентификации
- Проверьте `NEXTAUTH_SECRET` (минимум 32 символа)
- Убедитесь в правильности `NEXTAUTH_URL`

## Логи

Логи приложения сохраняются в `/app/logs/` и доступны через панель Amvera. 