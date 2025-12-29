// composables/useDraft.ts
import axios from "axios";
import { useApi } from "./useApi";

export const useDraft = () => {
  const { post, get, patch, del, api } = useApi();
  const toast = useToast();

  const isLoadingDraft = ref(false);
  const drafts = ref([]);
  const totalDrafts = ref(0);

  // Helper config for multipart
  const multipartConfig = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };

  // 1. Save drafts (HAPUS final_pdf logic di component nanti)
  const saveDraft = async (formData: FormData, id_draft?: string | null) => {
    isLoadingDraft.value = true;
    try {
      let response;
      if (id_draft) {
        const url = `/ND/update-draft/${id_draft}`;
        response = await api.patch(url, formData, multipartConfig);
      } else {
        const url = `/ND/save-draft`;
        response = await api.post(url, formData, multipartConfig);
      }

      toast.add({
        title: "Berhasil",
        description: id_draft ? "Draft diperbarui." : "Draft disimpan.",
        icon: "i-heroicons-check-circle",
        color: "success",
      });
      return response.data;
    } catch (error: any) {
      console.error("Save Draft Error:", error);
      toast.add({
        title: "Gagal",
        description: error.response?.data?.message || "Gagal menyimpan draft.",
        icon: "i-heroicons-exclamation-circle",
        color: "error",
      });
      throw error;
    } finally {
      isLoadingDraft.value = false;
    }
  };

  // --- BARU: PROSES KIRIM (SEND MESSAGE) ---
  const sendMessage = async (formData: FormData) => {
    isLoadingDraft.value = true; // Gunakan loading state yang sama atau buat baru
    try {
      const url = `/ND/send-message`;
      console.log("Sending Message (POST):", url);

      // Endpoint ini menerima Multipart (Body + Attachments + Final PDF)
      const response = await api.post(url, formData, multipartConfig);

      toast.add({
        title: "Terkirim",
        description: "Nota Dinas berhasil dikirim.",
        icon: "i-heroicons-paper-airplane",
        color: "success",
      });

      return response.data;
    } catch (error: any) {
      console.error("Send Message Error:", error);
      toast.add({
        title: "Gagal Kirim",
        description:
          error.response?.data?.message ||
          "Terjadi kesalahan saat mengirim data.",
        icon: "i-heroicons-exclamation-circle",
        color: "error",
      });
      throw error;
    } finally {
      isLoadingDraft.value = false;
    }
  };

  // 2. Fetch Draft List
  const fetchDrafts = async (positionId: string) => {
    isLoadingDraft.value = true;
    try {
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
        color: "error",
      });
    } finally {
      isLoadingDraft.value = false;
    }
  };

  // 3. Delete Draft
  const deleteDraft = async (idNaskah: string, positionId: string) => {
    isLoadingDraft.value = true;
    try {
      const url = `/draft/delete/${positionId}/${idNaskah}`;
      const response = await del(url);

      toast.add({
        title: "Berhasil",
        description: "Draft berhasil dihapus.",
        icon: "i-heroicons-trash",
        color: "success",
      });

      drafts.value = drafts.value.filter(
        (item: any) => item.id_naskah !== idNaskah,
      );
      totalDrafts.value -= 1;

      return response;
    } catch (error: any) {
      toast.add({
        title: "Gagal",
        description: error.response?.data?.message || "Gagal menghapus draft.",
        color: "error",
      });
      throw error;
    } finally {
      isLoadingDraft.value = false;
    }
  };

  const getDraftDetail = async (idNaskah: string) => {
    isLoadingDraft.value = true;
    try {
      const response = await get(`/ND/${idNaskah}`);
      return response;
    } catch (error: any) {
      console.error("Gagal ambil detail:", error);
      toast.add({
        title: "Error",
        description: "Gagal memuat data draft.",
        color: "error",
      });
      throw error;
    } finally {
      isLoadingDraft.value = false;
    }
  };

  // 4. Generate PDF (FIXED URL)
  const generatePdf = async (payload: any) => {
    try {
      // --- PERBAIKAN DI SINI ---
      // Gunakan URL Absolute karena native fetch tidak tahu BaseURL useApi
      const url = "http://172.20.16.115:3011/ND/generate-pdf";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Gagal generate PDF dari server.");
      }

      return await res.blob();
    } catch (error) {
      console.error("Generate PDF Error:", error);
      throw error;
    }
  };

  const bulkDeleteDrafts = async (positionId: number, naskahIds: string[]) => {
    isLoadingDraft.value = true;
    try {
      const url = `/draft/bulk-delete`;
      const payload = {
        position_id: positionId,
        naskah_ids: naskahIds,
      };

      const response = await post(url, payload);

      toast.add({
        title: "Berhasil",
        description: `${naskahIds.length} Draft berhasil dihapus.`,
        icon: "i-heroicons-trash",
        color: "success",
      });

      // Update local state: hapus item yang ada di list naskahIds
      drafts.value = drafts.value.filter(
        (item: any) => !naskahIds.includes(item.id_naskah),
      );
      totalDrafts.value -= naskahIds.length;

      return response;
    } catch (error: any) {
      toast.add({
        title: "Gagal",
        description:
          error.response?.data?.message || "Gagal menghapus beberapa draft.",
        color: "error",
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
    generatePdf,
    sendMessage,
    bulkDeleteDrafts,
  };
};
