import { useApi } from "~/composables/useApi";

export function useInboxCount() {
  const { apiGet } = useApi();

  // Global shared state untuk unread count (digunakan Navbar + halaman lain)
  const unreadCount = useState<number>("__inbox_unread_count", () => 0);
  const loading = useState<boolean>("__inbox_unread_loading", () => false);

  const fetchInboxCount = async () => {
    if (loading.value) return;
    try {
      loading.value = true;
      const res = await apiGet(`/naskah_sirkulasi/inbox-count/`, {}, { skipCache: true });
      unreadCount.value = res?.data?.count ?? 0;
    } finally {
      loading.value = false;
    }
  };

  return {
    unreadCount,
    fetchInboxCount,
    loading,
  };
}
