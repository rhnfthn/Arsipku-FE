<template>
  <div class="flex-1 overflow-y-auto space-y-4">
    <!-- Card Summary -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-[#457fb6]/10">
            <UIcon name="i-lucide-file-stack" class="w-5 h-5 text-[#457fb6]" />
          </div>
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400">Total Surat</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">{{ penerimaList.length }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <UIcon name="i-lucide-user" class="w-5 h-5 text-blue-500" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-gray-500 dark:text-gray-400">Pengirim</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ konsep?.pengirimName || '-' }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <UIcon name="i-lucide-tag" class="w-5 h-5 text-amber-500" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-gray-500 dark:text-gray-400">Klasifikasi</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ konsep?.klasifikasiName || '-' }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <UIcon name="i-lucide-layout-template" class="w-5 h-5 text-purple-500" />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-gray-500 dark:text-gray-400">Template</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ template?.skema || '-' }} / {{ template?.versi || '-' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Daftar Penerima -->
    <div>
      <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Daftar Penerima ({{ penerimaList.length }})</h4>
      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-[300px] overflow-y-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">No</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Tertuju</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Alamat</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Kota</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Jabatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in penerimaList" :key="item.no" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-3 py-2 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{{ item.no }}</td>
              <td class="px-3 py-2 text-gray-900 dark:text-white font-medium border-b border-gray-100 dark:border-gray-700">{{ item.tertuju }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.alamat || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.kota || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.jabatanPenerima || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Preview Perwakilan -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Preview Perwakilan Surat</h4>
        <UButton
          label="Lihat Preview"
          color="primary"
          variant="soft"
          icon="i-lucide-eye"
          size="sm"
          @click="showPreview = true"
        />
      </div>
    </div>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div v-if="showPreview" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showPreview = false" />
        <div class="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[90vh]">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Preview Perwakilan Surat</h3>
            <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark" @click="showPreview = false" />
          </div>
          <div class="p-4 overflow-y-auto">
            <div class="mb-4">
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Preview untuk penerima
              </label>
              <USelectMenu
                v-model="previewIndex"
                :items="previewOptions"
                value-key="value"
                class="w-full"
                variant="outline"
              />
            </div>
            <SdeMasalLetterPreview
              :konsep="konsep"
              :penerima-list="penerimaList"
              :template="template"
              :penerima-index="previewIndex"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Tombol Generate -->
    <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Klik tombol di kanan bawah untuk generate dan kirim massal.
        </p>
        <UButton
          label="Generate dan Kirim Massal"
          color="primary"
          size="lg"
          icon="i-lucide-send"
          class="font-bold"
          :loading="generating"
          @click="$emit('generate')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import SdeMasalLetterPreview from './SdeMasalLetterPreview.vue';
import type { SdeMasalConcept, SdeMasalPenerima, SdeMasalTemplate } from '~/types/sde-masal';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
  template: SdeMasalTemplate | null;
  generating: boolean;
}>();

defineEmits<{
  (e: 'generate'): void;
}>();

const showPreview = ref(false);
const previewIndex = ref<number>(0);

const previewOptions = computed(() =>
  props.penerimaList.map((p, idx) => ({
    label: `${p.no || idx + 1}. ${p.idTertuju || p.tertuju || p.perihal || 'Penerima'}`,
    value: idx,
  })),
);
</script>