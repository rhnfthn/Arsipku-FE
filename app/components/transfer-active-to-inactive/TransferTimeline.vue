<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
    <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Timeline Status</h3>
    <ol class="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-4">
      <li v-for="step in steps" :key="step.status" class="ml-6">
        <span
          :class="step.active ? 'bg-[#457fb6] ring-4 ring-[#457fb6]/20' : step.done ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'"
          class="absolute -left-[9px] w-4 h-4 rounded-full"
        ></span>
        <p
          :class="step.active ? 'text-[#457fb6] font-semibold' : step.done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'"
          class="text-sm"
        >{{ step.label }}</p>
        <p class="text-xs text-gray-400">{{ step.unit }}</p>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TransferActiveToInactiveStatus } from '~/types/transfer-active-to-inactive';

const props = defineProps<{ status: TransferActiveToInactiveStatus }>();

const steps = computed(() => {
  const order: TransferActiveToInactiveStatus[] = [
    'DRAFT',
    'MENUNGGU_VERIFIKASI_ATASAN',
    'DISETUJUI_ATASAN',
    'MENUNGGU_VERIFIKASI_TERAKHIR',
    'DISETUJUI_VERIFIKASI_TERAKHIR',
    'DIKIRIM',
    'BERKAS_FISIK_SESUAI',
    'DISETUJUI_PERSETUJUAN_TU',
    'DISETUJUI_PERSETUJUAN_TERAKHIR_TU',
    'ARSIP_INAKTIF_DITERIMA',
    'PENATAAN_ARSIP_INAKTIF',
    'SELESAI',
  ];
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    MENUNGGU_VERIFIKASI_ATASAN: 'Verifikasi Atasan',
    DISETUJUI_ATASAN: 'Disetujui Atasan',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'Verifikasi Terakhir Atasan',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'Disetujui Verifikasi Terakhir',
    DIKIRIM: 'Dikirim ke Unit Tata Naskah',
    BERKAS_FISIK_SESUAI: 'Berkas Sesuai',
    DISETUJUI_PERSETUJUAN_TU: 'Disetujui TU',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Disetujui Final TU',
    ARSIP_INAKTIF_DITERIMA: 'Arsip Diterima',
    PENATAAN_ARSIP_INAKTIF: 'Penataan',
    SELESAI: 'Selesai',
  };
  const units: Record<string, string> = {
    DRAFT: 'Unit Kerja',
    MENUNGGU_VERIFIKASI_ATASAN: 'Unit Kerja',
    DISETUJUI_ATASAN: 'Unit Kerja',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'Unit Kerja',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'Unit Kerja',
    DIKIRIM: 'Unit Kerja → Unit Tata Naskah',
    BERKAS_FISIK_SESUAI: 'Unit Tata Naskah',
    DISETUJUI_PERSETUJUAN_TU: 'Unit Tata Naskah',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Unit Tata Naskah',
    ARSIP_INAKTIF_DITERIMA: 'Unit Tata Naskah',
    PENATAAN_ARSIP_INAKTIF: 'Unit Tata Naskah',
    SELESAI: 'Unit Tata Naskah',
  };
  const currentIdx = order.indexOf(props.status);
  return order.map((s, i) => ({
    status: s,
    label: labels[s] || s,
    unit: units[s] || '',
    done: i < currentIdx,
    active: i === currentIdx,
  }));
});
</script>