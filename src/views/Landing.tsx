import { Shield, FileSearch, AlertTriangle, Lock, CheckCircle2, Upload, Play, Radar, Eye, Zap } from 'lucide-react';
import type { AppStage } from '@/types';

interface LandingProps {
  onNavigate: (stage: AppStage) => void;
}

export function Landing({ onNavigate }: LandingProps) {
  return (
    <div className="relative min-h-screen pt-20">
      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div className="space-y-6 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyber-cyan/30 bg-cyber-cyan/5">
              <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span className="text-xs font-mono text-cyber-cyan">ULASHISHDAN OLDINGI XAVFSIZLIK NAZORATI</span>
            </div>

            {/* Title */}
            <div>
              <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl tracking-tight">
                <span className="text-white">CYBER</span>
                <span className="text-cyber-cyan text-glow-cyan">LENS</span>
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-gray-400 font-medium leading-relaxed">
                Ulashishdan oldin, nimani oshkor qilishingizni biling.
              </p>
            </div>

            {/* Description */}
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-xl">
              Rasm, hujjat yoki boshqa faylni ulashmoqchimisiz? CyberLens uni avtomatik tekshiradi va siz
              sezmagan maxfiy ma'lumotlarni aniqlaydi.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => onNavigate('yuklash')}
                className="group relative px-8 py-4 bg-cyber-cyan text-cyber-black font-display font-bold text-sm tracking-wider rounded-sm hover:bg-cyber-cyan/90 transition-all glow-cyan diagonal-cut"
              >
                <span className="flex items-center gap-2">
                  <FileSearch className="w-4 h-4" />
                  ULASHISHDAN OLDIN TEKSHIRISH
                </span>
              </button>
              <button
                onClick={() => onNavigate('yuklash')}
                className="px-8 py-4 border border-cyber-cyan/30 text-cyber-cyan font-mono text-sm tracking-wider rounded-sm hover:bg-cyber-cyan/10 transition-all flex items-center gap-2 justify-center"
              >
                <Play className="w-4 h-4" />
                DEMONI ISHGA TUSHIRISH
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              {[
                { label: 'ANIQLA', value: 'Fayl turi' },
                { label: 'TAHLIL', value: 'Sezgir ma\'lumot' },
                { label: 'HIMOYALA', value: 'Avtomatik' },
              ].map((stat) => (
                <div key={stat.label} className="glass-panel rounded p-3">
                  <div className="text-cyber-cyan font-mono text-xs font-bold">{stat.label}</div>
                  <div className="text-gray-400 text-xs mt-1">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative animate-fade-in hidden lg:block" style={{ animationDelay: '0.3s' }}>
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* Core question */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-panel-red rounded-lg p-8 sm:p-12 corner-brackets">
          <div className="text-center space-y-4">
            <p className="text-gray-500 font-mono text-sm">PLATFORMANING ASOSIY SAVOLI</p>
            <div className="space-y-2">
              <p className="text-2xl sm:text-3xl text-gray-600 line-through font-display">
                "Faylda nima bor?"
              </p>
              <p className="text-2xl sm:text-4xl text-cyber-cyan font-display font-bold text-glow-cyan">
                "Men bu faylni ulashsam, yana nimalarni oshkor qilaman?"
              </p>
            </div>
            <p className="text-gray-400 text-sm mt-4">CyberLens aynan shu savolga javob beradi.</p>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-center font-display font-bold text-2xl sm:text-3xl text-white mb-2">
          CYBERLENS ISHLASH JARAYONI
        </h2>
        <p className="text-center text-gray-500 text-sm mb-10">
          YARATDI → ULASHMOQCHI → TEKSHIRADI → ANIQLAYDI → TAHLIL → XAVF → HIMOYALA → QAYTA TEKSHIR → XAVFSIZ ULASHISH
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { icon: FileSearch, label: 'ANIQLA', desc: 'Fayl turini avtomatik aniqlash', color: '#00f0ff' },
            { icon: Eye, label: 'DUSTUN', desc: 'Sezgir ma\'lumotlarni tushunish', color: '#1a7fff' },
            { icon: AlertTriangle, label: 'BAHOLA', desc: 'Xavf darajasini baholash', color: '#ffaa00' },
            { icon: Lock, label: 'HIMOYALA', desc: 'Avtomatik himoya tavsiyalari', color: '#ff2d55' },
            { icon: CheckCircle2, label: 'TEKSHIR', desc: 'Qayta tekshiruv va tasdiqlash', color: '#00ff88' },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="group glass-panel rounded-lg p-5 hover:border-cyber-cyan/40 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-all group-hover:scale-110"
                  style={{ background: `${step.color}15`, border: `1px solid ${step.color}40` }}
                >
                  <Icon className="w-6 h-6" style={{ color: step.color }} />
                </div>
                <h3 className="font-display font-bold text-sm text-white mb-1" style={{ color: step.color }}>
                  {step.label}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Threat chain */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-panel rounded-lg p-6 sm:p-10">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-cyber-red mb-2 text-glow-red">
            XAVF ZANJIRI
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Fayl ulashilganda ma'lumotlar qanday zanjir hosil qilishi va to'liq profil ochib berishi mumkin.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0 justify-center flex-wrap">
            {[
              { label: 'FAYL', color: '#666' },
              { label: 'SHAXSIY MA\'LUMOT', color: '#00f0ff' },
              { label: 'ALOQA MA\'LUMOTI', color: '#1a7fff' },
              { label: 'TASHKILOT', color: '#00ff88' },
              { label: 'TO\'LIQ PROFIL', color: '#ffaa00' },
              { label: 'IJTIMOIY MUHANDISLIK XAVFI', color: '#ff2d55' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="px-4 py-3 rounded border font-mono text-xs font-bold whitespace-nowrap"
                  style={{
                    color: item.color,
                    borderColor: `${item.color}40`,
                    background: `${item.color}10`,
                  }}
                >
                  {item.label}
                </div>
                {i < 5 && (
                  <span className="text-cyber-red text-xl">→</span>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-600 mt-6 font-mono">
            * Bu faqat defensive cybersecurity explanation. Real hujum amalga oshirilmaydi.
          </p>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative glass-panel rounded-lg p-10 sm:p-16 text-center overflow-hidden corner-brackets">
          <div className="absolute inset-0 radial-glow-cyan" />
          <div className="relative">
            <Shield className="w-16 h-16 text-cyber-cyan mx-auto mb-6 animate-pulse-glow" />
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-white mb-4">
              FAYLINGIZNI XAVFSIZ ULASHISHGA TAYYORMISIZ?
            </h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              CyberLens faylingizdagi sezgir ma'lumotlarni avtomatik aniqlaydi, ularning birgalikdagi
              ta'sirini tahlil qiladi va himoyalashni taklif qiladi.
            </p>
            <button
              onClick={() => onNavigate('yuklash')}
              className="px-10 py-4 bg-cyber-cyan text-cyber-black font-display font-bold text-sm tracking-wider rounded-sm hover:bg-cyber-cyan/90 transition-all glow-cyan inline-flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              TEKSHIRISHNI BOSHLASH
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      {/* Rotating outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-cyber-cyan/20 animate-rotate-slow" />
      <div className="absolute inset-4 rounded-full border border-cyber-cyan/10 animate-rotate-slow" style={{ animationDirection: 'reverse' }} />

      {/* Radar sweep */}
      <div className="absolute inset-8 rounded-full overflow-hidden border border-cyber-cyan/30">
        <div
          className="absolute inset-0 origin-center"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0, 240, 255, 0.15) 30deg, transparent 60deg)',
            animation: 'radar-sweep 4s linear infinite',
          }}
        />
        {/* Radar rings */}
        {[0.3, 0.5, 0.7, 0.9].map((r) => (
          <div
            key={r}
            className="absolute rounded-full border border-cyber-cyan/10"
            style={{
              width: `${r * 100}%`,
              height: `${r * 100}%`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
        {/* Cross hairs */}
        <div className="absolute inset-x-0 top-1/2 h-px bg-cyber-cyan/10" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-cyber-cyan/10" />
      </div>

      {/* Center shield */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <Shield className="w-20 h-20 text-cyber-cyan animate-pulse-glow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Radar className="w-10 h-10 text-cyber-cyan/50" />
          </div>
        </div>
      </div>

      {/* Floating icons */}
      <FloatingIcon icon={FileSearch} className="top-8 right-8" delay={0} />
      <FloatingIcon icon={Lock} className="bottom-12 left-4" delay={1} />
      <FloatingIcon icon={Eye} className="top-20 left-8" delay={2} />
      <FloatingIcon icon={Zap} className="bottom-20 right-12" delay={0.5} />
    </div>
  );
}

function FloatingIcon({ icon: Icon, className, delay }: { icon: typeof Shield; className: string; delay: number }) {
  return (
    <div
      className={`absolute glass-panel rounded-lg p-2.5 animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <Icon className="w-5 h-5 text-cyber-cyan" />
    </div>
  );
}
