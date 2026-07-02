<template>
  <span
    class="px-2.5 py-0.5 text-xs rounded-full font-medium inline-flex items-center gap-1 w-fit"
    :class="colorClass"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    active?: boolean;
    status?: string;
  }>(),
  { active: true }
);

const isActive = computed(() => {
  if (typeof props.status === 'string') {
    return props.status.toLowerCase() === 'aktif' || props.status.toLowerCase() === 'active';
  }
  return props.active;
});

const colorClass = computed(() =>
  isActive.value
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
);

const dotClass = computed(() =>
  isActive.value ? 'bg-emerald-500' : 'bg-gray-400'
);

const label = computed(() => (isActive.value ? 'Aktif' : 'Nonaktif'));
</script>