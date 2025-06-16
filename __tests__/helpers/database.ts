import { PrismaClient } from '../../app/generated/prisma';

// Используем тестовую PostgreSQL базу данных
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:password@localhost:5433/ladder_entspace_test"
    },
  },
});

export async function setupTestDatabase() {
  // Очищаем тестовую базу данных
  await prisma.$executeRaw`TRUNCATE TABLE "Account", "Session", "User", "VerificationToken", "Game" RESTART IDENTITY CASCADE`;
}

export async function cleanupTestDatabase() {
  await prisma.$disconnect();
}

export { prisma }; 