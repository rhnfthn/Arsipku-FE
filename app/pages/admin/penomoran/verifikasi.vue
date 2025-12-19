<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 pb-10">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Daftar Verifikasi Penomoran
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
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
              class="hover:bg-gray-50 border-b border-gray-200 cursor-pointer transition"
              @click="showPreview(row)"
            >
              <td class="px-5 py-4 text-xs">{{ row.id }}</td>
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
                  <p
                    class="whitespace-normal break-words line-clamp-3 cursor-help"
                  >
                    {{ row.penandatangan }}
                  </p>

                  <!-- Tooltip -->
                  <div
                    class="absolute z-50 hidden group-hover:block bg-gray-900 text-white text-xs rounded-md px-3 py-2 mt-2 w-max max-w-xs shadow-lg"
                  >
                    {{ row.penandatangan }}
                  </div>
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
    </div>
  </div>

  <!-- MODAL VERIFIKASI -->
  <Modal v-model="openPreview" :hideDefaultFooter="true" size="xl">
    <!-- HEADER -->
    <template #title>
      <div
        class="flex items-center justify-between w-full px-6 pt-6 pb-4 border-b border-gray-200"
      >
        <h2 class="text-xl font-bold text-gray-900 leading-tight pt-2">
          {{ selectedRow?.perihal }}
        </h2>
        <button
          @click="openPreview = false"
          class="text-gray-600 hover:text-gray-800"
        ></button>

        <span class="text-sm text-gray-500">
          {{ formatDateTime(new Date()) }}
        </span>
      </div>
    </template>

    <!-- BODY -->
    <div
      v-if="selectedRow"
      class="px-6 pb-6 space-y-5 overflow-y-auto max-h-[70vh]"
    >
      <!-- Judul -->

      <!-- Detail Info -->
      <div class="space-y-4 text-base">
        <!-- Tanggal -->
        <div class="pb-2 border-b border-gray-200">
          <p class="text-gray-600 text-xs">Tanggal</p>
          <p class="font-medium text-gray-900 mt-1">
            {{ selectedRow.tanggal }}
          </p>
        </div>

        <!-- Pengirim -->
        <div class="pb-2 border-b border-gray-200">
          <p class="text-gray-600 text-xs">Pengirim</p>
          <p class="font-medium text-gray-900 mt-1">
            {{ selectedRow.penandatangan }}
          </p>
        </div>

        <!-- Klasifikasi -->
        <div class="pb-2 border-b border-gray-200">
          <p class="text-gray-600 text-xs">Klasifikasi</p>
          <p class="font-medium text-gray-900 mt-1">
            {{ selectedRow.klasifikasi }}
          </p>
        </div>

        <!-- Jenis Naskah -->
        <div class="pb-2 border-b border-gray-200">
          <p class="text-gray-600 text-xs">Jenis Naskah</p>
          <p class="font-medium text-gray-900 mt-1">
            {{ selectedRow.jenis }}
          </p>
        </div>
      </div>

      <!-- File Lampiran -->
      <div v-if="selectedRow.file_path" class="pt-2">
        <label class="block text-base font-medium text-gray-900 mb-2"
          >File Lampiran Pengusul</label
        >
        <div
          class="flex items-center gap-3 p-3 bg-gray-50 border border-gray-300 rounded-lg"
        >
          <svg
            class="w-8 h-8 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-900">
              {{ getFileName(selectedRow.file_path) }}
            </p>
            <p class="text-xs text-gray-500">Dokumen lampiran</p>
          </div>
          <a
            :href="selectedRow.file_path"
            target="_blank"
            class="px-3 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary-700"
          >
            Lihat
          </a>
        </div>
      </div>

      <!-- Nomor Surat Section -->
      <div class="pt-2">
        <label class="block text-base font-medium text-gray-900 mb-3"
          >Nomor</label
        >

        <div class="space-y-3">
          <div
            v-for="(detail, idx) in selectedRow.details"
            :key="detail.id || idx"
            class="flex items-center gap-3"
          >
            <!-- Checkbox - Default ter-check -->
            <input
              type="checkbox"
              v-model="detail.checked"
              :disabled="
                detail.status === 'terpakai' ||
                detail.status === 'ditolak' ||
                detail.status === 'hangus' ||
                isProcessing
              "
              class="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            />

            <!-- Nomor Container -->
            <div
              class="relative flex flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 items-center"
            >
              <span class="text-sm text-gray-600 font-medium mr-3">{{
                idx + 1
              }}</span>

              <input
                type="text"
                :value="displayNomor(detail)"
                class="flex-1 bg-transparent outline-none text-sm text-gray-900 font-mono"
                readonly
              />

              <!-- Status Badge -->
              <span
                v-if="detail.status"
                :class="[
                  'ml-3 px-2 py-1 rounded-full text-xs font-medium',
                  {
                    'bg-yellow-100 text-yellow-700':
                      detail.status === 'pending' ||
                      detail.status === 'menunggu',
                    'bg-blue-100 text-blue-700': detail.status === 'booking',
                    'bg-green-100 text-green-700': detail.status === 'terpakai',
                    'bg-red-100 text-red-700': detail.status === 'ditolak',
                    'bg-gray-100 text-gray-700': detail.status === 'hangus',
                  },
                ]"
              >
                {{ detail.status }}
              </span>
            </div>

            <!-- Copy Button -->
            <button
              v-if="detail.nomor && detail.status === 'terpakai'"
              @click="handleCopy(detail.nomor)"
              class="p-3 rounded-lg border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center flex-shrink-0"
            >
              <Copy class="w-4 h-4 text-gray-600" />
            </button>

            <div v-else class="w-[52px]"></div>
          </div>
        </div>
      </div>

      <!-- Keterangan Jika Ada yang Tidak Di-check (Ditolak) -->
      <div v-if="hasUnchecked" class="pt-2">
        <label class="block text-base font-medium text-gray-900 mb-2"
          >Keterangan Penolakan <span class="text-red-500">*</span></label
        >

        <textarea
          v-model="keterangan_ditolak"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm min-h-[120px] bg-gray-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
          placeholder="Masukkan keterangan mengapa nomor ditolak..."
        ></textarea>
      </div>
    </div>

    <!-- FOOTER -->
    <template #footer>
      <div class="flex gap-3 px-5 py-4 border-t border-gray-200">
        <!-- Tombol Disetujui -->
        <button
          @click="confirmApproval"
          :disabled="isProcessing || !hasAnyChecked"
          class="flex-1 px-5 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          <svg
            v-if="isProcessing"
            class="animate-spin h-5 w-5"
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
          {{ isProcessing ? "Memproses..." : "Nomor Disetujui" }}
        </button>

        <!-- Tombol Ditolak -->
        <button
          @click="confirmRejection"
          :disabled="isProcessing || !hasUnchecked"
          class="flex-1 px-5 py-2 text-sm font-medium bg-white border border-red-400 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Nomor Ditolak
        </button>
      </div>
    </template>
  </Modal>

  <!-- CONFIRM MODAL APPROVE -->
  <ConfirmPopup
    v-model="showConfirmApprove"
    title="Konfirmasi Persetujuan"
    :description="`Apakah Anda yakin ingin menyetujui ${checkedCount} nomor yang dipilih?`"
    confirmText="Ya, Setujui"
    cancelText="Batal"
    @confirm="processApproval"
  />

  <!-- CONFIRM MODAL REJECT -->
  <ConfirmPopup
    v-model="showConfirmReject"
    title="Konfirmasi Penolakan"
    :description="`Apakah Anda yakin ingin menolak ${uncheckedCount} nomor yang tidak dipilih?`"
    confirmText="Ya, Tolak"
    cancelText="Batal"
    @confirm="processRejection"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { Search, ArrowUpDown, Copy } from "lucide-vue-next";
import Heading from "~/components/Heading.vue";
import PageHeader from "~/components/PageHeader.vue";
import { Modal } from "#components";
import ConfirmPopup from "~/components/ConfirmPopup.vue";
import { useToast } from "#imports";
import { usePenomoran } from "~/composables/usePenomoran";

const toast = useToast();

// Composable & API
const { getPersonWithPosition } = usePenomoran();
const { get, post, del } = useApi();

// Get user role
// const userStore = useUserStore();
// const userRole = computed(() => userStore.getRole);

/* Breadcrumb - Dynamic based on role */
// const breadcrumbs = computed(() => {
//   const role = userRole.value;

//   if (role === "admin") {
//     return [
//       { label: "Dashboard", to: "/admin/dashboard" },
//       {
//         label: "Daftar Verifikasi Penomoran",
//         to: "/admin/penomoran/verifikasi",
//       },
//     ];
//   } else if (role === "superadmin") {
//     return [
//       { label: "Dashboard", to: "/superadmin/dashboard" },
//       {
//         label: "Daftar Verifikasi Penomoran",
//         to: "/superadmin/penomoran/verifikasi",
//       },
//     ];
//   } else {
//     return [
//       { label: "Dashboard", to: "/user/dashboard" },
//       {
//         label: "Daftar Verifikasi Penomoran",
//         to: "/user/penomoran/verifikasi",
//       },
//     ];
//   }
// });
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Verifikasi", to: "/admin/verifikasi" },
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

const filterOptions = ["Semua", "Menunggu Verifikasi", "Disetujui", "Ditolak"];

const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const search = ref<string>("");
const currentPage = ref<number>(1);

const selectedRow = ref<any>(null);
const keterangan_ditolak = ref("");
const isProcessing = ref(false);

const loading = ref<boolean>(true);

/* Confirm Modals */
const showConfirmApprove = ref(false);
const showConfirmReject = ref(false);

/* SORT STATE */
const sortBy = ref<string>("tglUsulan"); // Default sort by tanggal usulan
const sortDir = ref<"asc" | "desc">("asc"); // Default ascending

const sort = (col: string) => {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = col;
    sortDir.value = "asc";
  }
};

/* STATUS FILTER */
const filterStatus = ref<string>("Menunggu Verifikasi"); // Default filter
const openFilterStatus = ref<boolean>(false);
const selectFilterStatus = (val: string) => {
  filterStatus.value = val;
  openFilterStatus.value = false;
};

/* Modal control */
const openPreview = ref(false);

/* Data rows */
const rows = ref<any[]>([]);

// Person Map
const personMap = ref(new Map());

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
  } catch (error) {
    console.error("❌ Error fetch person map:", error);
  }
};

// GET DATA DARI API
const fetchData = async () => {
  loading.value = true;

  try {
    const res = await get("/admin/nomor-request-submitted");

    if (!res?.success) {
      toast.add({
        title: "Gagal",
        description: "Tidak dapat mengambil data verifikasi",
        color: "red",
      });
      return;
    }

    rows.value = res.data.map((item: any) => {
      const person = personMap.value.get(item.persnum);

      return {
        id: item.id,
        jenis: item.jenis,
        tanggal: formatTanggal(item.tanggal),
        perihal: item.perihal,
        penandatangan: item.penandatangan || person?.position_text || "-",
        jumlah: item.jumlah,
        pengusul: person?.nama || item.nama || "-",
        tglUsulan: formatDateTime(item.created_at),
        status: item.status,
        klasifikasi: item.klasifikasi,
        file_path: item.file_path,
      };
    });

    console.log("✅ Data verifikasi berhasil dimuat:", rows.value);
  } catch (error) {
    console.error("❌ Error fetch data verifikasi:", error);
    toast.add({
      title: "Gagal memuat data",
      description: "Tidak dapat mengambil data verifikasi",
      color: "red",
    });
  } finally {
    loading.value = false;
  }
};

/* Show Preview Modal */
const showPreview = async (row: any) => {
  try {
    const mainRes = await get(`/admin/nomor-request/${row.id}`);

    if (!mainRes?.success) {
      toast.add({
        title: "Gagal",
        description: "Tidak dapat mengambil detail usulan",
        color: "red",
      });
      return;
    }

    const mainData = mainRes.data;

    const detailRes = await get(`/admin/detail-nomor-request/${row.id}`);
    const existingDetails = detailRes?.success
      ? detailRes.data?.details || []
      : [];

    // ✅ Gunakan jumlah dari tabel
    const jumlah = row.jumlah || mainData.jumlah || 0;
    const template_nomor = mainData.template_nomor || null;

    let details = [];

    if (existingDetails.length > 0) {
      // ✅ Ambil sejumlah 'jumlah' dari existing details
      details = existingDetails.slice(0, jumlah).map((d: any) => ({
        id: d.id,
        nomor: d.nomor || null,
        template_nomor: template_nomor,
        status: d.status || "booking",
        checked: true, // ✅ Default ter-check
      }));

      // ✅ Jika kurang, tambahkan pending
      const remaining = jumlah - details.length;
      for (let i = 0; i < remaining; i++) {
        details.push({
          id: null,
          nomor: null,
          template_nomor: template_nomor,
          status: "pending",
          checked: true, // ✅ Default ter-check
        });
      }
    } else {
      // ✅ Generate sejumlah 'jumlah'
      for (let i = 0; i < jumlah; i++) {
        details.push({
          id: null,
          nomor: null,
          template_nomor: template_nomor,
          status: "pending",
          checked: true, // ✅ Default ter-check
        });
      }
    }

    selectedRow.value = {
      ...row,
      ...mainData,
      jumlah: jumlah,
      details: details,
    };

    keterangan_ditolak.value = "";
    openPreview.value = true;

    console.log("✅ Jumlah nomor:", jumlah);
    console.log("✅ Details loaded:", details);
  } catch (error) {
    console.error("❌ Error fetch detail:", error);
    toast.add({
      title: "Gagal",
      description: "Terjadi kesalahan saat mengambil detail",
      color: "red",
    });
  }
};

/* Display nomor */
const displayNomor = (detail: any) => {
  if (detail.status === "terpakai" && detail.nomor) {
    return detail.nomor;
  }
  if (detail.template_nomor) {
    return detail.template_nomor;
  }
  if (selectedRow.value?.template_nomor) {
    return selectedRow.value.template_nomor;
  }
  return "-";
};

/* Handle Copy */
const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value);
  toast.add({
    title: "Tersalin",
    description: `Nomor surat "${value}" berhasil disalin.`,
    color: "success",
    icon: "i-lucide-copy",
  });
};

/* Get filename from path */
const getFileName = (path: string) => {
  if (!path) return "-";
  return path.split("/").pop() || path;
};

// Computed untuk validasi dan counting
const hasAnyChecked = computed(() => {
  return selectedRow.value?.details?.some((d: any) => d.checked) || false;
});

const hasUnchecked = computed(() => {
  return selectedRow.value?.details?.some((d: any) => !d.checked) || false;
});

const checkedCount = computed(() => {
  return selectedRow.value?.details?.filter((d: any) => d.checked).length || 0;
});

const uncheckedCount = computed(() => {
  return selectedRow.value?.details?.filter((d: any) => !d.checked).length || 0;
});

/* ✅ KONFIRMASI APPROVAL */
const confirmApproval = () => {
  if (!hasAnyChecked.value) {
    toast.add({
      title: "Peringatan",
      description: "Pilih minimal 1 nomor untuk disetujui!",
      color: "yellow",
    });
    return;
  }
  showConfirmApprove.value = true;
};

/* ✅ PROSES APPROVAL - APPROVE SATU PER SATU */
const processApproval = async () => {
  showConfirmApprove.value = false;

  if (!selectedRow.value) return;

  const approvedDetails = selectedRow.value.details.filter(
    (d: any) => d.checked,
  );

  if (approvedDetails.length === 0) {
    toast.add({
      title: "Peringatan",
      description: "Pilih minimal 1 nomor untuk disetujui!",
      color: "yellow",
    });
    return;
  }

  isProcessing.value = true;

  try {
    // ✅ Step 1: Collect existing detail IDs
    const detailsWithId = approvedDetails.filter((d) => d.id !== null);
    const detailsWithoutId = approvedDetails.filter((d) => d.id === null);

    let allDetailIds = detailsWithId.map((d) => d.id);

    // ✅ Step 2: Booking nomor yang belum punya ID
    if (detailsWithoutId.length > 0) {
      console.log(`📞 Booking ${detailsWithoutId.length} nomor baru...`);

      for (let i = 0; i < detailsWithoutId.length; i++) {
        try {
          const bookingRes = await post(
            `/admin/nomor-request/${selectedRow.value.id}/booking`,
            {},
          );

          if (bookingRes?.success && bookingRes?.data?.details) {
            bookingRes.data.details.forEach((detail: any) => {
              if (detail.id) {
                allDetailIds.push(detail.id);
              }
            });
          }
        } catch (err) {
          console.error("❌ Error booking:", err);
        }
      }
    }

    if (allDetailIds.length === 0) {
      toast.add({
        title: "Gagal",
        description: "Tidak dapat mengambil detail ID untuk approve",
        color: "red",
      });
      return;
    }

    console.log("📝 Detail IDs untuk approve:", allDetailIds);

    // ✅ Step 3: Approve SATU PER SATU (backend tidak terima array)
    let successCount = 0;
    let failedCount = 0;
    const results: any[] = [];

    for (const detailId of allDetailIds) {
      try {
        console.log(`📤 Approving detail ID: ${detailId}`);

        const approveRes = await post(
          `/admin/nomor-request-detail/${detailId}/approve`,
          {},
        );

        if (approveRes?.success) {
          successCount++;
          results.push({
            id: detailId,
            nomor: approveRes.data?.nomor || null,
            status: approveRes.data?.status || "terpakai",
            success: true,
          });
          console.log(`✅ Detail ${detailId} approved:`, approveRes.data);
        } else {
          failedCount++;
          results.push({
            id: detailId,
            success: false,
            error: approveRes?.message || "Unknown error",
          });
          console.log(`❌ Detail ${detailId} failed:`, approveRes?.message);
        }
      } catch (err: any) {
        failedCount++;
        results.push({
          id: detailId,
          success: false,
          error: err.response?.data?.message || err.message,
        });
        console.error(`❌ Error approve detail ${detailId}:`, err);
      }
    }

    console.log("✅ Approval selesai:", {
      total: allDetailIds.length,
      success: successCount,
      failed: failedCount,
      results: results,
    });

    if (successCount > 0) {
      toast.add({
        title: "Berhasil",
        description: `${successCount} nomor berhasil disetujui dan digenerate`,
        color: "green",
      });
    }

    if (failedCount > 0) {
      toast.add({
        title: "Peringatan",
        description: `${failedCount} nomor gagal digenerate`,
        color: "yellow",
      });
    }

    openPreview.value = false;
    fetchData();
  } catch (error: any) {
    console.error("❌ Error approve:", error);

    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Terjadi kesalahan saat menyetujui nomor";

    toast.add({
      title: "Gagal",
      description: Array.isArray(errorMsg) ? errorMsg.join(", ") : errorMsg,
      color: "red",
    });
  } finally {
    isProcessing.value = false;
  }
};

/* ✅ KONFIRMASI REJECTION */
const confirmRejection = () => {
  if (!hasUnchecked.value) {
    toast.add({
      title: "Peringatan",
      description: "Tidak ada nomor yang akan ditolak!",
      color: "yellow",
    });
    return;
  }

  if (!keterangan_ditolak.value.trim()) {
    toast.add({
      title: "Peringatan",
      description: "Keterangan penolakan harus diisi!",
      color: "yellow",
    });
    return;
  }

  showConfirmReject.value = true;
};

/* ✅ PROSES REJECTION - UPDATE STATUS JADI DITOLAK */
const processRejection = async () => {
  showConfirmReject.value = false;

  if (!selectedRow.value) return;

  const rejectedDetails = selectedRow.value.details.filter(
    (d: any) => !d.checked,
  );

  if (rejectedDetails.length === 0) {
    toast.add({
      title: "Peringatan",
      description: "Tidak ada nomor yang akan ditolak!",
      color: "yellow",
    });
    return;
  }

  if (!keterangan_ditolak.value.trim()) {
    toast.add({
      title: "Peringatan",
      description: "Keterangan penolakan harus diisi!",
      color: "yellow",
    });
    return;
  }

  isProcessing.value = true;

  try {
    const detailIdsToReject = rejectedDetails
      .filter((d) => d.id !== null)
      .map((d) => d.id);

    console.log("📝 Detail IDs yang akan ditolak:", detailIdsToReject);
    console.log("📝 ID Usulan utama:", selectedRow.value.id);

    const rejectRes = await post(
      `/admin/nomor-request/${selectedRow.value.id}/reject`,
      {
        keterangan: keterangan_ditolak.value,
        detail_ids: detailIdsToReject,
      },
    );

    console.log("✅ Response reject:", rejectRes);

    if (rejectRes?.success) {
      toast.add({
        title: "Berhasil",
        description: `Usulan berhasil ditolak dengan ${rejectedDetails.length} nomor ditolak`,
        color: "green",
      });

      openPreview.value = false;
      await fetchData();
    } else {
      throw new Error(rejectRes?.message || "Gagal menolak usulan");
    }
  } catch (error: any) {
    console.error("❌ Error rejection:", error);

    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Terjadi kesalahan saat menolak nomor";

    toast.add({
      title: "Gagal",
      description: errorMsg,
      color: "red",
    });
  } finally {
    isProcessing.value = false;
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

/* WATCHERS */
watch([search, rowsPerPage, sortBy, sortDir, filterStatus], () => {
  currentPage.value = 1;
});

/* Format helpers */
function formatTanggal(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | Date) {
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return `${date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} ${date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/* Close dropdown when click outside */
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const dropdownEls = document.querySelectorAll("[data-custom-dropdown]");
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) return;
  }
  openFilterStatus.value = false;
}

/* Load data on mount */
onMounted(async () => {
  await fetchPersonMap();
  await fetchData();
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
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
