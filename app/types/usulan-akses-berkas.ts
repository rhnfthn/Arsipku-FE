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
  levelJabatan: LevelJabatan;
  urutan?: number;
  nama?: string;
  jabatan?: string;
  divisiId?: number;
  divisiNama?: string;
  bodTag?: string;
  isDelegasi?: boolean;
  positionStatus?: string | null;
  catatan?: string; // catatan personal dari SE pemberi (hanya terlihat oleh verifikator ini)
}

export interface VerificationStep {
  id: string;
  usulanId: string;
  verifierPersnum: number;
  verifierNama?: string;
  verifierJabatan?: string;
  roleTahap: string;
  urutanJenjang: 0 | 1 | 2 | 3;
  keputusan: Keputusan;
  catatan: string | null;
  catatanRevisi: string | null;
  checklist: Record<string, boolean>;
  verifiedAt: string;
}

export interface UsulanBerkasItem {
  id: string;
  usulanId: string;
  berkasId: string;
  jenisAksesGranted: string[];
  berlakuHingga: string;
  createdAt: string;
  // Enriched (dari join BE)
  judulBerkas?: string | null;
  kodeBerkas?: string | null;
  klasifikasiTeks?: string | null;
  berkasStatus?: string | null;
}

export interface UsulanAksesBerkas {
  id: string;
  nomorUsulan: string;
  jenisBerkas: JenisBerkas;
  pengusulPersnum: number;
  pengusulInfo?: { nama?: string; jabatan?: string };
  divisiPengusulId: number;
  divisiPengusulNama?: string;
  divisiPemberiId: number;
  divisiPemberiNama?: string;
  tujuanAkses: string;
  durasiAkses: DurasiPreset;
  durasiAksesDisetujui: DurasiPreset | null;
  catatanPerubahanDurasi: string | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  customTanggalSelesai: string | null;
  jenisAkses: string[];
  penerimaAksesTambahan: number[] | null;
  suratUsulanFileId: string | null;
  verifikatorPengusul: VerifikatorItem[];
  verifikatorPemberi: VerifikatorItem[] | null;
  status: StatusUsulan;
  catatanRevisiPengusul: string | null;
  catatanRevisiPemberi: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined (di findOne)
  steps?: VerificationStep[];
  selectedBerkas?: UsulanBerkasItem[];
}

export interface UsulanAksesBerkasListResponse {
  data: UsulanAksesBerkas[];
  total: number;
  page: number;
  limit: number;
}

// ── Payloads ──────────────────────────────────────

export interface CreateUsulanAksesBerkasPayload {
  jenisBerkas: JenisBerkas;
  divisiPemberiId?: number;
  tujuanAkses: string;
  durasiAkses: DurasiPreset;
  customTanggalSelesai?: string;
  jenisAkses: JenisAkses[];
  suratUsulanFileId?: string;
  verifikatorPengusul: { persnum: number; levelJabatan: LevelJabatan }[];
  penerimaAksesTambahan?: number[];
}

export interface VerifikasiPengusulPayload {
  catatan?: string;
  catatanRevisi?: string;
  keputusan: Keputusan;
}

export interface VerifikasiPemberiPayload {
  durasiAksesDisetujui: DurasiPreset;
  customTanggalSelesai?: string;
  catatanPerubahanDurasi?: string;
  catatan?: string;
  keputusan: Keputusan;
}

export interface PilihBerkasPayload {
  berkasIds: string[];
  catatanPenerusan?: string;
  verifikatorPemberi: { persnum: number; levelJabatan: LevelJabatan; catatan?: string }[];
}

export interface PersetujuanPemberiPayload {
  catatan?: string;
  catatanRevisi?: string;
  keputusan: Keputusan;
  durasiAksesDisetujui?: DurasiPreset;
  catatanPerubahanDurasi?: string;
}