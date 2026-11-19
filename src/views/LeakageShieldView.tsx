import { useState } from 'react';
import { ShieldAlert, ClipboardPaste, FileSearch, Loader2, Download, AlertTriangle } from 'lucide-react';
import type { LeakageReport, ExposureLevel } from '@/lib/leakage';
import { analyzeLeakage, maskText } from '@/lib/leakage';

const EXPOSURE_META: Record<ExposureLevel, { label: string; color: string }> = {
  'past': { label: 'Past', color: '#00ff88' },
  'orta': { label: "O'rtacha", color: '#ffaa00' },
  'yuqori': { label: 'Yuqori', color: '#ff6b00' },
  'kritik': { label: 'Kritik', color: '#ff2d55' },
};

export function LeakageShieldView() {
  const [text, setText] = useState('');
  const [report, setReport] = useState<LeakageReport | null>(null);
  const [busy, setBusy] = useState(false);

  const analyze = () => {
    setBusy(true);
    setTimeout(() => {
      setReport(analyzeLeakage(text));
      setBusy(false);
    }, 300);
  };

  const downloadReport = () => {
    if (!report) return;
    const lines = [
      'CyberLens — Ma\'lumot oqishi hisoboti',
      `Sana: ${new Date().toLocaleString('uz-UZ')}`,
      `Umumiy topilmalar: ${report.totalItems}`,
      `Oshkor bo'lish xavfi: ${EXPOSURE_META[report.exposure].label} (${report.riskScore}/100)`,
      '',
      'Toifalar:',
      ...report.categories.map((c) => `- ${c.label}: ${c.count} ta (namuna: ${c.samples.join(', ')})`),
      '',
      'Tavsiyalar:',
      ...report.recommendations.map((r) => `- ${r}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyberlens_oqish_hisoboti_${Date.now()}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const maskAndCopy = async () => {
    const masked = maskText(text);
    await navigator.clipboard.writeText(masked);
    alert('Yashirilgan matn nusxalandi. Uni xavfsiz ulashishingiz mumkin.');
  };

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-7 h-7 text-cyber-cyan" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white">Ma'lumot Oqishi Qalqoni</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Hujjat yoki matnni yuborishdan oldun tekshiring. Parollar, API kalitlari, shaxsiy va
            moliyaviy ma'lumotlar aniqlanadi. Matn qurilmangizdan chiqmaydi.
          </p>
        </div>

        {/* Input */}
        <div className="glass-panel rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4 text-cyber-cyan" />
              <span className="font-mono text-xs text-cyber-cyan">Tekshirish uchun matn</span>
            </div>
            <button
              onClick={async () => {
                try {
                  const clip = await navigator.clipboard.readText();
                  setText(clip);
                } catch {
                  alert('Nusxalangan matnni o\'qish uchun brauzer ruhsati kerak. Matnni qo\'lda kiriting.');
                }
              }}
              className="text-xs font-mono text-cyber-cyan hover:text-white"
            >
              Nusxadan qo'shish
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Masalan: email, telefon, parol yoki hisobot matnini shu yerga joylashtiring..."
            className="w-full bg-cyber-black/60 border border-cyber-cyan/20 rounded p-4 text-sm text-gray-200 font-mono placeholder-gray-700 focus:outline-none focus:border-cyber-cyan/50 transition-colors resize-y"
          />
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={analyze}
              disabled={busy || !text.trim()}
              className="flex-1 px-6 py-3 bg-cyber-cyan text-cyber-black font-display font-bold text-sm rounded hover:bg-cyber-cyan/90 transition-all glow-cyan disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
              Tekshirish
            </button>
            {text.trim() && (
              <button
                onClick={maskAndCopy}
                className="px-6 py-3 border border-cyber-cyan/40 text-cyber-cyan text-sm font-mono rounded hover:bg-cyber-cyan/10 transition-all"
              >
                Yashirib nusxalash
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-600 mt-3 font-mono">
            * Matn faqat shu brauzerda tahlil qilinadi. Hech qanday tarmoq so'rovi yuborilmaydi.
          </p>
        </div>

        {/* Report */}
        {report && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Summary */}
            <div className="glass-panel rounded-xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <p className="font-mono text-xs text-gray-600 mb-1">Oshkor bo'lish xavfi</p>
                  <p className="font-display font-black text-3xl" style={{ color: EXPOSURE_META[report.exposure].color }}>
                    {EXPOSURE_META[report.exposure].label}
                  </p>
                  <p className="font-mono text-xs text-gray-500 mt-1">{report.riskScore}/100 ball</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-gray-600">Aniqlangan elementlar</p>
                  <p className="font-display font-black text-3xl text-white">{report.totalItems}</p>
                  {report.passwords + report.apiKeys > 0 && (
                    <p className="text-xs text-cyber-red mt-1 flex items-center gap-1 justify-end">
                      <AlertTriangle className="w-3 h-3" />
                      {report.passwords + report.apiKeys} ta parol/kalit ochiq!
                    </p>
                  )}
                </div>
              </div>

              {report.categories.length > 0 ? (
                <div className="space-y-2">
                  {report.categories.map((c) => (
                    <div key={c.type} className="flex items-center justify-between p-3 bg-cyber-navy/40 rounded border border-gray-800">
                      <div>
                        <p className="text-sm text-white">{c.label}</p>
                        <p className="text-[10px] text-gray-600 font-mono">Namuna: {c.samples.join(', ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-lg" style={{ color: EXPOSURE_META[report.exposure].color }}>{c.count}</p>
                        <p className="text-[9px] text-gray-600 font-mono">ta topildi</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-cyber-green">Sezgir ma'lumot topilmadi. Matn xavfsiz ulashish uchun tayyor.</p>
              )}
            </div>

            {/* Recommendations */}
            <div className="glass-panel rounded-xl p-6">
              <h2 className="font-mono text-sm text-cyber-cyan mb-3">Tavsiya etilgan choralar</h2>
              <ul className="space-y-2">
                {report.recommendations.map((r, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-cyber-cyan mt-0.5">▸</span>
                    {r}
                  </li>
                ))}
              </ul>
              {report.categories.length > 0 && (
                <button
                  onClick={downloadReport}
                  className="mt-4 px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan/40 text-cyber-cyan text-xs font-mono rounded hover:bg-cyber-cyan/20 transition-all flex items-center gap-2"
                >
                  <Download className="w-3 h-3" />
                  Hisobotni yuklab olish
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
