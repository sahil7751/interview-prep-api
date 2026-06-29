import { useState, useEffect, useRef } from 'react';

export default function QuestionTimer({ totalMinutes = 30,
                                        onTimeUp, enabled = true }) {
  const [seconds, setSeconds] = useState(totalMinutes * 60);
  const [warned, setWarned]   = useState(false);
  const intervalRef           = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    intervalRef.current = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          onTimeUp?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [enabled]);

  useEffect(() => {
    if (seconds === 60 && !warned) {
      setWarned(true);
    }
  }, [seconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct  = ((totalMinutes * 60 - seconds) /
                 (totalMinutes * 60)) * 100;

  const isLow     = seconds < 60;
  const isWarning = seconds < 300 && seconds >= 60;

  if (!enabled) return null;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl
      border text-sm font-mono font-bold transition-colors
      ${isLow
          ? 'bg-red-50 border-red-300 text-red-700 animate-pulse'
          : isWarning
            ? 'bg-amber-50 border-amber-300 text-amber-700'
            : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
      <span className="text-base">
        {isLow ? '⚠️' : '⏱'}
      </span>
      {String(mins).padStart(2, '0')}:
      {String(secs).padStart(2, '0')}
    </div>
  );
}

