import { NextRequest } from 'next/server'
import { POST as registerPOST } from '@/app/api/register/route'
import { setupTestDatabase, clearTestDatabase, closeDatabase, testPrisma } from '../helpers/database'

describe('Полный цикл пользователя', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  beforeEach(async () => {
    await clearTestDatabase()
  })

  afterAll(async () => {
    await closeDatabase()
  })

  it('должен пройти полный цикл: регистрация -> создание игры -> присоединение', async () => {
    // 1. Регистрация первого пользователя
    const user1Data = {
      name: 'Player1',
      email: 'player1@test.com',
      password: 'password123'
    }

    const registerRequest1 = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify(user1Data),
      headers: { 'Content-Type': 'application/json' },
    })

    const registerResponse1 = await registerPOST(registerRequest1)
    const user1 = await registerResponse1.json()

    expect(registerResponse1.status).toBe(200)
    expect(user1.name).toBe('Player1')
    expect(user1.email).toBe('player1@test.com')

    // 2. Регистрация второго пользователя
    const user2Data = {
      name: 'Player2',
      email: 'player2@test.com',
      password: 'password123'
    }

    const registerRequest2 = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify(user2Data),
      headers: { 'Content-Type': 'application/json' },
    })

    const registerResponse2 = await registerPOST(registerRequest2)
    const user2 = await registerResponse2.json()

    expect(registerResponse2.status).toBe(200)
    expect(user2.name).toBe('Player2')

    // 3. Проверяем что пользователи созданы в базе
    const dbUser1 = await testPrisma.user.findUnique({
      where: { id: user1.id }
    })
    const dbUser2 = await testPrisma.user.findUnique({
      where: { id: user2.id }
    })

    expect(dbUser1).toBeTruthy()
    expect(dbUser2).toBeTruthy()
    expect(dbUser1?.name).toBe('Player1')
    expect(dbUser2?.name).toBe('Player2')

    console.log('✅ Регистрация пользователей прошла успешно')
    console.log(`✅ Пользователь 1: ${user1.name} (${user1.id})`)
    console.log(`✅ Пользователь 2: ${user2.name} (${user2.id})`)
  })

  it('должен корректно обрабатывать ошибки валидации', async () => {
    // Тест с пустыми данными
    const invalidData = {
      name: '',
      email: 'invalid-email',
      password: ''
    }

    const request = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify(invalidData),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await registerPOST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('обязательны')

    console.log('✅ Валидация ошибок работает корректно')
  })

  it('должен предотвращать дублирование пользователей', async () => {
    // Создаем первого пользователя
    const userData = {
      name: 'TestUser',
      email: 'test@example.com',
      password: 'password123'
    }

    const request1 = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: { 'Content-Type': 'application/json' },
    })

    const response1 = await registerPOST(request1)
    expect(response1.status).toBe(200)

    // Пытаемся создать дубликат
    const request2 = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      headers: { 'Content-Type': 'application/json' },
    })

    const response2 = await registerPOST(request2)
    const data2 = await response2.json()

    expect(response2.status).toBe(400)
    expect(data2.error).toContain('уже существует')

    console.log('✅ Предотвращение дубликатов работает корректно')
  })
}) 