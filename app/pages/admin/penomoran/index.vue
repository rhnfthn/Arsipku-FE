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

      <!-- ADD BUTTON (buka modal) -->
      <button
        @click="openAdd = true"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-xs transition"
      >
        <Plus class="w-4 h-4" />
        Tambah Penomoran
      </button>

      <!-- <button
        @click="openAdd = true"
        class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-800 text-xs transition"
      >
        <Plus class="w-4 h-4" />
        Tambah Titelatur
      </button> -->
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
        <table class="min-w-max bg-white text-sm">
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
      <!------------->
      <!-- MODAL TAMBAH -->
      <!------------->

      <AddUsulan
        v-model="openAdd"
        @preview="handlePreview"
        @submit="handleSubmit"
      />

      <!-- <PreviewUsulan v-model="openPreview" :data="previewData" /> -->

      <!-- <AddUsulan
        v-model="openAdd"
        @preview="handlePreview"
        @submit="handleSubmit"
      /> -->
    </div>
  </div>
  <!------------->
  <!-- MODAL ROW DETAIL -->
  <!------------->
  <Modal
    v-model="openPreview"
    :hideDefaultFooter="true"
    class="!max-h-[120vh] !rounded-2xl !overflow-hidden"
  >
    <!-- TITLE -->
    <template #title>
      <div
        class="flex justify-between items-center w-full px-6 pt-6 pb-3"
      ></div>
    </template>

    <!-- BODY -->
    <div
      v-if="selectedRow"
      class="px-6 pb-6 space-y-6 text-[15px] overflow-y-auto max-h-[70vh]"
    >
      <div class="flex items-center justify-between">
        <!-- LEFT (judul or input) -->
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

        <!-- RIGHT (edit/save) -->
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
      <div class="flex items-start">
        <span class="text-gray-600 w-48 flex-shrink-0">Tanggal</span>

        <span class="font-medium text-right flex-1">
          {{ selectedRow.tanggal }}
        </span>
      </div>

      <!-- Pengirim -->
      <div class="flex items-start">
        <span class="text-gray-600 w-48 flex-shrink-0">Pengirim</span>

        <span class="font-medium text-right flex-1">
          {{ selectedRow.pengusul }}
        </span>
      </div>

      <!-- Klasifikasi -->
      <div class="flex items-start">
        <span class="text-gray-600 w-48 flex-shrink-0">Klasifikasi</span>

        <span class="font-medium text-right flex-1">
          {{ selectedRow.klasifikasi }}
        </span>
      </div>

      <!-- Jenis Naskah -->
      <div class="flex items-start">
        <span class="text-gray-600 w-48 flex-shrink-0">Jenis Naskah</span>

        <span class="font-medium text-right flex-1">
          {{ selectedRow.jenis_naskah }}
        </span>
      </div>

      <!-- NOMOR SURAT LIST -->
      <div class="mt-4">
        <label class="font-medium">Nomor Surat</label>

        <div class="flex flex-col gap-4 mt-2">
          <div
            class="flex flex-col border border-gray-300 rounded-lg p-4 bg-gray-50"
          >
            <input
              type="text"
              v-model="selectedRow.nomor_surat"
              class="flex-1 bg-transparent outline-none text-sm"
            />
            <!-- NOMOR & INPUT -->
            <div class="flex items-center gap-3">
              <!-- NOMOR URUT -->
              <span class="text-sm font-medium w-5">{{ idx + 1 }}.</span>

              <!-- INPUT NOMOR SURAT -->
              <input
                type="text"
                v-model="selectedRow.nomor_surat[idx]"
                class="flex-1 bg-transparent outline-none text-sm"
              />

              <!-- COPY BUTTON -->
              <button
                @click="
                  navigator.clipboard.writeText(selectedRow.nomor_surat[idx])
                "
                class="p-1 hover:bg-gray-200 rounded"
              >
                <i class="fas fa-copy text-gray-500"></i>
              </button>
            </div>

            <!-- BUTTON TERPAKAI & UPLOAD -->
            <div class="flex items-center gap-2 mt-2">
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

            <!-- FILE NAMA -->
            <div class="mt-2 text-sm text-gray-700">
              {{ selectedRow.files?.[idx] || "Belum ada file" }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <template #footer>
      <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
        <button
          @click="submitUsulan"
          class="px-5 py-2 text-sm bg-primary text-white rounded-md"
        >
          Kirim Usulan
        </button>

        <button
          @click="hapusUsulan"
          class="px-5 py-2 text-sm border border-red-400 text-red-600 rounded-md"
        >
          Hapus Usulan
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { Search, ArrowUpDown, Plus } from "lucide-vue-next";
import AddUsulan from "~/components/AddUsulan.vue";

import Heading from "~/components/Heading.vue";
import PageHeader from "~/components/PageHeader.vue";
import { UInput, USelect, Modal } from "#components";
import { useToast } from "#imports";

const toast = useToast();

/* Submit & Hapus (sederhana, karena ini contoh) */
const submitUsulan = () => {
  // contoh: kirim data ke API
  // axios.post('/api/usulan', { ... })
  openAdd.value = false;
  toast.add({
    title: "Usulan berhasil dikirim",
    description: "Data usulan nomor surat telah dikirim.",
    color: "green",
  });
};

const hapusUsulan = () => {
  if (!selectedRow.value) return;

  // Hapus row dari tabel
  rows.value = rows.value.filter((r) => r.id !== selectedRow.value.id);

  // Tutup modal preview
  openPreview.value = false;

  // Bersihkan selectedRow
  selectedRow.value = null;
  toast.add({
    title: "Usulan berhasil dihapus",
    description: "Data usulan sudah dihapus dari daftar.",
    color: "red",
  });
};

// data tabel kamu (contoh)
import { tableData } from "~/data/usulan-data";

// State modal
const openPreview = ref(false);
const selectedRow = ref(null);

// Event dari AddUsulan
// function handlePreview(data) {
//   console.log("DATA PREVIEW:", data);
// }

// function handleSubmit(data) {
//   console.log("DATA SUBMIT:", data);
// }
function handlePreview(data) {
  previewData.value = data;
  openPreview.value = true;
}
// Function saat klik row
function openRowModal(row) {
  selectedRow.value = row;
  openPreview.value = true;
}
/* Breadcrumb */
const breadcrumbs = [
  { label: "Dashboard", to: "/user/dashboard" },
  { label: "Penomoran", to: "/admin/penomoran" },
];

/* TABLE CONFIG */
const headers = [
  { label: "Jenis", key: "jenis", sortable: true },
  { label: "Jabatan", key: "jabatan", sortable: false },
  { label: "Perihal", key: "perihal", sortable: false },
  { label: "Tanggal & Nomor", key: "tanggal & nomor", sortable: true },
  { label: "Pengusul", key: "pengusul", sortable: false },
  { label: "waktu", key: "waktu", sortable: true },
];

/* EDIT JUDUL  */
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

/* STATUS FILTER */
const filterStatus = ref<string>("Semua");
const openFilterStatus = ref<boolean>(false);
const selectFilterStatus = (val: string) => {
  filterStatus.value = val;
  openFilterStatus.value = false;
};

/* Modal control (A - openAdd = true to open) */
const openAdd = ref<boolean>(false);

/* Modal inputs */
const nomorSurat = ref<string>("3");
const computedNomorSurat = computed(
  () => `BAC...../U/18/LPPNPI/PGD.07/XI/2024`,
);

/* Dummy data */
const rows = ref<any[]>([
  {
    id: "1",
    jenis: "BAC",
    jabatan: "Direktur Utama",
    perihal: "Berita Acara Stock Opname",
    tanggal_nomor: "06.11.2024 / 1/BAC/U/18/LPPNPI/PGD.07/XI/2024",
    pengusul: "IKA OCTAFIA SAPUTRI",
    waktu: "15:34",
    tanggal: "28.02.2024",
    klasifikasi: "PGD.07 - Inventarisasi Barang",
    jenis_naskah: "BAC - Berita Acara",
    nomor_surat: ["1/BAC/U/18/LPPNPI/PGD.07/XI/2024"],
  },
  {
    id: "2",
    jenis: "SPR",
    jabatan: "Direktur Operasi",
    perihal: "On The Job Training Instructor",
    tanggal_nomor: "28.02.2024 / 02/SPR/U/12/LPPNPI/PGD.03/II/2024",
    pengusul: "SITI RAHAYU",
    waktu: "16:37",
    tanggal: "15.03.2024",
    klasifikasi: "PGD.03 - Pelatihan",
    jenis_naskah: "SPR - Surat Perintah",
    nomor_surat: ["02/SPR/U/12/LPPNPI/PGD.03/II/2024"],
  },
  {
    id: "3",
    jenis: "SK",
    jabatan: "Direktur SDM",
    perihal: "Penetapan Jadwal Pelatihan",
    tanggal_nomor: "15.03.2024 / 05/SK/U/14/LPPNPI/PGD.05/III/2024",
    pengusul: "AHMAD HIDAYAT",
    waktu: "09:15",
    tanggal: "28.02.2024",
    klasifikasi: "PGD.05 - Penjadwalan",
    jenis_naskah: "SK - Surat Keputusan",
    nomor_surat: ["05/SK/U/14/LPPNPI/PGD.05/III/2024"],
  },
  {
    id: "4",
    jenis: "MOU",
    jabatan: "Direktur Utama",
    perihal: "Kerja Sama dengan PT Mitra Sejahtera",
    tanggal_nomor: "20.04.2024 / 08/MOU/U/20/LPPNPI/PGD.10/IV/2024",
    pengusul: "BUDI SANTOSO",
    waktu: "14:22",
    tanggal: "20.04.2024",
    klasifikasi: "PGD.10 - Kerja Sama",
    jenis_naskah: "MOU - Memorandum of Understanding",
    nomor_surat: ["08/MOU/U/20/LPPNPI/PGD.10/IV/2024"],
  },
]);

/* FILTER + SEARCH */
const filteredRows = computed(() => {
  const s = search.value.toLowerCase();
  const fs = filterStatus.value;

  return rows.value.filter((r) => {
    const matchSearch = Object.values(r).some((v) =>
      String(v).toLowerCase().includes(s),
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

/* WATCHERS: reset page when relevant changes */
watch([search, rowsPerPage, sortBy, sortDir, filterStatus], () => {
  currentPage.value = 1;
});

/* Simulated loading */
onMounted(() => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 700);
});

/* COPY nomor */
const copyNomor = async () => {
  try {
    await navigator.clipboard.writeText(computedNomorSurat.value);
    // simple feedback, replace with toast if you have one
    // alert("Nomor disalin");
  } catch (err) {
    // ignore
  }
};

/* Close dropdown when click outside */
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const dropdownEls = document.querySelectorAll("[data-custom-dropdown]");
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) return;
  }
  openFilterStatus.value = false;
}

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<style scoped>
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
/* small fade-in for dropdown */
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
