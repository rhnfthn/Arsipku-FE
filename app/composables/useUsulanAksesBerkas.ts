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
  const pagination = reactive({
    total: 0,
    page: 1,
    limit: 20,
  });

  // ── GET /usulan-akses-berkas/verifikator-bod ───
  // Fetch BOD + delegasi aktif (PT/PH/PS) di divisi.
  // divisiId opsional — kalau kosong, pakai divisi currentUser.
  const fetchVerifikatorBod = async (divisiId?: number) => {
    pending.value = true;
    try {
      const query = divisiId ? `?divisiId=${divisiId}` : '';
      const res = await apiGet<{
        success: boolean;
        data: VerifikatorItem[];
        total: number;
      }>(`/usulan-akses-berkas/verifikator-bod${query}`, undefined, { skipCache: true });
      verifikatorList.value = res.data || [];
      return res;
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] fetchVerifikatorBod error:', err);
      throw err;
    } finally {
      pending.value = false;
    }
  };

  // ── GET /usulan-akses-berkas/eligible-penerima-tambahan ───
  // List orang di divisi pengusul yang eligible sebagai penerima akses tambahan
  const fetchEligiblePenerimaTambahan = async (divisiId?: number) => {
    try {
      const query = divisiId ? `?divisiId=${divisiId}` : '';
      const res = await apiGet<{
        success: boolean;
        data: { persnum: number; nama: string; positionText: string; organizationText: string }[];
        total: number;
      }>(`/usulan-akses-berkas/eligible-penerima-tambahan${query}`, undefined, { skipCache: true });
      return (res as any)?.data ?? [];
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] fetchEligiblePenerimaTambahan error:', err);
      throw err;
    }
  };

  // ── GET /berkas?status=closed_retensi_aktif ────
  // Ambil list berkas yang eligible untuk dipilih saat Pilih Berkas.
  // BE filter by status (closed_retensi_aktif) + jenisBerkas + divisiPemberiId.
  const fetchBerkasEligible = async (
    status = 'closed_retensi_aktif',
    jenisBerkas?: string,
    divisiPemberiId?: number,
  ) => {
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (jenisBerkas) params.set('jenisBerkas', jenisBerkas);
      if (divisiPemberiId) params.set('divisiPemberiId', String(divisiPemberiId));
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await apiGet<any[]>(
        `/usulan-akses-berkas/eligible-berkas${query}`,
        undefined,
        { skipCache: true },
      );
      const payload = (res as any)?.data ?? res;
      return Array.isArray(payload) ? payload : [];
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] fetchBerkasEligible error:', err);
      throw err;
    }
  };

  // ── GET /usulan-akses-berkas/my-entitlements ────
  // List akses berkas yang sudah diterbitkan untuk user yang login.
  const fetchMyEntitlements = async () => {
    try {
      const res = await apiGet<{
        success: boolean;
        data: any[];
        total: number;
      }>('/usulan-akses-berkas/my-entitlements', undefined, { skipCache: true });
      return (res as any)?.data ?? res ?? [];
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] fetchMyEntitlements error:', err);
      throw err;
    }
  };

  // ── PATCH /usulan-akses-berkas/berkas/:berkasId/mark-read ──
  // Tandai entitlement user untuk satu berkas sebagai sudah dibaca (isRead=true).
  const markBerkasRead = async (berkasId: string) => {
    try {
      await apiPatch(`/usulan-akses-berkas/berkas/${berkasId}/mark-read`, {});
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] markBerkasRead error:', err);
    }
  };

  // ── GET /usulan-akses-berkas/berkas/:berkasId ──
  // Detail berkas untuk SE pengusul (cek entitlement)
  const fetchBerkasDetail = async (berkasId: string) => {
    try {
      const res = await apiGet<any>(
        `/usulan-akses-berkas/berkas/${berkasId}`,
        undefined,
        { skipCache: true },
      );
      return (res as any)?.data ?? res;
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] fetchBerkasDetail error:', err);
      throw err;
    }
  };

  // ── GET /usulan-akses-berkas/berkas/:berkasId/naskah ──
  // List naskah di dalam berkas (cek entitlement, bukan permission pemeliharaan)
  const fetchNaskahByBerkas = async (berkasId: string) => {
    try {
      const res = await apiGet<any>(
        `/usulan-akses-berkas/berkas/${berkasId}/naskah`,
        undefined,
        { skipCache: true },
      );
      const payload = (res as any)?.data ?? res;
      return Array.isArray(payload) ? payload : (payload?.data ?? []);
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] fetchNaskahByBerkas error:', err);
      throw err;
    }
  };

  // ── GET /usulan-akses-berkas (list) ─────────────
  const fetchList = async (params: {
    status?: string;
    scope?: string;
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  } = {}) => {
    pending.value = true;
    try {
      const query = new URLSearchParams();
      if (params.status) query.set('status', params.status);
      if (params.scope) query.set('scope', params.scope);
      if (params.search) query.set('search', params.search);
      if (params.sortBy) query.set('sortBy', params.sortBy);
      if (params.sortDir) query.set('sortDir', params.sortDir);
      query.set('page', String(params.page || pagination.page));
      query.set('limit', String(params.limit || pagination.limit));

      const res = await apiGet<UsulanAksesBerkasListResponse>(
        `/usulan-akses-berkas?${query.toString()}`,
        undefined,
        { skipCache: true },
      );
      // BE interceptor wraps response: { success, data: { data: [...], total, page, limit } }
      // apiGet returns res.data which is { data: [...], total, page, limit }
      const payload = (res as any)?.data ?? res;
      usulanList.value = payload.data || payload || [];
      pagination.total = payload.total ?? (Array.isArray(payload) ? payload.length : 0);
      pagination.page = payload.page || params.page || 1;
      pagination.limit = payload.limit || params.limit || 20;
      return res;
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] fetchList error:', err);
      throw err;
    } finally {
      pending.value = false;
    }
  };

  // ── GET /usulan-akses-berkas/:id (detail) ───────
  const fetchDetail = async (id: string) => {
    pending.value = true;
    try {
      const res = await apiGet<UsulanAksesBerkas>(
        `/usulan-akses-berkas/${id}`,
        undefined,
        { skipCache: true },
      );
      // BE interceptor wraps response: { success, data: { ...usulan, steps, selectedBerkas } }
      // apiGet returns res.data which is { success, data: {...} }
      // So the actual usulan object is at res.data (the inner data)
      const payload = (res as any)?.data ?? res;
      usulanDetail.value = payload;
      return payload;
    } catch (err: any) {
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
      clearApiCache();
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
      clearApiCache();
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
      clearApiCache();
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
      clearApiCache();
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
      clearApiCache();
      return res;
    } catch (err: any) {
      console.error('[useUsulanAksesBerkas] persetujuanPemberi error:', err);
      throw err;
    }
  };

  return {
    // state
    usulanList,
    usulanDetail,
    verifikatorList,
    pending,
    pagination,
    // actions
    fetchVerifikatorBod,
    fetchEligiblePenerimaTambahan,
    fetchBerkasEligible,
    fetchMyEntitlements,
    markBerkasRead,
    fetchBerkasDetail,
    fetchNaskahByBerkas,
    fetchList,
    fetchDetail,
    createUsulan,
    verifikasiPengusul,
    verifikasiPemberi,
    pilihBerkas,
    persetujuanPemberi,
  };
}