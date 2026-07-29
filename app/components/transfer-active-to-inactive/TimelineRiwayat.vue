<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
    <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Timeline Riwayat</h3>
    <div class="space-y-1">
      <!-- Step 1: Draft -->
      <div class="flex gap-3 pb-4">
        <div class="flex flex-col items-center">
          <div :class="stepDotClass(0)" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
            <UIcon v-if="stepIndex >= 0 && !isRejected" name="i-lucide-check" class="w-4 h-4" />
            <UIcon v-else-if="isRejected && stepIndex === 0" name="i-lucide-x" class="w-4 h-4" />
            <span v-else class="text-xs font-semibold">1</span>
          </div>
          <div v-if="stepIndex > 0" class="w-0.5 flex-1 mt-1 bg-green-300 dark:bg-green-700"></div>
        </div>
        <div class="flex-1 min-w-0">
          <p :class="stepTextClass(0)" class="text-sm font-medium">Draft</p>
          <p class="text-xs text-gray-400 mt-0.5">Sekretaris membuat usulan</p>
          <p v-if="item.createdAt" class="text-xs text-gray-400 mt-0.5">{{ formatDate(item.createdAt) }}</p>
        </div>
      </div>

      <!-- Step 2: Menunggu Persetujuan -->
      <div class="flex gap-3 pb-4">
        <div class="flex flex-col items-center">
          <div :class="stepDotClass(1)" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
            <UIcon v-if="stepIndex >= 1 && !isRejected" name="i-lucide-check" class="w-4 h-4" />
            <UIcon v-else-if="isRejected && stepIndex === 1" name="i-lucide-x" class="w-4 h-4" />
            <span v-else class="text-xs font-semibold">2</span>
          </div>
          <div v-if="stepIndex > 1" class="w-0.5 flex-1 mt-1 bg-green-300 dark:bg-green-700"></div>
        </div>
        <div class="flex-1 min-w-0">
          <p :class="stepTextClass(1)" class="text-sm font-medium">Menunggu Persetujuan</p>
          <p class="text-xs text-gray-400 mt-0.5">Atasan Managerial Sekretaris</p>
          <p v-if="item.approvedAt" class="text-xs text-gray-400 mt-0.5">{{ formatDate(item.approvedAt) }}</p>
        </div>
      </div>

      <!-- Step 3: Menunggu Verifikasi -->
      <div class="flex gap-3 pb-4">
        <div class="flex flex-col items-center">
          <div :class="stepDotClass(2)" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
            <UIcon v-if="stepIndex >= 2 && !isRejected" name="i-lucide-check" class="w-4 h-4" />
            <UIcon v-else-if="isRejected && stepIndex === 2" name="i-lucide-x" class="w-4 h-4" />
            <span v-else class="text-xs font-semibold">3</span>
          </div>
          <div v-if="stepIndex > 2" class="w-0.5 flex-1 mt-1 bg-green-300 dark:bg-green-700"></div>
        </div>
        <div class="flex-1 min-w-0">
          <p :class="stepTextClass(2)" class="text-sm font-medium">Menunggu Verifikasi</p>
          <p class="text-xs text-gray-400 mt-0.5">Verifikasi terakhir Atasan Managerial → masuk TU</p>
          <p v-if="item.finalVerifiedAt" class="text-xs text-gray-400 mt-0.5">{{ formatDate(item.finalVerifiedAt) }}</p>
        </div>
      </div>

      <!-- Step 4: Menunggu Penerimaan -->
      <div class="flex gap-3 pb-4">
        <div class="flex flex-col items-center">
          <div :class="stepDotClass(3)" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
            <UIcon v-if="stepIndex >= 3 && !isRejected" name="i-lucide-check" class="w-4 h-4" />
            <UIcon v-else-if="isRejected && stepIndex === 3" name="i-lucide-x" class="w-4 h-4" />
            <span v-else class="text-xs font-semibold">4</span>
          </div>
          <div v-if="stepIndex > 3" class="w-0.5 flex-1 mt-1 bg-green-300 dark:bg-green-700"></div>
        </div>
        <div class="flex-1 min-w-0">
          <p :class="stepTextClass(3)" class="text-sm font-medium">Menunggu Penerimaan</p>
          <p class="text-xs text-gray-400 mt-0.5">TU kirim ke Atasan Managerial TU</p>
          <p v-if="item.tanggalDikirim" class="text-xs text-gray-400 mt-0.5">{{ formatDate(item.tanggalDikirim) }}</p>
        </div>
      </div>

      <!-- Step 5: Selesai -->
      <div class="flex gap-3">
        <div class="flex flex-col items-center">
          <div :class="stepDotClass(4)" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
            <UIcon v-if="stepIndex >= 4" name="i-lucide-check" class="w-4 h-4" />
            <span v-else class="text-xs font-semibold">5</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p :class="stepTextClass(4)" class="text-sm font-medium">Selesai</p>
          <p class="text-xs text-gray-400 mt-0.5">TU menata arsip inaktif</p>
          <p v-if="item.tuFinalApprovedAt" class="text-xs text-gray-400 mt-0.5">{{ formatDate(item.tuFinalApprovedAt) }}</p>
        </div>
      </div>
    </div>

    <!-- Catatan penolakan -->
    <div v-if="isRejected && item.rejectedNote" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
      <p class="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Catatan Penolakan:</p>
      <p class="text-xs text-red-600 dark:text-red-400">{{ item.rejectedNote }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';
import { formatDate } from '~/utils/transfer-status';

const props = defineProps<{ item: TransferActiveToInactive }>();

/** Mapping status → index step (0-4). */
const stepIndex = computed(() => {
  const s = props.item.status;
  if (s === 'DRAFT') return 0;
  if (s === 'MENUNGGU_VERIFIKASI_ATASAN') return 1;
  if (s === 'DISETUJUI_ATASAN') return 2;
  if (s === 'MENUNGGU_VERIFIKASI_TERAKHIR') return 2;
  if (s === 'DISETUJUI_VERIFIKASI_TERAKHIR') return 3;
  if (s === 'USUL_PINDAH_DIKIRIM') return 3;
  if (s === 'SIAPKAN_BERKAS_FISIK') return 3;
  if (s === 'DIKIRIM') return 3;
  if (s === 'MENUNGGU_VERIFIKASI_BERKAS_FISIK') return 3;
  if (s === 'BERKAS_FISIK_SESUAI') return 3;
  if (s === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU') return 3;
  if (s === 'DISETUJUI_PERSETUJUAN_TU') return 3;
  if (s === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU') return 3;
  if (s === 'DISETUJUI_PERSETUJUAN_TERAKHIR_TU') return 4;
  if (s === 'ARSIP_INAKTIF_DITERIMA') return 4;
  if (s === 'PENATAAN_ARSIP_INAKTIF') return 4;
  if (s === 'SELESAI') return 4;
  return 0;
});

const isRejected = computed(() =>
  ['DITOLAK_ATASAN', 'DITOLAK_VERIFIKASI_TERAKHIR', 'DITOLAK_PERSETUJUAN_TU', 'DITOLAK_PERSETUJUAN_TERAKHIR_TU', 'BERKAS_FISIK_TIDAK_SESUAI'].includes(props.item.status),
);

const stepDotClass = (step: number): string => {
  if (isRejected.value && step === stepIndex.value) {
    return 'bg-red-500 text-white';
  }
  if (step < stepIndex.value) {
    return 'bg-green-500 text-white';
  }
  if (step === stepIndex.value) {
    return 'bg-[#457fb6] text-white ring-4 ring-[#457fb6]/20';
  }
  return 'bg-gray-200 dark:bg-gray-600 text-gray-400';
};

const stepTextClass = (step: number): string => {
  if (isRejected.value && step === stepIndex.value) {
    return 'text-red-700 dark:text-red-300';
  }
  if (step < stepIndex.value) {
    return 'text-gray-900 dark:text-white';
  }
  if (step === stepIndex.value) {
    return 'text-[#457fb6] dark:text-[#5a9ad6] font-semibold';
  }
  return 'text-gray-400';
};
</script>