import type { PasswordCheck } from '@/types';

// Password analysis runs entirely in the browser — the password never leaves this file,
// is never stored, and is never transmitted.

const COMMON_PASSWORDS = new Set([
  '123456', 'password', '123456789', '12345678', '12345', 'qwerty', '1234567',
  '111111', '1234567890', '123123', 'abc123', '1234', 'password1', 'iloveyou',
  '000000', 'qwerty123', '1q2w3e', 'aa12345678', '654321', '555555', 'dragon',
  'salom', 'parol', 'parol123', 'salom123', 'uzbekistan', 'toshkent', 'admin',
  'admin123', 'letmein', 'welcome', 'monkey', 'football', 'summer2024', 'winter',
]);

const KEYBOARD_PATTERNS = [/qwerty/i, /asdf/i, /zxcv/i, /12345/, /012345/, /54321/, /09876/];

function charsetPool(pw: string): { pool: number; label: string } {
  let pool = 0;
  const labels: string[] = [];
  if (/[a-z]/.test(pw)) { pool += 26; labels.push('kichik harflar'); }
  if (/[A-Z]/.test(pw)) { pool += 26; labels.push('katta harflar'); }
  if (/\d/.test(pw)) { pool += 10; labels.push('raqamlar'); }
  if (/[^a-zA-Z0-9]/.test(pw)) { pool += 33; labels.push('maxsus belgilar'); }
  return { pool, label: labels.join(', ') };
}

function detectPatterns(pw: string): string[] {
  const out: string[] = [];
  if (/^\d+$/.test(pw)) out.push('Faqat raqamlardan iborat');
  if (/^(.)\1+$/.test(pw)) out.push('Bitta belgi takrorlangan');
  if (/(.)\1{2,}/.test(pw)) out.push('Ketma-ket takrorlangan belgilar');
  if (KEYBOARD_PATTERNS.some((p) => p.test(pw))) out.push('Klaviatura ketma-ketligi');
  if (/(19|20)\d{2}/.test(pw)) out.push('Yil raqami (tug\'ilgan yili bo\'lishi mumkin)');
  if (/(telefon|9989\d{8})/.test(pw)) out.push('Telefon raqamiga o\'xshash qism');
  if (/^[A-Z][a-z]+\d*$/.test(pw) && pw.length < 12) out.push('Ism + raqam shabloni');
  if (pw.length > 3 && pw.toLowerCase().includes('parol')) out.push('"parol" so\'zini o\'z ichiga olgan');
  if (pw.toLowerCase().includes('salom')) out.push('"salom" so\'zini o\'z ichiga olgan');
  return out;
}

function estimateCrackTime(entropy: number): string {
  // Assume 10 billion guesses per second (fast offline attack on a GPU)
  const guesses = Math.pow(2, entropy);
  const seconds = guesses / 1e10;
  if (seconds < 1) return 'bir necha soniya';
  const units: [number, string][] = [
    [60, 'soniya'], [60, 'daqiqa'], [24, 'soat'], [365, 'kun'], [100, 'yil'],
  ];
  let v = seconds;
  let label = 'soniya';
  for (const [factor, name] of units) {
    if (v < factor) { label = name; break; }
    v /= factor;
    label = name;
  }
  if (v > 1e6) return 'millionlab yillar';
  if (v > 1000) return `${Math.round(v / 1000)} ming yil`;
  return `${Math.max(1, Math.round(v))} ${label}`;
}

export function analyzePassword(pw: string): PasswordCheck {
  const { pool } = charsetPool(pw);
  // Effective entropy with a small penalty for repeat characters
  const uniqueRatio = pw.length > 0 ? new Set(pw).size / pw.length : 0;
  const entropy = pw.length > 0 && pool > 0
    ? pw.length * Math.log2(pool) * (0.7 + 0.3 * uniqueRatio)
    : 0;

  const patterns = detectPatterns(pw);
  const common = COMMON_PASSWORDS.has(pw.toLowerCase());

  let score: 0 | 1 | 2 | 3 | 4 = 0;
  if (pw.length > 0) score = 1;
  if (entropy > 40 && patterns.length <= 1) score = 2;
  if (entropy > 55 && patterns.length === 0) score = 3;
  if (entropy > 75 && patterns.length === 0 && pw.length >= 14) score = 4;
  if (common) score = 0;
  if (patterns.length >= 3) score = Math.min(score, 1) as 0 | 1;

  const verdictMap = ['juda-zaif', 'zaif', 'orta', 'kuchli', 'juda-kuchli'] as const;

  const suggestions: string[] = [];
  if (pw.length < 12) suggestions.push('Uzunlikni kamida 12 belgiga olib chiqing');
  if (!/[A-Z]/.test(pw)) suggestions.push('Katta harflar qo\'shing');
  if (!/\d/.test(pw)) suggestions.push('Raqamlar qo\'shing');
  if (!/[^a-zA-Z0-9]/.test(pw)) suggestions.push('Maxsus belgilar qo\'shing');
  if (patterns.length > 0) suggestions.push('Bashorat qilinadigan shablonlardan voz keching');
  if (suggestions.length === 0) suggestions.push('Ajoyib! Buni eslab qolish oson bo\'lgan parol menejerida saqlang');

  return {
    password: pw,
    length: pw.length,
    entropy: Math.round(entropy),
    poolSize: pool,
    patterns,
    common,
    score,
    verdict: verdictMap[score],
    crackTime: common ? 'Bir necha soniya (sözlük hujumi)' : estimateCrackTime(entropy),
    suggestions,
  };
}

export interface GeneratedPasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

export function generatePassword(opts: GeneratedPasswordOptions): string {
  let pool = '';
  if (opts.lowercase) pool += 'abcdefghijkmnopqrstuvwxyz';
  if (opts.uppercase) pool += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (opts.numbers) pool += '23456789';
  if (opts.symbols) pool += '!@#$%^&*()-_=+[]{};:,.<>?';
  if (pool.length === 0) pool = 'abcdefghijkmnopqrstuvwxyz';

  const values = new Uint32Array(opts.length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => pool[v % pool.length]).join('');
}

export function generatePassphrase(words: string[], count: number, separator: string): string {
  const values = new Uint32Array(count);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => words[v % words.length]).join(separator);
}

export const PASSWORD_VERDICT_LABELS: Record<PasswordCheck['verdict'], string> = {
  'juda-zaif': 'Juda zaif',
  'zaif': 'Zaif',
  'orta': "O'rtacha",
  'kuchli': 'Kuchli',
  'juda-kuchli': 'Juda kuchli',
};
