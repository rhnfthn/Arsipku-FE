<template>
  <span
    class="px-3 py-1 text-xs rounded-full font-medium inline-flex items-center gap-1 w-fit"
    :class="colorClass"
  >
    <UIcon name="i-lucide-shield" class="w-3 h-3" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    role: string;
    showLabel?: boolean;
  }>(),
  { showLabel: true }
);

const colorMap: Record<string, string> = {
  SUPERADMIN:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  USER: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const labelMap: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Admin',
  USER: 'User',
};

const colorClass = computed(
  () => colorMap[props.role?.toUpperCase()] || colorMap.USER
);
const label = computed(
  () => labelMap[props.role?.toUpperCase()] || props.role
);
</script>