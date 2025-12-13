<template>
  <div class="space-y-6">
    <!-- HERO -->
    <div
      class="relative w-full h-64 bg-gradient-to-r from-primary-50 to-primary rounded-3xl shadow-md flex items-center px-10 overflow-hidden"
    >
      <div class="flex flex-col z-10">
        <Heading variant="heading6b" class="text-primary-600"
          >Halo, Ivan</Heading
        >
        <Heading variant="heading9m" class="mt-1 text-primary-400"
          >Semoga hari anda menyenangkan</Heading
        >
      </div>

      <!-- Pesawat Membesar Keluar Card -->
    </div>
    <img
      src="/dashboard.png"
      class="absolute right-0 bottom-0 top-18 h-70 translate-x-0 translate-y-6 opacity-90"
    />

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
              >{{ stat.value }}</Heading
            >
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
          <Heading variant="heading9sb" class="font-semibold"
            >Statistik Surat</Heading
          >
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
          class="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800"
        >
          <div
            v-for="mail in recentMails"
            :key="mail.id"
            class="py-4 flex items-center gap-4 hover:bg-gray-50 transition rounded-lg cursor-pointer"
          >
            <div :class="`w-1 h-12 rounded-full ${mail.accentColor}`"></div>

            <div class="flex-1">
              <div class="flex justify-between">
                <p class="font-semibold truncate">{{ mail.sender }}</p>
                <span class="text-xs text-gray-400">{{ mail.date }}</span>
              </div>
              <p class="text-sm text-gray-500 truncate">{{ mail.subject }}</p>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

// 🚀 Import Chart.js secara aman (hindari SSR error)
let Chart: any;
onMounted(async () => {
  const chartJs = await import("chart.js/auto");
  Chart = chartJs.default;

  const ctx = document.getElementById("chart") as HTMLCanvasElement;

  new Chart(ctx, {
    type: "line",
    data: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ],

      datasets: [
        {
          label: "Surat Masuk",
          data: [12, 18, 9, 30, 22, 15, 11, 5, 10, 20, 30],
          borderWidth: 2,
          tension: 0.4,
          pointStyle: "circle",
          borderColor: "#3B82F6",
          backgroundColor: "#3B82F6",
        },
        {
          label: "Surat Terkirim",
          data: [5, 8, 6, 12, 9, 21, 15, 11, 15, 30, 20],
          borderWidth: 2,
          tension: 0.4,
          pointStyle: "circle",
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
          position: "top",
          align: "start",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 10,
            padding: 15,
          },
          title: {
            padding: 20,
          },
        },

        layout: {
          padding: {
            top: 20,
          },
        },
      },
    },
  });
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

// --- STAT CARDS ---
const stats = [
  {
    label: "Surat Masuk",
    value: "40",
    icon: "i-heroicons-inbox",
    bgSolid: "bg-blue-100",
    borderColor: "bg-blue-500",
    iconColor: "text-blue-600",
  },
  {
    label: "Terkirim",
    value: "156",
    icon: "i-heroicons-paper-airplane",
    bgSolid: "bg-green-100",
    borderColor: "bg-green-500",
    iconColor: "text-green-600",
  },
  {
    label: "Draft Tersimpan",
    value: "2",
    icon: "i-heroicons-document",
    bgSolid: "bg-purple-100",
    borderColor: "bg-purple-500",
    iconColor: "text-purple-600",
  },
  {
    label: "perlu diTandatangan",
    value: "5",
    icon: "i-lucide-signature",
    bgSolid: "bg-yellow-100",
    borderColor: "bg-yellow-500",
    iconColor: "text-yellow-600",
  },
];

// --- SURAT MASUK TERBARU ---
const recentMails = [
  {
    id: 1,
    sender: "Kementerian Dalam Negeri",
    subject: "Undangan Rapat Koordinasi Nasional Smart City",
    date: "10:42",
    accentColor: "bg-orange-500",
  },
  {
    id: 3,
    sender: "Dinas Kesehatan",
    subject: "Laporan Bulanan Kesehatan Pegawai",
    date: "Kemarin",
    accentColor: "bg-green-500",
  },
  {
    id: 4,
    sender: "CV Maju Mundur",
    subject: "Invoice Pengadaan ATK Bulan November",
    date: "Kemarin",
    accentColor: "bg-gray-400",
  },
  {
    id: 5,
    sender: "Kementerian Dalam Negeri",
    subject: "Undangan Rapat Koordinasi Nasional Smart City",
    date: "10:42",
    accentColor: "bg-orange-500",
  },
  {
    id: 6,
    sender: "Dinas Kesehatan",
    subject: "Laporan Bulanan Kesehatan Pegawai",
    date: "Kemarin",
    accentColor: "bg-green-500",
  },
  {
    id: 7,
    sender: "CV Maju Mundur",
    subject: "Invoice Pengadaan ATK Bulan November",
    date: "Kemarin",
    accentColor: "bg-gray-400",
  },
];
</script>
