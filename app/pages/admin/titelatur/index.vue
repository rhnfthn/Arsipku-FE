<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import {
  Filter,
  FileCheck,
  ChevronRight,
  Search,
  ArrowUpDown,
  RotateCcw,
  Pencil,
  Trash2,
  Plus,
} from "lucide-vue-next";
import Heading from "~/components/Heading.vue";
import Modal from "~/components/Modal.vue";
import ConfirmPopup from "~/components/ConfirmPopup.vue";

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Titelatur Inggris", to: "/admin/titelatur" },
];
// ================================
// DATA
// ================================
const items = ref([
  {
    id: 1,
    from: "Kepala Divisi Teknologi Informasi",
    subject: "SVP Information Technology",
    maintain: "Maintain",
  },
  {
    id: 2,
    from: "Direktur Keselamatan, Keamanan dan Standarisasi",
    subject: "Director of Safety, Security and Standarization",
    maintain: "Maintain",
  },
  {
    id: 3,
    from: "Direktur Teknik",
    subject: "Director of Engineering",
    maintain: "Maintain",
  },
  {
    id: 4,
    from: "Kepala Divisi Teknologi Informasi",
    subject: "SVP Information Technology",
    maintain: "Maintain",
  },
  {
    id: 5,
    from: "Direktur Keselamatan, Keamanan dan Standarisasi",
    subject: "Director of Safety, Security and Standarization",
    maintain: "Maintain",
  },
  {
    id: 6,
    from: "Direktur Teknik",
    subject: "Director of Engineering",
    maintain: "Maintain",
  },
  {
    id: 7,
    from: "Direktur Teknik",
    subject: "Director of Engineering",
    maintain: "Maintain",
  },
  {
    id: 8,
    from: "Kepala Divisi Teknologi Informasi",
    subject: "SVP Information Technology",
    maintain: "Maintain",
  },
  {
    id: 9,
    from: "Direktur Keselamatan, Keamanan dan Standarisasi",
    subject: "Director of Safety, Security and Standarization",
    maintain: "Maintain",
  },
  {
    id: 10,
    from: "Direktur Teknik",
    subject: "Director of Engineering",
    maintain: "Maintain",
  },
  {
    id: 11,
    from: "Kepala Divisi Teknologi Informasi",
    subject: "SVP Information Technology",
    maintain: "Maintain",
  },
  {
    id: 12,
    from: "Direktur Keselamatan, Keamanan dan Standarisasi",
    subject: "Director of Safety, Security and Standarization",
    maintain: "Maintain",
  },
  {
    id: 13,
    from: "Kepala Divisi Teknologi Informasi",
    subject: "SVP Information Technology",
    maintain: "Maintain",
  },
  {
    id: 14,
    from: "Direktur Keselamatan, Keamanan dan Standarisasi",
    subject: "Director of Safety, Security and Standarization",
    maintain: "Maintain",
  },
  {
    id: 15,
    from: "Direktur Teknik",
    subject: "Director of Engineering",
    maintain: "Maintain",
  },
]);

// ================================
// SEARCH + FILTER + SORT
// ================================
const search = ref("");
const filteredItems = computed(() => {
  const s = search.value.toLowerCase();
  return items.value.filter(
    (it) =>
      it.from.toLowerCase().includes(s) || it.subject.toLowerCase().includes(s),
  );
});

const sortDirection = ref(null);
const toggleSort = () => {
  sortDirection.value =
    sortDirection.value === "asc"
      ? "desc"
      : sortDirection.value === "desc"
        ? null
        : "asc";
};

const sortedItems = computed(() => {
  let arr = [...filteredItems.value];
  if (sortDirection.value === "asc")
    arr.sort((a, b) => a.from.localeCompare(b.from));
  if (sortDirection.value === "desc")
    arr.sort((a, b) => b.from.localeCompare(a.from));
  return arr;
});

// ================================
// PAGINATION
// ================================
const currentPage = ref(1);
const rowsPerPage = ref(10);
const rowsChoices = [5, 10, 15, 25, 50, 100];

const totalItems = computed(() => filteredItems.value.length);
const totalPages = computed(() =>
  Math.ceil(totalItems.value / rowsPerPage.value),
);

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  const end = start + rowsPerPage.value;
  return sortedItems.value.slice(start, end);
});

watch(rowsPerPage, () => (currentPage.value = 1));

// ================================
// MODAL: EDIT
// ================================
const showEditModal = ref(false);
const selectedItem = ref(null);

const editForm = ref({
  ind: "",
  eng: "",
});

const openEdit = (item) => {
  selectedItem.value = item;
  editForm.value.ind = item.from;
  editForm.value.eng = item.subject;
  showEditModal.value = true;
};

const saveEdit = () => {
  if (selectedItem.value) {
    selectedItem.value.from = editForm.value.ind;
    selectedItem.value.subject = editForm.value.eng;
  }
  showEditModal.value = false;
};

// ================================
// MODAL: ADD
// ================================
const showAddModal = ref(false);

const addForm = ref({
  ind: "",
  eng: "",
});

const openAdd = () => {
  addForm.value = { ind: "", eng: "" };
  showAddModal.value = true;
};

const saveAdd = () => {
  items.value.push({
    id: Date.now(),
    from: addForm.value.ind,
    subject: addForm.value.eng,
  });

  showAddModal.value = false;
};

// ================================
// POPUP DELETE
// ================================
const confirmDeleteOpen = ref(false);
const itemToDelete = ref(null);

const openDelete = (item) => {
  itemToDelete.value = item;
  confirmDeleteOpen.value = true;
};

const deleteNow = () => {
  items.value = items.value.filter((i) => i.id !== itemToDelete.value.id);
  confirmDeleteOpen.value = false;
};
</script>

<template>
  <div class="w-full min-w-0 min-h-screen">
    <!-- TITLE -->
    <div class="mb-5 flex justify-between items-start">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Titelatur Inggris
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-800 text-xs"
      >
        <Plus class="w-4 h-4" />
        Tambah Titelatur
      </button>
    </div>

    <!-- CARD -->
    <div
      class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col"
    >
      <!-- TOP BAR -->
      <div
        class="p-3 border-b border-gray-300 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-3 cursor-pointer"
      >
        <div class="flex items-center gap-4">
          <!-- tampilkan -->
          <div class="flex items-center gap-2">
            <span class="text-xs">Tampilkan</span>
            <select
              v-model="rowsPerPage"
              class="border text-xs border-gray-300 bg-white rounded-md px-2 py-1"
            >
              <option v-for="n in rowsChoices" :key="n" :value="n">
                {{ n }}
              </option>
            </select>
          </div>

          <!-- SORT -->
          <div class="flex items-center gap-2">
            <button
              @click="toggleSort"
              class="flex items-center gap-1 text-gray-500 text-xs px-1 py-1 rounded-md bg-white hover:bg-gray-100"
            >
              <ArrowUpDown class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Search -->
        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            placeholder="Cari Titelatur..."
            class="w-full bg-gray-50 border border-gray-200 text-xs pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
      </div>

      <!-- TABLE -->
      <table class="min-w-full text-left text-sm">
        <thead class="bg-primary-400 text-primary-50">
          <tr>
            <th class="px-4 py-4 font-bold">Titelatur Indonesia</th>
            <th class="px-4 py-4 font-bold">Titelatur Inggris</th>
            <th class="px-4 py-4 font-bold text-center">Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="it in paginatedItems"
            :key="it.id"
            class="border-b border-gray-200 hover:bg-primary-50"
          >
            <td class="px-5 py-4">{{ it.from }}</td>
            <td class="px-5 py-4">{{ it.subject }}</td>

            <td class="px-4 py-3 text-center flex justify-center gap-5">
              <button @click="openEdit(it)" class="text-yellow-500">
                <Pencil class="w-4 h-4" />
              </button>

              <button @click="openDelete(it)" class="text-red-500">
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- PAGINATION -->
      <div class="flex justify-between p-4 text-xs">
        <div>
          Menampilkan {{ paginatedItems.length }} dari {{ totalItems }} data
        </div>

        <div class="flex gap-1">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded-md hover:bg-gray-100 disabled:opacity-30"
          >
            &lt;
          </button>

          <button
            v-for="page in totalPages"
            :key="page"
            @click="currentPage = page"
            :class="[
              'px-3 py-1 rounded-md',
              currentPage === page
                ? 'bg-primary text-white'
                : 'hover:bg-gray-200',
            ]"
          >
            {{ page }}
          </button>

          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 rounded-md hover:bg-gray-100 disabled:opacity-30"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>

    <!-- ========================= -->
    <!-- MODAL EDIT -->
    <!-- ========================= -->
    <Modal v-model="showEditModal" @save="saveEdit">
      <template #title>
        <div class="mt-5 ml-5 mb-3">
          <Heading variant="heading9b" class="font-semibold text-sm">
            Edit Titelatur
          </Heading>

          <Heading variant="body2" class="text-xs text-gray-500 mt-1">
            Isi form di bawah ini untuk mengedit titelatur
          </Heading>
        </div>
      </template>

      <div class="flex flex-col gap-3">
        <Heading variant="body2m"
          >Titelatur Indonesia <span class="text-red-500">*</span></Heading
        >
        <input
          v-model="editForm.ind"
          class="border px-3 py-2 rounded-md text-sm bg-gray-50"
        />

        <Heading variant="body2m"
          >Titelatur Inggris <span class="text-red-500">*</span></Heading
        >
        <input
          v-model="editForm.eng"
          class="border px-3 py-2 rounded-md text-sm bg-gray-50"
        />
      </div>
    </Modal>

    <!-- ========================= -->
    <!-- MODAL ADD -->
    <!-- ========================= -->
    <Modal v-model="showAddModal" @save="saveAdd">
      <template #title>
        <div class="mt-5 ml-5 mb-3">
          <Heading variant="heading9b" class="font-semibold text-sm">
            Tambah Titelatur
          </Heading>

          <Heading variant="body2" class="text-xs text-gray-500 mt-1">
            Masukkan titelatur baru
          </Heading>
        </div>
      </template>

      <div class="flex flex-col gap-3">
        <Heading variant="body2m"
          >Titelatur Indonesia <span class="text-red-500">*</span></Heading
        >
        <input
          v-model="addForm.ind"
          placeholder="Masukkan Titelatur Indonesia"
          class="border px-3 py-2 rounded-md text-sm bg-gray-50"
        />

        <Heading variant="body2m"
          >Titelatur Inggris <span class="text-red-500">*</span></Heading
        >
        <input
          v-model="addForm.eng"
          placeholder="Masukkan Titelatur Inggris"
          class="border px-3 py-2 rounded-md text-sm bg-gray-50"
        />
      </div>
    </Modal>

    <!-- ========================= -->
    <!-- POPUP DELETE -->
    <!-- ========================= -->
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      title="Hapus Titelatur?"
      description="Data yang dihapus tidak dapat dikembalikan."
      confirmText="Hapus"
      cancelText="Batal"
      @confirm="deleteNow"
    />
  </div>
</template>
