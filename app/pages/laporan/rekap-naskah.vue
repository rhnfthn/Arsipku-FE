<template>
  <div class="flex flex-wrap justify-between">
    <div class="items-center justify-between w-full mb-5">
      <Heading variant="heading6b" class="text-mobile-md">
        Rekap Naskah Dinas
      </Heading>
      <PageHeader :items="breadcrumbs" />
    </div>
  </div>

  <div
    class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white"
  >
    <div class="sticky top-0 z-40 bg-white flex-wrap flex justify-between p-3">
      <div class="flex flex-wrap gap-3">
        <!-- Refresh -->
        <button
          @click="refreshData"
          class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <!-- JENIS NASKAH -->
        <div class="relative">
          <button
            @click="toggle('type')"
            class="rounded-md p-2 text-sm bg-gray-100 flex items-center gap-2 min-w-[100px]"
          >
            <span>{{ selectedType || "Semua Jenis" }}</span>
            <ChevronDown class="w-4 h-4 ml-auto" />
          </button>

          <div
            v-if="openDropdown === 'type'"
            class="absolute z-[999] mt-1 bg-white rounded-lg shadow-md w-full max-h-60 overflow-y-auto"
          >
            <button
              @click="selectedType = ''"
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              Semua Jenis
            </button>
            <button
              v-for="item in data"
              :key="item.id"
              @click="selectedType = item.naskah"
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              {{ item.naskah }}
            </button>
          </div>
        </div>

        <!-- BULAN -->
        <div class="relative">
          <button
            @click="toggle('month')"
            class="rounded-md p-2 text-sm bg-gray-100 flex items-center gap-2 min-w-[100px]"
          >
            <span>{{ selectedMonthLabel || "Semua Bulan" }}</span>
            <ChevronDown class="w-4 h-4 ml-auto" />
          </button>

          <div
            v-if="openDropdown === 'month'"
            class="absolute z-[999] mt-1 bg-white rounded-lg shadow-md w-full max-h-60 overflow-y-auto"
          >
            <button
              @click="selectedMonth = ''"
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              Semua Bulan
            </button>
            <button
              v-for="bulan in monthOptions"
              :key="bulan.value"
              @click="selectedMonth = bulan.value"
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              {{ bulan.label }}
            </button>
          </div>
        </div>

        <!-- TAHUN -->
        <div class="relative">
          <button
            @click="toggle('year')"
            class="rounded-md p-2 text-sm bg-gray-100 flex items-center gap-2 min-w-[100px]"
          >
            <span>{{ selectedYear }}</span>
            <ChevronDown class="w-4 h-4 ml-auto" />
          </button>

          <div
            v-if="openDropdown === 'year'"
            class="absolute z-[999] mt-1 bg-white rounded-lg shadow-md w-full max-h-60 overflow-y-auto"
          >
            <button
              v-for="tahun in yearOptions"
              :key="tahun"
              @click="selectedYear = tahun"
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              {{ tahun }}
            </button>
          </div>
        </div>

        <!-- LOKASI -->
        <div class="relative">
          <button
            @click="toggle('lokasi')"
            class="rounded-md p-2 text-sm bg-gray-100 flex items-center gap-2 min-w-[100px]"
          >
            <span>{{ selectedLokasi || "Semua Lokasi" }}</span>
            <ChevronDown class="w-4 h-4 ml-auto" />
          </button>

          <div
            v-if="openDropdown === 'lokasi'"
            class="absolute z-[999] mt-1 bg-white rounded-lg shadow-md w-full max-h-60 overflow-y-auto"
          >
            <button
              @click="selectedLokasi = ''"
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              Semua Lokasi
            </button>
            <button
              v-for="lokasi in lokasiOptions"
              :key="lokasi"
              @click="selectedLokasi = lokasi"
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              {{ lokasi }}
            </button>
          </div>
        </div>

        <!-- STATUS -->
        <div class="relative">
          <button
            @click="toggle('status')"
            class="rounded-md p-2 text-sm bg-gray-100 flex items-center gap-2 min-w-[100px]"
          >
            <span>
              {{
                selectedStatuses.length === 0
                  ? "Semua Status"
                  : `${selectedStatuses.length} status dipilih`
              }}
            </span>
            <ChevronDown class="w-4 h-4 ml-auto" />
          </button>

          <div
            v-if="openDropdown === 'status'"
            class="absolute z-[999] p-2 bg-white text-sm mt-1 bg-whiterounded-lg shadow-md w-full max-h-60 overflow-y-auto"
          >
            <div class="flex flex-wrap gap-3">
              <button
                v-for="status in statusOptions"
                :key="status.value"
                @click="toggleStatus(status.value)"
                class="text-left text-sm transition-colors"
                :class="
                  selectedStatuses.includes(status.value)
                    ? 'bg-primary-400 w-full text-white'
                    : 'hover:bg-gray-100'
                "
              >
                {{ status.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- EXPORT -->
      <button
        @click="exportExcel"
        class="flex items-center gap-2 mr-4 bg-primary text-white h-9 px-6 rounded-lg hover:bg-primary-800 transition-colors text-sm font-medium shadow-sm"
      >
        <FileDown class="w-4 h-4" />
        Export
      </button>
    </div>
    <div class="overflow-x-auto overflow-y-auto max-h-[70vh]">
      <table class="text-center">
        <thead class="sticky top-0 z-30 bg-primary-400">
          <tr class="bg-primary-400 text-white">
            <th
              class="px-4 py-3 border-b-2 font-semibold border-b-gray-100 font-medium text-sm w-[350px] text-start"
            >
              Naskah
            </th>
            <template v-if="!selectedMonth">
              <th
                v-for="bulan in monthOptions"
                :key="bulan.value"
                class="px-4 py-3 border-b-2 font-semibold border-b-gray-100 font-medium text-sm"
              >
                {{ bulan.label }}
              </th>
            </template>

            <template v-else>
              <th
                class="px-4 py-3 border-b-2 font-semibold border-b-gray-100 font-medium text-sm"
              >
                {{ selectedMonthLabel }}
              </th>
            </template>

            <th
              class="px-4 py-3 border-b-2 font-semibold border-b-gray-100 font-medium text-sm"
            >
              Jumlah
            </th>
            <th
              class="px-4 py-3 border-b-2 font-semibold border-b-gray-100 font-medium text-sm"
            >
              Status
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
            <!-- <td class="px-4 py-3 font-bold text-sm text-gray-900">
              {{ status.label }}
            </td> -->
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { FileDown, RotateCcw, ChevronDown } from "lucide-vue-next";
import { useToast } from "#imports";

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Rekap Naskah", to: "/admin/laporan/rekap-naskah" },
];
const getStatusClass = (status: string) => {
  if (status === "Terpakai") return "bg-green-100 text-green-700";
  if (status === "booking") return "bg-blue-100 text-blue-700";
  return "bg-red-100 text-red-700";
};
// const items = [
//   {
//     label: "Home",
//     to: "/admin/dashboard",
//   },
//   {
//     label: "Rekap Naskah",
//     to: "/admin/laporan/rekap-naskah",
//   },
// ] satisfies BreadcrumbItem[];

const selectedYear = ref(2025);
const selectedType = ref("");
const selectedMonth = ref("");
const selectedLokasi = ref("");
const selectedStatuses = ref<string[]>([]);
const isStatusOpen = ref(false);
const openDropdown = ref<null | string>(null);

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
    status: "Hangus",
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
  { label: "Hangus", value: "tidak terpakai" },
  { label: "Booking", value: "booking" },
];

const toggle = (key: string) => {
  openDropdown.value = openDropdown.value === key ? null : key;
};

const lokasiOptions = [
  "cabang jakarta",
  "cabang banten",
  "cabang bali",
  "cabang makasar",
];

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest(".relative")) {
    openDropdown.value = null;
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
