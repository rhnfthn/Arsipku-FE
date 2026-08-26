<script setup lang="ts">
import type { DokumenFile } from '~/types/naskah-lainnya';
import { FASE_LABEL } from '~/types/naskah-lainnya';

defineProps<{ items: DokumenFile[] }>();
const emit = defineEmits<{ lihat: [id: string]; unduh: [id: string] }>();

function faseLabel(d: DokumenFile): string {
  if (d.status === 'dittd') return '✓ Final — Tertanda Tangan';
  return FASE_LABEL[d.fase ?? ''] ?? d.fase ?? 'Naskah';
}

function formatTanggal(s?: string): string {
  if (!s) return '';
  const t = new Date(s);
  if (isNaN(t.getTime())) return s;
  return t.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}
</script>

<template>
  <div v-if="items.length === 0" class="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-gray-500">
    <UIcon name="i-lucide-inbox" class="size-8" />
    <span class="text-sm">Belum ada naskah diunggah.</span>
  </div>

  <div v-else class="relative pl-7">
    <div class="absolute left-[10px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

    <div v-for="d in items" :key="d.id" class="relative mb-3 last:mb-0">
      <span
        class="absolute -left-[28px] top-3 size-[18px] rounded-full border-[3px] border-white"
        :class="d.status === 'dittd'
          ? 'bg-green-600 shadow-[0_0_0_2px_#16a34a]'
          : 'bg-white border-gray-400 dark:bg-gray-800'"
      />

      <div
        class="rounded-lg p-3"
        :class="d.status === 'dittd'
          ? 'border-2 border-green-600 bg-green-50 dark:bg-green-900/20'
          : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'"
      >
        <div class="flex items-center justify-between gap-2">
          <span
            class="text-sm font-semibold"
            :class="d.status === 'dittd' ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-100'"
          >{{ faseLabel(d) }}</span>
          <span
            class="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
            :class="{
              'bg-green-600': d.status === 'dittd',
              'bg-amber-500': d.status === 'revisi',
              'bg-blue-500': d.status === 'draf',
              'bg-gray-400': d.status === 'final',
            }"
          >{{ (d.status ?? 'final').toUpperCase() }}</span>
        </div>

        <p class="mt-1 break-all text-xs text-gray-600 dark:text-gray-300">{{ d.nama }}</p>
        <p class="mt-1 text-[12px] text-gray-500 dark:text-gray-400">
          <template v-if="d.uploaderNama">👤 {{ d.uploaderNama }}<template v-if="d.uploaderJabatan"> ({{ d.uploaderJabatan }})</template> · </template>
          📍 {{ faseLabel(d) }} · {{ formatTanggal(d.tanggal) }}
        </p>

        <div class="mt-2 flex gap-1">
          <UButton size="xs" variant="ghost" icon="i-lucide-eye" label="Lihat" @click="emit('lihat', d.id)" />
          <UButton size="xs" variant="ghost" icon="i-lucide-download" label="Unduh" @click="emit('unduh', d.id)" />
        </div>
      </div>
    </div>
  </div>
</template>
