<template>
  <div class="flex flex-col items-center justify-center py-12 text-center">
    <div
      v-if="icon"
      class="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
      :class="iconWrapperClass"
    >
      <component :is="icon" class="h-8 w-8" :class="iconClass" />
    </div>
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400"
    >
      {{ description }}
    </p>
    <UButton
      v-if="actionLabel"
      class="mt-4"
      :color="actionColor"
      :variant="actionVariant"
      :to="actionTo"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: any;
  title: string;
  description?: string;
  iconWrapperClass?: string;
  iconClass?: string;
  actionLabel?: string;
  actionTo?: string;
  actionColor?: string;
  actionVariant?: string;
}>();

defineEmits<{
  (e: "action"): void;
}>();
</script>
