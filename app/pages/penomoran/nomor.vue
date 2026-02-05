<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 dark:bg-gray-900 pb-10">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-gray-100">
          Daftar Penomoran Dokumen
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- ADD BUTTON -->
      <button
        @click="openAdd = true"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        Tambah
      </button>
    </div>

    <!-- CARD -->
    <div class="bg-white dark:bg-gray-800 shadow-lg rounded-xl w-full">
      <!-- TOP BAR -->
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 pt-3 mb-4 pr-3"
      >
        <!-- Rows dropdown -->
        <div class="flex items-center gap-2 px-4 py-2">
          <select
            v-model="limit"
            @change="handleLimitChange"
            class="border text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md px-2 py-1"
          >
            <option v-for="n in rowsChoices" :key="n" :value="n">
              {{ n }}
            </option>
          </select>
        </div>

        <!-- SEARCH -->
        <div class="relative flex-1 w-full md:w-56">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="searchQuery"
            @input="handleSearchInput"
            placeholder="Cari..."
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs pl-9 pr-3 py-1.5 rounded-lg dark:text-gray-200 dark:placeholder-gray-400"
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
        v-else-if="rows.length === 0"
        class="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400"
      >
        <p class="text-sm font-medium">Data tidak ditemukan</p>
      </div>

      <!-- TABLE -->
      <div v-else class="overflow-x-auto relative">
        <table class="w-full bg-white dark:bg-gray-800 text-sm">
          <thead
            class="bg-primary dark:bg-primary-800 text-white text-[15px] sticky top-0 z-10"
          >
            <tr>
              <th
                v-for="col in headers"
                :key="col.key"
                @click="col.sortable && handleSort(col.key)"
                :class="[
                  'px-5 py-3 text-left font-semibold tracking-wide whitespace-nowrap bg-primary dark:bg-primary-800',
                  col.sortable
                    ? 'cursor-pointer select-none hover:bg-primary-700 dark:hover:bg-primary-900'
                    : 'cursor-default',
                ]"
              >
                <div class="flex items-center gap-1">
                  <span>{{ col.label }}</span>
                  <span class="w-3 h-3 inline-flex items-center justify-center">
                    <ArrowUpDown
                      v-if="col.sortable"
                      :class="[
                        'w-3 h-3 transition-all',
                        sortBy === col.key
                          ? 'opacity-100 text-yellow-300'
                          : 'opacity-50',
                        sortBy === col.key && sortOrder === 'desc'
                          ? 'rotate-180'
                          : 'rotate-0',
                      ]"
                    />
                  </span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in rows"
              :key="row.id_request"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 transition dark:text-gray-200"
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

              <!-- ✅ Tampilkan tanggal sekali dan semua nomor di bawahnya -->
              <td class="px-5 py-4">
                <div class="flex flex-col gap-0.5">
                  <div class="text-sm font-medium">{{ row.tanggal }}</div>
                  <div
                    class="text-xs text-gray-600 dark:text-gray-200 font-mono"
                  >
                    <div
                      v-for="(nomor, idx) in row.nomor_list.slice(0, 3)"
                      :key="idx"
                    >
                      {{ nomor }}
                    </div>
                    <div
                      v-if="row.nomor_list.length > 3"
                      class="text-primary font-medium dark:hover:bg-gray-700"
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
              <td class="px-5 py-4 dark:hover:bg-gray-700">{{ row.waktu }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="pagination && pagination.total > 0 && rows.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          Menampilkan {{ paginationStart }} - {{ paginationEnd }} dari
          {{ pagination.total }} data
        </div>

        <div class="flex items-center gap-2">
          <!-- Back Button -->
          <button
            @click="goToPage((pagination.current_page || pagination.page) - 1)"
            :disabled="(pagination.current_page || pagination.page) === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              (pagination.current_page || pagination.page) === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
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
            <!-- First page -->
            <button
              v-if="paginationPages.length > 0 && paginationPages[0] > 1"
              @click="goToPage(1)"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all dark:text-gray-200"
            >
              1
            </button>

            <!-- Left ellipsis -->
            <span
              v-if="paginationPages.length > 0 && paginationPages[0] > 2"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <!-- Visible pages -->
            <button
              v-for="page in paginationPages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                (pagination.current_page || pagination.page) === page
                  ? 'bg-primary dark:bg-primary-700 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400',
              ]"
            >
              {{ page }}
            </button>

            <!-- Right ellipsis -->
            <span
              v-if="
                paginationPages.length > 0 &&
                paginationPages[paginationPages.length - 1] <
                  (pagination.total_pages || pagination.totalPages) - 1
              "
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <!-- Last page -->
            <button
              v-if="
                paginationPages.length > 0 &&
                paginationPages[paginationPages.length - 1] <
                  (pagination.total_pages || pagination.totalPages)
              "
              @click="goToPage(pagination.total_pages || pagination.totalPages)"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all dark:text-gray-200"
            >
              {{ pagination.total_pages || pagination.totalPages }}
            </button>
          </div>

          <!-- Next Button -->
          <button
            @click="goToPage((pagination.current_page || pagination.page) + 1)"
            :disabled="
              (pagination.current_page || pagination.page) ===
              (pagination.total_pages || pagination.totalPages)
            "
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              (pagination.current_page || pagination.page) ===
              (pagination.total_pages || pagination.totalPages)
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20',
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
      :ui="{ content: 'h-screen max-h-screen', body: 'p-0 h-full' }"
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

    <!-- ADD USULAN -->
    <Teleport to="body">
      <AddUsulan v-model="openAdd" @submit="handleSubmitFromModal" />
    </Teleport>
  </div>

  <!-- MODAL DETAIL - z-index 8000 to be below toast (9000+) -->
  <Teleport to="body">
    <Modal
      v-model="openPreview"
      :hideDefaultFooter="true"
      size="xl"
      class="z-[8000]"
    >
      <template #title>
        <div class="flex items-center justify-between w-full">
          <h2
            class="p-3 ml-1 text-xl font-bold text-gray-900 dark:text-gray-100"
          >
            Detail Penomoran
          </h2>
        </div>
      </template>

      <div class="px-3 pb-6">
        <div v-if="loadingDetail" class="space-y-3">
          <div
            class="w-full h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"
          ></div>
          <div
            class="w-full h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"
          ></div>
          <div
            class="w-full h-8 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"
          ></div>
        </div>

        <template v-else-if="detailData">
          <div class="gap-4 mb-2 space-y-6 overflow-y-auto text-sm">
            <div class="md:col-span-2">
              <template v-if="!isEditingTitle">
                <div class="flex items-start justify-between gap-4 mb-2">
                  <p
                    class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1"
                  >
                    {{ detailData.perihal }}
                  </p>
                  <button
                    @click="startEditTitle"
                    class="text-primary dark:text-primary-400 text-sm flex items-center gap-1 hover:underline flex-shrink-0"
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
                    class="flex-1 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                  />
                  <button
                    @click="saveTitle"
                    class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-800 transition text-sm"
                  >
                    Simpan
                  </button>
                  <button
                    @click="cancelEditTitle"
                    class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
                  >
                    Batal
                  </button>
                </div>
              </template>
            </div>

            <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400 text-xs">Tanggal</p>
              <p class="font-medium mt-1 dark:text-gray-200">
                {{ formatTanggalWIB(detailData.tanggal) }}
              </p>
            </div>

            <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400 text-xs">
                Penandatangan
              </p>
              <p class="font-medium mt-1 dark:text-gray-200">
                {{ detailData.jabatan }}
              </p>
            </div>

            <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400 text-xs">
                Klasifikasi
              </p>
              <p class="font-medium mt-1 dark:text-gray-200">
                {{ detailData.klasifikasiDisplay || detailData.klasifikasi }}
              </p>
            </div>

            <div class="pb-2 border-b border-gray-200 dark:border-gray-700">
              <p class="text-gray-500 dark:text-gray-400 text-xs">
                Jenis Naskah
              </p>
              <p class="font-medium mt-1 dark:text-gray-200">
                {{ detailData.jenis }}
              </p>
            </div>
          </div>

          <!-- NOMOR SURAT SECTION -->
          <div class="pt-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-l font-semibold text-gray-900 dark:text-gray-100">
                Nomor Surat
                <span
                  class="text-sm font-normal text-gray-500 dark:text-gray-400"
                >
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
                class="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:shadow-md transition"
              >
                <div class="flex items-center gap-3 mb-3">
                  <div
                    class="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-4 py-2"
                  >
                    <div class="flex justify-between items-center">
                      <span class="font-mono text-sm dark:text-gray-200"
                        >{{ idx + 1 }}. {{ item.nomor }}</span
                      >
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
                  <button
                    @click="handleCopy(item.nomor)"
                    class="p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Copy class="w-4 h-4 dark:text-gray-300" />
                  </button>
                </div>

                <div>
                  <div
                    v-if="item.file_name && !fileStates[item.id]?.isReplacing"
                    class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                    @click="previewFile(item)"
                  >
                    <p
                      class="text-sm font-medium text-green-700 dark:text-green-400 underline"
                    >
                      📄 {{ item.file_name }}
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">
                      Klik untuk preview
                    </p>
                  </div>

                  <div v-if="fileStates[item.id]?.isReplacing" class="mt-3">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      @change="handleFileSelect(item.id, $event)"
                      class="block w-full text-sm border dark:border-gray-600 rounded-lg p-2 dark:bg-gray-700 dark:text-gray-200"
                    />
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Max 10MB - PDF, DOC, DOCX
                    </p>
                  </div>
                </div>

                <div class="flex gap-2 mt-3">
                  <!-- Upload button - tampil jika tidak ada file dan status terpakai/booking -->
                  <button
                    v-if="
                      !item.file_name &&
                      (item.status === 'terpakai' ||
                        item.status === 'booking') &&
                      !fileStates[item.id]?.isReplacing
                    "
                    @click="startUploadFile(item.id)"
                    class="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition"
                  >
                    Upload File
                  </button>

                  <!-- Ganti File button - tampil jika sudah ada file dan status terpakai/terpakai_final -->
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

                  <button
                    v-if="
                      (item.status === 'terpakai' ||
                        item.status === 'terpakai_final') &&
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

  <!-- CONFIRM HANGUS - z-index 8500 to be below toast but above modal -->
  <ConfirmPopup
    v-model="openConfirmHangus"
    type="danger"
    title="Hanguskan Nomor?"
    message="Nomor yang dihanguskan tidak dapat digunakan kembali. Apakah Anda yakin?"
    confirm-text="Ya, Hanguskan"
    cancel-text="Batal"
    :is-loading="isHangusing"
    @confirm="executeHangusNomor"
    class="z-[8500]"
  />

  <!-- TOOLTIP -->
  <Teleport to="body">
    <div
      v-if="tooltip.show"
      class="fixed z-[9999] pointer-events-none bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
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

const {
  createPenomoranFinal,
  getDetailNomor,
  uploadDetailFile,
  hangusDetailNomor,
  getListNomor,
  refreshTrigger, // ✅ Get refresh trigger
} = usePenomoran();
const loading = ref<boolean>(true);
const loadingDetail = ref<boolean>(false);
const openAdd = ref<boolean>(false);
const openPreview = ref(false);
const openConfirmHangus = ref(false);
const isHangusing = ref(false);
const selectedRow = ref(null);
const detailData = ref(null);
const rows = ref<any[]>([]);
const pagination = ref<any>(null);
const selectedDetailId = ref<string | null>(null);
const fileStates = ref<Record<string, any>>({});
const isEditingTitle = ref(false);
const editedTitle = ref("");

// Pagination & Search params - aligned with API documentation
const searchQuery = ref<string>("");
const limit = ref<number>(10);
const currentPage = ref<number>(1);
const sortBy = ref<string>("");
const sortOrder = ref<"asc" | "desc">("desc");

const rowsChoices = [5, 10, 20, 50];

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Penomoran", to: "/penomoran/nomor" },
];

const headers = [
  { label: "Jenis", key: "jenis", sortable: true },
  { label: "Penandatangan", key: "jabatan", sortable: false },
  { label: "Perihal", key: "perihal", sortable: false },
  { label: "Tanggal & Nomor", key: "tanggal", sortable: true },
  { label: "Pengusul", key: "pengusul", sortable: false },
  { label: "Waktu", key: "waktu", sortable: true },
];

// ✅ Watch refresh trigger untuk auto refetch
watch(refreshTrigger, () => {
  console.log("🔄 Auto refetch triggered by upload/hangus");
  fetchData();

  // ✅ Jika modal detail terbuka, refetch detail juga
  if (openPreview.value && selectedRow.value) {
    openRowModal(selectedRow.value);
  }
});

// ✅ Computed for pagination display: "Menampilkan X - Y dari Z data"
const paginationStart = computed(() => {
  if (!pagination.value || !pagination.value.total || rows.value.length === 0)
    return 0;
  const currentPage =
    pagination.value.current_page || pagination.value.page || 1;
  const itemsPerPage = pagination.value.limit || limit.value || 10;
  return (currentPage - 1) * itemsPerPage + 1;
});

const paginationEnd = computed(() => {
  if (!pagination.value || !pagination.value.total || rows.value.length === 0)
    return 0;
  const currentPage =
    pagination.value.current_page || pagination.value.page || 1;
  const itemsPerPage = pagination.value.limit || limit.value || 10;
  const end = currentPage * itemsPerPage;
  return Math.min(end, pagination.value.total);
});

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
  const hours = String(wib.getHours()).padStart(2, "0");
  const minutes = String(wib.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

const getFileUrl = (filePath: string) => {
  return `${config.public.apiBaseUrl}/${filePath}`;
};

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
    previewPdfUrl.value = null;
    isOpenPreviewFile.value = false;

    const res = await fetch(fileUrl, {
      headers: { Accept: "application/pdf" },
    });

    const blob = await res.blob();
    previewPdfUrl.value = URL.createObjectURL(
      new Blob([blob], { type: "application/pdf" }),
    );

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
    const result = await uploadDetailFile(detailId, state.file);

    const target = detailData.value?.nomor_list?.find(
      (n: any) => n.id === detailId,
    );

    if (target) {
      target.file_name = result?.file_name || state.file.name;
      target.file_text = result?.file_text || null;
      target.file_url = result?.file_url || null;
      // ✅ Status changes to terpakai_final ONLY after file upload
      target.status = result?.status || "terpakai_final";
    }

    delete fileStates.value[detailId];

    // ✅ usePenomoran akan auto trigger refetch via triggerRefresh()
  } catch (error) {
    console.error("❌ Error upload file:", error);
  } finally {
    state.isUploading = false;
  }
};

const cancelReplacing = (detailId: string) => {
  delete fileStates.value[detailId];
};

const confirmHangusNomor = (detailId: string) => {
  selectedDetailId.value = detailId;
  openConfirmHangus.value = true;
};

const executeHangusNomor = async () => {
  if (!selectedDetailId.value) return;

  isHangusing.value = true;

  try {
    await hangusDetailNomor(selectedDetailId.value);

    const target = detailData.value?.nomor_list?.find(
      (n: any) => n.id === selectedDetailId.value,
    );

    if (target) {
      target.status = "hangus";
    }

    openConfirmHangus.value = false;
    selectedDetailId.value = null;

    // ✅ usePenomoran akan auto trigger refetch via triggerRefresh()
  } catch (error: any) {
    console.error("❌ Error hangus nomor:", error);
  } finally {
    isHangusing.value = false;
  }
};

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

const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value);
  toast.add({
    title: "Tersalin",
    description: `Nomor surat "${value}" berhasil disalin.`,
    color: "success",
  });
};

const handleSort = (col: string) => {
  // ✅ Map frontend column names to backend field names per API documentation
  const columnMapping: Record<string, string> = {
    jenis: "jenis",
    tanggal: "tanggal",
    waktu: "waktu", // Maps to created_at in backend
  };

  const backendColumn = columnMapping[col] || col;

  if (sortBy.value === backendColumn) {
    // Toggle sort order if clicking same column
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    // New column, set to asc
    sortBy.value = backendColumn;
    sortOrder.value = "asc";
  }

  console.log(`🔄 Sort changed: ${sortBy.value} ${sortOrder.value}`);

  currentPage.value = 1; // Reset to first page when sorting changes
  fetchData();
};

const handleLimitChange = () => {
  currentPage.value = 1;
  fetchData();
};

let searchTimeout: any = null;
const handleSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchData();
  }, 500);
};

const goToPage = (page: number) => {
  if (!pagination.value) return;

  const totalPages =
    pagination.value.total_pages || pagination.value.totalPages || 1;

  if (page < 1 || page > totalPages) return;

  currentPage.value = page;
  fetchData();
};

function groupDuplicateRows(dataArray) {
  const grouped = new Map();

  dataArray.forEach((item) => {
    const key = item.id_request;

    if (grouped.has(key)) {
      const existing = grouped.get(key);
      existing.nomor_list.push(item.nomor);
    } else {
      grouped.set(key, {
        id_request: item.id_request,
        jenis: item.jenis,
        jabatan: item.jabatan || "-",
        perihal: item.perihal || "-",
        pengusul: item.nama_pengirim || "-",
        klasifikasi: item.klasifikasi || "-",
        klasifikasiDisplay: item.klasifikasi || "-", // ✅ Langsung dari API
        nomor_list: [item.nomor],
        tanggal: formatTanggalWIB(item.tanggal),
        waktu: formatWaktuWIB(item.waktu),
      });
    }
  });

  return Array.from(grouped.values());
}

const fetchData = async () => {
  loading.value = true;

  try {
    // ✅ Build params according to API documentation for GET /nomor
    const params: any = {
      page: currentPage.value,
      limit: limit.value,
    };

    if (searchQuery.value) {
      params.search = searchQuery.value;
    }

    if (sortBy.value) {
      params.sort_by = sortBy.value;
      params.sort_order = sortOrder.value;
    }

    console.log("📤 Fetching with params:", params);

    const response = await getListNomor(params);

    console.log("📥 Response received:", response);

    if (response?.data && Array.isArray(response.data)) {
      console.log("📦 Raw data count from API:", response.data.length);

      rows.value = groupDuplicateRows(response.data);
      pagination.value = response.pagination || null;

      console.log("✅ Rows processed (after grouping):", rows.value.length);
      console.log("✅ Pagination set:", pagination.value);
      console.log("📊 Limit setting:", limit.value);
      console.log("📄 Expected rows per page:", limit.value);
    } else {
      console.warn("⚠️ No data in response");
      rows.value = [];
      pagination.value = null;
    }
  } catch (error) {
    console.error("❌ Error fetch data:", error);
    toast.add({
      title: "Gagal memuat data",
      description: "Tidak dapat mengambil data penomoran",
      color: "red",
    });
    rows.value = [];
    pagination.value = null;
  } finally {
    loading.value = false;
  }
};

const openRowModal = async (row) => {
  selectedRow.value = row;
  openPreview.value = true;
  loadingDetail.value = true;
  detailData.value = null;
  fileStates.value = {};

  try {
    const detail = await getDetailNomor(row.id_request);

    if (!detail) {
      throw new Error("Detail tidak ditemukan");
    }

    const nomorList = (detail?.nomor_list || []).map((item, idx) => ({
      id: item.id || `${row.id_request}-${idx}`,
      nomor: item.nomor,
      // ✅ Status dari backend: terpakai (setelah create), terpakai_final (setelah upload file)
      status: item.status || "terpakai",
      file_name: item.file_name || null,
      file_text: item.file_text || null,
      file_url: item.file_url || null,
    }));

    detailData.value = {
      ...(detail || row),
      klasifikasiDisplay: detail?.klasifikasi || row.klasifikasi, // ✅ Langsung dari API
      nomor_list: nomorList,
    };

    console.log("✅ Detail loaded:", detailData.value);
  } catch (err) {
    console.error("❌ Error loading detail:", err);

    detailData.value = {
      ...row,
      klasifikasiDisplay: row.klasifikasi, // ✅ Langsung dari row
      nomor_list: row.nomor_list.map((nomor, idx) => ({
        id: `${row.id_request}-${idx}`,
        nomor: typeof nomor === "string" ? nomor : nomor.nomor,
        status: "terpakai",
        file_name: null,
        file_text: null,
        file_url: null,
      })),
    };
  } finally {
    loadingDetail.value = false;
  }
};

const handleSubmitFromModal = async (payload) => {
  try {
    const response = await createPenomoranFinal(payload);

    console.log("✅ Data berhasil ditambahkan:", response);

    // ✅ Reset pagination and sorting to show newest data first
    currentPage.value = 1;
    sortBy.value = "waktu"; // Sort by created_at/waktu
    sortOrder.value = "desc"; // Newest first

    // ✅ Clear search to show all data
    searchQuery.value = "";

    // ✅ usePenomoran akan auto trigger refetch via triggerRefresh()
    // Tapi tetap panggil fetchData untuk memastikan UI update
    await fetchData();

    toast.add({
      title: "Berhasil",
      description: `Berhasil menambahkan ${response?.data?.nomor_list?.length || payload.jumlah} nomor baru`,
      color: "green",
    });
  } catch (error) {
    console.error("❌ Error di handleSubmitFromModal:", error);
    toast.add({
      title: "Gagal",
      description:
        error?.response?.data?.message ||
        "Terjadi kesalahan saat menyimpan data",
      color: "red",
    });
  }
};

// ✅ Improved pagination pages calculation
const paginationPages = computed(() => {
  if (!pagination.value) return [];

  // Handle both camelCase (totalPages) and snake_case (total_pages)
  const total =
    pagination.value.total_pages || pagination.value.totalPages || 0;
  const current = pagination.value.current_page || pagination.value.page || 1;

  if (total === 0) return [];

  const pages: number[] = [];

  if (total <= 9) {
    // ✅ Show all pages if 9 or fewer (increased from 7)
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    // ✅ Show current page with 3 pages on each side (increased from 2)
    let start = Math.max(2, current - 3);
    let end = Math.min(total - 1, current + 3);

    // Adjust if we're near the start
    if (current <= 4) {
      end = 7; // Show pages 2-7
    }

    // Adjust if we're near the end
    if (current >= total - 3) {
      start = total - 6; // Show last 7 pages (excluding first and last)
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }

  return pages;
});

onMounted(async () => {
  loading.value = true;

  // Set default sort to show newest data first
  sortBy.value = "waktu";
  sortOrder.value = "desc";

  // Fetch initial data
  await fetchData();
  loading.value = false;
});

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
