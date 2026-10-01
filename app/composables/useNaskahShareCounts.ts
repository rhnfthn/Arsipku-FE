import { ref, computed } from 'vue';
import { useApi } from '~/composables/useApi';

/**
 * Composable untuk badge notifikasi "Dibagikan Kepada Saya" di sidebar.
 * Singleton state — dipakai bersama oleh Sidebar.vue dan halaman shared.
 *
 * Counter:
 *  - unread: jumlah share diterima yang belum dibaca (recipient status = TERKIRIM)
 *
 * Badge di-clear otomatis:
 *  - Saat user membuka halaman "Dibagikan Kepada Saya", BE auto-mark recipient
 *    TERKIRIM → DIBACA (kecuali SEKALI_LIHAT), lalu count drop ke 0.
 */

// ── Singleton state (shared across all callers) ──
const counts = ref({
  unread: 0,
});
const lastFetchAt = ref(0);
const fetching = ref(false);

// Cache TTL: 30 detik (avoid spamming API)
const CACHE_TTL = 30_000;

export function useNaskahShareCounts() {
  const { apiGet } = useApi();

  const totalBadge = computed(() => counts.value.unread);

  /**
   * Fetch jumlah share diterima yang belum dibaca.
   * @param force Bypass cache TTL
   */
  const fetchCounts = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchAt.value < CACHE_TTL) return;
    if (fetching.value) return;
    fetching.value = true;
    try {
      const res = await apiGet<{ success: boolean; data: { count: number } }>(
        '/naskah-share/unread-count',
        undefined,
        { skipCache: true },
      );
      const data = (res as any)?.data ?? res;
      counts.value = {
        unread: data?.count ?? 0,
      };
      lastFetchAt.value = Date.now();
    } catch (err: any) {
      console.error('[useNaskahShareCounts] fetchCounts error:', err);
    } finally {
      fetching.value = false;
    }
  };

  /**
   * Clear badge unread secara lokal (saat user buka halaman Dibagikan Kepada Saya).
   * Backend count akan re-fetch di next poll.
   */
  const clearUnreadBadge = () => {
    counts.value.unread = 0;
  };

  return {
    counts,
    totalBadge,
    fetchCounts,
    clearUnreadBadge,
  };}
