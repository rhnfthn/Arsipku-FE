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
      class="relative w-full h-64 bg-gradient-to-r from-primary-50 to-primary rounded-3xl shadow-md flex items-center px-10 overflow-hidden"
    >
      <div class="flex flex-col z-10">
        <Heading variant="heading6b" class="text-primary-600"
          >Halo, {{ user?.nama || "User" }}</Heading
        >
        <Heading variant="heading9m" class="mt-1 text-primary-400"
          >Semoga hari anda menyenangkan</Heading
        >
      </div>

      <!-- Pesawat Membesar Keluar Card -->
      <img
        src="/dashboard.png"
        class="absolute right-0 bottom-0 top-1 h-70 translate-x-0 translate-y-6 opacity-90"
        alt="Dashboard illustration"
      />
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading && !dashboardData"
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

    <!-- Dashboard Content -->
    <template v-else>
      <!-- STAT CARDS -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UCard
          v-for="(stat, idx) in stats"
          :key="idx"
          class="rounded-xl shadow-sm border border-gray-100 relative overflow-hidden"
        >
          <!-- Garis Samping -->
          <div
            :class="`absolute left-0 top-0 h-full w-1 ${stat.borderColor}`"
          ></div>

          <div class="flex justify-between items-start pl-2">
            <div>
              <p class="text-sm text-gray-500">{{ stat.label }}</p>
              <Heading
                variant="heading6b"
                class="text-3xl font-bold mt-1 text-primary"
              >
                {{ stat.value }}
              </Heading>
            </div>

            <div :class="`p-2 rounded-lg ${stat.bgSolid}`">
              <UIcon :name="stat.icon" :class="`w-7 h-6 ${stat.iconColor}`" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- STATISTIK & SURAT TERBARU -->
      <div class="flex flex-col lg:flex-row gap-6">
        <!-- GRAFIK -->
        <UCard
          class="rounded-xl shadow-sm border border-gray-100 w-full lg:w-[600px]"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <Heading variant="heading9sb" class="font-semibold"
                >Statistik Surat</Heading
              >
              <!-- Legend dengan bulet kecil -->
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span class="text-xs text-gray-600">Surat Masuk</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-green-500"></div>
                  <span class="text-xs text-gray-600">Surat Terkirim</span>
                </div>
              </div>
            </div>
          </template>

          <div class="mb-5">
            <canvas id="chart" height="200"></canvas>
          </div>
        </UCard>

        <!-- SURAT TERBARU -->
        <UCard :ui="cardUI" class="w-full lg:w-[600px] !border-0 !shadow-none">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900 dark:text-white">
                Surat Masuk Terbaru
              </h3>
              <UButton
                to="/admin/korespondensi/kotak-masuk"
                size="xs"
                color="primary"
                variant="ghost"
                trailing-icon="i-heroicons-arrow-right"
              >
                Lihat Semua
              </UButton>
            </div>
          </template>

          <div
            v-if="recentMails.length === 0"
            class="flex items-center justify-center h-72"
          >
            <div class="text-center">
              <UIcon
                name="i-heroicons-inbox"
                class="w-12 h-12 text-gray-300 mx-auto"
              />
              <p class="text-sm text-gray-500 mt-2">Tidak ada surat masuk</p>
            </div>
          </div>

          <div
            v-else
            class="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800"
          >
            <div
              v-for="mail in recentMails"
              :key="mail.id"
              class="py-4 flex items-center gap-4 hover:bg-gray-50 transition rounded-lg cursor-pointer px-2"
            >
              <div
                :class="`w-1 h-12 rounded-full ${getAccentColor(mail.jenis)}`"
              ></div>

              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start gap-2">
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold truncate text-sm">
                      {{ mail.pengirim_nama }}
                    </p>
                    <p class="text-xs text-gray-400 truncate">
                      {{ mail.pengirim_organization }}
                    </p>
                  </div>
                  <span class="text-xs text-gray-400 whitespace-nowrap">
                    {{ mail.waktu_relatif }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 truncate mt-1">
                  {{ mail.perihal }}
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>
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
