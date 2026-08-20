<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  url: string;
  title: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const { t } = useI18n();

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-950"
    >
      <!-- Top Bar -->
      <div class="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <div class="flex items-center gap-2 min-w-0">
          <Icon name="i-lucide-file-text" class="w-4 h-4 text-primary-500 shrink-0" />
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ title }}</p>
        </div>
        <button
          @click="close"
          class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors shrink-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <!-- PDF Content -->
      <div class="flex-1 relative bg-gray-100 dark:bg-gray-900 min-h-0">
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center z-10">
          <div class="flex flex-col items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg">
            <Icon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ t('share_memuat_dokumen') }}</p>
          </div>
        </div>
        <iframe v-if="url" :key="url" :src="url" class="w-full h-full border-none" />
        <div v-else-if="!loading" class="flex items-center justify-center h-full text-gray-500 flex-col gap-2">
          <Icon name="i-lucide-file-text" class="w-12 h-12 opacity-30" />
          <span class="text-sm">{{ t('share_dokumen_error') }}</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
