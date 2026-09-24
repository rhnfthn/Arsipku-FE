<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Log Aktivitas" />
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
        :active-accounts="activeAccounts"
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useAudit } from '~/composables/useAudit';
import type { AuditTrail, AuditFilter } from '~/types/audit';
import DataPagination from '~/components/DataPagination.vue';

definePageMeta({ middleware: ['auth', 'audit-admin'] });

const {
  fetchLogs,
  fetchActiveAccounts,
  fetchLogDetail,
  exportReport,
  logs,
  activeAccounts,
  loading,
  meta,
} = useAudit();
const { hasPermission } = useAuth();
const canExport = computed(() => hasPermission('audit', 'export'));

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Administrasi', to: '/admin/audit' },
  { label: 'Log Aktivitas', to: '/admin/audit' },
];

// Filter default TANPA batas tanggal agar seluruh log dari semua akun
// dan semua rentang waktu tampil. Superadmin dapat memfilter manual
// via AuditLogFilter jika diperlukan.
const filter = reactive<AuditFilter>({
  page: 1,
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'DESC',
  startDate: undefined,
  endDate: undefined,
  action: '',
  module: '',
  status: '',
  userRole: '',
});

const showDetail = ref(false);
const selectedLog = ref<AuditTrail | null>(null);
const detailLoading = ref(false);
const exporting = ref(false);
let activeAccountsTimer: ReturnType<typeof setInterval> | undefined;

const loadLogs = async () => {
  try {
    await fetchLogs({ ...filter });
  } catch (e) {
    console.error('Gagal memuat log:', e);
  }
};

const loadActiveAccounts = async () => {
  try {
    await fetchActiveAccounts();
  } catch (e) {
    console.error('Gagal memuat akun aktif:', e);
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

const openDetail = async (row: AuditTrail) => {
  showDetail.value = true;
  selectedLog.value = row;
  if (row.metadata?.activeSession) {
    detailLoading.value = false;
    return;
  }
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
  loadActiveAccounts();
  activeAccountsTimer = setInterval(loadActiveAccounts, 30_000);
});

onUnmounted(() => {
  if (activeAccountsTimer) clearInterval(activeAccountsTimer);
});
</script>
