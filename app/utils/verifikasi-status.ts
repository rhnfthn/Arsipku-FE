import type { VerifikasiStatus, JenisUsulan } from '~/types/verifikasi-usulan';

/** Badge class untuk status. */
export const verifikasiStatusBadge = (s: VerifikasiStatus): string => {
  const m: Record<string, string> = {
    DRAFT: 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300',
    // Menunggu Persetujuan (atasan sekretaris) = kuning
    MENUNGGU_VERIFIKASI_ATASAN: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DITOLAK_ATASAN: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_ATASAN: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DITOLAK_VERIFIKASI_TERAKHIR: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    // Menunggu Verifikasi (masuk TU) = biru
    DISETUJUI_VERIFIKASI_TERAKHIR: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    DIKIRIM: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    MENUNGGU_VERIFIKASI_BERKAS_FISIK: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    BERKAS_FISIK_TIDAK_SESUAI: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    BERKAS_FISIK_SESUAI: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    DITOLAK_PERSETUJUAN_TU: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_PERSETUJUAN_TU: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    // Menunggu Penerimaan (dari Atasan TU) = ungu
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    // Selesai = hijau
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    ARSIP_INAKTIF_DITERIMA: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    PENATAAN_ARSIP_INAKTIF: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
    SELESAI: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  };
  return `px-2 py-0.5 text-xs rounded-full font-medium ${m[s] || m.DRAFT}`;
};

/** Label status singkat. */
export const verifikasiStatusLabel = (s: VerifikasiStatus): string => {
  const m: Record<string, string> = {
    DRAFT: 'Draft',
    // Menunggu Persetujuan: atasan sekretaris approve berjenjang
    MENUNGGU_VERIFIKASI_ATASAN: 'Menunggu Persetujuan',
    DITOLAK_ATASAN: 'Tolak',
    DISETUJUI_ATASAN: 'Menunggu Persetujuan',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'Menunggu Persetujuan',
    DITOLAK_VERIFIKASI_TERAKHIR: 'Tolak',
    // Menunggu Verifikasi: verifikasi terakhir selesai, masuk TU
    DISETUJUI_VERIFIKASI_TERAKHIR: 'Menunggu Verifikasi',
    DIKIRIM: 'Menunggu Verifikasi',
    MENUNGGU_VERIFIKASI_BERKAS_FISIK: 'Menunggu Verifikasi',
    BERKAS_FISIK_TIDAK_SESUAI: 'Tolak',
    BERKAS_FISIK_SESUAI: 'Menunggu Verifikasi',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'Menunggu Verifikasi',
    DITOLAK_PERSETUJUAN_TU: 'Tolak',
    DISETUJUI_PERSETUJUAN_TU: 'Menunggu Verifikasi',
    // Menunggu Penerimaan: TU kirim ke Atasan TU
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'Menunggu Penerimaan',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'Tolak',
    // Selesai: Atasan TU setuju
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Selesai',
    ARSIP_INAKTIF_DITERIMA: 'Selesai',
    PENATAAN_ARSIP_INAKTIF: 'Selesai',
    SELESAI: 'Selesai',
  };
  return m[s] || s;
};

/** Badge class untuk jenis usulan. */
export const jenisBadgeClass = (j: JenisUsulan): string => {
  return j === 'aktif_ke_inaktif'
    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
    : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
};

/** Label jenis usulan. */
export const jenisLabel = (j: JenisUsulan): string => {
  return j === 'aktif_ke_inaktif' ? 'Aktif ke Inaktif' : 'Arsip Inaktif';
};

/** Format tanggal. */
export const formatVerifikasiDate = (d: string | Date | null): string => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};