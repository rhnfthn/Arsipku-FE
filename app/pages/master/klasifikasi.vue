<template>
  <div class="space-y-6 pt-5">
    <!-- HEADER -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <div>
        <PageHeader title="Klasifikasi" :items="items" />
      </div>

      <button
        @click="openAddModal"
        class="flex items-center gap-2 bg-primary text-white space-y-6 h-8 px-6 rounded-lg hover:bg-primary-800 text-xs"
      >
        <Plus class="w-4 h-4" />
        Tambah
      </button>
    </div>

    <!-- CARD TABLE -->
    <div class="rounded-lg border border-gray-200 shadow-sm bg-white">
      <!-- TOOLBAR (TIDAK ikut scroll) -->
      <div
        class="rounded-lg shadow-sm sticky left-0 z-40 bg-white flex flex-wrap gap-4 items-center p-3 justify-between border-b border-gray-200"
      >
        <button
          @click="fetchKlasifikasi"
          class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          title="Refresh"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            placeholder="Cari Klasifikasi..."
            class="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 text-xs pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
        <button
          class="flex items-center gap-2 bg-primary text-white h-8 px-6 rounded-lg hover:bg-primary-500 text-xs"
          @click="onExport"
        >
          <FileDown class="w-4 h-4" />
          Export
        </button>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-primary-400 text-white">
            <tr>
              <th class="px-4 py-3 text-left">Kode Klasifikasi</th>
              <th class="px-4 py-3 text-left">Nama Klasifikasi</th>
              <th class="px-4 py-3 text-left">Deskripsi</th>
              <th class="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <!-- LOADING -->
            <tr v-if="loading">
              <td colspan="4" class="py-6 text-center text-gray-500">
                Memuat data...
              </td>
            </tr>

            <!-- EMPTY -->
            <tr v-else-if="klasifikasiList.length === 0">
              <td colspan="4" class="py-6 text-center text-gray-500">
                Data tidak ditemukan
              </td>
            </tr>

            <!-- ROW -->
            <tr
              v-for="row in paginatedKlasifikasi"
              :key="row.id"
              class="border-b border-b-gray-200 hover:bg-blue-50"
            >
              <td class="px-4 py-3 font-semibold">
                <span
                  class="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs"
                >
                  {{ row.klasifikasi }}
                </span>
              </td>

              <td class="px-4 py-3">
                {{ row.klasifikasi_text }}
              </td>

              <td class="px-4 py-3 text-gray-600">
                {{ row.deskripsi ?? "-" }}
              </td>

              <td class="px-4 py-3">
                <div class="flex justify-center gap-3">
                  <button
                    class="text-gray-600 hover:bg-gray-200 group-hover:text-gray-600 p-2 rounded-lg transition-colors group"
                    title="Detail"
                    @click="onView(row)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <button
                    class="text-yellow-500 hover:bg-yellow-100 group-hover:text-yellow-600 p-2 rounded-lg transition-colors group"
                    title="Edit"
                    @click="onEdit(row)"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>

                  <button
                    class="p-2 hover:bg-red-100 rounded-lg transition-colors group text-red-600 group-hover:text-red-600"
                    title="Delete"
                    @click="onDelete(row)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="totalItems > 0"
        class="flex items-center justify-between px-4 py-4"
      >
        <div class="text-xs text-gray-600">
          Menampilkan {{ paginatedKlasifikasi.length }} dari
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
            Back
          </button>

          <!-- PAGE NUMBERS -->
          <div class="flex items-center gap-1">
            <!-- FIRST -->
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary"
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
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary"
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
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DETAIL -->
    <Teleport to="body">
      <div
        v-if="showDetail"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      >
        <div class="bg-white rounded-2xl w-[520px] max-w-[90vw]">
          <!-- HEADER -->
          <div
            class="flex justify-between items-center p-4 border-b border-b-gray-200"
          >
            <Heading variant="heading9sb">
              Detail Jenis <span class="text-red-500">*</span>
            </Heading>
            <button @click="showDetail = false">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- BODY -->
          <div class="p-5 space-y-6 text-sm">
            <!-- KODE KLASIFIKASI -->
            <div class="flex gap-3 items-start">
              <Hash class="w-5 h-5 text-blue-600 mt-1" />
              <div class="flex-1">
                <p class="text-sm text-gray-600">Kode Klasifikasi</p>

                <div class="mt-2">
                  <span
                    class="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-blue-50 text-blue-700 font-semibold text-sm"
                  >
                    {{ detail?.klasifikasi }}
                  </span>
                </div>
              </div>
            </div>

            <!-- NAMA KLASIFIKASI -->
            <div class="flex gap-3 items-start">
              <FileText class="w-5 h-5 text-green-600 mt-1" />
              <div class="flex-1">
                <p class="text-sm text-gray-600">Nama Klasifikasi</p>
                <p class="mt-2 text-sm font-medium text-black">
                  {{ detail?.klasifikasi_text }}
                </p>
              </div>
            </div>

            <!-- DESKRIPSI -->
            <div class="flex gap-3 items-start">
              <ChartNoAxesGantt class="w-5 h-5 text-orange-500 mt-1" />
              <div class="flex-1">
                <p class="text-sm text-gray-600">Deskripsi</p>
                <p class="mt-2 text-sm font-medium text-gray-900">
                  {{ detail?.deskripsi ?? "-" }}
                </p>
              </div>
            </div>

            <!-- TANGGAL DIBUAT -->
            <div class="flex gap-3 items-start">
              <Calendar class="w-5 h-5 text-cyan-600 mt-1" />
              <div class="flex-1">
                <p class="text-sm text-gray-600">Tanggal Dibuat</p>
                <p class="mt-2 text-sm text-gray-900">-</p>
              </div>
            </div>
          </div>

          <!-- FOOTER -->
          <div class="border-t border-t-gray-200 p-4">
            <button
              @click="showDetail = false"
              class="w-full px-3 py-2 rounded-lg bg-primary hover:bg-primary-700 text-white font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL TAMBAH KLASIFIKASI -->
    <Teleport to="body">
      <Modal v-model="showAddModal" size="xl" @save="submitAddKlasifikasi">
        <template #title>
          <Heading
            variant="heading9b"
            class="font-semibold text-sm mb-3 mt-5 ml-5"
          >
            Tambah Klasifikasi
          </Heading>
        </template>

        <div class="space-y-5 p-1">
          <!-- KODE KLASIFIKASI -->
          <div class="flex flex-col gap-1">
            <Heading variant="heading11m" class="text-xs">
              Kode Klasifikasi <span class="text-red-500">*</span>
            </Heading>

            <input
              v-model="addForm.klasifikasi"
              type="text"
              placeholder="OPS.0123"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
            />

            <p v-if="addErrors.klasifikasi" class="text-xs text-red-500">
              {{ addErrors.klasifikasi }}
            </p>
          </div>

          <!-- NAMA KLASIFIKASI -->
          <div class="flex flex-col gap-1">
            <Heading variant="heading11m" class="text-xs">
              Nama Klasifikasi <span class="text-red-500">*</span>
            </Heading>

            <input
              v-model="addForm.klasifikasi_text"
              type="text"
              placeholder="Air Traffic Flow Management (ATFM)"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
            />

            <p v-if="addErrors.klasifikasi_text" class="text-xs text-red-500">
              {{ addErrors.klasifikasi_text }}
            </p>
          </div>

          <!-- DESKRIPSI -->
          <div class="flex flex-col gap-1">
            <Heading variant="heading11m" class="text-xs">
              Deskripsi <span class="text-red-500">*</span>
            </Heading>

            <textarea
              v-model="addForm.deskripsi"
              rows="4"
              placeholder="Rekaman kegiatan atau peristiwa yang berkaitan ..."
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
            />

            <p class="text-xs text-gray-500">Opsional, boleh dikosongkan.</p>
          </div>

          <!-- LOADING INFO -->
          <p v-if="savingAdd" class="text-xs text-gray-500">
            Menyimpan data...
          </p>
        </div>
      </Modal>
    </Teleport>

    <!-- MODAL EDIT KLASIFIKASI -->
    <Teleport to="body">
      <Modal v-model="showEditModal" size="xl" @save="submitEditKlasifikasi">
        <template #title>
          <Heading
            variant="heading9b"
            class="font-semibold text-sm mb-3 mt-5 ml-5"
          >
            Edit Klasifikasi
          </Heading>
        </template>

        <div class="space-y-5 p-1">
          <!-- KODE -->
          <div class="flex flex-col gap-1">
            <Heading variant="heading11m" class="text-xs">
              Kode Klasifikasi <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="editForm.klasifikasi"
              type="text"
              placeholder="OPS.01234"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
            />

            <p v-if="editErrors.klasifikasi" class="text-xs text-red-500">
              {{ editErrors.klasifikasi }}
            </p>
          </div>

          <!-- NAMA -->
          <div class="flex flex-col gap-1">
            <Heading variant="heading11m" class="text-xs">
              Nama Klasifikasi <span class="text-red-500">*</span>
            </Heading>

            <input
              v-model="editForm.klasifikasi_text"
              type="text"
              placeholder="Air Traffic Flow Management (ATFM)"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
            />

            <p v-if="editErrors.klasifikasi_text" class="text-xs text-red-500">
              {{ editErrors.klasifikasi_text }}
            </p>
          </div>

          <!-- DESKRIPSI -->
          <div class="flex flex-col gap-1">
            <Heading variant="heading11m" class="text-xs">
              Deskripsi <span class="text-red-500">*</span>
            </Heading>

            <textarea
              v-model="editForm.deskripsi"
              rows="4"
              placeholder="Deskripsi klasifikasi..."
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300"
            />

            <p class="text-xs text-gray-500">Opsional, boleh dikosongkan.</p>
          </div>

          <p v-if="savingEdit" class="text-xs text-gray-500">
            Menyimpan data...
          </p>
        </div>
      </Modal>
    </Teleport>

    <ConfirmDialog
      v-model="showDeletePopup"
      type="danger"
      title="Hapus Klasifikasi"
      :message="deleteMessage"
      confirm-text="Hapus"
      cancel-text="Batal"
      :is-loading="deleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import {
  Eye,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  Plus,
  FileDown,
  FileText,
  Hash,
  ChartNoAxesGantt,
  Calendar,
} from "lucide-vue-next";
import type { BreadcrumbItem } from "~/types/breadcrumb";
import type { Klasifikasi } from "~/types/klasifikasi";
import { useKlasifikasi } from "~/composables/useKlasifikasi";
import Modal from "@/components/Modal.vue";
import ConfirmDialog from "@/components/ConfirmPopup.vue";

const items: BreadcrumbItem[] = [
  { label: "Beranda", to: "/beranda" },
  { label: "Klasifikasi", to: "/master/klasifikasi" },
];

//toast
import { useToast } from "#imports";

const toast = useToast();

const showToast = (opt: {
  title: string;
  message?: string;
  color?: "primary" | "neutral" | "secondary" | "warning" | "error" | "success";
  icon?: string;
}) => {
  toast.add({
    title: opt.title,
    description: opt.message,
    color: opt.color ?? "primary",
    icon: opt.icon ?? "i-lucide-info",
  });
};

const {
  getKlasifikasi,
  getKlasifikasiDetail,
  createKlasifikasi,
  updateKlasifikasi,
  deleteKlasifikasi,
} = useKlasifikasi();

//post
const klasifikasiList = ref<Klasifikasi[]>([]);
const loading = ref(false);

const fetchKlasifikasi = async () => {
  loading.value = true;
  try {
    klasifikasiList.value = await getKlasifikasi();
    currentPage.value = 1;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchKlasifikasi);

//detail
const showDetail = ref(false);
const detail = ref<Klasifikasi | null>(null);

const onView = async (row: Klasifikasi) => {
  showDetail.value = true;
  detail.value = null;

  try {
    const res = await getKlasifikasiDetail(row.id);
    detail.value = (res as any).data ?? res;
  } catch (e) {
    console.error("Gagal ambil detail", e);
  }
};

//post
const showAddModal = ref(false);
const savingAdd = ref(false);

const addForm = ref({
  klasifikasi: "",
  klasifikasi_text: "",
  deskripsi: "",
});

const addErrors = ref<Record<string, string>>({});

const openAddModal = () => {
  addErrors.value = {};
  addForm.value = {
    klasifikasi: "",
    klasifikasi_text: "",
    deskripsi: "",
  };
  showAddModal.value = true;
};

const validateAdd = () => {
  const err: Record<string, string> = {};

  if (!addForm.value.klasifikasi.trim())
    err.klasifikasi = "Kode klasifikasi wajib diisi";

  if (!addForm.value.klasifikasi_text.trim())
    err.klasifikasi_text = "Nama klasifikasi wajib diisi";

  addErrors.value = err;
  return Object.keys(err).length === 0;
};

const submitAddKlasifikasi = async () => {
  if (!validateAdd()) return;

  try {
    savingAdd.value = true;

    await createKlasifikasi({
      company: "10000",
      klasifikasi: addForm.value.klasifikasi,
      klasifikasi_text: addForm.value.klasifikasi_text,
      deskripsi: addForm.value.deskripsi || null,
    });

    showAddModal.value = false;
    await fetchKlasifikasi();

    showToast({
      title: "Berhasil",
      message: "Data klasifikasi berhasil ditambahkan",
      color: "success",
      icon: "i-lucide-check-circle",
    });
  } catch (e) {
    console.error("Gagal tambah klasifikasi:", e);

    showToast({
      title: "Gagal",
      message: "Data klasifikasi gagal ditambahkan",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    savingAdd.value = false;
  }
};

//put
const showEditModal = ref(false);
const savingEdit = ref(false);
const editId = ref<string | null>(null);

const editForm = ref({
  klasifikasi: "",
  klasifikasi_text: "",
  deskripsi: "",
});

const editErrors = ref<Record<string, string>>({});

const validateEdit = () => {
  const err: Record<string, string> = {};

  if (!editForm.value.klasifikasi.trim())
    err.klasifikasi = "Kode klasifikasi wajib diisi";

  if (!editForm.value.klasifikasi_text.trim())
    err.klasifikasi_text = "Nama klasifikasi wajib diisi";

  editErrors.value = err;
  return Object.keys(err).length === 0;
};

const onEdit = async (row: Klasifikasi) => {
  try {
    showEditModal.value = true;
    savingEdit.value = false;
    editErrors.value = {};
    editId.value = row.id;

    editForm.value = {
      klasifikasi: "",
      klasifikasi_text: "",
      deskripsi: "",
    };

    const res = await getKlasifikasiDetail(row.id);
    const data = (res as any).data ?? res;

    editForm.value.klasifikasi = data.klasifikasi || "";
    editForm.value.klasifikasi_text = data.klasifikasi_text || "";
    editForm.value.deskripsi = data.deskripsi || "";
  } catch (e) {
    console.error("Gagal ambil data edit klasifikasi:", e);
    alert("Gagal memuat data edit");
    showEditModal.value = false;
  }
};

const submitEditKlasifikasi = async () => {
  if (!editId.value) return;
  if (!validateEdit()) return;

  try {
    savingEdit.value = true;

    await updateKlasifikasi(editId.value, {
      company: "10000",
      klasifikasi: editForm.value.klasifikasi,
      klasifikasi_text: editForm.value.klasifikasi_text,
      deskripsi: editForm.value.deskripsi || null,
    });

    showEditModal.value = false;
    editId.value = null;

    await fetchKlasifikasi();

    showToast({
      title: "Berhasil",
      message: "Data klasifikasi berhasil diperbarui",
      color: "success",
      icon: "i-lucide-check-circle",
    });
  } catch (e) {
    console.error("Gagal update klasifikasi:", e);

    showToast({
      title: "Gagal",
      message: "Data klasifikasi gagal diperbarui",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    savingEdit.value = false;
  }
};

//delete
const showDeletePopup = ref(false);
const deleting = ref(false);
const deleteTarget = ref<Klasifikasi | null>(null);

const onDelete = (row: Klasifikasi) => {
  deleteTarget.value = row;
  showDeletePopup.value = true;
};

const confirmDelete = async () => {
  if (!deleteTarget.value) return;

  try {
    deleting.value = true;

    await deleteKlasifikasi(deleteTarget.value.id);

    showDeletePopup.value = false;

    showToast({
      title: "Berhasil",
      message: "Data klasifikasi berhasil dihapus",
      color: "error",
      icon: "i-lucide-check-circle",
    });

    deleteTarget.value = null;
    await fetchKlasifikasi();
  } catch (e) {
    console.error("Gagal menghapus klasifikasi:", e);

    showToast({
      title: "Gagal",
      message: "Data klasifikasi gagal dihapus",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    deleting.value = false;
  }
};

const cancelDelete = () => {
  showDeletePopup.value = false;
  deleteTarget.value = null;
};

const deleteMessage = computed(() => {
  if (!deleteTarget.value) return "";
  return `Yakin ingin menghapus klasifikasi "${deleteTarget.value.klasifikasi_text}"? Tindakan ini tidak dapat dibatalkan.`;
});

// pagination
const currentPage = ref(1);
const perPage = ref(10);

const totalItems = computed(() => klasifikasiList.value.length);

const totalPages = computed(() => Math.ceil(totalItems.value / perPage.value));

const paginatedKlasifikasi = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return klasifikasiList.value.slice(start, start + perPage.value);
});

const paginationPages = computed(() => {
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);

  let start = Math.max(1, currentPage.value - half);
  let end = Math.min(totalPages.value, start + windowSize - 1);

  if (end - start < windowSize - 1) {
    start = Math.max(1, end - windowSize + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

watch(klasifikasiList, () => {
  currentPage.value = 1;
});

//export
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const onExport = () => {
  if (!klasifikasiList.value.length) {
    showToast({
      title: "Tidak ada data",
      message: "Data kosong, tidak ada yang bisa diexport",
      color: "warning",
      icon: "i-lucide-alert-triangle",
    });
    return;
  }

  const excelData = klasifikasiList.value.map((item, index) => ({
    No: index + 1,
    "Kode Klasifikasi": item.klasifikasi,
    "Nama Klasifikasi": item.klasifikasi_text,
    Deskripsi: item.deskripsi ?? "-",
    Status: item.active === 1 ? "Aktif" : "Non Aktif",
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 35 },
    { wch: 40 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Klasifikasi");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName = `master_klasifikasi_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  saveAs(blob, fileName);

  showToast({
    title: "Export berhasil",
    message: "File Excel klasifikasi berhasil dibuat",
    color: "success",
    icon: "i-lucide-file-down",
  });
};
</script>
