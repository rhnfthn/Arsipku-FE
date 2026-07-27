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

export type LevelJabatan = 'AVP' | 'VP' | 'EVP';

export interface VerifikatorItem {
  persnum: number;
  levelJabatan: LevelJabatan;
  urutan?: 1 | 2 | 3;
  nama?: string;
  jabatan?: string;
  divisiId?: number;
  divisiNama?: string;
}

export interface VerificationStep {
  id: string;
  usulanId: string;
  verifierPersnum: number;
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
}

export interface UsulanAksesBerkas {
  id: string;
  nomorUsulan: string;
  jenisBerkas: JenisBerkas;
  pengusulPersnum: number;
  divisiPengusulId: number;
  divisiPemberiId: number;
  tujuanAkses: string;
  durasiAkses: DurasiPreset;
  durasiAksesDisetujui: DurasiPreset | null;
  catatanPerubahanDurasi: string | null;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
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
  kelengkapanBerkas: boolean;
  kesesuaianTujuan: boolean;
  periodeWajar: boolean;
  suratSah: boolean;
  tidakDuplikasi: boolean;
  catatan?: string;
  catatanRevisi?: string;
  keputusan: Keputusan;
}

export interface VerifikasiPemberiPayload {
  berkasTersedia: boolean;
  tidakAdaPembatasan: boolean;
  tujuanMemadai: boolean;
  tidakBentrokRetensi: boolean;
  disetujuiLanjut: boolean;
  durasiAksesDisetujui: DurasiPreset;
  catatanPerubahanDurasi?: string;
  catatan?: string;
  keputusan: Keputusan;
}

export interface PilihBerkasPayload {
  berkasIds: string[];
  catatanPenerusan?: string;
  verifikatorPemberi: { persnum: number; levelJabatan: LevelJabatan }[];
}

export interface PersetujuanPemberiPayload {
  berkasSesuai: boolean;
  tidakMelanggarKebijakan: boolean;
  peminjamanTidakBerlebihan: boolean;
  sudahDiverifikasiSekretaris: boolean;
  disetujuiDiberikan: boolean;
  catatan?: string;
  catatanRevisi?: string;
  keputusan: Keputusan;
}