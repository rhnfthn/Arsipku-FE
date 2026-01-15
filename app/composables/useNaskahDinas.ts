import { ref } from "vue";
import { useApi } from "~/composables/useApi";
import { useAuth } from "~/composables/useAuth";

export function useNaskahDinas() {
  const { apiGet, apiPost } = useApi();
  const { user } = useAuth();

  const items = ref<any[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);

  const fetchNaskahDinas = async () => {
    pending.value = true;
    error.value = null;

    try {
      const res = await apiGet("/naskah-dinas");

      // API kamu: { success, data: [] }
      items.value = res?.data ?? [];
    } catch (err) {
      error.value = err;
    } finally {
      pending.value = false;
    }
  };

  const recipients = ref<any[]>([]);
  const loadingRecipients = ref(false);
  const recipientError = ref<any>(null);

  const fetchRecipients = async () => {
    loadingRecipients.value = true;
    recipientError.value = null;

    try {
      const res = await apiGet("/naskah-dinas/get-recipient");
      recipients.value = res?.data?.recipients ?? [];
    } catch (err) {
      recipientError.value = err;
    } finally {
      loadingRecipients.value = false;
    }
  };

  const sending = ref(false);
  const sendError = ref<any>(null);

  const sendNaskahDinas = async (payload: {
    asal_naskah: string;
    tertuju: number[];
    tanggal_surat: string;
    nomor_asal: string;
    sifat_naskah: string;
    perihal: string;
    file: File[];
    lampiran: string;
    pembuat_id: number;
  }) => {
    const formData = new FormData();

    formData.append("asal_naskah", payload.asal_naskah);
    formData.append("tanggal_surat", payload.tanggal_surat);
    formData.append("nomor_asal", payload.nomor_asal);
    formData.append("sifat_naskah", payload.sifat_naskah);
    formData.append("perihal", payload.perihal);
    formData.append("lampiran", payload.lampiran);
    formData.append("created_by_position_id", String(payload.pembuat_id));

    payload.tertuju.forEach((id) => {
      formData.append("tertuju[]", String(id));
    });

    if (payload.file.length > 0) {
      formData.append("file_attachment", payload.file[0]);
    }

    return apiPost("/naskah-dinas/send-message", formData);
  };

  return {
    items,
    pending,
    error,
    fetchNaskahDinas,

    recipients,
    loadingRecipients,
    recipientError,
    fetchRecipients,

    sending,
    sendError,
    sendNaskahDinas,
  };
}
