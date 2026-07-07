import { useState, useEffect } from 'react';
import { roadmapApi } from '../../api/roadmapApi';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  'Foundation':      'bg-blue-50   text-blue-700   border-blue-200',
  'Core':            'bg-purple-50 text-purple-700 border-purple-200',
  'Advanced':        'bg-amber-50  text-amber-700  border-amber-200',
  'Project':         'bg-green-50  text-green-700  border-green-200',
  'Interview Prep':  'bg-red-50    text-red-700    border-red-200',
};

const RESOURCE_ICONS = {
  'Video':    '🎬',
  'Book':     '📖',
  'Practice': '💻',
  'Project':  '🛠️',
  'Article':  '📝',
};

const ROLES = [
  'Java Backend Developer',  'Full Stack Developer',
  'Frontend Developer',      'Data Scientist',
  'DevOps Engineer',         'Android Developer',
  'Cloud Engineer',          'Machine Learning Engineer',
  'Software Engineer',       'System Design Engineer',
];

// ── Progress Bar ──────────────────────────────────────────────────
function ProgressBar({ percent, size = 'md', color = 'indigo' }) {
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' };
  const colors  = {
    indigo: 'bg-indigo-500',
    green:  'bg-green-500',
    amber:  'bg-amber-400',
  };
  const bg = percent >= 80 ? colors.green
           : percent >= 40 ? colors.indigo
           : colors.amber;

  return (
    <div className={`w-full ${heights[size]} bg-gray-100
                     rounded-full overflow-hidden`}>
      <div
        className={`${heights[size]} ${bg} rounded-full
                    transition-all duration-500`}
        style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
      />
    </div>
  );
}

// ── Roadmap Card (List View) ──────────────────────────────────────
function RoadmapCard({ roadmap, onView, onDelete }) {
  const pct = roadmap.completionPercent || 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200
                    p-5 hover:border-indigo-200 hover:shadow-sm
                    transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900">
              {roadmap.targetRole}
            </h3>
            {pct === 100 && (
              <span className="px-2 py-0.5 bg-green-100
                               text-green-700 text-xs font-medium
                               rounded-full">
                Complete ✓
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {roadmap.experienceLevel} · {roadmap.durationWeeks} weeks
            · {roadmap.totalMilestones} milestones
            · Created{' '}
            {new Date(roadmap.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short'
            })}
          </p>

          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs font-semibold text-gray-700">
                {pct}%
                <span className="text-gray-400 font-normal ml-1">
                  ({roadmap.completedMilestones}/
                  {roadmap.totalMilestones})
                </span>
              </span>
            </div>
            <ProgressBar percent={pct} size="md"/>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => onView(roadmap.id)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700
                       text-white text-xs font-medium rounded-lg
                       transition-colors">
            View →
          </button>
          <button
            onClick={() => onDelete(roadmap.id)}
            className="px-4 py-2 border border-red-200 text-red-500
                       text-xs font-medium rounded-lg
                       hover:bg-red-50 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Generate Form ─────────────────────────────────────────────────
function GenerateForm({ onGenerate, generating }) {
  const [form, setForm] = useState({
    targetRole:      'Java Backend Developer',
    experienceLevel: 'Fresher',
    currentSkills:   '',
    durationWeeks:   8,
  });

  const xpReward = form.durationWeeks * 5;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-5">
        Configure Your Learning Roadmap
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium
                               text-gray-600 mb-1.5">
              Target Role *
            </label>
            <select
              value={form.targetRole}
              onChange={e => setForm({
                ...form, targetRole: e.target.value
              })}
              className="w-full px-3 py-2 rounded-lg border
                         border-gray-300 text-sm text-gray-900
                         focus:outline-none focus:ring-2
                         focus:ring-indigo-500 bg-white">
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium
                               text-gray-600 mb-1.5">
              Experience Level
            </label>
            <select
              value={form.experienceLevel}
              onChange={e => setForm({
                ...form, experienceLevel: e.target.value
              })}
              className="w-full px-3 py-2 rounded-lg border
                         border-gray-300 text-sm text-gray-900
                         focus:outline-none focus:ring-2
                         focus:ring-indigo-500 bg-white">
              {['Fresher','1 year','2 years','3+ years'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium
                             text-gray-600 mb-1.5">
            Your Current Skills
            <span className="text-gray-400 font-normal ml-1">
              (helps personalize the roadmap)
            </span>
          </label>
          <input
            value={form.currentSkills}
            onChange={e => setForm({
              ...form, currentSkills: e.target.value
            })}
            placeholder="Java, Spring Boot, MySQL, basic React..."
            className="w-full px-3 py-2 rounded-lg border
                       border-gray-300 text-sm text-gray-900
                       focus:outline-none focus:ring-2
                       focus:ring-indigo-500 placeholder-gray-400"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">
              Roadmap Duration
            </label>
            <span className="text-sm font-semibold text-indigo-600">
              {form.durationWeeks} weeks
            </span>
          </div>
          <input
            type="range" min={4} max={16} step={2}
            value={form.durationWeeks}
            onChange={e => setForm({
              ...form, durationWeeks: parseInt(e.target.value)
            })}
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs
                          text-gray-400 mt-1">
            <span>4 weeks (Sprint)</span>
            <span>8 weeks (Standard)</span>
            <span>16 weeks (Deep Dive)</span>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center gap-3 p-3 bg-indigo-50
                        border border-indigo-100 rounded-lg">
          <span className="text-xl shrink-0">🗺️</span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-indigo-900">
              AI will generate a personalized roadmap
            </p>
            <p className="text-xs text-indigo-600">
              {form.durationWeeks} weeks ·{' '}
              {form.durationWeeks * 4}–{form.durationWeeks * 5}{' '}
              milestones · Tailored for {form.targetRole}
              {' '} · +{xpReward} XP
            </p>
          </div>
        </div>

        <button
          onClick={() => onGenerate(form)}
          disabled={generating}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-medium rounded-lg
                     transition-colors disabled:opacity-60
                     flex items-center justify-center gap-2">
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white
                              border-t-transparent rounded-full
                              animate-spin"/>
              Generating...
            </>
          ) : (
            '🚀 Generate Roadmap'
          )}
        </button>
      </div>
    </div>
  );
}

// ── Detail View ───────────────────────────────────────────────────
function RoadmapDetail({ roadmap, onToggle, onBack }) {
  const [expandedWeek, setExpandedWeek] = useState(1);

  const pct = roadmap.completionPercent || 0;

  const currentWeekSummary = roadmap.weekSummaries?.find(
    w => w.weekNumber === expandedWeek);

  const weekProgress = currentWeekSummary
    ? currentWeekSummary.totalTopics > 0
      ? Math.round((currentWeekSummary.completedTopics /
                    currentWeekSummary.totalTopics) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-4">

      {/* Roadmap Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {roadmap.targetRole}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {roadmap.experienceLevel} · {roadmap.durationWeeks} weeks
              · {roadmap.totalMilestones} milestones
            </p>
          </div>
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700
                       flex items-center gap-1 transition-colors">
            ← Back
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-indigo-600">
                {pct}%
              </span>
              <span className="text-sm font-bold text-gray-900">
                {roadmap.completedMilestones}/
                {roadmap.totalMilestones}
                <span className="text-xs font-normal text-gray-500
                                 ml-1">
                  completed
                </span>
              </span>
            </div>
          </div>
          <ProgressBar percent={pct} size="lg"/>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex gap-2 flex-wrap">
        {roadmap.weekSummaries?.map(ws => {
          const wPct = ws.totalTopics > 0
            ? Math.round((ws.completedTopics / ws.totalTopics) * 100)
            : 0;
          const isDone = wPct === 100;
          const isCurrent = expandedWeek === ws.weekNumber;

          return (
            <button
              key={ws.weekNumber}
              onClick={() => setExpandedWeek(ws.weekNumber)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium
                transition-colors flex items-center gap-1.5
                ${isCurrent
                    ? 'bg-indigo-600 text-white'
                    : isDone
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-white border border-gray-200 text-gray-600'
                        + ' hover:border-gray-300'}`}>
              W{ws.weekNumber}
              {isDone && <span className="text-xs">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Active Week */}
      {roadmap.weeklyPlan && roadmap.weeklyPlan[expandedWeek] && (
        <div className="bg-white rounded-xl border border-gray-200
                        overflow-hidden">

          {/* Week Header */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Week {expandedWeek}
                  {currentWeekSummary?.title
                    && ` — ${currentWeekSummary.title}`}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentWeekSummary?.totalTopics} topics ·
                  ~{currentWeekSummary?.estimatedHours}h ·
                  {' '}{currentWeekSummary?.completedTopics}/
                  {currentWeekSummary?.totalTopics} done
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20">
                  <ProgressBar percent={weekProgress} size="sm"/>
                </div>
                <span className="text-xs font-semibold text-gray-600
                                 min-w-8 text-right">
                  {weekProgress}%
                </span>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="divide-y divide-gray-50">
            {roadmap.weeklyPlan[expandedWeek].map(m => (
              <div
                key={m.id}
                className={`flex items-start gap-4 px-5 py-4
                  transition-colors
                  ${m.completed ? 'bg-green-50/30' : 'hover:bg-gray-50'}`}>

                {/* Checkbox */}
                <button
                  onClick={() => onToggle(roadmap.id, m.id)}
                  className={`w-6 h-6 rounded-full border-2 flex
                    items-center justify-center shrink-0 mt-0.5
                    transition-all
                    ${m.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-indigo-400'}`}>
                  {m.completed && (
                    <svg width="10" height="10" viewBox="0 0 12 12"
                         fill="none" stroke="white" strokeWidth="2.5"
                         strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2 6 5 9 10 3"/>
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2
                                  flex-wrap mb-1">
                    <p className={`text-sm font-medium
                      ${m.completed
                          ? 'line-through text-gray-400'
                          : 'text-gray-900'}`}>
                      {m.topic}
                    </p>
                    {m.category && (
                      <span className={`px-2 py-0.5 rounded-full
                        text-xs font-medium border
                        ${CATEGORY_COLORS[m.category]
                            || 'bg-gray-50 text-gray-600'}`}>
                        {m.category}
                      </span>
                    )}
                  </div>

                  {m.description && (
                    <p className="text-xs text-gray-500 mb-2
                                  leading-relaxed">
                      {m.description}
                    </p>
                  )}

                  {m.resource && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">
                        {RESOURCE_ICONS[m.resourceType] || '📌'}
                      </span>
                      <span className="text-xs text-indigo-600">
                        {m.resource}
                      </span>
                      {m.estimatedHours > 0 && (
                        <span className="text-xs text-gray-400">
                          · ~{m.estimatedHours}h
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Week Navigation */}
          <div className="flex justify-between px-5 py-3
                          border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={() =>
                setExpandedWeek(w => Math.max(1, w - 1))
              }
              disabled={expandedWeek === 1}
              className="text-sm text-gray-500 hover:text-gray-700
                         disabled:opacity-30 disabled:cursor-not-allowed
                         flex items-center gap-1 transition-colors">
              ← Previous Week
            </button>
            <button
              onClick={() =>
                setExpandedWeek(w =>
                  Math.min(roadmap.durationWeeks, w + 1))
              }
              disabled={expandedWeek === roadmap.durationWeeks}
              className="text-sm text-gray-500 hover:text-gray-700
                         disabled:opacity-30 disabled:cursor-not-allowed
                         flex items-center gap-1 transition-colors">
              Next Week →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



