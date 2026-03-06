<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
  >
    <!-- Hanya modal yang dianimasikan -->
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="relative bg-white dark:bg-gray-800 rounded-2xl p-1 flex flex-col"
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
            @click="$emit('update:modelValue', false)"
            class="mt-5 mr-5 text-gray-500 hover:text-gray-800 flex-shrink-0"
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
          class="flex justify-between border-t border-gray-300 flex-shrink-0 gap-3 px-5 py-2"
        >
          <button
            @click="$emit('update:modelValue', false)"
            class="flex-1 px-5 py-2 mt-2 text-sm border border-primary-500 hover:bg-primary-100 text-primary rounded-md"
          >
            Batal
          </button>

          <button
            @click="$emit('save')"
            class="flex-1 px-5 py-2 mt-2 text-sm bg-primary hover:bg-primary-800 text-white rounded-md"
          >
            Simpan
          </button>
        </div>

        <!-- CUSTOM FOOTER SLOT -->
        <slot name="footer" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import Heading from '~/components/Heading.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },

  hideDefaultFooter: {
    type: Boolean,
    default: false
  },

  /**
   * size:
   * - sm | md | lg | xl | full
   * - atau custom tailwind class (ex: "w-[900px]")
   */
  size: {
    type: String,
    default: 'md'
  }
})

defineEmits(['update:modelValue', 'save'])

const modalSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-[360px] max-h-[90vh]'
    case 'md':
      return 'w-[480px] max-h-[90vh]'
    case 'lg':
      return 'w-[570px] max-h-[90vh]'
    case 'xl':
      return 'w-[630px] max-w-[90vw] max-h-[90vh]'
    case 'full':
      return 'w-[95vw] max-w-none max-h-[90vh]'
    default:
      return props.size
  }
})
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
