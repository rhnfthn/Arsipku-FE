<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 overflow-hidden">
    <div class="flex border-b border-gray-200 dark:border-gray-700">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        @click="$emit('update:modelValue', tab.value)"
        :class="[
          'px-5 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2',
          modelValue === tab.value
            ? 'border-[#457fb6] text-[#457fb6] bg-[#457fb6]/5'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
        ]"
      >
        <UIcon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JenisUsulan } from '~/types/verifikasi-usulan';

defineProps<{ modelValue: JenisUsulan | '' }>();
defineEmits<{ 'update:modelValue': [v: JenisUsulan | ''] }>();

const tabs: { value: JenisUsulan | ''; label: string; icon: string }[] = [
  { value: '', label: 'Semua', icon: 'i-lucide-layers' },
  { value: 'inaktif', label: 'Arsip Inaktif', icon: 'i-lucide-folder-archive' },
  { value: 'aktif_ke_inaktif', label: 'Aktif ke Inaktif', icon: 'i-lucide-file-up' },
];
</script>