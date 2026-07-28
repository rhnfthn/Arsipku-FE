import { ref } from 'vue';
import { useApi } from './useApi';
import type {
  TransferInactiveFile,
  TransferFilter,
  TransferSummary,
  CreateTransferPayload,
  ApproveTransferPayload,
  RejectTransferPayload,
  FinalVerifyTransferPayload,
  VerifyPhysicalPayload,
  TuApprovePayload,
  FinalApprovalTuPayload,
} from '~/types/transfer-inactive-file';

/** Composable untuk modul Pemindahan Arsip Inaktif. */
export const useTransferInactiveFile = () => {
  const { apiGet, apiPost, apiPatch } = useApi();

  const list = ref<TransferInactiveFile[]>([]);
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
      const res: any = await apiGet('/transfer-inactive-file', { params }, { skipCache: true });
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
      const res: any = await apiGet('/transfer-inactive-file/summary', {}, { skipCache: true });
      summary.value = res?.data ?? null;
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat ringkasan';
      throw e;
    }
  };

  const fetchDetail = async (id: string): Promise<TransferInactiveFile | null> => {
    try {
      const res: any = await apiGet(`/transfer-inactive-file/${id}`, {}, { skipCache: true });
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat detail';
      throw e;
    }
  };

  const create = async (payload: CreateTransferPayload): Promise<TransferInactiveFile> => {
    const res: any = await apiPost('/transfer-inactive-file', payload);
    return res?.data;
  };

  const send = async (id: string) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/send`, {});
    return r?.data;
  };
  const approve = async (id: string, p: ApproveTransferPayload) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/approve`, p);
    return r?.data;
  };
  const reject = async (id: string, p: RejectTransferPayload) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/reject`, p);
    return r?.data;
  };
  const finalVerify = async (id: string, p: FinalVerifyTransferPayload) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/final-verify`, p);
    return r?.data;
  };
  const dispatch = async (id: string) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/dispatch`, {});
    return r?.data;
  };
  const verifyPhysical = async (id: string, p: VerifyPhysicalPayload) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/verify-physical`, p);
    return r?.data;
  };
  const tuApprove = async (id: string, p: TuApprovePayload) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/tu-approve`, p);
    return r?.data;
  };
  const tuReject = async (id: string, p: RejectTransferPayload) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/tu-reject`, p);
    return r?.data;
  };
  const tuFinalApprove = async (id: string, p: FinalApprovalTuPayload) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/tu-final-approve`, p);
    return r?.data;
  };
  const tuFinalReject = async (id: string, p: RejectTransferPayload) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/tu-final-reject`, p);
    return r?.data;
  };
  const receive = async (id: string) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/receive`, {});
    return r?.data;
  };
  const arrange = async (id: string) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/arrange`, {});
    return r?.data;
  };
  const complete = async (id: string) => {
    const r: any = await apiPatch(`/transfer-inactive-file/${id}/complete`, {});
    return r?.data;
  };
  const generateBeritaAcara = async (id: string) => {
    const r: any = await apiPost(`/transfer-inactive-file/${id}/berita-acara`, {});
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
    send,
    approve,
    reject,
    finalVerify,
    dispatch,
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
