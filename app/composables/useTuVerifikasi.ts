import { useApi } from '~/composables/useApi';
import type {
  TuUsulanListResponse,
  TuUsulanItem,
  TuFilterParams,
  VerifikasiBerkasPayload,
  AjukanAtasanTuPayload,
  KembalikanPayload,
  SetujuiPenerimaanPayload,
  TolakPenerimaanPayload,
  SetujuiTerakhirPayload,
  SelesaiPenataanPayload,
} from '~/types/tu-verifikasi';

export const useTuVerifikasi = () => {
  const { apiGet, apiPatch } = useApi();

  // ─── TU: Notifikasi & Verifikasi Berkas ───
  const fetchNotifikasiList = async (params: TuFilterParams) => {
    return await apiGet<TuUsulanListResponse>('/tu/notifikasi-usulan', { params }, { skipCache: true });
  };

  const fetchNotifikasiDetail = async (id: string) => {
    return await apiGet<TuUsulanItem>(`/tu/notifikasi-usulan/${id}`);
  };

  const verifikasiBerkas = async (id: string, payload: VerifikasiBerkasPayload) => {
    return await apiPatch<TuUsulanItem>(`/tu/notifikasi-usulan/${id}/verifikasi-berkas`, payload);
  };

  const ajukanAtasanTu = async (id: string, payload: AjukanAtasanTuPayload) => {
    return await apiPatch<TuUsulanItem>(`/tu/notifikasi-usulan/${id}/ajukan-atasan-tu`, payload);
  };

  const kembalikanKeAtasan = async (id: string, payload: KembalikanPayload) => {
    return await apiPatch<TuUsulanItem>(`/tu/notifikasi-usulan/${id}/kembalikan`, payload);
  };

  // ─── Atasan TU: Verifikasi Persetujuan ───
  const fetchAtasanTuList = async (params: TuFilterParams) => {
    return await apiGet<TuUsulanListResponse>('/atasan-tu/verifikasi-persetujuan', { params }, { skipCache: true });
  };

  const fetchAtasanTuDetail = async (id: string) => {
    return await apiGet<TuUsulanItem>(`/atasan-tu/verifikasi-persetujuan/${id}`);
  };

  const setujuiPenerimaan = async (id: string, payload: SetujuiPenerimaanPayload) => {
    return await apiPatch<TuUsulanItem>(`/atasan-tu/verifikasi-persetujuan/${id}/setujui-penerimaan`, payload);
  };

  const tolakPenerimaan = async (id: string, payload: TolakPenerimaanPayload) => {
    return await apiPatch<TuUsulanItem>(`/atasan-tu/verifikasi-persetujuan/${id}/tolak-penerimaan`, payload);
  };

  const setujuiTerakhir = async (id: string, payload: SetujuiTerakhirPayload) => {
    return await apiPatch<TuUsulanItem>(`/atasan-tu/verifikasi-persetujuan/${id}/setujui-terakhir`, payload);
  };

  // ─── TU: Penataan Arsip ───
  const fetchPenataanList = async (params: TuFilterParams) => {
    return await apiGet<TuUsulanListResponse>('/tu/penataan-arsip', { params }, { skipCache: true });
  };

  const fetchPenataanDetail = async (id: string) => {
    return await apiGet<TuUsulanItem>(`/tu/penataan-arsip/${id}`);
  };

  const selesaiPenataan = async (id: string, payload: SelesaiPenataanPayload) => {
    return await apiPatch<TuUsulanItem>(`/tu/penataan-arsip/${id}/selesai`, payload);
  };

  return {
    fetchNotifikasiList,
    fetchNotifikasiDetail,
    verifikasiBerkas,
    ajukanAtasanTu,
    kembalikanKeAtasan,
    fetchAtasanTuList,
    fetchAtasanTuDetail,
    setujuiPenerimaan,
    tolakPenerimaan,
    setujuiTerakhir,
    fetchPenataanList,
    fetchPenataanDetail,
    selesaiPenataan,
  };
};
