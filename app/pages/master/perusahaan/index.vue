<template>
  <div class="min-h-screen dark:bg-gray-900 transition-colors pt-5">
    <div class="max-w-7xl mx-auto">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-3"
      >
        <div>
          <Heading variant="heading6b" class="text-mobile-md dark:text-white"
            >Master Perusahaan</Heading
          >
          <PageHeader :items="breadcrumbs" />
        </div>
        <button
          @click="openAddCompany = true"
          class="flex items-center gap-2 bg-primary hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm transition-all shadow-sm"
        >
          <Plus class="w-4 h-4" />
          Tambah
        </button>
      </div>
      <!-- Card -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors"
      >
        <!-- Search -->
        <div class="p-5 border-b w-full border-gray-100 dark:border-gray-700">
          <div class="relative flex-1 w-full md:w-255">
            <Search
              class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="search"
              placeholder="Cari perusahaan"
              class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-12 pr-4 py-2 text-sm dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-primary dark:bg-primary-700 text-white">
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
                  'border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors',
                  idx % 2 === 0
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-gray-50/50 dark:bg-gray-800',
                ]"
              >
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {{ row.tanggalMulai }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {{ row.tanggalBerakhir }}
                </td>
                <td class="px-6 py-4 items-center">
                  <NuxtLink
                    :to="`/master/perusahaan/${row.kode}/struktur`"
                    class="flex px-3 py-1 rounded-lg bg-blue-100 dark:bg-primary hover:dark:bg-primary-600 hover:bg-primary-700 hover:text-white text-blue-700 dark:text-white transition-colors w-fit"
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
                <td
                  class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white"
                >
                  {{ row.namaPendek }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {{ row.namaPanjang }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      @click="openEditModal(row)"
                      class="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors group"
                    >
                      <Pencil
                        class="w-4 h-4 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600"
                      />
                    </button>
                    <button
                      @click="openDeleteConfirm(row)"
                      class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                    >
                      <Trash2
                        class="w-4 h-4 text-red-600 dark:text-red-500 group-hover:text-red-600"
                      />
                    </button>
                    <NuxtLink
                      :to="`/master/perusahaan/${row.kode}/area`"
                      class="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors group"
                    >
                      <MapPin
                        class="w-4 h-4 text-green-600 dark:text-green-500 group-hover:text-green-600"
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
          <div class="p-3 ml-2">
            <h3 class="text-xl font-bold dark:text-white">Tambah Perusahaan</h3>
          </div>
        </template>

        <div class="space-y-4 p-1">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                Tanggal Mulai <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="formCompany.tanggalMulai"
                type="date"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                Tanggal Berakhir <span class="text-red-500">*</span>
              </Heading>

              <input
                v-model="formCompany.tanggalBerakhir"
                type="date"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              Kode Perusahaan <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formCompany.kode"
              type="text"
              placeholder="Contoh: 10000"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              Nama Pendek <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formCompany.namaPendek"
              type="text"
              placeholder="Contoh: TELKOM"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              Nama Panjang <span class="text-red-500">*</span>
            </Heading>
            <textarea
              v-model="formCompany.namaPanjang"
              rows="3"
              placeholder="Contoh: PT Telekomunikasi Indonesia (Persero) Tbk"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
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
            <h3 class="text-lg font-bold p-3 dark:text-white">
              Edit Perusahaan
            </h3>
          </div>
        </template>

        <div class="space-y-4 p-1">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                Tanggal Mulai <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="editForm.tanggalMulai"
                type="date"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                Tanggal Berakhir <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="editForm.tanggalBerakhir"
                type="date"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              Kode <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="editForm.kode"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              Nama Pendek <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="editForm.namaPendek"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              Nama Panjang <span class="text-red-500">*</span>
            </Heading>
            <textarea
              v-model="editForm.namaPanjang"
              rows="3"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            ></textarea>
          </div>
        </div>
      </Modal>
    </Teleport>
    <!-- Delete Confirm Modal -->
    <ConfirmPopup
      v-model="showDeleteConfirm"
      type="danger"
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
import { ref, computed, onMounted } from "vue";
import {
  Search,
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Building2,
} from "lucide-vue-next";
import { useCompany } from "~/composables/useCompany";
definePageMeta({
  middleware: "auth",
});

const { getCompanies, createCompany, updateCompany, deleteCompany } =
  useCompany();

import { useToast } from "#imports";

const toast = useToast();

const search = ref("");
const openAddCompany = ref(false);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);
const selectedRow = ref<any>(null);
const isDeleting = ref(false);
const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Perusahaan", to: "/master/perusahaan" },
];

const formCompany = ref({
  tanggalMulai: "",
  tanggalBerakhir: "",
  kode: "",
  namaPendek: "",
  namaPanjang: "",
});

//get
const rows = ref<any[]>([]);

const fetchCompanies = async () => {
  try {
    const res = await getCompanies();

    rows.value = res.data.map((item) => ({
      id: item.id,
      tanggalMulai: item.startDate,
      tanggalBerakhir: item.endDate,
      kode: String(item.company),
      namaPendek: item.shortText,
      namaPanjang: item.longText,
    }));
  } catch (error) {
    console.error("Gagal mengambil data company", error);
  }
};

onMounted(fetchCompanies);

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

// post
const handleSaveCompany = async () => {
  try {
    await createCompany({
      company: Number(formCompany.value.kode),
      shortText: formCompany.value.namaPendek,
      longText: formCompany.value.namaPanjang,
      startDate: formCompany.value.tanggalMulai,
      endDate: formCompany.value.tanggalBerakhir,
    });

    await fetchCompanies();

    toast.add({
      title: "Berhasil",
      description: "Perusahaan berhasil ditambahkan",
      color: "success",
      icon: "i-lucide-check-circle",
    });

    openAddCompany.value = false;

    formCompany.value = {
      tanggalMulai: "",
      tanggalBerakhir: "",
      kode: "",
      namaPendek: "",
      namaPanjang: "",
    };
  } catch (error) {
    toast.add({
      title: "Gagal",
      description: "Gagal menambahkan perusahaan",
      color: "error",
      icon: "i-lucide-x-circle",
    });
    console.error(error);
  }
};

//put
const editForm = ref({
  id: "",
  tanggalMulai: "",
  tanggalBerakhir: "",
  kode: "",
  namaPendek: "",
  namaPanjang: "",
});

const openEditModal = (row: any) => {
  selectedRow.value = row;

  editForm.value = {
    id: row.id,
    tanggalMulai: row.tanggalMulai,
    tanggalBerakhir: row.tanggalBerakhir,
    kode: row.kode,
    namaPendek: row.namaPendek,
    namaPanjang: row.namaPanjang,
  };

  showEditModal.value = true;
};

const handleSaveEdit = async () => {
  try {
    await updateCompany(editForm.value.id, {
      company: Number(editForm.value.kode),
      shortText: editForm.value.namaPendek,
      longText: editForm.value.namaPanjang,
      startDate: editForm.value.tanggalMulai,
      endDate: editForm.value.tanggalBerakhir,
    });

    await fetchCompanies();

    toast.add({
      title: "Berhasil",
      description: "Perusahaan berhasil diperbarui",
      color: "success",
      icon: "i-lucide-check-circle",
    });

    showEditModal.value = false;
  } catch (error) {
    toast.add({
      title: "Gagal",
      description: "Gagal memperbarui perusahaan",
      color: "error",
      icon: "i-lucide-x-circle",
    });
    console.error(error);
  }
};

//delete
const openDeleteConfirm = (row: any) => {
  selectedRow.value = row;
  showDeleteConfirm.value = true;
};

const handleDelete = async () => {
  if (!selectedRow.value?.id) return;

  try {
    isDeleting.value = true;

    await deleteCompany(selectedRow.value.id);
    await fetchCompanies();

    toast.add({
      title: "Berhasil",
      description: `Perusahaan ${selectedRow.value.namaPendek} berhasil dihapus`,
      color: "success",
      icon: "i-lucide-trash-2",
    });

    showDeleteConfirm.value = false;
    selectedRow.value = null;
  } catch (error) {
    toast.add({
      title: "Gagal",
      description: "Gagal menghapus perusahaan",
      color: "error",
      icon: "i-lucide-x-circle",
    });
    console.error(error);
  } finally {
    isDeleting.value = false;
  }
};
</script>

<style scoped>
* {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}
</style>
