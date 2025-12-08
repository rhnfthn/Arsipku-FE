<template>
  <UApp :toaster="toaster">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- <UNotifications /> -->
    <USelectMenu />
  </UApp>
</template>

<script setup lang="ts">
const toaster = { position: 'top-right' }
</script>

<style>
:root {
  --font-sans: "Montserrat", sans-serif;
}
</style>
