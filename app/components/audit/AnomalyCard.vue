<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div
      v-for="card in cards"
      :key="card.key"
      class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ card.label }}</p>
          <p class="text-2xl font-bold mt-1" :class="card.color">{{ card.value }}</p>
        </div>
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center"
          :class="card.bg"
        >
          <UIcon :name="card.icon" class="w-5 h-5" :class="card.color" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AnomalySummary } from '~/types/audit';

const props = defineProps<{
  summary: AnomalySummary | null;
}>();

const cards = computed(() => [
  {
    key: 'total',
    label: 'Total Alert',
    value: props.summary?.total ?? 0,
    icon: 'i-lucide-bell',
    color: 'text-gray-700 dark:text-white',
    bg: 'bg-gray-100 dark:bg-gray-700',
  },
  {
    key: 'new',
    label: 'Belum Ditinjau',
    value: props.summary?.new ?? 0,
    icon: 'i-lucide-alert-circle',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  {
    key: 'reviewing',
    label: 'Sedang Ditinjau',
    value: props.summary?.reviewing ?? 0,
    icon: 'i-lucide-eye',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    key: 'resolved',
    label: 'Selesai',
    value: (props.summary?.resolved ?? 0) + (props.summary?.ignored ?? 0),
    icon: 'i-lucide-check-circle',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
]);
</script>