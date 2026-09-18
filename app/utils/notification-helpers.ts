export const resolveNotificationIcon = (type: string, data?: Record<string, any> | null): string => {
  if (data?.category === 'SDE_MASAL') {
    if (data.status === 'DIKEMBALIKAN') return 'i-lucide-rotate-ccw';
    if (data.action === 'OPEN_SDE_MASAL_VERIFIKASI') return 'i-lucide-folder-check';
    return 'i-lucide-folder';
  }

  const map: Record<string, string> = {
    NASKAH_MASUK: 'i-lucide-mail',
    NASKAH_TEMBUSAN: 'i-lucide-mails',
    DISPOSISI: 'i-lucide-forward',
    DISPOSISI_SELESAI: 'i-lucide-check-circle',
    KONSEP_DISETUJUI: 'i-lucide-file-check',
    KONSEP_DITOLAK: 'i-lucide-file-x',
    PENOMORAN_USULAN: 'i-lucide-hash',
    PENOMORAN_PERSETUJUAN: 'i-lucide-check-square',
    PENOMORAN_VERIFIKASI: 'i-lucide-shield-check',
    PENOMORAN_SELESAI: 'i-lucide-check-circle',
    PENOMORAN_DITOLAK: 'i-lucide-x-circle',
    DIGSIG_VERIFIKASI: 'i-lucide-shield-check',
    DIGSIG_TANDA_TANGAN: 'i-lucide-pen-tool',
    DIGSIG_SELESAI: 'i-lucide-check-circle',
    DIGSIG_DITOLAK: 'i-lucide-x-circle',
    NASKAH_DINAS_VERIFIKATOR: 'i-lucide-file-check-2',
    NASKAH_DINAS_VERIFIKASI_SELESAI: 'i-lucide-check-circle',
    NASKAH_DINAS_DITOLAK: 'i-lucide-x-circle',
    DELEGASI: 'i-lucide-users',
    SYSTEM: 'i-lucide-megaphone',
    TUGAS_MEMBER_ADDED: 'i-lucide-user-plus',
    TUGAS_ASSIGNED: 'i-lucide-list-todo',
    TUGAS_DONE: 'i-lucide-circle-check-big',
    TUGAS_DUE: 'i-lucide-alarm-clock',
    TUGAS_TAGGED: 'i-lucide-at-sign',
  };

  return map[type] || 'i-lucide-bell';
};

export const formatNotificationTime = (iso: string): string => {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;

    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;

    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

export const formatNotificationDateTime = (iso: string): string => {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

/**
 * Get the start of the week (Monday) for a given date.
 */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Format a week label: "1 Jul - 7 Jul 2025" or "This Week" / "Last Week".
 */
export const formatWeekLabel = (weekStart: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisWeekStart = getWeekStart(today);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  if (weekStart.getTime() === thisWeekStart.getTime()) return 'Minggu Ini';
  if (weekStart.getTime() === lastWeekStart.getTime()) return 'Minggu Lalu';

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();
  const sameMonth = sameYear && weekStart.getMonth() === weekEnd.getMonth();

  const fmtShort = (d: Date) =>
    d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const fmtFull = (d: Date) =>
    d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  if (sameMonth) {
    return `${weekStart.getDate()} - ${fmtFull(weekEnd)}`;
  }
  if (sameYear) {
    return `${fmtShort(weekStart)} - ${fmtFull(weekEnd)}`;
  }
  return `${fmtFull(weekStart)} - ${fmtFull(weekEnd)}`;
};

/**
 * Group notifications by week (Monday as start of week).
 * Returns an array of { label, items } sorted newest first.
 */
export const groupNotificationsByWeek = <T extends { createdAt: string }>(
  notifications: T[]
): { label: string; items: T[] }[] => {
  const groups = new Map<string, { label: string; items: T[] }>();

  for (const item of notifications) {
    const date = new Date(item.createdAt);
    if (isNaN(date.getTime())) continue;

    const weekStart = getWeekStart(date);
    const key = weekStart.toISOString();

    if (!groups.has(key)) {
      groups.set(key, {
        label: formatWeekLabel(weekStart),
        items: [],
      });
    }
    groups.get(key)!.items.push(item);
  }

  // Sort by week start descending (newest first)
  return Array.from(groups.values()).sort((a, b) => {
    const aDate = new Date(a.items[0].createdAt);
    const bDate = new Date(b.items[0].createdAt);
    return bDate.getTime() - aDate.getTime();
  });
};
