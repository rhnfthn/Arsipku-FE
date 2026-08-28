<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-start">
    <span
      class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0"
    >
      {{ label }}
      <span v-if="hint" class="block text-xs text-gray-400 font-normal">{{ hint }}</span>
    </span>

    <div class="flex-1 w-full space-y-2">
      <div v-if="model.length" class="space-y-2">
        <div v-for="(director, idx) in model" :key="directorKey(director, idx)" class="space-y-1.5">
          <div class="flex items-start gap-2">
            <span
              class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0 mt-1"
            >
              {{ idx + 1 }}
            </span>
            <div class="grid flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <label class="block min-w-0">
                <span class="mb-1 block text-xs text-gray-400">Nama</span>
                <input
                  v-model="director.nama"
                  type="text"
                  class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder-gray-400 focus:border-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  placeholder="Nama pejabat / delegasi"
                />
              </label>
              <label class="block min-w-0">
                <span class="mb-1 block text-xs text-gray-400">Jabatan</span>
                <input
                  :value="director.jabatan"
                  type="text"
                  class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  readonly
                />
              </label>
            </div>
            <button
              type="button"
              class="mt-8 shrink-0 text-gray-400 hover:text-red-500"
              :aria-label="`Hapus ${label}`"
              @click="removeDirector(idx)"
            >
              <UIcon name="i-lucide-x" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="recipients.length === 0" class="py-1 text-sm text-gray-400">
        {{ emptyText }}
      </div>
      <div v-else-if="availableOptions.length > 0" class="flex items-center gap-2">
        <span
          class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500 text-white text-xs font-bold shrink-0"
        >
          {{ model.length + 1 }}
        </span>
        <USelectMenu
          v-model="picker"
          :items="availableOptions"
          value-key="value"
          :placeholder="placeholder"
          searchable
          variant="none"
          class="flex-1 w-full"
          :content="{ side: 'bottom', sideOffset: 8, class: 'max-h-[380px]' } as any"
          :search-input="{ placeholder: 'Cari nama atau jabatan direksi...' }"
          :ui="
            {
              base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
              input: 'w-full',
              value: 'w-full',
              viewport: 'max-h-[380px]',
            } as any
          "
        >
          <template #default>
            <div class="flex min-h-[28px] w-full cursor-pointer items-center gap-1.5 pr-10">
              <span class="text-sm text-gray-400">{{ placeholder }}</span>
            </div>
          </template>

          <template #item="{ item }">
            <div class="flex min-w-0 w-full flex-col overflow-hidden">
              <span class="block w-full truncate text-sm font-medium text-gray-900 dark:text-white">
                {{ item.jabatan }}
              </span>
              <span class="mt-0.5 block w-full truncate text-xs text-gray-500">
                {{ item.nama || 'Nama belum tersedia' }}
              </span>
            </div>
          </template>
        </USelectMenu>
      </div>
      <p v-else class="text-xs text-gray-400">Semua direksi tersedia sudah dipilih.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { DirectorApprovalItem } from '~/types/naskah-lainnya';

const model = defineModel<DirectorApprovalItem[]>({ default: () => [] });

const props = withDefaults(
  defineProps<{
    label: string;
    recipients: DirectorApprovalItem[];
    hint?: string;
    placeholder?: string;
    emptyText?: string;
  }>(),
  {
    hint: '',
    placeholder: 'Pilih direksi...',
    emptyText: 'Tidak ada data direksi.',
  }
);

const picker = ref<string | null>(null);

function keyOf(director: Partial<DirectorApprovalItem>) {
  return String(director.positionId || `${director.jabatan || ''}-${director.nama || ''}`);
}

function directorKey(director: DirectorApprovalItem, idx: number) {
  return `${keyOf(director)}-${idx}`;
}

function compactDirector(director: DirectorApprovalItem): DirectorApprovalItem {
  return {
    index: model.value.length + 1,
    positionId: director.positionId,
    persnum: director.persnum,
    nama: director.nama,
    jabatan: director.jabatan,
  };
}

const selectedKeys = computed(() => new Set(model.value.map(keyOf)));

const availableOptions = computed(() =>
  props.recipients
    .filter((director) => !selectedKeys.value.has(keyOf(director)))
    .map((director) => ({
      value: keyOf(director),
      label: `${director.jabatan} — ${director.nama || 'Nama belum tersedia'}`,
      nama: director.nama,
      jabatan: director.jabatan,
      raw: director,
    }))
);

function removeDirector(idx: number) {
  model.value = model.value
    .filter((_, i) => i !== idx)
    .map((item, i) => ({ ...item, index: i + 1 }));
}

watch(picker, (value) => {
  if (!value) return;
  const option = availableOptions.value.find((item) => item.value === value);
  if (option) {
    model.value = [...model.value, compactDirector(option.raw)];
  }
  picker.value = null;
});
</script>
