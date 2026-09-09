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
  EDR: '', // Surat Edaran

  // ── Naskah Khusus - Surat Perjanjian ──
  MOU: '',  // Kesepakatan Bersama / Nota Kesepahaman
  PKS: '',  // Perjanjian Kerja Sama
  LOA: '',  // Letter of Agreement
  PROC: '', // Kontrak Pengadaan
  PJJ: '',  // Perjanjian Lainnya
  SKU: '',  // Surat Kuasa

  // ── Naskah Khusus - Lainnya ──
  BAC: '',  // Berita Acara
  UND: '',  // Surat Undangan
  KET: '',  // Surat Keterangan
  SPE: '',  // Surat Pengantar
  RPT: '',  // Risalah Rapat
  PEN: '',  // Pengumuman
  PGM: '',  // Sertifikat atau Piagam
  LAP: '',  // Laporan
  BVB: '',  // Blanko Verbal
};

/**
 * Template file mapping (file .docx di public/templates/naskah/)
 * Kode selaras docs/template_naskah_mapping.md (nama file template di MinIO).
 */
export const TEMPLATE_FILES: Record<string, string> = {
  // Pengaturan dan Penetapan
  PER: 'PER.docx',
  KEP: 'KEP.docx',
  INS: 'INS.docx',
  SPR: 'SPR.docx',
  SOP: 'SOP.docx',
  EDR: 'EDR.docx',

  // Naskah Khusus - Surat Perjanjian
  MOU: 'MOU.docx',
  PKS: 'PKS.docx',
  LOA: 'LOA.docx',
  PROC: 'PROC.docx',
  PJJ: 'PJJ.docx',
  SKU: 'SKU.docx',

  // Naskah Khusus - Lainnya
  BAC: 'BAC.docx',
  UND: 'UND.docx',
  KET: 'KET.docx',
  SPE: 'SPE.docx',
  RPT: 'RPT.docx',
  PEN: 'PEN.docx',
  PGM: 'PGM.docx',
  LAP: 'LAP.docx',
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
