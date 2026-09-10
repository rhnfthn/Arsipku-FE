<template>
  <div class="relative w-full">
    <USelectMenu
      :model-value="modelValue"
      :items="processedItems"
      value-key="value"
      :searchable="true"
      :search-input="{ placeholder: searchPlaceholder }"
      variant="none"
      class="w-full p-0 custom-select-menu"
      :content="({ side: 'bottom', sideOffset: 8, class: 'max-h-[380px]' } as any)"
      :filter-fields="['label']"
      :ui="{
        base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
        wrapper: 'pr-10 w-full',
        input: 'pr-10 w-full',
        value: 'p-0 w-full',
        viewport: 'max-h-[380px]',
        trigger: { base: 'px-0 py-1 w-full' },
        item: 'cursor-pointer',
        itemWrapper: 'w-full',
        itemLabel: 'w-full',
      } as any"
      @update:model-value="onSelect"
    >
      <!-- Trigger: menampilkan pilihan terpilih atau placeholder -->
      <template #default>
        <div
          class="flex min-h-[38px] w-full cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 pr-10 transition-colors hover:border-primary-400 dark:border-gray-600 dark:hover:border-primary-500"
        >
          <span
            v-if="selectedItem"
            class="text-sm text-left truncate text-gray-900 dark:text-white"
          >
            {{ selectedItem.label }}
          </span>
          <span v-else class="text-sm text-gray-400 dark:text-gray-500">
            {{ placeholder }}
          </span>
        </div>
      </template>

      <!-- Item dropdown: pola sama dengan TulisInputPenerima (checkbox + nama + jabatan) -->
      <template #item="{ item }">
        <div
          class="flex items-start gap-3 w-full py-1 overflow-hidden"
          :class="{ 'opacity-50 cursor-not-allowed': item.disabled }"
          @click.stop.prevent="handleClick(item)"
        >
          <UCheckbox
            :model-value="isSelected(item)"
            class="pointer-events-none shrink-0"
            :disabled="item.disabled"
            :ui="{ base: 'w-4 h-4' }"
          />
          <div class="flex-1 min-w-0">
            <span
              class="block text-sm text-left truncate w-full text-gray-900 dark:text-white"
            >
              {{ item.label }}
            </span>
            <span
              v-if="item.labelJob"
              class="block text-xs text-left truncate w-full text-gray-500 dark:text-gray-400 mt-0.5"
            >
              {{ item.labelJob }}
            </span>
            <span
              v-if="item.disabled"
              class="text-xs text-red-500 italic block"
            >
              {{ disabledMessage }}
            </span>
          </div>
        </div>
      </template>
    </USelectMenu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * Dropdown single-select pejabat — pola UI sama dengan TulisInputPenerima
 * (checkbox + nama + jabatan di bawah + disabled message), dipakai untuk
 * Urutan Penandatangan & Verifikator berjenjang di naskah-lainnya.
 *
 * Perbedaan dengan TulisInputPenerima: single-select (satu pejabat per slot),
 * bukan multi-select badge.
 */

const props = withDefaults(
  defineProps<{
    /** Item opsi: { label, labelJob?, value, disabled?, raw? } */
    items: any[];
    /** Nilai terpilih (value string/number) */
    modelValue: string | number | null;
    placeholder?: string;
    searchPlaceholder?: string;
    /** Pesan untuk item yang disabled (mis. "Sudah dipilih") */
    disabledMessage?: string;
  }>(),
  {
    placeholder: 'Pilih…',
    searchPlaceholder: 'Cari nama atau jabatan…',
    disabledMessage: 'Sudah dipilih',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void;
  (e: 'select', item: any): void;
}>();

const processedItems = computed(() =>
  props.items.map((item) => ({
    ...item,
    type: 'person',
  })),
);

const selectedItem = computed(() =>
  props.items.find(
    (item) => String(item.value) === String(props.modelValue),
  ),
);

const isSelected = (item: any) =>
  String(item.value) === String(props.modelValue);

const handleClick = (item: any) => {
  if (item.disabled) return;
  // Toggle: klik item yang sudah terpilih → kosongkan (bisa dipakai untuk clear).
  if (isSelected(item)) {
    emit('update:modelValue', null);
    return;
  }
  emit('update:modelValue', item.value);
  emit('select', item);
};

const onSelect = (value: any) => {
  // USelectMenu value-key mode — value langsung dari item.value.
  if (value == null) return;
  const item = props.items.find((i) => String(i.value) === String(value));
  if (item && !item.disabled) {
    emit('update:modelValue', item.value);
    emit('select', item);
  }
};
</script>
