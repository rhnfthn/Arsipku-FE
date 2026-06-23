<template>
  <div
    class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
    <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
      Klasifikasi
    </span>

    <div class="flex flex-wrap gap-1 w-full items-center min-w-0">
      <USelectMenu v-model="model" :items="computedItems" value-key="id" label-key="searchLabel" variant="none"
        class="w-full" searchable :content="({ class: 'max-h-[380px]' } as any)"
        :search-attributes="['searchLabel']" placeholder="Pilih Klasifikasi"
        :search-input="{ placeholder: 'Cari kode atau nama klasifikasi...' }" :ui="{
          base: '!px-0 !bg-transparent w-full dark:text-white',
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

          <div v-else class="flex flex-col min-w-0 w-full overflow-hidden">
            <span class="text-sm font-medium text-gray-900 dark:text-white block w-full truncate">
              {{ item.klasifikasi }} - {{ item.klasifikasi_text }}
            </span>
            <span v-if="item.deskripsi" class="text-xs text-gray-500 block w-full truncate mt-0.5">
              {{ item.deskripsi }}
            </span>
          </div>
        </template>

        <template #default>
          <span v-if="selectedObj" class="truncate text-sm block w-full text-left dark:text-white">
            {{ selectedObj.klasifikasi }} - {{ selectedObj.klasifikasi_text }}
          </span>
          <span v-else class="text-gray-400 dark:text-gray-500 text-sm block w-full text-left">
            Pilih Klasifikasi
          </span>
        </template>

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
}>();

const model = defineModel<any>();
const selectedObj = computed(() => {
  return props.items.find((b) => b.id === model.value);
});

const computedItems = computed(() => {
  // Urutkan berdasarkan klasifikasi agar Child berada di bawah Parent
  const sortedItems = [...props.items].sort((a, b) =>
    a.klasifikasi.localeCompare(b.klasifikasi)
  );
  return sortedItems.map(item => {
    // Deteksi Parent: Jika klasifikasi tidak mengandung titik "."
    const isParent = !item.klasifikasi.includes('.');
    return {
      ...item,
      searchLabel: `${item.klasifikasi} - ${item.klasifikasi_text}`,
      disabled: isParent, // Bawaan USelectMenu/Headless UI: Cegah item agar tidak bisa diklik
      isParent: isParent  // Custom flag untuk membedakan UI di slot #item
    };
  });
});
</script>
