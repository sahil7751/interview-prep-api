export default function ScoreRing({ score, maxScore = 10,
                                    size = 80, label }) {
  const pct  = Math.min(100, (score / maxScore) * 100);
  const R    = (size / 2) - 6;
  const circ = 2 * Math.PI * R;
  const dash = (pct / 100) * circ;

  const color = score >= 8  ? '#22c55e'
              : score >= 6  ? '#3b82f6'
              : score >= 4  ? '#f59e0b'
              : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size/2} cy={size/2} r={R}
          fill="none" stroke="#e5e7eb" strokeWidth="6"
        />
        <circle
          cx={size/2} cy={size/2} r={R}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x={size/2} y={size/2 - 3}
          textAnchor="middle" fontSize={size * 0.2}
          fontWeight="700" fill={color}>
          {score}
        </text>
        <text x={size/2} y={size/2 + size * 0.16}
          textAnchor="middle" fontSize={size * 0.12} fill="#9ca3af">
          /{maxScore}
        </text>
      </svg>
      {label && (
        <p className="text-xs text-gray-500 mt-1 text-center">
          {label}
        </p>
      )}
    </div>
  );
}

