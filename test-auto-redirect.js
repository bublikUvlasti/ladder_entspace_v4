const { PrismaClient } = require('@prisma/client');
const io = require('socket.io-client');

const prisma = new PrismaClient();

async function testAutoRedirect() {
    console.log('🧪 Запуск теста автоматического перехода после завершения игры');
    
    try {
        // 1. Создаем тестовых пользователей
        console.log('👥 Создание тестовых пользователей...');
        
        const user1 = await prisma.user.upsert({
            where: { name: 'testuser1' },
            update: {},
            create: {
                name: 'testuser1',
                email: 'testuser1@test.com',
                password: 'hashedpassword',
                userType: 'STUDENT'
            }
        });

        const user2 = await prisma.user.upsert({
            where: { name: 'testuser2' },
            update: {},
            create: {
                name: 'testuser2',
                email: 'testuser2@test.com',
                password: 'hashedpassword',
                userType: 'STUDENT'
            }
        });

        console.log('✅ Пользователи созданы:', user1.name, user2.name);

        // 2. Создаем игру в базе данных
        console.log('🎮 Создание тестовой игры...');
        
        const game = await prisma.game.create({
            data: {
                code: 'TEST123',
                status: 'FINISHED',
                ballPosition: 2,
                balance1: 0,
                balance2: 100,
                move1: 5,
                move2: 10,
                round: 3,
                player1Id: user1.id,
                player2Id: user2.id,
                winnerId: user2.id,
                finishedAt: new Date()
            }
        });

        console.log('✅ Тестовая игра создана:', game.code, 'Статус:', game.status);

        // 3. Подключаемся к WebSocket серверу как первый пользователь
        console.log('🔌 Подключение к WebSocket серверу...');
        
        const socket1 = io('http://localhost:3001');
        
        return new Promise((resolve, reject) => {
            let testCompleted = false;
            const timeout = setTimeout(() => {
                if (!testCompleted) {
                    testCompleted = true;
                    console.log('⏰ Тест завершен по таймауту');
                    socket1.disconnect();
                    resolve();
                }
            }, 15000); // 15 секунд таймаут

            socket1.on('connect', () => {
                console.log('✅ Подключен к WebSocket серверу');
                
                // Аутентифицируемся
                socket1.emit('authenticate', { userId: user1.id });
            });

            socket1.on('authenticated', (data) => {
                console.log('👤 Аутентифицирован как:', data.user.name);
                
                // Присоединяемся к игре
                socket1.emit('joinGame', { code: 'TEST123' });
            });

            socket1.on('gameUpdated', (gameData) => {
                console.log('🎮 Получено обновление игры:', {
                    code: gameData.code,
                    status: gameData.status,
                    winner: gameData.winner?.name || 'нет'
                });

                if (gameData.status === 'FINISHED' && !testCompleted) {
                    testCompleted = true;
                    console.log('🏆 Игра завершена! Статус FINISHED получен');
                    console.log('🎯 Тест успешен - клиент получил статус FINISHED');
                    console.log('💡 В реальном приложении сейчас должен запуститься 7-секундный таймер');
                    
                    clearTimeout(timeout);
                    socket1.disconnect();
                    resolve();
                }
            });

            socket1.on('gameFinished', (data) => {
                console.log('🏆 Получено событие gameFinished:', data);
                
                if (!testCompleted) {
                    testCompleted = true;
                    console.log('🎯 Тест успешен - получено событие gameFinished');
                    console.log('💡 В реальном приложении сейчас должен запуститься 7-секундный таймер');
                    
                    clearTimeout(timeout);
                    socket1.disconnect();
                    resolve();
                }
            });

            socket1.on('error', (error) => {
                console.log('❌ Ошибка WebSocket:', error);
            });

            socket1.on('disconnect', () => {
                console.log('🔌 Отключен от WebSocket сервера');
            });
        });

    } catch (error) {
        console.error('❌ Ошибка теста:', error);
    } finally {
        // Очищаем тестовые данные
        console.log('🧹 Очистка тестовых данных...');
        
        try {
            await prisma.game.deleteMany({
                where: { code: 'TEST123' }
            });
            
            await prisma.user.deleteMany({
                where: {
                    name: { in: ['testuser1', 'testuser2'] }
                }
            });
            
            console.log('✅ Тестовые данные очищены');
        } catch (cleanupError) {
            console.error('❌ Ошибка очистки:', cleanupError);
        }
        
        await prisma.$disconnect();
        console.log('🏁 Тест завершен');
    }
}

// Запускаем тест
testAutoRedirect().catch(console.error); 