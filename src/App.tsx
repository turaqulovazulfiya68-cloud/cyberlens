import { useState, useCallback } from 'react';
import type { AppStage, AnalysisResult } from '@/types';
import { CyberBackground } from '@/components/CyberBackground';
import { Navbar } from '@/components/Navbar';
import { StageIndicator } from '@/components/StageIndicator';
import { Landing } from '@/views/Landing';
import { UploadView } from '@/views/UploadView';
import { ScanningView } from '@/views/ScanningView';
import { ResultsView } from '@/views/ResultsView';
import { ProtectionView } from '@/views/ProtectionView';
import { RescanView } from '@/views/RescanView';
import { HistoryView } from '@/views/HistoryView';
import { ProtectedFilesView } from '@/views/ProtectedFilesView';
import { SettingsView } from '@/views/SettingsView';
import { VisionView } from '@/views/VisionView';
import { analyzeFile, detectFileType, generateDemoFile } from '@/lib/analysis';
import { supabase } from '@/lib/supabase';

const WORKFLOW_STAGES: AppStage[] = ['yuklash', 'skanerlash', 'natija', 'himoya', 'qayta-tekshirish'];

function App() {
  const [stage, setStage] = useState<AppStage>('bosh-sahifa');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [scanning, setScanning] = useState(false);

  const navigate = useCallback((newStage: AppStage) => {
    setStage(newStage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleFileSelected = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setStage('skanerlash');
    setScanning(true);

    const fileId = crypto.randomUUID();
    try {
      const analysisResult = await analyzeFile(selectedFile, fileId);
      setResult(analysisResult);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setScanning(false);
    }
  }, []);

  const handleDemoMode = useCallback(() => {
    const demoFile = generateDemoFile();
    handleFileSelected(demoFile);
  }, [handleFileSelected]);

  const handleScanComplete = useCallback(() => {
    if (result) {
      setStage('natija');
    }
  }, [result]);

  const handleResultUpdate = useCallback((updated: AnalysisResult) => {
    setResult(updated);
  }, []);

  const saveToHistory = useCallback(async (r: AnalysisResult, status: string) => {
    const fileType = detectFileType(file || new File([], r.fileName));
    const { error } = await supabase.from('scan_history').insert({
      file_name: r.fileName,
      file_type: fileType,
      risk_score: r.riskScore,
      risk_level: r.riskLevel,
      protected_risk_score: r.protectedRiskScore,
      protected_risk_level: r.protectedRiskLevel,
      findings_count: r.findings.length,
      protected_findings_count: r.findings.filter((f) => f.protected).length,
      status,
    });
    if (error) console.error('Failed to save scan history:', error);
  }, [file]);

  const handleRescanComplete = useCallback(() => {
    if (result) {
      saveToHistory(result, 'qayta-tekshirilgan');
    }
  }, [result, saveToHistory]);

  const handleProtectionApplied = useCallback((updated: AnalysisResult) => {
    setResult(updated);
    saveToHistory(updated, 'himoyalangan');
  }, [saveToHistory]);

  const showStageIndicator = WORKFLOW_STAGES.includes(stage);

  return (
    <div className="relative min-h-screen text-gray-200">
      <CyberBackground />
      <Navbar stage={stage} onNavigate={navigate} />

      <div className="relative z-10">
        {showStageIndicator && (
          <div className="pt-20">
            <StageIndicator currentStage={stage} />
          </div>
        )}

        {stage === 'bosh-sahifa' && <Landing onNavigate={navigate} />}
        {stage === 'yuklash' && (
          <UploadView onFileSelected={handleFileSelected} onDemoMode={handleDemoMode} onNavigate={navigate} />
        )}
        {stage === 'skanerlash' && file && (
          <ScanningView
            fileName={file.name}
            fileType={result ? result.detectedType : 'ANIQLANMOQDA...'}
            onComplete={handleScanComplete}
          />
        )}
        {stage === 'natija' && result && (
          <ResultsView result={result} onNavigate={navigate} />
        )}
        {stage === 'himoya' && result && (
          <ProtectionView
            result={result}
            onResultUpdate={handleProtectionApplied}
            onNavigate={navigate}
          />
        )}
        {stage === 'qayta-tekshirish' && result && (
          <RescanView
            result={result}
            onNavigate={navigate}
            onScanComplete={handleRescanComplete}
          />
        )}
        {stage === 'tarix' && <HistoryView />}
        {stage === 'himoyalangan-fayllar' && <ProtectedFilesView />}
        {stage === 'sozlamalar' && <SettingsView />}
        {stage === 'vizion' && <VisionView />}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyber-cyan/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-600 font-mono">
            CyberLens · Faylni ulashishdan oldin xavfsizlikni tekshiring
          </p>
          <p className="text-xs text-gray-700 font-mono">
            Prototip v1.0 · Taxminiy baholash · 100% aniqlik kafolatlanmaydi
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
