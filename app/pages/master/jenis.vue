<template>
  <div class="">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <div>
        <PageHeader title="Jenis" :items="items" />
      </div>

      <button
        @click="openAddModal"
        class="flex items-center gap-2 bg-primary text-white space-y-6 h-8 px-6 rounded-lg hover:bg-primary-800 text-xs"
      >
        <Plus class="w-4 h-4" />
        Tambah
      </button>
    </div>

    <!-- Card Table -->
    <div class="rounded-lg border border-gray-200 shadow-sm bg-white mt-5">
      <!-- Toolbar (TIDAK ikut scroll) -->
      <div class="flex flex-wrap gap-4 items-center p-3 justify-between">
        <button
          @click="fetchJenis()"
          class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          title="Refresh"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <button
          class="flex items-center gap-2 bg-primary text-white h-8 px-6 rounded-lg hover:bg-primary-500 text-xs"
          @click="onExport"
        >
          <FileDown class="w-4 h-4" />
          Export
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse text-sm">
          <thead class="text-left bg-primary-400 text-white">
            <tr>
              <th
                class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold whitespace-nowrap"
              >
                Kode Jenis
              </th>
              <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">
                Nama Jenis
              </th>
              <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">
                Perihal
              </th>
              <th
                class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold"
              ></th>
              <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">
                Format Penomoran
              </th>
              <th
                class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold text-center"
              >
                Aksi
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- Loading -->
            <tr v-if="loading">
              <td colspan="6" class="px-4 py-6 text-center text-gray-500">
                Memuat data...
              </td>
            </tr>

            <!-- Empty -->
            <tr v-else-if="filteredJenis.length === 0">
              <td colspan="6" class="px-4 py-10 text-center text-gray-500">
                Data tidak ditemukan
              </td>
            </tr>

            <!-- Rows -->
            <tr
              v-else
              v-for="row in paginatedJenis"
              :key="row.id"
              class="hover:bg-blue-50 transition-colors border-b border-b-gray-200 capitalize"
            >
              <!-- KODE -->
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs whitespace-nowrap"
                >
                  {{ row.jenis }}
                </span>
              </td>

              <!-- NAMA -->
              <td class="px-4 py-3 font-medium text-gray-900 normal-case">
                {{ row.jenis_text }}
              </td>

              <!-- PERIHAL -->
              <td class="px-4 py-3 text-gray-900 normal-case">
                <span class="text-sm">
                  {{ row.jenis_text }}
                </span>
              </td>

              <!-- Download -->
              <td class="px-4 py-3">
                <button
                  v-if="row.file_url"
                  @click="downloadFile(row.file_url)"
                  class="text-green-600 hover:text-green-700"
                  title="Download format"
                >
                  <Download class="w-4 h-4" />
                </button>
                <span v-else class="text-gray-300">-</span>
              </td>

              <!-- FORMAT -->
              <td
                class="px-4 py-3 font-mono text-gray-700 normal-case whitespace-nowrap"
              >
                {{ row.format_penomoran }}
              </td>

              <!-- AKSI -->
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-5">
                  <button
                    class="text-green-600 hover:text-green-700"
                    title="Lihat"
                    @click="onView(row)"
                  >
                    <Eye class="w-4 h-4" />
                  </button>

                  <button
                    class="text-blue-600 hover:text-blue-700"
                    title="Edit"
                    @click="onEdit(row)"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>

                  <button
                    class="text-red-600 hover:text-red-700"
                    title="Hapus"
                    @click="onDelete(row)"
                    :disabled="deletingId === row.id"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- MODAL DETAIL JENIS -->
        <Teleport to="body">
          <AddUsulan
            v-model="openAdd"
            @submit="handleSubmitFromModal"
            @preview="handlePreview"
        /></Teleport>
        <Teleport to="body">
          <div
            v-if="showDetailModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <div
              class="relative bg-white rounded-2xl p-1 w-[630px] max-w-[90vw] max-h-[690px]"
            >
              <!-- HEADER -->
              <div
                class="flex justify-between items-start mb-4 border-b border-gray-300"
              >
                <div class="mt-5 ml-5">
                  <h2 class="font-semibold text-sm text-gray-900">
                    Detail Jenis
                  </h2>
                </div>

                <button
                  @click="showDetailModal = false"
                  class="mt-5 mr-5 text-gray-500 hover:text-gray-800"
                  aria-label="Close"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <!-- BODY -->
              <div
                class="flex flex-col gap-5 ml-5 mr-5 max-h-[67vh] overflow-y-auto"
              >
                <div
                  v-if="detailLoading"
                  class="py-10 text-center text-gray-500 text-sm"
                >
                  Memuat detail...
                </div>

                <div
                  v-else-if="!detailJenis"
                  class="py-10 text-center text-gray-500 text-sm"
                >
                  Detail tidak ditemukan
                </div>

                <div v-else class="space-y-6 pb-2">
                  <!-- KODE JENIS -->
                  <div class="flex gap-3 items-start">
                    <Hash class="w-5 h-5 text-blue-600 mt-1" />
                    <div class="flex-1">
                      <p class="text-sm text-gray-600">Kode Jenis</p>
                      <div class="mt-2">
                        <span
                          class="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-blue-50 text-blue-700 font-semibold text-sm"
                        >
                          {{ detailJenis.jenis }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- NAMA JENIS -->
                  <div class="flex gap-3 items-start">
                    <FileText class="w-5 h-5 text-green-600 mt-1" />
                    <div class="flex-1">
                      <p class="text-sm text-gray-600">Nama Jenis</p>
                      <p class="mt-2 text-sm font-medium text-black">
                        {{ detailJenis.jenis_text }}
                      </p>
                    </div>
                  </div>

                  <!-- PERIHAL -->
                  <div class="flex gap-3 items-start">
                    <ChartNoAxesGantt class="w-5 h-5 text-orange-500 mt-1" />
                    <div class="flex-1">
                      <p class="text-sm text-gray-600">Perihal</p>
                      <p
                        class="mt-2 text-sm font-medium text-gray-900 uppercase"
                      >
                        {{ detailJenis.file_text || detailJenis.jenis_text }}
                      </p>
                    </div>
                  </div>

                  <!-- FORMAT PENOMORAN -->
                  <div class="flex gap-3 items-start">
                    <Hash class="w-5 h-5 text-purple-600 mt-1" />
                    <div class="flex-1">
                      <p class="text-sm text-gray-600">Format Penomoran</p>
                      <p
                        class="mt-2 text-sm font-mono text-gray-900 whitespace-pre-line"
                      >
                        {{ detailJenis.format_penomoran }}
                      </p>
                    </div>
                  </div>

                  <!-- FILE TEMPLATE -->
                  <div class="flex gap-3 items-start">
                    <FileText class="w-5 h-5 text-pink-500 mt-1" />
                    <div class="flex-1">
                      <p class="text-sm text-gray-600">File Template</p>

                      <div
                        class="mt-3 flex items-center justify-between gap-3 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
                      >
                        <div class="flex items-center gap-3 min-w-0">
                          <FileText
                            class="w-5 h-5 text-gray-500 flex-shrink-0"
                          />
                          <p class="text-sm text-gray-800 truncate">
                            {{ getTemplateName(detailJenis) }}
                          </p>
                        </div>

                        <button
                          v-if="detailJenis.file_url"
                          @click="downloadFile(detailJenis.file_url)"
                          class="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white h-9 px-5 rounded-xl text-sm font-medium"
                        >
                          <Download class="w-4 h-4" />
                          Unduh
                        </button>

                        <span v-else class="text-xs text-gray-400"
                          >Tidak ada file</span
                        >
                      </div>
                    </div>
                  </div>

                  <!-- TANGGAL DIBUAT -->
                  <div class="flex gap-3 items-start">
                    <Calendar class="w-5 h-5 text-cyan-600 mt-1" />
                    <div class="flex-1">
                      <p class="text-sm text-gray-600">Tanggal Dibuat</p>
                      <p class="mt-2 text-sm text-gray-900">
                        {{
                          detailJenis.created_at ? detailJenis.created_at : "-"
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- FOOTER (custom) -->
              <div class="border-t border-gray-300 mt-7 mb-1 gap-3 px-5 py-2">
                <button
                  @click="showDetailModal = false"
                  class="w-full h-12 rounded-xl bg-primary-400 hover:bg-primary-500 text-white font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </Teleport>

        <!-- MODAL TAMBAH JENIS -->
        <Teleport to="body">
          <Modal v-model="showAddModal" size="xl" @save="submitAddJenis">
            <template #title>
              <Heading
                variant="heading9b"
                class="font-semibold text-sm mb-3 mt-5 ml-5"
              >
                Tambah Jenis
              </Heading>
            </template>

            <div class="space-y-5">
              <!-- Kode Jenis -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700">
                  Kode Jenis <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="addForm.jenis"
                  type="text"
                  placeholder="PER"
                  class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p v-if="addErrors.jenis" class="text-xs text-red-500">
                  {{ addErrors.jenis }}
                </p>
              </div>

              <!-- Nama Jenis -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700">
                  Nama Jenis <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="addForm.jenis_text"
                  type="text"
                  placeholder="Peraturan Direksi"
                  class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p v-if="addErrors.jenis_text" class="text-xs text-red-500">
                  {{ addErrors.jenis_text }}
                </p>
              </div>

              <!-- Perihal -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700">
                  Perihal <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="addForm.file_text"
                  type="text"
                  placeholder="PERATURAN DIREKSI"
                  class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <p v-if="addErrors.file_text" class="text-xs text-red-500">
                  {{ addErrors.file_text }}
                </p>
              </div>

              <!-- Format Penomoran -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700">
                  Format Penomoran <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="addForm.format_penomoran"
                  type="text"
                  placeholder="{TIPE}.{NO_URUT}/{INSTANSI}/{BULAN}/{TAHUN}"
                  class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                />
                <p
                  v-if="addErrors.format_penomoran"
                  class="text-xs text-red-500"
                >
                  {{ addErrors.format_penomoran }}
                </p>
              </div>

              <!-- Upload File Template -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700">
                  Upload File Template <span class="text-red-500">*</span>
                </label>

                <label
                  class="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-3 text-sm cursor-pointer hover:bg-gray-50"
                >
                  <span class="text-gray-600 truncate">
                    {{
                      editForm.file
                        ? editForm.file.name
                        : "Wajib upload file baru"
                    }}
                  </span>

                  <input
                    type="file"
                    class="hidden"
                    accept=".doc,.docx,.pdf"
                    @change="onPickFileEdit"
                  />
                </label>

                <p v-if="editErrors.file" class="text-xs text-red-500">
                  {{ editErrors.file }}
                </p>

                <p class="text-xs text-gray-500">Format: .doc, .docx, .pdf</p>
              </div>
            </div>
          </Modal>
        </Teleport>

        <Teleport to="body">
          <Modal v-model="showEditModal" size="xl" @save="submitEditJenis">
            <template #title>
              <Heading
                variant="heading9b"
                class="font-semibold text-sm mb-3 mt-5 ml-5"
              >
                Edit Jenis
              </Heading>
            </template>

            <div class="space-y-5">
              <!-- Kode Jenis -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700">
                  Kode Jenis <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.jenis"
                  type="text"
                  placeholder="PER"
                  class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <!-- Nama Jenis -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700">
                  Nama Jenis <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.jenis_text"
                  type="text"
                  placeholder="Peraturan Direksi"
                  class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <!-- Perihal -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700">
                  Perihal <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.file_text"
                  type="text"
                  placeholder="PERATURAN DIREKSI"
                  class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <!-- Format Penomoran -->
              <div class="flex flex-col gap-2">
                <label class="text-sm text-gray-700">
                  Format Penomoran <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.format_penomoran"
                  type="text"
                  placeholder="{TIPE}.{NO_URUT}/{INSTANSI}/{BULAN}/{TAHUN}"
                  class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                />
              </div>

              <!-- Upload File Template -->
              <label class="text-sm text-gray-700">
                Upload File Template <span class="text-red-500">*</span>
              </label>

              <label
                class="flex items-center gap-3 border border-gray-300 rounded-lg px-4 py-3 text-sm cursor-pointer hover:bg-gray-50"
              >
                <span class="text-gray-600 truncate">
                  {{
                    editForm.file
                      ? editForm.file.name
                      : editForm.file_name
                        ? editForm.file_name
                        : "Upload file"
                  }}
                </span>

                <input
                  type="file"
                  class="hidden"
                  accept=".doc,.docx,.pdf"
                  @change="onPickFileEdit"
                />
              </label>

              <p v-if="editErrors.file" class="text-xs text-red-500">
                {{ editErrors.file }}
              </p>
            </div>
          </Modal>
        </Teleport>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="totalItems > 0"
        class="flex items-center justify-between px-4 py-4"
      >
        <div class="text-xs text-gray-600">
          Menampilkan {{ paginatedJenis.length }} dari {{ totalItems }} data
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
    <ConfirmDialog
      v-model="showDeleteModal"
      type="danger"
      title="Hapus Data Jenis"
      :message="
        deleteTarget
          ? `Apakah kamu yakin ingin menghapus jenis '${deleteTarget.jenis}'?`
          : ''
      "
      confirm-text="Hapus"
      cancel-text="Batal"
      :is-loading="deleteLoading"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  RotateCcw,
  FileDown,
  FileText,
  Hash,
  ChartNoAxesGantt,
  Calendar,
  Upload,
  Save,
} from "lucide-vue-next";

import type { BreadcrumbItem } from "~/types/breadcrumb";
import { useJenis, type JenisItem } from "~/composables/useJenis";
import Modal from "@/components/Modal.vue";
import ConfirmDialog from "@/components/ConfirmPopup.vue";

const items = [
  { label: "Home", to: "/dashboard" },
  { label: "Jenis", to: "/master/jenis" },
] satisfies BreadcrumbItem[];

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

const { getJenisList, getJenisDetail, deleteJenis, createJenis, updateJenis } =
  useJenis();

const loading = ref(false);
const deletingId = ref<string | null>(null);

const search = ref("");
const jenisList = ref<JenisItem[]>([]);

const fetchJenis = async () => {
  try {
    loading.value = true;
    const res = await getJenisList();
    jenisList.value = res.data || [];
    currentPage.value = 1;
  } catch (e) {
    console.error("Gagal ambil data jenis:", e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchJenis);

const filteredJenis = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return jenisList.value;

  return jenisList.value.filter((x) => {
    return (
      x.jenis.toLowerCase().includes(q) ||
      x.jenis_text.toLowerCase().includes(q) ||
      x.format_penomoran.toLowerCase().includes(q)
    );
  });
});

const router = useRouter();

const getFileName = (url: string) => {
  try {
    const cleanUrl = url.split("?")[0]; // hapus query panjang
    const parts = cleanUrl.split("/");
    return parts[parts.length - 1] || "file";
  } catch {
    return "file";
  }
};

const downloadFile = (url: string) => {
  window.open(url, "_blank");
};

const onView = async (row: JenisItem) => {
  try {
    showDetailModal.value = true;
    detailLoading.value = true;
    detailJenis.value = null;

    const res = await getJenisDetail(row.id);
    detailJenis.value = res.data;
  } catch (e) {
    console.error("Gagal ambil detail jenis:", e);
  } finally {
    detailLoading.value = false;
  }
};

//delete
const showDeleteModal = ref(false);
const deleteTarget = ref<JenisItem | null>(null);
const deleteLoading = ref(false);

const onDelete = (row: JenisItem) => {
  deleteTarget.value = row;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!deleteTarget.value) return;

  try {
    deleteLoading.value = true;

    await deleteJenis(deleteTarget.value.id);

    jenisList.value = jenisList.value.filter(
      (x) => x.id !== deleteTarget.value!.id,
    );

    showDeleteModal.value = false;

    showToast({
      title: "Berhasil",
      message: `Data jenis berhasil dihapus`,
      color: "error",
      icon: "i-lucide-check-circle",
    });

    deleteTarget.value = null;
  } catch (e) {
    console.error("Gagal hapus jenis:", e);

    showToast({
      title: "Gagal",
      message: "Data jenis gagal dihapus ",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    deleteLoading.value = false;
  }
};

//create
const showAddModal = ref(false);
const savingAdd = ref(false);

const addForm = ref({
  jenis: "",
  jenis_text: "",
  file_text: "",
  format_penomoran: "",
  file: null as File | null,
});

const openAddModal = () => {
  addErrors.value = {};
  addForm.value = {
    jenis: "",
    jenis_text: "",
    file_text: "",
    format_penomoran: "",
    file: null,
  };
  showAddModal.value = true;
};

const validateAdd = () => {
  const err: Record<string, string> = {};

  if (!addForm.value.jenis.trim()) err.jenis = "Kode Jenis wajib diisi";
  if (!addForm.value.jenis_text.trim())
    err.jenis_text = "Nama Jenis wajib diisi";
  if (!addForm.value.file_text.trim()) err.file_text = "Perihal wajib diisi";
  if (!addForm.value.format_penomoran.trim())
    err.format_penomoran = "Format Penomoran wajib diisi";

  addErrors.value = err;
  return Object.keys(err).length === 0;
};

const submitAddJenis = async () => {
  if (!validateAdd()) return;

  try {
    savingAdd.value = true;

    await createJenis({
      jenis: addForm.value.jenis,
      jenis_text: addForm.value.jenis_text,
      file_text: addForm.value.file_text,
      format_penomoran: addForm.value.format_penomoran,
      file: addForm.value.file,
    });

    showAddModal.value = false;
    await fetchJenis();

    showToast({
      title: "Berhasil",
      message: "Data jenis berhasil ditambahkan",
      color: "success",
      icon: "i-lucide-check-circle",
    });
  } catch (e) {
    console.error("Gagal tambah jenis:", e);

    showToast({
      title: "Gagal",
      message: "Data jenis gagal ditambahkan",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    savingAdd.value = false;
  }
};

const addErrors = ref<Record<string, string>>({});

//edit
const showEditModal = ref(false);
const savingEdit = ref(false);
const editId = ref<string | null>(null);

const editForm = ref({
  jenis: "",
  jenis_text: "",
  file_text: "",
  format_penomoran: "",
  file: null as File | null,

  file_name: "" as string,
  file_url: "" as string,
});

const onEdit = async (row: JenisItem) => {
  try {
    showEditModal.value = true;
    editId.value = row.id;
    savingEdit.value = false;
    editErrors.value = {};

    const res = await getJenisDetail(row.id);
    const data = res.data;

    editForm.value.jenis = data.jenis;
    editForm.value.jenis_text = data.jenis_text;
    editForm.value.file_text = data.file_text || "";
    editForm.value.format_penomoran = data.format_penomoran;

    editForm.value.file = null;

    editForm.value.file_name = data.file_name || "";
    editForm.value.file_url = data.file_url || "";
  } catch (e) {
    console.error("Gagal ambil data edit:", e);
    alert("Gagal memuat data");
    showEditModal.value = false;
  }
};

const submitEditJenis = async () => {
  if (!editId.value) return;

  if (!validateEdit()) return;

  try {
    savingEdit.value = true;

    await updateJenis(editId.value, {
      jenis: editForm.value.jenis,
      jenis_text: editForm.value.jenis_text,
      file_text: editForm.value.file_text,
      format_penomoran: editForm.value.format_penomoran,
      file: editForm.value.file,
    });

    showEditModal.value = false;
    await fetchJenis();

    showToast({
      title: "Berhasil",
      message: "Data jenis berhasil diperbarui",
      color: "success",
      icon: "i-lucide-check-circle",
    });
  } catch (e) {
    console.error("Gagal update jenis:", e);

    showToast({
      title: "Gagal",
      message: "Data jenis gagal diperbarui",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    savingEdit.value = false;
  }
};

const onPickFileEdit = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0] ?? null;
  editForm.value.file = file;
};

const validateEdit = () => {
  const err: Record<string, string> = {};

  if (!editForm.value.jenis.trim()) err.jenis = "Kode Jenis wajib diisi";
  if (!editForm.value.jenis_text.trim())
    err.jenis_text = "Nama Jenis wajib diisi";
  if (!editForm.value.file_text.trim()) err.file_text = "Perihal wajib diisi";
  if (!editForm.value.format_penomoran.trim())
    err.format_penomoran = "Format Penomoran wajib diisi";

  const hasExistingFile = !!editForm.value.file_url;
  const hasNewFile = !!editForm.value.file;

  if (!hasExistingFile && !hasNewFile) {
    err.file = "File template wajib diupload saat edit";
  }

  editErrors.value = err;
  return Object.keys(err).length === 0;
};

const editErrors = ref<Record<string, string>>({});

//detail
const showDetailModal = ref(false);
const detailLoading = ref(false);
const detailJenis = ref<any>(null);

const getTemplateName = (data: any) => {
  if (data?.file_name) return data.file_name;
  if (data?.file_url) return getFileName(data.file_url);
  return "-";
};

//pagination
const currentPage = ref(1);
const perPage = ref(10);

const totalItems = computed(() => filteredJenis.value.length);

const totalPages = computed(() => Math.ceil(totalItems.value / perPage.value));

const paginatedJenis = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredJenis.value.slice(start, start + perPage.value);
});

// window page number (mirip contoh kamu)
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

watch(search, () => {
  currentPage.value = 1;
});

//export
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const onExport = () => {
  const data = filteredJenis.value.map((row, index) => ({
    No: index + 1,
    "Kode Jenis": row.jenis,
    "Nama Jenis": row.jenis_text,
    Perihal: row.file_text || row.jenis_text,
    "Format Penomoran": row.format_penomoran,
    "Tanggal Dibuat": row.created_at || "-",
  }));

  if (data.length === 0) {
    showToast({
      title: "Tidak ada data",
      message: "Tidak ada data untuk diexport.",
      color: "warning",
      icon: "i-lucide-alert-triangle",
    });
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  worksheet["!cols"] = [
    { wch: 5 },
    { wch: 15 },
    { wch: 30 },
    { wch: 30 },
    { wch: 40 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Jenis");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const date = new Date().toISOString().slice(0, 10);
  saveAs(blob, `master_jenis_${date}.xlsx`);

  showToast({
    title: "Export berhasil",
    message: `Data jenis berhasil diexport`,
    color: "success",
    icon: "i-lucide-file-down",
  });
};
</script>
