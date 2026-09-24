<template>
  <div class="overflow-x-auto">
    <table class="min-w-full border-collapse text-sm">
      <thead class="bg-primary-400 dark:bg-primary-700 text-white text-left">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="['px-4 py-3 font-semibold', col.headerClass || '']"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-4 py-6">
            <div class="space-y-4 animate-pulse">
              <div
                v-for="n in 5"
                :key="n"
                class="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-700"
              />
            </div>
          </td>
        </tr>
        <tr v-else-if="displayRows.length === 0">
          <td :colspan="columns.length" class="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            Tidak ada log aktivitas
          </td>
        </tr>
        <tr
          v-else
          v-for="(row, idx) in displayRows"
          :key="row.id ?? idx"
          class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          @click="$emit('view', row)"
        >
          <td class="px-4 py-3 text-gray-700 dark:text-gray-200 whitespace-nowrap">
            {{ formatDate(row.createdAt) }}
          </td>
          <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
            <div class="flex items-center gap-2">
              <span
                v-if="isAccountActive(row)"
                class="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                title="Akun sedang aktif"
              />
              <span>{{ row.userName || row.persnum || '-' }}</span>
            </div>
          </td>
          <td class="px-4 py-3">
            <span
              v-if="isAccountActive(row)"
              class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            >
              Aktif
            </span>
            <span v-else class="text-xs text-gray-400 dark:text-gray-500">-</span>
          </td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {{ row.userRole || '-' }}
            </span>
          </td>
          <td class="px-4 py-3">
            <span :class="actionBadge(row.action)">{{ row.action }}</span>
          </td>
          <td class="px-4 py-3">
            <span class="px-2 py-0.5 text-xs rounded-full bg-[#457fb6]/10 dark:bg-[#457fb6]/20 text-[#457fb6] dark:text-[#5a9ad4] font-medium">
              {{ row.module }}
            </span>
          </td>
          <td class="px-4 py-3">
            <span :class="statusBadge(row.status)">{{ row.status }}</span>
          </td>
          <td class="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs whitespace-nowrap">
            {{ formatIpAddress(row.ipAddress) }}
          </td>
          <td class="px-4 py-3 text-center" @click.stop>
            <button
              @click="$emit('view', row)"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap"
            >
              <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
              Detail
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ActiveAccount, AuditTrail, AuditStatus } from '~/types/audit';
import { formatIpAddress } from '~/utils/formatIpAddress';

const props = defineProps<{
  rows: AuditTrail[];
  loading: boolean;
  activeAccounts: ActiveAccount[];
}>();

// Aktivitas terakhir dari akun aktif ditampilkan di tabel yang sama.
// Hindari duplikasi jika aktivitas tersebut sudah ada di halaman log.
// Jika sesi aktif belum memiliki log (misalnya sesi dibuat sebelum perbaikan
// audit login), tetap tampilkan sesi tersebut agar akun dari perangkat lain
// tidak hilang dari monitoring.
const displayRows = computed(() => {
  const logIds = new Set(props.rows.map((row) => row.id));
  const rolesByPersnum = new Map(
    props.activeAccounts.map((account) => [account.persnum, account.userRole]),
  );
  const activeRows = props.activeAccounts.flatMap((account) => {
    if (account.latestActivity) {
      const latestActivity = account.latestActivity.userRole
        ? account.latestActivity
        : { ...account.latestActivity, userRole: account.userRole || 'USER' };
      return logIds.has(account.latestActivity.id) ? [] : [latestActivity];
    }

    const session = account.sessions[0];
    return [
      {
        id: `active-session-${account.persnum}`,
        createdAt: account.lastActivityAt,
        userId: null,
        persnum: account.persnum,
        userName: account.name || account.username || null,
        userEmail: null,
        userRole: account.userRole || 'USER',
        idPosition: null,
        unitKerja: null,
        action: 'LOGIN',
        module: 'AUTH',
        entityType: null,
        entityId: null,
        subEntityType: null,
        subEntityId: null,
        description: 'Sesi login aktif',
        oldValue: null,
        newValue: null,
        ipAddress: session?.ipAddress || null,
        userAgent: session?.userAgent || null,
        requestMethod: 'GET',
        requestUrl: '/auth/session',
        status: 'SUCCESS',
        errorMessage: null,
        metadata: { activeSession: true },
      } as AuditTrail,
    ];
  });

  const rowsWithRole = props.rows.map((row) => {
    if (row.userRole) return row;
    const activeRole = row.persnum ? rolesByPersnum.get(row.persnum) : null;
    return activeRole ? { ...row, userRole: activeRole } : row;
  });

  return [...activeRows, ...rowsWithRole].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    const validA = Number.isFinite(timeA);
    const validB = Number.isFinite(timeB);

    if (!validA && !validB) return 0;
    if (!validA) return 1;
    if (!validB) return -1;
    return timeB - timeA;
  });
});

defineEmits<{
  view: [row: AuditTrail];
}>();

const columns = [
  { key: 'createdAt', label: 'Waktu' },
  { key: 'userName', label: 'User' },
  { key: 'accountStatus', label: 'Status Akun' },
  { key: 'userRole', label: 'Role' },
  { key: 'action', label: 'Aksi' },
  { key: 'module', label: 'Modul' },
  { key: 'status', label: 'Status' },
  { key: 'ipAddress', label: 'IP Address' },
  { key: 'detail', label: 'Aksi', headerClass: 'text-center' },
];

const isAccountActive = (row: AuditTrail) => {
  if (row.persnum === null || row.persnum === undefined) return false;
  return props.activeAccounts.some((account) => account.persnum === row.persnum);
};

const formatDate = (d: string | Date) => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Badge warna untuk kolom Aksi (sesuai doc):
 * - LOGIN/LOGOUT: neutral (abu-abu)
 * - CREATE: primary (biru)
 * - UPDATE: warning (kuning)
 * - DELETE: error (merah)
 * - UPLOAD/DOWNLOAD: secondary (indigo)
 * - VIEW/LIST: neutral (abu-abu)
 * - APPROVE/REJECT/CONFIG_CHANGE/GENERATE/EXPORT/SIGN/VERIFY: fallback per kategori
 */
const actionBadge = (action: string) => {
  const map: Record<string, string> = {
    LOGIN: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium',
    LOGOUT: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium',
    VIEW: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium',
    LIST: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium',
    CREATE: 'px-2 py-0.5 text-xs rounded-full bg-[#457fb6]/10 dark:bg-[#457fb6]/20 text-[#457fb6] dark:text-[#5a9ad4] font-medium',
    UPDATE: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-medium',
    DELETE: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium',
    UPLOAD: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium',
    DOWNLOAD: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium',
    APPROVE: 'px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium',
    REJECT: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium',
    SIGN: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium',
    VERIFY: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium',
    GENERATE: 'px-2 py-0.5 text-xs rounded-full bg-[#457fb6]/10 dark:bg-[#457fb6]/20 text-[#457fb6] dark:text-[#5a9ad4] font-medium',
    EXPORT: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-medium',
    CONFIG_CHANGE: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-medium',
  };
  return map[action] || map.VIEW;
};

const statusBadge = (status: AuditStatus) => {
  // SUCCESS: hijau, FAILED: merah, ERROR: oranye, DENIED: abu-abu
  const map: Record<string, string> = {
    SUCCESS: 'px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium',
    FAILED: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium',
    ERROR: 'px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-medium',
    DENIED: 'px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium',
  };
  return map[status] || map.SUCCESS;
};
</script>
