import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { io as ioClient } from 'socket.io-client';

// Подключение к WebSocket серверу
let socketClient: any = null;

const getSocketClient = () => {
  if (!socketClient) {
    socketClient = ioClient('http://localhost:3001');
  }
  return socketClient;
};

// Функция для broadcast обновлений игры
const broadcastGameUpdate = (gameCode: string, gameData: any) => {
  try {
    const client = getSocketClient();
    client.emit('broadcast-to-room', `game:${gameCode}`, 'game-update', gameData);
    console.log(`🔄 Broadcasted game update for ${gameCode}`);
  } catch (error) {
    console.error('❌ WebSocket broadcast error:', error);
  }
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code) {
    return NextResponse.json({ error: 'Game code is required' }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { code } });
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  if (game.status !== 'WAITING') {
    return NextResponse.json({ error: 'Game already started or finished' }, { status: 400 });
  }
  if (game.player1Id === session.user.id) {
    return NextResponse.json({ error: 'Cannot join your own game' }, { status: 400 });
  }

  const updated = await prisma.game.update({
    where: { code },
    data: { player2Id: session.user.id, status: 'IN_PROGRESS' }
  });

  // 🔄 Get updated game with player info and broadcast
  const gameWithPlayers = await prisma.game.findUnique({
    where: { code },
    include: {
      player1: { select: { id: true, name: true, wins: true } },
      player2: { select: { id: true, name: true, wins: true } },
      winner: { select: { id: true, name: true } }
    }
  });

  broadcastGameUpdate(code, gameWithPlayers);

  return NextResponse.json({ code: updated.code });
} 