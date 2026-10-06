<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
    <button type="button" class="flex w-full items-center justify-between gap-3 text-left" @click="isOpen = !isOpen">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">Timeline Riwayat</h3>
      <UIcon :name="isOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4 text-gray-400" />
    </button>
    <div v-show="isOpen" class="mt-4 space-y-1">
      <!-- Steps ditampilkan TERBALIK: paling baru (Selesai) di atas, paling lama (Draft) di bawah -->
      <div
        v-for="(step, i) in reversedSteps"
        :key="step.key"
        class="flex gap-3"
        :class="i < reversedSteps.length - 1 ? 'pb-4' : ''"
      >
        <div class="flex flex-col items-center">
          <div :class="stepDotClass(step.step, step.completed)" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0">
            <UIcon v-if="step.completed || (stepIndex >= step.step && !isRejected)" name="i-lucide-check" class="w-4 h-4" />
            <UIcon v-else-if="isRejected && stepIndex === step.step" name="i-lucide-x" class="w-4 h-4" />
            <span v-else class="text-xs font-semibold">{{ step.step + 1 }}</span>
          </div>
          <!-- Garis penghubung ke langkah berikutnya (di bawah) -->
          <div v-if="i < reversedSteps.length - 1" class="w-0.5 flex-1 mt-1 bg-green-300 dark:bg-green-700"></div>
        </div>
        <div class="flex-1 min-w-0">
          <p :class="stepTextClass(step.step, step.completed)" class="text-sm font-medium">{{ step.label }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ step.desc }}</p>
          <p v-if="step.date" class="text-xs text-gray-400 mt-0.5">{{ formatDate(step.date) }}</p>
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
import { computed, ref } from 'vue';
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';
import { formatDate } from '~/utils/transfer-status';

const props = defineProps<{ item: TransferActiveToInactive }>();
const isOpen = ref(true);

/** Mapping status → index step (0-4). */
const stepIndex = computed(() => {
  const s = props.item.status;
  if (s === 'DRAFT') return 0;
  if (s === 'MENUNGGU_VERIFIKASI_ATASAN') return 1;
  if (s === 'DISETUJUI_ATASAN') return 2;
  if (s === 'MENUNGGU_VERIFIKASI_TERAKHIR') return 2;
  if (s === 'DISETUJUI_VERIFIKASI_TERAKHIR') return props.item.bacSignedAt ? 4 : 3;
  if (s === 'USUL_PINDAH_DIKIRIM') return props.item.bacSignedAt ? 4 : 3;
  if (s === 'SIAPKAN_BERKAS_FISIK') return 4;
  if (s === 'DIKIRIM') return 4;
  if (s === 'MENUNGGU_VERIFIKASI_BERKAS_FISIK') return 4;
  if (s === 'BERKAS_FISIK_SESUAI') return 4;
  if (s === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU') return 4;
  if (s === 'DISETUJUI_PERSETUJUAN_TU') return 4;
  if (s === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU') return 4;
  if (s === 'DISETUJUI_PERSETUJUAN_TERAKHIR_TU') return 5;
  if (s === 'ARSIP_INAKTIF_DITERIMA') return 5;
  if (s === 'PENATAAN_ARSIP_INAKTIF') return 5;
  if (s === 'SELESAI') return 5;
  return 0;
});

const isRejected = computed(() =>
  ['DITOLAK_ATASAN', 'DITOLAK_VERIFIKASI_TERAKHIR', 'DITOLAK_PERSETUJUAN_TU', 'DITOLAK_PERSETUJUAN_TERAKHIR_TU', 'BERKAS_FISIK_TIDAK_SESUAI'].includes(props.item.status),
);

/** Daftar langkah urutan lama→baru (index 0 = Draft, 4 = Selesai). */
const steps = computed(() => [
  {
    key: 'draft',
    step: 0,
    label: 'Draft',
    desc: 'Sekretaris membuat usulan',
    date: props.item.createdAt,
    completed: false,
  },
  {
    key: 'persetujuan',
    step: 1,
    label: 'Menunggu Persetujuan',
    desc: 'Atasan Managerial Sekretaris',
    date: props.item.approvedAt,
    completed: false,
  },
  {
    key: 'verifikasi',
    step: 2,
    label: 'Menunggu Verifikasi',
    desc: 'Verifikasi terakhir Atasan Managerial → masuk TU',
    date: props.item.finalVerifiedAt,
    completed: false,
  },
  {
    key: 'bac-signature',
    step: 3,
    label: 'Menunggu Tanda Tangan',
    desc: props.item.bacPihakPertamaName
      ? `Pejabat pengirim: ${props.item.bacPihakPertamaName}`
      : 'Pejabat pengirim menandatangani berita acara',
    date: props.item.bacSignedAt,
    completed: !!props.item.bacSignedAt,
  },
  {
    key: 'penerimaan',
    step: 4,
    label: 'Menunggu Penerimaan',
    desc: 'TU kirim ke Atasan Managerial TU',
    date: props.item.tanggalDikirim,
    completed: false,
  },
  {
    key: 'selesai',
    step: 5,
    label: 'Selesai',
    desc: 'TU menata arsip inaktif',
    date: props.item.tuFinalApprovedAt,
    completed: false,
  },
]);

/** Urutan terbalik: paling baru (Selesai) di atas, paling lama (Draft) di bawah. */
const reversedSteps = computed(() => {
  return [...steps.value].reverse();
});

const stepDotClass = (step: number, completed = false): string => {
  if (completed) return 'bg-green-500 text-white';
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

const stepTextClass = (step: number, completed = false): string => {
  if (completed) return 'text-gray-900 dark:text-white';
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
