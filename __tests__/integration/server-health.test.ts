describe('Проверка работы сервера', () => {
  const SERVER_URL = 'http://localhost:3000'

  it('должен отвечать на главной странице', async () => {
    try {
      const response = await globalThis.fetch(SERVER_URL)
      expect(response.status).toBe(200)
      console.log('✅ Главная страница доступна')
    } catch (error) {
      console.log('❌ Сервер не запущен или недоступен')
      console.log('Запустите сервер командой: npm run dev')
      throw error
    }
  })

  it('должен отвечать на API регистрации', async () => {
    try {
      const testUser = {
        name: 'ServerTestUser',
        email: 'servertest@example.com',
        password: 'password123'
      }

      const response = await globalThis.fetch(`${SERVER_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testUser),
      })

      const data = await response.json()
      
      if (response.status === 200) {
        expect(data.name).toBe('ServerTestUser')
        expect(data.email).toBe('servertest@example.com')
        console.log('✅ API регистрации работает корректно')
        console.log(`✅ Создан пользователь: ${data.name} (${data.id})`)
      } else if (response.status === 400 && data.error?.includes('уже существует')) {
        console.log('✅ API регистрации работает (пользователь уже существует)')
      } else {
        throw new Error(`Неожиданный ответ: ${response.status} - ${JSON.stringify(data)}`)
      }
    } catch (error) {
      console.log('❌ Ошибка при тестировании API регистрации')
      throw error
    }
  })

  it('должен отвечать на страницу регистрации', async () => {
    try {
      const response = await globalThis.fetch(`${SERVER_URL}/auth/register`)
      expect(response.status).toBe(200)
      console.log('✅ Страница регистрации доступна')
    } catch (error) {
      console.log('❌ Страница регистрации недоступна')
      throw error
    }
  })

  it('должен отвечать на страницу входа', async () => {
    try {
      const response = await globalThis.fetch(`${SERVER_URL}/auth/login`)
      expect(response.status).toBe(200)
      console.log('✅ Страница входа доступна')
    } catch (error) {
      console.log('❌ Страница входа недоступна')
      throw error
    }
  })
}) 