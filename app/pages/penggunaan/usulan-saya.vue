<script setup lang="ts">
// Usulan Saya — SE melihat usulan yang dia buat (scope=mine)
// Redirect ke page usulan-akses-berkas dengan tab=mine
definePageMeta({ middleware: 'auth' });
useHead({ title: 'Usulan Saya' });

await navigateTo('/usulan-akses-berkas?tab=mine', { replace: true });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
  </div>
</template>
