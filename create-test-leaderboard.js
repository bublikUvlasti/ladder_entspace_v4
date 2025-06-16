const { PrismaClient } = require('./app/generated/prisma');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🎮 Создание тестовых пользователей для рейтинга...');

    const testUsers = [
      {
        name: 'Чемпион',
        email: 'champion@test.local',
        password: await argon2.hash('password123'),
        wins: 15,
        losses: 2,
        userType: 'ENTREPRENEUR',
        businessName: 'ТехноИнновации',
        revenue: '10-50 млн',
        industry: 'IT',
        businessRole: 'CEO',
        businessGoals: 'Масштабирование бизнеса',
        transformation: 'Цифровая трансформация'
      },
      {
        name: 'Мастер',
        email: 'master@test.local',
        password: await argon2.hash('password123'),
        wins: 12,
        losses: 5,
        userType: 'MANAGER',
        companyName: 'Большая Корпорация'
      },
      {
        name: 'Эксперт',
        email: 'expert@test.local',
        password: await argon2.hash('password123'),
        wins: 8,
        losses: 3,
        userType: 'STUDENT',
        studyPlace: 'МГУ',
        course: '4 курс'
      },
      {
        name: 'Новичок',
        email: 'newbie@test.local',
        password: await argon2.hash('password123'),
        wins: 3,
        losses: 7,
        userType: 'STUDENT',
        studyPlace: 'МФТИ',
        course: '2 курс'
      },
      {
        name: 'Стратег',
        email: 'strategist@test.local',
        password: await argon2.hash('password123'),
        wins: 10,
        losses: 4,
        userType: 'ENTREPRENEUR',
        businessName: 'СтратегияПлюс',
        revenue: '1-10 млн',
        industry: 'Консалтинг',
        businessRole: 'Основатель',
        businessGoals: 'Развитие команды',
        transformation: 'Процессная оптимизация'
      }
    ];

    for (const userData of testUsers) {
      // Проверяем, существует ли пользователь
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`👤 Пользователь ${userData.name} уже существует, обновляем статистику...`);
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            wins: userData.wins,
            losses: userData.losses
          }
        });
      } else {
        console.log(`👤 Создание пользователя ${userData.name}...`);
        await prisma.user.create({
          data: userData
        });
      }
    }

    console.log('✅ Тестовые пользователи созданы успешно!');
    
    // Показываем текущий рейтинг
    const users = await prisma.user.findMany({
      select: {
        name: true,
        wins: true,
        losses: true,
        userType: true
      },
      orderBy: [
        { wins: 'desc' },
        { losses: 'asc' },
        { name: 'asc' }
      ]
    });

    console.log('\n🏆 Текущий рейтинг:');
    users.forEach((user, index) => {
      const userTypeEmoji = {
        'ENTREPRENEUR': '💼',
        'MANAGER': '👔',
        'STUDENT': '🎓'
      };
      console.log(`${index + 1}. ${userTypeEmoji[user.userType] || '👤'} ${user.name} - Побед: ${user.wins}, Поражений: ${user.losses}`);
    });

  } catch (error) {
    console.error('❌ Ошибка создания тестовых пользователей:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers(); 