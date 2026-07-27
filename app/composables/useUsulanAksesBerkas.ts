import { ref, reactive } from 'vue';
import { useApi } from '~/composables/useApi';
import type {
  UsulanAksesBerkas,
  UsulanAksesBerkasListResponse,
  CreateUsulanAksesBerkasPayload,
  VerifikasiPengusulPayload,
  VerifikasiPemberiPayload,
  PilihBerkasPayload,
  PersetujuanPemberiPayload,
  VerifikatorItem,
} from '~/types/usulan-akses-berkas';

export function useUsulanAksesBerkas() {
  const { apiGet, apiPost, apiPatch, clearApiCache } = useApi();

  // ── State ───────────────────────────────────────
  const usulanList = ref<UsulanAksesBerkas[]>([]);
  const usulanDetail = ref<UsulanAksesBerkas | null>(null);
  const verifikatorList = ref<VerifikatorItem[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    limit: 20,
  });

  // ── GET /usulan-akses-berkas/verifikator ────────
  const fetchVerifikator = async () => {
    pending.value = true;
    error.value = null;
    try {
      const res = await apiGet<{
        success: boolean;
        data: VerifikatorItem[];
        total: number;
      }>('/usulan-akses-berkas/verifikator', undefined, { skipCache: true });
      verifikatorList.value = res.data || [];
      return res;
    } catch (err: any) {
      error.value = err;
      console.error('[useUsulanAksesBerkas] fetchVerifikator error:', err);
      throw err;
    } finally {
      pending.value = false;
    }
  };

  // ── GET /usulan-akses-berkas (list) ─────────────
  const fetchList = async (params: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    pending.value = true;
    error.value = null;
    try {
      const query = new URLSearchParams();
      if (params.status) query.set('status', params.status);
      query.set('page', String(params.page || pagination.page));
      query.set('limit', String(params.limit || pagination.limit));

      const res = await apiGet<UsulanAksesBerkasListResponse>(
        `/usulan-akses-berkas?${query.toString()}`,
        undefined,
        { skipCache: true },
      );
      usulanList.value = res.data || [];
      pagination.total = res.total || 0;
      pagination.page = res.page || params.page || 1;
      pagination.limit = res.limit || params.limit || 20;
      return res;
    } catch (err: any) {
      error.value = err;
      console.error('[useUsulanAksesBerkas] fetchList error:', err);
      throw err;
    } finally {
      pending.value = false;
    }
  };

  // ── GET /usulan-akses-berkas/:id (detail) ───────
  const fetchDetail = async (id: string) => {
    pending.value = true;
    error.value = null;
    try {
      const res = await apiGet<UsulanAksesBerkas>(
        `/usulan-akses-berkas/${id}`,
        undefined,
        { skipCache: true },
      );
      usulanDetail.value = res;
      return res;
    } catch (err: any) {
      error.value = err;
      console.error('[useUsulanAksesBerkas] fetchDetail error:', err);
      throw err;
    } finally {
      pending.value = false;
    }
  };

  // ── POST /usulan-akses-berkas (create) ──────────
  const createUsulan = async (payload: CreateUsulanAksesBerkasPayload) => {
    try {
      const res = await apiPost<UsulanAksesBerkas>(
        '/usulan-akses-berkas',
        payload,
      );
      clearApiCache('/usulan-akses-berkas');
      return res;
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] createUsulan error:', err);
      throw err;
    }
  };

  // ── PATCH verifikasi pengusul (per jenjang) ────
  const verifikasiPengusul = async (
    id: string,
    jenjang: 1 | 2 | 3,
    payload: VerifikasiPengusulPayload,
  ) => {
    const suffix =
      jenjang === 1
        ? 'verifikasi-pengusul'
        : jenjang === 2
          ? 'verifikasi-pengusul-vp'
          : 'verifikasi-pengusul-evp';
    try {
      const res = await apiPatch<UsulanAksesBerkas>(
        `/usulan-akses-berkas/${id}/${suffix}`,
        payload,
      );
      clearApiCache('/usulan-akses-berkas');
      return res;
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] verifikasiPengusul error:', err);
      throw err;
    }
  };

  // ── PATCH verifikasi pemberi (Sekretaris) ───────
  const verifikasiPemberi = async (
    id: string,
    payload: VerifikasiPemberiPayload,
  ) => {
    try {
      const res = await apiPatch<UsulanAksesBerkas>(
        `/usulan-akses-berkas/${id}/verifikasi-pemberi`,
        payload,
      );
      clearApiCache('/usulan-akses-berkas');
      return res;
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] verifikasiPemberi error:', err);
      throw err;
    }
  };

  // ── POST pilih berkas ──────────────────────────
  const pilihBerkas = async (id: string, payload: PilihBerkasPayload) => {
    try {
      const res = await apiPost<UsulanAksesBerkas>(
        `/usulan-akses-berkas/${id}/pilih-berkas`,
        payload,
      );
      clearApiCache('/usulan-akses-berkas');
      return res;
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] pilihBerkas error:', err);
      throw err;
    }
  };

  // ── PATCH persetujuan pemberi (per jenjang) ────
  const persetujuanPemberi = async (
    id: string,
    jenjang: 1 | 2 | 3,
    payload: PersetujuanPemberiPayload,
  ) => {
    const suffix =
      jenjang === 1
        ? 'persetujuan-pemberi'
        : jenjang === 2
          ? 'persetujuan-pemberi-vp'
          : 'persetujuan-pemberi-evp';
    try {
      const res = await apiPatch<UsulanAksesBerkas>(
        `/usulan-akses-berkas/${id}/${suffix}`,
        payload,
      );
      clearApiCache('/usulan-akses-berkas');
      return res;
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] persetujuanPemberi error:', err);
      throw err;
    }
  };

  // ── GET trail ──────────────────────────────────
  const fetchTrail = async (id: string) => {
    try {
      const res = await apiGet<any[]>(
        `/usulan-akses-berkas/${id}/trail`,
        undefined,
        { skipCache: true },
      );
      return res;
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] fetchTrail error:', err);
      throw err;
    }
  };

  return {
    // state
    usulanList,
    usulanDetail,
    verifikatorList,
    pending,
    error,
    pagination,
    // actions
    fetchVerifikator,
    fetchList,
    fetchDetail,
    createUsulan,
    verifikasiPengusul,
    verifikasiPemberi,
    pilihBerkas,
    persetujuanPemberi,
    fetchTrail,
  };
}