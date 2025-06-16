'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useSocket } from '../lib/useSocket';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { connected, authenticated, user } = useSocket(session?.user?.id);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black">
        <divdiv
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            Ladder Game
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Настольная игра "Лестница" в онлайне. Играйте с друзьями в реальном времени!
          </p>
        </div>

        {/* Game Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-blue-600 text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Создать игру</h2>
            <p className="text-gray-600 mb-6">
              Создайте новую игру и пригласите друзей по коду
            </p>
            <Link 
              href="/game/create"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Создать игру
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-green-600 text-6xl mb-4">🚪</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Присоединиться</h2>
            <p className="text-gray-600 mb-6">
              Введите код игры чтобы присоединиться к существующей игре
            </p>
            <Link 
              href="/game/join"
              className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Присоединиться
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Мгновенная игра</h3>
            <p className="text-gray-600">Подключайтесь и играйте без регистрации</p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">🌐</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Онлайн мультиплеер</h3>
            <p className="text-gray-600">Играйте с друзьями в реальном времени</p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Любые устройства</h3>
            <p className="text-gray-600">Работает на компьютере, планшете и телефоне</p>
          </div>
        </div>

        {/* Auth Links */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-gray-600 mb-4">
            Хотите сохранить статистику игр?
          </p>
          <div className="space-x-4">
            <Link 
              href="/auth/login"
              className="inline-block border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:border-gray-400 transition-colors"
            >
              Войти
            </Link>
            <Link 
              href="/auth/register"
              className="inline-block bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Регистрация
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
