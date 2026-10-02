// ── Progress bar durasi akses berkas ─────────────────────────────
// tanggal_mulai/tanggal_selesai tersimpan sebagai DATE (tanpa jam) di DB,
// jadi progress dihitung berbasis hari kalender (midnight-to-midnight):
// hari penerbitan = 0%, hari tanggal_selesai = 100%.
// Cek status hanya berlaku untuk row usulan (punya field `status`).
// Row entitlement (halaman Pemberian) tidak punya `status` — aksesnya
// pasti sudah diterbitkan, jadi langsung dihitung dari tanggal.

export const AKSES_BERJALAN_STATUSES = ['AKSES_DITERBITKAN', 'SELESAI'];

export function getAksesProgressPercent(
  row: { status?: string; tanggal_mulai?: string | null; tanggal_selesai?: string | null },
  now: number = Date.now(),
): number {
  if (row.status && !AKSES_BERJALAN_STATUSES.includes(row.status)) return 0;
  if (!row.tanggal_mulai || !row.tanggal_selesai) return 0;
  const mulai = new Date(row.tanggal_mulai);
  mulai.setHours(0, 0, 0, 0);
  const selesai = new Date(row.tanggal_selesai);
  selesai.setHours(23, 59, 59, 999);
  const t = new Date(now);
  if (t <= mulai) return 0;
  if (t >= selesai) return 100;
  return Math.round(((t.getTime() - mulai.getTime()) / (selesai.getTime() - mulai.getTime())) * 100);
}

export function getAksesProgressBarClass(percent: number): string {
  if (percent < 50) return 'bg-green-500';
  if (percent < 80) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function getAksesProgressLabel(
  row: { status?: string; tanggal_mulai?: string | null; tanggal_selesai?: string | null },
  now: number = Date.now(),
): string {
  if (row.status && !AKSES_BERJALAN_STATUSES.includes(row.status)) return '-';
  const percent = getAksesProgressPercent(row, now);
  if (percent >= 100) return 'Habis';
  if (!row.tanggal_selesai) return '-';
  const selesai = new Date(row.tanggal_selesai);
  selesai.setHours(23, 59, 59, 999);
  const sisa = Math.ceil((selesai.getTime() - now) / (1000 * 60 * 60 * 24));
  if (sisa <= 0) return 'Habis';
  return `${sisa} hari`;
}