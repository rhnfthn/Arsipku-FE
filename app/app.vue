<template>
  <UApp :toaster="toaster">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- <UNotifications /> -->
    <!-- <USelectMenu /> -->
  </UApp>
</template>

<script setup lang="ts">
// commit check: small code comment for local change
const toaster = { position: 'top-right' } as const
</script>

<style>
:root {
  --font-sans: "Montserrat", sans-serif;
}
</style>
