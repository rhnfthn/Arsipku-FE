import { useApi } from './useApi';
import type { GenerateDraftPayload, DraftResult } from '~/types/ai-draft';

export const useAiDraft = () => {
  const { api } = useApi();
  const loading = ref(false);
  const error = ref<string | null>(null);

  const generate = async (payload: GenerateDraftPayload): Promise<DraftResult> => {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/AI/draft', payload);
      const body = res.data;
      if (!body?.success) {
        throw new Error(body?.message || 'Generate draf gagal');
      }
      return body.data as DraftResult;
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Terjadi kesalahan saat generate draf';
      error.value = msg;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return { generate, loading, error };
};
