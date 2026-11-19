// Scanner test suite — runs the real engine against the 10 required cases.
// Usage: npx tsx tests/scanner.test.ts  (or node with ts stripped)
import { scanFile } from '../src/lib/scanner';

function fakeFile(name: string, content: Uint8Array | string, mime = ''): File {
  const blob = content instanceof Uint8Array ? new Blob([content]) : new Blob([content], { type: mime });
  return new File([blob], name, { type: mime });
}

function zipOf(entries: { name: string; data: Uint8Array; encrypt?: boolean }[]): Uint8Array {
  // Minimal stored (uncompressed) zip for tests
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const enc = new TextEncoder();
  for (const e of entries) {
    const nameBytes = enc.encode(e.name);
    const crc = crc32(e.data);
    const local = new Uint8Array(30 + nameBytes.length);
    const ldv = new DataView(local.buffer);
    ldv.setUint32(0, 0x04034b50, true);
    ldv.setUint16(8, e.encrypt ? 1 : 0, true);
    ldv.setUint32(16, crc, true);
    ldv.setUint32(20, e.data.length, true);
    ldv.setUint32(24, e.data.length, true);
    ldv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    chunks.push(local, e.data);
    const c = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(c.buffer);
    cdv.setUint32(0, 0x02014b50, true);
    cdv.setUint16(8, e.encrypt ? 1 : 0, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, e.data.length, true);
    cdv.setUint32(24, e.data.length, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint32(42, offset, true);
    c.set(nameBytes, 46);
    central.push(c);
    offset += local.length + e.data.length;
  }
  const centralSize = central.reduce((s, c) => s + c.length, 0);
  const eocd = new Uint8Array(22);
  const edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(8, entries.length, true);
  edv.setUint16(10, entries.length, true);
  edv.setUint32(12, centralSize, true);
  edv.setUint32(16, offset, true);
  const all = [...chunks, ...central, eocd];
  const total = all.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of all) { out.set(c, p); p += c.length; }
  return out;
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

// Minimal valid PDF
function makePdf(extra = ''): Uint8Array {
  const content = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R${extra}>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj
trailer<</Root 1 0 R>>`;
  return new TextEncoder().encode(content);
}

// Minimal JPEG (SOI + APP0 JFIF + minimal)
function makeJpeg(): Uint8Array {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9]);
}

// Minimal PNG (signature + IHDR + IEND)
function makePng(): Uint8Array {
  const sig = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const chunk = (type: string, data: Uint8Array) => {
    const len = new Uint8Array(4);
    new DataView(len.buffer).setUint32(0, data.length);
    const typeBytes = new TextEncoder().encode(type);
    const crcIn = new Uint8Array(4 + data.length);
    crcIn.set(typeBytes);
    crcIn.set(data, 4);
    const crc = new Uint8Array(4);
    new DataView(crc.buffer).setUint32(0, crc32(crcIn));
    const out = new Uint8Array(12 + data.length);
    out.set(len); out.set(typeBytes, 4); out.set(data, 8); out.set(crc, 8 + data.length);
    return out;
  };
  const ihdr = new Uint8Array(13);
  new DataView(ihdr.buffer).setUint32(0, 1); new DataView(ihdr.buffer).setUint32(4, 1);
  ihdr[8] = 8; ihdr[9] = 0;
  const out = new Uint8Array(sig.length + 25 + 12);
  out.set(sig);
  out.set(chunk('IHDR', ihdr), sig.length);
  out.set(chunk('IEND', new Uint8Array(0)), sig.length + 25);
  return out;
}

interface TestCase {
  name: string;
  file: File;
  expectVerdict: string;
  expectContains?: string[]; // reason ids that must exist
  expectNotContains?: string[];
}

const TESTS: TestCase[] = [
  {
    name: '1. Oddiy TXT fayl',
    file: fakeFile('matn.txt', 'Salom dunyo! Bu oddiy matn fayli.'),
    expectVerdict: 'SAFE',
  },
  {
    name: '2. Oddiy PDF',
    file: fakeFile('hujjat.pdf', makePdf(), 'application/pdf'),
    expectVerdict: 'SAFE',
    expectNotContains: ['pdf-active'],
  },
  {
    name: '3. DOCX (zip ichida document.xml)',
    file: fakeFile('hujjat.docx', zipOf([
      { name: '[Content_Types].xml', data: new TextEncoder().encode('<Types/>') },
      { name: 'word/document.xml', data: new TextEncoder().encode('<w:document><w:t>Salom</w:t></w:document>') },
    ])),
    expectVerdict: 'SAFE',
  },
  {
    name: '4. JPG rasm',
    file: fakeFile('rasm.jpg', makeJpeg(), 'image/jpeg'),
    expectVerdict: 'SAFE',
  },
  {
    name: '5. PNG rasm',
    file: fakeFile('rasm.png', makePng(), 'image/png'),
    expectVerdict: 'SAFE',
  },
  {
    name: '6. Parol bilan himoyalangan hujjat (shifrlangan zip)',
    file: fakeFile('himoyalangan.docx', zipOf([
      { name: 'word/document.xml', data: new TextEncoder().encode('<w:document/>'), encrypt: true },
    ])),
    expectVerdict: 'SAFE',
    expectContains: ['zip-encrypted'],
  },
  {
    name: '7. Aldovchi kengaytma (exe ichida txt nomi)',
    file: fakeFile('oyin.exe', new TextEncoder().encode('Bu aslida oddiy matn fayl')),
    expectVerdict: 'SUSPICIOUS',
    expectContains: ['ext-mismatch'],
  },
  {
    name: '8. MIME va imzo mos emas (png deb yashirilgan exe)',
    file: fakeFile('rasm.png', new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x04, 0x00]), 'image/png'),
    expectVerdict: 'SUSPICIOUS',
    expectContains: ['ext-mismatch'],
  },
  {
    name: '9. Buzilgan fayl (truncated zip)',
    file: fakeFile('buzilgan.zip', new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00])),
    expectVerdict: 'SUSPICIOUS',
    expectContains: ['zip-corrupt'],
  },
  {
    name: '10. EICAR test imzosi',
    file: fakeFile('test.txt', 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'),
    expectVerdict: 'MALICIOUS',
    expectContains: ['eicar'],
  },
];

async function run() {
  let pass = 0;
  let fail = 0;
  for (const t of TESTS) {
    try {
      const { scan } = await scanFile(t.file);
      const reasonIds = scan.reasons.map((r) => r.id);
      const problems: string[] = [];
      if (scan.verdict !== t.expectVerdict) {
        problems.push(`kutilgan ${t.expectVerdict}, olingan ${scan.verdict} (ball: ${scan.score})`);
      }
      for (const want of t.expectContains ?? []) {
        if (!reasonIds.includes(want)) problems.push(`topilmadi: ${want}`);
      }
      for (const absent of t.expectNotContains ?? []) {
        if (reasonIds.includes(absent)) problems.push(`keraksiz: ${absent}`);
      }
      if (problems.length === 0) {
        console.log(`✓ ${t.name} → ${scan.verdict}`);
        pass++;
      } else {
        console.log(`✗ ${t.name}: ${problems.join('; ')}`);
        console.log(`  Asoslar: ${reasonIds.join(', ')}`);
        fail++;
      }
    } catch (e) {
      console.log(`✗ ${t.name}: xatolik — ${e instanceof Error ? e.message : e}`);
      fail++;
    }
  }
  console.log(`\n${pass} o'tdi, ${fail} o'tmadi`);
  if (fail > 0) process.exit(1);
}

run();
