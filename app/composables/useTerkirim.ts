import { useApi } from "./useApi"; // Pastikan path sesuai struktur project
import type { SirkulasiResponse, NaskahItem } from "~/types/terkirim";

export const useSirkulasi = () => {
  const { get, post } = useApi();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchSentBox = async (positionId: string): Promise<NaskahItem[]> => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await get<SirkulasiResponse>(
        `/naskah_sirkulasi/sent/${positionId}`,
      );
      if (response.success) {
        return response.data.items;
      } else {
        throw new Error(response.message || "Gagal mengambil data");
      }
    } catch (err: any) {
      console.error("Fetch Sent Box Error:", err);
      error.value = err.message || "Terjadi kesalahan jaringan";
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  const bulkActionSent = async (payload: {
    position_id: number;
    naskah_ids: string[];
    action: string;
  }) => {
    isLoading.value = true;
    try {
      const response = await post(
        "/naskah_sirkulasi/sent/bulk-action",
        payload,
      );
      return response;
    } catch (err: any) {
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    fetchSentBox,
    bulkActionSent,
  };
};
