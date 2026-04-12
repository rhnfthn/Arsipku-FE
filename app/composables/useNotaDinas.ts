import { useApi } from './useApi';

export const useNotaDinas = () => {
  const { api, get } = useApi();

  // 1. Preview PDF (POST Multipart)
  const generatePdf = async (formData: FormData) => {
    const response = await api.post('/ND/preview-pdf', formData, {
      responseType: 'blob'
    });
    return response.data;
  };

  // 2. Send Nota Dinas (POST Multipart + Final PDF)
  const sendNotaDinas = async (formData: FormData) => {
    return await api.post('/ND/send-message', formData);
  };

  // 3. Save/Update Draft (POST Multipart Tanpa Final PDF)
  const saveDraft = async (formData: FormData, id?: string | null) => {
    if (id) {
      return await api.patch(`/ND/update-draft/${id}`, formData);
    } else {
      return await api.post('/ND/save-draft', formData);
    }
  };

  // 4. Get Detail /ND/id
  const getNotaDinasDetail = async (id: string) => {
    return await get(`/ND/${id}`);
  };

  // 5. Send dari Draft yang sudah ada
  const sendDraft = async (formData: FormData, id: string) => {
    return await api.put(`/ND/send-draft/${id}`, formData);
  };

  return { generatePdf, sendNotaDinas, saveDraft, getNotaDinasDetail, sendDraft };
};
