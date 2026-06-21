import { useState } from 'react';
import { interviewEvalApi } from '../../api/interviewEvalApi';
import toast from 'react-hot-toast';

const DIFF_COLORS = {
  Easy:   'bg-green-100 text-green-700',
  Medium: 'bg-amber-100 text-amber-700',
  Hard:   'bg-red-100   text-red-700',
};

const CAT_COLORS = {
  Technical:   'bg-blue-100   text-blue-700',
  Behavioural: 'bg-purple-100 text-purple-700',
  HR:          'bg-pink-100   text-pink-700',
};

export default function PracticeSession({ session, onEnd }) {
  const [questions]          = useState(session.questions || []);
  const [currentIdx, setIdx] = useState(0);
  const [answer, setAnswer]  = useState('');
  const [evaluation, setEval]= useState(null);
  const [idealAnswer, setIdeal]= useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [loadingIdeal, setLoadingIdeal] = useState(false);
  const [answered, setAnswered]        = useState({});

  const currentQ = questions[currentIdx];
  const progress = Object.keys(answered).length;

  const handleEvaluate = async () => {
    if (!answer.trim()) {
      toast.error('Please write an answer first');
      return;
    }
    setEvaluating(true);
    setIdeal(null);
    try {
      const res = await interviewEvalApi.evaluateAnswer({
        questionId: currentQ.id,
        userAnswer: answer,
      });
      const ev = res.data.data;
      setEval(ev);
      setAnswered(prev => ({
        ...prev,
        [currentQ.id]: ev.score
      }));
      toast.success(
        `+${ev.xpEarned} XP earned! Score: ${ev.score}/10`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const handleViewIdeal = async () => {
    setLoadingIdeal(true);
    try {
      const res = await interviewEvalApi.getIdealAnswer(
        currentQ.id);
      setIdeal(res.data.data.idealAnswer);
    } catch {
      toast.error('Failed to load ideal answer');
    } finally {
      setLoadingIdeal(false);
    }
  };

  const handleNext = () => {
    setIdx(i => i + 1);
    setAnswer('');
    setEval(null);
    setIdeal(null);
  };

  const handleSkip = async () => {
    // Record skip as empty answer
    try {
      await interviewEvalApi.evaluateAnswer({
        questionId: currentQ.id,
        userAnswer: 'skip',
      });
      setAnswered(prev => ({ ...prev, [currentQ.id]: 0 }));
    } catch {}
    handleNext();
  };

  // Score ring colors
  const scoreColor = (score) => {
    if (score >= 8) return '#22c55e';
    if (score >= 6) return '#f59e0b';
    if (score >= 4) return '#f97316';
    return '#ef4444';
  };

  const circumference = 2 * Math.PI * 28;

  return (
    <div className="space-y-4">

      {/* Session Header */}
      <div className="bg-white rounded-xl border border-gray-200
                      p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {session.jobRole}
            </p>
            <p className="text-xs text-gray-500">
              {session.experienceLevel} ·{' '}
              {progress}/{questions.length} answered
            </p>
          </div>
          <button
            onClick={onEnd}
            className="px-3 py-1.5 text-xs rounded-lg border
                       border-gray-300 text-gray-600
                       hover:bg-gray-100 transition-colors">
            End Session
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full
                        overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full
                       transition-all duration-500"
            style={{
              width: `${(progress / questions.length) * 100}%`
            }}
          />
        </div>

        {/* Question dots */}
        <div className="flex gap-1.5 mt-3">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => {
                setIdx(i);
                setAnswer('');
                setEval(null);
                setIdeal(null);
              }}
              className={`w-7 h-7 rounded-full text-xs font-medium
                transition-colors
                ${i === currentIdx
                    ? 'bg-indigo-600 text-white'
                    : answered[q.id] !== undefined
                      ? answered[q.id] >= 6
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-500'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="bg-white rounded-xl border border-gray-200
                        p-6 space-y-5">

          {/* Question Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold
                                 text-gray-500 uppercase
                                 tracking-wider">
                  Q{currentIdx + 1} of {questions.length}
                </span>
                <span className={`px-2 py-0.5 rounded-full
                  text-xs font-medium
                  ${DIFF_COLORS[currentQ.difficulty]
                      || 'bg-gray-100 text-gray-600'}`}>
                  {currentQ.difficulty}
                </span>
                <span className={`px-2 py-0.5 rounded-full
                  text-xs font-medium
                  ${CAT_COLORS[currentQ.category]
                      || 'bg-gray-100 text-gray-600'}`}>
                  {currentQ.category}
                </span>
              </div>
              <p className="text-base font-medium text-gray-900
                            leading-relaxed">
                {currentQ.question}
              </p>
            </div>
          </div>

          {/* Answer Area (if not yet evaluated) */}
          {!evaluation && (
            <div className="space-y-3">
              <label className="block text-sm font-medium
                                 text-gray-700">
                Your Answer
              </label>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={6}
                placeholder="Type your answer here. Be as detailed as you would be in a real interview..."
                className="w-full px-3 py-2.5 rounded-lg border
                           border-gray-300 text-sm
                           focus:outline-none focus:ring-2
                           focus:ring-indigo-500 resize-none"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleEvaluate}
                  disabled={evaluating || !answer.trim()}
                  className="flex-1 py-2.5 bg-indigo-600
                             hover:bg-indigo-700 text-white
                             text-sm font-medium rounded-lg
                             transition-colors disabled:opacity-60
                             flex items-center justify-center gap-2">
                  {evaluating ? (
                    <>
                      <div className="w-4 h-4 border-2
                                      border-white
                                      border-t-transparent
                                      rounded-full animate-spin"/>
                      Evaluating...
                    </>
                  ) : (
                    '🤖 Submit & Evaluate'
                  )}
                </button>

                <button
                  onClick={handleViewIdeal}
                  disabled={loadingIdeal}
                  className="px-4 py-2.5 border border-gray-300
                             text-gray-600 text-sm rounded-lg
                             hover:bg-gray-50 transition-colors
                             disabled:opacity-60">
                  {loadingIdeal ? '...' : '💡 View Ideal Answer'}
                </button>

                <button
                  onClick={handleSkip}
                  className="px-4 py-2.5 border border-gray-200
                             text-gray-400 text-sm rounded-lg
                             hover:bg-gray-50 transition-colors">
                  Skip →
                </button>
              </div>
            </div>
          )}

          {/* Ideal Answer (before evaluation) */}
          {idealAnswer && !evaluation && (
            <div className="bg-blue-50 border border-blue-200
                            rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700
                            uppercase tracking-wider mb-2">
                💡 Ideal Answer
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {idealAnswer}
              </p>
            </div>
          )}

          {/* Evaluation Result */}
          {evaluation && (
            <div className="space-y-4">

              {/* Score Banner */}
              <div className="flex items-center gap-6 p-4
                              bg-gray-50 rounded-xl border
                              border-gray-200">
                {/* Score Ring */}
                <div className="shrink-0">
                  <svg width="72" height="72"
                       viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="28"
                      fill="none" stroke="#e5e7eb"
                      strokeWidth="7"/>
                    <circle cx="36" cy="36" r="28"
                      fill="none"
                      stroke={scoreColor(evaluation.score)}
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={`${
                        (evaluation.score / 10) * circumference
                      } ${circumference}`}
                      strokeDashoffset={circumference / 4}
                      style={{
                        transition: 'stroke-dasharray 0.8s ease'
                      }}
                    />
                    <text x="36" y="40"
                      textAnchor="middle"
                      fontSize="16"
                      fontWeight="700"
                      fill={scoreColor(evaluation.score)}>
                      {evaluation.score}
                    </text>
                  </svg>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full
                      text-xs font-semibold
                      ${evaluation.score >= 8
                          ? 'bg-green-100 text-green-700'
                          : evaluation.score >= 6
                            ? 'bg-amber-100 text-amber-700'
                            : evaluation.score >= 4
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-red-100 text-red-700'}`}>
                      {evaluation.scoreLabel}
                    </span>
                    <span className="text-xs text-indigo-600
                                     font-medium">
                      +{evaluation.xpEarned} XP
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {evaluation.overallFeedback}
                  </p>
                </div>
              </div>

              {/* Your Answer */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-500
                              uppercase tracking-wider mb-2">
                  Your Answer
                </p>
                <p className="text-sm text-gray-700">
                  {evaluation.userAnswer}
                </p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-2 gap-4">
                <FeedbackSection
                  title="✅ Strengths"
                  items={evaluation.strengths}
                  color="green"
                />
                <FeedbackSection
                  title="⚠️ Weaknesses"
                  items={evaluation.weaknesses}
                  color="red"
                />
              </div>

              {/* Improvement Suggestions */}
              {evaluation.improvementSuggestions?.length > 0 && (
                <FeedbackSection
                  title="💡 How to Improve"
                  items={evaluation.improvementSuggestions}
                  color="blue"
                />
              )}

              {/* Ideal Answer */}
              {evaluation.idealAnswer && (
                <div className="bg-indigo-50 border
                                border-indigo-200 rounded-xl p-4">
                  <p className="text-xs font-semibold
                                text-indigo-700 uppercase
                                tracking-wider mb-2">
                    🎯 Ideal Answer
                  </p>
                  <p className="text-sm text-gray-700
                                leading-relaxed">
                    {evaluation.idealAnswer}
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 py-2.5 bg-indigo-600
                               hover:bg-indigo-700 text-white
                               text-sm font-medium rounded-lg
                               transition-colors">
                    Next Question →
                  </button>
                ) : (
                  <button
                    onClick={onEnd}
                    className="flex-1 py-2.5 bg-green-600
                               hover:bg-green-700 text-white
                               text-sm font-medium rounded-lg
                               transition-colors">
                    🏁 Finish Session
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FeedbackSection({ title, items, color }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-700',
    red:   'bg-red-50   border-red-200   text-red-700',
    blue:  'bg-blue-50  border-blue-200  text-blue-700',
  };
  const dot = {
    green: 'bg-green-400',
    red:   'bg-red-400',
    blue:  'bg-blue-400',
  };

  if (!items?.length) return null;

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase
                    tracking-wider mb-2">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i}
              className="flex items-start gap-2 text-sm">
            <span className={`w-1.5 h-1.5 rounded-full mt-1.5
                              shrink-0 ${dot[color]}`}/>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}



