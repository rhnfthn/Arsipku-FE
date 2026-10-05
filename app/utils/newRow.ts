/**
 * Helper untuk menandai baris data terbaru di tabel menu Kelola.
 * Baris terbaru = dibuat/diupdate dalam 24 jam terakhir → tampil bold.
 */

/** Ambil timestamp terbaik dari item (fallback berurutan). */
export const getLatestTimestamp = (item: any): string | null => {
  const candidates = [
    item?.updatedAt,
    item?.updated_at,
    item?.createdAt,
    item?.created_at,
    item?.tanggalDikirim,
    item?.tanggal_dikirim,
    item?.tanggalUsulan,
    item?.tanggal_usulan,
    item?.tanggal_pengajuan,
    item?.tanggalUsulanStr,
  ];
  for (const c of candidates) {
    if (c) {
      const t = new Date(c).getTime();
      if (!Number.isNaN(t) && t > 0) return new Date(t).toISOString();
    }
  }
  return null;
};

/**
 * Cek apakah item adalah data terbaru (dalam 24 jam terakhir).
 * Item tanpa timestamp dianggap bukan terbaru.
 */
export const isNewRow = (item: any, windowMs = 24 * 60 * 60 * 1000): boolean => {
  const ts = getLatestTimestamp(item);
  if (!ts) return false;
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= windowMs;
};

/** Class tambahan untuk baris terbaru (bold). */
export const newRowClass = (item: any): string => (isNewRow(item) ? 'font-bold' : '');
