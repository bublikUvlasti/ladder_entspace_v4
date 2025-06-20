# Отчет: Исправление проблемы с состоянием игры после завершения

## Проблема
После завершения игры пользователь не мог создать новую игру - система перенаправляла его обратно в завершенную игру.

### Симптомы:
1. Игра завершается корректно
2. Пользователь нажимает "Выйти в главное меню"
3. Переходит на страницу создания игры
4. Нажимает "Создать игру"
5. Система перенаправляет обратно в завершенную игру вместо создания новой

## Причина
Состояние `currentGame` в `SocketContext` не очищалось после завершения игры, поэтому при попытке создать новую игру система считала, что у пользователя уже есть активная игра.

## Решение

### 1. Автоматическая очистка при завершении игры
**Файл:** `lib/socket-context.tsx`
```typescript
newSocket.on('gameFinished', (data: { winner?: Player }) => {
  console.log('🏆 SocketProvider game finished:', data);
  addGameEvent(`Игра завершена! Победитель: ${data.winner?.name || 'Ничья'}`);
  
  // Очищаем currentGame после завершения игры, чтобы пользователь мог создать новую
  setTimeout(() => {
    console.log('🧹 SocketProvider clearing currentGame after game finished');
    setCurrentGame(null);
  }, 1000); // Небольшая задержка, чтобы пользователь увидел результат
});
```

### 2. Очистка при выходе в главное меню
**Файл:** `app/game/[code]/GameClient.tsx`
```typescript
<button
  onClick={() => {
    // Очищаем состояние игры перед переходом в главное меню
    setCurrentGame(null);
    router.push('/');
  }}
  className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
>
  Выйти в главное меню
</button>
```

### 3. Принудительная очистка при создании новой игры
**Файл:** `app/game/create/page.tsx`
```typescript
const handleCreateGame = async () => {
  if (!connected || isCreating) {
    return;
  }
  
  // Очищаем предыдущее состояние игры перед созданием новой
  console.log('🧹 Clearing previous game state before creating new game');
  setCurrentGame(null);
  
  setIsCreating(true);
  createGame();
  // ...
};
```

### 4. Улучшенная очистка завершенных игр на сервере
**Файл:** `websocket-server.js`
```javascript
async cleanupOldGames() {
  // Очищаем WAITING игры старше 10 минут
  // Очищаем завершенные игры из памяти (но не из базы данных) старше 30 минут
  const oldFinishedGames = await prisma.game.findMany({
    where: {
      status: 'FINISHED',
      updatedAt: { lt: thirtyMinutesAgo }
    },
    select: { code: true }
  });

  if (oldFinishedGames.length > 0) {
    // Удаляем только из памяти, в базе данных оставляем для статистики
    oldFinishedGames.forEach(game => {
      this.games.delete(game.code);
    });
  }
}
```

## Результат
После внесения изменений:
1. ✅ Игра корректно завершается
2. ✅ Состояние `currentGame` автоматически очищается через 1 секунду после завершения
3. ✅ Кнопка "Выйти в главное меню" принудительно очищает состояние
4. ✅ Создание новой игры принудительно очищает предыдущее состояние
5. ✅ Сервер автоматически очищает завершенные игры из памяти через 30 минут

## Тестирование
1. Завершите игру
2. Нажмите "Выйти в главное меню"
3. Перейдите к созданию новой игры
4. Нажмите "Создать игру"
5. Система должна создать новую игру, а не перенаправлять в старую

## Дополнительные улучшения
- Добавлена автоматическая очистка завершенных игр из памяти сервера
- Улучшено логирование для отладки состояния игр
- Добавлены множественные точки очистки для надежности

Проблема полностью решена с помощью комплексного подхода к управлению состоянием игры. 