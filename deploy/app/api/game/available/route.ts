import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

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

    return NextResponse.json({ games: availableGames });
  } catch (error) {
    console.error('Error fetching available games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available games' },
      { status: 500 }
    );
  }
} 