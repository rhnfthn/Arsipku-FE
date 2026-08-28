<template>
  <div class="mt-4">
    <h4 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Preview Data Penerima</h4>
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="whitespace-nowrap border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">No</th>
            <th v-for="column in columns" :key="column" class="whitespace-nowrap border-b border-gray-200 px-3 py-2 text-left font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ column }}</th>
            <th class="border-b border-gray-200 px-3 py-2 text-center font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.no" class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50" :class="{ 'bg-red-50 dark:bg-red-950/20': !item.isValid }">
            <td class="border-b border-gray-100 px-3 py-2 text-gray-500 dark:border-gray-700 dark:text-gray-400">{{ item.no }}</td>
            <td v-for="column in columns" :key="`${item.no}-${column}`" class="max-w-64 border-b border-gray-100 px-3 py-2 text-gray-700 dark:border-gray-700 dark:text-gray-300" :class="{ 'font-medium text-gray-900 dark:text-white': column === 'perihal' }">
              {{ getValue(item, column) || '-' }}
            </td>
            <td class="border-b border-gray-100 px-3 py-2 text-center dark:border-gray-700">
              <span v-if="item.isValid" class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300"><UIcon name="i-lucide-check-circle" class="size-3" />Valid</span>
              <span v-else class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300" :title="item.validationMessage"><UIcon name="i-lucide-x-circle" class="size-3" />Invalid</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SdeMasalPenerima } from '~/types/sde-masal';

defineProps<{
  items: SdeMasalPenerima[];
  columns: string[];
}>();

const getValue = (item: SdeMasalPenerima, column: string) => {
  if (column === 'perihal') return item.perihal || '';
  if (column === 'tertuju') return item.tertuju || item.idTertuju || '';
  if (column === 'tembusan') return item.tembusan || item.variables?.tembusan || '';
  return item.variables?.[column.toLowerCase()] || '';
};
</script>
