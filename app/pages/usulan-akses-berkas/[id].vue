<script setup lang="ts">
// Redirect lama /usulan-akses-berkas/:id → /kelola/penggunaan/usulan-akses-berkas/:id
definePageMeta({ middleware: 'auth' });
const route = useRoute();
await navigateTo(`/kelola/penggunaan/usulan-akses-berkas/${route.params.id}`, { replace: true });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
  </div>
</template>
