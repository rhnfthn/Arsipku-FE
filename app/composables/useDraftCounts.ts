import { ref } from 'vue';

/**
 * useDraftCounts
 *
 * Badge count draf di sidebar — pola sama dengan useUsulanAksesBerkasCounts.
 * State module-scope (singleton) agar Sidebar dan halaman lain memakai ref sama.
 *
 * - Korespondensi: GET /draft/list?limit=1 → summary.total_semua
 *   (endpoint mengembalikan summary count per jenis tanpa memuat item).
 * - Naskah Lainnya: GET /naskah-lainnya?tab=mine&tahapan=konsep → panjang array
 *   (endpoint list draf naskah lainnya belum punya endpoint count khusus).
 */
const korespondensiDraftCount = ref(0);
const naskahLainnyaDraftCount = ref(0);
const isLoading = ref(false);
let lastFetchedAt = 0;
let realtimeSubscribed = false;
const CACHE_TTL_MS = 60_000; // 1 menit — badge tidak perlu realtime ketat.

export const useDraftCounts = () => {
  const { get, apiGet } = useApi();

  const fetchCounts = async (force = false) => {
    if (!import.meta.client) return;
    if (!force && Date.now() - lastFetchedAt < CACHE_TTL_MS) return;
    if (isLoading.value) return;

    isLoading.value = true;
    try {
      // Korespondensi: cukup limit=1 — summary tetap dihitung server untuk
      // seluruh draf (tanpa filter jenis).
      const res = await get<any>('/draft/list', {
        params: { page: 1, limit: 1 },
      });
      const summary = res?.summary ?? null;
      korespondensiDraftCount.value = Number(summary?.total_semua ?? 0);

      // Naskah Lainnya: draf = tab mine + tahapan konsep.
      const nl = await apiGet<any>(
        '/naskah-lainnya',
        { params: { tab: 'mine', tahapan: 'konsep' } },
        { skipCache: true }
      );
      const rows = (nl?.data ?? nl) as unknown[];
      naskahLainnyaDraftCount.value = Array.isArray(rows) ? rows.length : 0;

      lastFetchedAt = Date.now();
    } catch {
      // Badge bersifat best-effort — kegagalan fetch tidak boleh mengganggu app.
      lastFetchedAt = Date.now();
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Realtime: listen event socket draft:changed dan refresh badge.
   * Dipanggil sekali oleh Sidebar — guard mencegah listener ganda saat
   * Sidebar unmount/remount (route change).
   */
  const subscribeRealtime = () => {
    if (!import.meta.client) return;
    if (realtimeSubscribed) return;
    realtimeSubscribed = true;

    const { draftChanged } = useRealtimeSocket();
    watch(draftChanged, () => {
      // Force refetch — bypass cache 1 menit agar badge langsung akurat.
      fetchCounts(true);
    });
  };

  return {
    korespondensiDraftCount,
    naskahLainnyaDraftCount,
    isLoading,
    fetchCounts,
    subscribeRealtime,
  };
};
