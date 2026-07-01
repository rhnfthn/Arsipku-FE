export const resolveNotificationIcon = (type: string): string => {
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
