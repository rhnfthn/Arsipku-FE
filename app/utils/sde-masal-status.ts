export const sdeMasalStatusLabel = (status: string) => ({
  DRAFT: 'Draft',
  MENUNGGU: 'Menunggu',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  MENUNGGU_PENGIRIM: 'Menunggu Pengirim',
  DIFINALISASI: 'Difinalisasi',
  SEBAGIAN_TERKIRIM: 'Sebagian Terkirim',
  TERKIRIM: 'Selesai',
  DIKEMBALIKAN: 'Dikembalikan',
  TERVERIFIKASI: 'Disetujui',
  DITOLAK: 'Ditolak',
  GAGAL: 'Gagal',
}[status] || status);

export const sdeMasalStatusBadge = (status: string) => ({
  DRAFT: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap dark:bg-gray-700 dark:text-gray-300',
  MENUNGGU: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium whitespace-nowrap dark:bg-yellow-900/40 dark:text-yellow-300',
  MENUNGGU_VERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium whitespace-nowrap dark:bg-indigo-900/40 dark:text-indigo-300',
  MENUNGGU_PENGIRIM: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium whitespace-nowrap dark:bg-blue-900/40 dark:text-blue-300',
  DIFINALISASI: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  SEBAGIAN_TERKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 font-medium whitespace-nowrap dark:bg-amber-900/40 dark:text-amber-300',
  TERKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  DIKEMBALIKAN: 'px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700 font-medium whitespace-nowrap dark:bg-orange-900/40 dark:text-orange-300',
  TERVERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  DITOLAK: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap dark:bg-red-900/40 dark:text-red-400',
  GAGAL: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap dark:bg-red-900/40 dark:text-red-400',
}[status] || 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap');
