import { ref } from 'vue';
import { useApi } from './useApi';
import type {
  TransferActiveToInactive,
  TransferFilter,
  TransferSummary,
  ApproveTransferPayload,
  RejectTransferPayload,
  FinalVerifyTransferPayload,
} from '~/types/transfer-active-to-inactive';

/** Composable untuk Atasan Managerial — persetujuan/verifikasi usulan. */
export const useTransferApproval = () => {
  const { apiGet, apiPatch, apiPost } = useApi();

  const list = ref<TransferActiveToInactive[]>([]);
  const summary = ref<TransferSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const meta = ref<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

  /** Daftar usulan yang ditujukan ke atasan yang login. */
  const fetchApprovalList = async (filter: TransferFilter = {}) => {
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

  /** Summary khusus atasan (menunggu verifikasi, disetujui, ditolak, selesai). */
  const fetchApprovalSummary = async (): Promise<TransferSummary | null> => {
    try {
      const res: any = await apiGet('/transfer-active-to-inactive/summary', {}, { skipCache: true });
      summary.value = res?.data ?? null;
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat ringkasan';
      throw e;
    }
  };

  const fetchApprovalDetail = async (id: string): Promise<TransferActiveToInactive | null> => {
    try {
      const res: any = await apiGet(`/transfer-active-to-inactive/${id}`, {}, { skipCache: true });
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat detail';
      throw e;
    }
  };

  /** Verifikasi awal → DISETUJUI_ATASAN. */
  const verifyTransfer = async (id: string, payload: ApproveTransferPayload) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/approve`, payload);
    return r?.data;
  };

  /** Verifikasi terakhir → DISETUJUI_VERIFIKASI_TERAKHIR. */
  const finalVerifyTransfer = async (id: string, payload: FinalVerifyTransferPayload) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/final-verify`, payload);
    return r?.data;
  };

  /** Tolak usulan → DITOLAK_ATASAN (wajib alasan). */
  const rejectTransfer = async (id: string, payload: RejectTransferPayload) => {
    const r: any = await apiPatch(`/transfer-active-to-inactive/${id}/reject`, payload);
    return r?.data;
  };

  /** Generate Berita Acara Serah Terima. */
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
    fetchApprovalList,
    fetchApprovalSummary,
    fetchApprovalDetail,
    verifyTransfer,
    finalVerifyTransfer,
    rejectTransfer,
    generateBeritaAcara,
  };
};