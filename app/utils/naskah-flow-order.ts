export interface NaskahFlowItem {
  jenis?: string | null;
  nomor?: string | null;
  level?: number | null;
  tanggal?: string | Date | null;
  created_at?: string | Date | null;
  createdAt?: string | Date | null;
}

export const getKonsepSequence = (item: NaskahFlowItem): number | null => {
  if (String(item.jenis || '').toUpperCase() !== 'K') return null;

  const match = String(item.nomor || '').match(/^KONSEP-(\d+)$/i);
  return match ? Number(match[1]) : null;
};

const getTimestamp = (item: NaskahFlowItem): number => {
  const raw = item.created_at || item.createdAt || item.tanggal;
  if (!raw) return 0;

  const timestamp = new Date(raw).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

/**
 * Urutan presentasi timeline dari terbaru ke terlama:
 * naskah final -> KONSEP-n..1 -> disposisi lanjutan..awal.
 */
export const compareNaskahFlowNewestFirst = (a: NaskahFlowItem, b: NaskahFlowItem): number => {
  const aLevel = Number(a.level || 0);
  const bLevel = Number(b.level || 0);
  if (aLevel !== bLevel) return bLevel - aLevel;

  const aKonsepSequence = getKonsepSequence(a);
  const bKonsepSequence = getKonsepSequence(b);

  if (aKonsepSequence !== null && bKonsepSequence !== null) {
    if (aKonsepSequence !== bKonsepSequence) {
      return bKonsepSequence - aKonsepSequence;
    }
    return getTimestamp(b) - getTimestamp(a);
  }

  // Pada level yang sama, naskah hasil finalisasi berada di atas seluruh
  // snapshot konsep. Jenis KN adalah representasi final pada endpoint konsep.
  if (aKonsepSequence !== null) return 1;
  if (bKonsepSequence !== null) return -1;

  return getTimestamp(b) - getTimestamp(a);
};
