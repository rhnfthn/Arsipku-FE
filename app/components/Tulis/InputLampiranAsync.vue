<template>
  <component :is="TulisInputLampiran" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const TulisInputLampiran = defineAsyncComponent(() => import('./InputLampiran.vue'))
</script>
