<template>
  <div class="">
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <!-- Left Section - Title & Breadcrumb -->
      <PageHeader title="Tertuju Eksternal" :items="items" />
      <button
        @click="showModal = true"
        class="flex items-center gap-2 bg-primary text-white space-y-6 h-8 px-6 rounded-lg hover:bg-primary-800 text-xs"
      >
        <Plus class="w-4 h-4" />
        Tambah
      </button>
    </div>

    <div
      class="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white mt-5"
    >
      <div class="flex flex-wrap gap-4 items-center p-3">
        <button
          @click="refreshData"
          class="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <div class="relative flex-1 w-full px-2">
          <Search
            class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Cari perihal / nomor..."
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

      <table class="min-w-full border-collapse text-sm">
        <thead class="text-left bg-primary-400 text-white">
          <tr>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">
              Nama
            </th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">
              Alamat
            </th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">
              Telephone
            </th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">
              Status
            </th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">
              Dibuat Oleh
            </th>
            <th class="px-4 py-3 border-b-2 border-b-gray-100 font-semibold">
              Aksi
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="item in filteredData"
            :key="item.id"
            class="hover:bg-blue-50 transition-colors border-b border-b-gray-200 capitalize"
          >
            <td class="px-4 py-3 font-medium">
              {{ item.nama }}
            </td>

            <td class="px-4 py-3">
              {{ item.alamat }}
            </td>

            <td class="px-4 py-3 whitespace-nowrap">
              {{ item.telepon }}
            </td>

            <td class="px-4 py-3">
              <span
                class="px-3 py-1 rounded-full text-xs font-medium"
                :class="
                  item.aktif
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                "
              >
                {{ item.aktif ? "Aktif" : "Tidak Aktif" }}
              </span>
            </td>

            <td class="px-4 py-3">
              {{ item.nama_pembuat }}
            </td>

            <td class="px-4 py-3 text-center flex justify-center gap-5">
              <button class="text-yellow-500" @click="openEdit(item)">
                <Pencil class="w-4 h-4" />
              </button>

              <button class="text-red-500" @click="handleDelete(item.id)">
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <Teleport to="body">
        <AddUsulan
          v-model="openAdd"
          @submit="handleSubmitFromModal"
          @preview="handlePreview"
      /></Teleport>
      <Teleport to="body">
        <Modal v-model="showModal" @save="handleSave">
          <template #title>
            <Heading
              variant="heading9b"
              class="font-semibold text-sm mb-3 mt-5 ml-5"
            >
              {{
                editId ? "Edit Tertuju Eksternal" : "Tambah Tertuju Eksternal"
              }}
            </Heading>
          </template>

          <!-- FIELD PERSNUM -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-gray-700">Nama</label>
            <input
              v-model="form.nama"
              type="text"
              placeholder="Masukkan nama"
              class="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-gray-700">Alamat</label>
            <textarea
              v-model="form.alamat"
              type="text"
              placeholder="Masukkan alamat"
              class="border border-gray-300 rounded-md px-3 py-4 text-sm"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-gray-700">Telephone</label>
            <input
              v-model="form.telephone"
              type="text"
              placeholder="Masukkan no telphone"
              class="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>

          <!-- FIELD ROLE -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-semibold text-gray-700">Status</label>
            <select
              v-model="form.aktif"
              class="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="" disabled>Pilih status</option>
              <option :value="true">Aktif</option>
              <option :value="false">Tidak Aktif</option>
            </select>
          </div>
        </Modal>
      </Teleport>

      <ConfirmPopup
        v-model="showConfirmDelete"
        type="danger"
        title="Hapus Data"
        message="Data yang dihapus tidak dapat dikembalikan. Yakin ingin melanjutkan?"
        confirm-text="Hapus"
        cancel-text="Batal"
        :is-loading="isDeleting"
        @confirm="confirmDelete"
        @cancel="showConfirmDelete = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const items = [
  {
    label: "Dashboard",
    to: "/dashboard",
  },
  {
    label: "Tertuju Eksternal",
    to: "/admin/master/tertuju-eksternal",
  },
] satisfies BreadcrumbItem[];

import { onMounted, ref, computed } from "vue";
import {
  Search,
  FileDown,
  RotateCcw,
  Trash2,
  Pencil,
  Plus,
} from "lucide-vue-next";
import { useTertujuEksternal } from "~/composables/useTertujuEksternal";
import { useAuth } from "~/composables/useAuth";
import Modal from "@/components/Modal.vue";
import ConfirmPopup from "@/components/ConfirmPopup.vue";

const auth = useAuth();
const user = auth.user;

const {
  data,
  loading,
  fetchTertujuEksternal,
  createTertujuEksternal,
  deleteTertujuEksternal,
  updateTertujuEksternal,
} = useTertujuEksternal();

const form = ref({
  nama: "",
  alamat: "",
  telephone: "",
  aktif: true as boolean,
});

onMounted(() => {
  fetchTertujuEksternal();
});

const showModal = ref(false);
const editId = ref<string | null>(null);

const handleSave = async () => {
  if (editId.value) {
    await updateTertujuEksternal(editId.value, {
      nama: form.value.nama,
      alamat: form.value.alamat,
      telepon: form.value.telephone,
      aktif: form.value.aktif,
    });
  } else {
    await createTertujuEksternal({
      id_position_pembuat: user.value.position,
      company: "MN",
      area: "Regional 1",
      nama: form.value.nama,
      alamat: form.value.alamat,
      telepon: form.value.telephone,
      aktif: form.value.aktif,
    });
  }

  showModal.value = false;
  editId.value = null;
};

const showConfirmDelete = ref(false);
const deleteTargetId = ref<string | null>(null);
const isDeleting = ref(false);

const handleDelete = (id: string) => {
  deleteTargetId.value = id;
  showConfirmDelete.value = true;
};

const confirmDelete = async () => {
  if (!deleteTargetId.value) return;

  try {
    isDeleting.value = true;
    await deleteTertujuEksternal(deleteTargetId.value);
    showConfirmDelete.value = false;
  } catch (err: any) {
    console.error("Gagal menghapus data:", err?.response?.data || err);
  } finally {
    isDeleting.value = false;
    deleteTargetId.value = null;
  }
};

const openEdit = (item: any) => {
  editId.value = item.id;
  form.value = {
    nama: item.nama,
    alamat: item.alamat,
    telephone: item.telepon,
    aktif: item.aktif,
  };
  showModal.value = true;
};

// Filter state
const filters = ref({
  jenis: "",
  lokasi: "",
  status: "",
  tahun: "",
  search: "",
});

// Filtered data
const filteredData = computed(() => {
  const keyword = filters.value.search.toLowerCase();

  return data.value.filter((item) =>
    [
      item.company,
      item.area,
      item.nama,
      item.alamat,
      item.telepon,
      item.email,
      item.kontak,
      item.nama_pembuat,
    ]
      .join(" ")
      .toLowerCase()
      .includes(keyword),
  );
});

const refreshData = async () => {
  filters.value.search = "";
  await fetchTertujuEksternal();
};
</script>
