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
  status: 'AKTIF' | 'DICABUT';
  revokedAt?: string | null;
  revokedReason?: string | null;
  createdAt: string;
  recipients: ShareRecipient[];
}

export interface ShareSearchParams {
  q: string;
}

export function useNaskahShare() {
  const { apiGet, apiPost, apiDelete, apiPatch, clearApiCache } = useApi();

  // ── State ───────────────────────────────────────
  const sharedByMe = ref<ShareItem[]>([]);
  const sharedToMe = ref<ShareItem[]>([]);
  const pending = ref(false);
  const error = ref<any>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    limit: 20,
  });

  // Search results for user dropdown
  const searchResults = ref<ShareRecipient[]>([]);
  const searchPending = ref(false);

  // ── Fetch shares (tab: shared-by-me | shared-to-me) ──────────
  const fetchShares = async (params: {
    tab?: 'shared-by-me' | 'shared-to-me';
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    jenis?: string;
  } = {}) => {
    pending.value = true;
    error.value = null;
    try {
      const query = new URLSearchParams();
      query.set('tab', params.tab || 'shared-by-me');
      query.set('page', String(params.page || pagination.page));
      query.set('limit', String(params.limit || pagination.limit));
      if (params.search) query.set('search', params.search);
      if (params.status) query.set('status', params.status);
      if (params.jenis) query.set('jenis', params.jenis);

      const res = await apiGet<{
        success: boolean;
        data: ShareItem[];
        total: number;
        page: number;
        limit: number;
      }>(`/naskah-share?${query.toString()}`);

      if (params.tab === 'shared-to-me') {
        sharedToMe.value = res.data || [];
      } else {
        sharedByMe.value = res.data || [];
      }
      pagination.total = res.total || 0;
      pagination.page = res.page || params.page || 1;
      pagination.limit = res.limit || params.limit || 20;
    } catch (err: any) {
      error.value = err;
      console.error('[useNaskahShare] fetchShares error:', err);
    } finally {
      pending.value = false;
    }
  };

  // ── Create share ────────────────────────────────
  const createShare = async (naskahId: string, recipientIds: string[], catatan?: string) => {
    try {
      const res = await apiPost<{
        success: boolean;
        data: any;
        message: string;
      }>('/naskah-share', { naskahId, recipientIds, catatan: catatan || undefined });
      clearApiCache('/naskah-share');
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
      clearApiCache('/naskah-share');
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
      clearApiCache('/naskah-share');
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
          pdfUrl: string | null;
        };
      }>(`/naskah-share/${shareId}/open`);
      return res;
    } catch (err: any) {
      console.error('[useNaskahShare] openNaskah error:', err);
      throw err;
    }
  };

  // ── Mark as read ────────────────────────────────
  const markAsRead = async (shareId: string) => {
    try {
      await apiPatch(`/naskah-share/${shareId}/read`);
      // Update local state
      const item = sharedToMe.value.find((s) => s.id === shareId);
      if (item) {
        const recipient = item.recipients.find((r) => r.status === 'BELUM_DIBACA');
        if (recipient) recipient.status = 'DIBACA';
      }
    } catch (err: any) {
      console.error('[useNaskahShare] markAsRead error:', err);
    }
  };

  // ── Search users for share modal ────────────────
  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      searchResults.value = [];
      return;
    }
    searchPending.value = true;
    try {
      const res = await apiGet<{ success: boolean; data: ShareRecipient[] }>(
        `/naskah-share/search-user?q=${encodeURIComponent(query)}`,
      );
      searchResults.value = res.data || [];
    } catch (err: any) {
      console.error('[useNaskahShare] searchUsers error:', err);
      searchResults.value = [];
    } finally {
      searchPending.value = false;
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
    error,
    pagination,
    searchResults,
    searchPending,
    // actions
    fetchShares,
    createShare,
    revokeRecipient,
    revokeShare,
    openNaskah,
    markAsRead,
    searchUsers,
    clearSearchResults,
    getShareDetail,
  };
}
