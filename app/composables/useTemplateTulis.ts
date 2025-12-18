// composables/useTemplate.ts
import type { TemplateSurat, TemplatePayload } from "~/types/templates";

export const useTemplate = () => {
  const { apiGet, apiPost, apiPut, apiDelete } = useApi();

  // GET: Ambil template berdasarkan Position ID
  const getTemplatesByPosition = async (
    positionId: string,
  ): Promise<TemplateSurat[]> => {
    try {
      const res = await apiGet<any>(`/templates/position/${positionId}`);
      return Array.isArray(res) ? res : res.data || [];
    } catch (error) {
      console.error("Gagal mengambil template:", error);
      throw error;
    }
  };

  // POST: Simpan template baru
  const createTemplate = async (payload: TemplatePayload) => {
    return await apiPost("/templates", payload);
  };

  // PUT: Edit template
  const updateTemplate = async (id: string, payload: TemplatePayload) => {
    return await apiPut(`/templates/${id}`, payload);
  };

  // DELETE: Hapus template
  const deleteTemplateById = async (id: string) => {
    return await apiDelete(`/templates/${id}`);
  };

  return {
    getTemplatesByPosition,
    createTemplate,
    updateTemplate,
    deleteTemplateById,
  };
};
