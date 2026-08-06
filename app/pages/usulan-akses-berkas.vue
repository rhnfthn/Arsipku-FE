<script setup lang="ts">
// Redirect lama /usulan-akses-berkas → /kelola/penggunaan/usulan-akses-berkas
definePageMeta({ middleware: 'auth' });
const route = useRoute();
const query = route.query.tab ? `?tab=${route.query.tab}` : '';
await navigateTo(`/kelola/penggunaan/usulan-akses-berkas${query}`, { replace: true });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
  </div>
</template>