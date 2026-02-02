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
        <div class="bg-primary text-white px-6 py-4" v-if="company">
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
        <div class="mt-3 ml-5 relative flex-1 w-full md:w-260">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="searchQuery"
            placeholder="Cari..."
            class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                ID Sub Area <span class="text-red-500">*</span>
              </Heading>

              <select
                v-model="formUnit.idsubArea"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Pilih ID Sub Area</option>

                <option
                  v-for="sub in subAreaOptions"
                  :key="sub.sub_area"
                  :value="sub.sub_area"
                >
                  {{ sub.sub_area }}
                </option>
              </select>
            </div>

            <div>
              <Heading variant="heading11m" class="text-xs">
                Sub Area <span class="text-red-500">*</span>
              </Heading>
              <select
                v-model="formUnit.idsubArea"
                class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Pilih Sub Area</option>

                <option
                  v-for="sub in subAreaOptions"
                  :key="sub.id"
                  :value="sub.sub_area"
                >
                  {{ sub.shortText || sub.longText }}
                </option>
              </select>
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

          <div v-if="formPosition.chief">
            <Heading variant="heading11m" class="text-xs">
              Level Chief <span class="text-red-500">*</span>
            </Heading>

            <select
              v-model="formPosition.chiefLevel"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="">Pilih Level</option>
              <option
                v-for="opt in chiefOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
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

        <!-- EDIT UNIT -->
        <div v-if="editType === 'Unit'" class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Unit <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.namaUnit"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              Kode Unit <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formUnit.idUnit"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>
        </div>

        <!-- EDIT POSISI -->
        <div v-if="editType === 'Posisi'" class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Posisi <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.namaPos"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <Heading variant="heading11m" class="text-xs">
              Kode Posisi <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formPosition.idPos"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <!-- EDIT ANGGOTA -->
        <div v-if="editType === 'Anggota'" class="space-y-5">
          <div>
            <Heading variant="heading11m" class="text-xs">
              Nama Anggota <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formMember.nama"
              class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs">
              Personal Number <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formMember.pn"
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
import { ref, watch } from "vue";
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

import { useStruktur } from "~/composables/useStruktur";
import { useCompany } from "~/composables/useCompany";
import { useArea } from "~/composables/useArea";
import { useToast } from "#imports";

const {
  getCompanyTree,
  getOrganizationChildren,
  createOrganization,
  deleteOrganization,
  updateOrganization,

  getPositionsByOrganization,
  createPosition,
  deletePosition,
  updatePosition,

  getPersonsByPosition,
  createPerson,
  deletePerson,
  updatePerson,
} = useStruktur();

const { getCompanyByCode } = useCompany();
const { getSubAreasByCompany } = useArea();

const confirmDeleteOpen = ref(false);
const itemToDelete = ref(null);
const route = useRoute();

const companyExpanded = ref(true);
const expandedNodes = ref<Record<string, boolean>>({});

const hoveredNode = ref<string | null>(null);
const editingNode = ref<any>(null);
const searchQuery = ref("");

const toast = useToast();

const showSuccessToast = (message: string) => {
  toast.add({
    title: "Berhasil",
    description: message,
    color: "success",
    icon: "i-lucide-check-circle",
  });
};

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
  idsubArea: "",
  subarea: "",
  deskripsi: "",
  mulai: "",
  berakhir: "",
});

const formPosition = ref({
  namaPos: "",
  idPos: "",
  kodePosisi: "",
  chief: false,
  chiefLevel: "",
  mulai: "",
  berakhir: "",
});

const formMember = ref({
  nama: "",
  pn: "",
});

// Data
const company = ref<any>(null);

// get organisasi
// const fetchStructure = async () => {
//   const res = await getCompanyTree(route.params.kode as string);
//   organizationTree.value = res.data.tree;
// };

const fetchData = async (kode: string | number) => {
  try {
    const companyRes = await getCompanyByCode(String(kode));
    if (!companyRes) return;

    company.value = {
      kode: companyRes.company,
      namaPendek: companyRes.shortText,
      namaPanjang: companyRes.longText,
      tanggalMulai: companyRes.startDate,
      tanggalBerakhir: companyRes.endDate,
    };

    const res = await getCompanyTree(String(kode));

    // backend sudah kirim tree
    organizationTree.value = mapCompanyTree(res.data.tree);
  } catch (err) {
    console.error("❌ fetchData error:", err);
  }
};

const mapCompanyTree = (nodes: any[], level = 0): any[] => {
  return nodes.map((node) => ({
    id: node.id, // UUID
    organizationCode: node.organization,

    type: level === 0 ? "direktorat" : "unit",
    level,

    shortText: node.shortText,
    longText: node.longText,
    name: node.longText || node.shortText,

    startDate: node.startDate,
    endDate: node.endDate,

    children: node.children ? mapCompanyTree(node.children, level + 1) : [],

    _positionsLoaded: false,
  }));
};

const mapTree = (nodes: any[], level = 0): any[] => {
  return nodes.map((node) => ({
    id: node.id,
    organizationCode: node.organization,
    level,

    type: level === 0 ? "direktorat" : "unit",

    shortText: node.shortText,
    longText: node.longText,
    name: node.longText || node.shortText,

    startDate: node.startDate,
    endDate: node.endDate,

    children: [],
    _childrenLoaded: false,
  }));
};

const mapPositionToNode = (pos: any) => ({
  id: pos.id,
  positionCode: pos.position,
  organizationCode: pos.organization,

  type: "position",

  longText: pos.long_text,
  shortText: pos.short_text,
  bodTag: pos.bod_tag,

  name: pos.long_text || pos.short_text || "-",

  startDate: pos.start_date,
  endDate: pos.end_date,

  children: [],
});

const loadPositions = async (node: any) => {
  if (node._positionsLoaded) return;

  const res = await getPositionsByOrganization(String(node.organizationCode));
  const positions = res.data.map(mapPositionToNode);

  const sortedPositions = sortPositionsByBod(positions);

  node.children = [
    ...sortedPositions,
    ...(node.children || []).filter((c: any) => c.type !== "position"),
  ];

  node._positionsLoaded = true;
};

const mapPersonToNode = (person: any, positionCode: number) => ({
  id: person.id,
  type: "member",
  name: person.name,
  persnum: person.persnum,
  gender: person.gender,

  positionCode,

  startDate: person.start_date,
  endDate: person.end_date,
  children: [],
});

const loadPersons = async (node: any) => {
  if (node._personsLoaded) return;
  if (!node.positionCode) return;

  try {
    const res = await getPersonsByPosition(node.positionCode);

    const persons = res.data.map((p: any) =>
      mapPersonToNode(p, node.positionCode),
    );

    node.children = persons;
    node._personsLoaded = true;
  } catch (err) {
    console.error("❌ gagal load person:", err);
  }
};

watch(
  () => route.params.kode,
  (kode) => {
    if (!kode) return;
    fetchData(kode);
  },
  { immediate: true },
);

watch(
  () => formUnit.value.idsubArea,
  (id) => {
    if (!id) {
      formUnit.value.subarea = "";
      return;
    }

    const selected = subAreaOptions.value.find((s) => s.sub_area === id);

    formUnit.value.subarea = selected?.shortText || selected?.longText || "";
  },
);

watch(
  () => formPosition.value.chief,
  (val) => {
    if (!val) {
      formPosition.value.chiefLevel = "";
    }
  },
);

const organizationTree = ref<any[]>([]);

// Methods
const toggleNode = async (node: any) => {
  const isExpanded = expandedNodes.value[node.id] ?? false;
  expandedNodes.value[node.id] = !isExpanded;

  if (isExpanded) return;

  if (node.type === "unit" && !node._positionsLoaded) {
    await loadPositions(node);
  }

  // member tetap terakhir
  if (node.type === "position") {
    await loadPersons(node);
  }
};

const setHoveredNode = (id: string | null) => {
  hoveredNode.value = id;
};

const openEditModal = (item: any) => {
  editingNode.value = item;

  if (item.type === "unit" || item.type === "direktorat") {
    editType.value = "Unit";

    formUnit.value = {
      namaUnit: item.longText || item.shortText,
      idUnit: item.organizationCode,
      titelatur: item.shortText,
      idsubArea: item.subArea,
      subarea: item.subAreaText,
      deskripsi: "",
      mulai: item.startDate,
      berakhir: item.endDate,
    };
  }

  if (item.type === "position") {
    editType.value = "Posisi";

    formPosition.value = {
      namaPos: item.longText,
      idPos: item.positionCode,
      kodePosisi: item.shortText,

      chief: !!item.bodTag,
      chiefLevel: item.bodTag ?? "",

      mulai: item.startDate,
      berakhir: item.endDate,
    };
  }

  if (item.type === "member") {
    editType.value = "Anggota";

    formMember.value = {
      nama: item.name,
      pn: item.persnum,
    };
  }

  showEditModal.value = true;
};

const hasChildren = (node: any) => {
  return Array.isArray(node.children) && node.children.length > 0;
};

const openDelete = (item: any) => {
  if (hasChildren(item)) {
    alert(
      "Unit ini masih memiliki sub unit / posisi. Hapus atau pindahkan child terlebih dahulu.",
    );
    return;
  }

  itemToDelete.value = item;
  confirmDeleteOpen.value = true;
};

const removeNodeById = (nodes: any[], id: string): boolean => {
  const index = nodes.findIndex((n) => n.id === id);
  if (index !== -1) {
    nodes.splice(index, 1);
    return true;
  }

  for (const node of nodes) {
    if (node.children?.length) {
      const removed = removeNodeById(node.children, id);
      if (removed) return true;
    }
  }

  return false;
};

const deleteNow = async () => {
  if (!itemToDelete.value) return;

  try {
    const item = itemToDelete.value;

    if (hasChildren(item)) {
      alert("Tidak bisa menghapus data yang masih memiliki child.");
      return;
    }

    if (item.type === "member") {
      await deletePerson(item.id);

      removeNodeById(organizationTree.value, item.id);
      showSuccessToast("Berhasil menghapus anggota");
    } else if (item.type === "position") {
      await deletePosition(item.id);
      removeNodeById(organizationTree.value, item.id);
      showSuccessToast("Berhasil menghapus posisi");
    } else {
      await deleteOrganization(item.id);
      await fetchData(route.params.kode as string);
      showSuccessToast("Berhasil menghapus unit");
    }

    confirmDeleteOpen.value = false;
  } catch (error) {
    console.error("❌ Error deleting item:", error);
  } finally {
    itemToDelete.value = null;
  }
};

const subAreaOptions = ref<any[]>([]);
const loadingSubArea = ref(false);
const openAddUnitModal = async (parent: any, type: string) => {
  selectedParentNode.value = parent;
  showAddUnitModal.value = true;

  if (!company.value?.kode) return;

  const res = await getSubAreasByCompany(String(company.value.kode));
  subAreaOptions.value = res.data || [];
};

const openAddPositionModal = (parent: any) => {
  selectedParentNode.value = parent;
  showAddPositionModal.value = true;
};

const openAddMemberModal = (parent: any) => {
  selectedParentNode.value = parent;
  showAddMemberModal.value = true;
};

const selectedParentNode = ref<any>(null);
const handleSaveUnit = async () => {
  try {
    if (!company.value?.kode) return;

    const payload = {
      company: Number(company.value.kode),
      organization: Number(formUnit.value.idUnit),
      shortText: formUnit.value.titelatur,
      longText: formUnit.value.namaUnit,
      abbreviation: formUnit.value.namaUnit,
      subArea: Number(formUnit.value.idsubArea),
      subAreaText: formUnit.value.subarea,
      parentOrganization: selectedParentNode.value?.organizationCode ?? null,
      startDate: formUnit.value.mulai,
      endDate: formUnit.value.berakhir,
    };

    await createOrganization(payload);
    await fetchData(route.params.kode as string);
    showSuccessToast("Berhasil menambahkan unit");

    showAddUnitModal.value = false;

    // reset form
    formUnit.value = {
      namaUnit: "",
      idUnit: "",
      titelatur: "",
      idsubArea: "",
      subarea: "",
      deskripsi: "",
      mulai: "",
      berakhir: "",
    };
  } catch (err) {
    console.error("❌ gagal create organization:", err);
  }
};

const chiefOptions = [
  { label: "BOD", value: "BOD" },
  { label: "BOD-1", value: "BOD-1" },
  { label: "BOD-2", value: "BOD-2" },
  { label: "BOD-3", value: "BOD-3" },
];

const handleSavePosition = async () => {
  try {
    if (!company.value?.kode || !selectedParentNode.value) return;

    const payload = {
      company: Number(company.value.kode),
      position: Number(formPosition.value.idPos),
      shortText: formPosition.value.titelatur,
      longText: formPosition.value.namaPos,
      abbreviation: formPosition.value.namaPos,
      organization: Number(selectedParentNode.value.organizationCode),

      bodTag: formPosition.value.chief ? formPosition.value.chiefLevel : null,

      startDate: formPosition.value.mulai,
      endDate: formPosition.value.berakhir,
    };

    await createPosition(payload);
    selectedParentNode.value._positionsLoaded = false;
    await loadPositions(selectedParentNode.value);

    showSuccessToast("Berhasil menambahkan posisi");

    showAddPositionModal.value = false;

    // reset form
    formPosition.value = {
      namaPos: "",
      idPos: "",
      titelatur: "",
      idArea: "",
      area: "",
      chief: false,
      chiefLevel: "",
      deskripsi: "",
      mulai: "",
      berakhir: "",
    };
  } catch (err) {
    console.error("❌ gagal create position:", err);
  }
};

const handleSaveMember = async () => {
  try {
    if (!company.value?.kode || !selectedParentNode.value) return;

    const payload = {
      persnum: Number(formMember.value.pn),
      name: formMember.value.nama,
      gender: "L",
      company: Number(company.value.kode),
      position: Number(selectedParentNode.value.positionCode),
      startDate: "2025-01-01",
      endDate: "9999-12-31",
    };

    await createPerson(payload);
    selectedParentNode.value._personsLoaded = false;
    await loadPersons(selectedParentNode.value);

    showSuccessToast("Berhasil menambahkan anggota");

    showAddMemberModal.value = false;

    // reset form
    formMember.value = {
      nama: "",
      pn: "",
    };
  } catch (err) {
    console.error("❌ gagal create person:", err);
  }
};

const toDateOnly = (val?: string) => {
  if (!val) return null;
  return val.split("T")[0];
};

const handleSaveEdit = async () => {
  if (!editingNode.value) return;

  try {
    if (editType.value === "Unit") {
      const payload = {
        shortText: formUnit.value.titelatur,
        longText: formUnit.value.namaUnit,
        abbreviation: formUnit.value.namaUnit,
        subArea: Number(formUnit.value.idsubArea),
        subAreaText: formUnit.value.subarea,
        startDate: formUnit.value.mulai,
        endDate: formUnit.value.berakhir,
      };

      await updateOrganization(editingNode.value.id, payload);
      showSuccessToast("Berhasil mengubah unit");
    }

    if (editType.value === "Posisi") {
      const payload = {
        longText: formPosition.value.namaPos,
        abbreviation: formPosition.value.namaPos,

        bodTag: formPosition.value.chief ? formPosition.value.chiefLevel : null,

        startDate: toDateOnly(formPosition.value.mulai),
        endDate: toDateOnly(formPosition.value.berakhir),
      };

      await updatePosition(editingNode.value.id, payload);
      showSuccessToast("Berhasil mengubah posisi");

      editingNode.value.longText = formPosition.value.namaPos;
      editingNode.value.name = formPosition.value.namaPos;
      editingNode.value.bodTag = formPosition.value.chief
        ? formPosition.value.chiefLevel
        : null;
      editingNode.value.startDate = formPosition.value.mulai;
      editingNode.value.endDate = formPosition.value.berakhir;
    }

    if (editType.value === "Anggota") {
      const payload = {
        persnum: Number(formMember.value.pn),
        name: formMember.value.nama,
        gender: editingNode.value.gender ?? "L",
        company: Number(company.value.kode),

        position: Number(editingNode.value.positionCode),

        startDate: toDateOnly(editingNode.value.startDate),
        endDate: toDateOnly(editingNode.value.endDate),
      };

      await updatePerson(editingNode.value.id, payload);
      showSuccessToast("Berhasil mengubah anggota");

      editingNode.value.name = formMember.value.nama;
      editingNode.value.persnum = formMember.value.pn;
    }

    showEditModal.value = false;
    editingNode.value = null;

    await fetchData(route.params.kode as string);
  } catch (err) {
    console.error("❌ gagal update:", err);
  }
};

const bodOrder: Record<string, number> = {
  BOD: 1,
  "BOD-1": 2,
  "BOD-2": 3,
  "BOD-3": 4,
};

const sortPositionsByBod = (positions: any[]) => {
  return [...positions].sort((a, b) => {
    const aOrder = bodOrder[a.bodTag ?? ""] ?? 99;
    const bOrder = bodOrder[b.bodTag ?? ""] ?? 99;

    return aOrder - bOrder;
  });
};
</script>
