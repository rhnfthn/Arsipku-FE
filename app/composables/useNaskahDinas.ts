import { ref } from 'vue';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';
import type { Verifikator } from '~/types/digsig';

type NaskahDinasPayload = {
  asal_naskah: string;
  tertuju: number[];
  tanggal_surat: string;
  nomor_asal: string;
  sifat_naskah: string;
  perihal: string;
  file: File[];
  lampiran: string;
  pembuat_id: number;
  verifikator?: number[];
};

type VerifikatorStatus = 'pending' | 'waiting' | 'verified' | 'rejected';

export type NaskahDinasVerifikator = {
  id: string;
  urutan: number;
  persnum: number;
  nama: string | null;
  jabatan: string | null;
  lokasi: string | null;
  positionId: number | null;
  status: VerifikatorStatus;
  verifiedAt: string | null;
  rejectedAt: string | null;
  keterangan: string | null;
};

export type NaskahDinasProgress = {
  verified: number;
  total: number;
  rejected: number;
  currentOrder: number | null;
  status: 'none' | 'on_progress' | 'completed' | 'rejected';
};

export function useNaskahDinas() {
  const { apiGet, apiPost, apiPut } = useApi();
  const { user } = useAuth();

  const items = ref<any[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);

  const fetchNaskahDinas = async () => {
    pending.value = true;
    error.value = null;

    try {
      const res = await apiGet('/naskah-dinas', {}, { skipCache: true });
      items.value = res?.data ?? [];
    } catch (err) {
      error.value = err;
    } finally {
      pending.value = false;
    }
  };

  const detail = ref<any | null>(null);
  const loadingDetail = ref(false);

  const fetchNaskahDinasDetail = async (id: string) => {
    loadingDetail.value = true;
    error.value = null;

    try {
      const res = await apiGet(`/naskah-dinas/${id}`, {}, { skipCache: true });
      detail.value = res?.data ?? null;
      return detail.value;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loadingDetail.value = false;
    }
  };

  const recipients = ref<any[]>([]);
  const loadingRecipients = ref(false);
  const recipientError = ref<any>(null);

  const fetchRecipients = async () => {
    loadingRecipients.value = true;
    recipientError.value = null;

    try {
      const res = await apiGet('/naskah-dinas/get-recipient');
      recipients.value = res?.data?.recipients ?? res?.recipients ?? [];
    } catch (err) {
      recipientError.value = err;
    } finally {
      loadingRecipients.value = false;
    }
  };

  const verifikatorList = ref<Verifikator[]>([]);
  const loadingVerifikator = ref(false);

  const fetchVerifikator = async (opts?: { chiefOnly?: boolean }) => {
    loadingVerifikator.value = true;
    error.value = null;

    try {
      const params = opts?.chiefOnly === false ? { chief: '0' } : {};
      const res = await apiGet('/digsig/document/verifikator', { params }, { skipCache: true });
      verifikatorList.value = res?.data ?? [];
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loadingVerifikator.value = false;
    }
  };

  const buildFormData = (payload: NaskahDinasPayload) => {
    const formData = new FormData();

    formData.append('asal_naskah', payload.asal_naskah);
    formData.append('tanggal_surat', payload.tanggal_surat);
    formData.append('nomor_asal', payload.nomor_asal);
    formData.append('sifat_naskah', payload.sifat_naskah);
    formData.append('perihal', payload.perihal);
    formData.append('lampiran', payload.lampiran);
    formData.append('created_by_position_id', String(payload.pembuat_id));

    payload.tertuju.forEach((id) => {
      formData.append('tertuju[]', String(id));
    });

    (payload.verifikator || []).forEach((persnum) => {
      formData.append('verifikator[]', String(persnum));
    });

    if (payload.file.length > 0) {
      formData.append('file_attachment', payload.file[0]);
    }

    return formData;
  };

  const sending = ref(false);
  const sendError = ref<any>(null);

  const sendNaskahDinas = async (payload: NaskahDinasPayload) => {
    sending.value = true;
    sendError.value = null;

    try {
      return await apiPost('/naskah-dinas/send-message', buildFormData(payload));
    } catch (err) {
      sendError.value = err;
      throw err;
    } finally {
      sending.value = false;
    }
  };

  const updateNaskahDinas = async (id: string, payload: NaskahDinasPayload) => {
    sending.value = true;
    sendError.value = null;

    try {
      return await apiPut(`/naskah-dinas/${id}`, buildFormData(payload));
    } catch (err) {
      sendError.value = err;
      throw err;
    } finally {
      sending.value = false;
    }
  };

  const verifikatorDocuments = ref<any[]>([]);
  const verifikatorMeta = ref<any>(null);
  const verifikatorSummary = ref<any>(null);
  const loadingVerifikatorDocuments = ref(false);

  const fetchVerifikatorDocuments = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    loadingVerifikatorDocuments.value = true;
    error.value = null;

    try {
      const query = new URLSearchParams();
      if (params?.page) query.set('page', String(params.page));
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.status) query.set('status', params.status);
      if (params?.search) query.set('search', params.search);

      const url = `/naskah-dinas/verifikator${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await apiGet(url, {}, { skipCache: true });

      verifikatorDocuments.value = res?.data ?? [];
      verifikatorMeta.value = {
        total: res?.total ?? verifikatorDocuments.value.length,
        page: res?.page ?? 1,
        limit: res?.limit ?? verifikatorDocuments.value.length,
        totalPages: res?.totalPages ?? 1,
      };
      verifikatorSummary.value = res?.summary ?? null;

      return res;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loadingVerifikatorDocuments.value = false;
    }
  };

  const fetchVerifikatorDocumentDetail = async (id: string) => {
    loadingDetail.value = true;
    error.value = null;

    try {
      const res = await apiGet(`/naskah-dinas/verifikator/${id}`, {}, { skipCache: true });
      detail.value = res?.data ?? null;
      return detail.value;
    } catch (err) {
      error.value = err;
      throw err;
    } finally {
      loadingDetail.value = false;
    }
  };

  const verifyNaskahDinas = async (id: string, keterangan?: string) => {
    return apiPost(`/naskah-dinas/verifikator/${id}/verify`, { keterangan });
  };

  const rejectNaskahDinas = async (id: string, alasan: string) => {
    return apiPost(`/naskah-dinas/verifikator/${id}/reject`, { alasan });
  };

  return {
    user,
    items,
    pending,
    error,
    fetchNaskahDinas,
    detail,
    loadingDetail,
    fetchNaskahDinasDetail,

    recipients,
    loadingRecipients,
    recipientError,
    fetchRecipients,

    verifikatorList,
    loadingVerifikator,
    fetchVerifikator,

    sending,
    sendError,
    sendNaskahDinas,
    updateNaskahDinas,

    verifikatorDocuments,
    verifikatorMeta,
    verifikatorSummary,
    loadingVerifikatorDocuments,
    fetchVerifikatorDocuments,
    fetchVerifikatorDocumentDetail,
    verifyNaskahDinas,
    rejectNaskahDinas,
  };
}
