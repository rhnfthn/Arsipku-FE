<template>
  <USlideover v-model:open="internalIsOpen" title="Pratinjau" description="Pratinjau dokumen" side="bottom"
    :dismissible="!alertIsOpen" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
      wrapper: 'z-50'
    }">
    <template #body>
      <div class="h-full w-full overflow-auto bg-gray-100 dark:bg-gray-900">
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500">Memuat Pratinjau...</span>
          </div>
        </div>
        <div v-else-if="!file" class="flex items-center justify-center h-full">
          <span class="text-gray-500">Belum ada dokumen untuk dipratinjau.</span>
        </div>
        <div v-else ref="container" class="docx-preview-container"></div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-4 w-full">
        <UButton
          v-if="showSaveDraft && hasPermission('utama.tulis.naskah-lainnya', 'create-draft')"
          label="Draft"
          color="neutral"
          variant="outline"
          size="lg"
          icon="i-heroicons-document-text"
          class="px-8"
          @click="emit('save-draft')"
        />
        <UButton
          v-if="hasPermission('utama.tulis.naskah-lainnya', 'create-send')"
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
import { ref, watch, nextTick } from 'vue';
import { renderAsync } from 'docx-preview';

const { hasPermission } = useAuth();

const props = withDefaults(defineProps<{
  open: boolean;
  file: File | null;
  alertIsOpen?: boolean;
  showSaveDraft?: boolean;
}>(), {
  showSaveDraft: true,
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'save-draft'): void;
  (e: 'send'): void;
}>();

const internalIsOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

const container = ref<HTMLElement | null>(null);
const loading = ref(false);

watch(
  () => [props.open, props.file] as const,
  async ([open, file]) => {
    if (!open || !file) return;
    loading.value = true;
    await nextTick();
    try {
      const el = container.value;
      if (!el) return;
      el.innerHTML = '';
      await renderAsync(file, el, undefined, {
        className: 'docx',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        breakPages: true,
      });
    } catch {
      useToast().add({ title: 'Gagal merender pratinjau dokumen', color: 'error' });
    } finally {
      loading.value = false;
    }
  },
);
</script>

<style scoped>
:deep(.docx-preview-container) {
  padding: 16px;
}
:deep(.docx-wrapper) {
  background: #fff !important;
  padding: 0 !important;
}
:deep(.docx-wrapper > section.docx) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
  margin: 0 auto !important;
}
</style>
