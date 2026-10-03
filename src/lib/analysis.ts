import type { Finding, FindingType, FindingCategory, AnalysisResult, RelationshipLink } from '@/types';

// Heuristic sensitive-data patterns
const PATTERNS: { type: FindingType; category: FindingCategory; label: string; regex: RegExp; sensitivity: number; openness: number; impact: number; description: string; riskExplanation: string; recommendation: string; protectionAction: string }[] = [
  {
    type: 'telefon',
    category: 'aloqa',
    label: 'Telefon raqami',
    regex: /(\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{2,3}[\s.-]?\d{2,3}[\s.-]?\d{2,3}/g,
    sensitivity: 75,
    openness: 80,
    impact: 70,
    description: "Faylingizda telefon raqamingiz ko'rinib turibdi.",
    riskExplanation: "Telefon raqami o'z-alone kam xavf tug'diradi. Lekin agar u ism va universitet ma'lumoti bilan birga bo'lsa, sizni topishni ancha osonlashtiradi.",
    recommendation: "Ulashishdan oldin telefon raqamingizni yashirishni tavsiya qilamiz. Masalan, +998 ** *** ** 45 ko'rinishida.",
    protectionAction: "Telefon raqamini yashirish",
  },
  {
    type: 'email',
    category: 'aloqa',
    label: 'Elektron pochta',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    sensitivity: 70,
    openness: 85,
    impact: 65,
    description: "Faylingizda elektron pochta manzilingiz ko'rinib turibdi.",
    riskExplanation: "Email manzili sizning shaxsingizni aniqlash uchun ishlatilishi mumkin. Agar u boshqa ma'lumotlar bilan birga bo'lsa, bu yanada oson bo'ladi.",
    recommendation: "Email manzilingizni qisman yashirishni tavsiya qilamiz. Masalan, z***@gmail.com ko'rinishida.",
    protectionAction: "Email manzilini yashirish",
  },
  {
    type: 'jshshir',
    category: 'shaxs',
    label: 'JShShIR (PINFL)',
    regex: /\b\d{14}\b/g,
    sensitivity: 98,
    openness: 90,
    impact: 95,
    description: "Faylingizda JShShIR (shaxsiy raqamingiz) bor. Bu juda sezgir ma'lumot.",
    riskExplanation: "JShShIR sizni butunlay noyob tarzda aniqlaydi. Agar bu raqam begona qo'liga o'tib qolsa, siz nomidan turib turli xizmatlardan foydalanish mumkin.",
    recommendation: "Bu raqamni fayldan butunlay olib tashlashni qat'iy tavsiya qilamiz.",
    protectionAction: "JShShIR raqamini olib tashlash",
  },
  {
    type: 'iban',
    category: 'raqamli-kirish',
    label: 'Bank IBAN raqami',
    regex: /\b[AZ]{2}\d{2}[A-Z0-9]{4}\d{10}\b/gi,
    sensitivity: 92,
    openness: 75,
    impact: 90,
    description: "Faylingizda bank hisobingiz raqami (IBAN) ko'rinib turibdi.",
    riskExplanation: "Bank raqami moliyaviy ma'lumotlaringizga kirish imkonini berishi mumkin. Buni ulashish juda xavfli.",
    recommendation: "Bank raqamini fayldan butunlay olib tashlashni qat'iy tavsiya qilamiz.",
    protectionAction: "Bank raqamini olib tashlash",
  },
  {
    type: 'parol',
    category: 'raqamli-kirish',
    label: 'Parol / kalit so\'z',
    regex: /(?:parol|password|pwd|pass|kalit)[:\s=]+\S+/gi,
    sensitivity: 99,
    openness: 60,
    impact: 98,
    description: "Faylingizda parol yoki kalit so'z bor. Bu juda xavfli.",
    riskExplanation: "Agar parol begona qo'liga o'tsa, sizning hisoblaringizga kirib olish mumkin.",
    recommendation: "Parolni fayldan darhol olib tashlashni qat'iy tavsiya qilamiz.",
    protectionAction: "Parolni olib tashlash",
  },
  {
    type: 'tugilgan-sana',
    category: 'shaxs',
    label: 'Tug\'ilgan sana',
    regex: /\b(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})\b/g,
    sensitivity: 65,
    openness: 70,
    impact: 60,
    description: "Faylingizda tug'ilgan sanangiz ko'rinib turibdi.",
    riskExplanation: "Tug'ilgan sana o'z-alone katta xavf emas, lekin ism bilan birgalikda sizni aniqlashda ishlatilishi mumkin.",
    recommendation: "Tug'ilgan sanani yashirishni tavsiya qilamiz.",
    protectionAction: "Tug'ilgan sanani yashirish",
  },
];

const UZBEK_NAMES = ['Zulfiya', 'Akmal', 'Dilshod', 'Feruza', 'Jasur', 'Kamola', 'Bekzod', 'Madina', 'Sardor', 'Nilufar', 'Aziz', 'Shahnoza'];
const UZBEK_SURNAMES = ['Karimova', 'Rahimov', 'Yusupova', 'Toshmatov', 'Ergasheva', 'Saidov', 'Kamilova', 'Bozorov'];
const UNIVERSITIES = ["Toshkent Davlat Universiteti", "Toshkent Axborot Texnologiyalari Universiteti", "Samarqand Davlat Universiteti", "Toshkent Tibbiyot Akademiyasi", "Mirzo Ulug'bek nomidagi"];
const WORKPLACES = ["UzTelekom", "Humans Bank", "UzAuto Motors", "EPAM Systems", "TBC Bank", "Anor Bank"];

export function detectFileType(file: File): 'rasm' | 'pdf' | 'hujjat' | 'noma-lum' {
  const mime = file.type;
  const name = file.name.toLowerCase();
  if (mime.startsWith('image/')) return 'rasm';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    mime.includes('word') ||
    mime.includes('officedocument') ||
    mime.includes('text') ||
    name.endsWith('.docx') ||
    name.endsWith('.doc') ||
    name.endsWith('.txt') ||
    name.endsWith('.rtf')
  )
    return 'hujjat';
  return 'noma-lum';
}

export function getAnalysisModules(fileType: 'rasm' | 'pdf' | 'hujjat' | 'noma-lum'): string[] {
  switch (fileType) {
    case 'rasm':
      return ['Rasm ichidagi matn', 'QR-kod', 'Qo\'shimcha ma\'lumotlar', 'Maxfiylik tahlili'];
    case 'pdf':
      return ['Matn', 'Qo\'shimcha ma\'lumotlar', 'Sezgir ma\'lumotlar', 'Maxfiylik tahlili'];
    case 'hujjat':
      return ['Matn', 'Sezgir ma\'lumotlar', 'Qo\'shimcha ma\'lumotlar'];
    default:
      return ['Matn', 'Qo\'shimcha ma\'lumotlar', 'Maxfiylik tahlili'];
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  try {
    if (file.type.startsWith('image/')) {
      // In a real app, OCR would run here (Tesseract.js). For the prototype, we simulate
      // extracting text from images by generating plausible content based on the filename.
      return simulateImageOCR(file.name);
    }
    if (file.type === 'application/pdf') {
      // PDF text extraction would use pdf.js here. For the prototype, we simulate.
      return simulatePDFText(file.name);
    }
    if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      return await file.text();
    }
    // DOCX and other binary formats: simulate extraction
    return simulateDocText(file.name);
  } catch {
    return simulateDocText(file.name);
  }
}

function simulateImageOCR(fileName: string): string {
  const name = fileName.replace(/\.[^.]+$/, '');
  const rnd = Math.random;
  const name2 = UZBEK_NAMES[Math.floor(rnd() * UZBEK_NAMES.length)];
  const surname = UZBEK_SURNAMES[Math.floor(rnd() * UZBEK_SURNAMES.length)];
  const uni = UNIVERSITIES[Math.floor(rnd() * UNIVERSITIES.length)];
  const phone = `+998 ${Math.floor(90 + rnd() * 9)} ${Math.floor(100 + rnd() * 899)} ${Math.floor(10 + rnd() * 89)} ${Math.floor(10 + rnd() * 89)}`;
  const email = `${name2.toLowerCase()}.${surname.toLowerCase().replace(/['']/g, '')}@gmail.com`;
  const birthDate = `${Math.floor(1 + rnd() * 28).toString().padStart(2, '0')}.${Math.floor(1 + rnd() * 12).toString().padStart(2, '0')}.${1990 + Math.floor(rnd() * 15)}`;

  return `${name2} ${surname}\nTel: ${phone}\nEmail: ${email}\n${uni}\nTug'ilgan: ${birthDate}\n`;
}

function simulatePDFText(fileName: string): string {
  const rnd = Math.random;
  const name2 = UZBEK_NAMES[Math.floor(rnd() * UZBEK_NAMES.length)];
  const surname = UZBEK_SURNAMES[Math.floor(rnd() * UZBEK_SURNAMES.length)];
  const uni = UNIVERSITIES[Math.floor(rnd() * UNIVERSITIES.length)];
  const workplace = WORKPLACES[Math.floor(rnd() * WORKPLACES.length)];
  const phone = `+998 ${Math.floor(90 + rnd() * 9)} ${Math.floor(100 + rnd() * 899)} ${Math.floor(10 + rnd() * 89)} ${Math.floor(10 + rnd() * 89)}`;
  const email = `${name2.toLowerCase()}.${surname.toLowerCase().replace(/['']/g, '')}@gmail.com`;
  const birthDate = `${Math.floor(1 + rnd() * 28).toString().padStart(2, '0')}.${Math.floor(1 + rnd() * 12).toString().padStart(2, '0')}.${1990 + Math.floor(rnd() * 15)}`;
  const jshshir = `${Math.floor(10000000000000 + rnd() * 89999999999999)}`;

  return `ARIZA\nF.I.O: ${name2} ${surname}\nTug'ilgan sana: ${birthDate}\nJShShIR: ${jshshir}\nTelefon: ${phone}\nEmail: ${email}\nTashkilot: ${uni}\nIsh joyi: ${workplace}\n`;
}

function simulateDocText(fileName: string): string {
  const rnd = Math.random;
  const name2 = UZBEK_NAMES[Math.floor(rnd() * UZBEK_NAMES.length)];
  const surname = UZBEK_SURNAMES[Math.floor(rnd() * UZBEK_SURNAMES.length)];
  const uni = UNIVERSITIES[Math.floor(rnd() * UNIVERSITIES.length)];
  const phone = `+998 ${Math.floor(90 + rnd() * 9)} ${Math.floor(100 + rnd() * 899)} ${Math.floor(10 + rnd() * 89)} ${Math.floor(10 + rnd() * 89)}`;
  const email = `${name2.toLowerCase()}.${surname.toLowerCase().replace(/['']/g, '')}@gmail.com`;
  return `Rezyume\n${name2} ${surname}\n${uni}\nTelefon: ${phone}\nEmail: ${email}\n`;
}

function extractMetadata(file: File): Finding[] {
  const findings: Finding[] = [];
  const lastModified = new Date(file.lastModified);
  findings.push({
    id: 'meta-device',
    type: 'metadata',
    category: 'raqamli-kirish',
    label: 'Fayl ichidagi qo\'shimcha ma\'lumotlar',
    value: `${file.type || 'noma-lum'} | ${file.size} bayt | ${lastModified.toISOString().split('T')[0]}`,
    location: 'Fayl ichida saqlanib qolgan qo\'shimcha maydonlar',
    sensitivity: 45,
    openness: 60,
    impact: 40,
    description: "Fayl ichida qurilma va sana haqida qo'shimcha ma'lumotlar saqlanib qolgan.",
    riskExplanation: "Bu qo'shimcha ma'lumotlar fayl qaysi qurilmada va qachon yaratilganini oshkor qilishi mumkin.",
    recommendation: "Ulashishdan oldin bu qo'shimcha ma'lumotlarni tozalashni tavsiya qilamiz.",
    protectionAction: "Qo'shimcha ma'lumotlarni tozalash",
  });

  if (file.type.startsWith('image/')) {
    findings.push({
      id: 'meta-gps',
      type: 'metadata',
      category: 'joylashuv',
      label: 'Joylashuv ma\'lumoti',
      value: '41.2995° N, 69.2401° E (Toshkent)',
      location: 'Rasm ichida saqlanib qolgan joylashuv ma\'lumoti',
      sensitivity: 80,
      openness: 70,
      impact: 75,
      description: "Rasmingiz ichida sizning aniq joylashuvingiz haqida ma'lumot saqlanib qolgan.",
      riskExplanation: "Bu ma'lumot siz qayerda ekanligingizni begonalarga oshkor qilishi mumkin.",
      recommendation: "Ulashishdan oldin rasmdagi joylashuv ma'lumotini olib tashlashni tavsiya qilamiz.",
      protectionAction: "Joylashuv ma'lumotini olib tashlash",
    });
  }

  return findings;
}

function detectQRCode(fileType: string): Finding[] {
  if (fileType !== 'rasm') return [];
  const rnd = Math.random;
  const hasQR = rnd() > 0.4;
  if (!hasQR) return [];

  const qrContents = [
    'https://t.me/zulfiya_karimova',
    'https://wa.me/998901234567',
    'WIFI:T:WPA;S:HomeWiFi;P:secret123;;',
    'https://tuit.uz/student/profile/12345',
  ];
  const content = qrContents[Math.floor(rnd() * qrContents.length)];

  return [{
    id: 'qr-code',
    type: 'qr-kod',
    category: 'raqamli-kirish',
    label: 'QR-kod',
    value: content,
    location: 'Rasmning markazida QR-kod topildi',
    sensitivity: 85,
    openness: 95,
    impact: 80,
    description: "Faylingizda QR-kod bor.",
    riskExplanation: "QR-kod qo'shimcha ma'lumotlarga olib borishi mumkin. Agar bu kod sizning shaxsiy sahifangizga bog'langan bo'lsa, begona odam siz haqingizda ko'proq ma'lumot olishi mumkin.",
    recommendation: "Ulashishdan oldin QR-kodni olib tashlashni yoki xiralashtirishni tavsiya qilamiz.",
    protectionAction: "QR-kodni olib tashlash",
  }];
}

function detectNamesInText(text: string): Finding[] {
  const findings: Finding[] = [];
  // Detect Uzbek-style names (Capitalized word + Capitalized word)
  const nameRegex = /\b([A-ZÖÜÇŞĞNGa-zöüçşğň]{3,})\s+([A-ZÖÜÇŞĞNGa-zöüçşğň]{4,})\b/g;
  let match;
  const seen = new Set<string>();
  while ((match = nameRegex.exec(text)) !== null) {
    const fullName = `${match[1]} ${match[2]}`;
    if (seen.has(fullName)) continue;
    seen.add(fullName);
    // Filter out common non-name bigrams
    if (/^(ARIZA|Rezyume|Tug|Tel|Email|Ish|JSh|Tashkilot|F\.I|ARIZA)/.test(match[1])) continue;
    findings.push({
      id: `name-${fullName}`,
      type: 'ism',
      category: 'shaxs',
      label: 'To\'liq ism',
      value: fullName,
      location: 'Fayl ichidagi matnda',
      sensitivity: 55,
      openness: 75,
      impact: 50,
      description: `Faylingizda to'liq ism ko'rinib turibdi: ${fullName}`,
      riskExplanation: "Ism o'z-alone katta xavf emas. Lekin agar u telefon raqami yoki universitet bilan birga bo'lsa, sizni aniqlash ancha oson bo'ladi.",
      recommendation: "Ismni qisqartirishni tavsiya qilamiz. Masalan, faqat bosh harflarni qoldiring.",
      protectionAction: "Ismni qisqartirish",
    });
    break; // Only detect one name
  }
  return findings;
}

function detectOrganizations(text: string): Finding[] {
  const findings: Finding[] = [];
  for (const uni of UNIVERSITIES) {
    if (text.includes(uni)) {
      findings.push({
        id: `org-${uni}`,
        type: 'universitet',
        category: 'tashkilot',
        label: 'Universitet yoki tashkilot',
        value: uni,
        location: 'Fayl ichidagi matnda',
        sensitivity: 50,
        openness: 65,
        impact: 45,
        description: `Faylingizda tashkilot nomi ko'rinib turibdi: ${uni}`,
        riskExplanation: "Universitet ma'lumoti o'z-alone xavfli emas. Lekin agar u ism va telefon bilan birga bo'lsa, siz haqingizda to'liqroq ma'lumot olish mumkin.",
        recommendation: "Tashkilot nomini umumlashtirishni tavsiya qilamiz. Masalan, 'universitet' deb yozing.",
        protectionAction: "Tashkilot nomini umumlashtirish",
      });
      break;
    }
  }
  for (const wp of WORKPLACES) {
    if (text.includes(wp)) {
      findings.push({
        id: `work-${wp}`,
        type: 'ish-joyi',
        category: 'tashkilot',
        label: 'Ish joyi',
        value: wp,
        location: 'Fayl ichidagi matnda',
        sensitivity: 55,
        openness: 65,
        impact: 50,
        description: `Faylingizda ish joyingiz nomi ko'rinib turibdi: ${wp}`,
        riskExplanation: "Ish joyi ma'lumoti sizni aniqlashni osonlashtirishi mumkin.",
        recommendation: "Ish joyi nomini umumlashtirishni tavsiya qilamiz.",
        protectionAction: "Ish joyini umumlashtirish",
      });
      break;
    }
  }
  return findings;
}

function buildRelationships(findings: Finding[]): RelationshipLink[] {
  const links: RelationshipLink[] = [];
  const ids = findings.map((f) => f.id);
  for (let i = 0; i < ids.length - 1; i++) {
    links.push({
      from: ids[i],
      to: ids[i + 1],
      label: 'bog\'liq',
    });
  }
  // Also link first and last for circular visualization
  if (ids.length > 2) {
    links.push({
      from: ids[ids.length - 1],
      to: ids[0],
      label: 'profil',
    });
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

  // Prototype heuristic: RISK = SENSITIVITY × OPENNESS × LINKAGE × IMPACT (normalized to 0-100)
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

export async function analyzeFile(file: File, fileId: string): Promise<AnalysisResult> {
  const fileType = detectFileType(file);
  const text = await extractTextFromFile(file);

  const findings: Finding[] = [];

  // Pattern-based detection
  for (const pattern of PATTERNS) {
    const matches = text.match(pattern.regex);
    if (matches) {
      for (const match of matches.slice(0, 1)) {
        findings.push({
          id: `${pattern.type}-${match.substring(0, 10)}`,
          type: pattern.type,
          category: pattern.category,
          label: pattern.label,
          value: match.trim(),
          location: 'Fayl ichidagi matnda',
          sensitivity: pattern.sensitivity,
          openness: pattern.openness,
          impact: pattern.impact,
          description: pattern.description,
          riskExplanation: pattern.riskExplanation,
          recommendation: pattern.recommendation,
          protected: false,
          protectionAction: pattern.protectionAction,
        });
      }
    }
  }

  // Name detection
  findings.push(...detectNamesInText(text));
  // Organization detection
  findings.push(...detectOrganizations(text));
  // Metadata detection
  findings.push(...extractMetadata(file));
  // QR code detection (simulated for images)
  findings.push(...detectQRCode(fileType));

  // Deduplicate by type (keep highest sensitivity)
  const byType = new Map<string, Finding>();
  for (const f of findings) {
    const existing = byType.get(f.type);
    if (!existing || f.sensitivity > existing.sensitivity) {
      byType.set(f.type, f);
    }
  }
  const uniqueFindings = Array.from(byType.values());

  const relationships = buildRelationships(uniqueFindings);
  const risk = calculateRisk(uniqueFindings, relationships);

  const detectedTypeLabel: Record<string, string> = {
    'rasm': 'Rasm (JPEG/PNG)',
    'pdf': 'PDF hujjat',
    'hujjat': 'Matn hujjati (DOCX/TXT)',
    'noma-lum': 'Noma\'lum format',
  };

  return {
    fileId,
    fileName: file.name,
    fileType,
    detectedType: detectedTypeLabel[fileType],
    findings: uniqueFindings,
    relationships,
    riskScore: risk.riskScore,
    riskLevel: risk.riskLevel,
    riskBreakdown: risk.riskBreakdown,
    protectedFindings: [],
    protectedRiskScore: risk.riskScore,
    protectedRiskLevel: risk.riskLevel,
  };
}

export function generateDemoFile(): File {
  const content = `ARIZA
F.I.O: Zulfiya Karimova
Tug'ilgan sana: 15.03.1998
JShShIR: 31234567890123
Telefon: +998 90 123 45 67
Email: zulfiya.karimova@gmail.com
Tashkilot: Toshkent Axborot Texnologiyalari Universiteti
Ish joyi: EPAM Systems
Parol: mySecretPass2024`;
  const blob = new Blob([content], { type: 'application/pdf' });
  return new File([blob], 'ariza_zulfiya.pdf', { type: 'application/pdf' });
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
    'aloqa': 'Aloqa ma\'lumotlari',
    'tashkilot': 'Tashkilot',
    'joylashuv': 'Joylashuv',
    'raqamli-kirish': 'Raqamli ma\'lumotlar',
    'hujjat': 'Hujjat',
  };
  return labels[category];
}
