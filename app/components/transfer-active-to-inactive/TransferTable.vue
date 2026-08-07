<template>
  <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
    <div class="overflow-x-auto">
      <table class="min-w-full border-collapse text-sm">
        <thead class="bg-[#457fb6] text-white text-left">
          <tr>
            <th class="px-4 py-3 font-semibold">No</th>
            <th class="px-4 py-3 font-semibold">Nomor Usulan</th>
            <th class="px-4 py-3 font-semibold">Perihal Arsip</th>
            <th class="px-4 py-3 font-semibold">Atasan Managerial</th>
            <th class="px-4 py-3 font-semibold">Status</th>
            <th class="px-4 py-3 font-semibold">Tanggal</th>
            <th class="px-4 py-3 font-semibold text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading -->
          <tr v-if="loading">
            <td colspan="7" class="px-4 py-6">
              <div class="space-y-4 animate-pulse">
                <div v-for="n in 5" :key="n" class="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
              </div>
            </td>
          </tr>

          <!-- Empty -->
          <tr v-else-if="!data || data.length === 0">
            <td colspan="7" class="px-4 py-10 text-center text-sm text-gray-400">
              <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Tidak ada data usulan</p>
            </td>
          </tr>

          <!-- Rows -->
          <template v-else>
            <tr
              v-for="(row, idx) in data"
              :key="row.id"
              class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td class="px-4 py-3 text-gray-500">{{ idx + 1 + ((meta?.page ?? 1) - 1) * (meta?.limit ?? 10) }}</td>
              <td class="px-4 py-3 font-medium whitespace-nowrap text-gray-700 dark:text-gray-200">{{ row.nomorUsulan }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="row.arsipPerihal">{{ row.arsipPerihal }}</td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-200">{{ row.atasanName }}</td>
              <td class="px-4 py-3">
                <span :class="statusBadgeClass(row.status)">{{ statusLabel(row.status) }}</span>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ formatDate(row.tanggalUsulan) }}</td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1 flex-wrap">
                  <!-- Detail -->
                  <button
                    @click="$emit('detail', row)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap"
                  >
                    <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" /> Detail
                  </button>

                  <!-- Edit (DRAFT / DITOLAK_ATASAN) -->
                  <button
                    v-if="row.status === 'DRAFT' || row.status === 'DITOLAK_ATASAN'"
                    @click="$emit('edit', row)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                  >
                    <UIcon name="i-lucide-pencil" class="w-3.5 h-3.5" /> Edit
                  </button>

                  <!-- Kirim (DRAFT) -->
                  <button
                    v-if="row.status === 'DRAFT'"
                    @click="$emit('send', row)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors whitespace-nowrap"
                  >
                    <UIcon name="i-lucide-send" class="w-3.5 h-3.5" /> Kirim
                  </button>

                  <!-- Hapus (DRAFT) -->
                  <button
                    v-if="row.status === 'DRAFT'"
                    @click="$emit('delete', row)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors whitespace-nowrap"
                  >
                    <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="meta && meta.total > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
      <div class="text-sm text-gray-500">
        Menampilkan {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }} dari {{ meta.total }}
      </div>
      <div v-if="meta.totalPages > 1" class="flex gap-1">
        <button
          :disabled="meta.page <= 1"
          @click="$emit('page', meta.page - 1)"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700"
        >Prev</button>
        <button
          :disabled="meta.page >= meta.totalPages"
          @click="$emit('page', meta.page + 1)"
          class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700"
        >Next</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TransferActiveToInactive, TransferActiveToInactiveStatus } from '~/types/transfer-active-to-inactive';
import { statusBadgeClass, statusLabel, formatDate } from '~/utils/transfer-status';

defineProps<{
  data: TransferActiveToInactive[];
  loading: boolean;
  meta: { page: number; limit: number; total: number; totalPages: number } | null;
}>();

defineEmits<{
  detail: [row: TransferActiveToInactive];
  edit: [row: TransferActiveToInactive];
  send: [row: TransferActiveToInactive];
  delete: [row: TransferActiveToInactive];
  page: [p: number];
}>();
</script>