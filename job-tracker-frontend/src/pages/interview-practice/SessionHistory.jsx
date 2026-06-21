import { useEffect, useState } from 'react';
import { interviewEvalApi } from '../../api/interviewEvalApi';
import toast from 'react-hot-toast';

export default function SessionHistory({ onSelectSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    interviewEvalApi.getSessions({ page: 0, size: 20 })
      .then(res => setSessions(res.data.data.content))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const handleViewSession = async (id) => {
    try {
      const res = await interviewEvalApi.getSession(id);
      onSelectSession(res.data.data);
    } catch {
      toast.error('Failed to load session');
    }
  };

  const scoreColor = (score) => {
    if (!score || score === 0) return 'text-gray-400';
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-amber-600';
    return 'text-red-600';
  };

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
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">🧠</div>
        <p className="font-medium">No practice sessions yet</p>
        <p className="text-sm mt-1">
          Start a new session to begin practicing
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900">
        Past Sessions ({sessions.length})
      </h3>

      {sessions.map(session => (
        <div
          key={session.id}
          className="bg-white rounded-xl border border-gray-200
                     p-4 hover:border-indigo-300 transition-colors
                     cursor-pointer"
          onClick={() => handleViewSession(session.id)}>

          <div className="flex items-center
                          justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {session.jobRole}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {session.experienceLevel} ·{' '}
                {new Date(session.createdAt)
                  .toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {/* Progress */}
              <div className="text-center">
                <p className="text-sm font-bold text-gray-700">
                  {session.answeredQuestions}
                  /{session.totalQuestions}
                </p>
                <p className="text-xs text-gray-400">answered</p>
              </div>

              {/* Avg Score */}
              <div className="text-center">
                <p className={`text-sm font-bold
                  ${scoreColor(session.averageScore)}`}>
                  {session.averageScore > 0
                    ? `${session.averageScore}/10`
                    : '—'}
                </p>
                <p className="text-xs text-gray-400">avg score</p>
              </div>

              <span className="text-gray-400 text-sm">→</span>
            </div>
          </div>

          {/* Mini progress bar */}
          <div className="mt-3 w-full h-1.5 bg-gray-100
                          rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full"
              style={{
                width: session.totalQuestions > 0
                  ? `${(session.answeredQuestions /
                        session.totalQuestions) * 100}%`
                  : '0%'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}


