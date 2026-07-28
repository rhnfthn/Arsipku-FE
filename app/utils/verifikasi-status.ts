import type { VerifikasiStatus, JenisUsulan } from '~/types/verifikasi-usulan';

/** Badge class untuk status. */
export const verifikasiStatusBadge = (s: VerifikasiStatus): string => {
  const m: Record<string, string> = {
    DRAFT: 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300',
    MENUNGGU_VERIFIKASI_ATASAN: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DITOLAK_ATASAN: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_ATASAN: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
    DITOLAK_VERIFIKASI_TERAKHIR: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    DIKIRIM: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    MENUNGGU_VERIFIKASI_BERKAS_FISIK: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    BERKAS_FISIK_TIDAK_SESUAI: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    BERKAS_FISIK_SESUAI: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DITOLAK_PERSETUJUAN_TU: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_PERSETUJUAN_TU: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    ARSIP_INAKTIF_DITERIMA: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    PENATAAN_ARSIP_INAKTIF: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    SELESAI: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  };
  return `px-2 py-0.5 text-xs rounded-full font-medium ${m[s] || m.DRAFT}`;
};

/** Label status singkat. */
export const verifikasiStatusLabel = (s: VerifikasiStatus): string => {
  const m: Record<string, string> = {
    DRAFT: 'Draft',
    MENUNGGU_VERIFIKASI_ATASAN: 'Menunggu Verifikasi',
    DITOLAK_ATASAN: 'Ditolak',
    DISETUJUI_ATASAN: 'Disetujui Atasan',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'Menunggu Verifikasi Terakhir',
    DITOLAK_VERIFIKASI_TERAKHIR: 'Ditolak Verifikasi Terakhir',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'Disetujui Verifikasi Terakhir',
    DIKIRIM: 'Dikirim',
    MENUNGGU_VERIFIKASI_BERKAS_FISIK: 'Menunggu Verifikasi Berkas',
    BERKAS_FISIK_TIDAK_SESUAI: 'Berkas Tidak Sesuai',
    BERKAS_FISIK_SESUAI: 'Berkas Sesuai',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'Menunggu Persetujuan TU',
    DITOLAK_PERSETUJUAN_TU: 'Ditolak TU',
    DISETUJUI_PERSETUJUAN_TU: 'Disetujui TU',
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'Menunggu Persetujuan Terakhir TU',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'Ditolak Final TU',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Disetujui Final TU',
    ARSIP_INAKTIF_DITERIMA: 'Arsip Diterima',
    PENATAAN_ARSIP_INAKTIF: 'Penataan',
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