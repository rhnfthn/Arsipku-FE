<template>
  <div class="overflow-x-auto">
    <table class="min-w-full border-collapse text-sm">
      <thead class="bg-gray-50 dark:bg-gray-700/30 text-left">
        <tr>
          <th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">No</th>
          <th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Waktu</th>
          <th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Aksi</th>
          <th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Modul</th>
          <th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Deskripsi</th>
          <th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
          <th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 text-center">Detail</th>
        </tr>
      </thead>
      <tbody>
        <!-- Loading skeleton -->
        <tr v-if="loading">
          <td colspan="7" class="px-4 py-6">
            <div class="space-y-3 animate-pulse">
              <div
                v-for="n in 5"
                :key="n"
                class="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-700"
              />
            </div>
          </td>
        </tr>

        <!-- Empty state -->
        <tr v-else-if="rows.length === 0">
          <td colspan="7" class="px-4 py-10 text-center">
            <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p class="text-sm text-gray-400 dark:text-gray-500">Tidak ada riwayat aktivitas</p>
          </td>
        </tr>

        <!-- Data rows -->
        <tr
          v-else
          v-for="(row, idx) in rows"
          :key="row.id ?? idx"
          class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
        >
          <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
            {{ idx + 1 + (page - 1) * limit }}
          </td>
          <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
            {{ formatDate(row.createdAt) }}
          </td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 text-xs rounded-full bg-[#457fb6]/10 dark:bg-[#457fb6]/20 text-[#457fb6] dark:text-[#5a9ad4] font-medium">
              {{ actionLabel(row.action) }}
            </span>
          </td>
          <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
            {{ moduleLabel(row.module) }}
          </td>
          <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 max-w-[240px] truncate" :title="row.description || ''">
            {{ row.description || '-' }}
          </td>
          <td class="px-4 py-3">
            <span :class="statusBadge(row.status)">{{ statusLabel(row.status) }}</span>
          </td>
          <td class="px-4 py-3 text-center">
            <button
              @click="$emit('view', row)"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-[#457fb6] hover:bg-[#457fb6]/10 dark:hover:bg-[#457fb6]/20 transition-colors"
              title="Lihat Detail"
            >
              <UIcon name="i-lucide-eye" class="w-3.5 h-3.5" />
              Detail
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { MyActivity } from '~/types/my-activity';

defineProps<{
  rows: MyActivity[];
  loading: boolean;
  page: number;
  limit: number;
}>();

defineEmits<{
  view: [row: MyActivity];
}>();

const formatDate = (d: string | Date) => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const statusLabel = (s: string) => {
  const m: Record<string, string> = {
    SUCCESS: 'Berhasil', FAILED: 'Gagal', ERROR: 'Error', DENIED: 'Ditolak',
  };
  return m[s] || s;
};

const statusBadge = (s: string) => {
  const m: Record<string, string> = {
    SUCCESS: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium',
    FAILED: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 font-medium',
    ERROR: 'px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-medium',
    DENIED: 'px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium',
  };
  return m[s] || m.SUCCESS;
};

const actionLabel = (a: string) => {
  const m: Record<string, string> = {
    LOGIN: 'Login', LOGOUT: 'Logout', CREATE: 'Buat Data', UPDATE: 'Ubah Data', DELETE: 'Hapus Data',
    VIEW: 'Lihat', LIST: 'Daftar', APPROVE: 'Setujui', REJECT: 'Tolak', UPLOAD: 'Unggah',
    DOWNLOAD: 'Unduh', SIGN: 'Tanda Tangan', VERIFY: 'Verifikasi', GENERATE: 'Generate',
    EXPORT: 'Ekspor', CONFIG_CHANGE: 'Ubah Konfigurasi',
  };
  return m[a] || a;
};

const moduleLabel = (m: string) => {
  const map: Record<string, string> = {
    AUTH: 'Autentikasi', USER: 'Pengguna', RBAC: 'Hak Akses', NASKAH: 'Naskah',
    BERKAS: 'Berkas', DISPOSISI: 'Disposisi', DELEGASI: 'Delegasi', DIGSIG: 'Tanda Tangan Digital',
    MAIL: 'Email', MASTER_DATA: 'Data Master', CONFIG: 'Konfigurasi',
    USULAN_PINDAH: 'Usulan Pindah', FAQ: 'FAQ', AUDIT: 'Audit',
  };
  return map[m] || m;
};
</script>