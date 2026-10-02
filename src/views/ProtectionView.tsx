import { useState, useRef, useCallback, useEffect } from 'react';
import { Lock, ShieldCheck, ArrowRight, Check, Eye, EyeOff, Sparkles } from 'lucide-react';
import type { AnalysisResult, AppStage, Finding } from '@/types';
import { applyProtection, getCategoryColor, getCategoryLabel } from '@/lib/analysis';
import { RiskGauge } from '@/components/RiskGauge';

interface ProtectionViewProps {
  result: AnalysisResult;
  onResultUpdate: (result: AnalysisResult) => void;
  onNavigate: (stage: AppStage) => void;
}

export function ProtectionView({ result, onResultUpdate, onNavigate }: ProtectionViewProps) {
  const [selectedProtections, setSelectedProtections] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const toggleProtection = (id: string) => {
    setSelectedProtections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyAll = () => {
    setSelectedProtections(new Set(result.findings.map((f) => f.id)));
  };

  const applySelected = () => {
    const updated = applyProtection(result, Array.from(selectedProtections));
    onResultUpdate(updated);
    setApplied(true);
  };

  const protectedResult = applied
    ? applyProtection(result, Array.from(selectedProtections))
    : null;

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <Lock className="w-10 h-10 text-cyber-cyan mx-auto mb-3 animate-pulse-glow" />
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white mb-2">
            HIMOYALASH
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            Tizim aniqlangan xavfga qarab avtomatik tavsiya beradi. Himoyalashni xohlashingizni tanlang.
          </p>
        </div>

        {!applied ? (
          <>
            {/* Protection options */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-mono text-sm text-cyber-cyan">HIMOYA TAVSIYALARI</h2>
                <button
                  onClick={applyAll}
                  className="text-xs text-cyber-cyan font-mono hover:text-white transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  HAMMASINI TANLASH
                </button>
              </div>

              {result.findings.map((finding, i) => {
                const color = getCategoryColor(finding.category);
                const isSelected = selectedProtections.has(finding.id);
                return (
                  <div
                    key={finding.id}
                    className={`glass-panel rounded-lg p-4 transition-all duration-300 animate-fade-in-up cursor-pointer ${
                      isSelected ? 'border-cyber-cyan/50 bg-cyber-cyan/5' : 'hover:border-cyber-cyan/30'
                    }`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                    onClick={() => toggleProtection(finding.id)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'border-cyber-cyan bg-cyber-cyan/20' : 'border-gray-600'
                        }`}
                      >
                        {isSelected && <Check className="w-4 h-4 text-cyber-cyan" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white">{finding.label}</h3>
                          <span
                            className="px-2 py-0.5 text-[9px] font-mono rounded"
                            style={{ color, border: `1px solid ${color}30`, background: `${color}10` }}
                          >
                            {getCategoryLabel(finding.category)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2 font-mono">
                          Qiymat: <span className="text-gray-400">{finding.value.substring(0, 30)}...</span>
                        </p>
                        <div className="flex items-center gap-2 p-2 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded">
                          <ShieldCheck className="w-4 h-4 text-cyber-cyan flex-shrink-0" />
                          <span className="text-xs text-cyber-cyan">{finding.protectionAction}</span>
                        </div>
                      </div>

                      {/* Sensitivity */}
                      <div className="flex-shrink-0 text-right">
                        <p className="font-mono text-[10px] text-gray-600">SEZGIRLIK</p>
                        <p className="font-display font-bold text-lg" style={{ color }}>{finding.sensitivity}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Apply button */}
            <div className="text-center">
              <button
                onClick={applySelected}
                disabled={selectedProtections.size === 0}
                className="px-10 py-4 bg-cyber-cyan text-cyber-black font-display font-bold text-sm tracking-wider rounded hover:bg-cyber-cyan/90 transition-all glow-cyan disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                {selectedProtections.size > 0
                  ? `${selectedProtections.size} TA MA'LUMOTNI HIMOYALASH`
                  : 'HIMOYALASHNI TANLANG'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Before / After comparison */}
            <div className="mb-8">
              <h2 className="font-display font-bold text-xl text-cyber-cyan mb-4 text-center">
                BEFORE / AFTER TAQQOSLASH
              </h2>
              <p className="text-xs text-gray-600 text-center mb-6 font-mono">* Demo qiymatlar</p>

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                {/* Before */}
                <div className="glass-panel-red rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-cyber-red" />
                    <h3 className="font-display font-bold text-sm text-cyber-red">ULASHISHDAN OLDIN</h3>
                  </div>
                  <RiskGauge score={result.riskScore} level={result.riskLevel} size={160} label="XAVF: YUQORI" />
                  <div className="mt-4 space-y-1">
                    {result.findings.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: getCategoryColor(f.category) }} />
                        <span className="text-gray-400">{f.label}</span>
                        <Eye className="w-3 h-3 text-cyber-red ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* After */}
                <div className="glass-panel rounded-xl p-6 border-cyber-green/30">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-cyber-green" />
                    <h3 className="font-display font-bold text-sm text-cyber-green">HIMOYALANGANDAN KEYIN</h3>
                  </div>
                  {protectedResult && (
                    <RiskGauge
                      score={protectedResult.protectedRiskScore}
                      level={protectedResult.protectedRiskLevel}
                      size={160}
                      label="XAVF: PAST"
                      protected_
                    />
                  )}
                  <div className="mt-4 space-y-1">
                    {result.findings.map((f) => {
                      const isProtected = selectedProtections.has(f.id);
                      return (
                        <div key={f.id} className="flex items-center gap-2 text-xs">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: isProtected ? '#333' : getCategoryColor(f.category) }}
                          />
                          <span className={isProtected ? 'text-gray-600 line-through' : 'text-gray-400'}>
                            {isProtected ? 'Himoyalangan' : f.label}
                          </span>
                          {isProtected ? (
                            <EyeOff className="w-3 h-3 text-cyber-green ml-auto" />
                          ) : (
                            <Eye className="w-3 h-3 text-cyber-red ml-auto" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Interactive slider */}
              <div
                ref={sliderRef}
                className="relative h-64 sm:h-80 rounded-xl overflow-hidden border border-cyber-cyan/20 cursor-ew-resize select-none"
                onMouseDown={() => { isDragging.current = true; }}
                onTouchStart={() => { isDragging.current = true; }}
              >
                {/* After side (full) */}
                <div className="absolute inset-0 bg-cyber-navy/80 flex items-center justify-center">
                  <div className="text-center">
                    <ShieldCheck className="w-16 h-16 text-cyber-green mx-auto mb-3 animate-pulse-glow" />
                    <p className="font-display font-bold text-2xl text-cyber-green text-glow-green">
                      {protectedResult?.protectedRiskScore || 8}/100
                    </p>
                    <p className="text-cyber-green text-sm font-mono mt-1">XAVFSIZ</p>
                    <p className="text-xs text-gray-500 mt-2">Sezgir ma'lumotlar yashirilgan</p>
                  </div>
                </div>

                {/* Before side (clipped) */}
                <div
                  className="absolute inset-0 bg-cyber-red/10 flex items-center justify-center"
                  style={{ width: `${sliderPos}%`, overflow: 'hidden' }}
                >
                  <div className="text-center" style={{ width: sliderRef.current?.clientWidth || 400 }}>
                    <Eye className="w-16 h-16 text-cyber-red mx-auto mb-3" />
                    <p className="font-display font-bold text-2xl text-cyber-red text-glow-red">
                      {result.riskScore}/100
                    </p>
                    <p className="text-cyber-red text-sm font-mono mt-1">XAVFLI</p>
                    <p className="text-xs text-gray-500 mt-2">Sezgir ma'lumotlar ko'rinib turibdi</p>
                  </div>
                </div>

                {/* Slider handle */}
                <div
                  className="compare-slider-handle"
                  style={{ left: `${sliderPos}%` }}
                />

                {/* Labels */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-cyber-red/20 border border-cyber-red/40 rounded text-xs font-mono text-cyber-red">
                  OLDIN
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 bg-cyber-green/20 border border-cyber-green/40 rounded text-xs font-mono text-cyber-green">
                  KEYIN
                </div>
              </div>
              <p className="text-xs text-gray-600 text-center mt-2 font-mono">← Slideri surib taqqoslang →</p>
            </div>

            {/* Continue to re-scan */}
            <div className="glass-panel rounded-xl p-8 text-center corner-brackets">
              <ShieldCheck className="w-10 h-10 text-cyber-green mx-auto mb-3" />
              <h2 className="font-display font-bold text-xl text-white mb-2">
                HIMOYA QO'LLANILDI
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Endi himoyalangan faylni qayta tekshirib, xavf manbalarining yo'qolganini tasdiqlash kerak.
              </p>
              <button
                onClick={() => onNavigate('qayta-tekshirish')}
                className="px-8 py-3.5 bg-cyber-green text-cyber-black font-display font-bold text-sm tracking-wider rounded hover:bg-cyber-green/90 transition-all glow-green inline-flex items-center gap-2"
              >
                QAYTA TEKSHIRISH
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
