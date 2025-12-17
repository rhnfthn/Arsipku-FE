<template>
  <div
    class="w-full min-h-screen flex flex-col text-gray-800 dark:text-gray-100"
  >
    <div class="flex items-center justify-between w-full mb-5">
      <!-- KIRI -->
      <div>
        <Heading variant="heading6b" class="text-mobile-md"> Template </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- KANAN -->
      <button
        @click="openAdd"
        :disabled="isLoadingCreate"
        class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-800 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus class="w-4 h-4" />
        {{ isLoadingCreate ? "Menyimpan..." : "Tambah Template" }}
      </button>
    </div>

    <!-- CARD -->
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm w-full">
      <!-- TOP BAR -->
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 p-3"
      >
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

        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            placeholder="Cari template..."
            class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 text-xs pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
      </div>

      <!-- LOADING STATE -->
      <div v-if="isLoadingList" class="p-8">
        <div class="space-y-3">
          <div
            v-for="i in 5"
            :key="i"
            class="h-12 bg-gray-200 animate-pulse rounded"
          ></div>
        </div>
      </div>

      <!-- TABLE -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr class="bg-primary-400 text-white dark:bg-gray-800">
              <th
                class="text-left text-[14px] p-4 border-b border-gray-300 cursor-pointer"
                @click="toggleSort('nama_template')"
              >
                Nama Template
                <ArrowUpDown class="inline w-3 h-3 ml-2" />
              </th>

              <th
                class="text-left p-3 text-[14px] border-b border-gray-300 cursor-pointer"
                @click="toggleSort('file')"
              >
                Dokumen File
                <ArrowUpDown class="inline w-3 h-3 ml-2" />
              </th>

              <th
                class="text-left p-3 text-[14px] border-b border-gray-300 w-28"
              >
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="template in paginatedTemplates"
              :key="template.id"
              class="border-b bg-white border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <td class="p-4 text-sm">{{ template.nama_template }}</td>
              <td class="p-4 text-primary-400 text-sm">
                {{ getFileName(template.file) }}
              </td>

              <td class="p-4 flex items-center gap-4 mr-2">
                <button
                  @click="downloadTemplate(template)"
                  class="text-sky-600 hover:text-sky-800"
                  title="Download"
                >
                  <Download class="w-4 h-4" />
                </button>

                <button
                  class="text-yellow-500 hover:text-yellow-700"
                  @click="openEdit(template)"
                  title="Edit"
                  :disabled="isLoadingUpdate"
                >
                  <Pencil class="w-4 h-4" />
                </button>

                <button
                  @click="openDelete(template)"
                  class="text-red-500 hover:text-red-700"
                  title="Hapus"
                  :disabled="isLoadingDelete"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>

            <tr v-if="paginatedTemplates.length === 0">
              <td colspan="3" class="text-center py-10 text-gray-400">
                <Inbox class="w-10 h-10 mx-auto mb-2 opacity-20" />
                Tidak ada data ditemukan
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div class="flex items-center justify-between ml-5 mr-5 mt-5 mb-5">
        <div class="text-xs">
          Menampilkan {{ paginatedTemplates.length }} dari {{ totalItems }} data
        </div>

        <div class="flex items-center gap-1">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1 text-xs rounded-md hover:bg-gray-100 disabled:opacity-30"
          >
            &lt;
          </button>

          <button
            v-for="page in totalPages"
            :key="page"
            @click="currentPage = page"
            :class="[
              'px-3 py-1 text-xs rounded-md',
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
            class="px-3 py-1 text-xs rounded-md hover:bg-gray-100 disabled:opacity-30"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>

    <!-- ========================= -->
    <!-- MODAL EDIT TEMPLATE -->
    <!-- ========================= -->
    <Modal v-model="editModal" @save="saveEdit">
      <template #title>
        <Heading
          variant="heading9b"
          class="font-semibold text-xl mb-2 mt-5 ml-7"
        >
          Edit Template
        </Heading>
      </template>

      <div class="px-2 py-3 flex flex-col gap-6">
        <!-- Nama Template -->
        <div class="flex flex-col">
          <Heading variant="body2m" class="font-semibold mb-1">
            Nama Template <span class="text-red-500">*</span>
          </Heading>

          <input
            v-model="editData.nama_template"
            class="w-full px-5 py-3 text-sm rounded-lg border border-gray-300 bg-gray-50"
            placeholder="Masukkan nama template"
          />
        </div>

        <!-- Upload File -->
        <div class="flex flex-col">
          <Heading variant="body2m" class="font-semibold mb-1">
            File Dokumen <span class="text-xs text-gray-500">(Opsional)</span>
          </Heading>

          <label
            class="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 bg-white cursor-pointer flex items-center gap-3"
          >
            <FileCheck class="w-6 h-6 text-gray-500" />
            <span class="font-medium">Pilih File Baru</span>
            <span class="ml-2 text-gray-500">
              {{ editData.newFileName || "Tidak ada file baru" }}
            </span>

            <input type="file" class="hidden" @change="handleEditFile" />
          </label>

          <!-- Current file info -->
          <div
            v-if="!editData.newFileName && editData.file"
            class="mt-3 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 flex items-center gap-3"
          >
            <FileCheck class="w-6 h-6 text-gray-400" />
            <div>
              <p class="text-xs text-gray-500">File saat ini:</p>
              <p class="text-sm font-medium">
                {{ getFileName(editData.file) }}
              </p>
            </div>
          </div>

          <!-- Preview new file -->
          <div
            v-if="editData.newFileName"
            class="mt-3 px-4 py-2 rounded-lg border border-primary-300 bg-primary-50 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <FileCheck class="w-6 h-6 text-primary-500" />
              <div>
                <p class="text-xs text-primary-600">File baru:</p>
                <p class="text-sm font-medium">{{ editData.newFileName }}</p>
                <p class="text-xs text-gray-500">
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
              class="text-red-500 hover:text-red-700"
              title="Hapus file baru"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- ========================= -->
    <!-- MODAL TAMBAH TEMPLATE -->
    <!-- ========================= -->
    <Modal v-model="addModal" @save="saveAdd">
      <template #title>
        <Heading
          variant="heading9b"
          class="font-semibold text-xl mb-2 mt-5 ml-7"
        >
          Tambah Template
        </Heading>
      </template>

      <div class="px-2 py-3 flex flex-col gap-6">
        <!-- Nama Template -->
        <div class="flex flex-col">
          <Heading variant="body2m" class="font-semibold mb-1">
            Nama Template <span class="text-red-500">*</span>
          </Heading>

          <input
            v-model="addData.nama_template"
            class="w-full px-5 py-3 text-sm rounded-lg border border-gray-300 bg-gray-50"
            placeholder="Masukkan nama template"
          />
        </div>

        <!-- Upload File -->
        <div class="flex flex-col">
          <Heading variant="body2m" class="font-semibold mb-1">
            File Dokumen <span class="text-red-500">*</span>
          </Heading>

          <label
            class="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 bg-white cursor-pointer flex items-center gap-3"
          >
            <FileCheck class="w-6 h-6 text-gray-500" />
            <span class="font-medium">Pilih File</span>
            <span class="ml-2 text-gray-500">
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
            class="mt-3 px-4 py-2 rounded-lg border border-primary-300 bg-primary-50 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <FileCheck class="w-6 h-6 text-primary-500" />
              <div>
                <p class="text-sm font-medium">{{ addData.fileName }}</p>
                <p class="text-xs text-gray-500">
                  {{ formatFileSize(addData.file.size) }}
                </p>
              </div>
            </div>
            <button
              @click="clearAddFile"
              class="text-red-500 hover:text-red-700"
              title="Hapus file"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- ========================= -->
    <!-- POPUP DELETE -->
    <!-- ========================= -->
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      title="Hapus Template?"
      description="Template yang dihapus tidak dapat dikembalikan."
      confirmText="Hapus"
      cancelText="Batal"
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
const sortBy = ref("nama_template");
const sortDir = ref<"asc" | "desc">("asc");
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
    const colA = String(a[sortBy.value] || "").toLowerCase();
    const colB = String(b[sortBy.value] || "").toLowerCase();

    if (colA < colB) return sortDir.value === "asc" ? -1 : 1;
    if (colA > colB) return sortDir.value === "asc" ? 1 : -1;
    return 0;
  });
});

const toggleSort = (column: string) => {
  if (sortBy.value === column) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = column;
    sortDir.value = "asc";
  }
};
// Pagination
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Template", to: "/admin/template" },
];

// ==============================
// DELETE (existing)
// ==============================
// const confirmDeleteOpen = ref(false);
// const itemToDelete = ref < any > null;

// const openDelete = (item) => {
//   itemToDelete.value = item;
//   confirmDeleteOpen.value = true;
// };

// const deleteNow = () => {
//   listDelegasi.value = listDelegasi.value.filter(
//     (i) => i.id !== itemToDelete.value.id,
//   );
//   confirmDeleteOpen.value = false;
// };

// const confirmDeleteOpen = ref(false);
// const itemToDelete = ref<any>(null);

// const openDelete = (item: any) => {
//   itemToDelete.value = item;
//   confirmDeleteOpen.value = true;
// };

// const deleteNow = () => {
//   if (!itemToDelete.value) return;

//   listDelegasi.value = listDelegasi.value.filter(
//     (i) => i.id !== itemToDelete.value.id,
//   );

//   confirmDeleteOpen.value = false;
// };

// ================================
// PAGINATION
// ================================
const rowsPerPage = ref(10);
const rowsChoices = [5, 10, 15, 20];
const currentPage = ref(1);

const paginatedTemplates = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedTemplates.value.slice(start, start + rowsPerPage.value);
});

const totalItems = computed(() => sortedTemplates.value.length);
const totalPages = computed(() =>
  Math.ceil(totalItems.value / rowsPerPage.value),
);

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
const openEdit = (template: Template) => {
  editData.value = {
    id: template.id,
    nama_template: template.nama_template,
    file: template.file,
    newFile: null,
    newFileName: "",
  };
  editModal.value = true;
  console.log("✏️ Editing template:", template.nama_template);
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
    // Jika tidak ada file baru, biarkan backend gunakan file lama
    // (tidak perlu kirim file path string)

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
