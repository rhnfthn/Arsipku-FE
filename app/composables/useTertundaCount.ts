import { useApi } from "~/composables/useApi";

/**
 * Composable untuk badge jumlah naskah tertunda di sidebar.
 * Singleton state — dipakai bersama oleh Sidebar.vue.
 */
export function useTertundaCount() {
  const { apiGet } = useApi();

  const tertundaCount = useState<number>("__tertunda_count", () => 0);
  const loading = useState<boolean>("__tertunda_count_loading", () => false);

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
