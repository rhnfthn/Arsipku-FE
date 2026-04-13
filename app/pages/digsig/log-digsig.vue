<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-5">
    <!-- MAIN CONTENT -->
    <div class="w-full">
      <!-- HEADER -->
      <div class="mb-2">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <Heading variant="heading6b" class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ $t('log_title') }}
            </Heading>
            <PageHeader :items="breadcrumbs" class="mt-1" />
          </div>
        </div>
      </div>

      <!-- WHITE CARD CONTAINER -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <!-- TOOLBAR -->
        <div
          class="flex flex-col md:flex-row justify-between items-center gap-4 pl-4 mb-4 pt-5 pr-4"
        >
          <!-- SEARCH & LIMIT -->
          <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1">
            <!-- ROWS PER PAGE DROPDOWN -->
            <div class="flex items-center gap-2">
              <div class="relative" ref="rowsRef">
                <button
                  type="button"
                  @click.stop="showRowsDropdown = !showRowsDropdown"
                  class="h-9 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
                >
                  <span>{{ rowsPerPage }}</span>
                  <ChevronDown
                    class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-180': showRowsDropdown }"
                  />
                </button>
                <Transition name="filter-dd">
                  <div
                    v-if="showRowsDropdown"
                    class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                  >
                    <button
                      v-for="n in rowsChoices"
                      :key="n"
                      type="button"
                      @click.stop="selectRowsPerPage(n)"
                      :class="[
                        'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                        rowsPerPage === n
                          ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                          : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                      ]"
                    >
                      {{ n }}
                    </button>
                  </div>
                </Transition>
              </div>
            </div>

            <!-- SEARCH — only jenisNaskah -->
            <div class="relative flex-1">
              <input
                v-model="searchQuery"
                @input="debounceSearch"
                type="text"
                :placeholder="$t('log_cari_placeholder')"
                class="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              />
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
              />
            </div>
          </div>

          <!-- BSRE ALERT BUTTON -->
          <button
            :class="[
              'flex items-center gap-2 text-white text-sm px-4 py-2.5 rounded-lg font-medium whitespace-nowrap shadow-sm hover:shadow-md transition-all',
              bsreAlert?.isActive
                ? 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800'
                : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
            ]"
            @click="bsreAlert?.isActive ? openDeactivateModal() : openActivateModal()"
            :disabled="loadingAlert"
          >
            <AlertTriangle class="w-4 h-4" />
            {{
              loadingAlert
                ? $t('log_btn_loading')
                : bsreAlert?.isActive
                  ? $t('log_btn_deactivate')
                  : $t('log_btn_activate')
            }}
          </button>
        </div>

        <!-- TABLE -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <!-- THEAD -->
            <thead class="bg-primary dark:bg-primary-700 text-white sticky top-0 z-10">
              <tr>
                <th
                  @click="handleSort('tanggal')"
                  class="px-4 py-3 text-left text-sm tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ $t('log_col_tanggal') }}</span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'tanggal' ? 'opacity-100' : 'opacity-40',
                        sortKey === 'tanggal' && sortOrder === 'desc' ? 'rotate-180' : ''
                      ]"
                    />
                  </div>
                </th>
                <th
                  @click="handleSort('ipAddress')"
                  class="px-4 py-3 text-left text-sm text-nowrap tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ $t('log_col_ip') }}</span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'ipAddress' ? 'opacity-100' : 'opacity-40',
                        sortKey === 'ipAddress' && sortOrder === 'desc' ? 'rotate-180' : ''
                      ]"
                    />
                  </div>
                </th>
                <th
                  @click="handleSort('userName')"
                  class="px-4 py-3 text-left text-sm tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ $t('log_col_user') }}</span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'userName' ? 'opacity-100' : 'opacity-40',
                        sortKey === 'userName' && sortOrder === 'desc' ? 'rotate-180' : ''
                      ]"
                    />
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-sm tracking-wider">
                  <div class="flex items-center gap-2">
                    <span>{{ $t('log_col_api') }}</span>
                  </div>
                </th>
                <th
                  @click="handleSort('jenisNaskah')"
                  class="px-4 py-3 text-left text-sm text-nowrap tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ $t('log_col_naskah') }}</span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'jenisNaskah' ? 'opacity-100' : 'opacity-40',
                        sortKey === 'jenisNaskah' && sortOrder === 'desc' ? 'rotate-180' : ''
                      ]"
                    />
                  </div>
                </th>
                <th
                  @click="handleSort('status')"
                  class="px-4 py-3 text-left text-sm tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>{{ $t('log_col_status') }}</span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'status' ? 'opacity-100' : 'opacity-40',
                        sortKey === 'status' && sortOrder === 'desc' ? 'rotate-180' : ''
                      ]"
                    />
                  </div>
                </th>
              </tr>
            </thead>

            <!-- TBODY -->
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <!-- SKELETON -->
              <tr v-if="loading" v-for="i in rowsPerPage" :key="i">
                <td class="px-6 py-4">
                  <div class="space-y-2">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                    <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-28"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                    ></div>
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                </td>
                <td class="px-6 py-4">
                  <div
                    class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-20"
                  ></div>
                </td>
              </tr>

              <!-- EMPTY -->
              <tr v-else-if="sortedLogs.length === 0">
                <td colspan="6" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <Search class="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">{{
                      $t('log_empty')
                    }}</span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{
                      $t('log_empty_hint')
                    }}</span>
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <div class="flex flex-col">
                    <span class="font-medium">{{ formatDate(row.tanggal) }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{
                      formatTime(row.tanggal)
                    }}</span>
                  </div>
                </td>
                <td
                  class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 font-mono"
                >
                  {{ row.ipAddress || '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded-full bg-primary-500 dark:bg-primary-900 text-white dark:text-primary-300 flex items-center justify-center font-semibold text-xs"
                    >
                      {{ getUserInitials(row.userName) }}
                    </div>
                    <span v-html="highlight(row.userName, searchQuery)"></span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  <code class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                    {{ row.apiEndpoint || '-' }}
                  </code>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <span v-html="highlight(row.jenisNaskah, searchQuery)"></span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    :class="statusClass(row.status)"
                    class="px-3 py-1.5 text-xs rounded-full font-semibold inline-flex items-center gap-1.5"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="row.status === 'sukses' ? 'bg-green-600' : 'bg-red-600'"
                    ></span>
                    {{ row.note || row.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div
          v-if="meta && sortedLogs.length > 0"
          class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <!-- INFO: "menampilkan X dari Y data" -->
            <div class="text-xs text-gray-600 dark:text-gray-400">
              {{ $t('menampilkan') }}
              <span class="text-gray-700 dark:text-gray-300">{{ sortedLogs.length }}</span>
              {{ $t('dari') }}
              <span class="text-gray-700 dark:text-gray-300">{{ meta.total }}</span>
              {{ $t('data') }}
            </div>

            <!-- CONTROLS -->
            <div class="flex items-center gap-2">
              <!-- PREV -->
              <button
                @click="goToPage(meta.page - 1)"
                :disabled="meta.page === 1"
                :class="[
                  'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
                  meta.page === 1
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {{ $t('sebelumnya') }}
              </button>

              <!-- PAGE NUMBERS -->
              <div class="flex items-center gap-1">
                <button
                  v-if="paginationPages[0] > 1"
                  @click="goToPage(1)"
                  class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
                >
                  1
                </button>
                <span
                  v-if="paginationPages[0] > 2"
                  class="px-2 text-gray-400 dark:text-gray-500 text-sm"
                  >...</span
                >
                <button
                  v-for="page in paginationPages"
                  :key="page"
                  @click="goToPage(page)"
                  :class="[
                    'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                    currentPage === page
                      ? 'bg-primary dark:bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400'
                  ]"
                >
                  {{ page }}
                </button>
                <span
                  v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
                  class="px-2 text-gray-400 dark:text-gray-500 text-sm"
                  >...</span
                >
                <button
                  v-if="paginationPages[paginationPages.length - 1] < totalPages"
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
                    : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600'
                ]"
              >
                {{ $t('selanjutnya') }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    <!-- MODAL ACTIVATE -->
    <Teleport to="body">
      <Modal v-model="showActivateModal" :hideDefaultFooter="true" size="xl">
        <template #title>
          <div class="flex items-center gap-3 ml-5 mt-5 mb-3">
            <div class="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 p-3 rounded-full">
              <AlertTriangle class="w-5 h-5" />
            </div>
            <Heading variant="heading9b" class="text-sm font-semibold dark:text-white">
              {{ $t('log_modal_activate_title') }}
            </Heading>
          </div>
        </template>
        <div class="px-6 text-sm text-gray-600 dark:text-gray-300 space-y-4">
          <p>{{ $t('log_modal_activate_desc') }}</p>
          <textarea
            v-model="alertMessage"
            :placeholder="$t('log_modal_activate_placeholder')"
            rows="3"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
          ></textarea>
          <div
            class="flex items-center gap-5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm"
          >
            <AlertTriangle class="w-8 h-8 flex-shrink-0" />
            <span>{{ $t('log_modal_activate_warning') }}</span>
          </div>
        </div>
        <template #footer>
          <div
            class="flex justify-end border-t border-gray-300 dark:border-gray-700 w-full gap-3 px-5 pb-5 mt-6"
          >
            <button
              @click="showActivateModal = false"
              class="flex-1 px-5 py-2 text-sm border mt-5 border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition"
            >
              {{ $t('log_batal') }}
            </button>
            <button
              @click="activateAlert"
              :disabled="!alertMessage.trim() || loadingAlert"
              class="flex-1 px-5 py-2 text-sm mt-5 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loadingAlert ? $t('log_modal_activating') : $t('log_modal_activate_confirm') }}
            </button>
          </div>
        </template>
      </Modal>
    </Teleport>

    <!-- MODAL DEACTIVATE -->
    <Teleport to="body">
      <Modal v-model="showDeactivateModal" :hideDefaultFooter="true" size="xl">
        <template #title>
          <div class="flex items-center gap-3 ml-5 mt-5 mb-3">
            <div
              class="bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 p-3 rounded-full"
            >
              <AlertTriangle class="w-5 h-5" />
            </div>
            <Heading variant="heading9b" class="text-sm font-semibold dark:text-white">
              {{ $t('log_modal_deactivate_title') }}
            </Heading>
          </div>
        </template>
        <div class="px-6 text-sm text-gray-600 dark:text-gray-300 space-y-4">
          <p>{{ $t('log_modal_deactivate_desc') }}</p>
          <div
            class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
          >
            <div class="flex items-start gap-3">
              <AlertTriangle
                class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
              />
              <div class="text-sm text-yellow-800 dark:text-yellow-300">
                <p class="font-medium">{{ $t('log_modal_deactivate_current') }}</p>
                <p class="mt-1 italic">"{{ bsreAlert?.message }}"</p>
                <p class="mt-2 text-xs">
                  {{ $t('log_modal_deactivate_by') }} {{ bsreAlert?.activatedByName || '-' }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <div
            class="flex justify-end border-t border-gray-300 dark:border-gray-700 w-full gap-3 px-5 pb-5 mt-6"
          >
            <button
              @click="showDeactivateModal = false"
              class="flex-1 px-5 py-2 text-sm border mt-5 border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition"
            >
              {{ $t('log_batal') }}
            </button>
            <button
              @click="deactivateAlert"
              :disabled="loadingAlert"
              class="flex-1 px-5 py-2 text-sm mt-5 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800 text-white rounded-md font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ loadingAlert ? $t('log_modal_deactivating') : $t('log_modal_deactivate_confirm') }}
            </button>
          </div>
        </template>
      </Modal>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import Modal from '~/components/Modal.vue';
import { Search, AlertTriangle, ArrowUpDown, ChevronDown } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import type { DigsigLog } from '~/types/digsig';

definePageMeta({ middleware: 'auth' });

const { t } = useI18n();

// ─── Refs ──────────────────────────────────────
const rowsRef = ref<HTMLElement | null>(null);

/**
 * Single source of truth for rows per page.
 * Previously there were two separate refs (rowsPerPage & limitPerPage)
 * that were never synced — this caused the limit change to not apply.
 */
const rowsPerPage = ref(10);
const rowsChoices = [10, 25, 50, 100];
const showRowsDropdown = ref(false);

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('log_title'), to: '/digsig/log-digsig' }
]);

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
  showToastAlertPesanKosong,
  showToastAlertActivated,
  showToastAlertDeactivated
} = useDigsig();

// ─── State ─────────────────────────────────────
const searchQuery = ref('');
const currentPage = ref(1);
const showActivateModal = ref(false);
const showDeactivateModal = ref(false);
const alertMessage = ref('');
const sortKey = ref('tanggal');
const sortOrder = ref<'asc' | 'desc'>('desc');

// ─── Computed ──────────────────────────────────
const totalPages = computed(() => meta.value?.totalPages || 1);

const SORT_FIELD_MAP: Record<string, keyof DigsigLog> = {
  tanggal: 'tanggal',
  ipAddress: 'ipAddress',
  userName: 'userName',
  jenisNaskah: 'jenisNaskah',
  status: 'note'
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function highlight(text: string | null | undefined, keyword: string): string {
  const safeText = escapeHtml(String(text ?? '-'));
  const q = keyword.trim();
  if (!q) return safeText;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');

  return safeText.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-white rounded px-0.5">$1</mark>'
  );
}

/**
 * 1. Filter client-side: hanya cocokkan searchQuery pada userName & jenisNaskah.
 * 2. Sort hasil filter sesuai sortKey / sortOrder.
 */
const sortedLogs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();

  // Filter hanya pada dua field: userName dan jenisNaskah
  const filtered = q
    ? logs.value.filter(
        (row) =>
          (row.userName ?? '').toLowerCase().includes(q) ||
          (row.jenisNaskah ?? '').toLowerCase().includes(q)
      )
    : logs.value;

  if (!sortKey.value || !filtered.length) return filtered;
  const field = SORT_FIELD_MAP[sortKey.value];
  if (!field) return filtered;

  return [...filtered].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (field === 'tanggal') {
      return sortOrder.value === 'asc'
        ? new Date(aVal as string).getTime() - new Date(bVal as string).getTime()
        : new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
    }

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    return sortOrder.value === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });
});

const paginationPages = computed(() => {
  if (!meta.value) return [];
  const total = meta.value.totalPages;
  const current = meta.value.page;
  const pages: number[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else if (current <= 3) {
    for (let i = 1; i <= 5; i++) pages.push(i);
  } else if (current >= total - 2) {
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    for (let i = current - 1; i <= current + 1; i++) pages.push(i);
  }
  return pages;
});

// ─── Methods ───────────────────────────────────
const loadLogs = async () => {
  await fetchLogs({
    page: currentPage.value,
    limit: rowsPerPage.value, // always use the single ref
    search: searchQuery.value // backend filters userName & jenisNaskah only
  });
};

/**
 * Selecting a new rows-per-page value:
 * - updates the ref
 * - resets to page 1
 * - preserves the current sort (sortKey / sortOrder unchanged)
 * - reloads data
 */
const selectRowsPerPage = (n: number) => {
  rowsPerPage.value = n;
  showRowsDropdown.value = false;
  currentPage.value = 1;
  loadLogs();
};

const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadLogs();
  }
};

let searchTimeout: ReturnType<typeof setTimeout>;
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    loadLogs();
  }, 500);
};

// Click-outside for rows dropdown
const handleClickOutside = (e: MouseEvent) => {
  if (rowsRef.value && !rowsRef.value.contains(e.target as HTMLElement)) {
    showRowsDropdown.value = false;
  }
};

const openActivateModal = () => {
  alertMessage.value = '';
  showActivateModal.value = true;
};

const openDeactivateModal = () => {
  showDeactivateModal.value = true;
};

const activateAlert = async () => {
  if (!alertMessage.value.trim()) {
    showToastAlertPesanKosong();
    return;
  }
  try {
    await activateBsreAlert(alertMessage.value);
    showToastAlertActivated();
    showActivateModal.value = false;
  } catch (err: any) {
    console.error('❌ activateAlert error:', err);
  }
};

const deactivateAlert = async () => {
  try {
    await deactivateBsreAlert();
    showToastAlertDeactivated();
    showDeactivateModal.value = false;
  } catch (err: any) {
    console.error('❌ deactivateAlert error:', err);
  }
};

// ─── Formatters ────────────────────────────────
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

const getUserInitials = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

const statusClass = (status: string) =>
  status === 'sukses'
    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800';

// ─── Lifecycle ─────────────────────────────────
onMounted(() => {
  loadLogs();
  fetchBsreHealth();
  fetchBsreAlert();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.overflow-x-auto::-webkit-scrollbar {
  height: 8px;
}
.overflow-x-auto::-webkit-scrollbar-track {
  border-radius: 10px;
}
.overflow-x-auto::-webkit-scrollbar-thumb {
  border-radius: 10px;
}

.filter-dd-enter-active,
.filter-dd-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
