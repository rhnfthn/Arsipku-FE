import { ref } from "vue";
import { useApi } from "~/composables/useApi";

const unreadCount = ref<number>(0);
const loading = ref(false);

export function useInboxCount() {
  const { apiGet } = useApi();

  const fetchInboxCount = async () => {

    try {
      loading.value = true;
      const res = await apiGet(`/naskah_sirkulasi/inbox-count/`);
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
