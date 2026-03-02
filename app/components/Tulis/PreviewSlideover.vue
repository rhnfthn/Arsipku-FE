<template>
  <USlideover
    v-model="isSlideoverOpen"
    title="Pratinjau"
    side="bottom"
    :dismissible="dismissible"
    :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800'
    }"
  >
    <template #body>
      <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full rounded-lg shadow-lg border border-gray-200" />
        <div v-else class="flex flex-col items-center gap-2">
          <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
          <span class="text-gray-500">Memuat Pratinjau...</span>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-4 w-full">
        <UButton label="Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text" class="px-8"
          @click="$emit('draft')" />
        <UButton label="Kirim" color="primary" size="lg" icon="i-heroicons-paper-airplane" class="px-8 font-bold"
          @click="$emit('kirim')" />
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  open: boolean;
  pdfUrl: string;
  dismissible?: boolean;
}>();

const emit = defineEmits(['update:open', 'draft', 'kirim']);

// Ini adalah "Jembatan Sakti" (Proxy) agar Nuxt UI mengerti perubahan state dari Parent
const isSlideoverOpen = computed({
  get() {
    return props.open; // Mengambil nilai dari parent
  },
  set(newValue) {
    emit('update:open', newValue); // Mengirim nilai balik ke parent jika di-close
  }
});
</script>
