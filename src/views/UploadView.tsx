import { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileSearch, Play, AlertCircle, FileText, Image, File } from 'lucide-react';
import type { AppStage } from '@/types';
import { detectFileType, getAnalysisModules } from '@/lib/analysis';

interface UploadViewProps {
  onFileSelected: (file: File) => void;
  onDemoMode: () => void;
  onNavigate: (stage: AppStage) => void;
}

export function UploadView({ onFileSelected, onDemoMode }: UploadViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [detectedFile, setDetectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    setDetectedFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const startScan = () => {
    if (detectedFile) {
      onFileSelected(detectedFile);
    }
  };

  const fileType = detectedFile ? detectFileType(detectedFile) : null;
  const modules = fileType ? getAnalysisModules(fileType) : [];

  const fileTypeIcon = detectedFile ? (
    fileType === 'rasm' ? <Image className="w-8 h-8 text-cyber-cyan" /> :
    fileType === 'pdf' ? <FileText className="w-8 h-8 text-cyber-cyan" /> :
    fileType === 'hujjat' ? <FileText className="w-8 h-8 text-cyber-cyan" /> :
    <File className="w-8 h-8 text-cyber-cyan" />
  ) : null;

  return (
    <div className="relative min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white mb-3">
            SIZ NIMANI ULASHMOQCHISIZ?
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
            Bu faylni yuborishdan oldin uning xavfsizligini tekshiring.
            CyberLens avtomatik ravishda fayl turini aniqlaydi va mos tahlilni tanlaydi.
          </p>
        </div>

        {/* Upload zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative glass-panel rounded-xl p-8 sm:p-16 transition-all duration-300 ${
            isDragging ? 'border-cyber-cyan scale-[1.02] glow-cyan' : 'border-cyber-cyan/20'
          } ${!detectedFile ? 'corner-brackets' : ''}`}
        >
          {/* Scan line effect when dragging */}
          {isDragging && (
            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyber-cyan to-transparent"
                style={{ animation: 'scan-down 1.5s ease-in-out infinite' }} />
            </div>
          )}

          {!detectedFile ? (
            <div className="text-center space-y-6">
              {/* Upload icon */}
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full border-2 border-cyber-cyan/30 flex items-center justify-center mx-auto bg-cyber-cyan/5">
                  <UploadCloud className="w-12 h-12 text-cyber-cyan animate-float" />
                </div>
                <div className="absolute inset-0 rounded-full border border-cyber-cyan/20 animate-ping-slow" />
              </div>

              <div>
                <p className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
                  Faylni shu yerga olib keling
                </p>
                <p className="text-gray-500 text-sm">
                  Rasm, PDF, DOCX yoki boshqa qo'llab-quvvatlanadigan fayl
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="px-6 py-3 bg-cyber-cyan/10 border border-cyber-cyan/40 text-cyber-cyan font-mono text-sm rounded hover:bg-cyber-cyan/20 transition-all"
                >
                  FAYLNI TANLASH
                </button>
                <button
                  onClick={onDemoMode}
                  className="px-6 py-3 border border-cyber-amber/40 text-cyber-amber font-mono text-sm rounded hover:bg-cyber-amber/10 transition-all flex items-center gap-2 justify-center"
                >
                  <Play className="w-4 h-4" />
                  DEMONI ISHGA TUSHIRISH
                </button>
              </div>

              <input
                ref={inputRef}
                type="file"
                onChange={handleInputChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.txt,.rtf"
              />

              <p className="text-xs text-gray-600 font-mono pt-4">
                * Faylingiz lokallikda qayta ishlanadi. Hech qayerga yuborilmaydi.
              </p>
            </div>
          ) : (
            /* File detected */
            <div className="space-y-6 animate-fade-in">
              {/* File info */}
              <div className="flex items-center gap-4 p-4 glass-panel rounded-lg border-cyber-cyan/30">
                <div className="w-16 h-16 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center flex-shrink-0">
                  {fileTypeIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-mono text-sm truncate">{detectedFile.name}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {(detectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="px-3 py-1 text-xs font-mono font-bold text-cyber-cyan border border-cyber-cyan/30 rounded bg-cyber-cyan/10">
                    {fileType === 'rasm' ? 'RASM' : fileType === 'pdf' ? 'PDF' : fileType === 'hujjat' ? 'HUJJAT' : 'NOMA\'LUM'}
                  </span>
                </div>
              </div>

              {/* Auto-detection result */}
              <div className="glass-panel rounded-lg p-5 border-cyber-cyan/20">
                <div className="flex items-center gap-2 mb-3">
                  <FileSearch className="w-4 h-4 text-cyber-cyan" />
                  <span className="text-cyber-cyan font-mono text-xs font-bold">AVTOMATIK FAYL ANIQLASH</span>
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  CyberLens fayl turini avtomatik aniqladi va mos tahlilni tanladi.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 font-mono mb-1">FAYL TURI</p>
                    <p className="text-white text-sm font-medium">
                      {fileType === 'rasm' ? 'RASM' : fileType === 'pdf' ? 'PDF HUJJAT' : fileType === 'hujjat' ? 'MATN HUJJATI' : 'NOMA\'LUM FORMAT'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-mono mb-1">TAHLIL MODULLARI</p>
                    <div className="flex flex-wrap gap-1.5">
                      {modules.map((mod) => (
                        <span
                          key={mod}
                          className="px-2 py-0.5 text-[10px] font-mono text-cyber-cyan border border-cyber-cyan/20 rounded bg-cyber-cyan/5"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={startScan}
                  className="px-8 py-3.5 bg-cyber-cyan text-cyber-black font-display font-bold text-sm tracking-wider rounded hover:bg-cyber-cyan/90 transition-all glow-cyan"
                >
                  TEKSHIRISHNI BOSHLASH
                </button>
                <button
                  onClick={() => setDetectedFile(null)}
                  className="px-8 py-3.5 border border-gray-700 text-gray-400 font-mono text-sm rounded hover:bg-gray-800 transition-all"
                >
                  BEKOR QILISH
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-cyber-red text-sm glass-panel-red rounded p-3">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Info cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            { title: 'RASM', mods: 'OCR + QR + METADATA + MAXFIYLIK', icon: Image },
            { title: 'PDF', mods: 'MATN + METADATA + SEZGIR MA\'LUMOT', icon: FileText },
            { title: 'HUJJAT', mods: 'MATN + SEZGIR MA\'LUMOT + METADATA', icon: File },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="glass-panel rounded-lg p-4">
                <Icon className="w-5 h-5 text-cyber-cyan mb-2" />
                <p className="text-white font-mono text-xs font-bold mb-1">{card.title}</p>
                <p className="text-gray-500 text-[10px] font-mono">{card.mods}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
