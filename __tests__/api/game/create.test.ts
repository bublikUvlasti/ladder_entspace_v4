import { NextRequest } from 'next/server'
import { setupTestDatabase, clearTestDatabase, closeDatabase, testPrisma } from '../../helpers/database'
import { mockNextAuth } from '../../helpers/auth-mock'

// Мокаем NextAuth
mockNextAuth()

import { POST } from '@/app/api/game/create/route'
import { getServerSession } from 'next-auth/next'

describe('/api/game/create', () => {
  let testUser: any

  beforeAll(async () => {
    await setupTestDatabase()
  })

  beforeEach(async () => {
    await clearTestDatabase()
    
    // Создаем тестового пользователя
    testUser = await testPrisma.user.create({
      data: {
        name: 'TestPlayer',
        email: 'player@example.com',
        password: 'hashedpassword'
      }
    })
  })

  afterAll(async () => {
    await closeDatabase()
  })

  it('должен успешно создать игровую сессию', async () => {
    // Мокаем сессию пользователя
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id }
    })

    const request = new NextRequest('http://localhost:3000/api/game/create', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('code')
    expect(data.status).toBe('WAITING')
    expect(data.player1Id).toBe(testUser.id)
    expect(data.player2Id).toBeNull()
    expect(data.ballPosition).toBe(0) // Позиция камня: 0 - стартовая позиция в центре
    expect(data.balance1).toBe(50)
    expect(data.balance2).toBe(50)

    // Проверяем что сессия создалась в базе
    const session = await testPrisma.gameSession.findUnique({
      where: { code: data.code }
    })
    expect(session).toBeTruthy()
  })

  it('должен вернуть ошибку если пользователь не авторизован', async () => {
    // Мокаем отсутствие сессии
    (getServerSession as jest.Mock).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/game/create', {
      method: 'POST',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toContain('авторизации')
  })

  it('должен создать уникальный код для каждой сессии', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: testUser.id }
    })

    // Создаем первую сессию
    const request1 = new NextRequest('http://localhost:3000/api/game/create', {
      method: 'POST',
    })
    const response1 = await POST(request1)
    const data1 = await response1.json()

    // Создаем вторую сессию
    const request2 = new NextRequest('http://localhost:3000/api/game/create', {
      method: 'POST',
    })
    const response2 = await POST(request2)
    const data2 = await response2.json()

    expect(response1.status).toBe(200)
    expect(response2.status).toBe(200)
    expect(data1.code).not.toBe(data2.code)
  })
}) 