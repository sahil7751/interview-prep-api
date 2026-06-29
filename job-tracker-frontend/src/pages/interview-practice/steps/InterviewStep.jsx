import { useState, useEffect } from 'react';
import { interviewEvalApi } from '../../../api/interviewEvalApi';
import QuestionTimer from '../components/QuestionTimer';
import toast from 'react-hot-toast';

const DIFF_COLORS = {
  Easy:   'bg-green-100  text-green-700',
  Medium: 'bg-amber-100  text-amber-700',
  Hard:   'bg-red-100    text-red-700',
};

const CAT_COLORS = {
  Technical:     'bg-blue-100   text-blue-700',
  Behavioural:   'bg-purple-100 text-purple-700',
  HR:            'bg-pink-100   text-pink-700',
  'System Design':'bg-teal-100   text-teal-700',
};

export default function InterviewStep({ session, onComplete, onExit }) {
  const [questions]          = useState(session.questions || []);
  const [currentIdx, setIdx] = useState(0);
  const [answers, setAnswers]= useState({});
  const [submitting, setSubmitting] = useState(false);
  const [timeUp, setTimeUp]  = useState(false);

  const currentQ   = questions[currentIdx];
  const totalQ     = questions.length;
  const answered   = Object.keys(answers).length;
  const progress   = ((currentIdx) / totalQ) * 100;
  const currentAns = answers[currentQ?.id] || '';

  const handleAnswer = (val) => {
    if (!currentQ) return;
    setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
  };

  const handleNext = () => {
    if (currentIdx < totalQ - 1) {
      setIdx(i => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) setIdx(i => i - 1);
  };

  const handleSkip = () => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: 'skip' }));
    handleNext();
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter(
      q => !answers[q.id]
    );

    if (unanswered.length > 0 && !timeUp) {
      const confirmSubmit = window.confirm(
        `You have ${unanswered.length} unanswered question(s). Submit anyway?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    try {
      // Evaluate all answered questions
      const evalPromises = questions.map(q =>
        interviewEvalApi.evaluateAnswer({
          questionId: q.id,
          userAnswer: answers[q.id] || 'No answer provided',
        }).catch(() => null)
      );

      await Promise.all(evalPromises);

      // Get updated session
      const res = await interviewEvalApi.getSession(session.id);
      toast.success('Interview complete! Generating report...');
      onComplete(res.data.data);
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (timeUp) {
      toast('⏰ Time is up! Submitting your answers...', {
        icon: '⏰',
        duration: 3000,
      });
      setTimeout(handleSubmit, 2000);
    }
  }, [timeUp]);

  if (!currentQ) return null;

  return (
    <div className="space-y-4">

      {/* Interview Header */}
      <div className="bg-white rounded-2xl border border-gray-200
                      p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-gray-900">
              {session.jobRole}
              {session.targetCompany &&
                ` @ ${session.targetCompany}`}
            </p>
            <p className="text-xs text-gray-500">
              {session.interviewType} Interview ·{' '}
              {session.difficulty}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {session.timedMode && (
              <QuestionTimer
                totalMinutes={session.timeLimitMinutes || 30}
                onTimeUp={() => setTimeUp(true)}
                enabled={true}
              />
            )}
            <button
              onClick={() => {
                if (window.confirm(
                  'Exit interview? Your progress will be lost.')) {
                  onExit();
                }
              }}
              className="px-3 py-1.5 border border-gray-300
                         text-gray-600 text-xs rounded-lg
                         hover:bg-gray-100 transition-colors">
              Exit
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              Question {currentIdx + 1} of {totalQ}
            </span>
            <span>{answered} answered</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full
                          overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full
                         transition-all duration-500"
              style={{
                width: `${((currentIdx + 1) / totalQ) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Question dots */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setIdx(i)}
              className={`w-7 h-7 rounded-full text-xs font-bold
                transition-colors
                ${i === currentIdx
                    ? 'bg-indigo-600 text-white'
                    : answers[q.id] && answers[q.id] !== 'skip'
                      ? 'bg-green-100 text-green-700'
                      : answers[q.id] === 'skip'
                        ? 'bg-gray-200 text-gray-500'
                        : 'bg-gray-100 text-gray-500'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-gray-200
                      p-6 space-y-5">

        {/* Question header */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400
                           uppercase tracking-wider">
            Q{currentIdx + 1}
          </span>
          {currentQ.difficulty && (
            <span className={`px-2.5 py-0.5 rounded-full
              text-xs font-medium
              ${DIFF_COLORS[currentQ.difficulty]
                  || 'bg-gray-100 text-gray-600'}`}>
              {currentQ.difficulty}
            </span>
          )}
          {currentQ.category && (
            <span className={`px-2.5 py-0.5 rounded-full
              text-xs font-medium
              ${CAT_COLORS[currentQ.category]
                  || 'bg-gray-100 text-gray-600'}`}>
              {currentQ.category}
            </span>
          )}
        </div>

        {/* Question Text */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50
                        border border-indigo-100 rounded-xl p-5">
          <p className="text-base font-medium text-gray-900
                        leading-relaxed">
            {currentQ.question}
          </p>
        </div>

        {/* Answer Area */}
        <div>
          <label className="block text-sm font-medium
                             text-gray-700 mb-2">
            Your Answer
            <span className="text-gray-400 font-normal ml-1">
              (Be as detailed as you would in a real interview)
            </span>
          </label>
          <textarea
            value={currentAns === 'skip' ? '' : currentAns}
            onChange={e => handleAnswer(e.target.value)}
            rows={8}
            placeholder={`Take your time and structure your answer clearly.

For technical questions: Explain your thought process step by step.
For behavioral questions: Use the STAR method (Situation, Task, Action, Result).
For system design: Think out loud about trade-offs and scale.`}
            className="w-full px-4 py-3 rounded-xl border
                       border-gray-300 text-sm focus:outline-none
                       focus:ring-2 focus:ring-indigo-500 resize-none
                       leading-relaxed"
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-gray-400">
              {currentAns && currentAns !== 'skip'
                ? `${currentAns.length} characters`
                : 'Start typing your answer...'}
            </p>
            {currentAns && currentAns !== 'skip'
              && currentAns.length > 20 && (
              <p className="text-xs text-green-600">✓ Answer saved</p>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="px-4 py-2.5 border border-gray-300
                       text-gray-600 text-sm rounded-xl
                       hover:bg-gray-50 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed">
            ← Previous
          </button>

          <div className="flex-1"/>

          <button
            onClick={handleSkip}
            className="px-4 py-2.5 border border-amber-300
                       text-amber-600 text-sm rounded-xl
                       hover:bg-amber-50 transition-colors">
            Skip →
          </button>

          {currentIdx < totalQ - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700
                         text-white text-sm font-medium rounded-xl
                         transition-colors">
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600
                         to-green-700 text-white text-sm font-bold
                         rounded-xl transition-all hover:opacity-90
                         disabled:opacity-60 flex items-center gap-2">
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white
                                border-t-transparent rounded-full
                                animate-spin"/>
              ) : '🏁'}
              {submitting ? 'Submitting...' : 'Submit Interview'}
            </button>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200
                      rounded-xl p-4 flex gap-3">
        <span className="text-xl shrink-0">💡</span>
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Interview Tip:</strong> Answer all questions
          for maximum XP. You can navigate between questions using
          the dots above. Your answers are auto-saved as you type.
        </p>
      </div>
    </div>
  );
}

