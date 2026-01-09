<template>
  <div class="space-y-4">
    <div class="flex flex-wrap justify-between">
      <div>
        <Heading variant="heading6b">Detail Naskah Dinas</Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
    </div>

    <!-- Table -->
    <div
      class="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white"
    >
      <div class="flex flex-wrap justify-between gap-4 my-3 items-center">
        <div class="flex items-center gap-3">
          <span class="text-xs ml-5 text-gray-600">Tampilkan</span>

          <select
            v-model="rowsPerPage"
            class="border text-xs border-gray-300 bg-white rounded-md px-2 py-1"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">
              {{ n }}
            </option>
          </select>
          <button
            @click="refreshData"
            class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <RotateCcw class="w-4 h-4" />
          </button>
          <!-- Filter Jenis -->
          <select
            v-model="filters.jenis"
            class="bg-gray-100 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semua Jenis</option>
            <option value="ND">Nota Dinas</option>
            <option value="ST">Surat Tugas</option>
          </select>

          <!-- Filter Lokasi -->
          <select
            v-model="filters.lokasi"
            class="bg-gray-100 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semua Lokasi</option>
            <option v-for="lok in lokasiOptions" :key="lok" :value="lok">
              {{ lok }}
            </option>
          </select>

          <!-- Filter Status -->
          <select
            v-model="filters.status"
            class="bg-gray-100 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semua Status</option>
            <option value="Terpakai">Terpakai</option>
            <option value="booking">Booking</option>
            <option value="Tidak Terpakai">Tidak Terpakai</option>
          </select>

          <!-- Filter Tahun -->
          <select
            v-model="filters.tahun"
            class="bg-gray-100 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Semua Tahun</option>
            <option v-for="tahun in tahunOptions" :key="tahun" :value="tahun">
              {{ tahun }}
            </option>
          </select>
        </div>
        <button
          class="flex items-center gap-2 mr-6 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium shadow-sm"
        >
          <FileDown class="w-4 h-4" />
          Export
        </button>
      </div>

      <div class="relative flex-1 w-full my-3 px-2">
        <!-- <Search
          class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="filters.search"
          type="text"
          placeholder="Cari perihal / nomor..."
          class="w-full bg-gray-50 border border-gray-200 text-xs pl-9 pr-3 py-1.5 rounded-lg"
        /> -->
      </div>
      <table class="min-w-full border-collapse text-sm mt-3">
        <thead class="text-left bg-primary-400 text-white">
          <tr>
            <th class="px-4 py-3 font-semibold">Nomor</th>
            <th class="px-4 py-3 font-semibold">Tanggal</th>
            <th class="px-4 py-3 font-semibold">Perihal</th>
            <th class="px-4 py-3 font-semibold">Jabatan</th>
            <th class="px-4 py-3 font-semibold">Lokasi</th>
            <th class="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in paginatedNaskah"
            :key="item.id"
            class="hover:bg-blue-50 transition-colors"
          >
            <td class="px-4 py-3">{{ item.nomor }}</td>
            <td class="px-4 py-3">{{ item.tanggal }}</td>
            <td class="px-4 py-3">{{ item.perihal }}</td>
            <td class="px-4 py-3">{{ item.jabatan }}</td>
            <td class="px-4 py-3">{{ item.lokasi }}</td>
            <td class="px-4 py-3">
              <span
                class="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                :class="
                  item.status === 'Terpakai'
                    ? 'bg-green-100 text-green-600'
                    : item.status === 'booking'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-red-100 text-red-600'
                "
              >
                {{ item.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- PAGINATION -->
      <div
        v-if="totalItems > 0"
        class="flex items-center justify-between px-4 py-4"
      >
        <div class="text-xs text-gray-600">
          Menampilkan {{ paginatedNaskah.length }} dari {{ totalItems }} data
        </div>

        <div class="flex items-center gap-2">
          <!-- BACK -->
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-primary border border-primary hover:bg-primary-50',
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

          <!-- PAGE NUMBERS -->
          <div class="flex items-center gap-1">
            <!-- FIRST -->
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary transition-all"
            >
              1
            </button>

            <!-- DOTS LEFT -->
            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 text-sm"
            >
              ...
            </span>

            <!-- WINDOW -->
            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary',
              ]"
            >
              {{ page }}
            </button>

            <!-- DOTS RIGHT -->
            <span
              v-if="
                paginationPages[paginationPages.length - 1] < totalPages - 1
              "
              class="px-2 text-gray-400 text-sm"
            >
              ...
            </span>

            <!-- LAST -->
            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <!-- NEXT -->
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-primary border border-primary hover:bg-primary-50',
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
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Search, FileDown, RotateCcw } from "lucide-vue-next";

const data = ref([
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
    status: "Tidak Terpakai",
    jenis: "ND",
  },
]);

// Filter state
const filters = ref({
  jenis: "",
  lokasi: "",
  status: "",
  tahun: "",
  search: "",
});

// Options
const lokasiOptions = computed(() => [
  ...new Set(data.value.map((d) => d.lokasi)),
]);
const tahunOptions = computed(() => [
  ...new Set(data.value.map((d) => d.tanggal.split("/")[2])),
]);

// Filtered data
const filteredData = computed(() => {
  return data.value.filter((item) => {
    const tahunItem = item.tanggal.split("/")[2];
    return (
      (filters.value.jenis === "" || item.jenis === filters.value.jenis) &&
      (filters.value.lokasi === "" || item.lokasi === filters.value.lokasi) &&
      (filters.value.status === "" || item.status === filters.value.status) &&
      (filters.value.tahun === "" || tahunItem === filters.value.tahun) &&
      (filters.value.search === "" ||
        Object.values({
          nomor: item.nomor,
          tanggal: item.tanggal,
          perihal: item.perihal,
          jabatan: item.jabatan,
          lokasi: item.lokasi,
          status: item.status,
          jenis: item.jenis,
        })
          .join(" ")
          .toLowerCase()
          .includes(filters.value.search.toLowerCase()))
    );
  });
});

const refreshData = () => {
  filters.value.jenis = "";
  filters.value.lokasi = "";
  filters.value.search = "";
  filters.value.status = "";
  filters.value.tahun = "";
};
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Detail Naskah", to: "/admin/laporan/detail-naskah" },
];
// ================================
// PAGINATION
// ================================
import { ref, computed, watch } from "vue";

// pagination state
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsChoices = [5, 10, 15];
// total items
const totalItems = computed(() => filteredData.value.length);

// total pages
const totalPages = computed(() =>
  Math.ceil(totalItems.value / rowsPerPage.value),
);

// paginated data
const paginatedNaskah = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredData.value.slice(start, start + rowsPerPage.value);
});

// reset page saat filter berubah
watch([filters, rowsPerPage], () => {
  currentPage.value = 1;
});

// page window
const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else if (current <= 2) {
    pages.push(1, 2, 3, 4, 5);
  } else if (current >= total - 1) {
    pages.push(total - 2, total - 1, total);
  } else {
    pages.push(current - 1, current, current + 1);
  }

  return pages;
});
</script>
