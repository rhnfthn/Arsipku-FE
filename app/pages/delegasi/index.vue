<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import {
  Search,
  ArrowUpDown,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-vue-next";

import Modal from "~/components/Modal.vue";
import ConfirmPopup from "~/components/ConfirmPopup.vue";
import Heading from "~/components/Heading.vue";

import { useDelegasi } from "~/composables/useDelegasi";
import type {
  JabatanItem,
  PersonilItem,
  PositionStatusItem,
} from "~/types/delegasi";

const toast = useToast();

const {
  getDelegasiList,
  getPersonilList,
  getPositionStatuses,
  getJabatanList,
  createDelegasi,
  updateDelegasi,
  deleteDelegasi,
} = useDelegasi();

// STATE
const isLoading = ref(false);
const isSubmitting = ref(false);
const search = ref("");
const filterStatus = ref("Semua");
const filterLokasi = ref("Semua");
const filterJabatan = ref("Semua");
const sortDirection = ref<"asc" | "desc" | null>(null);

const showAddModal = ref(false);
const showEditModal = ref(false);

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Delegasi", to: "/delegasi" },
];

const listDelegasi = ref<any[]>([]);
const totalItems = ref(0);
const totalPagesApi = ref(1);

const listLokasi = computed(() => {
  const set = new Set(listDelegasi.value.map((item) => item.lokasi));
  return Array.from(set).sort();
});

const listJabatan = computed(() => {
  const set = new Set(listDelegasi.value.map((item) => item.jabatan));
  return Array.from(set).sort();
});

// FILTER DROPDOWN STATE (custom - hanya untuk 3 filter ini)
const openFilterStatus = ref(false);
const openFilterLokasi = ref(false);
const openFilterJabatan = ref(false);

const statusOptions = [
  { label: "Semua Status", value: "Semua" },
  { label: "Aktif", value: "aktif" },
  { label: "Akan Datang", value: "tidak_aktif" },
  { label: "Kadaluwarsa", value: "kedaluwarsa" },
];

const statusLabel = computed(
  () =>
    statusOptions.find((s) => s.value === filterStatus.value)?.label ??
    "Semua Status",
);
const lokasiLabel = computed(() =>
  filterLokasi.value === "Semua" ? "Semua Lokasi" : filterLokasi.value,
);
const jabatanLabel = computed(() =>
  filterJabatan.value === "Semua" ? "Semua Jabatan" : filterJabatan.value,
);

function toggleFilterStatus() {
  openFilterStatus.value = !openFilterStatus.value;
  openFilterLokasi.value = false;
  openFilterJabatan.value = false;
}
function toggleFilterLokasi() {
  openFilterLokasi.value = !openFilterLokasi.value;
  openFilterStatus.value = false;
  openFilterJabatan.value = false;
}
function toggleFilterJabatan() {
  openFilterJabatan.value = !openFilterJabatan.value;
  openFilterStatus.value = false;
  openFilterLokasi.value = false;
}
function selectFilterStatus(val: string) {
  filterStatus.value = val;
  openFilterStatus.value = false;
}
function selectFilterLokasi(val: string) {
  filterLokasi.value = val;
  openFilterLokasi.value = false;
}
function selectFilterJabatan(val: string) {
  filterJabatan.value = val;
  openFilterJabatan.value = false;
}

// FETCH DATA
const rowsPerPage = ref(10);
const currentPage = ref(1);

const fetchData = async () => {
  isLoading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: rowsPerPage.value,
      search: search.value,
      status: filterStatus.value === "Semua" ? undefined : filterStatus.value,
    };
    const res = await getDelegasiList(params);
    const wrapper = res.data;
    const dataArray = wrapper?.data || [];
    const meta = wrapper?.meta;
    if (!Array.isArray(dataArray)) {
      listDelegasi.value = [];
      return;
    }
    listDelegasi.value = dataArray.map((item: any) => ({
      id: item.id,
      delegator_nama: item.name || "-",
      delegator_jabatan: item.position_text || "-",
      nama: item.as_name || "-",
      lokasi: item.as_organization_text || item.as_area_text || "-",
      sebagai: item.position_status || "-",
      jabatan: item.as_position_text || "-",
      tanggal: `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`,
      status: item.status?.label || "-",
      raw: item,
    }));
    if (meta) {
      totalItems.value = meta.total;
      totalPagesApi.value = meta.totalPages;
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  } finally {
    isLoading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
};

const handleApiError = (error: any) => {
  let message = "Terjadi kesalahan pada sistem.";
  const errData = error.data || error.response?._data || error.response?.data;
  if (errData) {
    if (Array.isArray(errData.message)) message = errData.message[0];
    else if (typeof errData.message === "string") message = errData.message;
  } else if (error.message) {
    message = error.message;
  }
  toast.add({ title: "Gagal", description: message, color: "error" });
};

const validateDates = (start: string, end: string) => {
  if (!start || !end) return "Tanggal mulai dan sampai harus diisi.";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (startDate < today)
    return "Tanggal mulai tidak boleh kurang dari hari ini.";
  if (endDate < startDate)
    return "Tanggal sampai tidak boleh kurang dari tanggal mulai.";
  return null;
};

const toggleSort = () => {
  if (!sortDirection.value) sortDirection.value = "asc";
  else if (sortDirection.value === "asc") sortDirection.value = "desc";
  else sortDirection.value = null;
};

const refreshData = () => {
  search.value = "";
  filterStatus.value = "Semua";
  filterLokasi.value = "Semua";
  filterJabatan.value = "Semua";
  sortDirection.value = null;
  currentPage.value = 1;
  fetchData();
};

const filteredData = computed(() => {
  let data = [...listDelegasi.value];
  if (filterLokasi.value !== "Semua")
    data = data.filter((item) => item.lokasi === filterLokasi.value);
  if (filterJabatan.value !== "Semua")
    data = data.filter((item) => item.jabatan === filterJabatan.value);
  if (sortDirection.value === "asc")
    data.sort((a, b) => a.nama.localeCompare(b.nama));
  if (sortDirection.value === "desc")
    data.sort((a, b) => b.nama.localeCompare(a.nama));
  return data;
});

// DELETE
const confirmDeleteOpen = ref(false);
const itemToDelete = ref<any>(null);

const openDelete = (item: any) => {
  itemToDelete.value = item;
  confirmDeleteOpen.value = true;
};

const deleteNow = async () => {
  if (!itemToDelete.value) return;
  isSubmitting.value = true;
  try {
    await deleteDelegasi(itemToDelete.value.id);
    confirmDeleteOpen.value = false;
    toast.add({
      title: "Berhasil",
      description: `Data delegasi ${itemToDelete.value.nama} berhasil dihapus.`,
      color: "success",
    });
    fetchData();
  } catch (error) {
    handleApiError(error);
  } finally {
    isSubmitting.value = false;
  }
};

// DROPDOWN DATA API
const personilOptions = ref<PersonilItem[]>([]);
const sebagaiOptions = ref<PositionStatusItem[]>([]);
const jabatanOptions = ref<JabatanItem[]>([]);
const jabatanSearch = ref("");
const personilSearch = ref("");
const sebagaiSearch = ref("");

const jabatanList = computed(() =>
  jabatanOptions.value.map((j) => ({
    id: j.id,
    label: `${j.persnumText || "empty"} - ${j.displayText || "empty"}`,
    value: j.id,
    raw: j,
  })),
);
const filteredJabatanList = computed(() => {
  const query = jabatanSearch.value.toLowerCase();
  if (!query) return jabatanList.value.slice(0, 10);
  return jabatanList.value
    .filter((item) => item.label.toLowerCase().includes(query))
    .slice(0, 10);
});
const personilList = computed(() =>
  personilOptions.value.map((p) => ({
    id: p.persnum,
    label: p.displayText,
    value: p.persnum,
    raw: p,
  })),
);
const filteredPersonilList = computed(() => {
  const query = personilSearch.value.toLowerCase();
  if (!query) return personilList.value.slice(0, 10);
  return personilList.value
    .filter((item) => item.label.toLowerCase().includes(query))
    .slice(0, 10);
});
const sebagaiList = computed(() =>
  sebagaiOptions.value.map((s) => ({
    id: s.value,
    label: s.label,
    value: s.value,
  })),
);
const filteredSebagaiList = computed(() => {
  const query = sebagaiSearch.value.toLowerCase();
  if (!query) return sebagaiList.value.slice(0, 10);
  return sebagaiList.value
    .filter((item) => item.label.toLowerCase().includes(query))
    .slice(0, 10);
});

const openNewPersonil = ref(false);
const openNewSebagai = ref(false);
const openNewJabatan = ref(false);
const openEditPersonil = ref(false);
const openEditSebagai = ref(false);
const openEditJabatan = ref(false);

function toggleNewJabatan() {
  openNewJabatan.value = !openNewJabatan.value;
  if (openNewJabatan.value) jabatanSearch.value = "";
}
function toggleEditJabatan() {
  openEditJabatan.value = !openEditJabatan.value;
  if (openEditJabatan.value) jabatanSearch.value = "";
}
function toggleNewPersonil() {
  openNewPersonil.value = !openNewPersonil.value;
  if (openNewPersonil.value) personilSearch.value = "";
}
function toggleEditPersonil() {
  openEditPersonil.value = !openEditPersonil.value;
  if (openEditPersonil.value) personilSearch.value = "";
}
function toggleNewSebagai() {
  openNewSebagai.value = !openNewSebagai.value;
  if (openNewSebagai.value) sebagaiSearch.value = "";
}
function toggleEditSebagai() {
  openEditSebagai.value = !openEditSebagai.value;
  if (openEditSebagai.value) sebagaiSearch.value = "";
}

onMounted(async () => {
  await Promise.all([
    fetchData(),
    getPersonilList().then((res) => (personilOptions.value = res)),
    getPositionStatuses().then((res) => (sebagaiOptions.value = res)),
    getJabatanList().then((res) => (jabatanOptions.value = res)),
  ]);
  document.addEventListener("click", handleDocumentClick);
});

// ADD
const newDelegasi = ref({
  personil: "",
  sebagai: "",
  jabatan: "",
  mulai: "",
  sampai: "",
});
const getPersonilLabel = (val: string) =>
  personilList.value.find((p) => p.value === val)?.label || val;
const getSebagaiLabel = (val: string) =>
  sebagaiList.value.find((s) => s.value === val)?.label || val;
const getJabatanLabel = (val: string) =>
  jabatanList.value.find((j) => j.value === val)?.label || val;

const openAdd = () => {
  newDelegasi.value = {
    personil: "",
    sebagai: "",
    jabatan: "",
    mulai: "",
    sampai: "",
  };
  showAddModal.value = true;
};

const saveDelegasi = async () => {
  const errorMsg = validateDates(
    newDelegasi.value.mulai,
    newDelegasi.value.sampai,
  );
  if (errorMsg) {
    toast.add({
      title: "Validasi Gagal",
      description: errorMsg,
      color: "error",
    });
    return;
  }
  isSubmitting.value = true;
  try {
    const selectedPersonil = personilOptions.value.find(
      (p) => p.persnum === newDelegasi.value.personil,
    );
    const payload = {
      start_date: newDelegasi.value.mulai,
      end_date: newDelegasi.value.sampai,
      position_status: newDelegasi.value.sebagai,
      as_persnum: newDelegasi.value.personil,
      as_name: selectedPersonil?.name,
      as_position: newDelegasi.value.jabatan,
    };
    await createDelegasi(payload);
    showAddModal.value = false;
    toast.add({
      title: "Berhasil",
      description: "Data delegasi berhasil ditambahkan.",
      color: "success",
    });
    fetchData();
  } catch (error) {
    handleApiError(error);
  } finally {
    isSubmitting.value = false;
  }
};

// EDIT
const editDelegasi = ref({
  id: "",
  personil: "",
  sebagai: "",
  jabatan: "",
  mulai: "",
  sampai: "",
});

const openEdit = (item: any) => {
  const raw = item.raw;
  editDelegasi.value = {
    id: item.id,
    personil: raw.as_persnum || "",
    sebagai: raw.position_status || "PH",
    jabatan: raw.as_position || "",
    mulai: raw.start_date,
    sampai: raw.end_date,
  };
  showEditModal.value = true;
};

const saveEditDelegasi = async () => {
  const errorMsg = validateDates(
    editDelegasi.value.mulai,
    editDelegasi.value.sampai,
  );
  if (errorMsg) {
    toast.add({
      title: "Validasi Gagal",
      description: errorMsg,
      color: "error",
    });
    return;
  }
  isSubmitting.value = true;
  try {
    const payload = {
      start_date: editDelegasi.value.mulai,
      end_date: editDelegasi.value.sampai,
      position_status: editDelegasi.value.sebagai,
      as_persnum: editDelegasi.value.personil,
      as_position: editDelegasi.value.jabatan,
    };
    await updateDelegasi(editDelegasi.value.id, payload);
    showEditModal.value = false;
    toast.add({
      title: "Berhasil",
      description: "Data delegasi berhasil diperbarui.",
      color: "success",
    });
    fetchData();
  } catch (error) {
    handleApiError(error);
  } finally {
    isSubmitting.value = false;
  }
};

const paginatedDelegasi = computed(() => filteredData.value);
const totalPages = computed(() => totalPagesApi.value);

const paginationPages = computed(() => {
  const total = totalPages.value,
    current = currentPage.value;
  const pages: number[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 2) pages.push(1, 2, 3, 4, 5);
    else if (current >= total - 1) pages.push(total - 2, total - 1, total);
    else pages.push(current - 1, current, current + 1);
  }
  return pages;
});

watch(
  [search, filterStatus, filterLokasi, filterJabatan, rowsPerPage],
  () => {
    currentPage.value = 1;
    fetchData();
  },
  { deep: true },
);
watch(currentPage, () => {
  fetchData();
});

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const dropdownEls = document.querySelectorAll("[data-custom-dropdown]");
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) return;
  }
  openNewPersonil.value = false;
  openNewSebagai.value = false;
  openNewJabatan.value = false;
  openEditPersonil.value = false;
  openEditSebagai.value = false;
  openEditJabatan.value = false;
  openFilterStatus.value = false;
  openFilterLokasi.value = false;
  openFilterJabatan.value = false;
}

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});

function selectNewPersonil(val: string) {
  newDelegasi.value.personil = val;
  openNewPersonil.value = false;
}
function selectNewSebagai(val: string) {
  newDelegasi.value.sebagai = val;
  openNewSebagai.value = false;
}
function selectNewJabatan(val: string) {
  newDelegasi.value.jabatan = val;
  openNewJabatan.value = false;
}
function selectEditPersonil(val: string) {
  editDelegasi.value.personil = val;
  openEditPersonil.value = false;
}
function selectEditSebagai(val: string) {
  editDelegasi.value.sebagai = val;
  openEditSebagai.value = false;
}
function selectEditJabatan(val: string) {
  editDelegasi.value.jabatan = val;
  openEditJabatan.value = false;
}

const exportData = () => {
  const headers = ["Nama", "Jabatan", "Lokasi", "Periode", "Status"];
  const rows = listDelegasi.value.map((i) => [
    i.nama,
    i.jabatan,
    i.lokasi,
    i.tanggal,
    i.status,
  ]);
  const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "delegasi.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div class="space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900 pt-5">
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-white"
          >Delegasi</Heading
        >
        <PageHeader :items="breadcrumbs" />
      </div>
      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        Tambah Delegasi
      </button>
    </div>

    <div
      class="flex flex-col w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <div
        class="p-3 border-b border-gray-300 dark:border-gray-700 flex flex-col sm:flex-row justify-between"
      >
        <div class="flex items-center gap-3 flex-wrap">
          <select
            v-model="rowsPerPage"
            class="border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option v-for="n in [5, 10, 15]" :key="n" :value="n">
              {{ n }}
            </option>
          </select>

          <div class="flex items-center gap-2">
            <button
              @click="toggleSort"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
              title="Urutkan"
            >
              <ArrowUpDown class="w-4 h-4" />
            </button>
            <button
              @click="refreshData"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
              title="Refresh"
            >
              <RotateCcw
                class="w-4 h-4"
                :class="{ 'animate-spin': isLoading }"
              />
            </button>
          </div>

          <!-- FILTER STATUS -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterStatus"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] justify-between shadow-none"
            >
              <span class="truncate">{{ statusLabel }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterStatus }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterStatus"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[160px]"
              >
                <button
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  type="button"
                  @click.stop="selectFilterStatus(opt.value)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    filterStatus === opt.value
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- FILTER LOKASI -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterLokasi"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] max-w-[200px] justify-between"
            >
              <span class="truncate">{{ lokasiLabel }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterLokasi }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterLokasi"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[180px] max-h-56 overflow-y-auto"
              >
                <button
                  type="button"
                  @click.stop="selectFilterLokasi('Semua')"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700',
                    filterLokasi === 'Semua'
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  Semua Lokasi
                </button>
                <button
                  v-for="lok in listLokasi"
                  :key="lok"
                  type="button"
                  @click.stop="selectFilterLokasi(lok)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    filterLokasi === lok
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ lok }}
                </button>
              </div>
            </Transition>
          </div>

          <!-- FILTER JABATAN -->
          <div class="relative" data-custom-dropdown>
            <button
              type="button"
              @click.stop="toggleFilterJabatan"
              class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] max-w-[200px] justify-between"
            >
              <span class="truncate">{{ jabatanLabel }}</span>
              <ChevronDown
                class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200"
                :class="{ 'rotate-180': openFilterJabatan }"
              />
            </button>
            <Transition name="filter-dd">
              <div
                v-if="openFilterJabatan"
                class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[200px] max-h-56 overflow-y-auto"
              >
                <button
                  type="button"
                  @click.stop="selectFilterJabatan('Semua')"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700',
                    filterJabatan === 'Semua'
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  Semua Jabatan
                </button>
                <button
                  v-for="jab in listJabatan"
                  :key="jab"
                  type="button"
                  @click.stop="selectFilterJabatan(jab)"
                  :class="[
                    'w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0',
                    filterJabatan === jab
                      ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                      : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ jab }}
                </button>
              </div>
            </Transition>
          </div>
        </div>

        <div class="relative">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model.lazy="search"
            type="text"
            placeholder="Cari..."
            class="pl-9 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-50 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
        </div>
        <button
          @click="exportData"
          class="flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium text-white bg-primary dark:bg-primary-600 hover:bg-primary-700 dark:hover:bg-primary-700 transition-colors shadow-sm"
        >
          Export
        </button>
      </div>

      <div class="overflow-x-auto relative">
        <table class="min-w-full text-sm">
          <thead class="bg-primary dark:bg-primary-700">
            <tr>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap"
              >
                Delegator
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap"
              >
                Penerima Delegasi
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap"
              >
                Sebagai Jabatan
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap"
              >
                Periode
              </th>
              <th
                class="px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap"
              >
                Status
              </th>
              <th
                class="px-4 py-3 text-center text-sm font-semibold text-white whitespace-nowrap"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <template v-if="isLoading">
              <tr
                v-for="n in rowsPerPage"
                :key="'skeleton-' + n"
                class="animate-pulse bg-white dark:bg-gray-800"
              >
                <td class="px-4 py-2">
                  <div
                    class="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"
                  ></div>
                  <div
                    class="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"
                  ></div>
                </td>
                <td class="px-4 py-2">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"
                    ></div>
                    <div>
                      <div
                        class="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-2"
                      ></div>
                      <div
                        class="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-2">
                  <div
                    class="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2"
                  ></div>
                  <div
                    class="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"
                  ></div>
                </td>
                <td class="px-4 py-2">
                  <div
                    class="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"
                  ></div>
                </td>
                <td class="px-4 py-2">
                  <div
                    class="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"
                  ></div>
                </td>
                <td class="px-4 py-2">
                  <div class="flex justify-center gap-3">
                    <div
                      class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"
                    ></div>
                    <div
                      class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"
                    ></div>
                  </div>
                </td>
              </tr>
            </template>
            <template v-else-if="paginatedDelegasi.length === 0">
              <tr>
                <td
                  colspan="6"
                  class="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                  Tidak ada data ditemukan
                </td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="item in paginatedDelegasi"
                :key="item.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td class="px-4 py-2 min-w-[220px]">
                  <div class="flex flex-col">
                    <span class="text-gray-900 dark:text-white font-medium">{{
                      item.delegator_nama
                    }}</span>
                    <span
                      class="text-gray-500 dark:text-gray-400 text-xs mt-1"
                      >{{ item.delegator_jabatan }}</span
                    >
                  </div>
                </td>
                <td class="px-4 py-2 min-w-[220px]">
                  <div class="flex flex-col">
                    <span class="text-gray-900 dark:text-white font-medium">{{
                      item.nama
                    }}</span>
                    <span
                      class="text-gray-500 dark:text-gray-400 text-xs mt-1"
                      >{{ item.lokasi }}</span
                    >
                  </div>
                </td>
                <td class="px-4 py-2">
                  <div class="flex flex-col">
                    <span
                      class="text-primary dark:text-primary-400 font-semibold text-xs mb-1"
                      >Status: {{ item.sebagai }}</span
                    >
                    <span
                      class="text-gray-900 dark:text-white font-medium leading-snug"
                      >{{ item.jabatan }}</span
                    >
                  </div>
                </td>
                <td
                  class="px-4 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap text-xs"
                >
                  {{ item.tanggal }}
                </td>
                <td class="px-4 py-2">
                  <span
                    :class="[
                      'inline-flex px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap',
                      item.status === 'Aktif'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : item.status === 'Akan Datang' ||
                            item.status === 'Tidak Aktif' ||
                            item.status === 'tidak_aktif'
                          ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                          : item.status === 'Kedaluwarsa'
                            ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
                    ]"
                  >
                    {{
                      item.status === "Tidak Aktif" ||
                      item.status === "tidak_aktif"
                        ? "Akan Datang"
                        : item.status
                    }}
                  </span>
                </td>
                <td class="px-4 py-2">
                  <div class="flex justify-center gap-3">
                    <button
                      @click="openEdit(item)"
                      class="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-500 transition-colors"
                      title="Edit"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button
                      @click="openDelete(item)"
                      class="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-500 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div
        class="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          Menampilkan {{ paginatedDelegasi.length }} dari {{ totalItems }} data
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600',
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
            Sebelumnya
          </button>
          <div class="flex items-center gap-1">
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-9 h-9 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all font-medium"
            >
              1
            </button>
            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >...</span
            >
            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-8 h-8 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary dark:bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400',
              ]"
            >
              {{ page }}
            </button>
            <span
              v-if="
                paginationPages[paginationPages.length - 1] < totalPages - 1
              "
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
              >...</span
            >
            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-9 h-9 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all font-medium"
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
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600',
            ]"
          >
            Selanjutnya
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

    <Teleport to="body">
      <Modal
        v-model="showAddModal"
        @save="saveDelegasi"
        size="xl"
        :loading="isSubmitting"
      >
        <template #title
          ><Heading
            variant="heading9b"
            class="text-lg p-3 ml-3 font-bold text-gray-900 dark:text-white"
            >Tambah Delegasi</Heading
          ></template
        >
        <div class="flex flex-col gap-5 p-3">
          <div>
            <Heading
              variant="heading11m"
              class="text-xs font-medium dark:text-gray-200"
              >Personil <span class="text-red-500">*</span></Heading
            >
            <div class="relative" data-custom-dropdown>
              <button
                type="button"
                class="mt-1 w-full text-left border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 flex items-center justify-between hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @click.stop="toggleNewPersonil"
              >
                <span
                  class="text-sm text-gray-700 dark:text-gray-300 truncate pr-2"
                  >{{
                    getPersonilLabel(newDelegasi.personil) || "Pilih personil"
                  }}</span
                >
                <ChevronDown
                  class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
                />
              </button>
              <div
                v-if="openNewPersonil"
                class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col"
              >
                <div
                  class="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10"
                >
                  <div class="relative">
                    <Search
                      class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    /><input
                      v-model="personilSearch"
                      type="text"
                      placeholder="Cari personil..."
                      class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      @click.stop
                    />
                  </div>
                </div>
                <div class="overflow-y-auto max-h-48">
                  <div
                    v-if="filteredPersonilList.length === 0"
                    class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center"
                  >
                    Tidak ada data
                  </div>
                  <button
                    type="button"
                    v-for="p in filteredPersonilList"
                    :key="p.id"
                    class="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 truncate"
                    @click.prevent="selectNewPersonil(p.value)"
                  >
                    {{ p.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Heading
              variant="heading11m"
              class="text-xs font-medium dark:text-gray-200"
              >Sebagai <span class="text-red-500">*</span></Heading
            >
            <div class="relative" data-custom-dropdown>
              <button
                type="button"
                class="mt-1 w-full text-left border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 flex items-center justify-between hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @click.stop="toggleNewSebagai"
              >
                <span
                  class="text-sm text-gray-700 dark:text-gray-300 truncate pr-2"
                  >{{
                    getSebagaiLabel(newDelegasi.sebagai) || "Pilih peran"
                  }}</span
                >
                <ChevronDown
                  class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
                />
              </button>
              <div
                v-if="openNewSebagai"
                class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col"
              >
                <div
                  class="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10"
                >
                  <div class="relative">
                    <Search
                      class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    /><input
                      v-model="sebagaiSearch"
                      type="text"
                      placeholder="Cari peran..."
                      class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      @click.stop
                    />
                  </div>
                </div>
                <div class="overflow-y-auto max-h-48">
                  <div
                    v-if="filteredSebagaiList.length === 0"
                    class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center"
                  >
                    Tidak ada data
                  </div>
                  <button
                    type="button"
                    v-for="s in filteredSebagaiList"
                    :key="s.id"
                    class="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 truncate"
                    @click.prevent="selectNewSebagai(s.value)"
                  >
                    {{ s.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Heading
              variant="heading11m"
              class="text-xs font-medium dark:text-gray-200"
              >Jabatan <span class="text-red-500">*</span></Heading
            >
            <div class="relative" data-custom-dropdown>
              <button
                type="button"
                class="mt-1 w-full text-left border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 flex items-center justify-between hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @click.stop="toggleNewJabatan"
              >
                <span
                  class="text-sm text-gray-700 dark:text-gray-300 truncate pr-2"
                  >{{
                    getJabatanLabel(newDelegasi.jabatan) || "Pilih jabatan"
                  }}</span
                >
                <ChevronDown
                  class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
                />
              </button>
              <div
                v-if="openNewJabatan"
                class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col"
              >
                <div
                  class="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10"
                >
                  <div class="relative">
                    <Search
                      class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    /><input
                      v-model="jabatanSearch"
                      type="text"
                      placeholder="Cari jabatan..."
                      class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      @click.stop
                    />
                  </div>
                </div>
                <div class="overflow-y-auto max-h-48">
                  <div
                    v-if="filteredJabatanList.length === 0"
                    class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center"
                  >
                    Tidak ada data
                  </div>
                  <button
                    type="button"
                    v-for="j in filteredJabatanList"
                    :key="j.id"
                    class="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 truncate"
                    @click.prevent="selectNewJabatan(j.value)"
                  >
                    {{ j.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading
                variant="heading11m"
                class="text-xs font-medium dark:text-gray-200"
                >Mulai <span class="text-red-500">*</span></Heading
              >
              <input
                v-model="newDelegasi.mulai"
                type="date"
                class="mt-1 w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div>
              <Heading
                variant="heading11m"
                class="text-xs font-medium dark:text-gray-200"
                >Sampai <span class="text-red-500">*</span></Heading
              >
              <input
                v-model="newDelegasi.sampai"
                type="date"
                class="mt-1 w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <Teleport to="body">
      <Modal
        v-model="showEditModal"
        @save="saveEditDelegasi"
        size="xl"
        :loading="isSubmitting"
      >
        <template #title
          ><Heading
            variant="heading9b"
            class="text-lg p-3 ml-3 font-bold text-gray-900 dark:text-white"
            >Edit Delegasi</Heading
          ></template
        >
        <div class="flex flex-col gap-5 p-3">
          <div>
            <Heading
              variant="heading11m"
              class="text-xs font-medium dark:text-gray-200"
              >Personil <span class="text-red-500">*</span></Heading
            >
            <div class="relative" data-custom-dropdown>
              <button
                type="button"
                class="mt-1 w-full text-left border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 flex items-center justify-between hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @click.stop="toggleEditPersonil"
              >
                <span
                  class="text-sm text-gray-700 dark:text-gray-300 truncate pr-2"
                  >{{
                    getPersonilLabel(editDelegasi.personil) || "Pilih personil"
                  }}</span
                >
                <ChevronDown
                  class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
                />
              </button>
              <div
                v-if="openEditPersonil"
                class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col"
              >
                <div
                  class="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10"
                >
                  <div class="relative">
                    <Search
                      class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    /><input
                      v-model="personilSearch"
                      type="text"
                      placeholder="Cari personil..."
                      class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      @click.stop
                    />
                  </div>
                </div>
                <div class="overflow-y-auto max-h-48">
                  <div
                    v-if="filteredPersonilList.length === 0"
                    class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center"
                  >
                    Tidak ada data
                  </div>
                  <button
                    type="button"
                    v-for="p in filteredPersonilList"
                    :key="p.id"
                    class="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 truncate"
                    @click.prevent="selectEditPersonil(p.value)"
                  >
                    {{ p.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Heading
              variant="heading11m"
              class="text-xs font-medium dark:text-gray-200"
              >Sebagai <span class="text-red-500">*</span></Heading
            >
            <div class="relative" data-custom-dropdown>
              <button
                type="button"
                class="mt-1 w-full text-left border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 flex items-center justify-between hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @click.stop="toggleEditSebagai"
              >
                <span
                  class="text-sm text-gray-700 dark:text-gray-300 truncate pr-2"
                  >{{
                    getSebagaiLabel(editDelegasi.sebagai) || "Pilih peran"
                  }}</span
                >
                <ChevronDown
                  class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
                />
              </button>
              <div
                v-if="openEditSebagai"
                class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col"
              >
                <div
                  class="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10"
                >
                  <div class="relative">
                    <Search
                      class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    /><input
                      v-model="sebagaiSearch"
                      type="text"
                      placeholder="Cari peran..."
                      class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      @click.stop
                    />
                  </div>
                </div>
                <div class="overflow-y-auto max-h-48">
                  <div
                    v-if="filteredSebagaiList.length === 0"
                    class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center"
                  >
                    Tidak ada data
                  </div>
                  <button
                    type="button"
                    v-for="s in filteredSebagaiList"
                    :key="s.id"
                    class="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 truncate"
                    @click.prevent="selectEditSebagai(s.value)"
                  >
                    {{ s.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Heading
              variant="heading11m"
              class="text-xs font-medium dark:text-gray-200"
              >Jabatan <span class="text-red-500">*</span></Heading
            >
            <div class="relative" data-custom-dropdown>
              <button
                type="button"
                class="mt-1 w-full text-left border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 flex items-center justify-between hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @click.stop="toggleEditJabatan"
              >
                <span
                  class="text-sm text-gray-700 dark:text-gray-300 truncate pr-2"
                  >{{
                    getJabatanLabel(editDelegasi.jabatan) || "Pilih jabatan"
                  }}</span
                >
                <ChevronDown
                  class="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
                />
              </button>
              <div
                v-if="openEditJabatan"
                class="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col"
              >
                <div
                  class="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10"
                >
                  <div class="relative">
                    <Search
                      class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    /><input
                      v-model="jabatanSearch"
                      type="text"
                      placeholder="Cari jabatan..."
                      class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      @click.stop
                    />
                  </div>
                </div>
                <div class="overflow-y-auto max-h-48">
                  <div
                    v-if="filteredJabatanList.length === 0"
                    class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 text-center"
                  >
                    Tidak ada data
                  </div>
                  <button
                    type="button"
                    v-for="j in filteredJabatanList"
                    :key="j.id"
                    class="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 truncate"
                    @click.prevent="selectEditJabatan(j.value)"
                  >
                    {{ j.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading
                variant="heading11m"
                class="text-xs font-medium dark:text-gray-200"
                >Mulai <span class="text-red-500">*</span></Heading
              >
              <input
                v-model="editDelegasi.mulai"
                type="date"
                class="w-full mt-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div>
              <Heading
                variant="heading11m"
                class="text-xs font-medium dark:text-gray-200"
                >Sampai <span class="text-red-500">*</span></Heading
              >
              <input
                v-model="editDelegasi.sampai"
                type="date"
                class="w-full mt-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <ConfirmPopup
      v-model="confirmDeleteOpen"
      type="danger"
      title="Hapus Data"
      message="Yakin ingin menghapus data ini?"
      confirmText="Hapus"
      cancelText="Batal"
      cancelColor="primary"
      @confirm="deleteNow"
      :loading="isSubmitting"
    />
  </div>
</template>

<style scoped>
[data-custom-dropdown] button:focus {
  outline: none;
}

/* Animasi dropdown filter */
.filter-dd-enter-active,
.filter-dd-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}
.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: scaleY(0.9) translateY(-4px);
}
.filter-dd-enter-to,
.filter-dd-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
