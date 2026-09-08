/**
 * Nama file naskah kanonik — konsisten di SEMUA halaman (display, download) dan
 * object storage (BE memakai rumus yang sama).
 *
 * Format: {JENIS}-{NOMOR}-{slug-perihal}.docx
 * - jenis uppercase (PER, KEP, BAC, …)
 * - nomor: '/' → '-' (unsafe di nama file); kosong/placeholder → DRAFT
 * - perihal: slug lowercase, max 40 char; kosong → 'naskah'
 *
 * Harus identik dengan rumus di BE (naskah-lainnya.service.ts buildNaskahFileName).
 */
export function naskahFileName(
  detail: {
    perihal?: string | null;
    jenis?: string | null;
    id?: string | null;
    nomor?: string | null;
  } | null | undefined,
  ext = 'docx',
): string {
  const slug = (s: unknown, max = 40) => {
    const v = String(s ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, max);
    return v;
  };
  const jenisKode = String(detail?.jenis ?? '').toUpperCase() || 'NASKAH';
  const nomorRaw = String(detail?.nomor ?? '').trim();
  const isPlaceholder = !nomorRaw || /\{\{.*\}\}/.test(nomorRaw);
  const nomorSlug = isPlaceholder
    ? 'DRAFT'
    : nomorRaw.replace(/[^A-Za-z0-9.\-]+/g, '-').replace(/^-+|-+$/g, '');
  const perihalSlug = slug(detail?.perihal) || 'naskah';
  return `${jenisKode}-${nomorSlug}-${perihalSlug}.${ext}`;
}

/**
 * Ekstensi file sesuai tipe blob hasil unduhan naskah.
 * Endpoint ?preview=1 dan artifact signed (TTD fisik) mengembalikan PDF;
 * endpoint tanpa preview mengembalikan DOCX (atau PDF bila signed).
 * Deteksi dari mimetype blob agar a.download tidak salah ekstensi
 * (PDF tersimpan sebagai .docx → isi tampak rusak).
 */
export function naskahFileExtFromBlob(blob: Blob | null | undefined): 'pdf' | 'docx' {
  const type = String(blob?.type ?? '').toLowerCase();
  if (type.includes('pdf')) return 'pdf';
  if (type.includes('word') || type.includes('officedocument')) return 'docx';
  return 'docx';
}
