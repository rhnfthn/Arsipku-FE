<template>
  <div class="min-h-screen bg-gray-50 p-1">
    <div class="max-w-[1400px] mx-auto space-y-8">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Naskah Masuk</h1>
        <p class="text-sm text-gray-600 mt-1">
          Kelola dan pantau naskah masuk berdasarkan lokasi, jenis, dan tahun.
        </p>
      </div>

      <!-- Table 1 - Monthly Summary -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <!-- Toolbar -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <button
                @click="refreshData"
                class="p-2 hover:bg-white rounded-lg text-gray-600 transition-colors"
                title="Refresh"
              >
                <RotateCcw class="w-4 h-4" />
              </button>

              <select
                v-model="selectedType"
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <FileDown class="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <!-- Table Content -->
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
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <!-- Toolbar -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3 flex-wrap">
              <button
                @click="refreshData"
                class="p-2 hover:bg-white rounded-lg text-gray-600 transition-colors"
                title="Refresh"
              >
                <RotateCcw class="w-4 h-4" />
              </button>

              <select
                v-model="filters.jenis"
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Jenis</option>
                <option value="ND">Nota Dinas</option>
              </select>

              <select
                v-model="filters.lokasi"
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Lokasi</option>
                <option v-for="lok in lokasiOptions" :key="lok" :value="lok">
                  {{ lok }}
                </option>
              </select>

              <select
                v-model="filters.status"
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="Terpakai">Terpakai</option>
                <option value="booking">Booking</option>
                <option value="Hangus">Hangus</option>
              </select>

              <select
                v-model="filters.tahun"
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              class="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <FileDown class="w-4 h-4" />
              Export
            </button>
          </div>

          <!-- Search Bar -->
          <!-- <div class="relative mt-4">
            <Search
              class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="filters.search"
              type="text"
              placeholder="Cari perihal, nomor, jabatan, atau lokasi..."
              class="w-full bg-white border border-gray-300 pl-10 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div> -->
        </div>

        <!-- Table Content -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-primary text-white">
              <tr>
                <th
                  @click="handleSort('naskah')"
                  class="px-6 py-4 text-left font-semibold text-sm cursor-pointertransition-colors select-none"
                >
                  <div class="flex items-center gap-1">
                    <span>Naskah</span>
                    <div class="flex flex-col">
                      <ChevronUp
                        class="w-3 h-3 -mb-1"
                        :class="
                          sortConfig.key === 'naskah' &&
                          sortConfig.direction === 'asc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                      <ChevronDown
                        class="w-3 h-3"
                        :class="
                          sortConfig.key === 'naskah' &&
                          sortConfig.direction === 'desc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                    </div>
                  </div>
                </th>
                <th
                  @click="handleSort('nomor')"
                  class="px-6 py-4 text-left font-semibold text-sm cursor-pointer transition-colors select-none"
                >
                  <div class="flex items-center gap-1">
                    <span>Nomor</span>
                    <div class="flex flex-col">
                      <ChevronUp
                        class="w-3 h-3 -mb-1"
                        :class="
                          sortConfig.key === 'nomor' &&
                          sortConfig.direction === 'asc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                      <ChevronDown
                        class="w-3 h-3"
                        :class="
                          sortConfig.key === 'nomor' &&
                          sortConfig.direction === 'desc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                    </div>
                  </div>
                </th>
                <th
                  @click="handleSort('tanggal')"
                  class="px-6 py-4 text-left font-semibold text-sm cursor-pointer transition-colors select-none"
                >
                  <div class="flex items-center gap-1">
                    <span>Tanggal</span>
                    <div class="flex flex-col">
                      <ChevronUp
                        class="w-3 h-3 -mb-1"
                        :class="
                          sortConfig.key === 'tanggal' &&
                          sortConfig.direction === 'asc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                      <ChevronDown
                        class="w-3 h-3"
                        :class="
                          sortConfig.key === 'tanggal' &&
                          sortConfig.direction === 'desc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                    </div>
                  </div>
                </th>
                <th
                  @click="handleSort('perihal')"
                  class="px-6 py-4 text-left font-semibold text-sm cursor-pointertransition-colors select-none"
                >
                  <div class="flex items-center gap-1">
                    <span>Perihal</span>
                    <div class="flex flex-col">
                      <ChevronUp
                        class="w-3 h-3 -mb-1"
                        :class="
                          sortConfig.key === 'perihal' &&
                          sortConfig.direction === 'asc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                      <ChevronDown
                        class="w-3 h-3"
                        :class="
                          sortConfig.key === 'perihal' &&
                          sortConfig.direction === 'desc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                    </div>
                  </div>
                </th>
                <th
                  @click="handleSort('jabatan')"
                  class="px-6 py-4 text-left font-semibold text-sm cursor-pointer transition-colors select-none"
                >
                  <div class="flex items-center gap-1">
                    <span>Jabatan</span>
                    <div class="flex flex-col">
                      <ChevronUp
                        class="w-3 h-3 -mb-1"
                        :class="
                          sortConfig.key === 'jabatan' &&
                          sortConfig.direction === 'asc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                      <ChevronDown
                        class="w-3 h-3"
                        :class="
                          sortConfig.key === 'jabatan' &&
                          sortConfig.direction === 'desc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                    </div>
                  </div>
                </th>
                <th
                  @click="handleSort('lokasi')"
                  class="px-6 py-4 text-left font-semibold text-sm cursor-pointer transition-colors select-none"
                >
                  <div class="flex items-center gap-1">
                    <span>Lokasi</span>
                    <div class="flex flex-col">
                      <ChevronUp
                        class="w-3 h-3 -mb-1"
                        :class="
                          sortConfig.key === 'lokasi' &&
                          sortConfig.direction === 'asc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                      <ChevronDown
                        class="w-3 h-3"
                        :class="
                          sortConfig.key === 'lokasi' &&
                          sortConfig.direction === 'desc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                    </div>
                  </div>
                </th>
                <th
                  @click="handleSort('status')"
                  class="px-6 py-4 text-left font-semibold text-sm cursor-pointer transition-colors select-none"
                >
                  <div class="flex items-center gap-1">
                    <span>Status</span>
                    <div class="flex flex-col">
                      <ChevronUp
                        class="w-3 h-3 -mb-1"
                        :class="
                          sortConfig.key === 'status' &&
                          sortConfig.direction === 'asc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                      <ChevronDown
                        class="w-3 h-3"
                        :class="
                          sortConfig.key === 'status' &&
                          sortConfig.direction === 'desc'
                            ? 'opacity-100'
                            : 'opacity-40'
                        "
                      />
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr
                v-for="item in paginatedData"
                :key="item.id"
                class="hover:bg-blue-50 transition-colors"
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
                  >
                    {{ item.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div class="flex items-center justify-between">
            <div class="text-xs text-gray-600">
              Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} -
              {{ Math.min(currentPage * itemsPerPage, sortedData.length) }} dari
              {{ sortedData.length }} data
            </div>

            <div class="flex items-center gap-2">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>

              <div class="flex gap-1">
                <button
                  v-for="page in totalPages"
                  :key="page"
                  @click="currentPage = page"
                  class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  :class="
                    currentPage === page
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  "
                >
                  {{ page }}
                </button>
              </div>

              <button
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  RotateCcw,
  FileDown,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-vue-next";

// State
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

const sortConfig = ref({
  key: null as string | null,
  direction: "asc" as "asc" | "desc",
});
const currentPage = ref(1);
const itemsPerPage = 10;

// Constants
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

// Computed
const selectedMonthLabel = computed(() => {
  return monthOptions.find((m) => m.value === selectedMonth.value)?.label ?? "";
});

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
        .reduce((acc, [, val]) => acc + (val as number), 0);

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
      (filters.value.jenis === "" || item.jenis === filters.value.jenis) &&
      (filters.value.lokasi === "" || item.lokasi === filters.value.lokasi) &&
      (filters.value.status === "" || item.status === filters.value.status) &&
      (filters.value.tahun === "" || tahunItem === filters.value.tahun) &&
      (filters.value.search === "" ||
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
    const aVal = a[sortConfig.value.key as keyof typeof a];
    const bVal = b[sortConfig.value.key as keyof typeof b];

    if (aVal < bVal) return sortConfig.value.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.value.direction === "asc" ? 1 : -1;
    return 0;
  });
});

const paginatedData = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  return sortedData.value.slice(startIndex, startIndex + itemsPerPage);
});

const totalPages = computed(() =>
  Math.ceil(sortedData.value.length / itemsPerPage),
);

// Methods
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
