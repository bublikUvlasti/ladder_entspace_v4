'use client';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import { motion, AnimatePresence } from 'framer-motion';

type UserType = 'ENTREPRENEUR' | 'STUDENT' | 'MANAGER' | '';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('');
  
  // Новые поля
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  
  // Поля для студентов
  const [studyPlace, setStudyPlace] = useState('');
  const [course, setCourse] = useState('');
  const [studyDirection, setStudyDirection] = useState('');
  
  // Поля для предпринимателей и менеджеров
  const [businessName, setBusinessName] = useState('');
  const [revenue, setRevenue] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessRole, setBusinessRole] = useState('');
  const [businessGoals, setBusinessGoals] = useState('');
  const [transformation, setTransformation] = useState('');
  
  // Общие поля для всех типов пользователей
  const [city, setCity] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    if (!userType) {
      setError('Выберите тип пользователя');
      setLoading(false);
      return;
    }

    if (!fullName.trim()) {
      setError('Введите ваше имя пользователя');
      setLoading(false);
      return;
    }

    if (!contactInfo.trim()) {
      setError('Введите контактную информацию');
      setLoading(false);
      return;
    }

    try {
      const requestData: any = {
        username,
        password,
        userType,
        fullName: fullName.trim(),
        contactInfo: contactInfo.trim()
      };

      // Добавляем поля в зависимости от типа пользователя
      if (userType === 'STUDENT') {
        requestData.studyPlace = studyPlace;
        requestData.course = course;
        requestData.studyDirection = studyDirection;
      } else if (userType === 'MANAGER' || userType === 'ENTREPRENEUR') {
        requestData.businessName = businessName;
        requestData.revenue = revenue;
        requestData.industry = industry;
        requestData.businessRole = businessRole;
        requestData.businessGoals = businessGoals;
        requestData.transformation = transformation;
      }
      
      // Город для всех типов пользователей
      requestData.city = city;

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto login after registration
        const result = await signIn('credentials', {
          username,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError('Регистрация прошла успешно, но не удалось войти');
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || 'Ошибка регистрации');
      }
    } catch (err) {
      setError('Произошла ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-white bg-clip-text text-transparent">
            Скифская Лестница
          </h1>
          <p className="text-gray-400">Создайте новый аккаунт</p>
        </div>

        <div className="bg-slate-800/40 border border-slate-600/30 rounded-xl p-6 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Тип пользователя */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Кем вы являетесь? *
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value as UserType)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                <option value="">Выберите тип</option>
                <option value="ENTREPRENEUR">Предприниматель</option>
                <option value="STUDENT">Студент</option>
                <option value="MANAGER">Менеджер</option>
              </select>
            </div>

            {/* ФИО */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                Имя пользователя *
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Введите ваше полное имя (Фамилия Имя Отчество)"
                required
              />
            </div>

            {/* Контактная информация */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Контакт для связи *
              </label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Телефон, Telegram, VK или другой способ связи"
                required
              />
            </div>

            {/* Основные поля */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Пароль *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Введите пароль (минимум 6 символов)"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Подтвердите пароль *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Повторите пароль"
                required
              />
            </div>

            {/* Город проживания для всех пользователей */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Город проживания
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Например: Москва, Санкт-Петербург"
              />
            </div>

            {/* Дополнительные поля для студентов */}
            {userType === 'STUDENT' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Место учебы
                  </label>
                  <input
                    type="text"
                    value={studyPlace}
                    onChange={(e) => setStudyPlace(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Название учебного заведения"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Курс
                  </label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Например: 3 курс, магистратура"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Направление обучения
                  </label>
                  <input
                    type="text"
                    value={studyDirection}
                    onChange={(e) => setStudyDirection(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Например: экономика, информатика"
                  />
                </div>
              </>
            )}

            {/* Дополнительные поля для менеджеров и предпринимателей */}
            {(userType === 'MANAGER' || userType === 'ENTREPRENEUR') && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Название компании
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Название бизнеса"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Оборот
                    </label>
                    <input
                      type="text"
                      value={revenue}
                      onChange={(e) => setRevenue(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Например: до 1 млн, 1-5 млн"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Индустрия
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="IT, торговля, услуги..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Роль в бизнесе
                    </label>
                    <input
                      type="text"
                      value={businessRole}
                      onChange={(e) => setBusinessRole(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Основатель, CEO, партнер..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Текущие цели бизнеса
                  </label>
                  <textarea
                    value={businessGoals}
                    onChange={(e) => setBusinessGoals(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Опишите ваши текущие бизнес-цели..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Какой переход/трансформацию совершаете в бизнесе
                  </label>
                  <textarea
                    value={transformation}
                    onChange={(e) => setTransformation(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    placeholder="Опишите трансформации или изменения в вашем бизнесе..."
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-900/40 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:shadow-green-500/25 hover:scale-105'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Регистрация...
                </div>
              ) : (
                'Зарегистрироваться'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Уже есть аккаунт?{' '}
              <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                Войти
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-gray-400 hover:text-gray-300 transition-colors text-sm">
              ← Назад на главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 