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
    </div>

    <!-- ✅ COMPONENT ADD USULAN (Include modal sendiri) -->
    <AddUsulan v-model="openAdd" @submit="handleSubmitFromModal" />
  </div>

  <!-- ✅ MODAL ROW DETAIL (Untuk preview data existing) -->
  <Modal v-model="openPreview" :hideDefaultFooter="true" size="xl">
    <template #title>
      <div class="flex justify-between items-center w-full px-6 pt-10"></div>
    </template>

    <div
      v-if="selectedRow"
      class="px-6 pb-2 space-y-6 text-[15px] overflow-y-auto"
    >
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <template v-if="!isEditingTitle">
            <Heading
              variant="heading8sb"
              class="text-xl font-semibold leading-relaxed"
            >
              {{ selectedRow?.perihal }}
            </Heading>
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

      <div class="pb-2 border-b border-gray-200 space-y-1">
        <p class="text-gray-600 text-xs mt-1">Tanggal</p>
        <p class="font-medium text-gray-900">
          {{ selectedRow.tanggal }}
        </p>
      </div>

      <div class="pb-2 border-b border-gray-200 space-y-1">
        <p class="text-gray-600 text-xs mt-1">Pengirim</p>
        <p class="font-medium text-gray-900">
          {{ selectedRow.pengusul }}
        </p>
      </div>

      <!-- ✅ Klasifikasi dengan format "CODE - TEXT" -->
      <div class="pb-3 border-b border-gray-200 space-y-1">
        <p class="text-gray-500 text-xs">Klasifikasi</p>
        <p class="font-medium text-gray-900 mt-1">
          {{ selectedRow.klasifikasiDisplay || selectedRow.klasifikasi }}
        </p>
      </div>

      <div class="pb-2 border-b border-gray-200 space-y-1">
        <p class="text-gray-600 text-xs">Jenis Naskah</p>
        <p class="font-medium text-gray-900 mt-1">
          {{ selectedRow.jenis_naskah }}
        </p>
      </div>

      <div class="mt-2">
        <label class="text-xs">Nomor Surat</label>

        <div class="flex flex-col gap-4 mt-2">
          <div
            v-for="(nomor, idx) in selectedRow.nomor_surat"
            :key="idx"
            class="flex flex-col border border-gray-300 rounded-lg p-4 bg-gray-50"
          >
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium w-5">{{ idx + 1 }}.</span>

              <input
                type="text"
                v-model="selectedRow.nomor_surat[idx]"
                class="flex-1 bg-transparent outline-none text-sm"
                readonly
              />

              <button
                @click="handleCopy(nomor)"
                class="p-1 hover:bg-gray-200 rounded"
              >
                <i class="fas fa-copy text-gray-500"></i>
              </button>
            </div>

            <div class="flex items-center gap-2 ml-7 mt-2">
              <button
                class="px-3 py-1 bg-primary text-white text-xs rounded-md"
              >
                Terpakai
              </button>

              <label class="px-3 py-1 border rounded-md text-xs cursor-pointer">
                Upload File
                <input type="file" class="hidden" @change="onUpload(idx)" />
              </label>
            </div>

            <div class="mt-2 text-sm ml-7 text-gray-700">
              {{ selectedRow.files?.[idx] || "Belum ada file" }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Search, ArrowUpDown, Plus } from "lucide-vue-next";
import AddUsulan from "~/components/AddUsulan.vue";
import Heading from "~/components/Heading.vue";
import PageHeader from "~/components/PageHeader.vue";
import { Modal } from "#components";
import { useToast } from "#imports";
import { usePenomoran } from "~/composables/usePenomoran";

const toast = useToast();

// ✅ Composable
const { savePenomoran, isLoadingPenomoran, getKlasifikasi, deleteUsulan } =
  usePenomoran();
const { get } = useApi();

// ✅ Klasifikasi mapping untuk display
const klasifikasiMap = ref(new Map());

// ✅ Fetch klasifikasi map untuk display
const fetchKlasifikasiMap = async () => {
  try {
    const response = await getKlasifikasi();

    if (Array.isArray(response)) {
      response.forEach((item) => {
        // Map dari code ke display text
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

/* Breadcrumb */
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Penomoran", to: "/admin/penomoran" },
];

/* TABLE CONFIG */
const headers = [
  { label: "Jenis", key: "jenis", sortable: true },
  { label: "Penandatangan", key: "penandatangan", sortable: false },
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
}

const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const search = ref<string>("");
const currentPage = ref<number>(1);

/* Loading */
const loading = ref<boolean>(true);

/* SORT STATE */
const sortBy = ref<string>("id");
const sortDir = ref<"asc" | "desc">("asc");

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
const selectedRow = ref(null);

/* Data rows */
const rows = ref<any[]>([]);

// ✅ HANDLER SUBMIT DARI MODAL ADD USULAN
const handleSubmitFromModal = async (payload) => {
  console.log("📥 Received payload from AddUsulan:", payload);

  try {
    // Kirim ke backend
    const response = await savePenomoran(payload);

    console.log("✅ Response dari backend:", response);

    // ✅ Get klasifikasi display
    const klasifikasiDisplay =
      klasifikasiMap.value.get(payload.klasifikasi) || payload.klasifikasi;

    // ✅ Tambahkan ke tabel lokal dengan data dari BE
    rows.value.unshift({
      id: response.data?.id || response.id,
      jenis: response.data?.jenis || payload.jenis,
      jabatan: response.data?.penandatangan || payload.penandatangan || "-",
      perihal: response.data?.perihal || payload.perihal,
      tanggal_nomor: formatTanggalNomor(
        response.data?.tanggal || payload.tanggal,
      ),
      pengusul: "Anda",
      waktu: formatWaktu(response.data?.created_at || new Date().toISOString()),
      tanggal: formatTanggal(response.data?.tanggal || payload.tanggal),
      klasifikasi: response.data?.klasifikasi || payload.klasifikasi,
      klasifikasiDisplay: klasifikasiDisplay, // ✅ Format "AUD - AUDIT"
      jenis_naskah: `${response.data?.jenis || payload.jenis} - ${response.data?.perihal || payload.perihal}`,
      nomor_surat: [],
      files: [],
    });

    // Reset pagination
    currentPage.value = 1;

    toast.add({
      title: "Berhasil",
      description: "Data penomoran berhasil ditambahkan ke tabel",
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

/* Function saat klik row */
function openRowModal(row) {
  selectedRow.value = row;
  openPreview.value = true;
}

/* Submit & Hapus */
const submitUsulan = () => {
  openPreview.value = false;
  toast.add({
    title: "Usulan berhasil dikirim",
    description: "Data usulan nomor surat telah dikirim.",
    color: "green",
  });
};
const refreshList = async () => {
  loading.value = true;
  const data = await getListNomor();
  rows.value = data;
  loading.value = false;
};

// ✅ Hapus usulan dari database
const hapusUsulan = async () => {
  if (!selectedRow.value?.id) return;

  const confirmed = confirm("Apakah Anda yakin ingin menghapus usulan ini?");
  if (!confirmed) return;

  try {
    await deleteUsulan(selectedRow.value.id);

    // Tutup modal & reset state
    openPreview.value = false;
    selectedRow.value = null;

    // 🔄 Refresh data dari backend
    await refreshList();

    toast.add({
      title: "Berhasil",
      description: "Usulan berhasil dihapus",
      color: "green",
    });
  } catch (error) {
    console.error("❌ Error hapus usulan:", error);
  }
};

const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value);
  toast.add({
    title: "Tersalin",
    description: `Nomor surat "${value}" berhasil disalin.`,
    color: "success",
  });
};

const onUpload = (idx: number) => {
  console.log("Upload file untuk index:", idx);
};

/* FILTER + SEARCH */
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

/* SORT */
const sortedRows = computed(() => {
  return [...filteredRows.value].sort((a, b) => {
    const A = a[sortBy.value];
    const B = b[sortBy.value];

    if (A < B) return sortDir.value === "asc" ? -1 : 1;
    if (A > B) return sortDir.value === "asc" ? 1 : -1;
    return 0;
  });
});

/* PAGINATION */
const totalPages = computed(() =>
  Math.ceil(sortedRows.value.length / rowsPerPage.value),
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
function formatTanggal(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID");
}

function formatWaktu(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTanggalNomor(tanggal) {
  return `${formatTanggal(tanggal)} / -`;
}

/* ✅ GET DATA DARI API */
const getListNomor = async () => {
  try {
    const res = await get("/nomor");

    if (!res?.success || !Array.isArray(res.data)) return [];

    return res.data.map((item) => {
      // ✅ Get klasifikasi display dari map
      const klasifikasiDisplay =
        klasifikasiMap.value.get(item.klasifikasi) || item.klasifikasi;

      return {
        id: item.id,

        // TABLE
        jenis: item.jenis,
        jabatan: item.jabatan || "-",
        perihal: item.perihal || "-",
        tanggal_nomor: `${formatTanggal(item.tanggal)} / ${item.nomor || "-"}`,
        pengusul: item.nama_pengirim || "-",
        waktu: formatWaktu(item.waktu),

        // PREVIEW
        tanggal: formatTanggal(item.tanggal),
        klasifikasi: item.klasifikasi || "-",
        klasifikasiDisplay: klasifikasiDisplay, // ✅ Format "AUD - AUDIT"
        jenis_naskah: item.jenis,
        nomor_surat: item.nomor ? [item.nomor] : [],
        files: [],
      };
    });
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

/* Load initial data */
onMounted(async () => {
  loading.value = true;

  // ✅ Fetch klasifikasi map terlebih dahulu
  await fetchKlasifikasiMap();

  // ✅ Fetch data dari API
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
