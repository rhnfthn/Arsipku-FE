<script setup lang="ts">
import { computed } from 'vue';
import { StatusUsulan } from '~/types/usulan-akses-berkas';

const props = defineProps<{
  status?: StatusUsulan;
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
    label: 'Menunggu Verifikasi Pengusul',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.MENUNGGU_VERIFIKASI_EVP_PENGUSUL]: {
    label: 'Menunggu Verifikasi Pengusul',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.REVISI_PENGUSUL]: {
    label: 'Ditolak Verifikasi Pengusul',
    class: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
  [StatusUsulan.DITOLAK_PENGUSUL]: {
    label: 'Ditolak Verifikasi Pengusul',
    class: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
  [StatusUsulan.TERKIRIM_KE_PEMBERI]: {
    label: 'Menunggu Verifikasi Pemberi',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.MENUNGGU_VERIFIKASI_PEMBERI]: {
    label: 'Menunggu Verifikasi Pemberi',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.PEMILIHAN_BERKAS]: {
    label: 'Menunggu Verifikasi Pemberi',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI]: {
    label: 'Menunggu Persetujuan Pemberi',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI]: {
    label: 'Menunggu Persetujuan Pemberi',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.MENUNGGU_PERSETUJUAN_EVP_PEMBERI]: {
    label: 'Menunggu Persetujuan Pemberi',
    class: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  },
  [StatusUsulan.REVISI_PEMBERI]: {
    label: 'Ditolak Persetujuan Pemberi',
    class: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
  [StatusUsulan.DITOLAK_PEMBERI]: {
    label: 'Ditolak Persetujuan Pemberi',
    class: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
  [StatusUsulan.AKSES_DITERBITKAN]: {
    label: 'Akses Diberikan',
    class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  },
  [StatusUsulan.SELESAI]: {
    label: 'Akses Diberikan',
    class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  },
  [StatusUsulan.AKSES_KADALUARSA]: {
    label: 'Akses Kadaluarsa',
    class: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  },
};

const config = computed(() => {
  const s = props.status ?? StatusUsulan.DRAFT;
  return statusConfig[s] || { label: s, class: 'bg-gray-100 text-gray-600' };
});
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
    :class="config.class"
  >
    {{ config.label }}
  </span>
</template>