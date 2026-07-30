import { useApi } from '~/composables/useApi';
import type {
  TuUsulanListResponse,
  TuUsulanItem,
  TuFilterParams,
  VerifikasiBerkasPayload,
  AjukanAtasanTuPayload,
  KembalikanPayload,
} from '~/types/tu-verifikasi';

export const useTuVerifikasi = () => {
  const { apiGet, apiPatch } = useApi();

  // GET LIST (paginated)
  const fetchNotifikasiList = async (params: TuFilterParams) => {
    return await apiGet<TuUsulanListResponse>(
      '/tu/notifikasi-usulan',
      { params },
      { skipCache: true }
    );
  };

  // GET DETAIL
  const fetchNotifikasiDetail = async (id: string) => {
    return await apiGet<TuUsulanItem>(`/tu/notifikasi-usulan/${id}`);
  };

  // VERIFIKASI BERKAS FISIK
  const verifikasiBerkas = async (id: string, payload: VerifikasiBerkasPayload) => {
    return await apiPatch<TuUsulanItem>(`/tu/notifikasi-usulan/${id}/verifikasi-berkas`, payload);
  };

  // AJUKAN KE ATASAN TU
  const ajukanAtasanTu = async (id: string, payload: AjukanAtasanTuPayload) => {
    return await apiPatch<TuUsulanItem>(`/tu/notifikasi-usulan/${id}/ajukan-atasan-tu`, payload);
  };

  // KEMBALIKAN KE ATASAN
  const kembalikanKeAtasan = async (id: string, payload: KembalikanPayload) => {
    return await apiPatch<TuUsulanItem>(`/tu/notifikasi-usulan/${id}/kembalikan`, payload);
  };

  return {
    fetchNotifikasiList,
    fetchNotifikasiDetail,
    verifikasiBerkas,
    ajukanAtasanTu,
    kembalikanKeAtasan,
  };
};
