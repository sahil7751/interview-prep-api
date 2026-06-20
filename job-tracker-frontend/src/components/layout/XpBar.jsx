import { useEffect, useState, useCallback } from 'react';
import { gamificationApi } from '../../api/gamificationApi';
import toast from 'react-hot-toast';

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
  const [stats, setStats]         = useState(null);
  const [checking, setChecking]   = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await gamificationApi.getStats();
      setStats(res.data.data);
    } catch {}
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleCheckIn = async () => {
    setChecking(true);
    try {
      const res = await gamificationApi.checkIn();
      const d   = res.data.data;

      if (d.alreadyCheckedIn) {
        toast(d.message, { icon: '⏰' });
      } else {
        toast.success(d.message);
        fetchStats();
      }
    } catch {
      toast.error('Check-in failed');
    } finally {
      setChecking(false);
    }
  };

  if (!stats) return null;

  const levelColor = LEVEL_COLORS[stats.currentLevel] || 'bg-indigo-500';
  const levelIcon  = LEVEL_ICONS[stats.currentLevel]  || '🌱';

  return (
    <div className="flex items-center gap-4">

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

      {/* Check-in Button */}
      <button
        onClick={handleCheckIn}
        disabled={checking || stats.checkedInToday}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium
          transition-colors flex items-center gap-1
          ${stats.checkedInToday
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
        {checking ? (
          <div className="w-3 h-3 border-2 border-white
                          border-t-transparent rounded-full
                          animate-spin"/>
        ) : stats.checkedInToday ? (
          <>✅ Checked In</>
        ) : (
          <>⚡ Check In (+5 XP)</>
        )}
      </button>

    </div>
  );
}


