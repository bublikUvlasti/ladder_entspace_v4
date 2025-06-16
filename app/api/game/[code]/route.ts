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

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const game = await prisma.game.findUnique({ 
    where: { code },
    include: {
      player1: { select: { id: true, name: true, wins: true } },
      player2: { select: { id: true, name: true, wins: true } },
      winner: { select: { id: true, name: true } }
    }
  });
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  return NextResponse.json(game);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await params;
  const { stones } = await request.json();

  if (!stones || stones < 1 || stones > 48) {
    return NextResponse.json({ error: 'Stones must be between 1 and 48' }, { status: 400 });
  }

  const game = await prisma.game.findUnique({ where: { code } });
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }

  if (game.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: 'Game is not in progress' }, { status: 400 });
  }

  const isPlayer1 = game.player1Id === session.user.id;
  const isPlayer2 = game.player2Id === session.user.id;

  if (!isPlayer1 && !isPlayer2) {
    return NextResponse.json({ error: 'You are not a player in this game' }, { status: 400 });
  }

  // Check if it's player's turn
  if (isPlayer1 && game.move1 !== null) {
    return NextResponse.json({ error: 'You have already made your move this round' }, { status: 400 });
  }
  if (isPlayer2 && game.move2 !== null) {
    return NextResponse.json({ error: 'You have already made your move this round' }, { status: 400 });
  }

  // Update the move
  const updateData: any = {};
  if (isPlayer1) {
    updateData.move1 = stones;
  } else {
    updateData.move2 = stones;
  }

  let updatedGame = await prisma.game.update({
    where: { code },
    data: updateData
  });

  // 🔄 Broadcast move update
  const gameWithPlayers = await prisma.game.findUnique({
    where: { code },
    include: {
      player1: { select: { id: true, name: true, wins: true } },
      player2: { select: { id: true, name: true, wins: true } },
      winner: { select: { id: true, name: true } }
    }
  });
  
  broadcastGameUpdate(code, gameWithPlayers);

  // Check if both players have made their moves
  if (updatedGame.move1 !== null && updatedGame.move2 !== null) {
    // Calculate new positions and balances
    const move1 = updatedGame.move1;
    const move2 = updatedGame.move2;
    
    let newBalance1 = updatedGame.balance1 - move1;
    let newBalance2 = updatedGame.balance2 - move2;
    let newStonePosition = updatedGame.ballPosition;

    // Новая интуитивная механика: 
    // - Левый игрок (Player 1) толкает камень влево (позиция уменьшается)
    // - Правый игрок (Player 2) толкает камень вправо (позиция увеличивается)
    if (move1 > move2) {
      // Player 1 поставил больше - камень двигается влево (позиция уменьшается)
      newStonePosition -= 1;
    } else if (move2 > move1) {
      // Player 2 поставил больше - камень двигается вправо (позиция увеличивается)
      newStonePosition += 1;
    }
    // Если равно, камень не двигается

    // Ограничиваем позицию камня: -2, -1, 0, 1, 2
    newStonePosition = Math.max(-2, Math.min(2, newStonePosition));

    // Check for game end conditions
    let winnerId = null;
    let status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' = 'IN_PROGRESS';

    if (newStonePosition <= -2) {
      // Player 1 wins - камень достиг позиции -2 (левая сторона)
      winnerId = updatedGame.player1Id;
      status = 'FINISHED';
    } else if (newStonePosition >= 2) {
      // Player 2 wins - камень достиг позиции +2 (правая сторона)
      winnerId = updatedGame.player2Id;
      status = 'FINISHED';
    } else if (newBalance1 <= 0 && newBalance2 <= 0) {
      // Both players out of stones - winner is who has stone closer to their side
      if (newStonePosition < 0) {
        // Камень ближе к левой стороне - выигрывает левый игрок
        winnerId = updatedGame.player1Id;
      } else if (newStonePosition > 0) {
        // Камень ближе к правой стороне - выигрывает правый игрок
        winnerId = updatedGame.player2Id;
      }
      // If position is 0, it's a draw (no winner)
      status = 'FINISHED';
    } else if (newBalance1 <= 0) {
      // Player 1 out of stones, Player 2 wins
      winnerId = updatedGame.player2Id;
      status = 'FINISHED';
    } else if (newBalance2 <= 0) {
      // Player 2 out of stones, Player 1 wins
      winnerId = updatedGame.player1Id;
      status = 'FINISHED';
    }

    // Update game state
    updatedGame = await prisma.game.update({
      where: { code },
      data: {
        ballPosition: newStonePosition,
        balance1: Math.max(0, newBalance1),
        balance2: Math.max(0, newBalance2),
        move1: null,
        move2: null,
        status,
        winnerId
      }
    });

    // If game finished, update winner's wins count
    if (status === 'FINISHED' && winnerId) {
      await prisma.user.update({
        where: { id: winnerId },
        data: { wins: { increment: 1 } }
      });
    }
  }

  // Return updated game with player info
  const finalGame = await prisma.game.findUnique({
    where: { code },
    include: {
      player1: { select: { id: true, name: true, wins: true } },
      player2: { select: { id: true, name: true, wins: true } },
      winner: { select: { id: true, name: true } }
    }
  });

  // 🔄 Broadcast final game state
  broadcastGameUpdate(code, finalGame);

  return NextResponse.json(finalGame);
} 