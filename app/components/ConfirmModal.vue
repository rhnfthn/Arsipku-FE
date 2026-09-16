<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="modelValue" class="fixed inset-0 z-[var(--z-confirm)] flex items-center justify-center p-4"
        @click.self="onCancel">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" @click="onCancel"></div>
        <div
          class="relative bg-white dark:bg-gray-900 rounded-[var(--radius-modal)] shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-800"
          :class="contentClass">
          <div class="p-5 text-center">
            <div class="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              :class="iconBgClass">
              <UIcon :name="iconName" class="w-6 h-6" :class="iconColorClass" />
            </div>
            <h3 class="text-lg font-bold mb-2 text-gray-900 dark:text-white">{{ title }}</h3>
            <div class="text-sm text-gray-500 mb-6">
              <slot name="description">{{ description }}</slot>
            </div>
            <div class="flex gap-3">
              <UButton color="neutral" variant="outline" size="lg" class="flex-1 justify-center" :disabled="loading" @click="onCancel">
                {{ cancelText }}
              </UButton>
              <UButton :color="confirmColor" size="lg" class="flex-1 justify-center" :loading="loading" :disabled="loading" @click="onConfirm">
                {{ loading ? loadingText : confirmText }}
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loadingText?: string;
  loading?: boolean;
  variant?: 'danger' | 'warning' | 'primary';
  backdrop?: boolean;
}>(), {
  confirmText: 'Konfirmasi',
  cancelText: 'Batal',
  loadingText: 'Memproses...',
  loading: false,
  variant: 'primary',
  backdrop: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const variantConfig = computed(() => {
  switch (props.variant) {
    case 'danger':
      return {
        icon: 'i-heroicons-trash',
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        confirmColor: 'error',
      };
    case 'warning':
      return {
        icon: 'i-heroicons-exclamation-triangle',
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        confirmColor: 'warning',
      };
    default:
      return {
        icon: 'i-heroicons-check-circle',
        iconBg: 'bg-primary-100 dark:bg-primary-900/30',
        iconColor: 'text-primary-600 dark:text-primary-400',
        confirmColor: 'primary',
      };
  }
});

const iconName = computed(() => variantConfig.value.icon);
const iconBgClass = computed(() => variantConfig.value.iconBg);
const iconColorClass = computed(() => variantConfig.value.iconColor);
const confirmColor = computed(() => variantConfig.value.confirmColor as any);

const contentClass = computed(() => 'animate-in zoom-in-95 duration-200');

const onConfirm = () => emit('confirm');
const onCancel = () => {
  emit('cancel');
  emit('update:modelValue', false);
};
</script>
