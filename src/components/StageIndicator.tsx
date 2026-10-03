import type { AppStage } from '@/types';

interface StageIndicatorProps {
  currentStage: AppStage;
}

const STAGES: { key: string; label: string; stages: AppStage[] }[] = [
  { key: '1', label: 'Aniqla', stages: ['yuklash', 'skanerlash'] },
  { key: '2', label: 'Tushun', stages: ['natija'] },
  { key: '3', label: 'Bahola', stages: ['natija'] },
  { key: '4', label: 'Himoyala', stages: ['himoya'] },
  { key: '5', label: 'Tekshir', stages: ['qayta-tekshirish'] },
];

export function StageIndicator({ currentStage }: StageIndicatorProps) {
  const activeIndex = STAGES.findIndex((s) => s.stages.includes(currentStage));

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 py-4">
      {STAGES.map((stage, i) => {
        const isActive = i === activeIndex;
        const isPassed = activeIndex !== -1 && i < activeIndex;
        return (
          <div key={stage.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  isActive
                    ? 'border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10 glow-cyan'
                    : isPassed
                    ? 'border-cyber-green text-cyber-green bg-cyber-green/10'
                    : 'border-gray-700 text-gray-600'
                }`}
              >
                {isPassed ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-mono font-bold">{stage.key}</span>
                )}
                {isActive && (
                  <div className="absolute inset-0 rounded-full border border-cyber-cyan animate-ping-slow" />
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-mono font-medium transition-colors ${
                  isActive ? 'text-cyber-cyan' : isPassed ? 'text-cyber-green' : 'text-gray-600'
                }`}
              >
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={`h-px w-6 sm:w-12 transition-all duration-300 ${
                  isPassed ? 'bg-cyber-green' : 'bg-gray-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
