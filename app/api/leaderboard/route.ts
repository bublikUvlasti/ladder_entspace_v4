import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Получаем всех пользователей с игровой статистикой
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        fullName: true,
        wins: true,
        losses: true,
        userType: true,
      },
      // Сортируем по количеству побед (по убыванию), затем по количеству поражений (по возрастанию)
      orderBy: [
        { wins: 'desc' },
        { losses: 'asc' },
        { name: 'asc' }
      ],
    });

    // Добавляем ранг каждому игроку
    const playersWithRank = users.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    return NextResponse.json(playersWithRank);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 