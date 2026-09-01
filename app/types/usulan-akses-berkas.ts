/**
 * Types untuk Usulan Akses Berkas
 * Mirror BE enums (src/modules/usulan-akses-berkas/enums)
 */

export enum StatusUsulan {
  DRAFT = 'DRAFT',
  MENUNGGU_VERIFIKASI_PENGUSUL = 'MENUNGGU_VERIFIKASI_PENGUSUL',
  MENUNGGU_VERIFIKASI_AKHIR_PENGUSUL = 'MENUNGGU_VERIFIKASI_AKHIR_PENGUSUL',
  MENUNGGU_VERIFIKASI_EVP_PENGUSUL = 'MENUNGGU_VERIFIKASI_EVP_PENGUSUL',
  REVISI_PENGUSUL = 'REVISI_PENGUSUL',
  DITOLAK_PENGUSUL = 'DITOLAK_PENGUSUL',
  TERKIRIM_KE_PEMBERI = 'TERKIRIM_KE_PEMBERI',
  MENUNGGU_VERIFIKASI_PEMBERI = 'MENUNGGU_VERIFIKASI_PEMBERI',
  PEMILIHAN_BERKAS = 'PEMILIHAN_BERKAS',
  MENUNGGU_PERSETUJUAN_PEMBERI = 'MENUNGGU_PERSETUJUAN_PEMBERI',
  MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI = 'MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI',
  MENUNGGU_PERSETUJUAN_EVP_PEMBERI = 'MENUNGGU_PERSETUJUAN_EVP_PEMBERI',
  REVISI_PEMBERI = 'REVISI_PEMBERI',
  DITOLAK_PEMBERI = 'DITOLAK_PEMBERI',
  AKSES_DITERBITKAN = 'AKSES_DITERBITKAN',
  SELESAI = 'SELESAI',
  AKSES_KADALUARSA = 'AKSES_KADALUARSA',
}

export enum JenisBerkas {
  AKTIF = 'AKTIF',
  INAKTIF = 'INAKTIF',
}

export enum DurasiPreset {
  TUJUH_HARI = '7_HARI',
  EMPAT_BELAS_HARI = '14_HARI',
  SATU_BULAN = '1_BULAN',
  DUA_BULAN = '2_BULAN',
  TIGA_BULAN = '3_BULAN',
  ENAM_BULAN = '6_BULAN',
  SATU_TAHUN = '1_TAHUN',
  CUSTOM = 'CUSTOM',
}

export enum JenisAkses {
  LIHAT = 'LIHAT',
  UNDUH = 'UNDUH',
  CETAK = 'CETAK',
}

export enum Keputusan {
  SETUJU = 'SETUJU',
  TOLAK = 'TOLAK',
  REVISI = 'REVISI',
  LANJUT = 'LANJUT',
}

export type LevelJabatan = 'AVP' | 'VP' | 'EVP' | 'BOD' | 'BOD-1' | 'BOD-2' | 'BOD-3';

export interface VerifikatorItem {
  persnum: number;
  level_jabatan: LevelJabatan;
  urutan?: number;
  nama?: string;
  jabatan?: string;
  divisi_id?: number;
  divisi_nama?: string;
  bod_tag?: string;
  is_delegasi?: boolean;
  position_status?: string | null;
  catatan?: string; // catatan personal dari SE pemberi (hanya terlihat oleh verifikator ini)
}

export interface PenerimaAksesTambahan {
  persnum: number;
  nama: string | null;
  jabatan: string | null;
  divisi_nama: string | null;
}

export interface VerificationStep {
  id: string;
  usulan_id: string;
  verifier_persnum: number;
  verifier_nama?: string;
  verifier_jabatan?: string;
  role_tahap: string;
  urutan_jenjang: 0 | 1 | 2 | 3;
  keputusan: Keputusan;
  catatan: string | null;
  catatan_revisi: string | null;
  catatan_ke_se: string | null; // catatan khusus dari verifikator ke SE-nya
  checklist: Record<string, boolean>;
  verified_at: string;
}

export interface UsulanBerkasItem {
  id: string;
  usulan_id: string;
  berkas_id: string;
  jenis_akses_granted: string[];
  berlaku_hingga: string;
  created_at: string;
  // Enriched (dari join BE)
  judul_berkas?: string | null;
  kode_berkas?: string | null;
  klasifikasi_teks?: string | null;
  berkas_status?: string | null;
}

export interface UsulanAksesBerkas {
  id: string;
  nomor_usulan: string;
  jenis_berkas: JenisBerkas;
  pengusul_persnum: number;
  pengusul_info?: { nama?: string; jabatan?: string };
  divisi_pengusul_id: number;
  divisi_pengusul_nama?: string;
  divisi_pemberi_id: number;
  divisi_pemberi_nama?: string;
  tujuan_akses: string;
  durasi_akses: DurasiPreset;
  durasi_akses_disetujui: DurasiPreset | null;
  catatan_perubahan_durasi: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  custom_tanggal_selesai: string | null;
  jenis_akses: string[];
  penerima_akses_tambahan: PenerimaAksesTambahan[] | null;
  surat_usulan_file_id: string | null;
  verifikator_pengusul: VerifikatorItem[];
  verifikator_pemberi: VerifikatorItem[] | null;
  status: StatusUsulan;
  catatan_revisi_pengusul: string | null;
  catatan_revisi_pemberi: string | null;
  created_at: string;
  updated_at: string;
  // Joined (di findOne)
  steps?: VerificationStep[];
  selected_berkas?: UsulanBerkasItem[];
  // Tracking viewed oleh user saat ini (untuk badge notifikasi).
  // true = sudah dibuka/dilihat; false = belum.
  is_viewed_by_me?: boolean;
}

export interface UsulanAksesBerkasListResponse {
  data: UsulanAksesBerkas[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateUsulanAksesBerkasPayload {
  jenis_berkas: JenisBerkas;
  divisi_pemberi_id?: number;
  judul_usulan: string;
  tujuan_akses: string;
  durasi_akses: DurasiPreset;
  custom_tanggal_selesai?: string;
  jenis_akses: JenisAkses[];
  surat_usulan_file_id?: string;
  verifikator_pengusul: { persnum: number; level_jabatan: LevelJabatan; catatan?: string }[];
  penerima_akses_tambahan?: number[];
}

export interface VerifikasiPengusulPayload {
  catatan?: string;
  catatan_revisi?: string;
  catatan_ke_se?: string; // catatan khusus dari verifikator ke SE pengusul
  keputusan: Keputusan;
}

export interface VerifikasiPemberiPayload {
  durasi_akses_disetujui: DurasiPreset;
  custom_tanggal_selesai?: string;
  catatan_perubahan_durasi?: string;
  catatan?: string;
  keputusan: Keputusan;
}

export interface PilihBerkasPayload {
  berkas_ids: string[];
  catatan_penerusan?: string;
  verifikator_pemberi: { persnum: number; level_jabatan: LevelJabatan; catatan?: string }[];
}

export interface PersetujuanPemberiPayload {
  catatan?: string;
  catatan_revisi?: string;
  catatan_ke_se?: string; // catatan khusus dari verifikator ke SE pemberi
  keputusan: Keputusan;
  durasi_akses_disetujui?: DurasiPreset;
  catatan_perubahan_durasi?: string;
}