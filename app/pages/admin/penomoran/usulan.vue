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
              <td class="px-5 py-4">{{ row.penandatangan }}</td>
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
        @submit="handleSubmitFromModal"
        @preview="handlePreview"
      />
    </div>
  </div>
  <!------------->
  <!-- MODAL ROW DETAIL -->
  <!------------->
  <Modal v-model="openDetail" :hideDefaultFooter="true">
    <!-- TITLE -->
    <template #title>
      <div class="flex justify-between items-center w-full px-5 pt-6 pb-3">
        <h2 class="text-lg font-semibold uppercase">
          {{ selectedRow?.jenis_naskah || "Detail" }}
        </h2>

        <!-- <span class="text-xs text-gray-500">
          {{ selectedRow?.timestamp || "—" }}
        </span> -->
      </div>
    </template>

    <!-- BODY -->
    <div v-show="selectedRow" class="space-y-6 text-sm px-5 pb-3">
      <!-- Judul Besar -->
      <p class="text-gray-900 font-semibold leading-relaxed text-base">
        {{ selectedRow.perihal }}
      </p>

      <!-- Tanggal -->
      <div class="pb-2 border-b border-gray-200">
        <p class="text-gray-500 text-xs">Tanggal</p>
        <p class="font-medium mt-1">{{ selectedRow.tanggal }}</p>
      </div>

      <!-- Penandatangan -->
      <div class="pb-2 border-b border-gray-200">
        <p class="text-gray-500 text-xs">Penandatangan</p>
        <p class="font-medium mt-1">{{ selectedRow.penandatangan }}</p>
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

        <!-- Jika nomor_surat array -->
        <div
          v-if="Array.isArray(selectedRow.nomor_surat)"
          class="space-y-4 mt-2"
        >
          <div
            v-for="(no, idx) in selectedRow.nomor_surat"
            :key="idx"
            class="space-y-2"
          >
            <!-- Nomor surat -->

            <div class="flex items-center gap-2">
              <input
                class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                :value="no"
                readonly
              />

              <button
                @click="handleCopy(no, idx)"
                class="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center"
              >
                <Copy class="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <!-- Upload dengan ICON -->
            <label
              class="w-full mb-7 flex items-center gap-3 cursor-pointer border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
            >
              <svg
                class="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>

              <span class="text-gray-600">Upload File</span>

              <input
                type="file"
                class="hidden"
                @change="handleFile(idx, $event)"
              />
            </label>
          </div>
        </div>

        <!-- Jika nomor_surat string -->
        <div v-else class="mt-2 space-y-2">
          <div class="flex items-center gap-2">
            <input
              class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              :value="selectedRow.nomor_surat"
              readonly
            />

            <button
              @click="handleCopy(no, idx)"
              class="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center"
            >
              <Copy class="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <!-- Upload tunggal -->

          <label
            class="w-full flex items-center gap-3 cursor-pointer border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
          >
            <svg
              class="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>

            <span class="text-gray-600">Upload File</span>

            <input
              type="file"
              class="hidden"
              @change="handleFile(idx, $event)"
            />
          </label>
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
import { Search, ArrowUpDown, Plus, Copy } from "lucide-vue-next";
import AddUsulan from "~/components/AddUsulan.vue";
import type { PenomoranPayload } from "~/types/penomoran";
import Heading from "~/components/Heading.vue";
import PageHeader from "~/components/PageHeader.vue";
import { UInput, USelect, Modal } from "#components";
import { usePenomoran } from "~/composables/usePenomoran";
import type penandatangan from "../digsig/penandatangan.vue";
import { useApi } from "~/composables/useApi";

const { get } = useApi();

// FETCH
const { savePenomoran, isLoadingPenomoran } = usePenomoran();
const toast = useToast();
const openDetail = ref(false);

const form = ref({
  tanggal: null,
  jenis: "",
  klasifikasi: "",
  perihal: "",
  jumlah: 1,
});

const hapusUsulan = async () => {
  if (!selectedRow.value?.id) return;

  const id = selectedRow.value.id;

  try {
    const res = await get(`/admin/nomor-request/${id}`, {
      method: "DELETE",
    });

    if (!res.success) {
      toast.add({
        title: "Gagal",
        description: "Usulan tidak dapat dihapus.",
        color: "red",
      });
      return;
    }

    // Hapus row di frontend agar tabel langsung update
    rows.value = rows.value.filter((row) => row.id !== id);

    // Tutup modal
    openDetail.value = false;

    toast.add({
      title: "Berhasil",
      description: "Usulan berhasil dihapus",
      color: "green",
    });
  } catch (err) {
    console.error("❌ Error hapus usulan:", err);
    toast.add({
      title: "Error",
      description: "Terjadi kesalahan saat menghapus usulan.",
      color: "red",
    });
  }
};

const fetchData = async () => {
  try {
    const data = await getListUsulan();
    rows.value = data.map((item) => ({
      id: item.id,
      jenis: item.jenis,
      tanggal: item.tanggal,
      perihal: item.perihal,
      jumlah: item.jumlah,
      penandatangan: item.nama || "-",
      pengusul: item.nama || "-",
      tglUsulan: new Date(item.created_at).toLocaleString("id-ID"),
      status: item.status,
    }));
  } catch (err) {
    console.error("Gagal fetch data:", err);
  }
};

const submitAndClose = async () => {
  // Validasi form
  if (
    !form.value.tanggal ||
    !form.value.jenis ||
    !form.value.klasifikasi ||
    !form.value.penandatangan ||
    !form.value.perihal ||
    Number(form.value.jumlah) < 1
  ) {
    toast.add({
      title: "Form tidak lengkap",
      description: "Pastikan semua field diisi dan jumlah minimal 1",
      color: "error",
    });
    return;
  }

  // Siapkan payload
  const payload = {
    position_id: 70016786,
    tanggal: new Date(form.value.tanggal),
    jenis: form.value.jenis,
    klasifikasi: form.value.klasifikasi,
    Penandatangan: form.value.penandatangan,
    perihal: form.value.perihal,
    jumlah: Number(form.value.jumlah),
  };

  console.log("PAYLOAD:", payload);

  try {
    // Simpan ke backend
    await savePenomoran(payload);

    // Toast sukses
    toast.add({
      title: "Berhasil disimpan",
      description: "Usulan penomoran berhasil ditambahkan",
      color: "success",
    });

    // Tambahkan langsung ke tabel
    rows.value.push({
      id: Date.now().toString(),
      jenis: payload.jenis,
      tanggal: payload.tanggal.toLocaleDateString("id-ID"),
      perihal: payload.perihal,
      jumlah: payload.jumlah,
      pengusul: "Anda", // bisa diganti sesuai user login
      tglUsulan: new Date().toLocaleString("id-ID"),
      status: "Belum Diajukan",
      klasifikasi: payload.klasifikasi,
      penandatangan: payload.penandatangan,
      jenis_naskah: `${payload.jenis} - ${payload.perihal}`,
    });

    // Reset form
    form.value = {
      tanggal: "",
      klasifikasi: "",
      jenis: "",
      penandatangan: "",
      perihal: "",
      jumlah: "",
    };

    // Tutup modal
    emit("update:modelValue", false);
  } catch (error: any) {
    console.error("Gagal menyimpan penomoran:", error);
    toast.add({
      title: "Gagal menyimpan",
      description: error.message || "Terjadi kesalahan saat menyimpan",
      color: "error",
    });
  }
};

const { submitBooking, isLoadingBooking } = usePenomoran();

// const openPreview = ref(false);
const selectedRow = ref<any>(null);

// Menampung file upload sesuai index nomor_surat
const uploadedFiles = ref<File[]>([]);

// Handle input file di modal
const files = ref([]);

const handleFile = async (index: number, e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const base64 = await toBase64(file);

  files.value[index] = {
    file_name: file.name,
    file_text: base64.split(",")[1], // ambil raw base64
  };

  console.log("FILES SEND:", files.value);
};

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value);

  toast.add({
    title: "Tersalin",
    description: `Nomor surat "${value}" berhasil disalin.`,
    color: "success",
    icon: "i-lucide-copy",
  });
};

// Function saat klik row
// function openRowModal(row) {
//   selectedRow.value = row;
//   openPreview.value = true;
// }
function handlePreview(data) {
  selectedRow.value = data;
  openAdd.value = false;
  openDetail.value = true;
  uploadedFiles.value = Array(
    Array.isArray(data.nomor_surat) ? data.nomor_surat.length : 1,
  ).fill(null);
}

// function openRowModal(row) {
//   selectedRow.value = row;
//   uploadedFiles.value = Array(
//     Array.isArray(row.nomor_surat) ? row.nomor_surat.length : 1,
//   ).fill(null);

//   openDetail.value = true;
// }

const { getDetailUsulan } = usePenomoran();

async function openRowModal(row) {
  try {
    const detail = await getDetailUsulan(row.id);

    // jika BE sudah ada nomor_surat → gunakan
    const nomorSuratArray = Array.isArray(detail.nomor_surat)
      ? detail.nomor_surat
      : detail.nomor_surat
        ? [detail.nomor_surat]
        : Array(detail.jumlah).fill(""); // kalau belum ada → generate kosong sebanyak JUMALAH

    selectedRow.value = {
      id: detail.id,
      jenis: detail.jenis,
      jenis_naskah: `${detail.jenis} - ${detail.perihal}`,
      tanggal: detail.tanggal,
      perihal: detail.perihal,
      jumlah: detail.jumlah,
      penandatangan: detail.nama,
      klasifikasi: detail.klasifikasi,
      status: detail.status,

      // isi array nomor_surat
      nomor_surat: nomorSuratArray,
    };

    // siapkan file upload array sesuai jumlah nomor
    uploadedFiles.value = Array(nomorSuratArray.length).fill(null);

    openDetail.value = true;
  } catch (err) {
    console.error("Gagal load detail:", err);
    toast.add({
      title: "Gagal memuat detail",
      color: "error",
    });
  }
}

// GET PENOMORAN
const { getListUsulan } = usePenomoran();

const rows = ref([]);

onMounted(async () => {
  const data = await getListUsulan();

  rows.value = data.map((item) => ({
    id: item.id,
    jenis: item.jenis,
    tanggal: item.tanggal,
    perihal: item.perihal,
    jumlah: item.jumlah,

    // BE tidak punya “pengirim” → pakai nama
    penandatangan: item.nama || "-",

    // Pengusul → juga pakai nama
    pengusul: item.nama || "-",

    // Format created_at → “DD/MM/YYYY, HH:mm”
    tglUsulan: new Date(item.created_at).toLocaleString("id-ID"),

    status: item.status,
  }));
});

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

// ✅ PERBAIKAN: handleSubmitFromModal di parent component

// const { savePenomoran, isLoadingPenomoran } = usePenomoran();
// const toast = useToast();

const handleSubmitFromModal = async (payload) => {
  console.log("📥 Received payload from modal:", payload);

  try {
    // ✅ Kirim ke backend dulu
    const response = await savePenomoran(payload);

    console.log("✅ Response dari backend:", response);

    // ✅ Setelah berhasil, tambahkan ke tabel lokal
    rows.value.push({
      id: response.data?.id || Date.now().toString(),
      jenis: payload.jenis,
      tanggal: new Date(payload.tanggal).toLocaleDateString("id-ID"),
      perihal: payload.perihal,
      jumlah: payload.jumlah,
      penandatangan: form.value.penandatangan || "-", // ✅ Simpan dari form untuk display saja
      pengusul: "Anda", // atau ambil dari user session
      tglUsulan: new Date().toLocaleString("id-ID"),
      status: "Belum Diajukan",
      klasifikasi: payload.klasifikasi,
      jenis_naskah: `${payload.jenis} - ${payload.perihal}`,
      nomor_surat: response.data?.nomor_surat || [], // dari BE
    });

    // Reset pagination
    currentPage.value = 1;

    toast.add({
      title: "Berhasil",
      description: "Usulan berhasil ditambahkan",
      color: "green",
    });
  } catch (error) {
    console.error("❌ Error di handleSubmitFromModal:", error);

    // Toast sudah ditampilkan di usePenomoran,
    // tapi bisa tambahkan log atau handling khusus di sini
  }
};

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

const submitUsulan = async () => {
  if (!selectedRow.value) return;

  const nomorSurat = selectedRow.value.nomor_surat;

  // Siapkan payload file untuk BE
  const filesPayload = [];

  if (Array.isArray(nomorSurat)) {
    // Multiple nomor_surat → banyak file
    nomorSurat.forEach((no: string, idx: number) => {
      const file = uploadedFiles.value[idx];
      if (file) {
        filesPayload.push({
          file_name: file.name,
          file_text: file, // langsung kirim file (tanpa text/base64)
        });
      }
    });
  } else {
    // Single nomor_surat
    const file = uploadedFiles.value[0];
    if (file) {
      filesPayload.push({
        file_name: file.name,
        file_text: file,
      });
    }
  }

  try {
    await submitBooking(selectedRow.value.id_request, { files: filesPayload });
    // openPreview.value = false;
  } catch (e) {
    console.error("Gagal submit booking:", e);
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

// onMounted(() => {
//   document.addEventListener("click", handleDocumentClick);
// });
// onBeforeUnmount(() => {
//   document.removeEventListener("click", handleDocumentClick);
// });
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
