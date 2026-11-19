import { useEffect, useState, useMemo } from 'react';
import { History, Trash2, Shield, ShieldCheck, FileText, Image, File, Search, Download, ChevronDown, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ScanRecord } from '@/types';

const VERDICT_COLORS: Record<string, string> = {
  SAFE: '#00ff88', SUSPICIOUS: '#ffaa00', MALICIOUS: '#ff2d55', UNKNOWN: '#1a7fff',
};

export function HistoryView() {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState<string>('barchasi');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      setLoadError(true);
    } else if (data) {
      setRecords(data as ScanRecord[]);
    }
    setLoading(false);
  };

  const deleteRecord = async (id: string) => {
    const { error } = await supabase.from('scan_history').delete().eq('id', id);
    if (!error) {
      setRecords(records.filter((r) => r.id !== id));
    }
  };

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchesQuery = !query || r.file_name.toLowerCase().includes(query.toLowerCase());
      const matchesVerdict = verdictFilter === 'barchasi' || r.verdict === verdictFilter;
      return matchesQuery && matchesVerdict;
    });
  }, [records, query, verdictFilter]);

  const exportRecord = (r: ScanRecord) => {
    const lines = [
      'CyberLens — Tekshiruv hisoboti',
      `Fayl: ${r.file_name}`,
      `Sana: ${new Date(r.created_at ?? r.date ?? Date.now()).toLocaleString('uz-UZ')}`,
      r.file_hash ? `SHA-256: ${r.file_hash}` : null,
      `Xulq: ${r.verdict ?? 'eski beho'} (ishonch: ${r.confidence ?? 'noma\'lum'})`,
      `Xavf: ${r.risk_score}/100 (${r.risk_level})`,
      `Maxfiylik topilmalari: ${r.privacy_risks ?? 0}`,
      '',
      'Asoslar:',
      ...(r.reasons ?? []).map((x) => `- ${x.label}: ${x.detail}`),
      '',
      'Eslatma: antivirus dvigateli ishlatilmagan — faqat lokal imzo va struktura tahlili.',
    ].filter(Boolean);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyberlens_${r.file_name}_hisobot.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'rasm') return <Image className="w-5 h-5 text-cyber-cyan" />;
    if (fileType === 'pdf') return <FileText className="w-5 h-5 text-cyber-cyan" />;
    return <File className="w-5 h-5 text-cyber-cyan" />;
  };

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      'past': '#00ff88',
      'orta': '#ffaa00',
      'yuqori': '#ff2d55',
      'kritik': '#ff0044',
    };
    return colors[level] || '#666';
  };

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <History className="w-7 h-7 text-cyber-cyan" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white">Tekshiruv tarixi</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Fayl nomlari, xesh va natijalar saqlanadi. Fayl mazmuni hech qachon saqlanmaydi.
            Bu ma'lumotlar Supabase bulutida saqlanadi va siz uni istalgan vaqtda o'chirishingiz mumkin.
          </p>
        </div>

        {/* Search + filter */}
        <div className="glass-panel rounded-lg p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Fayl nomi bo'yicha qidirish..."
              className="w-full bg-cyber-black/60 border border-cyber-cyan/20 rounded pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-gray-700 focus:outline-none focus:border-cyber-cyan/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <select
              value={verdictFilter}
              onChange={(e) => setVerdictFilter(e.target.value)}
              className="bg-cyber-black/60 border border-cyber-cyan/20 rounded px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyber-cyan/50"
            >
              <option value="barchasi">Barchasi</option>
              <option value="SAFE">Xavfsiz</option>
              <option value="SUSPICIOUS">Shubhali</option>
              <option value="MALICIOUS">Zararli</option>
              <option value="UNKNOWN">Aniqlanmagan</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel rounded-lg p-12 text-center">
            <p className="text-gray-500 font-mono text-sm animate-pulse">Yuklanmoqda...</p>
          </div>
        ) : loadError ? (
          <div className="glass-panel-red rounded-lg p-6 text-center">
            <p className="text-cyber-red text-sm">Tarixni yuklashda xatolik yuz berdi.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-lg p-12 text-center">
            <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-2">
              {records.length === 0 ? 'Hozircha bo\'sh' : 'Qidiruvga mos natija topilmadi'}
            </p>
            <p className="text-gray-600 text-xs">
              {records.length === 0 ? 'Siz hali hech qanday fayl tekshirmadingiz.' : 'Boshqa so\'z bilan qidirib ko\'ring yoki filtrni o\'zgartiring.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((record, i) => {
              const riskColor = getRiskColor(record.risk_level);
              const verdictColor = record.verdict ? VERDICT_COLORS[record.verdict] ?? '#666' : '#666';
              const isOpen = expanded === record.id;
              return (
                <div
                  key={record.id}
                  className="glass-panel rounded-lg p-4 hover:border-cyber-cyan/30 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="w-12 h-12 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center flex-shrink-0">
                      {getFileIcon(record.file_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-mono truncate">{record.file_name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {new Date(record.created_at ?? record.date ?? Date.now()).toLocaleString('uz-UZ')}
                      </p>
                    </div>

                    {record.verdict && (
                      <span
                        className="px-2 py-1 text-[9px] font-mono rounded flex-shrink-0"
                        style={{ color: verdictColor, border: `1px solid ${verdictColor}40`, background: `${verdictColor}10` }}
                      >
                        {record.verdict}
                      </span>
                    )}

                    <div className="text-center flex-shrink-0">
                      <p className="font-mono text-[10px] text-gray-600">Xavf</p>
                      <p className="font-display font-bold text-sm" style={{ color: riskColor }}>
                        {record.risk_score}/100
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {record.status === 'himoyalangan' || record.status === 'qayta-tekshirilgan' ? (
                        <ShieldCheck className="w-4 h-4 text-cyber-green" />
                      ) : (
                        <Shield className="w-4 h-4 text-cyber-amber" />
                      )}
                      <button
                        onClick={() => exportRecord(record)}
                        className="text-gray-600 hover:text-cyber-cyan transition-colors p-1"
                        title="Hisobotni yuklab olish"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRecord(record.id)}
                        className="text-gray-600 hover:text-cyber-red transition-colors p-1"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpanded(isOpen ? null : record.id)}
                        className="text-gray-600 hover:text-cyber-cyan transition-colors p-1"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Detail */}
                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-gray-800 space-y-2 animate-fade-in">
                      {record.file_hash && (
                        <div className="flex items-start gap-2 text-xs">
                          <span className="text-gray-600 font-mono w-28 flex-shrink-0">SHA-256</span>
                          <span className="text-cyber-cyan font-mono break-all">{record.file_hash}</span>
                        </div>
                      )}
                      {record.file_size !== null && (
                        <div className="flex items-start gap-2 text-xs">
                          <span className="text-gray-600 font-mono w-28 flex-shrink-0">Hajm</span>
                          <span className="text-white font-mono">{(record.file_size / 1024).toFixed(1)} KB</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2 text-xs">
                        <span className="text-gray-600 font-mono w-28 flex-shrink-0">Ishonch</span>
                        <span className="text-white font-mono">{record.confidence ?? "aniqlanmagan"}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <span className="text-gray-600 font-mono w-28 flex-shrink-0">Antivirus</span>
                        <span className="text-cyber-amber font-mono">{record.av_status ?? "ma'lumot yo'q"}</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs">
                        <span className="text-gray-600 font-mono w-28 flex-shrink-0">Maxfiylik</span>
                        <span className="text-white font-mono">{record.privacy_risks ?? 0} ta topilma</span>
                      </div>
                      {(record.reasons ?? []).length > 0 && (
                        <div>
                          <p className="text-gray-600 font-mono text-xs mb-1">Tasnif asoslari:</p>
                          {(record.reasons ?? []).map((x, k) => (
                            <div key={k} className="p-2 bg-cyber-navy/40 rounded mb-1">
                              <p className="text-xs text-white">{x.label}</p>
                              <p className="text-[11px] text-gray-500">{x.detail}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
