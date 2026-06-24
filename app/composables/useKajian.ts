import { useApi } from './useApi';
import type { KajianPayload } from '~/types/kajian';

export const useKajian = () => {
  const { api, get } = useApi();

  // 1. Get Recipients (Structure: ATASAN, BAWAHAN, REKAN)
  const getRecipients = async (positionId?: string | number) => {
    const url = positionId ? `/KA/get-recipient?pengirim=${positionId}` : `/KA/get-recipient`;
    const response = await get(url);
    return response;
  };

  // 2. Preview PDF
  const generatePdf = async (formData: FormData) => {
    // Asumsi endpoint preview, jika beda sesuaikan
    console.log('INI YAA!: ' + formData);
    const response = await api.post('/KA/preview-pdf', formData, {
      responseType: 'blob'
    });
    return response.data;
  };

  // 3. Send New Message (POST)
  const sendKajian = async (formData: FormData) => {
    return await api.post('/KA/send-message', formData);
  };

  // 4. Send Draft (POST /KA/send-draft/{id})
  // Endpoint ini KHUSUS untuk mengirim draft agar draft lama terhapus/update status
  const sendDraft = async (formData: FormData, id: string) => {
    return await api.put(`/KA/send-draft/${id}`, formData);
  };

  // 5. Save New Draft (POST)
  const saveDraft = async (formData: FormData) => {
    return await api.post('/KA/save-draft', formData);
  };

  // 6. Update Existing Draft (PUT)
  const updateDraft = async (formData: FormData, id: string) => {
    return await api.patch(`/KA/update-draft/${id}`, formData);
  };

  // 7. Get Detail (Untuk Edit Draft / View)
  const getKajianDetail = async (id: string) => {
    return await get(`/KA/${id}`);
  };

  return {
    getRecipients,
    generatePdf,
    sendKajian,
    sendDraft,
    saveDraft,
    updateDraft,
    getKajianDetail
  };
};
