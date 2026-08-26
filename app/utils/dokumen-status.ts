// Label & warna status dokumen (DokumenFile.status) — dipakai list dokumen di
// halaman detail naskah dan NaskahVersiTimeline. Warna selaras antar keduanya.
export const DOKUMEN_STATUS: Record<string, { label: string; chip: string; dot: string }> = {
  dittd: { label: 'Ditandatangani', chip: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400', dot: 'bg-green-600' },
  revisi: { label: 'Revisi', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', dot: 'bg-amber-500' },
  draf: { label: 'Draft', chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400', dot: 'bg-blue-500' },
  final: { label: 'Final', chip: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', dot: 'bg-gray-400' },
  terbaca: { label: 'Terbaca', chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400', dot: 'bg-sky-500' },
  belum_diunggah: { label: 'Belum Diunggah', chip: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400', dot: 'bg-gray-300 dark:bg-gray-600' },
};

export function dokumenStatusMeta(status?: string) {
  return DOKUMEN_STATUS[status ?? ''] ?? null;
}
