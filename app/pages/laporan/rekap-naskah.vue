<template>
  <div class="flex items-center justify-between mb-5">
    <div>
      <Heading variant="heading6b" class="text-mobile-md">
        Rekap Naskah Dinas
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

  <div
    class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white"
  >
    <div class="top-0 bg-white p-3 relative z-50">
      <div class="flex items-center gap-2 flex-nowrap w-full">
        <!-- Refresh -->
        <button
          @click="refreshData"
          :disabled="loading"
          class="p-1.5 hover:bg-gray-100 rounded-md text-gray-500"
        >
          <RotateCcw class="w-4 h-4" :class="loading ? 'animate-spin' : ''" />
        </button>

        <select
          v-model="rowsPerPage"
          class="h-8 text-xs border border-gray-300 bg-white rounded-md px-2"
        >
          <option v-for="n in rowsPerPageOptions" :key="n" :value="n">
            {{ n }}
          </option>
        </select>

        <div class="relative w-[160px] shrink-0">
          <input
            v-model="jenisSearch"
            @focus="openDropdown = 'type'"
            @keydown.escape="openDropdown = null"
            type="text"
            placeholder="Semua Jenis"
            class="h-8 w-full rounded-md px-2 text-xs bg-gray-100 pr-7 focus:outline-none placeholder:text-black truncate"
          />

          <ChevronDown
            class="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />

          <!-- DROPDOWN LIST -->
          <div
            v-if="openDropdown === 'type'"
            class="absolute z-[999] mt-1 bg-white rounded-lg shadow-md w-full max-h-60 overflow-y-auto"
          >
            <!-- RESET -->
            <button
              @click="selectJenis(null)"
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              Semua Jenis
            </button>

            <!-- OPTIONS -->
            <button
              v-for="item in filteredJenisOptions"
              :key="item.id"
              @click="selectJenis(item)"
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              {{ item.jenis_text }}
            </button>

            <!-- EMPTY -->
            <div
              v-if="filteredJenisOptions.length === 0"
              class="px-3 py-2 text-sm text-gray-400 italic"
            >
              Data tidak ditemukan
            </div>
          </div>
        </div>

        <div class="relative w-[160px] shrink-0">
          <input
            v-model="lokasiSearch"
            @focus="openDropdown = 'lokasi'"
            @keydown.escape="openDropdown = null"
            type="text"
            placeholder="Semua Lokasi"
            class="h-8 w-full rounded-md px-2 text-xs bg-gray-100 pr-7 focus:outline-none placeholder:text-black truncate"
          />

          <ChevronDown
            class="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />

          <div
            v-if="openDropdown === 'lokasi'"
            class="absolute z-[999] mt-1 bg-white rounded-lg shadow-md w-full max-h-60 overflow-y-auto"
          >
            <button
              @click="selectLokasi(null)"
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              Semua Lokasi
            </button>

            <!-- OPTIONS -->
            <button
              v-for="item in filteredLokasiOptions"
              :key="item.value"
              @click="selectLokasi(item)"
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              {{ item.label }}
            </button>

            <!-- EMPTY -->
            <div
              v-if="filteredLokasiOptions.length === 0"
              class="px-3 py-2 text-sm text-gray-400 italic"
            >
              Data tidak ditemukan
            </div>
          </div>
        </div>

        <!-- STATUS FILTER -->
        <div class="relative w-[180px] shrink-0">
          <!-- INPUT LOOKALIKE -->
          <div
            @click="toggle('status')"
            class="h-8 w-full px-2 text-xs bg-gray-100 rounded-md flex items-center gap-1 cursor-pointer overflow-hidden"
          >
            <!-- PLACEHOLDER -->
            <span v-if="!selectedStatuses.length" class="text-black truncate">
              Semua Status
            </span>

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

            <ChevronDown class="w-4 h-4 ml-auto shrink-0 text-gray-500" />
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

        <!-- BULAN -->
        <div class="relative">
          <button
            @click="toggle('month')"
            class="h-8 px-2 text-xs bg-gray-100 rounded-md flex items-center gap-1 min-w-[120px] truncate"
          >
            <span>{{ selectedMonthLabel || "Semua Bulan" }}</span>
            <ChevronDown class="w-4 h-4 ml-auto" />
          </button>

          <div
            v-if="openDropdown === 'month'"
            class="absolute z-[999] mt-1 bg-white rounded-lg shadow-md w-full max-h-60 overflow-y-auto"
          >
            <button
              @click="
                selectedMonth = '';
                openDropdown = null;
              "
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              Semua Bulan
            </button>

            <button
              v-for="bulan in monthOptions"
              :key="bulan.value"
              @click="
                selectedMonth = bulan.value;
                openDropdown = null;
              "
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
            class="h-8 px-2 text-xs bg-gray-100 rounded-md flex items-center gap-1 min-w-[120px] truncate"
          >
            <span>{{ selectedYear || "Semua Tahun" }}</span>
            <ChevronDown class="w-4 h-4 ml-auto" />
          </button>

          <div
            v-if="openDropdown === 'year'"
            class="absolute z-[999] mt-1 bg-white rounded-lg shadow-md w-full max-h-60 overflow-y-auto"
          >
            <button
              v-for="tahun in yearOptions"
              :key="tahun"
              @click="
                selectedYear = tahun;
                openDropdown = null;
              "
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              {{ tahun }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="max-h-[70vh] overflow-y-auto">
      <div class="overflow-x-auto">
        <table class="text-center">
          <thead class="bg-primary-400">
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
                class="px-4 py-3 border-b-2 font-semibold text-sm sticky right-0 z-20 bg-primary-400 min-w-[140px]"
              >
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td :colspan="tableColCount" class="px-4 py-6">
                <div class="space-y-4 animate-pulse">
                  <div
                    v-for="n in skeletonRows"
                    :key="'skeleton-' + n"
                    class="h-14 w-full rounded-lg bg-gray-200"
                  />
                </div>
              </td>
            </tr>

            <tr v-else-if="!filteredTableData.length">
              <td :colspan="tableColCount" class="py-8 text-gray-400 text-sm">
                Tidak ada data
              </td>
            </tr>

            <tr
              v-else
              v-for="row in paginatedTableData"
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
              <td
                class="px-4 py-3 text-sm sticky right-0 z-10 min-w-[140px] shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]"
              >
                <span
                  class="px-2 py-1 rounded-full text-xs font-semibold capitalize"
                  :class="getStatusClass(row.status)"
                >
                  {{ row.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- PAGINATION -->
    <div
      v-if="totalItems > 0"
      class="flex items-center justify-between px-4 py-4"
    >
      <div class="text-xs text-gray-600">
        Menampilkan {{ paginatedTableData.length }} dari {{ totalItems }} data
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
          Back
        </button>

        <!-- PAGE NUMBERS -->
        <div class="flex items-center gap-1">
          <button
            v-if="paginationPages[0] > 1"
            @click="currentPage = 1"
            class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100"
          >
            1
          </button>

          <span v-if="paginationPages[0] > 2" class="px-2 text-gray-400">
            ...
          </span>

          <button
            v-for="page in paginationPages"
            :key="page"
            @click="currentPage = page"
            :class="[
              'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium',
              currentPage === page
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-primary-50',
            ]"
          >
            {{ page }}
          </button>

          <span
            v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
            class="px-2 text-gray-400"
          >
            ...
          </span>

          <button
            v-if="paginationPages[paginationPages.length - 1] < totalPages"
            @click="currentPage = totalPages"
            class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100"
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
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
//IMPORT
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { FileDown, RotateCcw, ChevronDown } from "lucide-vue-next";
import { useToast } from "#imports";
import { useLaporan } from "~/composables/useLaporan";
import * as XLSX from "xlsx";

//COMPOSABLE
const { getRekapNaskah, getAreaList, getJenisList } = useLaporan();
const toast = useToast();

//CONST UTIL
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Rekap Naskah", to: "/admin/laporan/rekap-naskah" },
];

const getStatusClass = (status: string) => {
  if (status === "terpakai") return "bg-green-100 text-green-700";
  if (status === "booking") return "bg-blue-100 text-blue-700";
  return "bg-red-100 text-red-700";
};

//STATE

// filter utama
const selectedYear = ref(new Date().getFullYear());
const selectedMonth = ref("");
const selectedType = ref("");
const selectedArea = ref("");
const selectedStatuses = ref<string[]>([]);

// dropdown & search
const openDropdown = ref<null | string>(null);
const openFilterLokasi = ref(false);
const searchLokasi = ref("");
const lokasiSearch = ref("");
const jenisSearch = ref("");

// pagination
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsPerPageOptions = [5, 10, 20, 50];

// data
const rekapData = ref<any[]>([]);
const areaOptions = ref<{ label: string; value: string }[]>([]);
const jenisOptions = ref<any[]>([]);
const loading = ref(false);

//COMPUTED

const yearOptions = computed(() => {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2];
});

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
  { label: "Hangus", value: "hangus" },
  { label: "Booking", value: "booking" },
];

const selectedMonthLabel = computed(() => {
  return monthOptions.find((m) => m.value === selectedMonth.value)?.label ?? "";
});

const selectedTypeLabel = computed(() => {
  if (!selectedType.value) return "Semua Jenis";
  return (
    jenisOptions.value.find((j) => j.jenis === selectedType.value)
      ?.jenis_text ?? "Semua Jenis"
  );
});

//FILTERING
const filteredJenisOptions = computed(() => {
  if (!jenisSearch.value) return jenisOptions.value;
  return jenisOptions.value.filter((item) =>
    item.jenis_text.toLowerCase().includes(jenisSearch.value.toLowerCase()),
  );
});

const filteredLokasiOptions = computed(() => {
  if (!searchLokasi.value) return areaOptions.value;
  return areaOptions.value.filter((item) =>
    item.label.toLowerCase().includes(searchLokasi.value.toLowerCase()),
  );
});

const filteredTableData = computed(() => {
  let data = [...rekapData.value];

  if (selectedStatuses.value.length) {
    data = data.filter((row) => selectedStatuses.value.includes(row.status));
  }

  if (selectedType.value) {
    const jenisText = jenisOptions.value.find(
      (j) => j.jenis === selectedType.value,
    )?.jenis_text;

    data = data.filter((row) => row.naskah === jenisText);
  }

  return data;
});

//PAGINATION
const totalItems = computed(() => filteredTableData.value.length);

const totalPages = computed(() =>
  Math.ceil(totalItems.value / rowsPerPage.value),
);

const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredTableData.value.slice(start, start + rowsPerPage.value);
});

const paginationPages = computed(() => {
  const windowSize = 5;
  const pages: number[] = [];

  let start = Math.max(1, currentPage.value - Math.floor(windowSize / 2));
  let end = start + windowSize - 1;

  if (end > totalPages.value) {
    end = totalPages.value;
    start = Math.max(1, end - windowSize + 1);
  }

  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

//WATCH
watch(rowsPerPage, () => (currentPage.value = 1));

watch(
  [selectedYear, selectedArea, selectedStatuses, selectedType, selectedMonth],
  () => (currentPage.value = 1),
  { deep: true },
);

watch(selectedType, (val) => {
  if (!val) {
    jenisSearch.value = "";
    return;
  }
  const found = jenisOptions.value.find((j) => j.jenis === val);
  if (found) jenisSearch.value = found.jenis_text;
});

//API FETCH
const fetchRekap = async () => {
  loading.value = true;
  try {
    const params: any = { tahun: selectedYear.value };

    if (selectedArea.value) params.area = selectedArea.value;
    if (selectedStatuses.value.length === 1)
      params.status = selectedStatuses.value[0];
    if (selectedType.value) params.jenis = selectedType.value;

    const res = await getRekapNaskah(params);

    rekapData.value = res.data.rekap.map((item: any, idx: number) => ({
      id: idx,
      naskah: item.jenis_text,
      status: item.status,
      januari: item.jan,
      februari: item.feb,
      maret: item.mar,
      april: item.apr,
      mei: item.mei,
      juni: item.jun,
      juli: item.jul,
      agustus: item.agu,
      september: item.sep,
      oktober: item.okt,
      november: item.nov,
      desember: item.des,
      jumlah: item.total,
    }));
  } finally {
    loading.value = false;
  }
};

const fetchArea = async () => {
  const res = await getAreaList();
  const raw = res?.data?.data || res?.data || [];

  areaOptions.value = raw.map((item: any) => ({
    label: item.longText,
    value: item.area,
  }));
};

const fetchJenis = async () => {
  const res = await getJenisList();
  jenisOptions.value = res.data;
};

//SELECT HANDLER
const selectJenis = (item: any | null) => {
  if (!item) {
    selectedType.value = "";
    jenisSearch.value = "";
  } else {
    selectedType.value = item.jenis;
    jenisSearch.value = item.jenis_text;
  }
  openDropdown.value = null;
};

const selectLokasi = (item: { label: string; value: string } | null) => {
  if (!item) {
    selectedArea.value = "";
    lokasiSearch.value = "";
  } else {
    selectedArea.value = item.value;
    lokasiSearch.value = item.label;
  }
  openDropdown.value = null;
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

const toggle = (key: string) => {
  openDropdown.value = openDropdown.value === key ? null : key;
};

//EXPORT
const exportExcel = () => {
  if (!filteredTableData.value.length) {
    toast.add({
      title: "Export dibatalkan",
      description: "Data kosong, tidak ada yang bisa diexport",
      color: "warning",
      icon: "i-lucide-alert-circle",
    });
    return;
  }

  try {
    const rows: any[] = [];

    filteredTableData.value.forEach((row) => {
      const baseRow: any = { Naskah: row.naskah };

      if (selectedMonth.value) {
        baseRow[selectedMonthLabel.value] = row[selectedMonth.value] ?? 0;
      } else {
        monthOptions.forEach((b) => {
          baseRow[b.label] = row[b.value] ?? 0;
        });
      }

      baseRow["Jumlah"] = row.jumlah;
      baseRow["Status"] = row.status;
      rows.push(baseRow);
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap");

    const fileName = `rekap-naskah-${selectedYear.value}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.add({
      title: "Export berhasil",
      description: `File excel berhasil diunduh`,
      color: "success",
      icon: "i-lucide-file-check",
    });
  } catch (error) {
    console.error(error);

    toast.add({
      title: "Export gagal",
      description: "Terjadi kesalahan saat membuat file Excel",
      color: "error",
      icon: "i-lucide-x-circle",
    });
  }
};

//LIFECYLE
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest(".relative")) {
    openDropdown.value = null;
    openFilterLokasi.value = false;
  }
};

onMounted(() => {
  fetchRekap();
  fetchArea();
  fetchJenis();
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

//UI HELPER
const refreshData = async () => {
  selectedMonth.value = "";
  selectedType.value = "";
  jenisSearch.value = "";
  selectedStatuses.value = [];
  selectedArea.value = "";
  selectedYear.value = new Date().getFullYear();

  await fetchRekap();
};

const tableColCount = computed(() => {
  if (selectedMonth.value) return 4;
  return 1 + monthOptions.length + 2;
});

const skeletonRows = computed(() => {
  return selectedMonth.value ? 4 : 6;
});
</script>
