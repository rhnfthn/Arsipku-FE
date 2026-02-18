<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="state.isOpen"
        class="fixed inset-0 z-[100000] flex items-center justify-center p-4 pointer-events-auto"
        @mousedown.stop
        @click.stop
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
          @click.stop.prevent="!state.isLoading && onCancel()"
        ></div>

        <div
          class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all p-6 text-center z-[100001] pointer-events-auto"
          @click.stop
        >
          <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            {{ state.title }}
          </h3>
          <p
            class="text-sm text-gray-500 dark:text-gray-400 mb-6"
            v-html="state.message"
          ></p>

          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex-1 px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-700 font-medium cursor-pointer active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              :disabled="state.isLoading"
              @click.stop.prevent="onConfirm"
            >
              <svg
                v-if="state.isLoading"
                class="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>

              <span>{{ state.confirmText }}</span>
            </button>

            <button
              v-if="!state.isAlert"
              type="button"
              class="flex-1 px-4 py-2 rounded-md border border-gray-300 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 font-medium cursor-pointer active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="state.isLoading"
              @click.stop.prevent="onCancel"
            >
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
  // KASUS 1: Jika ini hanya Warning/Alert Biasa (Tombol OK)
  if (state.isAlert) {
    if (state.resolve) state.resolve(true);
    state.isOpen = false; // Langsung tutup, tidak ada loading
    return;
  }

  // KASUS 2: Jika ini Confirm Dialog
  state.isLoading = true; // Nyalakan animasi loading
  if (state.resolve) state.resolve(true);
  // state.isOpen TIDAK di-set false disini.
  // Modal tetap terbuka dengan spinner berputar sampai Anda manual menutupnya di parent.
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

button {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
</style>
