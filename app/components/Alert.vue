<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="state.isOpen" class="fixed inset-0 z-[100000] flex items-center justify-center p-4 pointer-events-auto"
        @mousedown.stop @click.stop>

        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto" @click.stop.prevent="onCancel">
        </div>

        <div
          class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all p-6 text-center z-[100001] pointer-events-auto"
          @click.stop>
          <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{{ state.title }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6" v-html="state.message"></p>

          <div class="flex items-center gap-3">
            <button type="button"
              class="flex-1 px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-700 font-medium cursor-pointer active:scale-95 transition-transform"
              @click.stop.prevent="onConfirm">
              {{ state.confirmText }}
            </button>

            <button v-if="!state.isAlert" type="button"
              class="flex-1 px-4 py-2 rounded-md border border-gray-300 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 font-medium cursor-pointer active:scale-95 transition-transform"
              @click.stop.prevent="onCancel">
              {{ state.cancelText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useAlertState } from "@/composables/useAlert";

const state = useAlertState();

const onConfirm = () => {
  if (state.resolve) state.resolve(true);
  state.isOpen = false;
};

const onCancel = () => {
  if (state.resolve) state.resolve(false);
  state.isOpen = false;
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Memastikan cursor pointer muncul */
button {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
</style>
