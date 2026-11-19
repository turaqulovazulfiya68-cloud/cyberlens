import type { Finding, FindingType, FindingCategory, AnalysisResult, RelationshipLink, PiiFinding } from '@/types';
import type { FullScanResult } from './scanner';
import { detectPii, maskValue } from './pii';
import { detectFileTypeFromFormat } from './fileType';

// Heuristic sensitive-data patterns (used for findings derived from real extracted text)
const FINDING_META: Record<string, { sensitivity: number; openness: number; impact: number; category: FindingCategory; description: string; riskExplanation: string; recommendation: string; protectionAction: string }> = {
  'telefon': {
    sensitivity: 75, openness: 80, impact: 70, category: 'aloqa',
    description: "Faylingizda telefon raqamingiz ko'rinib turibdi.",
    riskExplanation: "Telefon raqami o'zi kam xavf tug'diradi. Lekin agar u ism va tashkilot ma'lumoti bilan birga bo'lsa, sizni topishni ancha osonlashtiradi.",
    recommendation: "Ulashishdan oldin telefon raqamingizni yashirishni tavsiya qilamiz.",
    protectionAction: "Telefon raqamini yashirish",
  },
  'email': {
    sensitivity: 70, openness: 85, impact: 65, category: 'aloqa',
    description: "Faylingizda elektron pochta manzilingiz ko'rinib turibdi.",
    riskExplanation: "Email manzili sizning shaxsingizni aniqlash uchun ishlatilishi mumkin.",
    recommendation: "Email manzilingizni qisman yashirishni tavsiya qilamiz.",
    protectionAction: "Email manzilini yashirish",
  },
  'jshshir': {
    sensitivity: 98, openness: 90, impact: 95, category: 'shaxs',
    description: "Faylingizda JShShIR (shaxsiy raqamingiz) bor. Bu juda sezgir ma'lumot.",
    riskExplanation: "JShShIR sizni butunlay noyob tarzda aniqlaydi.",
    recommendation: "Bu raqamni fayldan butunlay olib tashlashni qat'iy tavsiya qilamiz.",
    protectionAction: "JShShIR raqamini olib tashlash",
  },
  'iban': {
    sensitivity: 92, openness: 75, impact: 90, category: 'raqamli-kirish',
    description: "Faylingizda bank hisobingiz raqami ko'rinib turibdi.",
    riskExplanation: "Bank raqami moliyaviy ma'lumotlaringizga kirish imkonini berishi mumkin.",
    recommendation: "Bank raqamini fayldan butunlay olib tashlashni qat'iy tavsiya qilamiz.",
    protectionAction: "Bank raqamini olib tashlash",
  },
  'karta': {
    sensitivity: 95, openness: 75, impact: 92, category: 'raqamli-kirish',
    description: "Faylingizda bank karta raqami ko'rinib turibdi.",
    riskExplanation: "Karta raqami bilan begona shaxs to'lov qilishi mumkin.",
    recommendation: "Karta raqamini fayldan butunlay olib tashlashni qat'iy tavsiya qilamiz.",
    protectionAction: "Karta raqamini olib tashlash",
  },
  'parol': {
    sensitivity: 99, openness: 60, impact: 98, category: 'raqamli-kirish',
    description: "Faylingizda parol yoki kalit so'z bor. Bu juda xavfli.",
    riskExplanation: "Agar parol begona qo'liga o'tsa, sizning hisoblaringizga kirib olish mumkin.",
    recommendation: "Parolni fayldan darhol olib tashlashni qat'iy tavsiya qilamiz.",
    protectionAction: "Parolni olib tashlash",
  },
  'api-kalit': {
    sensitivity: 97, openness: 60, impact: 95, category: 'raqamli-kirish',
    description: "Faylingizda API kalit yoki maxfiy token bor.",
    riskExplanation: "API kalit orqali sizning hisobingizdan foydalanib resurs sarflashi mumkin.",
    recommendation: "Kalitni fayldan olib tashlab, yangisini yarating.",
    protectionAction: "API kalitini olib tashlash",
  },
  'passport': {
    sensitivity: 90, openness: 85, impact: 88, category: 'hujjat',
    description: "Faylingizda pasport yoki shaxs hujjati raqami ko'rinib turibdi.",
    riskExplanation: "Pasport raqami shaxsingizni tasdiqlashda ishlatilishi mumkin.",
    recommendation: "Pasport raqamini yashirishni tavsiya qilamiz.",
    protectionAction: "Pasport raqamini yashirish",
  },
  'tugilgan-sana': {
    sensitivity: 65, openness: 70, impact: 60, category: 'shaxs',
    description: "Faylingizda tug'ilgan sanangiz ko'rinib turibdi.",
    riskExplanation: "Tug'ilgan sana o'zi katta xavf emas, lekin ism bilan birgalikda sizni aniqlashda ishlatilishi mumkin.",
    recommendation: "Tug'ilgan sanani yashirishni tavsiya qilamiz.",
    protectionAction: "Tug'ilgan sanani yashirish",
  },
  'manzil': {
    sensitivity: 80, openness: 75, impact: 78, category: 'joylashuv',
    description: "Faylingizda uy manzili ko'rinib turibdi.",
    riskExplanation: "Uy manzili sizning jismoniy joylashuvingizni oshkor qiladi.",
    recommendation: "Manzilni umumlashtirishni tavsiya qilamiz (faqat shahar nomini qoldiring).",
    protectionAction: "Manzilni yashirish",
  },
  'ism': {
    sensitivity: 55, openness: 75, impact: 50, category: 'shaxs',
    description: "Faylingizda to'liq ism ko'rinib turibdi.",
    riskExplanation: "Ism o'zi katta xavf emas. Lekin agar u telefon raqami yoki tashkilot bilan birga bo'lsa, sizni aniqlash ancha oson bo'ladi.",
    recommendation: "Ismni qisqartirishni tavsiya qilamiz. Masalan, faqat bosh harflarni qoldiring.",
    protectionAction: "Ismni qisqartirish",
  },
};

function piiTypeToFindingType(piiType: string): FindingType {
  const map: Record<string, FindingType> = {
    'telefon': 'telefon', 'email': 'email', 'jshshir': 'jshshir', 'iban': 'iban',
    'karta': 'karta', 'parol': 'parol', 'api-kalit': 'api-kalit', 'passport': 'passport',
    'manzil': 'manzil', 'ism': 'ism',
  };
  return map[piiType] ?? 'ism';
}

function buildRelationships(findings: Finding[]): RelationshipLink[] {
  const links: RelationshipLink[] = [];
  const ids = findings.map((f) => f.id);
  for (let i = 0; i < ids.length - 1; i++) {
    links.push({ from: ids[i], to: ids[i + 1], label: 'bog\'liq' });
  }
  if (ids.length > 2) {
    links.push({ from: ids[ids.length - 1], to: ids[0], label: 'profil' });
  }
  return links;
}

function calculateRisk(findings: Finding[], relationships: RelationshipLink[]) {
  if (findings.length === 0) {
    return {
      riskScore: 5,
      riskLevel: 'past' as const,
      riskBreakdown: { sensitivity: 5, openness: 5, linkage: 5, impact: 5 },
    };
  }

  const avgSensitivity = findings.reduce((s, f) => s + f.sensitivity, 0) / findings.length;
  const avgOpenness = findings.reduce((s, f) => s + f.openness, 0) / findings.length;
  const avgImpact = findings.reduce((s, f) => s + f.impact, 0) / findings.length;
  const linkage = Math.min(100, relationships.length * 15 + findings.length * 5);

  const raw = (avgSensitivity / 100) * (avgOpenness / 100) * (linkage / 100) * (avgImpact / 100);
  const riskScore = Math.round(Math.pow(raw, 0.5) * 100);

  let riskLevel: 'past' | 'orta' | 'yuqori' | 'kritik';
  if (riskScore < 25) riskLevel = 'past';
  else if (riskScore < 50) riskLevel = 'orta';
  else if (riskScore < 75) riskLevel = 'yuqori';
  else riskLevel = 'kritik';

  return {
    riskScore,
    riskLevel,
    riskBreakdown: {
      sensitivity: Math.round(avgSensitivity),
      openness: Math.round(avgOpenness),
      linkage: Math.round(linkage),
      impact: Math.round(avgImpact),
    },
  };
}

export async function analyzeFile(file: File, fileId: string, scanResult?: FullScanResult): Promise<AnalysisResult> {
  const full: FullScanResult = scanResult ?? await import('./scanner').then((m) => m.scanFile(file));
  const { scan, text } = full;

  const fileType = detectFileTypeFromFormat(scan.detectedFormat, scan.claimedExtension);

  const findings: Finding[] = [];

  // Real PII findings from extracted text only
  if (text) {
    const piiFindings = detectPii(text);
    const byType = new Map<string, PiiFinding>();
    for (const p of piiFindings) {
      const existing = byType.get(p.type);
      if (!existing || p.sensitivity > existing.sensitivity) byType.set(p.type, p);
    }
    for (const p of byType.values()) {
      const meta = FINDING_META[p.type];
      if (!meta) continue;
      findings.push({
        id: `pii-${p.type}`,
        type: piiTypeToFindingType(p.type),
        category: meta.category,
        label: p.label,
        value: p.masked,
        location: 'Fayl ichidagi matnda',
        sensitivity: meta.sensitivity,
        openness: meta.openness,
        impact: meta.impact,
        description: meta.description,
        riskExplanation: meta.riskExplanation,
        recommendation: meta.recommendation,
        protected: false,
        protectionAction: meta.protectionAction,
      });
    }
  }

  // File-scan reasons surfaced as security findings
  for (const r of scan.reasons) {
    if (r.severity === 'info' || r.severity === 'past') continue;
    findings.push({
      id: `scan-${r.id}`,
      type: 'metadata',
      category: 'raqamli-kirish',
      label: r.label,
      value: r.detail,
      location: 'Fayl strukturaviy tahlili',
      sensitivity: r.severity === 'kritik' ? 100 : r.severity === 'yuqori' ? 80 : 60,
      openness: 50,
      impact: r.severity === 'kritik' ? 100 : r.severity === 'yuqori' ? 80 : 55,
      description: r.detail,
      riskExplanation: r.detail,
      recommendation: scan.recommendations[0] ?? 'Faylni ishonchli manbadan tekshiring.',
      protected: false,
      protectionAction: 'Fayl tarkibini tekshirish',
    });
  }

  const relationships = buildRelationships(findings);
  const risk = calculateRisk(findings, relationships);

  return {
    fileId,
    fileName: file.name,
    fileType,
    detectedType: scan.detectedFormat,
    findings,
    relationships,
    riskScore: risk.riskScore,
    riskLevel: risk.riskLevel,
    riskBreakdown: risk.riskBreakdown,
    protectedFindings: [],
    protectedRiskScore: risk.riskScore,
    protectedRiskLevel: risk.riskLevel,
    scan,
  };
}

export { maskValue };

export function generateDemoFile(): File {
  const content = `ARIZA
F.I.O: Zulfiya Karimova
Tug'ilgan sana: 15.03.1998
JShShIR: 31234567890123
Telefon: +998 90 123 45 67
Email: zulfiya.karimova@gmail.com
Tashkilot: Toshkent Axborot Texnologiyalari Universiteti
Ish joyi: EPAM Systems
Manzil: Toshkent shahar, Yunusobod tumani, Amir Temur ko'chasi 15-uy
Parol: mySecretPass2024`;
  return new File([content], 'ariza_zulfiya.txt', { type: 'text/plain' });
}

export function applyProtection(result: AnalysisResult, protectedIds: string[]): AnalysisResult {
  const updatedFindings = result.findings.map((f) => ({
    ...f,
    protected: protectedIds.includes(f.id),
  }));

  const remainingFindings = updatedFindings.filter((f) => !f.protected);
  const remainingRelationships = buildRelationships(remainingFindings);
  const risk = calculateRisk(remainingFindings, remainingRelationships);

  return {
    ...result,
    findings: updatedFindings,
    protectedFindings: protectedIds,
    protectedRiskScore: risk.riskScore,
    protectedRiskLevel: risk.riskLevel,
  };
}

export function getCategoryColor(category: FindingCategory): string {
  const colors: Record<FindingCategory, string> = {
    'shaxs': '#00f0ff',
    'aloqa': '#1a7fff',
    'tashkilot': '#00ff88',
    'joylashuv': '#ffaa00',
    'raqamli-kirish': '#ff2d55',
    'hujjat': '#a855f7',
  };
  return colors[category];
}

export function getCategoryLabel(category: FindingCategory): string {
  const labels: Record<FindingCategory, string> = {
    'shaxs': 'Siz haqingizda',
    'aloqa': "Aloqa ma'lumotlari",
    'tashkilot': 'Tashkilot',
    'joylashuv': 'Joylashuv',
    'raqamli-kirish': "Raqamli ma'lumotlar",
    'hujjat': 'Hujjat',
  };
  return labels[category];
}
