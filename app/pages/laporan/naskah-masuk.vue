<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-[1400px] mx-auto space-y-8">
      <!-- Header -->
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Naskah Masuk
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- Table 1 - Monthly Summary -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <button
                @click="refreshData"
                class="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                title="Refresh"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <select
                v-model="selectedType"
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm"
              >
                <option value="">Semua Jenis</option>
                <option
                  v-for="item in data"
                  :key="item.id"
                  :value="item.naskah"
                >
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
                <option
                  v-for="tahun in yearOptions"
                  :key="tahun"
                  :value="tahun"
                >
                  {{ tahun }}
                </option>
              </select>
            </div>
            <button
              class="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
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
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-primary text-white">
              <tr>
                <th class="px-6 py-4 text-left font-semibold text-sm">
                  Naskah
                </th>
                <template v-if="!selectedMonth">
                  <th
                    v-for="bulan in monthOptions"
                    :key="bulan.value"
                    class="px-6 py-4 text-center font-semibold text-sm"
                  >
                    {{ bulan.label }}
                  </th>
                </template>
                <template v-else>
                  <th class="px-6 py-4 text-center font-semibold text-sm">
                    {{ selectedMonthLabel }}
                  </th>
                </template>
                <th class="px-6 py-4 text-center font-semibold text-sm">
                  Jumlah
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="row in filteredTableData"
                :key="row.id"
                class="hover:bg-blue-50 transition-colors"
              >
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                  {{ row.naskah }}
                </td>
                <template v-if="!selectedMonth">
                  <td
                    v-for="bulan in monthOptions"
                    :key="bulan.value"
                    class="px-6 py-4 text-center text-sm text-gray-600"
                  >
                    {{ row[bulan.value] || "-" }}
                  </td>
                </template>
                <template v-else>
                  <td class="px-6 py-4 text-center text-sm text-gray-600">
                    {{ row[selectedMonth] || "-" }}
                  </td>
                </template>
                <td
                  class="px-6 py-4 text-center text-sm font-bold text-gray-900"
                >
                  {{ row.jumlah.toLocaleString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Table 2 - Detailed List -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3 flex-wrap">
              <button
                @click="refreshData"
                class="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                title="Refresh"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
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
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
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
                  class="px-6 py-4 text-left font-semibold text-sm cursor-pointer hover:bg-primary-700 transition-colors select-none"
                >
                  <div class="flex items-center gap-1">
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
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ item.naskah }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 font-mono">
                  {{ item.nomor }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ item.tanggal }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  {{ item.perihal }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ item.jabatan }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ item.lokasi }}
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex px-3 py-1 rounded-full text-xs font-medium"
                    :class="getStatusClass(item.status)"
                    >{{ item.status }}</span
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="totalItems > 0"
          class="flex items-center justify-between px-6 py-4 border-t border-gray-200"
        >
          <div class="text-sm text-gray-600">
            Menampilkan {{ currentItemsCount }} dari {{ totalItems }} data
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              :class="[
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-blue-600 border border-primary hover:bg-blue-50',
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
                class="w-8 h-8 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                1
              </button>
              <span
                v-if="paginationPages[0] > 2"
                class="px-2 text-gray-400 text-sm"
                >...</span
              >
              <button
                v-for="page in paginationPages"
                :key="page"
                @click="currentPage = page"
                :class="[
                  'w-8 h-8 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                  currentPage === page
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600',
                ]"
              >
                {{ page }}
              </button>
              <span
                v-if="
                  paginationPages[paginationPages.length - 1] < totalPages - 1
                "
                class="px-2 text-gray-400 text-sm"
                >...</span
              >
              <button
                v-if="paginationPages[paginationPages.length - 1] < totalPages"
                @click="currentPage = totalPages"
                class="w-8 h-8 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                {{ totalPages }}
              </button>
            </div>
            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              :class="[
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all',
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

<script setup>
import { ref, computed, watch } from "vue";

const selectedYear = ref(2025);
const selectedType = ref("");
const selectedMonth = ref("");
const filters = ref({
  jenis: "",
  lokasi: "",
  status: "",
  tahun: "",
  search: "",
});
const sortConfig = ref({ key: null, direction: "asc" });
const currentPage = ref(1);
const itemsPerPage = ref(10);
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Naskah Masuk", to: "/admin/laporan/naskah-masuk" },
];
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
    naskah: "Surat Dinas Eksternal",
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
    naskah: "Surat Undangan",
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
    naskah: "Surat Dinas Eksternal",
    nomor: "ND-003/SSF/KEU/III/2023",
    tanggal: "03/03/2023",
    perihal: "Penggantian Biaya Pembelian",
    jabatan: "Manager of HC Admin and General Affairs",
    lokasi: "Jakarta Pusat",
    status: "Hangus",
    jenis: "ND",
  },
  {
    id: 4,
    naskah: "Surat Dinas Eksternal",
    nomor: "ST-004/SSF/KEU/III/2025",
    tanggal: "05/03/2025",
    perihal: "Pelatihan SDM",
    jabatan: "Manager of HR",
    lokasi: "Jakarta Selatan",
    status: "Terpakai",
    jenis: "ST",
  },
  {
    id: 5,
    naskah: "Surat Dinas Eksternal",
    nomor: "ND-005/SSF/KEU/III/2024",
    tanggal: "10/03/2024",
    perihal: "Pembelian Aset",
    jabatan: "Manager of Finance",
    lokasi: "Bandung",
    status: "Terpakai",
    jenis: "ND",
  },
  {
    id: 6,
    naskah: "Surat Undangan",
    nomor: "ST-006/SSF/KEU/III/2025",
    tanggal: "12/03/2025",
    perihal: "Rapat Koordinasi",
    jabatan: "Director",
    lokasi: "Jakarta Pusat",
    status: "booking",
    jenis: "ST",
  },
  {
    id: 7,
    naskah: "Surat Dinas Eksternal",
    nomor: "ND-007/SSF/KEU/III/2023",
    tanggal: "15/03/2023",
    perihal: "Kerjasama Strategis",
    jabatan: "Manager of Business Development",
    lokasi: "Surabaya",
    status: "Hangus",
    jenis: "ND",
  },
  {
    id: 8,
    naskah: "Surat Undangan",
    nomor: "ND-008/SSF/KEU/III/2025",
    tanggal: "18/03/2025",
    perihal: "Evaluasi Kinerja",
    jabatan: "Manager of HR",
    lokasi: "Jakarta Pusat",
    status: "Terpakai",
    jenis: "ND",
  },
  {
    id: 9,
    naskah: "Surat Dinas Eksternal",
    nomor: "ST-009/SSF/KEU/III/2024",
    tanggal: "20/03/2024",
    perihal: "Monitoring Proyek",
    jabatan: "Project Manager",
    lokasi: "Airnav Maintenance Facility",
    status: "Terpakai",
    jenis: "ST",
  },
  {
    id: 10,
    naskah: "Surat Undangan",
    nomor: "ST-010/SSF/KEU/III/2025",
    tanggal: "22/03/2025",
    perihal: "Sosialisasi Kebijakan",
    jabatan: "Manager of HC Admin and General Affairs",
    lokasi: "Jakarta Selatan",
    status: "booking",
    jenis: "ST",
  },
  {
    id: 11,
    naskah: "Surat Undangan",
    nomor: "ND-011/SSF/KEU/III/2024",
    tanggal: "25/03/2024",
    perihal: "Anggaran Tahunan",
    jabatan: "Manager of Finance",
    lokasi: "Jakarta Pusat",
    status: "Terpakai",
    jenis: "ND",
  },
  {
    id: 12,
    naskah: "Surat Dinas Eksternal",
    nomor: "ND-012/SSF/KEU/III/2023",
    tanggal: "28/03/2023",
    perihal: "Audit Internal",
    jabatan: "Manager of Internal Audit",
    lokasi: "Bandung",
    status: "Hangus",
    jenis: "ND",
  },
]);

const selectedMonthLabel = computed(
  () => monthOptions.find((m) => m.value === selectedMonth.value)?.label ?? "",
);
const yearOptions = computed(() => {
  const years = new Set();
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
    .filter((item) => item !== null);
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

const handleSort = (key) => {
  sortConfig.value = {
    key,
    direction:
      sortConfig.value.key === key && sortConfig.value.direction === "asc"
        ? "desc"
        : "asc",
  };
};

const getStatusClass = (status) => {
  if (status === "Terpakai") return "bg-green-100 text-green-700";
  if (status === "booking") return "bg-blue-100 text-blue-700";
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
</script>
