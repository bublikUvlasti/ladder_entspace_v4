const { Client } = require('pg');

async function testConnection() {
  const configs = [
    'postgresql://postgres:postgres@localhost:5432/postgres',
    'postgresql://postgres@localhost:5432/postgres',
    'postgresql://postgres:postgres@localhost:5433/postgres',
    'postgresql://postgres@localhost:5433/postgres',
    'postgresql://postgres:postgres@localhost:5434/postgres',
    'postgresql://postgres@localhost:5434/postgres'
  ];

  for (const connectionString of configs) {
    const client = new Client({ connectionString });

    try {
      console.log('🔄 Пытаемся подключиться:', connectionString);
      await client.connect();
      console.log('✅ Подключение успешно!');

      const result = await client.query('SELECT version()');
      console.log('📊 Версия PostgreSQL:', result.rows[0].version);

      // Пытаемся создать базу данных
      try {
        await client.query('CREATE DATABASE ladder_entspace');
        console.log('✅ База данных ladder_entspace создана');
      } catch (createError) {
        if (createError.message.includes('already exists')) {
          console.log('ℹ️ База данных ladder_entspace уже существует');
        } else {
          console.log('❌ Ошибка создания БД:', createError.message);
        }
      }

      await client.end();
      return connectionString; // Возвращаем рабочую строку подключения
    } catch (error) {
      console.error('❌ Ошибка:', error.message);
      try {
        await client.end();
      } catch (e) {}
    }
  }

  console.log('❌ Все попытки подключения провалились');
  return null;
}

testConnection().then(workingConnection => {
  if (workingConnection) {
    console.log('🎉 Рабочее подключение:', workingConnection);
  }
}); 