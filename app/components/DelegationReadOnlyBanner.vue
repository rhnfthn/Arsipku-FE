<template>
  <div
    v-if="isViewer"
    class="fixed top-0 left-0 w-full z-[95] h-11 flex items-center justify-center bg-amber-500/10 text-amber-700 dark:text-amber-300 border-b border-amber-500/30 px-4 text-center text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis"
  >
    Anda bertindak sebagai &nbsp;<strong>{{ activePositionStatusLabel }}</strong>&nbsp; — akses lihat saja
    (read-only). Aksi tulis/kirim/tandatangani dinonaktifkan.
  </div>
</template>

<script setup lang="ts">
const { isViewer, activePositionStatusLabel } = useDelegationMode();
</script>
