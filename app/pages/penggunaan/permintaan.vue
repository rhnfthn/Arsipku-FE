<script setup lang="ts">
// Permintaan — SE buat usulan akses berkas
// Menggunakan page yang sama dengan /usulan-akses-berkas (redirect)
definePageMeta({ middleware: 'auth' });
useHead({ title: 'Permintaan Usulan Akses Berkas' });

// Redirect ke page usulan-akses-berkas yang sudah ada
await navigateTo('/usulan-akses-berkas', { replace: true });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
  </div>
</template>