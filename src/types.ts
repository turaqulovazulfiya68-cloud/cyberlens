export type FindingCategory =
  | 'shaxs'
  | 'aloqa'
  | 'tashkilot'
  | 'joylashuv'
  | 'raqamli-kirish'
  | 'hujjat';

export type FindingType =
  | 'ism'
  | 'telefon'
  | 'email'
  | 'universitet'
  | 'qr-kod'
  | 'metadata'
  | 'joylashuv'
  | 'ish-joyi'
  | 'tugilgan-sana'
  | 'parol'
  | 'iban'
  | 'jshshir';

export interface Finding {
  id: string;
  type: FindingType;
  category: FindingCategory;
  label: string;
  value: string;
  location: string;
  sensitivity: number; // 0-100
  openness: number; // 0-100
  impact: number; // 0-100
  description: string;
  riskExplanation: string;
  recommendation: string;
  protected: boolean;
  protectionAction: string;
}

export interface RelationshipLink {
  from: string;
  to: string;
  label: string;
}

export interface AnalysisResult {
  fileId: string;
  fileName: string;
  fileType: 'rasm' | 'pdf' | 'hujjat' | 'noma-lum';
  detectedType: string;
  findings: Finding[];
  relationships: RelationshipLink[];
  riskScore: number;
  riskLevel: 'past' | 'orta' | 'yuqori' | 'kritik';
  riskBreakdown: {
    sensitivity: number;
    openness: number;
    linkage: number;
    impact: number;
  };
  protectedFindings: string[];
  protectedRiskScore: number;
  protectedRiskLevel: 'past' | 'orta' | 'yuqori' | 'kritik';
}

export interface ScanRecord {
  id: string;
  fileName: string;
  fileType: string;
  date: string;
  riskScore: number;
  riskLevel: string;
  protectedRiskScore: number;
  status: 'tekshirilgan' | 'himoyalangan' | 'qayta-tekshirilgan';
  findingsCount: number;
  protectedFindingsCount: number;
}

export type AppStage = 'bosh-sahifa' | 'yuklash' | 'skanerlash' | 'natija' | 'himoya' | 'qayta-tekshirish' | 'tarix' | 'himoyalangan-fayllar' | 'sozlamalar' | 'vizion';

export interface ScanStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done';
}
