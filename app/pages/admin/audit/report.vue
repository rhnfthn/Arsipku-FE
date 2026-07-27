<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Laporan Audit" :items="items" />
    </div>

    <!-- Filter Bar -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <!-- Row 1: Date fields + Aksi + Modul -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-4">
        <!-- Dari Tanggal -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Dari Tanggal</label>
          <input
            v-model="f.startDate"
            type="date"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
          />
        </div>
        <!-- Sampai Tanggal -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Sampai Tanggal</label>
          <input
            v-model="f.endDate"
            type="date"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
          />
        </div>
        <!-- Aksi -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Aksi</label>
          <select
            v-model="f.action"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
          >
            <option value="">Semua</option>
            <option v-for="a in actionList" :key="a" :value="a">{{ actionLabels[a] || a }}</option>
          </select>
        </div>
        <!-- Modul -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Modul</label>
          <select
            v-model="f.module"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
          >
            <option value="">Semua</option>
            <option v-for="m in moduleList" :key="m" :value="m">{{ moduleLabels[m] || m }}</option>
          </select>
        </div>
      </div>

      <!-- Row 2: Role + Pencarian + Buttons -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <!-- Role -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Role</label>
          <select
            v-model="f.userRole"
            class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
          >
            <option value="">Semua</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>
        </div>
        <!-- Pencarian User -->
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pencarian User</label>
          <div class="relative">
            <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              v-model="f.search"
              type="text"
              placeholder="Nama, username..."
              class="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-[#457fb6] focus:border-[#457fb6] outline-none"
              @keydown.enter="loadSummary"
            />
          </div>
        </div>
        <!-- Tombol Aksi -->
        <div class="flex items-end gap-2">
          <button
            @click="loadSummary"
            class="h-10 px-4 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap"
          >
            <UIcon name="i-lucide-eye" class="w-4 h-4 mr-1 inline" />
            Tampilkan
          </button>
          <button
            @click="resetFilter"
            class="h-10 px-4 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            Reset
          </button>
          <button
            @click="onExport"
            :disabled="exporting"
            class="h-10 px-4 text-sm font-medium rounded-lg border border-[#457fb6] text-[#457fb6] hover:bg-[#457fb6]/10 dark:hover:bg-[#457fb6]/20 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <UIcon name="i-lucide-download" class="w-4 h-4 mr-1 inline" />
            {{ exporting ? 'Exporting...' : 'Export CSV' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Ringkasan Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <!-- Total Aktivitas -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Aktivitas</p>
        <p class="text-3xl font-bold text-[#457fb6]">{{ summary?.total ?? 0 }}</p>
      </div>
      <!-- Distribusi Status -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Distribusi Status</p>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="s in summary?.byStatus ?? []" :key="s.status" :class="statusBadge(s.status)">
            {{ statusLabel(s.status) }}: {{ s.count }}
          </span>
        </div>
      </div>
      <!-- Distribusi Modul -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Distribusi Modul</p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="m in summary?.byModule ?? []"
            :key="m.module"
            class="px-2 py-0.5 text-xs rounded-full bg-[#457fb6]/10 dark:bg-[#457fb6]/20 text-[#457fb6] dark:text-[#5a9ad4] font-medium"
          >
            {{ moduleLabels[m.module] || m.module }}: {{ m.count }}
          </span>
        </div>
      </div>
      <!-- Distribusi Aksi -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Distribusi Aksi</p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="a in summary?.byAction ?? []"
            :key="a.action"
            class="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium"
          >
            {{ actionLabels[a.action] || a.action }}: {{ a.count }}
          </span>
        </div>
      </div>
    </div>

    <!-- Chart Aktivitas Harian -->
    <div class="mb-4">
      <AuditReportChart :summary="summary" />
    </div>

    <!-- Log Aktivitas Teratas -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Log Aktivitas Teratas</h4>
        <NuxtLink to="/admin/audit" class="text-xs font-medium text-[#457fb6] hover:underline">
          Lihat Semua →
        </NuxtLink>
      </div>

      <!-- Empty State -->
      <div v-if="!summary?.recentLogs || summary.recentLogs.length === 0" class="text-center py-8">
        <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p class="text-sm text-gray-400">Belum ada data</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Waktu</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">User</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Role</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Aksi</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Modul</th>
              <th class="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Deskripsi</th>
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
              <td class="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300 max-w-[200px] truncate">{{ log.description || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAudit } from '~/composables/useAudit';
import type { AuditSummary } from '~/types/audit';

definePageMeta({ middleware: ['auth', 'audit-admin'] });

const { fetchSummary, exportReport, summary } = useAudit();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Administrasi', to: '/admin/audit' },
  { label: 'Laporan Audit', to: '/admin/audit/report' },
];

// --- Filter State ---
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const f = reactive({
  startDate: todayStr(),
  endDate: todayStr(),
  action: '',
  module: '',
  userRole: '',
  search: '',
});

const exporting = ref(false);

// --- Dropdown Options ---
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

// --- Load ---
const loadSummary = async () => {
  try {
    await fetchSummary({
      startDate: f.startDate || undefined,
      endDate: f.endDate || undefined,
      action: f.action || undefined,
      module: f.module || undefined,
      userRole: f.userRole || undefined,
      search: f.search || undefined,
    });
  } catch (e) {
    console.error('Gagal memuat ringkasan:', e);
  }
};

const resetFilter = () => {
  f.startDate = todayStr();
  f.endDate = todayStr();
  f.action = '';
  f.module = '';
  f.userRole = '';
  f.search = '';
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

// --- Helpers ---
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

// Status badge sesuai palette Arsipku:
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

// Action badge — primary untuk semua action
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