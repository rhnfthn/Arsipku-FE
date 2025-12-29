import { ref } from "vue";
import { useApi } from "~/composables/useApi";

export function useNaskahDinas() {
  const { apiGet } = useApi();

  const items = ref<any[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);

  const fetchNaskahDinas = async () => {
    pending.value = true;
    error.value = null;

    try {
      const res = await apiGet("/naskah-dinas");

      // API kamu: { success, data: [] }
      items.value = res?.data ?? [];
    } catch (err) {
      error.value = err;
    } finally {
      pending.value = false;
    }
  };

  return {
    items,
    pending,
    error,
    fetchNaskahDinas,
  };
}
