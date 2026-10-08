import { ref } from "vue";
import type {
  TitelaturItem,
  TitelaturListResponse,
  TitelaturSingleResponse,
  TitelaturDeleteResponse,
  CreateTitelaturPayload,
  UpdateTitelaturPayload,
} from "~/types/titelatur";
import { useApi } from "~/composables/useApi";

export const useTitelatur = () => {
  const items = ref<TitelaturItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const { get, post, put, del } = useApi();
  const toast = useToast();

  /* ======================
   * FETCH ALL
   * silent: true → tidak tampilkan toast (untuk onMounted / reload)
   * ====================== */
  const fetchTitelatur = async (silent = false) => {
    loading.value = true;
    error.value = null;

    try {
      const res = await get<TitelaturListResponse>("/titelatur-en");

      if (res.success && Array.isArray(res.data)) {
        items.value = res.data;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch data";
      console.error("❌ fetchTitelatur error:", err);
      if (!silent) {
        toast.add({
          title: "Gagal memuat data",
          description: "Terjadi kesalahan saat mengambil data titelatur.",
          color: "error",
        });
      }
    } finally {
      loading.value = false;
    }
  };

  /* ======================
   * FETCH BY ID
   * ====================== */
  const fetchTitelaturById = async (
    id: string,
  ): Promise<TitelaturItem | null> => {
    loading.value = true;
    error.value = null;

    try {
      const res = await get<TitelaturSingleResponse>(`/titelatur-en/${id}`);

      if (res.success && res.data) {
        return res.data;
      }
      throw new Error("Invalid response format");
    } catch (err: any) {
      error.value = err?.message || "Failed to fetch titelatur";
      console.error("❌ fetchTitelaturById error:", err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  /* ======================
   * CREATE
   * ====================== */
  const createTitelatur = async (
    payload: CreateTitelaturPayload,
  ): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      const res = await post<TitelaturSingleResponse>("/titelatur-en", payload);

      if (res.success && res.data) {
        items.value.unshift(res.data);
        toast.add({
          title: "Berhasil ditambahkan",
          description: `Titelatur "${payload.long_text}" berhasil ditambahkan.`,
          color: "success",
        });
        return true;
      }
      throw new Error("Failed to create titelatur");
    } catch (err: any) {
      error.value = err?.message || "Failed to create titelatur";
      console.error("❌ createTitelatur error:", err);
      // Tampilkan pesan spesifik dari BE (mis. validasi duplikasi titelatur).
      const serverMsg = err?.response?.data?.message || err?.message;
      toast.add({
        title: "Gagal menambahkan",
        description: serverMsg || "Terjadi kesalahan saat menambahkan data. Coba lagi.",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  };

  /* ======================
   * UPDATE
   * ====================== */
  const updateTitelatur = async (
    id: string,
    payload: UpdateTitelaturPayload,
  ): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      const res = await put<TitelaturSingleResponse>(
        `/titelatur-en/${id}`,
        payload,
      );

      if (res.success && res.data) {
        const index = items.value.findIndex((item) => item.id === id);
        if (index !== -1) {
          items.value[index] = res.data;
        }
        toast.add({
          title: "Berhasil diperbarui",
          description: `Titelatur "${payload.long_text}" berhasil diperbarui.`,
          color: "success",
        });
        return true;
      }
      throw new Error("Failed to update titelatur");
    } catch (err: any) {
      error.value = err?.message || "Failed to update titelatur";
      console.error("❌ updateTitelatur error:", err);
      // Tampilkan pesan spesifik dari BE (mis. validasi duplikasi titelatur).
      const serverMsg = err?.response?.data?.message || err?.message;
      toast.add({
        title: "Gagal memperbarui",
        description: serverMsg || "Terjadi kesalahan saat memperbarui data. Coba lagi.",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  };

  /* ======================
   * DELETE
   * ====================== */
  const deleteTitelatur = async (
    id: string,
    name?: string,
  ): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      const res = await del<TitelaturDeleteResponse>(`/titelatur-en/${id}`);

      if (res.success) {
        items.value = items.value.filter((item) => item.id !== id);
        toast.add({
          title: "Berhasil dihapus",
          description: name
            ? `Titelatur "${name}" berhasil dihapus.`
            : "Data berhasil dihapus.",
          color: "error",
        });
        return true;
      }
      throw new Error("Failed to delete titelatur");
    } catch (err: any) {
      error.value = err?.message || "Failed to delete titelatur";
      console.error("❌ deleteTitelatur error:", err);
      toast.add({
        title: "Gagal menghapus",
        description: "Terjadi kesalahan saat menghapus data. Coba lagi.",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    items,
    loading,
    error,
    fetchTitelatur,
    fetchTitelaturById,
    createTitelatur,
    updateTitelatur,
    deleteTitelatur,
  };
};
