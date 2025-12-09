<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 pb-10">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Daftar Usulan Dokumen
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- ADD BUTTON (buka modal) -->
      <button
        @click="openAdd = true"
        class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-xs transition"
      >
        <Plus class="w-4 h-4" />
        Tambah Usulan
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

        <!-- Filter button + dropdown (wrapped relative) -->
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

          <!-- Dropdown (positioned relative to button) -->
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
              :key="row.id"
              class="hover:bg-gray-50 cursor-pointer border-b border-gray-200 transition"
              @click="openRowModal(row)"
            >
              <td class="px-5 py-4">{{ row.id }}</td>
              <td class="px-5 py-4">{{ row.jenis }}</td>
              <td class="px-5 py-4">{{ row.tanggal }}</td>
              <td class="px-5 py-4">{{ row.perihal }}</td>
              <td class="px-5 py-4">{{ row.penanda }}</td>
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
  <Modal v-model="openPreview" :hideDefaultFooter="true">
    <!-- TITLE -->
    <template #title>
      <div class="flex justify-between items-center w-full px-5 pt-6 pb-3">
        <h2 class="text-lg font-semibold uppercase">
          {{ selectedRow?.jenis_naskah || "Detail" }}
        </h2>
        <!-- 
              <span class="text-xs text-gray-500">
                {{ selectedRow?.timestamp || "—" }}
              </span> -->
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
        <p class="font-medium mt-1">{{ selectedRow.tanggal }}</p>
      </div>

      <!-- Pengirim -->
      <div class="pb-2 border-b border-gray-200">
        <p class="text-gray-500 text-xs">Pengirim</p>
        <p class="font-medium mt-1">{{ selectedRow.pengirim }}</p>
      </div>

      <!-- Klasifikasi -->
      <div class="pb-2 border-b border-gray-200">
        <p class="text-gray-500 text-xs">Klasifikasi</p>
        <p class="font-medium mt-1">{{ selectedRow.klasifikasi }}</p>
      </div>

      <!-- Jenis Naskah -->
      <div class="pb-2 border-b border-gray-200">
        <p class="text-gray-500 text-xs">Jenis Naskah</p>
        <p class="font-medium mt-1">{{ selectedRow.jenis_naskah }}</p>
      </div>

      <!-- Nomor Surat -->
      <div class="pb-2">
        <p class="text-gray-500 text-xs">Nomor Surat</p>

        <div class="flex items-center gap-2 mt-2">
          <input
            class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
            :value="selectedRow.nomor_surat"
            readonly
          />

          <button @click="copyNomor" class="p-2 border rounded-md">
            <svg
              class="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16h8M8 12h8m-7 8h6m-2-16h2a2 2 0 012 2v14a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2h2"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <template #footer>
      <div class="flex justify-end gap-3 px-5 py-4 border-t border-gray-200">
        <button
          @click="submitUsulan"
          class="px-5 py-2 text-xs bg-primary text-white rounded-md"
        >
          Kirim Usulan
        </button>
        <button
          @click="hapusUsulan"
          class="px-5 py-2 text-xs border border-red-400 text-red-600 rounded-md"
        >
          Hapus Usulan
        </button>

        <!-- <button
            @click="$emit('hapus-usulan')"
            class="px-5 py-2 text-xs border border-red-400 text-red-600 rounded-md"
          >
            Hapus Usulan
          </button> -->
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
  { label: "Usulan", to: "/admin/penomoran/usulan" },
];

/* TABLE CONFIG */
const headers = [
  { label: "ID", key: "id", sortable: true },
  { label: "Jenis", key: "jenis", sortable: true },
  { label: "Tanggal", key: "tanggal", sortable: true },
  { label: "Perihal", key: "perihal", sortable: false },
  { label: "Penanda Tangan", key: "penanda", sortable: false },
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
    id: "1534490706124",
    jenis: "BAC",
    tanggal: "06.11.2024",
    perihal: "BERITA ACARA STOCK OPNAME BARANG PERSEDIAAN SUKU",
    penanda: "Direktur Utama",
    jumlah: 1,
    pengusul: "Natassia Nurcurie",
    tglUsulan: "06 November 24 15:34",
    status: "Belum Diajukan",

    // EXTRA FOR MODAL ONLY
    pengirim: "Direktur Utama",
    klasifikasi: "PGD.07 - Inventarisasi Barang",
    jenis_naskah: "BAC - Berita Acara",
    nomor_surat: "1/BAC/U/18/LPPNPI/PGD.07/XI/2024",
  },

  {
    id: "1537437828224",
    jenis: "SPR",
    tanggal: "28.02.2024",
    perihal: "PENETAPAN ON THE JOB TRAINING INSTRUCTOR",
    penanda: "Direktur Operasi",
    jumlah: 1,
    pengusul: "Firda Kabisatika",
    tglUsulan: "28 February 24 16:37",
    status: "Menunggu Verifikasi",

    // EXTRA
    pengirim: "Direktur Operasi",
    klasifikasi: "PGD.03 - Pelatihan",
    jenis_naskah: "SPR - Surat Perintah",
    nomor_surat: "02/SPR/U/12/LPPNPI/PGD.03/II/2024",
  },

  {
    id: "1534408877125",
    jenis: "SK",
    tanggal: "15.03.2024",
    perihal: "PENETAPAN JADWAL PELATIHAN",
    penanda: "Direktur SDM",
    jumlah: 2,
    pengusul: "Ahmad Rizki",
    tglUsulan: "15 March 24 09:15",
    status: "Disetujui",

    // EXTRA
    pengirim: "Direktur SDM",
    klasifikasi: "PGD.05 - Penjadwalan",
    jenis_naskah: "SK - Surat Keputusan",
    nomor_surat: "05/SK/U/14/LPPNPI/PGD.05/III/2024",
  },

  {
    id: "15343432246126",
    jenis: "MOU",
    tanggal: "20.04.2024",
    perihal: "KERJA SAMA DENGAN PT MITRA SEJAHTERA",
    penanda: "Direktur Utama",
    jumlah: 1,
    pengusul: "Siti Aminah",
    tglUsulan: "20 April 24 14:22",
    status: "Ditolak",

    // EXTRA
    pengirim: "Direktur Utama",
    klasifikasi: "PGD.10 - Kerja Sama",
    jenis_naskah: "MOU - Memorandum of Understanding",
    nomor_surat: "08/MOU/U/20/LPPNPI/PGD.10/IV/2024",
  },
  {
    id: "1322344206125",
    jenis: "SK",
    tanggal: "15.03.2024",
    perihal: "PENETAPAN JADWAL PELATIHAN",
    penanda: "Direktur SDM",
    jumlah: 2,
    pengusul: "Ahmad Rizki",
    tglUsulan: "15 March 24 09:15",
    status: "Disetujui",

    // EXTRA
    pengirim: "Direktur SDM",
    klasifikasi: "PGD.05 - Penjadwalan",
    jenis_naskah: "SK - Surat Keputusan",
    nomor_surat: "05/SK/U/14/LPPNPI/PGD.05/III/2024",
  },
  {
    id: "19754344206124",
    jenis: "BAC",
    tanggal: "06.11.2024",
    perihal: "BERITA ACARA STOCK OPNAME BARANG PERSEDIAAN SUKU",
    penanda: "Direktur Utama",
    jumlah: 1,
    pengusul: "Natassia Nurcurie",
    tglUsulan: "06 November 24 15:34",
    status: "Belum Diajukan",

    // EXTRA FOR MODAL ONLY
    pengirim: "Direktur Utama",
    klasifikasi: "PGD.07 - Inventarisasi Barang",
    jenis_naskah: "BAC - Berita Acara",
    nomor_surat: "1/BAC/U/18/LPPNPI/PGD.07/XI/2024",
  },

  {
    id: "1864274528224",
    jenis: "SPR",
    tanggal: "28.02.2024",
    perihal: "PENETAPAN ON THE JOB TRAINING INSTRUCTOR",
    penanda: "Direktur Operasi",
    jumlah: 1,
    pengusul: "Firda Kabisatika",
    tglUsulan: "28 February 24 16:37",
    status: "Menunggu Verifikasi",

    // EXTRA
    pengirim: "Direktur Operasi",
    klasifikasi: "PGD.03 - Pelatihan",
    jenis_naskah: "SPR - Surat Perintah",
    nomor_surat: "02/SPR/U/12/LPPNPI/PGD.03/II/2024",
  },
  {
    id: "1534408314525",
    jenis: "SK",
    tanggal: "15.03.2024",
    perihal: "PENETAPAN JADWAL PELATIHAN",
    penanda: "Direktur SDM",
    jumlah: 2,
    pengusul: "Ahmad Rizki",
    tglUsulan: "15 March 24 09:15",
    status: "Disetujui",

    // EXTRA
    pengirim: "Direktur SDM",
    klasifikasi: "PGD.05 - Penjadwalan",
    jenis_naskah: "SK - Surat Keputusan",
    nomor_surat: "05/SK/U/14/LPPNPI/PGD.05/III/2024",
  },

  {
    id: "153434086656126",
    jenis: "MOU",
    tanggal: "20.04.2024",
    perihal: "KERJA SAMA DENGAN PT MITRA SEJAHTERA",
    penanda: "Direktur Utama",
    jumlah: 1,
    pengusul: "Siti Aminah",
    tglUsulan: "20 April 24 14:22",
    status: "Ditolak",

    // EXTRA
    pengirim: "Direktur Utama",
    klasifikasi: "PGD.10 - Kerja Sama",
    jenis_naskah: "MOU - Memorandum of Understanding",
    nomor_surat: "08/MOU/U/20/LPPNPI/PGD.10/IV/2024",
  },
  {
    id: "1975238706124",
    jenis: "BAC",
    tanggal: "06.11.2024",
    perihal: "BERITA ACARA STOCK OPNAME BARANG PERSEDIAAN SUKU",
    penanda: "Direktur Utama",
    jumlah: 1,
    pengusul: "Natassia Nurcurie",
    tglUsulan: "06 November 24 15:34",
    status: "Belum Diajukan",

    // EXTRA FOR MODAL ONLY
    pengirim: "Direktur Utama",
    klasifikasi: "PGD.07 - Inventarisasi Barang",
    jenis_naskah: "BAC - Berita Acara",
    nomor_surat: "1/BAC/U/18/LPPNPI/PGD.07/XI/2024",
  },

  {
    id: "18698980028224",
    jenis: "SPR",
    tanggal: "28.02.2024",
    perihal: "PENETAPAN ON THE JOB TRAINING INSTRUCTOR",
    penanda: "Direktur Operasi",
    jumlah: 1,
    pengusul: "Firda Kabisatika",
    tglUsulan: "28 February 24 16:37",
    status: "Menunggu Verifikasi",

    // EXTRA
    pengirim: "Direktur Operasi",
    klasifikasi: "PGD.03 - Pelatihan",
    jenis_naskah: "SPR - Surat Perintah",
    nomor_surat: "02/SPR/U/12/LPPNPI/PGD.03/II/2024",
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

/* BADGE COLORS */
const badgeColor = (status: string) =>
  ({
    "Belum Diajukan": "bg-gray-500 text-gray-700",
    "Menunggu Verifikasi": "bg-yellow-200 text-yellow-700",
    Disetujui: "bg-green-200 text-green-700",
    Ditolak: "bg-red-200 text-red-700",
  })[status.trim()] || "bg-gray-200 text-gray-700";

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

/* Submit & Hapus (sederhana, karena ini contoh) */
const submitUsulan = () => {
  // contoh: kirim data ke API
  // axios.post('/api/usulan', { ... })
  openAdd.value = false;
};

const hapusUsulan = () => {
  if (!selectedRow.value) return;

  // Hapus row dari tabel
  rows.value = rows.value.filter((r) => r.id !== selectedRow.value.id);

  // Tutup modal preview
  openPreview.value = false;

  // Bersihkan selectedRow
  selectedRow.value = null;
};
// const hapusUsulan = () => {
//   if (!selectedRow.value) return;

//   if (!confirm("Yakin ingin menghapus usulan ini?")) return;

//   rows.value = rows.value.filter((r) => r.id !== selectedRow.value.id);
//   openPreview.value = false;
//   selectedRow.value = null;
// };

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
