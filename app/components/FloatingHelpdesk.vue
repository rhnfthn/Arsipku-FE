<template>
  <div class="fixed bottom-6 right-6 z-[95] flex flex-col items-end gap-3">
    <!-- Tooltip card (shown on hover) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2 scale-95"
      leave-active-class="transition-all duration-200 ease-in"
      leave-to-class="opacity-0 translate-y-2 scale-95"
    >
      <div
        v-if="showTooltip"
        class="hidden sm:block absolute bottom-16 right-0 w-64 rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden"
      >
        <!-- Header gradient -->
        <div class="bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3">
          <div class="flex items-center gap-2">
            <Icon name="i-lucide-headset" class="w-5 h-5 text-white" />
            <span class="text-white font-semibold text-sm">Helpdesk AirNav</span>
          </div>
        </div>
        <!-- Body -->
        <div class="px-4 py-3">
          <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            Butuh bantuan? Hubungi tim Helpdesk AirNav Indonesia untuk dukungan teknis dan informasi.
          </p>
          <div class="mt-2 flex items-center gap-1.5 text-[11px] text-primary-600 dark:text-primary-400 font-medium">
            <Icon name="i-lucide-external-link" class="w-3.5 h-3.5" />
            <span>Klik untuk buka portal helpdesk</span>
          </div>
        </div>
        <!-- Arrow pointer -->
        <div
          class="absolute -bottom-2 right-6 w-4 h-4 bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 rotate-45"
        ></div>
      </div>
    </Transition>

    <!-- Floating button -->
    <a
      href="http://172.20.16.116:3014/"
      target="_blank"
      rel="noopener noreferrer"
      class="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group"
      @mouseenter="showTooltip = true"
      @mouseleave="showTooltip = false"
      title="Helpdesk AirNav"
    >
      <!-- Icon with bounce on hover -->
      <Icon
        name="i-lucide-headset"
        class="w-7 h-7 shrink-0 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
      />
    </a>
  </div>
</template>

<script setup lang="ts">
const showTooltip = ref(false);
</script>