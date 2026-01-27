<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Struktur Organisasi</h1>
          <!-- Breadcrumb -->
          <nav class="flex items-center gap-2 mt-2 text-sm text-gray-600">
            <NuxtLink
              to="/master/perusahaan"
              class="text-gray-500 font-medium hover:text-primary transition-colors text-xs transition-colors"
            >
              Master Perusahaan
            </NuxtLink>
            <span class="mx-1.5 text-gray-400 dark:text-gray-600 text-xs"
              >/</span
            >
            <span class="text-primary-400 font-semibold text-xs"
              >Struktur Organisasi</span
            >
          </nav>
          <!-- <div
            class="flex mt-4 p-4 gap-3 bg-blue-50 border border-blue-200 rounded-xl"
          >
            <Building2 class="w-4 h-4 text-blue-900" />
            <p class="text-sm text-blue-900">
              Perusahaan:
              <span class="font-bold">{{ company?.namaPanjang }}</span>
            </p>
          </div> -->
        </div>
        <NuxtLink
          :to="`/master/perusahaan/${route.params.kode}/area`"
          class="flex items-center gap-2 bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg"
        >
          <MapPin class="w-4 h-4" />
          Kelola Area
        </NuxtLink>
      </div>

      <!-- Organization Tree Card -->
      <div
        class="bg-white shadow-lg border mt-5 border-gray-100 rounded-xl overflow-hidden"
      >
        <!-- Company Header -->
        <div class="bg-primary text-white px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button
                @click="companyExpanded = !companyExpanded"
                class="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <ChevronDown
                  v-if="companyExpanded"
                  class="w-5 h-5 text-white"
                />
                <ChevronRight v-else class="w-5 h-5 text-white" />
              </button>
              <Building2 class="w-5 h-5" />
              <div>
                <h2 class="text-lg font-bold">{{ company.namaPanjang }}</h2>
                <p class="text-primary-100 text-xs">
                  {{ company.tanggalMulai }} - {{ company.tanggalBerakhir }}
                </p>
              </div>
              <span class="px-2 py-1 bg-white/20 rounded text-xs font-medium"
                >KP</span
              >
              <button class="p-2 hover:bg-white/20 rounded transition-colors">
                <Info class="w-4 h-4" />
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="openAddUnitModal(null, 'company')"
                class="flex items-center gap-2 px-3 py-1 bg-white hover:bg-white/90 rounded-lg transition-colors text-primary-600 text-sm font-medium"
              >
                <Plus class="w-4 h-4" />
                Tambah Unit
              </button>
              <button
                @click="openEditModal(company, 'company')"
                class="p-2 hover:bg-white/20 rounded transition-colors"
              >
                <Pencil class="w-4 h-4" />
              </button>

              <button
                @click="openDelete(company)"
                class="p-2 hover:bg-red-500/30 rounded transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div class="relative w-full mt-5 ml-5 pr-5">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="searchQuery"
            placeholder="Cari..."
            class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <!-- Organization Tree -->
        <div v-if="companyExpanded" class="p-6">
          <Organization
            v-for="(node, idx) in organizationTree"
            :key="node.id"
            :node="node"
            :level="0"
            :is-last="idx === organizationTree.length - 1"
            :expanded-nodes="expandedNodes"
            :hovered-node="hoveredNode"
            @toggle-node="toggleNode"
            @set-hovered="setHoveredNode"
            @open-edit="openEditModal"
            @open-delete="openDelete"
            @open-add-unit="openAddUnitModal"
            @open-add-position="openAddPositionModal"
            @open-add-member="openAddMemberModal"
          />
        </div>
      </div>
    </div>

    <!-- Add Unit Modal -->
    <Teleport to="body">
      <Modal v-model="showAddUnitModal" size="xl" @save="handleSaveUnit">
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-3 ml-5">Tambah Unit</h3>
        </template>

        <div class="space-y-4 p-1">
          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Unit <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.namaUnit"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              placeholder="Contoh: DIVISI KEUANGAN"
            />
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              ID Unit <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.idUnit"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              placeholder="Contoh: UNIT-001"
            />
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              Titelatur <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.titelatur"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              placeholder="Contoh: Manager"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                ID Area <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="formUnit.idArea"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
                placeholder="Masukkan ID Area"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                Area <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="formUnit.area"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              Deskripsi Lengkap <span class="text-red-500">*</span>
            </Heading>

            <textarea
              v-model="formUnit.deskripsi"
              rows="2"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              placeholder="Deskripsi lengkap unit"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                Tanggal Mulai <span class="text-red-500">*</span>
              </Heading>

              <input
                type="date"
                v-model="formUnit.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                Tanggal Berakhir <span class="text-red-500">*</span>
              </Heading>

              <input
                type="date"
                v-model="formUnit.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Add Position Modal -->
    <Teleport to="body">
      <Modal
        v-model="showAddPositionModal"
        size="xl"
        @save="handleSavePosition"
      >
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-3 ml-5">Tambah Posisi</h3>
        </template>

        <div class="space-y-4 p-1">
          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Posisi <span class="text-red-500">*</span>
            </Heading>

            <input
              v-model="formPosition.namaPos"
              placeholder="Direktur Utama"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              ID Posisi <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.idPos"
              placeholder="POS-001"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              Titelatur <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.titelatur"
              placeholder="Masukkan titelatur"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              ID Area <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.idArea"
              placeholder="Masukkan ID area"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              Area <span class="text-red-500">*</span>
            </Heading>
            <select
              v-model="formPosition.area"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            >
              <option value="">Pilih unit</option>
            </select>
          </div>
          <div>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="formPosition.chief"
                class="w-4 h-4 rounded"
              />
              <span class="text-sm font-medium">Chief</span>
            </label>
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              Deskripsi Lengkap <span class="text-red-500">*</span>
            </Heading>

            <textarea
              v-model="formPosition.deskripsi"
              rows="3"
              placeholder="Deskripsi lengkap posisi"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs">
                Tanggal Mulai <span class="text-red-500">*</span>
              </Heading>

              <input
                type="date"
                v-model="formPosition.mulai"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs">
                Tanggal Berakhir <span class="text-red-500">*</span>
              </Heading>

              <input
                type="date"
                v-model="formPosition.berakhir"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Add Member Modal -->
    <Teleport to="body">
      <Modal v-model="showAddMemberModal" size="xl" @save="handleSaveMember">
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-3 ml-5">Tambah Anggota</h3>
        </template>

        <div class="space-y-4 p-1">
          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Anggota <span class="text-red-500">*</span>
            </Heading>

            <input
              v-model="formMember.nama"
              placeholder="Ahmad Wijaya"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              Personal Number<span class="text-red-500">*</span>
            </Heading>

            <input
              v-model="formMember.pn"
              placeholder="PN-1001"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>
        </div>
      </Modal>

      <!-- Edit Modal -->
      <Modal v-model="showEditModal" size="xl" @save="handleSaveEdit">
        <template #title>
          <h3 class="font-semibold text-lg mb-3 mt-5 ml-5">
            Edit {{ editType }}
          </h3>
        </template>

        <div class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama <span class="text-red-500">*</span>
            </Heading>
            <input
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              Kode ID <span class="text-red-500">*</span>
            </Heading>
            <input
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Delete Confirm Popup -->
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      type="danger"
      title="Hapus Data"
      message="Yakin ingin menghapus data ini?"
      confirmText="Hapus"
      cancelText="Batal"
      cancelColor="primary"
      @confirm="deleteNow"
      @cancel="confirmDeleteOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Building2,
  Info,
  Search,
  X,
} from "lucide-vue-next";

const confirmDeleteOpen = ref(false);
const itemToDelete = ref(null);
const route = useRoute();

const companyExpanded = ref(true);
const expandedNodes = ref<Record<string, boolean>>({
  "dir-1": true,
  "pos-1": true,
  "dir-2": true,
  "pos-2": true,
  "unit-3": true,
});
const hoveredNode = ref<string | null>(null);

// Modals
const showAddUnitModal = ref(false);
const showAddPositionModal = ref(false);
const showAddMemberModal = ref(false);
const showEditModal = ref(false);
const editType = ref<string | null>(null);

// Forms
const formUnit = ref({
  namaUnit: "",
  idUnit: "",
  titelatur: "",
  idArea: "",
  area: "",
  deskripsi: "",
  mulai: "",
  berakhir: "",
});

const formPosition = ref({
  namaPos: "",
  idPos: "",
  titelatur: "",
  idArea: "",
  area: "",
  chief: false,
  deskripsi: "",
  mulai: "",
  berakhir: "",
});

const formMember = ref({
  nama: "",
  pn: "",
});

// Data
const company = ref({
  kode: route.params.kode,
  tanggalMulai: "01/01/2020",
  tanggalBerakhir: "31/12/2025",
  namaPendek: "AIRNAV",
  namaPanjang: "Perum LPPNPI",
});

// Struktur yang diperbaiki: Unit sejajar dengan Posisi
const organizationTree = ref([
  {
    id: "dir-1",
    name: "DIREKTORAT UTAMA",
    type: "direktorat",
    children: [
      {
        id: "pos-1",
        name: "DIREKTUR UTAMA",
        type: "position",
        children: [
          {
            id: "member-1",
            name: "NOVIE RIYANTO",
            pn: "PN-1000",
            type: "member",
          },
        ],
      },
      {
        id: "unit-1",
        name: "CORPORATE SECRETARY DIVISION",
        type: "unit",
        children: [],
      },
      {
        id: "unit-2",
        name: "DIREKTORAT KESELAMATAN, KEAMANAN DAN STAN",
        type: "unit",
        children: [],
      },
    ],
  },
  {
    id: "dir-2",
    name: "DIREKTORAT OPERASI",
    type: "direktorat",
    children: [
      {
        id: "pos-2",
        name: "DIREKTUR OPERASI",
        type: "position",
        children: [
          {
            id: "member-2",
            name: "BAMBANG SUGIARTO",
            pn: "PN-1002",
            type: "member",
          },
        ],
      },
      {
        id: "unit-3",
        name: "AIR NAVIGATION SERVICES PLANNING DIVISION",
        type: "unit",
        children: [
          {
            id: "pos-4",
            name: "MANAGER PLANNING",
            type: "position",
            children: [
              {
                id: "member-3",
                name: "SITI NURHALIZA",
                pn: "PN-1003",
                type: "member",
              },
            ],
          },
          {
            id: "unit-5",
            name: "SUB DIVISION STRATEGIC PLANNING",
            type: "unit",
            children: [],
          },
        ],
      },
      {
        id: "unit-4",
        name: "AIR NAVIGATION CONTROL DIVISION",
        type: "unit",
        children: [],
      },
      {
        id: "pos-3",
        name: "AIR NAVIGATION INFORMATION MANAGEMENT",
        type: "position",
        children: [],
      },
    ],
  },
  {
    id: "dir-3",
    name: "DIREKTORAT SDM DAN UMUM",
    type: "direktorat",
    children: [],
  },
  {
    id: "dir-4",
    name: "DIREKTORAT TEKNIK",
    type: "direktorat",
    children: [],
  },
]);

// Methods
const toggleNode = (id: string) => {
  expandedNodes.value[id] = !expandedNodes.value[id];
};

const setHoveredNode = (id: string | null) => {
  hoveredNode.value = id;
};

const openEditModal = (item: any, type: string) => {
  editType.value = type;
  showEditModal.value = true;
};

const openDelete = (item: any) => {
  itemToDelete.value = item;
  confirmDeleteOpen.value = true;
};

const deleteNow = async () => {
  if (!itemToDelete.value) return;

  try {
    console.log("🗑️ Deleting item:", itemToDelete.value);
    // Uncomment when API is ready
    // await deleteItem(itemToDelete.value.id);
    confirmDeleteOpen.value = false;
    // await fetchData();
  } catch (error) {
    console.error("❌ Error deleting item:", error);
  } finally {
    itemToDelete.value = null;
  }
};

const openAddUnitModal = (parent: any, type: string) => {
  showAddUnitModal.value = true;
};

const openAddPositionModal = (parent: any) => {
  showAddPositionModal.value = true;
};

const openAddMemberModal = (parent: any) => {
  showAddMemberModal.value = true;
};

const handleSaveUnit = () => {
  console.log("SAVE UNIT:", formUnit.value);
  showAddUnitModal.value = false;
  formUnit.value = {
    namaUnit: "",
    idUnit: "",
    titelatur: "",
    idArea: "",
    area: "",
    deskripsi: "",
    mulai: "",
    berakhir: "",
  };
};

const handleSavePosition = () => {
  console.log("SAVE POSITION:", formPosition.value);
  showAddPositionModal.value = false;
  formPosition.value = {
    namaPos: "",
    idPos: "",
    titelatur: "",
    idArea: "",
    area: "",
    chief: false,
    deskripsi: "",
    mulai: "",
    berakhir: "",
  };
};

const handleSaveMember = () => {
  console.log("SAVE MEMBER:", formMember.value);
  showAddMemberModal.value = false;
  formMember.value = { nama: "", pn: "" };
};

const handleSaveEdit = () => {
  console.log("SAVE EDIT");
  showEditModal.value = false;
};
</script>
