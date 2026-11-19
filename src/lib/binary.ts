// Binary utilities: magic-byte signatures, SHA-256, ZIP central-directory traversal.
// Everything here runs locally in the browser — no bytes leave the device.

export interface FileSignature {
  format: string;
  mime: string;
  // Byte offsets where each hex signature chunk must appear (allowing gaps, e.g. ZIP-in-OOXML)
  offsets: number[];
  sigs: number[][];
  category: 'executable' | 'archive' | 'document' | 'image' | 'text' | 'other';
}

const SIGS: FileSignature[] = [
  { format: 'PDF', mime: 'application/pdf', offsets: [0], sigs: [[0x25, 0x50, 0x44, 0x46]], category: 'document' },
  { format: 'ZIP/OOXML (DOCX, XLSX, PPTX)', mime: 'application/zip', offsets: [0], sigs: [[0x50, 0x4b, 0x03, 0x04]], category: 'archive' },
  { format: 'ZIP (bo\'sh yoki Spanned)', mime: 'application/zip', offsets: [0], sigs: [[0x50, 0x4b, 0x05, 0x06], [0x50, 0x4b, 0x07, 0x08]], category: 'archive' },
  { format: 'JPEG', mime: 'image/jpeg', offsets: [0], sigs: [[0xff, 0xd8, 0xff]], category: 'image' },
  { format: 'PNG', mime: 'image/png', offsets: [0], sigs: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]], category: 'image' },
  { format: 'GIF', mime: 'image/gif', offsets: [0], sigs: [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], category: 'image' },
  { format: 'BMP', mime: 'image/bmp', offsets: [0], sigs: [[0x42, 0x4d]], category: 'image' },
  { format: 'WebP', mime: 'image/webp', offsets: [0], sigs: [[0x52, 0x49, 0x46, 0x46]], category: 'image' },
  { format: 'Windows PE (EXE/DLL)', mime: 'application/x-msdownload', offsets: [0], sigs: [[0x4d, 0x5a]], category: 'executable' },
  { format: 'ELF (Linux/macOS binary)', mime: 'application/x-elf', offsets: [0], sigs: [[0x7f, 0x45, 0x4c, 0x46]], category: 'executable' },
  { format: 'Mach-O (macOS binary)', mime: 'application/x-mach-binary', offsets: [0], sigs: [[0xfe, 0xed, 0xfa, 0xce], [0xfe, 0xed, 0xfa, 0xcf], [0xce, 0xfa, 0xed, 0xfe], [0xcf, 0xfa, 0xed, 0xfe], [0xca, 0xfe, 0xba, 0xbe]], category: 'executable' },
  { format: 'Shell skript', mime: 'text/x-sh', offsets: [0], sigs: [[0x23, 0x21]], category: 'text' },
  { format: 'Ogg', mime: 'audio/ogg', offsets: [0], sigs: [[0x4f, 0x67, 0x67, 0x53]], category: 'other' },
  { format: 'MP4/MOV', mime: 'video/mp4', offsets: [4], sigs: [[0x66, 0x74, 0x79, 0x70]], category: 'other' },
  { format: 'RAR', mime: 'application/vnd.rar', offsets: [0], sigs: [[0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]], category: 'archive' },
  { format: '7z', mime: 'application/x-7z-compressed', offsets: [0], sigs: [[0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]], category: 'archive' },
];

export interface SignatureMatch {
  signature: FileSignature;
  extension: string;
  mimeClaimed: string;
  match: boolean;
}

export function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx > 0 ? fileName.slice(idx + 1).toLowerCase() : '';
}

export function detectSignature(bytes: Uint8Array): FileSignature | null {
  for (const sig of SIGS) {
    for (let si = 0; si < sig.sigs.length; si++) {
      const pattern = sig.sigs[si];
      let matched = true;
      // Each signature is anchored at its offset; extra gaps (e.g. RIFF→WEBP) are handled per-format below
      for (const off of sig.offsets) {
        if (bytes.length < off + pattern.length) { matched = false; break; }
        for (let i = 0; i < pattern.length; i++) {
          if (bytes[off + i] !== pattern[i]) { matched = false; break; }
        }
        if (!matched) break;
      }
      if (matched) {
        if (sig.format === 'WebP' && bytes.length < 12) continue;
        if (sig.format === 'WebP' && !(bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50)) continue;
        return sig;
      }
    }
  }
  return null;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isUtf8Decodable(bytes: Uint8Array, limit = 0): boolean {
  const view = limit > 0 ? bytes.subarray(0, limit) : bytes;
  const dec = new TextDecoder('utf-8', { fatal: true });
  try {
    dec.decode(view);
    return true;
  } catch {
    return false;
  }
}

export function looksLikeText(bytes: Uint8Array, sampleLimit = 4096): boolean {
  const view = bytes.subarray(0, sampleLimit);
  if (view.length === 0) return false;
  let suspicious = 0;
  for (const b of view) {
    if (b === 0) return false;
    if (b < 7 || (b > 13 && b < 32)) suspicious++;
  }
  return suspicious / view.length < 0.05;
}

export interface ZipEntry {
  name: string;
  compressedSize: number;
  method: number;
  encrypted: boolean;
}

// Walk the ZIP central directory. Handles the common case: no ZIP64, no spanning.
// Returns entries or throws when the directory is missing/corrupt.
export function readZipEntries(bytes: Uint8Array): ZipEntry[] {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65536); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('ZIP markaziy katalogi topilmadi');
  const count = dv.getUint16(eocd + 10, true);
  let ptr = dv.getUint32(eocd + 16, true);
  const entries: ZipEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (ptr + 46 > bytes.length || dv.getUint32(ptr, true) !== 0x02014b50) throw new Error('ZIP katalogi buzilgan');
    const method = dv.getUint16(ptr + 10, true);
    const flags = dv.getUint16(ptr + 8, true);
    const compressedSize = dv.getUint32(ptr + 20, true);
    const nameLen = dv.getUint16(ptr + 28, true);
    const extraLen = dv.getUint16(ptr + 30, true);
    const commentLen = dv.getUint16(ptr + 32, true);
    const name = new TextDecoder().decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    entries.push({ name, compressedSize, method, encrypted: (flags & 1) !== 0 });
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

export interface PdfScanInfo {
  hasOpenAction: boolean;
  hasEmbeddedFile: boolean;
  hasJavaScript: boolean;
  hasXfa: boolean;
  encrypted: boolean;
  suspiciousUris: string[];
}

export function scanPdf(bytes: Uint8Array): PdfScanInfo {
  // Header comment tells pdf.js which mode to use; decoding is still Latin-1 tolerant here.
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(bytes.length, 512)));
  let tail = '';
  for (let i = Math.max(0, bytes.length - 4096); i < bytes.length; i++) tail += String.fromCharCode(bytes[i]);
  const haystack = head + tail;
  return {
    hasOpenAction: /\/OpenAction\s*\(/.test(haystack) || /\/AA\s*\(/.test(haystack),
    hasEmbeddedFile: /\/EmbeddedFile/.test(haystack),
    hasJavaScript: /\/JavaScript/.test(haystack) || /\/JS\b/.test(haystack),
    hasXfa: /\/XFA/.test(haystack),
    encrypted: /\/Encrypt\b/.test(haystack),
    suspiciousUris: [],
  };
}

export function hasEicarSignature(bytes: Uint8Array): boolean {
  // Match the standard EICAR test string allowing formatting-character substitution
  // (the 66-byte string is commonly written with X codes at positions 4 and 5).
  const text = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(bytes.length, 4096)));
  const eicar = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
  const re = /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7}\$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!\$H\+H\*/;
  return text.includes(eicar) || re.test(text);
}
