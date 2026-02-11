<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-wrap justify-between mb-5">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
      >
        <PageHeader title="Manajemen Akun" :items="items" />
      </div>
      <UButton
        @click="showAddModal = true"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-4 py-2 h-8 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-xs transition-colors"
      >
        <Plus class="w-4 h-4" />
        Tambah
      </UButton>
    </div>

    <div
      class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- Top Bar -->
      <div class="flex flex-wrap gap-4 items-center p-3">
        <button
          @click="refreshData"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <!-- Rows per page -->
        <select
          v-model="rowsPerPage"
          class="border text-xs border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-200 rounded-md px-2 py-1"
        >
          <option v-for="n in rowsChoices" :key="n" :value="n">
            {{ n }}
          </option>
        </select>

        <div class="relative flex-1 w-full px-2">
          <Search
            class="w-3.5 h-3.5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Cari username / nama..."
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs pl-9 pr-3 py-1.5 rounded-lg dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-6 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 text-xs transition-colors"
        >
          <FileDown class="w-4 h-4" />
          Export
        </button>
      </div>

      <!-- Table -->
      <table class="min-w-full border-collapse text-sm">
        <thead class="bg-primary-400 dark:bg-primary-700 text-white text-left">
          <tr>
            <th class="px-7 py-3 border-primary-600 font-semibold">Username</th>
            <th class="px-4 py-3 border-primary-600 font-semibold">Role</th>
            <th class="px-4 py-3 border-primary-600 font-semibold">Status</th>
            <th class="px-4 py-3 border-primary-600 font-semibold text-center">
              Aksi
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(user, idx) in paginatedUsers"
            :key="user.username"
            :class="[
              'border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors',
              idx % 2 === 0
                ? 'bg-white dark:bg-gray-800'
                : 'bg-white dark:bg-gray-800',
            ]"
          >
            <td class="px-4 py-3">
              <div class="flex items-start space-x-3 ml-3">
                <UserRound
                  class="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1"
                />
                <div>
                  <p class="font-semibold text-gray-700 dark:text-white">
                    {{ user.persnum }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    {{ user.name }}
                  </p>
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
                class="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400 transition-colors"
                @click="openDelete(user)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div
        v-if="filteredUsers.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          Menampilkan {{ paginatedUsers.length }} dari
          {{ filteredUsers.length }} data
        </div>

        <div class="flex items-center gap-2">
          <!-- Back Button -->
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900',
            ]"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>

          <!-- Page Numbers -->
          <div class="flex items-center gap-1">
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >
              1
            </button>

            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary',
              ]"
            >
              {{ page }}
            </button>

            <span
              v-if="
                paginationPages[paginationPages.length - 1] < totalPages - 1
              "
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <!-- Next Button -->
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900',
            ]"
          >
            Next
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <Modal v-model="showAddModal" @save="saveAccount">
      <template #title>
        <Heading
          variant="heading9b"
          class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white"
        >
          Tambah Akun
        </Heading>
      </template>

      <!-- FIELD PERSNUM -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200"
          >Persnum</label
        >
        <input
          v-model="form.persnum"
          type="text"
          placeholder="Masukkan persnum"
          class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      <!-- FIELD ROLE -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200"
          >Role</label
        >
        <select
          v-model="form.role"
          class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
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
import { ref, computed, watch, onMounted } from "vue";
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
  { label: "Beranda", to: "/" },
  { label: "Manajemen Akun", to: "/admin/master/akun" },
];

const filters = ref({
  search: "",
  role: "",
  status: "",
});

// Pagination
const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const currentPage = ref<number>(1);

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

const refreshData = () => {
  fetchAccounts();
  currentPage.value = 1;
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

// Pagination computed
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredUsers.value.length / rowsPerPage.value)),
);

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredUsers.value.slice(start, start + rowsPerPage.value);
});

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 2) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 1) {
      pages.push(total - 2, total - 1, total);
    } else {
      pages.push(current - 1, current, current + 1);
    }
  }

  return pages;
});

// Watch for changes that should reset pagination
watch([() => filters.value.search, rowsPerPage], () => {
  currentPage.value = 1;
});

const resetFilter = () => {
  filters.value = { search: "", role: "", status: "" };
  currentPage.value = 1;
};

const getRoleColor = (role: string) =>
  role === "admin"
    ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300"
    : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";

const getStatusColor = (status: string) =>
  status === "aktif"
    ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
    : "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300";
</script>

<style scoped>
* {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
}
</style>
