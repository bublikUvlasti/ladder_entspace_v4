import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import argon2 from 'argon2';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Имя, email и пароль обязательны' }, { status: 400 });
    }
    const hashed = await argon2.hash(password);
    try {
      const user = await prisma.user.create({ data: { name, email, password: hashed } });
      return NextResponse.json({ id: user.id, name: user.name, email: user.email });
    } catch (err: any) {
      if (err.code === 'P2002') {
        return NextResponse.json({ error: 'Пользователь с таким email или именем уже существует' }, { status: 400 });
      }
      throw err;
    }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 400 });
  }
} 