<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
      Aktivitas Harian (7 Hari Terakhir)
    </h3>

    <!-- Empty state: tidak ada data sama sekali atau semua 0 -->
    <div
      v-if="!summary || !summary.daily || summary.daily.length === 0 || allZero"
      class="text-center text-sm text-gray-400 py-8"
    >
      <UIcon name="i-lucide-bar-chart-3" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
      Belum ada aktivitas 7 hari terakhir
    </div>

    <!-- Bar chart (Chart.js) -->
    <div v-else class="relative h-56">
      <canvas ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Title,
} from 'chart.js';
import type { AuditSummary } from '~/types/audit';

// Register Chart.js components (tree-shakeable)
Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Title,
);

const props = defineProps<{
  summary: AuditSummary | null;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const allZero = computed(() => {
  if (!props.summary?.daily?.length) return true;
  return props.summary.daily.every((d) => d.count === 0);
});

const chartLabels = computed(() => {
  if (!props.summary?.daily) return [];
  return props.summary.daily.map((d) => formatDateShort(d.date));
});

const chartData = computed(() => {
  if (!props.summary?.daily) return [];
  return props.summary.daily.map((d) => d.count);
});

const formatDateShort = (date: string) => {
  try {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  } catch {
    return date;
  }
};

const buildChart = () => {
  if (!canvasRef.value) return;

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartLabels.value,
      datasets: [
        {
          label: 'Aktivitas',
          data: chartData.value,
          backgroundColor: '#457fb6',
          hoverBackgroundColor: '#3a6d9c',
          borderRadius: 6,
          borderSkipped: false,
          barPercentage: 0.7,
          categoryPercentage: 0.8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(31, 41, 55, 0.95)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 8,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            title: (items) => {
              const idx = items[0]?.dataIndex ?? 0;
              const raw = props.summary?.daily?.[idx];
              if (!raw) return '';
              const d = new Date(raw.date);
              return d.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              });
            },
            label: (item) => {
              const count = item.parsed.y ?? 0;
              return `${count} aktivitas`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#6b7280',
            font: { size: 11 },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(229, 231, 235, 0.5)',
          },
          ticks: {
            color: '#6b7280',
            font: { size: 11 },
            precision: 0,
            stepSize: 1,
          },
        },
      },
    },
  });
};

// Rebuild chart when data changes
watch(
  () => props.summary?.daily,
  async () => {
    await nextTick();
    if (!allZero.value) {
      buildChart();
    } else if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  },
  { deep: true },
);

onMounted(async () => {
  await nextTick();
  if (!allZero.value) {
    buildChart();
  }
});

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>