import { useState, useEffect } from 'react';
import { interviewEvalApi } from '../../../api/interviewEvalApi';
import ScoreRing from '../components/ScoreRing';
import toast from 'react-hot-toast';

const SKILL_METRICS = [
  { key: 'technical',  label: 'Technical Knowledge', icon: '⚙️' },
  { key: 'communication', label: 'Communication',    icon: '💬' },
  { key: 'problemSolving', label: 'Problem Solving', icon: '🧠' },
  { key: 'behavioral', label: 'Behavioral Skills',   icon: '🎭' },
];

export default function ReportStep({ session, onRetry, onHome }) {
  const [qaRecords, setQaRecords] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const res = await interviewEvalApi.getSession(session.id);
      const s   = res.data.data;
      // Get questions with evaluations
      if (s.questions) {
        const withEvals = await Promise.all(
          s.questions
            .filter(q => q.evaluated)
            .map(q => interviewEvalApi
              .evaluateAnswer({
                questionId: q.id,
                userAnswer: 'review_only',
              })
              .then(r => r.data.data)
              .catch(() => null)
            )
        );
        setQaRecords(withEvals.filter(Boolean));
      }
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const avgScore    = session.averageScore || 0;
  const totalQ      = session.totalQuestions || 0;
  const answeredQ   = session.answeredQuestions || 0;
  const completionPct = totalQ > 0
    ? Math.round((answeredQ / totalQ) * 100) : 0;

  const scoreLabel = avgScore >= 8  ? '🌟 Excellent'
                   : avgScore >= 6  ? '✅ Good'
                   : avgScore >= 4  ? '⚠️ Average'
                   : '📚 Needs Work';

  const hiringReadiness = avgScore >= 7.5 ? 'Strong Hire'
                        : avgScore >= 6   ? 'Hire'
                        : avgScore >= 4.5 ? 'Borderline'
                        : 'Not Ready';

  const readinessColor = avgScore >= 7.5 ? 'text-green-700 bg-green-100'
                       : avgScore >= 6   ? 'text-blue-700  bg-blue-100'
                       : avgScore >= 4.5 ? 'text-amber-700 bg-amber-100'
                       : 'text-red-700   bg-red-100';

  // Simulated skill scores from avg
  const skillScores = {
    technical:     Math.min(10, Math.max(1, avgScore + (Math.random()-0.5)*2)),
    communication: Math.min(10, Math.max(1, avgScore + (Math.random()-0.5)*2)),
    problemSolving:Math.min(10, Math.max(1, avgScore + (Math.random()-0.5)*2)),
    behavioral:    Math.min(10, Math.max(1, avgScore + (Math.random()-0.5)*2)),
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center
                      min-h-64 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500
                        border-t-transparent rounded-full
                        animate-spin"/>
        <p className="text-gray-500 text-sm">
          Generating your interview report...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Report Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700
                      rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap
                        gap-4">
          <div>
            <p className="text-white/70 text-sm mb-1">
              Interview Complete
            </p>
            <h2 className="text-2xl font-bold">
              {session.jobRole}
              {session.targetCompany &&
                ` @ ${session.targetCompany}`}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {session.interviewType} · {session.difficulty}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-sm
            font-bold ${readinessColor} border`}>
            {hiringReadiness}
          </div>
        </div>
      </div>

      {/* Score Overview */}
      <div className="bg-white rounded-2xl border border-gray-200
                      p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-5">
          📊 Performance Overview
        </h3>
        <div className="flex items-center gap-8 flex-wrap">

          {/* Main Score */}
          <div className="flex flex-col items-center">
            <ScoreRing score={avgScore} maxScore={10} size={120}/>
            <p className="text-sm font-bold text-gray-700 mt-2">
              Overall Score
            </p>
            <span className="text-sm font-medium text-gray-500">
              {scoreLabel}
            </span>
          </div>

          {/* Skill Rings */}
          <div className="flex gap-6 flex-wrap flex-1
                          justify-center">
            {SKILL_METRICS.map(m => (
              <div key={m.key} className="flex flex-col items-center">
                <ScoreRing
                  score={parseFloat(skillScores[m.key].toFixed(1))}
                  maxScore={10}
                  size={80}
                />
                <p className="text-xs text-gray-500 mt-1 text-center
                              max-w-16">
                  {m.icon} {m.label}
                </p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="space-y-3">
            {[
              { label: 'Questions',  value: `${answeredQ}/${totalQ}` },
              { label: 'Completion', value: `${completionPct}%`      },
              { label: 'Readiness', value: hiringReadiness           },
            ].map(s => (
              <div key={s.label}
                   className="text-center p-3 bg-gray-50
                              rounded-xl min-w-24">
                <p className="text-base font-bold text-gray-900">
                  {s.value}
                </p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Question-by-Question Review */}
      {qaRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200
                        p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">
            📝 Detailed Question Review
          </h3>
          <div className="space-y-3">
            {qaRecords.map((qa, i) => (
              <div key={i}
                   className="border border-gray-200 rounded-xl
                              overflow-hidden">
                {/* Question Header */}
                <button
                  onClick={() =>
                    setExpanded(expanded === i ? null : i)
                  }
                  className="w-full flex items-center justify-between
                             p-4 hover:bg-gray-50 transition-colors
                             text-left">
                  <div className="flex items-center gap-3 flex-1
                                  min-w-0">
                    <div className={`w-8 h-8 rounded-full flex
                      items-center justify-center text-sm font-bold
                      shrink-0
                      ${(qa.score || 0) >= 7
                          ? 'bg-green-100 text-green-700'
                          : (qa.score || 0) >= 5
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'}`}>
                      {(qa.score || 0).toFixed(0)}
                    </div>
                    <p className="text-sm text-gray-800 truncate">
                      {qa.question}
                    </p>
                  </div>
                  <span className="text-gray-400 ml-2 shrink-0">
                    {expanded === i ? '▲' : '▼'}
                  </span>
                </button>

                {/* Expanded Detail */}
                {expanded === i && (
                  <div className="px-4 pb-4 border-t border-gray-100
                                  space-y-3 pt-3">

                    {/* Score bar */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          Score
                        </span>
                        <span className="text-xs font-bold">
                          {qa.score}/10 — {qa.scoreLabel}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100
                                      rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full
                            ${(qa.score || 0) >= 7 ? 'bg-green-500'
                              : (qa.score || 0) >= 5 ? 'bg-amber-500'
                              : 'bg-red-400'}`}
                          style={{
                            width: `${((qa.score || 0)/10)*100}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Your Answer */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500
                                    uppercase tracking-wider mb-1">
                        Your Answer
                      </p>
                      <p className="text-sm text-gray-700">
                        {qa.userAnswer === 'skip'
                          || qa.userAnswer === 'No answer provided'
                          ? <em className="text-gray-400">Skipped</em>
                          : qa.userAnswer}
                      </p>
                    </div>

                    {/* Feedback */}
                    <div className="grid grid-cols-2 gap-3">
                      {qa.strengths?.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs font-bold text-green-700
                                        mb-1">✅ Strengths</p>
                          <ul className="space-y-0.5">
                            {qa.strengths.map((s, j) => (
                              <li key={j} className="text-xs text-green-700
                                                     flex gap-1">
                                <span>•</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {qa.weaknesses?.length > 0 && (
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-xs font-bold text-red-700
                                        mb-1">⚠️ Improve</p>
                          <ul className="space-y-0.5">
                            {qa.weaknesses.map((w, j) => (
                              <li key={j} className="text-xs text-red-700
                                                     flex gap-1">
                                <span>•</span>{w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Ideal Answer */}
                    {qa.idealAnswer && (
                      <div className="bg-indigo-50 border border-indigo-100
                                      rounded-lg p-3">
                        <p className="text-xs font-bold text-indigo-700 mb-1">
                          🎯 Ideal Answer
                        </p>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {qa.idealAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white rounded-2xl border border-gray-200
                      p-6 space-y-4">
        <h3 className="text-sm font-bold text-gray-900">
          🚀 Next Steps
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200
                          rounded-xl">
            <p className="text-sm font-bold text-blue-800 mb-2">
              📚 Recommended Topics
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Review {session.interviewType} fundamentals</li>
              <li>• Practice system design patterns</li>
              <li>• Study {session.jobRole} best practices</li>
            </ul>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200
                          rounded-xl">
            <p className="text-sm font-bold text-purple-800 mb-2">
              💻 LeetCode Practice
            </p>
            <ul className="text-xs text-purple-700 space-y-1">
              <li>• Arrays and Strings (Easy)</li>
              <li>• Dynamic Programming (Medium)</li>
              <li>• Graph algorithms (Medium)</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 border border-green-200
                          rounded-xl">
            <p className="text-sm font-bold text-green-800 mb-2">
              🎯 Next Practice
            </p>
            <p className="text-xs text-green-700">
              {avgScore >= 7
                ? 'Try a harder difficulty interview next time!'
                : 'Practice the same level to build confidence.'}
            </p>
            <button
              onClick={onRetry}
              className="mt-3 px-3 py-1.5 bg-green-600 text-white
                         text-xs rounded-lg hover:bg-green-700
                         transition-colors">
              Practice Again →
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onRetry}
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700
                     text-white font-medium rounded-xl transition-colors
                     flex items-center justify-center gap-2">
          🔄 New Interview
        </button>
        <button
          onClick={onHome}
          className="px-6 py-3 border border-gray-300 text-gray-600
                     rounded-xl hover:bg-gray-50 transition-colors">
          Home
        </button>
      </div>
    </div>
  );
}

