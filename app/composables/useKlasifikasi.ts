export interface Klasifikasi {
  id: string;
  klasifikasi: string;
  klasifikasi_text: string;
  active: number;
}

export const useKlasifikasi = () => {
  const { apiGet, apiPost, apiPut, apiDelete, api } = useApi();

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

  const getKlasifikasiDetail = (id: string) => {
    return apiGet<Klasifikasi>(`/persuratan/klasifikasi/${id}`);
  };

  const getKlasifikasiList = async (): Promise<Klasifikasi[]> => {
    return await apiGet<Klasifikasi[]>("/persuratan/klasifikasi");
  };

  const createKlasifikasi = (payload: KlasifikasiPayload) => {
    return apiPost("/persuratan/klasifikasi", payload);
  };

  const updateKlasifikasi = (id: string, payload: KlasifikasiPayload) => {
    return apiPut(`/persuratan/klasifikasi/${id}`, payload);
  };

  const deleteKlasifikasi = (id: string) => {
    return apiDelete(`/persuratan/klasifikasi/${id}`);
  };

  return {
    getKlasifikasi,
    getKlasifikasiList,
    getKlasifikasiDetail,
    createKlasifikasi,
    updateKlasifikasi,
    deleteKlasifikasi,
  };
};
