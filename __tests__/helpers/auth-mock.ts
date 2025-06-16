// Мок для NextAuth
export const mockNextAuth = () => {
  jest.mock('next-auth/next', () => ({
    getServerSession: jest.fn()
  }))
  
  jest.mock('next-auth', () => ({
    __esModule: true,
    default: jest.fn(() => ({
      GET: jest.fn(),
      POST: jest.fn()
    }))
  }))
} 