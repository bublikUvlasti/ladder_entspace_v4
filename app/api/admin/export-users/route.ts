import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Простая проверка по API ключу (для администраторов)
    const apiKey = request.headers.get('x-api-key');
    const validApiKey = process.env.ADMIN_API_KEY;
    
    if (!apiKey || !validApiKey || apiKey !== validApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Получаем всех пользователей
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        wins: true,
        losses: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Обрабатываем данные для Excel
    const processedUsers = users.map(user => {
      const totalGames = (user.wins || 0) + (user.losses || 0);
      const winRate = totalGames > 0 ? Math.round(((user.wins || 0) / totalGames) * 100) : 0;
      
      return {
        'ID': user.id,
        'Имя': user.name || '',
        'Email': user.email,
        'Побед': user.wins || 0,
        'Поражений': user.losses || 0,
        'Всего игр': totalGames,
        'Процент побед': winRate,
        'Дата регистрации': user.createdAt.toISOString().split('T')[0],
        'Последняя активность': user.updatedAt.toISOString().split('T')[0]
      };
    });

    // Логируем экспорт
    console.log(`📊 Экспорт пользователей: ${processedUsers.length} записей`);

    return NextResponse.json({
      success: true,
      total: processedUsers.length,
      users: processedUsers,
      exportDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Ошибка экспорта пользователей:', error);
    return NextResponse.json(
      { error: 'Failed to export users' },
      { status: 500 }
    );
  }
} 