import { useApi } from './useApi';

export interface AiConfigResponse {
  hasKey: boolean;
  keyMasked: string | null;
}

export const useUserAiConfig = () => {
  const { api } = useApi();
  const loading = ref(false);
  const error = ref<string | null>(null);

  const get = async (): Promise<AiConfigResponse> => {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/AI/config');
      const body = res.data;
      if (!body?.success) {
        throw new Error(body?.message || 'Gagal memuat konfigurasi AI');
      }
      return body.data as AiConfigResponse;
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Terjadi kesalahan';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const save = async (apiKey: string): Promise<AiConfigResponse> => {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.put('/AI/config', { apiKey });
      const body = res.data;
      if (!body?.success) {
        throw new Error(body?.message || 'Gagal menyimpan API key');
      }
      return body.data as AiConfigResponse;
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Terjadi kesalahan';
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return { get, save, loading, error };
};