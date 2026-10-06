<template>
  <div :class="compact ? 'w-full overflow-x-hidden' : 'overflow-x-auto'">
    <table :class="['border-collapse text-sm', compact ? 'w-full table-fixed' : 'min-w-full']">
      <thead :class="headerClass">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              compact ? 'px-2.5 py-2.5 text-xs font-semibold' : 'px-4 py-3 font-semibold',
              col.sortable
                ? 'cursor-pointer select-none hover:bg-primary-500 dark:hover:bg-primary-600'
                : '',
              col.headerClass || '',
            ]"
            @click="col.sortable && $emit('sort', col.key)"
          >
            <span class="inline-flex items-center gap-1 whitespace-nowrap">
              {{ col.label }}
              <UIcon
                v-if="col.sortable"
                name="i-lucide-arrow-up-down"
                class="w-3.5 h-3.5 transition-opacity"
                :class="sortKey === col.key ? 'opacity-100' : 'opacity-50'"
              />
            </span>
          </th>
        </tr>
      </thead>
      <tbody :class="bodyClass">
        <tr v-if="loading">
          <td :colspan="columns.length" class="px-4 py-6">
            <div class="space-y-4 animate-pulse">
              <div
                v-for="n in skeletonRows"
                :key="n"
                class="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-700"
              />
            </div>
          </td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td
            :colspan="columns.length"
            class="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
          >
            {{ emptyMessage }}
          </td>
        </tr>
        <tr
          v-else
          v-for="(row, idx) in rows"
          :key="row.id ?? row.persnum ?? idx"
          :class="[rowClass, rowClassesFn?.(row) ?? '', 'group relative']"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            :class="[compact ? 'px-2.5 py-2.5' : 'px-4 py-3', col.class || '']"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="idx">
              {{ row[col.key] }}
            </slot>
          </td>
          <!-- Floating actions slot (rendered inside the <tr>, positioned absolute) -->
          <td
            v-if="$slots['row-extra']"
            class="absolute right-0 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 rounded-md px-2 py-1.5 z-10 animate-in fade-in duration-200"
          >
            <slot name="row-extra" :row="row" :index="idx" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  class?: string;
  headerClass?: string;
}

withDefaults(
  defineProps<{
    columns: DataTableColumn[];
    rows: Record<string, any>[];
    loading?: boolean;
    skeletonRows?: number;
    emptyMessage?: string;
    sortKey?: string;
    sortDir?: 'asc' | 'desc';
    headerClass?: string;
    bodyClass?: string;
    rowClass?: string;
    /** Class dinamis per baris (mis. bold untuk data terbaru). */
    rowClassesFn?: (row: Record<string, any>) => string;
    /** Layout fixed dengan padding rapat; konten panjang wajib dibatasi oleh cell slot. */
    compact?: boolean;
  }>(),
  {
    loading: false,
    compact: false,
    skeletonRows: 5,
    emptyMessage: 'Tidak ada data yang cocok dengan pencarian.',
    sortDir: 'asc',
    headerClass: 'bg-primary dark:bg-primary-700 text-white text-left',
    bodyClass: '',
    rowClass:
      'border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
  }
);

defineEmits<{ sort: [key: string] }>();
</script>
