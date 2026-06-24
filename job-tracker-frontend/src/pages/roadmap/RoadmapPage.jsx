import { useState, useEffect } from 'react';
import { roadmapApi } from '../../api/roadmapApi';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  'Foundation':      'bg-blue-100   text-blue-700   border-blue-200',
  'Core':            'bg-purple-100 text-purple-700 border-purple-200',
  'Advanced':        'bg-amber-100  text-amber-700  border-amber-200',
  'Project':         'bg-green-100  text-green-700  border-green-200',
  'Interview Prep':  'bg-red-100    text-red-700    border-red-200',
};

const RESOURCE_ICONS = {
  'Video':    '🎬',
  'Book':     '📖',
  'Practice': '💻',
  'Project':  '🛠️',
  'Article':  '📝',
};

const ROLES = [
  'Java Backend Developer',
  'Full Stack Developer',
  'Frontend Developer',
  'Data Scientist',
  'DevOps Engineer',
  'Android Developer',
  'Cloud Engineer',
  'Machine Learning Engineer',
  'Software Engineer',
  'System Design Engineer',
];

export default function RoadmapPage() {
  const [view, setView]         = useState('list');
  const [roadmaps, setRoadmaps] = useState([]);
  const [active, setActive]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState(1);

  const [form, setForm] = useState({
    targetRole:      'Java Backend Developer',
    experienceLevel: 'Fresher',
    currentSkills:   '',
    durationWeeks:   8,
  });

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      const res = await roadmapApi.getAll();
      setRoadmaps(res.data.data);
    } catch {
      toast.error('Failed to load roadmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!form.targetRole.trim()) {
      toast.error('Target role is required');
      return;
    }
    setGenerating(true);
    try {
      const res = await roadmapApi.generate(form);
      const roadmap = res.data.data;
      setRoadmaps(prev => [roadmap, ...prev]);
      setActive(roadmap);
      setExpandedWeek(1);
      setView('detail');
      toast.success('Roadmap generated! 🗺️');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggle = async (roadmapId, milestoneId) => {
    try {
      const res = await roadmapApi.toggleMilestone(
              roadmapId, milestoneId);
      const updated = res.data.data;
      setActive(updated);
      setRoadmaps(prev => prev.map(r =>
        r.id === updated.id ? { ...r,
          completedMilestones: updated.completedMilestones,
          completionPercent:   updated.completionPercent,
        } : r
      ));
    } catch {
      toast.error('Failed to update milestone');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this roadmap?')) return;
    try {
      await roadmapApi.delete(id);
      setRoadmaps(prev => prev.filter(r => r.id !== id));
      if (active?.id === id) {
        setActive(null);
        setView('list');
      }
      toast.success('Roadmap deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleViewRoadmap = async (id) => {
    try {
      const res = await roadmapApi.getOne(id);
      setActive(res.data.data);
      setExpandedWeek(1);
      setView('detail');
    } catch {
      toast.error('Failed to load roadmap');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            🗺️ Skill Roadmap
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            AI-generated learning path with progress tracking
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('generate')}
            className={`px-4 py-2 rounded-lg text-sm font-medium
              transition-colors
              ${view === 'generate'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600'
                    + ' hover:bg-gray-50'}`}>
            + New Roadmap
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium
              transition-colors
              ${view === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600'
                    + ' hover:bg-gray-50'}`}>
            My Roadmaps
          </button>
        </div>
      </div>

      {/* Generate View */}
      {view === 'generate' && (
        <div className="bg-white rounded-xl border border-gray-200
                        p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-900">
            Configure Your Learning Roadmap
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium
                                 text-gray-700 mb-1">
                Target Role *
              </label>
              <select
                value={form.targetRole}
                onChange={e => setForm({
                  ...form, targetRole: e.target.value
                })}
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-indigo-500">
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium
                                 text-gray-700 mb-1">
                Experience Level
              </label>
              <select
                value={form.experienceLevel}
                onChange={e => setForm({
                  ...form, experienceLevel: e.target.value
                })}
                className="w-full px-3 py-2 rounded-lg border
                           border-gray-300 text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-indigo-500">
                {['Fresher','1 year','2 years','3+ years'].map(
                  l => <option key={l} value={l}>{l}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium
                               text-gray-700 mb-1">
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
                         border-gray-300 text-sm
                         focus:outline-none focus:ring-2
                         focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium
                               text-gray-700 mb-2">
              Roadmap Duration: {form.durationWeeks} weeks
            </label>
            <input
              type="range"
              min={4} max={16} step={2}
              value={form.durationWeeks}
              onChange={e => setForm({
                ...form,
                durationWeeks: parseInt(e.target.value)
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

          {/* Info Banner */}
          <div className="bg-indigo-50 border border-indigo-200
                          rounded-xl p-4 flex gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="text-sm font-medium text-indigo-900">
                AI will generate a personalized roadmap
              </p>
              <p className="text-xs text-indigo-700 mt-0.5">
                {form.durationWeeks} weeks ·{' '}
                {form.durationWeeks * 4}–{form.durationWeeks * 5}{' '}
                milestones · Tailored for {form.targetRole}
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700
                       text-white font-medium rounded-lg text-sm
                       transition-colors disabled:opacity-60
                       flex items-center justify-center gap-2">
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white
                                border-t-transparent rounded-full
                                animate-spin"/>
                Generating your roadmap...
              </>
            ) : (
              '🚀 Generate Roadmap'
            )}
          </button>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <>
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-indigo-500
                              border-t-transparent rounded-full
                              animate-spin"/>
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl
                            border border-gray-200">
              <div className="text-5xl mb-3">🗺️</div>
              <p className="font-medium text-gray-700">
                No roadmaps yet
              </p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                Generate your first personalized learning roadmap
              </p>
              <button
                onClick={() => setView('generate')}
                className="px-6 py-2 bg-indigo-600 text-white
                           text-sm rounded-lg hover:bg-indigo-700
                           transition-colors">
                + Create Roadmap
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {roadmaps.map(r => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl border
                             border-gray-200 p-5
                             hover:border-indigo-300
                             transition-colors">
                  <div className="flex items-start
                                  justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold
                                     text-gray-900">
                        {r.targetRole}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {r.experienceLevel} ·{' '}
                        {r.durationWeeks} weeks ·{' '}
                        {r.totalMilestones} milestones ·{' '}
                        Created{' '}
                        {new Date(r.createdAt)
                          .toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short'
                          })}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between
                                        mb-1">
                          <span className="text-xs text-gray-500">
                            Progress
                          </span>
                          <span className="text-xs font-semibold
                                           text-indigo-700">
                            {r.completionPercent}%
                            ({r.completedMilestones}/
                            {r.totalMilestones})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100
                                        rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full
                              transition-all duration-500
                              ${r.completionPercent >= 80
                                  ? 'bg-green-500'
                                  : r.completionPercent >= 40
                                    ? 'bg-indigo-500'
                                    : 'bg-amber-500'}`}
                            style={{
                              width: `${r.completionPercent}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() =>
                          handleViewRoadmap(r.id)
                        }
                        className="px-3 py-1.5 bg-indigo-600
                                   text-white text-xs rounded-lg
                                   hover:bg-indigo-700
                                   transition-colors">
                        View →
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="px-3 py-1.5 border
                                   border-red-200 text-red-500
                                   text-xs rounded-lg
                                   hover:bg-red-50
                                   transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail View */}
      {view === 'detail' && active && (
        <div className="space-y-5">

          {/* Roadmap Header */}
          <div className="bg-white rounded-xl border
                          border-gray-200 p-5">
            <div className="flex items-start
                            justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {active.targetRole}
                </h3>
                <p className="text-sm text-gray-500">
                  {active.experienceLevel} ·{' '}
                  {active.durationWeeks} weeks ·{' '}
                  {active.totalMilestones} milestones
                </p>
              </div>
              <button
                onClick={() => setView('list')}
                className="text-sm text-gray-500
                           hover:text-gray-700">
                ← Back
              </button>
            </div>

            {/* Overall Progress */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium
                                   text-gray-700">
                    Overall Progress
                  </span>
                  <span className="text-sm font-bold
                                   text-indigo-700">
                    {active.completionPercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-100
                                rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full
                      transition-all duration-500
                      ${active.completionPercent >= 80
                          ? 'bg-green-500'
                          : active.completionPercent >= 40
                            ? 'bg-indigo-500'
                            : 'bg-amber-500'}`}
                    style={{
                      width: `${active.completionPercent}%`
                    }}
                  />
                </div>
              </div>
              <div className="text-center shrink-0">
                <p className="text-xl font-bold text-indigo-700">
                  {active.completedMilestones}/
                  {active.totalMilestones}
                </p>
                <p className="text-xs text-gray-500">completed</p>
              </div>
            </div>
          </div>

          {/* Week Tabs */}
          <div className="flex gap-2 flex-wrap">
            {active.weekSummaries?.map(ws => (
              <button
                key={ws.weekNumber}
                onClick={() => setExpandedWeek(ws.weekNumber)}
                className={`px-3 py-1.5 rounded-lg text-xs
                  font-medium transition-colors
                  ${expandedWeek === ws.weekNumber
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-gray-300'
                        + ' text-gray-600 hover:bg-gray-50'}`}>
                W{ws.weekNumber}
                {ws.completedTopics === ws.totalTopics
                  && ws.totalTopics > 0 && ' ✅'}
              </button>
            ))}
          </div>

          {/* Active Week Detail */}
          {active.weeklyPlan &&
           active.weeklyPlan[expandedWeek] && (
            <div className="bg-white rounded-xl border
                            border-gray-200 overflow-hidden">

              {/* Week Header */}
              <div className="px-5 py-4 border-b border-gray-100
                              bg-gray-50">
                {(() => {
                  const ws = active.weekSummaries?.find(
                    w => w.weekNumber === expandedWeek);
                  return (
                    <div className="flex items-center
                                    justify-between">
                      <div>
                        <p className="text-sm font-semibold
                                      text-gray-900">
                          Week {expandedWeek}
                          {ws?.title ? ` — ${ws.title}` : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ws?.totalTopics} topics ·{' '}
                          ~{ws?.estimatedHours}h ·{' '}
                          {ws?.completedTopics}/
                          {ws?.totalTopics} done
                        </p>
                      </div>
                      {ws && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200
                                          rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500
                                         rounded-full"
                              style={{
                                width: ws.totalTopics > 0
                                  ? `${(ws.completedTopics /
                                        ws.totalTopics) * 100}%`
                                  : '0%'
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {ws.totalTopics > 0
                              ? Math.round(
                                  (ws.completedTopics /
                                   ws.totalTopics) * 100)
                              : 0}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Milestones */}
              <div className="divide-y divide-gray-50">
                {active.weeklyPlan[expandedWeek].map(m => (
                  <div
                    key={m.id}
                    className={`p-4 flex items-start gap-4
                      transition-colors
                      ${m.completed ? 'bg-green-50/40' : ''}`}>

                    {/* Checkbox */}
                    <button
                      onClick={() =>
                        handleToggle(active.id, m.id)
                      }
                      className={`w-6 h-6 rounded-full border-2
                        flex items-center justify-center
                        shrink-0 mt-0.5 transition-colors
                        ${m.completed
                            ? 'bg-green-500 border-green-500'
                              + ' text-white'
                            : 'border-gray-300'
                              + ' hover:border-indigo-400'}`}>
                      {m.completed && (
                        <span className="text-xs">✓</span>
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center
                                      gap-2 flex-wrap mb-1">
                        <p className={`text-sm font-medium
                          ${m.completed
                              ? 'text-gray-400 line-through'
                              : 'text-gray-900'}`}>
                          {m.topic}
                        </p>
                        {m.category && (
                          <span className={`px-2 py-0.5
                            rounded-full text-xs border
                            ${CATEGORY_COLORS[m.category]
                                || 'bg-gray-100 text-gray-600'}`}>
                            {m.category}
                          </span>
                        )}
                      </div>

                      {m.description && (
                        <p className="text-xs text-gray-500
                                      mb-2 leading-relaxed">
                          {m.description}
                        </p>
                      )}

                      {/* Resource */}
                      {m.resource && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">
                            {RESOURCE_ICONS[m.resourceType]
                                || '📌'}
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
                              border-t border-gray-100">
                <button
                  onClick={() => setExpandedWeek(
                    w => Math.max(1, w - 1)
                  )}
                  disabled={expandedWeek === 1}
                  className="text-sm text-gray-500
                             hover:text-gray-700 disabled:opacity-40
                             flex items-center gap-1">
                  ← Previous Week
                </button>
                <button
                  onClick={() => setExpandedWeek(
                    w => Math.min(active.durationWeeks, w + 1)
                  )}
                  disabled={
                    expandedWeek === active.durationWeeks
                  }
                  className="text-sm text-gray-500
                             hover:text-gray-700 disabled:opacity-40
                             flex items-center gap-1">
                  Next Week →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

