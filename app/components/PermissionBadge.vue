<template>
  <span
    class="px-2 py-0.5 text-xs rounded font-mono font-medium inline-flex items-center"
    :class="colorClass"
  >
    {{ action }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ action: string }>();

const actionColorMap: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  read: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  update: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  verify: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  approve: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'assign-permission': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'assign-role': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
};

const colorClass = computed(
  () =>
    actionColorMap[props.action?.toLowerCase()] ||
    'bg-primary/10 text-primary dark:text-primary-400'
);
</script>