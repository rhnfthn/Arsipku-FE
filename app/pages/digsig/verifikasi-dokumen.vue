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

      <button
        @click="openAdd = true"
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
      <div v-else class="overflow-x-auto">
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
                    class="w-4 h-4 text-gray-600 cursor-pointer hover:text-primary"
                    @click="
                      openDetail = true;
                      selectedRow = row;
                    "
                  />
                  <button class="text-yellow-500 hover:text-yellow-700">
                    <Pencil class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL TAMBAH DOKUMEN -->
    <Teleport to="body">
      <Modal v-model="openAdd" :hideDefaultFooter="true" size="xl">
        <template #title>
          <div class="mt-5 ml-5 mb-3">
            <Heading variant="heading9b" class="font-semibold text-sm">
              Tambah Dokumen
            </Heading>
          </div>
        </template>

        <div class="flex flex-col px-6 gap-4 mt-1">
          <div>
            <Heading variant="body2m"
              >Tanggal Dokumen <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.tanggal"
              type="date"
              class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
            />
          </div>

          <div>
            <Heading variant="body2m"
              >Klasifikasi <span class="text-red-500">*</span></Heading
            >
            <select
              v-model="addForm.klasifikasi"
              class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
            >
              <option value="">Pilih Klasifikasi</option>
              <option value="OPS - OPERASI">OPS - OPERASI</option>
              <option value="ADM - ADMINISTRASI">ADM - ADMINISTRASI</option>
              <option value="KEU - KEUANGAN">KEU - KEUANGAN</option>
            </select>
          </div>

          <div>
            <Heading variant="body2m"
              >Jenis Naskah <span class="text-red-500">*</span></Heading
            >
            <select
              v-model="addForm.jenisNaskah"
              class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
            >
              <option value="">Pilih Jenis Naskah</option>
              <option value="PGM - Sertifikat atau Piagam">
                PGM - Sertifikat atau Piagam
              </option>
              <option value="SK - Surat Keputusan">SK - Surat Keputusan</option>
              <option value="ST - Surat Tugas">ST - Surat Tugas</option>
            </select>
          </div>

          <div>
            <Heading variant="body2m"
              >Nomor Dokumen <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.nomorDokumen"
              placeholder="Masukkan Nomor Dokumen"
              class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
            />
          </div>

          <div>
            <Heading variant="body2m"
              >Perihal <span class="text-red-500">*</span></Heading
            >
            <input
              v-model="addForm.perihal"
              placeholder="Masukkan Perihal Dokumen"
              class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm mt-2"
            />
          </div>

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
              class="mb-4 flex gap-3"
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
                v-if="index === addForm.signers.length - 1"
                type="button"
                @click="addSigner"
                class="flex items-center gap-1 px-3 py-2 text-xs bg-primary hover:bg-primary-700 rounded-lg text-white"
              >
                <Plus class="w-4 h-4" />
                Tambah
              </button>
              <button
                v-if="addForm.signers.length > 1"
                type="button"
                @click="removeSigner(index)"
                class="flex items-center gap-1 px-3 py-2 text-xs bg-red-500 hover:bg-red-600 rounded-lg text-white"
              >
                Hapus
              </button>
            </div>
          </div>

          <!-- Footer Buttons -->

          <div class="flex justify-end gap-3 mt-4 mb-6">
            <button
              @click="openAdd = false"
              class="px-6 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Batal
            </button>
            <button
              @click="saveDokumen"
              class="px-6 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-700 transition"
            >
              Simpan
            </button>
          </div>
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

        <div class="px-6">
          <div class="grid grid-cols-2 gap-6 text-sm mt-2" v-if="selectedRow">
            <div>
              <p class="text-gray-600 mb-1">ID</p>
              <p class="font-medium">{{ selectedRow.id ?? "-" }}</p>
            </div>

            <div>
              <p class="text-gray-600 mb-1">No</p>
              <p class="font-medium">{{ selectedRow.no }}</p>
            </div>

            <div>
              <p class="text-gray-600 mb-1">Tanggal</p>
              <p class="font-medium">{{ selectedRow.date }}</p>
            </div>

            <div>
              <p class="text-gray-600 mb-1">Jenis</p>
              <p class="font-medium">{{ selectedRow.type ?? "-" }}</p>
            </div>

            <div class="col-span-2">
              <p class="text-gray-600 mb-1">Klasifikasi</p>
              <p class="font-medium">{{ selectedRow.classification ?? "-" }}</p>
            </div>
          </div>

          <!-- TABLE DI DALAM MODAL -->
          <div
            class="mt-6 mb-5 border border-gray-200 rounded-xl overflow-hidden"
          >
            <table class="w-full text-sm">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="p-3 text-left">No</th>
                  <th class="p-3 text-left">E-NIK</th>
                  <th class="p-3 text-left">Nama</th>
                  <th class="p-3 text-center">Status</th>
                  <th class="p-3 text-center">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(s, i) in selectedRow?.signerList"
                  :key="i"
                  class="border-b border-gray-100"
                >
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Plus, Search, Pencil, FileCheck, Eye } from "lucide-vue-next";

const openDetail = ref(false);
const openAdd = ref(false);
const selectedRow = ref(null);
const fileInput = ref(null);

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "verifikasi-dokumen", to: "/admin/digsig/verifikasi-dokumen" },
];

const statusFilter = ref("");
const sortKey = ref("");
const sortOrder = ref("asc");
const search = ref("");
const loading = ref(false);

const addForm = ref({
  tanggal: "",
  klasifikasi: "",
  jenisNaskah: "",
  nomorDokumen: "",
  perihal: "",
  fileName: "",
  visibleSign: false,
  signers: [""],
});

const rows = ref([
  {
    id: 1,
    date: "16/03/2024 10:11:37",
    no: "002 / Coba Ttd UAT",
    desc: "Pengujian Tanda Tangan Digital UAT",
    count: 1,
    status: "Rejected",
    type: "PGM - Sertifikat atau Piagam",
    classification: "OPS - OPERASI",
    signerList: [
      {
        nik: "3374031234567890",
        name: "BUDI SANTOSO",
        status: "Rejected",
        note: "-",
      },
    ],
  },
  {
    id: 2,
    date: "17/03/2024 14:20:15",
    no: "003 / Test Digital Sign",
    desc: "Testing Tanda Tangan Elektronik",
    count: 2,
    status: "Success",
    type: "SK - Surat Keputusan",
    classification: "ADM - ADMINISTRASI",
    signerList: [
      {
        nik: "3374031234567891",
        name: "AHMAD WIJAYA",
        status: "Success",
        note: "Approved",
      },
      {
        nik: "3374031234567892",
        name: "SITI NURHALIZA",
        status: "Success",
        note: "Approved",
      },
    ],
  },
  {
    id: 3,
    date: "18/03/2024 09:15:30",
    no: "004 / Surat Tugas",
    desc: "Penugasan Karyawan Operasional",
    count: 1,
    status: "Success",
    type: "ST - Surat Tugas",
    classification: "OPS - OPERASI",
    signerList: [
      {
        nik: "3374031234567893",
        name: "RUDI HARTONO",
        status: "Success",
        note: "Completed",
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

  if (search.value) {
    data = data.filter(
      (row) =>
        row.no.toLowerCase().includes(search.value.toLowerCase()) ||
        row.desc.toLowerCase().includes(search.value.toLowerCase()),
    );
  }

  if (statusFilter.value) {
    data = data.filter((row) => row.status === statusFilter.value);
  }

  if (sortKey.value) {
    data.sort((a, b) => {
      let valA = a[sortKey.value];
      let valB = b[sortKey.value];

      if (sortKey.value === "date") {
        valA = new Date(
          valA.split(" ")[0].split("/").reverse().join("-"),
        ).getTime();
        valB = new Date(
          valB.split(" ")[0].split("/").reverse().join("-"),
        ).getTime();
      }

      if (valA < valB) return sortOrder.value === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder.value === "asc" ? 1 : -1;
      return 0;
    });
  }

  return data;
});

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    addForm.value.fileName = file.name;
  }
};

const addSigner = () => {
  addForm.value.signers.push("");
};

const removeSigner = (index: number) => {
  addForm.value.signers.splice(index, 1);
};

const saveDokumen = () => {
  console.log("Save dokumen:", addForm.value);
  openAdd.value = false;
  // Reset form
  addForm.value = {
    tanggal: "",
    klasifikasi: "",
    jenisNaskah: "",
    nomorDokumen: "",
    perihal: "",
    fileName: "",
    visibleSign: false,
    signers: [""],
  };
};
</script>
