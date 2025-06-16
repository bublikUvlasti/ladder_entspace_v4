/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Серверные внешние пакеты
  serverExternalPackages: ['@prisma/client', 'argon2'],
  
  // Отключаем оптимизацию CSS чтобы избежать проблем с critters
  experimental: {
    optimizeCss: false
  }
}

export default nextConfig 