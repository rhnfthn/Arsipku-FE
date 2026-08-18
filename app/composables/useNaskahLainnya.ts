import { ref } from 'vue';
import { useApi } from './useApi';
import type {
  NaskahListItem, NaskahDetail, BuatNaskahPayload, EvaluasiPayload,
  BlankoPayload, TandaTanganPayload, ApiResponse,
} from '~/types/naskah-lainnya';

export function useNaskahLainnya() {
  const { apiGet, apiPost, apiPut, apiDelete } = useApi();

  const items = ref<NaskahListItem[]>([]);
  const persetujuan = ref<NaskahListItem[]>([]);
  const persetujuanCount = ref(0);
  const detail = ref<NaskahDetail | null>(null);
  const pending = ref(false);
  const error = ref<any>(null);

  const run = async <T>(fn: () => Promise<{ success: boolean; data: T }>, set: (d: T) => void) => {
    pending.value = true;
    error.value = null;
    try {
      const res = await fn();
      set(res.data);
    } catch (e) {
      error.value = e;
      throw e;
    } finally {
      pending.value = false;
    }
  };

  const fetchList = (params: { tab?: string; search?: string; jenis?: string; tahapan?: string; page?: number } = {}) =>
    run(
      () => apiGet('/naskah-lainnya', { params }, { skipCache: true }),
      (d) => { items.value = d; },
    );

  const fetchDetail = (id: string) =>
    run(
      () => apiGet(`/naskah-lainnya/${id}`, {}, { skipCache: true }),
      (d) => { detail.value = d; },
    );

  const fetchPersetujuan = () =>
    run(
      () => apiGet('/naskah-lainnya/persetujuan', {}, { skipCache: true }),
      (d) => { persetujuan.value = d; },
    );

  const fetchPersetujuanCount = () =>
    run(
      () => apiGet('/naskah-lainnya/persetujuan', {}, { skipCache: true }),
      (d) => { persetujuanCount.value = Array.isArray(d) ? d.length : (d as any) ?? 0; },
    );

  const createdId = ref<string | null>(null);
  const create = (payload: BuatNaskahPayload) =>
    run(
      () => apiPost<ApiResponse<{ id: string }>>('/naskah-lainnya', payload),
      (d) => { createdId.value = d?.id ?? null; },
    );

  const update = (id: string, payload: Partial<BuatNaskahPayload>) =>
    run(
      () => apiPut<ApiResponse<NaskahDetail>>(`/naskah-lainnya/${id}`, payload),
      (d) => { detail.value = d; },
    );

  // Path real = kontrak BE (Bagian 4 spec). Kunci = method mock (payload object tunggal).
  const ACTION_PATH: Record<string, (id: string, body?: any) => { url: string; body?: any }> = {
    kirim: (id) => ({ url: `/naskah-lainnya/${id}/kirim` }),
    setuju: (id, b) => ({ url: `/naskah-lainnya/${id}/approval/${b?.approvalId}/setuju`, body: { catatan: b?.catatan } }),
    tolak: (id, b) => ({ url: `/naskah-lainnya/${id}/approval/${b?.approvalId}/tolak`, body: { catatan: b?.catatan } }),
    kembalikan: (id, b) => ({ url: `/naskah-lainnya/${id}/approval/${b?.approvalId}/kembalikan`, body: { catatan: b?.catatan } }),
    mulaiLegal: (id) => ({ url: `/naskah-lainnya/${id}/legal-drafting/mulai` }),
    kirimApprovalLegal: (id) => ({ url: `/naskah-lainnya/${id}/legal-drafting/kirim-approval` }),
    kembalikanLegal: (id, b) => ({ url: `/naskah-lainnya/${id}/legal-drafting/kembalikan`, body: { catatan: b?.catatan } }),
    evaluasi: (id, b) => ({ url: `/naskah-lainnya/${id}/evaluasi`, body: b }),
    simpanBlanko: (id, b) => ({ url: `/naskah-lainnya/${id}/blanko-verbal`, body: b }),
    kirimApprovalBlanko: (id) => ({ url: `/naskah-lainnya/${id}/blanko-verbal/kirim-approval` }),
    tandaTangan: (id, b) => ({ url: `/naskah-lainnya/${id}/tanda-tangan`, body: b ?? {} }),
  };

  const act = (id: string, key: string, body?: any) => {
    const { url, body: realBody } = ACTION_PATH[key](id, body);
    return run<NaskahDetail>(
      () => apiPost<ApiResponse<NaskahDetail>>(url, realBody ?? {}),
      (d) => { detail.value = d; },
    );
  };

  const kirim = (id: string) => act(id, 'kirim');
  const setuju = (id: string, approvalId: string, catatan?: string) => act(id, 'setuju', { approvalId, catatan });
  const tolak = (id: string, approvalId: string, catatan: string) => act(id, 'tolak', { approvalId, catatan });
  const kembalikan = (id: string, approvalId: string, catatan: string) => act(id, 'kembalikan', { approvalId, catatan });
  const mulaiLegal = (id: string) => act(id, 'mulaiLegal');
  const kirimApprovalLegal = (id: string) => act(id, 'kirimApprovalLegal');
  const kembalikanLegal = (id: string, catatan: string) => act(id, 'kembalikanLegal', { catatan });
  const evaluasi = (id: string, payload: EvaluasiPayload) => act(id, 'evaluasi', payload);
  const simpanBlanko = (id: string, payload: BlankoPayload) => act(id, 'simpanBlanko', payload);
  const kirimApprovalBlanko = (id: string) => act(id, 'kirimApprovalBlanko');
  const tandaTangan = (id: string, payload: TandaTanganPayload = {}) => act(id, 'tandaTangan', payload);

  const uploadDokumen = async (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiPost<ApiResponse<{ parameter: { nomor: string; perihal: string; tanggal: string } }>>(`/naskah-lainnya/${id}/dokumen`, fd);
  };

  const uploadDokumenTambahan = async (id: string, tipe: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiPost<ApiResponse<{ id: string; nama: string; tipe: string }>>(`/naskah-lainnya/${id}/dokumen/${tipe}`, fd);
  };

  const deleteDokumenTambahan = (id: string, dokumenId: string) =>
    apiDelete<ApiResponse<{ id: string }>>(`/naskah-lainnya/${id}/dokumen/${dokumenId}`);

  const getTemplateUrl = (jenis: string) =>
    apiGet(`/naskah-lainnya/template/${jenis}`);

  const deleteDraft = (id: string) =>
    apiDelete<ApiResponse<{ id: string }>>(`/naskah-lainnya/${id}`);

  return {
    items, persetujuan, persetujuanCount, detail, pending, error, createdId,
    fetchList, fetchDetail, fetchPersetujuan, fetchPersetujuanCount,
    create, update, kirim, setuju, tolak, kembalikan, mulaiLegal,
    kirimApprovalLegal, kembalikanLegal, evaluasi, simpanBlanko,
    kirimApprovalBlanko, tandaTangan, uploadDokumen, uploadDokumenTambahan,
    deleteDokumenTambahan, getTemplateUrl, deleteDraft,
  };
}