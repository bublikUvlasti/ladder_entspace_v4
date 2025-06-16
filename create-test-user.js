const { PrismaClient } = require('./app/generated/prisma');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function createTestUser() {
    try {
        console.log('🔧 Создание тестового пользователя...');
        
        // Проверяем, существует ли уже тестовый пользователь
        const existingUser = await prisma.user.findUnique({
            where: { email: 'test@example.com' }
        });
        
        if (existingUser) {
            console.log('✅ Тестовый пользователь уже существует:');
            console.log(`   ID: ${existingUser.id}`);
            console.log(`   Name: ${existingUser.name}`);
            console.log(`   Email: ${existingUser.email}`);
            return existingUser;
        }
        
        // Создаем нового тестового пользователя
        const hashedPassword = await argon2.hash('testpassword123');
        
        const testUser = await prisma.user.create({
            data: {
                name: 'Test User',
                email: 'test@example.com',
                password: hashedPassword,
                wins: 0
            }
        });
        
        console.log('✅ Тестовый пользователь создан:');
        console.log(`   ID: ${testUser.id}`);
        console.log(`   Name: ${testUser.name}`);
        console.log(`   Email: ${testUser.email}`);
        
        return testUser;
        
    } catch (error) {
        console.error('❌ Ошибка создания тестового пользователя:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    createTestUser().catch(console.error);
}

module.exports = { createTestUser }; 