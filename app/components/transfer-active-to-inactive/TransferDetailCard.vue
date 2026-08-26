<template>
  <div class="space-y-5">
    <!-- Card 1: Informasi Usulan + Keterangan + Total Arsip + File Rincian -->
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
          <span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipKode ?? '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipKlasifikasi ?? '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.atasanName }}</p>
          <p v-if="transfer.totalApprovalLevels && transfer.totalApprovalLevels > 1" class="text-xs text-gray-400 mt-0.5">
            Tahap {{ transfer.currentApprovalLevel }} dari {{ transfer.totalApprovalLevels }}
          </p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Jenis</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipTindakanPenyusutan ?? '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(transfer.tanggalRetensiAktifHabis) }}</p>
        </div>
        <div class="md:col-span-2">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Perihal Arsip</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipPerihal }}</p>
        </div>
      </div>
      <div v-if="transfer.rejectedNote" class="mt-4">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Penolakan</span>
        <p class="text-red-600 dark:text-red-400 text-sm mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ transfer.rejectedNote }}</p>
      </div>
      <div v-if="transfer.verifyNote" class="mt-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Verifikasi</span>
        <p class="text-gray-700 dark:text-gray-300 text-sm mt-1 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">{{ transfer.verifyNote }}</p>
      </div>

      <!-- Keterangan -->
      <div v-if="transfer.keterangan" class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Keterangan</h4>
        <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
          {{ transfer.keterangan }}
        </p>
      </div>
    </div>

    <!-- Card 2: Daftar Arsip yang Akan Dipindahkan -->
    <div
      v-if="transfer.arsipIds && transfer.arsipIds.length > 0"
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">
        Daftar Arsip({{ transfer.arsipIds.length }})
      </h3>
      <div class="space-y-1.5">
        <div
          v-for="(a, idx) in transfer.arsipIds"
          :key="a.id"
          class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
        >
          <span class="text-xs font-semibold text-gray-400">{{ idx + 1 }}.</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-900 dark:text-white truncate">{{ a.kode ?? '-' }} — {{ a.perihal }}</p>
          </div>
          <!-- Icon mata: lihat detail berkas -->
          <NuxtLink
            :to="`/maintenance/preview-berkas/${a.id}?nomor_usulan=${transfer.nomorUsulan}&usulan_id=${transfer.id}&from=transfer`"
            class="inline-flex rounded-md p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30 shrink-0"
            title="Lihat detail berkas"
          >
            <UIcon name="i-lucide-eye" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Card 4: Daftar Atasan TU Verifikasi (Berjenjang) -->
    <div
      v-if="transfer.tuApprovalLevels && transfer.tuApprovalLevels.length > 0"
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Daftar Atasan TU Verifikasi (Berjenjang)</h3>
      <div class="space-y-2">
        <div
          v-for="level in transfer.tuApprovalLevels"
          :key="level.urutan"
          class="flex items-center gap-3 p-3 rounded-lg border"
          :class="levelStatusClass(level.status)"
        >
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">
            {{ level.urutan }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ level.name }}</p>
            <p v-if="level.jabatan" class="text-xs text-gray-500 dark:text-gray-400">{{ level.jabatan }}</p>
          </div>
          <span :class="levelBadgeClass(level.status)" class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
            {{ levelStatusLabel(level.status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TransferActiveToInactive, ApprovalLevel } from '~/types/transfer-active-to-inactive';
import { statusBadgeClass, statusLabel, formatDate } from '~/utils/transfer-status';

const props = defineProps<{ transfer: TransferActiveToInactive }>();

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