<template>
  <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
    <button
      v-for="card in cards"
      :key="card.key"
      @click="$emit('click', card.filter)"
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm text-left hover:ring-2 hover:ring-[#457fb6] transition-all"
    >
      <div class="flex items-center justify-between">
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ card.label }}</p>
        <UIcon :name="card.icon" class="w-5 h-5" :class="card.color" />
      </div>
      <p class="text-2xl font-bold mt-2" :class="card.color">{{ card.value }}</p>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { VerifikasiSummary, VerifikasiStatus } from '~/types/verifikasi-usulan';

const props = defineProps<{ summary: VerifikasiSummary | null }>();
defineEmits<{ click: [status: VerifikasiStatus | ''] }>();

const cards = computed(() => [
  {
    key: 'menunggu',
    label: 'Menunggu Verifikasi',
    value: props.summary?.menungguVerifikasi ?? 0,
    color: 'text-yellow-600 dark:text-yellow-400',
    icon: 'i-lucide-clock',
    filter: 'MENUNGGU_VERIFIKASI_ATASAN' as VerifikasiStatus,
  },
  {
    key: 'menungguFinal',
    label: 'Verifikasi Terakhir',
    value: props.summary?.menungguVerifikasiTerakhir ?? 0,
    color: 'text-orange-600 dark:text-orange-400',
    icon: 'i-lucide-hourglass',
    filter: 'MENUNGGU_VERIFIKASI_TERAKHIR' as VerifikasiStatus,
  },
  {
    key: 'disetujui',
    label: 'Disetujui',
    value: props.summary?.disetujui ?? 0,
    color: 'text-[#457fb6]',
    icon: 'i-lucide-check-circle',
    filter: 'DISETUJUI_ATASAN' as VerifikasiStatus,
  },
  {
    key: 'ditolak',
    label: 'Ditolak',
    value: props.summary?.ditolak ?? 0,
    color: 'text-red-600 dark:text-red-400',
    icon: 'i-lucide-x-circle',
    filter: 'DITOLAK_ATASAN' as VerifikasiStatus,
  },
  {
    key: 'selesai',
    label: 'Selesai',
    value: props.summary?.selesai ?? 0,
    color: 'text-green-600 dark:text-green-400',
    icon: 'i-lucide-check-check',
    filter: 'SELESAI' as VerifikasiStatus,
  },
]);
</script>