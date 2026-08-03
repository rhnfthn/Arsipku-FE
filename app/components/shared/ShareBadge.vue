<script setup lang="ts">
defineProps<{
  status: 'AKTIF' | 'BERAKHIR';
  size?: 'xs' | 'sm' | 'md';
}>();
</script>

<template>
  <span
    v-if="status === 'AKTIF'"
    :class="[
      'inline-flex items-center whitespace-nowrap rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium',
      size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
    ]"
  >
    <UIcon name="i-lucide-check-circle" class="w-3 h-3 mr-0.5" />
    Aktif
  </span>
  <span
    v-else
    :class="[
      'inline-flex items-center whitespace-nowrap rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-medium',
      size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
    ]"
  >
    <UIcon name="i-lucide-x-circle" class="w-3 h-3 mr-0.5" />
    Berakhir
  </span>
</template>
