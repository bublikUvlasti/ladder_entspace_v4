import { NextRequest } from 'next/server'
import { POST } from '@/app/api/register/route'
import { setupTestDatabase, clearTestDatabase, closeDatabase, testPrisma } from '../helpers/database'

describe('/api/register', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  beforeEach(async () => {
    await clearTestDatabase()
  })

  afterAll(async () => {
    await closeDatabase()
  })

  it('должен успешно зарегистрировать нового пользователя', async () => {
    const requestBody = {
      name: 'TestUser',
      email: 'test@example.com',
      password: 'password123'
    }

    const request = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('id')
    expect(data.name).toBe('TestUser')
    expect(data.email).toBe('test@example.com')
    expect(data).not.toHaveProperty('password')

    // Проверяем что пользователь создался в базе
    const user = await testPrisma.user.findUnique({
      where: { email: 'test@example.com' }
    })
    expect(user).toBeTruthy()
    expect(user?.name).toBe('TestUser')
  })

  it('должен вернуть ошибку при дублировании email', async () => {
    // Создаем первого пользователя
    await testPrisma.user.create({
      data: {
        name: 'ExistingUser',
        email: 'test@example.com',
        password: 'hashedpassword'
      }
    })

    const requestBody = {
      name: 'NewUser',
      email: 'test@example.com', // Тот же email
      password: 'password123'
    }

    const request = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('уже существует')
  })

  it('должен вернуть ошибку при дублировании имени', async () => {
    // Создаем первого пользователя
    await testPrisma.user.create({
      data: {
        name: 'TestUser',
        email: 'existing@example.com',
        password: 'hashedpassword'
      }
    })

    const requestBody = {
      name: 'TestUser', // То же имя
      email: 'new@example.com',
      password: 'password123'
    }

    const request = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('уже существует')
  })

  it('должен вернуть ошибку при отсутствии обязательных полей', async () => {
    const requestBody = {
      name: 'TestUser',
      // Отсутствуют email и password
    }

    const request = new NextRequest('http://localhost:3000/api/register', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('обязательны')
  })
}) 