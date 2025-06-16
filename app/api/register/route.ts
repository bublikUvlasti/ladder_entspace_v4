import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import argon2 from 'argon2';

export async function POST(request: NextRequest) {
  try {
    const { 
      username, 
      password, 
      userType,
      // Новые поля
      fullName,
      contactInfo,
      city,
      // Поля для студентов
      studyPlace,
      course,
      studyDirection,
      // Поля для менеджеров
      companyName,
      // Поля для предпринимателей
      businessName,
      revenue,
      industry,
      businessRole,
      businessGoals,
      transformation
    } = await request.json();
    
    console.log('Registration attempt:', { username, userType, fullName });
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Имя пользователя и пароль обязательны' }, { status: 400 });
    }
    
    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: 'ФИО обязательно для заполнения' }, { status: 400 });
    }
    
    if (!contactInfo || !contactInfo.trim()) {
      return NextResponse.json({ error: 'Контактная информация обязательна для заполнения' }, { status: 400 });
    }
    
    if (password.length < 6) {
      return NextResponse.json({ error: 'Пароль должен содержать минимум 6 символов' }, { status: 400 });
    }

    // Проверяем, существует ли пользователь с таким именем
    const existingUserByName = await prisma.user.findFirst({
      where: { name: username }
    });

    if (existingUserByName) {
      return NextResponse.json({ error: 'Пользователь с таким именем уже существует' }, { status: 400 });
    }
    
    const hashed = await argon2.hash(password);
    
    // Создаем уникальный email на основе username и timestamp
    const uniqueEmail = `${username.toLowerCase()}_${Date.now()}@temp.local`;
    
    // Подготавливаем данные для создания пользователя
    const userData: any = {
      name: username,
      email: uniqueEmail,
      password: hashed,
      userType: userType || null,
      fullName: fullName.trim(),
      contactInfo: contactInfo.trim()
    };
    
    // Добавляем поля в зависимости от типа пользователя
    if (userType === 'STUDENT') {
      userData.studyPlace = studyPlace || null;
      userData.course = course || null;
      userData.studyDirection = studyDirection || null;
    } else if (userType === 'MANAGER' || userType === 'ENTREPRENEUR') {
      userData.businessName = businessName || null;
      userData.revenue = revenue || null;
      userData.industry = industry || null;
      userData.businessRole = businessRole || null;
      userData.businessGoals = businessGoals || null;
      userData.transformation = transformation || null;
    }
    
    // Город для всех типов пользователей
    userData.city = city || null;
    
    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });
    
    try {
      const user = await prisma.user.create({ data: userData });
      console.log('User created successfully:', { id: user.id, name: user.name, email: user.email, fullName: user.fullName });
      
      return NextResponse.json({ 
        id: user.id, 
        name: user.name, 
        email: user.email,
        fullName: user.fullName,
        userType: user.userType
      });
    } catch (err: any) {
      console.error('Prisma error:', err);
      
      if (err.code === 'P2002') {
        // Unique constraint violation
        const target = err.meta?.target;
        if (target?.includes('email')) {
          return NextResponse.json({ error: 'Email уже используется' }, { status: 400 });
        } else if (target?.includes('name')) {
          return NextResponse.json({ error: 'Пользователь с таким именем уже существует' }, { status: 400 });
        } else {
          return NextResponse.json({ error: 'Пользователь с такими данными уже существует' }, { status: 400 });
        }
      }
      throw err;
    }
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: err.message || 'Ошибка регистрации' }, { status: 500 });
  }
} 