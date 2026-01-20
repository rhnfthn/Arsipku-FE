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
    <div
      class="sticky top-0 z-40 bg-white flex items-start gap-3 p-3 relative z-50"
    >
      <div class="flex flex-wrap gap-3">
        <!-- Refresh -->
        <button
          @click="refreshData"
          :disabled="loading"
          class="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50"
        >
          <RotateCcw class="w-4 h-4" :class="loading ? 'animate-spin' : ''" />
        </button>

        <div class="relative min-w-[220px]">
          <input
            v-model="jenisSearch"
            @focus="openDropdown = 'type'"
            @keydown.escape="openDropdown = null"
            type="text"
            placeholder="Semua Jenis"
            class="w-full rounded-md p-2 text-sm bg-gray-100 pr-8 focus:outline-none placeholder:text-black"
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
            class="rounded-md p-2 text-sm bg-gray-100 flex items-center gap-2 min-w-[100px]"
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

        <!-- LOKASI -->
        <div class="relative">
          <button
            @click="toggle('lokasi')"
            class="rounded-md p-2 text-sm bg-gray-100 flex items-center gap-2 min-w-[150px]"
          >
            <span>{{ selectedLokasi || "Semua Lokasi" }}</span>
            <ChevronDown class="w-4 h-4 ml-auto" />
          </button>

          <div
            v-if="openDropdown === 'lokasi'"
            class="absolute z-[999] mt-1 bg-white rounded-lg shadow-md w-full max-h-60 overflow-y-auto"
          >
            <button
              @click="
                selectedArea = '';
                selectedLokasi = '';
                openDropdown = null;
              "
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              Semua Lokasi
            </button>

            <button
              v-for="area in areaOptions"
              :key="area.value"
              @click="
                selectedArea = area.value;
                selectedLokasi = area.label;
                openDropdown = null;
              "
              class="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
            >
              {{ area.label }}
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { FileDown, RotateCcw, ChevronDown } from "lucide-vue-next";
import { useToast } from "#imports";
import { useLaporan } from "~/composables/useLaporan";
import * as XLSX from "xlsx";

const { getRekapNaskah, getAreaList, getJenisList } = useLaporan();

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Rekap Naskah", to: "/admin/laporan/rekap-naskah" },
];
const getStatusClass = (status: string) => {
  if (status === "terpakai") return "bg-green-100 text-green-700";
  if (status === "booking") return "bg-blue-100 text-blue-700";
  return "bg-red-100 text-red-700";
};

// const items = [
//   {
//     label: "Home",
//     to: "/dashboard",
//   },
//   {
//     label: "Rekap Naskah",
//     to: "/admin/laporan/rekap-naskah",
//   },
// ] satisfies BreadcrumbItem[];

const selectedYear = ref(2025);
const selectedType = ref("");
const selectedMonth = ref("");
const selectedStatuses = ref<string[]>([]);
const selectedArea = ref<string>("");
const selectedLokasi = ref("");
const isStatusOpen = ref(false);
const openDropdown = ref<null | string>(null);

const toast = useToast();

const exportExcel = () => {
  if (!filteredTableData.value.length) {
    toast.add({
      title: "Tidak ada data",
      description: "Data kosong, tidak bisa diexport",
      color: "warning",
    });
    return;
  }

  const rows: any[] = [];

  filteredTableData.value.forEach((row) => {
    const baseRow: any = {
      Naskah: row.naskah,
    };

    if (selectedMonth.value) {
      // export 1 bulan saja
      baseRow[selectedMonthLabel.value] = row[selectedMonth.value] ?? 0;
    } else {
      // export semua bulan
      monthOptions.forEach((bulan) => {
        baseRow[bulan.label] = row[bulan.value] ?? 0;
      });
    }

    baseRow["Jumlah"] = row.jumlah;
    baseRow["Status"] = row.status;

    rows.push(baseRow);
  });

  // buat worksheet & workbook
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap");

  // download
  XLSX.writeFile(workbook, `rekap-naskah-${selectedYear.value}.xlsx`);

  toast.add({
    title: "Berhasil!",
    description: `Rekap tahun ${selectedYear.value} berhasil diexport`,
    color: "success",
    icon: "i-lucide-check-circle",
  });
};

const rekapData = ref<any[]>([]);
const loading = ref(false);

const fetchRekap = async () => {
  loading.value = true;
  try {
    const params: any = {
      tahun: selectedYear.value, // wajib
    };

    if (selectedArea.value) {
      params.area = selectedArea.value;
    }

    if (selectedStatuses.value.length === 1) {
      params.status = selectedStatuses.value[0];
    }

    if (selectedType.value) {
      params.jenis = selectedType.value;
    }

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
  try {
    const res = await getAreaList();

    const raw = res?.data?.data || res?.data || [];

    areaOptions.value = raw.map((item: any) => ({
      label: item.longText,
      value: item.area,
    }));
  } catch (e) {
    console.error("Gagal mengambil area", e);
  }
};

watch(
  [selectedYear, selectedArea, selectedStatuses, selectedType],
  fetchRekap,
  { deep: true },
);

const jenisOptions = ref<any[]>([]);

const selectedTypeLabel = computed(() => {
  if (!selectedType.value) return "Semua Jenis";
  return (
    jenisOptions.value.find((j) => j.jenis === selectedType.value)
      ?.jenis_text ?? "Semua Jenis"
  );
});

const fetchJenis = async () => {
  try {
    const res = await getJenisList();
    jenisOptions.value = res.data;
  } catch (e) {
    console.error("Gagal mengambil jenis", e);
  }
};

onMounted(() => {
  fetchRekap();
  fetchArea();
  fetchJenis();
});

const tableColCount = computed(() => {
  if (selectedMonth.value) return 4;
  return 1 + monthOptions.length + 2;
});

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear - 1, currentYear - 2];
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

const areaOptions = ref<{ label: string; value: string }[]>([]);

const statusOptions = [
  { label: "Terpakai", value: "terpakai" },
  { label: "Hangus", value: "hangus" },
  { label: "Booking", value: "booking" },
];

const toggle = (key: string) => {
  openDropdown.value = openDropdown.value === key ? null : key;
};

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
  if (selectedStatuses.value[0] === status) {
    selectedStatuses.value = [];
  } else {
    selectedStatuses.value = [status];
  }
  openDropdown.value = null;
};

const filteredTableData = computed(() => {
  let data = [...rekapData.value];

  // filter STATUS
  if (selectedStatuses.value.length === 1) {
    data = data.filter((row) => row.status === selectedStatuses.value[0]);
  }

  // filter JENIS
  if (selectedType.value) {
    data = data.filter(
      (row) =>
        row.naskah ===
        jenisOptions.value.find((j) => j.jenis === selectedType.value)
          ?.jenis_text,
    );
  }

  return data;
});

const jenisSearch = ref("");

const filteredJenisOptions = computed(() => {
  if (!jenisSearch.value) return jenisOptions.value;

  return jenisOptions.value.filter((item) =>
    item.jenis_text.toLowerCase().includes(jenisSearch.value.toLowerCase()),
  );
});

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

watch(selectedType, (val) => {
  if (!val) {
    jenisSearch.value = "";
    return;
  }

  const found = jenisOptions.value.find((j) => j.jenis === val);
  if (found) {
    jenisSearch.value = found.jenis_text;
  }
});

const refreshData = async () => {
  selectedMonth.value = "";
  selectedType.value = "";
  jenisSearch.value = "";
  selectedStatuses.value = [];
  selectedArea.value = "";
  selectedLokasi.value = "";
  selectedYear.value = new Date().getFullYear();

  await fetchRekap();
};

const skeletonRows = computed(() => {
  return selectedMonth.value ? 4 : 6;
});
</script>
