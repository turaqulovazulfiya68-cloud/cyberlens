import { useState, useRef, useCallback } from 'react';
import {
  ShieldCheck, FileSearch, EyeOff, Download, FileImage, FileText,
  AlertTriangle, Check, Loader2, Info, Database, MapPin,
} from 'lucide-react';
import type { PiiFinding, MetadataReport } from '@/types';
import { detectPii, maskValue } from '@/lib/pii';
import { inspectMetadata, buildSanitizedCopy } from '@/lib/metadata';
import { scanFile } from '@/lib/scanner';

const TYPE_LABELS: Record<string, string> = {
  telefon: 'Telefon raqamlari',
  email: 'Elektron pochtalar',
  ism: "To'liq ismlar",
  manzil: 'Uy manzillari',
  passport: 'Pasport / ID raqamlari',
  jshshir: 'JShShIR / PINFL',
  karta: 'Bank kartalari',
  iban: 'IBAN hisob raqamlari',
  parol: 'Parollar',
  'api-kalit': 'API kalitlari va tokenlar',
};

export function PrivacyGuardianView() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [piiFindings, setPiiFindings] = useState<PiiFinding[]>([]);
  const [metaReport, setMetaReport] = useState<MetadataReport | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [maskedPreview, setMaskedPreview] = useState<string | null>(null);
  const [downloadReady, setDownloadReady] = useState<{ blob: Blob; name: string } | null>(null);
  const [textOnly, setTextOnly] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback(async (f: File) => {
    setBusy(true);
    setError(null);
    setPiiFindings([]);
    setMetaReport(null);
    setMaskedPreview(null);
    setDownloadReady(null);
    setTextOnly(null);
    setSelected(new Set());
    try {
      const { text } = await scanFile(f);
      const bytes = new Uint8Array(await f.arrayBuffer());
      const meta = await inspectMetadata(f, bytes);
      setMetaReport(meta);
      if (text) {
        setTextOnly(text);
        const found = detectPii(text);
        setPiiFindings(found);
        setSelected(new Set(found.map((p) => p.id)));
      } else {
        setError('Bu fayl formatidan matn ajratib bo\'lmadi. Metadata tekshiruvi muvaffaqiyatli o\'tdi. Matnli hujjatlar (.txt, .docx, .pdf) to\'liq qo\'llanadi.');
      }
    } catch {
      setError('Faylni tahlil qilishda xatolik yuz berdi. Boshqa fayl bilan qayta urinib ko\'ring.');
    } finally {
      setBusy(false);
    }
  }, []);

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 50 * 1024 * 1024) {
      setError('Fayl hajmi 50 MB dan katta.');
      return;
    }
    setFile(f);
    analyze(f);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskAll = () => setSelected(new Set(piiFindings.map((p) => p.id)));
  const maskNone = () => setSelected(new Set());

  const generatePreview = () => {
    if (!textOnly) return;
    const chosen = piiFindings.filter((p) => selected.has(p.id) && p.valid);
    let out = textOnly;
    for (const f of [...chosen].sort((a, b) => b.original.length - a.original.length)) {
      out = out.split(f.original).join(f.masked);
    }
    setMaskedPreview(out);
    setDownloadReady(null);
  };

  const downloadSanitized = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { blob, name } = await buildSanitizedCopy(file, bytes);
      setDownloadReady({ blob, name });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      setError('Tozalangan nusxani yaratishda xatolik. Bu format uchun metadata tozalash qo\'llanmaydi.');
    } finally {
      setBusy(false);
    }
  };

  // Group findings by type for category display
  const grouped = piiFindings.reduce<Record<string, PiiFinding[]>>((acc, f) => {
    (acc[f.type] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-7 h-7 text-cyber-cyan" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white">Maxfiylik Qo'riqchisi</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Shaxsiy ma'lumotlaringizni fayllaringizdan topamiz va ulashishdan oldin yashiramiz.
            Faylingiz qurilmangizdan chiqmaydi.
          </p>
        </div>

        {/* Privacy notice */}
        <div className="glass-panel rounded-lg p-4 mb-6 flex items-start gap-3 border-cyber-green/20">
          <Info className="w-4 h-4 text-cyber-green flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-cyber-green font-medium">Maxfiylik kafolati:</span> Fayl to'liq shu brauzerda qayta ishlanadi.
            Hech qanday fayl mazmuni serverga yuborilmaydi va saqlanmaydi. Faqat metadata tahlili natijasi (muallif, sana) ekranda ko'rsatiladi.
          </p>
        </div>

        {/* Upload */}
        {!file ? (
          <div
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            className="glass-panel rounded-xl p-10 text-center cursor-pointer hover:border-cyber-cyan/40 transition-all corner-brackets"
            onClick={() => inputRef.current?.click()}
          >
            <FileSearch className="w-14 h-14 text-cyber-cyan mx-auto mb-4 animate-float" />
            <p className="text-lg text-white font-display font-bold mb-1">Fayl tanlang</p>
            <p className="text-sm text-gray-500">TXT, DOCX, PDF, JPG yoki PNG — barchasi qo'llanadi</p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".txt,.doc,.docx,.pdf,.jpg,.jpeg,.png,.md,.csv"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* File summary */}
            <div className="glass-panel rounded-lg p-4 flex items-center gap-4">
              {file.type.startsWith('image/') ? (
                <FileImage className="w-6 h-6 text-cyber-cyan" />
              ) : (
                <FileText className="w-6 h-6 text-cyber-cyan" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-mono truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => { setFile(null); setPiiFindings([]); setMetaReport(null); setMaskedPreview(null); setDownloadReady(null); }}
                className="text-xs text-gray-500 hover:text-cyber-red font-mono"
              >
                Boshqa fayl
              </button>
            </div>

            {busy && (
              <div className="glass-panel rounded-lg p-6 text-center">
                <Loader2 className="w-6 h-6 text-cyber-cyan animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-400">Tahlil qilinmoqda...</p>
              </div>
            )}

            {error && (
              <div className="glass-panel-red rounded-lg p-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-cyber-amber flex-shrink-0 mt-0.5" />
                <p className="text-xs text-cyber-amber">{error}</p>
              </div>
            )}

            {/* Metadata report */}
            {metaReport && metaReport.fields.length > 0 && (
              <div className="glass-panel rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-4 h-4 text-cyber-cyan" />
                  <h2 className="font-mono text-sm text-cyber-cyan">Metadata tekshiruvi</h2>
                </div>
                {metaReport.hasGps && (
                  <div className="flex items-start gap-2 p-3 bg-cyber-red/5 border border-cyber-red/20 rounded mb-3">
                    <MapPin className="w-4 h-4 text-cyber-red flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-cyber-red">
                      Diqqat: bu fayl ichida joylashuv (GPS) ma'lumoti bor. Ulashishdan oldin tozalang!
                    </p>
                  </div>
                )}
                {metaReport.hasIdentity && !metaReport.hasGps && (
                  <div className="flex items-start gap-2 p-3 bg-cyber-amber/5 border border-cyber-amber/20 rounded mb-3">
                    <AlertTriangle className="w-4 h-4 text-cyber-amber flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-cyber-amber">
                      Diqqat: bu fayl muallif yoki qurilma ma'lumotlarini o'z ichiga oladi.
                    </p>
                  </div>
                )}
                <div className="space-y-1.5">
                  {metaReport.fields.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-2 bg-cyber-navy/40 rounded text-xs">
                      <span className="text-gray-500">{f.label}</span>
                      <span className="text-white font-mono break-all max-w-[60%] text-right">{f.value}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={downloadSanitized}
                  disabled={busy}
                  className="mt-4 px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan/40 text-cyber-cyan text-xs font-mono rounded hover:bg-cyber-cyan/20 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  <Download className="w-3 h-3" />
                  Metadata'siz nusxa yuklab olish
                </button>
              </div>
            )}

            {/* PII results */}
            {piiFindings.length > 0 && (
              <div className="glass-panel rounded-lg p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-cyber-cyan" />
                    <h2 className="font-mono text-sm text-cyber-cyan">
                      Topilgan shaxsiy ma'lumotlar ({piiFindings.length} ta)
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={maskAll} className="text-xs font-mono text-cyber-cyan hover:text-white">
                      Hammasini tanlash
                    </button>
                    <button onClick={maskNone} className="text-xs font-mono text-gray-600 hover:text-gray-400">
                      Tozalash
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {Object.entries(grouped).map(([type, items]) => (
                    <div key={type}>
                      <p className="text-xs text-gray-500 font-mono mb-2">{TYPE_LABELS[type] ?? type} ({items.length})</p>
                      <div className="space-y-2">
                        {items.map((f) => (
                          <div
                            key={f.id}
                            onClick={() => f.valid && toggle(f.id)}
                            className={`flex items-center gap-3 p-3 rounded border transition-all ${
                              selected.has(f.id)
                                ? 'border-cyber-cyan/40 bg-cyber-cyan/5'
                                : 'border-gray-700/50 bg-cyber-navy/30'
                            } ${f.valid ? 'cursor-pointer' : 'opacity-50'}`}
                          >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                              selected.has(f.id) ? 'border-cyber-cyan bg-cyber-cyan/20' : 'border-gray-600'
                            }`}>
                              {selected.has(f.id) && <Check className="w-3 h-3 text-cyber-cyan" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-mono">{f.masked}</p>
                              <p className="text-[10px] text-gray-600 truncate">{f.context}</p>
                              {!f.valid && <p className="text-[10px] text-cyber-amber">{f.note}</p>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-mono text-[9px] text-gray-600">Sezgirligi</p>
                              <p className="text-xs font-bold text-cyber-amber">{f.sensitivity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-5">
                  <button
                    onClick={generatePreview}
                    className="flex-1 px-4 py-3 bg-cyber-cyan/10 border border-cyber-cyan/40 text-cyber-cyan text-sm font-mono rounded hover:bg-cyber-cyan/20 transition-all"
                  >
                    Yashirilgan ko'rinishni ko'rsatish
                  </button>
                  <button
                    onClick={downloadSanitized}
                    disabled={busy}
                    className="flex-1 px-4 py-3 bg-cyber-cyan text-cyber-black text-sm font-display font-bold rounded hover:bg-cyber-cyan/90 transition-all glow-cyan disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Tozalangan nusxani yuklab olish
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-2 font-mono">
                  * Asl fayl hech qachon o'zgartirilmaydi. Tozalangan nusxa alohida fayl sifatida saqlanadi.
                </p>
              </div>
            )}

            {/* Masked preview */}
            {maskedPreview && (
              <div className="glass-panel rounded-lg p-5">
                <h2 className="font-mono text-sm text-cyber-green mb-3">Yashirilgan ko'rinish (ko'chirib olish mumkin):</h2>
                <pre className="bg-cyber-black/60 p-4 rounded text-xs text-cyber-green whitespace-pre-wrap max-h-96 overflow-auto terminal-text">
                  {maskedPreview}
                </pre>
                <button
                  onClick={() => navigator.clipboard.writeText(maskedPreview)}
                  className="mt-3 px-4 py-2 bg-cyber-green/10 border border-cyber-green/40 text-cyber-green text-xs font-mono rounded hover:bg-cyber-green/20 transition-all"
                >
                  Nusxani nusxalash
                </button>
              </div>
            )}

            {textOnly === null && file && !busy && metaReport && metaReport.fields.length === 0 && (
              <div className="glass-panel rounded-lg p-6 text-center">
                <p className="text-sm text-gray-500">Bu faylda metadata yoki matn topilmadi.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
