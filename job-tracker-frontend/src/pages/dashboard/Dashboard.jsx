import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { dashboardApi } from '../../api/dashboardApi';
import { gamificationApi } from '../../api/gamificationApi';
import toast from 'react-hot-toast';

// ── Constants ────────────────────────────────────────────────────
const PIE_COLORS = [
  '#6366f1','#22c55e','#ef4444','#f59e0b',
  '#06b6d4','#8b5cf6','#f97316','#10b981','#3b82f6',
];

const LEVEL_ICONS = {
  'Beginner':          '🌱',
  'Learner':           '📚',
  'Problem Solver':    '⚙️',
  'Interview Ready':   '🎯',
  'Placement Warrior': '🏆',
};

const LEVEL_COLORS = {
  'Beginner':          'from-gray-400   to-gray-500',
  'Learner':           'from-blue-400   to-blue-600',
  'Problem Solver':    'from-purple-400 to-purple-600',
  'Interview Ready':   'from-amber-400  to-amber-600',
  'Placement Warrior': 'from-green-400  to-green-600',
};

// ── Main Component ───────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getDashboard()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async () => {
    try {
      const res = await gamificationApi.checkIn();
      const d   = res.data.data;
      if (d.alreadyCheckedIn) {
        toast(d.message, { icon: '⏰' });
      } else {
        toast.success(d.message);
        // Refresh dashboard to update stats
        const r = await dashboardApi.getDashboard();
        setData(r.data.data);
      }
    } catch {
      toast.error('Check-in failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500
                        border-t-transparent rounded-full
                        animate-spin"/>
      </div>
    );
  }

  if (!data) return null;

  const circumference = 2 * Math.PI * 36;
  const levelDash     = (data.progressPercent / 100) * circumference;

  return (
    <div className="space-y-6">

      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Your complete job search and preparation overview
          </p>
        </div>
        <button
          onClick={handleCheckIn}
          className={`px-4 py-2 rounded-lg text-sm font-medium
            transition-colors flex items-center gap-2
            ${data.checkedInToday
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
          {data.checkedInToday
            ? '✅ Checked In Today'
            : '⚡ Daily Check-in (+5 XP)'}
        </button>
      </div>

      {/* ── Level & XP Banner ──────────────────────────────────── */}
      <div className={`bg-gradient-to-r
        ${LEVEL_COLORS[data.currentLevel] ||
          'from-indigo-500 to-indigo-700'}
        rounded-2xl p-5 text-white`}>
        <div className="flex items-center gap-6">

          {/* Level Ring */}
          <div className="shrink-0">
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="8"/>
              <circle cx="44" cy="44" r="36"
                fill="none"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${levelDash} ${circumference}`}
                strokeDashoffset={circumference / 4}
                style={{
                  transition: 'stroke-dasharray 0.7s ease'
                }}
              />
              <text x="44" y="40" textAnchor="middle"
                fontSize="22" fill="white">
                {LEVEL_ICONS[data.currentLevel] || '🌱'}
              </text>
              <text x="44" y="58" textAnchor="middle"
                fontSize="11" fill="rgba(255,255,255,0.9)"
                fontWeight="600">
                {data.progressPercent}%
              </text>
            </svg>
          </div>

          {/* Level Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-medium
                          uppercase tracking-wider">
              Current Level
            </p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {data.currentLevel}
            </p>
            <p className="text-white/80 text-sm mt-1">
              {data.totalXp} XP total
              {data.nextLevel !== 'MAX LEVEL' &&
                ` · ${data.nextLevel} next`}
            </p>

            {/* XP Progress Bar */}
            <div className="mt-3 w-full max-w-xs">
              <div className="w-full h-2 bg-white/30
                              rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full
                             transition-all duration-700"
                  style={{ width: `${data.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Streak & Checkins */}
          <div className="shrink-0 text-right hidden sm:block">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  🔥 {data.currentStreak}
                </p>
                <p className="text-white/70 text-xs mt-0.5">
                  Day Streak
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {data.totalCheckins}
                </p>
                <p className="text-white/70 text-xs mt-0.5">
                  Check-ins
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {data.longestStreak}
                </p>
                <p className="text-white/70 text-xs mt-0.5">
                  Best Streak
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Application Stats ──────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700
                       uppercase tracking-wider mb-3">
          📋 Application Stats
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Applications"
                    value={data.totalApplications}
                    icon="📋" color="indigo"/>
          <StatCard label="Selected"
                    value={data.selectedCount}
                    icon="✅" color="green"
                    sub={`${data.successRate}% success rate`}/>
          <StatCard label="Rejected"
                    value={data.rejectedCount}
                    icon="❌" color="red"
                    sub={`${data.rejectionRate}% rejection rate`}/>
          <StatCard label="In Progress"
                    value={data.inProgressCount}
                    icon="⏳" color="amber"/>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <StatCard label="Applied"
                    value={data.appliedCount}
                    icon="📨" color="blue"/>
          <StatCard label="Offer Received"
                    value={data.offerReceivedCount}
                    icon="🎉" color="purple"/>
        </div>
      </div>

      {/* ── Practice & Profile Stats ────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700
                       uppercase tracking-wider mb-3">
          🧠 Practice & Profile Stats
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          <StatCard label="Questions Answered"
                    value={data.totalQuestionsAnswered}
                    icon="✍️" color="indigo"/>

          <StatCard
            label="Avg Interview Score"
            value={data.averageInterviewScore > 0
                    ? `${data.averageInterviewScore}/10`
                    : '—'}
            icon="🎯" color="green"
            sub={data.averageInterviewScore >= 7
                  ? 'Great performance!'
                  : data.averageInterviewScore > 0
                    ? 'Keep practicing'
                    : 'No sessions yet'}
          />

          <StatCard label="Practice Sessions"
                    value={data.totalPracticeSessions}
                    icon="🧠" color="purple"/>

          {/* Profile Completion */}
          <div className="bg-white rounded-xl border
                          border-gray-200 p-5">
            <div className="flex items-center
                            justify-between mb-3">
              <span className="text-sm text-gray-500
                               font-medium">
                Profile Complete
              </span>
              <span className="text-lg">👤</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {data.profileCompletion}%
            </p>
            <div className="mt-2 w-full h-1.5 bg-gray-100
                            rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all
                  ${data.profileCompletion >= 80
                      ? 'bg-green-500'
                      : data.profileCompletion >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-400'}`}
                style={{
                  width: `${data.profileCompletion}%`
                }}
              />
            </div>
            {data.profileCompletion < 100 && (
              <p className="text-xs text-gray-400 mt-1">
                Complete your profile
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Charts ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar Chart */}
        <div className="bg-white rounded-xl border
                        border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Monthly Applications
          </h3>
          {data.monthlyTrend.length === 0 ? (
            <EmptyChart message="No applications yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.monthlyTrend}>
                <XAxis dataKey="month"
                       tick={{ fontSize: 11 }}
                       tickLine={false}/>
                <YAxis allowDecimals={false}
                       tick={{ fontSize: 11 }}
                       tickLine={false}
                       axisLine={false}/>
                <Tooltip contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}/>
                <Bar dataKey="count"
                     fill="#6366f1"
                     radius={[4,4,0,0]}
                     name="Applications"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl border
                        border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Status Breakdown
          </h3>
          {data.statusBreakdown.length === 0 ? (
            <EmptyChart message="No applications yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ status, percent }) =>
                    `${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={10}>
                  {data.statusBreakdown.map((_, i) => (
                    <Cell key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) =>
                    [v, n.replace(/_/g, ' ')]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Recent Activity ─────────────────────────────────────── */}
      {data.recentActivity?.length > 0 && (
        <div className="bg-white rounded-xl border
                        border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {data.recentActivity.map((activity, i) => (
              <div key={i}
                   className="flex items-center gap-3
                              py-2 border-b border-gray-50
                              last:border-0">
                <div className="w-8 h-8 rounded-full
                                bg-indigo-50 flex items-center
                                justify-center text-base shrink-0">
                  {activity.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900
                                truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.subtitle}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function StatCard({ label, value, icon, color = 'indigo', sub }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50  text-green-600',
    red:    'bg-red-50    text-red-600',
    amber:  'bg-amber-50  text-amber-600',
    blue:   'bg-blue-50   text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 font-medium">
          {label}
        </span>
        <span className={`w-9 h-9 rounded-lg flex items-center
          justify-center text-lg ${colors[color]}`}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && (
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      )}
    </div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-48 flex items-center justify-center
                    text-gray-400 text-sm">
      {message}
    </div>
  );
}