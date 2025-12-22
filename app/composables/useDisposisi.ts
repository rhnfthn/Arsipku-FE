import type { DisposisiPayload } from "~/types/disposisi";

// Interface untuk Recipient response
interface RecipientItem {
  id: string | number;
  label: string;
  labelJob: string;
  value: string;
  group?: string;
  [key: string]: any;
}

interface RecipientApiData {
  sender: any;
  recipients: Record<string, any[]>; // Grouped recipients
}

interface RecipientApiResponse {
  data: RecipientApiData;
}

export const useDisposisi = () => {
  const { api, apiGet, apiPost, apiPut, apiPatch } = useApi();

  const formDataConfig = {
    headers: { "Content-Type": "multipart/form-data" },
  };

  // --- Normalisasi Helper ---
  const normalizeRecipients = (
    raw: RecipientApiData | undefined,
  ): RecipientItem[] => {
    if (!raw || !raw.recipients) return [];

    const groups = raw.recipients;
    const list: RecipientItem[] = [];

    Object.keys(groups).forEach((groupName) => {
      // Pastikan groups[groupName] adalah array sebelum di-loop
      if (Array.isArray(groups[groupName])) {
        groups[groupName].forEach((item) => {
          list.push({
            ...item, // Menyalin semua data asli

            // 1. Value: Mengambil 'position' (ID unik di JSON Anda)
            value: String(item.position),

            // 2. Label: Format "NAMA - JABATAN"
            // Menggunakan 'persnum_person_text' dan 'position_text'
            label: `${item.persnum_person_text || "Tanpa Nama"} - ${item.position_text || ""}`,

            // 3. LabelJob: Mengambil singkatan jabatan 'position_abbreviation'
            // Jika kosong, fallback ke 'position_text'
            labelJob: item.position_abbreviation || item.position_text || "",

            // 4. Group: ATASAN / BAWAHAN
            group: groupName,
          });
        });
      }
    });

    return list;
  };

  // --- API Actions ---

  const getRecipients = async (positionId: number | string) => {
    if (!positionId) throw new Error("positionId kosong");
    const res = await apiGet<RecipientApiResponse>(
      `/DI/get-recipient/${positionId}`,
    );
    return {
      sender: res?.data?.sender ?? null,
      recipients: normalizeRecipients(res?.data),
    };
  };

  const sendDisposisi = async (formData: FormData) => {
    return await apiPost("/DI/send-message", formData, formDataConfig);
  };

  const saveDraft = async (formData: FormData) => {
    return await apiPost("/DI/save-draft", formData, formDataConfig);
  };

  const sendDraft = async (formData: FormData, idNaskah: string) => {
    return await apiPut(`/DI/send-draft/${idNaskah}`, formData, formDataConfig);
  };

  const updateDraft = async (formData: FormData, idNaskah: string) => {
    return await apiPatch(
      `/DI/update-draft/${idNaskah}`,
      formData,
      formDataConfig,
    );
  };

  const getDraftDetail = async (id: string) => {
    return await apiGet(`/DI/${id}`);
  };

  // const generatePdf = async (formData: FormData) => {
  //   return await apiPost("/DI/preview-pdf", formData, {
  //     responseType: "blob",
  //     ...formDataConfig,
  //   });
  // };

  const generatePdf = async (formData: FormData) => {
    const response = await api.post("/DI/preview-pdf", formData, {
      responseType: "blob",
    });
    return response.data;
  };

  return {
    getRecipients,
    sendDisposisi,
    saveDraft,
    sendDraft,
    updateDraft,
    getDraftDetail,
    generatePdf,
  };
};
