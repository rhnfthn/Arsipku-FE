<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import {
  Search,
  ArrowUpDown,
  RotateCcw,
  Plus,
  User,
  Pencil,
  Trash2,
} from "lucide-vue-next";

import Modal from "~/components/Modal.vue";
import ConfirmPopup from "~/components/ConfirmPopup.vue";
import Heading from "~/components/Heading.vue";

// ==============================
// STATE (existing)
// ==============================
const search = ref("");
const filterStatus = ref("Semua");
const filterLokasi = ref("Semua");
const filterJabatan = ref("Semua");

const sortDirection = ref<"asc" | "desc" | null>(null);
const showAddModal = ref(false);
const showEditModal = ref(false);
const openAdd = () => {
  addForm.value = {
    company: "10000",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "9999-12-31",
    object_type: "CO",
    long_text: "",
    long_text_en: "",
  };
  showAddModal.value = true;
};
const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Delegasi", to: "/admin/delegasi" },
];

const listDelegasi = ref([
  {
    id: 1,
    nama: "Siti Rahma",
    jabatan: "Supervisor Operasional",
    lokasi: "Cabang Surabaya",
    tanggal: "10.12.2025 - 15.12.2025",
    status: "Akan Datang",
  },
  {
    id: 2,
    nama: "Poni Sutanto",
    jabatan: "Pelaksana Tugas Junior Manager",
    lokasi: "Kejaksaan Cabang Denpasar",
    tanggal: "01.12.2025 - 31.12.2025",
    status: "Aktif",
  },
  {
    id: 3,
    nama: "Siti Rahma",
    jabatan: "Supervisor Operasional",
    lokasi: "Cabang Surabaya",
    tanggal: "10.12.2025 - 15.12.2025",
    status: "Kadaluwarsa",
  },
  {
    id: 4,
    nama: "Poni Sutanto",
    jabatan: "Pelaksana Tugas Junior Manager",
    lokasi: "Kejaksaan Cabang Denpasar",
    tanggal: "01.12.2025 - 31.12.2025",
    status: "Aktif",
  },
  {
    id: 5,
    nama: "Siti Rahma",
    jabatan: "Supervisor Operasional",
    lokasi: "Cabang Surabaya",
    tanggal: "10.12.2025 - 15.12.2025",
    status: "Akan Datang",
  },
  {
    id: 6,
    nama: "Poni Sutanto",
    jabatan: "Pelaksana Tugas Junior Manager",
    lokasi: "Kejaksaan Cabang Denpasar",
    tanggal: "01.12.2025 - 31.12.2025",
    status: "Aktif",
  },
  {
    id: 7,
    nama: "Siti Rahma",
    jabatan: "Supervisor Operasional",
    lokasi: "Cabang Surabaya",
    tanggal: "10.12.2025 - 15.12.2025",
    status: "Kadaluwarsa",
  },
  {
    id: 8,
    nama: "Poni Sutanto",
    jabatan: "Pelaksana Tugas Junior Manager",
    lokasi: "Kejaksaan Cabang Denpasar",
    tanggal: "01.12.2025 - 31.12.2025",
    status: "Aktif",
  },
  {
    id: 9,
    nama: "Siti Rahma",
    jabatan: "Supervisor Operasional",
    lokasi: "Cabang Surabaya",
    tanggal: "10.12.2025 - 15.12.2025",
    status: "Akan Datang",
  },
  {
    id: 10,
    nama: "Poni Sutanto",
    jabatan: "Pelaksana Tugas Junior Manager",
    lokasi: "Kejaksaan Cabang Denpasar",
    tanggal: "01.12.2025 - 31.12.2025",
    status: "Aktif",
  },
  {
    id: 11,
    nama: "Poni Sutanto",
    jabatan: "Pelaksana Tugas Junior Manager",
    lokasi: "Kejaksaan Cabang Denpasar",
    tanggal: "01.12.2025 - 31.12.2025",
    status: "Aktif",
  },
]);

// ==============================
// SORT & REFRESH (existing)
// ==============================
const toggleSort = () => {
  if (!sortDirection.value) sortDirection.value = "asc";
  else if (sortDirection.value === "asc") sortDirection.value = "desc";
  else sortDirection.value = null;
};

const refreshData = () => {
  search.value = "";
  filterStatus.value = "Semua";
  sortDirection.value = null;
};

const filteredData = computed(() => {
  let data = [...listDelegasi.value];

  data = data.filter((item) => {
    const matchSearch = item.nama
      .toLowerCase()
      .includes(search.value.toLowerCase());

    const matchStatus =
      filterStatus.value === "Semua" || item.status === filterStatus.value;

    const matchLokasi =
      filterLokasi.value === "Semua" || item.lokasi === filterLokasi.value;

    const matchJabatan =
      filterJabatan.value === "Semua" || item.jabatan === filterJabatan.value;

    return matchSearch && matchStatus && matchLokasi && matchJabatan;
  });

  if (sortDirection.value === "asc")
    data.sort((a, b) => a.nama.localeCompare(b.nama));
  if (sortDirection.value === "desc")
    data.sort((a, b) => b.nama.localeCompare(a.nama));

  return data;
});

// ==============================
// DELETE (existing)
// ==============================
const confirmDeleteOpen = ref(false);
const itemToDelete = ref<any>(null);

const openDelete = (item) => {
  itemToDelete.value = item;
  confirmDeleteOpen.value = true;
};

const deleteNow = () => {
  listDelegasi.value = listDelegasi.value.filter(
    (i) => i.id !== itemToDelete.value.id,
  );
  confirmDeleteOpen.value = false;
};

// ==============================
// ADD & EDIT DELEGASI (existing)
// ==============================
const newDelegasi = ref({
  personil: "",
  sebagai: "",
  jabatan: "",
  mulai: "",
  sampai: "",
});

const saveDelegasi = () => {
  listDelegasi.value.push({
    id: Date.now(),
    nama: newDelegasi.value.personil,
    jabatan: newDelegasi.value.jabatan,
    lokasi: "Kantor Pusat",
    tanggal: `${newDelegasi.value.mulai} - ${newDelegasi.value.sampai}`,
    status: "Aktif",
  });

  if (success) {
    showAddModal.value = false;
    // Optionally show success notification
  }

  newDelegasi.value = {
    personil: "",
    sebagai: "",
    jabatan: "",
    mulai: "",
    sampai: "",
  };
};

const editDelegasi = ref({
  id: null,
  personil: "",
  sebagai: "",
  jabatan: "",
  mulai: "",
  sampai: "",
});

const openEdit = (item) => {
  const [mulai, sampai] = item.tanggal.split(" - ");
  editDelegasi.value = {
    id: item.id,
    personil: item.nama,
    sebagai: item.sebagai ?? "",
    jabatan: item.jabatan,
    mulai,
    sampai,
  };
  showEditModal.value = true;
};

const saveEditDelegasi = () => {
  const index = listDelegasi.value.findIndex(
    (x) => x.id === editDelegasi.value.id,
  );
  if (index !== -1) {
    listDelegasi.value[index] = {
      ...listDelegasi.value[index],
      nama: editDelegasi.value.personil,
      jabatan: editDelegasi.value.jabatan,
      tanggal: `${editDelegasi.value.mulai} - ${editDelegasi.value.sampai}`,
    };
  }
  showEditModal.value = false;
};

// ================================
// PAGINATION
// ================================
const rowsPerPage = ref(10);
const rowsChoices = [5, 10, 15];

const currentPage = ref(1);

const paginatedDelegasi = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredData.value.slice(start, start + rowsPerPage.value);
});
watch(
  [
    search,
    filterStatus,
    filterLokasi,
    filterJabatan,
    sortDirection,
    rowsPerPage,
  ],
  () => {
    currentPage.value = 1;
  },
);
const totalItems = computed(() => filteredData.value.length);
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
const totalPages = computed(() =>
  Math.ceil(totalItems.value / rowsPerPage.value),
);

// reset page saat search atau rowsPerPage berubah
watch([search, rowsPerPage], () => {
  currentPage.value = 1;
});

// ==============================
// DROPDOWN DATA (explicit with id per item)
// ==============================
const personilList = [
  {
    id: 1,
    label: "Rahmat Rahimi - (TTEE) AVP of Enterprise Technology Planning",
    value: "Rahmat Rahimi - (TTEE) AVP of Enterprise Technology Planning",
  },
  {
    id: 2,
    label: "Poni Sutanto - Junior Manager",
    value: "Poni Sutanto - Junior Manager",
  },
  {
    id: 3,
    label: "Ika Octavia - Sekretaris EVP of Corporate Secretary",
    value: "Ika Octavia - Sekretaris EVP of Corporate Secretary",
  },
  {
    id: 4,
    label: "Ahmad Hidayat - Senior Manager",
    value: "Ahmad Hidayat  - Senior Manager",
  },
];

const sebagaiList = [
  { id: 1, label: "Pelaksana Tugas (PT)", value: "PT" },
  { id: 2, label: "Pelaksana Harian (PH)", value: "PH" },
  { id: 3, label: "Penugasan Sementara (PS)", value: "PS" },
  { id: 4, label: "Sekretaris", value: "Sekretaris" },
  { id: 5, label: "Viewer", value: "Viewer" },
];

const jabatanList = [
  { id: 1, label: "Asisten", value: "Asisten" },
  { id: 2, label: "Manager", value: "Manager" },
  { id: 3, label: "Supervisor", value: "Supervisor" },
  { id: 4, label: "Staff", value: "Staff" },
];

// ==============================
// CUSTOM DROPDOWN STATES & HANDLERS
// one open boolean per dropdown instance
// ==============================
const openFilterStatus = ref(false);

const openNewPersonil = ref(false);
const openNewSebagai = ref(false);
const openNewJabatan = ref(false);

const openEditPersonil = ref(false);
const openEditSebagai = ref(false);
const openEditJabatan = ref(false);

// click outside handling
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  // if click outside any dropdown, close all
  const dropdownEls = document.querySelectorAll("[data-custom-dropdown]");
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) {
      // clicked inside a dropdown - do nothing for that dropdown
      return;
    }
  }
  // clicked outside all dropdowns -> close all
  openFilterStatus.value = false;
  openNewPersonil.value = false;
  openNewSebagai.value = false;
  openNewJabatan.value = false;
  openEditPersonil.value = false;
  openEditSebagai.value = false;
  openEditJabatan.value = false;
}

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});

// helpers to set value and close
function selectFilterStatus(val: string) {
  filterStatus.value = val;
  openFilterStatus.value = false;
}

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
//EXPORT
const exportData = () => {
  const headers = ["Nama", "Jabatan", "Lokasi", "Periode", "Status"];
  const rows = filteredData.value.map((i) => [
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
  <div class="min-w-0 min-h-screen">
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md"> Delegasi </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- KIRI: TOMBOL TAMBAH -->
      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-800 text-sm"
      >
        <Plus class="w-4 h-4" />
        Tambah
      </button>
    </div>

    <div class="flex flex-col w-full bg-white rounded-xl shadow-sm">
      <div class="">
        <!-- FILTER BAR -->

        <div
          class="flex items-center justify-between gap-4 px-3 py-3 mb-1 flex-wrap"
        >
          <!-- LEFT SECTION -->
          <div class="flex items-center gap-4 flex-wrap">
            <span class="text-xs">Tampilkan</span>

            <select
              v-model="rowsPerPage"
              class="border text-xs border-gray-300 bg-white rounded-md px-2 py-1"
            >
              <option v-for="n in rowsChoices" :key="n" :value="n">
                {{ n }}
              </option>
            </select>

            <button
              @click="toggleSort"
              class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <ArrowUpDown class="w-4 h-4" />
            </button>

            <button
              @click="refreshData"
              class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <RotateCcw class="w-4 h-4" />
            </button>

            <!-- FILTERS -->
            <select
              v-model="filterStatus"
              class="text-sm bg-gray-200 rounded-lg px-3 py-2"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Akan Datang">Akan Datang</option>
              <option value="Kadaluwarsa">Kadaluwarsa</option>
            </select>

            <select
              v-model="filterLokasi"
              class="text-sm bg-gray-200 rounded-lg px-3 py-2"
            >
              <option value="Semua">Semua Lokasi</option>
              <option value="Cabang Surabaya">Cabang Surabaya</option>
              <option value="Cabang Denpasar">Cabang Denpasar</option>
            </select>

            <select
              v-model="filterJabatan"
              class="text-sm bg-gray-200 rounded-lg px-3 py-2"
            >
              <option value="Semua">Semua Jabatan</option>
              <option value="Supervisor Operasional">
                Supervisor Operasional
              </option>
              <option value="Pelaksana Tugas Junior Manager">
                Pelaksana Tugas Junior Manager
              </option>
            </select>
          </div>

          <!-- RIGHT SECTION (EXPORT) -->
          <div>
            <button
              @click="exportData"
              class="flex items-center gap-2 px-5 py-2 rounded-lg text-sm text-white bg-primary hover:bg-primary-700"
            >
              Export
            </button>
          </div>
        </div>

        <!-- LIST (TABEL) -->
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-primary font-semibold text-white">
              <tr>
                <th class="px-5 py-3 border-b text-left">Delegator</th>
                <th class="px-5 py-3 border-b text-left">Jabatan</th>
                <th class="px-5 py-3 border-b text-left">Periode</th>
                <th class="px-5 py-3 border-b text-left">Status</th>
                <th class="px-5 py-3 border-b text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in paginatedDelegasi"
                :key="item.id"
                class="text-sm hover:bg-gray-50"
              >
                <!-- Delegator -->

                <td class="px-4 py-3 border-b border-gray-200">
                  <div class="flex flex-col">
                    <span class="text-gray-800 font-medium text-sm">
                      {{ item.nama }}
                    </span>
                  </div>
                </td>

                <!-- Jabatan -->
                <td class="px-4 py-3 border-b border-gray-200">
                  <div class="flex flex-col">
                    <span class="text-gray-800 font-medium text-sm">
                      {{ item.jabatan }}
                    </span>
                    <span class="text-gray-500 text-xs">
                      {{ item.lokasi }}
                    </span>
                  </div>
                </td>

                <!-- Periode -->
                <td class="px-4 py-3 border-b border-gray-200 text-gray-700">
                  {{ item.tanggal }}
                </td>

                <!-- Status -->
                <td class="px-4 py-3 border-b border-gray-200">
                  <UBadge
                    :class="[
                      'px-3 py-1 text-xs rounded-full',
                      item.status === 'Aktif'
                        ? 'bg-green-100 text-green-800'
                        : item.status === 'Akan Datang'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-red-100 text-red-800',
                    ]"
                  >
                    {{ item.status }}
                  </UBadge>
                </td>

                <!-- Aksi -->
                <td class="px-4 py-3 border-b border-gray-200">
                  <div class="flex justify-center gap-4">
                    <button @click="openEdit(item)" class="text-yellow-500">
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button @click="openDelete(item)" class="text-red-500">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION tetapkan di bawah -->
        <div
          v-if="filteredData.length > 0"
          class="flex items-center justify-between px-4 py-4 border-t border-gray-200"
        >
          <div class="text-xs text-gray-600">
            Menampilkan {{ paginatedDelegasi.length }} dari
            {{ totalItems }} data
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
    <!-- ======= -->
    <!-- MODAL TAMBAH -->
    <!-- ======= -->
    <Teleport to="body">
      <Modal v-model="showAddModal" @save="saveDelegasi">
        <template #title>
          <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold"
            >Tambah Delegasi</Heading
          >
        </template>

        <div class="flex flex-col gap-4 mt-3 ml-1 mr-1">
          <div>
            <label class="text-xs font-semibold"
              >Personil <span class="text-red-500">*</span></label
            >
            <!-- custom select -->
            <div class="relative" data-custom-dropdown>
              <button
                class="w-full text-left bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mt-1 flex items-center justify-between"
                @click.stop="openNewPersonil = !openNewPersonil"
              >
                <span class="text-sm text-gray-600">
                  {{ newDelegasi.personil || "Pilih personil" }}
                </span>
              </button>

              <div
                v-if="openNewPersonil"
                class="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
              >
                <button
                  v-for="p in personilList"
                  :key="p.id"
                  class="w-full text-left px-4 py-3 mt-1 hover:bg-gray-100"
                  @click.prevent="selectNewPersonil(p.value)"
                >
                  {{ p.label }}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold"
              >Sebagai <span class="text-red-500">*</span></label
            >
            <div class="relative" data-custom-dropdown>
              <button
                class="w-full text-left bg-gray-50 mt-1 border border-gray-100 rounded-lg px-4 py-3 flex items-center justify-between"
                @click.stop="openNewSebagai = !openNewSebagai"
              >
                <span class="text-sm text-gray-600">
                  {{ newDelegasi.sebagai || "Pilih peran" }}
                </span>
              </button>

              <div
                v-if="openNewSebagai"
                class="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
              >
                <button
                  v-for="s in sebagaiList"
                  :key="s.id"
                  class="w-full text-left px-4 py-3 mt-1 hover:bg-gray-100"
                  @click.prevent="selectNewSebagai(s.value)"
                >
                  {{ s.label }}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold"
              >Jabatan <span class="text-red-500">*</span></label
            >
            <div class="relative" data-custom-dropdown>
              <button
                class="w-full text-left bg-gray-50 mt-1 border border-gray-100 rounded-lg px-4 py-3 flex items-center justify-between"
                @click.stop="openNewJabatan = !openNewJabatan"
              >
                <span class="text-sm text-gray-600">
                  {{ newDelegasi.jabatan || "Pilih jabatan" }}
                </span>
              </button>

              <div
                v-if="openNewJabatan"
                class="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
              >
                <button
                  v-for="j in jabatanList"
                  :key="j.id"
                  class="w-full text-left px-4 py-3 mt-1 hover:bg-gray-100"
                  @click.prevent="selectNewJabatan(j.value)"
                >
                  {{ j.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-semibold"
                >Mulai <span class="text-red-500">*</span></label
              >
              <input
                v-model="newDelegasi.mulai"
                type="date"
                class="w-full border mt-1 bg-white border-gray-100 text-xs px-3 py-2 rounded-lg"
              />
            </div>

            <div>
              <label class="text-xs font-semibold"
                >Sampai <span class="text-red-500">*</span></label
              >
              <input
                v-model="newDelegasi.sampai"
                type="date"
                class="w-full border mt-1 bg-white border-gray-100 text-xs px-3 py-2 rounded-lg"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>
    <!-- ======= -->
    <!-- MODAL EDIT -->
    <!-- ======= -->
    <Teleport to="body">
      <Modal v-model="showEditModal" @save="saveEditDelegasi" size="xl">
        <template #title>
          <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold"
            >Edit Delegasi</Heading
          >
        </template>

        <div class="flex flex-col gap-4 mt-3 ml-1 mr-1">
          <div>
            <label class="text-xs font-semibold"
              >Personil <span class="text-red-500">*</span></label
            >
            <div class="relative" data-custom-dropdown>
              <button
                class="w-full text-left mt-1 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between"
                @click.stop="openEditPersonil = !openEditPersonil"
              >
                <span class="text-sm text-gray-600">{{
                  editDelegasi.personil || "Pilih personil"
                }}</span>
              </button>

              <div
                v-if="openEditPersonil"
                class="absolute left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
              >
                <button
                  v-for="p in personilList"
                  :key="p.id"
                  class="w-full text-left mt-1 px-4 py-3 hover:bg-gray-100"
                  @click.prevent="selectEditPersonil(p.value)"
                >
                  {{ p.label }}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold"
              >Sebagai <span class="text-red-500">*</span></label
            >
            <div class="relative" data-custom-dropdown>
              <button
                class="w-full text-left mt-1 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between"
                @click.stop="openEditSebagai = !openEditSebagai"
              >
                <span class="text-sm text-gray-600">{{
                  editDelegasi.sebagai || "Pilih peran"
                }}</span>
              </button>

              <div
                v-if="openEditSebagai"
                class="absolute left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
              >
                <button
                  v-for="s in sebagaiList"
                  :key="s.id"
                  class="w-full text-left mt-1 px-4 py-3 hover:bg-gray-100"
                  @click.prevent="selectEditSebagai(s.value)"
                >
                  {{ s.label }}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold"
              >Jabatan <span class="text-red-500">*</span></label
            >
            <div class="relative" data-custom-dropdown>
              <button
                class="w-full text-left mt-1 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between"
                @click.stop="openEditJabatan = !openEditJabatan"
              >
                <span class="text-sm text-gray-600">{{
                  editDelegasi.jabatan || "Pilih jabatan"
                }}</span>
              </button>

              <div
                v-if="openEditJabatan"
                class="absolute left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
              >
                <button
                  v-for="j in jabatanList"
                  :key="j.id"
                  class="w-full text-left mt-1 px-4 py-3 hover:bg-gray-100"
                  @click.prevent="selectEditJabatan(j.value)"
                >
                  {{ j.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label class="text-xs font-semibold"
                >Mulai <span class="text-red-500">*</span></label
              >
              <input
                v-model="editDelegasi.mulai"
                type="date"
                class="w-full border border-gray-200 mt-1 text-xs px-4 py-3 rounded-lg"
              />
            </div>

            <div>
              <label class="text-xs font-semibold"
                >Sampai <span class="text-red-500">*</span></label
              >
              <input
                v-model="editDelegasi.sampai"
                type="date"
                class="w-full border border-gray-200 mt-1 text-xs px-4 py-3 rounded-lg"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>
    <!-- POPUP DELETE -->
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      type="danger"
      title="Hapus Data?"
      message="Data yang dihapus tidak dapat dikembalikan."
      confirmText="Hapus"
      cancelText="Batal"
      cancelColor="primary"
      @confirm="deleteNow"
    />
  </div>
</template>

<style scoped>
/* minor styling for dropdowns and scrollbars */
[data-custom-dropdown] button:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08);
}
</style>
