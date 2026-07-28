import { ref } from 'vue';
import { useApi } from './useApi';
import type {
  UsulanPindah,
  UsulanPindahFilter,
  UsulanPindahSummary,
  CreateUsulanPindahPayload,
  ApproveUsulanPayload,
  RejectUsulanPayload,
  FinalVerifyUsulanPayload,
  PreparePhysicalPayload,
} from '~/types/usulan-pindah';

/**
 * Composable untuk modul Usulan Pindah Arsip Inaktif.
 * Memanggil endpoint /usulan-pindah/* di backend.
 */
export const useUsulanPindah = () => {
  const { apiGet, apiPost, apiPatch } = useApi();

  const usulanList = ref<UsulanPindah[]>([]);
  const summary = ref<UsulanPindahSummary | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const meta = ref<{ page: number; limit: number; total: number; totalPages: number } | null>(null);

  /** Ambil list usulan dengan filter & pagination. */
  const fetchUsulanList = async (filter: UsulanPindahFilter = {}) => {
    loading.value = true;
    error.value = null;
    try {
      const params: Record<string, any> = { ...filter };
      Object.keys(params).forEach((k) => {
        if (params[k] === undefined || params[k] === null || params[k] === '') {
          delete params[k];
        }
      });
      const res: any = await apiGet('/usulan-pindah', { params }, { skipCache: true });
      usulanList.value = res?.data ?? [];
      meta.value = res?.meta ?? null;
      return res;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat usulan pindah';
      usulanList.value = [];
      meta.value = null;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  /** Ambil ringkasan dashboard. */
  const fetchSummary = async (): Promise<UsulanPindahSummary | null> => {
    try {
      const res: any = await apiGet('/usulan-pindah/summary', {}, { skipCache: true });
      summary.value = res?.data ?? null;
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat ringkasan';
      throw e;
    }
  };

  /** Ambil detail satu usulan. */
  const fetchUsulanDetail = async (id: string): Promise<UsulanPindah | null> => {
    try {
      const res: any = await apiGet(`/usulan-pindah/${id}`, {}, { skipCache: true });
      return res?.data ?? null;
    } catch (e: any) {
      error.value = e?.message || 'Gagal memuat detail usulan';
      throw e;
    }
  };

  /** Buat usulan baru. */
  const createUsulan = async (payload: CreateUsulanPindahPayload): Promise<UsulanPindah> => {
    const res: any = await apiPost('/usulan-pindah', payload);
    return res?.data;
  };

  /** Kirim usulan ke atasan. */
  const sendUsulan = async (id: string): Promise<UsulanPindah> => {
    const res: any = await apiPatch(`/usulan-pindah/${id}/send`, {});
    return res?.data;
  };

  /** Atasan setujui usulan. */
  const approveUsulan = async (
    id: string,
    payload: ApproveUsulanPayload
  ): Promise<UsulanPindah> => {
    const res: any = await apiPatch(`/usulan-pindah/${id}/approve`, payload);
    return res?.data;
  };

  /** Atasan tolak usulan. */
  const rejectUsulan = async (id: string, payload: RejectUsulanPayload): Promise<UsulanPindah> => {
    const res: any = await apiPatch(`/usulan-pindah/${id}/reject`, payload);
    return res?.data;
  };

  /** Verifikasi terakhir. */
  const finalVerifyUsulan = async (
    id: string,
    payload: FinalVerifyUsulanPayload
  ): Promise<UsulanPindah> => {
    const res: any = await apiPatch(`/usulan-pindah/${id}/final-verify`, payload);
    return res?.data;
  };

  /** Kirim usulan yang sudah disetujui. */
  const dispatchUsulan = async (id: string): Promise<UsulanPindah> => {
    const res: any = await apiPatch(`/usulan-pindah/${id}/dispatch`, {});
    return res?.data;
  };

  /** Siapkan berkas fisik. */
  const preparePhysical = async (
    id: string,
    payload: PreparePhysicalPayload
  ): Promise<UsulanPindah> => {
    const res: any = await apiPatch(`/usulan-pindah/${id}/prepare-physical`, payload);
    return res?.data;
  };

  /** Tandai selesai. */
  const completeUsulan = async (id: string): Promise<UsulanPindah> => {
    const res: any = await apiPatch(`/usulan-pindah/${id}/complete`, {});
    return res?.data;
  };

  /** Generate berita acara. */
  const generateBeritaAcara = async (id: string): Promise<UsulanPindah> => {
    const res: any = await apiPost(`/usulan-pindah/${id}/berita-acara`, {});
    return res?.data;
  };

  return {
    usulanList,
    summary,
    loading,
    error,
    meta,
    fetchUsulanList,
    fetchSummary,
    fetchUsulanDetail,
    createUsulan,
    sendUsulan,
    approveUsulan,
    rejectUsulan,
    finalVerifyUsulan,
    dispatchUsulan,
    preparePhysical,
    completeUsulan,
    generateBeritaAcara,
  };
};
