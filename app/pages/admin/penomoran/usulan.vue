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

      <!-- ✅ Klasifikasi dengan format "CODE - TEXT" -->
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

      <!-- Nomor Surat -->
      <div class="pb-2">
        <p class="text-gray-500 text-xs mb-2">Nomor Surat</p>

        <!-- Array nomor surat -->
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
                class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
                :value="no"
                readonly
              />

              <button
                @click="handleCopy(no)"
                class="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center"
              >
                <Copy class="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <!-- Upload dengan ICON -->
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

              <span class="text-gray-600">
                {{ files[idx]?.file_name || "Upload File" }}
              </span>

              <input
                type="file"
                class="hidden"
                @change="handleFile(idx, $event)"
              />
            </label>
          </div>
        </div>

        <!-- Single nomor surat -->
        <div v-else class="mt-2 space-y-2">
          <div class="flex items-center gap-2">
            <input
              class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
              :value="selectedRow.nomor_surat"
              readonly
            />

            <button
              @click="handleCopy(selectedRow.nomor_surat)"
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

            <span class="text-gray-600">
              {{ files[0]?.file_name || "Upload File" }}
            </span>

            <input type="file" class="hidden" @change="handleFile(0, $event)" />
          </label>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <template #footer>
      <div class="flex justify-end gap-3 px-5 py-4 border-t border-gray-200">
        <button
          @click="submitUsulan"
          :disabled="isLoadingBooking || isDeletingUsulan"
          class="px-5 py-2 text-xs bg-primary text-white rounded-md hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoadingBooking ? "Mengirim..." : "Kirim Usulan" }}
        </button>
        <button
          @click="hapusUsulan"
          :disabled="isLoadingBooking || isDeletingUsulan"
          class="px-5 py-2 text-xs border border-red-400 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isDeletingUsulan ? "Menghapus..." : "Hapus Usulan" }}
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
import { usePenomoran } from "~/composables/usePenomoran";
import { useAuth } from "~/composables/useAuth";

const { user, getProfile } = useAuth();
const {
  savePenomoran,
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
const files = ref([]);
const uploadedFiles = ref([]);

// ✅ Person mapping
const personMap = ref(new Map());
// ✅ Klasifikasi mapping untuk display
const klasifikasiMap = ref(new Map());

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

// ✅ Fetch klasifikasi map untuk display
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

// ✅ FETCH DATA
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

      return {
        id: item.id,
        jenis: item.jenis,
        tanggal: item.tanggal,
        perihal: item.perihal,
        jumlah: item.jumlah,
        penandatangan: item.penandatangan || "-",
        klasifikasi: item.klasifikasi || "-",
        klasifikasiDisplay: klasifikasiDisplay,
        pengusul: pengusulInfo.nama || item.nama || user.value?.nama || "-",
        tglUsulan: new Date(item.created_at).toLocaleString("id-ID"),
        status: item.status,
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

// ✅ OPEN ROW MODAL
const openRowModal = async (row) => {
  try {
    console.log("🔍 Opening row modal for:", row.id);

    const detail = await getDetailUsulan(row.id);

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

    selectedRow.value = {
      id: detail.id,
      jenis: detail.jenis,
      jenis_naskah: detail.jenis,
      tanggal: detail.tanggal,
      perihal: detail.perihal,
      jumlah: detail.jumlah,
      penandatangan: detail.penandatangan || detail.nama || "-",
      klasifikasi: detail.klasifikasi || "-",
      klasifikasiDisplay: klasifikasiDisplay,
      status: detail.status || "-",
      nomor_surat: nomorSuratArray,
      template_nomor: detail.template_nomor || "",
    };

    files.value = Array(nomorSuratArray.length).fill(null);
    uploadedFiles.value = Array(nomorSuratArray.length).fill(null);

    openDetail.value = true;
    console.log("✅ Modal opened:", selectedRow.value);
  } catch (err) {
    console.error("❌ Gagal load detail:", err);
    toast.add({
      title: "Gagal memuat detail",
      description: "Silakan coba lagi",
      color: "red",
    });
  }
};

// ✅ HANDLE FILE UPLOAD
const handleFile = async (index: number, e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const base64 = await toBase64(file);

  files.value[index] = {
    file_name: file.name,
    file_text: base64.split(",")[1],
  };

  console.log("✅ File uploaded at index", index, ":", file.name);
};

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ✅ HANDLE COPY
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

// ✅ HANDLE PREVIEW
function handlePreview(data: any) {
  selectedRow.value = data;
  openAdd.value = false;
  openDetail.value = true;

  const length = Array.isArray(data.nomor_surat) ? data.nomor_surat.length : 1;

  files.value = Array(length).fill(null);
  uploadedFiles.value = Array(length).fill(null);
}

// ✅ SUBMIT USULAN
const submitUsulan = async () => {
  if (!selectedRow.value) return;

  // ambil file yang benar-benar diupload
  const uploadedFiles = files.value.filter((f) => f && f.file_text);

  try {
    await submitBooking(selectedRow.value.id, {
      files: uploadedFiles.length > 0 ? uploadedFiles : [], // opsional
    });

    openDetail.value = false;
    await fetchData();

    toast.add({
      title: "Berhasil",
      description: "Usulan berhasil dikirim",
      color: "green",
    });
  } catch (e) {
    console.error("❌ Gagal submit usulan:", e);
    toast.add({
      title: "Gagal",
      description: "Gagal mengirim usulan, silakan coba lagi",
      color: "red",
    });
  }
};

// ✅ HAPUS USULAN
const hapusUsulan = async () => {
  if (!selectedRow.value?.id) return;

  if (!confirm("Apakah Anda yakin ingin menghapus usulan ini?")) {
    return;
  }

  const id = selectedRow.value.id;
  isDeletingUsulan.value = true;

  try {
    await deleteUsulan(id);
    openDetail.value = false;
    await fetchData();

    toast.add({
      title: "Berhasil",
      description: "Data berhasil dihapus",
      color: "green",
    });
  } catch (err) {
    console.error("❌ Error hapus usulan:", err);
  } finally {
    isDeletingUsulan.value = false;
  }
};

// ✅ HANDLE SUBMIT FROM MODAL
const handleSubmitFromModal = async (payload: any) => {
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

    let formattedDate;
    try {
      const dateObj = new Date(payload.tanggal);
      formattedDate = dateObj.toISOString().split("T")[0];
      console.log("📅 Tanggal formatted:", formattedDate);
    } catch (e) {
      console.error("❌ Error format tanggal:", e);
      formattedDate = payload.tanggal;
    }

    const formattedPayload = {
      position_id: Number(payload.position_id),
      tanggal: formattedDate,
      jenis: String(payload.jenis),
      klasifikasi: String(payload.klasifikasi),
      perihal: String(payload.perihal),
      penandatangan: String(payload.penandatangan),
      id_position_penandatangan: Number(payload.id_position_penandatangan),
      jumlah: Number(payload.jumlah),
    };

    console.log(
      "📦 Formatted payload:",
      JSON.stringify(formattedPayload, null, 2),
    );

    await savePenomoran(formattedPayload);
    await fetchData();
    currentPage.value = 1;

    toast.add({
      title: "Berhasil",
      description: "Usulan berhasil ditambahkan",
      color: "green",
    });
  } catch (err) {
    console.error("❌ Error submit modal:", err);

    const errorMessage =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Usulan gagal dikirim";

    toast.add({
      title: "Gagal",
      description: errorMessage,
      color: "red",
    });
  }
};

// ✅ FORMAT DATE
const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

// ✅ INIT
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

/* SORT STATE - ✅ Default DESC by Tanggal Usulan */
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

/* Modal control */
const openAdd = ref<boolean>(false);

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
