import type { PiiFinding } from '@/types';
import { detectPii, maskValue } from './pii';

// Data Leakage Shield: scan text (pasted or from a document) for confidential data
// before sharing. Everything runs locally; nothing is transmitted without explicit action.

export type ExposureLevel = 'past' | 'orta' | 'yuqori' | 'kritik';

export interface LeakCategory {
  type: string;
  label: string;
  count: number;
  samples: string[]; // masked samples
  risk: number;
}

export interface LeakageReport {
  totalItems: number;
  categories: LeakCategory[];
  exposure: ExposureLevel;
  riskScore: number;
  recommendations: string[];
  passwords: number;
  apiKeys: number;
}

export function analyzeLeakage(text: string): LeakageReport {
  if (!text.trim()) {
    return {
      totalItems: 0,
      categories: [],
      exposure: 'past',
      riskScore: 0,
      recommendations: ['Matn kiritilmagan — tahlil uchun content yo\'q.'],
      passwords: 0,
      apiKeys: 0,
    };
  }

  const findings = detectPii(text, { includeNames: true, includeAddresses: true, includePasswords: true });
  const byType = new Map<string, PiiFinding[]>();
  for (const f of findings) {
    const arr = byType.get(f.type) ?? [];
    arr.push(f);
    byType.set(f.type, arr);
  }

  const categories: LeakCategory[] = [];
  for (const [type, arr] of byType) {
    categories.push({
      type,
      label: arr[0].label,
      count: arr.length,
      samples: arr.slice(0, 3).map((f) => f.masked),
      risk: Math.max(...arr.map((f) => f.sensitivity)),
    });
  }
  categories.sort((a, b) => b.risk - a.risk);

  const totalItems = findings.length;
  const criticalCount = findings.filter((f) => f.sensitivity >= 90).length;
  const passwords = (byType.get('parol') ?? []).length;
  const apiKeys = (byType.get('api-kalit') ?? []).length;

  // Transparent scoring: weighted sum, normalized
  const categoryWeight = Math.min(60, categories.length * 12);
  const criticalWeight = Math.min(30, criticalCount * 10);
  const volumeWeight = Math.min(10, Math.floor(totalItems / 5));
  const riskScore = Math.min(100, categoryWeight + criticalWeight + volumeWeight + (passwords + apiKeys > 0 ? 10 : 0));

  let exposure: ExposureLevel;
  if (passwords > 0 || apiKeys > 0 || criticalCount >= 3) exposure = 'kritik';
  else if (criticalCount >= 1 || riskScore >= 50) exposure = 'yuqori';
  else if (riskScore >= 25) exposure = 'orta';
  else exposure = 'past';

  const recommendations: string[] = [];
  if (passwords > 0) recommendations.push('Parollar bu matnda ochiq yozilgan. Ular bilan bog\'liq hisoblarda parolni darhol almashtiring va ularni matndan olib tashlang.');
  if (apiKeys > 0) recommendations.push('API kalitlari oshkor bo\'lgan. Kalitlarni bekor qilib, yangilarini yarating.');
  if (byType.has('karta') || byType.has('iban')) recommendations.push('Moliyaviy ma\'lumotlar aniqlandi. Ularni hech qachon matn shaklida yubormang.');
  if (byType.has('jshshir') || byType.has('passport')) recommendations.push('Shaxsni tasdiqlovchi hujjat raqamlari bor. Rasmiy so\'rov bo\'lmasa, yubormang.');
  if (byType.has('telefon') || byType.has('email')) recommendations.push('Aloqa ma\'lumotlarini yashirilgan shaklda yuboring (masalan: 99890****).');
  if (totalItems > 0 && recommendations.length === 0) recommendations.push('Ulashishdan oldin aniqlangan ma\'lumotlarni yashirilgan shaklga o\'tkazing.');
  if (totalItems === 0) recommendations.push('Sezgir ma\'lumot topilmadi. Matnni xavfsiz ulashishingiz mumkin.');

  return {
    totalItems,
    categories,
    exposure,
    riskScore,
    recommendations,
    passwords,
    apiKeys,
  };
}

export function maskText(text: string): string {
  const findings = detectPii(text);
  // Replace longest matches first so overlapping detections do not break each other
  const sorted = findings
    .filter((f) => f.valid)
    .sort((a, b) => b.original.length - a.original.length);
  let out = text;
  for (const f of sorted) {
    const masked = maskValue(f.type, f.original);
    out = out.split(f.original).join(masked);
  }
  return out;
}
