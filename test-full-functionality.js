const { io } = require('socket.io-client');
const http = require('http');
const { PrismaClient } = require('./app/generated/prisma');

const prisma = new PrismaClient();

console.log('🧪 Полное тестирование функциональности приложения\n');

class GameTester {
    constructor() {
        this.testResults = [];
        this.testUserId = null;
    }

    async init() {
        // Получаем ID тестового пользователя
        const testUser = await prisma.user.findUnique({
            where: { email: 'test@example.com' }
        });
        
        if (testUser) {
            this.testUserId = testUser.id;
            console.log(`🔧 Используем тестового пользователя: ${testUser.name} (${testUser.id})\n`);
        } else {
            throw new Error('Тестовый пользователь не найден. Запустите create-test-user.js');
        }
    }

    async test(name, testFn) {
        console.log(`🔍 Тест: ${name}`);
        try {
            await testFn();
            console.log(`✅ ${name} - ПРОЙДЕН\n`);
            this.testResults.push({ name, status: 'PASS' });
        } catch (error) {
            console.log(`❌ ${name} - ПРОВАЛЕН: ${error.message}\n`);
            this.testResults.push({ name, status: 'FAIL', error: error.message });
        }
    }

    async testHttpServer() {
        return new Promise((resolve, reject) => {
            const req = http.get('http://localhost:3000', (res) => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    reject(new Error(`HTTP статус: ${res.statusCode}`));
                }
            });
            req.on('error', reject);
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Таймаут HTTP запроса'));
            });
        });
    }

    async testWebSocketConnection() {
        return new Promise((resolve, reject) => {
            const socket = io('http://localhost:3001', {
                transports: ['websocket', 'polling'],
                timeout: 5000
            });

            const timeout = setTimeout(() => {
                socket.close();
                reject(new Error('Таймаут WebSocket подключения'));
            }, 5000);

            socket.on('connect', () => {
                clearTimeout(timeout);
                console.log(`   Socket ID: ${socket.id}`);
                socket.close();
                resolve();
            });

            socket.on('connect_error', (err) => {
                clearTimeout(timeout);
                reject(new Error(`WebSocket ошибка: ${err.message}`));
            });
        });
    }

    async testAuthentication() {
        return new Promise((resolve, reject) => {
            const socket = io('http://localhost:3001', {
                transports: ['websocket', 'polling'],
                timeout: 5000
            });

            let authenticated = false;
            const timeout = setTimeout(() => {
                socket.close();
                if (!authenticated) {
                    reject(new Error('Таймаут аутентификации'));
                }
            }, 10000);

            socket.on('connect', () => {
                console.log('   Отправка данных аутентификации...');
                socket.emit('authenticate', { userId: this.testUserId });
            });

            socket.on('authenticated', (data) => {
                clearTimeout(timeout);
                authenticated = true;
                console.log(`   Аутентифицирован как: ${data.user.name}`);
                socket.close();
                resolve();
            });

            socket.on('error', (error) => {
                clearTimeout(timeout);
                socket.close();
                reject(new Error(`Ошибка аутентификации: ${error.message || 'Unknown error'}`));
            });

            socket.on('connect_error', (err) => {
                clearTimeout(timeout);
                reject(new Error(`Ошибка подключения: ${err.message}`));
            });
        });
    }

    async testGameCreation() {
        return new Promise((resolve, reject) => {
            const socket = io('http://localhost:3001', {
                transports: ['websocket', 'polling'],
                timeout: 5000
            });

            let gameCreated = false;
            const timeout = setTimeout(() => {
                socket.close();
                if (!gameCreated) {
                    reject(new Error('Таймаут создания игры'));
                }
            }, 15000);

            socket.on('connect', () => {
                console.log('   Аутентификация...');
                socket.emit('authenticate', { userId: this.testUserId });
            });

            socket.on('authenticated', () => {
                console.log('   Создание игры...');
                socket.emit('createGame');
            });

            socket.on('gameCreated', (data) => {
                clearTimeout(timeout);
                gameCreated = true;
                console.log(`   Игра создана с кодом: ${data.code}`);
                socket.close();
                resolve();
            });

            socket.on('error', (error) => {
                clearTimeout(timeout);
                socket.close();
                reject(new Error(`Ошибка создания игры: ${error.message || 'Unknown error'}`));
            });

            socket.on('connect_error', (err) => {
                clearTimeout(timeout);
                reject(new Error(`Ошибка подключения: ${err.message}`));
            });
        });
    }

    async testApiEndpoints() {
        const endpoints = [
            '/api/auth/session',
            '/api/game/available'
        ];

        for (const endpoint of endpoints) {
            await new Promise((resolve, reject) => {
                const req = http.get(`http://localhost:3000${endpoint}`, (res) => {
                    console.log(`   ${endpoint}: ${res.statusCode}`);
                    if (res.statusCode < 500) { // Принимаем любой статус кроме 5xx
                        resolve();
                    } else {
                        reject(new Error(`Статус ${res.statusCode} для ${endpoint}`));
                    }
                });
                req.on('error', reject);
                req.setTimeout(5000, () => {
                    req.destroy();
                    reject(new Error(`Таймаут для ${endpoint}`));
                });
            });
        }
    }

    async runAllTests() {
        await this.init();
        
        await this.test('HTTP сервер доступен', () => this.testHttpServer());
        await this.test('WebSocket подключение', () => this.testWebSocketConnection());
        await this.test('Аутентификация пользователя', () => this.testAuthentication());
        await this.test('Создание игры', () => this.testGameCreation());
        await this.test('API эндпоинты', () => this.testApiEndpoints());

        console.log('📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:');
        console.log('='.repeat(50));
        
        let passed = 0;
        let failed = 0;
        
        this.testResults.forEach(result => {
            const status = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${status} ${result.name}`);
            if (result.error) {
                console.log(`   Ошибка: ${result.error}`);
            }
            
            if (result.status === 'PASS') passed++;
            else failed++;
        });
        
        console.log('='.repeat(50));
        console.log(`Пройдено: ${passed}, Провалено: ${failed}`);
        
        if (failed === 0) {
            console.log('🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! Приложение работает корректно.');
        } else {
            console.log('⚠️  Есть проблемы, требующие внимания.');
        }
        
        await prisma.$disconnect();
    }
}

const tester = new GameTester();
tester.runAllTests().catch(console.error); 