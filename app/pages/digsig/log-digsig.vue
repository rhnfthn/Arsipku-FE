<template>
  <div class="space-y-6">
    <div
      v-if="showGlobalAlert"
      class="top-0 left-0 right-0 z-[9999] bg-red-600 border-lg text-white px-6 py-3 shadow-lg flex items-center gap-4"
    >
      <!-- ICON -->
      <AlertTriangle class="w-5 h-5 flex-shrink-0" />

      <!-- MARQUEE CONTAINER -->
      <div class="relative overflow-hidden flex-1">
        <div class="animate-marquee whitespace-nowrap text-sm font-medium">
          <strong class="mr-2">PERHATIAN!</strong>
          Sedang terjadi gangguan pada sistem BsrE (Balai Sertifikasi
          Elektronik)
        </div>
      </div>

      <!-- CLOSE BUTTON -->
      <button
        @click="showGlobalAlert = false"
        class="flex-shrink-0 p-1 rounded-lg hover:bg-red-700 transition"
        aria-label="Tutup alert"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- SPACER AGAR KONTEN TIDAK KETUTUP -->
    <div v-if="showGlobalAlert" class="h-[5px]"></div>

    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-6"
    >
      <div>
        <Heading variant="heading6b" class="text-mobile-md">
          Log Digsig
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-200">
      <!-- HEADER -->
      <div class="flex items-center justify-between gap-4 p-5">
        <!-- SEARCH -->
        <div class="relative w-full">
          <input
            v-model="searchQuery"
            @input="debounceSearch"
            type="text"
            placeholder="Cari..."
            class="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Search
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          />
        </div>

        <!-- RIGHT ACTION -->
        <div class="flex items-center gap-3">
          <button
            class="flex items-center gap-5 text-white text-sm px-3 py-2 rounded-lg font-medium whitespace-nowrap"
            :class="bsreHealth?.isHealthy ? 'bg-red-600' : 'bg-red-600'"
            @click="showConfirmModal = true"
            :disabled="loadingHealth"
          >
            <AlertTriangle v-if="!bsreHealth?.isHealthy" class="w-4 h-4" />
            <Check v-else class="w-4 h-4" />
            {{
              loadingHealth
                ? "Memuat..."
                : bsreHealth?.isHealthy
                  ? "Gangguan BsrE"
                  : "Gangguan BsrE"
            }}
          </button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-primary-400 text-white">
            <tr>
              <th
                class="px-4 py-3 text-left cursor-pointer transition"
                @click="handleSort('tanggal')"
              >
                <div class="flex items-center gap-2">
                  Tanggal
                  <component :is="getSortIcon('tanggal')" class="w-4 h-4" />
                </div>
              </th>
              <th
                class="px-4 py-3 text-left cursor-pointer transition"
                @click="handleSort('ipAddress')"
              >
                <div class="flex items-center gap-2">IP</div>
              </th>
              <th
                class="px-4 py-3 text-left cursor-pointer transition"
                @click="handleSort('userName')"
              >
                <div class="flex items-center gap-2">
                  User
                  <component :is="getSortIcon('userName')" class="w-4 h-4" />
                </div>
              </th>
              <th
                class="px-4 py-3 text-left cursor-pointer transition"
                @click="handleSort('apiEndpoint')"
              >
                <div class="flex items-center gap-2">
                  Api
                  <component :is="getSortIcon('apiEndpoint')" class="w-4 h-4" />
                </div>
              </th>
              <th
                class="px-4 py-3 text-left cursor-pointertransition"
                @click="handleSort('nomorNaskah')"
              >
                <div class="flex items-center gap-2">
                  Naskah
                  <component :is="getSortIcon('nomorNaskah')" class="w-4 h-4" />
                </div>
              </th>
              <th
                class="px-4 py-3 text-left cursor-pointer transition"
                @click="handleSort('jenisNaskah')"
              >
                <div class="flex items-center gap-2">
                  Jenis
                  <component :is="getSortIcon('jenisNaskah')" class="w-4 h-4" />
                </div>
              </th>
              <th
                class="px-4 py-3 text-left cursor-pointer transition"
                @click="handleSort('status')"
              >
                <div class="flex items-center gap-2">
                  Note
                  <component :is="getSortIcon('status')" class="w-4 h-4" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                <div class="flex items-center justify-center gap-2">
                  <div
                    class="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"
                  ></div>
                  Memuat data...
                </div>
              </td>
            </tr>
            <tr v-else-if="logs.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                Tidak ada data
              </td>
            </tr>
            <tr v-else v-for="row in sortedLogs">
              <td :key="row.id" class="p-3 border-b border-gray-200">
                {{ formatDate(row.tanggal) }}
              </td>

              <td class="px-4 py-4 border-b border-gray-200">
                {{ row.ipAddress || "-" }}
              </td>
              <td class="px-3 py-3 border-b border-gray-200">
                {{ row.userName }}
              </td>
              <td
                class="px-4 py-4 font-mono text-xs text-gray-600 border-b border-gray-200"
              >
                {{ row.apiEndpoint }}
              </td>
              <td class="px-4 py-4 border-b border-gray-200">
                {{ row.nomorNaskah }}
              </td>
              <td class="px-4 py-4 border-b border-gray-200">
                {{ row.jenisNaskah }}
              </td>
              <td class="px-4 py-4 border-b border-gray-200">
                <span
                  :class="statusClass(row.status)"
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block whitespace-nowrap"
                >
                  {{ row.note }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- PAGINATION -->
        <div v-if="meta" class="flex items-center justify-between px-5 py-4">
          <div class="text-xs text-gray-600">
            Menampilkan {{ (meta.page - 1) * meta.limit + 1 }}–{{
              Math.min(meta.page * meta.limit, meta.total)
            }}
            dari {{ meta.total }} data
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="goToPage(meta.page - 1)"
              :disabled="meta.page === 1"
              :class="[
                'flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-lg transition-all',
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-primary border border-primary hover:bg-primary-50',
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

            <template v-for="page in paginationPages" :key="page">
              <button
                v-if="page !== '...'"
                @click="goToPage(page as number)"
                :class="[
                  'w-8 h-8 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                  page === meta.page
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-gray-200 hover:bg-gray-50',
                ]"
              >
                {{ page }}
              </button>
              <span v-else class="px-2">...</span>
            </template>

            <!-- <button
              @click="goToPage(meta.page + 1)"
              :disabled="meta.page === meta.totalPages"
              class="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight class="w-4 h-4" />
            </button> -->
            <button
              @click="goToPage(meta.page + 1)"
              :disabled="meta.page === meta.totalPages"
              :class="[
                'flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-lg transition-all',
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-primary border border-primary hover:bg-primary-50',
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

        <Teleport to="body">
          <Modal v-model="showConfirmModal" :hideDefaultFooter="true" size="xl">
            <!-- TITLE -->
            <template #title>
              <div class="flex items-center gap-3 ml-5 mt-5 mb-3">
                <div class="bg-red-100 text-red-600 p-3 rounded-full">
                  <AlertTriangle class="w-5 h-5" />
                </div>
                <Heading variant="heading9b" class="text-sm font-semibold">
                  Konfirmasi Alert Gangguan
                </Heading>
              </div>
            </template>

            <!-- BODY -->
            <div class="text-sm text-gray-600 space-y-4">
              <p>
                Apakah Anda yakin ingin mengaktifkan alert gangguan BsrE? Alert
                ini akan ditampilkan ke seluruh pengguna sistem.
              </p>

              <div
                class="flex items-center gap-5 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm"
              >
                <AlertTriangle class="w-8 h-8" />
                <span>
                  Tindakan ini sangat penting dan akan mempengaruhi seluruh
                  pengguna!
                </span>
              </div>
            </div>

            <!-- FOOTER -->
            <template #footer>
              <div
                class="flex justify-end border-t border-gray-300 w-full gap-3 px-5 pb-5 mt-6"
              >
                <button
                  @click="showConfirmModal = false"
                  class="flex-1 px-5 py-2 text-sm border mt-5 border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Batal
                </button>

                <button
                  @click="activateAlert"
                  class="flex-1 px-5 py-2 text-sm mt-5 bg-red-600 hover:bg-red-800 text-white rounded-md font-medium"
                >
                  Ya, Aktifkan Alert
                </button>
              </div>
            </template>
          </Modal>
        </Teleport>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Modal from "~/components/Modal.vue";
import {
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
} from "lucide-vue-next";
import type { DigsigLog, BsreHealthResponse } from "~/types/digsig";

const breadcrumbs = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Log Digsig", to: "/admin/digsig/log-digsig" },
];

const {
  logs,
  meta,
  bsreHealth,
  loading,
  loadingHealth,
  error,
  fetchLogs,
  fetchBsreHealth,
} = useDigsig();

// State
const searchQuery = ref("");
const sortBy = ref<string>("tanggal");
const sortOrder = ref<"asc" | "desc">("desc");
const currentPage = ref(1);
const showConfirmModal = ref(false);
const showGlobalAlert = ref(false);

// Client-side sorting
const sortedLogs = computed(() => {
  if (!sortBy.value) return logs.value;

  return [...logs.value].sort((a, b) => {
    const aVal = a[sortBy.value as keyof DigsigLog];
    const bVal = b[sortBy.value as keyof DigsigLog];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    return sortOrder.value === "asc" ? comparison : -comparison;
  });
});

// Fetch logs
const loadLogs = async () => {
  await fetchLogs({
    page: currentPage.value,
    limit: 10,
    search: searchQuery.value,
  });
};

// Fetch BsrE health
const loadBsreHealth = async () => {
  await fetchBsreHealth();

  // Auto show alert if unhealthy
  if (bsreHealth.value && !bsreHealth.value.isHealthy) {
    showGlobalAlert.value = true;
  }
};

// Sorting (client-side)
const handleSort = (column: string) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = column;
    sortOrder.value = "asc";
  }
};

const getSortIcon = (column: string) => {
  if (sortBy.value !== column) return ArrowUpDown;
  return sortOrder.value === "asc" ? ArrowUp : ArrowDown;
};

// Pagination
const goToPage = (page: number) => {
  if (page >= 1 && page <= meta.value.totalPages) {
    currentPage.value = page;
    loadLogs();
  }
};

const paginationPages = computed(() => {
  if (!meta.value) return [];

  const total = meta.value.totalPages;
  const current = meta.value.page;
  const pages: (number | string)[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("...");
      pages.push(total);
    } else if (current >= total - 2) {
      pages.push(1);
      pages.push("...");
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
      pages.push("...");
      pages.push(total);
    }
  }

  return pages;
});

// Search with debounce
let searchTimeout: NodeJS.Timeout;
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadLogs();
  }, 500);
};

// Modal actions
const activateAlert = () => {
  showConfirmModal.value = false;
  showGlobalAlert.value = true;
};

// Utils
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusClass = (status: string) => {
  if (status === "sukses") return "bg-green-100 text-green-700";
  return "bg-red-100 text-red-700";
};

// Load data on mount
onMounted(() => {
  loadLogs();
  loadBsreHealth();
});
</script>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.animate-marquee {
  display: inline-block;
  animation: marquee 15s linear infinite;
}
</style>
