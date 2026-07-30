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
        <textarea
          v-model="note"
          rows="3"
          class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
          :class="variant === 'reject' ? 'focus:ring-red-500' : 'focus:ring-primary'"
          :placeholder="notePlaceholder"
        />
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
            :disabled="disabled"
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
  notePlaceholder?: string;
  confirmLabel?: string;
  saving?: boolean;
  requireNote?: boolean;
  minNoteLength?: number;
}>(), {
  variant: 'approve',
  title: '',
  description: '',
  notePlaceholder: 'Keterangan opsional',
  confirmLabel: 'Setuju',
  saving: false,
  requireNote: false,
  minNoteLength: 0,
});

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

// Reset note saat modal dibuka
watch(() => props.modelValue, (val) => {
  if (val) note.value = '';
});

const disabled = computed(() => {
  if (props.saving) return true;
  if (props.requireNote && !note.value.trim()) return true;
  if (props.minNoteLength > 0 && note.value.trim().length < props.minNoteLength) return true;
  return false;
});

const handleConfirm = () => {
  emit('confirm', note.value);
};

const handleCancel = () => {
  emit('cancel');
  isOpen.value = false;
};
</script>