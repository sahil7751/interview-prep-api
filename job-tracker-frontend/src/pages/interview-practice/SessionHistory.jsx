import { useEffect, useState } from 'react';
import { interviewEvalApi } from '../../api/interviewEvalApi';
import toast from 'react-hot-toast';

const scoreColor = (score) => {
  if (!score || score === 0) return 'text-gray-400';
  if (score >= 7.5) return 'text-green-600';
  if (score >= 5.5) return 'text-blue-600';
  if (score >= 3.5) return 'text-amber-600';
  return 'text-red-600';
};

const scoreBg = (score) => {
  if (!score || score === 0) return 'bg-gray-100';
  if (score >= 7.5) return 'bg-green-50  border-green-200';
  if (score >= 5.5) return 'bg-blue-50   border-blue-200';
  if (score >= 3.5) return 'bg-amber-50  border-amber-200';
  return 'bg-red-50 border-red-200';
};

export default function SessionHistory({ onStart }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await interviewEvalApi.getSessions({
        page: 0, size: 50
      });
      setSessions(res.data.data.content || []);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const filtered = sessions.filter(s =>
    s.jobRole?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-500
                        border-t-transparent rounded-full
                        animate-spin"/>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl
                      border border-gray-200">
        <div className="text-6xl mb-4">🧠</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          No interview sessions yet
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Practice AI interviews to build confidence and earn XP
        </p>
        <button
          onClick={onStart}
          className="px-6 py-3 bg-indigo-600 text-white font-medium
                     rounded-xl hover:bg-indigo-700 transition-colors
                     flex items-center gap-2 mx-auto">
          🚀 Start Your First AI Interview
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Search */}
      <div className="flex gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by role..."
          className="flex-1 px-4 py-2.5 rounded-xl border
                     border-gray-300 text-sm focus:outline-none
                     focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center px-3 py-2 bg-gray-100
                        rounded-xl text-sm text-gray-600">
          {filtered.length} sessions
        </div>
      </div>

      {/* Session Cards */}
      <div className="space-y-3">
        {filtered.map(s => (
          <div
            key={s.id}
            className={`bg-white rounded-2xl border p-5
              hover:shadow-sm transition-all
              ${scoreBg(s.averageScore)}`}>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm font-bold text-gray-900">
                    {s.jobRole}
                  </h3>
                  {s.experienceLevel && (
                    <span className="px-2 py-0.5 bg-indigo-100
                                     text-indigo-700 text-xs
                                     rounded-full">
                      {s.experienceLevel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs
                                text-gray-500 flex-wrap">
                  <span>
                    {new Date(s.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </span>
                  <span>·</span>
                  <span>
                    {s.answeredQuestions}/{s.totalQuestions} questions
                  </span>
                  {s.averageScore > 0 && (
                    <>
                      <span>·</span>
                      <span className={`font-bold
                        ${scoreColor(s.averageScore)}`}>
                        {s.averageScore}/10
                      </span>
                    </>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full max-w-xs">
                  <div className="w-full h-1.5 bg-gray-200
                                  rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full
                        ${s.averageScore >= 7 ? 'bg-green-500'
                          : s.averageScore >= 5 ? 'bg-blue-500'
                          : 'bg-amber-500'}`}
                      style={{
                        width: s.totalQuestions > 0
                          ? `${(s.answeredQuestions /
                                s.totalQuestions) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Score badge */}
              {s.averageScore > 0 && (
                <div className={`text-center p-3 rounded-xl
                  min-w-16 shrink-0
                  ${s.averageScore >= 7
                      ? 'bg-green-100'
                      : s.averageScore >= 5
                        ? 'bg-blue-100'
                        : 'bg-amber-100'}`}>
                  <p className={`text-xl font-bold
                    ${scoreColor(s.averageScore)}`}>
                    {s.averageScore}
                  </p>
                  <p className="text-xs text-gray-500">/10</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

