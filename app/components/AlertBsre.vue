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
        class="sticky top-0 left-0 right-10 bg-red-600 dark:bg-red-700 text-white px-6 py-3 shadow-lg flex items-center gap-4 z-[50]"
      >
        <!-- ICON -->
        <AlertTriangle class="w-5 h-5 flex-shrink-0" />

        <!-- MARQUEE CONTAINER -->
        <div class="relative overflow-hidden flex-1">
          <div class="animate-marquee whitespace-nowrap text-sm font-medium">
            <strong class="mr-2">PERHATIAN!</strong>
            {{
              bsreAlert.message ||
              "Sedang terjadi gangguan pada sistem BsrE (Balai Sertifikasi Elektronik)"
            }}
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

const { bsreAlert, fetchBsreAlert } = useDigsig();

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

// Fetch alert status saat component mounted
onMounted(async () => {
  await fetchBsreAlert();
  console.log("✅ Alert component mounted, status:", bsreAlert.value);
});

// Poll alert status setiap 30 detik untuk update real-time
const pollInterval = ref<NodeJS.Timeout | null>(null);

onMounted(() => {
  // Poll setiap 30 detik
  pollInterval.value = setInterval(async () => {
    await fetchBsreAlert();
  }, 30000); // 30 seconds
});

onBeforeUnmount(() => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value);
  }
});
</script>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.animate-marquee {
  display: inline-block;
  animation: marquee 15s linear infinite;
}
</style>
