<template>
  <div class="overflow-x-auto">
    <table class="min-w-full border-collapse text-sm">
        <thead class="bg-primary dark:bg-primary-700 text-white text-center">
          <tr>
            <th class="px-4 py-3 font-semibold">Nama Berkas</th>
            <th class="px-4 py-3 font-semibold">Kode Berkas / No. Usulan</th>
            <th class="px-4 py-3 font-semibold">Klasifikasi</th>
            <th class="px-4 py-3 font-semibold">Sekretaris</th>
            <th class="px-4 py-3 font-semibold">Status</th>
            <th class="px-4 py-3 font-semibold">Tanggal</th>
            <th class="px-4 py-3 font-semibold">Aksi</th>
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
              <p>Belum ada usulan pemindahan arsip yang perlu diverifikasi</p>
              <p class="text-xs text-gray-400 mt-1">Usulan dari Sekretaris akan muncul di sini setelah dikirim ke Anda.</p>
            </td>
          </tr>

          <!-- Rows -->
          <template v-else>
            <tr
              v-for="row in data"
              :key="row.id"
              class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="row.arsipPerihal">{{ row.arsipPerihal }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">{{ row.arsipKode ?? '-' }}</div>
                <div class="text-[11px] text-gray-400 truncate">{{ row.nomorUsulan }}</div>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="row.arsipKlasifikasi ?? '-'">{{ row.arsipKlasifikasi ?? '-' }}</td>
              <td class="px-4 py-3 text-gray-700 dark:text-gray-200">{{ row.sekretarisName }}</td>
              <td class="px-4 py-3">
                <span :class="verifikasiStatusBadge(row.status)">{{ verifikasiStatusLabel(row.status) }}</span>
              </td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ formatVerifikasiDate(row.tanggalUsulan) }}</td>
              <td class="px-4 py-3 text-center">
                <button
                  @click="$emit('detail', row)"
                  :title="needsVerification(row.status) ? 'Verifikasi' : 'Detail'"
                  class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary hover:bg-primary-800 text-white transition-colors"
                >
                  <UIcon v-if="needsVerification(row.status)" name="i-lucide-file-check-2" class="w-4 h-4" />
                  <UIcon v-else name="i-heroicons-eye" class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import type { VerifikasiUsulanItem, VerifikasiStatus } from '~/types/verifikasi-usulan';
import {
  verifikasiStatusBadge,
  verifikasiStatusLabel,
  formatVerifikasiDate,
} from '~/utils/verifikasi-status';

const props = defineProps<{
  data: VerifikasiUsulanItem[];
  loading: boolean;
}>();

defineEmits<{ detail: [row: VerifikasiUsulanItem] }>();

// Debug: log data yang diterima komponen
watch(
  () => props.data,
  (newData) => {
    console.log('[VerifikasiTable] Data received:', newData?.length, 'items');
    if (newData && newData.length > 0) {
      console.log('[VerifikasiTable] First item:', newData[0]);
    }
  },
  { immediate: true },
);

const needsVerification = (s: VerifikasiStatus) =>
  s === 'MENUNGGU_VERIFIKASI_ATASAN' ||
  s === 'DISETUJUI_ATASAN' ||
  s === 'MENUNGGU_VERIFIKASI_TERAKHIR';
</script>