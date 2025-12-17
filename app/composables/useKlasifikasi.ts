export interface Klasifikasi {
  id: string;
  klasifikasi: string;
  klasifikasi_text: string;
  active: number;
}

export const useKlasifikasi = () => {
  const { apiGet } = useApi();

  const getKlasifikasiList = async (): Promise<Klasifikasi[]> => {
    return await apiGet<Klasifikasi[]>("/persuratan/klasifikasi");
  };

  return {
    getKlasifikasiList,
  };
};
