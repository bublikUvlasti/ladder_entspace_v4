const { Client } = require('pg');

async function tryConnection(config, description) {
  const client = new Client(config);

  try {
    await client.connect();
    console.log(`✅ ${description}: подключение успешно`);

    // Проверяем существует ли база данных
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'ladder_entspace'"
    );

    if (result.rows.length === 0) {
      // Создаем базу данных
      await client.query('CREATE DATABASE ladder_entspace');
      console.log('✅ База данных ladder_entspace создана');
    } else {
      console.log('ℹ️ База данных ladder_entspace уже существует');
    }

    await client.end();
    return true;

  } catch (error) {
    console.error(`❌ ${description}: ${error.message}`);
    try {
      await client.end();
    } catch (e) {}
    return false;
  }
}

async function createDatabase() {
  const configs = [
    {
      config: {
        user: 'postgres',
        password: 'postgres',
        host: 'localhost',
        port: 5432,
        database: 'postgres'
      },
      description: 'localhost с паролем'
    },
    {
      config: {
        user: 'postgres',
        host: 'localhost', 
        port: 5432,
        database: 'postgres'
      },
      description: 'localhost без пароля'
    },
    {
      config: {
        user: 'postgres',
        password: 'postgres',
        host: '127.0.0.1',
        port: 5432,
        database: 'postgres'
      },
      description: '127.0.0.1 с паролем'
    },
    {
      config: {
        user: 'postgres',
        host: '127.0.0.1',
        port: 5432,
        database: 'postgres'
      },
      description: '127.0.0.1 без пароля'
    }
  ];

  for (const { config, description } of configs) {
    const success = await tryConnection(config, description);
    if (success) {
      console.log('🎉 Подключение успешно настроено!');
      return;
    }
  }

  console.log('❌ Не удалось подключиться ни одним способом');
}

createDatabase(); 