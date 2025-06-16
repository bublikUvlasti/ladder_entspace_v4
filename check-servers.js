const http = require('http');
const { io } = require('socket.io-client');

console.log('🔍 Проверка серверов...\n');

// Проверка HTTP сервера
function checkHttpServer() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000', (res) => {
            console.log('✅ HTTP сервер (порт 3000): РАБОТАЕТ');
            console.log(`   Статус: ${res.statusCode}`);
            resolve(true);
        });
        
        req.on('error', (err) => {
            console.log('❌ HTTP сервер (порт 3000): НЕ РАБОТАЕТ');
            console.log(`   Ошибка: ${err.message}`);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log('❌ HTTP сервер (порт 3000): ТАЙМАУТ');
            req.destroy();
            resolve(false);
        });
    });
}

// Проверка WebSocket сервера
function checkWebSocketServer() {
    return new Promise((resolve) => {
        console.log('🔌 Подключение к WebSocket серверу...');
        
        const socket = io('http://localhost:3001', {
            transports: ['websocket', 'polling'],
            timeout: 5000
        });
        
        const timeout = setTimeout(() => {
            console.log('❌ WebSocket сервер (порт 3001): ТАЙМАУТ');
            socket.close();
            resolve(false);
        }, 5000);
        
        socket.on('connect', () => {
            clearTimeout(timeout);
            console.log('✅ WebSocket сервер (порт 3001): РАБОТАЕТ');
            console.log(`   Socket ID: ${socket.id}`);
            socket.close();
            resolve(true);
        });
        
        socket.on('connect_error', (err) => {
            clearTimeout(timeout);
            console.log('❌ WebSocket сервер (порт 3001): НЕ РАБОТАЕТ');
            console.log(`   Ошибка: ${err.message}`);
            resolve(false);
        });
    });
}

async function main() {
    const httpOk = await checkHttpServer();
    console.log('');
    const wsOk = await checkWebSocketServer();
    
    console.log('\n📊 Результат проверки:');
    console.log(`HTTP сервер: ${httpOk ? '✅ OK' : '❌ FAIL'}`);
    console.log(`WebSocket сервер: ${wsOk ? '✅ OK' : '❌ FAIL'}`);
    
    if (httpOk && wsOk) {
        console.log('\n🎉 Все серверы работают корректно!');
    } else {
        console.log('\n⚠️  Есть проблемы с серверами');
    }
    
    process.exit(0);
}

main().catch(console.error); 