/**
 * Render prefix delegasi (PT./PH./PS.) pada position_text penerima —
 * mirror dari helper BE (delegasi-rendering.helper.ts formatDelegatedPositionText)
 * agar pratinjau surat di FE identik dengan preview/final PDF dari BE.
 *
 * Dipakai untuk label penerima (tertuju/tembusan) di form tulis korespondensi:
 * bila posisi penerima sedang didelegasikan, label jabatannya diawali prefix
 * status delegasi, mis. "PT. EVP of PMO".
 */

const DELEGATED_ACTORS = new Set(['PT', 'PH', 'PS']);

/** Deteksi status delegasi dari field position_status/positionStatus (case-insensitive). */
export function isDelegatedPosition(source: {
  position_status?: string | null;
  positionStatus?: string | null;
}): boolean {
  const status = String(source?.position_status ?? source?.positionStatus ?? '')
    .trim()
    .toUpperCase();
  return DELEGATED_ACTORS.has(status);
}

/**
 * Tambahkan prefix delegasi ke position_text bila posisi sedang didelegasikan.
 * Tidak menambah prefix bila sudah ada (mis. "PT. ..." dari data BE).
 */
export function formatDelegatedPositionText(
  basePositionText: string | null | undefined,
  source: { position_status?: string | null; positionStatus?: string | null },
): string {
  const status = String(source?.position_status ?? source?.positionStatus ?? '')
    .trim()
    .toUpperCase();
  const positionText = String(basePositionText ?? '').trim();
  if (!DELEGATED_ACTORS.has(status) || !positionText) return positionText;
  return new RegExp(`^${status}\\.\\s*`, 'i').test(positionText)
    ? positionText
    : `${status}. ${positionText}`;
}
