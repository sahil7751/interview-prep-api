import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { dashboardApi } from '../../api/dashboardApi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ── Constants ────────────────────────────────────────────────────
const PIE_COLORS = [
  '#6366f1','#22c55e','#ef4444','#f59e0b',
  '#06b6d4','#8b5cf6','#f97316','#10b981',
];

const LEVEL_ICONS = {
  'Beginner':          '🌱',
  'Learner':           '📚',
  'Problem Solver':    '⚙️',
  'Interview Ready':   '🎯',
  'Placement Warrior': '🏆',
};

const LEVEL_GRADIENTS = {
  'Beginner':          'from-slate-500   to-slate-700',
  'Learner':           'from-blue-500    to-blue-700',
  'Problem Solver':    'from-purple-500  to-purple-700',
  'Interview Ready':   'from-amber-500   to-amber-700',
  'Placement Warrior': 'from-green-500   to-green-700',
};

const MOTIVATIONAL = [
  (name, xp, next) =>
    `You're ${xp} XP away from ${next}. Keep going, ${name}! 🚀`,
  (name) =>
    `Every expert was once a beginner. You're doing great, ${name}! 💪`,
  (name) =>
    `Consistency beats perfection. Keep showing up, ${name}! 🔥`,
  (name, xp) =>
    `${xp} XP earned so far. Your hard work is paying off! ⚡`,
  (name) =>
    `Today is a great day to practice an interview, ${name}! 🎯`,
  (name) =>
    `Complete one AI interview today to earn +5 XP, ${name}! 🧠`,
];

const TODAY_TASKS = [
  { icon: '💻', task: 'Solve 2 DSA problems',      xp: 10, path: '/interview-practice' },
  { icon: '🎤', task: 'Practice one interview',     xp: 5,  path: '/interview-practice' },
  { icon: '📋', task: 'Apply to one job',           xp: 10, path: '/applications'       },
  { icon: '🎯', task: 'Improve your ATS score',     xp: 10, path: '/resume'             },
  { icon: '💬', task: 'Ask the Career Coach',       xp: 3,  path: '/career-coach'       },
  { icon: '🗺️',  task: 'Complete a roadmap task',   xp: 5,  path: '/roadmap'            },
  { icon: '📄', task: 'Upload an updated resume',   xp: 15, path: '/resume'             },
  { icon: '🧠', task: 'Generate interview questions',xp: 2,  path: '/interview-practice'},
];

const QUICK_ACTIONS = [
  { icon: '📋', label: 'Add Application',   path: '/applications',       color: 'bg-blue-50   text-blue-700   border-blue-200'   },
  { icon: '✨', label: 'Generate Resume',   path: '/resume',             color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { icon: '📄', label: 'Upload Resume',     path: '/resume',             color: 'bg-green-50  text-green-700  border-green-200'  },
  { icon: '🧠', label: 'Practice Interview',path: '/interview-practice', color: 'bg-amber-50  text-amber-700  border-amber-200'  },
  { icon: '💬', label: 'Career Coach',      path: '/career-coach',       color: 'bg-pink-50   text-pink-700   border-pink-200'   },
  { icon: '🗺️',  label: 'Skill Roadmap',    path: '/roadmap',            color: 'bg-teal-50   text-teal-700   border-teal-200'   },
];

const ACHIEVEMENTS_DEF = [
  { id: 'first_app',    icon: '🥉', label: 'First Application', check: (d) => d.totalApplications >= 1  },
  { id: 'five_apps',    icon: '🥈', label: '5 Applications',    check: (d) => d.totalApplications >= 5  },
  { id: 'ten_apps',     icon: '🥇', label: '10 Applications',   check: (d) => d.totalApplications >= 10 },
  { id: 'xp_100',       icon: '⚡', label: '100 XP Earned',     check: (d) => d.totalXp >= 100           },
  { id: 'xp_500',       icon: '💎', label: '500 XP Earned',     check: (d) => d.totalXp >= 500           },
  { id: 'streak_7',     icon: '🔥', label: '7-Day Streak',      check: (d) => d.longestStreak >= 7       },
  { id: 'streak_30',    icon: '🏆', label: '30-Day Streak',     check: (d) => d.longestStreak >= 30      },
  { id: 'practice_10',  icon: '🎤', label: '10 Practices',      check: (d) => d.totalQuestionsAnswered >= 10 },
  { id: 'selected',     icon: '🎉', label: 'Got Selected!',     check: (d) => d.selectedCount >= 1       },
  { id: 'offer',        icon: '🌟', label: 'Offer Received!',   check: (d) => d.offerReceivedCount >= 1  },
];

// ── Main Component ───────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [motivMsg, setMotivMsg] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await dashboardApi.getDashboard();
      const d   = res.data.data;
      setData(d);

      // Pick random motivational message
      const fn  = MOTIVATIONAL[
        Math.floor(Math.random() * MOTIVATIONAL.length)];
      const xpLeft = d.xpForNextLevel
              ? d.xpForNextLevel - d.xpProgress : 0;
      setMotivMsg(fn(
        user?.name?.split(' ')[0] || 'there',
        xpLeft,
        d.nextLevel
      ));
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

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

  const firstName    = user?.name?.split(' ')[0] || 'there';
  const levelGrad    = LEVEL_GRADIENTS[data.currentLevel]
                    || 'from-indigo-500 to-indigo-700';
  const levelIcon    = LEVEL_ICONS[data.currentLevel]   || '🌱';
  const circumference = 2 * Math.PI * 36;
  const levelDash    = (data.progressPercent / 100) * circumference;

  // Pick 3 today tasks randomly
  const todayTasks = [...TODAY_TASKS]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  // Achievements
  const earned   = ACHIEVEMENTS_DEF.filter(a => a.check(data));
  const unearned = ACHIEVEMENTS_DEF.filter(a => !a.check(data));

  // AI Suggestions
  const suggestions = [];
  if (data.profileCompletion < 80) {
    suggestions.push({
      icon: '👤',
      text: `Your profile is ${data.profileCompletion}% complete. Complete it to attract more opportunities.`,
      action: 'Complete Profile',
      path:   '/profile',
    });
  }
  if (data.totalApplications === 0) {
    suggestions.push({
      icon: '📋',
      text: 'You haven\'t applied to any jobs yet. Start your placement journey today!',
      action: 'Add Application',
      path:   '/applications',
    });
  }
  if (data.totalQuestionsAnswered < 5) {
    suggestions.push({
      icon: '🧠',
      text: 'Practice at least 5 interview questions to build confidence.',
      action: 'Start Practice',
      path:   '/interview-practice',
    });
  }
  if (data.currentStreak === 0) {
    suggestions.push({
      icon: '🔥',
      text: 'Start a daily streak by being active every day. Streaks unlock bonus XP!',
      action: 'Be Active Today',
      path:   '/interview-practice',
    });
  }
  if (data.totalPracticeSessions === 0) {
    suggestions.push({
      icon: '🎯',
      text: 'Generate your first AI resume to boost your ATS score above 80.',
      action: 'Generate Resume',
      path:   '/resume',
    });
  }
  if (suggestions.length === 0) {
    suggestions.push({
      icon: '🚀',
      text: 'Great progress! Keep practicing interviews daily to reach Placement Warrior level.',
      action: 'Practice Now',
      path:   '/interview-practice',
    });
  }

  // Activity icons
  const activityIcon = (action) => {
    const map = {
      'GENERATE_QUESTIONS':    '🧠',
      'RESUME_ANALYSIS':       '📄',
      'SKILL_GAP_ANALYSIS':    '📊',
      'ANSWER_QUESTION':       '✍️',
      'DAILY_CHECKIN':         '⚡',
      'ADD_APPLICATION':       '📋',
      'SCHEDULE_INTERVIEW':    '🎤',
      'UPLOAD_RESUME':         '📤',
      'GENERATE_RESUME':       '✨',
      'ATS_SCAN':              '🎯',
      'CAREER_COACH_CHAT':     '💬',
      'PROFILE_COMPLETED':     '👤',
      'COMPLETE_ROADMAP_ITEM': '🗺️',
    };
    return map[action] || '⚡';
  };

  return (
    <div className="space-y-6">

      {/* ── Welcome Header ──────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {firstName} 👋
        </h2>
        <p className="text-indigo-600 text-sm mt-1 font-medium">
          {motivMsg}
        </p>
      </div>

      {/* ── Hero Level Card ─────────────────────────────────── */}
      <div className={`bg-gradient-to-r ${levelGrad}
                       rounded-2xl p-6 text-white`}>
        <div className="flex items-center gap-6 flex-wrap">

          {/* Level Ring */}
          <div className="shrink-0">
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="36"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="8"/>
              <circle cx="44" cy="44" r="36"
                fill="none" stroke="white" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${levelDash} ${circumference}`}
                strokeDashoffset={circumference / 4}
                style={{ transition: 'stroke-dasharray 0.7s ease'}}
              />
              <text x="44" y="40" textAnchor="middle"
                fontSize="20" fill="white">
                {levelIcon}
              </text>
              <text x="44" y="58" textAnchor="middle"
                fontSize="11" fill="rgba(255,255,255,0.85)"
                fontWeight="600">
                {data.progressPercent}%
              </text>
            </svg>
          </div>

          {/* Level Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs uppercase
                          tracking-wider font-medium">
              Current Level
            </p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {data.currentLevel}
            </p>

            {/* XP Bar */}
            <div className="mt-3 max-w-xs">
              <div className="flex justify-between text-xs
                              text-white/80 mb-1">
                <span>{data.xpProgress || 0} XP</span>
                <span>{data.xpForNextLevel || 0} XP</span>
              </div>
              <div className="w-full h-2.5 bg-white/25
                              rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full
                             transition-all duration-700"
                  style={{ width: `${data.progressPercent}%` }}
                />
              </div>
              {data.nextLevel !== 'MAX LEVEL' && (
                <p className="text-white/70 text-xs mt-1">
                  {(data.xpForNextLevel || 0) -
                   (data.xpProgress    || 0)} XP until{' '}
                  {data.nextLevel}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {data.totalXp}
              </p>
              <p className="text-white/70 text-xs">Total XP</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                🔥 {data.currentStreak}
              </p>
              <p className="text-white/70 text-xs">
                Day Streak
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {data.longestStreak}
              </p>
              <p className="text-white/70 text-xs">
                Best Streak
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700
                       uppercase tracking-wider mb-3">
          ⚡ Quick Actions
        </h3>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(qa => (
            <button
              key={qa.label}
              onClick={() => navigate(qa.path)}
              className={`flex flex-col items-center gap-2
                p-3 rounded-xl border text-center
                hover:shadow-sm transition-all
                hover:-translate-y-0.5 ${qa.color}`}>
              <span className="text-2xl">{qa.icon}</span>
              <span className="text-xs font-medium leading-tight">
                {qa.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Application Stats ────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700
                       uppercase tracking-wider mb-3">
          📋 Applications Overview
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <AppStatCard
            label="Total"
            value={data.totalApplications}
            icon="📋"
            empty="No applications yet"
            color="blue"
          />
          <AppStatCard
            label="Selected"
            value={data.selectedCount}
            icon="✅"
            sub={`${data.successRate}% rate`}
            empty="None selected yet"
            color="green"
          />
          <AppStatCard
            label="Rejected"
            value={data.rejectedCount}
            icon="❌"
            empty="No rejections"
            color="red"
          />
          <AppStatCard
            label="In Progress"
            value={data.inProgressCount}
            icon="⏳"
            empty="Nothing in progress"
            color="orange"
          />
          <AppStatCard
            label="Offers"
            value={data.offerReceivedCount}
            icon="🎉"
            empty="No offers yet"
            color="purple"
          />
        </div>
      </div>

      {/* ── Three Column Section ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Today's Focus */}
        <div className="bg-white rounded-xl border
                        border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900
                         mb-4">
            🎯 Today's Focus
          </h3>
          <div className="space-y-3">
            {todayTasks.map((task, i) => (
              <button
                key={i}
                onClick={() => navigate(task.path)}
                className="w-full flex items-center gap-3
                           p-2.5 rounded-lg hover:bg-gray-50
                           transition-colors text-left group">
                <span className="text-xl shrink-0">
                  {task.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800
                                group-hover:text-indigo-700
                                transition-colors">
                    {task.task}
                  </p>
                </div>
                <span className="text-xs font-bold
                                 text-indigo-600 shrink-0">
                  +{task.xp} XP
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="bg-white rounded-xl border
                        border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900
                         mb-4">
            🤖 AI Suggestions
          </h3>
          <div className="space-y-3">
            {suggestions.slice(0, 3).map((s, i) => (
              <div key={i}
                   className="p-3 bg-indigo-50 rounded-lg
                              border border-indigo-100">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-base shrink-0">
                    {s.icon}
                  </span>
                  <p className="text-xs text-gray-700
                                leading-relaxed">
                    {s.text}
                  </p>
                </div>
                <button
                  onClick={() => navigate(s.path)}
                  className="text-xs font-semibold text-indigo-700
                             hover:text-indigo-900 transition-colors">
                  {s.action} →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Practice Stats */}
        <div className="bg-white rounded-xl border
                        border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900
                         mb-4">
            🧠 Practice Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center
                            justify-between p-3 bg-indigo-50
                            rounded-lg">
              <div>
                <p className="text-xs text-gray-500">
                  Questions Answered
                </p>
                <p className="text-xl font-bold text-indigo-700">
                  {data.totalQuestionsAnswered || 0}
                </p>
              </div>
              <span className="text-2xl">✍️</span>
            </div>
            <div className="flex items-center
                            justify-between p-3 bg-green-50
                            rounded-lg">
              <div>
                <p className="text-xs text-gray-500">
                  Avg Interview Score
                </p>
                <p className="text-xl font-bold text-green-700">
                  {data.averageInterviewScore > 0
                    ? `${data.averageInterviewScore}/10`
                    : '—'}
                </p>
              </div>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="flex items-center
                            justify-between p-3 bg-purple-50
                            rounded-lg">
              <div>
                <p className="text-xs text-gray-500">
                  Practice Sessions
                </p>
                <p className="text-xl font-bold text-purple-700">
                  {data.totalPracticeSessions || 0}
                </p>
              </div>
              <span className="text-2xl">🧠</span>
            </div>

            {/* Profile Completion */}
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="flex justify-between mb-1.5">
                <p className="text-xs text-gray-600 font-medium">
                  Profile Complete
                </p>
                <p className="text-xs font-bold text-amber-700">
                  {data.profileCompletion}%
                </p>
              </div>
              <div className="w-full h-1.5 bg-amber-200
                              rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${data.profileCompletion}%`
                  }}
                />
              </div>
              {data.profileCompletion < 100 && (
                <button
                  onClick={() => navigate('/profile')}
                  className="text-xs text-amber-700 mt-1
                             hover:underline">
                  Complete profile →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Bar Chart */}
        <div className="bg-white rounded-xl border
                        border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900
                         mb-4">
            📈 Monthly Applications
          </h3>
          {!data.monthlyTrend?.length ? (
            <EmptyChart
              icon="📋"
              message="No applications yet"
              sub="Start applying to see your trend"
              action="Add Application"
              path="/applications"
            />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.monthlyTrend}>
                <XAxis dataKey="month"
                       tick={{ fontSize: 11 }}
                       tickLine={false}/>
                <YAxis allowDecimals={false}
                       tick={{ fontSize: 11 }}
                       tickLine={false} axisLine={false}/>
                <Tooltip contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}/>
                <Bar dataKey="count" fill="#6366f1"
                     radius={[4,4,0,0]} name="Applications"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl border
                        border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900
                         mb-4">
            🎯 Status Distribution
          </h3>
          {!data.statusBreakdown?.length
           || data.totalApplications === 0 ? (
            <EmptyChart
              icon="🎯"
              message="No application data yet"
              sub="Apply to jobs to see status breakdown"
              action="Start Applying"
              path="/applications"
            />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data.statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%" cy="50%"
                    outerRadius={70}
                    label={false}>
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
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-2
                              justify-center">
                {data.statusBreakdown.map((s, i) => (
                  <div key={i}
                       className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full"
                         style={{
                           background:
                             PIE_COLORS[i % PIE_COLORS.length]
                         }}/>
                    <span className="text-xs text-gray-600">
                      {s.status.replace(/_/g, ' ')} ({s.count})
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Achievements + Recent Activity ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Achievements */}
        <div className="bg-white rounded-xl border
                        border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900
                         mb-4">
            🏆 Achievements
          </h3>
          {earned.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-3xl mb-2">🎖️</p>
              <p className="text-sm">No achievements yet</p>
              <p className="text-xs mt-1">
                Start using CareerPilot AI to earn badges
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {earned.map(a => (
                  <div key={a.id}
                       className="flex items-center gap-1.5
                                  px-3 py-1.5 bg-indigo-50
                                  border border-indigo-200
                                  rounded-full">
                    <span className="text-base">{a.icon}</span>
                    <span className="text-xs font-medium
                                     text-indigo-700">
                      {a.label}
                    </span>
                  </div>
                ))}
              </div>
              {unearned.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Next to unlock:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unearned.slice(0, 3).map(a => (
                      <div key={a.id}
                           className="flex items-center gap-1.5
                                      px-3 py-1.5 bg-gray-100
                                      border border-gray-200
                                      rounded-full opacity-60">
                        <span className="text-base grayscale">
                          {a.icon}
                        </span>
                        <span className="text-xs text-gray-500">
                          {a.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border
                        border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900
                         mb-4">
            ⚡ Recent Activity
          </h3>
          {!data.recentActivity?.length ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">No activity yet</p>
              <p className="text-xs mt-1">
                Start using CareerPilot AI to see your activity
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((act, i) => (
                <div key={i}
                     className="flex items-center gap-3
                                py-2 border-b border-gray-50
                                last:border-0">
                  <div className="w-9 h-9 rounded-full
                                  bg-indigo-50 flex items-center
                                  justify-center text-base
                                  shrink-0">
                    {activityIcon(act.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium
                                  text-gray-800 truncate">
                      {act.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      {act.time}
                    </p>
                  </div>
                  <span className="text-xs font-bold
                                   text-indigo-600 shrink-0">
                    +{act.xpEarned} XP
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function AppStatCard({ label, value, icon, sub, empty, color }) {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'bg-blue-100'   },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'bg-green-100'  },
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    icon: 'bg-red-100'    },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'bg-orange-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'bg-purple-100' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className={`rounded-xl border p-4
                     ${value > 0 ? c.bg : 'bg-white'}
                     border-gray-200`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500">
          {label}
        </span>
        <span className={`w-8 h-8 rounded-lg flex items-center
          justify-center text-base ${c.icon}`}>
          {icon}
        </span>
      </div>
      {value > 0 ? (
        <>
          <p className={`text-2xl font-bold ${c.text}`}>
            {value}
          </p>
          {sub && (
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          )}
        </>
      ) : (
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          {empty}
        </p>
      )}
    </div>
  );
}

function EmptyChart({ icon, message, sub, action, path }) {
  const navigate = useNavigate();
  return (
    <div className="h-48 flex flex-col items-center
                    justify-center text-gray-400 gap-2">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm font-medium text-gray-600">
        {message}
      </p>
      <p className="text-xs">{sub}</p>
      <button
        onClick={() => navigate(path)}
        className="text-xs text-indigo-600 hover:underline
                   font-medium mt-1">
        {action} →
      </button>
    </div>
  );
}


