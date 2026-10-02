import { Lock, Eye, Download, RotateCw, FileText, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { ScanRecord } from '@/types';

export function ProtectedFilesView() {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProtectedFiles();
  }, []);

  const loadProtectedFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .in('status', ['himoyalangan', 'qayta-tekshirilgan'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading protected files:', error);
    } else if (data) {
      setRecords(data as ScanRecord[]);
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-7 h-7 text-cyber-green" />
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white">HIMOYALANGAN FAYLLAR</h1>
          </div>
          <p className="text-gray-400 text-sm">Oldin himoyalangan fayllar: ko'rish, yuklab olish, qayta tekshirish.</p>
        </div>

        {loading ? (
          <div className="glass-panel rounded-lg p-12 text-center">
            <p className="text-gray-500 font-mono text-sm animate-pulse">Yuklanmoqda...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="glass-panel rounded-lg p-12 text-center">
            <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 text-sm mb-2">Himoyalangan fayllar yo'q</p>
            <p className="text-gray-600 text-xs">Faylni tekshiring va himoyalang.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {records.map((record, i) => (
              <div
                key={record.id}
                className="glass-panel rounded-lg p-5 border-cyber-green/20 hover:border-cyber-green/40 transition-all animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-cyber-green/10 border border-cyber-green/30 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-cyber-green" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-mono truncate">{record.file_name}</p>
                    <p className="text-gray-500 text-xs">{new Date(record.created_at || record.date).toLocaleDateString('uz-UZ')}</p>
                  </div>
                </div>

                {/* Risk badges */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-center p-2 bg-cyber-red/5 border border-cyber-red/15 rounded">
                    <p className="font-mono text-[9px] text-gray-600">OLDIN</p>
                    <p className="text-cyber-red font-bold text-sm">{record.risk_score}</p>
                  </div>
                  <div className="text-center p-2 bg-cyber-green/5 border border-cyber-green/15 rounded">
                    <p className="font-mono text-[9px] text-gray-600">KEYIN</p>
                    <p className="text-cyber-green font-bold text-sm">{record.protected_risk_score}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Himoyalangan:</span>
                    <span className="text-cyber-green font-mono">{record.protected_findings_count}/{record.findings_count}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Holat:</span>
                    <span className="text-cyber-green font-mono">{record.status}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 py-2 text-xs font-mono text-cyber-cyan border border-cyber-cyan/30 rounded hover:bg-cyber-cyan/10 transition-all flex items-center gap-1 justify-center">
                    <Eye className="w-3 h-3" />
                    Ko'rish
                  </button>
                  <button className="flex-1 py-2 text-xs font-mono text-cyber-blue border border-cyber-blue/30 rounded hover:bg-cyber-blue/10 transition-all flex items-center gap-1 justify-center">
                    <Download className="w-3 h-3" />
                    Yuklash
                  </button>
                  <button className="flex-1 py-2 text-xs font-mono text-cyber-amber border border-cyber-amber/30 rounded hover:bg-cyber-amber/10 transition-all flex items-center gap-1 justify-center">
                    <RotateCw className="w-3 h-3" />
                    Tekshir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
