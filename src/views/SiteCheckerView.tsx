import { useState } from 'react';
import { Globe, Loader2, Search, Lock, AlertTriangle, Info, ShieldCheck, MinusCircle } from 'lucide-react';
import type { SiteCheck } from '@/types';
import { checkWebsite } from '@/lib/sitecheck';

const STATUS_META = {
  ok: { icon: ShieldCheck, color: '#00ff88', label: 'OK' },
  ogohlantirish: { icon: AlertTriangle, color: '#ffaa00', label: 'Ogohlantirish' },
  xato: { icon: AlertTriangle, color: '#ff2d55', label: 'Xato' },
  tekshirilmagan: { icon: MinusCircle, color: '#1a7fff', label: 'Tekshirilmagan' },
} as const;

export function SiteCheckerView() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<SiteCheck | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!url.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await checkWebsite(url.trim());
      setResult(r);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-7 h-7 text-cyber-cyan" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white">Sayt Xavfsizligi Tekshiruvi</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Saytning HTTPS, sertifikat va asosiy xavfsizlik sozlamalarini tekshiring. Faqat ochiq
            (public) saytlar qo'llanadi.
          </p>
        </div>

        {/* Limits notice */}
        <div className="glass-panel rounded-lg p-4 mb-6 flex items-start gap-3 border-cyber-amber/20">
          <Info className="w-4 h-4 text-cyber-amber flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-cyber-amber font-medium">Muhim cheklov:</span> Brauzer xavfsizlik
            siyosati tufayli boshqa domenlarning barcha javob sarlavhalarini o'qib bo'lmaydi. Shu
            sababli ba'zi tekshiruvlar "tekshirilmagan" deb belgilanadi — bu to'liq skaner emas va
            sayt "to'liq xavfsiz" degan xulosani anglatmaydi.
          </p>
        </div>

        {/* Input */}
        <div className="glass-panel rounded-xl p-6 mb-6">
          <div className="flex gap-2 flex-col sm:flex-row">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              placeholder="masalan: example.uz yoki https://example.uz"
              className="flex-1 bg-cyber-black/60 border border-cyber-cyan/20 rounded px-4 py-3 text-sm text-white font-mono placeholder-gray-700 focus:outline-none focus:border-cyber-cyan/50"
            />
            <button
              onClick={run}
              disabled={busy || !url.trim()}
              className="px-6 py-3 bg-cyber-cyan text-cyber-black font-display font-bold text-sm rounded hover:bg-cyber-cyan/90 transition-all glow-cyan disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Tekshirish
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-3 font-mono">
            * Faqat ochiq saytlarni o'zingizga tegishli yoki ruxsat bergan manbalar uchun tekshiring.
            Ichki tarmoq manzillari (localhost, privat IP) bloklangan.
          </p>
        </div>

        {/* Error */}
        {result?.error && (
          <div className="glass-panel-red rounded-lg p-4 flex items-start gap-2 mb-6">
            <AlertTriangle className="w-4 h-4 text-cyber-red flex-shrink-0 mt-0.5" />
            <p className="text-xs text-cyber-red">{result.error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Summary */}
            <div className="glass-panel rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: result.https ? 'rgba(0,255,136,0.1)' : 'rgba(255,45,85,0.1)',
                    border: `1px solid ${result.https ? 'rgba(0,255,136,0.3)' : 'rgba(255,45,85,0.3)'}`,
                  }}
                >
                  <Lock className="w-6 h-6" style={{ color: result.https ? '#00ff88' : '#ff2d55' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-mono text-sm truncate">{result.url}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {result.https ? 'HTTPS orqali tekshirildi' : 'HTTPS topilmadi'} ·{' '}
                    {result.reachable ? 'Sayt javob berdi' : 'Saytga to\'liq bog\'lanib bo\'lmadi'}
                  </p>
                </div>
              </div>
            </div>

            {/* Checks */}
            <div className="glass-panel rounded-xl p-6">
              <h2 className="font-mono text-sm text-cyber-cyan mb-4">Tekshiruv natijalari</h2>
              <div className="space-y-2">
                {result.checks.map((c) => {
                  const meta = STATUS_META[c.status];
                  const Icon = meta.icon;
                  return (
                    <div key={c.id} className="flex items-start gap-3 p-3 bg-cyber-navy/40 rounded border border-gray-800">
                      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: meta.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-white">{c.label}</p>
                          <span
                            className="px-2 py-0.5 text-[9px] font-mono rounded"
                            style={{ color: meta.color, border: `1px solid ${meta.color}40`, background: `${meta.color}10` }}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{c.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
