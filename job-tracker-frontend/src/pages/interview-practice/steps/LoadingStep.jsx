import { useEffect, useState } from 'react';

const MESSAGES = [
  { icon: '🤖', text: 'Analyzing job description...'       },
  { icon: '🎯', text: 'Selecting interview pattern...'     },
  { icon: '📝', text: 'Preparing personalized questions...' },
  { icon: '🧠', text: 'Building evaluation criteria...'    },
  { icon: '✨', text: 'Almost ready...'                    },
];

export default function LoadingStep({ config }) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIdx(i => Math.min(i + 1, MESSAGES.length - 1));
    }, 1400);

    const progInterval = setInterval(() => {
      setProgress(p => Math.min(p + 2, 95));
    }, 140);

    return () => {
      clearInterval(msgInterval);
      clearInterval(progInterval);
    };
  }, []);

  return (
    <div className="min-h-96 flex flex-col items-center
                    justify-center">
      <div className="bg-white rounded-3xl border border-gray-200
                      shadow-xl p-12 max-w-md w-full text-center
                      space-y-8">

        {/* Animated logo */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br
                          from-indigo-600 to-purple-600 flex items-center
                          justify-center mx-auto shadow-2xl
                          animate-pulse">
            <span className="text-4xl">🤖</span>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8
                          bg-green-400 rounded-full flex items-center
                          justify-center animate-bounce">
            <span className="text-xs">✨</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            CareerPilot AI
          </h2>
          <p className="text-gray-500 text-sm">
            Preparing your personalized interview
          </p>
        </div>

        {/* Current message */}
        <div className="min-h-12 flex items-center
                        justify-center">
          <div className="flex items-center gap-3 text-indigo-700
                          bg-indigo-50 px-5 py-3 rounded-full">
            <span className="text-xl">
              {MESSAGES[msgIdx].icon}
            </span>
            <span className="text-sm font-medium">
              {MESSAGES[msgIdx].text}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="w-full h-2.5 bg-gray-100 rounded-full
                          overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500
                         to-purple-500 rounded-full transition-all
                         duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">{progress}%</p>
        </div>

        {/* Config summary */}
        {config && (
          <div className="flex items-center justify-center gap-3
                          flex-wrap">
            {[
              config.jobRole,
              config.interviewType,
              config.difficulty,
              config.targetCompany,
            ].filter(Boolean).map((tag, i) => (
              <span key={i}
                    className="px-3 py-1 bg-gray-100 text-gray-600
                               rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

