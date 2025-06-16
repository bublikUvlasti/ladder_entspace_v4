# 🐳 Docker Деплой "Ladder Enterprise Space"

## 🚀 Быстрый старт

### 1. Локальный запуск
```bash
# Клонируйте проект
git clone <your-repo-url>
cd ladder_entspace

# Запустите все сервисы
docker-compose up -d

# Откройте браузер: http://localhost:3000
```

### 2. Остановка
```bash
docker-compose down
```

### 3. Полная очистка (включая данные)
```bash
docker-compose down -v
docker system prune -a
```

## 🌐 Деплой на хостинг

### VPS с Docker

#### 1. Подключитесь к серверу
```bash
ssh root@your-server-ip
```

#### 2. Установите Docker (Ubuntu/Debian)
```bash
# Обновите систему
apt update && apt upgrade -y

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Установите Docker Compose
apt install docker-compose-plugin -y
```

#### 3. Загрузите проект
```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd ladder_entspace

# Или загрузите архив и распакуйте
```

#### 4. Настройте переменные окружения
```bash
# Отредактируйте docker-compose.yml
nano docker-compose.yml

# Измените эти значения:
- NEXTAUTH_URL=https://your-domain.com  # Ваш домен
- NEXTAUTH_SECRET=<32-символьный-ключ>   # Сгенерируйте новый ключ
- ADMIN_API_KEY=<ваш-админ-ключ>         # Ключ для админки
```

#### 5. Запустите приложение
```bash
# Соберите и запустите
docker-compose up -d

# Проверьте логи
docker-compose logs -f app
```

#### 6. Настройте обратный прокси (Nginx)
```bash
# Установите Nginx
apt install nginx -y

# Создайте конфигурацию
nano /etc/nginx/sites-available/ladder

# Добавьте:
server {
    listen 80;
    server_name your-domain.com;

    # Next.js приложение
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket соединения
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Включите сайт
ln -s /etc/nginx/sites-available/ladder /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

#### 7. Настройте HTTPS (Let's Encrypt)
```bash
# Установите Certbot
apt install certbot python3-certbot-nginx -y

# Получите сертификат
certbot --nginx -d your-domain.com

# Автообновление сертификата
crontab -e
# Добавьте: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Доступ к базе пользователей

### Через API
```bash
# Экспорт пользователей в JSON
curl -H "x-api-key: your-admin-key" \
     https://your-domain.com/api/admin/export-users

# Сохранить в файл
curl -H "x-api-key: your-admin-key" \
     https://your-domain.com/api/admin/export-users \
     -o users.json
```

### Через базу данных
```bash
# Подключение к PostgreSQL
docker exec -it ladder_postgres psql -U ladder_user -d ladder_entspace

# Экспорт в CSV
\copy "User" TO '/tmp/users.csv' CSV HEADER;

# Выход
\q
```

## 🛠️ Управление

### Просмотр логов
```bash
# Все логи
docker-compose logs -f

# Только приложение
docker-compose logs -f app

# Только база данных
docker-compose logs -f postgres
```

### Обновление приложения
```bash
# Остановите контейнеры
docker-compose down

# Обновите код (git pull или загрузите новые файлы)
git pull

# Пересоберите и запустите
docker-compose up -d --build
```

### Резервное копирование БД
```bash
# Создание бэкапа
docker exec ladder_postgres pg_dump -U ladder_user ladder_entspace > backup.sql

# Восстановление
docker exec -i ladder_postgres psql -U ladder_user ladder_entspace < backup.sql
```

## 🎯 Популярные хостинги с Docker

### 1. DigitalOcean Droplets
- от $6/месяц
- готовые образы с Docker
- простое управление

### 2. Hetzner Cloud  
- от €3.29/месяц
- отличная производительность
- европейские дата-центры

### 3. AWS EC2
- гибкое ценообразование
- множество регионов
- интеграция с другими сервисами AWS

### 4. Google Cloud Compute Engine
- $300 бесплатных кредитов
- автомасштабирование
- глобальная инфраструктура

### 5. Vultr
- от $2.50/месяц
- быстрое развертывание
- множество локаций

## 🔧 Конфигурация для продакшена

### docker-compose.prod.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: ladder_entspace
      POSTGRES_USER: ladder_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    # Не открываем порт наружу в продакшене
    
  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://ladder_user:${POSTGRES_PASSWORD}@postgres:5432/ladder_entspace?schema=public
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - ADMIN_API_KEY=${ADMIN_API_KEY}
    depends_on:
      - postgres
    volumes:
      - ./logs:/app/logs

volumes:
  postgres_data:
```

### .env файл для продакшена
```bash
POSTGRES_PASSWORD=super-secure-password-here
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-32-character-secret-key-here
ADMIN_API_KEY=your-admin-api-key-here
```

Использование:
```bash
docker-compose -f docker-compose.prod.yml --env-file .env up -d
``` 