// Скрипт для отладки countdown логики в консоли браузера
// Скопируйте и вставьте этот код в консоль браузера на странице игры

console.log('🎯 Запуск отладки countdown логики');

// Симуляция состояния игры
let currentGame = null;
let countdown = null;

function simulateGameFinish() {
    console.log('🏆 Симуляция завершения игры');
    
    // Симулируем получение gameUpdated события
    currentGame = {
        id: 'test123',
        code: 'TEST',
        status: 'FINISHED',
        winner: { name: 'TestPlayer' }
    };
    
    console.log('🎯 currentGame установлен:', currentGame);
    
    // Проверяем условия для запуска countdown
    checkAndStartCountdown();
}

function checkAndStartCountdown() {
    console.log('🎯 Проверка условий для запуска countdown:');
    
    const gameStatus = currentGame?.status;
    const isFinished = gameStatus === 'FINISHED';
    const countdownIsNull = countdown === null;
    const shouldStartCountdown = isFinished && countdownIsNull;
    
    console.log('   - gameStatus:', gameStatus);
    console.log('   - isFinished:', isFinished);
    console.log('   - countdownIsNull:', countdownIsNull);
    console.log('   - shouldStartCountdown:', shouldStartCountdown);
    
    if (shouldStartCountdown) {
        console.log('🎯 Условия выполнены, запуск countdown');
        startCountdown();
    } else {
        console.log('❌ Условия не выполнены');
    }
}

function startCountdown() {
    countdown = 7;
    console.log('🎯 Countdown запущен с 7 секунд');
    
    const timer = setInterval(() => {
        countdown--;
        console.log(`🎯 Countdown: ${countdown}`);
        
        if (countdown <= 0) {
            console.log('🎯 Countdown завершен, переход на главную');
            clearInterval(timer);
            console.log('✅ В реальном приложении произошел бы router.push("/")');
            return;
        }
    }, 1000);
}

function resetTest() {
    currentGame = null;
    countdown = null;
    console.log('🔄 Тест сброшен');
}

// Экспортируем функции в глобальную область
window.debugCountdown = {
    simulateGameFinish,
    checkAndStartCountdown,
    resetTest,
    getCurrentGame: () => currentGame,
    getCountdown: () => countdown
};

console.log('✅ Отладочные функции готовы!');
console.log('💡 Используйте:');
console.log('   - debugCountdown.simulateGameFinish() - симулировать завершение игры');
console.log('   - debugCountdown.resetTest() - сбросить тест');
console.log('   - debugCountdown.getCurrentGame() - получить текущую игру');
console.log('   - debugCountdown.getCountdown() - получить countdown'); 