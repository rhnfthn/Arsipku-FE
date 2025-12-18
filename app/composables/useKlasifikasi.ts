export interface Klasifikasi {
  id: string;
  klasifikasi: string;
  klasifikasi_text: string;
  active: number;
}

export const useKlasifikasi = () => {
  const { apiGet, api } = useApi();

  const getKlasifikasi = async (): Promise<Klasifikasi[]> => {
    try {
      const response = await api.get<{ data: Klasifikasi[] }>(
        "/persuratan/klasifikasi",
      );
      return response.data.data;
    } catch (error) {
      console.error("Gagal mengambil data klasifikasi:", error);
      throw error;
    }
  };

  const getKlasifikasiList = async (): Promise<Klasifikasi[]> => {
    return await apiGet<Klasifikasi[]>("/persuratan/klasifikasi");
  };

  return {
    getKlasifikasi,
    getKlasifikasiList,
  };
};
