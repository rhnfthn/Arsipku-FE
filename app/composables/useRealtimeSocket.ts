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
const tugasAssignedWaitingCount = ref<number>(0);
const isConnected = ref<boolean>(false);
const lastSummaryAt = ref<number>(0);
const correspondenceRoutingUpdate = ref<{
  mutationId: string;
  entityType: string;
  entityId: string;
  action: string;
  occurredAt: string;
} | null>(null);
const naskahLainnyaUpdate = ref<{
  naskahId: string;
  occurredAt: string;
} | null>(null);

// Flag update (note/lock/favorit/arsip) — payload { id_sirkulasi, flag_type, new_value }
const flagUpdate = ref<{
  id_sirkulasi: string;
  flag_type: string;
  new_value: boolean;
  note_text?: string | null;
} | null>(null);

// Tugas board events (Phase 6) — payload ringkas dari server.
const tugasBoardUpdate = ref<{
  boardId: string;
  revision: number;
  action: string;
  taskId?: string | null;
  occurredAt: string;
} | null>(null);

const tugasTaskMoved = ref<{
  boardId: string;
  taskId: string;
  from: string;
  to: string;
  urutan: number;
  revision: number;
  occurredAt: string;
} | null>(null);
const tugasTaskUpdate = ref<{
  boardId: string;
  taskId: string;
  revision: number;
  action: string;
  occurredAt: string;
} | null>(null);

// Tugas forum komentar events — payload ringkas; client fetch komentar
// terkait saat event diterima (komentar tidak menaikkan revision papan).
const tugasCommentAdded = ref<{
  boardId: string;
  taskId: string;
  commentId: string;
  occurredAt: string;
} | null>(null);

const tugasCommentDeleted = ref<{
  boardId: string;
  taskId: string;
  commentId: string;
  occurredAt: string;
} | null>(null);

let socket: Socket | null = null;
let connectPromise: Promise<void> | null = null;
const naskahLainnyaSubscriptions = new Map<string, number>();
const tugasBoardSubscriptions = new Map<string, number>();

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
      for (const naskahId of naskahLainnyaSubscriptions.keys()) {
        socket?.emit('naskah-lainnya:subscribe', { naskahId });
      }
      // Resubscribe seluruh board Tugas aktif setelah reconnect/token refresh.
      for (const boardId of tugasBoardSubscriptions.keys()) {
        socket?.emit('tugas:subscribe', { boardId });
      }
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
      if (payload.tugasAssignedWaitingCount != null) {
        tugasAssignedWaitingCount.value = Number(payload.tugasAssignedWaitingCount);
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

    socket.on('naskah-lainnya:updated', (payload: any) => {
      if (payload?.naskahId) {
        naskahLainnyaUpdate.value = {
          naskahId: String(payload.naskahId),
          occurredAt: String(payload.occurredAt ?? new Date().toISOString()),
        };
      }
    });

    socket.on('flag:update', (payload: any) => {
      if (payload && payload.id_sirkulasi && payload.flag_type) {
        flagUpdate.value = payload;
      }
    });

    socket.on('correspondence-routing:updated', (payload: any) => {
      if (payload?.mutationId) correspondenceRoutingUpdate.value = payload;
    });

    // ── Tugas events (Phase 6) ──

    socket.on('tugas:assigned-count', (payload: any) => {
      if (payload && typeof payload.count === 'number') {
        tugasAssignedWaitingCount.value = payload.count;
      }
    });

    socket.on('tugas:board-updated', (payload: any) => {
      if (payload?.boardId && typeof payload.revision === 'number') {
        tugasBoardUpdate.value = {
          boardId: String(payload.boardId),
          revision: Number(payload.revision),
          action: String(payload.action ?? ''),
          taskId: payload.taskId ?? null,
          occurredAt: String(payload.occurredAt ?? new Date().toISOString()),
        };
      }
    });

    socket.on('tugas:task-moved', (payload: any) => {
      if (payload?.boardId && payload?.taskId) {
        tugasTaskMoved.value = {
          boardId: String(payload.boardId),
          taskId: String(payload.taskId),
          from: String(payload.from ?? ''),
          to: String(payload.to ?? ''),
          urutan: Number(payload.urutan ?? 0),
          revision: Number(payload.revision ?? 0),
          occurredAt: String(payload.occurredAt ?? new Date().toISOString()),
        };
      }
    });

    socket.on('tugas:task-updated', (payload: any) => {
      if (payload?.boardId && payload?.taskId && typeof payload.revision === 'number') {
        tugasTaskUpdate.value = {
          boardId: String(payload.boardId),
          taskId: String(payload.taskId),
          revision: Number(payload.revision),
          action: String(payload.action ?? ''),
          occurredAt: String(payload.occurredAt ?? new Date().toISOString()),
        };
      }
    });

    socket.on('tugas:comment-added', (payload: any) => {
      if (payload?.boardId && payload?.taskId && payload?.commentId) {
        tugasCommentAdded.value = {
          boardId: String(payload.boardId),
          taskId: String(payload.taskId),
          commentId: String(payload.commentId),
          occurredAt: String(payload.occurredAt ?? new Date().toISOString()),
        };
      }
    });

    socket.on('tugas:comment-deleted', (payload: any) => {
      if (payload?.boardId && payload?.taskId && payload?.commentId) {
        tugasCommentDeleted.value = {
          boardId: String(payload.boardId),
          taskId: String(payload.taskId),
          commentId: String(payload.commentId),
          occurredAt: String(payload.occurredAt ?? new Date().toISOString()),
        };
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
  naskahLainnyaSubscriptions.clear();
  tugasBoardSubscriptions.clear();
};

const subscribeNaskahLainnya = (naskahId: string) => {
  const id = String(naskahId ?? '').trim();
  if (!id) return;
  const count = naskahLainnyaSubscriptions.get(id) ?? 0;
  naskahLainnyaSubscriptions.set(id, count + 1);
  if (count === 0 && socket?.connected) {
    socket.emit('naskah-lainnya:subscribe', { naskahId: id });
  }
};

const unsubscribeNaskahLainnya = (naskahId: string) => {
  const id = String(naskahId ?? '').trim();
  if (!id) return;
  const count = naskahLainnyaSubscriptions.get(id) ?? 0;
  if (count > 1) {
    naskahLainnyaSubscriptions.set(id, count - 1);
    return;
  }
  naskahLainnyaSubscriptions.delete(id);
  if (socket?.connected) {
    socket.emit('naskah-lainnya:unsubscribe', { naskahId: id });
  }
};

// ──────────────────────────────────────────────
// Tugas board subscriptions (Phase 6)
// Reference-count agar mount ganda (mis. modal + halaman) tidak
// unsubscribe terlalu dini; resubscribe otomatis saat reconnect.
// ──────────────────────────────────────────────

const subscribeTugasBoard = (boardId: string) => {
  const id = String(boardId ?? '').trim();
  if (!id) return;
  const count = tugasBoardSubscriptions.get(id) ?? 0;
  tugasBoardSubscriptions.set(id, count + 1);
  if (count === 0 && socket?.connected) {
    socket.emit('tugas:subscribe', { boardId: id });
  }
};

const unsubscribeTugasBoard = (boardId: string) => {
  const id = String(boardId ?? '').trim();
  if (!id) return;
  const count = tugasBoardSubscriptions.get(id) ?? 0;
  if (count > 1) {
    tugasBoardSubscriptions.set(id, count - 1);
    return;
  }
  tugasBoardSubscriptions.delete(id);
  if (socket?.connected) {
    socket.emit('tugas:unsubscribe', { boardId: id });
  }
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
    tugasAssignedWaitingCount,
    tugasBoardUpdate,
    tugasTaskMoved,
    tugasTaskUpdate,
    tugasCommentAdded,
    tugasCommentDeleted,
    flagUpdate,
    correspondenceRoutingUpdate,
    naskahLainnyaUpdate,
    isConnected,
    hasBsreAlert,
    // Socket reference (for custom event listeners)
    socket: computed(() => socket),
    // Actions
    init,
    destroy,
    connectSocket,
    disconnectSocket,
    subscribeNaskahLainnya,
    unsubscribeNaskahLainnya,
    subscribeTugasBoard,
    unsubscribeTugasBoard,
  };
}
