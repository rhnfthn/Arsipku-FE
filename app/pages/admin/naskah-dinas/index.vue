<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import {
  Search,
  ArrowUpDown,
  RotateCcw,
  Plus,
  User,
  Pencil,
  Trash2,
  FileDown
} from "lucide-vue-next";

import Modal from "~/components/Modal.vue";
import ConfirmPopup from "~/components/ConfirmPopup.vue";

// ==============================
// STATE (existing)
// ==============================
const search = ref("");
const filterStatus = ref("Semua");
const sortDirection = ref<"asc" | "desc" | null>(null);
const showAddModal = ref(false);
const showEditModal = ref(false);

const items = [
    {
        label: 'Dashboard',
        to: '/admin/dashboard'
    },
    {
        label: 'Naskah Dinas',
        to: '/admin/naskah-dinas'
    },

] satisfies BreadcrumbItem[]


const listDelegasi = ref([
  {
    id: 1,
    jenisnaskah: "UND-Surat Undangan",
    sifatnaskah: "Biasa/Terbuka",
    tertuju: "Direktur Operasi PT Garuda",
    noasalnaskah: "Garuda/Jktd0/2012/2025",
    tanggal: "26/11/2025",
    asalnaskah:"Devy yunita",
    jabatan:"Direktur Operasi",
    perihal:"Permohonan kunjungan ke bandara internasional kertajati (kjt)",
    jam:"16.00",
    file:"example.pdf"
  },
]);

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
  data = data.filter((item) => {
    const matchSearch = item.jenisnaskah
      .toLowerCase()
      .includes(search.value.toLowerCase());
    const matchStatus =
      filterStatus.value === "Semua" || item.status === filterStatus.value;
    return matchSearch && matchStatus;
  });

  if (sortDirection.value === "asc")
    data.sort((a, b) => a.jenisnaskah.localeCompare(b.jenisnaskah));
  if (sortDirection.value === "desc")
    data.sort((a, b) => b.jenisnaskah.localeCompare(a.jenisnaskah));
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
    (i) => i.id !== itemToDelete.value.id
  );
  confirmDeleteOpen.value = false;
};

// ==============================
// ADD & EDIT DELEGASI (existing)
// ==============================
const newDelegasi = ref({
  jenisnaskah: "",
  sifataskah: "",

});

const saveDelegasi = () => {
  listDelegasi.value.push({
    id: Date.now(),
    jenisnaskah: newDelegasi.value.jenisnaskah,
    sifatnaskah: newDelegasi.value.sifataskah,
    // tanggal: `${newDelegasi.value.mulai} - ${newDelegasi.value.sampai}`,
  });

  showAddModal.value = false;

  newDelegasi.value = {
    jenisnaskah: "",
    sifatnaskah: "",
    tertuju: "",
    noasalnaskah: "",
    tanggal: "",
    asalnaskah:"",
    jabatan:"",
    perihal:"",
    jam:""
  };
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
    (x) => x.id === editDelegasi.value.id
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
  }
];

const sifatnaskahList = [
  { id: 1, label: "Biasa/Terbuka", value: "Biasa/Terbuk" },
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
  newDelegasi.value.sifataskah = val;
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

</script>

<template>
    <div class="mb-3 flex flex-wrap justify-between">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <!-- Left Section - Title & Breadcrumb -->
            <PageHeader title="Naskah Dinas" :items="items" />
        </div>
        <UButton
            @click="showAddModal = true"
            class="flex items-center gap-1 bg-primary hover:bg-primary-800 text-white h-10 rounded-lg text-xs"
          >
            <Plus class="w-4 h-4" />
            Tambah Naskah Dinas
        </UButton>        
    </div>
  <div class="w-full min-w-0 min-h-screen bg-gray-50">
    <div
      class="flex flex-col w-full bg-white rounded-xl shadow-sm border border-gray-200"
    >
      <div class=" border-b border-gray-200">
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
        <th class="px-4 py-3 border-b-2 border-b-gray-100 ">Tertuju</th>
        <th class="px-4 py-3 border-b-2 border-b-gray-100 ">Asal Naskah</th>
        <th class="px-4 py-3 border-b-2 border-b-gray-100 ">Jabatan</th>
        <th class="px-4 py-3 border-b-2 border-b-gray-100 ">Perihal</th>
        <th class="px-4 py-3 border-b-2 border-b-gray-100 ">Jam Dibuat</th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="item in filteredData"
        :key="item.id"
        class="hover:bg-blue-50 transition-colors"
      >
        <td class="px-4 py-3 text-black uppercase">
          {{ item.tertuju }} <br>
          {{ item.noasalnaskah }} <br>
          {{ item.tanggal}}
        </td>

        <td class="px-4 py-3 text-black uppercase">
          {{ item.asalnaskah }}
        </td>
        <td class="px-4 py-3 text-black uppercase">
          {{ item.jabatan }}
        </td>
        <td class="px-4 py-3 text-black">
          <div class="flex flex-wrap">
            <div class="uppercase">
              {{ item.perihal }}
            </div>
            <div class="bg-emerald-200 text-green-500  px-2 border border-gray-100 rounded-md">
              {{ item.file }}
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-black uppercase">
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
    <Modal v-model="showAddModal" @save="saveDelegasi">
      <template #title>
        <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold"
          >Tambah Naskah Dinas</Heading
        >
      </template>

      <div class="flex flex-col gap-4 mt-3 ml-1 mr-1">
        <div>
          <label class="text-xs font-semibold"
            >Jenis Naskah <span class="text-red-500">*</span></label
          >
          <!-- custom select -->
          <div class="relative" data-custom-dropdown>
            <button
              class="w-full text-left bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mt-1 flex items-center justify-between"
              @click.stop="openNewJenisNaskah = !openNewJenisNaskah"
            >
              <span class="text-sm text-gray-600">
                {{ newDelegasi.jenisnaskah || "Pilih Jenis Naskah" }}
              </span>
            </button>

            <div
              v-if="openNewJenisNaskah"
              class="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
            >
              <button
                v-for="p in jenisnaskahList"
                :key="p.id"
                class="w-full text-left px-4 py-3 mt-1 hover:bg-gray-100"
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
          <input type="date" class="bg-gray-50 mt-1 border border-gray-100 rounded-lg px-4 py-3">
        </div>

        <div>
          <label class="text-xs font-semibold"
            >Sifat Naskah <span class="text-red-500">*</span></label
          >
          <div class="relative" data-custom-dropdown>
            <button
              class="w-full text-left bg-gray-50 mt-1 border border-gray-100 rounded-lg px-4 py-3 flex items-center justify-between"
              @click.stop="openNewSifatNaskah = !openNewSifatNaskah"
            >
              <span class="text-sm text-gray-600">
                {{ newDelegasi.sifataskah || "Biasa/Terbuka" }}
              </span>
            </button>

            <div
              v-if="openNewSifatNaskah"
              class="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg z-50 max-h-56 overflow-auto"
            >
              <button
                v-for="s in sifatnaskahList"
                :key="s.id"
                class="w-full text-left px-4 py-3 mt-1 hover:bg-gray-100"
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
          <input type="text" class="bg-gray-50 mt-1 border border-gray-100 rounded-lg px-4 py-3">
        </div>

        <div class="flex flex-wrap flex-col">
          <label class="text-xs font-semibold"
            >Asal Naskah <span class="text-red-500">*</span></label
          >
          <input type="text" class="bg-gray-50 mt-1 border border-gray-100 rounded-lg px-4 py-3">
        </div>

        <div class="flex flex-wrap flex-col">
          <label class="text-xs font-semibold"
            >Perihal <span class="text-red-500">*</span></label
          >
          <input type="text" class="bg-gray-50 mt-1 border border-gray-100 rounded-lg px-4 py-3">
        </div>

        <div class="flex flex-wrap flex-col">
          <label class="text-xs font-semibold"
            >Lampiran<span class="text-red-500">*</span></label
          >
          <input type="text" class="bg-gray-50 mt-1 border border-gray-100 rounded-lg px-4 py-3">
        </div>

        <div class="flex flex-wrap flex-col">
          <label class="text-xs font-semibold"
            >Tertuju<span class="text-red-500">*</span></label
          >
          <input type="text" class="bg-gray-50 mt-1 border border-gray-100 rounded-lg px-4 py-3">
        </div>

        <div class="flex flex-wrap flex-col">
          <label class="text-xs font-semibold"
            >File<span class="text-red-500">*</span></label
          >
          <input type="file" class="bg-gray-50 mt-1 border border-gray-100 rounded-lg px-4 py-3">
        </div>

      </div>
    </Modal>
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
