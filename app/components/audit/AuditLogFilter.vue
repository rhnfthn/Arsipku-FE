<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 items-start">
      <!-- Row 1: Dari Tanggal -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Dari Tanggal</label>
        <input
          v-model="local.startDate"
          type="date"
          class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
      </div>
      <!-- Row 1: Sampai Tanggal -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sampai Tanggal</label>
        <input
          v-model="local.endDate"
          type="date"
          class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
      </div>
      <!-- Row 1: Aksi -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Aksi</label>
        <select
          v-model="local.action"
          class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        >
          <option value="">Semua</option>
          <option v-for="a in actions" :key="a" :value="a">{{ actionLabels[a] || a }}</option>
        </select>
      </div>
      <!-- Row 1: Modul -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Modul</label>
        <select
          v-model="local.module"
          class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        >
          <option value="">Semua</option>
          <option v-for="m in modules" :key="m" :value="m">{{ moduleLabels[m] || m }}</option>
        </select>
      </div>

      <!-- Row 2: Status -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
        <select
          v-model="local.status"
          class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        >
          <option value="">Semua</option>
          <option v-for="s in statuses" :key="s" :value="s">{{ statusLabels[s] || s }}</option>
        </select>
      </div>
      <!-- Row 2: Role -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Role</label>
        <select
          v-model="local.userRole"
          class="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        >
          <option value="">Semua</option>
          <option value="SUPERADMIN">SUPERADMIN</option>
          <option value="ADMIN">ADMIN</option>
          <option value="USER">USER</option>
        </select>
      </div>
      <!-- Row 2: Pencarian -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Pencarian</label>
        <div class="relative">
          <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="local.search"
            type="text"
            placeholder="Cari deskripsi, user, entity..."
            class="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            @keydown.enter="apply"
          />
        </div>
      </div>
      <!-- Row 2: Tombol Aksi -->
      <div class="flex items-end gap-2 h-full">
        <button
          @click="reset"
          class="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
        >
          Reset
        </button>
        <button
          @click="apply"
          class="flex-1 px-3 py-2 text-sm rounded-md bg-primary hover:bg-primary-700 text-white transition-colors whitespace-nowrap"
        >
          Terapkan
        </button>
        <button
          @click="$emit('export')"
          class="flex-1 px-3 py-2 text-sm rounded-md border border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors inline-flex items-center justify-center gap-1 whitespace-nowrap"
        >
          <UIcon name="i-lucide-download" class="w-4 h-4" />
          Export
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { AuditFilter, AuditAction, AuditModuleType, AuditStatus } from '~/types/audit';

const props = defineProps<{
  modelValue: AuditFilter;
}>();

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
  'DIGSIG', 'MAIL', 'MASTER_DATA', 'CONFIG', 'USULAN_PINDAH', 'FAQ', 'AUDIT',
];

const moduleLabels: Record<string, string> = {
  AUTH: 'Autentikasi', USER: 'Pengguna', RBAC: 'Hak Akses', NASKAH: 'Naskah',
  BERKAS: 'Berkas', DISPOSISI: 'Disposisi', DELEGASI: 'Delegasi', DIGSIG: 'Tanda Tangan Digital',
  MAIL: 'Email', MASTER_DATA: 'Data Master', CONFIG: 'Konfigurasi',
  USULAN_PINDAH: 'Usulan Pindah', FAQ: 'FAQ', AUDIT: 'Audit',
};

const statuses: AuditStatus[] = ['SUCCESS', 'FAILED', 'ERROR', 'DENIED'];

const statusLabels: Record<string, string> = {
  SUCCESS: 'Berhasil', FAILED: 'Gagal', ERROR: 'Error', DENIED: 'Ditolak',
};

// Helper: format tanggal lokal ke YYYY-MM-DD untuk input[type=date]
const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const local = reactive<AuditFilter>({
  ...props.modelValue,
  // Default: tanggal dari hari ini sampai hari ini
  startDate: props.modelValue.startDate || todayStr(),
  endDate: props.modelValue.endDate || todayStr(),
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
  // Reset ke default: tanggal hari ini, semua aksi/modul/status/role
  local.startDate = todayStr();
  local.endDate = todayStr();
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
</script>