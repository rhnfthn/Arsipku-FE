/**
 * URL foto profile pegawai AirNav — dengan fallback berantai.
 *
 * Sumber utama (e-chain) — filename = persnum lengkap:
 *   https://e-chain.airnavindonesia.co.id/resources/pegawai/dokumen/{persnum}/{persnum}.jpg
 * Fallback (PPID, metode sebelumnya) — filename = 5 digit terakhir persnum:
 *   https://ppid.airnavindonesia.co.id/resources/pegawai/dokumen/{persnum}/{5 digit terakhir}.jpg
 *
 * Contoh persnum 10010105:
 *   e-chain → .../dokumen/10010105/10010105.jpg
 *   PPID    → .../dokumen/10010105/10105.jpg
 *
 * getProfilePhotoUrl() mengembalikan URL sumber utama (null bila persnum
 * tidak valid). getProfilePhotoFallbackUrl() mengembalikan URL fallback —
 * dipakai komponen saat gambar utama gagal load, sebelum akhirnya jatuh
 * ke inisial nama.
 */
const ECHAIN_PHOTO_BASE = 'https://e-chain.airnavindonesia.co.id/resources/pegawai/dokumen';
const PPID_PHOTO_BASE = 'https://ppid.airnavindonesia.co.id/resources/pegawai/dokumen';

const isValidPersnum = (persnum: string | number | null | undefined): string | null => {
  const raw = String(persnum ?? '').trim();
  if (!raw || !/^\d+$/.test(raw)) return null;
  return raw;
};

/** URL foto dari sumber utama (e-chain, persnum lengkap). Null bila persnum tidak valid. */
export const getProfilePhotoUrl = (persnum: string | number | null | undefined): string | null => {
  const raw = isValidPersnum(persnum);
  if (!raw) return null;
  return `${ECHAIN_PHOTO_BASE}/${raw}/${raw}.jpg`;
};

/**
 * URL foto fallback (PPID — 5 digit terakhir persnum).
 * Null bila persnum tidak valid.
 */
export const getProfilePhotoFallbackUrl = (
  persnum: string | number | null | undefined,
): string | null => {
  const raw = isValidPersnum(persnum);
  if (!raw) return null;
  return `${PPID_PHOTO_BASE}/${raw}/${raw.slice(-5)}.jpg`;
};
