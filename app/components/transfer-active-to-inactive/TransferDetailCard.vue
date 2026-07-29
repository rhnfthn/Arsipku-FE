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
        <p v-if="transfer.totalApprovalLevels && transfer.totalApprovalLevels > 1" class="text-xs text-gray-400 mt-0.5">
          Tahap {{ transfer.currentApprovalLevel }} dari {{ transfer.totalApprovalLevels }}
        </p>
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

      <!-- Daftar Atasan Berjenjang -->
      <div v-if="transfer.approvalLevels && transfer.approvalLevels.length > 0" class="md:col-span-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Daftar Atasan Verifikasi (Berjenjang)</span>
        <div class="mt-2 space-y-2">
          <div
            v-for="level in transfer.approvalLevels"
            :key="level.id"
            class="flex items-center gap-3 p-2.5 rounded-lg border"
            :class="levelStatusClass(level.status)"
          >
            <div class="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">
              {{ level.urutan }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ level.atasanName }}</p>
              <p v-if="level.atasanPositionText" class="text-xs text-gray-500 dark:text-gray-400">{{ level.atasanPositionText }}</p>
            </div>
            <span :class="levelBadgeClass(level.status)" class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
              {{ levelStatusLabel(level.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Daftar Arsip (Multi-arsip) -->
      <div v-if="transfer.arsipIds && transfer.arsipIds.length > 1" class="md:col-span-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Daftar Arsip ({{ transfer.arsipIds.length }})</span>
        <div class="mt-2 space-y-1.5">
          <div
            v-for="(a, idx) in transfer.arsipIds"
            :key="a.id"
            class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <span class="text-xs font-semibold text-gray-400">{{ idx + 1 }}.</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900 dark:text-white truncate">{{ a.kode ?? '-' }} — {{ a.perihal }}</p>
            </div>
          </div>
        </div>
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
import type { TransferActiveToInactive, ApprovalLevel } from '~/types/transfer-active-to-inactive';
import { statusBadgeClass, statusLabel, formatDate } from '~/utils/transfer-status';

defineProps<{ transfer: TransferActiveToInactive }>();

const levelStatusClass = (status: string): string => {
  if (status === 'DISETUJUI') return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  if (status === 'DITOLAK') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
};

const levelBadgeClass = (status: string): string => {
  if (status === 'DISETUJUI') return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
  if (status === 'DITOLAK') return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
  return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
};

const levelStatusLabel = (status: string): string => {
  if (status === 'DISETUJUI') return 'Disetujui';
  if (status === 'DITOLAK') return 'Ditolak';
  return 'Menunggu';
};
</script>