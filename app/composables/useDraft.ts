// composables/useDraft.ts
import { useApi } from "./useApi";

export const useDraft = () => {
  const { post, get, patch, del } = useApi();
  const toast = useToast();

  const isLoadingDraft = ref(false);
  const drafts = ref([]);
  const totalDrafts = ref(0);

  // Save drafts
  const saveDraft = async (formData: FormData, id_draft?: string | null) => {
    isLoadingDraft.value = true;

    try {
      let response;

      // --- LOGIC PENENTUAN METHOD ---
      if (id_draft) {
        // KASUS UPDATE: Gunakan PATCH
        const url = `/ND/update-draft/${id_draft}`;
        console.log("Updating Draft (PATCH):", url);

        response = await patch(url, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            // Content-Type otomatis dihandle browser untuk FormData
          },
        });
      } else {
        // KASUS BARU: Gunakan POST
        const url = `/ND/save-draft`;
        console.log("Saving New Draft (POST):", url);

        response = await post(url, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }

      toast.add({
        title: "Berhasil",
        description: id_draft
          ? "Draft berhasil diperbarui."
          : "Draft berhasil disimpan.",
        icon: "i-heroicons-check-circle",
        color: "green",
        timeout: 3000,
      });

      return response;
    } catch (error: any) {
      console.error("Save Draft Error:", error);
      toast.add({
        title: "Gagal",
        description:
          error.response?.data?.message ||
          "Terjadi kesalahan saat menyimpan draft.",
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
    getDraftDetail,
  };
};
