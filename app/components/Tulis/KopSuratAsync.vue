<template>
  <component :is="TulisKopSurat" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const TulisKopSurat = defineAsyncComponent(() => import('./KopSurat.vue'))
</script>
