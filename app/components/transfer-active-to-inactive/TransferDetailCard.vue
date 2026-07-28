<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Usulan</h3>
      <span :class="statusBadgeClass(transfer.status)">{{ statusLabel(transfer.status) }}</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <div>
        <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
        <p class="text-gray-900 dark:text-white font-medium">{{ transfer.nomorUsulan }}</p>
      </div>
      <div>
        <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Usulan</span>
        <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(transfer.tanggalUsulan) }}</p>
      </div>
      <div>
        <span class="text-gray-500 dark:text-gray-400 text-xs">Pengusul (Sekretaris)</span>
        <p class="text-gray-900 dark:text-white font-medium">{{ transfer.sekretarisName }}</p>
      </div>
      <div>
        <span class="text-gray-500 dark:text-gray-400 text-xs">Divisi</span>
        <p class="text-gray-900 dark:text-white font-medium">{{ transfer.divisiName ?? '-' }}</p>
      </div>
      <div>
        <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
        <p class="text-gray-900 dark:text-white font-medium">{{ transfer.atasanName }}</p>
      </div>
      <div>
        <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span>
        <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(transfer.tanggalRetensiAktifHabis) }}</p>
      </div>
      <div class="md:col-span-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Perihal Arsip</span>
        <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipPerihal }}</p>
        <p v-if="transfer.arsipKode" class="text-xs text-gray-400 mt-0.5">Kode: {{ transfer.arsipKode }}</p>
      </div>
      <div v-if="transfer.keterangan" class="md:col-span-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Keterangan</span>
        <p class="text-gray-900 dark:text-white text-sm mt-1 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">{{ transfer.keterangan }}</p>
      </div>
      <div v-if="transfer.rejectedNote" class="md:col-span-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Penolakan</span>
        <p class="text-red-600 dark:text-red-400 text-sm mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ transfer.rejectedNote }}</p>
      </div>
      <div v-if="transfer.verifyNote" class="md:col-span-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Verifikasi</span>
        <p class="text-gray-700 dark:text-gray-300 text-sm mt-1 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">{{ transfer.verifyNote }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';
import { statusBadgeClass, statusLabel, formatDate } from '~/utils/transfer-status';

defineProps<{ transfer: TransferActiveToInactive }>();
</script>