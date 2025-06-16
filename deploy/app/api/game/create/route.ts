import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { customAlphabet } from 'nanoid';

export async function POST(req: NextRequest) {
  // Ensure user is authenticated
  const session = await getServerSession(authOptions);
  
  console.log('Session in create game:', session); // Debug log
  
  if (!session?.user?.id) {
    console.log('No session or user ID found'); // Debug log
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate unique code using only letters and numbers
  const generateCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);
  let code: string;
  do {
    code = generateCode();
  } while (await prisma.game.findUnique({ where: { code } }));

  const game = await prisma.game.create({
    data: {
      code,
      player1Id: session.user.id,
      status: 'WAITING',
    },
  });

  return NextResponse.json({ code: game.code });
} 