<script setup lang="ts">
// Usulan Saya — SE melihat usulan yang dia buat
// Redirect ke page usulan-akses-berkas (tab "Semua" by default)
definePageMeta({ middleware: 'auth' });
useHead({ title: 'Usulan Saya' });

await navigateTo('/kelola/penggunaan/usulan-akses-berkas', { replace: true });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
  </div>
</template>
