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
              :key="row.id"
              class="hover:bg-gray-50 cursor-pointer border-b border-gray-200 transition"
              @click="openRowModal(row)"
            >
              <td class="px-5 py-4">{{ row.jenis }}</td>
              <td class="px-5 py-4">{{ row.jabatan }}</td>
              <td class="px-5 py-4">{{ row.perihal }}</td>
              <td class="px-5 py-4">{{ row.tanggal_nomor }}</td>
              <td class="px-5 py-4">{{ row.pengusul }}</td>
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

      <!-- MODAL TAMBAH PENOMORAN -->
      <AddUsulan v-model="openAdd" @submit="handleSubmitFromModal" />
    </div>
  </div>

  <!-- MODAL ROW DETAIL -->
  <Modal
    v-model="openPreview"
    :hideDefaultFooter="true"
    class="!max-h-[120vh] !rounded-2xl !overflow-hidden"
  >
    <template #title>
      <div
        class="flex items-center justify-between w-full px-6 pt-6 pb-4 border-b border-gray-200"
      >
        <button
          @click="openPreview = false"
          class="text-gray-600 hover:text-gray-800"
        >
          <svg
            class="w-6 h-6"
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
        </button>

        <span class="text-sm text-gray-500">
          {{ formatDateTime(new Date()) }}
        </span>
      </div>
    </template>

    <div
      v-if="selectedRow"
      class="px-6 pb-6 space-y-5 overflow-y-auto max-h-[70vh]"
    >
      <!-- Loading Detail -->
      <div v-if="loadingDetail" class="text-center py-10">
        <div
          class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"
        ></div>
        <p class="text-sm text-gray-500 mt-2">Memuat detail...</p>
      </div>

      <template v-else>
        <!-- Title (Editable) -->
        <div class="flex items-center justify-between pt-2">
          <div class="flex-1">
            <template v-if="!isEditingTitle">
              <h2 class="text-xl font-bold text-gray-900 leading-tight">
                {{ selectedRow?.perihal }}
              </h2>
            </template>

            <template v-else>
              <input
                v-model="editedTitle"
                class="border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary rounded-lg px-3 py-2 w-full text-sm"
              />
            </template>
          </div>

          <div class="ml-4">
            <button
              v-if="!isEditingTitle"
              class="text-primary text-sm flex items-center gap-1 hover:underline"
              @click="startEditTitle"
            >
              <i class="fas fa-pen text-xs"></i> Edit
            </button>

            <button
              v-else
              class="text-primary text-sm flex items-center gap-1 hover:underline"
              @click="saveTitle"
            >
              <i class="fas fa-save text-xs"></i> Simpan
            </button>
          </div>
        </div>

        <!-- Detail Info -->
        <div class="space-y-4 text-base">
          <div class="flex">
            <span class="text-gray-700 w-40 flex-shrink-0">Tanggal</span>
            <span class="font-medium text-gray-900">{{
              selectedRow.tanggal
            }}</span>
          </div>

          <div class="flex">
            <span class="text-gray-700 w-40 flex-shrink-0">Pengirim</span>
            <span class="font-medium text-gray-900">{{
              selectedRow.pengusul
            }}</span>
          </div>

          <div class="flex">
            <span class="text-gray-700 w-40 flex-shrink-0">Klasifikasi</span>
            <span class="font-medium text-gray-900">{{
              selectedRow.klasifikasi
            }}</span>
          </div>

          <div class="flex">
            <span class="text-gray-700 w-40 flex-shrink-0">Jenis Naskah</span>
            <span class="font-medium text-gray-900">{{
              selectedRow.jenis_naskah
            }}</span>
          </div>
        </div>

        <!-- Nomor Surat Section -->
        <div class="pt-4">
          <label class="block text-base font-medium text-gray-900 mb-3"
            >Nomor Surat</label
          >

          <div class="space-y-3">
            <div
              v-for="(nomorItem, idx) in selectedRow.nomor_list"
              :key="nomorItem.id || idx"
              class="flex flex-col border border-gray-300 rounded-lg p-4 bg-gray-50"
            >
              <!-- Nomor Row -->
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium w-5">{{ idx + 1 }}.</span>

                <input
                  type="text"
                  :value="nomorItem.nomor || '-'"
                  class="flex-1 bg-transparent outline-none text-sm font-mono"
                  readonly
                />

                <button
                  v-if="nomorItem.nomor"
                  @click="handleCopy(nomorItem.nomor)"
                  class="p-2 hover:bg-gray-200 rounded transition"
                >
                  <Copy class="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2 mt-3">
                <span
                  :class="[
                    'px-3 py-1 rounded-full text-xs font-medium',
                    {
                      'bg-green-100 text-green-700':
                        nomorItem.status === 'terpakai',
                      'bg-blue-100 text-blue-700':
                        nomorItem.status === 'booking',
                      'bg-yellow-100 text-yellow-700':
                        nomorItem.status === 'pending',
                      'bg-red-100 text-red-700': nomorItem.status === 'ditolak',
                    },
                  ]"
                >
                  {{ nomorItem.status || "pending" }}
                </span>

                <!-- Upload Button -->
                <label
                  class="px-3 py-1 border border-gray-300 rounded-md text-xs cursor-pointer hover:bg-gray-100 transition"
                >
                  Upload File
                  <input
                    type="file"
                    class="hidden"
                    @change="onUpload(idx, $event)"
                  />
                </label>
              </div>

              <!-- File Info -->
              <div class="mt-2 text-sm text-gray-700">
                <template v-if="nomorItem.file_name">
                  <div class="flex items-center gap-2">
                    <i class="fas fa-file text-primary"></i>
                    <span>{{ nomorItem.file_name }}</span>
                    <a
                      v-if="nomorItem.file_text"
                      :href="getFileUrl(nomorItem.file_text)"
                      target="_blank"
                      class="text-primary text-xs hover:underline"
                    >
                      Lihat File
                    </a>
                  </div>
                </template>
                <template v-else>
                  <span class="text-gray-500">Belum ada file</span>
                </template>
              </div>
            </div>
          </div>

          <!-- Jika tidak ada nomor -->
          <div
            v-if="
              !selectedRow.nomor_list || selectedRow.nomor_list.length === 0
            "
            class="text-center py-8 text-gray-500"
          >
            <p class="text-sm">Belum ada nomor yang tersedia</p>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
        <button
          @click="openPreview = false"
          class="px-5 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Tutup
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Search, ArrowUpDown, Plus, Copy } from "lucide-vue-next";
import AddUsulan from "~/components/AddUsulan.vue";
import Heading from "~/components/Heading.vue";
import PageHeader from "~/components/PageHeader.vue";
import { Modal } from "#components";
import { useToast } from "#imports";
import { usePenomoran } from "~/composables/usePenomoran";

const toast = useToast();

// Composable
const { savePenomoran, isLoadingPenomoran } = usePenomoran();
const { get, post } = useApi();

/* Breadcrumb */
const breadcrumbs = [
  { label: "Dashboard", to: "/user/dashboard" },
  { label: "Penomoran", to: "/admin/penomoran" },
];

/* TABLE CONFIG */
const headers = [
  { label: "Jenis", key: "jenis", sortable: true },
  { label: "Penandatangan", key: "jabatan", sortable: false },
  { label: "Perihal", key: "perihal", sortable: false },
  { label: "Tanggal & Nomor", key: "tanggal_nomor", sortable: true },
  { label: "Pengusul", key: "pengusul", sortable: false },
  { label: "Waktu", key: "waktu", sortable: true },
];

/* EDIT JUDUL */
const isEditingTitle = ref(false);
const editedTitle = ref("");

function startEditTitle() {
  if (!selectedRow.value) return;
  editedTitle.value = selectedRow.value.perihal;
  isEditingTitle.value = true;
}

function saveTitle() {
  if (!selectedRow.value) return;
  selectedRow.value.perihal = editedTitle.value;
  isEditingTitle.value = false;

  toast.add({
    title: "Berhasil",
    description: "Perihal berhasil diubah",
    color: "green",
  });
}

const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const search = ref<string>("");
const currentPage = ref<number>(1);

const loading = ref<boolean>(true);
const loadingDetail = ref<boolean>(false);

/* SORT STATE */
const sortBy = ref<string>("waktu");
const sortDir = ref<"asc" | "desc">("desc");

const sort = (col: string) => {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = col;
    sortDir.value = "asc";
  }
};

/* Modal control */
const openAdd = ref<boolean>(false);
const openPreview = ref(false);
const selectedRow = ref<any>(null);

/* Data rows */
const rows = ref<any[]>([]);

// ✅ HANDLER SUBMIT DARI MODAL
const handleSubmitFromModal = async (payload: any) => {
  console.log("📥 Received payload from modal:", payload);

  try {
    const response = await savePenomoran(payload);
    console.log("✅ Response dari backend:", response);

    toast.add({
      title: "Berhasil",
      description: "Data penomoran berhasil disimpan",
      color: "green",
    });

    // Refresh data
    await fetchData();

    openAdd.value = false;
  } catch (error) {
    console.error("❌ Error di handleSubmitFromModal:", error);
  }
};

/* ✅ FETCH DATA LIST - GET /nomor */
const fetchData = async () => {
  loading.value = true;

  try {
    const res = await get("/nomor");

    if (!res?.success) {
      toast.add({
        title: "Gagal",
        description: "Tidak dapat mengambil data penomoran",
        color: "red",
      });
      return;
    }

    const rawData = res.data || [];

    rows.value = rawData.map((item: any) => ({
      id: item.id,
      jenis: item.jenis,
      jabatan: item.jabatan || "-",
      perihal: item.perihal || "-",
      tanggal_nomor: `${formatTanggal(item.tanggal)} / ${item.nomor || "-"}`,
      pengusul: item.nama_pengirim || "-",
      waktu: formatWaktu(item.waktu),

      // Untuk preview
      tanggal: formatTanggal(item.tanggal),
      klasifikasi: item.klasifikasi || "-",
      jenis_naskah: item.jenis,
      nomor: item.nomor,

      // Raw data
      _raw: item,
    }));

    console.log("✅ Data penomoran berhasil dimuat:", rows.value.length);
  } catch (error) {
    console.error("❌ Error fetch data penomoran:", error);
    toast.add({
      title: "Gagal memuat data",
      description: "Tidak dapat mengambil data penomoran",
      color: "red",
    });
  } finally {
    loading.value = false;
  }
};

/* ✅ FETCH DETAIL NOMOR - GET /nomor/:id_request */
const fetchDetailNomor = async (idRequest: string) => {
  loadingDetail.value = true;

  try {
    const res = await get(`/nomor/${idRequest}`);

    console.log("📋 Detail nomor response:", res);

    if (!res?.success) {
      throw new Error(res?.message || "Gagal mengambil detail");
    }

    return res.data;
  } catch (error) {
    console.error("❌ Error fetch detail nomor:", error);
    toast.add({
      title: "Gagal",
      description: "Tidak dapat mengambil detail nomor",
      color: "red",
    });
    return null;
  } finally {
    loadingDetail.value = false;
  }
};

/* ✅ OPEN ROW MODAL */
const openRowModal = async (row: any) => {
  selectedRow.value = { ...row };
  openPreview.value = true;

  // Fetch detail
  const detail = await fetchDetailNomor(row.id);

  if (detail) {
    selectedRow.value = {
      ...selectedRow.value,
      ...detail,
      nomor_list: detail.nomor_list || [],
    };
  }

  console.log("✅ Selected row with detail:", selectedRow.value);
};

/* ✅ HANDLE COPY */
const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value);
  toast.add({
    title: "Tersalin",
    description: `Nomor surat "${value}" berhasil disalin.`,
    color: "success",
    icon: "i-lucide-copy",
  });
};

/* ✅ HANDLE UPLOAD FILE */
const onUpload = async (idx: number, event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  console.log("📤 Upload file untuk index:", idx, file.name);

  // Konversi ke base64
  const base64 = await toBase64(file);

  // Update local state
  if (selectedRow.value.nomor_list[idx]) {
    selectedRow.value.nomor_list[idx].file_name = file.name;
    selectedRow.value.nomor_list[idx].file_text = base64.split(",")[1];
  }

  toast.add({
    title: "Berhasil",
    description: `File "${file.name}" berhasil ditambahkan`,
    color: "green",
  });

  // TODO: Kirim ke backend jika perlu
  // const nomorId = selectedRow.value.nomor_list[idx].id;
  // await post(`/nomor/${nomorId}/upload`, {
  //   file_name: file.name,
  //   file_text: base64.split(",")[1]
  // });
};

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/* ✅ GET FILE URL */
const getFileUrl = (filePath: string) => {
  // Sesuaikan dengan base URL backend
  const baseUrl = useRuntimeConfig().public.apiBase || "http://localhost:3000";
  return `${baseUrl}/${filePath}`;
};

/* FILTER + SEARCH */
const filteredRows = computed(() => {
  return rows.value.filter((row) => {
    const matchesSearch =
      row.jenis?.toLowerCase().includes(search.value.toLowerCase()) ||
      row.jabatan?.toLowerCase().includes(search.value.toLowerCase()) ||
      row.perihal?.toLowerCase().includes(search.value.toLowerCase()) ||
      row.pengusul?.toLowerCase().includes(search.value.toLowerCase()) ||
      row.nomor?.toLowerCase().includes(search.value.toLowerCase());

    return matchesSearch;
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
const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedRows.value.length / rowsPerPage.value)),
);

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedRows.value.slice(start, start + rowsPerPage.value);
});

/* Reset page saat filter/search berubah */
watch([search, rowsPerPage], () => {
  currentPage.value = 1;
});

/* Format helpers */
function formatTanggal(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatWaktu(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(date: Date) {
  return `${date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} ${date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/* Load initial data */
onMounted(async () => {
  await fetchData();
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
