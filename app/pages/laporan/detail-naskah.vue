<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Detail Naskah Dinas
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <button
        @click="exportExcel"
        class="flex items-center gap-2 bg-primary text-white h-9 px-6 rounded-lg hover:bg-primary-800 transition-colors text-sm font-medium shadow-sm"
      >
        <FileDown class="w-4 h-4" />
        Export
      </button>
    </div>

    <!-- Table -->
    <div
      class="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white"
    >
      <div class="flex flex-wrap justify-between gap-4 p-2 items-center">
        <div class="flex items-center gap-3">
          <button
            @click="refreshData"
            class="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50"
            :disabled="isRefreshing"
          >
            <RotateCcw
              class="w-4 h-4 transition-transform duration-700"
              :class="{ 'animate-spin': isRefreshing }"
            />
          </button>

          <!-- ROWS PER PAGE -->
          <div class="relative" ref="rowsRef">
            <div
              @click="showRowsDropdown = !showRowsDropdown"
              class="h-7 px-2 text-xs bg-white border border-gray-300 rounded-md flex items-center gap-1 cursor-pointer focus-within:ring-1 focus-within:ring-primary-400"
            >
              {{ rowsPerPage }}
              <ChevronDown
                class="w-3 h-3 ml-auto transition-transform duration-200"
                :class="{ 'rotate-180': showRowsDropdown }"
              />
            </div>

            <div
              v-if="showRowsDropdown"
              class="absolute z-30 mt-1 w-full bg-white rounded-md shadow"
            >
              <div
                v-for="n in rowsChoices"
                :key="n"
                @click="
                  rowsPerPage = n;
                  showRowsDropdown = false;
                "
                class="px-2 py-1 text-xs hover:bg-primary-50 cursor-pointer"
              >
                {{ n }}
              </div>
            </div>
          </div>

          <!-- Filter Jenis -->
          <div class="relative" ref="jenisRef">
            <input
              v-model="jenisKeyword"
              @click="showJenisDropdown = !showJenisDropdown"
              placeholder="Semua Jenis"
              class="bg-gray-100 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus-within:ring-1 focus-within:ring-primary-400 placeholder-black"
            />

            <ChevronDown
              class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': showJenisDropdown }"
            />

            <div
              v-if="showJenisDropdown"
              class="absolute z-20 mt-1 w-full bg-white rounded-lg shadow max-h-48 overflow-y-auto"
            >
              <div
                class="px-3 py-2 text-sm hover:bg-primary-50 cursor-pointer"
                @click="
                  filters.jenis = '';
                  jenisKeyword = 'Semua Jenis';
                  showJenisDropdown = false;
                "
              >
                Semua Jenis
              </div>

              <div
                v-for="jenis in filteredJenisOptions"
                :key="jenis.jenis"
                class="px-3 py-2 text-sm hover:bg-primary-50 cursor-pointer"
                @click="
                  filters.jenis = jenis.jenis;
                  jenisKeyword = jenis.jenis_text;
                  showJenisDropdown = false;
                "
              >
                {{ jenis.jenis_text }}
              </div>

              <div
                v-if="filteredJenisOptions.length === 0"
                class="px-3 py-2 text-sm text-gray-400 text-center"
              >
                Data tidak ditemukan
              </div>
            </div>
          </div>

          <!-- Filter Lokasi -->
          <div class="relative" ref="lokasiRef">
            <input
              v-model="lokasiKeyword"
              @click="showLokasiDropdown = !showLokasiDropdown"
              placeholder="Semua Lokasi"
              class="bg-gray-100 rounded-lg px-3 py-2 text-sm w-48 placeholder:text-black focus:outline-none focus-within:ring-1 focus-within:ring-primary-400 focus:border-transparent"
            />

            <ChevronDown
              class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-transform duration-200"
              :class="{ 'rotate-180': showLokasiDropdown }"
            />

            <div
              v-if="showLokasiDropdown"
              class="absolute z-20 mt-1 w-full bg-white rounded-lg shadow max-h-48 overflow-y-auto"
            >
              <div
                class="px-3 py-2 text-sm hover:bg-primary-50 cursor-pointer"
                @click="
                  filters.lokasi = '';
                  lokasiKeyword = 'Semua Lokasi';
                  showLokasiDropdown = false;
                "
              >
                Semua Lokasi
              </div>

              <div
                v-for="area in filteredAreaOptions"
                :key="area.kode"
                class="px-3 py-2 text-sm hover:bg-primary-50 cursor-pointer"
                @click="
                  filters.lokasi = area.kode;
                  lokasiKeyword = area.nama;
                  showLokasiDropdown = false;
                "
              >
                {{ area.nama }}
              </div>
              <div
                v-if="filteredAreaOptions.length === 0"
                class="px-3 py-2 text-sm text-gray-400 text-center"
              >
                Data tidak ditemukan
              </div>
            </div>
          </div>

          <!-- STATUS FILTER -->
          <div class="relative w-[180px] shrink-0" ref="statusRef">
            <!-- INPUT LOOKALIKE -->
            <div
              tabindex="0"
              @click="toggle('status')"
              class="h-9 w-full px-2 text-sm bg-gray-100 rounded-md flex items-center gap-1 cursor-pointer overflow-hidden focus:outline-none focus:ring-1 focus:ring-primary-400"
            >
              <!-- PLACEHOLDER -->
              <span v-if="!selectedStatuses.length" class="text-black truncate">
                Semua Status
              </span>

              <!-- SELECTED TAGS -->
              <div
                v-else
                class="flex items-center gap-1 flex-nowrap overflow-hidden"
              >
                <span
                  v-for="status in selectedStatuses"
                  :key="status"
                  class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary text-[10px] whitespace-nowrap"
                >
                  {{ statusOptions.find((s) => s.value === status)?.label }}
                  <button
                    @click.stop="removeStatus(status)"
                    class="hover:text-red-500"
                  >
                    ✕
                  </button>
                </span>
              </div>

              <ChevronDown
                class="w-4 h-4 ml-auto shrink-0 text-gray-500 transition-transform duration-200"
                :class="{ 'rotate-180': openDropdown === 'status' }"
              />
            </div>

            <!-- DROPDOWN -->
            <div
              v-if="openDropdown === 'status'"
              class="absolute z-[999] mt-1 bg-white rounded-lg shadow-md w-full p-2"
            >
              <div class="flex flex-col gap-1">
                <button
                  v-for="status in statusOptions"
                  :key="status.value"
                  @mousedown.prevent
                  @click="toggleStatus(status.value)"
                  class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                  :class="
                    selectedStatuses.includes(status.value)
                      ? 'bg-primary text-white'
                      : 'hover:bg-gray-100'
                  "
                >
                  {{ status.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- FILTER TAHUN -->
          <div class="relative">
            <div
              tabindex="0"
              @click="showTahunDropdown = !showTahunDropdown"
              class="bg-gray-100 rounded-lg px-3 py-2 text-sm flex items-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-400"
            >
              {{ filters.tahun }}
              <ChevronDown
                class="w-4 h-4 ml-auto transition-transform duration-200"
                :class="{ 'rotate-180': showTahunDropdown }"
              />
            </div>

            <div
              v-if="showTahunDropdown"
              class="absolute z-30 mt-1 w-full bg-white rounded-lg shadow"
            >
              <div
                v-for="tahun in tahunOptions"
                :key="tahun"
                @click="
                  filters.tahun = tahun;
                  showTahunDropdown = false;
                "
                class="px-3 py-2 text-sm hover:bg-primary-50 cursor-pointer"
              >
                {{ tahun }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="relative overflow-x-auto">
        <table class="min-w-max border-collapse text-sm mt-3 w-full">
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
              class="hover:bg-blue-50 border-b border-gray-200 transition-colors"
            >
              <td class="px-4 py-3">{{ item.nomor }}</td>
              <td class="px-4 py-3">{{ item.tanggal }}</td>
              <td class="px-4 py-3">{{ item.perihal }}</td>
              <td class="px-4 py-3">{{ item.jabatan }}</td>
              <td class="px-4 py-3">{{ item.lokasi }}</td>
              <td class="px-4 py-3">
                <span
                  class="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                  :class="{
                    'bg-green-100 text-green-700': item.status === 'Terpakai',
                    'bg-green-300 text-green-700':
                      item.status === 'Terpakai_final',
                    'bg-blue-100 text-blue-700': item.status === 'Booking',
                    'bg-red-100 text-red-700': item.status === 'Hangus',
                  }"
                >
                  {{ item.status }}
                </span>
              </td>
            </tr>

            <tr v-if="loading">
              <td :colspan="tableColCount" class="px-4 py-6">
                <div class="space-y-4 animate-pulse">
                  <div
                    v-for="n in skeletonRows"
                    :key="'skeleton-' + n"
                    class="h-12 w-full rounded-lg bg-gray-200"
                  />
                </div>
              </td>
            </tr>

            <tr v-if="paginatedNaskah.length === 0">
              <td
                colspan="6"
                class="px-4 py-6 text-center text-sm text-gray-400 italic"
              >
                Tidak ada data
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
//IMPORT
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { FileDown, RotateCcw, ChevronDown } from "lucide-vue-next";
import { useToast } from "#imports";
import { useLaporan } from "~/composables/useLaporan";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

//GLOBAL UTIL
const toast = useToast();
const { getRekapNaskahDetail, getAreaList, getJenisList } = useLaporan();

//FILTER STATE
const loading = ref(false);
const isRefreshing = ref(false);

const jenisKeyword = ref("");
const lokasiKeyword = ref("");

const showJenisDropdown = ref(false);
const showLokasiDropdown = ref(false);

const openDropdown = ref<null | "status">(null);
const selectedStatuses = ref<string[]>([]);

const currentYear = new Date().getFullYear();
const showTahunDropdown = ref(false);

const showRowsDropdown = ref(false);

//REF COUTSIDE CLICK
const jenisRef = ref<HTMLElement | null>(null);
const lokasiRef = ref<HTMLElement | null>(null);
const statusRef = ref<HTMLElement | null>(null);

//DATA STATE
const rawData = ref<any[]>([]);
const areaOptions = ref<{ kode: string; nama: string }[]>([]);
const jenisOptions = ref<{ jenis: string; jenis_text: string }[]>([]);

//FILTER STATE
const filters = ref({
  jenis: "",
  lokasi: "",
  status: [] as string[],
  tahun: currentYear,
  search: "",
});

//DROPDOWN HANDLER
const toggle = (key: "status") => {
  openDropdown.value = openDropdown.value === key ? null : key;
};

const toggleStatus = (status: string) => {
  if (selectedStatuses.value.includes(status)) {
    selectedStatuses.value = selectedStatuses.value.filter((s) => s !== status);
  } else {
    selectedStatuses.value.push(status);
  }
};

const removeStatus = (status: string) => {
  selectedStatuses.value = selectedStatuses.value.filter((s) => s !== status);
};

//OUTSIDE HANDLER
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node;

  if (jenisRef.value && !jenisRef.value.contains(target)) {
    showJenisDropdown.value = false;
  }

  if (lokasiRef.value && !lokasiRef.value.contains(target)) {
    showLokasiDropdown.value = false;
  }

  if (
    openDropdown.value === "status" &&
    statusRef.value &&
    !statusRef.value.contains(target)
  ) {
    openDropdown.value = null;
  }
};

//FILTERING
const filteredData = computed(() => {
  let result = [...rawData.value];

  if (selectedStatuses.value.length) {
    result = result.filter((item) =>
      selectedStatuses.value.includes(item.statusRaw),
    );
  }

  return result;
});

const filteredJenisOptions = computed(() => {
  if (!jenisKeyword.value) return jenisOptions.value;
  return jenisOptions.value.filter((j) =>
    j.jenis_text.toLowerCase().includes(jenisKeyword.value.toLowerCase()),
  );
});

const filteredAreaOptions = computed(() => {
  if (!lokasiKeyword.value) return areaOptions.value;
  return areaOptions.value.filter((a) =>
    a.nama.toLowerCase().includes(lokasiKeyword.value.toLowerCase()),
  );
});

const tahunOptions = computed(() => {
  const years = new Set<number>();

  rawData.value.forEach((d) => {
    const y = Number(d.tanggal?.split("/")[2]);
    if (!isNaN(y)) years.add(y);
  });

  years.add(currentYear);

  return Array.from(years).sort((a, b) => b - a);
});

//PAGINATION
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsChoices = [5, 10, 15];

const totalItems = computed(() => filteredData.value.length);

const totalPages = computed(() =>
  Math.ceil(totalItems.value / rowsPerPage.value),
);

const paginatedNaskah = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredData.value.slice(start, start + rowsPerPage.value);
});

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

const tableColCount = computed(() => 6);
const skeletonRows = computed(() => rowsPerPage.value);

//API FETCH
const fetchDetailNaskah = async () => {
  loading.value = true;
  try {
    const params: any = {};

    if (filters.value.tahun) params.tahun = Number(filters.value.tahun);
    if (filters.value.lokasi) params.area = filters.value.lokasi;
    if (filters.value.jenis) params.jenis = filters.value.jenis;

    const res = await getRekapNaskahDetail(params);

    rawData.value = res.data.map((item: any) => ({
      id: item.id,
      nomor: item.nomor,
      tanggal: formatTanggal(item.tanggal),
      perihal: item.perihal ?? "-",
      jabatan: item.jabatan,
      lokasi: item.lokasi,
      status: capitalize(item.status),
      statusRaw: item.status,
      jenis: item.jenis,
      jenis_text: item.jenis_text,
    }));
  } catch (err) {
    console.error("Gagal ambil detail naskah", err);
  } finally {
    loading.value = false;
  }
};

const fetchAreaList = async () => {
  try {
    const res = await getAreaList();
    areaOptions.value = res.data.map((item: any) => ({
      kode: item.area,
      nama: item.longText,
    }));
  } catch (err) {
    console.error("Gagal ambil area", err);
  }
};

const fetchJenis = async () => {
  try {
    const res = await getJenisList();
    jenisOptions.value = res.data;
  } catch (err) {
    console.error("Gagal ambil jenis", err);
  }
};

//HELPER
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

//EXCEL
const exportExcel = () => {
  if (!filteredData.value.length) {
    toast.add({
      title: "Export dibatalkan",
      description: "Tidak ada data untuk diexport",
      color: "warning",
      icon: "i-lucide-alert-circle",
    });
    return;
  }

  const excelData = filteredData.value.map((item, index) => ({
    No: index + 1,
    Nomor: item.nomor,
    Tanggal: item.tanggal,
    Perihal: item.perihal,
    Jabatan: item.jabatan,
    Lokasi: item.lokasi,
    Status: item.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 12 },
    { wch: 40 },
    { wch: 25 },
    { wch: 20 },
    { wch: 15 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Detail Naskah");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const today = new Date().toISOString().split("T")[0];
  saveAs(blob, `detail-naskah-${today}.xlsx`);

  toast.add({
    title: "Export berhasil",
    description: "File excel berhasil diunduh",
    color: "success",
    icon: "i-lucide-file-check",
  });
};

//REFRESH
const refreshData = async () => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;

  try {
    filters.value = {
      jenis: "",
      lokasi: "",
      status: [],
      tahun: currentYear,
      search: "",
    };

    jenisKeyword.value = "Semua Jenis";
    lokasiKeyword.value = "Semua Lokasi";
    selectedStatuses.value = [];

    showJenisDropdown.value = false;
    showLokasiDropdown.value = false;
    openDropdown.value = null;

    currentPage.value = 1;
    await fetchDetailNaskah();
  } catch (err) {
    console.error("Gagal refresh data", err);
  } finally {
    isRefreshing.value = false;
  }
};

//LIFECYCLE
onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  fetchDetailNaskah();
  fetchAreaList();
  fetchJenis();
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

//WATCH
watch(selectedStatuses, () => {
  currentPage.value = 1;
});

watch(
  () => [filters.value.tahun, filters.value.lokasi, filters.value.jenis],
  () => {
    currentPage.value = 1;
    fetchDetailNaskah();
  },
);

watch([filters, rowsPerPage], () => {
  currentPage.value = 1;
});

//DATA STATIS
const statusOptions = [
  { label: "Terpakai", value: "terpakai" },
  { label: "Booking", value: "booking" },
  { label: "Hangus", value: "hangus" },
];

const breadcrumbs = [
  { label: "Beranda", to: "/admin/dashboard" },
  { label: "Detail Naskah", to: "/admin/laporan/detail-naskah" },
];
</script>
