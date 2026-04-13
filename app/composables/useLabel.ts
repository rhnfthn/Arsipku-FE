import { ref } from 'vue';
import { useApi } from '~/composables/useApi';

// Tipe response dari API fetchNaskahByLabel
interface NaskahByLabelResponse {
  namaLabel: string;
  items: any[];
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  summary?: {
    total_semua: number;
    total_per_jenis: Record<string, number>;
  };
}

export const useLabel = () => {
  const { get, post, patch, del } = useApi();

  const labels = ref<any[]>([]);
  const labelCounts = ref<Record<string, number>>({});
  const isLoadingLabels = ref(false);

  // FIX: Ubah tipe dari any[] menjadi NaskahByLabelResponse | null
  // karena API mengembalikan object (bukan array) dengan properti namaLabel, items, pagination
  const naskahByLabel = ref<NaskahByLabelResponse | null>(null);
  const isLoadingNaskah = ref(false);
  const naskahError = ref<any>(null);

  const fetchLabels = async () => {
    isLoadingLabels.value = true;
    try {
      const res = await get('/labels');
      labels.value = res.data || [];
    } catch (error) {
      console.error('Gagal mengambil label:', error);
    } finally {
      isLoadingLabels.value = false;
    }
  };

  const fetchLabelCounts = async () => {
    try {
      const res = await get('/labels/counts');
      labelCounts.value = res.data || {};
    } catch (error) {
      console.error('Gagal mengambil jumlah label:', error);
    }
  };

  const createLabel = async (payload: any) => {
    return await post('/labels', payload);
  };

  const updateLabel = async (id: string, payload: any) => {
    return await patch(`/labels/${id}`, payload);
  };

  const deleteLabel = async (id: string) => {
    return await del(`/labels/${id}`);
  };

  const addNaskahToLabel = async (naskahId: string, labelId: string, source: string) => {
    return await post(`/labels/naskah/${naskahId}`, {
      labelIds: [labelId],
      source: source
    });
  };

  const removeNaskahFromLabel = async (naskahId: string, labelId: string) => {
    return await del(`/labels/naskah/${naskahId}/${labelId}`);
  };

  const fetchNaskahByLabel = async (labelId: string, params: Record<string, any> = {}) => {
    isLoadingNaskah.value = true;
    naskahError.value = null;
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      if (params.search) query.append('search', params.search);
      if (params.jenis && params.jenis !== 'ALL') query.append('jenis', params.jenis);
      if (params.source && params.source !== 'ALL') query.append('source', params.source);
      if (params.sort) query.append('sort', params.sort);
      if (params.start_date) query.append('start_date', params.start_date);
      if (params.end_date) query.append('end_date', params.end_date);

      const qs = query.toString();
      const res = await get(`/labels/${labelId}/naskah${qs ? `?${qs}` : ''}`);

      // FIX: Simpan res.data sebagai object, bukan array
      naskahByLabel.value = res?.data ?? null;
    } catch (err) {
      naskahError.value = err;
      naskahByLabel.value = null;
    } finally {
      isLoadingNaskah.value = false;
    }
  };

  return {
    labels,
    labelCounts,
    isLoadingLabels,
    fetchLabels,
    fetchLabelCounts,
    createLabel,
    updateLabel,
    deleteLabel,
    addNaskahToLabel,
    removeNaskahFromLabel,
    naskahByLabel,
    isLoadingNaskah,
    naskahError,
    fetchNaskahByLabel
  };
};
