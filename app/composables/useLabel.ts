import { ref } from "vue";
import { useApi } from "~/composables/useApi";

export const useLabel = () => {
  const { get, post, patch, del } = useApi();

  const labels = ref<any[]>([]);
  const labelCounts = ref<Record<string, number>>({});
  const isLoadingLabels = ref(false);

  const fetchLabels = async () => {
    isLoadingLabels.value = true;
    try {
      const res = await get("/labels");
      labels.value = res.data || [];
    } catch (error) {
      console.error("Gagal mengambil label:", error);
    } finally {
      isLoadingLabels.value = false;
    }
  };

  const fetchLabelCounts = async () => {
    try {
      const res = await get("/labels/counts");
      labelCounts.value = res.data || {};
    } catch (error) {
      console.error("Gagal mengambil jumlah label:", error);
    }
  };

  const createLabel = async (payload: any) => {
    return await post("/labels", payload);
  };

  const updateLabel = async (id: string, payload: any) => {
    return await patch(`/labels/${id}`, payload);
  };

  const deleteLabel = async (id: string) => {
    return await del(`/labels/${id}`);
  };

  const addNaskahToLabel = async (naskahId: string, labelId: string) => {
    return await post(`/labels/naskah/${naskahId}`, { label_id: labelId });
  };

  const removeNaskahFromLabel = async (naskahId: string, labelId: string) => {
    return await del(`/labels/naskah/${naskahId}/${labelId}`);
  };

  return {
    labels,
    labelCounts,
    isLoadingLabels,
    fetchLabels,
    fetchLabelCounts,
    createLabel,
    updateLabel,
    deleteLabel,
    addNaskahToLabel,
    removeNaskahFromLabel,
  };
};
