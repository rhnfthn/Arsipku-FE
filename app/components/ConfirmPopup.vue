<template>
  <!-- Overlay -->
  <Transition name="fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <!-- Modal -->
      <Transition name="zoom">
        <div
          v-if="modelValue"
          class="bg-white w-100 p-10 rounded-xl shadow-lg text-center"
        >
          <Heading variant="heading9sb" class="font-semibold mb-3">
            {{ title }}
          </Heading>

          <Heading variant="body2" class="text-sm text-gray-500 mb-7">
            {{ description }}
          </Heading>

          <div class="flex justify-center gap-3">
            <button
              @click="$emit('update:modelValue', false)"
              class="px-4 py-2 text-xs border border-primary text-primary rounded-md"
            >
              {{ cancelText }}
            </button>

            <button
              @click="$emit('confirm')"
              class="px-4 py-2 text-xs bg-red-500 text-white rounded-md"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import Heading from "./Heading.vue";

defineProps({
  modelValue: Boolean,
  title: String,
  description: String,
  confirmText: { type: String, default: "OK" },
  cancelText: { type: String, default: "Cancel" },
});

defineEmits(["update:modelValue", "confirm"]);
</script>

<style scoped>
/* Fade untuk overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* Zoom-in hanya modal */
.zoom-enter-active,
.zoom-leave-active {
  transition:
    transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.2s ease;
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.zoom-enter-to,
.zoom-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
