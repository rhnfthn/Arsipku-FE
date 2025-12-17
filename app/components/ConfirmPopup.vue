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
          class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all"
          role="dialog"
          aria-modal="true"
        >
          <!-- Icon -->
          <div class="flex justify-center pt-6 pb-4">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center"
              :class="iconClasses"
            >
              <component
                :is="iconComponent"
                :size="32"
                :class="iconColorClass"
              />
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 text-center pb-6">
            <h3
              class="text-lg font-semibold text-neutral-90 dark:text-white mb-2"
            >
              {{ title }}
            </h3>
            <p class="text-sm text-neutral-60 dark:text-neutral-40">
              {{ message }}
            </p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 px-6 pb-6">
            <button
              @click="handleConfirm"
              :disabled="isLoading"
              class="flex-1 px-4 py-2 rounded-md text-white bg-primary hover:bg-primary-700 disabled:opacity-50"
            >
              {{ isLoading ? loadingText : confirmText }}
            </button>

            <button
              @click="handleCancel"
              :disabled="isLoading"
              class="flex-1 px-4 py-2 rounded-md border border-primary text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              {{ cancelText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";
import {
  Trash2,
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  AlertTriangle,
} from "lucide-vue-next";

const props = defineProps({
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
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

// Icon mapping berdasarkan type
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

// Background color untuk icon
const iconClasses = computed(() => {
  const classes = {
    danger: "bg-red-100",
    warning: "bg-yellow-100",
    success: "bg-green-100",
    info: "bg-blue-100",
    question: "bg-blue-100",
  };
  return classes[props.type] || classes.info;
});

const colorClass = computed(() => {
  const base = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    error: "bg-red-600 text-white hover:bg-red-700",
  };

  const outline = {
    primary: "border border-primary text-primary hover:bg-primary/10",
    error: "border border-red-600 text-red-600 hover:bg-red-50",
  };

  if (props.variant === "outlined") {
    return outline[props.color] || outline.primary;
  }

  return base[props.color] || base.primary;
});

// Confirm button color
const confirmButtonColor = computed(() => {
  if (props.type === "danger") return "error";
  return props.confirmColor;
});

const handleConfirm = () => {
  if (!props.isLoading) {
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
