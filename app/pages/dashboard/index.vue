<template>
  <div class="space-y-6">
    <UAlert v-if="error" icon="i-heroicons-exclamation-triangle" color="red" variant="solid" title="Terjadi Kesalahan"
      :description="error" :close-button="{
        icon: 'i-heroicons-x-mark-20-solid',
        color: 'white',
        variant: 'link',
        padded: false,
      }" @close="error = null" />

    <div v-if="isLoading && !dashboardData" class="space-y-6 animate-pulse">

      <div
        class="w-full h-64 rounded-3xl shadow-sm bg-gray-100 dark:bg-gray-800 flex items-center px-10 relative overflow-hidden">
        <div class="flex flex-col space-y-3 z-10">
          <USkeleton class="h-9 w-64 sm:w-96 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <USkeleton class="h-5 w-48 sm:w-72 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UCard v-for="i in 4" :key="i" :ui="cardUI">
          <div class="flex justify-between items-start pl-2">
            <div class="space-y-2">
              <USkeleton class="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
              <USkeleton class="h-8 w-16 bg-gray-200 dark:bg-gray-700" />
            </div>
            <USkeleton class="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
          </div>
        </UCard>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <UCard :ui="cardUI" class="w-full lg:w-[600px]">
          <template #header>
            <USkeleton class="h-6 w-32 bg-gray-200 dark:bg-gray-700" />
          </template>
          <div class="mb-5 flex items-end justify-between space-x-2 h-[200px] px-2">
            <USkeleton class="w-full h-[40%] bg-gray-200 dark:bg-gray-700 rounded-t" />
            <USkeleton class="w-full h-[70%] bg-gray-200 dark:bg-gray-700 rounded-t" />
            <USkeleton class="w-full h-[50%] bg-gray-200 dark:bg-gray-700 rounded-t" />
            <USkeleton class="w-full h-[80%] bg-gray-200 dark:bg-gray-700 rounded-t" />
            <USkeleton class="w-full h-[60%] bg-gray-200 dark:bg-gray-700 rounded-t" />
          </div>
        </UCard>

        <UCard :ui="cardUI" class="w-full lg:w-[600px]">
          <template #header>
            <div class="flex items-center justify-between">
              <USkeleton class="h-6 w-40 bg-gray-200 dark:bg-gray-700" />
              <USkeleton class="h-5 w-20 bg-gray-200 dark:bg-gray-700" />
            </div>
          </template>
          <div class="flex flex-col gap-4">
            <div v-for="j in 3" :key="j" class="flex items-center gap-3">
              <USkeleton class="h-14 w-1.5 rounded-l-full bg-gray-200 dark:bg-gray-700 shrink-0" />
              <div class="flex-1 space-y-2">
                <div class="flex justify-between">
                  <USkeleton class="h-4 w-32 bg-gray-200 dark:bg-gray-700" />
                  <USkeleton class="h-3 w-10 bg-gray-200 dark:bg-gray-700" />
                </div>
                <USkeleton class="h-3 w-3/4 bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <template v-else>
      <div class="relative w-full h-64 flex items-center transition-all group mb-8">
        <div
          class="absolute inset-0 bg-gradient-to-br from-primary-100 from-45% to-primary dark:from-primary-800 dark:to-primary-600 rounded-3xl shadow-md overflow-hidden -z-10 dark:border dark:border-primary-800/50">
        </div>
        <div class="relative z-10 flex flex-col px-10 max-w-lg">
          <Heading variant="heading6b" class="text-primary-600">
            Halo, {{ formatName(user?.nama) }}
          </Heading>
          <Heading variant="heading9m" class="mt-1 text-primary-400">
            Semoga hari anda menyenangkan
          </Heading>
        </div>
        <img src="/dashboard.png"
          class="absolute -right-6 -bottom-8 h-60 w-auto object-contain opacity-90 animate-float z-20 pointer-events-none"
          alt="Dashboard Decoration" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UCard v-for="(stat, idx) in stats" :key="idx" :ui="cardUI">
          <div :class="`absolute left-0 top-0 h-full w-1 ${stat.borderColor}`"></div>

          <div class="flex justify-between items-start pl-2">
            <div>
              <p class="text-sm text-gray-500">{{ stat.label }}</p>
              <Heading variant="heading6b" :class="`text-3xl font-bold mt-1 ${stat.iconColor}`">
                {{ stat.value }}
              </Heading>
            </div>

            <div :class="`p-3 rounded-lg flex items-center ${stat.bgSolid} dark:bg-gray-700`">
              <UIcon :name="stat.icon" :class="`w-7 h-7 ${stat.iconColor}`" />
            </div>
          </div>
        </UCard>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <UCard :ui="cardUI" class="w-full lg:w-[600px]">
          <template #header>
            <div class="flex items-center justify-between">
              <Heading variant="heading9sb" class="font-semibold">Statistik Surat</Heading>
            </div>
          </template>
          <div class="mb-5">
            <canvas id="chart" height="200"></canvas>
          </div>
        </UCard>

        <UCard :ui="cardUI" class="w-full lg:w-[600px]">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900 dark:text-white">
                Surat Masuk Terbaru
              </h3>
              <UButton to="/korespondensi/kotak-masuk" size="xs" color="primary" variant="ghost"
                trailing-icon="i-heroicons-arrow-right">
                Lihat Semua
              </UButton>
            </div>
          </template>

          <div v-if="recentMails.length === 0" class="flex items-center justify-center h-72">
          </div>
          <div v-else
            class="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 pr-1 flex flex-col gap-2">
            <div v-for="mail in recentMails" :key="mail.id"
              class="py-1 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-xl cursor-pointer group">

              <div class="h-14 w-1.5 border-l-[3px] border-primary rounded-l-full shrink-0"></div>

              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline">
                  <h4 class="text-base text-gray-900 dark:text-gray-100 truncate font-normal leading-none">
                    {{ mail.pengirim_nama }}
                  </h4>
                  <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap mx-2">
                    {{ mail.waktu_relatif }}
                  </span>
                </div>

                <p class="text-sm text-gray-500 dark:text-gray-400 truncate mt-1.5 leading-tight">
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
import { onMounted, watch } from "vue";
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

// --- UI CONFIG ---
const cardUI = {
  root: 'rounded-xl ring-0 shadow-sm bg-white dark:bg-gray-800 print:hidden transition-colors relative overflow-hidden',
  header: { padding: 'px-5 py-4 sm:px-6' },
  body: { padding: 'p-5 sm:p-6' },
  divide: 'divide-y divide-gray-100 dark:divide-gray-700'
};

// --- HELPER FUNCTION ---
// Mengubah "BUDI SANTOSO" menjadi "Budi Santoso"
const formatName = (name: string | undefined) => {
  if (!name) return "User";
  return name.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

// ... (Sisa kode script Chart.js dan onMounted tetap SAMA seperti sebelumnya) ...
let chartInstance: any = null;

const initChart = async () => {
  // ... Copy logika initChart dari kode anda sebelumnya ...
  const data = chartData.value;
  if (!data.labels.length) return;

  try {
    const chartJs = await import("chart.js/auto");
    const Chart = chartJs.default;
    const ctx = document.getElementById("chart") as HTMLCanvasElement;
    if (!ctx) return;
    if (chartInstance) chartInstance.destroy();

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
            borderColor: "#3B82F6",
            backgroundColor: "#3B82F6",
          },
          {
            label: "Surat Terkirim",
            data: data.suratTerkirim,
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 4,
            borderColor: "#10B981",
            backgroundColor: "#10B981",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
  } catch (err) {
    console.error(err);
  }
};

watch(dashboardData, async (newData) => {
  if (newData?.statistik) await initChart();
});

onMounted(async () => {
  if (!user.value) await getProfile();
  if (user.value?.position) {
    await fetchDashboardData(user.value.position);
    if (dashboardData.value?.statistik) await initChart();
  } else {
    error.value = "Position ID tidak ditemukan. Silakan login ulang.";
  }
});
</script>

<style scoped>
/* Keyframes untuk animasi naik turun */
@keyframes float {
  0% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-10px);
  }

  /* Bergerak ke atas 10px */
  100% {
    transform: translateY(0px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Custom scrollbar */
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
