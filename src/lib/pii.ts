import type { PiiFinding, PiiType } from '@/types';

export interface PiiPattern {
  type: PiiType;
  label: string;
  regex: RegExp;
  sensitivity: number;
  validate?: (m: string) => boolean;
}

// Uzbek-focused personal data patterns. Each has an optional validator to cut false positives.
const PATTERNS: PiiPattern[] = [
  {
    type: 'telefon',
    label: 'Telefon raqami',
    regex: /(\+?998[\s\-]?\(?\d{2}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})|(\+?\d{1,3}[\s\-]?\(?\d{2,3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/g,
    sensitivity: 75,
    validate: (v) => v.replace(/\D/g, '').length >= 9,
  },
  {
    type: 'email',
    label: 'Elektron pochta',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    sensitivity: 70,
  },
  {
    type: 'karta',
    label: 'Bank karta raqami',
    regex: /\b(?:\d[ -]?){13,19}\b/g,
    sensitivity: 95,
    validate: (v) => luhnValid(v.replace(/[\s-]/g, '')) && !/^\d{14}$/.test(v.replace(/\D/g, '')),
  },
  {
    type: 'jshshir',
    label: 'JShShIR / PINFL',
    regex: /\b\d{14}\b/g,
    sensitivity: 98,
  },
  {
    type: 'iban',
    label: 'Bank IBAN raqami',
    regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/g,
    sensitivity: 92,
  },
  {
    type: 'passport',
    label: 'Pasport yoki ID raqami',
    regex: /\b[A-Z]{2}\s?\d{6,8}\b/g,
    sensitivity: 90,
  },
  {
    type: 'parol',
    label: 'Parol',
    regex: /(?:parol|password|pwd|pass|kalit\s*so'?z)\s*[:=]\s*(\S{4,})/gi,
    sensitivity: 99,
  },
  {
    type: 'api-kalit',
    label: 'API kalit yoki token',
    regex: /\b(sk|pk)_(live|test)_[A-Za-z0-9]{16,}\b|\bghp_[A-Za-z0-9]{30,}\b|\bAIza[0-9A-Za-z\-_]{30,}\b|\bAKIA[0-9A-Z]{12,}\b|\bxox[baprs]-[A-Za-z0-9-]{10,}\b|\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\b/g,
    sensitivity: 99,
  },
  {
    type: 'api-kalit',
    label: 'Maxfiy kalit (secret key)',
    regex: /(?:api[_-]?key|secret|token)\s*[:=]\s*['"]?([A-Za-z0-9_\-]{16,})['"]?/gi,
    sensitivity: 96,
  },
];

function luhnValid(digits: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

const STOP_BIGRAMS = new Set([
  'ARIZA', 'Rezyume', 'Tug', 'Tel', 'Email', 'Ish', 'JSh', 'Tashkilot', 'F.I',
  'Fayl', 'Foydalanuvchi', 'Bosh', 'Asosiy', 'Kamida', 'Iltimos', 'Sizning',
]);

export function detectNames(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /\b([A-Z][a-zöüçşğ']{2,})\s+([A-Z][a-zöüçşğ']{3,})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const full = m[0];
    if (seen.has(full)) continue;
    if (STOP_BIGRAMS.has(m[1]) || STOP_BIGRAMS.has(m[2])) continue;
    seen.add(full);
    out.push(full);
    if (out.length >= 20) break;
  }
  return out;
}

export function detectAddresses(text: string): string[] {
  const out: string[] = [];
  const re = /\b(?:shahar|tuman|viloyat|ko'?cha|k\\u00f6cha|mahalla|uy|dom|kv|ofis)\b[^.,;\n]{4,80}/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    out.push(m[0].trim());
    if (out.length >= 10) break;
  }
  return out;
}

function contextAround(text: string, idx: number, len: number): string {
  const start = Math.max(0, idx - 30);
  const end = Math.min(text.length, idx + len + 30);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return prefix + text.slice(start, idx).replace(/\s+/g, ' ') + '[…]' + text.slice(idx + len, end).replace(/\s+/g, ' ') + suffix;
}

export function maskValue(type: PiiType, value: string): string {
  switch (type) {
    case 'email': {
      const at = value.indexOf('@');
      const local = value.slice(0, at);
      const domain = value.slice(at + 1);
      const keep = local.slice(0, 3);
      return `${keep}${'*'.repeat(Math.max(3, local.length - 3))}@${domain}`;
    }
    case 'telefon': {
      const digits = value.replace(/\D/g, '');
      const prefix = digits.slice(0, 5); // e.g. 99890
      return `${prefix}${'*'.repeat(Math.max(2, digits.length - 7))}${digits.slice(-2)}`;
    }
    case 'karta':
    case 'iban': {
      const digits = value.replace(/[^A-Z0-9]/gi, '');
      return `${digits.slice(0, 4)}${'*'.repeat(Math.max(4, digits.length - 8))}${digits.slice(-4)}`;
    }
    case 'jshshir': {
      return `${value.slice(0, 2)}${'*'.repeat(value.length - 2)}`;
    }
    case 'passport': {
      return `${value.slice(0, 2)}${'*'.repeat(Math.max(3, value.length - 2))}`;
    }
    default: {
      const keep = value.slice(0, 4);
      return `${keep}${'*'.repeat(Math.max(4, value.length - 4))}`;
    }
  }
}

export interface DetectOptions {
  includeNames?: boolean;
  includeAddresses?: boolean;
  includePasswords?: boolean;
}

export function detectPii(text: string, opts: DetectOptions = {}): PiiFinding[] {
  const { includeNames = true, includeAddresses = true, includePasswords = true } = opts;
  const findings: PiiFinding[] = [];
  const seen = new Set<string>();

  for (const p of PATTERNS) {
    if (p.type === 'parol' && !includePasswords) continue;
    const re = new RegExp(p.regex.source, p.regex.flags.includes('g') ? p.regex.flags : p.regex.flags + 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const raw = m[0].trim();
      if (raw.length === 0) continue;
      const ok = p.validate ? p.validate(raw) : true;
      const key = `${p.type}:${raw}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({
        id: `pii-${p.type}-${findings.length}`,
        type: p.type,
        label: p.label,
        original: raw,
        masked: maskValue(p.type, raw),
        context: contextAround(text, m.index, raw.length),
        sensitivity: p.sensitivity,
        valid: ok,
        note: ok ? undefined : 'Format tekshiruvidan o\'tmadi (ehtimol notog\'ri aniqlangan)',
      });
      if (findings.length >= 100) break;
    }
  }

  if (includeNames) {
    for (const name of detectNames(text)) {
      findings.push({
        id: `pii-ism-${findings.length}`,
        type: 'ism',
        label: "To'liq ism",
        original: name,
        masked: maskValue('ism', name),
        context: contextAround(text, text.indexOf(name), name.length),
        sensitivity: 55,
        valid: true,
      });
    }
  }

  if (includeAddresses) {
    for (const addr of detectAddresses(text)) {
      findings.push({
        id: `pii-manzil-${findings.length}`,
        type: 'manzil',
        label: 'Uy manzili',
        original: addr,
        masked: `${addr.split(/\s+/)[0]} ${'*'.repeat(12)}`,
        context: contextAround(text, text.indexOf(addr), addr.length),
        sensitivity: 80,
        valid: true,
      });
    }
  }

  return findings;
}
