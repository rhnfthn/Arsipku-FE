<script setup lang="ts">
import { computed } from 'vue';
import { StatusUsulan } from '~/types/usulan-akses-berkas';

const props = defineProps<{
  status: StatusUsulan;
}>();

const statusConfig: Record<StatusUsulan, { label: string; class: string }> = {
  [StatusUsulan.DRAFT]: {
    label: 'Draft',
    class: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
  },
  [StatusUsulan.MENUNGGU_VERIFIKASI_PENGUSUL]: {
    label: 'Menunggu Verifikasi Pengusul',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.MENUNGGU_VERIFIKASI_AKHIR_PENGUSUL]: {
    label: 'Menunggu Verifikasi VP Pengusul',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.MENUNGGU_VERIFIKASI_EVP_PENGUSUL]: {
    label: 'Menunggu Verifikasi EVP Pengusul',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.REVISI_PENGUSUL]: {
    label: 'Revisi Pengusul',
    class: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  },
  [StatusUsulan.DITOLAK_PENGUSUL]: {
    label: 'Ditolak Pengusul',
    class: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
  [StatusUsulan.TERKIRIM_KE_PEMBERI]: {
    label: 'Terkirim ke Pemberi',
    class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  },
  [StatusUsulan.MENUNGGU_VERIFIKASI_PEMBERI]: {
    label: 'Menunggu Verifikasi Pemberi',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.PEMILIHAN_BERKAS]: {
    label: 'Pemilihan Berkas',
    class: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  },
  [StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI]: {
    label: 'Menunggu Persetujuan Pemberi',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI]: {
    label: 'Menunggu Persetujuan VP Pemberi',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.MENUNGGU_PERSETUJUAN_EVP_PEMBERI]: {
    label: 'Menunggu Persetujuan EVP Pemberi',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.REVISI_PEMBERI]: {
    label: 'Revisi Pemberi',
    class: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  },
  [StatusUsulan.DITOLAK_PEMBERI]: {
    label: 'Ditolak Pemberi',
    class: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
  [StatusUsulan.AKSES_DITERBITKAN]: {
    label: 'Akses Diterbitkan',
    class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  },
  [StatusUsulan.SELESAI]: {
    label: 'Selesai',
    class: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400',
  },
  [StatusUsulan.AKSES_KADALUARSA]: {
    label: 'Akses Kadaluarsa',
    class: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
};

const config = computed(() => statusConfig[props.status] || statusConfig[StatusUsulan.DRAFT]);
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
    :class="config.class"
  >
    {{ config.label }}
  </span>
</template>