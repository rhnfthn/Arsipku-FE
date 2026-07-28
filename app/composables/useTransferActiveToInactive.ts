import { ref } from 'vue';
import { useApi } from './useApi';
import type {
  TransferActiveToInactive,
  TransferFilter,
  TransferSummary,
  CreateTransferPayload,
  UpdateTransferPayload,
  ApproveTransferPayload,
  RejectTransferPayload,
  FinalVerifyTransferPayload,
  VerifyPhysicalPayload,
  TuApprovePayload,
  FinalApprovalTuPayload,
} from '~/types/transfer-active-to-inactive';

/** Composable untuk modul Pemindahan Arsip Aktif ke Inaktif. */
export const useTransferActiveToInactive = () => {
  const { apiGet, apiPost, apiPatch, apiDelete } = useApi();

  const list = ref<TransferActiveToInactive[]>([]);
  const summary = ref<TransferSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const meta = ref<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

  const fetchList = async (filter: TransferFilter = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, any> = { ...filter };
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === null || params[k] === '') delete params[k];
      });
      const res: any = await apiGet('/transfer-active-to-inactive', { params }, { skipCache: true });
      list.value = res?.data ?? [];
      meta.value = res?.meta ?? null;
      return res;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat data';
      list.value = [];
      meta.value = null;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const fetchSummary = async (): Promise<TransferSummary | null> => {
    try {
      const res: any = await apiGet('/transfer-active-to-inactive/summary', {}, { skipCache: true });
      summary.value = res?.data ?? null;
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat ringkasan';
      throw e;
    }
  };

  const fetchDetail = async (id: string): Promise<TransferActiveToInactive | null> => {
    try {
      const res: any = await apiGet(`/transfer-active-to-inactive/${id}`, {}, { skipCache: true });
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat detail';
      throw e;
    }
  };

  const create = async (payload: CreateTransferPayload): Promise<TransferActiveToInactive> => {
    const res: any = await apiPost('/transfer-active-to-inactive', payload);
    return res?.data;
  };

  const update = async (id: string, payload: UpdateTransferPayload): Promise<TransferActiveToInactive> => {
    const res: any = await apiPatch(`/transfer-active-to-inactive/${id}`, payload);
    return res?.data;
  };

  const remove = async (id: string): Promise<void> => {
    await apiDelete(`/transfer-active-to-inactive/${id}`);
  };

  const send = async (id: string) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/send`, {});
    return r?.data;
  };
  const resubmit = async (id: string) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/resubmit`, {});
    return r?.data;
  };
  const approve = async (id: string, p: ApproveTransferPayload) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/approve`, p);
    return r?.data;
  };
  const reject = async (id: string, p: RejectTransferPayload) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/reject`, p);
    return r?.data;
  };
  const finalVerify = async (id: string, p: FinalVerifyTransferPayload) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/final-verify`, p);
    return r?.data;
  };
  const dispatch = async (id: string) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/dispatch`, {});
    return r?.data;
  };
  const kirimUsulPindah = async (id: string) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/kirim-usul-pindah`, {});
    return r?.data;
  };
  const siapkanBerkasFisik = async (id: string) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/siapkan-berkas-fisik`, {});
    return r?.data;
  };
  const selesaikanUsulan = async (id: string) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/selesai`, {});
    return r?.data;
  };
  const verifyPhysical = async (id: string, p: VerifyPhysicalPayload) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/verify-physical`, p);
    return r?.data;
  };
  const tuApprove = async (id: string, p: TuApprovePayload) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/tu-approve`, p);
    return r?.data;
  };
  const tuReject = async (id: string, p: RejectTransferPayload) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/tu-reject`, p);
    return r?.data;
  };
  const tuFinalApprove = async (id: string, p: FinalApprovalTuPayload) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/tu-final-approve`, p);
    return r?.data;
  };
  const tuFinalReject = async (id: string, p: RejectTransferPayload) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/tu-final-reject`, p);
    return r?.data;
  };
  const receive = async (id: string) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/receive`, {});
    return r?.data;
  };
  const arrange = async (id: string) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/arrange`, {});
    return r?.data;
  };
  const complete = async (id: string) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/complete`, {});
    return r?.data;
  };
  const generateBeritaAcara = async (id: string) => {
    const r: any = await apiPost(`/transfer-active-to-inactive/${id}/berita-acara`, {});
    return r?.data;
  };

  return {
    list,
    summary,
    loading,
    error,
    meta,
    fetchList,
    fetchSummary,
    fetchDetail,
    create,
    update,
    remove,
    send,
    resubmit,
    approve,
    reject,
    finalVerify,
    dispatch,
    kirimUsulPindah,
    siapkanBerkasFisik,
    selesaikanUsulan,
    verifyPhysical,
    tuApprove,
    tuReject,
    tuFinalApprove,
    tuFinalReject,
    receive,
    arrange,
    complete,
    generateBeritaAcara,
  };
};