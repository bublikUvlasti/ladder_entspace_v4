import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    // Находим старые игры в статусе WAITING
    const oldGames = await prisma.game.findMany({
      where: {
        status: 'WAITING',
        createdAt: {
          lt: tenMinutesAgo
        }
      },
      include: {
        player1: {
          select: {
            name: true
          }
        }
      }
    });

    if (oldGames.length > 0) {
      // Удаляем старые игры
      await prisma.game.deleteMany({
        where: {
          status: 'WAITING',
          createdAt: {
            lt: tenMinutesAgo
          }
        }
      });

      console.log(`🧹 API: Очищено ${oldGames.length} старых WAITING игр`);
      
      return NextResponse.json({ 
        success: true, 
        cleaned: oldGames.length,
        games: oldGames.map(game => ({
          code: game.code,
          playerName: game.player1.name,
          createdAt: game.createdAt
        }))
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        cleaned: 0,
        message: 'Нет старых игр для очистки'
      });
    }
  } catch (error) {
    console.error('❌ Ошибка API очистки игр:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup games' },
      { status: 500 }
    );
  }
} 