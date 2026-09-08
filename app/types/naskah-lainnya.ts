// ============================================================
// KONTAK API — Naskah Lainnya (sumber kebenaran)
// FE mock & BE (fase 2) harus mengikuti shape ini persis.
// ============================================================

export type JenisNaskah =
  | 'PER'
  | 'KEP'
  | 'INS'
  | 'SPR'
  | 'EDR'
  | 'SOP'
  | 'MOU'
  | 'PKS'
  | 'PROC'
  | 'PJJ'
  | 'LOA'
  | 'SKU'
  | 'BAC'
  | 'KET'
  | 'SPE'
  | 'RPT'
  | 'PEN'
  | 'PGM'
  | 'LAP';

export type Tahapan =
  | 'konsep'
  | 'persetujuan'
  | 'legal_drafting'
  | 'evaluasi'
  | 'persetujuan_lanjutan'
  | 'evaluasi_final'
  | 'persetujuan_direksi'
  | 'tanda_tangan_pemrakarsa'
  | 'blanko_verbal'
  | 'tanda_tangan_legal'
  | 'tanda_tangan_pejabat'
  | 'tanda_tangan'
  | 'selesai'
  | 'perlu_perbaikan'
  | 'ditolak'
  | 'dibatalkan';

export type StatusApprover = 'pending' | 'waiting' | 'verified' | 'rejected';
export type SignOption = 'digsig' | 'qr_only' | 'ttd_basah';
export type DocumentStatus = 'draf' | 'pending' | 'final' | 'final_tte';
export type MockRole = 'pemrakarsa' | 'legal' | 'pejabat';

export type JenisAksi =
  | 'kirim'
  | 'edit'
  | 'setuju'
  | 'tolak'
  | 'kembalikan'
  | 'mulai-legal'
  | 'kirim-approval-legal'
  | 'kembalikan-legal'
  | 'evaluasi'
  | 'kembalikan-evaluasi'
  | 'lanjut-persetujuan'
  | 'legal-drafting-ulang'
  | 'batalkan-evaluasi'
  | 'teruskan-persetujuan'
  | 'selesai-persetujuan'
  | 'simpan-blanko'
  | 'kirim-approval-blanko'
  | 'buka-blanko-verbal'
  | 'tanda-tangan'
  | 'tolak-tanda-tangan'
  | 'preview-lembar-persetujuan-direksi'
  | 'kirim-lembar-persetujuan-direksi'
  | 'paraf-lembar-persetujuan-direksi'
  | 'tolak-lembar-persetujuan-direksi'
  | 'preview-blanko-verbal'
  | 'kirim-blanko-verbal'
  | 'paraf-blanko-verbal'
  | 'tolak-blanko-verbal'
  | 'paraf';

export interface Persona {
  positionId?: string;
  persnum?: number;
  nama: string;
  jabatan: string;
}

export interface NaskahListItem {
  id: string;
  nomor: string | null; // null saat konsep
  jenis: JenisNaskah;
  perihal: string;
  pemrakarsa: Persona;
  /** Pejabat terakhir/tertinggi pada approval awal milik pemrakarsa. */
  pemrakarsaPejabat?: Persona;
  tahapan: Tahapan;
  /** Metadata status dokumen untuk badge daftar, khususnya TTD fisik. */
  signOption?: SignOption;
  documentStatus?: string;
  isTtdFisik?: boolean;
  manualFinalStatus?: 'final' | 'belum_final';
  butuhLegal: boolean;
  penandatangan: Persona;
  tanggal: string; // YYYY-MM-DD
  terakhirDiubah: string; // ISO datetime
  // Sub-status legal per naskah (badge kolom Status di halaman Legal Drafting).
  // Dihitung BE getLegalDrafting: 'belum_dikirim' | 'menunggu_persetujuan' | 'revisi' | 'sudah_dikerjakan'.
  statusLegal?: string;
}

export interface DokumenFile {
  id: string;
  nama: string;
  tipe:
    | 'naskah'
    | 'naskah_fisik'
    | 'blanko_verbal'
    | 'blanko_verbal_pdf'
    | 'lembar_persetujuan_direksi_pdf'
    | 'pendukung';
  ukuran: string; // "48 KB"
  tanggal?: string;
  status: 'terbaca' | 'final' | 'revisi' | 'belum_diunggah' | 'draf' | 'dittd' | 'proses_ttd';
  parameter?: { nomor?: string; perihal?: string; tanggal?: string };
  // Field versi naskah (hanya untuk tipe 'naskah'):
  uploaderNama?: string;
  uploaderJabatan?: string;
  fase?: string; // raw tahapan enum (konsep|legal_drafting|perlu_perbaikan|...)
  hasPdfPreview?: boolean;
  previewNama?: string;
  isCurrent?: boolean;
}

export interface RevisionFilePair {
  docx: File | null;
}

export type TahapApproval =
  | 'persetujuan'
  | 'legal_drafting'
  | 'evaluasi'
  | 'persetujuan_lanjutan'
  | 'evaluasi_final'
  | 'approval_legal'
  | 'approval_blanko'
  | 'approval_penandatangan'
  | 'persetujuan_direksi'
  | 'persetujuan_direksi_ditetapkan'
  | 'blanko_verbal'
  | 'blanko_verbal_ditetapkan';

export interface ApprovalRow {
  id: string;
  tahap: TahapApproval;
  positionId?: string;
  persnum?: number;
  nama: string;
  jabatan: string;
  urutan: number;
  status: StatusApprover;
  catatan?: string;
  delegatePersnum?: number;
  delegateName?: string;
  delegatePositionStatus?: 'PT' | 'PH' | 'PS' | null;
  tanggal?: string;
}

// Rantai approval dikelompokkan per tahap (fase) — approval pemrakarsa
// (persetujuan) dan legal unit (legal_drafting) tidak tercampur.
export type ApprovalByTahap = Record<string, ApprovalRow[]>;

export interface RiwayatRow {
  id: string;
  aksi: string; // 'kirim' | 'setuju' | 'tolak' | 'ttd' | ...
  aktor: string;
  jabatan: string;
  tahap: string;
  status: string;
  catatan?: string;
  tanggal: string; // ISO datetime
}

// Riwayat dikelompokkan per tahap (fase) — approval pemrakarsa, legal unit, dll
// tidak tercampur. Key = tahap ('persetujuan', 'legal_drafting', ...), value = riwayat rows fase itu.
export type RiwayatByTahap = Record<string, RiwayatRow[]>;

export interface StepperStep {
  step: number;
  label: string;
  status: 'done' | 'active' | 'todo' | 'skip';
}

export interface NaskahDetail extends NaskahListItem {
  klasifikasi: string;
  sifat: string; // 'sangat_rahasia' | 'rahasia' | 'terbatas' | 'biasa' | 'terbuka'
  signOption: SignOption;
  approvalChain?: { positionId?: string; persnum?: number; nama: string; jabatan: string }[];
  fileUrl?: string | null; // relative proxy path `/naskah-lainnya/:id/file` (bukan signed URL MinIO, untuk hindari CORS)
  filePreviewUrl?: string | null;
  dokumen: DokumenFile[];
  approval: ApprovalRow[];
  approvalByTahap?: ApprovalByTahap;
  riwayat: RiwayatRow[];
  riwayatByTahap?: RiwayatByTahap;
  stepper: StepperStep[];
  availableActions: JenisAksi[]; // dihitung BE/mock dari role + tahapan
  // BE `getDetail` exposes the naskah's company id (for delegasi direksi lookup).
  companyId?: string | null;
  // Daftar penandatangan (array). BE baru mengirim array.
  // `penandatangan` (inherited dari NaskahListItem) tetap dipertahankan untuk backward compat (item pertama).
  penandatanganList?: Penandatangan[];
  // BE `getDetail` baru — fase penandatangan.
  signingIndex: number | null; // 1-based index signer aktif, null di luar fase tanda tangan
  signerCount: number; // N total signer
  signedFileUrl: string | null; // URL MinIO artefak tertandatangan, atau null
  documentStatus: DocumentStatus;
  manualFinalStatus: 'final' | 'belum_final';
  manualFinalFileUploaded: boolean;
  canManageManualFinal: boolean;
}

export interface Penandatangan {
  positionId?: string;
  nama: string;
  jabatan: string;
  persnum?: number;
  index?: number;
}

export interface ApprovalItem {
  positionId?: string;
  persnum?: number;
  nama: string;
  jabatan: string;
}

export interface BuatNaskahPayload {
  jenis: JenisNaskah;
  nomor?: string;
  klasifikasi: string;
  // BE menerima single object (akan di-wrap ke array) atau array langsung bila user pilih multiple.
  penandatangan: Penandatangan | Penandatangan[];
  sifat: string;
  signOption: SignOption;
  butuhLegal: boolean;
  perihal?: string;
  tanggal?: string;
  // Rantai approval berjenjang; pejabat boleh sekaligus menjadi penandatangan.
  // Urutan array = urutan persetujuan.
  approval?: ApprovalItem[];
}

export interface ApprovalActionPayload {
  approvalId: string;
  catatan?: string;
}

export interface EvaluasiPayload {
  sesuai: boolean;
  checklist: string[]; // id checklist yang tercentang
  catatan?: string;
}

export interface KeputusanEvaluasiPayload {
  keputusan: 'lanjut_persetujuan' | 'legal_drafting_ulang' | 'batalkan';
  penerimaPertama?: ApprovalItem;
  catatan?: string;
}

export interface BlankoPayload {
  nomorVerbal: string;
  tanggal: string;
  perihal: string;
  dasarNaskah: string;
  catatan?: string;
}

/** Model data untuk lembar persetujuan direksi / blanko verbal. */
export interface SheetFormModel {
  tanggal?: string;
  nomor?: string;
  diusulkanOleh?: string;
  jabatanDiusulkan?: string;
  perihal?: string;
  referensiDari?: string;
  referensiNomor?: string;
  referensiTanggal?: string;
  klasifikasi?: string;
  lampiran?: string;
  catatan?: string;
  bodyHtml?: string;
  legalDrafter?: string;
  legalDrafterJabatan?: string;
  legalChecker?: string;
  legalCheckerJabatan?: string;
  ditetapkanOleh?: DirectorApprovalItem[];
  diketahuiOleh?: DirectorApprovalItem[];
  alamatInfo?: {
    kantor?: string;
    gedung?: string;
    kota?: string;
    alamat?: string;
  };
}

/** Baris persetujuan direksi untuk lembar/blanko. */
export interface DirectorApprovalItem {
  index?: number;
  nama: string;
  jabatan: string;
  status?: StatusApprover;
  positionId?: string;
  persnum?: number;
  catatan?: string;
  delegatePersnum?: number;
  delegateName?: string;
  delegatePositionStatus?: 'PT' | 'PH' | 'PS' | null;
  approvalId?: string;
  roleLabel?: string;
  /** Status delegasi direksi: 'ybs' (default) / 'PT'/'PH'/'PS' — di-prefix di depan nama pengganti di template. */
  delegator?: string;
  /** Tag level org data — 'BOD' (direksi) / 'BOD-1' (EVP), untuk grouping dropdown pengganti. */
  bodTag?: string;
}

export interface TandaTanganPayload {
  passphrase?: string;
}

// Pemberi persetujuan legal drafting — person di unit legal (GET /konfigurasi/unit-legal).
export interface LegalRecipient {
  positionId: string;
  persnum: number | null;
  nama: string;
  jabatan: string;
  unitId: number;
  unitName: string;
  level: number;
  chief: boolean;
  isActive: boolean;
  isDelegasi?: boolean;
  positionStatus?: 'PT' | 'PH' | 'PS' | null;
}

// Payload kirim approval legal drafting — array approver dari unit legal (urutan = urutan persetujuan).
export interface KirimApprovalLegalPayload {
  approval: ApprovalItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const TAHAPAN_STEP: Record<Tahapan, number> = {
  konsep: 1,
  persetujuan: 2,
  legal_drafting: 3,
  evaluasi: 4,
  persetujuan_lanjutan: 5,
  evaluasi_final: 6,
  persetujuan_direksi: 7,
  blanko_verbal: 7,
  tanda_tangan_pemrakarsa: 8,
  tanda_tangan_legal: 8,
  tanda_tangan_pejabat: 8,
  tanda_tangan: 8,
  selesai: 9,
  perlu_perbaikan: 1,
  ditolak: 0,
  dibatalkan: 0,
};

// Sumber kebenaran label jenis naskah — dipakai form (tulis) & detail, jangan duplikat.
// Selaras dengan docs/template_naskah_mapping.md (nama file template .docx di MinIO).
export const JENIS_LABELS: Record<JenisNaskah, string> = {
  PER: 'Peraturan Direksi',
  KEP: 'Keputusan Direksi',
  INS: 'Instruksi',
  SPR: 'Surat Perintah',
  EDR: 'Surat Edaran',
  SOP: 'Standar Operasional Prosedur (SOP)',
  MOU: 'Kesepakatan Bersama / Nota Kesepahaman',
  PKS: 'Perjanjian Kerja Sama',
  PROC: 'Kontrak Pengadaan',
  PJJ: 'Perjanjian Lainnya',
  LOA: 'Letter of Agreement (LOA)',
  SKU: 'Surat Kuasa',
  BAC: 'Berita Acara',
  KET: 'Surat Keterangan',
  SPE: 'Surat Pengantar',
  RPT: 'Risalah Rapat',
  PEN: 'Pengumuman',
  PGM: 'Sertifikat atau Piagam',
  LAP: 'Laporan',
};

// Template format penomoran per jenis (verbatim dari seed migration 1787112362482).
// {TIPE} diganti kode jenis saat tampil di placeholder; placeholder lain ({NO_URUT}/{INSTANSI}/
// {BULAN}/{TAHUN}/{JABATAN}/{LOKASI}/{KLASIFIKASI}) literal sebagai panduan struktur nomor.
// ponytail: ceiling — duplikat seed BE; jika format_penomoran jadi admin-editable, fetch dari
// GET /digsig/document/jenis-naskah (sudah return format_penomoran) alih-alih hardcode.
export const JENIS_FORMAT_PENOMORAN: Record<JenisNaskah, string> = {
  PER: '{TIPE}.{NO_URUT}/{INSTANSI}/{BULAN}/{TAHUN}',
  KEP: '{TIPE}.{NO_URUT}/{JABATAN}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  INS: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  SPR: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  EDR: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  SOP: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  MOU: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  PKS: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  PROC: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  PJJ: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  LOA: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  SKU: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  BAC: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  KET: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  SPE: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  RPT: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  PEN: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  PGM: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
  LAP: '{TIPE}.{NO_URUT}/{JABATAN}/{LOKASI}/{INSTANSI}/{KLASIFIKASI}/{BULAN}/{TAHUN}',
};

// Label ramah tahapan/fase untuk timeline versi naskah. Fallback: raw tahapan.
export const FASE_LABEL: Record<string, string> = {
  konsep: 'Konsep Awal',
  legal_drafting: 'Legal Drafting',
  perlu_perbaikan: 'Revisi Legal',
  persetujuan: 'Persetujuan',
  evaluasi: 'Evaluasi',
  persetujuan_direksi: 'Blanko Verbal Persetujuan Direksi (Legacy)',
  tanda_tangan_pemrakarsa: 'Tanda Tangan Pemrakarsa',
  blanko_verbal: 'Blanko Verbal / Persetujuan Direksi',
  tanda_tangan_legal: 'Tanda Tangan Legal',
  tanda_tangan_pejabat: 'Tanda Tangan Pejabat',
  tanda_tangan: 'Tanda Tangan',
  selesai: 'Final',
};
