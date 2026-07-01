<template>
  <transition
    enter-active-class="transition ease-out duration-150 origin-top"
    enter-from-class="opacity-0 scale-y-95 -translate-y-1"
    enter-to-class="opacity-100 scale-y-100 translate-y-0"
    leave-active-class="transition ease-in duration-100 origin-top"
    leave-from-class="opacity-100 scale-y-100 translate-y-0"
    leave-to-class="opacity-0 scale-y-95 -translate-y-1"
  >
    <div
      class="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800 overflow-hidden z-70"
    >
      <!-- HEADER -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Notifikasi</h3>
          <UBadge
            v-if="unreadCount > 0"
            size="xs"
            color="error"
            variant="subtle"
            class="rounded-full px-1.5"
          >
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </UBadge>
        </div>

        <div class="flex items-center gap-2">
          <span
            class="flex items-center gap-1 text-[10px] font-medium"
            :class="isConnected ? 'text-green-500' : 'text-gray-400'"
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="isConnected ? 'bg-green-500' : 'bg-gray-400'"
            />
            {{ isConnected ? '' : '' }}
          </span>

          <button
            v-if="unreadCount > 0"
            type="button"
            class="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
            @click="$emit('markAllRead')"
          >
            Tandai semua dibaca
          </button>
        </div>
      </div>

      <!-- BODY -->
      <div class="max-h-[60vh] overflow-y-auto">
        <!-- LOADING SKELETON -->
        <div v-if="isLoading && notifications.length === 0" class="p-3 space-y-3">
          <div
            v-for="i in 5"
            :key="i"
            class="flex items-start gap-3 p-2 rounded-lg animate-pulse"
          >
            <div class="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
            <div class="flex-1 space-y-2">
              <div class="h-3 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
              <div class="h-2.5 w-full bg-gray-100 dark:bg-gray-800/60 rounded" />
            </div>
          </div>
        </div>

        <!-- ERROR -->
        <div
          v-else-if="error"
          class="px-4 py-6 text-center text-sm text-red-500 dark:text-red-400"
        >
          Gagal memuat notifikasi.
          <button class="underline mt-1" @click="$emit('refresh')">Coba lagi</button>
        </div>

        <!-- EMPTY -->
        <div
          v-else-if="notifications.length === 0"
          class="px-4 py-10 flex flex-col items-center gap-2 text-center"
        >
          <UIcon name="i-lucide-bell-off" class="w-8 h-8 text-gray-300 dark:text-gray-700" />
          <p class="text-sm text-gray-500 dark:text-gray-400">Tidak ada notifikasi</p>
        </div>

        <!-- LIST -->
        <ul v-else class="py-1">
          <li
            v-for="item in notifications"
            :key="item.id"
            class="px-4 py-3 cursor-pointer flex items-start gap-3 transition-colors border-b border-gray-50 dark:border-gray-800/60 last:border-0"
            :class="
              item.isRead
                ? 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                : 'bg-primary-50/60 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20'
            "
            @click="$emit('clickItem', item)"
          >
            <!-- ICON -->
            <div
              class="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              :class="
                item.isRead
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  : 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400'
              "
            >
              <UIcon :name="resolveNotificationIcon(item.type)" class="w-4 h-4" />
            </div>

            <!-- CONTENT -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p
                  class="text-sm font-medium truncate"
                  :class="
                    item.isRead
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-gray-900 dark:text-gray-100'
                  "
                >
                  {{ item.title }}
                </p>
                <span
                  v-if="!item.isRead"
                  class="w-2 h-2 rounded-full bg-primary-500 shrink-0"
                />
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                {{ item.body }}
              </p>
              <span class="text-[10px] text-gray-400 dark:text-gray-500 mt-1 block">
                {{ formatNotificationTime(item.createdAt) }}
              </span>
            </div>
          </li>
        </ul>
      </div>

      <!-- FOOTER -->
      <button
        type="button"
        class="w-full text-left px-4 py-2.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-800 transition-colors flex items-center justify-center gap-2"
        @click="$emit('viewAll')"
      >
        <UIcon name="i-lucide-list" class="w-3.5 h-3.5" />
        Lihat semua notifikasi
      </button>
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { NotificationItem } from '~/types/notification';
import { formatNotificationTime, resolveNotificationIcon } from '~/utils/notification-helpers';

defineProps<{
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  error: any;
}>();

defineEmits<{
  (e: 'markRead', id: string): void;
  (e: 'markAllRead'): void;
  (e: 'refresh'): void;
  (e: 'viewAll'): void;
  (e: 'clickItem', item: NotificationItem): void;
}>();
</script>
