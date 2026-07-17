<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-5">
    <div class="mx-auto space-y-5 pb-10">
      <PageHeader title="Notifikasi" :items="breadcrumbs" />

      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div class="flex flex-col gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary dark:bg-primary-900/30 dark:text-primary-300">
              <UIcon name="i-lucide-bell" class="h-5 w-5" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
                Daftar Notifikasi
              </h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ notificationMeta.total }} data notifikasi
                <span v-if="unreadCount > 0">, {{ unreadCount }} belum dibaca</span>
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              :disabled="isLoading"
              @click="refresh"
            >
              <UIcon name="i-lucide-refresh-cw" class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
              Muat ulang
            </button>

            <button
              v-if="unreadCount > 0"
              type="button"
              class="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              @click="showMarkAllConfirm = true"
            >
              <UIcon name="i-lucide-check-check" class="h-4 w-4" />
              Tandai semua dibaca
            </button>
          </div>
        </div>

        <div class="border-b border-gray-100 bg-gray-50/70 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/40">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div class="space-y-2">
              <p class="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Status
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="item in statusFilterOptions"
                  :key="item.value"
                  type="button"
                  class="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors"
                  :class="
                    activeStatus === item.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'
                  "
                  @click="selectStatus(item.value)"
                >
                  <UIcon :name="item.icon" class="h-4 w-4" />
                  {{ item.label }}
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div ref="typeDropdownRef" class="relative z-30 space-y-2">
                <span class="block text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Jenis
                </span>
                <button
                  type="button"
                  class="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 text-left text-sm text-gray-700 outline-none transition-colors hover:border-primary focus:border-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 sm:w-56"
                  :class="{ 'border-primary ring-1 ring-primary/20': isTypeDropdownOpen }"
                  @click="toggleTypeDropdown"
                >
                  <span class="truncate">{{ selectedTypeLabel }}</span>
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="h-4 w-4 shrink-0 text-gray-400 transition-transform"
                    :class="{ 'rotate-180': isTypeDropdownOpen }"
                  />
                </button>

                <div
                  v-if="isTypeDropdownOpen"
                  class="absolute left-0 top-full mt-1.5 w-full min-w-[224px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
                >
                  <ul class="max-h-64 overflow-y-auto py-1">
                    <li v-for="item in typeFilterOptions" :key="item.value">
                      <button
                        type="button"
                        class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 hover:text-primary dark:hover:bg-primary-900/20"
                        :class="
                          activeType === item.value
                            ? 'font-medium text-primary'
                            : 'text-gray-700 dark:text-gray-200'
                        "
                        @click="selectType(item.value)"
                      >
                        <span class="truncate">{{ item.label }}</span>
                        <UIcon v-if="activeType === item.value" name="i-lucide-check" class="h-4 w-4 shrink-0" />
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <label class="space-y-2">
                <span class="block text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Baris
                </span>
                <select
                  v-model.number="itemsPerPage"
                  class="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors hover:border-primary focus:border-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 sm:w-24"
                  @change="applyFilters"
                >
                  <option v-for="item in rowsOptions" :key="item" :value="item">
                    {{ item }}
                  </option>
                </select>
              </label>

              <button
                type="button"
                class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                :disabled="!hasActiveFilters || isLoading"
                @click="resetFilters"
              >
                <UIcon name="i-lucide-rotate-ccw" class="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>

        <div v-if="isLoading && notifications.length === 0" class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="i in itemsPerPage" :key="i" class="flex gap-4 px-6 py-4">
            <USkeleton class="h-10 w-10 rounded-full" />
            <div class="min-w-0 flex-1 space-y-2">
              <USkeleton class="h-4 w-1/3 rounded" />
              <USkeleton class="h-3 w-4/5 rounded" />
              <USkeleton class="h-3 w-28 rounded" />
            </div>
          </div>
        </div>

        <div v-else-if="error" class="px-6 py-16 text-center">
          <UIcon name="i-lucide-circle-alert" class="mx-auto h-10 w-10 text-red-400" />
          <p class="mt-3 text-sm font-medium text-gray-900 dark:text-white">Gagal memuat notifikasi</p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Periksa koneksi atau coba muat ulang data.</p>
          <button class="mt-3 text-sm font-medium text-primary hover:underline" @click="refresh">
            Coba lagi
          </button>
        </div>

        <div v-else-if="notifications.length === 0" class="px-6 py-16 text-center">
          <UIcon name="i-lucide-bell-off" class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-700" />
          <p class="mt-3 text-sm font-medium text-gray-900 dark:text-white">Tidak ada notifikasi</p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Coba ubah filter atau tunggu notifikasi baru masuk.
          </p>
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <template v-for="(group, gi) in groupedNotifications" :key="gi">
            <!-- Week label -->
            <div
              class="sticky top-0 z-10 bg-gray-50/95 px-6 py-2 text-[11px] font-bold uppercase tracking-wide text-gray-400 backdrop-blur dark:bg-gray-800/95 dark:text-gray-500"
            >
              {{ group.label }}
            </div>
            <!-- Items in this week -->
            <li
              v-for="item in group.items"
              :key="item.id"
              class="group cursor-pointer transition-colors"
              :class="
                item.isRead
                  ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  : 'bg-primary-50/60 hover:bg-primary-50 dark:bg-primary-900/10 dark:hover:bg-primary-900/20'
              "
              @click="openNotification(item)"
            >
              <div class="flex flex-col gap-3 px-6 py-4 md:flex-row md:items-start md:gap-4">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  :class="
                    item.isRead
                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                      : 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'
                  "
                >
                  <UIcon :name="resolveNotificationIcon(item.type)" class="h-5 w-5" />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3
                      class="text-sm font-semibold"
                      :class="item.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-950 dark:text-white'"
                    >
                      {{ item.title }}
                    </h3>
                    <span class="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                      {{ getTypeLabel(item.type) }}
                    </span>
                    <UBadge v-if="!item.isRead" size="xs" color="primary" variant="subtle">
                      Baru
                    </UBadge>
                  </div>

                  <p class="mt-1 line-clamp-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {{ item.body }}
                  </p>

                  <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                    <span>{{ formatNotificationTime(item.createdAt) }}</span>
                    <span>-</span>
                    <span>{{ formatNotificationDateTime(item.createdAt) }}</span>
                  </div>
                </div>

                <button
                  v-if="!item.isRead"
                  type="button"
                  class="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-xs font-medium text-primary transition-colors hover:bg-primary-50 dark:hover:bg-primary-900/20 md:self-center"
                  @click.stop="markSingleAsRead(item.id)"
                >
                  <UIcon name="i-lucide-check" class="h-3.5 w-3.5" />
                  Tandai dibaca
                </button>
              </div>
            </li>
          </template>
        </div>

        <Pagination
          v-if="notificationMeta.total > 0"
          :current-page="currentPage"
          :total-pages="Math.max(notificationMeta.totalPages, 1)"
          :total-items="notificationMeta.total"
          :rows-per-page="itemsPerPage"
          @update:page="goToPage"
        />
      </div>
    </div>

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
import type { NotificationItem } from '~/types/notification';
import {
  formatNotificationDateTime,
  formatNotificationTime,
  resolveNotificationIcon,
  groupNotificationsByWeek,
} from '~/utils/notification-helpers';

definePageMeta({ middleware: 'auth' });

const router = useRouter();
const {
  notifications,
  notificationMeta,
  unreadCount,
  isLoading,
  error,
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  connectSocket,
  resolveNotificationRoute,
} = useNotifications();

// Group notifications by week for display
const groupedNotifications = computed(() => groupNotificationsByWeek(notifications.value));

const breadcrumbs = [
  { label: 'Beranda', to: '/beranda', icon: 'i-lucide-home' },
  { label: 'Notifikasi', to: '/notifikasi', icon: 'i-lucide-bell' },
];

const statusFilterOptions = [
  { label: 'Semua', value: 'all', icon: 'i-lucide-list' },
  { label: 'Belum dibaca', value: 'unread', icon: 'i-lucide-circle' },
  { label: 'Sudah dibaca', value: 'read', icon: 'i-lucide-check-circle' },
] as const;

const typeFilterOptions = [
  { label: 'Semua jenis', value: 'all' },
  { label: 'Naskah masuk', value: 'NASKAH_MASUK' },
  { label: 'Tembusan', value: 'NASKAH_TEMBUSAN' },
  { label: 'Disposisi', value: 'DISPOSISI' },
  { label: 'Disposisi selesai', value: 'DISPOSISI_SELESAI' },
  { label: 'Konsep disetujui', value: 'KONSEP_DISETUJUI' },
  { label: 'Konsep ditolak', value: 'KONSEP_DITOLAK' },
  { label: 'Penomoran usulan', value: 'PENOMORAN_USULAN' },
  { label: 'Penomoran persetujuan', value: 'PENOMORAN_PERSETUJUAN' },
  { label: 'Penomoran verifikasi', value: 'PENOMORAN_VERIFIKASI' },
  { label: 'Penomoran selesai', value: 'PENOMORAN_SELESAI' },
  { label: 'Penomoran ditolak', value: 'PENOMORAN_DITOLAK' },
  { label: 'Digsig verifikasi', value: 'DIGSIG_VERIFIKASI' },
  { label: 'Digsig tanda tangan', value: 'DIGSIG_TANDA_TANGAN' },
  { label: 'Digsig selesai', value: 'DIGSIG_SELESAI' },
  { label: 'Digsig ditolak', value: 'DIGSIG_DITOLAK' },
  { label: 'Naskah dinas verifikator', value: 'NASKAH_DINAS_VERIFIKATOR' },
  { label: 'Naskah dinas selesai', value: 'NASKAH_DINAS_VERIFIKASI_SELESAI' },
  { label: 'Naskah dinas ditolak', value: 'NASKAH_DINAS_DITOLAK' },
  { label: 'Delegasi', value: 'DELEGASI' },
  { label: 'Sistem', value: 'SYSTEM' },
] as const;

type NotificationStatusFilter = (typeof statusFilterOptions)[number]['value'];

const activeStatus = ref<NotificationStatusFilter>('all');
const activeType = ref('all');
const currentPage = ref(1);
const itemsPerPage = ref(20);
const rowsOptions = [10, 20, 50, 100];
const showMarkAllConfirm = ref(false);
const isMarkingAllRead = ref(false);
const isTypeDropdownOpen = ref(false);
const typeDropdownRef = ref<HTMLElement | null>(null);

const hasActiveFilters = computed(
  () => activeStatus.value !== 'all' || activeType.value !== 'all' || itemsPerPage.value !== 20,
);

const selectedTypeLabel = computed(() => getTypeLabel(activeType.value));

const getTypeLabel = (type: string) =>
  typeFilterOptions.find((item) => item.value === type)?.label || type.replaceAll('_', ' ');

const loadNotifications = async () => {
  await fetchNotifications({
    page: currentPage.value,
    limit: itemsPerPage.value,
    isRead:
      activeStatus.value === 'unread'
        ? false
        : activeStatus.value === 'read'
          ? true
          : undefined,
    type: activeType.value === 'all' ? undefined : activeType.value,
  });
};

const refresh = async () => {
  await Promise.all([fetchUnreadCount(), loadNotifications()]);
};

const applyFilters = async () => {
  currentPage.value = 1;
  await refresh();
};

const selectStatus = async (value: NotificationStatusFilter) => {
  if (activeStatus.value === value) return;
  activeStatus.value = value;
  await applyFilters();
};

const toggleTypeDropdown = () => {
  isTypeDropdownOpen.value = !isTypeDropdownOpen.value;
};

const selectType = async (value: string) => {
  isTypeDropdownOpen.value = false;
  if (activeType.value === value) return;
  activeType.value = value;
  await applyFilters();
};

const resetFilters = async () => {
  activeStatus.value = 'all';
  activeType.value = 'all';
  itemsPerPage.value = 20;
  isTypeDropdownOpen.value = false;
  await applyFilters();
};

const goToPage = async (page: number) => {
  const nextPage = Math.min(Math.max(Number(page), 1), notificationMeta.value.totalPages || 1);
  if (nextPage === currentPage.value) return;
  currentPage.value = nextPage;
  await loadNotifications();
};

const markSingleAsRead = async (id: string) => {
  await markAsRead(id);
  await fetchUnreadCount();
};

const confirmMarkAllRead = async () => {
  if (isMarkingAllRead.value) return;
  isMarkingAllRead.value = true;
  try {
    await markAllAsRead();
    showMarkAllConfirm.value = false;
    currentPage.value = 1;
    await refresh();
  } finally {
    isMarkingAllRead.value = false;
  }
};

const openNotification = async (item: NotificationItem) => {
  if (!item.isRead) {
    await markAsRead(item.id);
    await fetchUnreadCount();
  }

  const route = resolveNotificationRoute(item);
  if (route) await router.push(route);
};

const closeTypeDropdownOnOutsideClick = (event: MouseEvent) => {
  if (!isTypeDropdownOpen.value) return;
  const target = event.target as Node | null;
  if (target && typeDropdownRef.value?.contains(target)) return;
  isTypeDropdownOpen.value = false;
};

const closeTypeDropdownOnEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') isTypeDropdownOpen.value = false;
};

onMounted(async () => {
  document.addEventListener('click', closeTypeDropdownOnOutsideClick);
  document.addEventListener('keydown', closeTypeDropdownOnEscape);
  await refresh();
  await connectSocket();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeTypeDropdownOnOutsideClick);
  document.removeEventListener('keydown', closeTypeDropdownOnEscape);
});
</script>
