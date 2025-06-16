'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface LeaderboardPlayer {
  id: string;
  name: string;
  fullName: string;
  wins: number;
  losses: number;
  userType: 'ENTREPRENEUR' | 'STUDENT' | 'MANAGER' | null;
  rank: number;
}

export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated') {
      fetchLeaderboard();
    }
  }, [status, router]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setPlayers(data);
      } else {
        setError('Не удалось загрузить рейтинг');
      }
    } catch (err) {
      setError('Ошибка при загрузке рейтинга');
    } finally {
      setLoading(false);
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-400';
      case 2:
        return 'text-gray-300';
      case 3:
        return 'text-amber-600';
      default:
        return 'text-gray-400';
    }
  };

  const isCurrentUser = (playerId: string) => {
    return session?.user?.id === playerId;
  };

  const getDisplayName = (player: LeaderboardPlayer) => {
    return player.fullName || player.name;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg">Загрузка рейтинга...</span>
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

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-blue-400 to-white bg-clip-text text-transparent">
            🏆 Топ Игроков
          </h1>
          <p className="text-gray-400">Рейтинг лучших игроков Скифской Лестницы</p>
        </div>

        {players.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold mb-2">Пока нет игроков</h2>
            <p className="text-gray-400">Станьте первым в рейтинге!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Топ 3 */}
            {players.slice(0, 3).length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-center mb-6 text-yellow-400">Подиум</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {players.slice(0, 3).map((player) => (
                    <div
                      key={player.id}
                      className={`relative bg-gradient-to-br ${
                        player.rank === 1
                          ? 'from-yellow-500/20 to-yellow-600/10 border-yellow-400/30'
                          : player.rank === 2
                          ? 'from-gray-400/20 to-gray-500/10 border-gray-400/30'
                          : 'from-amber-600/20 to-amber-700/10 border-amber-600/30'
                      } border rounded-xl p-6 backdrop-blur-sm ${
                        isCurrentUser(player.id) ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      {isCurrentUser(player.id) && (
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          Вы
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-4xl mb-2">{getRankIcon(player.rank)}</div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="text-lg">{getUserTypeIcon(player.userType)}</span>
                          <h3 className="text-xl font-bold text-white">{getDisplayName(player)}</h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">@{player.name}</p>
                        <p className="text-sm text-gray-400 mb-3">{getUserTypeLabel(player.userType)}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Побед:</span>
                            <span className="text-green-400 font-bold">{player.wins}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Поражений:</span>
                            <span className="text-red-400 font-bold">{player.losses}</span>
                          </div>
                          {(player.wins + player.losses) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-300">Процент:</span>
                              <span className="text-yellow-400 font-bold">
                                {Math.round((player.wins / (player.wins + player.losses)) * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Остальные игроки */}
            {players.length > 3 && (
              <div>
                <h2 className="text-xl font-bold mb-4 text-gray-300">Остальные игроки</h2>
                <div className="space-y-3">
                  {players.slice(3).map((player) => (
                    <div
                      key={player.id}
                      className={`bg-slate-800/40 border border-slate-600/30 rounded-lg p-4 backdrop-blur-sm transition-all hover:bg-slate-700/40 ${
                        isCurrentUser(player.id) ? 'ring-2 ring-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`text-2xl font-bold ${getRankColor(player.rank)} min-w-[3rem]`}>
                            {getRankIcon(player.rank)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getUserTypeIcon(player.userType)}</span>
                            <div>
                              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                {getDisplayName(player)}
                                {isCurrentUser(player.id) && (
                                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                    Вы
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-gray-400">@{player.name} • {getUserTypeLabel(player.userType)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="text-green-400 font-bold">{player.wins}</div>
                            <div className="text-gray-400">Побед</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 font-bold">{player.losses}</div>
                            <div className="text-gray-400">Поражений</div>
                          </div>
                          {(player.wins + player.losses) > 0 && (
                            <div className="text-center">
                              <div className="text-yellow-400 font-bold">
                                {Math.round((player.wins / (player.wins + player.losses)) * 100)}%
                              </div>
                              <div className="text-gray-400">Процент</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 