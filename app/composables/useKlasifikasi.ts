// composables/useKlasifikasi.ts
import type { Klasifikasi, KlasifikasiResponse } from "~/types/klasifikasi";

export const useKlasifikasi = () => {
  const { api } = useApi();

  const getKlasifikasiList = async (): Promise<Klasifikasi[]> => {
    try {
      const response = await api.get<KlasifikasiResponse>(
        "/persuratan/klasifikasi",
      );
      return response.data.data;
    } catch (error) {
      console.error("Gagal mengambil data klasifikasi:", error);
      throw error;
    }
  };

  return {
    getKlasifikasiList,
  };
};
