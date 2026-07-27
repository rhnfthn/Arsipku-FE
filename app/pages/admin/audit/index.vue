<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Log Aktivitas" subtitle="Pantau seluruh aktivitas pengguna di sistem." :items="items" />
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <!-- Total Log Aktivitas -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Total Log Aktivitas</p>
            <p class="text-2xl font-bold mt-1 text-gray-700 dark:text-white">{{ summary?.total ?? 0 }}</p>
          </div>
          <div class="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <UIcon name="i-lucide-list" class="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
        </div>
      </div>

      <!-- Log Hari Ini -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Log Hari Ini</p>
            <p class="text-2xl font-bold mt-1 text-[#457fb6]">{{ summary?.today ?? 0 }}</p>
          </div>
          <div class="w-10 h-10 rounded-full flex items-center justify-center bg-[#457fb6]/10 dark:bg-[#457fb6]/20">
            <UIcon name="i-lucide-calendar" class="w-5 h-5 text-[#457fb6]" />
          </div>
        </div>
      </div>

      <!-- Log Status ERROR -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Log Status ERROR</p>
            <p class="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{{ summary?.errorCount ?? 0 }}</p>
          </div>
          <div class="w-10 h-10 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30">
            <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      <!-- Log Terakhir -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Log Terakhir</p>
            <p class="text-sm font-medium mt-1 text-gray-700 dark:text-white">{{ formatLastLog(summary?.lastLogAt) }}</p>
          </div>
          <div class="w-10 h-10 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30">
            <UIcon name="i-lucide-clock" class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="mb-4">
      <AuditLogFilter v-model="filter" @apply="onApplyFilter" @export="onExport" />
    </div>

    <!-- Table -->
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors">
      <AuditLogTable
        :rows="logs"
        :loading="loading"
        :page="filter.page || 1"
        :limit="filter.limit || 20"
        @view="openDetail"
      />

      <!-- Pagination Bar -->
      <div
        v-if="meta && meta.total > 0"
        class="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 gap-3"
      >
        <!-- Info kiri + Rows per page -->
        <div class="flex items-center gap-3">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }}
            dari <span class="font-medium text-gray-700 dark:text-gray-300">{{ meta.total }}</span> log
          </div>
          <!-- Rows per page selector -->
          <select
            v-model="perPage"
            class="px-2 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
            @change="onPerPageChange"
          >
            <option :value="10">10 / halaman</option>
            <option :value="20">20 / halaman</option>
            <option :value="25">25 / halaman</option>
            <option :value="50">50 / halaman</option>
            <option :value="100">100 / halaman</option>
          </select>
        </div>

        <!-- Navigasi kanan -->
        <div v-if="meta.totalPages > 1" class="flex items-center gap-1">
          <!-- Previous -->
          <button
            :disabled="meta.page <= 1"
            @click="goPage(meta.page - 1)"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
            Prev
          </button>

          <!-- Page Numbers -->
          <template v-for="p in visiblePages" :key="p">
            <span
              v-if="p === '...'"
              class="px-2 py-1.5 text-sm text-gray-400 dark:text-gray-500"
            >...</span>
            <button
              v-else
              @click="goPage(p as number)"
              :class="[
                'min-w-[36px] px-2 py-1.5 text-sm font-medium rounded-md transition-colors',
                p === meta.page
                  ? 'bg-[#457fb6] text-white shadow-sm'
                  : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              {{ p }}
            </button>
          </template>

          <!-- Next -->
          <button
            :disabled="meta.page >= meta.totalPages"
            @click="goPage(meta.page + 1)"
            class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <AuditLogDetailModal v-model="showDetail" :log="selectedLog" :loading="detailLoading" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useAudit } from '~/composables/useAudit';
import type { AuditTrail, AuditFilter } from '~/types/audit';

definePageMeta({ middleware: ['auth', 'audit-admin'] });

const { fetchLogs, fetchLogDetail, fetchSummary, exportReport, logs, loading, meta, summary } = useAudit();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Administrasi', to: '/admin/audit' },
  { label: 'Log Aktivitas', to: '/admin/audit' },
];

const filter = reactive<AuditFilter>({
  page: 1,
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'DESC',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  action: '',
  module: '',
  status: '',
  userRole: '',
});

const showDetail = ref(false);
const selectedLog = ref<AuditTrail | null>(null);
const detailLoading = ref(false);
const exporting = ref(false);

// Rows per page selector (sync dengan filter.limit)
const perPage = ref(filter.limit || 20);

// Generate visible page numbers with ellipsis
const visiblePages = computed(() => {
  if (!meta.value) return [];
  const total = meta.value.totalPages;
  const current = meta.value.page;
  const pages: (number | string)[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
  }
  return pages;
});

const loadLogs = async () => {
  try {
    await fetchLogs({ ...filter });
    // Ambil ringkasan untuk card (total, today, errorCount, lastLogAt)
    fetchSummary({
      startDate: filter.startDate,
      endDate: filter.endDate,
      action: filter.action || undefined,
      module: filter.module || undefined,
      userRole: filter.userRole || undefined,
      search: filter.search || undefined,
    }).catch((e) => console.error('Gagal memuat ringkasan:', e));
  } catch (e) {
    console.error('Gagal memuat log:', e);
  }
};

const onApplyFilter = (val: AuditFilter) => {
  // Reset semua field filter ke default dulu, lalu apply nilai baru
  // Agar field yg dihapus (empty string) tidak mempertahankan nilai lama
  filter.action = '';
  filter.module = '';
  filter.status = '';
  filter.userRole = '';
  filter.search = undefined;
  Object.assign(filter, val);
  filter.page = 1;
  loadLogs();
};

const onExport = async () => {
  exporting.value = true;
  try {
    await exportReport({ ...filter });
  } catch (e) {
    console.error('Gagal export:', e);
    alert('Gagal export laporan');
  } finally {
    exporting.value = false;
  }
};

const goPage = (page: number) => {
  filter.page = page;
  loadLogs();
};

/**
 * Handler saat rows-per-page selector berubah.
 * Reset ke halaman 1 dan reload dengan limit baru.
 */
const onPerPageChange = () => {
  filter.limit = perPage.value;
  filter.page = 1;
  loadLogs();
};

/**
 * Format timestamp log terakhir untuk card ringkasan.
 * Tampilkan tanggal + jam, atau '-' jika belum ada log.
 */
const formatLastLog = (ts: string | null | undefined) => {
  if (!ts) return '-';
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const openDetail = async (row: AuditTrail) => {
  showDetail.value = true;
  selectedLog.value = row;
  detailLoading.value = true;
  try {
    const detail = await fetchLogDetail(row.id);
    if (detail) selectedLog.value = detail;
  } catch (e) {
    console.error('Gagal memuat detail:', e);
  } finally {
    detailLoading.value = false;
  }
};

onMounted(() => {
  loadLogs();
});
</script>