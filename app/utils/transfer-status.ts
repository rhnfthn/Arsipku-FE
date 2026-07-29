import type { TransferActiveToInactiveStatus } from '~/types/transfer-active-to-inactive';

/** Mapping status ke kelas badge Tailwind. */
export const statusBadgeClass = (s: TransferActiveToInactiveStatus): string => {
  const m: Record<string, string> = {
    DRAFT: 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300',
    MENUNGGU_VERIFIKASI_ATASAN: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DITOLAK_ATASAN: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_ATASAN: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    DITOLAK_VERIFIKASI_TERAKHIR: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    USUL_PINDAH_DIKIRIM: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    SIAPKAN_BERKAS_FISIK: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    DIKIRIM: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    MENUNGGU_VERIFIKASI_BERKAS_FISIK: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    BERKAS_FISIK_TIDAK_SESUAI: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    BERKAS_FISIK_SESUAI: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    DITOLAK_PERSETUJUAN_TU: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_PERSETUJUAN_TU: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    ARSIP_INAKTIF_DITERIMA: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    PENATAAN_ARSIP_INAKTIF: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    SELESAI: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  };
  return `px-2 py-0.5 text-xs rounded-full font-medium ${m[s] || m.DRAFT}`;
};

/** Label status yang lebih singkat untuk badge. */
export const statusLabel = (s: TransferActiveToInactiveStatus): string => {
  const m: Record<string, string> = {
    DRAFT: 'Draft',
    MENUNGGU_VERIFIKASI_ATASAN: 'Menunggu Persetujuan',
    DITOLAK_ATASAN: 'Tolak',
    DISETUJUI_ATASAN: 'Menunggu Verifikasi',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'Menunggu Verifikasi',
    DITOLAK_VERIFIKASI_TERAKHIR: 'Tolak',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'Menunggu Penerimaan',
    USUL_PINDAH_DIKIRIM: 'Menunggu Penerimaan',
    SIAPKAN_BERKAS_FISIK: 'Menunggu Penerimaan',
    DIKIRIM: 'Menunggu Penerimaan',
    MENUNGGU_VERIFIKASI_BERKAS_FISIK: 'Menunggu Penerimaan',
    BERKAS_FISIK_TIDAK_SESUAI: 'Tolak',
    BERKAS_FISIK_SESUAI: 'Menunggu Penerimaan',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'Menunggu Penerimaan',
    DITOLAK_PERSETUJUAN_TU: 'Tolak',
    DISETUJUI_PERSETUJUAN_TU: 'Menunggu Penerimaan',
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'Menunggu Penerimaan',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'Tolak',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Selesai',
    ARSIP_INAKTIF_DITERIMA: 'Selesai',
    PENATAAN_ARSIP_INAKTIF: 'Selesai',
    SELESAI: 'Selesai',
  };
  return m[s] || s;
};

/** Format tanggal ke format id-ID. */
export const formatDate = (d: string | Date | null): string => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};