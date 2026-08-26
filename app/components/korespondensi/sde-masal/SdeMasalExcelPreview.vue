<template>
  <div class="mt-4">
    <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Preview Data Penerima</h4>
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">No</th>
            <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">Perihal</th>
            <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">id_tertuju</th>

            <!-- Kolom KEUANGAN -->
            <template v-if="skema === 'KEUANGAN'">
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">jumlah_tagihan_idr</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">jumlah_tagihan_usd</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">nama_cro</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">email_cro</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">jabatan_signer</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">nama_signer</th>
            </template>

            <!-- Kolom UMUM -->
            <template v-else>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">jumlah_lampiran</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">jabatan_penerima</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">alamat_penerima</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">panggilan_penerima</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">nominal_rupiah</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">nominal_dolar</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">nama_cro</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">email_cro</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">jabatan_signer</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">nama_signer</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">tembusan_1</th>
              <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">tembusan_2</th>
            </template>

            <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">is_revision</th>
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
            <td class="px-3 py-2 text-gray-900 dark:text-white font-medium border-b border-gray-100 dark:border-gray-700">{{ item.perihal || '-' }}</td>
            <td class="px-3 py-2 text-gray-600 dark:text-gray-300 font-mono border-b border-gray-100 dark:border-gray-700">{{ item.idTertuju || '-' }}</td>

            <!-- Kolom KEUANGAN -->
            <template v-if="skema === 'KEUANGAN'">
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.jumlahTagihanIdr || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.jumlahTagihanUsd || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.namaCro || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.emailCro || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.jabatanSigner || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.namaSigner || '-' }}</td>
            </template>

            <!-- Kolom UMUM -->
            <template v-else>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.jumlahLampiran || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.jabatanPenerima || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.alamatPenerima || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.panggilanPenerima || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.nominalRupiah || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.nominalDolar || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.namaCro || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.emailCro || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.jabatanSigner || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.namaSigner || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.tembusan1 || '-' }}</td>
              <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.tembusan2 || '-' }}</td>
            </template>

            <td class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">{{ item.isRevision ? '1' : '0' }}</td>
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
  skema?: string | null;
}>();
</script>