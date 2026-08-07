<script setup lang="ts">
// Redirect lama /penggunaan/* → /kelola/penggunaan/*
definePageMeta({ middleware: 'auth' });
const route = useRoute();
await navigateTo(`/kelola/penggunaan${route.path.replace('/penggunaan', '')}`, { replace: true });
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
  </div>
</template>
