import { NextRequest } from 'next/server'
import { setupTestDatabase, clearTestDatabase, closeDatabase, testPrisma } from '../../helpers/database'
import { mockNextAuth } from '../../helpers/auth-mock'

// Мокаем NextAuth
mockNextAuth()

import { POST } from '@/app/api/game/join/route'
import { getServerSession } from 'next-auth/next'

describe('/api/game/join', () => {
  let testUser1: any
  let testUser2: any
  let gameSession: any

  beforeAll(async () => {
    await setupTestDatabase()
  })

  beforeEach(async () => {
    await clearTestDatabase()
    
    // Создаем тестовых пользователей
    testUser1 = await testPrisma.user.create({
      data: {
        name: 'Player1',
        email: 'player1@example.com',
        password: 'hashedpassword'
      }
    })

    testUser2 = await testPrisma.user.create({
      data: {
        name: 'Player2',
        email: 'player2@example.com',
        password: 'hashedpassword'
      }
    })

    // Создаем игровую сессию
    gameSession = await testPrisma.gameSession.create({
      data: {
        code: 'TEST123',
        player1Id: testUser1.id,
        status: 'WAITING'
      }
    })
  })

  afterAll(async () => {
    await closeDatabase()
  })

  it('должен успешно присоединить игрока к сессии', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser2.id }
    })

    const requestBody = {
      code: 'TEST123'
    }

    const request = new NextRequest('http://localhost:3000/api/game/join', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.code).toBe('TEST123')
    expect(data.status).toBe('IN_PROGRESS')
    expect(data.player1Id).toBe(testUser1.id)
    expect(data.player2Id).toBe(testUser2.id)

    // Проверяем что сессия обновилась в базе
    const updatedSession = await testPrisma.gameSession.findUnique({
      where: { code: 'TEST123' }
    })
    expect(updatedSession?.player2Id).toBe(testUser2.id)
    expect(updatedSession?.status).toBe('IN_PROGRESS')
  })

  it('должен вернуть ошибку если сессия не найдена', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser2.id }
    })

    const requestBody = {
      code: 'INVALID'
    }

    const request = new NextRequest('http://localhost:3000/api/game/join', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toContain('не найдена')
  })

  it('должен вернуть ошибку если игрок пытается присоединиться к своей же сессии', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser1.id }
    })

    const requestBody = {
      code: 'TEST123'
    }

    const request = new NextRequest('http://localhost:3000/api/game/join', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('присоединиться к своей')
  })

  it('должен вернуть ошибку если сессия уже заполнена', async () => {
    // Обновляем сессию - добавляем второго игрока
    await testPrisma.gameSession.update({
      where: { code: 'TEST123' },
      data: {
        player2Id: testUser2.id,
        status: 'IN_PROGRESS'
      }
    })

    // Создаем третьего пользователя
    const testUser3 = await testPrisma.user.create({
      data: {
        name: 'Player3',
        email: 'player3@example.com',
        password: 'hashedpassword'
      }
    })

    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser3.id }
    })

    const requestBody = {
      code: 'TEST123'
    }

    const request = new NextRequest('http://localhost:3000/api/game/join', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('уже заполнена')
  })

  it('должен вернуть ошибку если пользователь не авторизован', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null)

    const requestBody = {
      code: 'TEST123'
    }

    const request = new NextRequest('http://localhost:3000/api/game/join', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('авторизации')
  })
}) 