<template>
  <div class="space-y-6 min-h-screen p-6">
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
        Tambah
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm w-full">
      <!-- TOP ACTION BAR -->
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 pl-4 mb-4 pt-5 pr-4"
      >
        <!-- STATUS FILTER -->
        <div class="relative">
          <button
            data-custom-dropdown
            class="flex items-center justify-between gap-2 bg-gray-100 hover:bg-gray-200 text-sm px-4 py-2 rounded-lg transition"
            @click.stop="openFilterStatus = !openFilterStatus"
          >
            <span>{{ filterStatusLabel }}</span>
            <ChevronDown
              :class="[
                'w-4 h-4 transition-transform duration-200',
                openFilterStatus ? 'rotate-180' : '',
              ]"
            />
          </button>

          <div
            v-if="openFilterStatus"
            data-custom-dropdown
            class="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
          >
            <button
              v-for="item in filterOptions"
              :key="item.value"
              class="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition"
              @click.prevent="selectFilterStatus(item)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- SEARCH -->
        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            @input="handleSearch"
            placeholder="Cari Dokumen"
            class="w-full bg-gray-50 border border-gray-200 text-sm pl-9 pr-3 py-2 rounded-lg"
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
                class="px-4 py-3 text-left cursor-pointer"
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
                class="px-4 py-3 text-left cursor-pointer"
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
                class="px-4 py-3 text-center cursor-pointer"
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
              <Heading variant="body2m">
                Penanda Tangan <span class="text-red-500">*</span>
              </Heading>
            </div>

            <!-- Selected Signers Display -->
            <div
              v-if="addForm.selectedSigners.length > 0"
              class="mb-4 space-y-2"
            >
              <div
                v-for="(signer, index) in addForm.selectedSigners"
                :key="index"
                class="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3"
              >
                <div class="flex-1">
                  <p class="font-medium text-sm">
                    {{ index + 1 }}. {{ signer.jabatan }} -
                    {{ signer.lokasi }} - {{ signer.nama }}
                  </p>
                </div>
                <button
                  type="button"
                  @click="removeSelectedSigner(index)"
                  class="text-red-600 hover:text-red-800 ml-2"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Dropdown with Search -->
            <div class="relative" ref="dropdownRef">
              <div
                @click="toggleSignerDropdown"
                class="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm cursor-pointer bg-white flex items-center justify-between"
              >
                <span class="text-gray-500">Pilih Jabatan</span>
                <svg
                  class="w-4 h-4 text-gray-400 transition-transform"
                  :class="{ 'rotate-180': showSignerDropdown }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              <!-- Dropdown Menu -->
              <div
                v-if="showSignerDropdown"
                class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden"
              >
                <!-- Search Input -->
                <div class="p-2 border-b border-gray-200 sticky top-0 bg-white">
                  <div class="relative">
                    <Search
                      class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      v-model="signerSearchQuery"
                      type="text"
                      placeholder="Cari jabatan, nama, atau lokasi..."
                      class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      @click.stop
                    />
                  </div>
                </div>

                <!-- Options List -->
                <div class="overflow-y-auto max-h-64">
                  <div
                    v-for="v in filteredVerifikatorList"
                    :key="v.persnum"
                    @click="selectSigner(v)"
                    class="px-3 py-3 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    :class="{
                      'bg-blue-50':
                        addForm.selectedSigners.findIndex(
                          (s) => s.persnum === v.persnum,
                        ) !== -1,
                    }"
                  >
                    <p class="font-medium">
                      {{ v.jabatan }} - {{ v.nama }} - {{ v.lokasi }}
                    </p>
                  </div>

                  <div
                    v-if="filteredVerifikatorList.length === 0"
                    class="px-3 py-4 text-center text-gray-500 text-sm"
                  >
                    Tidak ada data ditemukan
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Buttons -->
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

        <div class="px-3 max-h-[70vh] overflow-y-auto">
          <div v-if="loadingDetail" class="text-center py-8">
            <p class="text-gray-500">Loading...</p>
          </div>

          <div
            v-else-if="documentDetail"
            class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mt-2"
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
              <p class="text-gray-600 mb-1">Jenis Naskah</p>
              <p class="font-medium">{{ documentDetail.jenisNaskah }}</p>
            </div>

            <div>
              <p class="text-gray-600 mb-1">Klasifikasi</p>
              <p class="font-medium">{{ documentDetail.klasifikasiText }}</p>
            </div>

            <div>
              <p class="text-gray-600 mb-1">Perihal</p>
              <p class="font-medium">{{ documentDetail.perihal }}</p>
            </div>
          </div>

          <!-- TABLE SIGNERS -->
          <div
            v-if="
              documentDetail &&
              documentDetail.signers &&
              documentDetail.signers.length > 0
            "
            class="mt-6 mb-5 border border-gray-200 rounded-xl overflow-hidden"
          >
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-primary border-b border-gray-200">
                  <tr>
                    <th class="p-3 text-left text-white font-semibold">NO</th>
                    <th class="p-3 text-left font-semibold text-white">
                      PERSNUM
                    </th>
                    <th class="p-3 text-left font-semibold text-white">
                      NAMA / JABATAN
                    </th>
                    <th class="p-3 text-center font-semibold text-white">
                      STATUS
                    </th>
                    <th class="p-3 text-center font-semibold text-white">
                      KETERANGAN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(s, i) in documentDetail.signers"
                    :key="i"
                    class="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td class="p-3">
                      <span
                        class="inline-flex items-center justify-center text-xs font-semibold"
                      >
                        {{ s.urutan }}
                      </span>
                    </td>
                    <td class="p-3 font-mono text-gray-700">
                      {{ s.persnum || "-" }}
                    </td>
                    <td class="p-3">
                      <div class="font-semibold text-gray-900">
                        {{ s.nama || "-" }}
                      </div>
                      <div class="text-xs text-gray-500 mt-1">
                        {{ s.jabatan || "-" }}
                      </div>
                    </td>
                    <td class="p-3 text-center">
                      <span
                        class="px-3 py-1 rounded-lg text-xs font-semibold"
                        :class="getSignerStatusClass(s.status)"
                      >
                        {{ getSignerStatusLabel(s.status) }}
                      </span>
                    </td>
                    <td class="p-3 font-mono text-center text-gray-700">
                      {{ s.keterangan || "-" }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Empty state jika tidak ada penandatangan -->
          <div
            v-else-if="
              documentDetail &&
              (!documentDetail.signers || documentDetail.signers.length === 0)
            "
            class="mt-6 mb-5 border border-gray-200 rounded-xl p-8 text-center"
          >
            <p class="text-gray-500 text-sm">
              Belum ada penandatangan yang ditambahkan
            </p>
          </div>
        </div>
      </Modal>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import {
  Plus,
  Search,
  Pencil,
  FileCheck,
  Eye,
  ChevronDown,
} from "lucide-vue-next";

import { useDigsig } from "~/composables/useDigsig";
import type { Verifikator } from "~/types/digsig";

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
const fileInput = ref<HTMLInputElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "verifikasi-dokumen", to: "/admin/digsig/verifikasi-dokumen" },
];

const filterOptions = [
  { label: "Semua", value: "" },
  { label: "Menunggu", value: "waiting" },
  { label: "Sudah TTD", value: "signed" },
  { label: "Ditolak", value: "rejected" },
];

const filterStatusLabel = computed(() => {
  const found = filterOptions.find((opt) => opt.value === statusFilter.value);
  return found?.label || "Semua Status";
});

const statusFilter = ref("");
const openFilterStatus = ref(false);
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
  signers: [] as { urutan: number; persnum: number }[],
  selectedSigners: [] as Verifikator[],
});

const showSignerDropdown = ref(false);
const signerSearchQuery = ref("");

const filteredVerifikatorList = computed(() => {
  if (!signerSearchQuery.value) {
    return verifikatorList.value;
  }

  const query = signerSearchQuery.value.toLowerCase();
  return verifikatorList.value.filter(
    (v) =>
      v.jabatan.toLowerCase().includes(query) ||
      v.nama.toLowerCase().includes(query) ||
      v.lokasi.toLowerCase().includes(query) ||
      v.areaText.toLowerCase().includes(query),
  );
});

onMounted(() => {
  loadDocuments();
  fetchKlasifikasi();
  fetchJenisNaskah();
  fetchVerifikator();
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("click", handleDropdownClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("click", handleDropdownClickOutside);
});

const loadDocuments = async () => {
  await fetchDocuments({
    page: currentPage.value,
    limit: limit.value,
    search: search.value,
    status: statusFilter.value,
    sortBy: sortKey.value,
    sortOrder: sortOrder.value,
  });
};

const handleSearch = () => {
  currentPage.value = 1;
  loadDocuments();
};

const selectFilterStatus = (item: { label: string; value: string }) => {
  statusFilter.value = item.value;
  openFilterStatus.value = false;
  currentPage.value = 1;
  loadDocuments();
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest("[data-custom-dropdown]")) {
    openFilterStatus.value = false;
  }
};

const handleDropdownClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    showSignerDropdown.value = false;
  }
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
    on_progress: "On Progress",
    completed: "Completed",
    rejected: "Rejected",
    draft: "Draft",
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

const toggleSignerDropdown = () => {
  showSignerDropdown.value = !showSignerDropdown.value;
  if (showSignerDropdown.value) {
    signerSearchQuery.value = "";
  }
};

const selectSigner = (verifikator: Verifikator) => {
  const exists = addForm.value.selectedSigners.findIndex(
    (s) => s.persnum === verifikator.persnum,
  );

  if (exists === -1) {
    addForm.value.selectedSigners.push(verifikator);
  }

  showSignerDropdown.value = false;
  signerSearchQuery.value = "";
};

const removeSelectedSigner = (index: number) => {
  addForm.value.selectedSigners.splice(index, 1);
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
    const mappedSigners: Verifikator[] = [];

    if (doc.signers && doc.signers.length > 0) {
      for (const s of doc.signers) {
        const verifikator = verifikatorList.value.find(
          (v) => v.persnum === Number(s.persnum),
        );

        if (verifikator) {
          mappedSigners.push(verifikator);
        } else {
          mappedSigners.push({
            positionId: Number(s.positionId) || 0,
            persnum: Number(s.persnum) || 0,
            nama: s.nama || "",
            jabatan: s.jabatan || "",
            lokasi: s.lokasi || "",
            areaText: "",
            companyText: "",
          });
        }
      }
    }

    addForm.value = {
      tanggal: doc.tanggalDokumen.split("T")[0],
      klasifikasi: doc.klasifikasi,
      jenisNaskah: doc.jenisNaskah,
      nomorDokumen: doc.nomorDokumen,
      perihal: doc.perihal,
      fileName: doc.fileName || "",
      file: null,
      visibleSign: Boolean(doc.visibleSign),
      signers: [],
      selectedSigners: mappedSigners,
    };
  }

  openAdd.value = true;
};

const openDetailModal = async (id: string) => {
  const res = await fetchDocumentDetail(id);
  if (res) {
    openDetail.value = true;
  } else {
    alert("Gagal memuat detail dokumen");
  }
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
    signers: [],
    selectedSigners: [],
  };
  showSignerDropdown.value = false;
  signerSearchQuery.value = "";
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
  if (!addForm.value.tanggal) {
    alert("Tanggal Dokumen harus diisi");
    return;
  }
  if (!addForm.value.klasifikasi) {
    alert("Klasifikasi harus dipilih");
    return;
  }
  if (!addForm.value.jenisNaskah) {
    alert("Jenis Naskah harus dipilih");
    return;
  }
  if (!addForm.value.nomorDokumen) {
    alert("Nomor Dokumen harus diisi");
    return;
  }
  if (!addForm.value.perihal) {
    alert("Perihal harus diisi");
    return;
  }
  if (!isEditMode.value && !addForm.value.file) {
    alert("File Attachment harus diupload");
    return;
  }
  if (addForm.value.selectedSigners.length === 0) {
    alert("Mohon pilih minimal satu penandatangan");
    return;
  }

  try {
    const signersPayload = addForm.value.selectedSigners.map((s, idx) => ({
      urutan: idx + 1,
      persnum: s.persnum,
    }));

    if (isEditMode.value && editingId.value) {
      const payload: any = {
        tanggalDokumen: addForm.value.tanggal,
        klasifikasi: addForm.value.klasifikasi,
        jenisNaskah: addForm.value.jenisNaskah,
        nomorDokumen: addForm.value.nomorDokumen,
        perihal: addForm.value.perihal,
        visibleSign: addForm.value.visibleSign,
        signers: signersPayload,
      };

      if (addForm.value.file) {
        payload.file = addForm.value.file;
      }

      await updateDocument(editingId.value, payload);
      alert("✅ Dokumen berhasil diperbarui!");
    } else {
      if (!addForm.value.file) {
        alert("File harus diupload untuk dokumen baru");
        return;
      }

      const payload = {
        tanggalDokumen: addForm.value.tanggal,
        klasifikasi: addForm.value.klasifikasi,
        jenisNaskah: addForm.value.jenisNaskah,
        nomorDokumen: addForm.value.nomorDokumen,
        perihal: addForm.value.perihal,
        file: addForm.value.file,
        visibleSign: addForm.value.visibleSign,
        signers: signersPayload,
      };

      await createDocument(payload);
      alert("✅ Dokumen berhasil dibuat!");
    }

    closeModal();
    await loadDocuments();
  } catch (err: any) {
    console.error("❌ Save error:", err);
    alert(`❌ Gagal menyimpan dokumen: ${err.message || "Unknown error"}`);
  }
};
</script>
