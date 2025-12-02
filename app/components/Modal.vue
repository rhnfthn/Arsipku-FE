<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
  >
    <!-- Hanya modal yang dianimasikan -->
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="relative bg-white dark:bg-gray-900 rounded-2xl w-120 p-1"
      >
        <!-- Header -->
        <div class="flex justify-between mb-4 border-b border-gray-300">
          <slot name="title">
            <Heading
              variant="heading9b"
              class="font-semibold text-sm mb-3 mt-5 ml-5"
            >
              Judul Modal
            </Heading>
          </slot>

          <button @click="$emit('update:modelValue', false)">
            <X class="w-4 h-4 mr-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="flex flex-col gap-5 ml-5 mr-5">
          <slot />
        </div>

        <!-- Footer -->
        <div class="flex justify-end border-t border-gray-300 mt-7 mb-5 gap-3">
          <button
            @click="$emit('update:modelValue', false)"
            class="px-5 py-2 mt-2 text-xs border border-primary-500 hover:bg-primary-100 text-primary rounded-md"
          >
            Batal
          </button>

          <button
            @click="$emit('save')"
            class="px-5 py-2 mr-5 mt-2 text-xs bg-primary hover:bg-primary-800 text-white rounded-md"
          >
            Simpan
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { X } from "lucide-vue-next";
import Heading from "~/components/Heading.vue";

defineProps({ modelValue: Boolean });
defineEmits(["update:modelValue", "save"]);
</script>

<style scoped>
/* Animasi modal (zoom-in only) */
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
