<script setup lang="ts">
const props = defineProps({
  variant: {
    type: String,
    default: 'body1'
  },
  as: {
    type: String,
    default: 'p'
  }
})

const appConfig = useAppConfig()
const classes = computed(() => {
  const variantClass = (appConfig.ui.typography.variants as Record<string, string>)[props.variant] || ''
  const base = appConfig.ui.typography.base
  return `${base} ${variantClass}`
})
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>
