import { useState } from 'react';
import { interviewEvalApi } from '../../api/interviewEvalApi';
import toast from 'react-hot-toast';
import SessionSetup   from './SessionSetup';
import PracticeSession from './PracticeSession';
import SessionHistory  from './SessionHistory';

const VIEWS = {
  HOME:     'home',
  PRACTICE: 'practice',
  HISTORY:  'history',
};

export default function InterviewPractice() {
  const [view, setView]       = useState(VIEWS.HOME);
  const [session, setSession] = useState(null);
  const [starting, setStarting] = useState(false);

  const handleStartSession = async (formData) => {
    setStarting(true);
    try {
      const res = await interviewEvalApi.startSession(formData);
      setSession(res.data.data);
      setView(VIEWS.PRACTICE);
      toast.success('Session started! Good luck 🎯');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  const handleSessionEnd = () => {
    setView(VIEWS.HISTORY);
    setSession(null);
  };

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            🧠 AI Interview Practice
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Answer questions and get instant AI evaluation
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setView(VIEWS.HOME)}
            className={`px-4 py-2 rounded-lg text-sm font-medium
              transition-colors
              ${view === VIEWS.HOME
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600'
                    + ' hover:bg-gray-50'}`}>
            New Session
          </button>
          <button
            onClick={() => setView(VIEWS.HISTORY)}
            className={`px-4 py-2 rounded-lg text-sm font-medium
              transition-colors
              ${view === VIEWS.HISTORY
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600'
                    + ' hover:bg-gray-50'}`}>
            History
          </button>
        </div>
      </div>

      {/* Views */}
      {view === VIEWS.HOME && (
        <SessionSetup
          onStart={handleStartSession}
          loading={starting}
        />
      )}

      {view === VIEWS.PRACTICE && session && (
        <PracticeSession
          session={session}
          onEnd={handleSessionEnd}
        />
      )}

      {view === VIEWS.HISTORY && (
        <SessionHistory
          onSelectSession={(s) => {
            setSession(s);
            setView(VIEWS.PRACTICE);
          }}
        />
      )}
    </div>
  );
}


