<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100"
      leave-to-class="opacity-0">

      <div v-if="loading"
        class="fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-br from-white/75 to-[#e8eff6]/75 dark:bg-gray-950/95 backdrop-blur-[2px]">

        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="w-[400px] h-[400px] rounded-full
            bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.6)_40%,transparent_70%)]
            dark:bg-none">
          </div>
        </div>

        <div class="relative flex flex-col items-center gap-6 z-10">

          <div class="relative flex items-center justify-center w-24 h-24">

            <div
              class="absolute inset-0 rounded-full border-4 border-transparent border-t-[#175fa4] border-r-[#749fc8] dark:border-t-blue-500 dark:border-r-blue-900 animate-spin"
              style="animation-duration: 1.5s;">
            </div>

            <div
              class="flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-gray-900 shadow-lg relative z-10">
              <div class="plane-float">
                <UIcon name="i-lucide-plane" class="w-8 h-8 text-[#175fa4] dark:text-blue-400 -rotate-45" />
              </div>
            </div>

          </div>

          <div class="flex flex-col items-center gap-2">
            <span class="text-gray-900 dark:text-white font-semibold text-lg">
              {{ message || 'Memproses Data' }}
            </span>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Mohon tunggu sebentar
            </span>
          </div>

        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
@keyframes planeFloat {

  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-8px);
  }
}

.plane-float {
  animation: planeFloat 2s ease-in-out infinite;
}
</style>
