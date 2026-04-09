<template>
  <div class="pt-5 bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-2">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-white">
          {{ t('pt_title') }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <button
        @click="openAdd"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        {{ t('pt_add_button') }}
      </button>
    </div>

    <!-- MODAL ADD / EDIT -->
    <Teleport to="body">
      <Modal v-model="showAddModal" @save="saveAdd" size="xl">
        <template #title>
          <div class="ml-5 mb-3 mt-3">
            <Heading variant="heading9b" class="font-semibold text-sm dark:text-white">
              {{ isEditMode ? t('pt_modal_title_edit') : t('pt_modal_title_add') }}
            </Heading>
          </div>
        </template>

        <div class="flex flex-col gap-1">
          <!-- Tautan Panjang -->
          <div class="flex flex-col gap-1">
            <Heading variant="body2m" class="dark:text-gray-200">
              {{ t('pt_label_long_url') }}<span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="addForm.LUrl"
              type="text"
              :placeholder="t('pt_placeholder_long_url')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                formErrors.LUrl
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.LUrl = false"
            />
            <p v-if="formErrors.LUrl" class="text-xs text-red-500 mt-1">
              {{ t('pt_label_long_url') }}
            </p>
          </div>

          <!-- Bagian Belakang Tautan -->
          <div class="flex flex-col gap-1">
            <Heading variant="body2m" class="dark:text-gray-200">
              {{ t('pt_label_short_url') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="addForm.SUrl"
              type="text"
              :placeholder="t('pt_placeholder_short_url')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                formErrors.SUrl
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.SUrl = false"
            />
            <p v-if="formErrors.SUrl" class="text-xs text-red-500 mt-1">
              {{ t('pt_label_short_url') }}
            </p>
          </div>

          <!-- Keterangan -->
          <div class="flex flex-col gap-1">
            <Heading variant="body2m" class="dark:text-gray-200">
              {{ t('pt_label_keterangan') }}
            </Heading>
            <input
              v-model="addForm.keterangan"
              type="text"
              :placeholder="t('pt_placeholder_keterangan')"
              class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- TABLE CARD -->
    <div
      class="flex flex-col mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <!-- TOOLBAR -->
      <div
        class="flex flex-wrap gap-2 p-3 items-center border-b border-gray-200 dark:border-gray-700"
      >
        <!-- Rows per page -->
        <div class="relative">
          <button
            type="button"
            @click="openRowsDropdown = !openRowsDropdown"
            class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
          >
            <span>{{ perPage }}</span>
            <ChevronDown
              class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': openRowsDropdown }"
            />
          </button>
          <Transition name="filter-dd">
            <div
              v-if="openRowsDropdown"
              class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            >
              <button
                v-for="n in rowsChoices"
                :key="n"
                type="button"
                @click="
                  perPage = n;
                  openRowsDropdown = false;
                  currentPage = 1;
                "
                :class="[
                  'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                  perPage === n
                    ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                    : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                ]"
              >
                {{ n }}
              </button>
            </div>
          </Transition>
        </div>

        <button
          @click="toggleSort"
          class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition"
          title="Urutkan"
        >
          <ArrowUpDown class="w-4 h-4" />
        </button>

        <button
          @click="refreshData"
          class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition"
          :disabled="isRefreshing"
          title="Refresh"
        >
          <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
        </button>

        <div class="relative flex-1 min-w-40">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="search"
            :placeholder="t('pt_search_placeholder')"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>
      </div>

      <!-- TABLE WRAPPER -->
      <div class="w-full overflow-x-auto">
        <table class="w-full text-sm border-collapse table-fixed">
          <colgroup>
            <col style="width: 110px" />
            <!-- Tanggal -->
            <col style="width: 25%" />
            <!-- URL Asli -->
            <col style="width: 22%" />
            <!-- URL Modifikasi -->
            <col style="width: 80px" />
            <!-- Salin -->
            <col />
            <!-- Keterangan (flex) -->
            <col style="width: 90px" />
            <!-- Aksi -->
          </colgroup>

          <thead class="bg-primary dark:bg-primary-700 text-white sticky top-0 z-10">
            <tr>
              <th class="px-4 py-3 text-left font-semibold whitespace-nowrap">
                {{ t('pt_col_tanggal') }}
              </th>
              <th class="px-4 py-3 text-left font-semibold">{{ t('pt_col_original') }}</th>
              <th class="px-4 py-3 text-left font-semibold">{{ t('pt_col_modified') }}</th>
              <th class="px-4 py-3 text-center font-semibold whitespace-nowrap"></th>
              <th class="px-4 py-3 text-left font-semibold">{{ t('pt_col_keterangan') }}</th>
              <th class="px-4 py-3 text-center font-semibold whitespace-nowrap">
                {{ t('pt_col_aksi') }}
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- SKELETON LOADING -->
            <template v-if="loading">
              <tr
                v-for="i in 5"
                :key="'skeleton-' + i"
                class="animate-pulse border-b border-gray-200 dark:border-gray-700"
              >
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-2">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </td>
              </tr>
            </template>

            <!-- DATA ROWS -->
            <template v-else>
              <tr
                v-for="(row, index) in paginatedData"
                :key="index"
                class="hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 transition"
              >
                <!-- Tanggal -->
                <td class="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-white text-xs">
                  {{
                    new Date(row.tanggal).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  }}
                </td>

                <!-- URL Asli -->
                <td class="px-4 py-3">
                  <a
                    :href="row.LUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary-600 dark:text-primary-400 underline hover:text-primary-800 dark:hover:text-primary-300 transition break-all line-clamp-2"
                    :title="row.LUrl"
                    v-html="highlight(truncateUrl(row.LUrl, 50), search)"
                  >
                  </a>
                </td>

                <!-- URL Modifikasi -->
                <td class="px-4 py-3">
                  <span
                    class="font-mono text-xs text-gray-900 dark:text-white break-all"
                    :title="row.SUrl"
                    v-html="highlight(row.SUrl, search)"
                  >
                  </span>
                </td>

                <!-- Kolom Salin (terpisah) -->
                <td class="px-4 py-3 text-center">
                  <button
                    class="p-1.5 rounded hover:bg-primary-100 dark:hover:bg-gray-600 transition inline-flex items-center justify-center"
                    :title="t('pt_toast_copied') ?? 'Salin'"
                    @click="copyShortUrl(row.SUrl)"
                  >
                    <Copy class="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  </button>
                </td>

                <!-- Keterangan -->
                <td
                  class="px-4 py-3 text-gray-700 dark:text-gray-300 text-sm break-words"
                  v-html="highlight(row.keterangan || '-', search)"
                ></td>

                <!-- Aksi -->
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <!-- EDIT -->
                    <button
                      class="p-2 rounded hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition"
                      @click="openEdit(row, index)"
                      :title="t('tit_tooltip_edit')"
                    >
                      <Pencil class="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </button>

                    <!-- DELETE -->
                    <button
                      class="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                      @click="openDeleteConfirm(index)"
                      :title="t('popup_hapus')"
                    >
                      <Trash2 class="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>

              <!-- EMPTY STATE -->
              <tr v-if="filteredData.length === 0">
                <td colspan="6" class="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                  {{ t('pt_empty') }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!-- CONFIRM DELETE POPUP -->
        <ConfirmPopup
          v-model="showDeleteConfirm"
          type="danger"
          :title="t('pt_delete_title')"
          :message="`${t('pt_delete_title').replace('?', '')} ${data[deleteIndex]?.SUrl}?`"
          :confirm-text="t('pt_delete_confirm')"
          :cancel-text="t('pt_delete_cancel')"
          @confirm="confirmDelete"
        />
      </div>

      <!-- PAGINATION -->
      <div
        v-if="totalItems > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {{ t('menampilkan') }} {{ paginatedData.length }} {{ t('dari') }} {{ totalItems }}
          {{ t('data') }}
        </div>

        <div class="flex items-center gap-2">
          <!-- BACK -->
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900'
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
            {{ t('sebelumnya') }}
          </button>

          <!-- PAGE NUMBERS -->
          <div class="flex items-center gap-1">
            <!-- FIRST -->
            <button
              v-if="paginationPages[0] > 1"
              @click="currentPage = 1"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >
              1
            </button>

            <!-- DOTS LEFT -->
            <span
              v-if="paginationPages[0] > 2"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <!-- WINDOW -->
            <button
              v-for="page in paginationPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                currentPage === page
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary'
              ]"
            >
              {{ page }}
            </button>

            <!-- DOTS RIGHT -->
            <span
              v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
              class="px-2 text-gray-400 dark:text-gray-500 text-sm"
            >
              ...
            </span>

            <!-- LAST -->
            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <!-- NEXT -->
          <button
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === totalPages
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900'
            ]"
          >
            {{ t('selanjutnya') }}
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
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  Search,
  ArrowUpDown,
  RotateCcw,
  Plus,
  Copy,
  Trash2,
  Pencil,
  ChevronDown
} from 'lucide-vue-next';
import Heading from '~/components/Heading.vue';
import ConfirmPopup from '@/components/ConfirmPopup.vue';
import { useUrl } from '~/composables/useUrl';
import { useI18n } from 'vue-i18n';

definePageMeta({
  middleware: 'auth'
});

const { t } = useI18n();
const toast = useToast();
const { data, total, isLoading, fetchShortUrls, createShortUrl, updateShortUrl, deleteShortUrl } =
  useUrl();

// ─── Types ────────────────────────────────────────────────────────────────────
type Payment = {
  id?: number;
  tanggal: string;
  LUrl: string;
  SUrl: string;
  alias?: string;
  keterangan: string;
};

// ─── State ────────────────────────────────────────────────────────────────────
const loading = computed(() => isLoading.value);
const isRefreshing = ref(false);
const search = ref('');
const sortOrder = ref<'asc' | 'desc'>('desc');
const showAddModal = ref(false);
const isEditMode = ref(false);
const editIndex = ref<number | null>(null);
const editItemId = ref<number | null>(null);
const showDeleteConfirm = ref(false);
const deleteIndex = ref<number | null>(null);

const addForm = ref({
  LUrl: '',
  SUrl: '',
  keterangan: ''
});

const formErrors = ref({
  LUrl: false,
  SUrl: false
});

// ─── Pagination ───────────────────────────────────────────────────────────────
const currentPage = ref(1);
const perPage = ref(10);
const rowsChoices = [5, 10, 20, 50];
const openRowsDropdown = ref(false);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateRandomString = (length = 5) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const truncateUrl = (url: string, max = 50) => {
  if (!url) return '';
  return url.length > max ? url.slice(0, max) + '.....' : url;
};

const isValidHttpsUrl = (url: string) => {
  const normalizedUrl = url.trim();
  if (!normalizedUrl.toLowerCase().startsWith('https://')) return false;

  try {
    const parsed = new URL(normalizedUrl);
    return parsed.protocol === 'https:' && !!parsed.hostname;
  } catch {
    return false;
  }
};

const fallbackCopyText = (text: string) => {
  if (typeof document === 'undefined') return false;

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  textArea.style.pointerEvents = 'none';

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);
  return copied;
};

const copyShortUrl = async (shortUrl: string) => {
  if (!shortUrl) return;

  let copied = false;

  if (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      copied = true;
    } catch (err) {
      console.error('Clipboard API gagal, mencoba fallback.', err);
    }
  }

  if (!copied) {
    copied = fallbackCopyText(shortUrl);
  }

  if (copied) {
    toast.add({
      title: t('pt_toast_copied'),
      color: 'success',
      icon: 'i-lucide-copy'
    });
    return;
  }

  toast.add({
    title: t('gagal'),
    description: 'URL gagal disalin. Coba salin manual.',
    color: 'error',
    icon: 'i-lucide-alert-circle'
  });
};

// ─── Data fetching ────────────────────────────────────────────────────────────
const fetchData = async () => {
  await fetchShortUrls({
    page: 0,
    size: 10,
    orderby: 'udate',
    sortby: sortOrder.value,
    cari: search.value
  });
};

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc';
  fetchData();
};

const refreshData = async () => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  try {
    await fetchData();
  } catch (err) {
    console.error('Gagal refresh data', err);
  } finally {
    isRefreshing.value = false;
  }
};

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredData = computed(() => {
  if (!search.value) return data.value;
  const keyword = search.value.toLowerCase();
  return data.value.filter((item) =>
    [item.LUrl, item.SUrl, item.keterangan].join(' ').toLowerCase().includes(keyword)
  );
});

const sortedData = computed(() => filteredData.value);

const totalItems = computed(() => sortedData.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / perPage.value));

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return sortedData.value.slice(start, start + perPage.value);
});

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, 5);
    } else if (current >= total - 2) {
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(current - 1, current, current + 1);
    }
  }
  return pages;
});

// ─── Add / Edit ───────────────────────────────────────────────────────────────
const openAdd = () => {
  isEditMode.value = false;
  editIndex.value = null;
  editItemId.value = null;
  addForm.value = { LUrl: '', SUrl: '', keterangan: '' };
  formErrors.value = { LUrl: false, SUrl: false };
  showAddModal.value = true;
};

const openEdit = (row: Payment, index: number) => {
  isEditMode.value = true;
  editIndex.value = index;
  editItemId.value = row.id ?? null;
  addForm.value = {
    LUrl: row.LUrl,
    SUrl: row.alias ?? '',
    keterangan: row.keterangan
  };
  formErrors.value = { LUrl: false, SUrl: false };
  showAddModal.value = true;
};

const saveAdd = async () => {
  // Reset errors
  formErrors.value = { LUrl: false, SUrl: false };

  // Validation
  const emptyFields: string[] = [];

  if (!addForm.value.LUrl || !addForm.value.LUrl.trim()) {
    formErrors.value.LUrl = true;
    emptyFields.push('Tautan Panjang');
  }

  if (!addForm.value.SUrl || !addForm.value.SUrl.trim()) {
    formErrors.value.SUrl = true;
    emptyFields.push('Bagian Belakang Tautan');
  }

  if (emptyFields.length > 0) {
    toast.add({
      title: t('gagal'),
      description: `${emptyFields.join(', ')} wajib diisi`,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
    return;
  }

  const normalizedLongUrl = addForm.value.LUrl.trim();
  if (!isValidHttpsUrl(normalizedLongUrl)) {
    formErrors.value.LUrl = true;
    toast.add({
      title: t('gagal'),
      description: 'link tidak valid',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
    return;
  }

  addForm.value.LUrl = normalizedLongUrl;

  const alias = addForm.value.SUrl;

  try {
    if (isEditMode.value && editItemId.value !== null) {
      await updateShortUrl({
        id: editItemId.value,
        url: addForm.value.LUrl,
        keterangan: addForm.value.keterangan,
        alias
      });
      toast.add({ title: t('pt_toast_updated'), color: 'success', icon: 'i-lucide-circle-check' });
    } else {
      await createShortUrl({
        url: addForm.value.LUrl,
        keterangan: addForm.value.keterangan,
        alias
      });
      toast.add({ title: t('pt_toast_added'), color: 'success', icon: 'i-lucide-circle-check' });
    }
    await fetchData();
  } catch (err: any) {
    toast.add({
      title: err?.response?.data?.message ?? t('pt_toast_save_failed'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
  } finally {
    showAddModal.value = false;
    isEditMode.value = false;
    editIndex.value = null;
    editItemId.value = null;
    addForm.value = { LUrl: '', SUrl: '', keterangan: '' };
    formErrors.value = { LUrl: false, SUrl: false };
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────
const openDeleteConfirm = (index: number) => {
  deleteIndex.value = index;
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (deleteIndex.value !== null) {
    const item = data.value[deleteIndex.value];
    try {
      await deleteShortUrl(item.id);
      toast.add({ title: t('pt_toast_deleted'), color: 'success', icon: 'i-lucide-circle-check' });
      await fetchData();
    } catch (err: any) {
      toast.add({
        title: err?.response?.data?.message ?? t('pt_toast_delete_failed'),
        color: 'error',
        icon: 'i-lucide-alert-circle'
      });
    }
  }
  showDeleteConfirm.value = false;
  deleteIndex.value = null;
};

// ─── Search debounce ──────────────────────────────────────────────────────────
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(search, () => {
  currentPage.value = 1;
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchData(), 400);
});

watch(perPage, () => {
  currentPage.value = 1;
});

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => fetchData());

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('pt_title'), to: '/penyingkat-tautan' }
]);

// ─── Highlight Function ───────────────────────────────────────────────────────
function highlight(text: string, keyword: string): string {
  if (!keyword || !text) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-white rounded px-0.5">$1</mark>'
  );
}
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.filter-dd-enter-active,
.filter-dd-leave-active {
  transition: all 0.2s ease;
}

.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
