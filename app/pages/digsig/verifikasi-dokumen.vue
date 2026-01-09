<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Verifikasi Dokumen Digsig
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- KIRI: TOMBOL TAMBAH -->
      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-800 text-sm"
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
            class="border text-xs border-gray-300 bg-white rounded-md px-2 py-1"
          >
            <option value="">Semua</option>
            <option value="Success">Success</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <!-- SEARCH -->
        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
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
        v-else-if="filteredRows.length === 0"
        class="flex flex-col items-center justify-center py-20 text-gray-500"
      >
        <p class="text-sm font-medium">Data tidak ditemukan</p>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="w-full bg-white text-sm">
          <thead class="bg-primary text-white text-[15px]">
            <tr>
              <th
                class="px-4 py-3 text-left cursor-pointer"
                @click="sortBy('date')"
              >
                Tanggal Dibuat
              </th>

              <th
                class="px-4 py-3 text-left cursor-pointer"
                @click="sortBy('no')"
              >
                No Dokumen / Perihal
              </th>

              <th class="px-4 py-3 text-center">Penandatangan</th>

              <th class="px-4 py-3 text-center">Dokumen</th>

              <th
                class="px-4 py-3 text-center cursor-pointer"
                @click="sortBy('status')"
              >
                Status
              </th>

              <th class="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(row, i) in filteredRows" :key="i">
              <td class="p-4">{{ row.date }}</td>

              <td class="p-4">
                <div class="font-medium">{{ row.no }}</div>
                <div class="text-gray-500 text-xs">{{ row.desc }}</div>
              </td>

              <td class="p-4 text-center">{{ row.count }}</td>

              <td class="p-4 text-center">
                <button
                  class="flex items-center gap-2 mx-auto bg-blue-50 text-primary px-3 py-1 text-xs font-medium rounded-lg"
                >
                  <FileCheck class="w-4 h-4" />
                  Lihat
                </button>
              </td>

              <td class="p-4 text-center">
                <span
                  class="px-3 py-1 rounded-lg text-xs"
                  :class="
                    row.status === 'Success'
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  "
                >
                  {{ row.status }}
                </span>
              </td>

              <td class="p-4">
                <div class="flex items-center justify-center gap-4">
                  <Eye
                    class="w-4 h-4 text-gray-600 cursor-pointer hover:text-gray-800"
                    @click="openDetailModal(row)"
                  />
                  <button
                    @click="openEdit(row)"
                    class="text-yellow-500 hover:text-yellow-600"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ========================= -->
      <!-- MODAL EDIT -->
      <!-- ========================= -->

      <Teleport to="body">
        <Modal v-model="showEditModal" :hideDefaultFooter="true" size="xl">
          <template #title>
            <div class="mt-5 ml-5 mb-3">
              <Heading variant="heading9b" class="font-semibold text-sm">
                Tambah Dokumen
              </Heading>
            </div>
          </template>

          <div class="flex flex-col px-1 gap-2 mt-1">
            <Heading variant="body2m"
              >Tanggal Dokumen <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.long_text"
              placeholder="DD/MM/YY"
              class="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-2"
            />

            <Heading variant="body2m"
              >Klasifikasi <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.long_text_en"
              placeholder="Pilih Klasifikasi"
              class="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-2"
            />

            <Heading variant="body2m"
              >Jenis Naskah <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.long_text_en"
              placeholder="Pilih Jenis Naskah"
              class="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-2"
            />

            <Heading variant="body2m"
              >Nomor Dokumen <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.long_text_en"
              placeholder="Masukkan Nomor Dokumen"
              class="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-2"
            />
            <Heading variant="body2m"
              >Perihal <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.long_text_en"
              placeholder="Masukkan Perihal Dokumen"
              class="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-2"
            />

            <!-- File Attachment -->
            <div>
              <Heading variant="body2m" class="mb-2"
                >File Attachment <span class="text-red-500">*</span></Heading
              >
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
                  <p class="text-sm text-gray-600">
                    Pilih File atau Drag & Drop
                  </p>
                  <p class="text-xs text-gray-400">
                    PDF, DOC, DOCX (Max. 10MB)
                  </p>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  class="hidden"
                  @change="handleFileUpload"
                />
              </div>
              <p v-if="addForm.fileName" class="text-sm text-gray-600 mt-2">
                File: {{ addForm.fileName }}
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
                class="mb-8 flex gap-3"
              >
                <select
                  v-model="addForm.signers[index]"
                  class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="">Pilih Jabatan</option>
                  <option value="Direktur Utama">Direktur Utama</option>
                  <option value="Vice President">Vice President</option>
                  <option value="Manager">Manager</option>
                </select>
                <button
                  type="button"
                  @click="addSigner"
                  class="flex items-center gap-1 px-3 py-2 text-xs bg-primary hover:bg-primary-700 rounded-lg text-gray-500 text-white"
                >
                  <Plus class="w-4 h-4" />
                  Tambah
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </Teleport>

      <!---------->
      <!-- MODAL DETAIL -->
      <!---------->

      <Teleport to="body">
        <Modal
          v-model="openDetail"
          :hideDefaultFooter="true"
          class="w-full"
          size="xl"
        >
          <template #title>
            <Heading
              variant="heading9b"
              class="font-semibold text-sm mb-3 mt-5 ml-5"
            >
              Detail Dokumen
            </Heading>
          </template>

          <div class="space-y-3">
            <div class="text-sm mt-2" v-if="selectedRow">
              <div clas="flex mb-2 ">
                <span class="w-40 text-gray-600">ID</span>
                <span class="font-medium"> : {{ selectedRow.id ?? "-" }}</span>
              </div>

              <div class="flex mb-2">
                <p class="w-40 text-gray-600">No</p>
                <p class="font-medium">: {{ selectedRow.no }}</p>
              </div>

              <div class="flex mb-2">
                <p class="w-40 text-gray-600">Tanggal</p>
                <p class="font-medium">: {{ selectedRow.date }}</p>
              </div>

              <div class="flex mb-2">
                <p class="w-40 text-gray-600">Jenis</p>
                <p class="font-medium">: {{ selectedRow.type ?? "-" }}</p>
              </div>

              <div class="flex mb-2">
                <p class="w-40 text-gray-600">Klasifikasi</p>
                <p class="font-medium">
                  : {{ selectedRow.classification ?? "-" }}
                </p>
              </div>
            </div>

            <!-- TABLE DI DALAM MODAL -->
            <div
              class="mt-6 mb-5 border border-gray-200 rounded-xl overflow-hidden"
            >
              <table class="w-full text-sm">
                <thead class="bg-primary !rounded-lg text-white">
                  <tr>
                    <th class="p-3 text-left">No</th>
                    <th class="p-3 text-left">E-NIK</th>
                    <th class="p-3 text-left">Nama</th>
                    <th class="p-3 text-center">Status</th>
                    <th class="p-3 text-center">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(s, i) in selectedRow?.signerList" :key="i">
                    <td class="p-3">{{ i + 1 }}</td>
                    <td class="p-3">{{ s.nik }}</td>
                    <td class="p-3">{{ s.name }}</td>
                    <td class="p-3 text-center">
                      <span
                        class="px-3 py-1 rounded-lg text-xs"
                        :class="
                          s.status === 'Success'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        "
                      >
                        {{ s.status }}
                      </span>
                    </td>
                    <td class="p-3 text-center">{{ s.note }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      </Teleport>
      <!-- ========================= -->
      <!-- MODAL ADD -->
      <!-- ========================= -->
      <Teleport to="body">
        <Modal v-model="showAddModal" @save="saveAdd" size="xl">
          <template #title>
            <div class="mt-5 ml-5 mb-3">
              <Heading variant="heading9b" class="font-semibold text-sm">
                Tambah Dokumen
              </Heading>
            </div>
          </template>

          <div class="flex flex-col px-1 gap-2 mt-1">
            <Heading variant="body2m"
              >Tanggal Dokumen <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.long_text"
              placeholder="DD/MM/YY"
              class="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-2"
            />

            <Heading variant="body2m"
              >Klasifikasi <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.long_text_en"
              placeholder="Pilih Klasifikasi"
              class="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-2"
            />

            <Heading variant="body2m"
              >Jenis Naskah <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.long_text_en"
              placeholder="Pilih Jenis Naskah"
              class="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-2"
            />

            <Heading variant="body2m"
              >Nomor Dokumen <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.long_text_en"
              placeholder="Masukkan Nomor Dokumen"
              class="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-2"
            />
            <Heading variant="body2m"
              >Perihal <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.long_text_en"
              placeholder="Masukkan Perihal Dokumen"
              class="border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mb-2"
            />

            <!-- File Attachment -->
            <div>
              <Heading variant="body2m" class="mb-2"
                >File Attachment <span class="text-red-500">*</span></Heading
              >
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
                  <p class="text-sm text-gray-600">
                    Pilih File atau Drag & Drop
                  </p>
                  <p class="text-xs text-gray-400">
                    PDF, DOC, DOCX (Max. 10MB)
                  </p>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  class="hidden"
                  @change="handleFileUpload"
                />
              </div>
              <p v-if="addForm.fileName" class="text-sm text-gray-600 mt-2">
                File: {{ addForm.fileName }}
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
                class="mb-8 flex gap-3"
              >
                <select
                  v-model="addForm.signers[index]"
                  class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="">Pilih Jabatan</option>
                  <option value="Direktur Utama">Direktur Utama</option>
                  <option value="Vice President">Vice President</option>
                  <option value="Manager">Manager</option>
                </select>
                <button
                  type="button"
                  @click="addSigner"
                  class="flex items-center gap-1 px-3 py-2 text-xs bg-primary hover:bg-primary-700 rounded-lg text-gray-500 text-white"
                >
                  <Plus class="w-4 h-4" />
                  Tambah
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  FileCheck,
  Eye,
} from "lucide-vue-next";

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "verifikasi-dokumen", to: "/admin/digsig/verifikasi-dokumen" },
];

const statusFilter = ref("");
const sortKey = ref("");
const sortOrder = ref("asc");

// STATE
const rowsPerPage = ref(10);
const rowsChoices = [10, 25, 50, 100];
const search = ref("");
const loading = ref(false);
const openDetail = ref(false);
const selectedRow = ref(null);

// File upload refs
const fileInput = ref(null);
const editFileInput = ref(null);

// ================================
// MODAL: EDIT
// ================================
const showEditModal = ref(false);
const selectedItem = ref(null);

const editForm = ref({
  nomorDokumen: "",
  perihal: "",
  fileName: "",
  visibleSign: false,
  signers: [""],
});

const openEdit = async (item: any) => {
  selectedItem.value = item;
  editForm.value = {
    nomorDokumen: item.no || "",
    perihal: item.desc || "",
    fileName: "dokumen.pdf",
    visibleSign: false,
    signers: ["Direktur Utama"],
  };
  showEditModal.value = true;
};

const saveEdit = async () => {
  if (!selectedItem.value) return;
  console.log("Saving edit:", editForm.value);
  showEditModal.value = false;
  // Add your save logic here
};

const triggerEditFileUpload = () => {
  editFileInput.value?.click();
};

const handleEditFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    editForm.value.fileName = file.name;
  }
};

const addEditSigner = () => {
  editForm.value.signers.push("");
};

// ================================
// MODAL: ADD
// ================================
const showAddModal = ref(false);

const addForm = ref({
  nomorDokumen: "",
  perihal: "",
  fileName: "",
  visibleSign: false,
  signers: [""],
});

const openAdd = () => {
  addForm.value = {
    nomorDokumen: "",
    perihal: "",
    fileName: "",
    visibleSign: false,
    signers: [""],
  };
  showAddModal.value = true;
};

const saveAdd = async () => {
  console.log("Saving new document:", addForm.value);
  showAddModal.value = false;
  // Add your save logic here
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    addForm.value.fileName = file.name;
  }
};

const addSigner = () => {
  addForm.value.signers.push("");
};

// ================================
// MODAL: DETAIL
// ================================
const openDetailModal = (row: any) => {
  selectedRow.value = row;
  openDetail.value = true;
};

// dummy row (biar tidak error)
const rows = ref([
  {
    id: 1,
    date: "16/03/2024 10:11:37",
    no: "002/DIR/III/2024",
    desc: "Pengujian Tanda Tangan Digital UAT",
    count: 1,
    status: "Rejected",
    type: "Sertifikat",
    classification: "Operasi",
    signerList: [
      {
        nik: "3374031234567890",
        name: "BUDI SANTOSO",
        status: "Rejected",
        note: "Dokumen tidak sesuai",
      },
    ],
  },
  {
    id: 2,
    date: "17/03/2024 14:22:15",
    no: "003/DIR/III/2024",
    desc: "Surat Keputusan Direktur",
    count: 2,
    status: "Success",
    type: "Pengumuman",
    classification: "Air Traffic",
    signerList: [
      {
        nik: "3374041234567891",
        name: "SITI AMINAH",
        status: "Success",
        note: "-",
      },
      {
        nik: "3374051234567892",
        name: "AHMAD DAHLAN",
        status: "Success",
        note: "-",
      },
    ],
  },
  {
    id: 3,
    date: "18/03/2024 09:30:45",
    no: "004/MGR/III/2024",
    desc: "Risalah Rapat Evaluasi Bulanan",
    count: 3,
    status: "Success",
    type: "Risalah Rapat",
    classification: "Operasi",
    signerList: [
      {
        nik: "3374061234567893",
        name: "DEWI LESTARI",
        status: "Success",
        note: "-",
      },
      {
        nik: "3374071234567894",
        name: "BAMBANG SURYADI",
        status: "Success",
        note: "-",
      },
      {
        nik: "3374081234567895",
        name: "RATNA WIJAYA",
        status: "Success",
        note: "-",
      },
    ],
  },
  {
    id: 4,
    date: "19/03/2024 11:15:22",
    no: "005/VP/III/2024",
    desc: "Nota Dinas Perubahan Kebijakan",
    count: 1,
    status: "Success",
    type: "Pengumuman",
    classification: "Air Traffic",
    signerList: [
      {
        nik: "3374091234567896",
        name: "JOKO WIDODO",
        status: "Success",
        note: "-",
      },
    ],
  },
  {
    id: 5,
    date: "20/03/2024 16:45:10",
    no: "006/DIR/III/2024",
    desc: "Sertifikat Penghargaan Karyawan Teladan",
    count: 2,
    status: "Rejected",
    type: "Sertifikat",
    classification: "Operasi",
    signerList: [
      {
        nik: "3374101234567897",
        name: "AGUS SANTOSO",
        status: "Rejected",
        note: "Tanda tangan tidak valid",
      },
      {
        nik: "3374111234567898",
        name: "LINA MARLINA",
        status: "Success",
        note: "-",
      },
    ],
  },
  {
    id: 6,
    date: "21/03/2024 08:20:33",
    no: "007/MGR/III/2024",
    desc: "Laporan Keuangan Triwulan I",
    count: 3,
    status: "Success",
    type: "Risalah Rapat",
    classification: "Air Traffic",
    signerList: [
      {
        nik: "3374121234567899",
        name: "HENDRA GUNAWAN",
        status: "Success",
        note: "-",
      },
      {
        nik: "3374131234567900",
        name: "MAYA SARI",
        status: "Success",
        note: "-",
      },
      {
        nik: "3374141234567901",
        name: "RUDI HARTONO",
        status: "Success",
        note: "-",
      },
    ],
  },
  {
    id: 7,
    date: "22/03/2024 13:10:55",
    no: "008/DIR/III/2024",
    desc: "Persetujuan Anggaran Tahunan",
    count: 1,
    status: "Success",
    type: "Pengumuman",
    classification: "Operasi",
    signerList: [
      {
        nik: "3374151234567902",
        name: "WULAN DARI",
        status: "Success",
        note: "-",
      },
    ],
  },
  {
    id: 8,
    date: "23/03/2024 10:35:18",
    no: "009/VP/III/2024",
    desc: "Surat Perintah Kerja Proyek Baru",
    count: 2,
    status: "Rejected",
    type: "Sertifikat",
    classification: "Air Traffic",
    signerList: [
      {
        nik: "3374161234567903",
        name: "FERRY IRAWAN",
        status: "Success",
        note: "-",
      },
      {
        nik: "3374171234567904",
        name: "DIANA PUTRI",
        status: "Rejected",
        note: "Menunggu verifikasi tambahan",
      },
    ],
  },
]);

function sortBy(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
}

const filteredRows = computed(() => {
  let data = [...rows.value];

  // SEARCH
  data = data.filter((row) =>
    row.no.toLowerCase().includes(search.value.toLowerCase()),
  );

  // STATUS FILTER
  if (statusFilter.value) {
    data = data.filter((row) => row.status === statusFilter.value);
  }

  // SORTING
  if (sortKey.value) {
    data.sort((a, b) => {
      let valA = a[sortKey.value];
      let valB = b[sortKey.value];

      // khusus TANGGAL → convert
      if (sortKey.value === "date") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder.value === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder.value === "asc" ? 1 : -1;
      return 0;
    });
  }

  return data;
});
</script>
