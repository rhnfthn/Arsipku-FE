<template>
  <div ref="bellRef" class="relative">
    <UTooltip text="Anomali Audit">
      <button
        type="button"
        class="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        @click="togglePanel"
      >
        <UIcon name="i-lucide-shield-alert" class="w-6 h-6" />

        <!-- BADGE merah saat ada anomali NEW -->
        <span
          v-if="newCount > 0"
          class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse"
        >
          {{ newCount > 99 ? '99+' : newCount }}
        </span>
      </button>
    </UTooltip>

    <!-- Dropdown notifikasi anomali -->
    <div
      v-if="showPanel"
      class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 z-[60] max-h-[70vh] overflow-y-auto"
    >
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Anomali Audit</h3>
        <button @click="showPanel = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <div v-if="loading" class="px-4 py-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
        Memuat...
      </div>

      <div v-else-if="notifications.length === 0" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        Tidak ada anomali baru
      </div>

      <ul v-else class="py-1">
        <li
          v-for="item in notifications"
          :key="item.id"
          class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
          @click="goToAnomaly(item.id)"
        >
          <div class="flex items-start gap-2">
            <span :class="severityDot(item.severity)" class="mt-1.5 w-2 h-2 rounded-full shrink-0"></span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ item.title }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{{ item.description || item.anomalyType }}</p>
              <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{{ formatDate(item.createdAt) }}</p>
            </div>
          </div>
        </li>
      </ul>

      <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <NuxtLink
          to="/admin/audit/anomaly"
          class="block text-center text-xs font-medium text-primary hover:text-primary-700 py-1"
          @click="showPanel = false"
        >
          Lihat semua anomali →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useAudit } from '~/composables/useAudit';
import type { AuditAnomaly, AnomalySeverity } from '~/types/audit';

const { notifications, fetchNotifications, anomalySummary, fetchAnomalySummary } = useAudit();

const showPanel = ref(false);
const loading = ref(false);
const bellRef = ref<HTMLElement | null>(null);

const newCount = computed(() => anomalySummary.value?.new ?? 0);

const togglePanel = async () => {
  showPanel.value = !showPanel.value;
  if (showPanel.value) {
    loading.value = true;
    try {
      await Promise.all([fetchNotifications(10), fetchAnomalySummary()]);
    } catch (e) {
      console.error('Gagal memuat notifikasi anomali:', e);
    } finally {
      loading.value = false;
    }
  }
};

const goToAnomaly = (id: string) => {
  showPanel.value = false;
  navigateTo('/admin/audit/anomaly');
};

const formatDate = (d: string | Date) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const severityDot = (severity: AnomalySeverity) => {
  const map: Record<string, string> = {
    LOW: 'bg-gray-400',
    MEDIUM: 'bg-yellow-500',
    HIGH: 'bg-orange-500',
    CRITICAL: 'bg-red-600',
  };
  return map[severity] || map.LOW;
};

const handleClickOutside = (e: MouseEvent) => {
  if (bellRef.value && !bellRef.value.contains(e.target as Node)) {
    showPanel.value = false;
  }
};

onMounted(() => {
  // Fetch summary sekali saat mount untuk badge count
  fetchAnomalySummary().catch(() => {});
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>