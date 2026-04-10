<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <!-- Left Section - Title & Breadcrumb -->
      <PageHeader :title="$t('tertuju')" :items="items" />
      <button
        @click="openAddModal"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition-colors"
      >
        <Plus class="w-4 h-4" />
        {{ $t('nm_button') }}
      </button>
    </div>

    <div
      class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors"
    >
      <!-- Top Bar -->
      <div class="flex flex-wrap gap-2 items-center p-3">
        <!-- Rows per page (custom dropdown) -->
        <div class="relative">
          <button
            type="button"
            @click="openRowsDropdown = !openRowsDropdown"
            class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
          >
            <span>{{ rowsPerPage }}</span>
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
                  rowsPerPage = n;
                  openRowsDropdown = false;
                "
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

        <!-- Refresh -->
        <button
          @click="refreshData"
          class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition-colors"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <!-- Search -->
        <div class="relative flex-1 min-w-40">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="filters.search"
            :placeholder="$t('cari')"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>

        <!-- Export -->
        <button
          @click="onExport"
          class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white h-8 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-700 text-xs transition-colors whitespace-nowrap"
        >
          Export
        </button>
      </div>

      <!-- Table -->
      <table class="min-w-full text-sm">
        <thead class="text-left bg-primary-400 dark:bg-primary-700 text-white">
          <tr>
            <th @click="handleSort('nama')" class="cursor-pointer">
              <div class="flex items-center gap-2 ml-5">
                <span>{{ $t('te_nama') }}</span>
                <ArrowUpDown
                  class="w-4 h-4 origin-center transition-transform duration-300"
                  :class="[
                    sortColumn === 'status'
                      ? sortDirection === 'desc'
                        ? 'rotate-180'
                        : 'rotate-0'
                      : 'opacity-50'
                  ]"
                />
              </div>
            </th>

            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              {{ $t('te_alamat') }}
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              {{ $t('te_telepon') }}
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              Status
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              {{ $t('te_pengusul') }}
            </th>
            <th class="px-4 py-3 border-b border-b-gray-100 dark:border-b-gray-700 font-semibold">
              {{ $t('aksi') }}
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Loading - Skeleton -->
          <tr v-if="loading">
            <td colspan="6" class="px-4 py-6">
              <div class="space-y-4 animate-pulse">
                <div
                  v-for="n in skeletonRows"
                  :key="'skeleton-' + n"
                  class="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-700"
                />
              </div>
            </td>
          </tr>

          <!-- Data rows -->
          <tr
            v-else
            v-for="(item, idx) in paginatedData"
            :key="item.id"
            :class="[
              'hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-b border-b-gray-200 dark:border-b-gray-700 capitalize',
              idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-800'
            ]"
          >
            <td
              class="px-4 py-3 font-medium text-gray-900 dark:text-white"
              v-html="highlight(item.nama, filters.search)"
            ></td>

            <td
              class="px-4 py-3 text-gray-700 dark:text-gray-300"
              v-html="highlight(item.alamat, filters.search)"
            ></td>

            <td
              class="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300"
              v-html="highlight(item.telepon, filters.search)"
            ></td>

            <td class="px-4 py-3">
              <span
                class="px-3 py-1 rounded-full text-xs font-medium"
                :class="
                  item.aktif
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300'
                "
              >
                {{ item.aktif ? $t('te_aktif') : $t('te_tidak_aktif') }}
              </span>
            </td>

            <td
              class="px-4 py-3 text-gray-700 dark:text-gray-300"
              v-html="highlight(item.nama_pembuat, filters.search)"
            ></td>

            <td class="px-4 py-3 text-center flex justify-center gap-3">
              <button
                @click="openEdit(item)"
                class="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors group"
              >
                <Pencil
                  class="w-4 h-4 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600"
                />
              </button>

              <button
                class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                @click="handleDelete(item.id)"
              >
                <Trash2 class="w-4 h-4 text-red-600 dark:text-red-500 group-hover:text-red-600" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div
        v-if="filteredData.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {{ $t('menampilkan') }} {{ paginatedData.length }} {{ $t('dari') }}
          {{ filteredData.length }} {{ $t('data') }}
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
            {{ $t('sebelumnya') }}
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
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary'
              ]"
            >
              {{ page }}
            </button>

            <span
              v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
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
                : 'bg-white dark:bg-gray-700 text-primary border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900'
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

    <Teleport to="body">
      <Modal
        v-model="showModal"
        :saving="isSavingForm"
        @save="handleSave"
        size="xl"
        @close="resetForm"
      >
        <template #title>
          <Heading variant="heading9b" class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white">
            {{ editId ? $t('te_modal_edit') : $t('te_modal_add') }}
          </Heading>
        </template>

        <!-- FIELD NAMA -->
        <div class="flex flex-col gap-2 p-1">
          <Heading variant="heading11m" class="text-xs dark:text-gray-200">
            {{ $t('te_nama') }} <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="form.nama"
            type="text"
            :placeholder="$t('te_nama_placeholder')"
            :class="[
              'w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
              formErrors.nama
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
            ]"
            @input="formErrors.nama = false"
          />
          <p v-if="formErrors.nama" class="text-xs text-red-500 mt-1">
            {{ $t('te_nama') }}
          </p>
        </div>

        <!-- FIELD ALAMAT -->
        <div class="flex flex-col gap-2">
          <Heading variant="heading11m" class="text-xs dark:text-gray-200">
            {{ $t('te_alamat') }} <span class="text-red-500">*</span>
          </Heading>
          <textarea
            v-model="form.alamat"
            type="text"
            :placeholder="$t('te_alamat_placeholder')"
            :class="[
              'w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
              formErrors.alamat
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
            ]"
            @input="formErrors.alamat = false"
          />
          <p v-if="formErrors.alamat" class="text-xs text-red-500 mt-1">
            {{ $t('te_alamat') }}
          </p>
        </div>

        <!-- FIELD TELEPON -->
        <div class="flex flex-col gap-2">
          <Heading variant="heading11m" class="text-xs dark:text-gray-200">
            {{ $t('te_telepon') }} <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="form.telephone"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="15"
            @keydown="onPhoneKeydown"
            @input="onPhoneInput"
            @paste="onPhonePaste"
            :placeholder="$t('te_telepon_placeholder')"
            :class="[
              'w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
              formErrors.telephone
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
            ]"
          />
          <p v-if="formErrors.telephone" class="text-xs text-red-500 mt-1">
            {{ $t('te_telepon') }}
          </p>
        </div>

        <!-- FIELD STATUS -->
        <div class="flex flex-col gap-2">
          <Heading variant="heading11m" class="text-xs dark:text-gray-200">
            Status <span class="text-red-500">*</span>
          </Heading>
          <select
            v-model="form.aktif"
            :class="[
              'w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-200',
              formErrors.aktif
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'
            ]"
            @change="formErrors.aktif = false"
          >
            <option value="" disabled>{{ $t('te_status_placeholder') }}</option>
            <option :value="true">{{ $t('te_aktif') }}</option>
            <option :value="false">{{ $t('te_tidak_aktif') }}</option>
          </select>
          <p v-if="formErrors.aktif" class="text-xs text-red-500 mt-1">Status</p>
        </div>
      </Modal>
    </Teleport>

    <ConfirmPopup
      v-model="showConfirmDelete"
      type="danger"
      :title="$t('te_pop_title')"
      :message="$t('te_pop_desc')"
      :confirm-text="$t('popup_hapus')"
      :cancel-text="$t('popup_batal')"
      :is-loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="showConfirmDelete = false"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import {
  Search,
  FileDown,
  RotateCcw,
  Trash2,
  Pencil,
  Plus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useTertujuEksternal } from '~/composables/useTertujuEksternal';
import { useAuth } from '~/composables/useAuth';
import Modal from '@/components/Modal.vue';
import ConfirmPopup from '@/components/ConfirmPopup.vue';
import { useToast } from '#imports';

definePageMeta({
  middleware: 'auth'
});

const { t } = useI18n();

const toast = useToast();

const showToast = (
  title: string,
  message: string,
  color: 'success' | 'error' | 'warning' | 'primary' = 'success'
) => {
  toast.add({
    title,
    description: message,
    color,
    icon:
      color === 'success'
        ? 'i-lucide-check-circle'
        : color === 'error'
          ? 'i-lucide-x-circle'
          : 'i-lucide-info'
  });
};

const items = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('tertuju'), to: '/admin/master/tertuju-eksternal' }
]);

const auth = useAuth();
const user = auth.user;

const {
  data,
  loading,
  fetchTertujuEksternal,
  createTertujuEksternal,
  deleteTertujuEksternal,
  updateTertujuEksternal
} = useTertujuEksternal();

// sort
const handleSort = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
};

const form = ref({
  nama: '',
  alamat: '',
  telephone: '',
  aktif: '' as boolean | ''
});

const formErrors = ref({
  nama: false,
  alamat: false,
  telephone: false,
  aktif: false
});

onMounted(async () => {
  loading.value = true;
  await fetchTertujuEksternal();
  loading.value = false;
});

const showModal = ref(false);
const editId = ref<string | null>(null);
const isSavingForm = ref(false);

// Pagination
const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const currentPage = ref<number>(1);
const openRowsDropdown = ref(false);

// Sorting
const sortColumn = ref<string>('nama');
const sortDirection = ref<'asc' | 'desc'>('asc');
const sortKey = ref('');
const sortOrder = ref('asc');

const onPhoneKeydown = (e: KeyboardEvent) => {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'];
  if (allowedKeys.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return;
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
};

const onPhoneInput = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const digitsOnly = input.value.replace(/\D/g, '');
  if (input.value !== digitsOnly) {
    const cursorPos = (input.selectionStart ?? 0) - (input.value.length - digitsOnly.length);
    input.value = digitsOnly;
    input.setSelectionRange(cursorPos, cursorPos);
  }
  form.value.telephone = digitsOnly;
  formErrors.value.telephone = false;
};

const onPhonePaste = (e: ClipboardEvent) => {
  e.preventDefault();
  const pasted = e.clipboardData?.getData('text') ?? '';
  const digitsOnly = pasted.replace(/\D/g, '');
  const input = e.target as HTMLInputElement;
  const start = input.selectionStart ?? 0;
  const end = input.selectionEnd ?? 0;
  const current = form.value.telephone;
  const newVal = current.slice(0, start) + digitsOnly + current.slice(end);
  form.value.telephone = newVal;
  const newCursor = start + digitsOnly.length;
  nextTick(() => {
    input.setSelectionRange(newCursor, newCursor);
  });
};

const handleSave = async () => {
  if (isSavingForm.value) return;

  // Validasi semua field termasuk status
  formErrors.value.nama = !form.value.nama.trim();
  formErrors.value.alamat = !form.value.alamat.trim();
  formErrors.value.telephone = !form.value.telephone.trim();
  formErrors.value.aktif = form.value.aktif === '';

  const emptyFields: string[] = [];
  if (formErrors.value.nama) emptyFields.push(t('te_nama') || 'Nama');
  if (formErrors.value.alamat) emptyFields.push(t('te_alamat') || 'Alamat');
  if (formErrors.value.telephone) emptyFields.push(t('te_telepon') || 'Telepon');
  if (formErrors.value.aktif) emptyFields.push('Status');

  if (emptyFields.length > 0) {
    showToast(t('gagal'), `${emptyFields.join(', ')} wajib diisi`, 'error');
    return;
  }

  isSavingForm.value = true;

  try {
    if (editId.value) {
      await updateTertujuEksternal(editId.value, {
        nama: form.value.nama,
        alamat: form.value.alamat,
        telepon: form.value.telephone,
        aktif: form.value.aktif as boolean
      });
      showToast('Berhasil', 'Data berhasil diperbarui.', 'success');
    } else {
      await createTertujuEksternal({
        id_position_pembuat: user.value.position,
        company: 'MN',
        area: 'Regional 1',
        nama: form.value.nama,
        alamat: form.value.alamat,
        telepon: form.value.telephone,
        aktif: form.value.aktif as boolean
      });
      showToast('Berhasil', 'Data berhasil ditambahkan.', 'success');
    }

    await fetchTertujuEksternal();

    showModal.value = false;
    editId.value = null;

    form.value = {
      nama: '',
      alamat: '',
      telephone: '',
      aktif: ''
    };
  } catch (err: any) {
    console.error('Gagal menyimpan data:', err?.response?.data || err);
    showToast('Gagal', 'Gagal menyimpan data.', 'error');
    return;
  } finally {
    isSavingForm.value = false;
  }
};

const showConfirmDelete = ref(false);
const deleteTargetId = ref<string | null>(null);
const isDeleting = ref(false);

const resetForm = () => {
  editId.value = null;
  form.value = {
    nama: '',
    alamat: '',
    telephone: '',
    aktif: ''
  };
  formErrors.value = {
    nama: false,
    alamat: false,
    telephone: false,
    aktif: false
  };
};

const openAddModal = () => {
  resetForm();
  showModal.value = true;
};

const handleDelete = (id: string) => {
  deleteTargetId.value = id;
  showConfirmDelete.value = true;
};

const confirmDelete = async () => {
  if (!deleteTargetId.value) return;
  try {
    isDeleting.value = true;
    await deleteTertujuEksternal(deleteTargetId.value);
    showToast('Berhasil', 'Data berhasil dihapus.', 'success');
    showConfirmDelete.value = false;
  } catch (err: any) {
    console.error('Gagal menghapus data:', err?.response?.data || err);
    showToast('Gagal', 'Gagal menghapus data.', 'error');
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
    aktif: item.aktif
  };
  showModal.value = true;
};

// Filter state
const filters = ref({
  jenis: '',
  lokasi: '',
  status: '',
  tahun: '',
  search: ''
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
      item.nama_pembuat
    ]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  );
});

// Sorted data
const sortedData = computed(() => {
  const sorted = [...filteredData.value];
  sorted.sort((a, b) => {
    const aVal = String(a[sortColumn.value] || '').toLowerCase();
    const bVal = String(b[sortColumn.value] || '').toLowerCase();
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
});

// Pagination computed
const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedData.value.length / rowsPerPage.value))
);

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return sortedData.value.slice(start, start + rowsPerPage.value);
});

const skeletonRows = computed(() => rowsPerPage.value);

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

const sortBy = (column: string) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column;
    sortDirection.value = 'asc';
  }
};

watch([() => filters.value.search, rowsPerPage], () => {
  currentPage.value = 1;
});

const refreshData = async () => {
  loading.value = true;
  filters.value.search = '';
  currentPage.value = 1;
  await fetchTertujuEksternal();
};

const onExport = () => {
  const exportData = sortedData.value.map((item, idx) => ({
    No: idx + 1,
    [t('te_nama')]: item.nama,
    [t('te_alamat')]: item.alamat,
    [t('te_telepon')]: item.telepon || '-',
    Status: item.aktif ? t('te_aktif') : t('te_tidak_aktif'),
    [t('te_pengusul')]: item.nama_pembuat || '-'
  }));

  if (exportData.length === 0) {
    showToast(t('te_gagal') || 'Info', 'Tidak ada data untuk diekspor.', 'warning');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 40 },
    { wch: 18 },
    { wch: 12 },
    { wch: 25 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, t('tertuju'));
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `tertuju_eksternal_${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast(t('te_berhasil') || 'Berhasil', 'Export berhasil.', 'success');
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

.sort-animate {
  animation: sortPulse 0.25s ease;
}

@keyframes sortPulse {
  0% {
    transform: scale(0.7) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2) rotate(10deg);
    opacity: 0.9;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

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
</style>
