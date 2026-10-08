import { useApi } from "~/composables/useApi";
import { useRealtimeSocket } from "~/composables/useRealtimeSocket";

/**
 * Composable untuk badge jumlah naskah tertunda di sidebar.
 * Singleton state — dipakai bersama oleh Sidebar.vue.
 * Badge otomatis update saat BE emit 'tertunda:count' (naskah pending
 * dibuat/difinalisasi) tanpa perlu refresh.
 */
export function useTertundaCount() {
  const { apiGet } = useApi();
  const { tertundaCount: rtTertundaCount } = useRealtimeSocket();

  const tertundaCount = useState<number>("__tertunda_count", () => 0);
  const loading = useState<boolean>("__tertunda_count_loading", () => false);

  // Sinkronkan state realtime socket → state badge (satu arah).
  // Realtime event datang kapan pun; badge harus langsung mengikuti.
  watch(rtTertundaCount, (val) => {
    if (typeof val === "number") tertundaCount.value = val;
  });

  const fetchTertundaCount = async () => {
    if (loading.value) return;
    try {
      loading.value = true;
      const res = await apiGet(`/naskah_sirkulasi/tertunda-count/`, {}, { skipCache: true });
      tertundaCount.value = res?.total ?? res?.data?.total ?? 0;
    } finally {
      loading.value = false;
    }
  };

  return {
    tertundaCount,
    fetchTertundaCount,
    loading,
  };
}
