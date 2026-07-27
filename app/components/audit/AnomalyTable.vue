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
        <tr v-else-if="rows.length === 0">
          <td :colspan="columns.length" class="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            Tidak ada anomali
          </td>
        </tr>
        <tr
          v-else
          v-for="(row, idx) in rows"
          :key="row.id ?? idx"
          class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
        >
          <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ idx + 1 + (page - 1) * limit }}</td>
          <td class="px-4 py-3 text-gray-700 dark:text-gray-200 whitespace-nowrap">
            {{ formatDate(row.createdAt) }}
          </td>
          <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
            <div class="font-medium">{{ row.title }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ row.anomalyType }}</div>
          </td>
          <td class="px-4 py-3">
            <span :class="severityBadge(row.severity)">{{ row.severity }}</span>
          </td>
          <td class="px-4 py-3 text-gray-700 dark:text-gray-200">
            {{ row.userName || row.persnum || '-' }}
          </td>
          <td class="px-4 py-3">
            <span :class="statusBadge(row.status)">{{ row.status }}</span>
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center justify-center gap-1">
              <button
                @click="$emit('view', row)"
                class="p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors group"
                title="Tinjau"
              >
                <UIcon name="i-lucide-eye" class="w-4 h-4 text-primary group-hover:text-primary-700" />
              </button>
              <button
                v-if="row.status === 'NEW' || row.status === 'REVIEWING'"
                @click="$emit('resolve', row)"
                class="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
                title="Tandai Resolved"
              >
                <UIcon name="i-lucide-check" class="w-4 h-4 text-green-600 group-hover:text-green-700" />
              </button>
              <button
                v-if="row.status === 'NEW' || row.status === 'REVIEWING'"
                @click="$emit('ignore', row)"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                title="Abaikan"
              >
                <UIcon name="i-lucide-x" class="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { AuditAnomaly, AnomalySeverity, AnomalyStatus } from '~/types/audit';

defineProps<{
  rows: AuditAnomaly[];
  loading: boolean;
  page: number;
  limit: number;
}>();

defineEmits<{
  view: [row: AuditAnomaly];
  resolve: [row: AuditAnomaly];
  ignore: [row: AuditAnomaly];
}>();

const columns = [
  { key: 'no', label: 'No' },
  { key: 'createdAt', label: 'Waktu' },
  { key: 'title', label: 'Jenis' },
  { key: 'severity', label: 'Severity' },
  { key: 'userName', label: 'User' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: 'Aksi', headerClass: 'text-center' },
];

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

const severityBadge = (severity: AnomalySeverity) => {
  const map: Record<string, string> = {
    LOW: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium',
    MEDIUM: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 font-medium',
    HIGH: 'px-2 py-0.5 text-xs rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 font-medium',
    CRITICAL: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium',
  };
  return map[severity] || map.LOW;
};

const statusBadge = (status: AnomalyStatus) => {
  const map: Record<string, string> = {
    NEW: 'px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 font-medium',
    REVIEWING: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium',
    RESOLVED: 'px-2 py-0.5 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium',
    IGNORED: 'px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium',
  };
  return map[status] || map.NEW;
};
</script>