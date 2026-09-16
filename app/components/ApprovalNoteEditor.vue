<template>
  <Teleport to="body">
    <Modal v-model="isOpen" :hideDefaultFooter="true" size="approval">
      <template #title>
        <div class="mt-4 mb-2 ml-2 flex min-w-0 items-center gap-2.5 sm:mt-5 sm:ml-5">
          <span
            class="flex size-9 shrink-0 items-center justify-center rounded-lg"
            :class="
              variant === 'reject'
                ? 'bg-red-50 dark:bg-red-900/30'
                : 'bg-primary-50 dark:bg-primary-900/40'
            "
          >
            <UIcon
              :name="variant === 'reject' ? 'i-lucide-x-circle' : 'i-lucide-check-circle-2'"
              class="size-5"
              :class="
                variant === 'reject'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-primary-600 dark:text-primary-400'
              "
            />
          </span>
          <Heading
            variant="heading9b"
            class="min-w-0 break-words pr-2 text-sm font-bold dark:text-white"
            :class="variant === 'reject' ? 'text-red-600 dark:text-red-400' : 'text-gray-900'"
          >
            {{ title }}
          </Heading>
        </div>
      </template>

      <div class="mx-auto w-full min-w-0 space-y-3 px-0 pb-3 sm:px-3 sm:pb-5 lg:px-5">
        <p class="break-words text-sm text-gray-700 dark:text-gray-300">
          {{ description }}
        </p>

        <slot name="highlight" />

        <!-- Banner warning (untuk tolak yang bersifat terminal/closed) -->
        <div
          v-if="warning"
          class="flex items-start gap-2.5 rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-900/40 dark:bg-warning-900/20 dark:text-warning-300"
        >
          <UIcon name="i-lucide-alert-triangle" class="mt-0.5 size-4 shrink-0" />
          <span>{{ warning }}</span>
        </div>

        <!-- Catatan / alasan dengan TinyMCE editor -->
        <div class="approval-note-editor min-w-0">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ noteLabel }}
            <span v-if="requireNote" class="text-red-500">*</span>
            <span v-else class="text-xs font-normal text-gray-400">(opsional)</span>
          </label>
          <TinymceEditorAsync v-model="note" api-key="no-api-key" :init="editorInit" />
          <p v-if="errors.note" class="mt-1 text-xs text-red-500">{{ errors.note }}</p>
          <p v-else class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Mendukung format teks kaya: cetak tebal/miring, daftar bernomor (pasal-pasal), tabel,
            dan batang tubuh.
          </p>
        </div>

        <div
          class="sticky bottom-0 z-10 -mx-1 flex flex-col-reverse gap-2 border-t border-gray-200 bg-white/95 px-1 pt-3 pb-1 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/95 sm:flex-row sm:gap-3"
        >
          <button
            class="w-full flex-1 rounded-lg border border-gray-400 px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 sm:px-6"
            @click="handleCancel"
          >
            Batal
          </button>
          <button
            class="w-full flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 sm:px-6"
            :class="
              variant === 'reject'
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                : 'hover:opacity-90 dark:hover:opacity-90'
            "
            :style="variant === 'approve' ? 'background-color: #175FA4' : {}"
            :disabled="saving"
            @click="handleConfirm"
          >
            {{ saving ? 'Memproses...' : confirmLabel }}
          </button>
        </div>
      </div>
    </Modal>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import Modal from '~/components/Modal.vue';
import Heading from '~/components/Heading.vue';

const TinymceEditorAsync = defineAsyncComponent(
  () => import('~/components/TinymceEditorAsync.vue')
);

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    variant?: 'approve' | 'reject';
    title?: string;
    description?: string;
    warning?: string;
    noteLabel?: string;
    notePlaceholder?: string;
    confirmLabel?: string;
    saving?: boolean;
    requireNote?: boolean;
    minNoteLength?: number;
  }>(),
  {
    variant: 'approve',
    title: '',
    description: '',
    warning: '',
    noteLabel: 'Catatan / Alasan',
    notePlaceholder: 'Tulis catatan, alasan, atau batang tubuh...',
    confirmLabel: 'Setuju',
    saving: false,
    requireNote: false,
    minNoteLength: 0,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [note: string];
  cancel: [];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const note = ref('');
const errors = ref<Record<string, string>>({});

// Konfigurasi TinyMCE untuk catatan approval — mendukung pasal-pasal/batang tubuh.
// Modal semi-fullscreen memberi ruang vertikal lebih besar untuk editor.
const editorInit = {
  base_url: '/tinymce',
  suffix: '.min',
  min_height: 240,
  max_height: 520,
  menubar: false,
  promotion: false,
  branding: false,
  statusbar: false,
  placeholder: props.notePlaceholder,
  plugins: 'lists table',
  toolbar: 'bold italic underline strikethrough | bullist numlist | table | removeformat',
  toolbar_mode: 'sliding',
  invalid_elements: 'script,iframe,object,embed,form,input,style,link,meta',
  // Placeholder TinyMCE default left:1px — sejajarkan dengan padding body (12px)
  // agar tidak menempel di tepi kiri editor.
  content_style: `body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.5; padding: 8px 12px; margin: 0; color: #111827; } p { margin: 0 0 8px 0; } p:last-child { margin-bottom: 0; } ol { padding-left: 20px; } table { border-collapse: collapse; } td, th { border: 1px solid #d1d5db; padding: 4px 8px; } .mce-content-body[data-mce-placeholder]:not(.mce-visualblocks)::before { left: 12px !important; }`,
};

// Reset note saat modal dibuka
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      note.value = '';
      errors.value = {};
    }
  }
);

// Clear error saat user mengetik
watch(note, () => {
  if (errors.value.note) delete errors.value.note;
});

/** Ekstrak teks polos dari HTML untuk validasi panjang. */
const plainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();

const validate = (): boolean => {
  const e: Record<string, string> = {};
  const value = plainText(note.value);
  if (props.requireNote && !value) e.note = 'Catatan wajib diisi';
  if ((props.requireNote || value) && props.minNoteLength > 0 && value.length < props.minNoteLength)
    e.note = `Minimal ${props.minNoteLength} karakter`;
  errors.value = e;
  return Object.keys(e).length === 0;
};

const handleConfirm = () => {
  if (!validate()) return;
  emit('confirm', note.value);
};

const handleCancel = () => {
  emit('cancel');
  isOpen.value = false;
};
</script>

<style scoped>
.approval-note-editor :deep(.tox-tinymce) {
  height: clamp(240px, 48dvh, 520px) !important;
  max-width: 100%;
}

.approval-note-editor :deep(.tox-editor-header),
.approval-note-editor :deep(.tox-toolbar-overlord),
.approval-note-editor :deep(.tox-toolbar__primary) {
  max-width: 100%;
}

@media (max-height: 640px) {
  .approval-note-editor :deep(.tox-tinymce) {
    height: 240px !important;
  }
}
</style>
