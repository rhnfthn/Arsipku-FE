<template>
  <div
    class="w-full min-h-screen flex flex-col text-gray-800 dark:text-gray-100"
  >
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-gray-100">
          Template
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <button
        @click="openAdd"
        :disabled="isLoadingCreate"
        class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <Plus class="w-4 h-4" />
        {{ isLoadingCreate ? "Menyimpan..." : "Tambah Template" }}
      </button>
    </div>

    <!-- CARD -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm w-full">
      <!-- TOP BAR -->
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 p-3"
      >
        <div class="flex items-center gap-2">
          <span class="text-xs dark:text-gray-300">Tampilkan</span>
          <select
            v-model="rowsPerPage"
            class="border text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md px-2 py-1"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">
              {{ n }}
            </option>
          </select>
        </div>

        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="search"
            placeholder="Cari template..."
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs pl-9 pr-3 py-1.5 rounded-lg dark:text-gray-200 dark:placeholder-gray-400"
          />
        </div>
      </div>

      <!-- LOADING STATE WITH SKELETON -->
      <div v-if="isLoadingList" class="p-4">
        <div class="space-y-3">
          <!-- Header skeleton -->
          <div class="grid grid-cols-3 gap-4 mb-2">
            <div
              class="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"
            ></div>
            <div
              class="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"
            ></div>
            <div
              class="h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"
            ></div>
          </div>

          <!-- Rows skeleton -->
          <div v-for="i in 5" :key="i" class="grid grid-cols-3 gap-4">
            <div
              class="h-12 bg-gray-100 dark:bg-gray-700/50 animate-pulse rounded"
            ></div>
            <div
              class="h-12 bg-gray-100 dark:bg-gray-700/50 animate-pulse rounded"
            ></div>
            <div
              class="h-12 bg-gray-100 dark:bg-gray-700/50 animate-pulse rounded flex items-center justify-center gap-2 px-4"
            >
              <div
                class="w-8 h-8 bg-gray-200 dark:bg-gray-600 animate-pulse rounded"
              ></div>
              <div
                class="w-8 h-8 bg-gray-200 dark:bg-gray-600 animate-pulse rounded"
              ></div>
              <div
                class="w-8 h-8 bg-gray-200 dark:bg-gray-600 animate-pulse rounded"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- TABLE -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr class="bg-primary-400 dark:bg-primary-800 text-white">
              <th
                class="text-left text-[14px] p-4 border-b border-gray-300 dark:border-gray-700 cursor-pointer hover:bg-primary-500 dark:hover:bg-primary-900 transition"
                @click="sort('nama_template')"
              >
                <div class="flex items-center gap-2">
                  Nama Template
                  <ArrowUpDown
                    :class="[
                      'w-3 h-3 transition-all',
                      sortBy === 'nama_template'
                        ? 'opacity-100 text-yellow-300'
                        : 'opacity-50',
                    ]"
                  />
                </div>
              </th>

              <th
                class="text-left p-3 text-[14px] border-b border-gray-300 dark:border-gray-700 cursor-pointer hover:bg-primary-500 dark:hover:bg-primary-900 transition"
                @click="toggleSort('file')"
              >
                <div class="flex items-center gap-2">
                  Dokumen File
                  <ArrowUpDown
                    :class="[
                      'w-3 h-3 transition-all',
                      sortBy === 'file'
                        ? 'opacity-100 text-yellow-300'
                        : 'opacity-50',
                    ]"
                  />
                </div>
              </th>

              <th
                class="text-left p-3 text-[14px] border-b border-gray-300 dark:border-gray-700 w-28"
              >
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="template in paginatedTemplates"
              :key="template.id"
              class="border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <td class="p-4 text-sm dark:text-gray-200">
                {{ template.nama_template }}
              </td>
              <td class="p-4 text-primary-400 dark:text-primary-300 text-sm">
                {{ getFileName(template.file) }}
              </td>

              <td class="p-4 flex items-center gap-4 mr-2">
                <button
                  @click="downloadTemplate(template)"
                  class="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 transition"
                  title="Download"
                >
                  <Download class="w-4 h-4" />
                </button>

                <button
                  class="text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 transition"
                  @click="openEdit(template)"
                  title="Edit"
                  :disabled="isLoadingUpdate"
                >
                  <Pencil class="w-4 h-4" />
                </button>

                <button
                  @click="openDelete(template)"
                  class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                  title="Hapus"
                  :disabled="isLoadingDelete"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>

            <tr v-if="paginatedTemplates.length === 0">
              <td
                colspan="3"
                class="text-center py-10 text-gray-400 dark:text-gray-500"
              >
                <Inbox class="w-10 h-10 mx-auto mb-2 opacity-20" />
                Tidak ada data ditemukan
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="filteredTemplates.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          Menampilkan {{ paginatedTemplates.length }} dari {{ totalItems }} data
        </div>

        <div class="flex items-center gap-2">
          <!-- BACK -->
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
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
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all dark:text-gray-200"
            >
              1
            </button>

            <!-- DOTS LEFT -->
            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
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
                  ? 'bg-primary dark:bg-primary-700 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400',
              ]"
            >
              {{ page }}
            </button>

            <!-- DOTS RIGHT -->
            <span
              v-if="
                paginationPages[paginationPages.length - 1] < totalPages - 1
              "
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <!-- LAST -->
            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all dark:text-gray-200"
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
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
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

    <!-- ========================= -->
    <!-- MODAL TAMBAH TEMPLATE -->
    <!-- ========================= -->
    <Teleport to="body">
      <Modal v-model="addModal" @save="saveAdd" size="xl">
        <template #title>
          <Heading
            variant="heading8b"
            class="font-semibold text-xl mb-5 mt-5 ml-7 dark:text-gray-100"
          >
            Tambah Template
          </Heading>
        </template>

        <div class="px-2 py-3 flex flex-col gap-6">
          <!-- Nama Template -->
          <div class="flex flex-col">
            <Heading variant="heading10sb" class="mb-2 dark:text-gray-200">
              Nama Template <span class="text-red-500">*</span>
            </Heading>

            <input
              v-model="addData.nama_template"
              class="w-full px-5 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
              placeholder="Masukkan nama template"
            />
          </div>

          <!-- Upload File -->
          <div class="flex flex-col">
            <Heading variant="heading10sb" class="mb-2 dark:text-gray-200">
              File Dokumen <span class="text-red-500">*</span>
            </Heading>

            <label
              class="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <FileCheck class="w-6 h-6 text-gray-500 dark:text-gray-400" />
              <span class="font-medium dark:text-gray-200">Pilih File</span>
              <span class="ml-2 text-gray-500 dark:text-gray-400">
                {{ addData.fileName || "Belum ada file dipilih" }}
              </span>

              <input
                type="file"
                class="hidden"
                accept=".pdf,.doc,.docx,.xlsx,.xls,.html"
                @change="handleAddFile"
              />
            </label>

            <!-- Preview file -->
            <div
              v-if="addData.file"
              class="mt-3 px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <FileCheck
                  class="w-6 h-6 text-primary-500 dark:text-primary-400"
                />
                <div>
                  <p class="text-xs font-medium dark:text-gray-200">
                    {{ addData.fileName }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatFileSize(addData.file.size) }}
                  </p>
                </div>
              </div>
              <button
                @click="clearAddFile"
                class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                title="Hapus file"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- ========================= -->
    <!-- MODAL EDIT TEMPLATE -->
    <!-- ========================= -->
    <Teleport to="body">
      <Modal v-model="editModal" @save="saveEdit" size="xl">
        <template #title>
          <Heading
            variant="heading9b"
            class="font-semibold text-xl mb-2 mt-5 ml-7 dark:text-gray-100"
          >
            Edit Template
          </Heading>
        </template>

        <div class="px-2 py-3 flex flex-col gap-6">
          <!-- Nama Template -->
          <div class="flex flex-col">
            <Heading
              variant="heading10sb"
              class="font-semibold mb-2 dark:text-gray-200"
            >
              Nama Template <span class="text-red-500">*</span>
            </Heading>

            <input
              v-model="editData.nama_template"
              class="w-full px-5 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
              placeholder="Masukkan nama template"
            />
          </div>

          <!-- Upload File -->
          <div class="flex flex-col">
            <Heading
              variant="heading10sb"
              class="font-semibold mb-2 dark:text-gray-200"
            >
              File Dokumen
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >(Opsional)</span
              >
            </Heading>

            <label
              class="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <FileCheck class="w-6 h-6 text-gray-500 dark:text-gray-400" />
              <span class="font-medium dark:text-gray-200"
                >Pilih File Baru</span
              >
              <span class="ml-2 text-gray-500 dark:text-gray-400">
                {{ editData.newFileName || "Tidak ada file baru" }}
              </span>

              <input type="file" class="hidden" @change="handleEditFile" />
            </label>

            <!-- Current file info -->
            <div
              v-if="!editData.newFileName && editData.file"
              class="mt-3 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-3"
            >
              <FileCheck class="w-6 h-6 text-gray-400 dark:text-gray-500" />
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  File saat ini:
                </p>
                <p class="text-sm font-medium dark:text-gray-200">
                  {{ getFileName(editData.file) }}
                </p>
              </div>
            </div>

            <!-- Preview new file -->
            <div
              v-if="editData.newFileName"
              class="mt-3 px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <FileCheck
                  class="w-6 h-6 text-primary-500 dark:text-primary-400"
                />
                <div>
                  <p class="text-xs text-primary-600 dark:text-primary-400">
                    File baru:
                  </p>
                  <p class="text-sm font-medium dark:text-gray-200">
                    {{ editData.newFileName }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{
                      editData.newFile
                        ? formatFileSize(editData.newFile.size)
                        : "-"
                    }}
                  </p>
                </div>
              </div>
              <button
                @click="clearEditFile"
                class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                title="Hapus file baru"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- ========================= -->
    <!-- POPUP DELETE -->
    <!-- ========================= -->
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      type="danger"
      title="Hapus Data"
      message="Yakin ingin menghapus data ini?"
      confirmText="Hapus"
      cancelText="Batal"
      cancelColor="primary"
      @confirm="deleteNow"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import {
  Inbox,
  FileCheck,
  Search,
  ArrowUpDown,
  Download,
  Pencil,
  Trash2,
  Plus,
} from "lucide-vue-next";
import Heading from "~/components/Heading.vue";
import Modal from "~/components/Modal.vue";
import PageHeader from "~/components/PageHeader.vue";
import ConfirmPopup from "~/components/ConfirmPopup.vue";
import { useTemplate } from "~/composables/useTemplate";
import type { Template } from "~/types/template";

const toast = useToast();

// ✅ Composable
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  isLoadingList,
  isLoadingCreate,
  isLoadingUpdate,
  isLoadingDelete,
} = useTemplate();

// State
const templates = ref<Template[]>([]);
const search = ref("");

const editModal = ref(false);
const addModal = ref(false);
const confirmDeleteOpen = ref(false);
const itemToDelete = ref<Template | null>(null);

const editData = ref<any>({
  id: "",
  nama_template: "",
  file: "",
  newFile: null,
  newFileName: "",
});

const addData = ref<any>({
  nama_template: "",
  file: null,
  fileName: "",
});

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Template", to: "/admin/template" },
];

// ✅ Fetch Data dari API
const fetchData = async () => {
  try {
    const data = await getTemplates();
    templates.value = data;
    console.log("✅ Templates loaded:", templates.value.length);
  } catch (error) {
    console.error("❌ Error loading templates:", error);
  }
};

// Filter & Sort
const sortBy = ref("nama_template");
const sortDir = ref<"asc" | "desc">("asc");
const filteredTemplates = computed(() => {
  const s = search.value.toLowerCase();
  return templates.value.filter(
    (template) =>
      template.nama_template.toLowerCase().includes(s) ||
      template.file.toLowerCase().includes(s),
  );
});

const sortedTemplates = computed(() => {
  return [...filteredTemplates.value].sort((a, b) => {
    const A = a[sortBy.value];
    const B = b[sortBy.value];

    if (A < B) return sortDir.value === "asc" ? -1 : 1;
    if (A > B) return sortDir.value === "asc" ? 1 : -1;
    return 0;
  });
});

const sort = (col: string) => {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = col;
    sortDir.value = "asc";
  }
};

const toggleSort = (column: string) => {
  if (sortBy.value === column) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = column;
    sortDir.value = "asc";
  }
};

// ================================
// PAGINATION
// ================================
const rowsPerPage = ref(10);
const rowsChoices = [5, 10, 15, 25, 50, 100];
const currentPage = ref(1);

const paginatedTemplates = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedTemplates.value.slice(start, start + rowsPerPage.value);
});

const totalItems = computed(() => filteredTemplates.value.length);

const totalPages = computed(() =>
  Math.ceil(totalItems.value / rowsPerPage.value),
);
const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 2;

  const range: number[] = [];
  for (
    let i = Math.max(1, current - delta);
    i <= Math.min(total, current + delta);
    i++
  ) {
    range.push(i);
  }
  return range;
});

watch([search, rowsPerPage], () => {
  currentPage.value = 1;
});

// ✅ OPEN ADD MODAL
const openAdd = () => {
  addData.value = {
    nama_template: "",
    file: null,
    fileName: "",
  };
  addModal.value = true;
};

// ✅ HANDLE ADD FILE
const handleAddFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  addData.value.file = file;
  addData.value.fileName = file.name;
  console.log("📎 File selected:", file.name, formatFileSize(file.size));
};

// ✅ CLEAR ADD FILE
const clearAddFile = () => {
  addData.value.file = null;
  addData.value.fileName = "";
};

// ✅ SAVE ADD
const saveAdd = async () => {
  if (!addData.value.nama_template || !addData.value.file) {
    toast.add({
      title: "Form tidak lengkap",
      description: "Nama template dan file wajib diisi",
      color: "yellow",
    });
    return;
  }

  try {
    console.log("💾 Saving new template:", addData.value.nama_template);

    await createTemplate({
      nama_template: addData.value.nama_template,
      file: addData.value.file,
    });

    addModal.value = false;
    await fetchData();
    currentPage.value = 1;
  } catch (error) {
    console.error("❌ Error creating template:", error);
  }
};

// ✅ OPEN EDIT MODAL
const openEdit = async (template: Template) => {
  try {
    // Fetch detail template untuk memastikan data terbaru
    const detail = await getTemplateById(template.id);

    if (detail) {
      editData.value = {
        id: detail.id,
        nama_template: detail.nama_template,
        file: detail.file,
        file_url: detail.file_url,
        newFile: null,
        newFileName: "",
      };
      editModal.value = true;
      console.log("✏️ Editing template:", detail.nama_template);
    }
  } catch (error) {
    console.error("❌ Error opening edit modal:", error);
  }
};

// ✅ HANDLE EDIT FILE
const handleEditFile = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  editData.value.newFile = file;
  editData.value.newFileName = file.name;
  console.log("📎 New file selected:", file.name, formatFileSize(file.size));
};

// ✅ CLEAR EDIT FILE
const clearEditFile = () => {
  editData.value.newFile = null;
  editData.value.newFileName = "";
};

// ✅ SAVE EDIT
const saveEdit = async () => {
  if (!editData.value.nama_template) {
    toast.add({
      title: "Form tidak lengkap",
      description: "Nama template wajib diisi",
      color: "yellow",
    });
    return;
  }

  try {
    console.log("💾 Updating template:", editData.value.id);

    const payload: any = {
      nama_template: editData.value.nama_template,
    };

    // Jika ada file baru, kirim file baru
    if (editData.value.newFile) {
      payload.file = editData.value.newFile;
    }

    await updateTemplate(editData.value.id, payload);

    editModal.value = false;
    await fetchData();
  } catch (error) {
    console.error("❌ Error updating template:", error);
  }
};

// ✅ OPEN DELETE CONFIRMATION
const openDelete = (template: Template) => {
  itemToDelete.value = template;
  confirmDeleteOpen.value = true;
};

// ✅ DELETE NOW
const deleteNow = async () => {
  if (!itemToDelete.value) return;

  try {
    console.log("🗑️ Deleting template:", itemToDelete.value.id);
    await deleteTemplate(itemToDelete.value.id);
    confirmDeleteOpen.value = false;
    await fetchData();
  } catch (error) {
    console.error("❌ Error deleting template:", error);
  } finally {
    itemToDelete.value = null;
  }
};

// ✅ DOWNLOAD TEMPLATE
const downloadTemplate = (template: Template) => {
  if (template.file_url) {
    console.log("⬇️ Downloading:", template.file_url);
    window.open(template.file_url, "_blank");
  } else {
    toast.add({
      title: "URL tidak tersedia",
      description: "File tidak dapat diunduh",
      color: "red",
    });
  }
};

// Helper functions
const getFileName = (filePath: string): string => {
  if (!filePath) return "-";
  const parts = filePath.split("/");
  return parts[parts.length - 1];
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// ✅ Load data on mount
onMounted(async () => {
  console.log("🚀 Template page mounted");
  await fetchData();
});
</script>

<style scoped>
/* Custom skeleton animation */
@keyframes skeleton-loading {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}
</style>
