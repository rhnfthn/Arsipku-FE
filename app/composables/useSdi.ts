// ~/composables/useSdi.ts
import { ref } from "vue";
import { useApi } from "~/composables/useApi";
import type { SdiRecipientRaw, SdiApiResponse } from "~/types/sdi";

export const useSdi = () => {
  const { apiGet, apiPost, apiPut } = useApi();
  const isLoading = ref(false);

  // --- 1. NORMALIZE LOGIC ---
  // Fungsi ini menerima object { sender:..., recipients:... }
  const normalizeRecipients = (rawData: any): SdiRecipientRaw[] => {
    if (!rawData || !rawData.recipients) return [];

    const groups = rawData.recipients;
    const list: SdiRecipientRaw[] = [];

    // Loop semua key (REKAN, BAWAHAN, ATASAN, dll)
    Object.keys(groups).forEach((groupName) => {
      const groupItems = groups[groupName];
      if (Array.isArray(groupItems)) {
        groupItems.forEach((item: any) => {
          list.push({
            ...item,
            group: groupName, // Tambahkan info group jika perlu
          });
        });
      }
    });

    return list;
  };

  // --- 2. GET RECIPIENTS (FIXED) ---
  const getRecipients = async (positionId: string | number) => {
    isLoading.value = true;
    try {
      // 1. Request API
      // Response strukturnya: { success: true, data: { sender:..., recipients:... } }
      const response = await apiGet<any>(`/SDI/get-recipient/${positionId}`);

      // 2. Ambil isi 'data'
      const content = response?.data;

      // 3. Normalize
      return {
        success: true,
        sender: content?.sender ?? null,
        data: normalizeRecipients(content), // Kirim content (yang berisi recipients) ke normalizer
      };
    } catch (error) {
      console.error("Failed to fetch SDI recipients:", error);
      return { success: false, data: [], sender: null };
    } finally {
      isLoading.value = false;
    }
  };

  // --- 3. GET DRAFT DETAIL ---
  const getDraftDetail = async (id: string) => {
    isLoading.value = true;
    try {
      const response = await apiGet<any>(`/SDI/${id}`);
      // Asumsi response detail juga dibungkus { success: true, data: {...} }
      return { success: true, data: response?.data || response };
    } catch (error) {
      return { success: false, error };
    } finally {
      isLoading.value = false;
    }
  };

  // --- 4. SEND MESSAGE ---
  const sendMessage = async (formData: FormData) => {
    isLoading.value = true;
    try {
      const response = await apiPost("/SDI/send-message", formData);
      return { success: true, data: response };
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // --- 5. SAVE DRAFT ---
  const saveDraft = async (formData: FormData) => {
    isLoading.value = true;
    try {
      const response = await apiPost("/SDI/save-draft", formData);
      return { success: true, data: response };
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // --- 6. UPDATE DRAFT ---
  const updateDraft = async (id: string, formData: FormData) => {
    isLoading.value = true;
    try {
      const response = await apiPut(`/SDI/update-draft/${id}`, formData);
      return { success: true, data: response };
    } catch (error) {
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    getRecipients,
    getDraftDetail,
    sendMessage,
    saveDraft,
    updateDraft,
  };
};
