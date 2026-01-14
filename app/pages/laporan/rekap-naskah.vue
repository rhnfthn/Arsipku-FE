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
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { FileDown, RotateCcw, ChevronDown } from "lucide-vue-next";
import { useToast } from "#imports";
import { useLaporan } from "~/composables/useLaporan";

const { getRekapNaskah, getAreaList } = useLaporan();

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
const selectedStatuses = ref<string[]>([]);
const selectedArea = ref<string>("");
const selectedLokasi = ref("");
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

const rekapData = ref<any[]>([]);
const loading = ref(false);

const fetchRekap = async () => {
  loading.value = true;
  try {
    const params: any = {
      tahun: selectedYear.value,
    };

    if (selectedArea.value) {
      params.area = selectedArea.value;
    }

    if (selectedStatuses.value.length === 1) {
      params.status = selectedStatuses.value[0];
    }

    const res = await getRekapNaskah(params);

    rekapData.value = res.data.rekap.map((item: any, idx: number) => ({
      id: idx,
      naskah: item.jenis_text,
      status: res.data.status,
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

watch([selectedYear, selectedArea, selectedStatuses], fetchRekap, {
  deep: true,
});

onMounted(() => {
  fetchRekap();
  fetchArea();
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
  { label: "Hangus", value: "tidak terpakai" },
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

const filteredTableData = computed(() => rekapData.value);

const refreshData = () => {
  selectedMonth.value = "";
  selectedType.value = "";
  selectedStatuses.value = [];
  selectedArea.value = "";
  selectedYear.value = new Date().getFullYear();
  fetchRekap();
};
</script>
