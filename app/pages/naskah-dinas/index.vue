<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import {
  Search,
  ArrowUpDown,
  RotateCcw,
  Plus,
  FileDown,
  Upload,
  FileText,
  X,
} from "lucide-vue-next";

import Modal from "~/components/Modal.vue";
import ConfirmPopup from "~/components/ConfirmPopup.vue";
import { useNaskahDinas } from "~/composables/useNaskahDinas";
import { useTertujuEksternal } from "~/composables/useTertujuEksternal";
import { useToast } from "#imports";
import { useAuth } from "~/composables/useAuth";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ==============================
// STATE (existing)
// ==============================
const toast = useToast();
const search = ref("");
const sortDirection = ref<"asc" | "desc" | null>("desc");
const showAddModal = ref(false);
const searchTertuju = ref("");
const searchAsalNaskah = ref("");
const skeletonRows = computed(() => {
  if (perPage.value === "all") return 10;
  return Number(perPage.value);
});

const items = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
  },
  {
    label: "Naskah Dinas",
    to: "/admin/naskah-dinas",
  },
] satisfies BreadcrumbItem[];

const { user } = useAuth();

const {
  items: listDelegasi,
  pending,
  error,
  fetchNaskahDinas,

  recipients: tertujuList,
  loadingRecipients: loadingTertuju,
  fetchRecipients,

  sendNaskahDinas,
} = useNaskahDinas();

const {
  data: asalNaskahList,
  loading: loadingAsalNaskah,
  fetchTertujuEksternal,
} = useTertujuEksternal();

onMounted(() => {
  fetchNaskahDinas();
  fetchTertujuEksternal();
  fetchRecipients();
});

const filteredTertujuList = computed(() => {
  const keyword = searchTertuju.value.toLowerCase();

  if (!keyword) return tertujuList.value;

  return tertujuList.value.filter((item) => {
    return (
      item.persnum_person_text?.toLowerCase().includes(keyword) ||
      item.position_text?.toLowerCase().includes(keyword) ||
      item.organization_parent_text?.toLowerCase().includes(keyword)
    );
  });
});

const filteredAsalNaskahList = computed(() => {
  const keyword = searchAsalNaskah.value.toLowerCase();

  if (!keyword) return asalNaskahList.value;

  return asalNaskahList.value.filter((item) =>
    item.nama?.toLowerCase().includes(keyword),
  );
});

// ==============================
// SORT & REFRESH (existing)
// ==============================
const toggleSort = () => {
  if (!sortDirection.value) sortDirection.value = "asc";
  else if (sortDirection.value === "asc") sortDirection.value = "desc";
  else sortDirection.value = null;
};

const refreshData = async () => {
  search.value = "";
  sortDirection.value = null;
  currentPage.value = 1;

  await fetchNaskahDinas();
};

const filteredData = computed(() => {
  let data = [...listDelegasi.value];

  const keyword = search.value.toLowerCase();

  // =====================
  // SEARCH
  // =====================
  data = data.filter((item) => {
    return (
      (item.pengirim?.persnum_person_text || "")
        .toLowerCase()
        .includes(keyword) ||
      (item.nomor || "").toLowerCase().includes(keyword) ||
      (item.perihal || "").toLowerCase().includes(keyword) ||
      (item.lampiran || "").toLowerCase().includes(keyword) ||
      (item.penerima?.[0]?.position_text || "").toLowerCase().includes(keyword)
    );
  });

  // =====================
  // SORT (DEFAULT = TERBARU)
  // =====================
  data.sort((a, b) => {
    const dateA = parseUtcTanggalJam(a.tanggal, a.jam)?.getTime() ?? 0;
    const dateB = parseUtcTanggalJam(b.tanggal, b.jam)?.getTime() ?? 0;

    // default: terbaru
    if (sortDirection.value !== "asc") {
      return dateB - dateA;
    }

    return dateA - dateB;
  });

  return data;
});

// ==============================
// PAGINATION
// ==============================
const currentPage = ref(1);
const perPage = ref<number | "all">(10);

const totalItems = computed(() => filteredData.value.length);

const totalPages = computed(() => {
  if (perPage.value === "all") return 1;
  return Math.ceil(totalItems.value / perPage.value);
});

const paginatedData = computed(() => {
  if (perPage.value === "all") {
    return filteredData.value;
  }

  const start = (currentPage.value - 1) * perPage.value;
  return filteredData.value.slice(start, start + perPage.value);
});

const paginationPages = computed(() => {
  const pages: (number | string)[] = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (current > 4) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 3) pages.push("...");

  pages.push(total);

  return pages;
});

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

watch(perPage, () => {
  currentPage.value = 1;
});

// ==============================
// ADD & EDIT DELEGASI (existing)
// ==============================

const filesRef = ref<File[]>([]);

const lampiranText = computed(() => {
  const total = filesRef.value.length;
  return `${total} lampiran`;
});

const newDelegasi = ref({
  tanggal_surat: "",
  nomor_asal: "",
  sifat_naskah: "",
  perihal: "",
  asal_naskah: null as number | null,
  asal_naskah_label: "",

  tertuju: [] as any[],
  tertuju_label: "",
});

const saveDelegasi = async () => {
  if (!newDelegasi.value.asal_naskah) {
    toast.add({
      title: "Validasi gagal",
      description: "Asal naskah wajib dipilih",
      color: "warning",
      icon: "i-lucide-alert-circle",
    });
    return;
  }
  if (filesRef.value.length === 0) {
    toast.add({
      title: "Validasi gagal",
      description: "File wajib diisi",
      color: "warning",
      icon: "i-lucide-alert-circle",
    });
    return;
  }

  try {
    await sendNaskahDinas({
      asal_naskah: String(newDelegasi.value.asal_naskah),
      tertuju: newDelegasi.value.tertuju.map((t) => t.position),
      tanggal_surat: newDelegasi.value.tanggal_surat,
      nomor_asal: newDelegasi.value.nomor_asal,
      sifat_naskah: newDelegasi.value.sifat_naskah,
      perihal: newDelegasi.value.perihal,
      lampiran: lampiranText.value,
      file: filesRef.value,
      pembuat_id: Number(user.value.position),
    });

    toast.add({
      title: "Berhasil",
      description: "Naskah dinas berhasil ditambahkan",
      color: "success",
      icon: "i-lucide-check-circle",
    });

    resetNewDelegasi();
    showAddModal.value = false;
    fetchNaskahDinas();
  } catch (e) {
    console.error("Gagal kirim naskah dinas", e);

    toast.add({
      title: "Gagal",
      description: "Terjadi kesalahan saat menyimpan data",
      color: "error",
      icon: "i-lucide-x-circle",
    });
  }
};

// ==============================
// DROPDOWN DATA (explicit with id per item)
// ==============================
const jenisnaskahList = [
  {
    id: 1,
    label: "UND - Surat Undangan",
    value: "Surat Undangan",
  },
  {
    id: 2,
    label: "SDE - Surat Dinas Eksternal",
    value: "Surat Dinas Eksternal",
  },
];

const sifatnaskahList = [
  { id: 1, label: "Biasa/Terbuka", value: "Biasa/Terbuka" },
  { id: 2, label: "Terbatas", value: "Terbatas" },
  { id: 3, label: "Rahasia", value: "Rahasia" },
  { id: 4, label: "Sangat Rahasia", value: "Sangat Rahasia" },
];

const jabatanList = [
  { id: 1, label: "Asisten", value: "Asisten" },
  { id: 2, label: "Manager", value: "Manager" },
  { id: 3, label: "Supervisor", value: "Supervisor" },
  { id: 4, label: "Staff", value: "Staff" },
];

// ==============================
// CUSTOM DROPDOWN STATES & HANDLERS
// one open boolean per dropdown instance
// ==============================
const openFilterStatus = ref(false);

const openNewJenisNaskah = ref(false);
const openNewSifatNaskah = ref(false);
const openNewJabatan = ref(false);

const openEditJenisNaskah = ref(false);
const openEditSifatNaskah = ref(false);
const openEditJabatan = ref(false);
const openNewAsalNaskah = ref(false);

const openNewTertuju = ref(false);

// click outside handling
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  // if click outside any dropdown, close all
  const dropdownEls = document.querySelectorAll("[data-custom-dropdown]");
  for (const el of Array.from(dropdownEls)) {
    if (el.contains(target)) {
      // clicked inside a dropdown - do nothing for that dropdown
      return;
    }
  }
  // clicked outside all dropdowns -> close all
  openFilterStatus.value = false;
  openNewJenisNaskah.value = false;
  openNewSifatNaskah.value = false;
  openEditJenisNaskah.value = false;
  openEditSifatNaskah.value = false;
  openNewAsalNaskah.value = false;
  openNewTertuju.value = false;
  searchTertuju.value = "";
  searchAsalNaskah.value = "";
}

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});

function selectNewJenisNaskah(val: string) {
  newDelegasi.value.jenisnaskah = val;
  openNewJenisNaskah.value = false;
}
function selectNewSifatNaskah(val: string) {
  newDelegasi.value.sifat_naskah = val;
  openNewSifatNaskah.value = false;
}

function selectNewAsalNaskah(item: { id: number; nama: string }) {
  newDelegasi.value.asal_naskah = item.id;
  newDelegasi.value.asal_naskah_label = item.nama;
  openNewAsalNaskah.value = false;
  searchAsalNaskah.value = "";
}

function selectNewTertuju(item: any) {
  const exists = newDelegasi.value.tertuju.some(
    (t) => t.position === item.position,
  );

  if (!exists) {
    newDelegasi.value.tertuju.push(item);
  }

  searchTertuju.value = ""; // reset search
  openNewTertuju.value = false;
}

function removeTertuju(position: number) {
  newDelegasi.value.tertuju = newDelegasi.value.tertuju.filter(
    (t) => t.position !== position,
  );
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];

  // VALIDASI MIME TYPE
  if (file.type !== "application/pdf") {
    toast.add({
      title: "File tidak valid",
      description: "Hanya file PDF yang diperbolehkan",
      color: "warning",
      icon: "i-lucide-alert-circle",
    });

    input.value = "";
    return;
  }

  filesRef.value = [file];
  input.value = "";
}

function parseUtcTanggalJam(tanggal?: string, jam?: string) {
  if (!tanggal || !jam) return null;

  // PAKSA UTC
  return new Date(`${tanggal}T${jam}Z`);
}

function formatTanggalJamIndonesia(tanggal?: string, jam?: string) {
  const date = parseUtcTanggalJam(tanggal, jam);
  if (!date) {
    return { tanggal: "-", jam: "-" };
  }

  return {
    tanggal: date.toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
    }),
    jam: date.toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

function resetNewDelegasi() {
  newDelegasi.value = {
    tanggal_surat: "",
    nomor_asal: "",
    sifat_naskah: "",
    perihal: "",
    asal_naskah: null,
    asal_naskah_label: "",
    tertuju: [],
    tertuju_label: "",
  };

  filesRef.value = [];
  searchTertuju.value = "";
  searchAsalNaskah.value = "";

  openNewJenisNaskah.value = false;
  openNewSifatNaskah.value = false;
  openNewAsalNaskah.value = false;
  openNewTertuju.value = false;
}

function openFinalPdf(url?: string) {
  if (!url) return;

  window.open(url, "_blank", "noopener,noreferrer");
}

function getFileNameFromUrl(url?: string) {
  if (!url) return "";

  try {
    const cleanUrl = url.split("?")[0]; // buang query string
    return decodeURIComponent(
      cleanUrl.substring(cleanUrl.lastIndexOf("/") + 1),
    );
  } catch {
    return "";
  }
}

function truncateFileName(name: string, maxLength = 25) {
  if (name.length <= maxLength) return name;

  const extIndex = name.lastIndexOf(".");
  if (extIndex === -1) {
    return name.slice(0, maxLength) + "…";
  }

  const ext = name.slice(extIndex); // .pdf
  const base = name.slice(0, maxLength - ext.length - 1);

  return `${base}…${ext}`;
}

function setPerPage(val: number | "all") {
  perPage.value = val;
  openFilterStatus.value = false;
}

function exportExcel() {
  if (filteredData.value.length === 0) {
    toast.add({
      title: "Tidak ada data",
      description: "Data kosong, tidak bisa diexport",
      color: "warning",
      icon: "i-lucide-alert-circle",
    });
    return;
  }

  // Mapping data ke format Excel
  const excelData = filteredData.value.map((item, index) => {
    const waktu = formatTanggalJamIndonesia(item.tanggal, item.jam);

    return {
      No: index + 1,
      "Asal Naskah": item.pengirim?.nama || "-",
      "Nomor Naskah": item.nomor || "-",
      Tanggal: waktu.tanggal,
      Jam: waktu.jam,
      Tertuju:
        item.penerima?.map((p: any) => p.position_text).join(", ") || "-",
      Perihal: item.perihal || "-",
      Pembuat: item.pembuat?.nama || "-",
      "Jabatan Pembuat": item.pembuat?.position_text || "-",
      "Final PDF URL": item.final_pdf_url || "-",
    };
  });

  // Buat worksheet & workbook
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Naskah Dinas");

  // Generate file
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const filename = `Naskah_Dinas_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, filename);

  toast.add({
    title: "Export berhasil",
    description: "File Excel berhasil diunduh",
    color: "success",
    icon: "i-lucide-check-circle",
  });
}
</script>

<template>
  <div class="flex items-center justify-between w-full mb-5">
    <div>
      <Heading variant="heading6b" class="text-mobile-md">
        Daftar Naskah Dinas
      </Heading>
      <PageHeader :items="items" />
    </div>

    <!-- ADD BUTTON -->
    <button
      @click="showAddModal = true"
      class="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg hover:bg-primary-800 text-xs transition"
    >
      <Plus class="w-4 h-4" />
      Tambah Naskah Dinas
    </button>
  </div>
  <div class="w-full min-w-0 min-h-screen bg-gray-50">
    <div
      class="flex flex-col w-full bg-white rounded-xl shadow-sm border border-gray-200"
    >
      <div class="border-b border-gray-200">
        <!-- FILTER BAR -->
        <div class="flex gap-4 p-3 items-center flex-wrap">
          <button
            @click="toggleSort"
            class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <ArrowUpDown class="w-4 h-4" />
          </button>

          <button
            @click="refreshData"
            :disabled="pending"
            class="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50"
          >
            <RotateCcw class="w-4 h-4" :class="pending ? 'animate-spin' : ''" />
          </button>

          <!-- CUSTOM FILTER DROPDOWN -->
          <div class="relative" data-custom-dropdown>
            <button
              class="flex items-center justify-between gap-2 text-xs px-2 py-0.5 rounded-lg min-w-auto border border-gray-200"
              @click.stop="openFilterStatus = !openFilterStatus"
            >
              <span class="text-sm">
                {{ perPage === "all" ? "Semua" : ` ${perPage}` }}
              </span>

              <!-- Icon V -->
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

            <div
              v-if="openFilterStatus"
              class="absolute left-0 mt-2 w-56 bg-white border border-gray-100 rounded-lg shadow-lg z-50 overflow-hidden"
            >
              <button
                class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                @click.prevent="setPerPage('all')"
              >
                Semua
              </button>

              <button
                v-for="n in [5, 10, 20, 50]"
                :key="n"
                class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                @click.prevent="setPerPage(n)"
              >
                {{ n }}
              </button>
            </div>
          </div>

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
          <button
            @click="exportExcel"
            class="flex items-center gap-2 bg-primary-400 hover:bg-primary-600 text-white h-8 px-6 rounded-lg text-xs"
          >
            <FileDown class="w-4 h-4" />
            Export
          </button>
        </div>
        <!-- LIST TABLE -->
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-primary-400 text-white whitespace-nowrap text-left">
                <th class="px-4 py-3 border-b-2 border-b-gray-100">
                  Asal Naskah
                </th>
                <th class="px-4 py-3 border-b-2 border-b-gray-100">Tertuju</th>
                <th class="px-4 py-3 border-b-2 border-b-gray-100">Perihal</th>
                <th class="px-4 py-3 border-b-2 border-b-gray-100">Pembuat</th>
                <th class="px-4 py-3 border-b-2 border-b-gray-100">
                  Jam Dibuat
                </th>
              </tr>
            </thead>

            <tbody>
              <!-- ================= -->
              <!-- SKELETON BLOCK -->
              <!-- ================= -->
              <tr v-if="pending">
                <td colspan="5" class="px-4 py-6">
                  <div class="space-y-4 animate-pulse">
                    <div
                      v-for="n in skeletonRows"
                      :key="'skeleton-' + n"
                      class="h-16 w-full rounded-lg bg-gray-200"
                    />
                  </div>
                </td>
              </tr>
              <!-- ================= -->
              <!-- DATA ASLI -->
              <!-- ================= -->
              <tr
                v-else
                v-for="item in paginatedData"
                :key="item.id"
                class="hover:bg-blue-50 transition-colors"
              >
                <td class="px-4 py-3 text-black whitespace-nowrap">
                  <div class="font-medium">
                    {{ item.pengirim?.nama || "-" }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ item.nomor || "-" }}
                  </div>
                  <div class="text-xs text-gray-400">
                    {{
                      formatTanggalJamIndonesia(item.tanggal, item.jam).tanggal
                    }}
                  </div>
                </td>

                <td class="px-4 py-3 text-black">
                  <div class="font-medium">
                    {{
                      item.penerima?.map((p) => p.position_text).join(", ") ||
                      "-"
                    }}
                  </div>
                </td>

                <td class="px-4 py-3 text-black whitespace-nowrap">
                  <div class="flex flex-col gap-1">
                    <div class="font-medium">
                      {{ item.perihal }}
                    </div>

                    <button
                      v-if="item.final_pdf_url"
                      @click="openFinalPdf(item.final_pdf_url)"
                      class="inline-flex max-w-[220px] items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs hover:bg-emerald-200 hover:text-emerald-800 transition cursor-pointer"
                      :title="getFileNameFromUrl(item.final_pdf_url)"
                    >
                      <FileText class="w-3 h-3 shrink-0" />
                      <span class="truncate">
                        {{
                          truncateFileName(
                            getFileNameFromUrl(item.final_pdf_url),
                            28,
                          )
                        }}
                      </span>
                    </button>
                  </div>
                </td>
                <td class="px-4 py-3 text-black whitespace-nowrap">
                  <div class="font-medium">
                    {{ item.pembuat?.position_text || "-" }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ item.pembuat?.nama || "-" }}
                  </div>
                </td>
                <td class="px-4 py-3 text-black">
                  {{ formatTanggalJamIndonesia(item.tanggal, item.jam).jam }}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- PAGINATION -->
          <div
            class="flex items-center justify-between px-4 py-3 border-t border-gray-200"
          >
            <!-- INFO -->
            <div class="text-sm text-gray-500">
              Menampilkan
              {{ paginatedData.length }}
              dari
              {{ totalItems }}
              data
            </div>

            <!-- CONTROLS -->
            <div class="flex items-center gap-1">
              <!-- BACK -->
              <button
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm"
                :class="
                  currentPage === 1
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-primary-500 border-primary-300 hover:bg-primary-50'
                "
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >
                ‹ Back
              </button>

              <!-- PAGE NUMBERS -->
              <button
                v-for="(page, i) in paginationPages"
                :key="i"
                class="px-3 py-1.5 rounded-lg text-sm"
                :class="[
                  page === currentPage
                    ? 'bg-primary-500 text-white'
                    : page === '...'
                      ? 'text-gray-400 cursor-default'
                      : 'border border-gray-200 hover:bg-gray-100',
                ]"
                :disabled="page === '...'"
                @click="typeof page === 'number' && goToPage(page)"
              >
                {{ page }}
              </button>

              <!-- NEXT -->
              <button
                class="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm"
                :class="
                  currentPage === totalPages
                    ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'text-primary-500 border-primary-300 hover:bg-primary-50'
                "
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >
                Next ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- ======= -->
    <!-- MODAL TAMBAH -->
    <!-- ======= -->
    <Teleport to="body">
      <AddUsulan
        v-model="openAdd"
        @submit="handleSubmitFromModal"
        @preview="handlePreview"
    /></Teleport>
    <Teleport to="body">
      <Modal
        v-model="showAddModal"
        @save="saveDelegasi"
        @close="resetNewDelegasi"
        size="xl"
      >
        <template #title>
          <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold"
            >Tambah Naskah Dinas</Heading
          >
        </template>

        <div class="modal-form flex flex-col">
          <div class="flex flex-col gap-4 mt-3 ml-1 mr-1">
            <div>
              <label class="text-xs font-semibold"
                >Jenis Naskah <span class="text-red-500">*</span></label
              >
              <div class="relative" data-custom-dropdown>
                <button
                  class="w-full text-left border border-gray-200 rounded-lg px-3 py-2 mt-1 flex items-center justify-between"
                  @click.stop="openNewJenisNaskah = !openNewJenisNaskah"
                >
                  <span
                    class="text-xs"
                    :class="
                      newDelegasi.jenisnaskah
                        ? 'text-gray-700'
                        : 'text-gray-400'
                    "
                  >
                    {{ newDelegasi.jenisnaskah || "Pilih Jenis Naskah" }}
                  </span>
                </button>

                <div
                  v-if="openNewJenisNaskah"
                  class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[999] max-h-56 overflow-auto"
                >
                  <button
                    v-for="p in jenisnaskahList"
                    :key="p.id"
                    class="w-full text-left px-3 py-2 mt-1 text-xs hover:bg-gray-100"
                    @click.prevent="selectNewJenisNaskah(p.value)"
                  >
                    {{ p.label }}
                  </button>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap flex-col">
              <label class="text-xs font-semibold"
                >Tanggal Surat <span class="text-red-500">*</span></label
              >
              <input
                v-model="newDelegasi.tanggal_surat"
                type="date"
                class="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label class="text-xs font-semibold"
                >Sifat Naskah <span class="text-red-500">*</span></label
              >
              <div class="relative" data-custom-dropdown>
                <button
                  class="w-full text-left mt-1 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between"
                  @click.stop="openNewSifatNaskah = !openNewSifatNaskah"
                >
                  <span
                    class="text-xs"
                    :class="
                      newDelegasi.sifat_naskah
                        ? 'text-gray-700'
                        : 'text-gray-400'
                    "
                  >
                    {{ newDelegasi.sifat_naskah || "Pilih sifat naskah" }}
                  </span>
                </button>

                <div
                  v-if="openNewSifatNaskah"
                  class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
                >
                  <button
                    v-for="s in sifatnaskahList"
                    :key="s.id"
                    class="w-full text-left px-3 py-2 mt-1 text-xs"
                    @click.prevent="selectNewSifatNaskah(s.value)"
                  >
                    {{ s.label }}
                  </button>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap flex-col">
              <label class="text-xs font-semibold"
                >Nomor Asal Naskah <span class="text-red-500">*</span></label
              >
              <input
                v-model="newDelegasi.nomor_asal"
                type="text"
                class="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                placeholder="Masukan nomor"
              />
            </div>

            <div class="flex flex-col">
              <label class="text-xs font-semibold">
                Asal Naskah <span class="text-red-500">*</span>
              </label>

              <div class="relative mt-1 dropdown-input" data-custom-dropdown>
                <!-- INPUT BOX -->
                <div
                  class="w-full border border-gray-200 rounded-lg px-3 py-2 flex items-center cursor-text dropdown-field"
                  @click.stop="openNewAsalNaskah = true"
                >
                  <input
                    :value="newDelegasi.asal_naskah_label || searchAsalNaskah"
                    @input="searchAsalNaskah = $event.target.value"
                    @focus="openNewAsalNaskah = true"
                    placeholder="Cari asal naskah"
                    class="flex-1 outline-none text-xs"
                    :class="
                      newDelegasi.asal_naskah_label
                        ? 'text-gray-700'
                        : 'text-gray-400'
                    "
                  />

                  <!-- CLEAR -->
                  <button
                    v-if="newDelegasi.asal_naskah_label"
                    type="button"
                    class="text-red-400 text-xs ml-2"
                    @click.stop="
                      newDelegasi.asal_naskah = null;
                      newDelegasi.asal_naskah_label = '';
                      searchAsalNaskah = '';
                    "
                  >
                    ✕
                  </button>
                </div>

                <!-- DROPDOWN -->
                <div
                  v-if="openNewAsalNaskah"
                  class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[999] max-h-60 overflow-auto"
                >
                  <div
                    v-if="loadingAsalNaskah"
                    class="px-3 py-2 text-xs text-gray-400"
                  >
                    Memuat data...
                  </div>

                  <button
                    v-for="item in filteredAsalNaskahList"
                    :key="item.id"
                    class="w-full text-left px-3 py-2 hover:bg-gray-100 text-xs"
                    @click.prevent="selectNewAsalNaskah(item)"
                  >
                    {{ item.nama }}
                  </button>

                  <div
                    v-if="
                      !loadingAsalNaskah && filteredAsalNaskahList.length === 0
                    "
                    class="px-3 py-2 text-xs text-gray-400"
                  >
                    Data tidak ditemukan
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap flex-col">
              <label class="text-xs font-semibold"
                >Perihal <span class="text-red-500">*</span></label
              >
              <input
                v-model="newDelegasi.perihal"
                type="text"
                class="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-xs"
                placeholder="Masukan perihal"
              />
            </div>

            <div class="flex flex-wrap flex-col">
              <label class="text-xs font-semibold">
                Lampiran <span class="text-red-500">*</span>
              </label>
              <input
                :value="lampiranText"
                type="text"
                readonly
                class="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-xs cursor-not-allowed"
                placeholder="0 Lampiran"
              />
            </div>

            <div class="flex flex-wrap flex-col">
              <label class="text-xs font-semibold">
                Tertuju <span class="text-red-500">*</span>
              </label>

              <div class="relative mt-1 dropdown-input" data-custom-dropdown>
                <div
                  class="w-full border border-gray-200 rounded-lg px-3 py-2 flex items-center cursor-text dropdown-field"
                  @click.stop="openNewTertuju = true"
                >
                  <!-- CHIP -->
                  <span
                    v-for="t in newDelegasi.tertuju"
                    :key="t.position"
                    class="flex flex-col bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                  >
                    <span class="font-medium text-[13px] text-primary-400">
                      {{ t.position_text }}
                    </span>
                    <span class="text-[10px] text-gray-800">
                      {{ t.persnum_person_text }}
                    </span>
                    <span class="text-[9px] text-gray-400">
                      {{ t.organization_parent_text }}
                    </span>

                    <button
                      type="button"
                      class="text-red-500 text-[10px] self-end"
                      @click.stop="removeTertuju(t.position)"
                    >
                      ✕
                    </button>
                  </span>

                  <!-- INPUT SEARCH (INI INTINYA) -->
                  <input
                    v-model="searchTertuju"
                    @focus="openNewTertuju = true"
                    :placeholder="
                      newDelegasi.tertuju.length === 0 ? 'Cari tertuju' : ''
                    "
                    class="flex-1 min-w-[180px] outline-none text-xs"
                  />
                </div>

                <div
                  v-if="openNewTertuju"
                  class="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto"
                >
                  <div
                    v-if="loadingTertuju"
                    class="px-3 py-2 text-xs text-gray-400"
                  >
                    Memuat data...
                  </div>

                  <div
                    v-if="!loadingTertuju && filteredTertujuList.length === 0"
                    class="px-3 py-2 text-xs text-gray-400"
                  >
                    Data tidak ditemukan
                  </div>

                  <button
                    v-for="item in filteredTertujuList"
                    :key="item.position"
                    class="w-full text-left px-3 py-2 hover:bg-gray-100 text-xs"
                    @click.prevent="selectNewTertuju(item)"
                  >
                    <div class="font-medium text-[13px] text-primary-400">
                      {{ item.position_text }}
                    </div>

                    <div class="text-[10px] text-gray-800">
                      {{ item.persnum_person_text }}
                    </div>

                    <div class="text-[9px] text-gray-400">
                      {{ item.organization_parent_text }}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-xs font-semibold">
                File <span class="text-red-500">*</span>
              </label>

              <!-- Upload Box -->
              <label
                class="group cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center hover:border-primary-400 hover:bg-primary-50 transition"
              >
                <Upload
                  class="w-6 h-6 text-gray-400 group-hover:text-primary-400"
                />

                <p class="text-xs text-gray-600">
                  Klik untuk upload atau
                  <span class="text-primary-500 font-medium">pilih file</span>
                </p>

                <input
                  type="file"
                  class="hidden"
                  @change="handleFileChange"
                  accept=".pdf,application/pdf"
                />
              </label>

              <!-- File List -->
              <div v-if="filesRef.length" class="mt-2 space-y-2">
                <div
                  v-for="(file, index) in filesRef"
                  :key="index"
                  class="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                >
                  <div class="flex items-center gap-2">
                    <FileText class="w-4 h-4 text-primary-400" />
                    <div class="flex flex-col">
                      <span class="text-xs font-medium truncate max-w-[220px]">
                        {{ file.name }}
                      </span>
                      <span class="text-[10px] text-gray-400">
                        {{ (file.size / 1024).toFixed(1) }} KB
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="text-red-400 hover:text-red-600"
                    @click="filesRef.splice(index, 1)"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>
  </div>
</template>

<style scoped>
/* minor styling for dropdowns and scrollbars */
[data-custom-dropdown] button:focus {
  outline: none;
  box-shadow: 0 0 0 1px rgb(59 130 246);
}

/* input biasa */
.modal-form input:focus {
  border-color: rgb(59 130 246); /* primary-400 */
  box-shadow: 0 0 0 1px rgb(59 130 246);
}

/* file input */
.modal-form input[type="file"]:focus {
  border-color: rgb(59 130 246);
  box-shadow: 0 0 0 1px rgb(59 130 246);
}

.dropdown-input input:focus {
  border: none;
  box-shadow: none;
}

.dropdown-input:focus-within > .dropdown-field {
  border-color: rgb(59 130 246); /* primary */
  box-shadow: 0 0 0 1px rgb(59 130 246);
}

.dropdown-input > div:not(.dropdown-field) {
  box-shadow: none !important;
  border-color: rgb(229 231 235); /* gray-200 */
}

.dropdown-input input {
  outline: none;
}

/* HILANGKAN outline default */
.modal-form input:focus,
.modal-form button:focus {
  outline: none;
}

.modal-form input::placeholder {
  color: rgb(156 163 175); /* gray-400 */
}
</style>
