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
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-xs transition"
      >
        <Plus class="w-4 h-4" />
        Tambah Usulan
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
          <span class="text-xs text-gray-600">Tampilkan</span>
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
        <table class="min-w-max bg-white text-sm">
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
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="row in paginatedRows"
              :key="row.id_usulan"
              class="hover:bg-gray-50 cursor-pointer border-b border-gray-200 transition"
              @click="openRowModal(row)"
            >
              <td class="px-5 py-4 text-xs">{{ row.id_usulan }}</td>
              <td class="px-5 py-4">{{ row.jenis }}</td>
              <td class="px-5 py-4">{{ row.tanggal }}</td>
              <td class="px-5 py-4">
                <div class="relative group max-w-[350px]">
                  <p
                    class="whitespace-normal break-words line-clamp-3 cursor-help"
                  >
                    {{ row.perihal }}
                  </p>

                  <!-- Tooltip -->
                  <div
                    class="absolute z-50 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md px-3 py-2 mt-2 w-max max-w-xs shadow-lg"
                  >
                    {{ row.perihal }}
                  </div>
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

              <td class="px-5 py-3">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-medium',
                    {
                      'bg-gray-200 text-gray-700':
                        row.status === 'Belum Diajukan',
                      'bg-yellow-100 text-yellow-700':
                        row.status === 'Menunggu Verifikasi',
                      'bg-green-100 text-green-700': row.status === 'Disetujui',
                      'bg-red-100 text-red-700': row.status === 'Ditolak',
                    },
                  ]"
                >
                  {{ row.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="filteredRows.length > 0"
        class="flex items-center justify-between p-4"
      >
        <div class="text-xs text-gray-600">
          Menampilkan {{ paginatedRows.length }} dari
          {{ filteredRows.length }} data
        </div>

        <div class="flex items-center gap-1">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="px-3 py-1 text-xs rounded-md hover:bg-gray-100 disabled:opacity-30"
          >
            &lt;
          </button>

          <button
            v-for="page in totalPages"
            :key="page"
            @click="currentPage = page"
            :class="[
              'px-3 py-1 text-xs rounded-md',
              currentPage === page
                ? 'bg-primary text-white'
                : 'hover:bg-gray-200',
            ]"
          >
            {{ page }}
          </button>

          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 text-xs rounded-md hover:bg-gray-100 disabled:opacity-30"
          >
            &gt;
          </button>
        </div>
      </div>

      <!-- MODAL TAMBAH -->
      <AddUsulan
        v-model="openAdd"
        @submit="handleSubmitFromModal"
        @preview="handlePreview"
      />
    </div>
  </div>

  <!-- MODAL ROW DETAIL -->
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
    <div v-if="selectedRow" class="space-y-6 text-sm px-5 pb-3">
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
        <label class="text-xs font-medium text-gray-700 mb-2 block">
          Nomor Surat
        </label>

        <div
          v-if="Array.isArray(selectedRow.nomor_surat)"
          class="space-y-4 mt-2"
        >
          <div
            v-for="(no, idx) in selectedRow.nomor_surat"
            :key="idx"
            class="border border-gray-300 rounded-lg p-4 bg-gray-50"
          >
            <!-- Nomor surat dengan copy button -->
            <div class="flex items-center gap-2 mb-3">
              <div
                class="flex-1 bg-white border border-gray-200 rounded-md px-3 py-2"
              >
                <span class="text-sm font-mono text-gray-700">
                  {{ idx + 1 }}. {{ no }}
                </span>
              </div>

              <button
                @click="handleCopy(no)"
                class="p-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center border border-gray-300 bg-white"
                title="Copy nomor surat"
              >
                <Copy class="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <!-- Upload file area -->
            <div class="relative">
              <label
                class="w-full flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 rounded-md px-4 py-3 text-sm hover:bg-white hover:border-primary transition-all group"
              >
                <svg
                  class="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors"
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
                    {{ file[idx]?.name || "Pilih file untuk diupload" }}
                  </span>
                  <span class="text-xs text-gray-500 mt-0.5 block">
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

              <!-- File info if uploaded -->
              <div
                v-if="file[idx]"
                class="mt-2 flex items-center justify-between bg-white border border-green-200 rounded-md px-3 py-2"
              >
                <div class="flex items-center gap-2">
                  <svg
                    class="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span class="text-xs text-gray-700">
                    {{ file[idx].name }} ({{ formatFileSize(file[idx].size) }})
                  </span>
                </div>
                <button
                  @click.prevent="removeFile(idx)"
                  class="text-red-500 hover:text-red-700 text-xs"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Single nomor surat -->
        <div v-else class="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <!-- Nomor surat dengan copy button -->
          <div class="flex items-center gap-2 mb-3">
            <div
              class="flex-1 bg-white border border-gray-200 rounded-md px-3 py-2"
            >
              <span class="text-sm font-mono text-gray-700">
                1. {{ selectedRow.nomor_surat }}
              </span>
            </div>

            <button
              @click="handleCopy(selectedRow.nomor_surat)"
              class="p-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center border border-gray-300 bg-white"
              title="Copy nomor surat"
            >
              <Copy class="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <!-- Upload file area -->
          <div class="relative">
            <label
              class="w-full flex items-center gap-3 cursor-pointer border-2 border-dashed border-gray-300 rounded-md px-4 py-3 text-sm hover:bg-white hover:border-primary transition-all group"
            >
              <svg
                class="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors"
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
                  {{ file[0]?.name || "Pilih file untuk diupload" }}
                </span>
                <span class="text-xs text-gray-500 mt-0.5 block">
                  PDF, DOC, DOCX (Max 5MB)
                </span>
              </div>

              <input
                type="file"
                class="hidden"
                accept=".pdf,.doc,.docx"
                @change="handleFile(0, $event)"
              />
            </label>

            <!-- File info if uploaded -->
            <div
              v-if="file[0]"
              class="mt-2 flex items-center justify-between bg-white border border-green-200 rounded-md px-3 py-2"
            >
              <div class="flex items-center gap-2">
                <svg
                  class="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span class="text-xs text-gray-700">
                  {{ file[0].name }} ({{ formatFileSize(file[0].size) }})
                </span>
              </div>
              <button
                @click.prevent="removeFile(0)"
                class="text-red-500 hover:text-red-700 text-xs"
              >
                Hapus
              </button>
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
          <p class="font-medium">Upload file sebelum mengirim usulan</p>
          <p class="mt-1 text-blue-700">
            Pastikan file yang diupload sesuai dengan nomor surat yang akan
            diajukan.
          </p>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <template #footer>
      <div class="flex justify-end gap-3 px-5 py-4 border-t border-gray-200">
        <!-- Show Kirim button only if status is "Belum Diajukan" -->
        <button
          v-if="selectedRow?.status === 'Belum Diajukan'"
          @click="submitUsulan"
          :disabled="isLoadingBooking || isDeletingUsulan"
          class="px-5 py-2 text-xs bg-primary text-white rounded-md hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <span v-if="isLoadingBooking" class="flex items-center gap-2">
            <svg
              class="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Mengirim...
          </span>
          <span v-else>Kirim Usulan</span>
        </button>

        <!-- Show status badge if not "Belum Diajukan" -->
        <div v-else class="flex items-center gap-2">
          <span
            :class="[
              'px-3 py-1 rounded-full text-xs font-medium',
              {
                'bg-yellow-100 text-yellow-700':
                  selectedRow?.status === 'Menunggu Verifikasi',
                'bg-green-100 text-green-700':
                  selectedRow?.status === 'Disetujui',
                'bg-red-100 text-red-700': selectedRow?.status === 'Ditolak',
              },
            ]"
          >
            {{ selectedRow?.status }}
          </span>
        </div>

        <button
          @click="hapusUsulan"
          :disabled="isLoadingBooking || isDeletingUsulan"
          class="px-5 py-2 text-xs border border-red-400 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {{ isDeletingUsulan ? "Menghapus..." : "Hapus Usulan" }}
        </button>
      </div>
    </template>
  </Modal>

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
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
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
  isLoadingPenomoran,
  deleteUsulan,
  getPersonWithPosition,
  submitBooking,
  isLoadingBooking,
  getListUsulan,
  getDetailUsulan,
  getKlasifikasi,
} = usePenomoran();

const toast = useToast();
const openDetail = ref(false);
const isDeletingUsulan = ref(false);
const selectedRow = ref(null);
const rows = ref([]);
const loading = ref<boolean>(true);
const file = ref([]);
const openAdd = ref<boolean>(false);
const openConfirmDelete = ref(false);
const idToDelete = ref<string | null>(null);

// Person mapping
const personMap = ref(new Map());
// Klasifikasi mapping untuk display
const klasifikasiMap = ref(new Map());

// Computed: Check if at least one file uploaded
const hasUploadedFiles = computed(() => {
  return file.value.some((f) => f instanceof File);
});

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Remove file
const removeFile = (index: number) => {
  file.value[index] = null;
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
    const data = await getListUsulan();

    if (!Array.isArray(data)) {
      rows.value = [];
      return;
    }

    rows.value = data.map((item) => {
      const pengusulInfo = personMap.value.get(item.persnum) || {};
      const klasifikasiDisplay =
        klasifikasiMap.value.get(item.klasifikasi) || item.klasifikasi;

      let mappedStatus = item.status || "Belum Diajukan";

      console.log(`📊 Item ${item.id}: Status from backend="${item.status}"`);

      return {
        id_usulan: item.id_usulan ?? item.id,
        jenis: item.jenis,
        tanggal: item.tanggal,
        perihal: item.perihal,
        jumlah: item.jumlah,
        penandatangan: item.penandatangan || "-",
        klasifikasi: item.klasifikasi || "-",
        klasifikasiDisplay: klasifikasiDisplay,
        pengusul: pengusulInfo.nama || item.nama || user.value?.nama || "-",
        tglUsulan: new Date(item.created_at).toLocaleString("id-ID"),
        status: mappedStatus,
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
    console.log("🔍 Opening row modal for:", row.id_usulan);
    const detail = await getDetailUsulan(row.id_usulan);

    console.log("📦 Detail response:", detail);

    if (!detail || !detail.id) {
      toast.add({
        title: "Gagal memuat detail",
        description: "Data detail tidak ditemukan",
        color: "red",
      });
      return;
    }

    const nomorSuratArray = Array.isArray(detail.nomor_surat)
      ? detail.nomor_surat
      : detail.nomor_surat
        ? [detail.nomor_surat]
        : Array(detail.jumlah || 1).fill(detail.template_nomor || "");

    const klasifikasiDisplay =
      klasifikasiMap.value.get(detail.klasifikasi) || detail.klasifikasi;

    const mappedStatus = detail.status || "Belum Diajukan";

    console.log(`📊 Modal: Status from backend="${detail.status}"`);

    selectedRow.value = {
      id_usulan: detail.id_usulan ?? detail.id,
      jenis: detail.jenis,
      jenis_naskah: detail.jenis,
      tanggal: detail.tanggal,
      perihal: detail.perihal,
      jumlah: detail.jumlah,
      penandatangan: detail.penandatangan || detail.nama || "-",
      klasifikasi: detail.klasifikasi || "-",
      klasifikasiDisplay: klasifikasiDisplay,
      status: mappedStatus,
      nomor_surat: nomorSuratArray,
      template_nomor: detail.template_nomor || "",
    };

    file.value = Array(nomorSuratArray.length).fill(null);

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

// HANDLE FILE UPLOAD
const handleFile = (index: number, e: Event) => {
  const file = (e.target as HTMLInputElement).file?.[0];
  if (!file) return;

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    toast.add({
      title: "File terlalu besar",
      description: "Ukuran file maksimal 5MB",
      color: "red",
    });
    return;
  }

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowedTypes.includes(file.type)) {
    toast.add({
      title: "Tipe file tidak valid",
      description: "Hanya file PDF, DOC, dan DOCX yang diperbolehkan",
      color: "red",
    });
    return;
  }

  file.value[index] = file;

  console.log(
    "✅ File uploaded at index",
    index,
    ":",
    file.name,
    formatFileSize(file.size),
  );

  toast.add({
    title: "File berhasil dipilih",
    description: `${file.name} (${formatFileSize(file.size)})`,
    color: "green",
  });
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

  const length = Array.isArray(data.nomor_surat) ? data.nomor_surat.length : 1;

  file.value = Array(length).fill(null);
}

// SUBMIT USULAN - Updates status to "Menunggu Verifikasi"
const submitUsulan = async () => {
  if (!selectedRow.value) return;

  try {
    const formData = new FormData();

    // ambil file yang valid saja
    const uploadedFiles = file.value.filter((f) => f instanceof File);

    // 👉 file OPSIONAL
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((f) => {
        formData.append("file", f); // sesuai backend
      });
    }

    const response = await submitBooking(selectedRow.value.id_usulan, formData);

    openDetail.value = false;
    await fetchData();

    toast.add({
      title: "Berhasil",
      description:
        uploadedFiles.length > 0
          ? "Usulan berhasil dikirim dengan file"
          : "Usulan berhasil dikirim tanpa file",
      color: "green",
    });
  } catch (e) {
    console.error("❌ Upload gagal:", e);
  }
};

// HAPUS USULAN
const hapusUsulan = () => {
  if (!selectedRow.value?.id_usulan) return;

  idToDelete.value = selectedRow.value.id_usulan;
  openConfirmDelete.value = true;
};

const confirmDeleteUsulan = async () => {
  if (!idToDelete.value) return;

  isDeletingUsulan.value = true;

  try {
    await deleteUsulan(idToDelete.value);

    toast.add({
      title: "Berhasil",
      description: "Usulan berhasil dihapus",
      color: "green",
    });

    openConfirmDelete.value = false;
    openDetail.value = false;
    idToDelete.value = null;

    await fetchData();
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

    await createUsulanDraft(formattedPayload);

    await fetchData();
    currentPage.value = 1;

    toast.add({
      title: "Berhasil",
      description: "Usulan berhasil ditambahkan",
      color: "green",
    });

    openAdd.value = false; // ⬅️ TUTUP MODAL SETELAH SUBMIT
  } catch (err) {
    console.error("❌ Error submit modal:", err);

    toast.add({
      title: "Gagal",
      description:
        err?.response?.data?.message || err?.message || "Usulan gagal dikirim",
      color: "red",
    });
  } finally {
    isSubmittingUsulan.value = false; // ⬅️ RESET FLAG
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

// INIT
onMounted(async () => {
  loading.value = true;

  if (!user.value) {
    await getProfile();
  }

  await fetchKlasifikasiMap();
  await fetchPersonMap();
  await fetchData();
});

/* Breadcrumb */
const breadcrumbs = [
  { label: "Dashboard", to: "/user/dashboard" },
  { label: "Usulan", to: "/admin/penomoran/usulan" },
];

/* TABLE CONFIG */
const headers = [
  { label: "ID Usulan", key: "id_usulan", sortable: true },
  { label: "Jenis", key: "jenis", sortable: true },
  { label: "Tanggal", key: "tanggal", sortable: true },
  { label: "Perihal", key: "perihal", sortable: false },
  { label: "Penandatangan", key: "penandatangan", sortable: false },
  { label: "Jumlah", key: "jumlah", sortable: false },
  { label: "Pengusul", key: "pengusul", sortable: false },
  { label: "Tgl Usulan", key: "tglUsulan", sortable: true },
  { label: "Status", key: "status", sortable: true },
];

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
