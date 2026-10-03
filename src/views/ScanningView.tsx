import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, FileSearch, ScanLine, ShieldAlert, Radar, Link2, BrainCircuit } from 'lucide-react';
import type { ScanStep } from '@/types';

interface ScanningViewProps {
  fileName: string;
  fileType: string;
  onComplete: () => void;
}

const SCAN_STEPS: ScanStep[] = [
  { id: '1', label: 'Fayl turini aniqlayapmiz', status: 'pending' },
  { id: '2', label: 'Fayl ichidagi ma\'lumotlarni ajratayapmiz', status: 'pending' },
  { id: '3', label: 'Matnni tekshiryapmiz', status: 'pending' },
  { id: '4', label: 'Shaxsiy ma\'lumotlarni qidiryapmiz', status: 'pending' },
  { id: '5', label: 'QR-kodni tekshiryapmiz', status: 'pending' },
  { id: '6', label: 'Fayl ichidagi qo\'shimcha ma\'lumotlarni tekshiryapmiz', status: 'pending' },
  { id: '7', label: 'Topilgan ma\'lumotlarning bog\'liqligini tahlil qilyapmiz', status: 'pending' },
  { id: '8', label: 'Bu ma\'lumotlar siz uchun qanchalik xavf tug\'dirishini baholayapmiz', status: 'pending' },
  { id: '9', label: 'Himoya tavsiyalarini tayyorlayapmiz', status: 'pending' },
];

const STEP_ICONS = [FileSearch, ScanLine, ScanLine, ShieldAlert, Radar, FileSearch, Link2, BrainCircuit, ShieldAlert];

export function ScanningView({ fileName, fileType, onComplete }: ScanningViewProps) {
  const [steps, setSteps] = useState<ScanStep[]>(SCAN_STEPS);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let stepIndex = 0;
    const stepDuration = 600;

    const interval = setInterval(() => {
      if (stepIndex < SCAN_STEPS.length) {
        setSteps((prev) =>
          prev.map((step, i) => {
            if (i < stepIndex) return { ...step, status: 'done' };
            if (i === stepIndex) return { ...step, status: 'active' };
            return step;
          })
        );
        stepIndex++;
        setProgress(Math.round((stepIndex / SCAN_STEPS.length) * 100));
      } else {
        setSteps((prev) => prev.map((step) => ({ ...step, status: 'done' })));
        setProgress(100);
        clearInterval(interval);
        setTimeout(onComplete, 800);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="font-display font-black text-3xl sm:text-5xl text-cyber-cyan text-glow-cyan mb-3">
            Faylingizni tekshiryapmiz...
          </h1>
          <p className="text-gray-400 text-sm">
            {fileName} · {fileType}
          </p>
        </div>

        {/* Scanning visual + progress */}
        <div className="glass-panel rounded-xl p-6 sm:p-10 corner-brackets scan-overlay mb-6">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-cyber-cyan">Tekshirish davom etmoqda</span>
              <span className="font-display font-black text-3xl text-cyber-cyan text-glow-cyan">
                {progress}%
              </span>
            </div>
            <div className="h-2 bg-cyber-navy rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-blue rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  boxShadow: '0 0 10px rgba(0, 240, 255, 0.6)',
                }}
              />
            </div>
          </div>

          {/* Scanning radar visual */}
          <div className="flex justify-center mb-8">
            <div className="relative w-40 h-40">
              {/* Radar circles */}
              {[0.3, 0.6, 0.9].map((r) => (
                <div
                  key={r}
                  className="absolute rounded-full border border-cyber-cyan/20"
                  style={{
                    width: `${r * 100}%`,
                    height: `${r * 100}%`,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}
              {/* Sweep */}
              <div
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0, 240, 255, 0.2) 40deg, transparent 80deg)',
                  animation: 'radar-sweep 2s linear infinite',
                }}
              />
              {/* Cross hair */}
              <div className="absolute inset-x-0 top-1/2 h-px bg-cyber-cyan/15" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-cyber-cyan/15" />
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyber-cyan animate-pulse-glow" />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2 max-w-lg mx-auto">
            {steps.map((step, i) => {
              const Icon = STEP_ICONS[i] || ScanLine;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    step.status === 'active'
                      ? 'bg-cyber-cyan/10 border border-cyber-cyan/30'
                      : step.status === 'done'
                      ? 'bg-cyber-green/5 border border-cyber-green/20'
                      : 'border border-transparent'
                  }`}
                  style={{
                    opacity: step.status === 'pending' ? 0.3 : 1,
                  }}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center">
                    {step.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-cyber-green" />
                    ) : step.status === 'active' ? (
                      <Loader2 className="w-5 h-5 text-cyber-cyan animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <span
                    className={`font-mono text-sm flex-1 ${
                      step.status === 'active'
                        ? 'text-cyber-cyan'
                        : step.status === 'done'
                        ? 'text-cyber-green'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.status === 'active' && (
                    <span className="font-mono text-xs text-cyber-cyan/50 animate-blink">...</span>
                  )}
                  {step.status === 'done' && (
                    <span className="font-mono text-xs text-cyber-green">tayyor</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Terminal output */}
        <div className="glass-panel rounded-lg p-4 terminal-text">
          <div className="flex items-center gap-2 mb-2 text-cyber-cyan/50">
            <span className="text-xs font-mono">CYBERLENS::terminal</span>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-cyber-red/50" />
              <div className="w-2 h-2 rounded-full bg-cyber-amber/50" />
              <div className="w-2 h-2 rounded-full bg-cyber-green/50" />
            </div>
          </div>
          <div className="space-y-0.5">
            {steps.filter((s) => s.status !== 'pending').map((step, i) => (
              <div key={i} className="text-cyber-green">
                <span className="text-gray-600">[{new Date().toLocaleTimeString()}] </span>
                <span className="text-cyber-cyan">$ </span>
                {step.status === 'done' ? 'OK ' : '... '}
                {step.label}...
                {step.status === 'done' && <span className="text-cyber-green"> [tayyor]</span>}
              </div>
            ))}
            <div className="text-cyber-cyan">
              <span className="text-gray-600">[{new Date().toLocaleTimeString()}] </span>
              <span className="text-cyber-cyan">$ </span>
              <span className="animate-blink">_</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
