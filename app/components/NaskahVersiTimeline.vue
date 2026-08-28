<script setup lang="ts">
import type { DokumenFile } from '~/types/naskah-lainnya';
import { FASE_LABEL } from '~/types/naskah-lainnya';

const props = defineProps<{ items: DokumenFile[] }>();
const emit = defineEmits<{ lihat: [id: string]; unduh: [id: string] }>();

function isFinalOrSigned(d: DokumenFile): boolean {
  return d.status === 'final' || d.status === 'dittd';
}

function isLatest(index: number): boolean {
  const item = props.items[index];
  // Konsep/draf & dokumen 'proses_ttd' (signer 1..N-1, belum final) bukan dokumen
  // akhir sehingga tidak diberi penanda hijau hanya karena merupakan unggahan
  // paling baru. Hanya node 'dittd'/'final' (signer terakhir) yang terhighlight.
  return (
    index === 0 &&
    item?.status !== 'draf' &&
    item?.status !== 'proses_ttd'
  );
}

function isHighlighted(d: DokumenFile, index: number): boolean {
  return isFinalOrSigned(d) || isLatest(index);
}

function faseLabel(d: DokumenFile): string {
  if (d.status === 'dittd') return 'Final — Tertanda Tangan';
  if (d.status === 'final') return 'Final';
  if (d.status === 'proses_ttd') return 'Proses Tanda Tangan';
  return FASE_LABEL[d.fase ?? ''] ?? d.fase ?? 'Naskah';
}

function highlightLabel(d: DokumenFile, index: number): string {
  if (d.status === 'dittd') return 'Final Ditandatangani';
  if (d.status === 'final') return 'Final';
  if (isLatest(index)) return 'Terbaru';
  return dokumenStatusMeta(d.status)?.label ?? 'Dokumen';
}

function formatTanggal(s?: string): string {
  if (!s) return '';
  const t = new Date(s);
  if (isNaN(t.getTime())) return s;
  return t.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}
</script>

<template>
  <div
    v-if="items.length === 0"
    class="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-gray-500"
  >
    <UIcon name="i-lucide-inbox" class="size-8" />
    <span class="text-sm">Belum ada naskah diunggah.</span>
  </div>

  <div v-else class="relative pl-7">
    <div class="absolute left-[10px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

    <div v-for="(d, index) in items" :key="d.id" class="relative mb-3 last:mb-0">
      <span
        class="absolute -left-[28px] top-3 size-[18px] rounded-full border-[3px] border-white"
        :class="
          isHighlighted(d, index)
            ? 'bg-green-600 shadow-[0_0_0_2px_#16a34a]'
            : 'bg-white border-gray-400 dark:bg-gray-800'
        "
      />

      <div
        class="relative rounded-lg p-3"
        :class="
          isHighlighted(d, index)
            ? 'border-2 border-green-600 bg-green-50 shadow-sm ring-1 ring-green-100 dark:bg-green-900/20 dark:ring-green-900/40'
            : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
        "
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span
            class="text-sm font-semibold"
            :class="
              isHighlighted(d, index)
                ? 'text-green-700 dark:text-green-400'
                : 'text-gray-800 dark:text-gray-100'
            "
            >{{ faseLabel(d) }}</span
          >
          <div class="flex flex-wrap gap-1.5">
            <span
              v-if="isHighlighted(d, index)"
              class="inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-semibold text-white"
            >
              <UIcon name="i-lucide-check-circle-2" class="size-3.5" />
              {{ highlightLabel(d, index) }}
            </span>
            <span
              v-else
              class="rounded-full px-2.5 py-0.5 text-xs font-medium"
              :class="dokumenStatusMeta(d.status)?.chip ?? dokumenStatusMeta('final')!.chip"
              >{{ dokumenStatusMeta(d.status)?.label ?? 'Final' }}</span
            >
          </div>
        </div>

        <p class="mt-1 break-all text-xs text-gray-600 dark:text-gray-300" :title="d.nama">
          {{ d.nama }}
        </p>
        <p
          class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400"
        >
          <template v-if="d.uploaderNama">
            <UIcon name="i-lucide-user" class="size-3.5 shrink-0" />
            <span
              >{{ d.uploaderNama
              }}<template v-if="d.uploaderJabatan"> ({{ d.uploaderJabatan }})</template></span
            >
            <span aria-hidden="true">·</span>
          </template>
          <UIcon name="i-lucide-flag" class="size-3.5 shrink-0" />
          <span>{{ faseLabel(d) }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ formatTanggal(d.tanggal) }}</span>
        </p>

        <div class="mt-2 flex gap-1">
          <UButton
            size="sm"
            variant="ghost"
            icon="i-lucide-eye"
            label="Lihat"
            @click="emit('lihat', d.id)"
          />
          <UButton
            size="sm"
            variant="ghost"
            icon="i-lucide-download"
            label="Unduh"
            @click="emit('unduh', d.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
