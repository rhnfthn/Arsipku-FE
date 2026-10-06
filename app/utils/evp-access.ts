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
} | null | undefined): boolean => {
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
