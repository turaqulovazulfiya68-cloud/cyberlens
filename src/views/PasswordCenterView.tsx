import { useState } from 'react';
import { KeyRound, Copy, RefreshCw, ShieldCheck, AlertTriangle, Fingerprint, Lock } from 'lucide-react';
import type { PasswordCheck } from '@/types';
import { analyzePassword, generatePassword, PASSWORD_VERDICT_LABELS } from '@/lib/password';

const SCORE_COLORS = ['#ff2d55', '#ff6b00', '#ffaa00', '#00d0ff', '#00ff88'];
const SCORE_BAR = ['#ff2d55', '#ff6b00 + #ffaa00', '#ffaa00', '#00d0ff', '#00ff88'];

const WORDS = ['quyosh', 'oy', 'yulduz', 'dengiz', 'tog', 'shabada', 'yomgir', 'bahor', 'kuz', 'qish', 'tare', 'vadi', 'shifo', 'nur', 'zamin', 'osmon'];

export function PasswordCenterView() {
  const [password, setPassword] = useState('');
  const [check, setCheck] = useState<PasswordCheck | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [genLength, setGenLength] = useState(16);
  const [genOpts, setGenOpts] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true });
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);

  const runAnalysis = () => {
    if (!password) return;
    setCheck(analyzePassword(password));
  };

  const doGenerate = () => {
    setGenerated(generatePassword({ length: genLength, ...genOpts }));
    setCopied(false);
  };

  const copyGenerated = async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <KeyRound className="w-7 h-7 text-cyber-cyan" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white">Parol Xavfsizlik Markazi</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Parolni kelayotgan mahallada tahlil qiling va kuchli generatsiya qiling. Parolingiz
            hech qachon qurilmangizdan chiqmaydi.
          </p>
        </div>

        {/* Privacy notice */}
        <div className="glass-panel rounded-lg p-4 mb-6 flex items-start gap-3 border-cyber-green/20">
          <Lock className="w-4 h-4 text-cyber-green flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400">
            Parol faqat shu sahifadagi tahlilda ishlatiladi: saqlanmaydi, loglanmaydi va hech qanday
            serverga yuborilmaydi. Sahifani yopsangiz, parol butunlay yo'qoladi.
          </p>
        </div>

        {/* Analyzer */}
        <div className="glass-panel rounded-xl p-6 mb-6">
          <h2 className="font-mono text-sm text-cyber-cyan mb-4">Parol kuchi tahlili</h2>
          <div className="flex gap-2 flex-col sm:flex-row">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setCheck(null); }}
              onKeyDown={(e) => e.key === 'Enter' && runAnalysis()}
              placeholder="Parolni shu yerga kiriting..."
              className="flex-1 bg-cyber-black/60 border border-cyber-cyan/20 rounded px-4 py-3 text-sm text-white font-mono placeholder-gray-700 focus:outline-none focus:border-cyber-cyan/50"
              autoComplete="off"
            />
            <button
              onClick={() => setShowPw(!showPw)}
              className="px-4 py-3 border border-gray-700 text-gray-500 text-xs font-mono rounded hover:text-cyber-cyan hover:border-cyber-cyan/40"
            >
              {showPw ? 'Yashirish' : 'Ko\'rsatish'}
            </button>
            <button
              onClick={runAnalysis}
              disabled={!password}
              className="px-6 py-3 bg-cyber-cyan text-cyber-black font-display font-bold text-sm rounded hover:bg-cyber-cyan/90 transition-all glow-cyan disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Tahlil
            </button>
          </div>

          {check && (
            <div className="mt-6 space-y-4 animate-fade-in">
              {/* Score bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-gray-500">Kuchi</span>
                  <span className="font-display font-bold text-sm" style={{ color: SCORE_COLORS[check.score] }}>
                    {PASSWORD_VERDICT_LABELS[check.verdict]}
                  </span>
                </div>
                <div className="h-2 bg-cyber-navy rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${((check.score + 1) / 5) * 100}%`,
                      background: SCORE_COLORS[check.score],
                      boxShadow: `0 0 8px ${SCORE_COLORS[check.score]}`,
                    }}
                  />
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Uzunlik', value: `${check.length} belgi` },
                  { label: 'Entropiya', value: `~${check.entropy} bit` },
                  { label: 'Buzish vaqti', value: check.crackTime },
                  { label: 'Ma\'lum parolmi', value: check.common ? 'Ha (so\'zlarda bor)' : 'Yo\'q' },
                ].map((m) => (
                  <div key={m.label} className="bg-cyber-navy/50 rounded p-3 border border-cyber-cyan/10">
                    <p className="font-mono text-[9px] text-gray-600 mb-1">{m.label}</p>
                    <p className="text-xs text-white font-mono">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Patterns */}
              {check.patterns.length > 0 && (
                <div className="p-3 bg-cyber-red/5 border border-cyber-red/20 rounded">
                  <p className="text-xs text-cyber-red font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    Zaif shablonlar aniqlandi:
                  </p>
                  <ul className="space-y-1">
                    {check.patterns.map((p, i) => (
                      <li key={i} className="text-xs text-gray-400">• {p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {check.common && (
                <div className="p-3 bg-cyber-red/10 border border-cyber-red/40 rounded">
                  <p className="text-xs text-cyber-red">
                    Bu parol eng ko'p ishlatiladigan parollar ro'yxatida. Darhol o'zgartiring!
                  </p>
                </div>
              )}

              {/* Suggestions */}
              <div className="p-3 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded">
                <p className="text-xs text-cyber-cyan font-medium mb-2 flex items-center gap-2">
                  <Fingerprint className="w-3 h-3" />
                  Tavsiyalar:
                </p>
                <ul className="space-y-1">
                  {check.suggestions.map((s, i) => (
                    <li key={i} className="text-xs text-gray-400">• {s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Generator */}
        <div className="glass-panel rounded-xl p-6">
          <h2 className="font-mono text-sm text-cyber-cyan mb-4">Kuchli parol generatori</h2>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-gray-500">Uzunlik: {genLength}</span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                value={genLength}
                onChange={(e) => setGenLength(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { key: 'uppercase', label: 'AB Katta' },
                { key: 'lowercase', label: 'ab Kichik' },
                { key: 'numbers', label: '123 Raqam' },
                { key: 'symbols', label: '!@# Belgilar' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setGenOpts((prev) => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                  className={`px-3 py-2 text-xs font-mono rounded border transition-all ${
                    genOpts[opt.key]
                      ? 'border-cyber-cyan/50 bg-cyber-cyan/10 text-cyber-cyan'
                      : 'border-gray-700 text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={doGenerate}
              className="w-full px-6 py-3 bg-cyber-cyan text-cyber-black font-display font-bold text-sm rounded hover:bg-cyber-cyan/90 transition-all glow-cyan flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Parol generatsiya qilish
            </button>

            {generated && (
              <div className="p-4 bg-cyber-black/60 border border-cyber-green/30 rounded terminal-text">
                <p className="text-cyber-green font-mono text-sm break-all mb-3">{generated}</p>
                <button
                  onClick={copyGenerated}
                  className="px-4 py-2 bg-cyber-green/10 border border-cyber-green/40 text-cyber-green text-xs font-mono rounded hover:bg-cyber-green/20 transition-all flex items-center gap-2"
                >
                  {copied ? <ShieldCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Nusxalandi!' : 'Nusxalash'}
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-[10px] text-gray-600 mt-6 text-center font-mono">
          * Parol qurilmangizdan tashqariga chiqmaydi, lekin uning o'tmishdagi oqishlarda ishtirok etganini
          aniq bilish uchun maxfiylikni saqlaydigan tashqi xizmat (masalan, Have I Been Pwned) integratsiyasi kerak.
          Hozir bunday tekshiruv o'tkazilmaydi.
        </p>
      </div>
    </div>
  );
}
