'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  fullName: string;
  contactInfo: string;
  wins: number;
  losses: number;
  userType: 'ENTREPRENEUR' | 'STUDENT' | 'MANAGER' | null;
  // Поля для студентов
  studyPlace?: string;
  course?: string;
  // Поля для менеджеров
  companyName?: string;
  // Поля для предпринимателей
  businessName?: string;
  revenue?: string;
  industry?: string;
  businessRole?: string;
  businessGoals?: string;
  transformation?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.id) {
      fetchProfile();
    }
  }, [status, session, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setError('Не удалось загрузить профиль');
      }
    } catch (err) {
      setError('Ошибка при загрузке профиля');
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeLabel = (userType: string | null) => {
    switch (userType) {
      case 'ENTREPRENEUR':
        return 'Предприниматель';
      case 'STUDENT':
        return 'Студент';
      case 'MANAGER':
        return 'Менеджер';
      default:
        return 'Не указано';
    }
  };

  const getUserTypeIcon = (userType: string | null) => {
    switch (userType) {
      case 'ENTREPRENEUR':
        return '💼';
      case 'STUDENT':
        return '🎓';
      case 'MANAGER':
        return '👔';
      default:
        return '👤';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg">Загрузка профиля...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-900/40 border border-red-500/30 rounded-lg p-6 text-red-200">
          <h2 className="text-xl font-bold mb-2">Ошибка</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Профиль не найден</h2>
          <p className="text-gray-400">Попробуйте обновить страницу</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
            Мой Профиль
          </h1>
          <p className="text-gray-400">Информация о вашем аккаунте</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основная информация */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
                  {getUserTypeIcon(profile.userType)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{profile.fullName || profile.name}</h2>
                  <p className="text-blue-400">{getUserTypeLabel(profile.userType)}</p>
                  <p className="text-gray-400 text-sm">@{profile.name}</p>
                </div>
              </div>

              {/* Контактная информация */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Контактная информация</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Имя пользователя</label>
                    <p className="text-white bg-slate-700/50 rounded-lg px-3 py-2">
                      {profile.fullName || 'Не указано'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Контакт для связи</label>
                    <p className="text-white bg-slate-700/50 rounded-lg px-3 py-2">
                      {profile.contactInfo || 'Не указано'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Информация в зависимости от типа пользователя */}
              {profile.userType === 'STUDENT' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Информация об учебе</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Место учебы</label>
                      <p className="text-white bg-slate-700/50 rounded-lg px-3 py-2">
                        {profile.studyPlace || 'Не указано'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Курс</label>
                      <p className="text-white bg-slate-700/50 rounded-lg px-3 py-2">
                        {profile.course || 'Не указано'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {profile.userType === 'MANAGER' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Информация о работе</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Название компании</label>
                    <p className="text-white bg-slate-700/50 rounded-lg px-3 py-2">
                      {profile.companyName || 'Не указано'}
                    </p>
                  </div>
                </div>
              )}

              {profile.userType === 'ENTREPRENEUR' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Информация о бизнесе</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Название компании</label>
                      <p className="text-white bg-slate-700/50 rounded-lg px-3 py-2">
                        {profile.businessName || 'Не указано'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Оборот</label>
                      <p className="text-white bg-slate-700/50 rounded-lg px-3 py-2">
                        {profile.revenue || 'Не указано'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Индустрия</label>
                      <p className="text-white bg-slate-700/50 rounded-lg px-3 py-2">
                        {profile.industry || 'Не указано'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Роль в бизнесе</label>
                      <p className="text-white bg-slate-700/50 rounded-lg px-3 py-2">
                        {profile.businessRole || 'Не указано'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Текущие цели бизнеса</label>
                    <p className="text-white bg-slate-700/50 rounded-lg px-3 py-2 min-h-[60px]">
                      {profile.businessGoals || 'Не указано'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Трансформация бизнеса</label>
                    <p className="text-white bg-slate-700/50 rounded-lg px-3 py-2 min-h-[60px]">
                      {profile.transformation || 'Не указано'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Статистика */}
          <div className="space-y-6">
            <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4">Игровая статистика</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Побед:</span>
                  <span className="text-green-400 font-bold text-xl">{profile.wins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Поражений:</span>
                  <span className="text-red-400 font-bold text-xl">{profile.losses}</span>
                </div>
                <div className="border-t border-slate-600 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Всего игр:</span>
                    <span className="text-blue-400 font-bold text-xl">{profile.wins + profile.losses}</span>
                  </div>
                  {(profile.wins + profile.losses) > 0 && (
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-300">Процент побед:</span>
                      <span className="text-yellow-400 font-bold">
                        {Math.round((profile.wins / (profile.wins + profile.losses)) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-4">Информация об аккаунте</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-300 text-sm">Имя пользователя:</span>
                  <p className="text-white font-medium">{profile.name}</p>
                </div>
                <div>
                  <span className="text-gray-300 text-sm">Дата регистрации:</span>
                  <p className="text-white font-medium">
                    {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 