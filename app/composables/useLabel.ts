import { ref } from "vue";
import { useApi } from "~/composables/useApi";

export const useLabel = () => {
  const { get, post, patch, del } = useApi();

  const labels = ref<any[]>([]);
  const labelCounts = ref<Record<string, number>>({});
  const isLoadingLabels = ref(false);

  const naskahByLabel = ref<any[]>([]);
  const isLoadingNaskah = ref(false);
  const naskahError = ref<any>(null);

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

  const addNaskahToLabel = async (
    naskahId: string,
    labelId: string,
    source: string,
  ) => {
    return await post(`/labels/naskah/${naskahId}`, {
      labelIds: [labelId],
      source: source,
    });
  };

  const removeNaskahFromLabel = async (naskahId: string, labelId: string) => {
    return await del(`/labels/naskah/${naskahId}/${labelId}`);
  };

  const fetchNaskahByLabel = async (labelId: string) => {
    isLoadingNaskah.value = true;
    naskahError.value = null;

    try {
      const res = await get(`/labels/${labelId}/naskah`);
      naskahByLabel.value = res?.data || [];
    } catch (err) {
      naskahError.value = err;
      naskahByLabel.value = [];
    } finally {
      isLoadingNaskah.value = false;
    }
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
    naskahByLabel,
    fetchNaskahByLabel,
  };
};
