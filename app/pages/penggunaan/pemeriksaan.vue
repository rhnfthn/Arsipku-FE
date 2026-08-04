<script setup lang="ts">
// Pemeriksaan — placeholder page (belum dikerjakan)
import PageHeader from '~/components/PageHeader.vue';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Pemeriksaan Usulan Akses Berkas' });

const { t } = useI18n();

const breadcrumbs = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/beranda' },
  { label: 'Penggunaan', to: '#' },
  { label: 'Pemeriksaan', to: '/penggunaan/pemeriksaan' },
]);
</script>

<template>
  <div class="bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5 min-h-screen">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Pemeriksaan
        </h1>
      </template>
    </PageHeader>

    <div class="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 dark:border-gray-700 dark:bg-gray-800">
      <span class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
        <UIcon name="i-lucide-search-check" class="size-8 text-gray-400" />
      </span>
      <h2 class="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">Halaman Pemeriksaan</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
        Fitur pemeriksaan usulan akses berkas belum tersedia. Halaman ini akan dikembangkan lebih lanjut.
      </p>
    </div>
  </div>
</template>