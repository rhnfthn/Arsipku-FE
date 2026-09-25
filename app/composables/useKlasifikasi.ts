import type { Klasifikasi } from '~/types/klasifikasi';

export type { Klasifikasi };

export interface KlasifikasiPayload {
  company: string;
  klasifikasi: string;
  klasifikasi_text: string;
  deskripsi?: string | null;
  id_parent?: string;
  active?: number;
  retensi_aktif_tahun?: number | null;
  retensi_inaktif_tahun?: number | null;
  penyusutan?: string | null;
  keamanan?: string | null;
  hak_akses?: string | null;
}

const normalizeKlasifikasi = (item: any): Klasifikasi => {
  const kode = String(item?.klasifikasi ?? item?.code ?? '').trim();
  const nama = String(
    item?.klasifikasi_text ?? item?.nama ?? item?.text ?? ''
  ).trim();
  const deskripsi = String(item?.deskripsi ?? item?.description ?? '').trim();

  return {
    ...item,
    klasifikasi: kode,
    klasifikasi_text: nama,
    nama: item?.nama ?? nama,
    deskripsi: deskripsi || null,
    code: kode,
    display: item?.display || [kode, nama].filter(Boolean).join(' - '),
    search_text: [kode, nama, deskripsi].filter(Boolean).join(' '),
  } as Klasifikasi;
};

const normalizeKlasifikasiList = (data: any): Klasifikasi[] => {
  const list = Array.isArray(data) ? data : (data?.data ?? []);
  return Array.isArray(list) ? list.map(normalizeKlasifikasi) : [];
};

export const useKlasifikasi = () => {
  const { apiGet, apiPost, apiPut, apiDelete, api } = useApi();
  const { klasifikasi, isLoadingKlasifikasi } = useMasterCache();

  const getKlasifikasi = async (): Promise<Klasifikasi[]> => {
    try {
      const res: any = await apiGet('/persuratan/klasifikasi', {}, { skipCache: true });
      return normalizeKlasifikasiList(res);
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
      const data = normalizeKlasifikasiList(klasifikasi.value);
      klasifikasi.value = data;
      return data;
    }
    if (isLoadingKlasifikasi.value) {
      await new Promise((resolve) => {
        const stop = watch(isLoadingKlasifikasi, (v) => {
          if (!v) {
            stop();
            resolve(true);
          }
        });
      });
      const data = normalizeKlasifikasiList(klasifikasi.value ?? []);
      klasifikasi.value = data;
      return data;
    }

    isLoadingKlasifikasi.value = true;
    try {
      const res: any = await apiGet('/persuratan/klasifikasi', {}, { skipCache: true });
      const data = normalizeKlasifikasiList(res);
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

  const checkKlasifikasiUsage = (id: string) => {
    return apiGet<{ canDelete: boolean; reason?: string; details?: any }>(
      `/persuratan/klasifikasi/${id}/check-usage`,
      {},
      { skipCache: true },
    );
  };

  const refreshKlasifikasi = async () => {
    isLoadingKlasifikasi.value = true;
    try {
      const res: any = await apiGet('/persuratan/klasifikasi', {}, { skipCache: true });
      const data = normalizeKlasifikasiList(res);
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
    checkKlasifikasiUsage,
    refreshKlasifikasi,
  };
};
