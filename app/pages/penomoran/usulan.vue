<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 pb-10">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Daftar Usulan Penomoran
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

        <!-- Filter button + dropdown -->
        <div class="relative inline-block">
          <button
            data-custom-dropdown
            class="flex items-center justify-between gap-2 bg-gray-100 text-xs px-3 py-1 rounded-lg min-w-[100px]"
            @click.stop="openFilterStatus = !openFilterStatus"
          >
            <span class="text-sm">
              {{ filterStatus || "Semua" }}
            </span>

            <svg
              :class="[
                'w-4 h-4 transition-transform duration-200',
                openFilterStatus ? 'rotate-180' : 'rotate-0',
              ]"
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
          </button>

          <!-- Dropdown -->
          <div
            v-if="openFilterStatus"
            data-custom-dropdown
            class="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in"
          >
            <button
              v-for="item in filterOptions"
              :key="item"
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
              @click.prevent="selectFilterStatus(item)"
            >
              {{ item }}
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
        <table class="min-w-max bg-white text-sm w-full">
          <thead class="bg-primary text-white">
            <tr>
              <th
                v-for="col in headers"
                :key="col.key"
                @click="col.sortable && sort(col.key)"
                :class="[
                  'px-5 py-3 text-left font-semibold tracking-wide whitespace-nowrap',
                  col.sortable
                    ? 'cursor-pointer select-none'
                    : 'cursor-default',
                ]"
              >
                <div class="flex items-center gap-1">
                  <span>{{ col.label }}</span>
                  <ArrowUpDown
                    v-if="col.sortable"
                    class="inline w-3 h-3 opacity-70"
                  />
                </div>
              </th>
              <th
                @click="sortStatus"
                class="sticky right-0 z-30 bg-primary text-white px-5 py-3 border-l border-gray-200 shadow-[inset_1px_0_1px_-1px_rgba(0,0,0,9)]"
              >
                <div class="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown class="inline w-3 h-3 opacity-70" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in paginatedRows"
              :key="row.id"
              class="group hover:bg-gray-50 cursor-pointer border-b border-gray-200 transition relative"
              @click.capture="openRowModal(row)"
            >
              <!-- ROW TOOLTIP -->
             
              <!-- <td class="px-5 py-4 text-xs">{{ row.id_usulan }}</td> -->
              <td class="px-5 py-4">{{ row.jenis }}</td>
              <td class="px-5 py-4">{{ row.tanggal }}</td>
              <td class="px-5 py-4">
                <div class="relative group max-w-[350px]">
                  <p
                    class="whitespace-normal break-words line-clamp-3 cursor-help"
                  >
                    {{ row.perihal }}
                  </p>
                </div>
              </td>
              <td class="px-5 py-4">
                <div class="relative group max-w-[300px]">
                  <p class="whitespace-normal break-words line-clamp-3">
                    {{ row.penandatangan }}
                  </p>
                </div>
              </td>
              <td class="px-5 py-4">{{ row.jumlah }}</td>
              <td class="px-5 py-4">{{ row.pengusul }}</td>
              <td class="px-5 py-4">{{ row.tglUsulan }}</td>

              <!-- <td
                @click.stop
                class="sticky right-0 z-20 bg-white px-5 py-3 shadow-[inset_8px_0_8px_-8px_rgba(0,0,0,0.25)]"
              > -->
              <td
                @click.stop
                class="sticky right-0 z-20 bg-white px-5 py-3 border-l border-gray-200 shadow-[inset_1px_0_1px_-1px_rgba(0,0,0,9)]"
              >
                <span
                  class="flex item-center gap-1 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                  :class="{
                    'bg-gray-200 text-gray-700 text-center':
                      row.status === 'Belum Diajukan',
                    'bg-yellow-100 text-yellow-700':
                      row.status === 'Menunggu Verifikasi',
                    'bg-green-100 text-green-700 text-center':
                      row.status === 'Disetujui',
                    'bg-red-100 text-red-700 text-center':
                      row.status === 'Ditolak',
                  }"
                >
                  {{ row.status }}
                </span>
                <td
                class="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition bg-gray-900 text-white text-xs px-3 py-1 rounded-md shadow-lg z-40 whitespace-nowrap"
              >
                Klik untuk lihat detail
              </td>
              </td>
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
            <!-- First page -->
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-gray-50 hover:bg-primary-50 hover:text-primary transition-all"
            >
              1
            </button>

            <!-- Left ellipsis -->
            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 text-sm"
            >
              ...
            </span>

            <!-- Visible pages -->
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

            <!-- Right ellipsis -->
            <span
              v-if="
                paginationPages[paginationPages.length - 1] < totalPages - 1
              "
              class="px-2 text-gray-400 text-sm"
            >
              ...
            </span>

            <!-- Last page -->
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

      <!-- MODAL TAMBAH -->
      <Teleport to="body">
        <AddUsulan
          v-model="openAdd"
          @submit="handleSubmitFromModal"
          @preview="handlePreview" :hideDefaultFooter="true"
        />
      </Teleport>
    </div>
  </div>

  <!-- MODAL ROW DETAIL -->
  <Teleport to="body">
    <Modal v-model="openDetail" :hideDefaultFooter="true" size="xl">
      <!-- TITLE -->
      <template #title>
        <div class="flex justify-between items-center w-full px-5 pt-6 pb-3">
          <h2 class="text-lg font-semibold uppercase">
            {{ selectedRow?.jenis_naskah || "Detail" }}
          </h2>
        </div>
      </template>

      <!-- BODY -->
      <div
        v-if="selectedRow"
        class="space-y-6 text-sm px-5 pb-3 max-h-[70vh] overflow-y-auto"
      >
        <!-- Judul Besar -->
        <p class="text-gray-900 font-semibold leading-relaxed text-base">
          {{ selectedRow.perihal }}
        </p>

        <!-- Tanggal -->
        <div class="pb-2 border-b border-gray-200">
          <p class="text-gray-500 text-xs">Tanggal</p>
          <p class="font-medium mt-1">{{ formatDate(selectedRow.tanggal) }}</p>
        </div>

        <!-- Penandatangan -->
        <div class="pb-2 border-b border-gray-200">
          <p class="text-gray-500 text-xs">Penandatangan</p>
          <p class="font-medium mt-1">{{ selectedRow.penandatangan }}</p>
        </div>

        <!-- Klasifikasi -->
        <div class="pb-2 border-b border-gray-200">
          <p class="text-gray-500 text-xs">Klasifikasi</p>
          <p class="font-medium mt-1">
            {{ selectedRow.klasifikasiDisplay || selectedRow.klasifikasi }}
          </p>
        </div>

        <!-- Jenis Naskah -->
        <div class="pb-2 border-b border-gray-200">
          <p class="text-gray-500 text-xs">Jenis Naskah</p>
          <p class="font-medium mt-1">{{ selectedRow.jenis_naskah }}</p>
        </div>

        <!-- Nomor Surat & File Upload Section -->
        <div class="mt-4">
          <label class="text-xs font-medium text-gray-700 mb-2 break-words">
            Nomor Surat ({{ selectedRow?.jumlah ?? 0 }} nomor)
          </label>

          <div
            v-if="
              Array.isArray(selectedRow.details) &&
              selectedRow.details.length > 0
            "
            class="space-y-4 mt-2"
          >
            <div
              v-for="(detail, idx) in selectedRow.details"
              :key="detail.id || idx"
              class="border border-gray-300 rounded-lg p-4 bg-gray-50"
            >
              <!-- Nomor surat dengan status badge -->
              <div class="flex items-center gap-2 mb-3">
                <div
                  class="flex-1 bg-white border border-gray-200 rounded-md px-3 py-2"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-mono text-gray-700">
                      {{ idx + 1 }}.
                      {{ detail.nomor || selectedRow.template_nomor || "-" }}
                    </span>

                    <!-- Status Badge -->
                    <span
                      v-if="detail.status"
                      :class="[
                        'px-2 py-1 rounded-lg text-xs font-medium',
                        {
                          'bg-yellow-100 text-yellow-700':
                            detail.status === 'booking',
                          'bg-green-100 text-green-700':
                            detail.status === 'terpakai',
                          'bg-red-100 text-red-700':
                            detail.status === 'ditolak',
                        },
                      ]"
                    >
                      {{ detail.status }}
                    </span>
                  </div>
                </div>

                <!-- Copy -->
                <button
                  v-if="detail.nomor"
                  @click="handleCopy(detail.nomor)"
                  class="p-2 rounded-lg hover:bg-gray-200 transition border border-gray-300 bg-white"
                >
                  <Copy class="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <!-- ================= FILE SECTION (FIXED) ================= -->
              <div class="mt-2 space-y-2">
                <!-- 1️⃣ ADA FILE (backend / lokal) -->
                <div
                  v-if="detail.file_name || filesByIndex[idx]"
                  class="flex items-center justify-between bg-white border border-green-200 hover:bg-green-50 rounded-md px-3 py-2"
                >
                  <a
                    :href="getFileUrl(detail, idx)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block transition rounded-md flex-1"
                  >
                    <div class="flex items-start gap-3">
                      <!-- FILE INFO -->
                      <div class="flex-1">
                        <p class="text-sm font-medium text-green-700 underline">
                          📄
                          {{ detail.file_name || filesByIndex[idx]?.name }}
                        </p>
                        <p class="text-xs text-gray-600">Klik untuk preview</p>
                      </div>
                    </div>
                  </a>

                  <!-- Remove button for local files only -->
                  <button
                    v-if="filesByIndex[idx] && !detail.file_name"
                    @click="removeFile(idx)"
                    class="ml-2 p-2 rounded-lg hover:bg-red-100 transition"
                  >
                    <svg
                      class="w-4 h-4 text-red-600"
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

                <!-- 2️⃣ BELUM ADA FILE & MASIH BISA UPLOAD -->
                <div
                  v-else-if="selectedRow?.status === 'Belum Diajukan'"
                  class="space-y-2"
                >
                  <label
                    class="w-full flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 rounded-md px-4 py-3 text-sm hover:bg-white hover:border-primary transition-all"
                  >
                    <svg
                      class="w-5 h-5 text-gray-400"
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

                    <div class="flex-1">
                      <span class="text-gray-700 font-medium block">
                        Pilih file (Opsional)
                      </span>
                      <span class="text-xs text-gray-500 block">
                        PDF, DOC, DOCX (Max 5MB)
                      </span>
                    </div>

                    <input
                      type="file"
                      class="hidden"
                      accept=".pdf,.doc,.docx"
                      @change="handleFile(idx, $event)"
                    />
                  </label>
                </div>

                <!-- 3️⃣ BELUM ADA FILE & TIDAK BISA UPLOAD -->
                <div
                  v-else
                  class="bg-yellow-50 border border-yellow-200 rounded-md p-2"
                >
                  <div class="flex items-center gap-2">
                    <svg
                      class="w-3 h-3 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>

                    <span class="text-xs text-yellow-800">
                      Belum ada file diupload
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- File upload warning -->
        <div
          v-if="selectedRow?.status === 'Belum Diajukan'"
          class="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2"
        >
          <svg
            class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div class="text-xs text-blue-800">
            <p class="font-medium">Upload file (opsional)</p>
            <p class="mt-1 text-blue-700">
              File harus dalam format PDF, DOC, atau DOCX. Usulan tetap dapat
              dikirim tanpa file.
            </p>
          </div>
        </div>

        <!-- Upload Progress Indicator -->
        <div
          v-if="isUploadingFiles"
          class="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div class="flex items-center gap-3">
            <div
              class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"
            ></div>
            <div class="flex-1">
              <p class="text-sm font-medium text-blue-900">
                Mengirim usulan...
              </p>
              <p class="text-xs text-blue-700">
                File sedang diupload ke server
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <template #footer>
        <div
          class="flex justify-between w-full gap-3 px-5 py-4 border-t border-gray-200"
        >
          <!-- Show Kirim button only if status is "Belum Diajukan" -->
          <button
            v-if="selectedRow?.status === 'Belum Diajukan'"
            @click="openConfirmSubmit = true"
            :disabled="isLoadingBooking || isDeletingUsulan || isUploadingFiles"
            class="flex-1 px-5 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <span v-if="isUploadingFiles">Mengirim...</span>
            <span v-else>Kirim Usulan</span>
          </button>

          <button
            @click="openConfirmDelete = true"
            :disabled="isLoadingBooking || isDeletingUsulan || isUploadingFiles"
            class="flex-1 px-5 py-2 text-sm border border-red-400 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Hapus Usulan
          </button>
        </div>
      </template>
    </Modal>
  </Teleport>

  <!-- CONFIRM SUBMIT POPUP -->
  <ConfirmPopup
    v-model="openConfirmSubmit"
    type="question"
    title="Kirim Usulan?"
    :message="getConfirmMessage()"
    confirm-text="Ya, Kirim"
    cancel-text="Batal"
    :is-loading="isLoadingBooking"
    @confirm="confirmSubmitUsulan"
    @cancel="openConfirmSubmit = false"
  />

  <!-- CONFIRM DELETE POPUP -->
  <ConfirmPopup
    v-model="openConfirmDelete"
    type="danger"
    title="Hapus Usulan?"
    message="Usulan yang dihapus tidak dapat dikembalikan. Apakah Anda yakin?"
    confirm-text="Ya, Hapus"
    cancel-text="Batal"
    :is-loading="isDeletingUsulan"
    @confirm="confirmDeleteUsulan"
    @cancel="openConfirmDelete = false"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { Search, ArrowUpDown, Plus, Copy } from "lucide-vue-next";
import AddUsulan from "~/components/AddUsulan.vue";
import Heading from "~/components/Heading.vue";
import PageHeader from "~/components/PageHeader.vue";
import { Modal } from "#components";
import { usePenomoran } from "~/composables/usePenomoran";
import { useAuth } from "~/composables/useAuth";
import ConfirmPopup from "~/components/ConfirmPopup.vue";

const { user, getProfile } = useAuth();
const {
  createUsulanDraft,
  deleteUsulanUser,
  getListUsulanByPosition,
  getPersonWithPosition,
  submitBooking,
  isLoadingBooking,
  getKlasifikasi,
} = usePenomoran();

const toast = useToast();
const config = useRuntimeConfig();
const apiBaseUrl = config.public.apiBase;

const openDetail = ref(false);
const isDeletingUsulan = ref(false);
const isUploadingFiles = ref(false);
const selectedRow = ref(null);
const rows = ref([]);
const loading = ref<boolean>(true);

// ✅ FIXED: File mapping dengan INDEX (bukan detail.id) karena backend pakai array
const filesByIndex = ref<Record<number, File>>({});

const openAdd = ref<boolean>(false);
const openConfirmDelete = ref(false);
const openConfirmSubmit = ref(false);

// Person mapping
const personMap = ref(new Map());
// Klasifikasi mapping untuk display
const klasifikasiMap = ref(new Map());

const fetchPersonMap = async () => {
  try {
    const response = await getPersonWithPosition();
    const list = Array.isArray(response) ? response : (response.data ?? []);

    list.forEach((item) => {
      const positionText = item.position_text || "";
      const subAreaText = item.sub_area_text || "";
      const displayText = subAreaText
        ? `${positionText} - ${subAreaText}`
        : positionText;

      personMap.value.set(item.persnum, {
        nama: item.nama,
        position_text: displayText,
      });
    });

    console.log("✅ Person map loaded:", personMap.value.size, "items");
  } catch (error) {
    console.error("❌ Error fetch person map:", error);
  }
};

// Fetch klasifikasi map untuk display
const fetchKlasifikasiMap = async () => {
  try {
    const response = await getKlasifikasi();

    if (Array.isArray(response)) {
      response.forEach((item) => {
        klasifikasiMap.value.set(item.code, item.display);
      });
    }

    console.log(
      "✅ Klasifikasi map loaded:",
      klasifikasiMap.value.size,
      "items",
    );
  } catch (error) {
    console.error("❌ Error fetch klasifikasi map:", error);
  }
};

// FETCH DATA
const fetchData = async () => {
  loading.value = true;

  try {
    if (!user.value?.position) {
      console.error("❌ User position not available");
      rows.value = [];
      return;
    }

    const data = await getListUsulanByPosition(String(user.value.position));

    if (!Array.isArray(data)) {
      rows.value = [];
      return;
    }

    rows.value = data.map((item) => {
      const pengusulInfo = personMap.value.get(item.persnum) || {};
      const klasifikasiDisplay =
        klasifikasiMap.value.get(item.klasifikasi) || item.klasifikasi;

      let mappedStatus = "Belum Diajukan";

      if (item.details?.length) {
        if (item.details.some((d) => d.status === "terpakai")) {
          mappedStatus = "Disetujui";
        } else if (item.details.some((d) => d.status === "booking")) {
          mappedStatus = "Menunggu Verifikasi";
        } else if (item.details.some((d) => d.status === "ditolak")) {
          mappedStatus = "Ditolak";
        }
      }

      const tanggalDate = new Date(item.tanggal);
      const formattedTanggal = `${String(tanggalDate.getUTCDate()).padStart(2, "0")}/${String(tanggalDate.getUTCMonth() + 1).padStart(2, "0")}/${tanggalDate.getUTCFullYear()}`;

      const createdDate = new Date(item.created_at);
      const wibTime = new Date(createdDate.getTime() + 7 * 60 * 60 * 1000);
      const tglUsulanTimestamp = wibTime.getTime();

      const day = String(wibTime.getDate()).padStart(2, "0");
      const month = String(wibTime.getMonth() + 1).padStart(2, "0");
      const year = String(wibTime.getFullYear()).slice(-2);
      const hours = String(wibTime.getHours()).padStart(2, "0");
      const minutes = String(wibTime.getMinutes()).padStart(2, "0");

      return {
        id: item.id,
        id_usulan: item.id,
        jenis: item.jenis,
        tanggal: formattedTanggal,
        perihal: item.perihal,
        jumlah: item.jumlah,
        penandatangan: item.penandatangan || "-",
        klasifikasi: item.klasifikasi || "-",
        klasifikasiDisplay,
        pengusul: pengusulInfo.nama || item.nama || user.value?.nama || "-",
        tglUsulan: `${day}/${month}/${year} ${hours}:${minutes}`,
        tglUsulanSort: tglUsulanTimestamp,
        status: mappedStatus,
        details: item.details || [],
        template_nomor: item.template_nomor || "",
      };
    });

    console.log("✅ Data loaded:", rows.value.length, "rows");
  } catch (err) {
    console.error("❌ Gagal fetch data:", err);
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

// OPEN ROW MODAL
const openRowModal = async (row) => {
  try {
    console.log("🔍 Opening row modal for:", row.id);

    const klasifikasiDisplay =
      klasifikasiMap.value.get(row.klasifikasi) || row.klasifikasi;

    const normalizedDetails = normalizeDetails(
      row.details || [],
      row.jumlah,
      row.template_nomor || "",
    );

    selectedRow.value = {
      id_usulan: row.id,
      jenis: row.jenis,
      jenis_naskah: row.jenis,
      tanggal: row.tanggal,
      perihal: row.perihal,
      jumlah: row.jumlah,
      penandatangan: row.penandatangan || "-",
      klasifikasi: row.klasifikasi || "-",
      klasifikasiDisplay,
      status: row.status,
      template_nomor: row.template_nomor || "",
      details: normalizedDetails,
    };

    // ✅ Reset file mapping
    filesByIndex.value = {};

    openDetail.value = true;
    console.log("✅ Modal opened with status:", selectedRow.value.status);
  } catch (err) {
    console.error("❌ Gagal load detail:", err);
    toast.add({
      title: "Gagal memuat detail",
      description: "Silakan coba lagi",
      color: "red",
    });
  }
};

// ✅ GET FILE URL - Helper function untuk construct URL yang benar
const getFileUrl = (detail, idx) => {
  // Prioritas: lokal file > file_url > construct dari file_text
  if (filesByIndex.value[idx]) {
    return URL.createObjectURL(filesByIndex.value[idx]);
  }

  if (detail.file_url) {
    return detail.file_url;
  }

  if (detail.file_text) {
    return `${apiBaseUrl}/${detail.file_text}`;
  }

  return "#";
};

// ✅ FIXED: HANDLE FILE UPLOAD berdasarkan INDEX
const handleFile = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  // Validasi ukuran file
  if (file.size > 5 * 1024 * 1024) {
    toast.add({
      title: "File terlalu besar",
      description: "Ukuran file maksimal 5MB",
      color: "red",
    });
    input.value = "";
    return;
  }

  // Validasi tipe file
  const validTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!validTypes.includes(file.type)) {
    toast.add({
      title: "Tipe file tidak valid",
      description: "Hanya file PDF, DOC, atau DOCX yang diperbolehkan",
      color: "red",
    });
    input.value = "";
    return;
  }

  // ✅ Simpan file berdasarkan INDEX
  filesByIndex.value[index] = file;

  console.log("📎 File disimpan untuk index:", index, "=>", file.name);

  toast.add({
    title: "File dipilih",
    description: `File "${file.name}" siap diupload`,
    color: "green",
  });
};

// ✅ Remove file berdasarkan index
const removeFile = (index: number) => {
  delete filesByIndex.value[index];
  toast.add({
    title: "File dihapus",
    description: "File berhasil dihapus dari daftar upload",
    color: "green",
  });
};

// JUMLAH SURAT
const normalizeDetails = (details: any[], jumlah: number, template: string) => {
  const result = [...(details || [])];

  while (result.length < jumlah) {
    result.push({
      id: `temp-${result.length + 1}`,
      nomor: null,
      status: "booking",
      file_name: null,
      file_url: null,
    });
  }

  return result.slice(0, jumlah);
};

// HANDLE COPY
const handleCopy = (value: string) => {
  if (!value) return;

  navigator.clipboard.writeText(value);

  toast.add({
    title: "Tersalin",
    description: `Nomor surat "${value}" berhasil disalin.`,
    color: "success",
    icon: "i-lucide-copy",
  });
};

// HANDLE PREVIEW
function handlePreview(data: any) {
  selectedRow.value = data;
  openAdd.value = false;
  openDetail.value = true;

  // Reset file mapping
  filesByIndex.value = {};
}

// ✅ GET CONFIRM MESSAGE - Dynamic message based on files
const getConfirmMessage = () => {
  const fileCount = Object.keys(filesByIndex.value).length;

  if (fileCount === 0) {
    return "Apakah Anda yakin ingin mengirim usulan ini tanpa file? Usulan akan dikirim untuk diverifikasi.";
  }

  return `Apakah Anda yakin ingin mengirim usulan ini dengan ${fileCount} file? Usulan akan dikirim untuk diverifikasi.`;
};

// ✅ FIXED: SUBMIT USULAN sesuai format backend (file, file_name, file_text)
const confirmSubmitUsulan = async () => {
  if (!selectedRow.value) return;

  isUploadingFiles.value = true;

  try {
    const formData = new FormData();
    let fileCount = 0;

    // ✅ Loop berdasarkan INDEX untuk match dengan backend
    Object.keys(filesByIndex.value).forEach((indexStr) => {
      const index = parseInt(indexStr);
      const file = filesByIndex.value[index];

      if (file instanceof File) {
        fileCount++;

        // ✅ SESUAI FORMAT BACKEND:
        // - file (array of files)
        // - file_name (array of file names)
        // - file_text (array of file names - for text field)
        formData.append("file", file);
        formData.append("file_name", file.name);
        formData.append("file_text", file.name);

        console.log(`📎 Appending file at index ${index}:`, file.name);
      }
    });

    console.log("📦 Total files to upload:", fileCount);
    console.log("📦 FormData entries:");
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1] instanceof File ? pair[1].name : pair[1]);
    }

    await submitBooking(selectedRow.value.id_usulan, formData);

    openConfirmSubmit.value = false;
    openDetail.value = false;

    toast.add({
      title: "Berhasil",
      description:
        fileCount > 0
          ? `Usulan dikirim dengan ${fileCount} file`
          : "Usulan dikirim tanpa file",
      color: "green",
    });

    filesByIndex.value = {};
    await fetchData();
  } catch (e) {
    console.error("❌ Submit error:", e);
    openConfirmSubmit.value = false;

    toast.add({
      title: "Gagal",
      description: e?.response?.data?.message || "Gagal mengirim usulan",
      color: "red",
    });
  } finally {
    isUploadingFiles.value = false;
  }
};

// CONFIRM DELETE USULAN
const confirmDeleteUsulan = async () => {
  if (!selectedRow.value?.id_usulan) return;

  const idToDelete = selectedRow.value.id_usulan;
  isDeletingUsulan.value = true;

  try {
    await deleteUsulanUser(idToDelete);

    toast.add({
      title: "Berhasil",
      description: "Usulan berhasil dihapus",
      color: "green",
    });

    openConfirmDelete.value = false;
    openDetail.value = false;

    await fetchData();
  } catch (error) {
    console.error("❌ Delete gagal:", error);
    toast.add({
      title: "Gagal",
      description: "Gagal menghapus usulan. Silakan coba lagi.",
      color: "red",
    });
  } finally {
    isDeletingUsulan.value = false;
  }
};

// HANDLE SUBMIT FROM MODAL
const isSubmittingUsulan = ref(false);
const handleSubmitFromModal = async (payload: any) => {
  if (isSubmittingUsulan.value) return;
  isSubmittingUsulan.value = true;

  try {
    console.log("📤 Payload diterima dari modal:", payload);

    if (
      !payload.tanggal ||
      !payload.jenis ||
      !payload.klasifikasi ||
      !payload.perihal ||
      !payload.jumlah
    ) {
      toast.add({
        title: "Data Tidak Lengkap",
        description: "Pastikan semua field terisi",
        color: "yellow",
      });
      return;
    }

    const dateObj = new Date(payload.tanggal);
    const formattedDate = dateObj.toISOString().split("T")[0];

    const formattedPayload = {
      position_id: Number(user.value?.position),
      tanggal: formattedDate,
      jenis: String(payload.jenis),
      klasifikasi: String(payload.klasifikasi),
      perihal: String(payload.perihal),
      penandatangan: String(payload.penandatangan),
      id_position_penandatangan: Number(payload.id_position_penandatangan),
      jumlah: Number(payload.jumlah),
    };

    console.log("📦 Formatted payload:", formattedPayload);

    const response = await createUsulanDraft(formattedPayload);

    // ✅ OPTIMISTIC UPDATE
    const newRow = {
      id: response.id || Date.now(),
      id_usulan: response.id || Date.now(),
      jenis: formattedPayload.jenis,
      tanggal: new Date(formattedPayload.tanggal).toLocaleDateString("id-ID"),
      perihal: formattedPayload.perihal,
      jumlah: formattedPayload.jumlah,
      penandatangan: formattedPayload.penandatangan,
      klasifikasi: formattedPayload.klasifikasi,
      klasifikasiDisplay:
        klasifikasiMap.value.get(formattedPayload.klasifikasi) ||
        formattedPayload.klasifikasi,
      pengusul: user.value?.nama || "-",
      tglUsulan: new Date().toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      tglUsulanSort: Date.now(),
      status: "Belum Diajukan",
    };

    rows.value.unshift(newRow);

    sortBy.value = "tglUsulan";
    sortDir.value = "desc";
    filterStatus.value = "Semua";
    search.value = "";
    currentPage.value = 1;

    toast.add({
      title: "Berhasil",
      description: "Usulan berhasil ditambahkan",
      color: "green",
    });

    openAdd.value = false;

    setTimeout(() => fetchData(), 1000);
  } catch (err) {
    console.error("❌ Error submit modal:", err);

    toast.add({
      title: "Gagal",
      description:
        err?.response?.data?.message || err?.message || "Usulan gagal dikirim",
      color: "red",
    });
  } finally {
    isSubmittingUsulan.value = false;
  }
};

// FORMAT DATE
const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// Close dropdown when click outside
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const dropdownEls = document.querySelectorAll("[data-custom-dropdown]");
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) return;
  }
  openFilterStatus.value = false;
}

// INIT
onMounted(async () => {
  loading.value = true;

  if (!user.value) {
    await getProfile();
  }

  await fetchKlasifikasiMap();
  await fetchPersonMap();
  await fetchData();

  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});

/* Breadcrumb */
const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Usulan", to: "/penomoran/usulan" },
];

/* TABLE CONFIG */
const headers = [
  // { label: "ID Usulan", key: "id_usulan", sortable: true },
  { label: "Jenis", key: "jenis", sortable: true },
  { label: "Tanggal", key: "tanggal", sortable: true },
  { label: "Perihal", key: "perihal", sortable: false },
  { label: "Penandatangan", key: "penandatangan", sortable: false },
  { label: "Jumlah", key: "jumlah", sortable: false },
  { label: "Pengusul", key: "pengusul", sortable: false },
  { label: "Tgl Usulan", key: "tglUsulan", sortable: true },
];

/* SORT STATUS */
const sortStatus = () => {
  if (sortBy.value === "status") {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = "status";
    sortDir.value = "asc";
  }
};

const statusOrder = {
  "Belum Diajukan": 1,
  "Menunggu Verifikasi": 2,
  Disetujui: 3,
  Ditolak: 4,
};

const filterOptions = [
  "Semua",
  "Belum Diajukan",
  "Menunggu Verifikasi",
  "Disetujui",
  "Ditolak",
];

const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const search = ref<string>("");
const currentPage = ref<number>(1);

/* SORT STATE */
const sortBy = ref<string>("tglUsulan");
const sortDir = ref<"asc" | "desc">("desc");

const sort = (col: string) => {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = col;
    sortDir.value = "asc";
  }
};

/* STATUS FILTER */
const filterStatus = ref<string>("Semua");
const openFilterStatus = ref<boolean>(false);
const selectFilterStatus = (val: string) => {
  filterStatus.value = val;
  openFilterStatus.value = false;
};

/* FILTER + SEARCH */
const filteredRows = computed(() => {
  const s = search.value.toLowerCase();
  const fs = filterStatus.value;

  return rows.value.filter((r) => {
    if (!r || typeof r !== "object") return false;

    const matchSearch = Object.values(r).some((v) =>
      String(v ?? "")
        .toLowerCase()
        .includes(s),
    );

    const matchStatus = fs === "Semua" || r.status === fs;
    return matchSearch && matchStatus;
  });
});

/* SORT */
const sortedRows = computed(() => {
  return [...filteredRows.value].sort((a, b) => {
    if (sortBy.value === "status") {
      const A = statusOrder[a.status] ?? 99;
      const B = statusOrder[b.status] ?? 99;
      return sortDir.value === "asc" ? A - B : B - A;
    }

    if (sortBy.value === "tglUsulan") {
      const A = a.tglUsulanSort ?? 0;
      const B = b.tglUsulanSort ?? 0;
      return sortDir.value === "asc" ? A - B : B - A;
    }

    const A = String(a[sortBy.value] ?? "").toLowerCase();
    const B = String(b[sortBy.value] ?? "").toLowerCase();

    if (A < B) return sortDir.value === "asc" ? -1 : 1;
    if (A > B) return sortDir.value === "asc" ? 1 : -1;
    return 0;
  });
});

/* PAGINATION */
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
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
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

/* WATCHERS */
watch([search, rowsPerPage, sortBy, sortDir, filterStatus], () => {
  currentPage.value = 1;
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
</style>
