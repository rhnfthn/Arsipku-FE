<template>
  <div class="min-h-screen">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Kelola Area</h1>

          <div class="mb-5">
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
              <NuxtLink
                to="/master/perusahaan/${route.params.kode}/struktur"
                class="text-gray-500 font-medium hover:text-primary transition-colors text-xs transition-colors"
              >
                Struktur Organisasi
              </NuxtLink>
              <span class="mx-1.5 text-gray-400 dark:text-gray-600 text-xs"
                >/</span
              >
              <span class="text-primary-400 font-semibold text-xs"
                >Kelola Area</span
              >
            </nav>
          </div>
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
        <button
          @click="openAddAreaModal"
          class="flex items-center gap-2 bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg"
        >
          <Plus class="w-4 h-4" />
          Tambah {{ activeTab === "area" ? "Area" : "Sub Area" }}
        </button>
      </div>

      <!-- Card -->
      <div
        class="bg-white rounded-2xl mt-5 shadow-lg border border-gray-100 overflow-hidden"
      >
        <!-- Tab & Actions -->
        <div
          class="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white"
        >
          <div class="flex items-center justify-between gap-4">
            <!-- Tabs -->
            <div class="flex bg-gray-100 rounded-xl p-1.5 gap-2">
              <button
                @click="activeTab = 'area'"
                :class="[
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'area'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900',
                ]"
              >
                <MapPin class="w-4 h-4" />
                Area
              </button>
              <button
                @click="activeTab = 'subArea'"
                :class="[
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
                  activeTab === 'subArea'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900',
                ]"
              >
                <Map class="w-4 h-4" />
                Sub Area
              </button>
            </div>

            <!-- Search -->
            <div class="relative flex-1 w-full">
              <Search
                class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                v-model="searchQuery"
                placeholder="Cari..."
                class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <!-- AREA TABLE -->
        <div v-if="activeTab === 'area'" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-primary text-white">
                <th class="px-6 py-4 text-left text-sm font-semibold w-12"></th>
                <th class="px-6 py-4 text-left text-sm font-semibold">Kode</th>
                <th class="px-6 py-4 text-left text-sm font-semibold">Nama</th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  Alamat
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  Tanggal Mulai
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  Tanggal Berakhir
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  Sub Areas
                </th>
                <th class="px-6 py-4 text-center text-sm font-semibold">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(area, idx) in filteredAreas" :key="area.kode">
                <tr
                  :class="[
                    'border-b border-gray-100 hover:bg-blue-50 transition-colors',
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                  ]"
                >
                  <td class="px-6 py-4">
                    <button
                      @click="toggleAreaExpand(area.kode)"
                      class="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <ChevronDown
                        v-if="expandedAreas[area.kode]"
                        class="w-5 h-5 text-blue-600"
                      />
                      <ChevronRight v-else class="w-5 h-5 text-gray-400" />
                    </button>
                  </td>
                  <td class="px-1 py-3">
                    <span
                      class="flex text-nowrap items-center text-sm font-semibold"
                    >
                      {{ area.kode }}
                    </span>
                  </td>
                  <td
                    class="px-6 py-4 text-nowrap text-sm font-medium text-gray-900"
                  >
                    {{ area.nama }}
                  </td>
                  <td class="px-6 py-4 text-nowrap text-sm text-gray-700">
                    {{ area.alamat }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {{ area.mulai }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {{ area.berakhir }}
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="flex text-nowrap items-center text-xs font-medium"
                    >
                      {{ area.subCount }} sub areas
                    </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        @click="openEditModal(area)"
                        class="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                      >
                        <Pencil
                          class="w-4 h-4 text-gray-400 group-hover:text-blue-600"
                        />
                      </button>
                      <button
                        @click="openDeleteConfirm(area)"
                        class="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                      >
                        <Trash2
                          class="w-4 h-4 text-gray-400 group-hover:text-red-600"
                        />
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Expanded Sub Areas -->
                <tr v-if="expandedAreas[area.kode]">
                  <td
                    colspan="8"
                    class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50"
                  >
                    <div class="ml-12">
                      <div class="flex items-center gap-2 mb-3">
                        <Map class="w-4 h-4 text-blue-600" />
                        <h4 class="text-sm font-bold text-gray-900">
                          Sub Areas ({{ getSubAreasForArea(area.kode).length }})
                        </h4>
                      </div>
                      <div class="space-y-2">
                        <div
                          v-for="sub in getSubAreasForArea(area.kode)"
                          :key="sub.kode"
                          class="bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div class="grid grid-cols-5 gap-4 items-center">
                            <div>
                              <span class="text-xs text-gray-500 block mb-1"
                                >Kode</span
                              >
                              <span
                                class="inline-flex items-center px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-semibold"
                              >
                                {{ sub.kode }}
                              </span>
                            </div>
                            <div>
                              <span class="text-xs text-gray-500 block mb-1"
                                >Nama</span
                              >
                              <span
                                class="text-sm font-semibold text-gray-900"
                                >{{ sub.nama }}</span
                              >
                            </div>
                            <div>
                              <span class="text-xs text-gray-500 block mb-1"
                                >Alamat</span
                              >
                              <span class="text-sm text-gray-700">{{
                                sub.alamat
                              }}</span>
                            </div>
                            <div>
                              <span class="text-xs text-gray-500 block mb-1"
                                >Tanggal Mulai</span
                              >
                              <span class="text-sm text-gray-700">{{
                                sub.mulai
                              }}</span>
                            </div>
                            <div>
                              <span class="text-xs text-gray-500 block mb-1"
                                >Tanggal Berakhir</span
                              >
                              <span class="text-sm text-gray-700">{{
                                sub.berakhir
                              }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- SUB AREA TABLE -->
        <div v-if="activeTab === 'subArea'" class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-primary text-white">
                <th class="px-6 py-4 text-left text-sm font-semibold">Kode</th>
                <th class="px-6 py-4 text-left text-sm font-semibold">Nama</th>
                <th class="px-6 py-4 text-left text-sm font-semibold">Area</th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  Alamat
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  Tanggal Mulai
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  Tanggal Berakhir
                </th>
                <th class="px-6 py-4 text-center text-sm font-semibold">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(sub, idx) in filteredSubAreas"
                :key="sub.kode"
                :class="[
                  'border-b border-gray-100 hover:bg-blue-50 transition-colors',
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                ]"
              >
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center text-sm font-semibold"
                    >{{ sub.kode }}</span
                  >
                </td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  {{ sub.nama }}
                </td>
                <td class="px-6 py-4">
                  <span
                    class="flex text-nowrap items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold"
                  >
                    {{ sub.areaName }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-center text-gray-700">
                  {{ sub.alamat }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-700">{{ sub.mulai }}</td>
                <td class="px-6 py-4 text-sm text-gray-700">
                  {{ sub.berakhir }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="openEditModal(sub)"
                      class="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                    >
                      <Pencil
                        class="w-4 h-4 text-gray-400 group-hover:text-blue-600"
                      />
                    </button>
                    <button
                      @click="openDeleteConfirm(sub)"
                      class="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                    >
                      <Trash2
                        class="w-4 h-4 text-gray-400 group-hover:text-red-600"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add/Edit Area Modal -->
    <Teleport to="body">
      <Modal v-model="openAddArea" size="xl" @save="submitArea">
        <template #title>
          <div class="p-3">
            <h3 class="text-xl font-bold">
              {{ isEditing ? "Edit" : "Tambah" }}
              {{ activeTab === "area" ? "Area" : "Sub Area" }}
            </h3>
            <p class="text-sm mt-1 text-gray-600">
              Lengkapi formulir untuk
              {{ isEditing ? "mengubah" : "menambahkan" }}
              {{ activeTab === "area" ? "area" : "sub area" }}
            </p>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Nama {{ activeTab === "area" ? "Area" : "Sub Area" }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formArea.nama"
              type="text"
              placeholder="Contoh: KANTOR PUSAT"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Kode {{ activeTab === "area" ? "Area" : "Sub Area" }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formArea.kode"
              type="text"
              placeholder="Contoh: AREA-001"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div v-if="activeTab === 'subArea'">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Area <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formArea.area"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Area</option>
              <option v-for="area in areas" :key="area.kode" :value="area.kode">
                {{ area.nama }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2"
              >Alamat Lengkap</label
            >
            <textarea
              v-model="formArea.alamat"
              rows="3"
              placeholder="Masukkan alamat lengkap..."
              class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Tanggal Mulai <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formArea.mulai"
                type="date"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Tanggal Berakhir <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formArea.berakhir"
                type="date"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Delete Confirm Modal -->
    <ConfirmPopup
      v-model="showDeleteConfirm"
      type="danger"
      title="Hapus Data"
      :message="`Apakah Anda yakin ingin menghapus ${selectedItem?.nama}?`"
      confirm-text="Hapus"
      cancel-text="Batal"
      :is-loading="isDeleting"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  ChevronLeft,
  Building2,
  ChevronDown,
  ChevronRight,
  Plus,
  MapPin,
  Map,
  Search,
  Pencil,
  Trash2,
} from "lucide-vue-next";

const route = useRoute();

const activeTab = ref<"area" | "subArea">("area");
const searchQuery = ref("");
const expandedAreas = ref<Record<string, boolean>>({});
const openAddArea = ref(false);
const showDeleteConfirm = ref(false);
const selectedItem = ref<any>(null);
const isDeleting = ref(false);
const isEditing = ref(false);

const formArea = ref({
  nama: "",
  kode: "",
  area: "",
  alamat: "",
  mulai: "",
  berakhir: "",
});

const company = ref({
  kode: route.params.kode,
  namaPanjang: "Perum LPPNPI",
});

const areas = ref([
  {
    kode: "AREA-001",
    nama: "KANTOR PUSAT",
    alamat: "Kantor Pusat Jakarta",
    mulai: "01/01/2020",
    berakhir: "31/12/2030",
    subCount: 4,
  },
  {
    kode: "AREA-002",
    nama: "CABANG BATISE",
    alamat: "Cabang Batam",
    mulai: "01/01/2021",
    berakhir: "31/12/2030",
    subCount: 1,
  },
]);

const subAreas = ref([
  {
    kode: "SUB-001",
    nama: "KANTOR PUSAT",
    area: "AREA-001",
    areaName: "KANTOR PUSAT",
    alamat: "-",
    mulai: "01/01/2020",
    berakhir: "31/12/2030",
  },
  {
    kode: "SUB-002",
    nama: "CABANG JATSC",
    area: "AREA-001",
    areaName: "KANTOR PUSAT",
    alamat: "-",
    mulai: "01/01/2020",
    berakhir: "31/12/2030",
  },
  {
    kode: "SUB-003",
    nama: "CABANG MASSC",
    area: "AREA-001",
    areaName: "KANTOR PUSAT",
    alamat: "-",
    mulai: "01/01/2020",
    berakhir: "31/12/2030",
  },
  {
    kode: "SUB-004",
    nama: "CABANG MALUM",
    area: "AREA-001",
    areaName: "KANTOR PUSAT",
    alamat: "-",
    mulai: "01/01/2021",
    berakhir: "31/12/2030",
  },
  {
    kode: "SUB-005",
    nama: "CABANG PENGATU CVENT",
    area: "AREA-002",
    areaName: "CABANG BATISE",
    alamat: "-",
    mulai: "01/01/2021",
    berakhir: "31/12/2030",
  },
]);

const filteredAreas = computed(() => {
  if (!searchQuery.value) return areas.value;
  const query = searchQuery.value.toLowerCase();
  return areas.value.filter(
    (area) =>
      area.kode.toLowerCase().includes(query) ||
      area.nama.toLowerCase().includes(query) ||
      area.alamat.toLowerCase().includes(query),
  );
});

const filteredSubAreas = computed(() => {
  if (!searchQuery.value) return subAreas.value;
  const query = searchQuery.value.toLowerCase();
  return subAreas.value.filter(
    (sub) =>
      sub.kode.toLowerCase().includes(query) ||
      sub.nama.toLowerCase().includes(query) ||
      sub.areaName.toLowerCase().includes(query) ||
      sub.alamat.toLowerCase().includes(query),
  );
});

const toggleAreaExpand = (kode: string) => {
  expandedAreas.value[kode] = !expandedAreas.value[kode];
};

const getSubAreasForArea = (areaKode: string) => {
  return subAreas.value.filter((sub) => sub.area === areaKode);
};

const openAddAreaModal = () => {
  isEditing.value = false;
  formArea.value = {
    nama: "",
    kode: "",
    area: "",
    alamat: "",
    mulai: "",
    berakhir: "",
  };
  openAddArea.value = true;
};

const openEditModal = (item: any) => {
  isEditing.value = true;
  selectedItem.value = item;
  formArea.value = { ...item };
  openAddArea.value = true;
};

const openDeleteConfirm = (item: any) => {
  selectedItem.value = item;
  showDeleteConfirm.value = true;
};

const submitArea = () => {
  console.log("SUBMIT:", { type: activeTab.value, ...formArea.value });

  if (isEditing.value) {
    if (activeTab.value === "area") {
      const index = areas.value.findIndex(
        (a) => a.kode === selectedItem.value.kode,
      );
      if (index !== -1) {
        areas.value[index] = {
          ...formArea.value,
          subCount: areas.value[index].subCount,
        };
      }
    } else {
      const index = subAreas.value.findIndex(
        (s) => s.kode === selectedItem.value.kode,
      );
      if (index !== -1) {
        const areaName =
          areas.value.find((a) => a.kode === formArea.value.area)?.nama || "";
        subAreas.value[index] = { ...formArea.value, areaName };
      }
    }
  } else {
    if (activeTab.value === "area") {
      areas.value.push({ ...formArea.value, subCount: 0 });
    } else {
      const areaName =
        areas.value.find((a) => a.kode === formArea.value.area)?.nama || "";
      subAreas.value.push({ ...formArea.value, areaName });
    }
  }

  openAddArea.value = false;
  formArea.value = {
    nama: "",
    kode: "",
    area: "",
    alamat: "",
    mulai: "",
    berakhir: "",
  };
};

const handleDelete = async () => {
  try {
    isDeleting.value = true;
    console.log("DELETE:", selectedItem.value);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (selectedItem.value.kode.startsWith("AREA")) {
      const index = areas.value.findIndex(
        (a) => a.kode === selectedItem.value.kode,
      );
      if (index !== -1) {
        areas.value.splice(index, 1);
      }
    } else {
      const index = subAreas.value.findIndex(
        (s) => s.kode === selectedItem.value.kode,
      );
      if (index !== -1) {
        subAreas.value.splice(index, 1);
      }
    }

    showDeleteConfirm.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    isDeleting.value = false;
  }
};
</script>
