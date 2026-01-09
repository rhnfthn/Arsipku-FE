<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-[1400px] mx-auto space-y-8">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Naskah Masuk</h1>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- Table 1 - Monthly Summary -->
      <div
        class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
      >
        <div
          class="sticky top-0 z-40 bg-white flex flex-wrap justify-between items-center p-4 border-b border-gray-200 gap-3"
        >
          <div class="flex items-center gap-3 flex-wrap">
            <button
              @click="refreshData"
              class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <RotateCcw class="w-4 h-4" />
            </button>
            <select
              v-model="selectedType"
              class="bg-gray-100 rounded-lg px-4 py-2 text-sm"
            >
              <option value="">Semua Jenis</option>
              <option v-for="item in data" :key="item.id" :value="item.naskah">
                {{ item.naskah }}
              </option>
            </select>
            <select
              v-model="selectedMonth"
              class="bg-gray-100 rounded-lg px-4 py-2 text-sm"
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
              class="bg-gray-100 rounded-lg px-4 py-2 text-sm"
            >
              <option v-for="tahun in yearOptions" :key="tahun" :value="tahun">
                {{ tahun }}
              </option>
            </select>
          </div>
          <button
            class="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
            @click="exportTable1"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </button>
        </div>

        <div class="overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table class="w-full text-sm">
            <thead class="sticky top-0 z-30 bg-primary text-white">
              <tr>
                <th class="px-4 py-3 text-left font-semibold">Naskah</th>
                <template v-if="!selectedMonth">
                  <th
                    v-for="bulan in monthOptions"
                    :key="bulan.value"
                    class="px-4 py-3 text-center font-semibold"
                  >
                    {{ bulan.label }}
                  </th>
                </template>
                <template v-else>
                  <th class="px-4 py-3 text-center font-semibold">
                    {{ selectedMonthLabel }}
                  </th>
                </template>
                <th class="px-4 py-3 text-center font-semibold">Jumlah</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="row in filteredTableData"
                :key="row.id"
                class="hover:bg-blue-50 transition-colors"
              >
                <td class="px-4 py-3 text-gray-900 font-medium max-w-[350px]">
                  {{ row.naskah }}
                </td>
                <template v-if="!selectedMonth">
                  <td
                    v-for="bulan in monthOptions"
                    :key="bulan.value"
                    class="px-4 py-3 text-center text-gray-600"
                  >
                    {{ row[bulan.value] || "-" }}
                  </td>
                </template>
                <template v-else>
                  <td class="px-4 py-3 text-center text-gray-600">
                    {{ row[selectedMonth] || "-" }}
                  </td>
                </template>
                <td class="px-4 py-3 text-center font-bold text-gray-900">
                  {{ row.jumlah.toLocaleString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Table 2 - Detailed List -->
      <div
        class="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
      >
        <div class="p-4 border-b border-gray-200">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3 flex-wrap">
              <button
                @click="refreshData"
                class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <RotateCcw class="w-4 h-4" />
              </button>
              <select
                v-model="filters.jenis"
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm"
              >
                <option value="">Semua Jenis</option>
                <option value="ND">Nota Dinas</option>
                <option value="ST">Surat Tugas</option>
              </select>
              <select
                v-model="filters.lokasi"
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm"
              >
                <option value="">Semua Lokasi</option>
                <option v-for="lok in lokasiOptions" :key="lok" :value="lok">
                  {{ lok }}
                </option>
              </select>
              <select
                v-model="filters.status"
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm"
              >
                <option value="">Semua Status</option>
                <option value="Terpakai">Terpakai</option>
                <option value="booking">Booking</option>
                <option value="Hangus">Hangus</option>
              </select>
              <select
                v-model="filters.tahun"
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm"
              >
                <option value="">Semua Tahun</option>
                <option
                  v-for="tahun in tahunOptions"
                  :key="tahun"
                  :value="tahun"
                >
                  {{ tahun }}
                </option>
              </select>
            </div>
            <button
              class="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
              @click="exportTable2"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </button>
          </div>

          <!-- <div class="relative mt-4">
            <svg
              class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari perihal / nomor..."
              class="w-full bg-gray-50 border border-gray-200 text-sm pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div> -->
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-primary text-white">
              <tr>
                <th
                  v-for="col in [
                    'naskah',
                    'nomor',
                    'tanggal',
                    'perihal',
                    'jabatan',
                    'lokasi',
                    'status',
                  ]"
                  :key="col"
                  @click="handleSort(col)"
                  class="px-4 py-3 text-left font-semibold cursor-pointertransition-colors"
                >
                  <div class="flex items-center gap-2">
                    <span>{{
                      col.charAt(0).toUpperCase() + col.slice(1)
                    }}</span>
                    <div class="flex flex-col">
                      <svg
                        class="w-3 h-3 -mb-1"
                        :class="
                          sortConfig.key === col &&
                          sortConfig.direction === 'asc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                        />
                      </svg>
                      <svg
                        class="w-3 h-3"
                        :class="
                          sortConfig.key === col &&
                          sortConfig.direction === 'desc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        />
                      </svg>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="item in paginatedData"
                :key="item.id"
                class="hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 py-3 text-gray-900">{{ item.jenis }}</td>
                <td class="px-4 py-3 text-gray-600 font-mono">
                  {{ item.nomor }}
                </td>
                <td class="px-4 py-3 text-gray-600">{{ item.tanggal }}</td>
                <td class="px-4 py-3 text-gray-900 max-w-xs">
                  {{ item.perihal }}
                </td>
                <td class="px-4 py-3 text-gray-600">{{ item.jabatan }}</td>
                <td class="px-4 py-3 text-gray-600">{{ item.lokasi }}</td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex px-3 py-1 rounded-full text-xs font-medium"
                    :class="getStatusClass(item.status)"
                  >
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="totalItems > 0"
          class="flex items-center justify-between px-6 py-4 border-t border-gray-200"
        >
          <div class="text-xs text-gray-600">
            Menampilkan {{ currentItemsCount }} dari {{ totalItems }} data
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              :class="[
                'flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-lg transition-all',
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-primary-600 border border-primary-600 hover:bg-blue-50',
              ]"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <div class="flex items-center gap-1">
              <button
                v-if="paginationPages[0] > 1"
                @click="currentPage = 1"
                class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-white border border-gray-300 hover:bg-blue-50 hover:text-primary-600 transition-all"
              >
                1
              </button>
              <span v-if="paginationPages[0] > 2" class="px-2 text-gray-400"
                >...</span
              >
              <button
                v-for="page in paginationPages"
                :key="page"
                @click="currentPage = page"
                :class="[
                  'w-8 h-8 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                  currentPage === page
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-primary-600',
                ]"
              >
                {{ page }}
              </button>
              <span
                v-if="
                  paginationPages[paginationPages.length - 1] < totalPages - 1
                "
                class="px-2 text-gray-400"
                >...</span
              >
              <button
                v-if="paginationPages[paginationPages.length - 1] < totalPages"
                @click="currentPage = totalPages"
                class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-white border border-gray-300 hover:bg-blue-50 hover:text-primary-600 transition-all"
              >
                {{ totalPages }}
              </button>
            </div>
            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              :class="[
                'flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-lg transition-all',
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-primary-600 border border-primary-600 hover:bg-blue-50',
              ]"
            >
              Next
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { RotateCcw } from "lucide-vue-next";
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Naskah Masuk", to: "/admin/laporan/naskah-masuk" },
];
const data = ref([
  {
    id: 1,
    naskah: "Surat Dinas Eksternal",
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
    naskah: "Surat Undangan",
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

const data2 = ref([
  {
    id: 1,
    nomor: "ND-001/SSF/KEU/III/2025",
    tanggal: "03/03/2025",
    perihal: "Persetujuan Proses Pembayaran Biaya Pegawai",
    jabatan: "Manager of Finance",
    lokasi: "Airnav Maintenance Facility",
    status: "Terpakai",
    jenis: "ND",
  },
  {
    id: 2,
    nomor: "ST-002/SSF/KEU/III/2024",
    tanggal: "03/03/2024",
    perihal: "Pengajuan Dana Operasional Kantor Cabang Jakarta",
    jabatan: "Manager of HC Admin and General Affairs",
    lokasi: "Jakarta Pusat",
    status: "booking",
    jenis: "ST",
  },
  {
    id: 3,
    nomor: "ND-003/SSF/KEU/III/2023",
    tanggal: "03/03/2023",
    perihal: "Penggantian Biaya Pembelian",
    jabatan: "Manager of HC Admin and General Affairs",
    lokasi: "Jakarta Pusat",
    status: "Hangus",
    jenis: "ND",
  },
]);

const selectedType = ref("");
const selectedMonth = ref("");
const selectedYear = ref(2025);
const filters = ref({
  jenis: "",
  lokasi: "",
  status: "",
  tahun: "",
  search: "",
});
const sortConfig = ref<{ key: string | null; direction: "asc" | "desc" }>({
  key: null,
  direction: "asc",
});
const currentPage = ref(1);
const itemsPerPage = ref(10);

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

const selectedMonthLabel = computed(
  () => monthOptions.find((m) => m.value === selectedMonth.value)?.label ?? "",
);

const yearOptions = computed(() => {
  const years = new Set<number>();
  data.value.forEach((d) => d.years.forEach((y) => years.add(y.tahun)));
  return Array.from(years).sort((a, b) => b - a);
});

const lokasiOptions = computed(() => [
  ...new Set(data2.value.map((d) => d.lokasi)),
]);

const tahunOptions = computed(() =>
  [...new Set(data2.value.map((d) => d.tanggal.split("/")[2]))].sort(
    (a, b) => Number(b) - Number(a),
  ),
);

const filteredTableData = computed(() => {
  return data.value
    .filter((item) => !selectedType.value || item.naskah === selectedType.value)
    .map((item) => {
      const yearData = item.years.find((y) => y.tahun === selectedYear.value);
      if (!yearData) return null;

      const totalJumlah = Object.entries(yearData)
        .filter(([key, val]) => typeof val === "number" && key !== "tahun")
        .reduce((acc, [, val]) => acc + val, 0);

      return {
        id: item.id,
        naskah: item.naskah,
        ...yearData,
        jumlah: totalJumlah,
      };
    })
    .filter(Boolean);
});

const filteredData = computed(() => {
  return data2.value.filter((item) => {
    const tahunItem = item.tanggal.split("/")[2];
    return (
      (!filters.value.jenis || item.jenis === filters.value.jenis) &&
      (!filters.value.lokasi || item.lokasi === filters.value.lokasi) &&
      (!filters.value.status || item.status === filters.value.status) &&
      (!filters.value.tahun || tahunItem === filters.value.tahun) &&
      (!filters.value.search ||
        Object.values(item)
          .join(" ")
          .toLowerCase()
          .includes(filters.value.search.toLowerCase()))
    );
  });
});

const sortedData = computed(() => {
  if (!sortConfig.value.key) return filteredData.value;
  return [...filteredData.value].sort((a, b) => {
    const aVal = a[sortConfig.value.key];
    const bVal = b[sortConfig.value.key];
    if (aVal < bVal) return sortConfig.value.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.value.direction === "asc" ? 1 : -1;
    return 0;
  });
});

const totalItems = computed(() => sortedData.value.length);
const totalPages = computed(() =>
  Math.ceil(totalItems.value / itemsPerPage.value),
);
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return sortedData.value.slice(start, start + itemsPerPage.value);
});
const currentItemsCount = computed(() => paginatedData.value.length);

const paginationPages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

watch(
  [() => filters.value, () => sortConfig.value],
  () => {
    currentPage.value = 1;
  },
  { deep: true },
);

watch(totalPages, (val) => {
  if (currentPage.value > val) currentPage.value = val || 1;
});

const handleSort = (key: string) => {
  sortConfig.value = {
    key,
    direction:
      sortConfig.value.key === key && sortConfig.value.direction === "asc"
        ? "desc"
        : "asc",
  };
};

const getStatusClass = (status: string) => {
  if (status === "Terpakai") return "bg-green-100 text-green-700";
  if (status === "booking") return "bg-primary-100 text-blue-700";
  return "bg-red-100 text-red-700";
};

const refreshData = () => {
  selectedMonth.value = "";
  selectedType.value = "";
  selectedYear.value = 2025;
  filters.value = { jenis: "", lokasi: "", status: "", tahun: "", search: "" };
  sortConfig.value = { key: null, direction: "asc" };
  currentPage.value = 1;
};

const exportTable1 = () => {
  const headers = ["Naskah"];
  if (!selectedMonth.value) {
    headers.push(...monthOptions.map((m) => m.label));
  } else {
    headers.push(selectedMonthLabel.value);
  }
  headers.push("Jumlah");

  const rows = filteredTableData.value.map((row) => {
    const data = [row.naskah];
    if (!selectedMonth.value) {
      monthOptions.forEach((m) => data.push(row[m.value] || "0"));
    } else {
      data.push(row[selectedMonth.value] || "0");
    }
    data.push(row.jumlah.toString());
    return data;
  });

  const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `naskah-masuk-summary-${selectedYear.value}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportTable2 = () => {
  const headers = [
    "Jenis",
    "Nomor",
    "Tanggal",
    "Perihal",
    "Jabatan",
    "Lokasi",
    "Status",
  ];
  const rows = sortedData.value.map((item) => [
    item.jenis,
    item.nomor,
    item.tanggal,
    item.perihal,
    item.jabatan,
    item.lokasi,
    item.status,
  ]);

  const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "naskah-masuk-detail.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>
