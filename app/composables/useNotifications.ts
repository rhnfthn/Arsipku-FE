// fe/app/composables/useNotifications.ts
import { ref, readonly, computed } from 'vue';
import { io, Socket } from 'socket.io-client';
import type {
  NotificationFetchOptions,
  NotificationItem,
  NotificationListMeta,
  NotificationListResponse,
  UnreadCountResponse,
} from '~/types/notification';

// Singleton state global (Nuxt auto-import composable, tapi state harus shared)
const notifications = ref<NotificationItem[]>([]);
const unreadCount = ref<number>(0);
const isConnected = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const error = ref<any>(null);
const notificationMeta = ref<NotificationListMeta>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
});

let socket: Socket | null = null;
let connectPromise: Promise<void> | null = null;

// ── Inflight / stale guards untuk mencegah duplicate fetch ──
let inflightNotifications: Promise<NotificationItem[]> | null = null;
let inflightUnreadCount: Promise<number> | null = null;
let lastNotificationsFetchAt = 0;
let lastUnreadCountFetchAt = 0;
let activeToken: string | null = null;

const resetFetchGuards = () => {
  inflightNotifications = null;
  inflightUnreadCount = null;
  lastNotificationsFetchAt = 0;
  lastUnreadCountFetchAt = 0;
};
const FETCH_DEDUP_MS = 3_000; // 3 detik — jangan fetch ulang jika baru saja fetch

const getSocketUrl = (): string => {
  const config = useRuntimeConfig();
  return (config.public.socketUrl as string) || (config.public.apiBaseUrl as string) || '';
};

const getToken = (): string | null => {
  if (!process.client) return null;
  return localStorage.getItem('token');
};

/**
 * Resolve route object dari notification data.action.
 */
export const resolveNotificationRoute = (notification: NotificationItem) => {
  const data = notification.data || ({} as any);
  const action = data.action as string | undefined;

  const baseRoutes: Record<string, string> = {
    OPEN_INBOX_DETAIL: '/korespondensi/kotak-masuk',
    OPEN_DISPOSISI_DETAIL: '/disposisi',
    OPEN_USULAN_PENOMORAN: '/usulan-penomoran',
    OPEN_PERSETUJUAN_PENOMORAN: '/persetujuan-penomoran',
    OPEN_VERIFIKASI_PENOMORAN: '/penomoran/verifikasi',
    OPEN_DETAIL_PENOMORAN: '/penomoran',
    OPEN_DIGSIG_VERIFIKASI: '/digsig/verifikasi',
    OPEN_DIGSIG_PENANDATANGANAN: '/digsig/penandatanganan',
    OPEN_DIGSIG_DETAIL: '/digsig',
    OPEN_NASKAH_DINAS_VERIFIKATOR: '/naskah-dinas/verifikator',
    OPEN_NASKAH_DINAS_DETAIL: '/naskah-dinas',
    OPEN_DELEGASI: '/delegasi',
    OPEN_SYSTEM_ANNOUNCEMENT: '/pengumuman',
  };

  const base = action ? baseRoutes[action] : null;
  if (!base) return null;

  // Bawa query payload agar halaman tujuan bisa auto-buka detail
  const query: Record<string, string> = {};
  if (data.naskahId) query.naskahId = String(data.naskahId);
  if (data.sirkulasiId) query.sirkulasiId = String(data.sirkulasiId);
  if (data.disposisiId) query.disposisiId = String(data.disposisiId);
  if (data.verifierId) query.verifierId = String(data.verifierId);
  if (data.nomor) query.nomor = String(data.nomor);

  return { path: base, query };
};

export const useNotifications = () => {
  const { apiGet, apiPatch, apiDelete } = useApi();

  // ============================================================
  // REST
  // ============================================================

  const fetchNotifications = async (
    pageOrOptions: number | NotificationFetchOptions = 1,
    limit = 20,
    force = false,
  ): Promise<NotificationItem[]> => {
    const options: NotificationFetchOptions =
      typeof pageOrOptions === 'number'
        ? { page: pageOrOptions, limit }
        : pageOrOptions;

    // Inflight guard — jika fetch yang sama sedang berjalan, tunggu itu saja
    if (inflightNotifications && !force) return inflightNotifications;

    // Stale guard — jika fetch page 1 limit 20 baru saja dilakukan (<3s), skip
    const isDefaultFetch =
      (options.page ?? 1) === 1 && (options.limit ?? 20) === 20 && options.isRead == null && !options.type;
    if (!force && isDefaultFetch && Date.now() - lastNotificationsFetchAt < FETCH_DEDUP_MS) {
      return notifications.value;
    }

    const params: Record<string, string | number | boolean> = {
      page: options.page ?? 1,
      limit: options.limit ?? 20,
    };

    if (typeof options.isRead === 'boolean') params.isRead = options.isRead;
    if (options.type) params.type = options.type;

    isLoading.value = true;
    error.value = null;

    inflightNotifications = (async () => {
      try {
        const res = (await apiGet('/notifications', {
          params,
        }, { skipCache: true })) as NotificationListResponse;
        const list = res?.data ?? [];
        notifications.value = list;
        notificationMeta.value = res?.meta ?? {
          page: Number(params.page) || 1,
          limit: Number(params.limit) || 20,
          total: list.length,
          totalPages: list.length > 0 ? 1 : 0,
        };
        lastNotificationsFetchAt = Date.now();
        return list;
      } catch (err) {
        error.value = err;
        console.error('[useNotifications] fetchNotifications error:', err);
        return [];
      } finally {
        isLoading.value = false;
        inflightNotifications = null;
      }
    })();

    return inflightNotifications;
  };

  const fetchUnreadCount = async (force = false): Promise<number> => {
    // Inflight guard
    if (inflightUnreadCount && !force) return inflightUnreadCount;

    // Stale guard — jika baru saja fetch (<3s), skip
    if (!force && Date.now() - lastUnreadCountFetchAt < FETCH_DEDUP_MS) {
      return unreadCount.value;
    }

    inflightUnreadCount = (async () => {
      try {
        const res = (await apiGet('/notifications/unread-count', {}, { skipCache: true })) as UnreadCountResponse;
        const count = res?.data?.count ?? 0;
        unreadCount.value = count;
        lastUnreadCountFetchAt = Date.now();
        return count;
      } catch (err) {
        console.error('[useNotifications] fetchUnreadCount error:', err);
        return unreadCount.value;
      } finally {
        inflightUnreadCount = null;
      }
    })();

    return inflightUnreadCount;
  };

  const markAsRead = async (id: string): Promise<void> => {
    try {
      await apiPatch(`/notifications/${id}/read`);
      // Update local state
      const item = notifications.value.find((n) => n.id === id);
      if (item && !item.isRead) {
        item.isRead = true;
        item.readAt = new Date().toISOString();
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } catch (err) {
      console.error('[useNotifications] markAsRead error:', err);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      await apiPatch('/notifications/read-all');
      notifications.value.forEach((n) => {
        if (!n.isRead) {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        }
      });
      unreadCount.value = 0;
    } catch (err) {
      console.error('[useNotifications] markAllAsRead error:', err);
    }
  };

  const deleteNotification = async (id: string): Promise<void> => {
    try {
      await apiDelete(`/notifications/${id}`);
      const idx = notifications.value.findIndex((n) => n.id === id);
      if (idx >= 0) {
        const removed = notifications.value[idx];
        notifications.value.splice(idx, 1);
        if (!removed.isRead) {
          unreadCount.value = Math.max(0, unreadCount.value - 1);
        }
      }
    } catch (err) {
      console.error('[useNotifications] deleteNotification error:', err);
    }
  };

  // ============================================================
  // WebSocket
  // ============================================================

  const connectSocket = async (): Promise<void> => {
    if (!process.client) return;
    if (socket && socket.connected) return;
    if (connectPromise) return connectPromise;

    connectPromise = new Promise<void>((resolve) => {
      const token = getToken();
      if (!token) {
        console.warn('[useNotifications] No token, skip socket connect');
        connectPromise = null;
        resolve();
        return;
      }

      const url = getSocketUrl();
      socket = io(`${url}/notifications`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
      });

      socket.on('connect', () => {
        isConnected.value = true;
        console.log('[useNotifications] Socket connected');
      });

      socket.on('disconnect', () => {
        isConnected.value = false;
        console.log('[useNotifications] Socket disconnected');
      });

      socket.on('connect_error', (err: any) => {
        isConnected.value = false;
        console.warn('[useNotifications] Socket connect_error:', err?.message);
      });

      // Realtime events
      socket.on('notification:new', (payload: NotificationItem) => {
        // Prepend jika belum ada
        const exists = notifications.value.some((n) => n.id === payload.id);
        if (!exists) {
          notifications.value.unshift(payload);
        }
        unreadCount.value += 1;
      });

      socket.on('notification:count', (payload: { positionId: string; count: number }) => {
        if (typeof payload?.count === 'number') {
          unreadCount.value = payload.count;
        }
      });

      socket.on('notification:read', (payload: { notificationId: string }) => {
        const item = notifications.value.find((n) => n.id === payload?.notificationId);
        if (item && !item.isRead) {
          item.isRead = true;
          item.readAt = new Date().toISOString();
        }
      });

      socket.on('notification:read-all', () => {
        notifications.value.forEach((n) => {
          n.isRead = true;
          if (!n.readAt) n.readAt = new Date().toISOString();
        });
        unreadCount.value = 0;
      });

      socket.on('notification:deleted', (payload: { notificationId: string }) => {
        const idx = notifications.value.findIndex((n) => n.id === payload?.notificationId);
        if (idx >= 0) notifications.value.splice(idx, 1);
      });

      socket.on('notification:sync', async () => {
        // Saat reconnect/sync, refresh dari REST — tapi hanya jika data sudah stale.
        // Inflight/stale guard di fetchUnreadCount/fetchNotifications akan skip
        // jika data baru saja dimuat oleh init().
        await Promise.all([fetchUnreadCount(), fetchNotifications(1, 20)]);
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

  // ============================================================
  // Init (dipanggil saat user authenticated)
  // ============================================================

  const init = async (force = false) => {
    if (!process.client) return;
    const token = getToken();
    if (!token) return;

    if (token !== activeToken) {
      activeToken = token;
      resetFetchGuards();
      disconnectSocket();
      force = true;
    }

    await Promise.all([fetchUnreadCount(force), fetchNotifications(1, 20, force)]);
    await connectSocket();
  };

  // ============================================================
  // Cleanup (dipanggil saat logout/unmount app)
  // ============================================================

  const destroy = () => {
    disconnectSocket();
    activeToken = null;
    resetFetchGuards();
    notifications.value = [];
    unreadCount.value = 0;
    notificationMeta.value = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };
    error.value = null;
  };

  return {
    // state (readonly)
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    notificationMeta: readonly(notificationMeta),
    isConnected: readonly(isConnected),
    isLoading: readonly(isLoading),
    error: readonly(error),

    // computed
    hasUnread: computed(() => unreadCount.value > 0),

    // actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    connectSocket,
    disconnectSocket,
    init,
    destroy,
    resolveNotificationRoute,
  };
};
