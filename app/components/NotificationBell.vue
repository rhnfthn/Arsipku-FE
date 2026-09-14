<template>
  <div ref="bellRef" class="relative">
    <!-- BELL BUTTON -->
    <UTooltip :text="hasUnread ? `${unreadCount} notifikasi belum dibaca` : 'Notifikasi'">
      <button
        type="button"
        class="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        @click="togglePanel"
      >
      <UIcon name="i-lucide-bell" class="w-6 h-6" />

      <!-- BADGE -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
      </button>
    </UTooltip>

    <!-- PANEL -->
    <NotificationPanel
      v-if="showPanel"
      :notifications="notifications"
      :unread-count="unreadCount"
      :is-loading="isLoading"
      :is-connected="isConnected"
      :error="error"
      @mark-read="onMarkRead"
      @mark-all-read="onMarkAllRead"
      @refresh="init"
      @view-all="onViewAll"
      @click-item="onItemClick"
    />

    <ConfirmModal
      v-model="showMarkAllConfirm"
      title="Tandai semua notifikasi dibaca?"
      description="Semua notifikasi yang belum dibaca akan ditandai sebagai sudah dibaca."
      confirm-text="Ya, tandai dibaca"
      cancel-text="Batal"
      loading-text="Menandai..."
      variant="warning"
      :loading="isMarkingAllRead"
      @confirm="confirmMarkAllRead"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useNotifications } from '~/composables/useNotifications';
import type { NotificationItem } from '~/types/notification';

const {
  notifications,
  unreadCount,
  isConnected,
  isLoading,
  error,
  hasUnread,
  init,
  destroy,
  markAsRead,
  markAllAsRead,
  resolveNotificationRoute,
} = useNotifications();
const tokenCookie = useCookie<string | null>('token', { sameSite: 'lax', path: '/' });

const router = useRouter();
const bellRef = ref<HTMLElement | null>(null);
const showPanel = ref(false);
const showMarkAllConfirm = ref(false);
const isMarkingAllRead = ref(false);

const togglePanel = () => {
  showPanel.value = !showPanel.value;
  if (showPanel.value && notifications.value.length === 0 && !isLoading.value) {
    init();
  }
};

const closePanel = (e: MouseEvent) => {
  if (bellRef.value && !bellRef.value.contains(e.target as Node)) {
    showPanel.value = false;
  }
};

const onMarkRead = (id: string) => markAsRead(id);
const onMarkAllRead = () => {
  showMarkAllConfirm.value = true;
};

const confirmMarkAllRead = async () => {
  if (isMarkingAllRead.value) return;
  isMarkingAllRead.value = true;
  try {
    await markAllAsRead();
    showMarkAllConfirm.value = false;
  } finally {
    isMarkingAllRead.value = false;
  }
};
const onViewAll = () => {
  showPanel.value = false;
  router.push('/notifikasi');
};

const onItemClick = (item: NotificationItem) => {
  markAsRead(item.id);
  const route = resolveNotificationRoute(item);
  showPanel.value = false;
  if (route) router.push(route);
};

const getAuthToken = () => {
  if (!process.client) return tokenCookie.value;
  return localStorage.getItem('token') || tokenCookie.value;
};

const initWhenAuthenticated = (force = false) => {
  if (!process.client) return;
  const token = getAuthToken();
  if (!token) {
    destroy();
    return;
  }
  void init(force);
};

onMounted(() => {
  if (process.client) {
    document.addEventListener('click', closePanel, true);
    // Init if token already exists (page refresh / direct navigation)
    if (getAuthToken()) initWhenAuthenticated(true);
  }
});

onBeforeUnmount(() => {
  if (process.client) {
    document.removeEventListener('click', closePanel, true);
  }
});

// Re-init when auth state changes (e.g. logout → login via cookie)
watch(
  () => tokenCookie.value,
  (token) => {
    if (token) initWhenAuthenticated(true);
  },
);
</script>
