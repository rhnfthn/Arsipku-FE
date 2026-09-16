<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 transition-opacity"
    >
      <!-- Hanya modal yang dianimasikan -->
      <Transition name="modal">
        <div
          v-if="modelValue"
          class="relative flex flex-col rounded-2xl bg-white p-1 dark:bg-gray-800"
          :class="modalSizeClass"
        >
          <!-- HEADER -->
          <div
            class="flex justify-between items-start border-b border-gray-300 dark:border-gray-400 flex-shrink-0 mb-3"
          >
            <slot name="title">
              <Heading variant="heading9b" class="font-semibold text-sm mb-3 mt-5 ml-5">
                Judul Modal
              </Heading>
            </slot>

            <button
              v-if="!hideCloseButton"
              @click="handleCancel"
              :disabled="props.saving"
              class="mt-5 mr-5 text-gray-500 hover:text-gray-800 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- BODY -->
          <div class="flex flex-col gap-5 ml-5 mr-5 overflow-y-auto flex-1 min-h-0">
            <slot />
          </div>

          <!-- DEFAULT FOOTER -->
          <div
            v-if="!hideDefaultFooter"
            class="flex justify-between border-t border-gray-300 flex-shrink-0 gap-3 px-5 py-2 mt-5"
          >
            <button
              @click="handleCancel"
              :disabled="props.saving"
              class="flex-1 px-5 py-2 mt-2 text-sm border border-primary-500 hover:bg-primary-100 text-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>

            <button
              @click="handleSave"
              :disabled="props.saving"
              class="flex-1 px-5 py-2 mt-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-md disabled:opacity-80 disabled:cursor-not-allowed"
            >
              <span v-if="props.saving" class="inline-flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="3"
                    class="opacity-25"
                  />
                  <path
                    d="M22 12a10 10 0 0 1-10 10"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    class="opacity-90"
                  />
                </svg>
                Menyimpan...
              </span>
              <span v-else>Simpan</span>
            </button>
          </div>

          <!-- CUSTOM FOOTER SLOT -->
          <slot name="footer" />
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { X } from 'lucide-vue-next';
import Heading from '~/components/Heading.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },

  hideDefaultFooter: {
    type: Boolean,
    default: false,
  },

  hideCloseButton: {
    type: Boolean,
    default: false,
  },

  saving: {
    type: Boolean,
    default: false,
  },

  /**
   * size:
   * - sm | md | lg | xl | approval | full
   * - atau custom tailwind class (ex: "w-[900px]")
   */
  size: {
    type: String,
    default: 'md',
  },
});

const emit = defineEmits(['update:modelValue', 'save']);

const handleCancel = () => {
  if (props.saving) return;
  emit('update:modelValue', false);
};

const handleSave = () => {
  if (props.saving) return;
  emit('save');
};

const modalSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-[360px] max-h-[90vh]';
    case 'md':
      return 'w-[480px] max-h-[90vh]';
    case 'lg':
      return 'w-[570px] max-h-[90vh]';
    case 'xl':
      return 'w-[700px] max-w-[90vw] max-h-[90vh]';
    case 'approval':
      return 'w-[calc(100vw-2rem)] max-w-5xl max-h-[calc(100dvh-2rem)] sm:w-[92vw] sm:max-h-[92dvh]';
    case 'full':
      return 'w-[95vw] max-w-none max-h-[90vh]';
    default:
      return props.size;
  }
});
</script>

<style scoped>
/* Zoom-in animation */
.modal-enter-active,
.modal-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
