import { ref, computed } from 'vue';
import { useApi } from '~/composables/useApi';

/**
 * Composable untuk badge notifikasi Usulan Akses Berkas di sidebar.
 * Singleton state — dipakai bersama oleh Sidebar.vue dan halaman Penggunaan.
 *
 * Counters:
 *  - menungguVerifikasi: usulan yang menunggu verifikasi user (managerial)
 *  - pilihBerkas: usulan yang menunggu SE pemberi pilih berkas
 *  - aksesDiterbitkanBaru: entitlement baru yang belum dilihat (Pemberian)
 *
 * Badge di-clear otomatis:
 *  - menungguVerifikasi & pilihBerkas: backend count drop ke 0 setelah aksi verifikasi
 *  - aksesDiterbitkanBaru: clear via markEntitlementsRead() saat buka halaman Pemberian
 */

// ── Singleton state (shared across all callers) ──
const counts = ref({
  menungguVerifikasi: 0,
  pilihBerkas: 0,
  aksesDiterbitkanBaru: 0,
});
const lastFetchAt = ref(0);
const fetching = ref(false);

// Cache TTL: 30 detik (avoid spamming API)
const CACHE_TTL = 30_000;

export function useUsulanAksesBerkasCounts() {
  const { apiGet, apiPatch } = useApi();

  const totalBadge = computed(
    () =>
      counts.value.menungguVerifikasi +
      counts.value.pilihBerkas +
      counts.value.aksesDiterbitkanBaru,
  );

  /**
   * Fetch counts dari backend.
   * @param force Bypass cache TTL
   */
  const fetchCounts = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetchAt.value < CACHE_TTL) return;
    if (fetching.value) return;
    fetching.value = true;
    try {
      const res = await apiGet<{ success: boolean; data: any }>(
        '/usulan-akses-berkas/counts',
        undefined,
        { skipCache: true },
      );
      const data = (res as any)?.data ?? res;
      counts.value = {
        menungguVerifikasi: data?.menungguVerifikasi ?? 0,
        pilihBerkas: data?.pilihBerkas ?? 0,
        aksesDiterbitkanBaru: data?.aksesDiterbitkanBaru ?? 0,
      };
      lastFetchAt.value = Date.now();
    } catch (err: any) {
      console.error('[useUsulanAksesBerkasCounts] fetchCounts error:', err);
    } finally {
      fetching.value = false;
    }
  };

  /**
   * Tandai semua entitlement sebagai sudah dibaca.
   * Dipanggil saat user membuka halaman Pemberian.
   */
  const markEntitlementsRead = async () => {
    try {
      await apiPatch('/usulan-akses-berkas/mark-entitlements-read');
      counts.value.aksesDiterbitkanBaru = 0;
    } catch (err: any) {
      console.error('[useUsulanAksesBerkasCounts] markEntitlementsRead error:', err);
    }
  };

  /**
   * Clear badge menunggu verifikasi (saat user buka halaman Persetujuan/Pemeriksaan).
   * Backend count akan re-fetch di next poll.
   */
  const clearVerifikasiBadge = () => {
    counts.value.menungguVerifikasi = 0;
  };

  /**
   * Clear badge pilih berkas (saat user buka halaman Permintaan sebagai SE pemberi).
   */
  const clearPilihBerkasBadge = () => {
    counts.value.pilihBerkas = 0;
  };

  return {
    counts,
    totalBadge,
    fetchCounts,
    markEntitlementsRead,
    clearVerifikasiBadge,
    clearPilihBerkasBadge,
  };
}