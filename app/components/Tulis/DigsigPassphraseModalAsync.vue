<template>
  <component :is="TulisDigsigPassphraseModal" ref="modalRef" v-bind="$attrs" />
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, defineExpose } from 'vue'

const TulisDigsigPassphraseModal = defineAsyncComponent(() => import('./DigsigPassphraseModal.vue'))
const modalRef = ref(null)

defineExpose({
  setPassphraseError: (msg: string) => (modalRef.value as any)?.setPassphraseError?.(msg)
})
</script>
