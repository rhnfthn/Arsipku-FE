import { ref, computed } from 'vue';
import { io, Socket } from 'socket.io-client';

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
const isConnected = ref<boolean>(false);
const lastSummaryAt = ref<number>(0);

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
    const token = getToken();
    if (!token) {
      resolve();
      return;
    }

    const url = getSocketUrl();
    socket = io(`${url}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      isConnected.value = true;
      // Request initial summary dari server
      socket?.emit('realtime:subscribe');
    });

    socket.on('disconnect', () => {
      isConnected.value = false;
    });

    // ── Event handlers ──

    socket.on('realtime:summary', (payload: any) => {
      lastSummaryAt.value = Date.now();
      if (!payload) return;

      if (payload.inboxCount != null) {
        const count =
          typeof payload.inboxCount === 'number'
            ? payload.inboxCount
            : payload.inboxCount?.count ?? 0;
        inboxCount.value = count;
      }
      if (payload.labelCounts && typeof payload.labelCounts === 'object') {
        labelCounts.value = payload.labelCounts;
      }
      if (payload.bsreAlert != null) {
        bsreAlert.value = payload.bsreAlert;
      }
      if (payload.naskahDinasVerifikatorWaitingCount != null) {
        naskahDinasVerifikatorWaitingCount.value = Number(payload.naskahDinasVerifikatorWaitingCount);
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

    socket.on('realtime:connected', () => {
      // Server mengkonfirmasi koneksi, 'connect' event sudah handle
    });

    resolve();
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
    isConnected,
    hasBsreAlert,
    // Actions
    init,
    destroy,
    connectSocket,
    disconnectSocket,
  };
}
