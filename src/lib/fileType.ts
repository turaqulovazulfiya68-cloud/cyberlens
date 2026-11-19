// Map a detected binary format to the app's file-type categories.
export type AppFileType = 'rasm' | 'pdf' | 'hujjat' | 'noma-lum';

export function detectFileTypeFromFormat(detectedFormat: string, extension: string): AppFileType {
  const f = detectedFormat.toLowerCase();
  if (f.includes('jpeg') || f.includes('png') || f.includes('gif') || f.includes('bmp') || f.includes('webp')) return 'rasm';
  if (f === 'pdf') return 'pdf';
  if (f.includes('zip') || f.includes('matn') || f.includes('text')) return 'hujjat';
  const ext = extension.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return 'rasm';
  if (ext === 'pdf') return 'pdf';
  if (['txt', 'doc', 'docx', 'rtf', 'md', 'csv'].includes(ext)) return 'hujjat';
  return 'noma-lum';
}

export function detectFileType(file: File): AppFileType {
  return detectFileTypeFromFormat('', file.name.split('.').pop()?.toLowerCase() ?? '');
}

export function getAnalysisModules(fileType: AppFileType): string[] {
  switch (fileType) {
    case 'rasm':
      return ['Fayl imzosi', 'EXIF metadata', 'Joylashuv izlari', 'Maxfiylik tahlili'];
    case 'pdf':
      return ['Fayl imzosi', 'Faol elementlar', 'Sezgir ma\'lumotlar', 'Metadata'];
    case 'hujjat':
      return ['Fayl imzosi', 'Sezgir ma\'lumotlar', 'Makros va OLE', 'Metadata'];
    default:
      return ['Fayl imzosi', 'Struktura tahlili', 'Maxfiylik tahlili'];
  }
}
