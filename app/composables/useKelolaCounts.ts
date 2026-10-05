import { ref } from 'vue';
import { useApi } from '~/composables/useApi';

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
const counts = ref({
  penerimaanUsulan: 0,
  penataanArsipInaktif: 0,
  verifikasiPersetujuanTu: 0,
  verifikasiUsulan: 0,
  pengajuanPenyusutan: 0,
  verifikasiPenyusutan: 0,
  penataanPemusnahan: 0,
});
const lastFetchAt = ref(0);
const fetching = ref(false);

// Cache TTL: 30 detik (avoid spamming API)
const CACHE_TTL = 30_000;

export function useKelolaCounts() {
  const { apiGet } = useApi();

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
    const now = Date.now();
    if (!force && now - lastFetchAt.value < CACHE_TTL) return;
    if (fetching.value) return;
    fetching.value = true;
    try {
      const res: any = await apiGet('/dashboard/kelola-counts', undefined, {
        skipCache: true,
      });
      const data = res?.data ?? res ?? {};
      counts.value = {
        penerimaanUsulan: Number(data?.penerimaanUsulan ?? 0),
        penataanArsipInaktif: Number(data?.penataanArsipInaktif ?? 0),
        verifikasiPersetujuanTu: Number(data?.verifikasiPersetujuanTu ?? 0),
        verifikasiUsulan: Number(data?.verifikasiUsulan ?? 0),
        pengajuanPenyusutan: Number(data?.pengajuanPenyusutan ?? 0),
        verifikasiPenyusutan: Number(data?.verifikasiPenyusutan ?? 0),
        penataanPemusnahan: Number(data?.penataanPemusnahan ?? 0),
      };
      lastFetchAt.value = Date.now();
    } catch (err: any) {
      console.error('[useKelolaCounts] fetchCounts error:', err);
    } finally {
      fetching.value = false;
    }
  };

  return {
    counts,
    totalBadge,
    fetchCounts,
  };
}
