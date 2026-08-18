// ============================================================
// KONTAK API — Naskah Lainnya (sumber kebenaran)
// FE mock & BE (fase 2) harus mengikuti shape ini persis.
// ============================================================

export type JenisNaskah =
  | 'PER' | 'KEP' | 'INS' | 'SPD' | 'SED' | 'SOP' | 'KSB'
  | 'PKS' | 'KTP' | 'PJL' | 'LOA' | 'SKU' | 'BA' | 'SKE'
  | 'SPR' | 'RRA' | 'PUM' | 'PIA' | 'LAP';

export type Tahapan =
  | 'konsep' | 'persetujuan' | 'legal_drafting' | 'evaluasi'
  | 'tanda_tangan_pemrakarsa' | 'blanko_verbal' | 'tanda_tangan_legal'
  | 'tanda_tangan_pejabat' | 'selesai' | 'perlu_perbaikan'
  | 'ditolak' | 'dibatalkan';

export type StatusApprover = 'pending' | 'waiting' | 'verified' | 'rejected';
export type SignOption = 'digsig' | 'qr_only' | 'ttd_basah' | 'tanpa_ttd';
export type MockRole = 'pemrakarsa' | 'legal' | 'pejabat';

export type JenisAksi =
  | 'kirim' | 'edit' | 'setuju' | 'tolak' | 'kembalikan'
  | 'mulai-legal' | 'kirim-approval-legal' | 'kembalikan-legal'
  | 'evaluasi' | 'simpan-blanko' | 'kirim-approval-blanko' | 'tanda-tangan';

export interface Persona {
  positionId?: string;
  persnum?: number;
  nama: string;
  jabatan: string;
}

export interface NaskahListItem {
  id: string;
  nomor: string | null;          // null saat konsep
  jenis: JenisNaskah;
  perihal: string;
  pemrakarsa: Persona;
  tahapan: Tahapan;
  butuhLegal: boolean;
  penandatangan: Persona;
  tanggal: string;               // YYYY-MM-DD
  terakhirDiubah: string;        // ISO datetime
}

export interface DokumenFile {
  id: string;
  nama: string;
  tipe: 'naskah' | 'naskah_fisik' | 'blanko_verbal' | 'pendukung';
  ukuran: string;                // "48 KB"
  tanggal?: string;
  status: 'terbaca' | 'final' | 'revisi' | 'belum_diunggah';
  parameter?: { nomor?: string; perihal?: string; tanggal?: string };
}

export type TahapApproval = 'persetujuan' | 'approval_legal' | 'approval_blanko' | 'approval_penandatangan';

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
  tanggal?: string;
}

export interface RiwayatRow {
  id: string;
  aksi: string;                  // 'kirim' | 'setuju' | 'tolak' | 'ttd' | ...
  aktor: string;
  jabatan: string;
  tahap: string;
  status: string;
  catatan?: string;
  tanggal: string;               // ISO datetime
}

export interface StepperStep { step: number; label: string; status: 'done' | 'active' | 'todo' | 'skip'; }

export interface NaskahDetail extends NaskahListItem {
  klasifikasi: string;
  sifat: string;                 // 'sangat_rahasia' | 'rahasia' | 'terbatas' | 'biasa' | 'terbuka'
  signOption: SignOption;
  approvalChain?: { positionId?: string; persnum?: number; nama: string; jabatan: string }[];
  fileUrl?: string | null;       // relative proxy path `/naskah-lainnya/:id/file` (bukan signed URL MinIO, untuk hindari CORS)
  dokumen: DokumenFile[];
  approval: ApprovalRow[];
  riwayat: RiwayatRow[];
  stepper: StepperStep[];
  availableActions: JenisAksi[]; // dihitung BE/mock dari role + tahapan
  // Daftar penandatangan (array). BE baru mengirim array.
  // `penandatangan` (inherited dari NaskahListItem) tetap dipertahankan untuk backward compat (item pertama).
  penandatanganList?: Penandatangan[];
}

export interface Penandatangan { positionId?: string; nama: string; jabatan: string; persnum?: number; }

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
  // Rantai approval berjenjang (approver ≠ penandatangan). Urutan array = urutan persetujuan.
  approval?: ApprovalItem[];
}

export interface ApprovalActionPayload { approvalId: string; catatan?: string; }

export interface EvaluasiPayload {
  sesuai: boolean;
  checklist: string[];           // id checklist yang tercentang
  catatan?: string;
}

export interface BlankoPayload {
  nomorVerbal: string;
  tanggal: string;
  perihal: string;
  dasarNaskah: string;
  catatan?: string;
}

export interface TandaTanganPayload { passphrase?: string; }

export interface ApiResponse<T> { success: boolean; data: T; }

export const TAHAPAN_STEP: Record<Tahapan, number> = {
  konsep: 1, persetujuan: 2, legal_drafting: 3, evaluasi: 4,
  tanda_tangan_pemrakarsa: 5, blanko_verbal: 6, tanda_tangan_legal: 7,
  tanda_tangan_pejabat: 8, selesai: 9,
  perlu_perbaikan: 1, ditolak: 0, dibatalkan: 0,
};

// Sumber kebenaran label jenis naskah — dipakai form (tulis) & detail, jangan duplikat.
export const JENIS_LABELS: Record<JenisNaskah, string> = {
  PER: 'Peraturan Direksi',
  KEP: 'Keputusan Direksi',
  INS: 'Instruksi Direksi',
  SPD: 'Surat Perintah Direksi',
  SED: 'Surat Edaran',
  SOP: 'SOP',
  KSB: 'Kesepakatan Bersama (NOTAM)',
  PKS: 'Perjanjian Kerja Sama',
  KTP: 'Kontrak Pengadaan',
  PJL: 'Perjanjian Lainnya',
  LOA: 'Letter of Agreement (LOA)',
  SKU: 'Surat Kuasa',
  BA: 'Berita Acara',
  SKE: 'Surat Keterangan',
  SPR: 'Surat Pengantar',
  RRA: 'Risalah Rapat',
  PUM: 'Pengumuman',
  PIA: 'Piagam (STI)',
  LAP: 'Laporan',
};
