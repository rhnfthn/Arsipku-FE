// composables/useSDI.ts
import type {
  RecipientApiData,
  RecipientApiResponse,
  RecipientItem,
} from "~/types/recipient";
import type { SDIPayload } from "~/types/sdi";

export const useSDI = () => {
  const { api, apiGet, apiPost, apiPut } = useApi();

  // Helper untuk header FormData (agar browser set boundary otomatis)
  const formDataConfig = {
    headers: { "Content-Type": "multipart/form-data" }, // Biasanya axios auto-detect, tapi explicit lebih aman di beberapa case
  };

  /**
   * Mengambil daftar recipient berdasarkan posisi user
   */
  // const getRecipients = async (positionId: string) => {
  //   // Endpoint: GET /SDI/get-recipient/{{positionId}}
  //   return await apiGet(`/SDI/get-recipient/${positionId}`);
  // };

  const normalizeRecipients = (
    raw: RecipientApiData | undefined,
  ): RecipientItem[] => {
    if (!raw || !raw.recipients) return [];

    const groups = raw.recipients;
    const list: RecipientItem[] = [];

    Object.keys(groups).forEach((groupName) => {
      groups[groupName].forEach((item) => {
        list.push({
          ...item,
          group: groupName,
        });
      });
    });

    return list;
  };

  const getRecipients = async (
    positionId: number,
  ): Promise<{
    sender: RecipientApiData["sender"] | null;
    recipients: RecipientItem[];
  }> => {
    if (!positionId) throw new Error("positionId kosong");

    // tipe otomatis jadi RecipientApiResponse
    const res = await apiGet<RecipientApiResponse>(
      `/SDI/get-recipient/${positionId}`,
    );

    return {
      sender: res?.data?.sender ?? null,
      recipients: normalizeRecipients(res?.data),
    };
  };

  /**
   * Preview PDF (Generate PDF dari HTML/Data)
   */
  // const generatePdf = async (formData: FormData) => {
  //   // Endpoint: POST /SDI/preview-pdf
  //   // ResponseType blob penting untuk PDF preview
  //   return await apiPost("/SDI/preview-pdf", formData, {
  //     responseType: "blob",
  //     ...formDataConfig,
  //   });
  // };

  const generatePdf = async (formData: FormData) => {
    const response = await api.post("/SDI/preview-pdf", formData, {
      responseType: "blob",
    });
    return response.data;
  };

  /**
   * Kirim Surat Dinas Internal (Baru)
   */
  const sendSDI = async (formData: FormData) => {
    // Endpoint: POST /SDI/send-message
    return await apiPost("/SDI/send-message", formData, formDataConfig);
  };

  /**
   * Simpan sebagai Draft
   */
  const saveDraft = async (formData: FormData, id?: string | null) => {
    // Endpoint: POST /SDI/save-draft
    // Biasanya draft endpoint juga menerima ID jika update, atau endpoint terpisah
    return await apiPost("/SDI/save-draft", formData, formDataConfig);
  };

  /**
   * Kirim Draft yang sudah ada (Finalize)
   */
  const sendDraft = async (formData: FormData, idNaskah: string) => {
    // Endpoint: PUT /SDI/send-draft/{{id_naskah}}
    return await apiPut(
      `/SDI/send-draft/${idNaskah}`,
      formData,
      formDataConfig,
    );
  };

  return {
    getRecipients,
    generatePdf,
    sendSDI,
    saveDraft,
    sendDraft,
  };
};
