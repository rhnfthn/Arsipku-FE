<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Search, ArrowUpDown, Pencil, Trash2, Plus } from "lucide-vue-next";
import Heading from "~/components/Heading.vue";
import Modal from "~/components/Modal.vue";
import ConfirmPopup from "~/components/ConfirmPopup.vue";
import { useTitelatur } from "~/composables/useTitelatur";
import type { TitelaturItem } from "~/types/titelatur";

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Titelatur Inggris", to: "/admin/titelatur" },
];

// ================================
// COMPOSABLE
// ================================
const {
  items,
  loading,
  error,
  fetchTitelatur,
  fetchTitelaturById,
  createTitelatur,
  updateTitelatur,
  deleteTitelatur,
} = useTitelatur();

// ================================
// LIFECYCLE
// ================================
onMounted(async () => {
  await fetchTitelatur();
});

// ================================
// SEARCH + FILTER + SORT
// ================================
const search = ref("");
const filteredItems = computed(() => {
  const s = search.value.toLowerCase();
  return items.value.filter(
    (it) =>
      it.long_text?.toLowerCase().includes(s) ||
      it.long_text_en?.toLowerCase().includes(s),
  );
});

const sortDirection = ref<"asc" | "desc" | null>(null);
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
  if (sortDirection.value === "asc") {
    arr.sort((a, b) => (a.long_text || "").localeCompare(b.long_text || ""));
  }
  if (sortDirection.value === "desc") {
    arr.sort((a, b) => (b.long_text || "").localeCompare(a.long_text || ""));
  }
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
const selectedItem = ref<TitelaturItem | null>(null);

const editForm = ref({
  company: "10000",
  start_date: "",
  end_date: "9999-12-31",
  object_type: "CO",
  long_text: "",
  long_text_en: "",
});

const openEdit = async (item: TitelaturItem) => {
  const fullItem = await fetchTitelaturById(item.id);
  if (fullItem) {
    selectedItem.value = fullItem;
    editForm.value = {
      company: fullItem.company || "10000",
      start_date: fullItem.start_date || "",
      end_date: fullItem.end_date || "9999-12-31",
      object_type: fullItem.object_type || "CO",
      long_text: fullItem.long_text || "",
      long_text_en: fullItem.long_text_en || "",
    };
    showEditModal.value = true;
  }
};

const saveEdit = async () => {
  if (!selectedItem.value) return;

  const success = await updateTitelatur(selectedItem.value.id, {
    company: editForm.value.company,
    start_date: editForm.value.start_date,
    end_date: editForm.value.end_date,
    object_type: editForm.value.object_type,
    long_text: editForm.value.long_text,
    long_text_en: editForm.value.long_text_en,
  });

  if (success) {
    showEditModal.value = false;
    // Optionally show success notification
  }
};

// ================================
// MODAL: ADD
// ================================
const showAddModal = ref(false);

const addForm = ref({
  company: "10000",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "9999-12-31",
  object_type: "CO",
  long_text: "",
  long_text_en: "",
});

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

const saveAdd = async () => {
  const success = await createTitelatur({
    company: addForm.value.company,
    start_date: addForm.value.start_date,
    end_date: addForm.value.end_date,
    object_type: addForm.value.object_type,
    long_text: addForm.value.long_text,
    long_text_en: addForm.value.long_text_en,
  });

  if (success) {
    showAddModal.value = false;
    // Optionally show success notification
  }
};

// ================================
// POPUP DELETE
// ================================
const confirmDeleteOpen = ref(false);
const itemToDelete = ref<TitelaturItem | null>(null);

const openDelete = (item: TitelaturItem) => {
  itemToDelete.value = item;
  confirmDeleteOpen.value = true;
};

const deleteNow = async () => {
  if (!itemToDelete.value) return;

  const success = await deleteTitelatur(itemToDelete.value.id);

  if (success) {
    confirmDeleteOpen.value = false;
    // Optionally show success notification
  }
};
</script>

<template>
  <div class="min-w-0 min-h-screen">
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Titelatur Inggris
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- KIRI: TOMBOL TAMBAH -->
      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-800 text-sm"
      >
        <Plus class="w-4 h-4" />
        Tambah Titelatur
      </button>
    </div>

    <!-- LOADING STATE -->
    <div v-if="loading" class="text-center py-8">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"
      ></div>
      <p class="mt-2 text-gray-600">Memuat data...</p>
    </div>

    <!-- ERROR STATE -->
    <div
      v-if="error"
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4"
    >
      {{ error }}
    </div>

    <!-- CARD -->
    <div
      v-if="!loading"
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
            <th class="px-4 py-3 font-bold">Titelatur Indonesia</th>
            <th class="px-4 py-3 font-bold">Titelatur Inggris</th>
            <th class="px-4 py-3 font-bold text-center">Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="it in paginatedItems"
            :key="it.id"
            class="border-b border-gray-200 hover:bg-primary-50"
          >
            <td class="px-5 py-3">{{ it.long_text || "-" }}</td>
            <td class="px-5 py-3">{{ it.long_text_en || "-" }}</td>

            <td class="px-4 py-3 text-center flex justify-center gap-5">
              <button
                @click="openEdit(it)"
                class="text-yellow-500 hover:text-yellow-600"
              >
                <Pencil class="w-4 h-4" />
              </button>

              <button
                @click="openDelete(it)"
                class="text-red-500 hover:text-red-600"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-if="paginatedItems.length === 0">
            <td colspan="3" class="px-5 py-8 text-center text-gray-500">
              Tidak ada data titelatur
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
    <Teleport to="body">
      <Modal v-model="showEditModal" @save="saveEdit" size="xl">
        <template #title>
          <div class="mt-5 ml-5 mb-2">
            <Heading variant="heading9b" class="font-semibold text-sm">
              Edit Titelatur
            </Heading>

            <Heading variant="body2" class="text-xs text-gray-500 mt-1">
              Isi form di bawah ini untuk mengedit titelatur
            </Heading>
          </div>
        </template>

        <div class="flex flex-col gap-2 mt-2">
          <Heading variant="body2m"
            >Titelatur Indonesia <span class="text-red-500">*</span></Heading
          >
          <input
            v-model="editForm.long_text"
            class="border border-gray-300 px-3 py-2 rounded-md text-sm mb-3"
          />

          <Heading variant="body2m"
            >Titelatur Inggris <span class="text-red-500">*</span></Heading
          >
          <input
            v-model="editForm.long_text_en"
            class="border border-gray-300 px-3 py-2 rounded-md text-sm mb-10"
          />
        </div>
      </Modal>
    </Teleport>
    <!-- ========================= -->
    <!-- MODAL ADD -->
    <!-- ========================= -->
    <Teleport to="body">
      <Modal v-model="showAddModal" @save="saveAdd" size="xl">
        <template #title>
          <div class="mt-5 ml-5 mb-2">
            <Heading variant="heading9b" class="font-semibold text-sm">
              Tambah Titelatur
            </Heading>

            <Heading variant="body2" class="text-xs text-gray-500 mt-1">
              Masukkan titelatur baru
            </Heading>
          </div>
        </template>

        <div class="flex flex-col gap-2 mt-2">
          <Heading variant="body2m"
            >Titelatur Indonesia <span class="text-red-500">*</span></Heading
          >
          <input
            v-model="addForm.long_text"
            placeholder="Masukkan Titelatur Indonesia"
            class="border border-gray-300 px-3 py-2 rounded-md text-sm bg-gray-50 mb-3"
          />

          <Heading variant="body2m"
            >Titelatur Inggris <span class="text-red-500">*</span></Heading
          >
          <input
            v-model="addForm.long_text_en"
            placeholder="Masukkan Titelatur Inggris"
            class="border border-gray-300 px-3 py-2 rounded-md text-sm bg-gray-50 mb-10"
          />
        </div>
      </Modal>
    </Teleport>
    <!-- ========================= -->
    <!-- POPUP DELETE -->
    <!-- ========================= -->
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      type="danger"
      title="Hapus Titelatur?"
      message="Data yang dihapus tidak dapat dikembalikan."
      confirmText="Hapus"
      cancelText="Batal"
      cancelColor="primary"
      @confirm="deleteNow"
    />
  </div>
</template>
