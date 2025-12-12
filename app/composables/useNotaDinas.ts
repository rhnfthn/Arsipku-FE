// composables/useNotaDinas.ts
import type { NotaDinasDraftPayload } from "~/types/notaDinas";

export const useNotaDinas = () => {
  const { post } = useApi(); // Menggunakan useApi yang Anda sediakan

  const saveDraft = async (payload: NotaDinasDraftPayload) => {
    try {
      // Endpoint sesuai request: /ND/save-draft
      const response = await post("/ND/save-draft", payload);
      return response;
    } catch (error) {
      console.error("Gagal menyimpan draft:", error);
      throw error;
    }
  };

  return {
    saveDraft,
  };
};
