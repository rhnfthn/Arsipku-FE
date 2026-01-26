<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Back Button -->
      <button
        @click="navigateTo('/master/company')"
        class="flex items-center gap-2 mb-5 text-gray-600 hover:text-gray-900 group"
      >
        <ChevronLeft
          class="w-5 h-5 group-hover:-translate-x-1 transition-transform"
        />
        <span class="font-medium">Kembali ke Master Perusahaan</span>
      </button>

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Struktur Organisasi</h1>
          <p class="text-gray-500 text-sm">
            Kelola struktur organisasi perusahaan
          </p>
          <div
            class="flex gap-3 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"
          >
            <Building2 class="w-4 h-4 text-blue-900" />
            <p class="text-sm text-blue-900">
              Perusahaan:
              <span class="font-bold">{{ company?.namaPanjang }}</span>
            </p>
          </div>
        </div>
        <NuxtLink
          :to="`/master/company/${route.params.kode}/area`"
          class="flex items-center gap-2 bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg"
        >
          <MapPin class="w-4 h-4" />
          Kelola Area
        </NuxtLink>
      </div>

      <!-- Organization Tree Card -->
      <div
        class="bg-white shadow-lg border border-gray-100 rounded-xl overflow-hidden"
      >
        <!------------ COMPANY HEADER -------------->
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
                <h2 class="text-lg font-bold">{{ company?.namaPanjang }}</h2>
                <p class="text-blue-100 text-xs">
                  {{ company?.tanggalMulai }} - {{ company?.tanggalBerakhir }}
                </p>
              </div>
              <span class="px-2 py-1 bg-white/20 rounded text-xs font-medium"
                >KP</span
              >
              <button
                @click="openEditModal(company, 'company')"
                class="p-2 hover:bg-white/20 rounded transition-colors"
              >
                <Info class="w-4 h-4" />
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="openAddUnitModal(null, 'company')"
                class="flex items-center gap-2 px-4 py-1 bg-white hover:bg-white/30 rounded-lg transition-colors text-primary hover:text-white text-sm"
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
                @click="openDeleteConfirm(company)"
                class="p-2 hover:bg-red-500/30 rounded transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-------- ORGANIZATION  -------------->
        <div v-if="companyExpanded" class="p-6">
          <Organization
            v-for="(node, idx) in organizationTree"
            :key="node.id"
            :node="node"
            :level="0"
            :is-last="idx === organizationTree.length - 1"
            :parent-type="'direktorat'"
            :expanded-nodes="expandedNodes"
            :hovered-node="hoveredNode"
            @toggle-node="toggleNode"
            @set-hovered="setHoveredNode"
            @open-edit="openEditModal"
            @open-delete="openDeleteConfirm"
            @open-add-unit="openAddUnitModal"
            @open-add-position="openAddPositionModal"
            @open-add-anggota="openAddAnggotaModal"
          />
        </div>
      </div>
    </div>

    <!-------------- ADD UNIT MODAL -------------->
    <Teleport to="body">
      <Modal v-model="showAddUnitModal" size="xl" @save="handleSaveUnit">
        <template #title>
          <div class="p-3">
            <h3 class="text-lg font-bold">Tambah Unit</h3>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-semibold">
              Nama Unit <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formUnit.namaUnit"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
              placeholder="Contoh: DIVISI KEUANGAN"
            />
          </div>

          <div>
            <label class="text-sm font-semibold">
              ID Unit <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formUnit.idUnit"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
              placeholder="Contoh: UNIT-001"
            />
          </div>

          <div>
            <label class="text-sm font-semibold">Titelatur</label>
            <input
              v-model="formUnit.titelatur"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
              placeholder="Contoh: Manager"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-semibold">ID Area</label>
              <input
                v-model="formUnit.idArea"
                class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
                placeholder="Masukkan ID Area"
              />
            </div>
            <div>
              <label class="text-sm font-semibold">Area</label>
              <input
                v-model="formUnit.area"
                class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label class="text-sm font-semibold">Deskripsi Lengkap</label>
            <textarea
              v-model="formUnit.deskripsi"
              rows="2"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
              placeholder="Deskripsi lengkap unit"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-semibold">
                Tanggal Mulai <span class="text-red-500">*</span>
              </label>
              <input
                type="date"
                v-model="formUnit.mulai"
                class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label class="text-sm font-semibold">
                Tanggal Berakhir <span class="text-red-500">*</span>
              </label>
              <input
                type="date"
                v-model="formUnit.berakhir"
                class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-------------- ADD POSITION MODAL -------------->
    <Teleport to="body">
      <Modal
        v-model="showAddPositionModal"
        size="xl"
        @save="handleSavePosition"
      >
        <template #title>
          <div clas="p-3">
            <h3 class="text-lg font-bold">Tambah Posisi</h3>
            <p class="text-sm mt-1 text-gray-600">Isi form di bawah ini</p>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-semibold">
              Nama Posisi <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formPosition.namaPos"
              placeholder="Direktur Utama"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label class="text-sm font-semibold">
              ID Posisi <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formPosition.idPos"
              placeholder="POS-001"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label class="text-sm font-semibold">Titelatur</label>
            <input
              v-model="formPosition.titelatur"
              placeholder="Masukkan titelatur"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label class="text-sm font-semibold">ID Area</label>
            <input
              v-model="formPosition.idArea"
              placeholder="Masukkan ID area"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label class="text-sm font-semibold">Area</label>
            <select
              v-model="formPosition.area"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="">Pilih unit</option>
            </select>
          </div>

          <div>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                v-model="formPosition.chief"
                class="w-4 h-4"
              />
              <span class="text-sm font-semibold">Chief</span>
            </label>
          </div>

          <div>
            <label class="text-sm font-semibold">Deskripsi Lengkap</label>
            <textarea
              v-model="formPosition.deskripsi"
              rows="2"
              placeholder="Deskripsi lengkap posisi"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-semibold">
                Tanggal Mulai <span class="text-red-500">*</span>
              </label>
              <input
                type="date"
                v-model="formPosition.mulai"
                class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label class="text-sm font-semibold">
                Tanggal Berakhir <span class="text-red-500">*</span>
              </label>
              <input
                type="date"
                v-model="formPosition.berakhir"
                class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!------------ ADD ANGGOTA MODAL -------------->
    <Teleport to="body">
      <Modal v-model="showAddAnggotaModal" size="xl" @save="handleSaveAnggota">
        <template #title>
          <div class="p-3">
            <h3 class="text-lg font-bold">Tambah Anggota</h3>
            <p class="text-sm mt-1 text-gray-600">Isi form di bawah ini</p>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-semibold">
              Nama Anggota <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formAnggota.nama"
              placeholder="Ahmad Wijaya"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label class="text-sm font-semibold">
              Personal Number <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formAnggota.pn"
              placeholder="PN-1001"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </Teleport>
    <!-- Edit Modal -->
    <Teleport to="body">
      <Modal v-model="showEditModal" size="xl" @save="handleSaveEdit">
        <template #title>
          <div class="p-3">
            <h3 class="text-lg font-bold">Edit {{ editType }}</h3>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-semibold">Nama</label>
            <input
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label class="text-sm font-semibold">Kode/ID</label>
            <input
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </Teleport>
    <!-- Delete Confirm Modal -->
    <ConfirmPopup
      v-model="showDeleteConfirm"
      title="Hapus Item"
      message="Apakah Anda yakin ingin menghapus item ini?"
      confirm-text="Hapus"
      cancel-text="Batal"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Building2,
  Info,
} from "lucide-vue-next";

const route = useRoute();

const companyExpanded = ref(true);
const expandedNodes = ref<Record<string, boolean>>({});
const hoveredNode = ref<string | null>(null);

// Modals
const showAddUnitModal = ref(false);
const showAddPositionModal = ref(false);
const showAddAnggotaModal = ref(false);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);
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

const formAnggota = ref({
  nama: "",
  pn: "",
});

// Data
const company = ref({
  kode: route.params.kode,
  tanggalMulai: "01/01/2023",
  tanggalBerakhir: "31/12/2025",
  namaPendek: "AIRNAV",
  namaPanjang: "Perum LPPNPI",
});

const organizationTree = ref([
  {
    id: "dir-1",
    name: "DIREKTORAT UTAMA",
    direktur: {
      id: "direktur-1",
      name: "DIREKTUR UTAMA",
      pn: "PN-1000",
      anggota: [
        {
          id: "anggota-1",
          name: "NOVIE RIYANTO",
          pn: "PN-1000",
        },
      ],
      divisions: [
        {
          id: "div-1",
          name: "CORPORATE SECRETARY DIVISION",
        },
        {
          id: "div-2",
          name: "DIREKTORAT KESELAMATAN, KEAMANAN DAN STAN",
        },
      ],
    },
  },
  {
    id: "dir-2",
    name: "DIREKTORAT OPERASI",
    divisions: [],
  },
  {
    id: "dir-3",
    name: "DIREKTORAT SDM DAN UMUM",
    divisions: [],
  },
  {
    id: "dir-4",
    name: "DIREKTORAT TEKNIK",
    direktur: {
      id: "direktur-teknik",
      name: "DIREKTUR TEKNIK",
      pn: "PN-4000",
      divisions: [
        {
          id: "subdiv-1",
          name: "TECHNOLOGY SOLUTION DIVISION",
        },
      ],
    },
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

const openDeleteConfirm = (item: any) => {
  showDeleteConfirm.value = true;
};

const openAddUnitModal = (parent: any, type: string) => {
  showAddUnitModal.value = true;
};

const openAddPositionModal = (parent: any) => {
  showAddPositionModal.value = true;
};

const openAddAnggotaModal = (parent: any) => {
  showAddAnggotaModal.value = true;
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

const handleSaveAnggota = () => {
  console.log("SAVE ANGGOTA:", formAnggota.value);
  showAddAnggotaModal.value = false;
  formAnggota.value = { nama: "", pn: "" };
};

const handleSaveEdit = () => {
  console.log("SAVE EDIT");
  showEditModal.value = false;
};

const handleDelete = () => {
  console.log("DELETE CONFIRMED");
  showDeleteConfirm.value = false;
};
</script>
