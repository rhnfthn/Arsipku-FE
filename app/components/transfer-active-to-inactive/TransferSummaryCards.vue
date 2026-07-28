<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div
      v-for="card in cards"
      :key="card.key"
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
    >
      <div class="flex items-center justify-between">
        <p class="text-xs text-gray-500 dark:text-gray-400">{{ card.label }}</p>
        <UIcon :name="card.icon" class="w-5 h-5" :class="card.color" />
      </div>
      <p class="text-2xl font-bold mt-2" :class="card.color">{{ card.value }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TransferSummary } from '~/types/transfer-active-to-inactive';

const props = defineProps<{ summary: TransferSummary | null }>();

const cards = computed(() => [
  {
    key: 'total',
    label: 'Total Usulan',
    value: props.summary?.total ?? 0,
    color: 'text-gray-700 dark:text-white',
    icon: 'i-lucide-files',
  },
  {
    key: 'menunggu',
    label: 'Menunggu Verifikasi',
    value: props.summary?.menungguVerifikasi ?? 0,
    color: 'text-yellow-600 dark:text-yellow-400',
    icon: 'i-lucide-clock',
  },
  {
    key: 'disetujui',
    label: 'Disetujui',
    value: props.summary?.disetujui ?? 0,
    color: 'text-[#457fb6]',
    icon: 'i-lucide-check-circle',
  },
  {
    key: 'selesai',
    label: 'Selesai',
    value: props.summary?.selesai ?? 0,
    color: 'text-green-600 dark:text-green-400',
    icon: 'i-lucide-check-check',
  },
]);
</script>