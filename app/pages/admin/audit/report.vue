<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Laporan Audit" :items="items" />
    </div>

    <div class="mb-4">
      <AuditReportChart :summary="summary" />
    </div>

    <div class="min-w-0 max-w-full rounded-xl border border-gray-100 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
      <AuditLogFilter
        :model-value="f"
        :can-export="canExport"
        :exporting="exporting"
        @update:model-value="syncFilter"
        @apply="onApplyFilter"
        @export="onExport"
      ></AuditLogFilter>

    <div v-if="!summary?.recentLogs || summary.recentLogs.length === 0" class="text-center py-8">
      <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
      <p class="text-sm text-gray-400">Belum ada data</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
          <thead class="bg-primary-400 dark:bg-primary-700 text-white text-left">
            <tr>
              <th class="px-4 py-3 font-semibold">Waktu</th>
              <th class="px-4 py-3 font-semibold">User</th>
              <th class="px-4 py-3 font-semibold">Role</th>
              <th class="px-4 py-3 font-semibold">Aksi</th>
              <th class="px-4 py-3 font-semibold">Modul</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="log in summary?.recentLogs ?? []"
              :key="log.id"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ formatDateTime(log.createdAt) }}</td>
              <td class="px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-200">{{ log.userName || '-' }}</td>
              <td class="px-4 py-2.5">
                <span :class="roleBadge(log.userRole)">{{ log.userRole || '-' }}</span>
              </td>
              <td class="px-4 py-2.5">
                <span :class="actionBadge(log.action)">{{ log.action }}</span>
              </td>
              <td class="px-4 py-2.5">
                <span class="px-2 py-0.5 text-xs rounded-full bg-[#457fb6]/10 dark:bg-[#457fb6]/20 text-[#457fb6] dark:text-[#5a9ad4] font-medium">{{ log.module }}</span>
              </td>
            </tr>
          </tbody>
      </table>
    </div>

    <DataPagination
      v-if="summary && summary.total > 0"
      :current-page="f.page || 1"
      :total-items="summary.total"
      :per-page="f.limit || 20"
      data-label="log"
      @update:current-page="goPage"
    />
  </div>
</div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue';
import { useAudit } from '~/composables/useAudit';
import type { AuditFilter, AuditSummary } from '~/types/audit';
import DataPagination from '~/components/DataPagination.vue';

definePageMeta({ middleware: ['auth', 'audit-admin'] });

const { fetchSummary, exportReport, summary } = useAudit();
const { hasPermission } = useAuth();
const canExport = computed(() => hasPermission('audit', 'export'));

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Administrasi', to: '/admin/audit' },
  { label: 'Laporan Audit', to: '/admin/audit/report' },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const f = reactive<AuditFilter>({
  page: 1,
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'DESC',
  startDate: todayStr(),
  endDate: todayStr(),
});

const exporting = ref(false);

const actionList = [
  'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LIST',
  'APPROVE', 'REJECT', 'UPLOAD', 'DOWNLOAD', 'SIGN', 'VERIFY',
  'GENERATE', 'EXPORT', 'CONFIG_CHANGE',
];
const moduleList = [
  'AUTH', 'USER', 'RBAC', 'NASKAH', 'BERKAS', 'DISPOSISI', 'DELEGASI',
  'DIGSIG', 'MAIL', 'MASTER_DATA', 'CONFIG', 'USULAN_PINDAH', 'FAQ', 'AUDIT',
];

const actionLabels: Record<string, string> = {
  LOGIN: 'Login', LOGOUT: 'Logout', CREATE: 'Buat Data', UPDATE: 'Ubah Data', DELETE: 'Hapus Data',
  VIEW: 'Lihat', LIST: 'Daftar', APPROVE: 'Setujui', REJECT: 'Tolak', UPLOAD: 'Unggah',
  DOWNLOAD: 'Unduh', SIGN: 'Tanda Tangan', VERIFY: 'Verifikasi', GENERATE: 'Generate',
  EXPORT: 'Ekspor', CONFIG_CHANGE: 'Ubah Konfigurasi',
};
const moduleLabels: Record<string, string> = {
  AUTH: 'Autentikasi', USER: 'Pengguna', RBAC: 'Hak Akses', NASKAH: 'Naskah',
  BERKAS: 'Berkas', DISPOSISI: 'Disposisi', DELEGASI: 'Delegasi', DIGSIG: 'Tanda Tangan Digital',
  MAIL: 'Email', MASTER_DATA: 'Data Master', CONFIG: 'Konfigurasi',
  USULAN_PINDAH: 'Usulan Pindah', FAQ: 'FAQ', AUDIT: 'Audit',
};

const loadSummary = async () => {
  try {
    await fetchSummary({
      startDate: f.startDate || undefined,
      endDate: f.endDate || undefined,
      action: f.action || undefined,
      module: f.module || undefined,
      userRole: f.userRole || undefined,
      search: f.search || undefined,
      page: f.page,
      limit: f.limit,
    });
  } catch (e) {
    console.error('Gagal memuat ringkasan:', e);
  }
};

const syncFilter = (value: AuditFilter) => {
  Object.assign(f, value);
};

const onApplyFilter = (value: AuditFilter) => {
  Object.assign(f, value);
  f.endDate = f.startDate;
  loadSummary();
};

const goPage = (page: number) => {
  f.page = page;
  loadSummary();
};

const resetFilter = () => {
  f.startDate = todayStr();
  f.endDate = todayStr();
  f.action = undefined;
  f.module = undefined;
  f.userRole = undefined;
  f.search = undefined;
  loadSummary();
};

const onExport = async () => {
  exporting.value = true;
  try {
    await exportReport({
      startDate: f.startDate || undefined,
      endDate: f.endDate || undefined,
      action: f.action || undefined,
      module: f.module || undefined,
      userRole: f.userRole || undefined,
      search: f.search || undefined,
    });
  } catch (e) {
    console.error('Gagal export:', e);
    alert('Gagal export laporan');
  } finally {
    exporting.value = false;
  }
};

const formatDateTime = (dt: string) => {
  try {
    const d = new Date(dt);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dt; }
};

const statusLabel = (s: string) => {
  const m: Record<string, string> = { SUCCESS: 'Berhasil', FAILED: 'Gagal', ERROR: 'Error', DENIED: 'Ditolak' };
  return m[s] || s;
};

// SUCCESS=#1cb854, FAILED=#f42d2d, ERROR=#ffa02e, DENIED=#64748b
const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    SUCCESS: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium',
    FAILED: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-medium',
    ERROR: 'px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-medium',
    DENIED: 'px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium',
  };
  return m[s] || m.SUCCESS;
};

const actionBadge = (a: string) => {
  return 'px-2 py-0.5 text-xs rounded-full bg-[#457fb6]/10 dark:bg-[#457fb6]/20 text-[#457fb6] dark:text-[#5a9ad4] font-medium';
};

const roleBadge = (r: string | null) => {
  const m: Record<string, string> = {
    SUPERADMIN: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-medium',
    ADMIN: 'px-2 py-0.5 text-xs rounded-full bg-[#457fb6]/10 dark:bg-[#457fb6]/20 text-[#457fb6] dark:text-[#5a9ad4] font-medium',
    USER: 'px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium',
  };
  return m[r || ''] || m.USER;
};

onMounted(() => {
  loadSummary();
});
</script>
