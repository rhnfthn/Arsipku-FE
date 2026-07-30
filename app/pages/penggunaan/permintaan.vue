<script setup lang="ts">
// Permintaan — SE buat usulan akses berkas
// Redirect ke page usulan-akses-berkas dengan tab=mine (Usulan Saya)
definePageMeta({ middleware: 'auth' });
useHead({ title: 'Permintaan Usulan Akses Berkas' });

await navigateTo('/usulan-akses-berkas?tab=mine', { replace: true });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
  </div>
</template>