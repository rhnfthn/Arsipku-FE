<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <!-- <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Master Perusahaan</h2>
        </div>
        <PageHeader :items="breadcrumbs" />
        <button
          @click="openAddCompany = true"
          class="flex items-center gap-2 bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg"
        >
          <Plus class="w-4 h-4" />
          Tambah Perusahaan
        </button>
      </div> -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6"
      >
        <div>
          <Heading variant="heading6b" class="text-mobile-md"
            >Master Perusahaan</Heading
          >
          <PageHeader :items="breadcrumbs" />
        </div>
        <button
          @click="openAddCompany = true"
          class="flex items-center gap-2 bg-primary hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all shadow-lg"
        >
          <Plus class="w-4 h-4" />
          Tambah Perusahaan
        </button>
      </div>
      <!-- Card -->
      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <!-- Search -->
        <div
          class="p-6 border-b w-full border-gray-100 bg-gradient-to-r from-gray-50 to-white"
        >
          <div class="relative max-w-md w-full">
            <Search
              class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              v-model="search"
              placeholder="Cari perusahaan..."
              class="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-primary text-white">
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  Tanggal Mulai
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  Tanggal Berakhir
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">Kode</th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  Nama Pendek
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  Nama Panjang
                </th>
                <th class="px-6 py-4 text-center text-sm font-semibold">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in filteredRows"
                :key="row.kode"
                :class="[
                  'border-b border-gray-100 hover:bg-blue-50 transition-colors',
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                ]"
              >
                <td class="px-6 py-4 text-sm text-gray-700">
                  {{ row.tanggalMulai }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-700">
                  {{ row.tanggalBerakhir }}
                </td>
                <td class="px-6 py-4 items-center">
                  <NuxtLink
                    :to="`/master/company/${row.kode}/struktur`"
                    class="flex px-3 py-1 rounded-lg bg-blue-100 hover:bg-primary hover:text-white text-blue-700 transition-colors w-fit"
                  >
                    <div class="flex p-2 rounded-lg transition-colors">
                      <Building2 class="w-5 h-5" />
                    </div>
                    <div
                      class="flex items-center text-sm font-semibold transition-colors"
                    >
                      {{ row.kode }}
                    </div>
                  </NuxtLink>
                </td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  {{ row.namaPendek }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-700">
                  {{ row.namaPanjang }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="openEditModal(row)"
                      class="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                    >
                      <Pencil
                        class="w-4 h-4 text-gray-400 group-hover:text-blue-600"
                      />
                    </button>
                    <button
                      @click="openDeleteConfirm(row)"
                      class="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                    >
                      <Trash2
                        class="w-4 h-4 text-gray-400 group-hover:text-red-600"
                      />
                    </button>
                    <NuxtLink
                      :to="`/master/company/${row.kode}/area`"
                      class="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                    >
                      <MapPin
                        class="w-4 h-4 text-gray-400 group-hover:text-green-600"
                      />
                    </NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add Company Modal -->
    <Teleport to="body">
      <Modal v-model="openAddCompany" size="xl" @save="handleSaveCompany">
        <template #title>
          <div class="p-3">
            <h3 class="text-xl font-bold">Tambah Perusahaan</h3>
            <p class="text-sm mt-1 text-gray-600">
              Lengkapi formulir untuk menambahkan perusahaan baru
            </p>
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Tanggal Mulai <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formCompany.tanggalMulai"
                type="date"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Tanggal Berakhir <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formCompany.tanggalBerakhir"
                type="date"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Kode Perusahaan <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formCompany.kode"
              type="text"
              placeholder="Contoh: 10000"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Nama Pendek <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formCompany.namaPendek"
              type="text"
              placeholder="Contoh: TELKOM"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              Nama Panjang <span class="text-red-500">*</span>
            </label>
            <textarea
              v-model="formCompany.namaPanjang"
              rows="3"
              placeholder="Contoh: PT Telekomunikasi Indonesia (Persero) Tbk"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>
      </Modal>
    </Teleport>
    <!-- Edit Modal -->
    <Teleport to="body">
      <Modal v-model="showEditModal" size="xl" @save="handleSaveEdit">
        <template #title>
          <div>
            <h3 class="text-lg font-bold p-3">Edit Perusahaan</h3>
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Tanggal Mulai</label
              >
              <input
                v-model="editForm.tanggalMulai"
                type="date"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Tanggal Berakhir</label
              >
              <input
                v-model="editForm.tanggalBerakhir"
                type="date"
                class="w-full px-3 py-2 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label class="text-sm font-semibold">Kode</label>
            <input
              v-model="editForm.kode"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label class="text-sm font-semibold">Nama Pendek</label>
            <input
              v-model="editForm.namaPendek"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>

          <div>
            <label class="text-sm font-semibold">Nama Panjang</label>
            <textarea
              v-model="editForm.namaPanjang"
              rows="3"
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg"
            ></textarea>
          </div>
        </div>
      </Modal>
    </Teleport>
    <!-- Delete Confirm Modal -->
    <ConfirmPopup
      v-model="showDeleteConfirm"
      title="Hapus Perusahaan"
      :message="`Apakah Anda yakin ingin menghapus perusahaan ${selectedRow?.namaPendek}?`"
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
  Search,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Building2,
} from "lucide-vue-next";

const search = ref("");
const openAddCompany = ref(false);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);
const selectedRow = ref<any>(null);
const isDeleting = ref(false);
const breadcrumbs = [
  { label: "beranda", to: "/beranda" },
  { label: "Penandatanganan", to: "/beranda/digsig/penandatanganan" },
];

const formCompany = ref({
  tanggalMulai: "",
  tanggalBerakhir: "",
  kode: "",
  namaPendek: "",
  namaPanjang: "",
});

const editForm = ref({
  tanggalMulai: "",
  tanggalBerakhir: "",
  kode: "",
  namaPendek: "",
  namaPanjang: "",
});

const rows = ref([
  {
    tanggalMulai: "01/01/2023",
    tanggalBerakhir: "31/12/2025",
    kode: "10000",
    namaPendek: "AIRNAV",
    namaPanjang: "Perum LPPNPI",
  },
  {
    tanggalMulai: "15/03/2023",
    tanggalBerakhir: "14/03/2026",
    kode: "1001",
    namaPendek: "test",
    namaPanjang: "test123",
  },
]);

const filteredRows = computed(() => {
  if (!search.value) return rows.value;
  const searchLower = search.value.toLowerCase();
  return rows.value.filter(
    (row) =>
      row.kode.toLowerCase().includes(searchLower) ||
      row.namaPendek.toLowerCase().includes(searchLower) ||
      row.namaPanjang.toLowerCase().includes(searchLower),
  );
});

const openEditModal = (row: any) => {
  selectedRow.value = row;
  editForm.value = { ...row };
  showEditModal.value = true;
};

const openDeleteConfirm = (row: any) => {
  selectedRow.value = row;
  showDeleteConfirm.value = true;
};

const handleSaveCompany = () => {
  console.log("SAVE COMPANY:", formCompany.value);
  rows.value.push({ ...formCompany.value });
  openAddCompany.value = false;
  formCompany.value = {
    tanggalMulai: "",
    tanggalBerakhir: "",
    kode: "",
    namaPendek: "",
    namaPanjang: "",
  };
};

const handleSaveEdit = () => {
  console.log("SAVE EDIT:", editForm.value);
  const index = rows.value.findIndex((r) => r.kode === selectedRow.value.kode);
  if (index !== -1) {
    rows.value[index] = { ...editForm.value };
  }
  showEditModal.value = false;
};

const handleDelete = async () => {
  try {
    isDeleting.value = true;
    console.log("DELETE:", selectedRow.value);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const index = rows.value.findIndex(
      (r) => r.kode === selectedRow.value.kode,
    );
    if (index !== -1) {
      rows.value.splice(index, 1);
    }
    showDeleteConfirm.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    isDeleting.value = false;
  }
};
</script>
