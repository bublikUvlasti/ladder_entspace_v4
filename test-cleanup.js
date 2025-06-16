// Тестовый скрипт для проверки системы очистки игр
const fetch = require('node-fetch');

async function testCleanup() {
  try {
    console.log('🧪 Тестируем API очистки игр...');
    
    const response = await fetch('http://localhost:3000/api/game/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📊 Результат очистки:', data);
    
    if (data.cleaned > 0) {
      console.log(`✅ Очищено ${data.cleaned} старых игр:`);
      data.games.forEach(game => {
        console.log(`  - ${game.code} (${game.playerName}) - создана ${new Date(game.createdAt).toLocaleString('ru-RU')}`);
      });
    } else {
      console.log('✨ Нет старых игр для очистки');
    }
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

testCleanup(); 