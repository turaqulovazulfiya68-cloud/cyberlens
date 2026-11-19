import type { FileScanResult, ScanReason, ScanVerdict, ScanConfidence, ReasonSeverity } from '@/types';
import { detectSignature, getExtension, sha256Hex, looksLikeText, readZipEntries, scanPdf, hasEicarSignature } from './binary';

const MAX_SIZE = 50 * 1024 * 1024;

interface ScoredReasons { reasons: ScanReason[]; score: number }

function addReason(reasons: ScanReason[], id: string, label: string, detail: string, weight: number, severity: ReasonSeverity) {
  reasons.push({ id, label, detail, weight, severity });
}

function finalize(reasons: ScanReason[]): ScoredReasons {
  const score = Math.min(100, reasons.reduce((s, r) => s + r.weight, 0));
  return { reasons, score };
}

function pickVerdict(score: number, reasons: ScanReason[], analyzed: boolean): ScanVerdict {
  if (!analyzed) return 'UNKNOWN';
  if (reasons.some((r) => r.severity === 'kritik')) return 'MALICIOUS';
  if (reasons.some((r) => r.severity === 'yuqori')) return 'SUSPICIOUS';
  if (score >= 25) return 'SUSPICIOUS';
  return 'SAFE';
}

function pickConfidence(reasons: ScanReason[], coverage: 'tolik' | 'cheklangan', analyzed: boolean): ScanConfidence {
  if (!analyzed) return 'past';
  if (coverage === 'cheklangan') return reasons.length > 0 ? 'orta' : 'past';
  const hardSignals = reasons.some((r) => r.severity === 'kritik' || r.severity === 'yuqori');
  if (hardSignals) return 'yuqori';
  return reasons.length > 0 ? 'orta' : 'yuqori';
}

export interface FullScanResult {
  scan: FileScanResult;
  // Extracted text for downstream PII analysis (only for text-decodable formats).
  text: string | null;
  bytes: Uint8Array;
}

export async function scanFile(file: File): Promise<FullScanResult> {
  const reasons: ScanReason[] = [];
  const recommendations: string[] = [];
  let canAnalyze = true;
  let analysisCoverage: 'tolik' | 'cheklangan' = 'cheklangan';
  let text: string | null = null;
  let encrypted = false;

  const claimedExtension = getExtension(file.name);

  // ---- Layer 0: basic validation (size, name) ----
  if (file.size === 0) {
    addReason(reasons, 'empty-file', 'Bo\'sh fayl', 'Fayl hajmi 0 bayt — tahlil uchun mazmun yo\'q.', 20, 'orta');
  }
  if (file.size > MAX_SIZE) {
    addReason(reasons, 'too-large', 'Hajm chegarasi', 'Fayl 50 MB dan katta; to\'liq tahlil cheklangan.', 0, 'info');
    canAnalyze = false;
  }
  // Path traversal / malicious name check
  if (/[\\/\0]|\.\./.test(file.name)) {
    addReason(reasons, 'bad-name', 'Xavfli fayl nomi', 'Fayl nomida yo\'l ko\'chirish belgilari bor.', 30, 'yuqori');
    recommendations.push('Bunday nomli fayllarni ochishdan oldin nomini tozalang.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sha256 = await sha256Hex(bytes);

  // ---- Layer 1: signature (magic bytes) vs claimed extension ----
  const sig = detectSignature(bytes);
  const mimeType = file.type || 'aniqlanmagan';
  let signatureMatch = false;
  let detectedFormat = sig ? sig.format : null;

  if (!detectedFormat) {
    if (looksLikeText(bytes)) {
      detectedFormat = 'Matn (UTF-8/ASCII)';
      signatureMatch = ['txt', 'md', 'csv', 'json', 'xml', 'log', ''].includes(claimedExtension);
      if (!signatureMatch && claimedExtension) {
        addReason(reasons, 'ext-mismatch', 'Kengaytma mos emas', `Fayl matn ko'rinishida, lekin kengaytma .${claimedExtension} — mazmun va nom mos kelmaydi.`, 35, 'yuqori');
        recommendations.push('Fayl kengaytmasi va tarkibi mos emas. Bunday fayllarni ochishdan oldin ishonchli manbadan ekanligiga ishonch hosil qiling.');
      }
    } else if (bytes.length > 0) {
      detectedFormat = 'Noma\'lum ikkilik format';
      addReason(reasons, 'unknown-binary', 'Noma\'lum format', 'Fayl imzosi tanilmadi — format aniqlanmadi.', 10, 'past');
    }
  } else {
    const extMatches = EXT_SIG_MATCH[sig!.format]?.includes(claimedExtension) ?? false;
    signatureMatch = extMatches;
    if (!extMatches && claimedExtension) {
      addReason(reasons, 'ext-mismatch', 'Kengaytma va imzo mos emas', `Fayl ichida ${sig!.format} aniqlandi, lekin kengaytma .${claimedExtension}. Bu aldash (spoofing) belgisi bo'lishi mumkin.`, 40, 'yuqori');
      recommendations.push('Fayl turi yashirilgan. Haqiqiy formatni aniqlash uchun faylni ishonchli vosita bilan oching.');
    }
    // MIME mismatch is informational
    if (file.type && !file.type.includes(sig!.mime.split('/')[0]) && sig!.mime !== 'application/zip') {
      addReason(reasons, 'mime-mismatch', 'MIME mos emas', `Brauzer ${mimeType} deb hisobladi, lekin imzo ${sig!.format} ko'rsatyapti.`, 5, 'past');
    }
  }

  // ---- Layer 2: known test signature (EICAR) ----
  if (hasEicarSignature(bytes)) {
    addReason(reasons, 'eicar', 'EICAR test imzosi', 'Fayl ichida EICAR antivirus test imzosi topildi. Bu haqiqiy zararli dastur emas, lekin antivirus dasturlari uni test sifatida aniqlaydi.', 100, 'kritik');
    recommendations.push('Bu antivirusni test qilish uchun ishlatiladigan standart imzo. Haqiqiy xavf yo\'q, lekin antivirus uni "zararli" deb ko\'rsatadi.');
  }

  // ---- Layer 3: format-specific structural checks ----
  if (sig?.format.startsWith('ZIP')) {
    try {
      const entries = readZipEntries(bytes);
      encrypted = entries.some((e) => e.encrypted);
      if (encrypted) {
        addReason(reasons, 'zip-encrypted', 'Parol bilan himoyalangan arxiv', 'Arxiv ichidagi fayllar parol bilan shifrlangan — tarkibni tahlil qilish cheklangan.', 15, 'orta');
        recommendations.push('Shifrlangan arxivning tarkibi tekshirilmadi. Ishonchli manbadan kelganiga ishonchingiz komil bo\'lsa, oching.');
      }
      const dangerous = entries.filter((e) => /\.(exe|dll|scr|bat|cmd|ps1|vbs|js|jar|hta|msi)$/i.test(e.name));
      if (dangerous.length > 0) {
        addReason(reasons, 'zip-executables', 'Arxivda bajariladigan fayllar', `Arxiv ichida ${dangerous.length} ta bajariladigan fayl bor: ${dangerous.slice(0, 3).map((d) => d.name).join(', ')}.`, 45, 'yuqori');
        recommendations.push('Arxivni ochishdan oldin ichidagi bajariladigan fayllarni antivirus bilan tekshiring.');
      }
      const macro = entries.filter((e) => /vbaProject\.bin|word\/vbaData\.xml|xl\/vbaProject\.bin/i.test(e.name));
      if (macro.length > 0) {
        addReason(reasons, 'office-macro', 'Office makrosi bor hujjat', 'DOCX/XLSX hujjat ichida VBA makrosi aniqlandi. Makroslar avtomatik kod ishga tushirishi mumkin.', 50, 'yuqori');
        recommendations.push('Makrolarni faqat ishonchli manbadan kelgan hujjatlar uchun yoqing.');
      }
      // Embedded scripts in OOXML
      const scripts = entries.filter((e) => /externalScript|oleObject/i.test(e.name));
      if (scripts.length > 0) {
        addReason(reasons, 'office-ole', 'Tashqi obyekt havolalari', 'Hujjat ichida OLE obyektlari yoki tashqi skript havolasi bor.', 30, 'orta');
      }
      analysisCoverage = 'tolik';
    } catch {
      addReason(reasons, 'zip-corrupt', 'Arxiv buzilgan', 'ZIP katalogi o\'qilmadi — fayl shikastlangan yoki to\'liq emas.', 25, 'orta');
    }
  }

  if (sig?.format === 'PDF') {
    const info = scanPdf(bytes);
    encrypted = info.encrypted;
    if (info.encrypted) {
      addReason(reasons, 'pdf-encrypted', 'Parol bilan himoyalangan PDF', 'PDF shifrlangan — tarkib to\'liq tekshirilmadi.', 15, 'orta');
    }
    if (info.hasJavaScript || info.hasOpenAction || info.hasXfa) {
      const parts: string[] = [];
      if (info.hasOpenAction) parts.push('/OpenAction (ochilganda avtomatik ishga tushadi)');
      if (info.hasJavaScript) parts.push('/JavaScript');
      if (info.hasXfa) parts.push('/XFA');
      addReason(reasons, 'pdf-active', 'PDF da faol elementlar', `PDF ichida avtomatik kod ishga tushirishi mumkin bo'lgan elementlar bor: ${parts.join(', ')}.`, 45, 'yuqori');
      recommendations.push('PDF ochildi deb ishonch bo\'lmaydi. Faol elementlarni o\'chirib ko\'rish uchun xavfsiz ko\'ruvchidan foydalaning.');
    }
    if (info.hasEmbeddedFile) {
      addReason(reasons, 'pdf-embedded', 'Ichma-ich fayl', 'PDF ichida boshqa fayl yashiringan (EmbeddedFile). Bu faylni yashirish uchun ishlatilishi mumkin.', 30, 'orta');
    }
    analysisCoverage = 'tolik';
  }

  // Executables: label what we know
  if (sig?.category === 'executable') {
    addReason(reasons, 'executable', 'Bajariladigan fayl', 'Bu bajariladigan dastur fayli. Faqat format tahlil qilindi — hech qanday antivirus tekshiruvi o\'tkazilmadi.', 25, 'orta');
    recommendations.push('Bajariladigan fayllarni ishga tushirishdan oldin VirusTotal kabi real antivirus xizmatida tekshiring.');
    analysisCoverage = 'cheklangan';
  }

  // ---- Text extraction for PII scanning ----
  if (looksLikeText(bytes)) {
    text = new TextDecoder().decode(bytes);
  } else if (sig?.format.startsWith('ZIP')) {
    // DOCX/XLSX: pull shared strings + document.xml text via DecompressionStream if available
    text = await extractZipText(bytes);
  }
  // PDF text extraction: parse literal strings from uncompressed streams
  if (sig?.format === 'PDF' && !encrypted) {
    const pdfText = extractPdfText(bytes);
    if (pdfText) text = text ? `${text}\n${pdfText}` : pdfText;
  }

  // ---- Verdict assembly ----
  if (!canAnalyze || (detectedFormat === null && bytes.length === 0)) {
    canAnalyze = false;
  }
  const { score } = finalize(reasons, canAnalyze);
  const verdict = pickVerdict(score, reasons, canAnalyze && detectedFormat !== null);
  const confidence = pickConfidence(reasons, analysisCoverage, canAnalyze);

  if (verdict === 'SAFE') {
    recommendations.push('Mavjud tekshiruvlarda shubhali belgi topilmadi. Baribir, yuklab olish manbasi ishonchli ekanligiga ishonch hosil qiling.');
  }
  if (verdict === 'UNKNOWN') {
    recommendations.push('Fayl to\'liq tahlil qilinmadi. Uni antivirus dasturi yoki VirusTotal kabi xizmat bilan tekshiring.');
  }

  const avStatus = 'Antivirus dvigateli mavjud emas — faqat lokal imzo va struktura tahlili o\'tkazildi';

  const scan: FileScanResult = {
    fileName: file.name,
    claimedExtension,
    detectedFormat: detectedFormat ?? 'Aniqlanmagan',
    mimeType,
    signatureMatch,
    fileSize: file.size,
    sha256,
    scanDate: new Date().toISOString(),
    verdict,
    confidence,
    score,
    reasons,
    recommendations,
    analysisCoverage,
    avStatus,
    encrypted,
  };
  return { scan, text, bytes };
}

const EXT_SIG_MATCH: Record<string, string[]> = {
  'PDF': ['pdf'],
  'ZIP/OOXML (DOCX, XLSX, PPTX)': ['zip', 'docx', 'xlsx', 'pptx', 'ods', 'odt', 'apk', 'jar', 'epub'],
  'ZIP (bo\'sh yoki Spanned)': ['zip'],
  'JPEG': ['jpg', 'jpeg'],
  'PNG': ['png'],
  'GIF': ['gif'],
  'BMP': ['bmp', 'dib'],
  'WebP': ['webp'],
  'Windows PE (EXE/DLL)': ['exe', 'dll', 'scr', 'sys', 'ocx', 'cpl'],
  'ELF (Linux/macOS binary)': ['so', 'bin', 'elf', 'axf'],
  'Mach-O (macOS binary)': ['dylib', 'o'],
  'Shell skript': ['sh', 'bash', 'zsh'],
  'Ogg': ['ogg', 'ogv'],
  'MP4/MOV': ['mp4', 'mov', 'm4a'],
  'RAR': ['rar'],
  '7z': ['7z'],
};

// Extract readable text from OOXML zip: word/document.xml, shared strings, etc.
async function extractZipText(bytes: Uint8Array): Promise<string | null> {
  if (typeof DecompressionStream === 'undefined') return null;
  const parts: string[] = [];
  try {
    const entries = readZipEntries(bytes);
    for (const entry of entries) {
      if (!/(word\/document\.xml|sharedStrings\.xml|content\.xml|slide[0-9]+\.xml|document\.json)$/i.test(entry.name)) continue;
      const text = await inflateEntry(bytes, entry.name);
      if (text) parts.push(text);
    }
  } catch {
    return null;
  }
  return parts.length > 0 ? parts.join('\n') : null;
}

async function inflateEntry(bytes: Uint8Array, targetName: string): Promise<string | null> {
  try {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65536); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return null;
    const count = dv.getUint16(eocd + 10, true);
    let ptr = dv.getUint32(eocd + 16, true);
    for (let i = 0; i < count; i++) {
      const method = dv.getUint16(ptr + 10, true);
      const compressedSize = dv.getUint32(ptr + 20, true);
      const nameLen = dv.getUint16(ptr + 28, true);
      const extraLen = dv.getUint16(ptr + 30, true);
      const commentLen = dv.getUint16(ptr + 32, true);
      const name = new TextDecoder().decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
      if (name === targetName) {
        // Local header: 30 bytes + name + extra
        const localPtr = dv.getUint32(ptr + 42, true);
        const lNameLen = dv.getUint16(localPtr + 26, true);
        const lExtraLen = dv.getUint16(localPtr + 28, true);
        const dataStart = localPtr + 30 + lNameLen + lExtraLen;
        const data = bytes.subarray(dataStart, dataStart + compressedSize);
        if (method === 0) return new TextDecoder().decode(data);
        if (method === 8) {
          const ds = new DecompressionStream('deflate-raw');
          const stream = new Blob([data as unknown as BlobPart]).stream().pipeThrough(ds);
          const buf = await new Response(stream).arrayBuffer();
          return new TextDecoder().decode(buf);
        }
        return null;
      }
      ptr += 46 + nameLen + extraLen + commentLen;
    }
  } catch {
    return null;
  }
  return null;
}

// Minimal PDF text extractor: finds text between parentheses in uncompressed streams.
function extractPdfText(bytes: Uint8Array): string | null {
  let s = '';
  const limit = Math.min(bytes.length, 2 * 1024 * 1024);
  for (let i = 0; i < limit; i++) s += String.fromCharCode(bytes[i]);
  const out: string[] = [];
  const re = /\((?:\\.|[^\\()])*\)\s*Tj/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const inner = m[0].slice(1, -4);
    const cleaned = inner.replace(/\\([()\\])/g, '$1').replace(/\\[rn]/g, ' ');
    if (/[A-Za-z0-9]{2,}/.test(cleaned)) out.push(cleaned);
    if (out.length > 500) break;
  }
  // Also TJ arrays: [(a) -2 (b)] TJ
  const tjRe = /\[(?:\((?:\\.|[^\\()])*\)|[^\]])*\]\s*TJ/g;
  while ((m = tjRe.exec(s)) !== null) {
    const chunks = m[0].match(/\((?:\\.|[^\\()])*\)/g) || [];
    const line = chunks.map((c) => c.slice(1, -1).replace(/\\([()\\])/g, '$1')).join('');
    if (/[A-Za-z0-9]{2,}/.test(line)) out.push(line);
    if (out.length > 1000) break;
  }
  return out.length > 0 ? out.join('\n') : null;
}
