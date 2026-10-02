import { useEffect, useState } from 'react';
import { History, Trash2, Shield, ShieldCheck, FileText, Image, File } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ScanRecord } from '@/types';

export function HistoryView() {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading history:', error);
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
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <History className="w-7 h-7 text-cyber-cyan" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white">SKANERLASH TARIXI</h1>
          </div>
          <p className="text-gray-400 text-sm">Barcha tekshirilgan fayllar va ularning natijalari.</p>
        </div>

        {loading ? (
          <div className="glass-panel rounded-lg p-12 text-center">
            <p className="text-gray-500 font-mono text-sm animate-pulse">Yuklanmoqda...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="glass-panel rounded-lg p-12 text-center">
            <History className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-2">Tarix bo'sh</p>
            <p className="text-gray-600 text-xs">Hali hech qanday fayl tekshirilmagan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record, i) => {
              const riskColor = getRiskColor(record.risk_level);
              const protectedRiskColor = getRiskColor(record.protected_risk_level);
              return (
                <div
                  key={record.id}
                  className="glass-panel rounded-lg p-4 hover:border-cyber-cyan/30 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* File icon */}
                    <div className="w-12 h-12 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center flex-shrink-0">
                      {getFileIcon(record.file_type)}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-mono truncate">{record.file_name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {new Date(record.created_at || record.date).toLocaleString('uz-UZ')}
                      </p>
                    </div>

                    {/* Findings */}
                    <div className="text-center">
                      <p className="font-mono text-[10px] text-gray-600">TOPILMALAR</p>
                      <p className="text-white text-sm font-bold">{record.findings_count}</p>
                    </div>

                    {/* Risk score */}
                    <div className="text-center">
                      <p className="font-mono text-[10px] text-gray-600">XAVF</p>
                      <p className="font-display font-bold text-sm" style={{ color: riskColor }}>
                        {record.risk_score}/100
                      </p>
                    </div>

                    {/* Protected risk */}
                    {record.protected_findings_count > 0 && (
                      <div className="text-center">
                        <p className="font-mono text-[10px] text-gray-600">HIMOYALANGAN</p>
                        <p className="font-display font-bold text-sm" style={{ color: protectedRiskColor }}>
                          {record.protected_risk_score}/100
                        </p>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {record.status === 'himoyalangan' || record.status === 'qayta-tekshirilgan' ? (
                        <ShieldCheck className="w-5 h-5 text-cyber-green" />
                      ) : (
                        <Shield className="w-5 h-5 text-cyber-amber" />
                      )}
                      <span className={`text-xs font-mono ${
                        record.status === 'qayta-tekshirilgan' ? 'text-cyber-green' :
                        record.status === 'himoyalangan' ? 'text-cyber-cyan' : 'text-cyber-amber'
                      }`}>
                        {record.status}
                      </span>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="text-gray-600 hover:text-cyber-red transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
