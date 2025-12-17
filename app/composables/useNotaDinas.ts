// composables/useNotaDinas.ts
import { useApi } from "@/composables/useApi";

export const useNotaDinas = () => {
  const { api, apiPost } = useApi();

  const ENDPOINT_PDF = "/ND/preview-pdf";
  const ENDPOINT_DRAFT = "/ND/save-draft";

  // Generate PDF
  const generatePdf = async (payload: any) => {
    try {
      const response = await api.post("/ND/preview-pdf", payload, {
        responseType: "blob",
        headers: {
          "Content-Type": undefined,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Gagal generate PDF:", error);
      throw error;
    }
  };

  // 2. Save Draft (Contoh penggunaan wrapper apiPost biasa)
  const saveDraft = async (payload: any) => {
    return await apiPost(ENDPOINT_DRAFT, payload);
  };

  return {
    generatePdf,
    saveDraft,
  };
};
