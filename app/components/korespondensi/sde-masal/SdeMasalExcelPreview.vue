<template>
  <div class="mt-4">
    <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Preview Data Penerima</h4>
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">No</th>
            <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Persnum</th>
            <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Nama</th>
            <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Jabatan</th>
            <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Keterangan</th>
            <th class="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.no"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            :class="{ 'bg-red-50 dark:bg-red-950/20': !item.isValid }"
          >
            <td class="px-3 py-2 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">{{ item.no }}</td>
            <td class="px-3 py-2 text-gray-600 dark:text-gray-300 font-mono border-b border-gray-100 dark:border-gray-700">{{ item.persnum || '-' }}</td>
            <td class="px-3 py-2 text-gray-900 dark:text-white font-medium border-b border-gray-100 dark:border-gray-700">
              {{ item.nama || '-' }}
            </td>
            <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.jabatan || '-' }}</td>
            <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.keterangan || '-' }}</td>
            <td class="px-3 py-2 text-center border-b border-gray-100 dark:border-gray-700">
              <span
                v-if="item.isValid"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              >
                <UIcon name="i-lucide-check-circle" class="w-3 h-3" />
                Valid
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                :title="item.validationMessage"
              >
                <UIcon name="i-lucide-x-circle" class="w-3 h-3" />
                Invalid
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SdeMasalPenerima } from '~/types/sde-masal';

defineProps<{
  items: SdeMasalPenerima[];
}>();
</script>