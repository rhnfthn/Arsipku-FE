<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Penandatanganan Dokumen
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
    </div>

    <!-- SUMMARY CARDS -->
    <!-- <div v-if="summary" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Menunggu</p>
            <p class="text-3xl font-bold text-yellow-600">
              {{ summary.totalPending }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center"
          >
            <Clock class="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Sudah TTD</p>
            <p class="text-3xl font-bold text-green-600">
              {{ summary.totalSigned }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"
          >
            <CheckCircle2 class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600 mb-1">Ditolak</p>
            <p class="text-3xl font-bold text-red-600">
              {{ summary.totalRejected }}
            </p>
          </div>
          <div
            class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center"
          >
            <XCircle class="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>
    </div> -->

    <!-- TABLE CONTAINER -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200">
      <!-- TOP BAR -->
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 p-4 border-b border-gray-200"
      >
        <!-- Rows per page -->
        <div class="flex items-center gap-2">
          <select
            v-model="rowsPerPage"
            class="border border-gray-300 bg-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">
              {{ n }}
            </option>
          </select>
        </div>

        <!-- Filter Status -->
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
        <div class="relative w-full justify-between">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            placeholder="Cari nomor dokumen atau perihal..."
            class="w-full bg-gray-50 border border-gray-200 text-sm pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition"
          />
        </div>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-primary text-white">
            <tr>
              <th class="px-4 py-3 font-semibold text-sm">Tanggal Dibuat</th>
              <th class="px-4 py-3 font-semibold text-sm">No Dokumen</th>
              <th class="px-4 py-3 font-semibold text-sm">Perihal</th>
              <th class="px-4 py-3 font-semibold text-sm">Penandatangan</th>
              <th class="px-4 py-3 texfont-semibold text-sm">Dokumen</th>
              <th class="px-4 py-3 font-semibold text-sm">Status</th>
              <th class="px-4 py-3 font-semibold text-sm text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="p-12 text-center">
                <div class="flex flex-col items-center gap-3">
                  <div
                    class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
                  ></div>
                  <p class="text-gray-500 text-sm">Memuat data...</p>
                </div>
              </td>
            </tr>

            <tr v-else-if="paginatedRows.length === 0">
              <td colspan="6" class="p-12 text-center">
                <div class="flex flex-col items-center gap-3">
                  <FileX class="w-12 h-12 text-gray-400" />
                  <p class="text-gray-500 font-medium">Tidak ada data</p>
                  <p class="text-sm text-gray-400">
                    Belum ada dokumen yang perlu ditandatangani
                  </p>
                </div>
              </td>
            </tr>

            <tr
              v-else
              v-for="row in paginatedRows"
              :key="row.id"
              class="border-b border-gray-100 hover:bg-gray-50 transition"
            >
              <td class="px-4 py-3 text-sm text-gray-700">
                {{ formatDate(row.tanggalDibuat) }}
              </td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ row.nomorDokumen }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-700">{{ row.perihal }}</td>
              <td class="px-4 py-3 text-sm text-center text-gray-700">
                {{ row.totalPenandatangan }}
              </td>
              <td class="p-4 py-3">
                <button
                  @click="viewDocument(row)"
                  :disabled="!row.filePreviewUrl"
                  class="flex items-center gap-2 mx-auto px-3 py-1 text-xs font-medium rounded-lg transition"
                  :class="
                    row.filePreviewUrl
                      ? 'bg-blue-50 text-primary hover:bg-blue-100'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  "
                >
                  <FileCheck class="w-4 h-4" />
                  Lihat
                </button>
              </td>
              <td class="px-4 py-3">
                <span
                  v-if="row.mySignerStatus === 'waiting'"
                  class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700"
                >
                  Menunggu
                </span>
                <span
                  v-else-if="row.mySignerStatus === 'signed'"
                  class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700"
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  Sudah TTD
                </span>
                <span
                  v-else-if="row.mySignerStatus === 'rejected'"
                  class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700"
                >
                  <XCircle class="w-3.5 h-3.5" />
                  Ditolak
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                >
                  {{ row.mySignerStatus }}
                </span>
              </td>

              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <button
                    @click="handleViewDetail(row)"
                    class="p-2 text-gray-600 hover:text-primary hover:bg-blue-50 rounded-lg transition"
                    title="Lihat Detail"
                  >
                    <Eye class="w-5 h-5" />
                  </button>

                  <button
                    v-if="row.canSign"
                    @click="handleOpenSign(row)"
                    class="p-2 text-primary-600 hover:bg-blue-50 rounded-lg transition"
                    title="Tanda Tangan"
                  >
                    <Signature class="w-5 h-5" />
                  </button>

                  <button
                    v-if="row.canReject"
                    @click="handleReject(row)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Tolak"
                  >
                    <X class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        class="flex flex-col md:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-4"
      >
        <div class="text-sm text-gray-600">
          Menampilkan {{ startRow }} - {{ endRow }} dari {{ totalRows }} data
        </div>
        <div class="flex gap-2">
          <button
            @click="prevPage"
            :disabled="page === 1"
            class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="px-4 py-2 text-sm font-medium"
            >{{ page }} / {{ totalPages }}</span
          >
          <button
            @click="nextPage"
            :disabled="!hasNextPage"
            class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DETAIL -->
    <Teleport to="body">
      <Modal v-model="openDetail" :hideDefaultFooter="true" size="xl">
        <template #title>
          <h2 class="text-xl font-semibold ml-5 mt-5 mb-4">Detail Dokumen</h2>
        </template>

        <div v-if="loadingDetail" class="p-5 text-center">
          <div class="flex flex-col items-center gap-3">
            <div
              class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"
            ></div>
            <p class="text-gray-500 text-sm">Memuat detail...</p>
          </div>
        </div>

        <div v-else-if="penandatanganDetail" class="px-3 pb-6 space-y-4">
          <!-- Info Dokumen -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-600 mb-1">ID Dokumen</p>
              <p class="font-medium">
                {{ penandatanganDetail.id }}
              </p>
            </div>
            <div>
              <p class="text-gray-600 mb-1">No. Dokumen</p>
              <p class="font-medium">
                {{ penandatanganDetail.nomorDokumen }}
              </p>
            </div>
            <div>
              <p class="text-gray-600 mb-1">Tanggal Dokumen</p>
              <p class="font-medium">
                {{ penandatanganDetail.tanggalDokumen }}
              </p>
            </div>
            <div>
              <p class="text-gray-600 mb-1">Jenis Naskah</p>
              <p class="font-medium">
                {{ penandatanganDetail.jenisNaskahText }}
              </p>
            </div>
            <div>
              <p class="text-gray-600 mb-1">Klasifikasi</p>
              <p class="font-medium">
                {{ penandatanganDetail.klasifikasiText }}
              </p>
            </div>
            <div>
              <p class="text-gray-600 mb-1">Perihal</p>
              <p class="font-medium">
                {{ penandatanganDetail.perihal }}
              </p>
            </div>
            <!-- <div>
              <p class="text-gray-600 mb-1">Dibuat Oleh</p>
              <p class="font-medium text-gray-900">
                {{ penandatanganDetail.createdByName }}
              </p>
            </div> -->
            <!-- <div>
              <p class="text-gray-600 mb-1">Jabatan Pembuat</p>
              <p class="font-medium text-gray-900">
                {{ penandatanganDetail.createdByPosition }}
              </p>
            </div> -->
          </div>

          <!-- Tabel Penandatangan -->
          <div class="border border-gray-200 rounded-xl overflow-hidden mt-6">
            <table class="w-full text-sm">
              <thead class="bg-primary">
                <tr>
                  <th class="p-3 text-left font-semibold text-white">NO</th>
                  <th class="p-3 text-left font-semibold text-white">E-NIK</th>
                  <th class="p-3 text-left font-semibold text-white">
                    NAMA/JABATAN
                  </th>

                  <th class="p-3 text-left font-semibold text-white">STATUS</th>
                  <th class="p-3 text-left font-semibold text-white">
                    KETERANGAN
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="signer in penandatanganDetail.signers"
                  :key="signer.id"
                  class="border-b border-gray-100"
                >
                  <td class="p-3">{{ signer.urutan }}</td>
                  <td class="p-3 font-mono">{{ signer.persnum }}</td>
                  <td class="p-3 font-medium">
                    <div class="font-semibold text-gray-900">
                      {{ signer.nama }}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      {{ signer.jabatan }}
                    </div>
                  </td>

                  <td class="p-3 text-center">
                    <span
                      class="px-3 py-1 rounded-lg text-xs font-semibold"
                      :class="getSignerStatusClass(signer.status)"
                    >
                      {{ getSignerStatusLabel(signer.status) }}
                    </span>
                  </td>
                  <td class="p-3 text-center">
                    {{ signer.signedAt ? formatDate(signer.signedAt) : "-" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="penandatanganDetail.signedFilePreviewUrl" class="mt-2">
            <a
              :href="penandatanganDetail.signedFilePreviewUrl"
              target="_blank"
              class="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
            >
              <FileCheck class="w-4 h-4" />
              Lihat Dokumen Tertandatangan
            </a>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- MODAL SIGNATURE -->
    <Teleport to="body">
      <Modal v-model="openSign" :hideDefaultFooter="true" size="xl">
        <template #title>
          <h2 class="text-lg font-semibold ml-5 mt-5 mb-3">
            Input passphrase untuk proses tanda tangan
          </h2>
        </template>

        <div class="px-6 pb-6 space-y-5">
          <!-- Info Penandatangan -->
          <div
            v-if="selectedDoc"
            class="border rounded-xl p-4 flex gap-4 items-start bg-blue-50 border-blue-200"
          >
            <div
              class="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
            >
              <User class="w-6 h-6 text-white" />
            </div>
            <div>
              <p class="text-xs text-gray-600 mb-1">
                Ditandatangani secara digital oleh
              </p>
              <p class="font-semibold text-gray-900">
                {{ selectedDoc.signers?.[0]?.nama }}
              </p>
              <p class="text-sm text-gray-700 mt-0.5">
                {{ selectedDoc.signers?.[0]?.jabatan }}
              </p>
            </div>
          </div>

          <!-- File to Sign -->
          <!-- <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              File Sertifikat Digital (.p12)
            </label>
            <input
              type="file"
              @change="handleFileSelect"
              accept=".p12,.pfx"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p class="text-xs text-gray-500 mt-1">
              Upload file sertifikat digital Anda (format .p12 atau .pfx)
            </p>
          </div> -->

          <!-- Passphrase -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"
              >Passphrase</label
            >
            <input
              v-model="passphrase"
              type="password"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Masukkan passphrase sertifikat"
            />
            <p class="text-xs text-gray-500 mt-1">
              Passphrase yang digunakan saat membuat sertifikat digital
            </p>
          </div>

          <!-- Tombol Proses -->
          <button
            @click="handleSign"
            :disabled="!selectedFile || !passphrase || loadingSign"
            :class="[
              'w-full rounded-lg py-3 font-semibold text-sm transition',
              selectedFile && passphrase && !loadingSign
                ? 'bg-primary hover:bg-primary-700 text-white'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed',
            ]"
          >
            <span
              v-if="loadingSign"
              class="flex items-center justify-center gap-2"
            >
              <div
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></div>
              Memproses...
            </span>
            <span v-else>Proses Tanda Tangan</span>
          </button>
        </div>
      </Modal>
    </Teleport>

    <!-- MODAL REJECT -->
    <Teleport to="body">
      <Modal v-model="confirmRejectOpen" :hideDefaultFooter="true" size="xl">
        <template #title>
          <h2 class="text-lg font-semibold ml-5 mt-5 mb-3 text-red-900">
            Tolak Dokumen
          </h2>
        </template>

        <div class="pb-4 p-3 space-y-2">
          <div
            class="flex items-start gap-3 p-4 mb-2 bg-red-50 border border-red-200 rounded-lg"
          >
            <AlertTriangle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-red-700">Peringatan</p>
              <p class="text-sm text-red-700 mt-1">
                Yakin ingin menolak penandatanganan dokumen ini? Tindakan ini
                tidak dapat dibatalkan.
              </p>
            </div>
          </div>

          <div class="p-2">
            <label class="text-sm font-semibold text-gray-700 mb-2">
              Alasan Penolakan <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="rejectReason"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Masukkan alasan penolakan..."
            ></textarea>
          </div>

          <div
            class="flex gap-3 w-full justify-between border-t border-gray-200"
          >
            <button
              @click="confirmRejectOpen = false"
              class="flex-1 px-3 py-2 mt-2 text-sm font-medium text-gray-700 border border-primary hover:bg-primary-200 rounded-lg transition"
            >
              Batal
            </button>
            <button
              @click="rejectNow"
              :disabled="!rejectReason || loadingReject"
              class="flex-1 px-3 py-2 mt-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loadingReject">Memproses...</span>
              <span v-else>Tolak Dokumen</span>
            </button>
          </div>
        </div>
      </Modal>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Search,
  File,
  Eye,
  X,
  Signature,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  FileX,
  FileCheck,
  AlertTriangle,
} from "lucide-vue-next";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import Modal from "~/components/Modal.vue";
import { useDigsig } from "~/composables/useDigsig";
import type { PenandatangananDocument } from "~/types/digsig";

const {
  penandatanganDocuments,
  penandatanganDetail,
  penandatanganMeta,
  penandatanganSummary,
  loading,
  loadingDetail,
  error,
  fetchPenandatanganDocuments,
  fetchPenandatanganDetail,
  signDocument,
  rejectDocument,
} = useDigsig();

// MODAL STATES
const openDetail = ref(false);
const openSign = ref(false);
const selectedDoc = ref<PenandatangananDocument | null>(null);
const loadingSign = ref(false);

// REJECT
const confirmRejectOpen = ref(false);
const itemToReject = ref<PenandatangananDocument | null>(null);
const rejectReason = ref("");
const loadingReject = ref(false);

// SIGN FORM
const selectedFile = ref<File | null>(null);
const passphrase = ref("");

// FILTER & PAGINATION
const search = ref("");
const filterStatus = ref("");
const openFilterStatus = ref(false);
const page = ref(1);
const rowsPerPage = ref(10);
const rowsChoices = [10, 25, 50, 100];

const summary = computed(() => penandatanganSummary.value);

const filterOptions = [
  { label: "Semua", value: "" },
  { label: "Menunggu", value: "waiting" },
  { label: "Sudah TTD", value: "signed" },
  { label: "Ditolak", value: "rejected" },
];
const getSignerStatusClass = (status: string) => {
  const statusMap = {
    waiting: "bg-yellow-100 text-yellow-700",
    pending: "bg-blue-100 text-blue-600",
    signed: "bg-green-100 text-green-600",
    rejected: "bg-red-100 text-red-600",
  };
  return statusMap[status] || "bg-gray-100 text-gray-600";
};

const getSignerStatusLabel = (status: string) => {
  const statusMap = {
    waiting: "Menunggu",
    pending: "Pending",
    signed: "Sudah TTD",
    rejected: "Ditolak",
  };
  return statusMap[status] || status;
};

const filterStatusLabel = computed(() => {
  const found = filterOptions.find((opt) => opt.value === filterStatus.value);
  return found?.label || "Semua Status";
});

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Penandatanganan", to: "/admin/digsig/penandatanganan" },
];

// COMPUTED
const filteredRows = computed(() => {
  let filtered = penandatanganDocuments.value || [];

  // Search
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    filtered = filtered.filter(
      (doc) =>
        doc.nomorDokumen?.toLowerCase().includes(searchLower) ||
        doc.perihal?.toLowerCase().includes(searchLower),
    );
  }

  // Status filter
  if (filterStatus.value) {
    filtered = filtered.filter(
      (doc) => doc.mySignerStatus === filterStatus.value,
    );
  }

  return filtered;
});

const paginatedRows = computed(() => {
  const start = (page.value - 1) * rowsPerPage.value;
  return filteredRows.value.slice(start, start + rowsPerPage.value);
});

const totalRows = computed(() => filteredRows.value.length);
const totalPages = computed(() =>
  Math.ceil(totalRows.value / rowsPerPage.value),
);
const startRow = computed(() =>
  totalRows.value === 0 ? 0 : (page.value - 1) * rowsPerPage.value + 1,
);
const endRow = computed(() =>
  Math.min(page.value * rowsPerPage.value, totalRows.value),
);
const hasNextPage = computed(() => page.value < totalPages.value);

// METHODS
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const selectFilterStatus = (item: { label: string; value: string }) => {
  filterStatus.value = item.value;
  openFilterStatus.value = false;
  page.value = 1;
};

const prevPage = () => {
  if (page.value > 1) page.value--;
};

const nextPage = () => {
  if (hasNextPage.value) page.value++;
};

const isUUID = (str: string) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const handleViewDetail = async (doc: PenandatangananDocument) => {
  if (!isUUID(doc.id)) {
    console.error("ID bukan UUID:", doc.id);
    alert("Data dokumen tidak valid");
    return;
  }

  openDetail.value = true;
  await fetchPenandatanganDetail(doc.id);
};

const handleOpenSign = (doc: PenandatangananDocument) => {
  selectedDoc.value = doc;
  openSign.value = true;
  selectedFile.value = null;
  passphrase.value = "";
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
  }
};
const viewDocument = (row: PenandatangananDocument) => {
  const url = row.signedFilePreviewUrl || row.filePreviewUrl;

  if (!url) {
    alert("Preview dokumen tidak tersedia");
    return;
  }

  window.open(url, "_blank");
};

const handleSign = async () => {
  if (!selectedFile.value || !passphrase.value || !selectedDoc.value) {
    alert("Mohon lengkapi file sertifikat dan passphrase");
    return;
  }

  loadingSign.value = true;
  try {
    await signDocument(selectedDoc.value.id, {
      file: selectedFile.value,
      passphrase: passphrase.value,
    });

    alert("Dokumen berhasil ditandatangani");
    openSign.value = false;
    selectedFile.value = null;
    passphrase.value = "";

    // Refresh data
    await fetchPenandatanganDocuments({
      page: page.value,
      limit: rowsPerPage.value,
    });
  } catch (err: any) {
    console.error("Sign error:", err);
    alert(err?.message || "Gagal menandatangani dokumen");
  } finally {
    loadingSign.value = false;
  }
};

const handleReject = (doc: PenandatangananDocument) => {
  itemToReject.value = doc;
  rejectReason.value = "";
  confirmRejectOpen.value = true;
};

const rejectNow = async () => {
  if (!itemToReject.value || !rejectReason.value) {
    alert("Mohon masukkan alasan penolakan");
    return;
  }

  loadingReject.value = true;
  try {
    await rejectDocument(itemToReject.value.id, rejectReason.value);
    alert("Dokumen berhasil ditolak");
    confirmRejectOpen.value = false;
    rejectReason.value = "";

    // Refresh data
    await fetchPenandatanganDocuments({
      page: page.value,
      limit: rowsPerPage.value,
    });
  } catch (err: any) {
    console.error("Reject error:", err);
    alert(err?.message || "Gagal menolak dokumen");
  } finally {
    loadingReject.value = false;
  }
};

// Close dropdown when clicking outside
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest("[data-custom-dropdown]")) {
    openFilterStatus.value = false;
  }
};

// LIFECYCLE
onMounted(async () => {
  document.addEventListener("click", handleClickOutside);

  console.log("🔍 Fetching penandatanganan documents...");
  await fetchPenandatanganDocuments({
    page: page.value,
    limit: rowsPerPage.value,
  });

  console.log("📊 Penandatanganan Documents:", penandatanganDocuments.value);
  console.log("📈 Meta:", penandatanganMeta.value);
  console.log("📉 Summary:", penandatanganSummary.value);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

// Watch page & rowsPerPage changes
watch([page, rowsPerPage], async () => {
  console.log("🔄 Page/RowsPerPage changed:", page.value, rowsPerPage.value);
  await fetchPenandatanganDocuments({
    page: page.value,
    limit: rowsPerPage.value,
  });
  console.log("📊 Updated Documents:", penandatanganDocuments.value);
});
</script>
