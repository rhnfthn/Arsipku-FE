import { ref } from 'vue';
import { useApi } from './useApi';
import type {
  NaskahListItem,
  NaskahDetail,
  BuatNaskahPayload,
  EvaluasiPayload,
  BlankoPayload,
  TandaTanganPayload,
  ApiResponse,
  LegalRecipient,
  DirectorApprovalItem,
  SheetFormModel,
} from '~/types/naskah-lainnya';

export function useNaskahLainnya() {
  const { apiGet, apiPost, apiPut, apiDelete } = useApi();

  const items = ref<NaskahListItem[]>([]);
  const persetujuan = ref<NaskahListItem[]>([]);
  const persetujuanCount = ref(0);
  const legalDrafting = ref<NaskahListItem[]>([]);
  const legalDraftingCount = ref(0);
  const legalRecipients = ref<LegalRecipient[]>([]);
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

  const fetchList = (
    params: { tab?: string; search?: string; jenis?: string; tahapan?: string; page?: number } = {}
  ) =>
    run(
      () => apiGet('/naskah-lainnya', { params }, { skipCache: true }),
      (d) => {
        items.value = d;
      }
    );

  const fetchDetail = (id: string) =>
    run(
      () => apiGet(`/naskah-lainnya/${id}`, {}, { skipCache: true }),
      (d) => {
        detail.value = d;
      }
    );

  const fetchPersetujuan = (status: 'semua' | 'menunggu' | 'disetujui' | 'ditolak' = 'menunggu') =>
    run(
      () => apiGet('/naskah-lainnya/persetujuan', { params: { status } }, { skipCache: true }),
      (d) => {
        persetujuan.value = d;
      }
    );

  const fetchPersetujuanCount = () =>
    run(
      () => apiGet('/naskah-lainnya/persetujuan', {}, { skipCache: true }),
      (d) => {
        persetujuanCount.value = Array.isArray(d) ? d.length : ((d as any) ?? 0);
      }
    );

  // BE legal-drafting endpoint sudah mencakup legal_drafting + persetujuan_direksi
  // + blanko_verbal dengan statusLegal akurat per naskah. Sub-filter statusLegal
  // dilakukan client-side di halaman legal-drafting (tab filter).
  const fetchLegalDrafting = (
    status: 'semua' | 'belum-dikirim' | 'menunggu' | 'revisi' | 'aksi-saya' = 'belum-dikirim'
  ) =>
    run(
      () => apiGet('/naskah-lainnya/legal-drafting', { params: { status } }, { skipCache: true }),
      (d) => {
        legalDrafting.value = d;
      }
    );

  const fetchLegalDraftingCount = () =>
    run(
      () => apiGet('/naskah-lainnya/legal-drafting', {}, { skipCache: true }),
      (d) => {
        legalDraftingCount.value = Array.isArray(d) ? d.length : ((d as any) ?? 0);
      }
    );

  // Pemberi persetujuan legal = person di unit legal (GET /konfigurasi/unit-legal).
  const fetchLegalRecipients = () =>
    run(
      () => apiGet<LegalRecipient[]>('/konfigurasi/unit-legal'),
      (d) => {
        legalRecipients.value = Array.isArray(d) ? d : ((d as any) ?? []);
      }
    );

  const createdId = ref<string | null>(null);
  const create = (payload: BuatNaskahPayload) =>
    run(
      () => apiPost<ApiResponse<{ id: string }>>('/naskah-lainnya', payload),
      (d) => {
        createdId.value = d?.id ?? null;
      }
    );

  const update = (id: string, payload: Partial<BuatNaskahPayload>) =>
    run(
      () => apiPut<ApiResponse<NaskahDetail>>(`/naskah-lainnya/${id}`, payload),
      (d) => {
        detail.value = d;
      }
    );

  // Path real = kontrak BE (Bagian 4 spec). Kunci = method mock (payload object tunggal).
  const ACTION_PATH: Record<string, (id: string, body?: any) => { url: string; body?: any }> = {
    kirim: (id) => ({ url: `/naskah-lainnya/${id}/kirim` }),
    setuju: (id, b) => ({
      url: `/naskah-lainnya/${id}/approval/${b?.approvalId}/setuju`,
      body: { catatan: b?.catatan },
    }),
    tolak: (id, b) => ({
      url: `/naskah-lainnya/${id}/approval/${b?.approvalId}/tolak`,
      body: { catatan: b?.catatan },
    }),
    kembalikan: (id, b) => ({
      url: `/naskah-lainnya/${id}/approval/${b?.approvalId}/kembalikan`,
      body: { catatan: b?.catatan },
    }),
    mulaiLegal: (id) => ({ url: `/naskah-lainnya/${id}/legal-drafting/mulai` }),
    kirimApprovalLegal: (id, b) => ({
      url: `/naskah-lainnya/${id}/legal-drafting/kirim-approval`,
      body: b,
    }),
    kembalikanLegal: (id, b) => ({
      url: `/naskah-lainnya/${id}/legal-drafting/kembalikan`,
      body: { catatan: b?.catatan },
    }),
    evaluasi: (id, b) => ({ url: `/naskah-lainnya/${id}/evaluasi`, body: b }),
    kembalikanEvaluasi: (id, b) => ({
      url: `/naskah-lainnya/${id}/evaluasi/kembalikan`,
      body: { catatan: b?.catatan },
    }),
    simpanBlanko: (id, b) => ({ url: `/naskah-lainnya/${id}/blanko-verbal`, body: b }),
    kirimApprovalBlanko: (id) => ({ url: `/naskah-lainnya/${id}/blanko-verbal/kirim-approval` }),
    tandaTangan: (id, b) => ({ url: `/naskah-lainnya/${id}/tanda-tangan`, body: b ?? {} }),
    // Lembar Persetujuan Direksi
    kirimLembarPersetujuanDireksi: (id, b) => ({
      url: `/naskah-lainnya/${id}/lembar-persetujuan-direksi/kirim`,
      body: b,
    }),
    parafLembarPersetujuanDireksi: (id, b) => ({
      url: `/naskah-lainnya/${id}/lembar-persetujuan-direksi/paraf`,
      body: b,
    }),
    tolakLembarPersetujuanDireksi: (id, b) => ({
      url: `/naskah-lainnya/${id}/lembar-persetujuan-direksi/tolak`,
      body: b,
    }),
    // Blanko Verbal
    kirimBlankoVerbal: (id, b) => ({ url: `/naskah-lainnya/${id}/blanko-verbal/kirim`, body: b }),
    parafBlankoVerbal: (id, b) => ({ url: `/naskah-lainnya/${id}/blanko-verbal/paraf`, body: b }),
    tolakBlankoVerbal: (id, b) => ({ url: `/naskah-lainnya/${id}/blanko-verbal/tolak`, body: b }),
  };

  const act = (id: string, key: string, body?: any) => {
    const { url, body: realBody } = ACTION_PATH[key](id, body);
    return run<NaskahDetail>(
      () => apiPost<ApiResponse<NaskahDetail>>(url, realBody ?? {}),
      (d) => {
        detail.value = d;
      }
    );
  };

  const kirim = (id: string) => act(id, 'kirim');
  const setuju = (id: string, approvalId: string, catatan?: string) =>
    act(id, 'setuju', { approvalId, catatan });
  const tolak = (id: string, approvalId: string, catatan: string) =>
    act(id, 'tolak', { approvalId, catatan });
  const kembalikan = (id: string, approvalId: string, catatan: string) =>
    act(id, 'kembalikan', { approvalId, catatan });
  const mulaiLegal = (id: string) => act(id, 'mulaiLegal');
  const kirimApprovalLegal = (
    id: string,
    approvers: { positionId?: string; nama: string; jabatan: string; persnum?: number }[],
    catatan?: string,
    catatanLegal?: string
  ) => act(id, 'kirimApprovalLegal', { approval: approvers, catatan, catatan_legal: catatanLegal });
  const kembalikanLegal = (id: string, catatan: string) => act(id, 'kembalikanLegal', { catatan });
  const evaluasi = (id: string, payload: EvaluasiPayload) => act(id, 'evaluasi', payload);
  const kembalikanEvaluasi = (id: string, catatan: string) =>
    act(id, 'kembalikanEvaluasi', { catatan });
  const simpanBlanko = (id: string, payload: BlankoPayload) => act(id, 'simpanBlanko', payload);
  const kirimApprovalBlanko = (id: string) => act(id, 'kirimApprovalBlanko');
  const tandaTangan = (id: string, payload: TandaTanganPayload = {}) =>
    act(id, 'tandaTangan', payload);

  // ── Direksi (BOD) ──
  const fetchBodDirectors = async (): Promise<DirectorApprovalItem[]> => {
    const res: any = await apiGet('/org-data/bod', {}, { skipCache: true });
    // BE membungkus semua respons via TransformResponseInterceptor
    // ({ success, data: <controllerReturn> }), dan controller getBod
    // mengembalikan { data: [...] } → array sebenarnya di res.data.data.
    // Tangani ketiga shape (double-wrap, single-wrap, mentah) agar robust.
    const mid = Array.isArray(res) ? res : res?.data;
    const arr = Array.isArray(mid) ? mid : mid?.data;
    return (Array.isArray(arr) ? arr : []) as DirectorApprovalItem[];
  };

  // ── Lembar Persetujuan Direksi ──
  const previewLembarPersetujuanDireksi = async (
    id: string,
    sheet: SheetFormModel,
    catatan?: string
  ): Promise<string> => {
    const body = { ...sheet, catatan };
    const res: any = await apiPost(
      `/naskah-lainnya/${id}/lembar-persetujuan-direksi/preview`,
      body
    );
    return res?.data?.pdfUrl ?? res?.pdfUrl ?? '';
  };

  const kirimLembarPersetujuanDireksi = (id: string, sheet: SheetFormModel, catatan?: string) =>
    act(id, 'kirimLembarPersetujuanDireksi', { ...sheet, catatan });

  const parafLembarPersetujuanDireksi = (id: string, sheet: SheetFormModel, catatan?: string) =>
    act(id, 'parafLembarPersetujuanDireksi', { ...sheet, catatan });

  const tolakLembarPersetujuanDireksi = (id: string, catatan: string) =>
    act(id, 'tolakLembarPersetujuanDireksi', { catatan });

  // ── Blanko Verbal ──
  const previewBlankoVerbal = async (
    id: string,
    sheet: SheetFormModel,
    catatan?: string
  ): Promise<string> => {
    const body = { ...sheet, catatan };
    const res: any = await apiPost(`/naskah-lainnya/${id}/blanko-verbal/preview`, body);
    return res?.data?.pdfUrl ?? res?.pdfUrl ?? '';
  };

  const kirimBlankoVerbal = (id: string, sheet: SheetFormModel, catatan?: string) =>
    act(id, 'kirimBlankoVerbal', { ...sheet, catatan });

  const parafBlankoVerbal = (id: string, sheet: SheetFormModel, catatan?: string) =>
    act(id, 'parafBlankoVerbal', { ...sheet, catatan });

  const tolakBlankoVerbal = (id: string, catatan: string) =>
    act(id, 'tolakBlankoVerbal', { catatan });

  const uploadDokumen = async (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiPost<ApiResponse<{ parameter: { perihal: string; tanggal: string } }>>(
      `/naskah-lainnya/${id}/dokumen`,
      fd
    );
  };

  // Baca parameter docx (perihal/tanggal) TANPA persist — untuk auto-fill perihal
  // saat user memilih naskah, sebelum naskah di-commit (upload versi) saat kirim.
  const parseDokumen = async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiPost<ApiResponse<{ parameter: { perihal: string; tanggal: string } }>>(
      '/naskah-lainnya/parse-docx',
      fd
    );
  };

  const uploadDokumenTambahan = async (id: string, tipe: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiPost<ApiResponse<{ id: string; nama: string; tipe: string }>>(
      `/naskah-lainnya/${id}/dokumen/${tipe}`,
      fd
    );
  };

  const unggahTtdFisik = async (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiPost<ApiResponse<NaskahDetail>>(`/naskah-lainnya/${id}/unggah-ttd-fisik`, fd);
  };

  const uploadDokumenFinalManual = (id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return run<NaskahDetail>(
      () => apiPost<ApiResponse<NaskahDetail>>(`/naskah-lainnya/${id}/dokumen-final-manual`, fd),
      (d) => {
        detail.value = d;
      }
    );
  };

  const ubahStatusFinalManual = (id: string, final: boolean) =>
    run<NaskahDetail>(
      () =>
        apiPut<ApiResponse<NaskahDetail>>(`/naskah-lainnya/${id}/status-final-manual`, { final }),
      (d) => {
        detail.value = d;
      }
    );

  const ubahNomorFinalManual = (id: string, nomor: string) =>
    run<NaskahDetail>(
      () =>
        apiPut<ApiResponse<NaskahDetail>>(`/naskah-lainnya/${id}/nomor-final-manual`, { nomor }),
      (d) => {
        detail.value = d;
      }
    );

  const updateMetadataPenandatanganFisik = (
    id: string,
    penandatangan: { nama: string; jabatan: string; positionId?: string; persnum?: number }[]
  ) =>
    run<NaskahDetail>(
      () =>
        apiPut<ApiResponse<NaskahDetail>>(`/naskah-lainnya/${id}/metadata-penandatangan-fisik`, {
          penandatangan,
        }),
      (d) => {
        detail.value = d;
      }
    );

  const deleteDokumenTambahan = (id: string, dokumenId: string) =>
    apiDelete<ApiResponse<{ id: string }>>(`/naskah-lainnya/${id}/dokumen/${dokumenId}`);

  const getTemplateUrl = (jenis: string, signOption?: string) =>
    apiGet(`/naskah-lainnya/template/${jenis}${signOption ? `?signOption=${signOption}` : ''}`);

  const deleteDraft = (id: string) =>
    apiDelete<ApiResponse<{ id: string }>>(`/naskah-lainnya/${id}`);

  return {
    items,
    persetujuan,
    persetujuanCount,
    legalDrafting,
    legalDraftingCount,
    legalRecipients,
    detail,
    pending,
    error,
    createdId,
    fetchList,
    fetchDetail,
    fetchPersetujuan,
    fetchPersetujuanCount,
    fetchLegalDrafting,
    fetchLegalDraftingCount,
    fetchLegalRecipients,
    create,
    update,
    kirim,
    setuju,
    tolak,
    kembalikan,
    mulaiLegal,
    kirimApprovalLegal,
    kembalikanLegal,
    evaluasi,
    kembalikanEvaluasi,
    simpanBlanko,
    kirimApprovalBlanko,
    tandaTangan,
    uploadDokumen,
    uploadDokumenTambahan,
    parseDokumen,
    unggahTtdFisik,
    uploadDokumenFinalManual,
    ubahStatusFinalManual,
    ubahNomorFinalManual,
    updateMetadataPenandatanganFisik,
    deleteDokumenTambahan,
    getTemplateUrl,
    deleteDraft,
    // Direksi / lembar / blanko
    fetchBodDirectors,
    previewLembarPersetujuanDireksi,
    kirimLembarPersetujuanDireksi,
    parafLembarPersetujuanDireksi,
    tolakLembarPersetujuanDireksi,
    previewBlankoVerbal,
    kirimBlankoVerbal,
    parafBlankoVerbal,
    tolakBlankoVerbal,
  };
}
