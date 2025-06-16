import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const availableGames = await prisma.game.findMany({
      where: {
        status: 'WAITING',
        player2Id: null
      },
      include: {
        player1: {
          select: {
            id: true,
            name: true,
            wins: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Преобразуем данные в формат, ожидаемый фронтендом
    const formattedGames = availableGames.map(game => ({
      id: game.id,
      code: game.code,
      player1Name: game.player1.name || 'Неизвестный игрок',
      player1Wins: game.player1.wins,
      createdAt: game.createdAt.toISOString()
    }));

    return NextResponse.json(formattedGames);
  } catch (error) {
    console.error('Error fetching available games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available games' },
      { status: 500 }
    );
  }
} 