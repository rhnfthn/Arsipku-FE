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

    <!-- Table -->
    <div class="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 transition-colors">
      <AuditLogFilter
        :model-value="filter"
        :can-export="canExport"
        @update:model-value="(v) => Object.assign(filter, v)"
        @apply="onApplyFilter"
        @export="onExport"
      />

      <AuditLogTable
        :rows="logs"
        :loading="loading"
        :page="filter.page || 1"
        :limit="filter.limit || 20"
        @view="openDetail"
      />

      <DataPagination
        v-if="meta && meta.total > 0"
        :current-page="meta.page"
        :total-items="meta.total"
        :per-page="meta.limit"
        data-label="log"
        @update:current-page="goPage"
      />
    </div>

    <!-- Detail Modal -->
    <AuditLogDetailModal v-model="showDetail" :log="selectedLog" :loading="detailLoading" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useAudit } from '~/composables/useAudit';
import type { AuditTrail, AuditFilter } from '~/types/audit';
import DataPagination from '~/components/DataPagination.vue';

definePageMeta({ middleware: ['auth', 'audit-admin'] });

const { fetchLogs, fetchLogDetail, fetchSummary, exportReport, logs, loading, meta, summary } = useAudit();
const { hasPermission } = useAuth();
const canExport = computed(() => hasPermission('audit', 'export'));

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
