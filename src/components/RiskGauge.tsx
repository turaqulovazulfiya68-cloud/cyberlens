interface RiskGaugeProps {
  score: number;
  level: string;
  size?: number;
  label?: string;
  protected_?: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  'past': '#00ff88',
  'orta': '#ffaa00',
  'yuqori': '#ff2d55',
  'kritik': '#ff0044',
};

const LEVEL_LABELS: Record<string, string> = {
  'past': 'PAST',
  'orta': "O'RTA",
  'yuqori': 'YUQORI',
  'kritik': 'KRITIK',
};

export function RiskGauge({ score, level, size = 200, label, protected_ = false }: RiskGaugeProps) {
  const color = LEVEL_COLORS[level] || '#00ff88';
  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="risk-arc">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          {/* Tick marks */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i / 60) * 360;
            const isLong = i % 5 === 0;
            const r1 = radius - (isLong ? 12 : 8);
            const r2 = radius - 4;
            const x1 = size / 2 + r1 * Math.cos((angle * Math.PI) / 180);
            const y1 = size / 2 + r1 * Math.sin((angle * Math.PI) / 180);
            const x2 = size / 2 + r2 * Math.cos((angle * Math.PI) / 180);
            const y2 = size / 2 + r2 * Math.sin((angle * Math.PI) / 180);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={score > (i / 60) * 100 ? color : 'rgba(255,255,255,0.1)'}
                strokeWidth={isLong ? 1.5 : 0.5}
              />
            );
          })}
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              filter: `drop-shadow(0 0 8px ${color})`,
              transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease',
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display font-black text-4xl sm:text-5xl"
            style={{ color, textShadow: `0 0 20px ${color}` }}
          >
            {score}
          </span>
          <span className="text-xs text-gray-500 font-mono">/ 100</span>
          <span
            className="mt-2 px-3 py-0.5 text-xs font-mono font-bold rounded"
            style={{ color, border: `1px solid ${color}40`, background: `${color}15` }}
          >
            {LEVEL_LABELS[level] || level.toUpperCase()}
          </span>
        </div>
      </div>
      {label && (
        <div className="text-center">
          <p className={`text-sm font-mono ${protected_ ? 'text-cyber-green' : 'text-gray-400'}`}>
            {label}
          </p>
        </div>
      )}
    </div>
  );
}
