<template>
  <div class="space-y-6 min-h-screen bg-gray-50 p-6">
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Verifikasi Dokumen Digsig
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <button
        @click="openAddModal"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        Tambah Dokumen
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm w-full">
      <!-- TOP ACTION BAR -->
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 pt-3 mb-4 pr-3"
      >
        <!-- STATUS FILTER -->
        <div class="flex items-center gap-2 px-4 py-2">
          <span class="text-xs text-gray-600">Status</span>
          <select
            v-model="statusFilter"
            @change="handleFilterChange"
            class="border text-xs border-gray-300 bg-white rounded-md px-2 py-1"
          >
            <option value="">Semua</option>
            <option value="draft">Draft</option>
            <option value="on_progress">On Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <!-- SEARCH -->
        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            @input="handleSearch"
            placeholder="Cari..."
            class="w-full bg-gray-50 border border-gray-200 text-xs pl-9 pr-3 py-1.5 rounded-lg"
          />
        </div>
      </div>

      <!-- LOADING (SHIMMER) -->
      <div v-if="loading" class="space-y-3 p-4">
        <div
          v-for="i in 5"
          :key="i"
          class="w-full h-10 bg-gray-200 animate-pulse rounded-md"
        ></div>
      </div>

      <!-- EMPTY -->
      <div
        v-else-if="documents.length === 0"
        class="flex flex-col items-center justify-center py-20 text-gray-500"
      >
        <p class="text-sm font-medium">Data tidak ditemukan</p>
      </div>

      <!-- TABLE -->
      <div v-else class="overflow-x-auto">
        <table class="w-full bg-white text-sm">
          <thead class="bg-primary text-white text-[15px]">
            <tr>
              <th
                class="px-4 py-3 text-left cursor-pointer hover:bg-primary-700"
                @click="sortBy('tanggalDokumen')"
              >
                <div class="flex items-center gap-2">
                  Tanggal Dibuat
                  <span v-if="sortKey === 'tanggalDokumen'" class="text-xs">
                    {{ sortOrder === "asc" ? "↑" : "↓" }}
                  </span>
                </div>
              </th>
              <th
                class="px-4 py-3 text-left cursor-pointer hover:bg-primary-700"
                @click="sortBy('nomorDokumen')"
              >
                <div class="flex items-center gap-2">
                  No Dokumen / Perihal
                  <span v-if="sortKey === 'nomorDokumen'" class="text-xs">
                    {{ sortOrder === "asc" ? "↑" : "↓" }}
                  </span>
                </div>
              </th>
              <th class="px-4 py-3 text-center">Penandatangan</th>
              <th class="px-4 py-3 text-center">Dokumen</th>
              <th
                class="px-4 py-3 text-center cursor-pointer hover:bg-primary-700"
                @click="sortBy('status')"
              >
                <div class="flex items-center justify-center gap-2">
                  Status
                  <span v-if="sortKey === 'status'" class="text-xs">
                    {{ sortOrder === "asc" ? "↑" : "↓" }}
                  </span>
                </div>
              </th>
              <th class="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="doc in documents"
              :key="doc.id"
              class="border-b border-gray-100 hover:bg-gray-50"
            >
              <td class="p-4">{{ formatDate(doc.tanggalDokumen) }}</td>
              <td class="p-4">
                <div class="font-medium">{{ doc.nomorDokumen }}</div>
                <div class="text-gray-500 text-xs">{{ doc.perihal }}</div>
              </td>
              <td class="p-4 text-center">{{ doc.totalSigners }}</td>
              <td class="p-4 text-center">
                <button
                  @click="viewDocument(doc)"
                  class="flex items-center gap-2 mx-auto bg-blue-50 text-primary px-3 py-1 text-xs font-medium rounded-lg hover:bg-blue-100"
                >
                  <FileCheck class="w-4 h-4" />
                  Lihat
                </button>
              </td>
              <td class="p-4 text-center">
                <span
                  class="px-3 py-1 rounded-lg text-center text-xs font-medium"
                  :class="getStatusClass(doc.status)"
                >
                  {{ getStatusLabel(doc.status) }}
                </span>
              </td>
              <td class="p-4">
                <div class="flex items-center justify-center gap-4">
                  <Eye
                    class="w-4 h-4 text-gray-600 cursor-pointer hover:text-primary"
                    @click="openDetailModal(doc.id)"
                  />
                  <Pencil
                    class="w-4 h-4 text-yellow-500 cursor-pointer hover:text-yellow-700"
                    @click="openEditModal(doc.id)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="meta && meta.totalPages > 1"
        class="flex justify-center items-center gap-2 p-4"
      >
        <button
          @click="goToPage(meta.page - 1)"
          :disabled="meta.page === 1"
          class="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span class="text-sm text-gray-600">
          Page {{ meta.page }} of {{ meta.totalPages }}
        </span>
        <button
          @click="goToPage(meta.page + 1)"
          :disabled="meta.page === meta.totalPages"
          class="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>

    <!-- MODAL ADD/EDIT DOKUMEN -->
    <Teleport to="body">
      <Modal v-model="openAdd" :hideDefaultFooter="true" size="xl">
        <template #title>
          <div class="mt-5 ml-5 mb-3">
            <Heading variant="heading9b" class="font-semibold text-sm">
              {{ isEditMode ? "Edit Dokumen" : "Tambah Dokumen" }}
            </Heading>
          </div>
        </template>

        <div class="flex flex-col px-6 gap-4 mt-1 max-h-[70vh] overflow-y-auto">
          <div>
            <Heading variant="body2m">
              Tanggal Dokumen <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="addForm.tanggal"
              type="date"
              class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
            />
          </div>

          <div>
            <Heading variant="body2m">
              Klasifikasi <span class="text-red-500">*</span>
            </Heading>
            <select
              v-model="addForm.klasifikasi"
              :disabled="loadingKlasifikasi"
              class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
            >
              <option value="">
                {{ loadingKlasifikasi ? "Loading..." : "Pilih Klasifikasi" }}
              </option>
              <option
                v-for="k in klasifikasiList"
                :key="k.id"
                :value="k.klasifikasi"
              >
                {{ k.klasifikasi }} - {{ k.klasifikasi_text }}
              </option>
            </select>
          </div>

          <div>
            <Heading variant="body2m">
              Jenis Naskah <span class="text-red-500">*</span>
            </Heading>
            <select
              v-model="addForm.jenisNaskah"
              :disabled="loadingJenisNaskah"
              class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
            >
              <option value="">
                {{ loadingJenisNaskah ? "Loading..." : "Pilih Jenis Naskah" }}
              </option>
              <option v-for="j in jenisNaskahList" :key="j.id" :value="j.jenis">
                {{ j.jenis }} - {{ j.jenis_text }}
              </option>
            </select>
          </div>

          <div>
            <Heading variant="body2m">
              Nomor Dokumen <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="addForm.nomorDokumen"
              placeholder="Masukkan Nomor Dokumen"
              class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
            />
          </div>

          <div>
            <Heading variant="body2m">
              Perihal <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="addForm.perihal"
              placeholder="Masukkan Perihal Dokumen"
              class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
            />
          </div>

          <!-- File Attachment -->
          <div>
            <Heading variant="body2m" class="mb-2">
              File Attachment <span class="text-red-500">*</span>
            </Heading>
            <div
              class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              @click="triggerFileUpload"
            >
              <div class="flex flex-col items-center gap-2">
                <svg
                  class="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p class="text-sm text-gray-600">Pilih File atau Drag & Drop</p>
                <p class="text-xs text-gray-400">PDF, DOC, DOCX (Max. 10MB)</p>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept=".pdf,.doc,.docx"
                class="hidden"
                @change="handleFileUpload"
              />
            </div>
            <p
              v-if="addForm.fileName"
              class="text-sm text-blue-600 mt-2 flex items-center gap-2"
            >
              <FileCheck class="w-4 h-4" />
              {{ addForm.fileName }}
            </p>
          </div>

          <!-- Visible Sign -->
          <div class="flex items-center justify-between mt-1 mb-2">
            <div>
              <Heading variant="body2m">Visible Sign</Heading>
              <p class="text-xs text-red-500 mt-1">
                *Visible Sign hanya berlaku pada penanda tangan terakhir
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="addForm.visibleSign"
                class="sr-only peer"
              />
              <div
                class="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
              ></div>
            </label>
          </div>

          <!-- Penanda Tangan -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <Heading variant="body2m">Penanda Tangan</Heading>
            </div>
            <div
              v-for="(signer, index) in addForm.signers"
              :key="index"
              class="mb-4 flex gap-3"
            >
              <select
                v-model="signer.positionId"
                :disabled="loadingVerifikator"
                class="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                <option :value="0">
                  {{ loadingVerifikator ? "Loading..." : "Pilih Jabatan" }}
                </option>
                <option
                  v-for="v in verifikatorList"
                  :key="v.positionId"
                  :value="v.positionId"
                >
                  {{ v.jabatan }}
                </option>
              </select>
              <button
                v-if="index === addForm.signers.length - 1"
                type="button"
                @click="addSigner"
                class="flex items-center gap-1 px-3 py-2 text-sm bg-primary hover:bg-primary-700 rounded-lg text-white"
              >
                <Plus class="w-4 h-4" />
                Tambah
              </button>
              <button
                v-if="addForm.signers.length > 1"
                type="button"
                @click="removeSigner(index)"
                class="flex items-center gap-1 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg text-white"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>

        <!-- Footer Buttons - Fixed at bottom -->
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            @click="closeModal"
            class="flex-1 w-full px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition"
          >
            Batal
          </button>
          <button
            @click="saveDokumen"
            :disabled="loading"
            class="flex-1 w-full px-6 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-700 transition disabled:opacity-50"
          >
            {{ loading ? "Menyimpan..." : "Simpan Perubahan" }}
          </button>
        </div>
      </Modal>
    </Teleport>

    <!-- MODAL DETAIL -->
    <Teleport to="body">
      <Modal v-model="openDetail" :hideDefaultFooter="true" size="xl">
        <template #title>
          <Heading
            variant="heading9b"
            class="font-semibold text-sm mb-3 mt-5 ml-5"
          >
            Detail Dokumen
          </Heading>
        </template>

        <div class="px-6 max-h-[70vh] overflow-y-auto">
          <div v-if="loadingDetail" class="text-center py-8">
            <p class="text-gray-500">Loading...</p>
          </div>

          <div
            v-else-if="documentDetail"
            class="grid grid-cols-2 gap-6 text-sm mt-2"
          >
            <div>
              <p class="text-gray-600 mb-1">ID</p>
              <p class="font-medium">{{ documentDetail.id }}</p>
            </div>

            <div>
              <p class="text-gray-600 mb-1">No Dokumen</p>
              <p class="font-medium">{{ documentDetail.nomorDokumen }}</p>
            </div>

            <div>
              <p class="text-gray-600 mb-1">Tanggal</p>
              <p class="font-medium">
                {{ formatDate(documentDetail.tanggalDokumen) }}
              </p>
            </div>

            <div>
              <p class="text-gray-600 mb-1">Jenis</p>
              <p class="font-medium">{{ documentDetail.jenisNaskah }}</p>
            </div>

            <div class="col-span-2">
              <p class="text-gray-600 mb-1">Klasifikasi</p>
              <p class="font-medium">{{ documentDetail.klasifikasiText }}</p>
            </div>

            <div class="col-span-2">
              <p class="text-gray-600 mb-1">Perihal</p>
              <p class="font-medium">{{ documentDetail.perihal }}</p>
            </div>

            <!-- <div class="col-span-2">
              <p class="text-gray-600 mb-1">Status</p>
              <span
                class="px-3 py-1 rounded-lg text-xs font-medium inline-block"
                :class="getStatusClass(documentDetail.status)"
              >
                {{ getStatusLabel(documentDetail.status) }}
              </span>
            </div> -->
          </div>

          <!-- TABLE SIGNERS -->
          <div
            v-if="documentDetail && documentDetail.signers.length > 0"
            class="mt-6 mb-5 border border-gray-200 rounded-xl overflow-hidden"
          >
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-primary text-white">
                  <tr>
                    <th class="p-3 text-left">NO</th>
                    <th class="p-3 text-left">E-NIK</th>
                    <th class="p-3 text-left">NAMA</th>
                    <th class="p-3 text-center">STATUS</th>
                    <th class="p-3 text-center">KETERANGAN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(s, i) in documentDetail.signers"
                    :key="s.id"
                    class="border-b border-gray-100"
                  >
                    <td class="p-3">{{ i + 1 }}</td>
                    <td class="p-3">{{ s.nik || "-" }}</td>
                    <td class="p-3">
                      <div class="font-medium">{{ s.nama || "-" }}</div>
                      <div class="text-xs text-gray-500">{{ s.jabatan }}</div>
                    </td>
                    <td class="p-3 text-center">
                      <span
                        class="px-3 py-1 rounded-lg text-xs font-medium"
                        :class="getSignerStatusClass(s.status)"
                      >
                        {{ getSignerStatusLabel(s.status) }}
                      </span>
                    </td>
                    <td class="p-3 text-center">{{ s.keterangan || "-" }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Plus, Search, Pencil, FileCheck, Eye } from "lucide-vue-next";
import { useDigsig } from "~/composables/useDigsig";

const {
  documents,
  documentDetail,
  meta,
  loading,
  loadingDetail,
  klasifikasiList,
  jenisNaskahList,
  verifikatorList,
  loadingKlasifikasi,
  loadingJenisNaskah,
  loadingVerifikator,
  fetchDocuments,
  fetchDocumentDetail,
  createDocument,
  updateDocument,
  fetchKlasifikasi,
  fetchJenisNaskah,
  fetchVerifikator,
} = useDigsig();

const openDetail = ref(false);
const openAdd = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | null>(null);
const fileInput = ref(null);

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "verifikasi-dokumen", to: "/admin/digsig/verifikasi-dokumen" },
];

const statusFilter = ref("");
const sortKey = ref("");
const sortOrder = ref<"asc" | "desc">("asc");
const search = ref("");
const currentPage = ref(1);
const limit = ref(10);

const addForm = ref({
  tanggal: "",
  klasifikasi: "",
  jenisNaskah: "",
  nomorDokumen: "",
  perihal: "",
  fileName: "",
  file: null as File | null,
  visibleSign: false,
  signers: [{ urutan: 1, positionId: 0 }],
});

onMounted(() => {
  loadDocuments();
  fetchKlasifikasi();
  fetchJenisNaskah();
  fetchVerifikator();
});

const loadDocuments = async () => {
  await fetchDocuments({
    page: currentPage.value,
    limit: limit.value,
    search: search.value,
    status: statusFilter.value,
    sortBy: sortKey.value,
  });
};

const handleSearch = () => {
  currentPage.value = 1;
  loadDocuments();
};

const handleFilterChange = () => {
  currentPage.value = 1;
  loadDocuments();
};

const sortBy = (key: string) => {
  if (sortKey.value === key) {
    if (sortOrder.value === "asc") {
      sortOrder.value = "desc";
    } else if (sortOrder.value === "desc") {
      sortKey.value = "";
      sortOrder.value = "asc";
    } else {
      sortOrder.value = "asc";
    }
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
  loadDocuments();
};

const goToPage = (page: number) => {
  currentPage.value = page;
  loadDocuments();
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusClass = (status: string) => {
  const statusMap = {
    draft: "bg-gray-100 text-gray-600",
    on_progress: "bg-blue-100 text-blue-600",
    completed: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
  };
  return statusMap[status] || "bg-gray-100 text-gray-600";
};

const getStatusLabel = (status: string) => {
  const statusMap = {
    draft: "Draft",
    on_progress: "On Progress",
    completed: "Completed",
    rejected: "Rejected",
  };
  return statusMap[status] || status;
};

const getSignerStatusClass = (status: string) => {
  const statusMap = {
    waiting: "bg-yellow-100 text-yellow-600",
    pending: "bg-blue-100 text-blue-600",
    signed: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
  };
  return statusMap[status] || "bg-gray-100 text-gray-600";
};

const getSignerStatusLabel = (status: string) => {
  const statusMap = {
    waiting: "Waiting",
    pending: "Pending",
    signed: "Sudah TTD",
    rejected: "Rejected",
  };
  return statusMap[status] || status;
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    addForm.value.fileName = file.name;
    addForm.value.file = file;
  }
};

const addSigner = () => {
  addForm.value.signers.push({
    urutan: addForm.value.signers.length + 1,
    positionId: 0,
  });
};

const removeSigner = (index: number) => {
  addForm.value.signers.splice(index, 1);
  addForm.value.signers.forEach((signer, idx) => {
    signer.urutan = idx + 1;
  });
};

const openAddModal = () => {
  isEditMode.value = false;
  editingId.value = null;
  resetForm();
  openAdd.value = true;
};

const openEditModal = async (id: string) => {
  isEditMode.value = true;
  editingId.value = id;

  const doc = await fetchDocumentDetail(id);
  if (doc) {
    // Get klasifikasi text for display
    const selectedKlasifikasi = klasifikasiList.value.find(
      (k) => k.klasifikasi === doc.klasifikasi,
    );

    addForm.value = {
      tanggal: doc.tanggalDokumen.split("T")[0],
      klasifikasi: doc.klasifikasi,
      jenisNaskah: doc.jenisNaskah,
      nomorDokumen: doc.nomorDokumen,
      perihal: doc.perihal,
      fileName: doc.fileName || "",
      file: null,
      visibleSign: Boolean(doc.visibleSign),
      signers:
        doc.signers.length > 0
          ? doc.signers.map((s) => ({
              urutan: s.urutan,
              positionId: Number(s.positionId) || 0,
            }))
          : [{ urutan: 1, positionId: 0 }],
    };
  }

  openAdd.value = true;
};

const openDetailModal = async (id: string) => {
  await fetchDocumentDetail(id);
  openDetail.value = true;
};

const closeModal = () => {
  openAdd.value = false;
  resetForm();
};

const resetForm = () => {
  addForm.value = {
    tanggal: "",
    klasifikasi: "",
    jenisNaskah: "",
    nomorDokumen: "",
    perihal: "",
    fileName: "",
    file: null,
    visibleSign: false,
    signers: [{ urutan: 1, positionId: 0 }],
  };
  if (fileInput.value) {
    fileInput.value.value = "";
  }
};

const viewDocument = (doc: any) => {
  if (doc.filePreviewUrl) {
    window.open(doc.filePreviewUrl, "_blank");
  }
};

const saveDokumen = async () => {
  try {
    // Validation
    if (
      !addForm.value.tanggal ||
      !addForm.value.klasifikasi ||
      !addForm.value.jenisNaskah ||
      !addForm.value.nomorDokumen ||
      !addForm.value.perihal
    ) {
      alert("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    if (!isEditMode.value && !addForm.value.file) {
      alert("Mohon upload file dokumen");
      return;
    }

    // Validate signers
    const validSigners = addForm.value.signers.filter((s) => s.positionId > 0);
    if (validSigners.length === 0) {
      alert("Mohon pilih minimal satu penandatangan");
      return;
    }

    const payload: any = {
      tanggalDokumen: addForm.value.tanggal,
      klasifikasi: addForm.value.klasifikasi,
      jenisNaskah: addForm.value.jenisNaskah,
      nomorDokumen: addForm.value.nomorDokumen,
      perihal: addForm.value.perihal,
      visibleSign: addForm.value.visibleSign,
      signers: validSigners,
    };

    // Only add file if it's a new file
    if (addForm.value.file) {
      payload.file = addForm.value.file;
    }

    if (isEditMode.value && editingId.value) {
      await updateDocument(editingId.value, payload);
    } else {
      payload.file = addForm.value.file;
      await createDocument(payload);
    }

    closeModal();
    await loadDocuments();

    alert(
      isEditMode.value
        ? "Dokumen berhasil diupdate"
        : "Dokumen berhasil ditambahkan",
    );
  } catch (error: any) {
    console.error("Error saving document:", error);
    alert(error?.response?.data?.message || "Gagal menyimpan dokumen");
  }
};
</script>
