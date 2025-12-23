<template>
  <div class="mb-3 flex flex-wrap justify-between">
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <!-- Left Section - Title & Breadcrumb -->
      <PageHeader title="Rekap Naskah Dinas" :items="items" />
    </div>
  </div>
  <div
    class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white"
  >
    <div class="sticky top-0 z-40 bg-white flex-wrap flex justify-between p-3">
      <div class="flex flex-wrap gap-3">
        <button
          @click="refreshData"
          class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
        <select
          v-model="selectedType"
          class="rounded-md p-2 text-sm bg-gray-100"
        >
          <option value="">Semua Jenis</option>
          <option v-for="item in data" :key="item.id" :value="item.naskah">
            {{ item.naskah }}
          </option>
        </select>

        <select
          v-model="selectedMonth"
          class="rounded-md p-2 text-sm bg-gray-100"
        >
          <option value="">Semua Bulan</option>
          <option
            v-for="bulan in monthOptions"
            :key="bulan.value"
            :value="bulan.value"
          >
            {{ bulan.label }}
          </option>
        </select>

        <select
          v-model="selectedYear"
          class="rounded-md p-2 text-sm bg-gray-100"
        >
          <option v-for="tahun in yearOptions" :key="tahun" :value="tahun">
            {{ tahun }}
          </option>
        </select>

        <select
          v-model="selectedLokasi"
          class="rounded-md p-2 text-sm bg-gray-100"
        >
          <option value="">Semua Lokasi</option>
          <option value="cabang jakarta">Cabang Jakarta</option>
          <option value="cabang banten">Cabang Banten</option>
          <option value="cabang bali">Cabang Bali</option>
        </select>

        <div class="relative">
          <!-- Trigger (mirip select) -->
          <button
            type="button"
            @click="isStatusOpen = !isStatusOpen"
            class="rounded-md p-2 text-sm bg-gray-100 flex items-center gap-2 min-w-[180px]"
          >
            <span v-if="selectedStatuses.length === 0"> Semua Status </span>
            <span v-else> {{ selectedStatuses.length }} status dipilih </span>
          </button>

          <!-- Dropdown -->
          <div
            v-if="isStatusOpen"
            class="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-md p-3 w-[260px]"
          >
            <div class="flex flex-wrap gap-2">
              <button
                v-for="status in statusOptions"
                :key="status.value"
                type="button"
                @click="toggleStatus(status.value)"
                class="px-3 py-1 rounded-full text-xs transition-colors"
                :class="
                  selectedStatuses.includes(status.value)
                    ? 'bg-primary-400 text-white'
                    : 'bg-gray-100 text-gray-600'
                "
              >
                {{ status.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <button
          @click="exportExcel"
          class="flex items-center gap-2 bg-primary text-white h-8 px-6 rounded-lg hover:bg-primary-800 text-xs"
        >
          <FileDown class="w-4 h-4" />
          Export
        </button>
      </div>
    </div>

    <div class="overflow-x-auto overflow-y-auto max-h-[70vh]">
      <table class="text-center">
        <thead class="sticky top-0 z-30 bg-primary-400">
          <tr class="bg-primary-400 text-white">
            <th
              class="px-4 py-3 border-b-2 border-b-gray-100 font-medium text-sm w-[350px] text-start"
            >
              Naskah
            </th>
            <template v-if="!selectedMonth">
              <th
                v-for="bulan in monthOptions"
                :key="bulan.value"
                class="px-4 py-3 border-b-2 border-b-gray-100 font-medium text-sm"
              >
                {{ bulan.label }}
              </th>
            </template>

            <template v-else>
              <th
                class="px-4 py-3 border-b-2 border-b-gray-100 font-medium text-sm"
              >
                {{ selectedMonthLabel }}
              </th>
            </template>

            <th
              class="px-4 py-3 border-b-2 border-b-gray-100 font-medium text-sm"
            >
              Jumlah
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="row in filteredTableData"
            :key="row.id"
            class="hover:bg-blue-50"
          >
            <td
              class="px-4 py-3 text-sm text-start max-w-[350px] whitespace-nowrap overflow-x-visible"
            >
              {{ row.naskah }}
            </td>

            <template v-if="!selectedMonth">
              <td
                v-for="bulan in monthOptions"
                :key="bulan.value"
                class="px-4 py-3 text-sm"
              >
                {{ row[bulan.value] || "-" }}
              </td>
            </template>

            <template v-else>
              <td class="px-4 py-3 text-sm">
                {{ row[selectedMonth] || "-" }}
              </td>
            </template>

            <td class="px-4 py-3 font-bold text-sm text-gray-900">
              {{ row.jumlah }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { FileDown, RotateCcw } from "lucide-vue-next";
import { useToast } from "#imports";

const items = [
  {
    label: "Home",
    to: "/admin/dashboard",
  },
  {
    label: "Rekap Naskah",
    to: "/admin/laporan/rekap-naskah",
  },
] satisfies BreadcrumbItem[];

const selectedYear = ref(2025);
const selectedType = ref("");
const selectedMonth = ref("");
const selectedLokasi = ref("");
const selectedStatuses = ref<string[]>([]);
const isStatusOpen = ref(false);

const toast = useToast();

const exportExcel = () => {
  toast.add({
    title: "Berhasil!",
    description: "Data berhasil diexport testt",
    color: "success",
    icon: "i-lucide-check-circle",
  });
};

const data = ref([
  {
    id: 1,
    naskah: "Addendum Perjanjian",
    lokasi: "cabang jakarta",
    status: "terpakai",
    years: [
      {
        tahun: 2025,
        januari: 1552,
        februari: 1747,
        maret: 1616,
        april: 1383,
        mei: 1656,
        juni: 1547,
        juli: 97,
        agustus: 0,
        september: 1,
        oktober: 0,
        november: 1000,
        desember: 0,
      },
      {
        tahun: 2024,
        januari: 1200,
        februari: 1100,
        maret: 900,
        april: 800,
        mei: 950,
        juni: 1000,
        juli: 70,
        agustus: 5,
        september: 10,
        oktober: 0,
        november: 50,
        desember: 10,
      },
      {
        tahun: 2023,
        januari: 800,
        februari: 600,
        maret: 500,
        april: 450,
        mei: 400,
        juni: 350,
        juli: 40,
        agustus: 10,
        september: 0,
        oktober: 0,
        november: 0,
        desember: 5,
      },
    ],
  },
  {
    id: 2,
    naskah: "Addendum Surat Perintah Kerja (SPK) Pengadaan",
    lokasi: "cabang bali",
    status: "tidak terpakai",
    years: [
      {
        tahun: 2025,
        januari: 143,
        februari: 161,
        maret: 175,
        april: 196,
        mei: 179,
        juni: 152,
        juli: 7,
        agustus: 0,
        september: 0,
        oktober: 0,
        november: 0,
        desember: 0,
      },
      {
        tahun: 2024,
        januari: 200,
        februari: 240,
        maret: 180,
        april: 210,
        mei: 190,
        juni: 170,
        juli: 10,
        agustus: 0,
        september: 4,
        oktober: 3,
        november: 1,
        desember: 0,
      },
      {
        tahun: 2023,
        januari: 120,
        februari: 130,
        maret: 150,
        april: 100,
        mei: 90,
        juni: 80,
        juli: 10,
        agustus: 0,
        september: 0,
        oktober: 0,
        november: 3,
        desember: 1,
      },
    ],
  },
  {
    id: 3,
    naskah: "Berita Acara",
    lokasi: "cabang banten",
    status: "booking",
    years: [
      {
        tahun: 2025,
        januari: 143,
        februari: 161,
        maret: 175,
        april: 196,
        mei: 179,
        juni: 152,
        juli: 7,
        agustus: 0,
        september: 0,
        oktober: 0,
        november: 0,
        desember: 0,
      },
      {
        tahun: 2024,
        januari: 200,
        februari: 240,
        maret: 180,
        april: 210,
        mei: 190,
        juni: 170,
        juli: 10,
        agustus: 0,
        september: 4,
        oktober: 3,
        november: 1,
        desember: 0,
      },
      {
        tahun: 2023,
        januari: 120,
        februari: 130,
        maret: 150,
        april: 100,
        mei: 90,
        juni: 80,
        juli: 10,
        agustus: 0,
        september: 0,
        oktober: 0,
        november: 3,
        desember: 1,
      },
    ],
  },
  {
    id: 4,
    naskah: "Berita Acara Hasil Audit",
    lokasi: "cabang jakarta",
    status: "terpakai",
    years: [
      {
        tahun: 2025,
        januari: 143,
        februari: 161,
        maret: 175,
        april: 196,
        mei: 179,
        juni: 152,
        juli: 7,
        agustus: 0,
        september: 0,
        oktober: 0,
        november: 0,
        desember: 0,
      },
      {
        tahun: 2024,
        januari: 200,
        februari: 240,
        maret: 180,
        april: 210,
        mei: 190,
        juni: 170,
        juli: 10,
        agustus: 0,
        september: 4,
        oktober: 3,
        november: 1,
        desember: 0,
      },
      {
        tahun: 2023,
        januari: 120,
        februari: 130,
        maret: 150,
        april: 100,
        mei: 90,
        juni: 80,
        juli: 10,
        agustus: 0,
        september: 0,
        oktober: 0,
        november: 3,
        desember: 1,
      },
    ],
  },
  {
    id: 5,
    naskah: "Keputusan Direktur",
    lokasi: "cabang makasar",
    status: "tidak terpakai",
    years: [
      {
        tahun: 2025,
        januari: 143,
        februari: 161,
        maret: 175,
        april: 196,
        mei: 179,
        juni: 152,
        juli: 7,
        agustus: 0,
        september: 0,
        oktober: 0,
        november: 0,
        desember: 0,
      },
      {
        tahun: 2024,
        januari: 200,
        februari: 240,
        maret: 180,
        april: 210,
        mei: 190,
        juni: 170,
        juli: 10,
        agustus: 0,
        september: 4,
        oktober: 3,
        november: 1,
        desember: 0,
      },
      {
        tahun: 2023,
        januari: 120,
        februari: 130,
        maret: 150,
        april: 100,
        mei: 90,
        juni: 80,
        juli: 10,
        agustus: 0,
        september: 0,
        oktober: 0,
        november: 3,
        desember: 1,
      },
    ],
  },
]);

const monthOptions = [
  { label: "Januari", value: "januari" },
  { label: "Februari", value: "februari" },
  { label: "Maret", value: "maret" },
  { label: "April", value: "april" },
  { label: "Mei", value: "mei" },
  { label: "Juni", value: "juni" },
  { label: "Juli", value: "juli" },
  { label: "Agustus", value: "agustus" },
  { label: "September", value: "september" },
  { label: "Oktober", value: "oktober" },
  { label: "November", value: "november" },
  { label: "Desember", value: "desember" },
];

const statusOptions = [
  { label: "Terpakai", value: "terpakai" },
  { label: "Tidak Terpakai / Hangus", value: "tidak terpakai" },
  { label: "Booking", value: "booking" },
];

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest(".relative")) {
    isStatusOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const selectedMonthLabel = computed(() => {
  return monthOptions.find((m) => m.value === selectedMonth.value)?.label ?? "";
});

const toggleStatus = (status: string) => {
  if (selectedStatuses.value.includes(status)) {
    selectedStatuses.value = selectedStatuses.value.filter((s) => s !== status);
  } else {
    selectedStatuses.value.push(status);
  }
};

const filteredTableData = computed(() => {
  return data.value
    .filter(
      (item) =>
        (!selectedType.value || item.naskah === selectedType.value) &&
        (!selectedLokasi.value || item.lokasi === selectedLokasi.value) &&
        (selectedStatuses.value.length === 0 ||
          selectedStatuses.value.includes(item.status)),
    )
    .map((item) => {
      const yearData = item.years.find((y) => y.tahun === selectedYear.value);
      if (!yearData) return null;

      const totalJumlah = Object.values(yearData)
        .filter((v) => typeof v === "number")
        .reduce((acc, cur) => acc + cur, 0);

      return {
        id: item.id,
        naskah: item.naskah,
        ...yearData,
        jumlah: totalJumlah,
      };
    })
    .filter(Boolean);
});

const yearOptions = computed(() => {
  const years = new Set();
  data.value.forEach((d) => d.years.forEach((y) => years.add(y.tahun)));
  return Array.from(years).sort((a, b) => b - a);
});

const refreshData = () => {
  selectedMonth.value = "";
  selectedType.value = "";
  selectedLokasi.value = "";
  selectedStatuses.value = [];
  selectedYear.value = 2025;
};
</script>
