// composables/useSDE.ts
import type { SdeRecipientApiResponse, SdeActionResponse } from "~/types/sde";

export const useSDE = () => {
  const { api, apiGet, apiPost, apiPatch } = useApi();

  // Config untuk upload file / multipart
  const formDataConfig = {
    headers: { "Content-Type": "multipart/form-data" },
  };

  /**
   * Mengambil info pengirim (Sender) SDE
   * Endpoint: GET /SDE/get-recipient/{positionId}
   */
  const getRecipientInfo = async (positionId: number | string) => {
    if (!positionId) throw new Error("Position ID kosong");

    const res = await apiGet<SdeRecipientApiResponse>(
      `/SDE/get-recipient/${positionId}`,
    );

    return {
      sender: res?.data?.sender ?? null,
      // Jika backend SDE mengembalikan list kontak tersimpan, bisa diolah di sini
      rawRecipients: res?.data?.recipients ?? [],
    };
  };

  /**
   * Mengambil Detail Naskah SDE (untuk Edit Draft / View)
   * Endpoint: GET /SDE/{id_naskah}
   */
  const getSDEDetail = async (idNaskah: string) => {
    if (!idNaskah) throw new Error("ID Naskah kosong");
    // Asumsi response detail mirip dengan structure SdeActionResponse
    return await apiGet<SdeActionResponse>(`/SDE/${idNaskah}`);
  };

  /**
   * Generate Preview PDF
   * Endpoint: POST /SDE/preview-pdf
   */
  const generatePdf = async (formData: FormData) => {
    // Gunakan instance api langsung untuk blob response
    const response = await api.post("/SDE/preview-pdf", formData, {
      responseType: "blob",
      // header content-type usually auto-set by axios for FormData
    });
    return response.data; // Mengembalikan Blob
  };

  /**
   * Simpan Draft Baru
   * Endpoint: POST /SDE/save-draft
   */
  const saveDraft = async (formData: FormData) => {
    return await apiPost<SdeActionResponse>(
      "/SDE/save-draft",
      formData,
      formDataConfig,
    );
  };

  /**
   * Update Draft (PATCH)
   * Endpoint: PATCH /SDE/update-draft/{id_naskah}
   */
  const updateDraft = async (formData: FormData, idNaskah: string) => {
    if (!idNaskah) throw new Error("ID Naskah kosong untuk update");
    return await apiPatch<SdeActionResponse>(
      `/SDE/update-draft/${idNaskah}`,
      formData,
      formDataConfig,
    );
  };

  /**
   * Kirim Surat (Final)
   * Endpoint: POST /SDE/send-message
   */
  const sendSDE = async (formData: FormData) => {
    return await apiPost<SdeActionResponse>(
      "/SDE/send-message",
      formData,
      formDataConfig,
    );
  };

  return {
    getRecipientInfo,
    getSDEDetail,
    generatePdf,
    saveDraft,
    updateDraft,
    sendSDE,
  };
};
