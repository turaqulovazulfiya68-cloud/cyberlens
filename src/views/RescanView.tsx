import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, RotateCw, ArrowRight } from 'lucide-react';
import type { AnalysisResult, AppStage } from '@/types';
import { RiskGauge } from '@/components/RiskGauge';

interface RescanViewProps {
  result: AnalysisResult;
  onNavigate: (stage: AppStage) => void;
  onScanComplete: () => void;
}

const RESCAN_STEPS = [
  'Himoyalangan fayl yuklanmoqda',
  'Oldingi xavf manbalari tekshirilmoqda',
  'Sezgir ma\'lumotlar qayta skanerlanmoqda',
  'QR-kod qayta tekshirilmoqda',
  'Metadata qayta tekshirilmoqda',
  'Bog\'liqliklar qayta tahlil qilinmoqda',
  'Yangi xavf baholanmoqda',
];

export function RescanView({ result, onNavigate, onScanComplete }: RescanViewProps) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (step < RESCAN_STEPS.length) {
      const timer = setTimeout(() => setStep(step + 1), 500);
      return () => clearTimeout(timer);
    } else {
      setDone(true);
      onScanComplete();
    }
  }, [step, onScanComplete]);

  const progress = Math.min(100, Math.round((step / RESCAN_STEPS.length) * 100));

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <RotateCw className={`w-10 h-10 text-cyber-cyan mx-auto mb-3 ${!done ? 'animate-spin' : ''}`} />
          <h1 className="font-display font-black text-3xl sm:text-5xl text-cyber-cyan text-glow-cyan mb-2">
            {!done ? 'QAYTA TEKSHIRILMOQDA...' : 'HIMOYA TASDIQLANDI'}
          </h1>
          <p className="text-gray-400 text-sm">
            {!done ? 'Himoyalangan fayl avtomatik qayta skanerlanmoqda' : 'Ulashishdan oldingi xavfsizlik nazorati yakunlandi'}
          </p>
        </div>

        {!done ? (
          <>
            {/* Progress */}
            <div className="glass-panel rounded-xl p-8 corner-brackets scan-overlay mb-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-cyber-cyan">QAYTA TEKSHIRUV</span>
                  <span className="font-display font-black text-2xl text-cyber-cyan text-glow-cyan">{progress}%</span>
                </div>
                <div className="h-2 bg-cyber-navy rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-green rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(0, 240, 255, 0.6)' }}
                  />
                </div>
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                {RESCAN_STEPS.map((label, i) => {
                  const status = i < step ? 'done' : i === step ? 'active' : 'pending';
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        status === 'active' ? 'bg-cyber-cyan/10 border border-cyber-cyan/30' :
                        status === 'done' ? 'bg-cyber-green/5' : ''
                      }`}
                      style={{ opacity: status === 'pending' ? 0.3 : 1 }}
                    >
                      <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                        {status === 'done' ? (
                          <CheckCircle2 className="w-5 h-5 text-cyber-green" />
                        ) : status === 'active' ? (
                          <Loader2 className="w-5 h-5 text-cyber-cyan animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-gray-600" />
                        )}
                      </div>
                      <span className={`font-mono text-sm ${
                        status === 'active' ? 'text-cyber-cyan' :
                        status === 'done' ? 'text-cyber-green' : 'text-gray-500'
                      }`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation */}
            <div className="space-y-6 animate-fade-in">
              {/* Shield animation */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full border-2 border-cyber-green/30 animate-ping-slow" />
                  <div className="absolute inset-0 rounded-full border border-cyber-green/20 animate-pulse-glow" />
                  <ShieldCheck className="w-24 h-24 text-cyber-green animate-pulse-glow relative" />
                </div>
              </div>

              {/* Before/After gauges */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="glass-panel-red rounded-xl p-6">
                  <p className="text-cyber-red font-mono text-xs text-center mb-4">OLDIN</p>
                  <RiskGauge score={result.riskScore} level={result.riskLevel} size={160} />
                </div>
                <div className="glass-panel rounded-xl p-6 border-cyber-green/30">
                  <p className="text-cyber-green font-mono text-xs text-center mb-4">KEYIN</p>
                  <RiskGauge score={result.protectedRiskScore} level={result.protectedRiskLevel} size={160} protected_ />
                </div>
              </div>

              {/* Status messages */}
              <div className="glass-panel rounded-xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyber-green flex-shrink-0" />
                  <p className="text-sm text-gray-300">
                    Oldingi xavf manbalari qayta tekshirildi.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyber-green flex-shrink-0" />
                  <p className="text-sm text-gray-300">
                    Himoyalangan ma'lumotlar endi oshkor qilinmaydi.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-cyber-green flex-shrink-0" />
                  <p className="text-sm text-gray-300">
                    Ulashishdan oldingi xavfsizlik nazorati yakunlandi.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-cyber-green flex-shrink-0" />
                  <p className="text-cyber-green text-sm font-bold">
                    Faylni xavfsiz ulashish mumkin.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <button
                  onClick={() => onNavigate('himoyalangan-fayllar')}
                  className="px-8 py-3.5 bg-cyber-green text-cyber-black font-display font-bold text-sm tracking-wider rounded hover:bg-cyber-green/90 transition-all glow-green inline-flex items-center gap-2"
                >
                  HIMOYALANGAN FAYLLARGA
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
