// fe/app/composables/useNotifications.ts
import { ref, readonly, computed, watch } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '~/composables/useAuth';
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
const sdeMasalUnreadCount = ref<number>(0);
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
  const type = String(notification.type || '');

  const getString = (...keys: string[]) => {
    for (const key of keys) {
      const value = data[key];
      if (value !== undefined && value !== null && value !== '') return String(value);
    }
    return '';
  };

  const naskahId = getString('naskahId', 'idNaskah', 'id_naskah', 'naskah_id');
  const jenis = getString('jenis', 'jenisNaskah', 'jenis_naskah');
  const sirkulasiId = getString('sirkulasiId', 'idSirkulasi', 'id_sirkulasi', 'sirkulasi_id');
  const disposisiId = getString('disposisiId', 'idDisposisi', 'id_disposisi', 'disposisi_id');
  const verifierId = getString('verifierId', 'idVerifier', 'id_verifier', 'verifier_id');
  const nomor = getString('nomor', 'nomorSurat', 'nomor_surat');
  const requestId = getString('requestId', 'idRequest', 'id_request', 'id_usulan', 'idUsulan');

  const detailQuery: Record<string, string> = {};
  if (jenis) detailQuery.jenis = jenis;
  if (sirkulasiId) detailQuery.sirkulasiId = sirkulasiId;
  if (disposisiId) detailQuery.disposisiId = disposisiId;
  if (verifierId) detailQuery.verifierId = verifierId;
  if (nomor) detailQuery.nomor = nomor;
  if (requestId) detailQuery.requestId = requestId;

  const shouldOpenInboxDetail =
    action === 'OPEN_INBOX_DETAIL' ||
    action === 'OPEN_DISPOSISI_DETAIL' ||
    ['NASKAH_MASUK', 'NASKAH_TEMBUSAN', 'DISPOSISI', 'DISPOSISI_SELESAI'].includes(type);

  if (shouldOpenInboxDetail && naskahId) {
    return {
      path: `/korespondensi/kotak-masuk/${encodeURIComponent(naskahId)}`,
      query: {
        ...detailQuery,
        jenis:
          detailQuery.jenis ||
          (action === 'OPEN_DISPOSISI_DETAIL' || type.startsWith('DISPOSISI') ? 'DI' : 'ND'),
      },
    };
  }

  // Seluruh notifikasi workflow Naskah Lainnya dibuka dari satu pintu detail.
  // Halaman detail akan menampilkan tahap dan aksi aktif sesuai penerima.
  if (
    naskahId &&
    (action?.startsWith('OPEN_NASKAH_LAINNYA_') || type.startsWith('NASKAH_LAINNYA'))
  ) {
    return { path: `/naskah-lainnya/${encodeURIComponent(naskahId)}` };
  }

  const baseRoutes: Record<string, string> = {
    OPEN_INBOX_DETAIL: '/korespondensi/kotak-masuk',
    OPEN_DISPOSISI_DETAIL: '/korespondensi/kotak-masuk',
    OPEN_USULAN_PENOMORAN: '/usulan-penomoran',
    OPEN_PERSETUJUAN_PENOMORAN: '/persetujuan-penomoran',
    OPEN_VERIFIKASI_PENOMORAN: '/penomoran/verifikasi',
    OPEN_DETAIL_PENOMORAN: '/penomoran/nomor',
    OPEN_DIGSIG_VERIFIKASI: '/digsig/verifikasi-dokumen',
    OPEN_DIGSIG_PENANDATANGANAN: '/digsig/penandatanganan',
    OPEN_DIGSIG_DETAIL: '/digsig/penandatanganan',
    OPEN_NASKAH_DINAS_VERIFIKATOR: '/naskah-dinas/verifikator',
    OPEN_NASKAH_DINAS_DETAIL: '/naskah-dinas',
    OPEN_NASKAH_LAINNYA_PERSETUJUAN: '/naskah-lainnya/persetujuan',
    OPEN_NASKAH_LAINNYA_LEGAL_DRAFTING: '/naskah-lainnya/legal-drafting',
    OPEN_DELEGASI: '/delegasi',
    OPEN_SYSTEM_ANNOUNCEMENT: '/pengumuman',
    OPEN_SDE_MASAL_FOLDER: '/korespondensi/sde-masal/folder',
    OPEN_SDE_MASAL_VERIFIKASI: '/korespondensi/sde-masal/verifikasi',
  };

  const base = action ? baseRoutes[action] : null;
  if (!base) return null;

  if (action === 'OPEN_SDE_MASAL_FOLDER') {
    const folderId = getString('folderId', 'folder_id');
    return folderId
      ? { path: `${base}/${encodeURIComponent(folderId)}` }
      : { path: '/korespondensi/sde-masal' };
  }

  // Bawa query payload agar halaman tujuan bisa auto-buka detail
  const query: Record<string, string> = { ...detailQuery };
  if (naskahId) query.naskahId = naskahId;

  return { path: base, query };
};

export const useNotifications = () => {
  const { apiGet, apiPatch, apiDelete } = useApi();
  const toast = useToast();

  // Satu browser hanya boleh memiliki satu kartu toast untuk isi notifikasi
  // SDE Massal yang sama. Watcher ini menjadi lapisan terakhir untuk kasus
  // beberapa listener/socket aktif bersamaan.
  if (process.client) {
    const browser = window as typeof window & {
      __arsipkuSdeMasalToastDedupWatcher?: boolean;
    };
    if (!browser.__arsipkuSdeMasalToastDedupWatcher) {
      browser.__arsipkuSdeMasalToastDedupWatcher = true;
      watch(
        toast.toasts,
        (items) => {
          const seen = new Set<string>();
          let changed = false;
          const deduplicated = items.filter((item) => {
            const title = String(item.title || '').trim();
            if (!title.startsWith('SDE Massal ')) return true;

            const description = String(item.description || '')
              .trim()
              .replace(/\s+/g, ' ');
            const key = `${title}|${description}`;
            if (seen.has(key)) {
              changed = true;
              return false;
            }
            seen.add(key);
            return true;
          });

          if (changed) {
            // Hapus langsung dari state toast agar tidak meninggalkan kartu
            // kosong selama animasi close.
            toast.toasts.value = deduplicated;
          }
        },
        { deep: true, immediate: true },
      );
    }
  }

  const recentToastKeys = useState<Record<string, number>>(
    'notifications:sde-masal-toast-keys',
    () => ({}),
  );
  const toastDedupMs = 5 * 60_000;

  const getNotificationToastKey = (payload: NotificationItem): string => {
    const data = payload.data || {};
    const isSdeMasal = data.category === 'SDE_MASAL';
    if (isSdeMasal) {
      const folderId = String(data.folderId || data.folder_id || '').trim();
      const status = String(data.status || '').trim();
      // Untuk SDE Massal, satu folder pada status workflow yang sama hanya
      // boleh menghasilkan satu toast meskipun event memiliki ID berbeda.
      return `SDE_MASAL|${folderId || payload.body || payload.title || ''}|${status}`;
    }
    return `${payload.title || ''}|${payload.body || ''}`;
  };

  const shouldShowNotificationToast = (payload: NotificationItem): boolean => {
    const key = getNotificationToastKey(payload);
    const now = Date.now();

    Object.entries(recentToastKeys.value).forEach(([cachedKey, timestamp]) => {
      if (now - timestamp > toastDedupMs) delete recentToastKeys.value[cachedKey];
    });

    // Bersihkan toast SDE Massal yang sama bila event lama sudah lebih dulu
    // masuk ke UI sebelum guard ini berjalan. Sisakan satu saja.
    if (payload.data?.category === 'SDE_MASAL') {
      const title = payload.title || 'Notifikasi baru';
      const description = payload.body || undefined;
      const sameToasts = toast.toasts.value.filter(
        (item) => item.title === title && item.description === description,
      );
      if (sameToasts.length > 0) {
        const duplicateIds = new Set(sameToasts.slice(1).map((item) => item.id));
        toast.toasts.value = toast.toasts.value.filter(
          (item) => !duplicateIds.has(item.id),
        );
        recentToastKeys.value[key] = now;
        return false;
      }
    }

    if (recentToastKeys.value[key]) return false;
    recentToastKeys.value[key] = now;
    return true;
  };

  // ============================================================
  // REST
  // ============================================================

  const fetchNotifications = async (
    pageOrOptions: number | NotificationFetchOptions = 1,
    limit = 20,
    force = false
  ): Promise<NotificationItem[]> => {
    const options: NotificationFetchOptions =
      typeof pageOrOptions === 'number' ? { page: pageOrOptions, limit } : pageOrOptions;

    // Inflight guard — jika fetch yang sama sedang berjalan, tunggu itu saja
    if (inflightNotifications && !force) return inflightNotifications;

    // Stale guard — jika fetch page 1 limit 20 baru saja dilakukan (<3s), skip
    const isDefaultFetch =
      (options.page ?? 1) === 1 &&
      (options.limit ?? 20) === 20 &&
      options.isRead == null &&
      !options.type;
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
        const res = (await apiGet(
          '/notifications',
          {
            params,
          },
          { skipCache: true }
        )) as NotificationListResponse;
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
        const res = (await apiGet(
          '/notifications/unread-count',
          {},
          { skipCache: true }
        )) as UnreadCountResponse;
        const count = res?.data?.count ?? 0;
        unreadCount.value = count;
        sdeMasalUnreadCount.value = res?.data?.sdeMasalCount ?? 0;
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
        if (item.data?.category === 'SDE_MASAL') {
          sdeMasalUnreadCount.value = Math.max(0, sdeMasalUnreadCount.value - 1);
        }
      }
    } catch (err) {
      console.error('[useNotifications] markAsRead error:', err);
    }
  };

  const markNaskahNotificationsAsRead = async (naskahId: string): Promise<void> => {
    if (!naskahId) return;

    try {
      await apiPatch(`/notifications/naskah/${encodeURIComponent(naskahId)}/read`);
      let changed = 0;
      notifications.value.forEach((n) => {
        const data = n.data || {};
        const relatedNaskahId = data.naskahId || data.idNaskah || data.id_naskah || data.naskah_id;
        if (String(relatedNaskahId || '') === String(naskahId) && !n.isRead) {
          n.isRead = true;
          n.readAt = new Date().toISOString();
          changed += 1;
        }
      });

      if (changed > 0) {
        unreadCount.value = Math.max(0, unreadCount.value - changed);
      }
      await fetchUnreadCount(true);
    } catch (err) {
      console.error('[useNotifications] markNaskahNotificationsAsRead error:', err);
    }
  };

  const markSdeMasalFolderNotificationsAsRead = async (folderId: string): Promise<void> => {
    if (!folderId) return;

    try {
      await apiPatch(`/notifications/sde-masal/folder/${encodeURIComponent(folderId)}/read`);
      const normalizedFolderId = String(folderId);
      let changed = 0;
      notifications.value.forEach((notification) => {
        const data = notification.data || {};
        const relatedFolderId = data.folderId || data.folder_id;
        if (
          String(relatedFolderId || '') === normalizedFolderId &&
          !notification.isRead
        ) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();
          changed += 1;
        }
      });

      if (changed > 0) {
        unreadCount.value = Math.max(0, unreadCount.value - changed);
        sdeMasalUnreadCount.value = Math.max(0, sdeMasalUnreadCount.value - changed);
      }
      await fetchUnreadCount(true);
    } catch (err) {
      console.error('[useNotifications] markSdeMasalFolderNotificationsAsRead error:', err);
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
      sdeMasalUnreadCount.value = 0;
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
          if (removed.data?.category === 'SDE_MASAL') {
            sdeMasalUnreadCount.value = Math.max(0, sdeMasalUnreadCount.value - 1);
          }
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
        console.warn('[useNotifications] No token, skip socket connect');
        done();
        return;
      }

      // Safety timeout — don't block init() forever
      const timeout = setTimeout(done, 5000);

      const url = getSocketUrl();
      socket = io(`${url}/notifications`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
      });

      socket.on('connect', () => {
        clearTimeout(timeout);
        isConnected.value = true;
        console.log('[useNotifications] Socket connected');
        done();
      });

      socket.on('disconnect', () => {
        isConnected.value = false;
        console.log('[useNotifications] Socket disconnected');
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
            console.warn('[useNotifications] Token refresh failed:', e);
          }
        }
        console.warn('[useNotifications] Socket connect_error:', err?.message);
        done(); // Don't block init() forever on connection error
      });

      // Realtime events
      socket.on('notification:new', (payload: NotificationItem) => {
        // Prepend jika belum ada
        const exists = notifications.value.some((n) => n.id === payload.id);
        if (!exists) {
          notifications.value.unshift(payload);
          const isSdeMasal = payload.data?.category === 'SDE_MASAL';
          const isReturned = payload.data?.status === 'DIKEMBALIKAN';
          const isVerification = payload.data?.action === 'OPEN_SDE_MASAL_VERIFIKASI';
          if (shouldShowNotificationToast(payload)) {
            toast.add({
              id: `notification:${getNotificationToastKey(payload)}`,
              title: payload.title || 'Notifikasi baru',
              description: payload.body || undefined,
              color: isReturned ? 'warning' : isSdeMasal ? 'info' : 'neutral',
              icon: isReturned
                ? 'i-lucide-rotate-ccw'
                : isVerification
                  ? 'i-lucide-folder-check'
                  : isSdeMasal
                    ? 'i-lucide-folder'
                    : 'i-lucide-bell',
            });
          }
          unreadCount.value += 1;
          if (payload.data?.category === 'SDE_MASAL') {
            sdeMasalUnreadCount.value += 1;
          }
        }
      });

      socket.on(
        'notification:count',
        (payload: { positionId: string; count: number; sdeMasalCount?: number }) => {
          if (typeof payload?.count === 'number') {
            unreadCount.value = payload.count;
          }
          if (typeof payload?.sdeMasalCount === 'number') {
            sdeMasalUnreadCount.value = payload.sdeMasalCount;
          }
        }
      );

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
        sdeMasalUnreadCount.value = 0;
      });

      socket.on('notification:deleted', (payload: { notificationId: string }) => {
        const idx = notifications.value.findIndex((n) => n.id === payload?.notificationId);
        if (idx >= 0) notifications.value.splice(idx, 1);
      });

      socket.on('notification:sync', async () => {
        // Saat reconnect/sync, refresh dari REST — tapi hanya jika data sudah stale.
        // Inflight/stale guard di fetchUnreadCount/fetchNotifications akan skip
        // jika data baru saja dimuat oleh init().
        await Promise.all([fetchUnreadCount(true), fetchNotifications(1, 20, true)]);
      });

      socket.on(
        'rbac:role-changed',
        async (payload: { persnum: number; action: string; roleName?: string }) => {
          const authUser = useState<any>('user');
          if (authUser.value?.persnum === payload.persnum) {
            const { refreshPermissions } = useAuth();
            await refreshPermissions().catch(() => {});
          }
        }
      );

      socket.on(
        'rbac:permission-changed',
        async (payload: { roleName: string; roleId: string }) => {
          const authUser = useState<any>('user');
          const currentRole = authUser.value?.activeRole?.name || authUser.value?.role;
          if (currentRole && currentRole.toUpperCase() === payload.roleName.toUpperCase()) {
            const { refreshPermissions } = useAuth();
            await refreshPermissions().catch(() => {});
          }
        }
      );

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
    recentToastKeys.value = {};
    resetFetchGuards();
    notifications.value = [];
    unreadCount.value = 0;
    sdeMasalUnreadCount.value = 0;
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
    sdeMasalUnreadCount: readonly(sdeMasalUnreadCount),
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
    markNaskahNotificationsAsRead,
    markSdeMasalFolderNotificationsAsRead,
    markAllAsRead,
    deleteNotification,
    connectSocket,
    disconnectSocket,
    init,
    destroy,
    resolveNotificationRoute,
  };
};
