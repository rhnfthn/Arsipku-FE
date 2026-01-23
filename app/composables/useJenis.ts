import { useApi } from "~/composables/useApi";

export type JenisItem = {
  id: string;
  jenis: string;
  jenis_text: string;
  format_penomoran: string;
  file_url?: string | null;
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
};

export type JenisCreateResponse = {
  success: boolean;
  message: string;
  data: JenisDetail;
};

export const useJenis = () => {
  const { apiGet, apiDelete, apiPost, apiPut } = useApi();

  const getJenisList = (params?: { search?: string }) => {
    return apiGet<JenisResponse>("/jenis", { params });
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

    if (payload.file) {
      fd.append("file", payload.file);
    }

    return apiPut(`/jenis/${id}`, fd);
  };

  const deleteJenis = (id: string) => {
    return apiDelete(`/jenis/${id}`);
  };

  return {
    getJenisList,
    getJenisDetail,
    createJenis,
    updateJenis,
    deleteJenis,
  };
};
