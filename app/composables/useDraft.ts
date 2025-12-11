// composables/useDraft.ts
import { useApi } from "./useApi";

export const useDraft = () => {
  const { post, get, del } = useApi();
  const toast = useToast();

  const isLoadingDraft = ref(false);
  const drafts = ref([]);
  const totalDrafts = ref(0);

  // Save drafts
const saveDraft = async (payload: FormData | any) => {
  isLoadingDraft.value = true;
  try {
    // PERBAIKAN DI SINI:
    // HAPUS "Content-Type": "multipart/form-data"
    const response = await post("/ND/save-draft", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        // "Content-Type": "multipart/form-data",
      },
    });

    toast.add({
      title: "Berhasil",
      description: "Draft berhasil disimpan.",
      icon: "i-heroicons-check-circle",
      color: "green",
      timeout: 3000,
    });

    return response;
  } catch (error: any) {
    toast.add({
      title: "Gagal",
      description: error.response?.data?.message || "Gagal menyimpan draft.",
      icon: "i-heroicons-exclamation-circle",
      color: "red",
    });
    throw error;
  } finally {
    isLoadingDraft.value = false;
  }
};

  // 2. Fetch Draft List (NEW)
  const fetchDrafts = async (positionId: string) => {
    isLoadingDraft.value = true;
    try {
      // Endpoint: /draft/list/{position_id}
      const response = await get(`/draft/list/${positionId}`);

      if (response.success) {
        drafts.value = response.data.items;
        totalDrafts.value = response.data.total;
      }
      return response;
    } catch (error: any) {
      console.error("Fetch drafts error:", error);
      toast.add({
        title: "Gagal Memuat",
        description: "Gagal mengambil daftar draft.",
        color: "red",
      });
    } finally {
      isLoadingDraft.value = false;
    }
  };

  // 3. Delete Draft (NEW)
  const deleteDraft = async (idNaskah: string, positionId: string) => {
    isLoadingDraft.value = true;
    try {
      const url = `/draft/delete/${positionId}/${idNaskah}`;
      const response = await del(url);

      toast.add({
        title: "Berhasil",
        description: "Draft berhasil dihapus.",
        icon: "i-heroicons-trash",
        color: "green",
      });

      // Refresh list lokal setelah hapus
      drafts.value = drafts.value.filter(
        (item: any) => item.id_naskah !== idNaskah,
      );
      totalDrafts.value -= 1;

      return response;
    } catch (error: any) {
      toast.add({
        title: "Gagal",
        description: error.response?.data?.message || "Gagal menghapus draft.",
        color: "red",
      });
      throw error;
    } finally {
      isLoadingDraft.value = false;
    }
  };

  const getDraftDetail = async (idNaskah: string) => {
    isLoadingDraft.value = true;
    try {
      // Sesuai request: /ND/{uuid}
      const response = await get(`/ND/${idNaskah}`);
      return response;
    } catch (error: any) {
      console.error("Gagal ambil detail:", error);
      toast.add({
        title: "Error",
        description: "Gagal memuat data draft.",
        color: "red",
      });
      throw error;
    } finally {
      isLoadingDraft.value = false;
    }
  };

  return {
    drafts,
    totalDrafts,
    isLoadingDraft,
    saveDraft,
    fetchDrafts,
    deleteDraft,
    getDraftDetail
  };
};
