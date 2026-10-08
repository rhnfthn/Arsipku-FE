import { computed, ref, watch } from 'vue';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';

/**
 * Composable untuk badge notifikasi menu Kelola di sidebar.
 * Singleton state — dipakai bersama oleh Sidebar.vue dan halaman Kelola.
 *
 * Counters (jumlah item yang menunggu aksi user login):
 *  - penerimaanUsulan: usulan pindah arsip menunggu verifikasi berkas fisik TU
 *  - penataanArsipInaktif: arsip inaktif diterima yang belum ditata
 *  - verifikasiPersetujuanTu: usulan menunggu persetujuan Atasan TU (giliran user)
 *  - verifikasiUsulan: usulan pemindahan menunggu verifikasi Atasan (giliran user)
 *  - pengajuanPenyusutan: arsip selesai penataan yang belum diajukan penyusutan
 *  - verifikasiPenyusutan: pengajuan penyusutan menunggu verifikasi (giliran user)
 *  - penataanPemusnahan: penyusutan diterima yang belum ditata/dimusnahkan
 *
 * Badge di-clear otomatis: backend count drop ke 0 setelah aksi dilakukan,
 * dan fetch ulang terjadi saat user membuka halaman terkait (force refresh).
 */

// ── Singleton state (shared across all callers) ──
type KelolaCountKey =
  | 'penerimaanUsulan'
  | 'penataanArsipInaktif'
  | 'verifikasiPersetujuanTu'
  | 'verifikasiUsulan'
  | 'pengajuanPenyusutan'
  | 'verifikasiPenyusutan'
  | 'penataanPemusnahan';

const zeroCounts = () => ({
  penerimaanUsulan: 0,
  penataanArsipInaktif: 0,
  verifikasiPersetujuanTu: 0,
  verifikasiUsulan: 0,
  pengajuanPenyusutan: 0,
  verifikasiPenyusutan: 0,
  penataanPemusnahan: 0,
});
const counts = ref(zeroCounts());
const serverCounts = ref(zeroCounts());
const acknowledgedCounts = ref(zeroCounts());
const activeUserKey = ref('');
const lastFetchAt = ref(0);
const fetching = ref(false);
const refreshAfterFetch = ref(false);

const countByViewedScope: Record<string, KelolaCountKey> = {
  'penataan-arsip-inaktif': 'penataanArsipInaktif',
  'verifikasi-persetujuan-tu': 'verifikasiPersetujuanTu',
  'verifikasi-usulan': 'verifikasiUsulan',
  'penyusutan-pengajuan': 'pengajuanPenyusutan',
  'penyusutan-verifikasi': 'verifikasiPenyusutan',
  'penyusutan-penataan-pemusnahan': 'penataanPemusnahan',
};

const storageKeyFor = (userKey: string) => `maintenance-viewed-counts:${userKey}`;

const syncUserState = (userKey: string) => {
  if (!import.meta.client || activeUserKey.value === userKey) return;
  activeUserKey.value = userKey;
  lastFetchAt.value = 0;
  serverCounts.value = zeroCounts();
  acknowledgedCounts.value = zeroCounts();
  counts.value = zeroCounts();

  try {
    const saved = JSON.parse(localStorage.getItem(storageKeyFor(userKey)) || '{}');
    serverCounts.value = { ...zeroCounts(), ...(saved.serverCounts || {}) };
    acknowledgedCounts.value = { ...zeroCounts(), ...(saved.acknowledgedCounts || {}) };
    counts.value = Object.fromEntries(
      Object.keys(serverCounts.value).map((key) => [
        key,
        Math.max(0, serverCounts.value[key] - acknowledgedCounts.value[key]),
      ]),
    ) as typeof counts.value;
  } catch {
    // Ignore malformed browser state; the server count will refresh it.
  }
};

const persistCountState = () => {
  if (!import.meta.client || !activeUserKey.value) return;
  try {
    localStorage.setItem(
      storageKeyFor(activeUserKey.value),
      JSON.stringify({
        serverCounts: serverCounts.value,
        acknowledgedCounts: acknowledgedCounts.value,
      }),
    );
  } catch {
    // In-memory badge state remains usable when storage is unavailable.
  }
};

const showUnacknowledgedCounts = () => {
  counts.value = Object.fromEntries(
    Object.keys(serverCounts.value).map((key) => [
      key,
      Math.max(0, serverCounts.value[key] - acknowledgedCounts.value[key]),
    ]),
  ) as typeof counts.value;
};

// Cache TTL: 30 detik (avoid spamming API)
const CACHE_TTL = 30_000;

export function useKelolaCounts() {
  const { apiGet } = useApi();
  const { user } = useAuth();

  const userKey = computed(() =>
    String(user.value?.persnum ?? user.value?.id ?? 'anonymous'),
  );
  watch(userKey, syncUserState, { immediate: true });

  const totalBadge = computed(
    () =>
      counts.value.penerimaanUsulan +
      counts.value.penataanArsipInaktif +
      counts.value.verifikasiPersetujuanTu +
      counts.value.verifikasiUsulan +
      counts.value.pengajuanPenyusutan +
      counts.value.verifikasiPenyusutan +
      counts.value.penataanPemusnahan
  );

  /**
   * Fetch counts dari backend.
   * @param force Bypass cache TTL
   */
  const fetchCounts = async (force = false) => {
    syncUserState(userKey.value);
    const now = Date.now();
    if (!force && now - lastFetchAt.value < CACHE_TTL) return;
    if (fetching.value) {
      // Jika event realtime tiba saat request sebelumnya masih berjalan,
      // jalankan satu refresh susulan agar kenaikan terbaru tidak terlewat.
      if (force) refreshAfterFetch.value = true;
      return;
    }
    fetching.value = true;
    try {
      const res: any = await apiGet('/dashboard/kelola-counts', undefined, {
        skipCache: true,
      });
      const data = res?.data ?? res ?? {};
      const nextServerCounts = {
        penerimaanUsulan: Number(data?.penerimaanUsulan ?? 0),
        penataanArsipInaktif: Number(data?.penataanArsipInaktif ?? 0),
        verifikasiPersetujuanTu: Number(data?.verifikasiPersetujuanTu ?? 0),
        verifikasiUsulan: Number(data?.verifikasiUsulan ?? 0),
        pengajuanPenyusutan: Number(data?.pengajuanPenyusutan ?? 0),
        verifikasiPenyusutan: Number(data?.verifikasiPenyusutan ?? 0),
        penataanPemusnahan: Number(data?.penataanPemusnahan ?? 0),
      };
      // Jika hitungan server turun karena tugas sudah diselesaikan, lepaskan
      // acknowledgement lama agar hitungan untuk tugas baru tidak ikut terpotong.
      for (const key of Object.keys(nextServerCounts) as KelolaCountKey[]) {
        const completedCount = Math.max(0, serverCounts.value[key] - nextServerCounts[key]);
        acknowledgedCounts.value[key] = Math.max(
          0,
          acknowledgedCounts.value[key] - completedCount,
        );
      }
      serverCounts.value = nextServerCounts;
      showUnacknowledgedCounts();
      lastFetchAt.value = Date.now();
      persistCountState();
    } catch (err: any) {
      console.error('[useKelolaCounts] fetchCounts error:', err);
    } finally {
      fetching.value = false;
      if (refreshAfterFetch.value) {
        refreshAfterFetch.value = false;
        void fetchCounts(true);
      }
    }
  };

  const acknowledgeViewedRow = (scope: string) => {
    syncUserState(userKey.value);
    const countKey = countByViewedScope[scope];
    if (!countKey) return;
    acknowledgedCounts.value[countKey] = Math.min(
      serverCounts.value[countKey],
      acknowledgedCounts.value[countKey] + 1,
    );
    showUnacknowledgedCounts();
    persistCountState();
  };

  return {
    counts,
    totalBadge,
    fetchCounts,
    acknowledgeViewedRow,
  };
}
