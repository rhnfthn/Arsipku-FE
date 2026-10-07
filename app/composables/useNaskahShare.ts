import { ref, reactive } from 'vue';
import { useApi } from '~/composables/useApi';

export interface ShareRecipient {
  id: string;
  recipientId?: string;
  nama: string;
  positionText: string;
  orgText?: string;
  status?: string;
  openedAt?: string | null;
}
export interface ShareItem {
  id: string;
  naskahId: string;
  naskahPerihal: string;
  naskahNomor: string | null;
  naskahJenis: string;
  pemberiId: string;
  pemberiNama: string;
  pemberiPositionText: string;
  catatan: string | null;
  accessType?: 'SEKALI_LIHAT' | 'RENTANG_WAKTU';
  durationDays?: number | null;
  expiresAt?: string | null;
  status: 'AKTIF' | 'BERAKHIR';
  revokedAt?: string | null;
  revokedReason?: string | null;
  createdAt: string;
  recipients: ShareRecipient[];
}

/** Composable for share feature: state, API calls, helpers. */
export function useNaskahShare() {
  const { apiGet, apiPost, apiDelete, clearApiCache } = useApi();

  // ── State ───────────────────────────────────────
  // sharedByMe: shares sent by user | sharedToMe: shares received by user
  const sharedByMe = ref<ShareItem[]>([]);
  const sharedToMe = ref<ShareItem[]>([]);
  const pending = ref(false);
  const pagination = reactive({
    total: 0,
    page: 1,
    limit: 20,
  });

  // Search results for recipient dropdown
  const searchResults = ref<ShareRecipient[]>([]);

  /** Fetch shares with filter & pagination. Stores to sharedByMe or sharedToMe by tab. */
  const fetchShares = async (params: {
    tab?: 'shared-by-me' | 'shared-to-me';
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    jenis?: string;
    sort?: 'ASC' | 'DESC';
  } = {}) => {
    pending.value = true;
    try {
      const query = new URLSearchParams();
      query.set('tab', params.tab || 'shared-by-me');
      query.set('page', String(params.page || pagination.page));
      query.set('limit', String(params.limit || pagination.limit));
      if (params.search) query.set('search', params.search);
      if (params.status) query.set('status', params.status);
      if (params.jenis) query.set('jenis', params.jenis);
      if (params.sort) query.set('sort', params.sort);

      const res = await apiGet<{
        success: boolean;
        data: ShareItem[];
        total: number;
        page: number;
        limit: number;
      }>(`/naskah-share?${query.toString()}`, undefined, { skipCache: true });

      if (params.tab === 'shared-to-me') {
        sharedToMe.value = res.data || [];
      } else {
        sharedByMe.value = res.data || [];
      }
      pagination.total = res.total || 0;
      pagination.page = res.page || params.page || 1;
      pagination.limit = res.limit || params.limit || 20;
    } catch (err: any) {
      console.error('[useNaskahShare] fetchShares error:', err);
    } finally {
      pending.value = false;
    }
  };

  // ── Create share ────────────────────────────────
  const createShare = async (
    naskahId: string,
    recipientIds: string[],
    catatan?: string,
    accessType?: 'SEKALI_LIHAT' | 'RENTANG_WAKTU',
    durationDays?: number,
    naskahIds?: string[],
    distributionScope: 'SELECTED' | 'ALL_EMPLOYEES' = 'SELECTED',
    customTanggalSelesai?: string,
  ) => {
    try {
      const payload: any = {
        recipientIds: recipientIds.length ? recipientIds : undefined,
        distributionScope,
        catatan: catatan || undefined,
      };
      // Multi-naskah: kirim naskahIds; single: kirim naskahId (backward compat)
      if (naskahIds?.length) {
        payload.naskahIds = naskahIds;
      } else {
        payload.naskahId = naskahId;
      }
      if (accessType) payload.accessType = accessType;
      if (accessType === 'RENTANG_WAKTU' && durationDays) payload.durationDays = durationDays;
      if (accessType === 'RENTANG_WAKTU' && customTanggalSelesai) payload.customTanggalSelesai = customTanggalSelesai;
      const res = await apiPost<{
        success: boolean;
        data: any;
        message: string;
      }>('/naskah-share', payload);
      clearApiCache();
      return res;
    } catch (err: any) {
      console.error('[useNaskahShare] createShare error:', err);
      throw err;
    }
  };

  // ── Revoke single recipient ─────────────────────
  const revokeRecipient = async (shareId: string, recipientId: string, reason?: string) => {
    try {
      const reasonParam = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      const res = await apiDelete<{
        success: boolean; message: string; data: any;
      }>(`/naskah-share/${shareId}/recipients/${recipientId}${reasonParam}`);
      clearApiCache();
      return res;
    } catch (err: any) {
      console.error('[useNaskahShare] revokeRecipient error:', err);
      throw err;
    }
  };

  // ── Revoke share (all recipients) ────────────────
  const revokeShare = async (shareId: string, reason?: string) => {
    try {
      const reasonParam = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      const res = await apiDelete<{
        success: boolean;
        message: string;
        data: any;
      }>(`/naskah-share/${shareId}${reasonParam}`);
      clearApiCache();
      return res;
    } catch (err: any) {
      console.error('[useNaskahShare] revokeShare error:', err);
      throw err;
    }
  };

  // ── Open naskah from share ──────────────────────
  const openNaskah = async (shareId: string) => {
    try {
      const res = await apiPost<{
        success: boolean;
        data: {
          naskahId: string;
          perihal: string;
          nomor: string | null;
          jenis: string;
          pemberi: { id: string; nama: string; positionText: string };
          sharedAt: string;
          accessType?: 'SEKALI_LIHAT' | 'RENTANG_WAKTU';
          expiresAt?: string | null;
          pdfUrl: string | null;
        };
      }>(`/naskah-share/${shareId}/open`);
      return res;
    } catch (err: any) {
      console.error('[useNaskahShare] openNaskah error:', err);
      throw err;
    }
  };

  // ── Send share via email (alamat eksternal manual) ────────────────
  const sendShareEmail = async (
    naskahId: string,
    payload: { to: string; cc?: string; bcc?: string; from_as?: string },
  ) => {
    try {
      const res = await apiPost<{
        success: boolean;
        message: string;
        data: any;
      }>(`/naskah-share/${naskahId}/send-email`, payload);
      clearApiCache();
      return res;
    } catch (err: any) {
      console.error('[useNaskahShare] sendShareEmail error:', err);
      throw err;
    }
  };

  // ── Search users for share modal ────────────────
  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      searchResults.value = [];
      return;
    }
    try {
      const res = await apiGet<{ success: boolean; data: ShareRecipient[] }>(
        `/naskah-share/search-user?q=${encodeURIComponent(query)}`,
      );
      searchResults.value = res.data || [];
    } catch (err: any) {
      console.error('[useNaskahShare] searchUsers error:', err);
      searchResults.value = [];
    }
  };

  const clearSearchResults = () => {
    searchResults.value = [];
  };

  // ── Get share detail ────────────────────────────
  const getShareDetail = async (shareId: string) => {
    try {
      const res = await apiGet<{ success: boolean; data: ShareItem }>(
        `/naskah-share/${shareId}`,
        undefined,
        { skipCache: true },
      );
      return res.data;
    } catch (err: any) {
      console.error('[useNaskahShare] getShareDetail error:', err);
      throw err;
    }
  };

  return {
    // state
    sharedByMe,
    sharedToMe,
    pending,
    pagination,
    searchResults,
    // actions
    fetchShares,
    createShare,
    revokeRecipient,
    revokeShare,
    openNaskah,
    searchUsers,
    clearSearchResults,
    getShareDetail,
    sendShareEmail,
  };
}
