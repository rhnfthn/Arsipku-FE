<template>
  <DataToolbar
      :model-value="local.limit || 20"
      :search="local.search || ''"
      search-placeholder="Cari deskripsi, pengguna, atau entitas..."
      :rows-choices="[10, 20, 25, 50, 100]"
      :show-export="canExport"
      export-label="Ekspor"
      refresh-label="Reset filter"
      @update:model-value="changeLimit"
      @update:search="local.search = $event"
      @refresh="reset"
      @export="$emit('export')"
    >
      <template #actions>
        <input
          v-model="local.startDate"
          type="date"
          aria-label="Dari tanggal"
          class="h-8 w-36 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        />
        <input
          v-model="local.endDate"
          type="date"
          aria-label="Sampai tanggal"
          class="h-8 w-36 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        />
        <select
          v-model="local.action"
          aria-label="Filter aksi"
          class="h-8 w-32 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">Semua aksi</option>
          <option v-for="a in actions" :key="a" :value="a">{{ actionLabels[a] || a }}</option>
        </select>
        <select
          v-model="local.module"
          aria-label="Filter modul"
          class="h-8 w-32 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">Semua modul</option>
          <option v-for="m in modules" :key="m" :value="m">{{ moduleLabels[m] || m }}</option>
        </select>
        <select
          v-model="local.status"
          aria-label="Filter status"
          class="h-8 w-28 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">Semua status</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ statusLabels[s] || s }}</option>
        </select>
        <select
          v-model="local.userRole"
          aria-label="Filter peran"
          class="h-8 w-28 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">Semua peran</option>
          <option value="SUPERADMIN">SUPERADMIN</option>
          <option value="ADMIN">ADMIN</option>
          <option value="USER">USER</option>
        </select>
        <button
          type="button"
          @click="apply"
          class="h-8 rounded-lg bg-primary px-3 text-xs font-medium text-white transition hover:bg-primary-700"
        >
          Terapkan
        </button>
      </template>
  </DataToolbar>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import DataToolbar from '~/components/DataToolbar.vue';
import type { AuditFilter, AuditAction, AuditModuleType, AuditStatus } from '~/types/audit';

const props = defineProps<{
  modelValue: AuditFilter;
  canExport?: boolean;
}>();

const canExport = computed(() => props.canExport !== false);

const emit = defineEmits<{
  'update:modelValue': [value: AuditFilter];
  apply: [value: AuditFilter];
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

const statuses: AuditStatus[] = ['SUCCESS', 'FAILED', 'ERROR', 'DENIED'];

const statusLabels: Record<string, string> = {
  SUCCESS: 'Berhasil', FAILED: 'Gagal', ERROR: 'Error', DENIED: 'Ditolak',
};

const local = reactive<AuditFilter>({
  ...props.modelValue,
  // Default: TANPA batas tanggal agar seluruh log dari semua akun
  // dan semua rentang waktu tampil. Superadmin dapat memfilter manual.
  startDate: props.modelValue.startDate || undefined,
  endDate: props.modelValue.endDate || undefined,
  // Default: semua dropdown kosong = "Semua"
  action: props.modelValue.action || '',
  module: props.modelValue.module || '',
  status: props.modelValue.status || '',
  userRole: props.modelValue.userRole || '',
});

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(local, val);
    // Pastikan semua dropdown selalu string (bukan undefined) agar "Semua" terpilih
    if (!local.action) local.action = '';
    if (!local.module) local.module = '';
    if (!local.status) local.status = '';
    if (!local.userRole) local.userRole = '';
  },
  { deep: true },
);

const apply = () => {
  const cleaned: AuditFilter = { ...local };
  (Object.keys(cleaned) as (keyof AuditFilter)[]).forEach((k) => {
    const v = cleaned[k];
    if (v === undefined || v === null || v === '') {
      delete cleaned[k];
    }
  });
  emit('update:modelValue', cleaned);
  emit('apply', cleaned);
};

const reset = () => {
  // Reset ke default: TANPA batas tanggal (semua waktu), semua aksi/modul/status/role
  local.startDate = undefined;
  local.endDate = undefined;
  local.action = undefined;
  local.module = undefined;
  local.status = undefined;
  local.userRole = '';
  local.search = undefined;
  local.page = 1;
  local.limit = 20;
  local.sortBy = 'created_at';
  local.sortOrder = 'DESC';
  apply();
};

const changeLimit = (limit: number) => {
  local.limit = limit;
  local.page = 1;
  apply();
};
</script>
