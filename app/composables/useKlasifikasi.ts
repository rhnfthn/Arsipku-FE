import type { Klasifikasi } from '~/types/klasifikasi';

export type { Klasifikasi };

export interface KlasifikasiPayload {
  company: string;
  klasifikasi: string;
  klasifikasi_text: string;
  deskripsi?: string | null;
  id_parent?: string;
  active?: number;
}

export const useKlasifikasi = () => {
  const { apiGet, apiPost, apiPut, apiDelete, api } = useApi();
  const { klasifikasi, isLoadingKlasifikasi } = useMasterCache();

  const getKlasifikasi = async (): Promise<Klasifikasi[]> => {
    try {
      const response = await api.get<{ data: Klasifikasi[] }>('/persuratan/klasifikasi');
      return response.data.data;
    } catch (error) {
      console.error('Gagal mengambil data klasifikasi:', error);
      throw error;
    }
  };

  const getKlasifikasiDetail = (id: string) => {
    return apiGet<Klasifikasi>(`/persuratan/klasifikasi/${id}`);
  };

  const getKlasifikasiList = async (): Promise<Klasifikasi[]> => {
    if (klasifikasi.value && klasifikasi.value.length > 0) {
      return klasifikasi.value;
    }
    if (isLoadingKlasifikasi.value) {
      // tunggu jika ada request lain sedang berjalan
      await new Promise((resolve) => {
        const stop = watch(isLoadingKlasifikasi, (v) => {
          if (!v) {
            stop();
            resolve(true);
          }
        });
      });
      return klasifikasi.value ?? [];
    }

    isLoadingKlasifikasi.value = true;
    try {
      const res: any = await apiGet('/persuratan/klasifikasi', {}, { skipCache: true });
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      klasifikasi.value = data;
      return data;
    } catch (error) {
      console.error('Gagal mengambil klasifikasi:', error);
      throw error;
    } finally {
      isLoadingKlasifikasi.value = false;
    }
  };

  const createKlasifikasi = (payload: KlasifikasiPayload) => {
    return apiPost('/persuratan/klasifikasi', payload);
  };

  const updateKlasifikasi = (id: string, payload: KlasifikasiPayload) => {
    return apiPut(`/persuratan/klasifikasi/${id}`, payload);
  };

  const deleteKlasifikasi = (id: string) => {
    return apiDelete(`/persuratan/klasifikasi/${id}`);
  };

  const refreshKlasifikasi = async () => {
    isLoadingKlasifikasi.value = true;
    try {
      const res: any = await apiGet('/persuratan/klasifikasi', {}, { skipCache: true });
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      klasifikasi.value = data;
      return data;
    } finally {
      isLoadingKlasifikasi.value = false;
    }
  };

  return {
    getKlasifikasi,
    getKlasifikasiList,
    getKlasifikasiDetail,
    createKlasifikasi,
    updateKlasifikasi,
    deleteKlasifikasi,
    refreshKlasifikasi,
  };
};
