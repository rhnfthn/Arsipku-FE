import { ref, computed } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '~/composables/useAuth';

/**
 * useRealtimeSocket
 *
 * WebSocket composable untuk namespace /realtime.
 * Menggantikan polling 30 detik di Sidebar.vue.
 *
 * State global (singleton):
 *  - inboxCount
 *  - labelCounts
 *  - bsreAlert
 *  - nomorCounts (admin + user)
 *  - naskahDinasVerifikatorWaitingCount
 *  - isConnected
 *
 * Events dari server:
 *  - realtime:summary       → full snapshot (initial sync)
 *  - inbox:count            → inbox unread count
 *  - label:counts           → label counts
 *  - bsre:alert             → BsrE alert status
 *  - nomor:count            → nomor request counts
 *  - naskah-dinas:verifikator-count → verifikator waiting count
 */

// ──────────────────────────────────────────────
// Singleton state (module-level, shared across components)
// ──────────────────────────────────────────────
const inboxCount = ref<number>(0);
const labelCounts = ref<Record<string, number>>({});
const bsreAlert = ref<{
  isActive: boolean;
  message: string | null;
  activatedAt: string | null;
  activatedByName: string | null;
} | null>(null);
const nomorCounts = ref<{
  admin?: any;
  user?: Record<string, any>;
}>({});
const naskahDinasVerifikatorWaitingCount = ref<number>(0);
const arsipPersetujuanWaitingCount = ref<number>(0);
const naskahLainnyaPersetujuanWaitingCount = ref<number>(0);
const naskahLainnyaLegalDraftingWaitingCount = ref<number>(0);
const isConnected = ref<boolean>(false);
const lastSummaryAt = ref<number>(0);

// Flag update (note/lock/favorit/arsip) — payload { id_sirkulasi, flag_type, new_value }
const flagUpdate = ref<{
  id_sirkulasi: string;
  flag_type: string;
  new_value: boolean;
  note_text?: string | null;
} | null>(null);

let socket: Socket | null = null;
let connectPromise: Promise<void> | null = null;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const getSocketUrl = (): string => {
  const config = useRuntimeConfig();
  return (config.public.socketUrl as string) || (config.public.apiBaseUrl as string) || '';
};

const getToken = (): string | null => {
  if (!process.client) return null;
  return localStorage.getItem('token');
};

// ──────────────────────────────────────────────
// Connect / disconnect
// ──────────────────────────────────────────────

const connectSocket = async (): Promise<void> => {
  if (!process.client) return;
  if (socket && socket.connected) return;
  if (connectPromise) return connectPromise;

  connectPromise = new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        connectPromise = null;
        resolve();
      }
    };

    const token = getToken();
    if (!token) {
      done();
      return;
    }

    // Safety timeout — don't block init() forever
    const timeout = setTimeout(done, 5000);

    const url = getSocketUrl();
    socket = io(`${url}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      clearTimeout(timeout);
      isConnected.value = true;
      console.log('[useRealtimeSocket] Socket connected');
      // Request initial summary dari server
      socket?.emit('realtime:subscribe');
      done();
    });

    socket.on('disconnect', () => {
      isConnected.value = false;
      console.log('[useRealtimeSocket] Socket disconnected');
    });

    socket.on('connect_error', async (err: any) => {
      clearTimeout(timeout);
      isConnected.value = false;
      const msg = err?.message || '';
      // JWT expired → refresh token lalu reconnect dengan token baru
      if (msg.includes('jwt expired') || msg.includes('TokenExpiredError')) {
        try {
          const { refreshToken } = useAuth();
          const newToken = await refreshToken();
          if (newToken && socket) {
            socket.auth = { token: newToken };
            socket.connect();
            // Safety timeout — pastikan done() tetap dipanggil jika reconnect
            // tidak kunjung memicu 'connect' maupun 'connect_error' non-expired.
            setTimeout(done, 5000);
            return;
          }
        } catch (e) {
          console.warn('[useRealtimeSocket] Token refresh failed:', e);
        }
      }
      console.warn('[useRealtimeSocket] Socket connect_error:', err?.message);
      done();
    });

    // ── Event handlers ──

    socket.on('realtime:summary', (payload: any) => {
      lastSummaryAt.value = Date.now();
      if (!payload) return;

      if (payload.inboxCount != null) {
        const count =
          typeof payload.inboxCount === 'number'
            ? payload.inboxCount
            : (payload.inboxCount?.data?.count ?? payload.inboxCount?.count ?? 0);
        inboxCount.value = count;
      }
      if (payload.labelCounts && typeof payload.labelCounts === 'object') {
        labelCounts.value = payload.labelCounts;
      }
      if (payload.bsreAlert != null) {
        bsreAlert.value = payload.bsreAlert;
      }
      if (payload.naskahDinasVerifikatorWaitingCount != null) {
        naskahDinasVerifikatorWaitingCount.value = Number(
          payload.naskahDinasVerifikatorWaitingCount
        );
      }
      if (payload.arsipPersetujuanWaitingCount != null) {
        arsipPersetujuanWaitingCount.value = Number(payload.arsipPersetujuanWaitingCount);
      }
      if (payload.naskahLainnyaPersetujuanWaitingCount != null) {
        naskahLainnyaPersetujuanWaitingCount.value = Number(
          payload.naskahLainnyaPersetujuanWaitingCount
        );
      }
      if (payload.naskahLainnyaLegalDraftingWaitingCount != null) {
        naskahLainnyaLegalDraftingWaitingCount.value = Number(
          payload.naskahLainnyaLegalDraftingWaitingCount
        );
      }
      if (payload.nomorCounts && typeof payload.nomorCounts === 'object') {
        nomorCounts.value = { ...nomorCounts.value, ...payload.nomorCounts };
      }
    });

    socket.on('inbox:count', (payload: any) => {
      if (payload && typeof payload.count === 'number') {
        inboxCount.value = payload.count;
      }
    });

    socket.on('label:counts', (payload: any) => {
      if (payload && payload.counts && typeof payload.counts === 'object') {
        labelCounts.value = payload.counts;
      }
    });

    socket.on('bsre:alert', (payload: any) => {
      if (payload) {
        bsreAlert.value = payload;
      }
    });

    socket.on('nomor:count', (payload: any) => {
      if (!payload) return;
      if (payload.scope === 'admin') {
        nomorCounts.value = { ...nomorCounts.value, admin: payload.counts };
      } else if (payload.scope === 'user') {
        nomorCounts.value = { ...nomorCounts.value, user: payload.counts };
      }
    });

    socket.on('naskah-dinas:verifikator-count', (payload: any) => {
      if (payload && typeof payload.waiting === 'number') {
        naskahDinasVerifikatorWaitingCount.value = payload.waiting;
      }
    });

    socket.on('arsip:persetujuan-count', (payload: any) => {
      if (payload && typeof payload.waiting === 'number') {
        arsipPersetujuanWaitingCount.value = payload.waiting;
      }
    });

    socket.on('naskah-lainnya:persetujuan-count', (payload: any) => {
      if (payload && typeof payload.waiting === 'number') {
        naskahLainnyaPersetujuanWaitingCount.value = payload.waiting;
      }
    });

    socket.on('naskah-lainnya:legal-drafting-count', (payload: any) => {
      if (payload && typeof payload.waiting === 'number') {
        naskahLainnyaLegalDraftingWaitingCount.value = payload.waiting;
      }
    });

    socket.on('flag:update', (payload: any) => {
      if (payload && payload.id_sirkulasi && payload.flag_type) {
        flagUpdate.value = payload;
      }
    });

    socket.on('realtime:connected', () => {
      // Server mengkonfirmasi koneksi, 'connect' event sudah handle
    });

    // ── RBAC permission changed handler ──
    // Saat superadmin mengubah permission role, backend emit event ini.
    // Frontend harus re-fetch profile (untuk update activePermissions)
    // lalu cek apakah halaman saat ini masih bisa diakses.
    socket.on('rbac:permission-changed', async (payload: any) => {
      console.log('[useRealtimeSocket] RBAC permission changed:', payload);
      if (!process.client) return;

      // Re-fetch profile untuk update activePermissions
      const { getProfile } = useAuth();
      await getProfile(true); // force refresh

      // Cek apakah halaman saat ini masih bisa diakses
      const { canAccessPage } = useFeatureAccess();
      const route = useRoute();
      if (!canAccessPage(route.path)) {
        // Redirect ke access-denied
        navigateTo(`/access-denied?from=${encodeURIComponent(route.fullPath)}`);
      }
    });

    // Don't resolve here — resolved on 'connect' or 'connect_error' events above
  });

  return connectPromise;
};

const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  isConnected.value = false;
  connectPromise = null;
};

// ──────────────────────────────────────────────
// Public composable
// ──────────────────────────────────────────────

export function useRealtimeSocket() {
  const hasBsreAlert = computed(() => !!bsreAlert.value?.isActive);

  /**
   * Init: connect socket. Initial summary datang dari server
   * via 'realtime:summary' event setelah 'realtime:subscribe'.
   */
  const init = async () => {
    if (!process.client) return;
    const token = getToken();
    if (!token) return;
    await connectSocket();
  };

  const destroy = () => {
    disconnectSocket();
  };

  return {
    // State
    inboxCount,
    labelCounts,
    bsreAlert,
    nomorCounts,
    naskahDinasVerifikatorWaitingCount,
    arsipPersetujuanWaitingCount,
    naskahLainnyaPersetujuanWaitingCount,
    naskahLainnyaLegalDraftingWaitingCount,
    flagUpdate,
    isConnected,
    hasBsreAlert,
    // Socket reference (for custom event listeners)
    socket: computed(() => socket),
    // Actions
    init,
    destroy,
    connectSocket,
    disconnectSocket,
  };
}
