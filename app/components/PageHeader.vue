<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  // Route tujuan tombol back di samping judul (mis. halaman detail naskah).
  backTo: { type: String, default: '' },
});
</script>

<template>
  <div class="space-y-1 mb-5">
    <!-- TITLE -->
    <!-- <Heading variant="heading6sb" class="text-gray-900 dark:text-white"> -->
    <div v-if="title || $slots.title || backTo" class="flex flex-wrap items-center gap-3">
      <UTooltip v-if="backTo" text="Kembali">
        <UButton
          :to="backTo"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="outline"
          size="sm"
          class="rounded-full"
          aria-label="Kembali"
        />
      </UTooltip>
      <slot name="title">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {{ title }}
        </h1>
      </slot>
    </div>
    <div v-if="subtitle || $slots.subtitle" class="text-sm text-gray-500 dark:text-gray-400">
      <slot name="subtitle">{{ subtitle }}</slot>
    </div>

    <!-- BREADCRUMB -->
    <UBreadcrumb
      :items="items"
      :ui="{
        link: 'hover:text-primary transition-colors text-xs ',
        linkLeadingIcon: 'text-primary size-4',
        linkLabel: 'text-xs',
      }"
    >
      <!-- SEPARATOR -->
      <template #separator>
        <span class="mx-1.5 text-gray-400 dark:text-gray-600 text-xs">/</span>
      </template>

      <!-- DROPDOWN -->
      <template #dropdown="{ item }">
        <UDropdownMenu :items="item.children">
          <UButton :icon="item.icon" color="neutral" variant="ghost" size="xs" class="p-0.5" />
        </UDropdownMenu>
      </template>
    </UBreadcrumb>
  </div>
</template>
