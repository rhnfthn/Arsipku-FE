<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-9999 flex items-center justify-center p-4"
        @click.self="handleCancel"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Dialog -->
        <div
          class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md transform transition-all border border-gray-100 dark:border-gray-700 overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          <!-- Icon Header -->
          <div class="flex justify-center pt-6 pb-3">
            <div
              class="w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200"
              :class="iconClasses"
            >
              <component :is="iconComponent" :size="28" :class="iconColorClass" />
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 text-center pb-4">
            <h3 class="text-base font-bold text-gray-900 dark:text-white mb-2 leading-snug">
              {{ title }}
            </h3>
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {{ message }}
            </p>
          </div>

          <!-- KETIK ULANG VALIDATION (hanya tampil jika requireConfirmation = true) -->
          <div v-if="requireConfirmation" class="px-6 pb-5">
            <div class="bg-gray-50 dark:bg-gray-700/60 rounded-xl p-3.5 border border-gray-200 dark:border-gray-600">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 text-left">
                Ketik <span class="font-bold text-red-600 dark:text-red-400 select-all">"{{ confirmationText }}"</span> untuk konfirmasi:
              </label>

              <!-- Input text box -->
              <input
                v-model="inputConfirmText"
                type="text"
                :placeholder="confirmationText"
                autocomplete="off"
                spellcheck="false"
                class="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all font-medium"
                :class="
                  isConfirmed
                    ? 'border-green-500 focus:ring-green-400/30'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-red-400/30 focus:border-red-500'
                "
                @keyup.enter="handleEnterKey"
              />

              <div class="flex items-center justify-between mt-2 text-[11px]">
                <span class="text-gray-500 dark:text-gray-400">
                  Status:
                </span>
                <span v-if="isConfirmed" class="text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                  ✓ Teks cocok, tombol hapus aktif
                </span>
                <span v-else class="text-gray-400 dark:text-gray-500">
                  Teks belum sesuai
                </span>
              </div>
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="flex items-center gap-3 px-6 pb-6 pt-1 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
            <button
              v-if="!isAlert"
              @click="handleCancel"
              :disabled="isLoading"
              class="flex-1 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {{ cancelText }}
            </button>

            <button
              @click="handleConfirm"
              :disabled="isLoading || !isConfirmEnabled"
              class="flex-1 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              :class="buttonConfirmClass"
            >
              <span v-if="isLoading" class="inline-flex items-center gap-1.5 justify-center">
                <svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" class="opacity-75" />
                </svg>
                {{ loadingText }}
              </span>
              <span v-else>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import {
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  AlertTriangle,
} from "lucide-vue-next";

const props = defineProps({
  isAlert: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "info",
    validator: (value) =>
      ["info", "success", "warning", "danger", "question"].includes(value),
  },
  title: {
    type: String,
    default: "Are you sure?",
  },
  message: {
    type: String,
    default: "This action cannot be undone.",
  },
  confirmText: {
    type: String,
    default: "Confirm",
  },
  cancelText: {
    type: String,
    default: "Cancel",
  },
  loadingText: {
    type: String,
    default: "Processing...",
  },
  confirmColor: {
    type: String,
    default: "primary",
  },
  color: {
    type: String,
    default: "primary",
  },
  variant: {
    type: String,
    default: "filled",
  },
  cancelColor: {
    type: String,
    default: "primary",
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  // Opsi validasi ketik ulang
  requireConfirmation: {
    type: Boolean,
    default: false,
  },
  confirmationText: {
    type: String,
    default: "KONFIRMASI HAPUS DATA",
  },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

const inputConfirmText = ref("");

// Reset input text saat popup dibuka / ditutup
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      inputConfirmText.value = "";
    }
  }
);

// Cek apakah ketik ulang sudah cocok (case insensitive/trimmed)
const isConfirmed = computed(() => {
  if (!props.requireConfirmation) return true;
  return (
    inputConfirmText.value.trim().toLowerCase() ===
    props.confirmationText.trim().toLowerCase()
  );
});

// Status tombol confirm
const isConfirmEnabled = computed(() => {
  if (props.requireConfirmation) {
    return isConfirmed.value;
  }
  return true;
});

// Enter key submit
const handleEnterKey = () => {
  if (isConfirmEnabled.value && !props.isLoading) {
    handleConfirm();
  }
};

// Icon mapping
const iconComponent = computed(() => {
  const icons = {
    danger: Trash2,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
    question: HelpCircle,
  };
  return icons[props.type] || Info;
});

// Icon background classes
const iconClasses = computed(() => {
  const classes = {
    danger: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    success: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    question: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  };
  return classes[props.type] || classes.info;
});

const iconColorClass = computed(() => {
  if (props.type === "danger") return "text-red-600 dark:text-red-400";
  if (props.type === "warning") return "text-yellow-600 dark:text-yellow-400";
  if (props.type === "success") return "text-green-600 dark:text-green-400";
  return "text-blue-600 dark:text-blue-400";
});

// Tombol confirm style
const buttonConfirmClass = computed(() => {
  if (props.type === "danger") {
    return "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-red-500/20";
  }
  return "bg-primary hover:bg-primary-700 active:bg-primary-800 text-white shadow-primary/20";
});

const handleConfirm = () => {
  if (!props.isLoading && isConfirmEnabled.value) {
    emit("confirm");
  }
};

const handleCancel = () => {
  if (!props.isLoading) {
    emit("cancel");
    emit("update:modelValue", false);
  }
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

.fade-enter-active .relative,
.fade-leave-active .relative {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.fade-enter-from .relative,
.fade-leave-to .relative {
  transform: scale(0.95);
  opacity: 0;
}
</style>
