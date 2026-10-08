<template>
  <div
    class="flex gap-1"
    :class="layout === 'stacked' ? 'flex-col' : 'flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 sm:gap-0'">
    <span :class="layout === 'stacked' ? 'text-xs font-medium dark:text-gray-200' : 'w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0'">
      {{ $t('klasifikasi') }}<span v-if="required" class="text-red-500 ml-0.5">*</span>
    </span>

    <div class="flex flex-wrap gap-1 w-full items-center min-w-0">
      <USelectMenu v-model="model" :loading="loading" :ignore-filter="remote"
        @update:open="emit('update:open', $event)" @update:search-term="emit('search', $event)" :items="computedItems" value-key="id" label-key="searchLabel" :variant="layout === 'stacked' ? 'outline' : 'none'"
        class="w-full" searchable :content="({ class: `max-h-[380px] w-[min(60vw,64rem)] max-w-[calc(100vw-2rem)] ${contentClass || ''}` } as any)"
        :search-attributes="['searchLabel']" :placeholder="$t('f_pilih_klasifikasi')"
        :search-input="{ placeholder: $t('f_cari_klasifikasi') }" :ui="{
          base: layout === 'stacked'
            ? `!px-3 !py-2 !min-h-0 !bg-white dark:!bg-gray-700 w-full rounded-lg border text-sm text-left dark:text-gray-200 hover:!bg-gray-50 dark:hover:!bg-gray-600 ${invalid ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`
            : '!px-0 !bg-transparent w-full dark:text-white',
          ring: 'ring-0',
          shadow: 'shadow-none',
          width: 'w-full sm:w-auto max-w-[calc(100vw-2rem)]'
        } as any">

        <template #item="{ item }">
          <div v-if="item.isParent" class="w-full py-1 overflow-hidden">
            <span
              class="text-xs font-bold text-primary-500 dark:text-primary-400 uppercase tracking-widest block w-full truncate">
              {{ item.klasifikasi }} - {{ item.klasifikasi_text }}
            </span>
          </div>

          <div v-else class="flex flex-col min-w-0 w-full overflow-hidden" :class="{ 'cursor-not-allowed': item.disabled }">
            <span
              class="text-sm block w-full truncate font-medium text-gray-900 dark:text-white"
            >
              {{ item.klasifikasi }} - {{ item.klasifikasi_text }}
            </span>
            <span v-if="item.deskripsi" class="text-xs text-gray-500 dark:text-gray-400 block w-full mt-0.5 whitespace-normal break-words [overflow-wrap:anywhere] leading-relaxed">
              {{ item.deskripsi }}
            </span>
          </div>
        </template>

        <template #default>
          <span v-if="selectedObj" class="truncate text-sm block w-full text-left dark:text-white">
            {{ selectedObj.klasifikasi }} - {{ selectedObj.klasifikasi_text }}
          </span>
          <span v-else class="text-gray-400 dark:text-gray-500 text-sm block w-full text-left">
            {{ $t('f_pilih_klasifikasi') }}
          </span>
        </template>

        <template #content-bottom><slot name="content-bottom" /></template>
      </USelectMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Klasifikasi } from "~/types/klasifikasi";

const props = defineProps<{
  items: Klasifikasi[];
  loading?: boolean;
  required?: boolean;
  remote?: boolean;
  contentClass?: string;
  layout?: 'inline' | 'stacked';
  invalid?: boolean;
}>();

const emit = defineEmits<{ 'update:open': [open: boolean]; search: [term: string] }>();
const model = defineModel<any>();
const selectedObj = computed(() => {
  return props.items.find((b) => b.id === model.value);
});

const computedItems = computed(() => {
  // Urutkan berdasarkan klasifikasi agar Child berada di bawah Parent
  const sortedItems = [...props.items].sort((a, b) =>
    a.klasifikasi.localeCompare(b.klasifikasi)
  );

  // Deteksi parent via relasi id_parent (akurat), bukan heuristik titik.
  // Contoh: "AUD.02" punya titik tapi tetap parent karena punya child.
  const childIds = new Set(
    sortedItems
      .map((item) => item.id_parent)
      .filter((pid): pid is string => !!pid)
  );

  return sortedItems.map(item => {
    const isParent = item.has_children === true || childIds.has(item.id);
    // Tidak bisa dipilih jika: parent (punya child) ATAU is_select = 0.
    const selectable = !isParent && Number(item.is_select ?? 1) === 1;
    return {
      ...item,
      searchLabel: item.search_text || [
        item.klasifikasi,
        item.klasifikasi_text,
        item.deskripsi,
      ].filter(Boolean).join(' '),
      disabled: !selectable, // Bawaan USelectMenu/Headless UI: Cegah item agar tidak bisa diklik
      isParent: isParent  // Custom flag untuk membedakan UI di slot #item
    };
  });
});
</script>
