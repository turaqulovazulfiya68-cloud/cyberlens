import { useEffect, useState, useMemo } from 'react';
import {
  LayoutDashboard, ShieldCheck, AlertTriangle, ShieldAlert, HelpCircle,
  EyeOff, FileSearch, History, KeyRound, Loader2, Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ScanRecord } from '@/types';
import { RiskGauge } from '@/components/RiskGauge';

interface Stats {
  total: number;
  safe: number;
  suspicious: number;
  malicious: number;
  unknown: number;
  legacy: number;
  privacyRisks: number;
  avgRisk: number;
  recent: ScanRecord[];
}

function mapVerdict(record: ScanRecord): 'safe' | 'suspicious' | 'malicious' | 'unknown' | 'legacy' {
  if (record.verdict === 'SAFE') return 'safe';
  if (record.verdict === 'SUSPICIOUS') return 'suspicious';
  if (record.verdict === 'MALICIOUS') return 'malicious';
  if (record.verdict === 'UNKNOWN') return 'unknown';
  // Older records (before the new scanner) keep risk-level based grouping
  if (record.risk_level === 'past') return 'safe';
  if (record.risk_level === 'kritik') return 'malicious';
  if (record.risk_level === 'yuqori' || record.risk_level === 'orta') return 'suspicious';
  return 'legacy';
}

export function DashboardView() {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const stats: Stats = useMemo(() => {
    const s: Stats = {
      total: records.length, safe: 0, suspicious: 0, malicious: 0, unknown: 0,
      legacy: 0, privacyRisks: 0, avgRisk: 0, recent: records.slice(0, 5),
    };
    let riskSum = 0;
    for (const r of records) {
      const v = mapVerdict(r);
      if (v === 'safe') s.safe++;
      else if (v === 'suspicious') s.suspicious++;
      else if (v === 'malicious') s.malicious++;
      else if (v === 'unknown') s.unknown++;
      else s.legacy++;
      s.privacyRisks += r.privacy_risks ?? r.findings_count ?? 0;
      riskSum += r.risk_score ?? 0;
    }
    s.avgRisk = records.length > 0 ? Math.round(riskSum / records.length) : 0;
    return s;
  }, [records]);

  if (loading) {
    return (
      <div className="relative min-h-screen pt-32 pb-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-cyber-cyan animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="relative min-h-screen pt-32 pb-12">
        <div className="max-w-3xl mx-auto px-4 glass-panel-red rounded-lg p-6 text-center">
          <p className="text-cyber-red text-sm">Statistikani yuklashda xatolik yuz berdi.</p>
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'Jami tekshirilgan', value: stats.total, icon: FileSearch, color: '#00f0ff' },
    { label: 'Xavfsiz', value: stats.safe, icon: ShieldCheck, color: '#00ff88' },
    { label: 'Shubhali', value: stats.suspicious, icon: AlertTriangle, color: '#ffaa00' },
    { label: 'Zararli', value: stats.malicious, icon: ShieldAlert, color: '#ff2d55' },
    { label: 'Aniqlanmagan', value: stats.unknown + stats.legacy, icon: HelpCircle, color: '#1a7fff' },
  ];

  // Privacy risk bar data
  const maxPrivacy = Math.max(1, ...records.slice(0, 10).map((r) => r.privacy_risks ?? 0));

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-7 h-7 text-cyber-cyan" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white">Xavfsizlik Paneli</h1>
          </div>
          <p className="text-gray-400 text-sm">Barcha ko'rsatkichlar haqiqiy tekshiruv tarixiga asoslangan.</p>
        </div>

        {records.length === 0 ? (
          <div className="glass-panel rounded-xl p-12 text-center corner-brackets">
            <FileSearch className="w-14 h-14 text-gray-700 mx-auto mb-4" />
            <p className="text-white font-display font-bold text-lg mb-2">Hozircha statistika yo'q</p>
            <p className="text-gray-500 text-sm">Birinchi faylingizni tekshirsangiz, shu yerda ko'rsatkichlar paydo bo'ladi.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {cards.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.label}
                    className="glass-panel rounded-lg p-4 animate-fade-in-up hover:border-cyber-cyan/30 transition-all"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <Icon className="w-5 h-5 mb-2" style={{ color: c.color }} />
                    <p className="font-display font-black text-2xl" style={{ color: c.color }}>{c.value}</p>
                    <p className="text-[10px] text-gray-600 font-mono">{c.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Middle row: gauge + privacy */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="glass-panel rounded-xl p-6 flex flex-col items-center justify-center corner-brackets">
                <p className="text-cyber-cyan font-mono text-xs mb-4">O'rtacha xavf darajasi</p>
                <RiskGauge
                  score={stats.avgRisk}
                  level={stats.avgRisk < 25 ? 'past' : stats.avgRisk < 50 ? 'orta' : stats.avgRisk < 75 ? 'yuqori' : 'kritik'}
                  size={170}
                />
              </div>

              <div className="glass-panel rounded-xl p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <EyeOff className="w-4 h-4 text-cyber-cyan" />
                  <h2 className="font-mono text-sm text-cyber-cyan">Maxfiylik xavflari (oxirgi tekshiruvlar)</h2>
                </div>
                <div className="space-y-2">
                  {records.slice(0, 6).map((r) => {
                    const count = r.privacy_risks ?? 0;
                    return (
                      <div key={r.id} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-mono truncate w-40 flex-shrink-0">{r.file_name}</span>
                        <div className="flex-1 h-4 bg-cyber-navy/60 rounded overflow-hidden">
                          <div
                            className="h-full rounded transition-all duration-700"
                            style={{
                              width: `${(count / maxPrivacy) * 100}%`,
                              background: count === 0 ? '#00ff88' : count < 3 ? '#ffaa00' : '#ff2d55',
                              boxShadow: count > 0 ? '0 0 6px rgba(255,170,0,0.4)' : 'none',
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-gray-400 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-600 mt-3 font-mono">0 = toza · yashil, ozgina = sariq, ko'p = qizil</p>
              </div>
            </div>

            {/* Recent activity */}
            <div className="glass-panel rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-cyber-cyan" />
                <h2 className="font-mono text-sm text-cyber-cyan">Oxirgi faoliyat</h2>
              </div>
              <div className="space-y-2">
                {stats.recent.map((r) => {
                  const v = mapVerdict(r);
                  const colors = { safe: '#00ff88', suspicious: '#ffaa00', malicious: '#ff2d55', unknown: '#1a7fff', legacy: '#666' };
                  const labels = { safe: 'XAVFSIZ', suspicious: 'SHUBHALI', malicious: 'ZARARLI', unknown: 'ANIQLENMAGAN', legacy: 'ESKI BEHO' };
                  return (
                    <div key={r.id} className="flex items-center gap-3 p-3 bg-cyber-navy/40 rounded">
                      <span
                        className="px-2 py-0.5 text-[9px] font-mono rounded flex-shrink-0"
                        style={{ color: colors[v], border: `1px solid ${colors[v]}40`, background: `${colors[v]}10` }}
                      >
                        {labels[v]}
                      </span>
                      <span className="text-xs text-white font-mono truncate flex-1">{r.file_name}</span>
                      <span className="text-[10px] text-gray-600 font-mono flex-shrink-0 hidden sm:block">
                        {new Date(r.created_at ?? r.date ?? Date.now()).toLocaleString('uz-UZ')}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('cyberlens:navigate', { detail: 'tarix' }))}
                className="mt-4 text-xs text-cyber-cyan font-mono hover:text-white transition-colors flex items-center gap-1"
              >
                Barcha tarixni ko'rish
              </button>
            </div>

            {/* Password security status */}
            <div className="glass-panel rounded-xl p-6 flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-cyber-cyan flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white font-medium mb-1">Parol xavfsizligi holati</p>
                <p className="text-xs text-gray-500">
                  Parollaringiz hech qachon CyberLens'da saqlanmaydi, shuning uchun bu yerda ular
                  haqida statistika ko'rsatilmaydi. Parollaringizni tekshirish uchun Parol Xavfsizlik
                  Markaziga o'ting — tahlil to'liq qurilmangizda bajariladi.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
