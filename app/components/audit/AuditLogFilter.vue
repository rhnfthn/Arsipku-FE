<template>
  <div class="overflow-visible border-b border-gray-100 bg-gradient-to-b from-white to-gray-50/70 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800">
    <div class="flex w-full min-w-0 flex-nowrap items-center gap-1.5">
      <div class="flex shrink-0 items-center gap-1.5">
        <AuditFilterDropdown
          :model-value="String(local.limit || 20)"
          aria-label="Jumlah baris per halaman"
          class="w-[60px]"
          :options="pageSizeOptions"
          @update:model-value="changeLimit"
        />
        <button
          type="button"
          class="inline-flex h-10 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-primary hover:bg-primary/5 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-primary-400 dark:hover:bg-primary-900/20"
          aria-label="Reset filter"
          title="Reset filter"
          @click="reset"
        >
          <RotateCcw class="h-4 w-4" />
        </button>
      </div>

      <div class="relative min-w-0 flex-1 basis-[180px]">
        <Search class="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          :value="local.search || ''"
          type="search"
          :placeholder="mode === 'anomaly' ? 'Cari judul, deskripsi, atau pengguna...' : 'Cari deskripsi, pengguna, atau entitas...'"
          :aria-label="mode === 'anomaly' ? 'Cari anomali' : 'Cari log aktivitas'"
          class="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500 dark:hover:border-gray-500"
          @input="onSearchInput"
        />
      </div>

      <div v-if="mode === 'log' || mode === 'anomaly'" class="flex shrink-0 items-center gap-1.5">
        <input
          v-model="local.startDate"
          type="date"
          :aria-label="mode === 'anomaly' ? 'Tanggal anomali' : 'Tanggal aktivitas'"
          :title="mode === 'anomaly' ? 'Tanggal anomali' : 'Tanggal aktivitas'"
          class="h-10 w-[110px] rounded-lg border border-gray-200 bg-white px-1.5 text-[11px] text-gray-700 outline-none transition hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-gray-500"
          @change="applyDate"
        />
      </div>

      <AuditFilterDropdown
        v-if="mode === 'log'"
        v-model="local.action"
        aria-label="Filter aksi"
        class="w-[105px] shrink-0"
        :options="actionOptions"
        @update:model-value="updateFilter('action', $event)"
      />
      <AuditFilterDropdown
        v-if="mode === 'log'"
        v-model="local.module"
        aria-label="Filter modul"
        class="w-[112px] shrink-0"
        :options="moduleOptions"
        @update:model-value="updateFilter('module', $event)"
      />
      <AuditFilterDropdown
        v-if="mode === 'log'"
        v-model="local.status"
        aria-label="Filter status"
        class="w-[105px] shrink-0"
        :options="statusOptions"
        @update:model-value="updateFilter('status', $event)"
      />
      <AuditFilterDropdown
        v-if="mode === 'log'"
        v-model="local.userRole"
        aria-label="Filter peran"
        class="w-[105px] shrink-0"
        :options="roleOptions"
        @update:model-value="updateFilter('userRole', $event)"
      />

      <AuditFilterDropdown
        v-if="mode === 'anomaly'"
        v-model="local.status"
        aria-label="Filter status anomali"
        class="w-[112px] shrink-0"
        :options="anomalyStatusOptions"
        @update:model-value="updateFilter('status', $event)"
      />

      <button
        v-if="canExport"
        type="button"
        :disabled="exporting"
        class="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-lg bg-primary px-2 text-xs font-medium text-white shadow-sm shadow-primary/20 transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-wait disabled:opacity-60 lg:min-w-[82px]"
        @click="$emit('export')"
      >
        <Download class="h-4 w-4" />
        {{ exporting ? 'Mengekspor...' : 'Ekspor' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, watch } from 'vue';
import { Download, RotateCcw, Search } from 'lucide-vue-next';
import type { AuditFilter, AuditAction, AuditModuleType, AuditStatus, AnomalyFilter, AnomalyStatus } from '~/types/audit';

type FilterModel = AuditFilter | AnomalyFilter;

const props = withDefaults(defineProps<{
  modelValue: FilterModel;
  canExport?: boolean;
  exporting?: boolean;
  mode?: 'log' | 'anomaly';
}>(), {
  mode: 'log',
  exporting: false,
});

const mode = computed(() => props.mode);

const canExport = computed(() => props.canExport !== false);

const pageSizeOptions = [10, 20, 25, 50, 100].map((value) => ({
  label: String(value),
  value: String(value),
}));

const emit = defineEmits<{
  'update:modelValue': [value: FilterModel];
  apply: [value: FilterModel];
  export: [];
}>();

const actions: AuditAction[] = [
  'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LIST',
  'APPROVE', 'REJECT', 'UPLOAD', 'DOWNLOAD', 'SIGN', 'VERIFY',
  'GENERATE', 'EXPORT', 'CONFIG_CHANGE',
];

const actionLabels: Record<string, string> = {
  LOGIN: 'Login', LOGOUT: 'Logout', CREATE: 'Buat Data', UPDATE: 'Ubah Data', DELETE: 'Hapus Data',
  VIEW: 'Lihat', LIST: 'Daftar', APPROVE: 'Setujui', REJECT: 'Tolak', UPLOAD: 'Unggah',
  DOWNLOAD: 'Unduh', SIGN: 'Tanda Tangan', VERIFY: 'Verifikasi', GENERATE: 'Generate',
  EXPORT: 'Ekspor', CONFIG_CHANGE: 'Ubah Konfigurasi',
};

const actionOptions = [
  { label: 'Semua aksi', value: '' },
  ...actions.map((value) => ({ label: actionLabels[value] || value, value })),
];

const modules: AuditModuleType[] = [
  'AUTH', 'USER', 'RBAC', 'NASKAH', 'BERKAS', 'DISPOSISI', 'DELEGASI',
  'DIGSIG', 'MAIL', 'MASTER_DATA', 'CONFIG', 'USULAN_PINDAH', 'FAQ', 'AUDIT', 'TUGAS',
];

const moduleLabels: Record<string, string> = {
  AUTH: 'Autentikasi', USER: 'Pengguna', RBAC: 'Hak Akses', NASKAH: 'Naskah',
  BERKAS: 'Berkas', DISPOSISI: 'Disposisi', DELEGASI: 'Delegasi', DIGSIG: 'Tanda Tangan Digital',
  MAIL: 'Email', MASTER_DATA: 'Data Master', CONFIG: 'Konfigurasi',
  USULAN_PINDAH: 'Usulan Pindah', FAQ: 'FAQ', AUDIT: 'Audit', TUGAS: 'Tugas',
};

const moduleOptions = [
  { label: 'Semua modul', value: '' },
  ...modules.map((value) => ({ label: moduleLabels[value] || value, value })),
];

const statuses: AuditStatus[] = ['SUCCESS', 'FAILED', 'ERROR', 'DENIED'];

const statusLabels: Record<string, string> = {
  SUCCESS: 'Berhasil', FAILED: 'Gagal', ERROR: 'Error', DENIED: 'Ditolak',
};

const statusOptions = [
  { label: 'Semua status', value: '' },
  ...statuses.map((value) => ({ label: statusLabels[value] || value, value })),
];

const anomalyStatuses: AnomalyStatus[] = ['NEW', 'REVIEWING', 'RESOLVED', 'IGNORED'];
const anomalyStatusOptions = [
  { label: 'Semua status', value: '' },
  { label: 'Baru', value: 'NEW' },
  { label: 'Sedang Ditinjau', value: 'REVIEWING' },
  { label: 'Selesai', value: 'RESOLVED' },
  { label: 'Diabaikan', value: 'IGNORED' },
];

const roleOptions = [
  { label: 'Semua peran', value: '' },
  { label: 'SUPERADMIN', value: 'SUPERADMIN' },
  { label: 'ADMIN', value: 'ADMIN' },
  { label: 'USER', value: 'USER' },
];

const local = reactive<Record<string, any>>({
  ...props.modelValue,
  // Default: TANPA batas tanggal agar seluruh log dari semua akun
  // dan semua rentang waktu tampil. Superadmin dapat memfilter manual.
  startDate: 'startDate' in props.modelValue ? props.modelValue.startDate || undefined : undefined,
  endDate: 'startDate' in props.modelValue ? props.modelValue.startDate || undefined : undefined,
  // Default: semua dropdown kosong = "Semua"
  action: 'action' in props.modelValue ? props.modelValue.action || '' : '',
  module: 'module' in props.modelValue ? props.modelValue.module || '' : '',
  status: props.modelValue.status || '',
  userRole: 'userRole' in props.modelValue ? props.modelValue.userRole || '' : '',
  severity: 'severity' in props.modelValue ? props.modelValue.severity || '' : '',
});

let searchTimer: ReturnType<typeof setTimeout> | undefined;

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(local, val);
    // Pastikan semua dropdown selalu string (bukan undefined) agar "Semua" terpilih
    if (!local.action) local.action = '';
    if (!local.module) local.module = '';
    if (!local.status) local.status = '';
    if (!local.userRole) local.userRole = '';
    if (!local.severity) local.severity = '';
    local.endDate = local.startDate || undefined;
  },
  { deep: true },
);

const apply = () => {
  const cleaned: Record<string, any> = { ...local };
  Object.keys(cleaned).forEach((k) => {
    const v = cleaned[k];
    if (v === undefined || v === null || v === '') {
      delete cleaned[k];
    }
  });
  // Filter tanggal bersifat satu hari: kirim tanggal yang sama sebagai batas
  // awal dan akhir agar backend hanya mengambil aktivitas pada hari tersebut.
  if (mode.value === 'log' || mode.value === 'anomaly') {
    if (cleaned.startDate) cleaned.endDate = cleaned.startDate;
    else delete cleaned.endDate;
  } else {
    delete cleaned.startDate;
    delete cleaned.endDate;
  }
  emit('update:modelValue', cleaned as FilterModel);
  emit('apply', cleaned as FilterModel);
};

const updateFilter = (key: 'action' | 'module' | 'status' | 'userRole' | 'severity', value: string) => {
  local[key] = value;
  local.page = 1;
  apply();
};

const applyDate = () => {
  local.endDate = local.startDate;
  local.page = 1;
  apply();
};

const onSearchInput = (event: Event) => {
  local.search = (event.target as HTMLInputElement).value;
  local.page = 1;
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    apply();
    searchTimer = undefined;
  }, 350);
};

const reset = () => {
  // Reset ke default: TANPA batas tanggal (semua waktu), semua aksi/modul/status/role
  local.startDate = undefined;
  local.endDate = undefined;
  local.action = undefined;
  local.module = undefined;
  local.status = undefined;
  local.userRole = '';
  local.severity = undefined;
  local.search = undefined;
  local.page = 1;
  local.limit = 20;
  local.sortBy = 'created_at';
  local.sortOrder = 'DESC';
  apply();
};

const changeLimit = (limit: string) => {
  local.limit = Number(limit);
  local.page = 1;
  apply();
};

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});
</script>
