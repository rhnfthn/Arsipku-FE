<template>
  <div class="space-y-6 pt-5 dark:bg-gray-900 min-h-screen transition-colors">
    <EmptyState
      v-if="!canViewMaster"
      icon="i-lucide-lock"
      title="Akses Ditolak"
      description="Anda tidak punya izin melihat master data. Hubungi administrator."
    />
    <div v-else class="min-h-screen">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
        <!-- Left Section - Title & Breadcrumb -->
        <PageHeader :title="t('ka_title')" :items="items" />
        <button
          v-if="isSuperadmin || hasPermission('master-data', 'create')"
          @click="openAddModal"
          class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white space-y-6 px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition-colors"
        >
          <Plus class="w-4 h-4" />
          {{ t('nm_button') }}
        </button>
      </div>

      <!-- CARD TABLE -->
      <div
        class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
      >
        <!-- TOOLBAR (TIDAK ikut scroll) -->
        <div
          class="rounded-lg shadow-sm sticky left-0 z-40 bg-white dark:bg-gray-800 flex flex-wrap gap-2 items-center p-3 border-b border-gray-200 dark:border-gray-700 transition-colors"
        >
          <!-- Rows per page (custom dropdown) -->
          <div class="relative">
            <button
              type="button"
              @click="openRowsDropdown = !openRowsDropdown"
              class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
            >
              <span>{{ perPage }}</span>
              <ChevronDown
                class="w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200"
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

          <!-- Refresh -->
          <button
            @click="fetchKlasifikasi"
            class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition-colors"
            title="Refresh"
          >
            <RotateCcw class="w-4 h-4" />
          </button>

          <!-- Search -->
          <div class="relative flex-1 min-w-40">
            <Search
              class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            />
            <input
              v-model="search"
              :placeholder="t('ka_cari_placeholder')"
              class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
            />
          </div>

          <!-- Export -->
          <button
            class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-4 rounded-lg hover:bg-primary-500 dark:hover:bg-primary-700 text-xs transition-colors whitespace-nowrap"
            @click="onExport"
          >
            Export
          </button>
        </div>

        <!-- TABLE -->
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-primary-400 dark:bg-primary-700 text-white">
              <tr>
                <th
                  @click="toggleSortKlasifikasi"
                  class="px-4 py-3 text-left cursor-pointer select-none flex items-center gap-2"
                >
                  {{ t('ka_kode') }}
                  <ArrowUpDown
                    class="w-4 h-4 transition-transform duration-300"
                    :class="{
                      'rotate-180': sortKlasifikasi === 'desc',
                      'rotate-0': sortKlasifikasi !== 'desc'
                    }"
                  />
                </th>
                <th class="px-4 py-3 text-left">{{ t('ka_nama') }}</th>
                <th class="px-4 py-3 text-left">{{ t('ka_deskripsi') }}</th>
                <th class="px-4 py-3 text-center">{{ t('aksi') }}</th>
              </tr>
            </thead>

            <tbody>
              <!-- LOADING - Skeleton -->
              <tr v-if="loading">
                <td colspan="4" class="px-4 py-6">
                  <div class="space-y-4 animate-pulse">
                    <div
                      v-for="n in skeletonRows"
                      :key="'skeleton-' + n"
                      class="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-700"
                    />
                  </div>
                </td>
              </tr>

              <!-- EMPTY -->
              <tr v-else-if="klasifikasiList.length === 0">
                <td colspan="4" class="py-6 text-center text-gray-500 dark:text-gray-400">
                  {{ t('ka_empty') }}
                </td>
              </tr>

              <!-- ROW -->
              <tr
                v-for="(row, idx) in paginatedKlasifikasi"
                :key="row.id"
                :class="[
                  'border-b border-b-gray-200 dark:border-b-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors',
                  idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-800'
                ]"
              >
                <td class="px-4 py-3 font-semibold">
                  <span
                    class="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs"
                    v-html="highlight(row.klasifikasi, search)"
                  >
                  </span>
                </td>

                <td
                  class="px-4 py-3 text-gray-900 dark:text-white"
                  v-html="highlight(row.klasifikasi_text, search)"
                ></td>

                <td
                  class="px-4 py-3 text-gray-600 dark:text-gray-300"
                  v-html="highlight(row.deskripsi ?? '-', search)"
                ></td>

                <td class="px-4 py-3">
                  <div class="flex justify-center gap-3">
                    <button
                      v-if="isSuperadmin || hasPermission('master-data', 'update')"
                      class="text-yellow-500 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 p-2 rounded-lg transition-colors group"
                      title="Edit"
                      @click="onEdit(row)"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>

                    <button
                      v-if="isSuperadmin || hasPermission('master-data', 'delete')"
                      class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group text-red-600 dark:text-red-500"
                      title="Delete"
                      @click="onDelete(row)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PAGINATION -->
        <div
          v-if="totalItems > 0"
          class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="text-xs text-gray-600 dark:text-gray-400">
            {{ t('menampilkan') }} {{ paginatedKlasifikasi.length }} {{ t('dari') }}
            {{ totalItems }} {{ t('data') }}
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
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL DETAIL -->
      <Teleport to="body">
        <div
          v-if="showDetail"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
          <div
            class="bg-white dark:bg-gray-800 rounded-2xl w-[520px] max-w-[90vw] transition-colors"
          >
            <!-- HEADER -->
            <div
              class="flex justify-between items-center p-4 border-b border-b-gray-200 dark:border-b-gray-700"
            >
              <Heading variant="heading9sb" class="dark:text-white">
                {{ t('ka_modal_detail') }}
              </Heading>
              <button
                @click="showDetail = false"
                class="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- BODY -->
            <div class="p-5 space-y-6 text-sm">
              <!-- KODE KLASIFIKASI -->
              <div class="flex gap-3 items-start">
                <Hash class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-1" />
                <div class="flex-1">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('ka_kode') }}
                  </p>
                  <div class="mt-2">
                    <span
                      class="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-sm"
                    >
                      {{ detail?.klasifikasi }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- NAMA KLASIFIKASI -->
              <div class="flex gap-3 items-start">
                <FileText class="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
                <div class="flex-1">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('ka_nama') }}
                  </p>
                  <p class="mt-2 text-sm font-medium text-black dark:text-white">
                    {{ detail?.klasifikasi_text }}
                  </p>
                </div>
              </div>

              <!-- DESKRIPSI -->
              <div class="flex gap-3 items-start">
                <ChartNoAxesGantt class="w-5 h-5 text-orange-500 dark:text-orange-400 mt-1" />
                <div class="flex-1">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('ka_deskripsi') }}
                  </p>
                  <p class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">
                    {{ detail?.deskripsi ?? '-' }}
                  </p>
                </div>
              </div>

              <!-- TANGGAL DIBUAT -->
              <div class="flex gap-3 items-start">
                <Calendar class="w-5 h-5 text-cyan-600 dark:text-cyan-400 mt-1" />
                <div class="flex-1">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ t('ka_tgl_dibuat') }}
                  </p>
                  <p class="mt-2 text-sm text-gray-900 dark:text-gray-200">-</p>
                </div>
              </div>
            </div>

            <!-- FOOTER -->
            <div class="border-t border-t-gray-200 dark:border-t-gray-700 p-4">
              <button
                @click="showDetail = false"
                class="w-full px-3 py-2 rounded-lg bg-primary hover:bg-primary-700 text-white font-medium transition-colors"
              >
                {{ t('ka_tutup') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- MODAL TAMBAH KLASIFIKASI -->
      <Teleport to="body">
        <Modal
          v-model="showAddModal"
          :saving="savingAdd"
          size="xl"
          @save="submitAddKlasifikasi"
          @close="resetAddForm"
        >
          <template #title>
            <Heading
              variant="heading9b"
              class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white"
            >
              {{ t('ka_modal_add') }}
            </Heading>
          </template>

          <div class="space-y-5 p-1">
            <!-- KODE KLASIFIKASI -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_kode') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="addForm.klasifikasi"
                type="text"
                :placeholder="t('ka_kode_placeholder')"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                  addFormErrors.klasifikasi
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="addFormErrors.klasifikasi = false"
              />
              <p v-if="addFormErrors.klasifikasi" class="text-xs text-red-500 mt-1">
                {{ t('ka_kode') }}
              </p>
            </div>

            <!-- NAMA KLASIFIKASI -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_nama') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="addForm.klasifikasi_text"
                type="text"
                :placeholder="t('ka_nama_placeholder')"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                  addFormErrors.klasifikasi_text
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="addFormErrors.klasifikasi_text = false"
              />
              <p v-if="addFormErrors.klasifikasi_text" class="text-xs text-red-500 mt-1">
                {{ t('ka_nama') }}
              </p>
            </div>

            <!-- DESKRIPSI -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_deskripsi') }}
              </Heading>
              <textarea
                v-model="addForm.deskripsi"
                rows="4"
                :placeholder="t('ka_deskripsi_placeholder')"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ t('ka_deskripsi_hint') }}
              </p>
            </div>

            <!-- LOADING INFO -->
            <p v-if="savingAdd" class="text-xs text-gray-500 dark:text-gray-400">
              {{ t('ka_saving') }}
            </p>
          </div>
        </Modal>
      </Teleport>

      <!-- MODAL EDIT KLASIFIKASI -->
      <Teleport to="body">
        <Modal v-model="showEditModal" :saving="savingEdit" size="xl" @save="submitEditKlasifikasi">
          <template #title>
            <Heading
              variant="heading9b"
              class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white"
            >
              {{ t('ka_modal_edit') }}
            </Heading>
          </template>

          <div class="space-y-5 p-1">
            <!-- KODE -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_kode') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="editForm.klasifikasi"
                type="text"
                :placeholder="t('ka_kode_placeholder')"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                  editFormErrors.klasifikasi
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="editFormErrors.klasifikasi = false"
              />
              <p v-if="editFormErrors.klasifikasi" class="text-xs text-red-500 mt-1">
                {{ t('ka_kode') }}
              </p>
            </div>

            <!-- NAMA -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_nama') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="editForm.klasifikasi_text"
                type="text"
                :placeholder="t('ka_nama_placeholder')"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                  editFormErrors.klasifikasi_text
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="editFormErrors.klasifikasi_text = false"
              />
              <p v-if="editFormErrors.klasifikasi_text" class="text-xs text-red-500 mt-1">
                {{ t('ka_nama') }}
              </p>
            </div>

            <!-- DESKRIPSI -->
            <div class="flex flex-col gap-1">
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('ka_deskripsi') }} <span class="text-red-500">*</span>
              </Heading>
              <textarea
                v-model="editForm.deskripsi"
                rows="4"
                :placeholder="t('ka_deskripsi_placeholder')"
                class="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ t('ka_deskripsi_hint') }}
              </p>
            </div>
          </div>
          <p v-if="savingEdit" class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('ka_saving') }}
          </p>
        </Modal>
      </Teleport>

    <ConfirmDialog
      v-model="showDeletePopup"
      type="danger"
      :title="t('ka_pop_title')"
      :message="deleteMessage"
      :confirm-text="t('popup_hapus')"
      :cancel-text="t('popup_batal')"
      :is-loading="deleting"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import {
  Eye,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  X,
  Plus,
  FileDown,
  FileText,
  Hash,
  ChartNoAxesGantt,
  Calendar,
  ArrowUpDown,
  ChevronDown
} from 'lucide-vue-next';
import type { BreadcrumbItem } from '@nuxt/ui';
import type { Klasifikasi } from '~/types/klasifikasi';
import { useKlasifikasi } from '~/composables/useKlasifikasi';
import Modal from '@/components/Modal.vue';
import ConfirmDialog from '@/components/ConfirmPopup.vue';

definePageMeta({
  middleware: 'auth'
});

const { hasPermission, isSuperadmin } = useAuth();

const canViewMaster = computed(() => hasPermission('master-data', 'read'));

// ─────────────────────────────────────────────
// i18n — pakai useI18n() yang sudah diatur Navbar
// ─────────────────────────────────────────────
const { t, locale } = useI18n();

// ─────────────────────────────────────────────
// BREADCRUMB (reaktif terhadap bahasa)
// ─────────────────────────────────────────────
const items = computed<BreadcrumbItem[]>(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('ka_title'), to: '/master/klasifikasi' }
]);

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
import { useToast } from '#imports';

const toast = useToast();

const showToast = (opt: {
  title: string;
  message?: string;
  color?: 'primary' | 'neutral' | 'secondary' | 'warning' | 'error' | 'success';
  icon?: string;
}) => {
  toast.add({
    title: opt.title,
    description: opt.message,
    color: opt.color ?? 'primary',
    icon: opt.icon ?? 'i-lucide-info'
  });
};

// ─────────────────────────────────────────────
// COMPOSABLE
// ─────────────────────────────────────────────
const {
  getKlasifikasi,
  getKlasifikasiDetail,
  createKlasifikasi,
  updateKlasifikasi,
  deleteKlasifikasi
} = useKlasifikasi();

// ─────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────
const klasifikasiList = ref<Klasifikasi[]>([]);
const loading = ref(false);
const search = ref('');

const fetchKlasifikasi = async () => {
  loading.value = true;
  try {
    klasifikasiList.value = await getKlasifikasi();
    currentPage.value = 1;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchKlasifikasi);

// ─────────────────────────────────────────────
// DETAIL
// ─────────────────────────────────────────────
const showDetail = ref(false);
const detail = ref<Klasifikasi | null>(null);

const onView = async (row: Klasifikasi) => {
  showDetail.value = true;
  detail.value = null;
  try {
    const res = await getKlasifikasiDetail(row.id);
    detail.value = (res as any).data ?? res;
  } catch (e) {
    console.error('Gagal ambil detail', e);
  }
};

// ─────────────────────────────────────────────
// ADD
// ─────────────────────────────────────────────
const showAddModal = ref(false);
const savingAdd = ref(false);

const addForm = ref({
  klasifikasi: '',
  klasifikasi_text: '',
  deskripsi: ''
});

const addErrors = ref<Record<string, string>>({});

const addFormErrors = ref({
  klasifikasi: false,
  klasifikasi_text: false
});

const openAddModal = () => {
  resetAddForm();
  showAddModal.value = true;
};

const resetAddForm = () => {
  addErrors.value = {};
  addForm.value = { klasifikasi: '', klasifikasi_text: '', deskripsi: '' };
  addFormErrors.value = { klasifikasi: false, klasifikasi_text: false };
};

const validateAdd = () => {
  addFormErrors.value.klasifikasi = !addForm.value.klasifikasi.trim();
  addFormErrors.value.klasifikasi_text = !addForm.value.klasifikasi_text.trim();

  const emptyFields: string[] = [];
  if (addFormErrors.value.klasifikasi) emptyFields.push(t('ka_kode'));
  if (addFormErrors.value.klasifikasi_text) emptyFields.push(t('ka_nama'));

  if (emptyFields.length > 0) {
    showToast({
      title: t('gagal'),
      message: `${emptyFields.join(', ')} wajib diisi`,
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return false;
  }
  return true;
};

const submitAddKlasifikasi = async () => {
  if (savingAdd.value) return;
  if (!validateAdd()) return;
  try {
    savingAdd.value = true;
    await createKlasifikasi({
      company: '10000',
      klasifikasi: addForm.value.klasifikasi,
      klasifikasi_text: addForm.value.klasifikasi_text,
      deskripsi: addForm.value.deskripsi || null
    });
    showAddModal.value = false;
    await fetchKlasifikasi();
    showToast({
      title: t('berhasil'),
      message: t('ka_success_add'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    });
  } catch (e) {
    console.error('Gagal tambah klasifikasi:', e);
    showToast({
      title: t('gagal'),
      message: t('ka_err_add'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
  } finally {
    savingAdd.value = false;
  }
};

// ─────────────────────────────────────────────
// EDIT
// ─────────────────────────────────────────────
const showEditModal = ref(false);
const savingEdit = ref(false);
const editId = ref<string | null>(null);

const editForm = ref({
  klasifikasi: '',
  klasifikasi_text: '',
  deskripsi: ''
});

const editErrors = ref<Record<string, string>>({});

const editFormErrors = ref({
  klasifikasi: false,
  klasifikasi_text: false
});

const validateEdit = () => {
  editFormErrors.value.klasifikasi = !editForm.value.klasifikasi.trim();
  editFormErrors.value.klasifikasi_text = !editForm.value.klasifikasi_text.trim();

  const emptyFields: string[] = [];
  if (editFormErrors.value.klasifikasi) emptyFields.push(t('ka_kode'));
  if (editFormErrors.value.klasifikasi_text) emptyFields.push(t('ka_nama'));

  if (emptyFields.length > 0) {
    showToast({
      title: t('gagal'),
      message: `${emptyFields.join(', ')} wajib diisi`,
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return false;
  }
  return true;
};

const onEdit = async (row: Klasifikasi) => {
  try {
    showEditModal.value = true;
    savingEdit.value = false;
    editErrors.value = {};
    editFormErrors.value = { klasifikasi: false, klasifikasi_text: false };
    editId.value = row.id;
    editForm.value = { klasifikasi: '', klasifikasi_text: '', deskripsi: '' };

    const res = await getKlasifikasiDetail(row.id);
    const data = (res as any).data ?? res;
    editForm.value.klasifikasi = data.klasifikasi || '';
    editForm.value.klasifikasi_text = data.klasifikasi_text || '';
    editForm.value.deskripsi = data.deskripsi || '';
  } catch (e) {
    console.error('Gagal ambil data edit klasifikasi:', e);
    alert('Gagal memuat data edit');
    showEditModal.value = false;
  }
};

const submitEditKlasifikasi = async () => {
  if (savingEdit.value) return;
  if (!editId.value) return;
  if (!validateEdit()) return;
  try {
    savingEdit.value = true;
    await updateKlasifikasi(editId.value, {
      company: '10000',
      klasifikasi: editForm.value.klasifikasi,
      klasifikasi_text: editForm.value.klasifikasi_text,
      deskripsi: editForm.value.deskripsi || null
    });
    showEditModal.value = false;
    editId.value = null;
    await fetchKlasifikasi();
    showToast({
      title: t('berhasil'),
      message: t('ka_success_edit'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    });
  } catch (e) {
    console.error('Gagal update klasifikasi:', e);
    showToast({
      title: t('gagal'),
      message: t('ka_err_edit'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
  } finally {
    savingEdit.value = false;
  }
};

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
const showDeletePopup = ref(false);
const deleting = ref(false);
const deleteTarget = ref<Klasifikasi | null>(null);

const onDelete = (row: Klasifikasi) => {
  deleteTarget.value = row;
  showDeletePopup.value = true;
};

const confirmDelete = async () => {
  if (!deleteTarget.value) return;
  try {
    deleting.value = true;
    await deleteKlasifikasi(deleteTarget.value.id);
    showDeletePopup.value = false;
    showToast({
      title: t('berhasil'),
      message: t('ka_success_delete'),
      color: 'error',
      icon: 'i-lucide-check-circle'
    });
    deleteTarget.value = null;
    await fetchKlasifikasi();
  } catch (e) {
    console.error('Gagal menghapus klasifikasi:', e);
    showToast({
      title: t('gagal'),
      message: t('ka_err_delete'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    });
  } finally {
    deleting.value = false;
  }
};

const cancelDelete = () => {
  showDeletePopup.value = false;
  deleteTarget.value = null;
};

const deleteMessage = computed(() => {
  if (!deleteTarget.value) return '';
  return locale.value === 'id'
    ? `Yakin ingin menghapus klasifikasi "${deleteTarget.value.klasifikasi_text}"? ${t('ka_pop_desc')}`
    : `Are you sure you want to delete classification "${deleteTarget.value.klasifikasi_text}"? ${t('ka_pop_desc')}`;
});

// ─────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────
const currentPage = ref(1);
const perPage = ref(10);
const rowsChoices = [5, 10, 20, 50];
const openRowsDropdown = ref(false);

const totalItems = computed(() => filteredKlasifikasi.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / perPage.value));

const paginatedKlasifikasi = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  const end = start + perPage.value;
  return filteredKlasifikasi.value.slice(start, end);
});

const skeletonRows = computed(() => perPage.value);

const paginationPages = computed(() => {
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, currentPage.value - half);
  let end = Math.min(totalPages.value, start + windowSize - 1);
  if (end - start < windowSize - 1) {
    start = Math.max(1, end - windowSize + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

watch(klasifikasiList, () => {
  currentPage.value = 1;
});

// ─────────────────────────────────────────────
// SEARCH & SORT
// ─────────────────────────────────────────────
const sortKlasifikasi = ref<'asc' | 'desc' | null>(null);

const filteredKlasifikasi = computed(() => {
  let data = [...klasifikasiList.value];

  if (search.value.trim()) {
    const s = search.value.toLowerCase();
    data = data.filter(
      (row) =>
        row.klasifikasi.toLowerCase().includes(s) ||
        row.klasifikasi_text.toLowerCase().includes(s) ||
        (row.deskripsi || '').toLowerCase().includes(s)
    );
  }

  if (sortKlasifikasi.value === 'asc') {
    data.sort((a, b) => a.klasifikasi.localeCompare(b.klasifikasi));
  } else if (sortKlasifikasi.value === 'desc') {
    data.sort((a, b) => b.klasifikasi.localeCompare(a.klasifikasi));
  }

  return data;
});

watch(search, () => {
  currentPage.value = 1;
});

const toggleSortKlasifikasi = () => {
  if (sortKlasifikasi.value === null) sortKlasifikasi.value = 'asc';
  else if (sortKlasifikasi.value === 'asc') sortKlasifikasi.value = 'desc';
  else sortKlasifikasi.value = null;
};

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const onExport = () => {
  if (!klasifikasiList.value.length) {
    showToast({
      title: locale.value === 'id' ? 'Tidak ada data' : 'No Data',
      message: t('ka_export_empty'),
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    });
    return;
  }

  const excelData = klasifikasiList.value.map((item, index) => ({
    No: index + 1,
    [t('ka_kode')]: item.klasifikasi,
    [t('ka_nama')]: item.klasifikasi_text,
    [t('ka_deskripsi')]: item.deskripsi ?? '-',
    Status:
      item.active === 1
        ? locale.value === 'id'
          ? 'Aktif'
          : 'Active'
        : locale.value === 'id'
          ? 'Non Aktif'
          : 'Inactive'
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  worksheet['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 35 }, { wch: 40 }, { wch: 12 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, t('ka_title'));

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const fileName = `master_klasifikasi_${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fileName);

  showToast({
    title: locale.value === 'id' ? 'Export berhasil' : 'Export Successful',
    message: t('ka_export_success'),
    color: 'success',
    icon: 'i-lucide-file-down'
  });
};

// Highlight function for search results
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
* {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}

.filter-dd-enter-active,
.filter-dd-leave-active {
  transition: all 0.15s ease;
}
.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
