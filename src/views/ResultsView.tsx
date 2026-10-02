import { useState, useMemo } from 'react';
import { ShieldAlert, MapPin, Eye, Link2, Lightbulb, ChevronRight, Lock, Filter } from 'lucide-react';
import type { AnalysisResult, Finding, FindingCategory, AppStage } from '@/types';
import { RiskGauge } from '@/components/RiskGauge';
import { RadarChart } from '@/components/RadarChart';
import { RelationshipNetwork } from '@/components/RelationshipNetwork';
import { getCategoryColor, getCategoryLabel } from '@/lib/analysis';

interface ResultsViewProps {
  result: AnalysisResult;
  onNavigate: (stage: AppStage) => void;
}

const CATEGORY_ICONS: Record<FindingCategory, typeof ShieldAlert> = {
  'shaxs': ShieldAlert,
  'aloqa': Eye,
  'tashkilot': Link2,
  'joylashuv': MapPin,
  'raqamli-kirish': Lock,
  'hujjat': FileSearch,
};

// Need to import FileSearch
import { FileSearch } from 'lucide-react';

export function ResultsView({ result, onNavigate }: ResultsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<FindingCategory | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [showRiskExplanation, setShowRiskExplanation] = useState(false);

  const categories: FindingCategory[] = ['shaxs', 'aloqa', 'tashkilot', 'joylashuv', 'raqamli-kirish', 'hujjat'];

  const radarData = useMemo(() => {
    return categories.map((cat) => {
      const findingsInCat = result.findings.filter((f) => f.category === cat);
      const maxSensitivity = findingsInCat.length > 0
        ? Math.max(...findingsInCat.map((f) => f.sensitivity))
        : 0;
      return {
        label: getCategoryLabel(cat),
        value: maxSensitivity,
        color: getCategoryColor(cat),
      };
    });
  }, [result.findings]);

  const filteredFindings = selectedCategory
    ? result.findings.filter((f) => f.category === selectedCategory)
    : result.findings;

  const riskLevelLabel: Record<string, string> = {
    'past': 'PAST XAVF',
    'orta': "O'RTA XAVF",
    'yuqori': 'YUQORI XAVF',
    'kritik': 'KRITIK XAVF',
  };

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-green/10 border border-cyber-green/30 mb-3">
            <ShieldAlert className="w-4 h-4 text-cyber-green" />
            <span className="font-mono text-xs text-cyber-green font-bold">TEKSHIRUV YAKUNLANDI</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-2">
            NIMA TOPILDI?
          </h1>
          <p className="text-gray-400 text-sm">
            {result.fileName} · {result.detectedType}
          </p>
        </div>

        {/* Risk score + gauge */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Risk gauge */}
          <div className="glass-panel-red rounded-xl p-6 flex flex-col items-center justify-center corner-brackets">
            <p className="text-cyber-red font-mono text-xs mb-4">XAVFSIZLIK BAHOSI</p>
            <RiskGauge score={result.riskScore} level={result.riskLevel} size={200} />
            <div className="mt-4 text-center">
              <p className="text-2xl font-display font-bold text-cyber-red text-glow-red">
                {riskLevelLabel[result.riskLevel]}
              </p>
            </div>
          </div>

          {/* Risk breakdown */}
          <div className="glass-panel rounded-xl p-6 lg:col-span-2">
            <h3 className="font-mono text-sm text-cyber-cyan mb-4">XAVF FORMULASI (PROTOTIP)</h3>
            <div className="terminal-text bg-cyber-black/50 rounded p-3 mb-4 border border-cyber-cyan/10">
              <p className="text-cyber-cyan">
                <span className="text-gray-600">{'>'} </span>
                XAVF = SEZGIRLIK × OCHIQLIK × BOG'LIQLIK × TA'SIR
              </p>
              <p className="text-gray-500 mt-1">
                <span className="text-gray-600">{'>'} </span>
                Natija: {result.riskScore}/100 · {riskLevelLabel[result.riskLevel]}
              </p>
              <p className="text-cyber-amber mt-1">
                <span className="text-gray-600">{'>'} </span>
                Eslatma: Bu prototip heuristik baholash. 100% aniqlik da'vo qilinmaydi.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'SEZGIRLIK', value: result.riskBreakdown.sensitivity, color: '#ff2d55' },
                { label: 'OCHIQLIK', value: result.riskBreakdown.openness, color: '#ffaa00' },
                { label: 'BOG\'LIQLIK', value: result.riskBreakdown.linkage, color: '#00f0ff' },
                { label: 'TA\'SIR', value: result.riskBreakdown.impact, color: '#1a7fff' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                      <circle
                        cx="40" cy="40" r="32" fill="none" stroke={item.color} strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 32}
                        strokeDashoffset={2 * Math.PI * 32 - (item.value / 100) * 2 * Math.PI * 32}
                        style={{ filter: `drop-shadow(0 0 4px ${item.color})`, transition: 'stroke-dashoffset 1s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display font-bold text-lg" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  </div>
                  <p className="font-mono text-[10px] text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowRiskExplanation(!showRiskExplanation)}
              className="mt-4 text-xs text-cyber-cyan font-mono flex items-center gap-1 hover:gap-2 transition-all"
            >
              <Lightbulb className="w-3 h-3" />
              {showRiskExplanation ? 'Yopish' : 'Nima sababdan bunday baho?'}
            </button>
            {showRiskExplanation && (
              <div className="mt-3 p-3 bg-cyber-navy/50 rounded text-xs text-gray-400 leading-relaxed animate-fade-in">
                {result.riskScore >= 50 ? (
                  <p>
                    Sizning faylingizda bir nechta sezgir ma'lumotlar aniqlandi. Ular birgalikda
                    siz haqingizda to'liq profilni ochib berishi mumkin. Yuqori sezgirlik va
                    ochiqlik darajasi, shuningdek ma'lumotlar orasidagi bog'liqlik xavf darajasini
                    oshirmoqda.
                  </p>
                ) : (
                  <p>
                    Sizning faylingizda kam miqdorda sezgir ma'lumotlar aniqlandi. Ularning
                    soni va o'zaro bog'liqligi past, shuning uchun xavf darajasi nisbatan past.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Relationship analysis */}
        {result.findings.length > 1 && (
          <div className="glass-panel-red rounded-xl p-6 sm:p-8 mb-8 corner-brackets">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-cyber-red text-glow-red mb-2">
              BIRGALIKDAGI MAXFIYLIK XAVFI
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Ushbu ma'lumotlar birgalikda alohida ma'lumotlarga qaraganda foydalanuvchi haqida
              yanada to'liqroq profilni ochib berishi mumkin.
            </p>

            <div className="grid lg:grid-cols-2 gap-6 items-center">
              <RelationshipNetwork
                findings={result.findings}
                relationships={result.relationships}
                highlightedCategory={selectedCategory}
                onNodeClick={(f) => setSelectedFinding(f)}
              />

              {/* Chain visualization */}
              <div className="space-y-2">
                <p className="text-xs font-mono text-cyber-cyan mb-3">MA'LUMOTLAR ZANJIRI:</p>
                {result.findings.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <div
                      className="px-3 py-2 rounded border font-mono text-xs whitespace-nowrap flex-1"
                      style={{
                        color: getCategoryColor(f.category),
                        borderColor: `${getCategoryColor(f.category)}40`,
                        background: `${getCategoryColor(f.category)}10`,
                      }}
                    >
                      {f.label}
                    </div>
                    {i < result.findings.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-cyber-red flex-shrink-0" />
                    )}
                  </div>
                ))}
                <div className="mt-4 p-3 bg-cyber-red/5 border border-cyber-red/20 rounded">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {result.findings.length > 2
                      ? `${result.findings.length} ta ma'lumot birgalikda shaxsni aniqlash, aloqani topish va to'liq profil qurish uchun ishlatilishi mumkin.`
                      : 'Bu ma\'lumotlar birgalikda shaxs haqida qo\'shimcha ma\'lumot ochib berishi mumkin.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy risk map */}
        <div className="glass-panel rounded-xl p-6 sm:p-8 mb-8">
          <h2 className="font-display font-bold text-lg sm:text-xl text-cyber-cyan mb-2">
            MAXFIYLIK XAVFI XARITASI
          </h2>
          <p className="text-gray-500 text-xs mb-6">
            Kategoriyani bosganda tegishli topilmalar yoritiladi.
          </p>
          <div className="grid lg:grid-cols-2 gap-6 items-center">
            <RadarChart categories={radarData} size={320} />
            <div className="space-y-2">
              {categories.map((cat) => {
                const count = result.findings.filter((f) => f.category === cat).length;
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(isActive ? null : cat)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isActive ? 'bg-cyber-cyan/10' : 'hover:bg-cyber-navy/50'
                    }`}
                    style={{
                      borderColor: isActive ? `${getCategoryColor(cat)}60` : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: getCategoryColor(cat), boxShadow: `0 0 6px ${getCategoryColor(cat)}` }}
                    />
                    <span className="text-sm flex-1 text-left" style={{ color: getCategoryColor(cat) }}>
                      {getCategoryLabel(cat)}
                    </span>
                    <span className="font-mono text-xs text-gray-500">
                      {count} topilma
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Findings list */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg sm:text-xl text-white">
              TOPILGAN MA'LUMOTLAR
            </h2>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
              <Filter className="w-3 h-3" />
              {selectedCategory ? getCategoryLabel(selectedCategory) : 'Barchasi'}
            </div>
          </div>

          {filteredFindings.length === 0 ? (
            <div className="glass-panel rounded-lg p-8 text-center">
              <p className="text-gray-500 text-sm">Bu kategoriyada topilma yo'q.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filteredFindings.map((finding, i) => {
                const color = getCategoryColor(finding.category);
                const Icon = CATEGORY_ICONS[finding.category] || FileSearch;
                return (
                  <div
                    key={finding.id}
                    className="glass-panel rounded-lg p-5 hover:border-cyber-cyan/40 transition-all duration-300 animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.05}s`, borderColor: `${color}20` }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                        >
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{finding.label}</h3>
                          <p className="text-[10px] font-mono text-gray-500">{getCategoryLabel(finding.category)}</p>
                        </div>
                      </div>
                      <div
                        className="px-2 py-0.5 text-[10px] font-mono rounded"
                        style={{ color, border: `1px solid ${color}40`, background: `${color}10` }}
                      >
                        {finding.sensitivity}/100
                      </div>
                    </div>

                    {/* Value */}
                    <div className="mb-3 p-2 bg-cyber-black/40 rounded terminal-text">
                      <p className="text-cyber-cyan text-xs break-all">{finding.value}</p>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-xs">
                      <DetailRow label="QAYERDAN" value={finding.location} />
                      <DetailRow label="NEGA MUHIM" value={finding.riskExplanation} />
                      <DetailRow label="OSHKOR BO'LISHI" value={finding.description} />
                      <DetailRow label="TAVSIYA" value={finding.recommendation} highlight />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA to protection */}
        <div className="glass-panel rounded-xl p-8 text-center corner-brackets">
          <ShieldAlert className="w-12 h-12 text-cyber-red mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl sm:text-2xl text-white mb-2">
            XAVFNI KAMAYTIRISH VAQTI
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-xl mx-auto">
            CyberLens aniqlangan xavflarga qarab avtomatik himoya tavsiyalarini taqdim etadi.
          </p>
          <button
            onClick={() => onNavigate('himoya')}
            className="px-8 py-3.5 bg-cyber-red text-white font-display font-bold text-sm tracking-wider rounded hover:bg-cyber-red/90 transition-all glow-red"
          >
            HIMOYALASHNI BOSHLASH
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="font-mono text-[9px] text-gray-600 mb-0.5">{label}</p>
      <p className={`text-xs leading-relaxed ${highlight ? 'text-cyber-cyan' : 'text-gray-400'}`}>
        {value}
      </p>
    </div>
  );
}
