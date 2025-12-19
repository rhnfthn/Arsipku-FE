<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 pb-10">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md"
          >Daftar Usulan Dokumen</Heading
        >
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
            <span class="text-sm">{{ filterStatus || "Semua" }}</span>
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
              <td class="px-5 py-4 text-xs">{{ row.displayId }}</td>
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

      <!-- MODAL TAMBAH -->
      <AddUsulan
        v-model="openAdd"
        @preview="handlePreview"
        @submit="handleSubmitUsulan"
      />
    </div>
  </div>

  <!-- MODAL ROW DETAIL -->
  <Modal v-model="openPreview" :hideDefaultFooter="true" size="xl">
    <!-- TITLE -->
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
          <p class="text-gray-500 text-xs">Penandatangan</p>
          <p class="font-medium mt-1">{{ selectedRow.penandatangan }}</p>
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
        <!-- Pengusul-->
        <div class="pb-2 border-b border-gray-200">
          <p class="text-gray-600 text-xs">Penandatangan</p>
          <p class="font-medium text-gray-900 mt-1">
            {{ selectedRow.penanda }}
          </p>
        </div>
      </div>

      <!-- Nomor Surat Section -->
      <div class="pt-4">
        <label class="block text-base font-medium text-gray-900 mb-3"
          >Nomor Surat</label
        >

        <div class="space-y-3">
          <div
            v-for="(detail, idx) in selectedRow.details"
            :key="detail.id || idx"
            class="flex items-center gap-3"
          >
            <!-- Nomor Container -->
            <div
              class="relative flex flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 items-center"
            >
              <span class="text-sm text-gray-600 font-medium mr-3">{{
                idx + 1
              }}</span>
              <input
                type="text"
                :value="detail.nomor || '-'"
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

        <!-- Jika tidak ada detail -->
        <div
          v-if="!selectedRow.details || selectedRow.details.length === 0"
          class="text-center py-8 text-gray-500"
        >
          <p class="text-sm">Belum ada nomor yang dibooking</p>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <template #footer>
      <div class="flex gap-3 px-5 py-4 border-t border-gray-200">
        <!-- Tombol Kirim Usulan (hanya jika belum diajukan) -->
        <button
          v-if="selectedRow?.status === 'Belum Diajukan'"
          @click="submitUsulan"
          :disabled="isProcessing"
          class="flex-1 px-5 py-2 text-base font-medium bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
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
          {{ isProcessing ? "Memproses..." : "Kirim Usulan" }}
        </button>

        <!-- Tombol Hapus (hanya jika belum diajukan) -->
        <button
          v-if="selectedRow?.status === 'Belum Diajukan'"
          @click="hapusUsulan"
          :disabled="isProcessing"
          class="flex-1 px-5 py-2 text-base font-medium bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Hapus Usulan
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { Search, ArrowUpDown, Plus, Copy } from "lucide-vue-next";
import Heading from "~/components/Heading.vue";
import PageHeader from "~/components/PageHeader.vue";
import { Modal } from "#components";
import { useToast } from "#imports";
import { useAuth } from "~/composables/useAuth";
import AddUsulan from "~/components/AddUsulan.vue";

const toast = useToast();
const { get, post, del } = useApi();
const { user, getProfile } = useAuth();

const breadcrumbs = [
  { label: "Dashboard", to: "/user/dashboard" },
  { label: "Usulan", to: "/admin/penomoran/usulan" },
];

const headers = [
  { label: "ID", key: "displayId", sortable: true },
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
const selectedRow = ref<any>(null);
const isProcessing = ref(false);
const loading = ref<boolean>(true);

const filterStatus = ref<string>("Semua");
const openFilterStatus = ref<boolean>(false);
const openPreview = ref(false);
const openAdd = ref(false);
const rows = ref<any[]>([]);
const personMap = ref(new Map());

// SORTING
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

const selectFilterStatus = (val: string) => {
  filterStatus.value = val;
  openFilterStatus.value = false;
};

const fetchPersonMap = async () => {
  try {
    const response = await get("/person/with-position/all");
    console.log("📥 Person Map Response:", response);

    const list = response?.data || [];

    list.forEach((item: any) => {
      personMap.value.set(String(item.position), {
        nama: item.nama,
        position_text: item.position_text,
      });
    });

    console.log("✅ Person Map loaded:", personMap.value.size, "entries");
  } catch (error) {
    console.error("❌ Error fetch person map:", error);
  }
};

const fetchData = async () => {
  loading.value = true;

  try {
    if (!user.value) {
      await getProfile();
    }

    if (!user.value?.position) {
      toast.add({
        title: "Error",
        description: "User position tidak ditemukan",
        color: "red",
      });
      return;
    }

    const userPositionId = user.value.position;
    console.log("🔍 Fetching usulan for position:", userPositionId);

    const res = await get(`/nomor-request/${userPositionId}`);
    console.log("📥 API Response:", res);

    if (!res?.success) {
      toast.add({
        title: "Gagal",
        description: res?.message || "Tidak dapat mengambil data usulan",
        color: "red",
      });
      return;
    }

    const rawData = res.data || [];
    console.log("📊 Raw data usulan:", rawData);

    rows.value = rawData.map((item: any, index: number) => {
      let status = "Belum Diajukan";

      if (item.details && item.details.length > 0) {
        const hasBooking = item.details.some((d: any) => d.status === "hangus");
        const hasTerpakai = item.details.some(
          (d: any) => d.status === "terpakai",
        );
        const hasDitolak = item.details.some(
          (d: any) => d.status === "ditolak",
        );

        if (hasTerpakai) {
          status = "Disetujui";
        } else if (hasDitolak) {
          status = "Ditolak";
        } else if (hasBooking) {
          status = "Menunggu Verifikasi";
        }
      }

      const person = personMap.value.get(String(item.position));
      console.log(`🔍 Looking up position ${item.position}:`, person);

      return {
        id: item.id,
        displayId: `#${String(index + 1).padStart(3, "0")}`,
        jenis: item.jenis,
        tanggal: formatTanggal(item.tanggal),
        perihal: item.perihal,
        penanda: person?.position_text || "-",
        jumlah: item.jumlah,
        pengusul: person?.nama || user.value?.nama || "-",
        tglUsulan: formatDateTime(item.created_at),
        status: status,
        klasifikasi: item.klasifikasi,
        details: item.details || [],
        _raw: item,
      };
    });

    console.log("✅ Data usulan berhasil dimuat:", rows.value);
  } catch (error: any) {
    console.error("❌ Error fetch data usulan:", error);

    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Tidak dapat mengambil data usulan";

    toast.add({
      title: "Gagal memuat data",
      description: errorMsg,
      color: "red",
    });
  } finally {
    loading.value = false;
  }
};

const openRowModal = (row: any) => {
  selectedRow.value = { ...row };
  openPreview.value = true;
};

const handleSubmitUsulan = async (data: any) => {
  console.log("✅ Submit usulan baru:", data);
  await fetchData();
  openAdd.value = false;
};

const handlePreview = (data: any) => {
  console.log("📄 Preview data:", data);
};

const submitUsulan = async () => {
  if (!selectedRow.value) return;
  isProcessing.value = true;

  try {
    const res = await post(
      `/admin/nomor-request/${selectedRow.value.id}/booking`,
      {},
    );

    if (res?.success) {
      toast.add({
        title: "Berhasil",
        description: "Usulan berhasil dikirim ke verifikasi",
        color: "green",
      });
      openPreview.value = false;
      await fetchData();
    } else {
      throw new Error(res?.message || "Gagal mengirim usulan");
    }
  } catch (error: any) {
    console.error("❌ Error submit usulan:", error);
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Terjadi kesalahan saat mengirim usulan";

    toast.add({
      title: "Gagal",
      description: errorMsg,
      color: "red",
    });
  } finally {
    isProcessing.value = false;
  }
};

const hapusUsulan = async () => {
  if (!selectedRow.value) return;
  if (!confirm("Yakin ingin menghapus usulan ini?")) return;
  isProcessing.value = true;

  try {
    const res = await del(`/nomor-request/${selectedRow.value.id}`);

    if (res?.success) {
      toast.add({
        title: "Berhasil",
        description: "Usulan berhasil dihapus",
        color: "green",
      });
      openPreview.value = false;
      await fetchData();
    } else {
      throw new Error(res?.message || "Gagal menghapus usulan");
    }
  } catch (error: any) {
    console.error("❌ Error hapus usulan:", error);
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Terjadi kesalahan saat menghapus usulan";

    toast.add({
      title: "Gagal",
      description: errorMsg,
      color: "red",
    });
  } finally {
    isProcessing.value = false;
  }
};

const handleCopy = (value: string) => {
  navigator.clipboard.writeText(value);
  toast.add({
    title: "Tersalin",
    description: `Nomor surat "${value}" berhasil disalin.`,
    color: "success",
    icon: "i-lucide-copy",
  });
};

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

const sortedRows = computed(() => {
  return [...filteredRows.value].sort((a, b) => {
    const A = String(a[sortBy.value] ?? "").toLowerCase();
    const B = String(b[sortBy.value] ?? "").toLowerCase();
    if (A < B) return sortDir.value === "asc" ? -1 : 1;
    if (A > B) return sortDir.value === "asc" ? 1 : -1;
    return 0;
  });
});

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedRows.value.slice(start, start + rowsPerPage.value);
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedRows.value.length / rowsPerPage.value)),
);

watch([search, rowsPerPage, sortBy, sortDir, filterStatus], () => {
  currentPage.value = 1;
});

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

function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const dropdownEls = document.querySelectorAll("[data-custom-dropdown]");
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) return;
  }
  openFilterStatus.value = false;
}

onMounted(async () => {
  if (!user.value) await getProfile();
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
