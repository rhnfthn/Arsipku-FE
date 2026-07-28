<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
    <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2">Berita Acara Serah Terima</h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Generate Berita Acara Serah Terima untuk usulan ini.
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        @click="$emit('generate')"
        :disabled="generating"
        class="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 transition-colors"
      >
        <UIcon v-if="generating" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
        <UIcon v-else name="i-lucide-file-text" class="w-4 h-4" />
        {{ generating ? 'Generating...' : 'Generate Berita Acara' }}
      </button>
      <a
        v-if="usulan.beritaAcaraUrl"
        :href="usulan.beritaAcaraUrl"
        target="_blank"
        class="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-[#457fb6] text-[#457fb6] hover:bg-[#457fb6]/10 transition-colors"
      >
        <UIcon name="i-lucide-download" class="w-4 h-4" /> Download PDF
      </a>
    </div>
    <p v-if="usulan.beritaAcaraNomor" class="text-sm text-gray-700 dark:text-gray-300 mt-3">
      Nomor: {{ usulan.beritaAcaraNomor }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { VerifikasiUsulanItem } from '~/types/verifikasi-usulan';

defineProps<{
  usulan: VerifikasiUsulanItem;
  generating?: boolean;
}>();

defineEmits<{ generate: [] }>();
</script>