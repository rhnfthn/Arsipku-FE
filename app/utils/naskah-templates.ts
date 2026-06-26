/**
 * Template Naskah Dinas Configuration (URS Poin 6)
 *
 * Mapping jenis naskah → template file path & Google Docs URL.
 *
 * Template files (.docx) disimpan di public/templates/naskah/
 * Google Docs URL akan diisi setelah template di-upload ke Google Docs.
 *
 * Cara update Google Docs URL:
 * 1. Upload template .docx ke Google Docs
 * 2. Set sharing permission "Anyone with link can edit"
 * 3. Copy link dan paste ke GDOCS_URLS[jenisCode] di bawah
 */

export interface JenisTemplate {
  /** Kode jenis naskah (PER, KEP, INS, dll) */
  jenis: string;
  /** Nama file template di public/templates/naskah/ */
  templateFile: string;
  /** URL Google Docs untuk edit template (kosong = belum dikonfigurasi) */
  gdocsUrl: string;
}

/**
 * URL Google Docs per jenis naskah.
 * Update URL ini setelah template di-upload ke Google Docs.
 */
export const GDOCS_URLS: Record<string, string> = {
  // ── Pengaturan dan Penetapan ──
  PER: '', // Peraturan Direksi
  KEP: '', // Keputusan Direksi
  INS: '', // Instruksi
  SPR: '', // Surat Perintah
  SOP: '', // SOP
  SE: '',  // Surat Edaran

  // ── Naskah Khusus - Surat Perjanjian ──
  NK: '',   // Nota Kesepahaman
  PKS: '',  // Perjanjian Kerja Sama
  LOA: '',  // Letter of Agreement
  LOCA: '', // Letter of Coordination Agreement
  KTR: '',  // Kontrak Pengadaan
  PLN: '',  // Perjanjian Lainnya
  ADN: '',  // Adendum Perjanjian
  SPK: '',  // Surat Perintah Kerja
  ASP: '',  // Adendum SPK
  SK: '',   // Surat Kuasa

  // ── Naskah Khusus - Lainnya ──
  BA: '',   // Berita Acara
  UND: '',  // Surat Undangan
  KET: '',  // Surat Keterangan
  PGN: '',  // Surat Pengantar
  RIS: '',  // Risalah Rapat
  PUM: '',  // Pengumuman
  SRT: '',  // Sertifikat
  PGA: '',  // Piagam
  LAP: '',  // Laporan
  BVB: '',  // Blanko Verbal
};

/**
 * Template file mapping (file .docx di public/templates/naskah/)
 */
export const TEMPLATE_FILES: Record<string, string> = {
  // Pengaturan dan Penetapan
  PER: 'PERATURAN DIREKSI.docx',
  KEP: 'KEPUTUSAN DIREKSI.docx',
  INS: 'INSTRUKSI DIREKSI.docx',
  SPR: 'SURAT PERINTAH DIREKSI.docx',
  SOP: 'SOP.docx',
  SE: 'SURAT EDARAN.docx',

  // Naskah Khusus - Surat Perjanjian
  NK: 'NOTA KESEPAHAMAN.docx',
  PKS: 'PERJANJIAN KERJA SAMA.docx',
  LOA: 'LETTER OF AGREEMENT.docx',
  LOCA: 'LETTER OF COORDINATION AGREEMENT.docx',
  KTR: 'KONTRAK PENGADAAN.docx',
  PLN: 'PERJANJIAN LAINNYA.docx',
  ADN: 'ADENDUM PERJANJIAN.docx',
  SPK: 'SURAT PERINTAH KERJA.docx',
  ASP: 'ADENDUM SPK.docx',
  SK: 'SURAT KUASA.docx',

  // Naskah Khusus - Lainnya
  BA: 'BERITA ACARA.docx',
  UND: 'SURAT UNDANGAN.docx',
  KET: 'SURAT KETERANGAN.docx',
  PGN: 'SURAT PENGANTAR.docx',
  RIS: 'RISALAH RAPAT.docx',
  PUM: 'PENGUMUMAN.docx',
  SRT: 'SERTIFIKAT.docx',
  PGA: 'PIAGAM.docx',
  LAP: 'LAPORAN.docx',
  BVB: 'BLANKO VERBAL.docx',
};

/**
 * Get template info for a jenis code
 */
export function getJenisTemplate(jenisCode: string): JenisTemplate | null {
  const templateFile = TEMPLATE_FILES[jenisCode];
  if (!templateFile) return null;

  return {
    jenis: jenisCode,
    templateFile,
    gdocsUrl: GDOCS_URLS[jenisCode] || '',
  };
}

/**
 * Get download URL for template file (from public folder)
 */
export function getTemplateDownloadUrl(jenisCode: string): string {
  const templateFile = TEMPLATE_FILES[jenisCode];
  if (!templateFile) return '';
  return `/templates/naskah/${templateFile}`;
}

/**
 * Check if a jenis has a Google Docs URL configured
 */
export function hasGdocsUrl(jenisCode: string): boolean {
  return !!(GDOCS_URLS[jenisCode] && GDOCS_URLS[jenisCode].trim());
}