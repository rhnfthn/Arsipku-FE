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

            <div class="relative w-[220px] jenis-dropdown">
              <input
                v-model="jenisSearch"
                @mousedown.stop="toggleJenis"
                @input="jenisOpen = true"
                type="text"
                :placeholder="selectedJenis || 'Cari jenis naskah'"
                class="bg-gray-100 rounded-lg px-4 py-2 text-sm w-full placeholder-black border border-transparent focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              />

              <svg
                class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-transform duration-300"
                :class="jenisOpen ? 'rotate-180' : 'rotate-0'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>

              <!-- Dropdown -->
              <div
                v-if="jenisOpen"
                class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg"
              >
                <ul class="max-h-60 overflow-auto text-sm">
                  <li
                    @click="selectJenis('')"
                    class="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    Semua Jenis
                  </li>

                  <li
                    v-for="jenis in jenisOptions"
                    :key="jenis"
                    @click="selectJenis(jenis)"
                    class="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  >
                    {{ jenis }}
                  </li>

                  <li
                    v-if="!jenisOptions.length"
                    class="px-4 py-2 text-gray-400"
                  >
                    Tidak ditemukan
                  </li>
                </ul>
              </div>
            </div>

            <div class="relative w-[180px]">
              <select
                v-model="selectedMonth"
                @mousedown="monthOpen = !monthOpen"
                @change="monthOpen = false"
                class="appearance-none bg-gray-100 rounded-lg px-4 py-2 pr-10 text-sm w-full cursor-pointer border border-transparent focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
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

              <!-- ICON -->
              <svg
                class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-transform duration-300"
                :class="monthOpen ? 'rotate-180' : 'rotate-0'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            <div class="relative w-[140px]">
              <select
                v-model="selectedYear"
                @mousedown="yearOpen = !yearOpen"
                @change="yearOpen = false"
                class="appearance-none bg-gray-100 rounded-lg px-4 py-2 pr-10 text-sm w-full cursor-pointer border border-transparent focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
              >
                <option
                  v-for="tahun in yearOptions"
                  :key="tahun"
                  :value="tahun"
                >
                  {{ tahun }}
                </option>
              </select>

              <!-- ICON -->
              <svg
                class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-transform duration-300"
                :class="yearOpen ? 'rotate-180' : 'rotate-0'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
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

            <tbody v-if="filteredTableData.length">
              <tr v-for="row in paginatedTable1Data" :key="row.id">
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

            <tbody v-else>
              <tr>
                <td
                  :colspan="monthOptions.length + 2"
                  class="text-center py-6 text-gray-400"
                >
                  Tidak ada data
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-if="totalItemsTable1 > 0"
          class="flex items-center justify-between px-6 py-4 border-t border-gray-200"
        >
          <div class="text-xs text-gray-600">
            Menampilkan
            {{
              Math.min(currentPageTable1 * itemsPerPageTable1, totalItemsTable1)
            }}
            dari {{ totalItemsTable1 }} data
          </div>

          <div class="flex items-center gap-2">
            <!-- BACK -->
            <button
              @click="currentPageTable1 = Math.max(1, currentPageTable1 - 1)"
              :disabled="currentPageTable1 === 1"
              :class="[
                'px-4 py-1 text-sm rounded-lg',
                currentPageTable1 === 1
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-white border border-primary-600 text-primary-600 hover:bg-blue-50',
              ]"
            >
              Back
            </button>

            <!-- PAGE NUMBER -->
            <button
              v-for="page in paginationPagesTable1"
              :key="page"
              @click="currentPageTable1 = page"
              :class="[
                'w-8 h-8 text-sm rounded-lg',
                currentPageTable1 === page
                  ? 'bg-primary text-white'
                  : 'bg-white border border-gray-300 hover:bg-blue-50',
              ]"
            >
              {{ page }}
            </button>

            <!-- NEXT -->
            <button
              @click="
                currentPageTable1 = Math.min(
                  totalPagesTable1,
                  currentPageTable1 + 1,
                )
              "
              :disabled="currentPageTable1 === totalPagesTable1"
              :class="[
                'px-4 py-1 text-sm rounded-lg',
                currentPageTable1 === totalPagesTable1
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-white border border-primary-600 text-primary-600 hover:bg-blue-50',
              ]"
            >
              Next
            </button>
          </div>
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
import { ref, computed, watch, onMounted, onBeforeMount } from "vue";
import { RotateCcw } from "lucide-vue-next";
import { useLaporan } from "~/composables/useLaporan";
import { useToast } from "#imports";
import * as XLSX from "xlsx";

const toast = useToast();

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Naskah Masuk", to: "/admin/laporan/naskah-masuk" },
];

const { getRekapNaskahMasuk, getRekapNaskahMasukDetail } = useLaporan();

const table1Raw = ref<any[]>([]);
const loadingTable1 = ref(false);

const table2Data = ref<any[]>([]);
const loadingTable2 = ref(false);

const toggleJenis = () => {
  jenisOpen.value = !jenisOpen.value;
};

const jenisSearch = ref("");
const selectedJenis = ref("");
const jenisOpen = ref(false);

const monthOpen = ref(false);
const yearOpen = ref(false);

const selectJenis = (jenis: string) => {
  selectedJenis.value = jenis;
  jenisSearch.value = "";
  jenisOpen.value = false;
};

const handleClickOutside = (e: MouseEvent) => {
  const el = document.querySelector(".jenis-dropdown");
  if (el && !el.contains(e.target as Node)) {
    jenisOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const selectedType = ref("");
const selectedMonth = ref("");
const selectedYear = ref<number>(new Date().getFullYear());
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
const itemsPerPage = ref(5);

const monthOptions = [
  { label: "Januari", value: "jan" },
  { label: "Februari", value: "feb" },
  { label: "Maret", value: "mar" },
  { label: "April", value: "apr" },
  { label: "Mei", value: "mei" },
  { label: "Juni", value: "jun" },
  { label: "Juli", value: "jul" },
  { label: "Agustus", value: "agu" },
  { label: "September", value: "sep" },
  { label: "Oktober", value: "okt" },
  { label: "November", value: "nov" },
  { label: "Desember", value: "des" },
];

const fetchTable1 = async () => {
  loadingTable1.value = true;
  try {
    const res = await getRekapNaskahMasuk({
      tahun: selectedYear.value,
    });

    table1Raw.value = res.data.rekap ?? [];
  } catch (err) {
    console.error("Gagal ambil rekap naskah masuk", err);
  } finally {
    loadingTable1.value = false;
  }
};

const fetchTable2 = async () => {
  loadingTable2.value = true;
  try {
    const params: any = {};

    if (filters.value.tahun) {
      params.tahun = Number(filters.value.tahun);
    }

    if (filters.value.jenis) {
      params.jenis = filters.value.jenis;
    }

    if (filters.value.status) {
      // API pakai lowercase
      params.status = filters.value.status.toLowerCase();
    }

    const res = await getRekapNaskahMasukDetail(params);

    table2Data.value = res.data.map((item: any) => ({
      id: item.id,
      jenis: item.naskah, // ND / ST
      jenis_text: item.naskah_text,
      nomor: item.nomor,
      tanggal: formatTanggal(item.tanggal),
      perihal: item.perihal ?? "-",
      jabatan: item.jabatan,
      lokasi: item.lokasi,
      status: capitalize(item.status),
    }));
  } catch (err) {
    console.error("Gagal ambil detail naskah masuk", err);
  } finally {
    loadingTable2.value = false;
  }
};

const formatTanggal = (date: string) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const capitalize = (text: string) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : "-";

const filteredTableData = computed(() => {
  return table1Raw.value
    .filter((row) => {
      if (selectedJenis.value && row.jenis_text !== selectedJenis.value) {
        return false;
      }

      if (
        jenisSearch.value &&
        !row.jenis_text?.toLowerCase().includes(jenisSearch.value.toLowerCase())
      ) {
        return false;
      }

      return true;
    })
    .map((row) => ({
      id: row.jenis,
      naskah: row.jenis_text,
      ...row,
      jumlah: row.total ?? 0,
    }));
});

watch(
  () => ({ ...filters.value }),
  () => {
    currentPage.value = 1;
    fetchTable2();
  },
  { deep: true },
);

onMounted(() => {
  fetchTable1();
  fetchTable2();
});

const jenisOptions = computed(() => {
  const all = [...new Set(table1Raw.value.map((r) => r.jenis_text))];
  if (!jenisSearch.value) return all;
  return all.filter((j) =>
    j.toLowerCase().includes(jenisSearch.value.toLowerCase()),
  );
});

const selectedMonthLabel = computed(
  () => monthOptions.find((m) => m.value === selectedMonth.value)?.label ?? "",
);

watch(selectedYear, () => {
  fetchTable1();
});

onMounted(() => {
  fetchTable1();
});

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
});

const lokasiOptions = computed(() => [
  ...new Set(table2Data.value.map((d) => d.lokasi)),
]);

const tahunOptions = computed(() =>
  [
    ...new Set(
      table2Data.value.map((d) => d.tanggal?.split("/")?.[2]).filter(Boolean),
    ),
  ].sort((a, b) => Number(b) - Number(a)),
);

const filteredData = computed(() => {
  return table2Data.value.filter((item) => {
    const tahunItem = item.tanggal.split("/")[2];

    return (
      (!filters.value.jenis || item.jenis === filters.value.jenis) &&
      (!filters.value.lokasi || item.lokasi === filters.value.lokasi) &&
      (!filters.value.status || item.status === filters.value.status) &&
      (!filters.value.tahun || tahunItem === filters.value.tahun)
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

// ===== PAGINATION TABLE 1 =====
const currentPageTable1 = ref(1);
const itemsPerPageTable1 = ref(5);

const totalItemsTable1 = computed(() => filteredTableData.value.length);

const totalPagesTable1 = computed(() =>
  Math.ceil(totalItemsTable1.value / itemsPerPageTable1.value),
);

const paginatedTable1Data = computed(() => {
  const start = (currentPageTable1.value - 1) * itemsPerPageTable1.value;

  return filteredTableData.value.slice(start, start + itemsPerPageTable1.value);
});

const paginationPagesTable1 = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;

  let start = Math.max(1, currentPageTable1.value - Math.floor(maxVisible / 2));

  let end = Math.min(totalPagesTable1.value, start + maxVisible - 1);

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) pages.push(i);

  return pages;
});

watch([selectedJenis, jenisSearch, selectedMonth, selectedYear], () => {
  currentPageTable1.value = 1;
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
  if (status === "Terpakai_final") return "bg-green-300 text-green-700";
  if (status === "Booking") return "bg-primary-100 text-blue-700";
  return "bg-red-100 text-red-700";
};

const refreshData = () => {
  selectedMonth.value = "";
  jenisSearch.value = "";
  selectedYear.value = new Date().getFullYear();
  fetchTable1();
};

const exportTable1 = () => {
  if (!filteredTableData.value.length) {
    toast.add({
      title: "Export gagal",
      description: "Tidak ada data untuk diexport",
      color: "warning",
    });
    return;
  }

  try {
    // ===== HEADER =====
    const headers: string[] = ["Naskah"];

    if (!selectedMonth.value) {
      headers.push(...monthOptions.map((m) => m.label));
    } else {
      headers.push(selectedMonthLabel.value);
    }

    headers.push("Jumlah");

    // ===== ROWS =====
    const rows = filteredTableData.value.map((row) => {
      const data: (string | number)[] = [row.naskah];

      if (!selectedMonth.value) {
        monthOptions.forEach((m) => {
          data.push(Number(row[m.value] ?? 0));
        });
      } else {
        data.push(Number(row[selectedMonth.value] ?? 0));
      }

      data.push(Number(row.jumlah ?? 0));
      return data;
    });

    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet["!cols"] = headers.map(() => ({ wch: 20 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Naskah Masuk");

    // ===== DOWNLOAD =====
    XLSX.writeFile(workbook, `naskah-masuk-summary-${selectedYear.value}.xlsx`);

    toast.add({
      title: "Export berhasil",
      description: "File Excel berhasil diunduh",
      color: "success",
    });
  } catch (err) {
    console.error(err);
    toast.add({
      title: "Export gagal",
      description: "Terjadi kesalahan saat membuat file Excel",
      color: "error",
    });
  }
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
