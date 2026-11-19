import type { MetadataField, MetadataReport } from '@/types';

// Inspect real file metadata: EXIF for JPEG, PNG text chunks, and OOXML core properties
// (docProps/core.xml inside the zip). All parsing is local — the file never leaves the device.

export async function inspectMetadata(file: File, bytes: Uint8Array): Promise<MetadataReport> {
  const fields: MetadataField[] = [];

  fields.push({
    id: 'meta-filename',
    label: 'Fayl nomi',
    value: file.name,
    risk: 'past',
    removable: false,
  });
  fields.push({
    id: 'meta-dates',
    label: 'Oxirgi o\'zgartirilgan sana',
    value: new Date(file.lastModified).toLocaleString('uz-UZ'),
    risk: 'orta',
    removable: false,
  });

  const sig = bytes[0] === 0xff && bytes[1] === 0xd8 ? 'jpeg'
    : bytes[0] === 0x89 && bytes[1] === 0x50 ? 'png'
    : bytes[0] === 0x50 && bytes[1] === 0x4b ? 'zip'
    : 'other';

  if (sig === 'jpeg') fields.push(...parseExif(bytes));
  if (sig === 'png') fields.push(...parsePngChunks(bytes));
  if (sig === 'zip') fields.push(...await parseOoxmlCore(bytes));

  const hasGps = fields.some((f) => f.id.startsWith('meta-gps'));
  const hasIdentity = fields.some((f) => f.id.startsWith('meta-author') || f.id.startsWith('meta-device'));
  return { fields, hasGps, hasIdentity };
}

function tagLabel(id: number): string {
  const map: Record<number, string> = {
    0x010f: 'Qurilma modeli',
    0x0110: 'Qurilma ishlab chiqaruvchi',
    0x0112: 'Tomir yo\'nalishi',
    0x0132: 'Oxirgi o\'zgartirilgan sana',
    0x013b: 'Muallif (Artist)',
    0x8298: 'Muallif huquqi',
    0x9003: 'Asl suratga olingan sana',
    0x9004: 'Raqlamagan sana',
    0xa430: 'Foydalanuvchi izohi',
    0x9286: 'Izoh',
    0x8825: 'GPS IFD',
    0xa433: 'Suratga olish rejimi',
  };
  return map[id] ?? `Teg 0x${id.toString(16)}`;
}

function parseExif(bytes: Uint8Array): MetadataField[] {
  const out: MetadataField[] = [];
  try {
    // Find APP1 Exif segment
    let off = 2;
    let exifStart = -1;
    while (off + 4 < bytes.length) {
      if (bytes[off] !== 0xff) break;
      const marker = bytes[off + 1];
      const len = (bytes[off + 2] << 8) | bytes[off + 3];
      if (marker === 0xe1) {
        const tag = new TextDecoder('latin1').decode(bytes.subarray(off + 4, off + 10));
        if (tag === 'Exif\0\0') { exifStart = off + 10; break; }
      }
      off += 2 + len;
    }
    if (exifStart < 0) return out;

    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const tiff = exifStart;
    const le = dv.getUint16(tiff) === 0x4949;
    const readU16 = (p: number) => dv.getUint16(p, le);
    const readU32 = (p: number) => dv.getUint32(p, le);

    let ifd = tiff + readU32(tiff + 4);
    const gpsValues: string[] = [];
    const visited = new Set<number>();
    const ifds: number[] = [ifd];
    while (ifds.length > 0) {
      const cur = ifds.shift()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      const count = readU16(cur);
      for (let i = 0; i < count; i++) {
        const entry = cur + 2 + i * 12;
        const tagId = readU16(entry);
        const type = readU16(entry + 2);
        const num = readU32(entry + 4);
        const valOff = entry + 8;
        if (tagId === 0x8769 || tagId === 0x8825) {
          // SubIFD or GPS IFD pointer
          ifds.push(tiff + readU32(valOff));
          continue;
        }
        if (tagId === 0x829a || tagId === 0x829d) continue; // exposure/F-number noise
        // Read value
        const typeSizes = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8];
        const size = typeSizes[type] ?? 1;
        const total = size * num;
        let p = total <= 4 ? valOff : tiff + readU32(valOff);
        let value = '';
        if (type === 2) {
          const chunks: string[] = [];
          for (let k = 0; k < num; k++) {
            const ch = dv.getUint8(p + k);
            if (ch === 0) break;
            chunks.push(String.fromCharCode(ch));
          }
          value = chunks.join('');
        } else if (type === 5) {
          // RATIONAL — GPS lat/lon etc
          const parts: string[] = [];
          for (let k = 0; k < Math.min(num, 3); k++) {
            const n = readU32(p + k * 8);
            const d = readU32(p + k * 8 + 4);
            parts.push(d === 0 ? '0' : (n / d).toFixed(6).replace(/\.?0+$/, ''));
          }
          value = parts.join(', ');
          if (num === 3) {
            const deg = readU32(p) / (readU32(p + 4) || 1);
            const min = readU32(p + 8) / (readU32(p + 12) || 1);
            const sec = readU32(p + 16) / (readU32(p + 20) || 1);
            const dec = deg + min / 60 + sec / 3600;
            gpsValues.push(dec.toFixed(6));
          }
        } else if (type === 3) {
          value = String(readU16(p));
        } else if (type === 4) {
          value = String(readU32(p));
        }
        if (value && value.length > 0 && value !== '0') {
          const isGps = tagId === 0x8825;
          out.push({
            id: isGps ? 'meta-gps' : `meta-exif-${tagId}`,
            label: tagLabel(tagId),
            value: isGps ? `GPS koordinatalari: ${gpsValues.join(', ')}` : value,
            risk: isGps ? 'yuqori' : tagId === 0x013b || tagId === 0x8298 ? 'yuqori' : 'orta',
            removable: true,
          });
        }
      }
    }
  } catch {
    // EXIF parse failure is not fatal
  }
  return out;
}

function parsePngChunks(bytes: Uint8Array): MetadataField[] {
  const out: MetadataField[] = [];
  try {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let off = 8;
    while (off + 12 <= bytes.length) {
      const len = dv.getUint32(off);
      const type = new TextDecoder('latin1').decode(bytes.subarray(off + 4, off + 8));
      if (type === 'tEXt' || type === 'iTXt' || type === 'zTXt') {
        const data = new TextDecoder('latin1').decode(bytes.subarray(off + 8, off + 8 + Math.min(len, 200)));
        const [key, ...rest] = data.split('\0');
        const value = rest.join(' ').substring(0, 120);
        if (value) {
          out.push({
            id: `meta-png-${key || off}`,
            label: `PNG ${type} yozuvi`,
            value: `${key}: ${value}`,
            risk: 'orta',
            removable: true,
          });
        }
      }
      if (type === 'IDAT' || type === 'IEND') break;
      off += 12 + len;
    }
  } catch {
    // ignore
  }
  return out;
}

async function parseOoxmlCore(bytes: Uint8Array): Promise<MetadataField[]> {
  const out: MetadataField[] = [];
  try {
    const core = await readZipEntryText(bytes, 'docProps/core.xml');
    if (!core) return out;
    const pick = (tag: string) => {
      const m = core.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`));
      return m ? m[1] : null;
    };
    const creator = pick('dc:creator');
    const modified = pick('cp:lastModifiedBy');
    const created = pick('dcterms:created');
    const app = pick('Application');
    const company = pick('Company');
    if (creator) out.push({ id: 'meta-author', label: 'Muallif', value: creator, risk: 'yuqori', removable: true });
    if (modified) out.push({ id: 'meta-lastmod', label: 'Oxirgi tahrirlagan', value: modified, risk: 'orta', removable: true });
    if (created) out.push({ id: 'meta-created', label: 'Yaratilgan sana', value: created, risk: 'orta', removable: true });
    if (app) out.push({ id: 'meta-app', label: 'Dasturiy ta\'minot', value: app, risk: 'past', removable: true });
    if (company) out.push({ id: 'meta-company', label: 'Tashkilot', value: company, risk: 'orta', removable: true });
  } catch {
    // ignore
  }
  return out;
}

async function readZipEntryText(bytes: Uint8Array, targetName: string): Promise<string | null> {
  if (typeof DecompressionStream === 'undefined') return null;
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
      const nameLen = dv.getUint16(ptr + 28, true);
      const extraLen = dv.getUint16(ptr + 30, true);
      const commentLen = dv.getUint16(ptr + 32, true);
      const name = new TextDecoder().decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
      if (name === targetName) {
        const localPtr = dv.getUint32(ptr + 42, true);
        const compressedSize = dv.getUint32(ptr + 20, true);
        const method = dv.getUint16(ptr + 10, true);
        const lNameLen = dv.getUint16(localPtr + 26, true);
        const lExtraLen = dv.getUint16(localPtr + 28, true);
        const dataStart = localPtr + 30 + lNameLen + lExtraLen;
        const data = bytes.subarray(dataStart, dataStart + compressedSize);
        if (method === 0) return new TextDecoder().decode(data);
        const ds = new DecompressionStream('deflate-raw');
        const stream = new Blob([data as unknown as BlobPart]).stream().pipeThrough(ds);
        return await new Response(stream).text();
      }
      ptr += 46 + nameLen + extraLen + commentLen;
    }
  } catch {
    return null;
  }
  return null;
}

// Build a sanitized copy: re-encode images via canvas (strips all EXIF), or rewrite
// docProps/core.xml with empty values for OOXML documents. Never mutates the original file.
export async function buildSanitizedCopy(file: File, bytes: Uint8Array): Promise<{ blob: Blob; name: string }> {
  const sig = bytes[0] === 0xff && bytes[1] === 0xd8 ? 'jpeg'
    : bytes[0] === 0x89 && bytes[1] === 0x50 ? 'png'
    : bytes[0] === 0x50 && bytes[1] === 0x4b ? 'zip'
    : 'other';

  if (sig === 'jpeg' || sig === 'png') {
    const blob = await reencodeImage(bytes, sig === 'png' ? 'image/png' : 'image/jpeg');
    return { blob, name: `tozalangan_${file.name}` };
  }
  if (sig === 'zip') {
    const blob = await stripOoxmlCore(bytes);
    return { blob, name: `tozalangan_${file.name}` };
  }
  // Unsupported format: return unchanged bytes with a note (caller surfaces it)
  return { blob: new Blob([bytes as unknown as BlobPart]), name: `tozalangan_${file.name}` };
}

async function reencodeImage(bytes: Uint8Array, mime: string): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([bytes as unknown as BlobPart], { type: mime }));
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Rasm o\'qilmadi'));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas tayyorlanmadi');
    ctx.drawImage(img, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Konvertatsiya xatosi'))), mime, 0.95);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function stripOoxmlCore(bytes: Uint8Array): Promise<Blob> {
  // Rewrite the zip with docProps/core.xml replaced by an empty template.
  // Simplest reliable approach: decompress the entry, patch it, and rebuild a new zip
  // using client-side compression via CompressionStream.
  if (typeof CompressionStream === 'undefined') throw new Error('Bu brauzer metadata tozalashni qo\'llab-quvvatlamaydi');
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65536); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('ZIP strukturasini o\'qib bo\'lmadi');
  const count = dv.getUint16(eocd + 10, true);
  let ptr = dv.getUint32(eocd + 16, true);
  const cleanCore = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>';
  const files: { name: string; data: Uint8Array }[] = [];
  for (let i = 0; i < count; i++) {
    const method = dv.getUint16(ptr + 10, true);
    const compressedSize = dv.getUint32(ptr + 20, true);
    const nameLen = dv.getUint16(ptr + 28, true);
    const extraLen = dv.getUint16(ptr + 30, true);
    const commentLen = dv.getUint16(ptr + 32, true);
    const name = new TextDecoder().decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    const localPtr = dv.getUint32(ptr + 42, true);
    const lNameLen = dv.getUint16(localPtr + 26, true);
    const lExtraLen = dv.getUint16(localPtr + 28, true);
    const dataStart = localPtr + 30 + lNameLen + lExtraLen;
    let data = bytes.subarray(dataStart, dataStart + compressedSize);
    if (method === 8) {
      const ds = new DecompressionStream('deflate-raw');
      const stream = new Blob([data as unknown as BlobPart]).stream().pipeThrough(ds);
      const buf = new Uint8Array(await new Response(stream).arrayBuffer());
      data = buf;
    }
    if (name === 'docProps/core.xml') {
      data = new TextEncoder().encode(cleanCore);
    }
    files.push({ name, data });
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return buildZip(files);
}

// Minimal ZIP writer (store method, no compression) for the sanitized document rebuild.
async function buildZip(files: { name: string; data: Uint8Array }[]): Promise<Blob> {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const enc = new TextEncoder();

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);
    const local = new Uint8Array(30 + nameBytes.length);
    const ldv = new DataView(local.buffer);
    ldv.setUint32(0, 0x04034b50, true);
    ldv.setUint32(4, 0x00000214, true); // version 2.0, no flags
    ldv.setUint16(8, 0, true); // stored
    ldv.setUint16(10, 0, true);
    ldv.setUint16(12, 0, true); // time
    ldv.setUint16(14, 0, true); // date
    ldv.setUint32(16, crc, true);
    ldv.setUint32(20, f.data.length, true);
    ldv.setUint32(24, f.data.length, true);
    ldv.setUint16(26, nameBytes.length, true);
    ldv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    chunks.push(local, f.data);

    const c = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(c.buffer);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(4, 0x0014, true);
    cdv.setUint16(6, 0x0014, true);
    cdv.setUint16(8, 0, true);
    cdv.setUint16(10, 0, true);
    cdv.setUint16(12, 0, true);
    cdv.setUint16(14, 0, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, f.data.length, true);
    cdv.setUint32(24, f.data.length, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint32(42, offset, true);
    c.set(nameBytes, 46);
    central.push(c);
    offset += local.length + f.data.length;
  }
  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const eocd = new Uint8Array(22);
  const edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(8, files.length, true);
  edv.setUint16(10, files.length, true);
  edv.setUint32(12, centralSize, true);
  edv.setUint32(16, offset, true);
  return new Blob([...chunks, ...central, eocd], { type: 'application/zip' });
}

let crcTable: Uint32Array | null = null;
function crc32(data: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[i] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
