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
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-xs transition"
      >
        <Plus class="w-4 h-4" />
        Tambah Penomoran
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
              :key="row.id_request"
              class="hover:bg-gray-50 cursor-pointer border-b border-gray-200 transition"
              @click="openRowModal(row)"
            >
              <td class="px-5 py-4">{{ row.jenis }}</td>
              <td class="px-5 py-4">{{ row.jabatan }}</td>
              <td class="px-5 py-4">
                <div class="relative group max-w-[350px]">
                  <p class="whitespace-normal break-words line-clamp-3">
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
                <div class="relative group max-w-[350px]">
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
    </div>

    <!-- COMPONENT ADD USULAN -->
    <AddUsulan v-model="openAdd" @submit="handleSubmitFromModal" />
  </div>

  <!-- MODAL ROW DETAIL -->
  <Modal
    :model-value="openPreview"
    @update:model-value="openPreview = $event"
    :hideDefaultFooter="true"
    size="xl"
  >
    <template #title>
      <div
        class="flex justify-between items-center w-full px-6 pt-0 pb-10"
      ></div>
    </template>

    <div
      v-if="selectedRow"
      class="px-6 pb-3 space-y-6 text-sm overflow-y-auto overflow-x-hidden overflow-y-auto max-h-[70vh]"
    >
      <!-- Loading state saat fetch detail -->
      <div v-if="loadingDetail" class="space-y-3">
        <div class="w-full h-8 bg-gray-200 animate-pulse rounded-md"></div>
        <div class="w-full h-8 bg-gray-200 animate-pulse rounded-md"></div>
        <div class="w-full h-8 bg-gray-200 animate-pulse rounded-md"></div>
      </div>

      <template v-else>
        <!-- Judul -->
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <template v-if="!isEditingTitle">
              <h3
                class="text-xl font-bold leading-relaxed text-gray-900 break-words"
              >
                {{ detailData?.perihal || selectedRow?.perihal }}
              </h3>
            </template>

            <template v-else>
              <input
                v-model="editedTitle"
                class="border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 rounded-lg px-3 py-2 w-full text-sm"
              />
            </template>
          </div>

          <div class="ml-4">
            <button
              v-if="!isEditingTitle"
              class="text-primary text-sm flex items-center gap-1"
              @click="startEditTitle"
            >
              <i class="fas fa-pen text-xs"></i> Edit
            </button>

            <button
              v-else
              class="text-primary text-sm flex items-center gap-1"
              @click="saveTitle"
            >
              <i class="fas fa-save text-xs"></i> Simpan
            </button>
          </div>
        </div>

        <!-- Tanggal -->
        <div class="pb-1 border-b border-gray-200">
          <p class="text-gray-500 text-xs">Tanggal</p>
          <p class="font-medium mt-1">
            {{ formatTanggal(detailData?.tanggal || selectedRow?.tanggal) }}
          </p>
        </div>

        <!-- Penandatangan -->
        <div class="pb-1 border-b border-gray-200">
          <p class="text-gray-500 text-xs">Penandatangan</p>
          <p class="font-medium mt-1">
            {{ detailData?.jabatan || selectedRow?.jabatan }}
          </p>
        </div>

        <!-- Klasifikasi -->
        <div class="pb-1 border-b border-gray-200">
          <p class="text-gray-500 text-xs">Klasifikasi</p>
          <p class="font-medium mt-1 break-words">
            {{
              detailData?.klasifikasiDisplay ||
              selectedRow?.klasifikasiDisplay ||
              detailData?.klasifikasi ||
              selectedRow?.klasifikasi
            }}
          </p>
        </div>

        <!-- Jenis Naskah -->
        <div class="pb-1 border-b border-gray-200">
          <p class="text-gray-500 text-xs">Jenis Naskah</p>
          <p class="font-medium mt-1 break-words">
            {{ detailData?.jenis || selectedRow?.jenis }}
          </p>
        </div>

        <!-- Nomor Surat & Files -->
        <div class="mt-2">
          <label
            class="text-xs font-medium text-gray-700 mb-2 justify-between break-words"
          >
            Nomor Surat & File ({{ detailData?.nomor_list?.length || 0 }} nomor)
          </label>

          <div
            v-if="detailData?.nomor_list && detailData.nomor_list.length > 0"
            class="space-y-4 mt-2"
          >
            <div
              v-for="(item, idx) in detailData.nomor_list"
              :key="idx"
              class="border border-gray-300 rounded-lg p-4 bg-gray-50"
            >
              <!-- Nomor surat dengan copy button -->
              <div class="flex items-center gap-2 mb-3">
                <div
                  class="flex-1 bg-white border border-gray-200 rounded-md px-3 py-2"
                >
                  <span class="text-sm font-mono text-gray-700 break-words">
                    {{ idx + 1 }}. {{ item.nomor }}
                  </span>
                </div>

                <button
                  @click="handleCopy(item.nomor)"
                  class="p-2 rounded-lg hover:bg-gray-200 transition flex items-center justify-center border border-gray-300 bg-white"
                  title="Copy nomor surat"
                >
                  <Copy class="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <!-- File info -->
              <div
                v-if="item.file_name"
                class="bg-white border border-green-200 rounded-md p-3 break-words"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <svg
                      class="w-5 h-5 text-green-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>

                    <div class="flex-1 min-w-0">
                      <p
                        class="text-sm font-medium text-gray-900 break-words whitespace-normal leading-relaxed"
                      >
                        {{ item.file_name }}
                      </p>
                      <p class="text-xs text-gray-500">
                        Status:
                        <span class="capitalize">{{ item.status }}</span>
                      </p>
                    </div>
                  </div>

                  <!-- <div class="flex items-center gap-2 flex-1">
                    <svg
                      class="w-5 h-5 text-green-600 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div class="flex-1 min-w-0">
                      <p
                        class="text-sm font-medium text-gray-900 break-words whitespace-normal leading-relaxed"
                      >
                        {{ item.file_name }}
                      </p>
                      <p class="text-xs text-gray-500">
                        Status:
                        <span class="capitalize">{{ item.status }}</span>
                      </p>
                    </div>
                  </div> -->

                  <a
                    v-if="item.file_text"
                    :href="getFileUrl(item.file_text)"
                    target="_blank"
                    class="ml-2 px-3 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary-800 transition flex-shrink-0"
                  >
                    Download
                  </a>
                </div>
              </div>

              <!-- No file uploaded -->
              <div
                v-else
                class="bg-yellow-50 border border-yellow-200 rounded-md p-3"
              >
                <div class="flex items-center gap-2">
                  <svg
                    class="w-5 h-5 text-yellow-600"
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
                  <span class="text-sm text-yellow-800">
                    Belum ada file diupload
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Fallback jika tidak ada detail -->
          <div v-else class="text-center py-4 text-gray-500 text-sm">
            Tidak ada data nomor surat
          </div>
        </div>
      </template>
    </div>

    <!-- FOOTER -->
    <!-- <template #footer>
      <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
        <button
          @click="openPreview = false"
          class="px-5 py-2 text-xs border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
        >
          Tutup
        </button>

        <button
          @click="hapusNomor"
          :disabled="isDeletingNomor"
          class="px-5 py-2 text-xs border border-red-400 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {{ isDeletingNomor ? "Menghapus..." : "Hapus" }}
        </button>
      </div>
    </template> -->
  </Modal>

  <!-- CONFIRM DELETE POPUP -->
  <ConfirmPopup
    v-model="openConfirmDelete"
    type="danger"
    title="Hapus Penomoran?"
    message="Data penomoran yang dihapus tidak dapat dikembalikan. Apakah Anda yakin?"
    confirm-text="Ya, Hapus"
    cancel-text="Batal"
    :is-loading="isDeletingNomor"
    @confirm="confirmDeleteNomor"
  />
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
  isLoadingPenomoran,
  getKlasifikasi,
  deleteNomor,
  getDetailNomor,
} = usePenomoran();
const { get } = useApi();

// State
const klasifikasiMap = ref(new Map());
const personMap = ref(new Map());
const loading = ref<boolean>(true);
const loadingDetail = ref<boolean>(false);
const isDeletingNomor = ref(false);
const openAdd = ref<boolean>(false);
const openPreview = ref(false);
const openConfirmDelete = ref(false);
const selectedRow = ref(null);
const detailData = ref(null);
const rows = ref<any[]>([]);
const idToDelete = ref<string | null>(null);

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
  { label: "Dashboard", to: "/admin/dashboard" },
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

// Fetch klasifikasi map
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

// Fetch person map
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

// Get file URL
const getFileUrl = (filePath: string) => {
  return `${config.public.apiBaseUrl}/${filePath}`;
};

// Edit title functions
function startEditTitle() {
  if (!detailData.value) return;
  editedTitle.value = detailData.value.perihal;
  isEditingTitle.value = true;
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

// Handle copy
const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value);
  toast.add({
    title: "Tersalin",
    description: `Nomor surat "${value}" berhasil disalin.`,
    color: "success",
  });
};

// Sort function
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
        tanggal: formatTanggal(item.tanggal),
        pengusul: item.nama_pengirim || "-",
        waktu: formatWaktu(item.waktu),
        klasifikasi: item.klasifikasi || "-",
        klasifikasiDisplay: klasifikasiDisplay,
        nomor_list: [item.nomor],
        created_at: item.waktu,
      });
    }
  });

  return Array.from(grouped.values());
}

// Get list nomor
const getListNomor = async () => {
  try {
    const res = await get("/nomor");

    console.log("📦 Response from /nomor:", res);

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

// Open row modal
const openRowModal = async (row) => {
  selectedRow.value = row;
  openPreview.value = true;
  loadingDetail.value = true;
  detailData.value = null;

  try {
    console.log("🔍 Fetching detail for ID:", row.id_request);
    const detail = await getDetailNomor(row.id_request);

    console.log("📦 Detail response:", detail);

    if (detail) {
      const klasifikasiDisplay =
        klasifikasiMap.value.get(detail.klasifikasi) || detail.klasifikasi;

      detailData.value = {
        ...detail,
        klasifikasiDisplay: klasifikasiDisplay,
      };
    } else {
      detailData.value = {
        ...row,
        nomor_list: row.nomor_list.map((nomor, idx) => ({
          id: `${row.id_request}-${idx}`,
          nomor: nomor,
          status: "terpakai",
          file_name: null,
          file_text: null,
        })),
      };
    }
  } catch (error) {
    console.error("❌ Error fetching detail:", error);

    detailData.value = {
      ...row,
      nomor_list: row.nomor_list.map((nomor, idx) => ({
        id: `${row.id_request}-${idx}`,
        nomor: nomor,
        status: "terpakai",
        file_name: null,
        file_text: null,
      })),
    };
  } finally {
    loadingDetail.value = false;
  }
};

// Handle submit from modal
const handleSubmitFromModal = async (payload) => {
  console.log("📥 Received payload from AddUsulan:", payload);

  try {
    const response = await createPenomoranFinal(payload);
    console.log("✅ Response dari backend:", response);

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
  rows.value = data.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
  loading.value = false;
};

// Delete functions
const hapusNomor = () => {
  if (!selectedRow.value?.id_request) return;
  idToDelete.value = selectedRow.value.id_request;
  openConfirmDelete.value = true;
};

const confirmDeleteNomor = async () => {
  if (!idToDelete.value) return;

  isDeletingNomor.value = true;

  try {
    await deleteNomor(idToDelete.value);

    openConfirmDelete.value = false;
    openPreview.value = false;
    selectedRow.value = null;
    idToDelete.value = null;

    await refreshList();

    toast.add({
      title: "Berhasil",
      description: "Data penomoran berhasil dihapus",
      color: "green",
    });
  } catch (error) {
    console.error("❌ Error hapus nomor:", error);
  } finally {
    isDeletingNomor.value = false;
  }
};

// Filter & Search
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

// Sort
const sortedRows = computed(() => {
  return [...filteredRows.value].sort((a, b) => {
    const A = new Date(a[sortBy.value]).getTime();
    const B = new Date(b[sortBy.value]).getTime();

    return sortDir.value === "asc" ? A - B : B - A;
  });
});

// Pagination
const totalPages = computed(() =>
  Math.ceil(sortedRows.value.length / rowsPerPage.value),
);

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedRows.value.slice(start, start + rowsPerPage.value);
});

// Format helpers
function formatTanggal(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatWaktu(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Watchers
watch([search, rowsPerPage], () => {
  currentPage.value = 1;
});

// Mounted
onMounted(async () => {
  loading.value = true;

  await fetchKlasifikasiMap();
  await fetchPersonMap();

  const data = await getListNomor();
  rows.value = data;

  loading.value = false;
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
