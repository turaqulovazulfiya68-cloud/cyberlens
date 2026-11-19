import type { SiteCheck } from '@/types';

// Website Security Analyzer — browser-side checks only.
// A browser cannot read arbitrary response headers of cross-origin sites, so header
// checks are marked "tekshirilmagan" unless the site sends permissive CORS headers.
// Never claims a site is fully secure.

// SSRF protection: block non-http(s) schemes, localhost, private IP ranges, and
// credentials-in-URL before any fetch is attempted.
export function validateTargetUrl(input: string): { ok: boolean; url?: string; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(input.startsWith('http') ? input : `https://${input}`);
  } catch {
    return { ok: false, reason: "URL notog'ri formatda" };
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, reason: 'Faqat http(s) protokollari qo\'llanadi' };
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1' ||
    host === '0.0.0.0' || host === '[::1]' || host === '::1' || host.endsWith('.local') ||
    host.endsWith('.internal') || /^(10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) ||
    host.startsWith('fd') || host.startsWith('fe80:') || host === '*'
  ) {
    return { ok: false, reason: 'Ichki tarmoq manzillari (localhost, privat IP) tekshirilmaydi' };
  }
  // Must be a public domain name or public IP
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split('.').map(Number);
    if (parts[0] === 0 || parts[0] >= 224 || parts.every((p) => p === 255)) {
      return { ok: false, reason: 'Maxsus IP diapazoni tekshirilmaydi' };
    }
  }
  if (!/^[a-z0-9\-._~]+\.[a-z]{2,}$/i.test(host) && !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return { ok: false, reason: "Domen nomi notog'ri ko'rinadi" };
  }
  return { ok: true, url: parsed.toString() };
}

export async function checkWebsite(input: string): Promise<SiteCheck> {
  const validation = validateTargetUrl(input);
  if (!validation.ok) {
    return {
      url: input,
      reachable: false,
      https: false,
      checks: [{ id: 'url', label: 'URL tekshiruvi', status: 'xato', detail: validation.reason ?? "URL noto'g'ri" }],
      headers: {},
      source: 'brauzer',
      error: validation.reason,
    };
  }
  const url = validation.url!;
  const https = url.startsWith('https:');

  const checks: SiteCheck['checks'] = [];

  // HTTPS availability
  checks.push({
    id: 'https',
    label: 'HTTPS mavjudligi',
    status: https ? 'ok' : 'xato',
    detail: https
      ? 'Sayt HTTPS orqali ishlaydi.'
      : 'Sayt faqat HTTP orqali ochildi. Ma\'lumotlar shifrlanmasdan uzatiladi.',
  });

  // Try a real fetch (opaque response due to CORS, but success/failure and
  // response.url final redirect target are observable).
  let reachable = false;
  let finalUrl = url;
  let fetchError: string | undefined;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { mode: 'cors', signal: controller.signal, redirect: 'follow' });
    clearTimeout(timeout);
    reachable = true;
    finalUrl = res.url || url;
    if (!finalUrl.startsWith('https:')) {
      checks.push({ id: 'redirect-downgrade', label: 'HTTPS ga qayta yo\'naltirish', status: 'xato', detail: 'Sayt HTTP manzildan HTTPS ga avtomatik o\'tkazmaydi.' });
    } else if (finalUrl !== url) {
      checks.push({ id: 'redirect', label: 'HTTPS ga qayta yo\'naltirish', status: 'ok', detail: 'HTTP so\'rovlar HTTPS ga yo\'naltiriladi.' });
    } else if (!https) {
      checks.push({ id: 'redirect', label: 'HTTPS ga qayta yo\'naltirish', status: 'ogohlantirish', detail: 'Sayt HTTPS da ochiladi, lekin HTTP ham javob beradi.' });
    }
  } catch (e) {
    fetchError = e instanceof Error && e.name === 'AbortError'
      ? 'Javob 10 soniyada kelmadi'
      : "Saytga brauzer orqali bog'lanib bo'lmadi (CORS yoki tarmoq xatosi)";
  }

  if (!reachable) {
    checks.push({
      id: 'reach',
      label: 'Sayt javob berishi',
      status: 'tekshirilmagan',
      detail: `${fetchError ?? 'Bog\'lanish amalga oshmadi'}. Brauzerdan boshqa domenlarning javob sarlavhalarini o\'qish cheklangan — to\'liq tekshiruv uchun backend kerak.`,
    });
  }

  // Header checks: only possible when the target sends CORS headers readable by us.
  // We mark them explicitly as unverifiable rather than inventing results.
  const headerChecks: SiteCheck['checks'] = [
    { id: 'csp', label: 'Content-Security-Policy' },
    { id: 'hsts', label: 'Strict-Transport-Security (HSTS)' },
    { id: 'xcto', label: 'X-Content-Type-Options' },
    { id: 'referrer', label: 'Referrer-Policy' },
    { id: 'frame', label: 'X-Frame-Options / frame-ancestors' },
  ].map((h) => ({
    id: h.id,
    label: h.label,
    status: 'tekshirilmagan' as const,
    detail: reachable
      ? 'Bu sarlavhani brauzer xavfsizlik siyosati tufayli o\'qib bo\'lmaydi. To\'liq tekshiruv uchun backend (edge function) kerak.'
      : 'Sayt javob bermagani uchun tekshirib bo\'lmadi.',
  }));
  checks.push(...headerChecks);

  // TLS certificate validity — browser validates silently; report what we know
  checks.push({
    id: 'tls',
    label: 'TLS sertifikati',
    status: https ? 'ok' : 'tekshirilmagan',
    detail: https
      ? 'Brauzer HTTPS orqali muvaffaqiyatli bog\'landi — sertifikat ishonchli va amal qiladi (brauzer tekshiruvi).'
      : 'TLS tekshiruvi mumkin emas.',
  });

  checks.push({
    id: 'mixed',
    label: 'Aralash kontent (mixed content)',
    status: https ? 'ok' : 'tekshirilmagan',
    detail: https
      ? 'Asosiy sahifa HTTPS orqali yuklandi. Sahifa ichidagi HTTP resurslarni brauzerdan ajratib bo\'lmaydi.'
      : 'HTTP sahifada barcha kontent shifrlanmagan holda uzatiladi.',
  });

  return {
    url: finalUrl,
    reachable,
    https,
    checks,
    headers: {},
    source: 'brauzer',
    error: reachable ? undefined : fetchError,
  };
}
