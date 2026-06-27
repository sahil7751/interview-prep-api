import { useEffect, useState, useCallback } from 'react';
import { gamificationApi } from '../../api/gamificationApi';

const LEVEL_COLORS = {
  'Beginner':          'bg-gray-400',
  'Learner':           'bg-blue-500',
  'Problem Solver':    'bg-purple-500',
  'Interview Ready':   'bg-amber-500',
  'Placement Warrior': 'bg-green-500',
};

const LEVEL_ICONS = {
  'Beginner':          '🌱',
  'Learner':           '📚',
  'Problem Solver':    '⚙️',
  'Interview Ready':   '🎯',
  'Placement Warrior': '🏆',
};

export default function XpBar() {
  const [stats, setStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await gamificationApi.getStats();
      setStats(res.data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (!stats) return null;

  const levelColor = LEVEL_COLORS[stats.currentLevel]
                  || 'bg-indigo-500';
  const levelIcon  = LEVEL_ICONS[stats.currentLevel] || '🌱';

  return (
    <div className="flex items-center gap-3">

      {/* Level Badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-base">{levelIcon}</span>
        <span className="text-xs font-semibold text-gray-700
                         hidden sm:block">
          {stats.currentLevel}
        </span>
      </div>

      {/* XP Progress */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {stats.totalXp} XP
        </span>
        <div className="w-24 h-2 bg-gray-200 rounded-full
                        overflow-hidden">
          <div
            className={`h-full rounded-full transition-all
                        duration-500 ${levelColor}`}
            style={{ width: `${stats.progressPercent}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {stats.nextLevel === 'MAX LEVEL'
            ? '🏆'
            : `→ ${stats.nextLevel}`}
        </span>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1 px-2 py-1
                      bg-orange-50 rounded-lg border
                      border-orange-200">
        <span className="text-sm">🔥</span>
        <span className="text-xs font-bold text-orange-600">
          {stats.currentStreak}
        </span>
      </div>
    </div>
  );
}