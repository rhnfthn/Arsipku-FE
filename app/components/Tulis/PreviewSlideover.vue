<template>
  <USlideover v-model:open="internalIsOpen" title="Pratinjau" side="bottom" :dismissible="!alertIsOpen" :ui="{
    content: 'h-screen max-h-screen',
    body: 'p-0',
    footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
    wrapper: 'z-50'
  }">
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
        <UButton
          v-if="showSaveDraft && (hasPermission('naskah-dinas', 'create'))"
          label="Draft"
          color="neutral"
          variant="outline"
          size="lg"
          icon="i-heroicons-document-text"
          class="px-8"
          @click="emit('save-draft')"
        />
        <UButton
          v-if="hasPermission('naskah-dinas', 'create')"
          label="Kirim"
          color="primary"
          size="lg"
          icon="i-heroicons-paper-airplane"
          class="px-8 font-bold"
          @click="emit('send')"
        />
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const { hasPermission } = useAuth();

// --- PROPS ---
const props = withDefaults(defineProps<{
  open: boolean;
  pdfUrl: string | null;
  alertIsOpen?: boolean;
  showSaveDraft?: boolean;
}>(), {
  showSaveDraft: true
});

// --- EMITS ---
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'save-draft'): void;
  (e: 'send'): void;
}>();

// --- STATE SYNC ---
const internalIsOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
});
</script>
