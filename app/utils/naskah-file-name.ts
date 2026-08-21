/**
 * Nama file naskah kanonik — konsisten di SEMUA halaman (display, download) dan
 * object storage (BE memakai rumus yang sama).ponytail: slug perihal/jenis +
 * 8 char id → unik per naskah, aman sebagai nama file.
 *
 * Harus identik dengan rumus di BE (naskah-lainnya.service.ts uploadDokumen).
 */
export function naskahFileName(detail: { perihal?: string | null; jenis?: string | null; id?: string | null } | null | undefined): string {
  const slug = (s: unknown) => {
    const v = String(s ?? '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
    return v || 'naskah';
  };
  const base = slug(detail?.perihal || detail?.jenis || 'naskah');
  const suffix = String(detail?.id ?? '').slice(0, 8) || 'draft';
  return `${base}-${suffix}.docx`;
}