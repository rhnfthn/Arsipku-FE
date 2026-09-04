<template>
  <UCard
    variant="soft"
    :ui="{
      root: 'rounded-xl ring-0 shadow-sm bg-white dark:bg-gray-800 transition-colors',
      body: 'p-4 sm:p-5',
    }"
  >
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div class="sm:w-40 shrink-0">
        <p class="text-sm font-semibold text-gray-900 dark:text-white">Template</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">Pilih format dokumen</p>
      </div>
      <USelectMenu
        :model-value="modelValue"
        :items="items"
        value-key="value"
        label-key="label"
        :disabled="disabled"
        class="w-full"
        placeholder="Pilih template"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    </div>
    <p v-if="disabled" class="mt-2 text-xs text-amber-600 dark:text-amber-400 sm:ml-40">
      Template terkunci karena proses persetujuan sudah dimulai.
    </p>
  </UCard>
</template>

<script setup lang="ts">
export type TemplateDireksi = 'blanko_verbal' | 'lembar_persetujuan_direksi';

defineProps<{
  modelValue: TemplateDireksi;
  disabled?: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', value: TemplateDireksi): void;
}>();

const items: { label: string; value: TemplateDireksi }[] = [
  { label: 'Blanko Verbal', value: 'blanko_verbal' },
  { label: 'Lembar Persetujuan Direksi', value: 'lembar_persetujuan_direksi' },
];
</script>
