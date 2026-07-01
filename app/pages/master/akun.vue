<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-5">
      <div>
        <PageHeader :title="$t('ma')" :items="items" />
      </div>

      <button
        @click="
          () => {
            isEditMode = false;
            form = { persnum: '', role: '' };
            resetPersonSearch();
            showAddModal = true;
          }
        "
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
        <!-- Rows per page -->
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
            :placeholder="t('cari')"
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
      <table class="min-w-full border-collapse text-sm">
        <thead class="bg-primary-400 dark:bg-primary-700 text-white text-left">
          <tr>
            <th class="px-7 py-3 border-primary-600 font-semibold">{{ $t('namauser') }}</th>
            <th class="px-4 py-3 border-primary-600 font-semibold">Role</th>
            <th class="px-4 py-3 border-primary-600 font-semibold text-center">{{ $t('aksi') }}</th>
          </tr>
        </thead>

        <tbody>
          <!-- Loading Skeleton -->
          <tr v-if="loading">
            <td colspan="3" class="px-4 py-6">
              <div class="space-y-4 animate-pulse">
                <div
                  v-for="n in skeletonRows"
                  :key="'skeleton-' + n"
                  class="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-700"
                />
              </div>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-else-if="paginatedUsers.length === 0">
            <td colspan="3" class="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              Tidak ada data yang cocok dengan pencarian.
            </td>
          </tr>

          <!-- Data Rows -->
          <tr
            v-else
            v-for="(user, idx) in paginatedUsers"
            :key="user.username ?? user.persnum"
            :class="[
              'border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors',
              idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-800'
            ]"
          >
            <!-- Kolom Nama Pengguna: highlight nama, persnum, jabatan -->
            <td class="px-4 py-3">
              <div class="flex items-start space-x-3 ml-3">
                <div
                  class="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-white text-xs font-semibold uppercase"
                >
                  {{ getInitials(user.name) }}
                </div>
                <div>
                  <p class="font-semibold text-gray-700 dark:text-white">
                    <!-- highlight nama -->
                    <span v-html="highlight(user.name ?? '', filters.search)"></span>
                    <span class="text-gray-400 mx-1">-</span>
                    <!-- highlight persnum -->
                    <span v-html="highlight(String(user.persnum ?? ''), filters.search)"></span>
                  </p>
                  <!-- highlight jabatan -->
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    <span v-html="highlight(user.positionText ?? '-', filters.search)"></span>
                  </p>
                </div>
              </div>
            </td>

            <!-- Kolom Role: highlight role -->
            <td class="px-4 py-3">
              <span
                class="px-3 py-1 text-xs rounded-full font-medium flex items-center gap-1 w-fit"
                :class="getRoleColor(user.role)"
              >
                <Shield class="w-3 h-3" />
                <span v-html="highlight(user.role ?? '', filters.search)"></span>
              </span>
            </td>

            <!-- Kolom Aksi -->
            <td class="px-4 py-3 text-center flex justify-center gap-3">
              <button
                class="p-2 rounded-lg transition-colors group"
                :class="
                  isSelfSuperAdmin(user)
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                "
                :disabled="isSelfSuperAdmin(user)"
                @click="!isSelfSuperAdmin(user) && openEdit(user)"
              >
                <Pencil
                  class="w-4 h-4"
                  :class="
                    isSelfSuperAdmin(user)
                      ? 'text-gray-400'
                      : 'text-yellow-500 dark:text-yellow-400 group-hover:text-yellow-600'
                  "
                />
              </button>

              <button
                class="p-2 rounded-lg transition-colors group"
                :class="
                  isSelfSuperAdmin(user)
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-red-100 dark:hover:bg-red-900/30'
                "
                :disabled="isSelfSuperAdmin(user)"
                @click="!isSelfSuperAdmin(user) && openDelete(user)"
              >
                <Trash2
                  class="w-4 h-4"
                  :class="
                    isSelfSuperAdmin(user)
                      ? 'text-gray-400'
                      : 'text-red-600 dark:text-red-500 group-hover:text-red-600'
                  "
                />
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
          {{ $t('menampilkan') }} {{ paginatedUsers.length }} {{ $t('dari') }}
          {{ filteredUsers.length }} {{ $t('data') }}
        </div>

        <div class="flex items-center gap-2">
          <!-- Prev -->
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
              >...</span
            >

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
              >...</span
            >

            <button
              v-if="paginationPages[paginationPages.length - 1] < totalPages"
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900 hover:text-primary transition-all"
            >
              {{ totalPages }}
            </button>
          </div>

          <!-- Next -->
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
  </div>

  <!-- Modal Tambah/Edit -->
  <Teleport to="body">
    <Modal v-model="showAddModal" :saving="isSavingAccount" @save="saveAccount">
      <template #title>
        <Heading variant="heading9b" class="font-semibold text-sm mb-3 mt-5 ml-5 dark:text-white">
          {{ isEditMode ? $t('ma_modal_edit') : $t('ma_modal_add') }}
        </Heading>
      </template>

      <!-- FIELD PERSNUM -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">Nama/Persnum</label>
        <div class="relative">
          <input
            v-model="personSearchQuery"
            type="text"
            :disabled="isEditMode"
            :placeholder="$t('ma_persnum_placeholder')"
            :class="[
              'w-full border rounded-md px-3 py-2 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-white dark:placeholder-gray-400',
              formErrors.persnum
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            ]"
            @input="onPersonSearch"
            @focus="personSuggestions.length > 0 && (showPersonSuggestions = true)"
            @blur="hidePersonSuggestions"
            @keydown.escape="showPersonSuggestions = false"
            @keydown.down.prevent="
              highlightedIndex = Math.min(highlightedIndex + 1, personSuggestions.length - 1)
            "
            @keydown.up.prevent="highlightedIndex = Math.max(highlightedIndex - 1, 0)"
            @keydown.enter.prevent="selectPersonSuggestion(personSuggestions[highlightedIndex])"
            autocomplete="off"
          />
          <div v-if="isSearchingPerson" class="absolute right-3 top-1/2 -translate-y-1/2">
            <div
              class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
            />
          </div>
          <div
            v-if="showPersonSuggestions && personSuggestions.length > 0"
            class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            <div
              v-for="(person, idx) in personSuggestions"
              :key="person.id"
              @mousedown.prevent="selectPersonSuggestion(person)"
              :class="[
                'px-4 py-2 cursor-pointer text-sm transition-colors',
                highlightedIndex === idx
                  ? 'bg-primary-100 dark:bg-gray-600'
                  : 'hover:bg-primary-50 dark:hover:bg-gray-700'
              ]"
            >
              <span class="font-medium text-gray-800 dark:text-white">{{ person.name }}</span>
              <span class="text-gray-500 dark:text-gray-400 ml-1">- {{ person.persnum }}</span>
            </div>
          </div>
        </div>
        <p v-if="formErrors.persnum" class="text-xs text-red-500 mt-1">Nama/Persnum</p>
      </div>

      <!-- Jabatan read-only -->
      <div
        v-if="selectedPersonJabatan"
        class="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-md px-3 py-1.5 border border-gray-200 dark:border-gray-600"
      >
        <span class="font-semibold">Jabatan: </span>{{ selectedPersonJabatan }}
      </div>

      <!-- FIELD ROLE -->
      <div class="flex flex-col gap-2">
        <label class="text-xs font-semibold text-gray-700 dark:text-gray-200">Role</label>
        <select
          v-model="form.role"
          :class="[
            'border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200',
            formErrors.role
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          ]"
          @change="formErrors.role = false"
        >
          <option value="" disabled>{{ $t('ma_role_placeholder') }}</option>
          <option value="admin">Admin</option>
          <option value="superadmin">Super Admin</option>
        </select>
        <p v-if="formErrors.role" class="text-xs text-red-500 mt-1">Role</p>
      </div>
    </Modal>
  </Teleport>

  <ConfirmPopup
    v-model="confirmDeleteOpen"
    type="danger"
    :title="$t('ma_pop_title')"
    :message="$t('ma_pop_desc')"
    :confirm-text="$t('popup_hapus')"
    :cancel-text="$t('popup_batal')"
    @confirm="deleteNow"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  Trash2,
  Shield,
  RotateCcw,
  FileDown,
  Search,
  Plus,
  Pencil,
  ChevronDown
} from 'lucide-vue-next';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Modal from '@/components/Modal.vue';
import { useManajemenAkun } from '@/composables/useManajemenAkun';
import { usePerson } from '@/composables/usePerson';
import type { PersonSuggestion } from '@/composables/usePerson';
import { useToast } from '#imports';
import { getInitials } from '~/utils/mail-helpers';

const { user: authUser, hasRole } = useAuth();
const toast = useToast();
const { t } = useI18n();

definePageMeta({ middleware: 'auth' });

const { accounts, fetchAccounts, loading, addAccount, deleteAccount } = useManajemenAkun();
const { searchPersons } = usePerson();

// ── Person autocomplete ──────────────────────────────────────────
const personSearchQuery = ref('');
const personSuggestions = ref<PersonSuggestion[]>([]);
const showPersonSuggestions = ref(false);
const isSearchingPerson = ref(false);
const highlightedIndex = ref(0);
let personSearchTimeout: ReturnType<typeof setTimeout> | null = null;

const resetPersonSearch = () => {
  personSearchQuery.value = '';
  personSuggestions.value = [];
  showPersonSuggestions.value = false;
  highlightedIndex.value = 0;
  selectedPersonJabatan.value = '';
  formErrors.value = { persnum: false, role: false };
};

const onPersonSearch = () => {
  form.value.persnum = '';
  highlightedIndex.value = 0;
  formErrors.value.persnum = false;

  if (personSearchTimeout) clearTimeout(personSearchTimeout);

  if (!personSearchQuery.value.trim()) {
    personSuggestions.value = [];
    showPersonSuggestions.value = false;
    return;
  }

  personSearchTimeout = setTimeout(async () => {
    isSearchingPerson.value = true;
    try {
      const res = await searchPersons(personSearchQuery.value);
      personSuggestions.value = res.data?.data || [];
      showPersonSuggestions.value = personSuggestions.value.length > 0;
    } catch {
      personSuggestions.value = [];
      showPersonSuggestions.value = false;
    } finally {
      isSearchingPerson.value = false;
    }
  }, 300);
};

const selectPersonSuggestion = (person: PersonSuggestion | undefined) => {
  if (!person) return;
  form.value.persnum = String(person.persnum);
  personSearchQuery.value = `${person.name} - ${person.persnum}`;
  selectedPersonJabatan.value = person.position_text || '';
  showPersonSuggestions.value = false;
  formErrors.value.persnum = false;
};

const hidePersonSuggestions = () => {
  setTimeout(() => {
    showPersonSuggestions.value = false;
  }, 150);
};

// ── Delete ───────────────────────────────────────────────────────
const confirmDeleteOpen = ref(false);
const itemToDelete = ref<any>(null);

const openDelete = (row: any) => {
  if (isSelfSuperAdmin(row)) return;
  itemToDelete.value = row;
  confirmDeleteOpen.value = true;
};

// ── Breadcrumb ───────────────────────────────────────────────────
const items = computed(() => [
  { label: t('beranda'), to: '/' },
  { label: t('ma'), to: '/master/akun' }
]);

// ── Filters & pagination ─────────────────────────────────────────
const filters = ref({ search: '', role: '' });

const rowsPerPage = ref<number>(10);
const rowsChoices = [5, 10, 20, 50];
const currentPage = ref<number>(1);
const openRowsDropdown = ref(false);

// ── Helpers ──────────────────────────────────────────────────────
const selectedPersonJabatan = ref('');

const isSelfSuperAdmin = (row: any) =>
  hasRole('SUPERADMIN') && authUser.value?.persnum === row.persnum;

// ── Edit ─────────────────────────────────────────────────────────
const isEditMode = ref(false);
const editingUser = ref<any>(null);

const openEdit = (row: any) => {
  if (isSelfSuperAdmin(row)) return;
  isEditMode.value = true;
  editingUser.value = row;
  form.value = { persnum: row.persnum, role: row.role };
  personSearchQuery.value = `${row.name} - ${row.persnum}`;
  selectedPersonJabatan.value = row.positionText || '';
  personSuggestions.value = [];
  showPersonSuggestions.value = false;
  showAddModal.value = true;
};

// ── Save ─────────────────────────────────────────────────────────
const showAddModal = ref(false);
const isSavingAccount = ref(false);
const form = ref({ persnum: '', role: '' });
const formErrors = ref({ persnum: false, role: false });

const saveAccount = async () => {
  if (isSavingAccount.value) return;

  formErrors.value.persnum = !form.value.persnum;
  formErrors.value.role = !form.value.role;

  const emptyFields: string[] = [];
  if (formErrors.value.persnum) emptyFields.push('Nama/Persnum');
  if (formErrors.value.role) emptyFields.push('Role');

  if (emptyFields.length > 0) {
    showToast(t('gagal'), `${emptyFields.join(', ')} wajib diisi`, 'error');
    return;
  }

  const isEdit = isEditMode.value;
  isSavingAccount.value = true;

  try {
    await addAccount(form.value.persnum, form.value.role);

    showAddModal.value = false;
    isEditMode.value = false;
    editingUser.value = null;
    form.value = { persnum: '', role: '' };
    resetPersonSearch();

    showToast(t('ma_tb_title'), isEdit ? t('ma_te_desc') : t('ma_tb_desc'), 'success');
    await fetchAccounts();
  } catch {
    showToast(t('ma_err_title'), t('ma_err_save_desc'), 'error');
  } finally {
    isSavingAccount.value = false;
  }
};

// ── Delete confirm ───────────────────────────────────────────────
const deleteNow = async () => {
  if (!itemToDelete.value) return;
  try {
    await deleteAccount(itemToDelete.value.persnum);
    showToast(t('ma_tb_title'), t('ma_th_desc'), 'success');
    confirmDeleteOpen.value = false;
    itemToDelete.value = null;
    await fetchAccounts();
  } catch {
    showToast(t('ma_err_title'), t('ma_err_del_desc'), 'error');
  }
};

// ── Refresh ──────────────────────────────────────────────────────
const refreshData = async () => {
  await fetchAccounts();
  currentPage.value = 1;
};

// ── Mount ────────────────────────────────────────────────────────
onMounted(() => {
  fetchAccounts();
});

// ── filteredUsers — search pada nama, persnum, jabatan ───────────
const filteredUsers = computed(() => {
  const keyword = filters.value.search.trim().toLowerCase();

  const result = accounts.value.filter((user) => {
    if (!keyword) return true;

    // Gabungkan semua field yang ingin di-search
    const haystack = [user.name ?? '', String(user.persnum ?? ''), user.positionText ?? '']
      .join(' ')
      .toLowerCase();

    return haystack.includes(keyword);
  });

  // Sort: current user di atas, sisanya alfabetis
  return result.sort((a, b) => {
    const aIsMe = a.persnum === authUser.value?.persnum;
    const bIsMe = b.persnum === authUser.value?.persnum;
    if (aIsMe) return -1;
    if (bIsMe) return 1;
    return (a.name ?? '').localeCompare(b.name ?? '', 'id');
  });
});

// ── Pagination ───────────────────────────────────────────────────
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredUsers.value.length / rowsPerPage.value))
);

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  return filteredUsers.value.slice(start, start + rowsPerPage.value);
});

const skeletonRows = computed(() => rowsPerPage.value);

const paginationPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else if (current <= 2) {
    pages.push(1, 2, 3, 4, 5);
  } else if (current >= total - 1) {
    pages.push(total - 2, total - 1, total);
  } else {
    pages.push(current - 1, current, current + 1);
  }

  return pages;
});

watch([() => filters.value.search, rowsPerPage], () => {
  currentPage.value = 1;
});

// ── Misc ─────────────────────────────────────────────────────────
const getRoleColor = (role: string) =>
  role === 'admin'
    ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
    : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';

// ── Export ───────────────────────────────────────────────────────
const onExport = () => {
  const data = filteredUsers.value.map((user, idx) => ({
    No: idx + 1,
    [t('namauser')]: user.name,
    Persnum: user.persnum,
    Role: user.role,
    Jabatan: user.positionText || '-'
  }));

  if (data.length === 0) {
    showToast(t('ma_err_title'), 'Tidak ada data untuk diekspor.', 'warning');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  worksheet['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 30 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Manajemen Akun');
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, `manajemen_akun_${new Date().toISOString().slice(0, 10)}.xlsx`);
  showToast(t('ma_tb_title'), 'Export berhasil.', 'success');
};

// ── Toast ────────────────────────────────────────────────────────
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

// ── Highlight ────────────────────────────────────────────────────
/**
 * Bungkus setiap kemunculan keyword dalam <mark> untuk highlight kuning.
 * Aman terhadap karakter regex spesial.
 */
function highlight(text: string, keyword: string): string {
  if (!keyword?.trim() || !text) return text;

  // Escape karakter regex spesial agar tidak error
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
