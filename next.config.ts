import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Включаем standalone сборку для Docker (уменьшает размер образа)
  output: 'standalone',
  
  // Оптимизации для продакшена
  compress: true,
  poweredByHeader: false,
  
  // Оптимизация изображений
  images: {
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
  
  // Исправление проблем с framer-motion
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({
      'framer-motion': 'framer-motion'
    });
    return config;
  },
  
  // Экспериментальные оптимизации (отключаем optimizeCss для избежания проблем)
  experimental: {
    // optimizeCss: true, // Отключено - требует пакет critters
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
};

export default nextConfig;
