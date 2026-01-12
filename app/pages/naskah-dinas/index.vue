<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import {
  Search,
  ArrowUpDown,
  RotateCcw,
  Plus,
  FileDown,
} from "lucide-vue-next";

import Modal from "~/components/Modal.vue";
import ConfirmPopup from "~/components/ConfirmPopup.vue";
import { useNaskahDinas } from "~/composables/useNaskahDinas";
import { useTertujuEksternal } from "~/composables/useTertujuEksternal";
import { useToast } from "#imports";
import { useAuth } from "~/composables/useAuth";

// ==============================
// STATE (existing)
// ==============================
const toast = useToast();
const search = ref("");
const filterStatus = ref("Semua");
const sortDirection = ref<"asc" | "desc" | null>(null);
const showAddModal = ref(false);
const showEditModal = ref(false);

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

// ==============================
// SORT & REFRESH (existing)
// ==============================
const toggleSort = () => {
  if (!sortDirection.value) sortDirection.value = "asc";
  else if (sortDirection.value === "asc") sortDirection.value = "desc";
  else sortDirection.value = null;
};

const refreshData = () => {
  search.value = "";
  filterStatus.value = "Semua";
  sortDirection.value = null;
};

const filteredData = computed(() => {
  let data = [...listDelegasi.value];

  const keyword = search.value.toLowerCase();

  // =====================
  // SEARCH
  // =====================
  data = data.filter((item) => {
    return (
      (item.pengirim?.nama || "").toLowerCase().includes(keyword) ||
      (item.nomor || "").toLowerCase().includes(keyword) ||
      (item.perihal || "").toLowerCase().includes(keyword) ||
      (item.lampiran || "").toLowerCase().includes(keyword) ||
      (item.penerima?.[0]?.position_text || "").toLowerCase().includes(keyword)
    );
  });

  // =====================
  // SORT
  // =====================
  if (sortDirection.value === "asc") {
    data.sort((a, b) =>
      `${a.tanggal} ${a.jam}`.localeCompare(`${b.tanggal} ${b.jam}`),
    );
  }

  if (sortDirection.value === "desc") {
    data.sort((a, b) =>
      `${b.tanggal} ${b.jam}`.localeCompare(`${a.tanggal} ${a.jam}`),
    );
  }

  return data;
});

// ==============================
// DELETE (existing)
// ==============================
const confirmDeleteOpen = ref(false);
const itemToDelete = ref<any>(null);

const openDelete = (item) => {
  itemToDelete.value = item;
  confirmDeleteOpen.value = true;
};

const deleteNow = () => {
  listDelegasi.value = listDelegasi.value.filter(
    (i) => i.id !== itemToDelete.value.id,
  );
  confirmDeleteOpen.value = false;
};

// ==============================
// ADD & EDIT DELEGASI (existing)
// ==============================

const filesRef = ref<File[]>([]);
const lampiranText = computed(() => {
  const count = filesRef.value.length;
  return `${count} lampiran`;
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

const editDelegasi = ref({
  id: null,
  jenisnaskah: "",
  sifatnaskah: "",
});

const openEdit = (item) => {
  const [mulai, sampai] = item.tanggal.split(" - ");
  editDelegasi.value = {
    id: item.id,
    jenisnaskah: item.jenisnaskah,
    sifatnaskah: item.sifataskah ?? "",
  };
  showEditModal.value = true;
};

const saveEditDelegasi = () => {
  const index = listDelegasi.value.findIndex(
    (x) => x.id === editDelegasi.value.id,
  );
  if (index !== -1) {
    listDelegasi.value[index] = {
      ...listDelegasi.value[index],
      jenisnaskah: editDelegasi.value.jenisnaskah,
      sifatnaskah: editDelegasi.value.sifatnaskah,
      // tanggal: `${editDelegasi.value.mulai} - ${editDelegasi.value.sampai}`,
    };
  }
  showEditModal.value = false;
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
}

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});

// helpers to set value and close
function selectFilterStatus(val: string) {
  filterStatus.value = val;
  openFilterStatus.value = false;
}

function selectNewJenisNaskah(val: string) {
  newDelegasi.value.jenisnaskah = val;
  openNewJenisNaskah.value = false;
}
function selectNewSifatNaskah(val: string) {
  newDelegasi.value.sifat_naskah = val;
  openNewSifatNaskah.value = false;
}

function selectEditJenisNaskah(val: string) {
  editDelegasi.value.jenisnaskah = val;
  openEditJenisNaskah.value = false;
}
function selectEditSifatNaskah(val: string) {
  editDelegasi.value.sifatnaskah = val;
  openEditSifatNaskah.value = false;
}

function selectNewAsalNaskah(item: { id: number; nama: string }) {
  newDelegasi.value.asal_naskah = item.id;
  newDelegasi.value.asal_naskah_label = item.nama;
  openNewAsalNaskah.value = false;
}

function selectNewTertuju(item: any) {
  const exists = newDelegasi.value.tertuju.some(
    (t) => t.position === item.position,
  );

  if (!exists) {
    newDelegasi.value.tertuju.push(item);
  }

  openNewTertuju.value = false;
}
function removeTertuju(position: number) {
  newDelegasi.value.tertuju = newDelegasi.value.tertuju.filter(
    (t) => t.position !== position,
  );
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files) {
    filesRef.value = [];
    return;
  }

  filesRef.value = Array.from(input.files);
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
            class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <RotateCcw class="w-4 h-4" />
          </button>

          <!-- CUSTOM FILTER DROPDOWN -->
          <div class="relative" data-custom-dropdown>
            <button
              class="flex items-center justify-between gap-2 bg-gray-100 text-xs px-3 py-2 rounded-lg min-w-[150px]"
              @click.stop="openFilterStatus = !openFilterStatus"
            >
              <span class="text-sm">
                {{ filterStatus || "Semua" }}
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
                @click.prevent="selectFilterStatus('Semua')"
              >
                Semua
              </button>
              <button
                class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                @click.prevent="selectFilterStatus('Aktif')"
              >
                Aktif
              </button>
              <button
                class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                @click.prevent="selectFilterStatus('Tidak Aktif')"
              >
                Tidak Aktif
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
            class="flex items-center gap-2 bg-primary text-white h-8 px-6 rounded-lg hover:px-5 text-xs"
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
              <tr
                v-for="item in filteredData"
                :key="item.id"
                class="hover:bg-blue-50 transition-colors"
              >
                <td class="px-4 py-3 text-black">
                  <div class="font-medium">
                    {{ item.pengirim?.nama || "-" }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ item.nomor || "-" }}
                  </div>
                  <div class="text-xs text-gray-400">
                    {{ item.tanggal }}
                  </div>
                </td>

                <td class="px-4 py-3 text-black whitespace-nowrap">
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

                    <div
                      v-if="item.final_pdf_url"
                      class="inline-flex w-fit items-center gap-1 bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded text-xs"
                    >
                      Final
                    </div>
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
                  {{ item.jam }}
                </td>
              </tr>
            </tbody>
          </table>
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
      <Modal v-model="showAddModal" @save="saveDelegasi">
        <template #title>
          <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold"
            >Tambah Naskah Dinas</Heading
          >
        </template>

        <div class="flex flex-col gap-4 mt-3 ml-1 mr-1">
          <!-- <div>
            <label class="text-xs font-semibold"
              >Jenis Naskah <span class="text-red-500">*</span></label
            >
            <div class="relative" data-custom-dropdown>
              <button
                class="w-full text-left bg-gray-50 border border-gray-100 rounded-md px-4 py-1 mt-1 flex items-center justify-between"
                @click.stop="openNewJenisNaskah = !openNewJenisNaskah"
              >
                <span class="text-xs text-gray-600">
                  {{ newDelegasi.jenisnaskah || "Pilih Jenis Naskah" }}
                </span>
              </button>

              <div
                v-if="openNewJenisNaskah"
                class="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-md shadow-lg z-50 max-h-56 overflow-auto"
              >
                <button
                  v-for="p in jenisnaskahList"
                  :key="p.id"
                  class="w-full text-left px-4 py-1 mt-1 text-xs hover:bg-gray-100"
                  @click.prevent="selectNewJenisNaskah(p.value)"
                >
                  {{ p.label }}
                </button>
              </div>
            </div>
          </div> -->

          <div class="flex flex-wrap flex-col">
            <label class="text-xs font-semibold"
              >Tanggal Surat <span class="text-red-500">*</span></label
            >
            <input
              v-model="newDelegasi.tanggal_surat"
              type="date"
              class="bg-gray-50 mt-1 border border-gray-100 rounded-md px-4 py-1 text-xs"
            />
          </div>

          <div>
            <label class="text-xs font-semibold"
              >Sifat Naskah <span class="text-red-500">*</span></label
            >
            <div class="relative" data-custom-dropdown>
              <button
                class="w-full text-left bg-gray-50 mt-1 border border-gray-100 rounded-md px-4 py-1 flex items-center justify-between"
                @click.stop="openNewSifatNaskah = !openNewSifatNaskah"
              >
                <span class="text-xs text-gray-600">
                  {{ newDelegasi.sifat_naskah || "Biasa/Terbuka" }}
                </span>
              </button>

              <div
                v-if="openNewSifatNaskah"
                class="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-md shadow-lg z-50 max-h-56 overflow-auto"
              >
                <button
                  v-for="s in sifatnaskahList"
                  :key="s.id"
                  class="w-full text-left px-4 py-1 mt-1 text-xs hover:bg-gray-100"
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
              class="bg-gray-50 mt-1 border border-gray-100 rounded-md px-4 py-1 text-xs"
              placeholder="Masukan nomor"
            />
          </div>

          <div class="flex flex-wrap flex-col">
            <div>
              <label class="text-xs font-semibold">
                Asal Naskah <span class="text-red-500">*</span>
              </label>

              <div class="relative mt-1" data-custom-dropdown>
                <button
                  type="button"
                  class="w-full text-left bg-gray-50 border border-gray-100 rounded-md px-4 py-1 flex items-center justify-between"
                  @click.stop="openNewAsalNaskah = !openNewAsalNaskah"
                >
                  <span class="text-xs text-gray-600">
                    {{ newDelegasi.asal_naskah_label || "Pilih Asal Naskah" }}
                  </span>

                  <svg
                    class="w-4 h-4 text-gray-400"
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
                  v-if="openNewAsalNaskah"
                  class="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-md shadow-lg z-50 max-h-56 overflow-auto"
                >
                  <div
                    v-if="loadingAsalNaskah"
                    class="px-4 py-3 text-xs text-gray-400"
                  >
                    Memuat data...
                  </div>

                  <button
                    v-for="item in asalNaskahList"
                    :key="item.id"
                    class="w-full text-left px-4 py-1 hover:bg-gray-100 text-xs"
                    @click.prevent="selectNewAsalNaskah(item)"
                  >
                    {{ item.nama }}
                  </button>
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
              class="bg-gray-50 mt-1 border border-gray-100 rounded-md px-4 py-1 text-xs"
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
              class="bg-gray-100 mt-1 border border-gray-200 rounded-md px-4 py-1 text-xs cursor-not-allowed"
              placeholder="0 Lampiran"
            />
          </div>

          <div class="flex flex-wrap flex-col">
            <label class="text-xs font-semibold">
              Tertuju <span class="text-red-500">*</span>
            </label>

            <div class="relative mt-1" data-custom-dropdown>
              <button
                type="button"
                class="w-full text-left bg-gray-50 border border-gray-100 rounded-md px-4 py-1 flex items-center justify-between"
                @click.stop="openNewTertuju = !openNewTertuju"
              >
                <div class="flex flex-wrap gap-1">
                  <span
                    v-if="!newDelegasi.tertuju.length"
                    class="text-xs text-gray-400"
                  >
                    Pilih Tertuju
                  </span>

                  <span
                    v-for="t in newDelegasi.tertuju"
                    :key="t.position"
                    class="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs"
                  >
                    {{ t.position_text }}
                    <button
                      type="button"
                      class="hover:text-red-500"
                      @click.stop="removeTertuju(t.position)"
                    >
                      ✕
                    </button>
                  </span>
                </div>

                <svg
                  class="w-4 h-4 text-gray-400"
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
                v-if="openNewTertuju"
                class="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-md shadow-lg z-50 max-h-60 overflow-auto"
              >
                <div
                  v-if="loadingTertuju"
                  class="px-4 py-3 text-xs text-gray-400"
                >
                  Memuat data...
                </div>

                <button
                  v-for="item in tertujuList"
                  :key="item.position"
                  class="w-full text-left px-4 py-1 hover:bg-gray-100 text-xs"
                  @click.prevent="selectNewTertuju(item)"
                >
                  <div class="font-medium">
                    {{ item.position_text }}
                  </div>
                  <div class="text-xs text-gray-500">
                    {{ item.organization_parent_text }}
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap flex-col">
            <label class="text-xs font-semibold"
              >File<span class="text-red-500">*</span></label
            >
            <input
              type="file"
              multiple
              class="bg-gray-50 mt-1 border border-gray-100 rounded-md px-4 py-1 text-xs"
              @change="handleFileChange"
            />
          </div>
        </div>
      </Modal>
    </Teleport>
    <!-- ======= -->
    <!-- MODAL EDIT -->
    <!-- ======= -->
    <Modal v-model="showEditModal" @save="saveEditDelegasi">
      <template #title>
        <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold"
          >Edit Delegasi</Heading
        >
      </template>

      <div class="flex flex-col gap-4 mt-3 ml-1 mr-1">
        <div>
          <label class="text-xs font-semibold"
            >Jenis Naskah <span class="text-red-500">*</span></label
          >
          <div class="relative" data-custom-dropdown>
            <button
              class="w-full text-left mt-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between"
              @click.stop="openEditJenisNaskah = !openEditJenisNaskah"
            >
              <span class="text-sm text-gray-600">{{
                editDelegasi.jenisnaskah || "Pilih Jenis Naskah"
              }}</span>
            </button>

            <div
              v-if="openEditJenisNaskah"
              class="absolute left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
            >
              <button
                v-for="p in jenisnaskahList"
                :key="p.id"
                class="w-full text-left mt-1 px-4 py-3 hover:bg-gray-100"
                @click.prevent="selectEditJenisNaskah(p.value)"
              >
                {{ p.label }}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold"
            >Sifat Naskah <span class="text-red-500">*</span></label
          >
          <div class="relative" data-custom-dropdown>
            <button
              class="w-full text-left mt-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between"
              @click.stop="openEditSifatNaskah = !openEditSifatNaskah"
            >
              <span class="text-sm text-gray-600">{{
                editDelegasi.sifatnaskah || "Biasa/Terbuka"
              }}</span>
            </button>

            <div
              v-if="openEditSifatNaskah"
              class="absolute left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
            >
              <button
                v-for="s in sifatnaskahList"
                :key="s.id"
                class="w-full text-left mt-1 px-4 py-3 hover:bg-gray-100"
                @click.prevent="selectEditSifatNaskah(s.value)"
              >
                {{ s.label }}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold"
            >Jabatan <span class="text-red-500">*</span></label
          >
          <div class="relative" data-custom-dropdown>
            <button
              class="w-full text-left mt-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between"
              @click.stop="openEditJabatan = !openEditJabatan"
            >
              <span class="text-sm text-gray-600">{{
                editDelegasi.jabatan || "Pilih jabatan"
              }}</span>
            </button>

            <div
              v-if="openEditJabatan"
              class="absolute left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
            >
              <button
                v-for="j in jabatanList"
                :key="j.id"
                class="w-full text-left mt-1 px-4 py-3 hover:bg-gray-100"
                @click.prevent="selectEditJabatan(j.value)"
              >
                {{ j.label }}
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold"
              >Mulai <span class="text-red-500">*</span></label
            >
            <input
              v-model="editDelegasi.mulai"
              type="text"
              class="w-full border border-gray-200 mt-1 text-xs px-4 py-3 rounded-lg"
              placeholder="dd/mm/yyyy"
            />
          </div>

          <div>
            <label class="text-xs font-semibold"
              >Sampai <span class="text-red-500">*</span></label
            >
            <input
              v-model="editDelegasi.sampai"
              type="text"
              class="w-full border border-gray-200 mt-1 text-xs px-4 py-3 rounded-lg"
              placeholder="dd/mm/yyyy"
            />
          </div>
        </div>
      </div>
    </Modal>

    <!-- POPUP DELETE -->
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      title="Hapus Data?"
      description="Data yang dihapus tidak dapat dikembalikan."
      confirmText="Hapus"
      cancelText="Batal"
      @confirm="deleteNow"
    />
  </div>
</template>

<style scoped>
/* minor styling for dropdowns and scrollbars */
[data-custom-dropdown] button:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08);
}
</style>
