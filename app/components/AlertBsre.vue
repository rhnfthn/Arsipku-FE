<template>
  <!-- Global Alert Banner - Hanya muncul jika isActive = true -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-full"
    >
      <div
        v-if="showAlert"
        class="fixed top-0 left-0 right-0 bg-red-600 dark:bg-red-700 text-white px-6 py-3 shadow-lg flex items-center gap-4 z-[201]"
      >
        <!-- ICON -->
        <AlertTriangle class="w-5 h-5 flex-shrink-0" />

        <!-- MARQUEE CONTAINER -->
        <div class="relative overflow-hidden flex-1 h-5">
          <div class="animate-marquee whitespace-nowrap text-sm font-medium absolute left-0 top-0 h-full flex items-center">
            <span class="inline-flex items-center min-w-full justify-center px-12">
              <strong class="mr-2">PERHATIAN!</strong>
              {{
                bsreAlert?.message ||
                "Sedang terjadi gangguan pada sistem BsrE (Balai Sertifikasi Elektronik)"
              }}
            </span>
            <span class="inline-flex items-center min-w-full justify-center px-12">
              <strong class="mr-2">PERHATIAN!</strong>
              {{
                bsreAlert?.message ||
                "Sedang terjadi gangguan pada sistem BsrE (Balai Sertifikasi Elektronik)"
              }}
            </span>
            <span class="inline-flex items-center min-w-full justify-center px-12">
              <strong class="mr-2">PERHATIAN!</strong>
              {{
                bsreAlert?.message ||
                "Sedang terjadi gangguan pada sistem BsrE (Balai Sertifikasi Elektronik)"
              }}
            </span>
          </div>
        </div>

        <!-- CLOSE BUTTON -->
        <button
          @click="dismissAlert"
          class="flex-shrink-0 p-1 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition"
          aria-label="Tutup alert"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { AlertTriangle, X } from "lucide-vue-next";
import { useDigsig } from "~/composables/useDigsig";
import { useRealtimeSocket } from "~/composables/useRealtimeSocket";

const { bsreAlert } = useDigsig();
const { bsreAlert: rtBsreAlert } = useRealtimeSocket();

// Local state untuk dismiss
const isDismissed = ref(false);

// Computed untuk menentukan apakah alert harus ditampilkan
const showAlert = computed(() => {
  return bsreAlert.value?.isActive && !isDismissed.value;
});

// Alias untuk kemudahan akses
const alertData = computed(() => bsreAlert.value);

// Function untuk dismiss alert (hanya hide sementara, tidak permanent)
const dismissAlert = () => {
  isDismissed.value = true;
};

// Reset dismissed state ketika alert berubah status
watch(
  () => bsreAlert.value?.isActive,
  (newValue, oldValue) => {
    // Jika alert baru saja diaktifkan, reset dismissed state
    if (newValue === true && oldValue === false) {
      isDismissed.value = false;
    }
  },
);

// Sinkronkan bsreAlert dari WebSocket realtime event (bsre:alert / realtime:summary).
// Tidak lagi memanggil /dashboard/realtime — data berasal dari socket langsung.
watch(
  rtBsreAlert,
  (val) => {
    if (val) {
      bsreAlert.value = val;
    }
  },
  { deep: true, immediate: true },
);
</script>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-66.666%);
  }
}

.animate-marquee {
  display: inline-flex;
  animation: marquee 25s linear infinite;
}
</style>
