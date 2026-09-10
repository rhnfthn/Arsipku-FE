import { useApi } from "~/composables/useApi";

export type JenisItem = {
  id: string;
  jenis: string;
  jenis_text: string;
  format_penomoran: string;
  file_name?: string | null;
  file_url?: string | null;
  file_text?: string;
  file_original?: string | null;
  file_original_url?: string | null;
  file_regex?: string | null;
  file_regex_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type JenisResponse = {
  success: boolean;
  message: string;
  data: JenisItem[];
};

export type JenisDetail = {
  id: string;
  jenis: string;
  jenis_text: string;
  file_name?: string;
  file_url?: string | null;
  file_text?: string;
  file_original?: string | null;
  file_original_url?: string | null;
  file_regex?: string | null;
  file_regex_url?: string | null;
  format_penomoran: string;
};

export type JenisDetailResponse = {
  success: boolean;
  data: JenisDetail;
};

export type JenisCreatePayload = {
  jenis: string;
  jenis_text: string;
  file_text: string;
  format_penomoran: string;
  file?: File | null;
  file_original?: File | null;
  file_regex?: File | null;
};

export type JenisCreateResponse = {
  success: boolean;
  message: string;
  data: JenisDetail;
};

export const useJenis = () => {
  const { apiGet, apiDelete, apiPost, apiPut } = useApi();
  const { jenis, isLoadingJenis } = useMasterCache();

  const getJenisList = async (params?: { search?: string }): Promise<JenisResponse> => {
    isLoadingJenis.value = true;
    try {
      const response = await apiGet<JenisResponse>("/jenis", { params }, { skipCache: true });
      if (!params?.search) {
        jenis.value = response.data;
      }
      return response;
    } catch (error) {
      console.error("Gagal mengambil jenis:", error);
      throw error;
    } finally {
      isLoadingJenis.value = false;
    }
  };

  const getJenisDetail = (id: string) => {
    return apiGet<JenisDetailResponse>(`/jenis/${id}`);
  };

  const createJenis = (payload: JenisCreatePayload) => {
    const fd = new FormData();
    fd.append("jenis", payload.jenis);
    fd.append("jenis_text", payload.jenis_text);
    fd.append("file_text", payload.file_text);
    fd.append("format_penomoran", payload.format_penomoran);

    if (payload.file_original) {
      fd.append("file_original", payload.file_original);
    }
    if (payload.file_regex) {
      fd.append("file_regex", payload.file_regex);
    }
    if (payload.file) {
      fd.append("file", payload.file);
    }

    return apiPost<JenisCreateResponse>("/jenis", fd);
  };

  const updateJenis = (id: string, payload: JenisCreatePayload) => {
    const fd = new FormData();
    fd.append("jenis", payload.jenis);
    fd.append("jenis_text", payload.jenis_text);
    fd.append("file_text", payload.file_text);
    fd.append("format_penomoran", payload.format_penomoran);

    if (payload.file_original) {
      fd.append("file_original", payload.file_original);
    }
    if (payload.file_regex) {
      fd.append("file_regex", payload.file_regex);
    }
    if (payload.file) {
      fd.append("file", payload.file);
    }

    return apiPut(`/jenis/${id}`, fd);
  };

  const deleteJenis = (id: string) => {
    return apiDelete(`/jenis/${id}`);
  };

  const checkJenisUsage = (id: string) => {
    return apiGet<{ canDelete: boolean; reason?: string; details?: any }>(
      `/jenis/${id}/check-usage`,
      {},
      { skipCache: true },
    );
  };

  const refreshJenis = async () => {
    isLoadingJenis.value = true;
    try {
      const response = await apiGet<JenisResponse>("/jenis", {}, { skipCache: true });
      jenis.value = response.data;
      return response;
    } finally {
      isLoadingJenis.value = false;
    }
  };

  return {
    getJenisList,
    getJenisDetail,
    createJenis,
    updateJenis,
    deleteJenis,
    checkJenisUsage,
    refreshJenis,
  };
};
