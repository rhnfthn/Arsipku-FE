/**
 * Akses halaman BAC hanya untuk EVP dan jabatan di atasnya.
 *
 * Sumber profil tidak selalu konsisten: sebagian akun memakai `bodTag`,
 * sebagian hanya mengisi `positionText`, dan sebagian mengisi singkatan pada
 * `abbreviation`. Semua bentuk tersebut dinormalisasi di satu tempat agar
 * sidebar dan middleware menghasilkan keputusan yang sama.
 */
export const isEvpOrAbovePosition = (user: {
  bodTag?: unknown;
  positionText?: unknown;
  abbreviation?: unknown;
  position_status?: unknown;
  positionStatus?: unknown;
  active_profile?: unknown;
  activeProfile?: unknown;
} | null | undefined): boolean => {
  // Jangan gunakan jabatan dari konteks delegasi (contoh: `SE. EVP ...`)
  // untuk memberi akses BAC kepada staff yang sedang bertindak sebagai
  // Sekretaris. Penandatanganan dan Tembusan BAC hanya untuk akun asli EVP+
  // dan tidak tampil pada profile delegasi Sekretaris.
  const positionStatus = String(
    user?.position_status ?? user?.positionStatus ?? '',
  ).trim().toUpperCase();
  const activeProfile = String(
    user?.active_profile ?? user?.activeProfile ?? '',
  ).trim().toLowerCase();
  if (activeProfile === 'sekretaris' || (positionStatus && positionStatus !== 'YBS')) {
    return false;
  }

  const bodTag = String(user?.bodTag ?? '').trim().toUpperCase();
  if (bodTag === 'BOD' || bodTag === 'BOD-1') return true;

  const positionText = String(user?.positionText ?? '').trim().toUpperCase();
  const abbreviation = String(user?.abbreviation ?? '').trim().toUpperCase();

  if (abbreviation === 'EVP' || abbreviation === 'BOD' || abbreviation === 'DIRUT') {
    return true;
  }

  return /\b(EVP|EXECUTIVE VICE PRESIDENT|DIREKTUR|DIRUT|DIRECTOR|CEO|PRESIDEN|PRESIDENT|BOD)\b/.test(
    positionText,
  );
};
