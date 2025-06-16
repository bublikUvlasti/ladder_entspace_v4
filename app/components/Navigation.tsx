'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Не показываем навигацию на страницах авторизации
  if (pathname?.startsWith('/auth/')) {
    return null;
  }

  // Не показываем навигацию на игровых страницах
  if (pathname?.startsWith('/game/')) {
    return null;
  }

  // Если пользователь не авторизован, не показываем навигацию
  if (!session) {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Игра', icon: '🎮' },
    { href: '/about', label: 'О игре', icon: '📖' },
    { href: '/profile', label: 'Профиль', icon: '👤' },
    { href: '/leaderboard', label: 'Топ игроков', icon: '🏆' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname?.startsWith('/game/');
    }
    return pathname === href;
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <nav className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-600/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
              Скифская Лестница
            </Link>
          </div>

          {/* Навигация для десктопа */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Информация о пользователе */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{session.user?.name}</div>
                  <div className="text-xs text-gray-400">Побед: {session.user?.wins || 0}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>

          {/* Мобильное меню кнопка */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-slate-700 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Открыть главное меню</span>
              {!isMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Мобильное меню */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800/95 backdrop-blur-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="border-t border-slate-600 pt-4 pb-3">
              <div className="flex items-center px-3">
                <div className="flex-shrink-0">
                  <div className="text-base font-medium text-white">{session.user?.name}</div>
                  <div className="text-sm text-gray-400">Побед: {session.user?.wins || 0}</div>
                </div>
              </div>
              <div className="mt-3 px-2">
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-red-600 transition-colors"
                >
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 