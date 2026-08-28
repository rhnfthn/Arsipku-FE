<template>
  <SdeMasalWizard :parent-naskah-id="parentNaskahId" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SdeMasalWizard from '~/components/korespondensi/sde-masal/SdeMasalWizard.vue';

definePageMeta({ middleware: ['auth', 'sde-masal-bod'] });

const route = useRoute();
const parentNaskahId = computed(() => (route.query.parentNaskahId as string) || '');
</script>
