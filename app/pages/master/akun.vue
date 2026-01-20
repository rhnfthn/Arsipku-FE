<template>
  <div class="flex flex-wrap justify-between">
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <PageHeader title="Manajemen Akun" :items="items" />
    </div>
    <UButton
      @click="showAddModal = true"
      class="flex items-center gap-2 bg-primary text-white px-4 py-2 h-8 rounded-lg hover:bg-primary-800 text-xs"
    >
      <Plus class="w-4 h-4" />
      Tambah
    </UButton>
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

    <!-- Table -->
    <table class="min-w-full border-collapse text-sm">
      <thead class="bg-primary-400 text-white text-left">
        <tr>
          <th class="px-4 py-3 border-primary-600 font-semibold">Username</th>
          <th class="px-4 py-3 border-primary-600 font-semibold">Role</th>
          <th class="px-4 py-3 border-primary-600 font-semibold">Status</th>
          <th class="px-4 py-3 border-primary-600 font-semibold text-center">
            Aksi
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="user in filteredUsers"
          :key="user.username"
          class="border-b border-gray-100 hover:bg-blue-50 transition-colors"
        >
          <td class="px-4 py-3">
            <div class="flex items-start space-x-3">
              <UserRound class="w-4 h-4 text-gray-500 mt-1" />
              <div>
                <p class="font-semibold text-gray-700">{{ user.persnum }}</p>
                <p class="text-xs text-gray-600">{{ user.name }}</p>
              </div>
            </div>
          </td>

          <td class="px-4 py-3">
            <span
              class="px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1 w-fit"
              :class="getRoleColor(user.role)"
            >
              <Shield class="w-3 h-3" />
              {{ user.role }}
            </span>
          </td>

          <td class="px-4 py-3">
            <span
              class="px-3 py-1 text-xs rounded-full font-medium"
              :class="getStatusColor(user.status)"
            >
              {{ user.status }}
            </span>
          </td>

          <td class="px-4 py-3 text-center space-x-3">
            <button
              class="text-red-600 hover:text-red-800 transition-colors"
              @click="openDelete(user)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <Teleport to="body">
    <AddUsulan
      v-model="openAdd"
      @submit="handleSubmitFromModal"
      @preview="handlePreview"
  /></Teleport>
  <Teleport to="body">
    <Modal v-model="showAddModal" @save="saveAccount">
      <template #title>
        <Heading
          variant="heading9b"
          class="font-semibold text-sm mb-3 mt-5 ml-5"
        >
          Tambah Akun
        </Heading>
      </template>

      <!-- FIELD PERSNUM -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700">Persnum</label>
        <input
          v-model="form.persnum"
          type="text"
          placeholder="Masukkan persnum"
          class="border border-gray-300 rounded-md px-3 py-2 text-sm"
        />
      </div>

      <!-- FIELD ROLE -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700">Role</label>
        <select
          v-model="form.role"
          class="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="" disabled>Pilih role</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Super Admin</option>
        </select>
      </div>
    </Modal>
  </Teleport>

  <ConfirmPopup
    v-model="confirmDeleteOpen"
    title="Hapus Data?"
    description="Data yang dihapus tidak dapat dikembalikan."
    confirmText="Hapus"
    cancelText="Batal"
    @confirm="deleteNow"
  />
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Trash2,
  UserRound,
  Shield,
  RotateCcw,
  FileDown,
  Search,
  Plus,
} from "lucide-vue-next";
import Modal from "@/components/Modal.vue";
import { useManajemenAkun } from "@/composables/useManajemenAkun";

const { accounts, fetchAccounts, loading, addAccount, deleteAccount } =
  useManajemenAkun();

const confirmDeleteOpen = ref(false);
const itemToDelete = ref<any>(null);

const openDelete = (user) => {
  itemToDelete.value = user;
  confirmDeleteOpen.value = true;
};

const items = [
  { label: "Dashboard", to: "/" },
  { label: "Manajemen Akun", to: "/admin/master/akun" },
];

const filters = ref({
  search: "",
  role: "",
  status: "",
});

const saveAccount = async () => {
  if (!form.value.persnum || !form.value.role) {
    alert("Persnum dan role wajib diisi");
    return;
  }

  try {
    await addAccount(form.value.persnum, form.value.role);

    showAddModal.value = false;
    form.value = { persnum: "", role: "" };

    alert("Role berhasil diberikan kepada user!");
  } catch (error) {
    alert("Gagal memberikan role!");
  }
};

const deleteNow = async () => {
  if (!itemToDelete.value) return;

  try {
    await deleteAccount(itemToDelete.value.persnum);

    alert("Role berhasil dihapus. Pengguna kembali menjadi user biasa.");

    confirmDeleteOpen.value = false;
    itemToDelete.value = null;
  } catch (err) {
    alert("Gagal menghapus role!");
  }
};

const showAddModal = ref(false);
const form = ref({
  persnum: "",
  role: "",
});

onMounted(() => {
  fetchAccounts();
});

const filteredUsers = computed(() => {
  const searchText = filters.value.search.toLowerCase();

  return accounts.value.filter((user) => {
    const userRole = (user.role || "").toLowerCase();
    const userStatus = (user.status || "").toLowerCase();

    const matchesSearch =
      !searchText ||
      `${user.persnum} ${user.name} ${user.email}`
        .toLowerCase()
        .includes(searchText);

    const matchesRole =
      !filters.value.role || userRole === filters.value.role.toLowerCase();

    const matchesStatus =
      !filters.value.status ||
      userStatus === filters.value.status.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });
});

const resetFilter = () => {
  filters.value = { search: "", role: "", status: "" };
};

const getRoleColor = (role: string) =>
  role === "admin"
    ? "bg-yellow-100 text-yellow-700"
    : "bg-blue-100 text-blue-700";

const getStatusColor = (status: string) =>
  status === "aktif"
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-600";
</script>
