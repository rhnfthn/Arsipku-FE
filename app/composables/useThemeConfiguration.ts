import { ref } from 'vue';
import type {
  KonfigurasiThemeItem,
  KonfigurasiThemeListResponse,
  KonfigurasiThemePayload,
  KonfigurasiThemeResponse,
} from '~/types/konfigurasi';

// State aktif dibagi oleh Beranda dan halaman Konfigurasi Sistem.
const currentTheme = ref<KonfigurasiThemeItem | null>(null);
const themes = ref<KonfigurasiThemeItem[]>([]);

export const useThemeConfiguration = () => {
  const { apiGet, apiPost, apiPut, apiPatch, apiDelete } = useApi();
  const isLoadingCurrent = ref(false);
  const isLoadingList = ref(false);
  const isSaving = ref(false);
  const changingManualId = ref<string | null>(null);
  const deletingId = ref<string | null>(null);

  const fetchCurrentTheme = async () => {
    isLoadingCurrent.value = true;
    try {
      const response = await apiGet<KonfigurasiThemeResponse>(
        '/config/theme/current',
        {},
        { skipCache: true }
      );
      currentTheme.value = response.data ?? null;
      return currentTheme.value;
    } finally {
      isLoadingCurrent.value = false;
    }
  };

  const fetchThemes = async () => {
    isLoadingList.value = true;
    try {
      const response = await apiGet<KonfigurasiThemeListResponse>(
        '/admin/config/theme',
        {},
        { skipCache: true }
      );
      themes.value = response.data ?? [];
      return themes.value;
    } finally {
      isLoadingList.value = false;
    }
  };

  const toFormData = (payload: KonfigurasiThemePayload) => {
    const formData = new FormData();
    formData.append('name', payload.name);
    if (payload.description) formData.append('description', payload.description);
    if (payload.start_date) formData.append('start_date', payload.start_date);
    if (payload.end_date) formData.append('end_date', payload.end_date);
    formData.append('repeat_yearly', String(payload.repeat_yearly));
    formData.append('is_enabled', String(payload.is_enabled));
    formData.append('priority', String(payload.priority));
    if (payload.image) formData.append('image', payload.image);
    return formData;
  };

  const createTheme = async (payload: KonfigurasiThemePayload) => {
    isSaving.value = true;
    try {
      await apiPost<KonfigurasiThemeResponse>('/admin/config/theme', toFormData(payload));
      await Promise.all([fetchThemes(), fetchCurrentTheme()]);
    } finally {
      isSaving.value = false;
    }
  };

  const updateTheme = async (id: string, payload: KonfigurasiThemePayload) => {
    isSaving.value = true;
    try {
      await apiPut<KonfigurasiThemeResponse>(`/admin/config/theme/${id}`, toFormData(payload));
      await Promise.all([fetchThemes(), fetchCurrentTheme()]);
    } finally {
      isSaving.value = false;
    }
  };

  const setManualTheme = async (id: string, active: boolean) => {
    changingManualId.value = id;
    try {
      await apiPatch<KonfigurasiThemeResponse>(`/admin/config/theme/${id}/manual`, {
        active,
      });
      await Promise.all([fetchThemes(), fetchCurrentTheme()]);
    } finally {
      changingManualId.value = null;
    }
  };

  const deleteTheme = async (id: string) => {
    deletingId.value = id;
    try {
      await apiDelete(`/admin/config/theme/${id}`);
      await Promise.all([fetchThemes(), fetchCurrentTheme()]);
    } finally {
      deletingId.value = null;
    }
  };

  return {
    currentTheme,
    themes,
    isLoadingCurrent,
    isLoadingList,
    isSaving,
    changingManualId,
    deletingId,
    fetchCurrentTheme,
    fetchThemes,
    createTheme,
    updateTheme,
    setManualTheme,
    deleteTheme,
  };
};
