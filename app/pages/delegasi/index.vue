<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import {
  Search,
  ArrowUpDown,
  RotateCcw,
  Plus,
  User,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-vue-next";

import Modal from "~/components/Modal.vue";
import ConfirmPopup from "~/components/ConfirmPopup.vue";
import Heading from "~/components/Heading.vue";

// Import Composable & Types
import { useDelegasi } from "~/composables/useDelegasi";
import type { JabatanItem, PersonilItem, PositionStatusItem } from "~/types/delegasi";

const toast = useToast(); // Inisialisasi Toast

const {
  getDelegasiList,
  getPersonilList,
  getPositionStatuses,
  getJabatanList,
  createDelegasi,
  updateDelegasi,
  deleteDelegasi,
} = useDelegasi();

// ==============================
// STATE
// ==============================
const isLoading = ref(false);
const isSubmitting = ref(false); // State khusus untuk button loading aksi
const search = ref("");
const filterStatus = ref("Semua");
const filterLokasi = ref("Semua");
const filterJabatan = ref("Semua");
const sortDirection = ref<"asc" | "desc" | null>(null);

const showAddModal = ref(false);
const showEditModal = ref(false);

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Delegasi", to: "/admin/delegasi" },
];

// Data utama dari API
const listDelegasi = ref<any[]>([]);
const totalItems = ref(0);
const totalPagesApi = ref(1);

// ==============================
// FETCH DATA (API INTEGRATION)
// ==============================
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

    // 1. Ambil object 'data' pembungkus
    const wrapper = res.data;

    // 2. Ambil array 'data' dan object 'meta' dari pembungkus
    const dataArray = wrapper?.data || [];
    const meta = wrapper?.meta;

    if (!Array.isArray(dataArray)) {
      listDelegasi.value = [];
      return;
    }

    listDelegasi.value = dataArray.map((item: any) => ({
      id: item.id,
      nama: item.as_name,
      jabatan: item.as_position_text || item.as_position || "-",
      lokasi: item.as_area_text || item.company_text || "-",
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

// ==============================
// HELPER: ERROR HANDLER & VALIDASI
// ==============================

// Fungsi untuk menangani error dari backend sesuai format yang diberikan
const handleApiError = (error: any) => {
  let message = "Terjadi kesalahan pada sistem.";

  // Cek struktur error dari backend (biasanya ada di error.data atau error.response._data)
  const errData = error.data || error.response?._data || error.response?.data;

  if (errData) {
    if (Array.isArray(errData.message)) {
      // Jika message array, gabungkan atau ambil yang pertama
      message = errData.message[0];
    } else if (typeof errData.message === 'string') {
      message = errData.message;
    }
  } else if (error.message) {
    message = error.message;
  }

  toast.add({
    title: 'Gagal',
    description: message,
    color: 'error'
  });
};

// Fungsi Validasi Tanggal
const validateDates = (start: string, end: string) => {
  if (!start || !end) return "Tanggal mulai dan sampai harus diisi.";

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset jam ke 00:00:00

  const startDate = new Date(start);
  const endDate = new Date(end);

  // Validasi: Start date tidak boleh kurang dari hari ini
  if (startDate < today) {
    return "Tanggal mulai tidak boleh kurang dari hari ini.";
  }

  // Validasi: End date tidak boleh kurang dari start date
  if (endDate < startDate) {
    return "Tanggal sampai tidak boleh kurang dari tanggal mulai.";
  }

  return null; // Lolos validasi
};

// ==============================
// SORT & REFRESH
// ==============================
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
  if (filterLokasi.value !== "Semua") {
    data = data.filter((item) => item.lokasi === filterLokasi.value);
  }
  if (filterJabatan.value !== "Semua") {
    data = data.filter((item) => item.jabatan === filterJabatan.value);
  }
  if (sortDirection.value === "asc")
    data.sort((a, b) => a.nama.localeCompare(b.nama));
  if (sortDirection.value === "desc")
    data.sort((a, b) => b.nama.localeCompare(a.nama));

  return data;
});

// ==============================
// DELETE
// ==============================
const confirmDeleteOpen = ref(false);
const itemToDelete = ref<any>(null);

const openDelete = (item: any) => {
  itemToDelete.value = item;
  confirmDeleteOpen.value = true;
};

const deleteNow = async () => {
  if (!itemToDelete.value) return;

  isSubmitting.value = true; // Loading start
  try {
    await deleteDelegasi(itemToDelete.value.id);
    confirmDeleteOpen.value = false;

    toast.add({
      title: 'Berhasil',
      description: `Data delegasi ${itemToDelete.value.nama} berhasil dihapus.`,
      color: 'success'
    });

    fetchData();
  } catch (error) {
    handleApiError(error);
  } finally {
    isSubmitting.value = false; // Loading end
  }
};

// ==============================
// DROPDOWN DATA API & LOGIC
// ==============================
const personilOptions = ref<PersonilItem[]>([]);
const sebagaiOptions = ref<PositionStatusItem[]>([]);
const jabatanOptions = ref<JabatanItem[]>([]);

// State untuk Search Dropdown
const jabatanSearch = ref("");
const personilSearch = ref("");
const sebagaiSearch = ref("");

// --- 1. JABATAN LOGIC ---
const jabatanList = computed(() =>
  jabatanOptions.value.map((j) => ({
    id: j.id,
    label: `${j.persnumText || 'empty'} - ${j.displayText || 'empty'}`,
    value: j.id,
    raw: j,
  }))
);

const filteredJabatanList = computed(() => {
  const query = jabatanSearch.value.toLowerCase();
  if (!query) return jabatanList.value.slice(0, 10);
  return jabatanList.value
    .filter((item) => item.label.toLowerCase().includes(query))
    .slice(0, 10);
});

// --- 2. PERSONIL LOGIC ---
const personilList = computed(() =>
  personilOptions.value.map((p) => ({
    id: p.persnum,
    label: p.displayText,
    value: p.persnum,
    raw: p,
  }))
);

const filteredPersonilList = computed(() => {
  const query = personilSearch.value.toLowerCase();
  if (!query) return personilList.value.slice(0, 10);
  return personilList.value
    .filter((item) => item.label.toLowerCase().includes(query))
    .slice(0, 10);
});

// --- 3. SEBAGAI LOGIC ---
const sebagaiList = computed(() =>
  sebagaiOptions.value.map((s) => ({
    id: s.value,
    label: s.label,
    value: s.value,
  }))
);

const filteredSebagaiList = computed(() => {
  const query = sebagaiSearch.value.toLowerCase();
  if (!query) return sebagaiList.value.slice(0, 10);
  return sebagaiList.value
    .filter((item) => item.label.toLowerCase().includes(query))
    .slice(0, 10);
});

// --- TOGGLE FUNCTIONS ---
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

// ==============================
// ADD DELEGASI
// ==============================
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
  // Validasi Tanggal
  const errorMsg = validateDates(newDelegasi.value.mulai, newDelegasi.value.sampai);
  if (errorMsg) {
    toast.add({ title: 'Validasi Gagal', description: errorMsg, color: 'error' });
    return;
  }

  isSubmitting.value = true; // Aktifkan loading
  try {
    const selectedPersonil = personilOptions.value.find(
      (p) => p.persnum === newDelegasi.value.personil
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
      title: 'Berhasil',
      description: 'Data delegasi berhasil ditambahkan.',
      color: 'success'
    });

    fetchData();
  } catch (error) {
    handleApiError(error);
  } finally {
    isSubmitting.value = false; // Matikan loading
  }
};

// ==============================
// EDIT DELEGASI
// ==============================
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
  // Validasi Tanggal
  const errorMsg = validateDates(editDelegasi.value.mulai, editDelegasi.value.sampai);
  if (errorMsg) {
    toast.add({ title: 'Validasi Gagal', description: errorMsg, color: 'error' });
    return;
  }

  isSubmitting.value = true; // Aktifkan loading
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
      title: 'Berhasil',
      description: 'Data delegasi berhasil diperbarui.',
      color: 'success'
    });

    fetchData();
  } catch (error) {
    handleApiError(error);
  } finally {
    isSubmitting.value = false; // Matikan loading
  }
};

const paginatedDelegasi = computed(() => filteredData.value);
const totalPages = computed(() => totalPagesApi.value);

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 2) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 1) {
      pages.push(total - 2, total - 1, total);
    } else {
      pages.push(current - 1, current, current + 1);
    }
  }
  return pages;
});

watch(
  [search, filterStatus, filterLokasi, filterJabatan, rowsPerPage],
  () => {
    currentPage.value = 1;
    fetchData();
  },
  { deep: true }
);

watch(currentPage, () => {
  fetchData();
});

// ==============================
// CUSTOM DROPDOWN STATES (UI Logic)
// ==============================
const openNewPersonil = ref(false);
const openNewSebagai = ref(false);
const openNewJabatan = ref(false);

const openEditPersonil = ref(false);
const openEditSebagai = ref(false);
const openEditJabatan = ref(false);

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const dropdownEls = document.querySelectorAll("[data-custom-dropdown]");
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) {
      return;
    }
  }
  openNewPersonil.value = false;
  openNewSebagai.value = false;
  openNewJabatan.value = false;
  openEditPersonil.value = false;
  openEditSebagai.value = false;
  openEditJabatan.value = false;
}

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});

function selectNewPersonil(val: string) {
  newDelegasi.value.personil = val;
  const p = personilOptions.value.find((x) => x.persnum === val);
  if (p) newDelegasi.value.jabatan = String(p.currentPosition);
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
  <div class="space-y-6">
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md"> Delegasi </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <button @click="openAdd"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-sm transition">
        <Plus class="w-4 h-4" />
        Tambah Delegasi
      </button>
    </div>

    <div class="flex flex-col w-full bg-white rounded-xl shadow-sm border border-gray-100">

      <div class="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100 flex-wrap">
        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-sm text-gray-600 font-medium">Tampilkan</span>

          <select v-model="rowsPerPage"
            class="border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary">
            <option v-for="n in [5, 10, 15]" :key="n" :value="n">
              {{ n }}
            </option>
          </select>

          <div class="flex items-center gap-2">
            <button @click="toggleSort" class="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Urutkan">
              <ArrowUpDown class="w-4 h-4" />
            </button>

            <button @click="refreshData" class="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Refresh">
              <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
            </button>
          </div>

          <select v-model="filterStatus"
            class="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary">
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Akan Datang">Akan Datang</option>
            <option value="Kadaluwarsa">Kadaluwarsa</option>
          </select>

          <select v-model="filterLokasi"
            class="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary">
            <option value="Semua">Semua Lokasi</option>
            <option value="Cabang Surabaya">Cabang Surabaya</option>
            <option value="Kejaksaan Cabang Denpasar">Cabang Denpasar</option>
          </select>

          <select v-model="filterJabatan"
            class="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary">
            <option value="Semua">Semua Jabatan</option>
            <option value="Supervisor Operasional">
              Supervisor Operasional
            </option>
            <option value="Pelaksana Tugas Junior Manager">
              Pelaksana Tugas Junior Manager
            </option>
          </select>
        </div>

        <button @click="exportData"
          class="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-700 transition-colors shadow-sm">
          Export
        </button>
      </div>

      <div class="overflow-x-auto relative min-h-[400px]">
        <table class="min-w-full text-sm">
          <thead class="bg-primary">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-white">Delegator</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-white">Jabatan</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-white">Periode</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
              <th class="px-6 py-4 text-center text-sm font-semibold text-white">Aksi</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100">
            <template v-if="isLoading">
              <tr v-for="n in rowsPerPage" :key="'skeleton-' + n" class="animate-pulse bg-white">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div class="h-4 w-32 bg-gray-200 rounded"></div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col gap-2">
                    <div class="h-4 w-40 bg-gray-200 rounded"></div>
                    <div class="h-3 w-24 bg-gray-200 rounded"></div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 w-32 bg-gray-200 rounded"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-6 w-24 bg-gray-200 rounded-full"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex justify-center gap-3">
                    <div class="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    <div class="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  </div>
                </td>
              </tr>
            </template>

            <template v-else-if="paginatedDelegasi.length === 0">
              <tr>
                <td colspan="5" class="text-center py-8 text-gray-500">Tidak ada data ditemukan</td>
              </tr>
            </template>

            <template v-else>
              <tr v-for="item in paginatedDelegasi" :key="item.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 min-w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User class="w-5 h-5 text-primary" />
                    </div>
                    <span class="text-gray-900 font-medium">{{ item.nama }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-col">
                    <span class="text-gray-900 font-medium">{{ item.jabatan }}</span>
                    <span class="text-gray-500 text-xs mt-1">{{ item.lokasi }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-gray-700">
                  {{ item.tanggal }}
                </td>
                <td class="px-6 py-4">
                  <span :class="[
                    'inline-flex px-3 py-1 text-xs font-medium rounded-full',
                    item.status === 'Aktif'
                      ? 'bg-green-100 text-green-700'
                      : item.status === 'Akan Datang'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700',
                  ]">
                    {{ item.status }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex justify-center gap-3">
                    <button @click="openEdit(item)"
                      class="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600 transition-colors" title="Edit">
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button @click="openDelete(item)"
                      class="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors" title="Hapus">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100">
        <div class="text-xs text-gray-600">
          Menampilkan {{ paginatedDelegasi.length }} dari {{ totalItems }} data
        </div>

        <div class="flex items-center gap-2">
          <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1" :class="[
            'flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-lg transition-all',
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-primary border border-primary hover:bg-primary-50',
          ]">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div class="flex items-center gap-1">
            <button v-if="paginationPages[0] > 1" @click="currentPage = 1"
              class="w-9 h-9 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary transition-all font-medium">
              1
            </button>

            <span v-if="paginationPages[0] > 2" class="px-2 text-gray-400 text-sm">
              ...
            </span>

            <button v-for="page in paginationPages" :key="page" @click="currentPage = page" :class="[
              'w-8 h-8 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
              currentPage === page
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary',
            ]">
              {{ page }}
            </button>

            <span v-if="
              paginationPages[paginationPages.length - 1] < totalPages - 1
            " class="px-2 text-gray-400 text-sm">
              ...
            </span>

            <button v-if="paginationPages[paginationPages.length - 1] < totalPages" @click="currentPage = totalPages"
              class="w-9 h-9 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary transition-all font-medium">
              {{ totalPages }}
            </button>
          </div>

          <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-primary border border-primary hover:bg-primary-50',
            ]">
            Next
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Modal v-model="showAddModal" @save="saveDelegasi" size="xl" :loading="isSubmitting">
        <template #title>
          <Heading variant="heading9b" class="text-lg p-3 ml-3 font-bold text-gray-900">
            Tambah Delegasi
          </Heading>
        </template>

        <div class="flex flex-col gap-5 p-3">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Personil <span class="text-red-500">*</span>
            </label>
            <div class="relative" data-custom-dropdown>
              <button type="button"
                class="w-full text-left border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @click.stop="toggleNewPersonil">
                <span class="text-sm text-gray-700 truncate pr-2">
                  {{ getPersonilLabel(newDelegasi.personil) || "Pilih personil" }}
                </span>
                <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>

              <div v-if="openNewPersonil"
                class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                <div class="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                  <div class="relative">
                    <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input v-model="personilSearch" type="text" placeholder="Cari personil..."
                      class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      @click.stop />
                  </div>
                </div>
                <div class="overflow-y-auto max-h-48">
                  <div v-if="filteredPersonilList.length === 0" class="px-4 py-3 text-xs text-gray-500 text-center">
                    Tidak ada data
                  </div>
                  <button type="button" v-for="p in filteredPersonilList" :key="p.id"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 truncate"
                    @click.prevent="selectNewPersonil(p.value)">
                    {{ p.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Sebagai <span class="text-red-500">*</span>
            </label>
            <div class="relative" data-custom-dropdown>
              <button type="button"
                class="w-full text-left border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @click.stop="toggleNewSebagai">
                <span class="text-sm text-gray-700 truncate pr-2">
                  {{ getSebagaiLabel(newDelegasi.sebagai) || "Pilih peran" }}
                </span>
                <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>

              <div v-if="openNewSebagai"
                class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                <div class="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                  <div class="relative">
                    <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input v-model="sebagaiSearch" type="text" placeholder="Cari peran..."
                      class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      @click.stop />
                  </div>
                </div>
                <div class="overflow-y-auto max-h-48">
                  <div v-if="filteredSebagaiList.length === 0" class="px-4 py-3 text-xs text-gray-500 text-center">
                    Tidak ada data
                  </div>
                  <button type="button" v-for="s in filteredSebagaiList" :key="s.id"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 truncate"
                    @click.prevent="selectNewSebagai(s.value)">
                    {{ s.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Jabatan <span class="text-red-500">*</span>
            </label>
            <div class="relative" data-custom-dropdown>
              <button type="button"
                class="w-full text-left border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @click.stop="toggleNewJabatan">
                <span class="text-sm text-gray-700 truncate pr-2">
                  {{ getJabatanLabel(newDelegasi.jabatan) || "Pilih jabatan" }}
                </span>
                <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>

              <div v-if="openNewJabatan"
                class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">

                <div class="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                  <div class="relative">
                    <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input v-model="jabatanSearch" type="text" placeholder="Cari jabatan..."
                      class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      @click.stop />
                  </div>
                </div>

                <div class="overflow-y-auto max-h-48">
                  <div v-if="filteredJabatanList.length === 0" class="px-4 py-3 text-xs text-gray-500 text-center">
                    Tidak ada data
                  </div>

                  <button type="button" v-for="j in filteredJabatanList" :key="j.id"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 truncate"
                    @click.prevent="selectNewJabatan(j.value)">
                    {{ j.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Mulai <span class="text-red-500">*</span>
              </label>
              <input v-model="newDelegasi.mulai" type="date"
                class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Sampai <span class="text-red-500">*</span>
              </label>
              <input v-model="newDelegasi.sampai" type="date"
                class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <Teleport to="body">
      <Modal v-model="showEditModal" @save="saveEditDelegasi" size="xl" :loading="isSubmitting">
        <template #title>
          <Heading variant="heading9b" class="text-lg p-3 ml-3 font-bold text-gray-900">
            Edit Delegasi
          </Heading>
        </template>

        <div class="flex flex-col gap-5 p-3">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Personil <span class="text-red-500">*</span>
            </label>
            <div class="relative" data-custom-dropdown>
              <button type="button"
                class="w-full text-left border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @click.stop="toggleEditPersonil">
                <span class="text-sm text-gray-700 truncate pr-2">
                  {{ getPersonilLabel(editDelegasi.personil) || "Pilih personil" }}
                </span>
                <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>

              <div v-if="openEditPersonil"
                class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                <div class="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                  <div class="relative">
                    <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input v-model="personilSearch" type="text" placeholder="Cari personil..."
                      class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      @click.stop />
                  </div>
                </div>
                <div class="overflow-y-auto max-h-48">
                  <div v-if="filteredPersonilList.length === 0" class="px-4 py-3 text-xs text-gray-500 text-center">
                    Tidak ada data
                  </div>
                  <button type="button" v-for="p in filteredPersonilList" :key="p.id"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 truncate"
                    @click.prevent="selectEditPersonil(p.value)">
                    {{ p.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Sebagai <span class="text-red-500">*</span>
            </label>
            <div class="relative" data-custom-dropdown>
              <button type="button"
                class="w-full text-left border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @click.stop="toggleEditSebagai">
                <span class="text-sm text-gray-700 truncate pr-2">
                  {{ getSebagaiLabel(editDelegasi.sebagai) || "Pilih peran" }}
                </span>
                <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>

              <div v-if="openEditSebagai"
                class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">
                <div class="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                  <div class="relative">
                    <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input v-model="sebagaiSearch" type="text" placeholder="Cari peran..."
                      class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      @click.stop />
                  </div>
                </div>
                <div class="overflow-y-auto max-h-48">
                  <div v-if="filteredSebagaiList.length === 0" class="px-4 py-3 text-xs text-gray-500 text-center">
                    Tidak ada data
                  </div>
                  <button type="button" v-for="s in filteredSebagaiList" :key="s.id"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 truncate"
                    @click.prevent="selectEditSebagai(s.value)">
                    {{ s.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Jabatan <span class="text-red-500">*</span>
            </label>
            <div class="relative" data-custom-dropdown>
              <button type="button"
                class="w-full text-left border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between hover:border-primary focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                @click.stop="toggleEditJabatan">
                <span class="text-sm text-gray-700 truncate pr-2">
                  {{ getJabatanLabel(editDelegasi.jabatan) || "Pilih jabatan" }}
                </span>
                <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>

              <div v-if="openEditJabatan"
                class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden flex flex-col">

                <div class="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                  <div class="relative">
                    <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input v-model="jabatanSearch" type="text" placeholder="Cari jabatan..."
                      class="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      @click.stop />
                  </div>
                </div>

                <div class="overflow-y-auto max-h-48">
                  <div v-if="filteredJabatanList.length === 0" class="px-4 py-3 text-xs text-gray-500 text-center">
                    Tidak ada data
                  </div>

                  <button type="button" v-for="j in filteredJabatanList" :key="j.id"
                    class="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 truncate"
                    @click.prevent="selectEditJabatan(j.value)">
                    {{ j.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Mulai <span class="text-red-500">*</span>
              </label>
              <input v-model="editDelegasi.mulai" type="date"
                class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Sampai <span class="text-red-500">*</span>
              </label>
              <input v-model="editDelegasi.sampai" type="date"
                class="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>
    <ConfirmPopup v-model="confirmDeleteOpen" type="danger" title="Hapus Data" message="Yakin ingin menghapus data ini?"
      confirmText="Hapus" cancelText="Batal" cancelColor="primary" @confirm="deleteNow" :loading="isSubmitting" />
  </div>
</template>

<style scoped>
[data-custom-dropdown] button:focus {
  outline: none;
}

/* Tambahan spinner */
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
