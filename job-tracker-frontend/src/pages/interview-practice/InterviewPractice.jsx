import { useState } from 'react';
import { interviewEvalApi } from '../../api/interviewEvalApi';
import StepIndicator   from './components/StepIndicator';
import ConfigureStep   from './steps/ConfigureStep';
import LoadingStep     from './steps/LoadingStep';
import InterviewStep   from './steps/InterviewStep';
import ReportStep      from './steps/ReportStep';
import SessionHistory  from './SessionHistory';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Configure'  },
  { id: 2, label: 'Generating' },
  { id: 3, label: 'Interview'  },
  { id: 4, label: 'Results'    },
];

export default function InterviewPractice() {
  const [view, setView]       = useState('home'); // home | interview | history
  const [step, setStep]       = useState(1);
  const [session, setSession] = useState(null);
  const [config, setConfig]   = useState(null);

  const handleStartInterview = async (formData) => {
    setConfig(formData);
    setStep(2); // show loading
    setView('interview');

    try {
      const res = await interviewEvalApi.startSession(formData);
      setSession(res.data.data);
      setStep(3); // go to live interview
      toast.success('Interview ready! Good luck 🎯');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to generate questions');
      setStep(1);
      setView('home');
    }
  };

  const handleInterviewComplete = (completedSession) => {
    setSession(completedSession);
    setStep(4);
  };

  const handleReset = () => {
    setStep(1);
    setView('home');
    setSession(null);
    setConfig(null);
  };

  return (
    <div className="max-w-5xl space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            🧠 AI Interview Practice
          </h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Real AI-powered mock interviews with instant evaluation
          </p>
        </div>
        <div className="flex gap-2">
          {view !== 'home' && step !== 3 && (
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300
                         text-gray-600 text-sm rounded-xl
                         hover:bg-gray-50 transition-colors">
              ← New Interview
            </button>
          )}
          <button
            onClick={() => {
              setView(view === 'history' ? 'home' : 'history');
              setStep(1);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium
              transition-colors
              ${view === 'history'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-600'
                    + ' hover:bg-gray-50'}`}>
            📋 History
          </button>
        </div>
      </div>

      {/* Step Indicator (only during interview flow) */}
      {view === 'interview' && (
        <StepIndicator steps={STEPS} currentStep={step}/>
      )}

      {/* Views */}
      {view === 'history' ? (
        <SessionHistory
          onStart={() => setView('home')}
        />
      ) : step === 1 ? (
        <ConfigureStep onStart={handleStartInterview}/>
      ) : step === 2 ? (
        <LoadingStep config={config}/>
      ) : step === 3 && session ? (
        <InterviewStep
          session={session}
          onComplete={handleInterviewComplete}
          onExit={handleReset}
        />
      ) : step === 4 && session ? (
        <ReportStep
          session={session}
          onRetry={handleReset}
          onHome={handleReset}
        />
      ) : null}
    </div>
  );
}