// Composable untuk tracking "sudah dibuka" usulan yang sinkron dengan BE.
//
// Bekerja via field isViewedByMe dari response BE (GET /usulan-akses-berkas).
// Saat user membuka detail usulan → FE panggil PATCH /usulan-akses-berkas/:id/mark-viewed
// → BE simpan viewedBy[persnum] → counts badge auto-exclude usulan ini.
//
// Untuk instant UI update (sebelum refetch selesai), pakai local cache
// (markViewedOptimistic) yang langsung tandai row sebagai viewed di state lokal.

import { useApi } from '~/composables/useApi';
import { useUsulanAksesBerkasCounts } from '~/composables/useUsulanAksesBerkasCounts';
import { ref } from 'vue';

// Module-level singleton (shared across all callers)
let _optimisticViewed: Set<string> | null = null;
let _ref: { value: Set<string> } | null = null;

function getState() {
  if (!_optimisticViewed) {
    _optimisticViewed = new Set();
    _ref = ref(_optimisticViewed);
  }
  return { set: _optimisticViewed, ref: _ref! };
}

export function useUsulanAksesBerkasViewed() {
  const { apiPatch } = useApi();
  const { fetchCounts, clearVerifikasiBadge, clearPilihBerkasBadge } = useUsulanAksesBerkasCounts();
  const { set: optimisticSet, ref: optimisticRef } = getState();

  /**
   * Kembalikan true jika usulan pernah dibuka (BE field isViewedByMe atau
   * optimistic local cache).
   */
  const isViewed = (usulan: { id: string; isViewedByMe?: boolean } | null | undefined): boolean => {
    if (!usulan) return false;
    if (usulan.isViewedByMe === true) return true;
    return optimisticRef.value.has(usulan.id);
  };

  /**
   * Mark usulan sebagai viewed di local cache (instant UI update).
   * Jangan tunggu BE response.
   */
  const markViewedOptimistic = (id: string): void => {
    if (!id) return;
    optimisticSet.add(id);
    optimisticRef.value = new Set(optimisticSet);
  };

  /**
   * Sync ke BE: PATCH mark-viewed. Setelah sukses, refetch counts supaya
   * badge angka di sidebar/dropdown auto-update.
   */
  const markViewedOnServer = async (id: string): Promise<void> => {
    if (!id) return;
    try {
      await apiPatch(`/usulan-akses-berkas/${id}/mark-viewed`, {});
    } catch (err) {
      console.warn('[useUsulanAksesBerkasViewed] markViewed failed:', err);
      // Tetap silent — UX tidak terganggu
    }
  };

  /**
   * Mark viewed (optimistic + BE) lalu refetch counts.
   * Gunakan ini di handler saat user masuk detail.
   */
  const markViewed = async (id: string): Promise<void> => {
    markViewedOptimistic(id);
    await markViewedOnServer(id);
    // Refetch counts (force) supaya badge angka sync dengan BE.
    // Pakai force=true untuk skip cache TTL 30 detik.
    await fetchCounts(true);
    // Best-effort: juga clear cache badge lokal
    clearVerifikasiBadge();
    clearPilihBerkasBadge();
  };

  return {
    isViewed,
    markViewed,
  };
}