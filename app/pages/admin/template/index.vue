<template>
  <div
    class="w-full min-h-screen flex flex-col text-gray-800 dark:text-gray-100"
  >
    <div class="flex items-center justify-between w-full mb-5">
      <!-- KIRI -->
      <div>
        <Heading variant="heading6b" class="text-mobile-md">Template</Heading>
        <Heading variant="heading10m">Panduan Template Dokumen</Heading>
      </div>

      <!-- KANAN -->
      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-800 text-xs"
      >
        <Plus class="w-4 h-4" />
        Tambah Titelatur
      </button>
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm w-full">
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 p-5"
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

        <div class="relative w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            placeholder="Cari template..."
            class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 text-xs pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs border-collapse">
          <thead>
            <tr class="bg-gray-100 dark:bg-gray-800">
              <th
                class="text-left text-[14px] p-4 border-b border-gray-300 cursor-pointer"
                @click="toggleSort('from')"
              >
                Nama Template
                <ArrowUpDown class="inline w-3 h-3 ml-2" />
              </th>

              <th
                class="text-left p-3 text-[14px] border-b border-gray-300 cursor-pointer"
                @click="toggleSort('fileName')"
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
              v-for="mail in paginatedEmails"
              :key="mail.id"
              class="border-b border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <td class="p-4">{{ mail.from }}</td>
              <td class="p-4 text-primary-400 font-medium">
                {{ mail.fileName }}
              </td>

              <td class="p-4 flex items-center gap-3">
                <button class="text-sky-600 hover:text-sky-800">
                  <Download class="w-4 h-4" />
                </button>

                <button
                  class="text-yellow-500 hover:text-yellow-700"
                  @click="openEdit(mail)"
                >
                  <Pencil class="w-4 h-4" />
                </button>

                <button @click="openDelete(it)" class="text-red-500">
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>

            <tr v-if="paginatedEmails.length === 0">
              <td colspan="3" class="text-center py-10 text-gray-400">
                <Inbox class="w-10 h-10 mx-auto mb-2 opacity-20" />
                Tidak ada data ditemukan
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between ml-5 mr-5 mt-5 mb-5">
        <div class="text-xs">
          Menampilkan {{ paginatedEmails.length }} dari {{ totalItems }} data
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

    <!-- Modal -->
    <Modal v-model="editModal" @save="saveEdit">
      <template #title>
        <Heading
          variant="heading9b"
          class="font-semibold text-xl mb-2 mt-5 ml-7"
        >
          Edit Template
        </Heading>
      </template>

      <!-- Isi Modal -->
      <div class="px-2 py-3 flex flex-col gap-6">
        <!-- Nama Template -->
        <div class="flex flex-col">
          <Heading variant="body2m" class="font-semibold mb-1">
            Nama Template <span class="text-red-500">*</span>
          </Heading>

          <input
            v-model="editData.from"
            class="w-full px-5 py-3 text-sm rounded-lg border border-gray-300 bg-gray-50"
            placeholder="Masukkan nama template"
          />
        </div>

        <!-- Upload File -->
        <div class="flex flex-col">
          <Heading variant="body2m" class="font-semibold mb-1">
            File Dokumen
          </Heading>

          <label
            class="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 bg-white cursor-pointer flex items-center gap-3"
          >
            <FileCheck class="w-6 h-6 text-gray-500" />
            <span class="font-medium">Pilih File</span>
            <span class="ml-2 text-gray-500">{{ editData.fileName }}</span>

            <input type="file" class="hidden" @change="handleFileUpload" />
          </label>

          <!-- Preview file terpilih -->
          <div
            v-if="editData.fileName"
            class="mt-3 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <FileCheck class="w-6 h-6 text-primary-500" />
              <div>
                <p class="text-sm font-medium">{{ editData.fileName }}</p>
                <p class="text-xs text-gray-500">45 KB</p>
              </div>
            </div>
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
            v-model="addData.from"
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

            <input type="file" class="hidden" @change="handleAddFile" />
          </label>
        </div>
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

<script setup>
import { ref, computed, watch } from "vue";
import {
  Inbox,
  Filter,
  FileCheck,
  ChevronRight,
  Search,
  ArrowUpDown,
  RotateCcw,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Download,
  Pencil,
  Trash2,
  Plus,
} from "lucide-vue-next";
import Heading from "~/components/Heading.vue";
import Modal from "~/components/Modal.vue";

const search = ref("");
const sortBy = ref("from");
const sortDir = ref("asc");
const editModal = ref(false);
const editData = ref({});

const emails = ref([
  { id: 1, from: "PER - PERATURAN DIREKSI", fileName: "peraturan_1.pdf" },
  { id: 2, from: "KEP - KEPUTUSAN DIREKSI", fileName: "keputusan.pdf" },
  { id: 3, from: "INS - INSTRUKSI", fileName: "instruksi_1.docx" },
  { id: 4, from: "SPR - SURAT PERINTAH", fileName: "spr_01.pdf" },
  { id: 5, from: "SOP - OPERASIONAL", fileName: "sop_lengkap.pdf" },
  { id: 6, from: "PER - PERATURAN DIREKSI", fileName: "peraturan_2.pdf" },
  { id: 7, from: "PER - PERATURAN DIREKSI", fileName: "peraturan_1.pdf" },
  { id: 8, from: "KEP - KEPUTUSAN DIREKSI", fileName: "keputusan.pdf" },
  { id: 9, from: "INS - INSTRUKSI", fileName: "instruksi_1.docx" },
  { id: 10, from: "SPR - SURAT PERINTAH", fileName: "spr_01.pdf" },
  { id: 11, from: "SOP - OPERASIONAL", fileName: "sop_lengkap.pdf" },
  { id: 12, from: "PER - PERATURAN DIREKSI", fileName: "peraturan_2.pdf" },
]);

const filteredEmails = computed(() => {
  const s = search.value.toLowerCase();
  return emails.value.filter((mail) => mail.from.toLowerCase().includes(s));
});

const sortedEmails = computed(() => {
  return [...filteredEmails.value].sort((a, b) => {
    const colA = a[sortBy.value].toLowerCase();
    const colB = b[sortBy.value].toLowerCase();

    if (colA < colB) return sortDir.value === "asc" ? -1 : 1;
    if (colA > colB) return sortDir.value === "asc" ? 1 : -1;
    return 0;
  });
});

const toggleSort = (column) => {
  if (sortBy.value === column) {
    // toggle asc/desc
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = column;
    sortDir.value = "asc";
  }
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
// ================================
// PAGINATION
// ================================
const rowsPerPage = ref(5);
const rowsChoices = [5, 10, 15];

const currentPage = ref(1);

const paginatedEmails = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedEmails.value.slice(start, start + rowsPerPage.value);
});

const totalItems = computed(() => sortedEmails.value.length);

const totalPages = computed(() =>
  Math.ceil(totalItems.value / rowsPerPage.value)
);

// reset page saat search atau rowsPerPage berubah
watch([search, rowsPerPage], () => {
  currentPage.value = 1;
});

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  editData.value.file = file;
  editData.value.fileName = file.name;
};
const openEdit = (mail) => {
  editData.value = {
    ...mail,
    file: null, // kosongkan file upload
  };
  editModal.value = true;
};

const addModal = ref(false);

const addData = ref({
  from: "",
  file: null,
  fileName: "",
});

const openAdd = () => {
  addData.value = {
    from: "",
    file: null,
    fileName: "",
  };
  addModal.value = true;
};

const handleAddFile = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  addData.value.file = file;
  addData.value.fileName = file.name;
};

const saveAdd = () => {
  if (!addData.value.from || !addData.value.file) {
    alert("Nama template dan file wajib diisi!");
    return;
  }

  emails.value.push({
    id: emails.value.length + 1,
    from: addData.value.from,
    fileName: addData.value.fileName,
  });

  addModal.value = false;
};
</script>
