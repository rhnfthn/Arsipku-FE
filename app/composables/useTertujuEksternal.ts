import { ref } from "vue";
import { useApi } from "~/composables/useApi";

export interface TertujuEksternal {
  id: string;
  id_position_pembuat: string;

  company: string;
  area: string;
  nama: string;
  alamat: string;
  telepon: string;
  email: string;
  kontak: string;

  aktif: boolean;
  nama_pembuat: string;
}

export const useTertujuEksternal = () => {
  const { apiGet, apiPost, apiDelete, apiPut } = useApi();

  const data = ref<TertujuEksternal[]>([]);
  const loading = ref(false);
  const error = ref<any>(null);

  const fetchTertujuEksternal = async () => {
    loading.value = true;
    try {
      // Include inactive data — skipCache agar selalu fetch data terbaru
      const res = await apiGet("/persuratan/eksternal?include_inactive=true", {}, { skipCache: true });
      data.value = res?.data ?? [];
    } catch (err) {
      error.value = err;
      data.value = [];
    } finally {
      loading.value = false;
    }
  };

  const createTertujuEksternal = async (payload: Partial<TertujuEksternal>) => {
    loading.value = true;
    error.value = null;

    try {
      await apiPost("/persuratan/eksternal", payload);

      await fetchTertujuEksternal();
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteTertujuEksternal = async (id: string) => {
    loading.value = true;
    try {
      await apiDelete(`/persuratan/eksternal/${id}`);
      await fetchTertujuEksternal();
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateTertujuEksternal = async (id: string, payload: any) => {
    loading.value = true;
    try {
      await apiPut(`/persuratan/eksternal/${id}`, payload);
      await fetchTertujuEksternal();
    } finally {
      loading.value = false;
    }
  };

  return {
    data,
    loading,
    error,
    fetchTertujuEksternal,
    createTertujuEksternal,
    deleteTertujuEksternal,
    updateTertujuEksternal,
  };
};
