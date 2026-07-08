<template>
  <div class="min-h-screen dark:bg-gray-900 transition-colors pt-5">
    <AccessDenied v-if="!canAccessPage()" />
<div v-else class="max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-3">
        <div>
          <Heading variant="heading6b" class="text-mobile-md dark:text-white">
            {{ t('mp_title') }}
          </Heading>
          <PageHeader :items="breadcrumbs" />
        </div>
        <button
          v-if="hasPermission('master-data', 'create-perusahaan')"
          @click="openAddCompany = true"
          class="flex items-center gap-2 bg-primary hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm transition-all shadow-sm"
        >
          <Plus class="w-4 h-4" />
          {{ t('nm_button') }}
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
              :placeholder="t('mp_cari_placeholder')"
              class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-12 pr-4 py-2 text-sm dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-primary dark:bg-primary-700 text-white">
                <th
                  @click="toggleSortTanggalMulai"
                  class="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap cursor-pointer select-none flex items-center gap-2"
                >
                  {{ t('mp_col_tgl_mulai') }}
                  <ArrowUpDown
                    class="w-4 h-4 transition-transform duration-300"
                    :class="{
                      'rotate-180': sortBy === 'desc',
                      'rotate-0': sortBy !== 'desc'
                    }"
                  />
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold whitespace-nowrap">
                  {{ t('mp_col_tgl_berakhir') }}
                </th>
                <th class="px-6 py-4 text-center text-sm font-semibold">
                  {{ t('mp_col_kode') }}
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  {{ t('mp_col_nama_pendek') }}
                </th>
                <th class="px-6 py-4 text-left text-sm font-semibold">
                  {{ t('mp_col_nama_panjang') }}
                </th>
                <th class="px-6 py-4 text-center text-sm font-semibold">
                  {{ t('mp_col_aksi') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in filteredRows"
                :key="row.kode"
                :class="[
                  'border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors',
                  idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800'
                ]"
              >
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  <span v-html="highlight(formatDateSlash(row.tanggalMulai), search)"></span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  <span v-html="highlight(formatDateSlash(row.tanggalBerakhir), search)"></span>
                </td>
                <td class="px-6 py-4 items-center">
                  <NuxtLink
                    :to="`/master/perusahaan/${row.kode}/struktur`"
                    class="flex px-3 py-1 rounded-lg bg-blue-100 dark:bg-primary hover:dark:bg-primary-600 hover:bg-primary-700 hover:text-white text-blue-700 dark:text-white transition-colors w-fit"
                  >
                    <div class="flex p-2 rounded-lg transition-colors">
                      <Building2 class="w-5 h-5" />
                    </div>
                    <div class="flex items-center text-sm font-semibold transition-colors">
                      <span v-html="highlight(row.kode, search)"></span>
                    </div>
                  </NuxtLink>
                </td>
                <td
                  class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap"
                  v-html="highlight(row.namaPendek, search)"
                ></td>
                <td
                  class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300"
                  v-html="highlight(row.namaPanjang, search)"
                ></td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      v-if="hasPermission('master-data', 'update-perusahaan')"
                      @click="openEditModal(row)"
                      class="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors group"
                    >
                      <Pencil
                        class="w-4 h-4 text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600"
                      />
                    </button>
                    <button
                      v-if="hasPermission('master-data', 'delete-perusahaan')"
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

    <!-- Add Company Modal -->
    <Teleport to="body">
      <Modal
        v-model="openAddCompany"
        :saving="isSavingAddCompany"
        size="xl"
        @save="handleSaveCompany"
      >
        <template #title>
          <div class="p-3 ml-2">
            <h3 class="text-xl font-bold dark:text-white">
              {{ t('mp_modal_add') }}
            </h3>
          </div>
        </template>

        <div class="space-y-4 p-1">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('mp_tgl_mulai') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="formCompany.tanggalMulai"
                type="date"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                  formErrors.tanggalMulai
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="formErrors.tanggalMulai = false"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('mp_tgl_berakhir') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="formCompany.tanggalBerakhir"
                type="date"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                  formErrors.tanggalBerakhir
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="formErrors.tanggalBerakhir = false"
              />
            </div>
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ t('mp_kode') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formCompany.kode"
              type="text"
              :placeholder="t('mp_kode_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                formErrors.kode
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.kode = false"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ t('mp_nama_pendek') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="formCompany.namaPendek"
              type="text"
              :placeholder="t('mp_nama_pendek_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                formErrors.namaPendek
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.namaPendek = false"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ t('mp_nama_panjang') }} <span class="text-red-500">*</span>
            </Heading>
            <textarea
              v-model="formCompany.namaPanjang"
              rows="3"
              :placeholder="t('mp_nama_panjang_placeholder')"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
                formErrors.namaPanjang
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="formErrors.namaPanjang = false"
            ></textarea>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Edit Modal -->
    <Teleport to="body">
      <Modal v-model="showEditModal" :saving="isSavingEditCompany" size="xl" @save="handleSaveEdit">
        <template #title>
          <div>
            <h3 class="text-lg font-bold p-3 dark:text-white">
              {{ t('mp_modal_edit') }}
            </h3>
          </div>
        </template>

        <div class="space-y-4 p-1">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('mp_tgl_mulai') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="editForm.tanggalMulai"
                type="date"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                  editFormErrors.tanggalMulai
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="editFormErrors.tanggalMulai = false"
              />
            </div>
            <div>
              <Heading variant="heading11m" class="text-xs dark:text-gray-200">
                {{ t('mp_tgl_berakhir') }} <span class="text-red-500">*</span>
              </Heading>
              <input
                v-model="editForm.tanggalBerakhir"
                type="date"
                :class="[
                  'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                  editFormErrors.tanggalBerakhir
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
                ]"
                @input="editFormErrors.tanggalBerakhir = false"
              />
            </div>
          </div>
          <p class="text-xs text-red-500">{{ t('mp_tgl_warning') }}</p>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ t('mp_kode_edit') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="editForm.kode"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                editFormErrors.kode
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="editFormErrors.kode = false"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ t('mp_nama_pendek') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="editForm.namaPendek"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                editFormErrors.namaPendek
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="editFormErrors.namaPendek = false"
            />
          </div>

          <div>
            <Heading variant="heading11m" class="text-xs dark:text-gray-200">
              {{ t('mp_nama_panjang') }} <span class="text-red-500">*</span>
            </Heading>
            <textarea
              v-model="editForm.namaPanjang"
              rows="3"
              :class="[
                'mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 dark:bg-gray-700 dark:text-white',
                editFormErrors.namaPanjang
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500 focus:border-primary-500'
              ]"
              @input="editFormErrors.namaPanjang = false"
            ></textarea>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- Delete Confirm Modal -->
    <ConfirmPopup
      v-model="showDeleteConfirm"
      type="danger"
      :title="t('mp_pop_title')"
      :message="deleteMessage"
      :confirm-text="t('mp_pop_confirm')"
      :cancel-text="t('mp_pop_cancel')"
      :is-loading="isDeleting"
      @confirm="handleDelete"
      @cancel="showDeleteConfirm = false"
    />
  </div>
  </div>
</template>

<script setup lang="ts">const { canAccessPage } = useFeatureAccess()

import { ref, computed, onMounted } from 'vue';
import { Search, Plus, MapPin, Pencil, Trash2, Building2, ArrowUpDown } from 'lucide-vue-next';
import { useCompany } from '~/composables/useCompany';
import { formatDateSlash } from '~/utils/mail-helpers';

definePageMeta({
  middleware: 'auth'
});

const { t, locale } = useI18n();

const { hasPermission } = useAuth();


// ─────────────────────────────────────────────
// BREADCRUMB (reaktif terhadap bahasa)
// ─────────────────────────────────────────────
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('mp_title'), to: '/master/perusahaan' }
]);

// ─────────────────────────────────────────────
// COMPOSABLE & STATE
// ─────────────────────────────────────────────
const { getCompanies, createCompany, updateCompany, deleteCompany } = useCompany();

import { useToast } from '#imports';
const toast = useToast();

const search = ref('');
const openAddCompany = ref(false);
const showEditModal = ref(false);
const showDeleteConfirm = ref(false);
const selectedRow = ref<any>(null);
const isDeleting = ref(false);
const isSavingAddCompany = ref(false);
const isSavingEditCompany = ref(false);

const formCompany = ref({
  tanggalMulai: '',
  tanggalBerakhir: '',
  kode: '',
  namaPendek: '',
  namaPanjang: ''
});

const formErrors = ref({
  kode: false,
  namaPendek: false,
  namaPanjang: false,
  tanggalMulai: false,
  tanggalBerakhir: false
});

// ─────────────────────────────────────────────
// DELETE MESSAGE (reaktif terhadap bahasa)
// ─────────────────────────────────────────────
const deleteMessage = computed(() => {
  if (!selectedRow.value) return '';
  return locale.value === 'id'
    ? `Apakah Anda yakin ingin menghapus perusahaan ${selectedRow.value.namaPendek}?`
    : `Are you sure you want to delete company ${selectedRow.value.namaPendek}?`;
});

// ─────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────
const rows = ref<any[]>([]);

const isExpired = (endDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return end <= today;
};

const fetchCompanies = async () => {
  try {
    const res = await getCompanies();
    const validRows: any[] = [];
    for (const item of res.data) {
      if (isExpired(item.endDate)) {
        await deleteCompany(item.id);
        continue;
      }
      validRows.push({
        id: item.id,
        tanggalMulai: item.startDate,
        tanggalBerakhir: item.endDate,
        kode: String(item.company),
        namaPendek: item.shortText,
        namaPanjang: item.longText
      });
    }
    rows.value = validRows;
  } catch (error) {
    console.error('Gagal mengambil data company', error);
  }
};

onMounted(fetchCompanies);

// ─────────────────────────────────────────────
// FILTER & SORT
// ─────────────────────────────────────────────
const sortBy = ref<'asc' | 'desc' | null>(null);

const filteredRows = computed(() => {
  let result = [...rows.value];

  if (search.value) {
    const s = search.value.toLowerCase();
    result = result.filter(
      (row) =>
        row.kode.toLowerCase().includes(s) ||
        row.namaPendek.toLowerCase().includes(s) ||
        row.namaPanjang.toLowerCase().includes(s)
    );
  }

  if (sortBy.value === 'asc') {
    result.sort((a, b) => new Date(a.tanggalMulai).getTime() - new Date(b.tanggalMulai).getTime());
  } else if (sortBy.value === 'desc') {
    result.sort((a, b) => new Date(b.tanggalMulai).getTime() - new Date(a.tanggalMulai).getTime());
  }

  return result;
});

const toggleSortTanggalMulai = () => {
  if (sortBy.value === null) sortBy.value = 'asc';
  else if (sortBy.value === 'asc') sortBy.value = 'desc';
  else sortBy.value = null;
};

// ─────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────
const isEndDateInvalid = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return end <= start;
};

const formatDateWarningMessage = () => {
  return locale.value === 'id'
    ? 'Tanggal berakhir tidak boleh sama dengan atau lebih awal dari tanggal mulai'
    : 'The end date cannot be the same as or earlier than the start date.';
};

// ─────────────────────────────────────────────
// ADD
// ─────────────────────────────────────────────
const validateAddForm = (): boolean => {
  // Set error states
  formErrors.value.kode = !formCompany.value.kode.trim();
  formErrors.value.namaPendek = !formCompany.value.namaPendek.trim();
  formErrors.value.namaPanjang = !formCompany.value.namaPanjang.trim();
  formErrors.value.tanggalMulai = !formCompany.value.tanggalMulai;
  formErrors.value.tanggalBerakhir = !formCompany.value.tanggalBerakhir;

  const emptyFields: string[] = [];

  if (formErrors.value.kode) {
    emptyFields.push(t('mp_kode'));
  }
  if (formErrors.value.namaPendek) {
    emptyFields.push(t('mp_nama_pendek'));
  }
  if (formErrors.value.namaPanjang) {
    emptyFields.push(t('mp_nama_panjang'));
  }
  if (formErrors.value.tanggalMulai) {
    emptyFields.push(t('mp_tgl_mulai'));
  }
  if (formErrors.value.tanggalBerakhir) {
    emptyFields.push(t('mp_tgl_berakhir'));
  }

  if (emptyFields.length > 0) {
    toast.add({
      title: t('gagal'),
      description: `${emptyFields.join(', ')} wajib diisi`,
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return false;
  }

  // Validate date range
  if (isEndDateInvalid(formCompany.value.tanggalMulai, formCompany.value.tanggalBerakhir)) {
    toast.add({
      title: t('gagal'),
      description: formatDateWarningMessage(),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return false;
  }

  return true;
};

const handleSaveCompany = async () => {
  if (isSavingAddCompany.value) return;

  // Validate required fields first
  if (!validateAddForm()) return;
  if (isNaN(Number(formCompany.value.kode))) {
    toast.add({
      title: t('gagal'),
      description: t('mp_val_kode_angka'),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return;
  }

  isSavingAddCompany.value = true;

  try {
    await createCompany({
      company: Number(formCompany.value.kode),
      shortText: formCompany.value.namaPendek,
      longText: formCompany.value.namaPanjang,
      startDate: formCompany.value.tanggalMulai,
      endDate: formCompany.value.tanggalBerakhir
    });

    await fetchCompanies();

    toast.add({
      title: t('berhasil'),
      description: t('mp_success_add'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    });

    openAddCompany.value = false;
    formCompany.value = {
      tanggalMulai: '',
      tanggalBerakhir: '',
      kode: '',
      namaPendek: '',
      namaPanjang: ''
    };
    formErrors.value = {
      kode: false,
      namaPendek: false,
      namaPanjang: false,
      tanggalMulai: false,
      tanggalBerakhir: false
    };
  } catch (error) {
    toast.add({
      title: t('gagal'),
      description: t('mp_err_add'),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    console.error(error);
  } finally {
    isSavingAddCompany.value = false;
  }
};

// ─────────────────────────────────────────────
// EDIT
// ─────────────────────────────────────────────
const editForm = ref({
  id: '',
  tanggalMulai: '',
  tanggalBerakhir: '',
  kode: '',
  namaPendek: '',
  namaPanjang: ''
});

const editFormErrors = ref({
  kode: false,
  namaPendek: false,
  namaPanjang: false,
  tanggalMulai: false,
  tanggalBerakhir: false
});

const openEditModal = (row: any) => {
  selectedRow.value = row;
  editForm.value = {
    id: row.id,
    tanggalMulai: row.tanggalMulai,
    tanggalBerakhir: row.tanggalBerakhir,
    kode: row.kode,
    namaPendek: row.namaPendek,
    namaPanjang: row.namaPanjang
  };
  editFormErrors.value = {
    kode: false,
    namaPendek: false,
    namaPanjang: false,
    tanggalMulai: false,
    tanggalBerakhir: false
  };
  showEditModal.value = true;
};

const validateEditForm = (): boolean => {
  // Set error states
  editFormErrors.value.kode = !editForm.value.kode.trim();
  editFormErrors.value.namaPendek = !editForm.value.namaPendek.trim();
  editFormErrors.value.namaPanjang = !editForm.value.namaPanjang.trim();
  editFormErrors.value.tanggalMulai = !editForm.value.tanggalMulai;
  editFormErrors.value.tanggalBerakhir = !editForm.value.tanggalBerakhir;

  const emptyFields: string[] = [];

  if (editFormErrors.value.kode) {
    emptyFields.push(t('mp_kode'));
  }
  if (editFormErrors.value.namaPendek) {
    emptyFields.push(t('mp_nama_pendek'));
  }
  if (editFormErrors.value.namaPanjang) {
    emptyFields.push(t('mp_nama_panjang'));
  }
  if (editFormErrors.value.tanggalMulai) {
    emptyFields.push(t('mp_tgl_mulai'));
  }
  if (editFormErrors.value.tanggalBerakhir) {
    emptyFields.push(t('mp_tgl_berakhir'));
  }

  if (emptyFields.length > 0) {
    toast.add({
      title: t('gagal'),
      description: `${emptyFields.join(', ')} wajib diisi`,
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return false;
  }

  // Validate date range
  if (isEndDateInvalid(editForm.value.tanggalMulai, editForm.value.tanggalBerakhir)) {
    toast.add({
      title: t('gagal'),
      description: formatDateWarningMessage(),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return false;
  }

  return true;
};

const handleSaveEdit = async () => {
  if (isSavingEditCompany.value) return;

  // Validate required fields first
  if (!validateEditForm()) return;
  if (isNaN(Number(editForm.value.kode))) {
    toast.add({
      title: t('gagal'),
      description: t('mp_val_kode_angka'),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    return;
  }

  isSavingEditCompany.value = true;

  try {
    await updateCompany(editForm.value.id, {
      company: Number(editForm.value.kode),
      shortText: editForm.value.namaPendek,
      longText: editForm.value.namaPanjang,
      startDate: editForm.value.tanggalMulai,
      endDate: editForm.value.tanggalBerakhir
    });

    await fetchCompanies();

    toast.add({
      title: t('berhasil'),
      description: t('mp_success_edit'),
      color: 'success',
      icon: 'i-lucide-check-circle'
    });

    showEditModal.value = false;
  } catch (error) {
    toast.add({
      title: t('gagal'),
      description: t('mp_err_edit'),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    console.error(error);
  } finally {
    isSavingEditCompany.value = false;
  }
};

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────
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
      title: t('berhasil'),
      description: `${selectedRow.value.namaPendek} ${t('mp_success_delete')}`,
      color: 'success',
      icon: 'i-lucide-trash-2'
    });

    showDeleteConfirm.value = false;
    selectedRow.value = null;
  } catch (error) {
    toast.add({
      title: t('gagal'),
      description: t('mp_err_delete'),
      color: 'error',
      icon: 'i-lucide-x-circle'
    });
    console.error(error);
  } finally {
    isDeleting.value = false;
  }
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
</style>
