<template>
  <Teleport to="body">
    <Modal v-model="isOpen" :hideDefaultFooter="true" size="lg">
      <template #title>
        <Heading
          variant="heading9b"
          class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white"
          :class="variant === 'reject' ? 'text-red-600 dark:text-red-400' : 'text-gray-900'"
        >
          {{ title }}
        </Heading>
      </template>
      <div class="px-6 pb-6 space-y-4">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {{ description }}
        </p>
        <!-- Banner warning (untuk tolak yang bersifat terminal/closed) -->
        <div
          v-if="warning"
          class="flex items-start gap-2.5 rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-900/40 dark:bg-warning-900/20 dark:text-warning-300"
        >
          <UIcon name="i-lucide-alert-triangle" class="mt-0.5 size-4 shrink-0" />
          <span>{{ warning }}</span>
        </div>
        <textarea
          v-if="!showCatatanKeSE"
          v-model="note"
          rows="3"
          class="w-full border bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
          :class="errors.note ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
          :placeholder="notePlaceholder"
        />
        <p v-if="errors.note" class="text-xs text-red-500">{{ errors.note }}</p>
        <!-- Catatan ke SE (opsional, untuk verifikator → SE terkait) -->
        <div v-if="showCatatanKeSE" class="mt-0">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Catatan ke SE {{ catatanKeSELabel }}
            <span class="text-xs font-normal text-gray-400">(wajib, hanya terlihat oleh SE {{ catatanKeSELabel }})</span>
          </label>
          <textarea
            v-model="catatanKeSE"
            rows="3"
            class="w-full border bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
            :class="errors.catatanKeSE ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'"
            :placeholder="`Catatan untuk SE ${catatanKeSELabel}...`"
          />
          <p v-if="errors.catatanKeSE" class="text-xs text-red-500 mt-1">{{ errors.catatanKeSE }}</p>
        </div>
        <div class="flex gap-3 pt-2">
          <button
            class="flex-1 px-6 py-2 text-sm font-medium border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-900 dark:text-white"
            @click="handleCancel"
          >
            Batal
          </button>
          <button
            class="flex-1 px-6 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50"
            :class="variant === 'reject'
              ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
              : 'hover:opacity-90 dark:hover:opacity-90'"
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
import { ref, computed, watch } from 'vue';
import Modal from '~/components/Modal.vue';
import Heading from '~/components/Heading.vue';

const props = withDefaults(defineProps<{
  modelValue: boolean;
  variant?: 'approve' | 'reject';
  title?: string;
  description?: string;
  warning?: string;
  notePlaceholder?: string;
  confirmLabel?: string;
  saving?: boolean;
  requireNote?: boolean;
  minNoteLength?: number;
  showCatatanKeSE?: boolean;
  catatanKeSELabel?: string; // 'Pengusul' atau 'Pemberi'
}>(), {
  variant: 'approve',
  title: '',
  description: '',
  warning: '',
  notePlaceholder: 'Keterangan opsional',
  confirmLabel: 'Setuju',
  saving: false,
  requireNote: false,
  minNoteLength: 0,
  showCatatanKeSE: false,
  catatanKeSELabel: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [note: string, catatanKeSE?: string];
  cancel: [];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const note = ref('');
const catatanKeSE = ref('');
const errors = ref<Record<string, string>>({});
const triedSubmit = ref(false);

// Reset note saat modal dibuka
watch(() => props.modelValue, (val) => {
  if (val) {
    note.value = '';
    catatanKeSE.value = '';
    errors.value = {};
    triedSubmit.value = false;
  }
});

// Clear error saat user mengetik
watch(note, () => { if (errors.value.note) delete errors.value.note; });
watch(catatanKeSE, () => { if (errors.value.catatanKeSE) delete errors.value.catatanKeSE; });

const validate = (): boolean => {
  const e: Record<string, string> = {};
  if (props.showCatatanKeSE) {
    if (props.requireNote && !catatanKeSE.value.trim()) e.catatanKeSE = 'Catatan wajib diisi';
    if (props.minNoteLength > 0 && catatanKeSE.value.trim().length < props.minNoteLength) e.catatanKeSE = `Minimal ${props.minNoteLength} karakter`;
  } else {
    if (props.requireNote && !note.value.trim()) e.note = 'Catatan wajib diisi';
    if (props.minNoteLength > 0 && note.value.trim().length < props.minNoteLength) e.note = `Minimal ${props.minNoteLength} karakter`;
  }
  errors.value = e;
  return Object.keys(e).length === 0;
};

const handleConfirm = () => {
  triedSubmit.value = true;
  if (!validate()) return;
  // Saat showCatatanKeSE, catatanKeSE adalah catatan utama (tidak ada textarea note)
  if (props.showCatatanKeSE) {
    emit('confirm', catatanKeSE.value, catatanKeSE.value || undefined);
  } else {
    emit('confirm', note.value, catatanKeSE.value || undefined);
  }
};

const handleCancel = () => {
  emit('cancel');
  isOpen.value = false;
};
</script>