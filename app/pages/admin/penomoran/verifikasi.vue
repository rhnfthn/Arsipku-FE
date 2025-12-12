<template>
  <div class="min-h-screen overflow-x-auto bg-gray-50 pb-10">
    <!-- TITLE -->
    <div class="flex items-center justify-between w-full mb-5">
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Daftar Verifikasi Dokumen
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

  <!-- MODAL ROW DETAIL -->
  <Modal
    v-model="openPreview"
    :hideDefaultFooter="true"
    class="!max-h-[100vh] !rounded-2xl !overflow-hidden"
  >
    <!-- HEADER -->
    <template #title>
      <div class="flex justify-between items-center w-full px-5 pt-6 pb-3">
        <h2 class="text-lg font-semibold uppercase">
          {{ selectedRow?.jenis || "Detail" }}
        </h2>
      </div>
    </template>

    <!-- BODY -->
    <div
      v-if="selectedRow"
      class="px-6 pb-6 space-y-6 text-[15px] overflow-y-auto max-h-[70vh]"
    >
      <div>
        <Heading
          variant="heading10sb"
          class="text-xl font-semibold leading-relaxed"
        >
          {{ selectedRow?.perihal }}
        </Heading>
      </div>

      <div class="flex justify-between">
        <span class="text-gray-600 w-40">Tanggal</span>
        <span class="font-medium">{{ selectedRow.tanggal }}</span>
      </div>

      <div class="flex justify-between">
        <span class="text-gray-600 w-40">Penandatangan</span>
        <span class="font-medium">{{ selectedRow.penandatangan }}</span>
      </div>

      <div class="flex justify-between">
        <span class="text-gray-600 w-40">Klasifikasi</span>
        <span class="font-medium">{{ selectedRow.klasifikasi }}</span>
      </div>

      <div class="flex justify-between">
        <span class="text-gray-600 w-40">Jenis Naskah</span>
        <span class="font-medium">{{ selectedRow.jenis }}</span>
      </div>

      <!-- Nomor Surat -->
      <div class="mt-4">
        <label class="font-medium">Nomor Surat</label>

        <div class="flex flex-col gap-2 mt-2">
          <div
            v-for="(nomor, idx) in selectedRow.nomor_surat"
            :key="idx"
            class="flex items-center gap-2"
          >
            <input
              type="checkbox"
              v-model="selectedRow.checkedNomor[idx]"
              class="w-5 h-5"
            />

            <div
              class="relative flex w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2"
            >
              <span class="text-sm text-gray-700 mr-2">{{ idx + 1 }}.</span>

              <input
                type="text"
                v-model="selectedRow.nomor_surat[idx]"
                class="flex-1 bg-transparent outline-none text-sm pr-2"
                readonly
              />
            </div>

            <button
              @click="handleCopy(nomor)"
              class="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center"
            >
              <Copy class="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <!-- Keterangan Jika Ditolak -->
      <div>
        <label class="text-gray-600 text-sm"
          >Keterangan Jika Ditolak <span class="text-red-500">*</span></label
        >

        <textarea
          v-model="keterangan_ditolak"
          class="w-full mt-1 border border-gray-300 rounded-lg px-4 py-3 text-sm min-h-[120px] bg-gray-50"
          placeholder="Masukkan keterangan jika ditolak..."
        ></textarea>
      </div>
    </div>

    <!-- FOOTER -->
    <template #footer>
      <div class="flex justify-end gap-3 px-5 py-4 border-t border-gray-200">
        <button
          @click="approveUsulan"
          :disabled="isNoneChecked"
          class="px-5 py-2 text-xs bg-primary text-white rounded-md"
        >
          Nomor Disetujui
        </button>
        <button
          @click="rejectUsulan"
          :disabled="isAllChecked"
          class="px-5 py-2 text-xs border border-red-400 text-red-600 rounded-md"
        >
          Nomor Ditolak
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { Search, ArrowUpDown, Copy } from "lucide-vue-next";
import Heading from "~/components/Heading.vue";
import PageHeader from "~/components/PageHeader.vue";
import { Modal } from "#components";
import { useToast } from "#imports";
import { usePenomoran } from "~/composables/usePenomoran";

const toast = useToast();

// ✅ Composable & API
const { getListSubmitted } = usePenomoran();
const { get } = useApi();

/* Breadcrumb */
const breadcrumbs = [
  { label: "Dashboard", to: "/user/dashboard" },
  { label: "Verifikasi", to: "/admin/penomoran/verifikasi" },
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

/* Modal control */
const openPreview = ref(false);

/* Data rows */
const rows = ref<any[]>([]);

// ✅ GET DATA DARI API
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

    // Mapping response ke format tabel
    rows.value = res.data.map((item: any) => ({
      id: item.id,
      jenis: item.jenis,
      tanggal: formatTanggal(item.tanggal),
      perihal: item.perihal,
      penandatangan: item.penandatangan || "-",
      jumlah: item.jumlah,
      pengusul: item.nama,
      tglUsulan: formatDateTime(item.created_at),
      status: item.status,
      klasifikasi: item.klasifikasi,
      // Generate nomor surat dummy (karena belum ada dari BE)
      nomor_surat: Array.from(
        { length: item.jumlah },
        (_, i) =>
          `${i + 1}/${item.jenis}/U/XX/LPPNPI/${item.klasifikasi}/${new Date().getFullYear()}`,
      ),
    }));

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
const showPreview = (row: any) => {
  selectedRow.value = {
    ...row,
    checkedNomor: row.nomor_surat.map(() => false),
  };
  keterangan_ditolak.value = "";
  openPreview.value = true;
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

/* Approve Usulan */
const approveUsulan = () => {
  if (!selectedRow.value) return;

  const nomorDipilih = selectedRow.value.nomor_surat.filter(
    (_n: string, i: number) => selectedRow.value.checkedNomor[i],
  );

  if (nomorDipilih.length === 0) {
    toast.add({
      title: "Peringatan",
      description: "Pilih minimal 1 nomor surat!",
      color: "yellow",
    });
    return;
  }

  console.log("📤 Menyetujui nomor:", nomorDipilih);

  /* NOMOR CHECKBOX DITOLAK DISETUJUI*/
  const isAllChecked = computed(() => {
    return (
      selectedRow.value &&
      selectedRow.value.checkedNomor.length > 0 &&
      selectedRow.value.checkedNomor.every((v: boolean) => v === true)
    );
  });

  const isNoneChecked = computed(() => {
    return (
      selectedRow.value &&
      selectedRow.value.checkedNomor.every((v: boolean) => v === false)
    );
  });

  /* NOMOR DITOLAK */
  const rejectNomor = async (id: string) => {
    try {
      const res = await get(`/admin/nomor-request/${id}`, {
        method: "DELETE",
      });

      if (!res?.success) {
        toast.add({
          title: "Gagal",
          description: "Tidak dapat menolak usulan nomor",
          color: "red",
        });
        return false;
      }

      return true;
    } catch (err) {
      console.error("❌ Error rejectNomor:", err);
      toast.add({
        title: "Gagal",
        description: "Terjadi kesalahan saat menolak nomor",
        color: "red",
      });
      return false;
    }
  };

  // TODO: Panggil API approval
  // await approveNomor(selectedRow.value.id, nomorDipilih);

  openPreview.value = false;
  toast.add({
    title: "Berhasil",
    description: "Nomor surat berhasil disetujui",
    color: "green",
  });

  // Refresh data
  fetchData();
};

/* Reject Usulan */
const rejectUsulan = async () => {
  if (!selectedRow.value) return;

  if (!keterangan_ditolak.value) {
    toast.add({
      title: "Peringatan",
      description: "Keterangan penolakan harus diisi!",
      color: "yellow",
    });
    return;
  }

  const id = selectedRow.value.id;

  const ok = await rejectNomor(id);
  if (!ok) return;

  toast.add({
    title: "Ditolak",
    description: "Usulan nomor berhasil ditolak",
    color: "red",
  });

  openPreview.value = false;
  fetchData();
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

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "2-digit",
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
onMounted(() => {
  fetchData();
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
