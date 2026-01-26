<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 pb-10">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Daftar Penomoran Dokumen
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- ADD BUTTON -->
      <button
        @click="openAdd = true"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        Tambah
      </button>
    </div>

    <!-- CARD -->
    <div class="bg-white shadow-lg rounded-xl w-full">
      <!-- TOP BAR -->
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 pt-3 mb-4 pr-3"
      >
        <!-- Rows dropdown -->
        <div class="flex items-center gap-2 px-4 py-2">
          <select
            v-model="rowsPerPage"
            class="border text-xs border-gray-300 bg-white rounded-md px-2 py-1"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">
              {{ n }}
            </option>
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
      <div v-else class="overflow-x-auto relative">
        <table class="w-full bg-white text-sm">
          <thead class="bg-primary text-white text-[15px] sticky top-0 z-10">
            <tr>
              <th
                v-for="col in headers"
                :key="col.key"
                @click="col.sortable && sort(col.key)"
                :class="[
                  'px-5 py-3 text-left font-semibold tracking-wide whitespace-nowrap bg-primary',
                  col.sortable
                    ? 'cursor-pointer select-none'
                    : 'cursor-default',
                ]"
              >
                <div class="flex items-center gap-1">
                  <span>{{ col.label }}</span>

                  <!-- ICON SLOT (SELALU ADA, TAPI INVISIBLE JIKA TIDAK SORTABLE) -->
                  <span class="w-3 h-3 inline-flex items-center justify-center">
                    <ArrowUpDown
                      v-if="col.sortable"
                      class="w-3 h-3 opacity-70"
                    />
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in paginatedRows"
              :key="row.id_request"
              class="hover:bg-gray-50 cursor-pointer border-b border-gray-200 transition"
              @mousemove="onRowMouseMove($event, 'Klik untuk lihat detail ')"
              @mouseleave="onRowMouseLeave"
              @click="openRowModal(row)"
            >
              <td class="px-5 py-4">{{ row.jenis }}</td>
              <td class="px-5 py-4">{{ row.jabatan }}</td>
              <td class="px-5 py-4">
                <div class="relative group max-w-[250px]">
                  <p class="whitespace-normal break-words line-clamp-3">
                    {{ row.perihal }}
                  </p>
                </div>
              </td>

              <!-- Tampilkan nomor dalam satu cell -->
              <td class="px-5 py-4">
                <div class="flex flex-col gap-0.5">
                  <div class="text-sm text-gray-900">{{ row.tanggal }}</div>
                  <div class="text-xs text-gray-600 space-y-0.5">
                    <div
                      v-for="(nomor, idx) in row.nomor_list.slice(0, 3)"
                      :key="idx"
                    >
                      {{ nomor }}
                    </div>
                    <div
                      v-if="row.nomor_list.length > 3"
                      class="text-primary font-medium"
                    >
                      +{{ row.nomor_list.length - 3 }} nomor lainnya
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="relative group max-w-[300px]">
                  <p class="whitespace-normal break-words line-clamp-3">
                    {{ row.pengusul }}
                  </p>
                </div>
              </td>
              <td class="px-5 py-4">{{ row.waktu }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="filteredRows.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200"
      >
        <div class="text-xs text-gray-600">
          Menampilkan {{ paginatedRows.length }} dari
          {{ filteredRows.length }} data
        </div>

        <div class="flex items-center gap-2">
          <!-- Back Button -->
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

          <!-- Page Numbers -->
          <div class="flex items-center gap-1">
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary transition-all"
            >
              1
            </button>

            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 text-sm"
            >
              ...
            </span>

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

            <span
              v-if="
                paginationPages[paginationPages.length - 1] < totalPages - 1
              "
              class="px-2 text-gray-400 text-sm"
            >
              ...
            </span>

            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 hover:bg-primary-50 hover:text-primary transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <!-- Next Button -->
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
    <!-- FILE PREVIEW SLIDEOVER -->
    <USlideover
      v-model:open="isOpenPreviewFile"
      title="Pratinjau Dokumen"
      side="bottom"
      :dismissible="true"
      :ui="{
        content: 'h-screen max-h-screen',
        body: 'p-0 h-full',
      }"
      class="z-[9999]"
    >
      <template #body>
        <div class="h-full w-full bg-gray-100">
          <iframe
            v-if="previewPdfUrl"
            :key="previewPdfUrl"
            :src="previewPdfUrl"
            allowfullscreen
            class="w-full h-full border-0"
          />
        </div>
      </template>
    </USlideover>

    <!-- COMPONENT ADD USULAN -->
    <Teleport to="body">
      <AddUsulan v-model="openAdd" @submit="handleSubmitFromModal" />
    </Teleport>
  </div>

  <!-- MODAL DETAIL -->
  <Teleport to="body">
    <Modal
      v-model="openPreview"
      :hideDefaultFooter="true"
      size="xl"
      class="z-[9000]"
    >
      <template #title>
        <div class="flex items-center justify-between w-full">
          <h2 class="p-3 ml-1 text-xl font-bold text-gray-900">
            Detail Penomoran
          </h2>
        </div>
      </template>

      <div class="px-3 pb-6">
        <!-- Loading state -->
        <div v-if="loadingDetail" class="space-y-3">
          <div class="w-full h-8 bg-gray-200 animate-pulse rounded-md"></div>
          <div class="w-full h-8 bg-gray-200 animate-pulse rounded-md"></div>
          <div class="w-full h-8 bg-gray-200 animate-pulse rounded-md"></div>
        </div>

        <template v-else-if="detailData">
          <!-- INFO GRID -->
          <div class="gap-4 mb-2 space-y-6 overflow-y-auto text-sm">
            <!-- Judul (Full Width) -->
            <div class="md:col-span-2">
              <template v-if="!isEditingTitle">
                <div class="flex items-start justify-between gap-4 mb-2">
                  <p class="text-lg font-semibold text-gray-900 flex-1">
                    {{ detailData.perihal }}
                  </p>
                  <button
                    @click="startEditTitle"
                    class="text-primary text-sm flex items-center gap-1 hover:underline flex-shrink-0"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit
                  </button>
                </div>
              </template>
              <template v-else>
                <div class="flex gap-2">
                  <input
                    v-model="editedTitle"
                    class="flex-1 border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    @click="saveTitle"
                    class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition text-sm"
                  >
                    Simpan
                  </button>
                  <button
                    @click="cancelEditTitle"
                    class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                  >
                    Batal
                  </button>
                </div>
              </template>
            </div>

            <!-- Tanggal -->
            <div class="pb-2 border-b border-gray-200">
              <p class="text-gray-500 text-xs">Tanggal</p>
              <p class="font-medium mt-1">
                {{ formatTanggalWIB(detailData.tanggal) }}
              </p>
            </div>

            <!-- Penandatangan -->
            <div class="pb-2 border-b border-gray-200">
              <p class="text-gray-500 text-xs">Penandatangan</p>
              <p class="font-medium mt-1">
                {{ detailData.jabatan }}
              </p>
            </div>

            <!-- Klasifikasi -->
            <div class="pb-2 border-b border-gray-200">
              <p class="text-gray-500 text-xs">Klasifikasi</p>
              <p class="font-medium mt-1">
                {{ detailData.klasifikasiDisplay || detailData.klasifikasi }}
              </p>
            </div>

            <!-- Jenis Naskah -->
            <div class="pb-2 border-b border-gray-200">
              <p class="text-gray-500 text-xs">Jenis Naskah</p>
              <p class="font-medium mt-1">
                {{ detailData.jenis }}
              </p>
            </div>
          </div>

          <!-- NOMOR SURAT SECTION -->
          <div class="pt-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-l font-semibold text-gray-900">
                Nomor Surat
                <span class="text-sm font-normal text-gray-500">
                  ({{ detailData.nomor_list?.length || 0 }} nomor)
                </span>
              </h4>
            </div>

            <div
              v-if="detailData.nomor_list && detailData.nomor_list.length > 0"
              class="space-y-4"
            >
              <div
                v-for="(item, idx) in detailData.nomor_list"
                :key="item.id || `nomor-${idx}`"
                class="border border-gray-300 bg-gray-50 rounded-lg p-4 hover:shadow-md transition"
              >
                <!-- HEADER -->
                <div class="flex items-center gap-3 mb-3">
                  <div
                    class="flex-1 bg-white border border-gray-200 rounded-md px-4 py-2"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-mono text-sm">
                        {{ idx + 1 }}. {{ item.nomor }}
                      </span>

                      <!-- STATUS -->
                      <span
                        :class="[
                          'px-3 py-1 rounded-full text-xs font-medium',
                          getStatusClass(item),
                        ]"
                      >
                        {{ getStatusLabel(item) }}
                      </span>
                    </div>
                  </div>

                  <!-- COPY -->
                  <button
                    @click="handleCopy(item.nomor)"
                    class="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                </div>

                <!-- FILE AREA -->
                <div>
                  <!-- FILE PREVIEW (jika ada file dan tidak sedang replace) -->
                  <div
                    v-if="item.file_name && !fileStates[item.id]?.isReplacing"
                    class="bg-green-50 border border-green-200 rounded-md p-3 cursor-pointer hover:bg-green-100 transition"
                    @click="previewFile(item)"
                  >
                    <p class="text-sm font-medium text-green-700 underline">
                      📄 {{ item.file_name }}
                    </p>
                    <p class="text-xs text-gray-600">Klik untuk preview</p>
                  </div>

                  <!-- FILE INPUT (saat upload atau replace) -->
                  <div v-if="fileStates[item.id]?.isReplacing" class="mt-3">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      @change="handleFileSelect(item.id, $event)"
                      class="block w-full text-sm border rounded-lg p-2"
                    />
                    <p class="text-xs text-gray-500 mt-1">
                      Max 10MB - PDF, DOC, DOCX
                    </p>
                  </div>
                </div>

                <!-- ACTION BUTTONS -->
                <div class="flex gap-2 mt-3">
                  <!-- UPLOAD (jika belum ada file dan status bukan hangus) -->
                  <button
                    v-if="
                      !item.file_name &&
                      item.status !== 'hangus' &&
                      !fileStates[item.id]?.isReplacing
                    "
                    @click="startUploadFile(item.id)"
                    class="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition"
                  >
                    Upload File
                  </button>

                  <!-- GANTI FILE (jika sudah ada file, status terpakai atau terpakai_final) -->
                  <button
                    v-if="
                      item.file_name &&
                      (item.status === 'terpakai' ||
                        item.status === 'terpakai_final') &&
                      !fileStates[item.id]?.isReplacing
                    "
                    @click="startReplacingFile(item.id)"
                    class="flex-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                  >
                    Ganti File
                  </button>

                  <!-- SAVE / CANCEL (saat sedang upload/replace) -->
                  <template v-if="fileStates[item.id]?.isReplacing">
                    <button
                      @click="saveFile(item.id)"
                      :disabled="
                        !fileStates[item.id]?.file ||
                        fileStates[item.id]?.isUploading
                      "
                      :class="[
                        'flex-1 px-4 py-2 rounded-lg transition',
                        !fileStates[item.id]?.file ||
                        fileStates[item.id]?.isUploading
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700',
                      ]"
                    >
                      {{
                        fileStates[item.id]?.isUploading
                          ? "Uploading..."
                          : "Simpan"
                      }}
                    </button>
                    <button
                      @click="cancelReplacing(item.id)"
                      :disabled="fileStates[item.id]?.isUploading"
                      class="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      Batal
                    </button>
                  </template>

                  <!-- HANGUS (selalu ada kecuali status sudah hangus atau sedang upload) -->
                  <button
                    v-if="
                      item.status !== 'hangus' &&
                      !fileStates[item.id]?.isReplacing
                    "
                    @click.stop="confirmHangusNomor(item.id)"
                    class="flex-1 px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    Hangus
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </Modal>
  </Teleport>

  <!-- CONFIRM HANGUS POPUP -->
  <ConfirmPopup
    v-model="openConfirmHangus"
    type="danger"
    title="Hanguskan Nomor?"
    message="Nomor yang dihanguskan tidak dapat digunakan kembali. Apakah Anda yakin?"
    confirm-text="Ya, Hanguskan"
    cancel-text="Batal"
    :is-loading="isHangusing"
    @confirm="executeHangusNomor"
  />
  <!-- TOOLTIP -->
  <Teleport to="body">
    <div
      v-if="tooltip.show"
      class="fixed z-[9999] pointer-events-none bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg"
      :style="{
        left: tooltip.x + 'px',
        top: tooltip.y + 'px',
      }"
    >
      {{ tooltip.text }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Search, ArrowUpDown, Plus, Copy } from "lucide-vue-next";
import AddUsulan from "~/components/AddUsulan.vue";
import Heading from "~/components/Heading.vue";
import PageHeader from "~/components/PageHeader.vue";
import { Modal } from "#components";
import ConfirmPopup from "~/components/ConfirmPopup.vue";
import { useToast } from "#imports";
import { usePenomoran } from "~/composables/usePenomoran";

const toast = useToast();
const config = useRuntimeConfig();

// Composable
const {
  createPenomoranFinal,
  getPersonWithPosition,
  getKlasifikasi,
  getDetailNomor,
  uploadDetailFile,
  hangusDetailNomor,
} = usePenomoran();
const { get } = useApi();

// State
const klasifikasiMap = ref(new Map());
const personMap = ref(new Map());
const loading = ref<boolean>(true);
const loadingDetail = ref<boolean>(false);
const openAdd = ref<boolean>(false);
const openPreview = ref(false);
const openConfirmHangus = ref(false);
const isHangusing = ref(false);
const selectedRow = ref(null);
const detailData = ref(null);
const rows = ref<any[]>([]);
const selectedDetailId = ref<string | null>(null);

// File states per detail ID
const fileStates = ref<Record<string, any>>({});

// Edit title
const isEditingTitle = ref(false);
const editedTitle = ref("");

// Table config
const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const search = ref<string>("");
const currentPage = ref<number>(1);
const sortBy = ref<string>("created_at");
const sortDir = ref<"asc" | "desc">("desc");
const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Penomoran", to: "/admin/penomoran" },
];

const headers = [
  { label: "Jenis", key: "jenis", sortable: true },
  { label: "Penandatangan", key: "jabatan", sortable: false },
  { label: "Perihal", key: "perihal", sortable: false },
  { label: "Tanggal & Nomor", key: "tanggal", sortable: true },
  { label: "Pengusul", key: "pengusul", sortable: false },
  { label: "Waktu", key: "waktu", sortable: true },
];

// ==================== STATUS LOGIC ====================
/**
 * LOGIKA STATUS BARU:
 * - "booking" => nomor sudah digenerate, belum ada file
 * - "terpakai" => file sudah ada dari halaman verifikasi
 * - "terpakai_final" => file di-upload/ganti di halaman ini (penomoran)
 * - "hangus" => nomor sudah dihanguskan
 */
const getStatusLabel = (item: any): string => {
  if (item.status === "hangus") return "Hangus";
  if (item.status === "terpakai_final") return "Final";
  if (item.status === "terpakai") return "Terpakai";
  if (item.status === "booking") return "Booking";
  return "Booking";
};

const getStatusClass = (item: any): string => {
  if (item.status === "hangus") return "bg-red-100 text-red-800";
  if (item.status === "terpakai_final") return "bg-green-100 text-green-800";
  if (item.status === "terpakai") return "bg-blue-100 text-blue-800";
  if (item.status === "booking") return "bg-yellow-100 text-yellow-800";
  return "bg-yellow-100 text-yellow-800";
};

// ==================== DATE FUNCTIONS ====================
const WIB_OFFSET = 7 * 60 * 60 * 1000;

function toWIB(dateStr: string) {
  const utcDate = new Date(dateStr);
  return new Date(utcDate.getTime() + WIB_OFFSET);
}

function formatTanggalWIB(dateStr: string) {
  if (!dateStr) return "-";
  const wib = toWIB(dateStr);
  const day = String(wib.getDate()).padStart(2, "0");
  const month = String(wib.getMonth() + 1).padStart(2, "0");
  const year = wib.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatWaktuWIB(dateStr: string) {
  if (!dateStr) return "-";
  const wib = toWIB(dateStr);
  const day = String(wib.getDate()).padStart(2, "0");
  const month = String(wib.getMonth() + 1).padStart(2, "0");
  const year = String(wib.getFullYear()).slice(-2);
  const hours = String(wib.getHours()).padStart(2, "0");
  const minutes = String(wib.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes} WIB`;
}

function getWIBTimestamp(dateStr: string) {
  return toWIB(dateStr).getTime();
}

// ==================== FETCH MASTER DATA ====================
const fetchKlasifikasiMap = async () => {
  try {
    const response = await getKlasifikasi();
    if (Array.isArray(response)) {
      response.forEach((item) => {
        klasifikasiMap.value.set(item.code, item.display);
      });
    }
  } catch (error) {
    console.error("❌ Error fetch klasifikasi map:", error);
  }
};

const fetchPersonMap = async () => {
  try {
    const response = await getPersonWithPosition();
    const list = Array.isArray(response) ? response : (response.data ?? []);
    list.forEach((item) => {
      personMap.value.set(item.persnum, {
        nama: item.nama,
        position_text: item.position_text,
      });
    });
  } catch (error) {
    console.error("❌ Error fetch person map:", error);
  }
};

const getFileUrl = (filePath: string) => {
  return `${config.public.apiBaseUrl}/${filePath}`;
};

// ===== PREVIEW STATE =====

const isOpenPreviewFile = ref(false);
const previewPdfUrl = ref<string | null>(null);
const previewFile = async (item: any) => {
  const fileUrl =
    item.file_url || (item.file_text ? getFileUrl(item.file_text) : null);

  if (!fileUrl) {
    toast.add({
      title: "File tidak ditemukan",
      description: "File tidak tersedia untuk ditampilkan",
      color: "yellow",
    });
    return;
  }

  try {
    openPreview.value = false;

    // Reset preview state
    previewPdfUrl.value = null;
    isOpenPreviewFile.value = false;

    const res = await fetch(fileUrl, {
      headers: { Accept: "application/pdf" },
    });

    const blob = await res.blob();

    previewPdfUrl.value = URL.createObjectURL(
      new Blob([blob], { type: "application/pdf" }),
    );

    // SLIDEOVER
    isOpenPreviewFile.value = true;
  } catch (err) {
    console.error("❌ Error preview file:", err);
    toast.add({
      title: "Gagal membuka file",
      description: "File tidak dapat dipratinjau",
      color: "red",
    });
  }
};

const startUploadFile = (detailId: string) => {
  fileStates.value[detailId] = {
    isReplacing: true,
    isUploading: false,
    file: null,
  };
};

const startReplacingFile = (detailId: string) => {
  fileStates.value[detailId] = {
    isReplacing: true,
    isUploading: false,
    file: null,
  };
};

const handleFileSelect = (detailId: string, event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      toast.add({
        title: "File terlalu besar",
        description: "Ukuran file maksimal 10MB",
        color: "red",
      });
      return;
    }
    fileStates.value[detailId].file = file;
  }
};

const saveFile = async (detailId: string) => {
  const state = fileStates.value[detailId];
  if (!state?.file) {
    toast.add({
      title: "Pilih file",
      description: "Silakan pilih file terlebih dahulu",
      color: "yellow",
    });
    return;
  }

  state.isUploading = true;

  try {
    console.log(`📤 Uploading file for detail ID: ${detailId}`);

    // Hit endpoint - ini akan mengubah status menjadi 'terpakai_final'
    const result = await uploadDetailFile(detailId, state.file);

    console.log("✅ Upload result:", result);

    // Update local state - preserve semua data dari backend
    const target = detailData.value?.nomor_list?.find(
      (n: any) => n.id === detailId,
    );

    if (target) {
      target.file_name = result?.file_name || state.file.name;
      target.file_text = result?.file_text || null;
      target.file_url = result?.file_url || null;
      target.status = result?.status || "terpakai_final"; // Status dari backend
    }

    // Clear file state
    delete fileStates.value[detailId];

    toast.add({
      title: "Berhasil",
      description: "File berhasil diupload, status menjadi Final",
      color: "green",
    });

    // Refresh list untuk sync dengan backend
    await refreshList();
  } catch (error) {
    console.error("❌ Error upload file:", error);
  } finally {
    state.isUploading = false;
  }
};

const cancelReplacing = (detailId: string) => {
  delete fileStates.value[detailId];
};

// ==================== HANGUS FUNCTIONS ====================
const confirmHangusNomor = (detailId: string) => {
  selectedDetailId.value = detailId;
  openConfirmHangus.value = true;
};

const executeHangusNomor = async () => {
  if (!selectedDetailId.value) return;

  isHangusing.value = true;

  try {
    console.log(`🗑️ Hangus nomor for detail ID: ${selectedDetailId.value}`);

    await hangusDetailNomor(selectedDetailId.value);

    // Update local state
    const target = detailData.value?.nomor_list?.find(
      (n: any) => n.id === selectedDetailId.value,
    );

    if (target) {
      target.status = "hangus";
    }

    openConfirmHangus.value = false;
    selectedDetailId.value = null;

    toast.add({
      title: "Berhasil",
      description: "Nomor berhasil dihanguskan",
      color: "green",
    });

    // Refresh list
    await refreshList();
  } catch (error: any) {
    console.error("❌ Error hangus nomor:", error);
  } finally {
    isHangusing.value = false;
  }
};

// ==================== EDIT TITLE ====================
function startEditTitle() {
  if (!detailData.value) return;
  editedTitle.value = detailData.value.perihal;
  isEditingTitle.value = true;
}

function cancelEditTitle() {
  isEditingTitle.value = false;
  editedTitle.value = "";
}

function saveTitle() {
  if (!detailData.value) return;
  detailData.value.perihal = editedTitle.value;
  isEditingTitle.value = false;
  toast.add({
    title: "Berhasil",
    description: "Judul berhasil diperbarui",
    color: "green",
  });
}

// ==================== COPY FUNCTION ====================
const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value);
  toast.add({
    title: "Tersalin",
    description: `Nomor surat "${value}" berhasil disalin.`,
    color: "success",
  });
};

// ==================== TABLE FUNCTIONS ====================
const sort = (col: string) => {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = col;
    sortDir.value = "asc";
  }
};

// Grouping duplicate rows by id_request
function groupDuplicateRows(dataArray) {
  const grouped = new Map();

  dataArray.forEach((item) => {
    const key = item.id_request;

    if (grouped.has(key)) {
      const existing = grouped.get(key);
      existing.nomor_list.push(item.nomor);
    } else {
      const klasifikasiDisplay =
        klasifikasiMap.value.get(item.klasifikasi) || item.klasifikasi;

      grouped.set(key, {
        id_request: item.id_request,
        jenis: item.jenis,
        jabatan: item.jabatan || "-",
        perihal: item.perihal || "-",
        pengusul: item.nama_pengirim || "-",
        klasifikasi: item.klasifikasi || "-",
        klasifikasiDisplay: klasifikasiDisplay,
        nomor_list: [item.nomor],
        tanggal: formatTanggalWIB(item.tanggal),
        waktu: formatWaktuWIB(item.waktu),
        created_at: getWIBTimestamp(item.waktu),
      });
    }
  });

  return Array.from(grouped.values());
}

// Get list nomor
const getListNomor = async () => {
  try {
    const res = await get("/nomor");

    if (!res?.success || !Array.isArray(res.data)) return [];

    return groupDuplicateRows(res.data);
  } catch (error) {
    console.error("❌ Error fetch data nomor:", error);
    toast.add({
      title: "Gagal memuat data",
      description: "Tidak dapat mengambil data penomoran",
      color: "red",
    });
    return [];
  }
};

const openRowModal = async (row) => {
  selectedRow.value = row;
  openPreview.value = true;
  loadingDetail.value = true;
  detailData.value = null;
  fileStates.value = {}; // Reset file states

  try {
    const detail = await getDetailNomor(row.id_request);

    if (!detail) {
      throw new Error("Detail tidak ditemukan");
    }

    const klasifikasiDisplay =
      klasifikasiMap.value.get(detail?.klasifikasi || row.klasifikasi) ||
      detail?.klasifikasi ||
      row.klasifikasi;

    const nomorList = (detail?.nomor_list || []).map((item, idx) => ({
      id: item.id || `${row.id_request}-${idx}`,
      nomor: item.nomor,
      status: item.status || "booking", // booking, terpakai, terpakai_final, hangus
      file_name: item.file_name || null, // PRESERVE file_name
      file_text: item.file_text || null, // PRESERVE file_text
      file_url: item.file_url || null, // PRESERVE file_url
    }));

    detailData.value = {
      ...(detail || row),
      klasifikasiDisplay,
      nomor_list: nomorList,
    };

    console.log("✅ Detail loaded:", detailData.value);
    console.log("✅ Nomor list with status:", nomorList);
  } catch (err) {
    console.error("❌ Error loading detail:", err);

    // Fallback ke data row jika gagal
    detailData.value = {
      ...row,
      klasifikasiDisplay:
        klasifikasiMap.value.get(row.klasifikasi) || row.klasifikasi,
      nomor_list: row.nomor_list.map((nomor, idx) => ({
        id: `${row.id_request}-${idx}`,
        nomor: typeof nomor === "string" ? nomor : nomor.nomor,
        status: "booking",
        file_name: null,
        file_text: null,
        file_url: null,
      })),
    };
  } finally {
    loadingDetail.value = false;
  }
};

// ==================== HANDLE SUBMIT ====================
const handleSubmitFromModal = async (payload) => {
  try {
    const response = await createPenomoranFinal(payload);
    await refreshList();
    currentPage.value = 1;
    toast.add({
      title: "Berhasil",
      description: "Data penomoran berhasil ditambahkan",
      color: "green",
    });
  } catch (error) {
    console.error("❌ Error di handleSubmitFromModal:", error);
    toast.add({
      title: "Gagal",
      description: "Terjadi kesalahan saat menyimpan data",
      color: "red",
    });
  }
};

// Refresh list
const refreshList = async () => {
  loading.value = true;
  const data = await getListNomor();
  rows.value = data.sort((a, b) => b.created_at - a.created_at);
  loading.value = false;
};

// ==================== COMPUTED PROPERTIES ====================
const filteredRows = computed(() => {
  return rows.value.filter((row) => {
    const matchesSearch =
      row.jenis?.toLowerCase().includes(search.value.toLowerCase()) ||
      row.jabatan?.toLowerCase().includes(search.value.toLowerCase()) ||
      row.perihal?.toLowerCase().includes(search.value.toLowerCase()) ||
      row.pengusul?.toLowerCase().includes(search.value.toLowerCase());

    return matchesSearch;
  });
});

const sortedRows = computed(() => {
  return [...filteredRows.value].sort((a, b) => {
    if (sortBy.value === "waktu" || sortBy.value === "tanggal") {
      const A = a.created_at ?? 0;
      const B = b.created_at ?? 0;
      return sortDir.value === "asc" ? A - B : B - A;
    }

    const A = String(a[sortBy.value] ?? "").toLowerCase();
    const B = String(b[sortBy.value] ?? "").toLowerCase();

    if (A < B) return sortDir.value === "asc" ? -1 : 1;
    if (A > B) return sortDir.value === "asc" ? 1 : -1;
    return 0;
  });
});

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedRows.value.slice(start, start + rowsPerPage.value);
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedRows.value.length / rowsPerPage.value)),
);

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 2) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 1) {
      pages.push(total - 2, total - 1, total);
    } else {
      pages.push(current - 1, current, current + 1);
    }
  }

  return pages;
});

// ======= WATCHERS ==========
watch([search, rowsPerPage], () => {
  currentPage.value = 1;
});

// ======== MOUNTED ============
onMounted(async () => {
  loading.value = true;
  await fetchKlasifikasiMap();
  await fetchPersonMap();
  const data = await getListNomor();
  rows.value = data;
  loading.value = false;
});
// ========= TOOLTIP ===========
const tooltip = ref({
  show: false,
  text: "",
  x: 0,
  y: 0,
});
const onRowMouseMove = (e: MouseEvent, text: string) => {
  const offset = 12;
  const maxX = window.innerWidth - 200;
  const maxY = window.innerHeight - 40;

  tooltip.value = {
    show: true,
    text,
    x: Math.min(e.clientX + offset, maxX),
    y: Math.min(e.clientY + offset, maxY),
  };
};

const onRowMouseLeave = () => {
  tooltip.value.show = false;
};
watch(isOpenPreviewFile, (open) => {
  if (!open && previewPdfUrl.value) {
    URL.revokeObjectURL(previewPdfUrl.value);
    previewPdfUrl.value = null;
  }
});
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.15s ease-out;
}

thead th:last-child {
  z-index: 11;
}

tbody tr:hover td:last-child {
  background-color: rgb(249 250 251);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
