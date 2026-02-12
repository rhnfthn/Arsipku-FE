<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- MAIN CONTENT -->
    <div class="w-full">
      <!-- HEADER -->
      <div class="mb-2">
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2"
        >
          <div>
            <Heading
              variant="heading6b"
              class="text-2xl font-bold text-gray-900 dark:text-white"
            >
              Log Digsig
            </Heading>
            <PageHeader :items="breadcrumbs" class="mt-1" />
          </div>
        </div>
      </div>

      <!-- WHITE CARD CONTAINER -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <!-- TOOLBAR (FIXED - NO SCROLL) -->
        <div
          class="p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        >
          <div
            class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <!-- SEARCH & LIMIT FILTER -->
            <div
              class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1"
            >
              <!-- LIMIT FILTER -->
              <select
                v-model="limitPerPage"
                @change="handleLimitChange"
                class="px-4 py-2 text-sm rounded-lg dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition cursor-pointer"
              >
                <option :value="10">10</option>
                <option :value="15">15</option>
                <option :value="20">20</option>
                <option :value="25">25</option>
              </select>
              <!-- SEARCH -->
              <div class="relative flex-1">
                <input
                  v-model="searchQuery"
                  @input="debounceSearch"
                  type="text"
                  placeholder="Cari berdasarkan user, IP, atau jenis naskah"
                  class="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
                <Search
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
                />
              </div>
            </div>

            <!-- BSRE ALERT BUTTON (Dynamic color based on alert status) -->
            <button
              :class="[
                'flex items-center gap-2 text-white text-sm px-4 py-2.5 rounded-lg font-medium whitespace-nowrap shadow-sm hover:shadow-md transition-all',
                bsreAlert?.isActive
                  ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800'
                  : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800',
              ]"
              @click="
                bsreAlert?.isActive
                  ? openDeactivateModal()
                  : openActivateModal()
              "
              :disabled="loadingAlert"
            >
              <AlertTriangle class="w-4 h-4" />
              {{
                loadingAlert
                  ? "Memuat..."
                  : bsreAlert?.isActive
                    ? "Nonaktifkan Alert"
                    : "Aktifkan Alert Gangguan"
              }}
            </button>
          </div>
        </div>

        <!-- TABLE CONTAINER (SCROLLABLE) -->
        <div class="overflow-x-auto">
          <table
            class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
          >
            <!-- TABLE HEAD (STICKY) -->
            <thead
              class="bg-primary dark:bg-primary-700 text-white sticky top-0 z-10"
            >
              <tr>
                <th
                  @click="handleSort('tanggal')"
                  class="px-4 py-3 text-left text-sm tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>Tanggal</span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'tanggal' ? 'opacity-100' : 'opacity-40',
                        sortKey === 'tanggal' && sortOrder === 'desc'
                          ? 'rotate-180'
                          : '',
                      ]"
                    />
                  </div>
                </th>
                <th
                  @click="handleSort('ipAddress')"
                  class="px-4 py-3 text-left text-sm text-nowrap tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>IP Address</span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'ipAddress' ? 'opacity-100' : 'opacity-40',
                        sortKey === 'ipAddress' && sortOrder === 'desc'
                          ? 'rotate-180'
                          : '',
                      ]"
                    />
                  </div>
                </th>
                <th
                  @click="handleSort('userName')"
                  class="px-4 py-3 text-left text-sm tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>User</span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'userName' ? 'opacity-100' : 'opacity-40',
                        sortKey === 'userName' && sortOrder === 'desc'
                          ? 'rotate-180'
                          : '',
                      ]"
                    />
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-sm tracking-wider">
                  <div class="flex items-center gap-2">
                    <span>API Endpoint</span>
                  </div>
                </th>
                <th
                  @click="handleSort('jenisNaskah')"
                  class="px-4 py-3 text-left text-sm text-nowrap tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>Jenis Naskah</span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'jenisNaskah'
                          ? 'opacity-100'
                          : 'opacity-40',
                        sortKey === 'jenisNaskah' && sortOrder === 'desc'
                          ? 'rotate-180'
                          : '',
                      ]"
                    />
                  </div>
                </th>
                <th
                  @click="handleSort('status')"
                  class="px-4 py-3 text-left text-sm tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>Status </span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'status' ? 'opacity-100' : 'opacity-40',
                        sortKey === 'status' && sortOrder === 'desc'
                          ? 'rotate-180'
                          : '',
                      ]"
                    />
                  </div>
                </th>
              </tr>
            </thead>

            <!-- TABLE BODY -->
            <tbody
              class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
            >
              <!-- LOADING STATE (SKELETON) -->
              <tr v-if="loading" v-for="i in limitPerPage" :key="i">
                <td class="px-6 py-4">
                  <div class="space-y-2">
                    <div
                      class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"
                    ></div>
                    <div
                      class="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"
                    ></div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-28"
                  ></div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                    ></div>
                    <div
                      class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"
                    ></div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40"
                  ></div>
                </td>
                <td class="px-6 py-4">
                  <div
                    class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"
                  ></div>
                </td>
                <td class="px-6 py-4">
                  <div
                    class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-20"
                  ></div>
                </td>
              </tr>

              <!-- EMPTY STATE -->
              <tr v-else-if="sortedLogs.length === 0">
                <td colspan="6" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <Search
                      class="w-12 h-12 text-gray-300 dark:text-gray-600"
                    />
                    <span
                      class="text-sm text-gray-500 dark:text-gray-400 font-medium"
                      >Tidak ada data ditemukan</span
                    >
                    <span class="text-xs text-gray-400 dark:text-gray-500"
                      >Coba ubah kriteria pencarian Anda</span
                    >
                  </div>
                </td>
              </tr>

              <!-- DATA ROWS -->
              <tr
                v-else
                v-for="row in sortedLogs"
                :key="row.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  <div class="flex flex-col">
                    <span class="font-medium">{{
                      formatDate(row.tanggal)
                    }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{
                      formatTime(row.tanggal)
                    }}</span>
                  </div>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono"
                >
                  {{ row.ipAddress || "-" }}
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 flex items-center justify-center font-semibold text-xs"
                    >
                      {{ getUserInitials(row.userName) }}
                    </div>
                    <span>{{ row.userName }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  <code
                    class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono"
                  >
                    {{ row.apiEndpoint || "-" }}
                  </code>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {{ row.jenisNaskah || "-" }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    :class="statusClass(row.status)"
                    class="px-3 py-1.5 text-xs rounded-full font-semibold inline-flex items-center gap-1.5"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="
                        row.status === 'sukses' ? 'bg-green-600' : 'bg-red-600'
                      "
                    ></span>
                    {{ row.note || row.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION (FIXED - NO SCROLL) -->
        <div
          v-if="meta && sortedLogs.length > 0"
          class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          <div
            class="flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <!-- INFO -->
            <div class="text-xs text-gray-600 dark:text-gray-400">
              Menampilkan
              <span class="text-gray-600 dark:text-gray-300">{{
                (meta.page - 1) * meta.limit + 1
              }}</span>
              -
              <span class="text-gray-600 dark:text-gray-300">{{
                Math.min(meta.page * meta.limit, meta.total)
              }}</span>
              dari
              <span class="text-gray-600 dark:text-gray-300">{{
                meta.total
              }}</span>
              data
            </div>

            <!-- PAGINATION CONTROLS -->
            <div class="flex items-center gap-2">
              <!-- PREVIOUS -->
              <button
                @click="goToPage(meta.page - 1)"
                :disabled="meta.page === 1"
                :class="[
                  'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
                  meta.page === 1
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600',
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

              <!-- PAGE NUMBERS -->
              <div class="flex items-center gap-1">
                <!-- First page -->
                <button
                  v-if="paginationPages[0] > 1"
                  @click="goToPage(1)"
                  class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
                >
                  1
                </button>

                <!-- Left ellipsis -->
                <span
                  v-if="paginationPages[0] > 2"
                  class="px-2 text-gray-400 dark:text-gray-500 text-sm"
                >
                  ...
                </span>

                <!-- Visible pages -->
                <button
                  v-for="page in paginationPages"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                    currentPage === page
                      ? 'bg-primary dark:bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400',
                  ]"
                >
                  {{ page }}
                </button>

                <!-- Right ellipsis -->
                <span
                  v-if="
                    paginationPages[paginationPages.length - 1] < totalPages - 1
                  "
                  class="px-2 text-gray-400 dark:text-gray-500 text-sm"
                >
                  ...
                </span>

                <!-- Last page -->
                <button
                  v-if="
                    paginationPages[paginationPages.length - 1] < totalPages
                  "
                  @click="goToPage(totalPages)"
                  class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
                >
                  {{ totalPages }}
                </button>
              </div>

              <!-- NEXT -->
              <button
                @click="goToPage(meta.page + 1)"
                :disabled="meta.page === meta.totalPages"
                :class="[
                  'flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-lg transition-all',
                  meta.page === meta.totalPages
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600',
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
    </div>

    <!-- MODAL ACTIVATE ALERT -->
    <Teleport to="body">
      <Modal v-model="showActivateModal" :hideDefaultFooter="true" size="xl">
        <!-- TITLE -->
        <template #title>
          <div class="flex items-center gap-3 ml-5 mt-5 mb-3">
            <div
              class="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 p-3 rounded-full"
            >
              <AlertTriangle class="w-5 h-5" />
            </div>
            <Heading
              variant="heading9b"
              class="text-sm font-semibold dark:text-white"
            >
              Aktifkan Alert Gangguan BsrE
            </Heading>
          </div>
        </template>

        <!-- BODY -->
        <div class="px-6 text-sm text-gray-600 dark:text-gray-300 space-y-4">
          <p>
            Masukkan pesan gangguan yang akan ditampilkan ke seluruh pengguna
            sistem:
          </p>

          <textarea
            v-model="alertMessage"
            placeholder="Contoh: BSrE sedang dalam maintenance sampai pukul 15:00 WIB"
            rows="3"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
          ></textarea>

          <div
            class="flex items-center gap-5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm"
          >
            <AlertTriangle class="w-8 h-8 flex-shrink-0" />
            <span>
              Tindakan ini sangat penting dan akan mempengaruhi seluruh
              pengguna!
            </span>
          </div>
        </div>

        <!-- FOOTER -->
        <template #footer>
          <div
            class="flex justify-end border-t border-gray-300 dark:border-gray-700 w-full gap-3 px-5 pb-5 mt-6"
          >
            <button
              @click="showActivateModal = false"
              class="flex-1 px-5 py-2 text-sm border mt-5 border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition"
            >
              Batal
            </button>

            <button
              @click="activateAlert"
              :disabled="!alertMessage.trim() || loadingAlert"
              class="flex-1 px-5 py-2 text-sm mt-5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loadingAlert ? "Mengaktifkan..." : "Ya, Aktifkan Alert" }}
            </button>
          </div>
        </template>
      </Modal>
    </Teleport>

    <!-- MODAL DEACTIVATE ALERT -->
    <Teleport to="body">
      <Modal v-model="showDeactivateModal" :hideDefaultFooter="true" size="xl">
        <!-- TITLE -->
        <template #title>
          <div class="flex items-center gap-3 ml-5 mt-5 mb-3">
            <div
              class="bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 p-3 rounded-full"
            >
              <AlertTriangle class="w-5 h-5" />
            </div>
            <Heading
              variant="heading9b"
              class="text-sm font-semibold dark:text-white"
            >
              Nonaktifkan Alert Gangguan BsrE
            </Heading>
          </div>
        </template>

        <!-- BODY -->
        <div class="px-6 text-sm text-gray-600 dark:text-gray-300 space-y-4">
          <p>
            Apakah Anda yakin ingin menonaktifkan alert gangguan BsrE? Alert
            akan dihapus dari tampilan seluruh pengguna.
          </p>

          <div
            class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
          >
            <div class="flex items-start gap-3">
              <AlertTriangle
                class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
              />
              <div class="text-sm text-yellow-800 dark:text-yellow-300">
                <p class="font-medium">Pesan alert saat ini:</p>
                <p class="mt-1 italic">"{{ bsreAlert?.message }}"</p>
                <p class="mt-2 text-xs">
                  Diaktifkan oleh: {{ bsreAlert?.activatedByName || "-" }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <template #footer>
          <div
            class="flex justify-end border-t border-gray-300 dark:border-gray-700 w-full gap-3 px-5 pb-5 mt-6"
          >
            <button
              @click="showDeactivateModal = false"
              class="flex-1 px-5 py-2 text-sm border mt-5 border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition"
            >
              Batal
            </button>

            <button
              @click="deactivateAlert"
              :disabled="loadingAlert"
              class="flex-1 px-5 py-2 text-sm mt-5 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800 text-white rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loadingAlert ? "Menonaktifkan..." : "Ya, Nonaktifkan Alert" }}
            </button>
          </div>
        </template>
      </Modal>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import Modal from "~/components/Modal.vue";
import { Search, AlertTriangle, X, ArrowUpDown, Check } from "lucide-vue-next";
import type { DigsigLog } from "~/types/digsig";

const toast = useToast();

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Log Digsig", to: "/admin/digsig/log-digsig" },
];

const {
  logs,
  meta,
  bsreHealth,
  bsreAlert,
  loading,
  loadingHealth,
  loadingAlert,
  error,
  fetchLogs,
  fetchBsreHealth,
  fetchBsreAlert,
  activateBsreAlert,
  deactivateBsreAlert,
} = useDigsig();

// State
const searchQuery = ref("");
const currentPage = ref(1);
const limitPerPage = ref(10);
const showActivateModal = ref(false);
const showDeactivateModal = ref(false);
const alertMessage = ref("");
const sortKey = ref("tanggal");
const sortOrder = ref<"asc" | "desc">("desc");

// Computed
const totalPages = computed(() => meta.value?.totalPages || 1);

// Client-side sorting (karena backend tidak support sortBy & sortOrder)
const SORT_FIELD_MAP: Record<string, keyof DigsigLog> = {
  tanggal: "tanggal",
  ipAddress: "ipAddress",
  userName: "userName",
  jenisNaskah: "jenisNaskah",
  status: "note",
};

const sortedLogs = computed(() => {
  if (!sortKey.value || !logs.value.length) return logs.value;

  const field = SORT_FIELD_MAP[sortKey.value];
  if (!field) return logs.value;

  return [...logs.value].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];

    if (aVal == null) return 1;
    if (bVal == null) return -1;

    // Date sorting
    if (field === "tanggal") {
      return sortOrder.value === "asc"
        ? new Date(aVal as string).getTime() -
            new Date(bVal as string).getTime()
        : new Date(bVal as string).getTime() -
            new Date(aVal as string).getTime();
    }

    // String sorting
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();

    return sortOrder.value === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });
});

// Sorting handler - client side only
function handleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
}

// Handle limit change
const handleLimitChange = () => {
  currentPage.value = 1;
  loadLogs();
};

// Fetch logs with pagination only (NO sorting parameters)
const loadLogs = async () => {
  await fetchLogs({
    page: currentPage.value,
    limit: limitPerPage.value,
    search: searchQuery.value,
  });
};

// Fetch BsrE health
const loadBsreHealth = async () => {
  await fetchBsreHealth();
};

// Fetch BsrE alert status
const loadBsreAlert = async () => {
  await fetchBsreAlert();
};

// Pagination
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadLogs();
  }
};

const paginationPages = computed(() => {
  if (!meta.value) return [];

  const total = meta.value.totalPages;
  const current = meta.value.page;
  const pages: number[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (current >= total - 2) {
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
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
const openActivateModal = () => {
  alertMessage.value = "";
  showActivateModal.value = true;
};

const openDeactivateModal = () => {
  showDeactivateModal.value = true;
};

const activateAlert = async () => {
  if (!alertMessage.value.trim()) {
    toast.add({
      title: "Gagal",
      description: "Pesan alert tidak boleh kosong",
      color: "red",
    });
    return;
  }

  try {
    await activateBsreAlert(alertMessage.value);

    toast.add({
      title: "Berhasil",
      description: "Alert gangguan BsrE berhasil diaktifkan",
      color: "green",
    });

    showActivateModal.value = false;

    // Alert state sudah di-update otomatis oleh composable
    // Banner akan langsung muncul tanpa perlu refresh
  } catch (err: any) {
    toast.add({
      title: "Gagal",
      description: err?.message || "Gagal mengaktifkan alert",
      color: "red",
    });
  }
};

const deactivateAlert = async () => {
  try {
    await deactivateBsreAlert();

    toast.add({
      title: "Berhasil",
      description: "Alert gangguan BsrE berhasil dinonaktifkan",
      color: "green",
    });

    showDeactivateModal.value = false;

    // Alert state sudah di-update otomatis oleh composable
    // Banner akan langsung hilang tanpa perlu refresh
  } catch (err: any) {
    toast.add({
      title: "Gagal",
      description: err?.message || "Gagal menonaktifkan alert",
      color: "red",
    });
  }
};

// Utils
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getUserInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const statusClass = (status: string) => {
  if (status === "sukses")
    return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800";
  return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800";
};

// Load data on mount
onMounted(() => {
  loadLogs();
  loadBsreHealth();
  loadBsreAlert(); // Load alert status on mount
});
</script>

<style scoped>
/* Custom scrollbar */
.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  border-radius: 10px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  border-radius: 10px;
}
</style>
