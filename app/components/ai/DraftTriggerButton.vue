<template>
  <div
    class="ai-draft-strip group relative w-full overflow-hidden rounded-lg border border-primary-100 bg-primary-50/70 p-3 font-sans shadow-sm transition-all duration-200 hover:border-primary-200 hover:bg-primary-50"
  >
    <div class="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex min-w-0 items-center gap-3">
        <div
          class="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary-600 shadow-sm ring-1 ring-primary-100 transition-transform duration-200 group-hover:scale-105"
        >
          <UIcon name="i-lucide-sparkles" class="size-5" />
          <span
            class="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary-400 shadow-[0_0_0_4px_rgba(69,127,182,0.16)]"
          />
        </div>

        <div class="min-w-0">
          <p class="text-sm font-bold text-gray-900">{{ $t('ai_butuh_konsep_awal') }}</p>
          <p class="mt-0.5 text-xs leading-5 text-gray-600">
            {{ $t('ai_siap_bantu') }}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="ai-draft-action relative inline-flex min-h-10 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
        @click="$emit('click')"
      >
        <UIcon name="i-lucide-wand-sparkles" class="relative size-4" />
        <span class="relative whitespace-nowrap">{{ $t('ai_buat_draf') }}</span>
        <UIcon
          name="i-lucide-arrow-right"
          class="relative size-4 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'click'): void;
}>();
</script>

<style scoped>
.ai-draft-strip::before,
.ai-draft-action::before {
  content: '';
  position: absolute;
  inset: 0;
  width: 42%;
  transform: translateX(-135%) skewX(-18deg);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
  transition: transform 0.75s ease;
}

.ai-draft-strip::before {
  background: linear-gradient(90deg, transparent, rgba(69, 127, 182, 0.14), transparent);
}

.ai-draft-strip:hover::before,
.ai-draft-action:hover::before {
  transform: translateX(265%) skewX(-18deg);
}
</style>
