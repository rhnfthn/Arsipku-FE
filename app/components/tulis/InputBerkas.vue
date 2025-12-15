<template>
  <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
    <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
      Berkas
    </span>
    <div class="flex flex-wrap gap-1 w-full items-center">
      <USelectMenu
        v-model="model"
        :items="items"
        :loading="loading"
        value-key="id"
        :search-attributes="['judulBerkas', 'klasifikasi', 'isiRingkas']"
        placeholder="Pilih Berkas"
        :search-input="{ placeholder: 'Cari judul, klasifikasi, atau isi...', size: 'lg' }"
        variant="none"
        class="w-full"
        :ui="{
          base: '!px-0 !bg-transparent w-full dark:text-white',
          ring: 'ring-0',
          shadow: 'shadow-none',
        }"
      >
        <template #item="{ item }">
          <div class="flex flex-col truncate py-1">
            <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ item.judulBerkas }}
            </span>
            <span class="text-xs text-gray-500 truncate">
              {{ item.klasifikasi }} - {{ item.isiRingkas }}
            </span>
          </div>
        </template>

        <template #default>
          <span v-if="selectedObj" class="truncate text-sm block w-full text-left dark:text-white font-medium">
            {{ selectedObj.judulBerkas }}
            <span class="text-gray-500 font-normal ml-2">({{ selectedObj.klasifikasi }})</span>
          </span>
          <span v-else class="text-gray-400 dark:text-gray-500 text-sm block w-full text-left">
            Pilih berkas arsip...
          </span>
        </template>
      </USelectMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  items: any[];
  loading?: boolean;
}>();

// Model menyimpan ID (string)
const model = defineModel<string | null>();

// Computed untuk mencari object lengkap berdasarkan ID yang dipilih
const selectedObj = computed(() => {
  return props.items.find((b) => b.id === model.value);
});
</script>
