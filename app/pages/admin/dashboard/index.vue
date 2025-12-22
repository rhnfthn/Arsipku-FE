<template>
  <div class="space-y-6">
    <!-- Error Alert -->
    <UAlert
      v-if="error"
      icon="i-heroicons-exclamation-triangle"
      color="red"
      variant="solid"
      title="Terjadi Kesalahan"
      :description="error"
      :close-button="{
        icon: 'i-heroicons-x-mark-20-solid',
        color: 'white',
        variant: 'link',
        padded: false,
      }"
      @close="error = null"
    />

    <!-- HERO -->
    <div
      class="relative w-full h-64 bg-gradient-to-r from-primary-50 to-primary rounded-3xl shadow-md flex items-center px-10 overflow-visible"
    >
      <div class="flex flex-col z-10">
        <Heading variant="heading6b" class="text-primary-600">
          Halo, {{ user?.nama || "User" }}
        </Heading>
        <Heading variant="heading9m" class="mt-1 text-primary-400">
          Semoga hari anda menyenangkan
        </Heading>
      </div>

      <!-- Pesawat keluar card -->
      <img
        src="/dashboard.png"
        class="absolute -right-5 bottom-0 h-72 translate-y-10 opacity-90 pointer-events-none"
        alt="Dashboard illustration"
      />
    </div>

    <!-- Loading State -->
    <div
      class="flex items-center justify-center py-20"
    >
      <div class="text-center">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-12 h-12 animate-spin text-primary mx-auto"
        />
        <p class="text-sm text-gray-500 mt-4">Memuat data dashboard...</p>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useDashboard } from "@/composables/useDashboard";

const { user, getProfile } = useAuth();
const {
  isLoading,
  error,
  stats,
  recentMails,
  chartData,
  fetchDashboardData,
  getAccentColor,
  dashboardData,
} = useDashboard();

// Chart instance
let chartInstance: any = null;

// 🚀 Initialize Chart.js
const initChart = async () => {
  const data = chartData.value;
  if (!data.labels.length) {
    console.log("⏭️ Skipping chart initialization: No data available");
    return;
  }

  try {
    const chartJs = await import("chart.js/auto");
    const Chart = chartJs.default;

    const ctx = document.getElementById("chart") as HTMLCanvasElement;
    if (!ctx) {
      console.error("❌ Chart canvas element not found");
      return;
    }

    // Destroy existing chart if any
    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Surat Masuk",
            data: data.suratMasuk,
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderColor: "#3B82F6",
            backgroundColor: "#3B82F6",
          },
          {
            label: "Surat Terkirim",
            data: data.suratTerkirim,
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderColor: "#10B981",
            backgroundColor: "#10B981",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });

    console.log("✅ Chart initialized successfully");
  } catch (err) {
    console.error("❌ Error initializing chart:", err);
  }
};

// Watch for dashboard data changes and reinitialize chart
watch(dashboardData, async (newData) => {
  if (newData?.statistik) {
    await initChart();
  }
});

onMounted(async () => {
  console.log("🚀 Dashboard mounted");

  // Get user profile if not already loaded
  if (!user.value) {
    console.log("📥 Fetching user profile...");
    await getProfile();
  }

  console.log("👤 Current user:", {
    nama: user.value?.nama,
    position: user.value?.position,
  });

  // Fetch dashboard data using position ID
  if (user.value?.position) {
    await fetchDashboardData(user.value.position);

    // Initialize chart after data is loaded
    if (dashboardData.value?.statistik) {
      await initChart();
    }
  } else {
    console.error("❌ User position not found");
    error.value = "Position ID tidak ditemukan. Silakan login ulang.";
  }
});

// --- UI CONFIG ---
const cardUI = {
  background: "bg-white dark:bg-gray-900",
  ring: "!ring-0",
  rounded: "rounded-xl",
  shadow: "",
  body: { padding: "p-5 sm:p-6" },
  header: { padding: "px-5 py-4 sm:px-6" },
};
</script>

<style scoped>
/* Custom scrollbar untuk surat masuk */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
