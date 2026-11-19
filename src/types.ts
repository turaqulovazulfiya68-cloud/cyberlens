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
  | 'jshshir'
  | 'manzil'
  | 'passport'
  | 'karta'
  | 'api-kalit';

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
  scan: FileScanResult;
}

export type ScanVerdict = 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'UNKNOWN';
export type ScanConfidence = 'past' | 'orta' | 'yuqori';

export type ReasonSeverity = 'info' | 'past' | 'orta' | 'yuqori' | 'kritik';

export interface ScanReason {
  id: string;
  label: string;
  detail: string;
  weight: number;
  severity: ReasonSeverity;
}

export interface FileScanResult {
  fileName: string;
  claimedExtension: string;
  detectedFormat: string;
  mimeType: string;
  signatureMatch: boolean;
  fileSize: number;
  sha256: string;
  scanDate: string;
  verdict: ScanVerdict;
  confidence: ScanConfidence;
  score: number;
  reasons: ScanReason[];
  recommendations: string[];
  analysisCoverage: 'tolik' | 'cheklangan';
  avStatus: string;
  encrypted: boolean;
}

export interface ScanRecord {
  id: string;
  file_name: string;
  file_type: string;
  file_hash: string | null;
  file_size: number | null;
  risk_score: number;
  risk_level: string;
  protected_risk_score: number;
  protected_risk_level: string;
  findings_count: number;
  protected_findings_count: number;
  privacy_risks: number;
  verdict: string | null;
  confidence: string | null;
  reasons: ScanReason[] | null;
  av_status: string | null;
  status: 'tekshirilgan' | 'himoyalangan' | 'qayta-tekshirilgan';
  created_at: string | null;
  date: string | null;
}

export type AppStage =
  | 'bosh-sahifa'
  | 'yuklash'
  | 'skanerlash'
  | 'natija'
  | 'himoya'
  | 'qayta-tekshirish'
  | 'tarix'
  | 'himoyalangan-fayllar'
  | 'dashboard'
  | 'maxfiylik'
  | 'oqish'
  | 'parol'
  | 'sayt'
  | 'sozlamalar'
  | 'vizion';

export interface ScanStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done';
}

export type PiiType =
  | 'telefon'
  | 'email'
  | 'ism'
  | 'manzil'
  | 'passport'
  | 'jshshir'
  | 'karta'
  | 'iban'
  | 'parol'
  | 'api-kalit';

export interface PiiFinding {
  id: string;
  type: PiiType;
  label: string;
  original: string;
  masked: string;
  context: string;
  sensitivity: number;
  valid: boolean;
  note?: string;
}

export interface MetadataField {
  id: string;
  label: string;
  value: string;
  risk: 'past' | 'orta' | 'yuqori';
  removable: boolean;
}

export interface MetadataReport {
  fields: MetadataField[];
  hasGps: boolean;
  hasIdentity: boolean;
}

export interface PasswordCheck {
  password: string;
  length: number;
  entropy: number;
  poolSize: number;
  patterns: string[];
  common: boolean;
  score: 0 | 1 | 2 | 3 | 4;
  verdict: 'juda-zaif' | 'zaif' | 'orta' | 'kuchli' | 'juda-kuchli';
  crackTime: string;
  suggestions: string[];
}

export interface SiteCheck {
  url: string;
  reachable: boolean;
  https: boolean;
  checks: { id: string; label: string; status: 'ok' | 'ogohlantirish' | 'xato' | 'tekshirilmagan'; detail: string }[];
  headers: Record<string, string>;
  source: 'brauzer' | 'backend';
  error?: string;
}
