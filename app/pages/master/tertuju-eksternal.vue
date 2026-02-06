<template>
  <div class="min-h-screen pt-5">
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5"
    >
      <!-- Left Section - Title & Breadcrumb -->
      <PageHeader title="Tertuju Eksternal" :items="items" />
      <button
        @click="showModal = true"
        class="flex items-center gap-2 bg-primary text-white h-8 px-6 rounded-lg hover:bg-primary-800 text-xs transition-colors"
      >
        <Plus class="w-4 h-4" />
        Tambah
      </button>
    </div>

    <div
      class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white"
    >
      <!-- Top Bar -->
      <div class="flex flex-wrap gap-4 items-center p-3">
        <button
          @click="refreshData"
          class="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <!-- Rows per page -->
        <select
          v-model="rowsPerPage"
          class="border text-xs border-gray-300 bg-white rounded-md px-2 py-1"
        >
          <option v-for="n in rowsChoices" :key="n" :value="n">
            {{ n }}
          </option>
        </select>

        <div class="relative flex-1 w-full px-2">
          <Search
            class="w-3.5 h-3.5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Cari nama / alamat / telepon..."
            class="w-full bg-gray-50 border border-gray-200 text-xs pl-9 pr-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          class="flex items-center gap-2 bg-primary text-white h-8 px-6 rounded-lg hover:bg-primary-700 text-xs transition-colors"
        >
          <FileDown class="w-4 h-4" />
          Export
        </button>
      </div>

      <!-- Table -->
      <table class="min-w-full text-sm">
        <thead class="text-left bg-primary-400 text-white">
          <tr>
            <th @click="handleSort('nama')" class="cursor-pointer">
              <div class="flex items-center gap-2 ml-5">
                <span>Nama</span>
                <ArrowUpDown
                  class="w-4 h-4 origin-center transition-transform duration-200"
                  :class="
                    sortColumn === 'nama'
                      ? sortDirection === 'desc'
                        ? 'rotate-180'
                        : 'rotate-0'
                      : 'opacity-50'
                  "
                />
              </div>
            </th>

            <th class="px-4 py-3 border-b border-b-gray-100 font-semibold">
              Alamat
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 font-semibold">
              Telephone
            </th>
            <th @click="handleSort('status')" class="cursor-pointer">
              <div class="flex items-center gap-2">
                <span>Status</span>
                <ArrowUpDown
                  class="w-4 h-4 origin-center transition-transform duration-200"
                  :class="
                    sortKey === 'status'
                      ? sortOrder === 'desc'
                        ? 'rotate-180'
                        : 'rotate-0'
                      : 'opacity-50'
                  "
                />
              </div>
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 font-semibold">
              Pengusul
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 font-semibold">
              Aksi
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(item, idx) in paginatedData"
            :key="item.id"
            :class="[
              'hover:bg-blue-50 transition-colors border-b border-b-gray-200 capitalize',
              idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
            ]"
          >
            <td class="px-4 py-3 font-medium">
              {{ item.nama }}
            </td>

            <td class="px-4 py-3">
              {{ item.alamat }}
            </td>

            <td class="px-4 py-3 whitespace-nowrap">
              {{ item.telepon }}
            </td>

            <td class="px-4 py-3">
              <span
                class="px-3 py-1 rounded-full text-xs font-medium"
                :class="
                  item.aktif
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                "
              >
                {{ item.aktif ? "Aktif" : "Tidak Aktif" }}
              </span>
            </td>

            <td class="px-4 py-3">
              {{ item.nama_pembuat }}
            </td>

            <td class="px-4 py-3 text-center flex justify-center gap-3">
              <button
                @click="openEdit(item)"
                class="p-2 hover:bg-yellow-100 rounded-lg transition-colors group"
              >
                <Pencil
                  class="w-4 h-4 text-yellow-500 group-hover:text-yellow-600"
                />
              </button>

              <button
                class="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                @click="handleDelete(item.id)"
              >
                <Trash2 class="w-4 h-4 text-red-600 group-hover:text-red-600" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div
        v-if="filteredData.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200"
      >
        <div class="text-xs text-gray-600">
          Menampilkan {{ paginatedData.length }} dari {{ filteredData.length }}
          data
        </div>

        <div class="flex items-center gap-2">
          <!-- Back Button -->
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

          <!-- Page Numbers -->
          <div class="flex items-center gap-1">
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary transition-all"
            >
              1
            </button>

            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 text-sm"
            >
              ...
            </span>

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

            <span
              v-if="
                paginationPages[paginationPages.length - 1] < totalPages - 1
              "
              class="px-2 text-gray-400 text-sm"
            >
              ...
            </span>

            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <!-- Next Button -->
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

    <Teleport to="body">
      <AddUsulan
        v-model="openAdd"
        @submit="handleSubmitFromModal"
        @preview="handlePreview"
    /></Teleport>

    <Teleport to="body">
      <Modal v-model="showModal" @save="handleSave" size="xl">
        <template #title>
          <Heading
            variant="heading9b"
            class="font-semibold text-sm mb-3 mt-5 ml-5"
          >
            {{ editId ? "Edit Tertuju Eksternal" : "Tambah Tertuju Eksternal" }}
          </Heading>
        </template>

        <!-- FIELD NAMA -->
        <div class="flex flex-col gap-2 p-1">
          <Heading variant="heading11m" class="text-xs">
            Nama <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="form.nama"
            type="text"
            placeholder="Masukkan nama"
            class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
          />
        </div>

        <!-- FIELD ALAMAT -->
        <div class="flex flex-col gap-2">
          <Heading variant="heading11m" class="text-xs">
            Alamat <span class="text-red-500">*</span>
          </Heading>
          <textarea
            v-model="form.alamat"
            type="text"
            placeholder="Masukkan alamat"
            class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
          />
        </div>

        <!-- FIELD TELEPHONE -->
        <div class="flex flex-col gap-2">
          <Heading variant="heading11m" class="text-xs">
            Nomor HP <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="form.telephone"
            type="text"
            placeholder="Masukkan no telphone"
            class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
          />
        </div>

        <!-- FIELD STATUS -->
        <div class="flex flex-col gap-2">
          <Heading variant="heading11m" class="text-xs">
            Status <span class="text-red-500">*</span>
          </Heading>
          <select
            v-model="form.aktif"
            class="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
          >
            <option value="" disabled>Pilih status</option>
            <option :value="true">Aktif</option>
            <option :value="false">Tidak Aktif</option>
          </select>
        </div>
      </Modal>
    </Teleport>

    <ConfirmPopup
      v-model="showConfirmDelete"
      type="danger"
      title="Hapus Data"
      message="Data yang dihapus tidak dapat dikembalikan. Yakin ingin melanjutkan?"
      confirm-text="Hapus"
      cancel-text="Batal"
      :is-loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="showConfirmDelete = false"
    />
  </div>
</template>

<script setup lang="ts">
const items = [
  {
    label: "Dashboard",
    to: "/beranda",
  },
  {
    label: "Tertuju Eksternal",
    to: "/admin/master/tertuju-eksternal",
  },
] satisfies BreadcrumbItem[];

import { onMounted, ref, computed, watch } from "vue";
import {
  Search,
  FileDown,
  RotateCcw,
  Trash2,
  Pencil,
  Plus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-vue-next";
import { useTertujuEksternal } from "~/composables/useTertujuEksternal";
import { useAuth } from "~/composables/useAuth";
import Modal from "@/components/Modal.vue";
import ConfirmPopup from "@/components/ConfirmPopup.vue";

const auth = useAuth();
const user = auth.user;

const {
  data,
  loading,
  fetchTertujuEksternal,
  createTertujuEksternal,
  deleteTertujuEksternal,
  updateTertujuEksternal,
} = useTertujuEksternal();

// sort
const handleSort = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortColumn.value = column;
    sortDirection.value = "asc";
  }
};

const form = ref({
  nama: "",
  alamat: "",
  telephone: "",
  aktif: true as boolean,
});

onMounted(() => {
  fetchTertujuEksternal();
});

const showModal = ref(false);
const editId = ref<string | null>(null);

// Pagination
const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const currentPage = ref<number>(1);

// Sorting
const sortColumn = ref<string>("nama");
const sortDirection = ref<"asc" | "desc">("asc");

const handleSave = async () => {
  if (editId.value) {
    await updateTertujuEksternal(editId.value, {
      nama: form.value.nama,
      alamat: form.value.alamat,
      telepon: form.value.telephone,
      aktif: form.value.aktif,
    });
  } else {
    await createTertujuEksternal({
      id_position_pembuat: user.value.position,
      company: "MN",
      area: "Regional 1",
      nama: form.value.nama,
      alamat: form.value.alamat,
      telepon: form.value.telephone,
      aktif: form.value.aktif,
    });
  }

  showModal.value = false;
  editId.value = null;

  // Reset form
  form.value = {
    nama: "",
    alamat: "",
    telephone: "",
    aktif: true,
  };
};

const showConfirmDelete = ref(false);
const deleteTargetId = ref<string | null>(null);
const isDeleting = ref(false);

const handleDelete = (id: string) => {
  deleteTargetId.value = id;
  showConfirmDelete.value = true;
};

const confirmDelete = async () => {
  if (!deleteTargetId.value) return;

  try {
    isDeleting.value = true;
    await deleteTertujuEksternal(deleteTargetId.value);
    showConfirmDelete.value = false;
  } catch (err: any) {
    console.error("Gagal menghapus data:", err?.response?.data || err);
  } finally {
    isDeleting.value = false;
    deleteTargetId.value = null;
  }
};

const openEdit = (item: any) => {
  editId.value = item.id;
  form.value = {
    nama: item.nama,
    alamat: item.alamat,
    telephone: item.telepon,
    aktif: item.aktif,
  };
  showModal.value = true;
};

// Filter state
const filters = ref({
  jenis: "",
  lokasi: "",
  status: "",
  tahun: "",
  search: "",
});

// Filtered data
const filteredData = computed(() => {
  const keyword = filters.value.search.toLowerCase();

  return data.value.filter((item) =>
    [
      item.company,
      item.area,
      item.nama,
      item.alamat,
      item.telepon,
      item.email,
      item.kontak,
      item.nama_pembuat,
    ]
      .join(" ")
      .toLowerCase()
      .includes(keyword),
  );
});

// Sorted data
const sortedData = computed(() => {
  const sorted = [...filteredData.value];

  sorted.sort((a, b) => {
    const aVal = String(a[sortColumn.value] || "").toLowerCase();
    const bVal = String(b[sortColumn.value] || "").toLowerCase();

    if (aVal < bVal) return sortDirection.value === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection.value === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
});

// Pagination computed
const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedData.value.length / rowsPerPage.value)),
);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedData.value.slice(start, start + rowsPerPage.value);
});

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
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

// Sorting function
const sortBy = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortColumn.value = column;
    sortDirection.value = "asc";
  }
};

// Watch for changes that should reset pagination
watch([() => filters.value.search, rowsPerPage], () => {
  currentPage.value = 1;
});

const refreshData = async () => {
  filters.value.search = "";
  currentPage.value = 1;
  await fetchTertujuEksternal();
};
</script>

<style scoped>
/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
