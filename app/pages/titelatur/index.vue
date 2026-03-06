<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, ArrowUpDown, Pencil, Trash2, Plus, RotateCcw } from 'lucide-vue-next'
import Heading from '~/components/Heading.vue'
import Modal from '~/components/Modal.vue'
import ConfirmPopup from '~/components/ConfirmPopup.vue'
import { useTitelatur } from '~/composables/useTitelatur'
import type { TitelaturItem } from '~/types/titelatur'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()

// ─── Computed breadcrumbs (locale-reactive) ───────────────────────────────────
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('tit_title'), to: '/admin/titelatur' }
])

// ================================
// COMPOSABLE
// ================================
const {
  items,
  loading,
  error,
  fetchTitelatur,
  fetchTitelaturById,
  createTitelatur,
  updateTitelatur,
  deleteTitelatur
} = useTitelatur()

onMounted(async () => {
  await fetchTitelatur(true)
})

// ================================
// SEARCH + SORT
// ================================
const search = ref('')
const filteredItems = computed(() => {
  const s = search.value.toLowerCase()
  return items.value.filter(
    (it) => it.long_text?.toLowerCase().includes(s) || it.long_text_en?.toLowerCase().includes(s)
  )
})

const refreshData = async () => {
  search.value = ''
  sortDirection.value = null
  currentPage.value = 1
  await fetchTitelatur(true)
}

const sortDirection = ref<'asc' | 'desc' | null>(null)
const toggleSort = () => {
  sortDirection.value =
    sortDirection.value === 'asc' ? 'desc' : sortDirection.value === 'desc' ? null : 'asc'
}

const sortedItems = computed(() => {
  let arr = [...filteredItems.value]
  if (sortDirection.value === 'asc')
    arr.sort((a, b) => (a.long_text || '').localeCompare(b.long_text || ''))
  if (sortDirection.value === 'desc')
    arr.sort((a, b) => (b.long_text || '').localeCompare(a.long_text || ''))
  return arr
})

// ================================
// PAGINATION
// ================================
const currentPage = ref(1)
const rowsPerPage = ref(10)

const totalItems = computed(() => filteredItems.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / rowsPerPage.value))

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return sortedItems.value.slice(start, start + rowsPerPage.value)
})

watch(rowsPerPage, () => (currentPage.value = 1))

const paginationPages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages: number[] = []
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else if (current <= 2) {
    pages.push(1, 2, 3, 4, 5)
  } else if (current >= total - 1) {
    pages.push(total - 2, total - 1, total)
  } else {
    pages.push(current - 1, current, current + 1)
  }
  return pages
})

// ================================
// MODAL: EDIT
// ================================
const showEditModal = ref(false)
const selectedItem = ref<TitelaturItem | null>(null)
const isSavingEdit = ref(false)

const editForm = ref({
  company: '10000',
  start_date: '',
  end_date: '9999-12-31',
  object_type: 'CO',
  long_text: '',
  long_text_en: ''
})

const openEdit = async (item: TitelaturItem) => {
  const fullItem = await fetchTitelaturById(item.id)
  if (fullItem) {
    selectedItem.value = fullItem
    editForm.value = {
      company: fullItem.company || '10000',
      start_date: fullItem.start_date || '',
      end_date: fullItem.end_date || '9999-12-31',
      object_type: fullItem.object_type || 'CO',
      long_text: fullItem.long_text || '',
      long_text_en: fullItem.long_text_en || ''
    }
    showEditModal.value = true
  }
}

const saveEdit = async () => {
  if (!selectedItem.value) return
  isSavingEdit.value = true
  try {
    const success = await updateTitelatur(selectedItem.value.id, {
      company: editForm.value.company,
      start_date: editForm.value.start_date,
      end_date: editForm.value.end_date,
      object_type: editForm.value.object_type,
      long_text: editForm.value.long_text,
      long_text_en: editForm.value.long_text_en
    })
    if (success) showEditModal.value = false
  } finally {
    isSavingEdit.value = false
  }
}

// ================================
// MODAL: ADD
// ================================
const showAddModal = ref(false)
const isSavingAdd = ref(false)

const addForm = ref({
  company: '10000',
  start_date: new Date().toISOString().split('T')[0],
  end_date: '9999-12-31',
  object_type: 'CO',
  long_text: '',
  long_text_en: ''
})

const openAdd = () => {
  addForm.value = {
    company: '10000',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '9999-12-31',
    object_type: 'CO',
    long_text: '',
    long_text_en: ''
  }
  showAddModal.value = true
}

const saveAdd = async () => {
  isSavingAdd.value = true
  try {
    const success = await createTitelatur({
      company: addForm.value.company,
      start_date: addForm.value.start_date,
      end_date: addForm.value.end_date,
      object_type: addForm.value.object_type,
      long_text: addForm.value.long_text,
      long_text_en: addForm.value.long_text_en
    })
    if (success) showAddModal.value = false
  } finally {
    isSavingAdd.value = false
  }
}

// ================================
// POPUP DELETE
// ================================
const confirmDeleteOpen = ref(false)
const itemToDelete = ref<TitelaturItem | null>(null)
const isDeletingItem = ref(false)

const openDelete = (item: TitelaturItem) => {
  itemToDelete.value = item
  confirmDeleteOpen.value = true
}

const deleteNow = async () => {
  if (!itemToDelete.value) return
  isDeletingItem.value = true
  try {
    const success = await deleteTitelatur(itemToDelete.value.id, itemToDelete.value.long_text)
    if (success) confirmDeleteOpen.value = false
  } finally {
    isDeletingItem.value = false
  }
}
</script>

<template>
  <div class="space-y-6 pt-5 min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-2">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-white">
          {{ $t('tit_title') }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
      <button
        @click="openAdd()"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition"
      >
        <Plus class="w-4 h-4" />
        {{ $t('tit_btn_tambah') }}
      </button>
    </div>

    <!-- ERROR STATE -->
    <div
      v-if="error"
      class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4"
    >
      {{ error }}
    </div>

    <!-- CARD -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col mt-5"
    >
      <!-- TOP BAR -->
      <div
        class="p-3 border-b border-gray-300 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-3"
      >
        <div class="flex items-center gap-3 flex-wrap">
          <select
            v-model="rowsPerPage"
            class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option v-for="n in [5, 10, 15]" :key="n" :value="n">
              {{ n }}
            </option>
          </select>

          <div class="flex items-center gap-2">
            <button
              @click="toggleSort"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
              :title="$t('tit_tooltip_urutkan')"
            >
              <ArrowUpDown class="w-4 h-4" />
            </button>
            <button
              @click="refreshData"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
              :title="$t('tit_tooltip_refresh')"
            >
              <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            </button>
          </div>
        </div>

        <!-- Search -->
        <div class="relative flex-1 w-full">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="search"
            :placeholder="$t('tit_cari_placeholder')"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-primary dark:bg-primary-700 text-white">
            <tr>
              <th class="px-4 py-3 font-semibold">
                {{ $t('tit_col_indonesia') }}
              </th>
              <th class="px-4 py-3 font-semibold">
                {{ $t('tit_col_inggris') }}
              </th>
              <th class="px-4 py-3 font-semibold text-center">
                {{ $t('tit_col_aksi') }}
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- SKELETON -->
            <template v-if="loading">
              <tr
                v-for="i in rowsPerPage"
                :key="'skeleton-' + i"
                class="border-b border-gray-200 dark:border-gray-700 animate-pulse"
              >
                <td class="px-5 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                </td>
                <td class="px-5 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-center gap-5">
                    <div class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div class="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </td>
              </tr>
            </template>

            <!-- DATA ROWS -->
            <template v-else>
              <tr
                v-for="it in paginatedItems"
                :key="it.id"
                class="border-b border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-gray-700 transition"
              >
                <td class="px-5 py-3 text-gray-900 dark:text-white">
                  {{ it.long_text || '-' }}
                </td>
                <td class="px-5 py-3 text-gray-900 dark:text-white">
                  {{ it.long_text_en || '-' }}
                </td>
                <td class="px-4 py-3 text-center flex justify-center gap-1">
                  <button
                    @click="openEdit(it)"
                    class="text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 hover:bg-yellow-100 p-2 rounded-lg dark:hover:text-yellow-300 dark:hover:bg-yellow-50 transition"
                    :title="$t('tit_tooltip_edit')"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="openDelete(it)"
                    class="text-red-500 dark:text-red-400 hover:text-red-600 dark:bg-red-100 hover:bg-red-100 p-2 rounded-lg dark:hover:text-red-300 transition"
                    :title="$t('tit_tooltip_hapus')"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-if="paginatedItems.length === 0">
                <td colspan="3" class="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                  {{ $t('tit_empty') }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div
        v-if="filteredItems.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {{ $t('menampilkan') }} {{ paginatedItems.length }} {{ $t('dari') }} {{ totalItems }}
          {{ $t('data') }}
        </div>

        <div class="flex items-center gap-2">
          <!-- BACK -->
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
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
              @click="currentPage = 1"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
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
              @click="currentPage = totalPages"
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
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

    <!-- MODAL EDIT -->
    <Teleport to="body">
      <Modal v-model="showEditModal" @save="saveEdit" size="xl">
        <template #title>
          <div class="mt-5 ml-5 mb-5">
            <Heading variant="heading9b" class="font-semibold text-sm dark:text-white">
              {{ $t('tit_modal_edit_title') }}
            </Heading>
          </div>
        </template>
        <div class="flex flex-col gap-2 mt-1 p-1">
          <Heading variant="body2m" class="dark:text-gray-200">
            {{ $t('tit_label_indonesia') }} <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="editForm.long_text"
            class="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 rounded-md text-sm bg-gray-50 mb-5 focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <Heading variant="body2m" class="dark:text-gray-200">
            {{ $t('tit_label_inggris') }} <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="editForm.long_text_en"
            class="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 rounded-md text-sm bg-gray-50 mb-3 focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </Modal>
    </Teleport>

    <!-- MODAL ADD -->
    <Teleport to="body">
      <Modal v-model="showAddModal" @save="saveAdd" size="xl">
        <template #title>
          <div class="mt-5 ml-5 mb-5">
            <Heading variant="heading9b" class="font-semibold text-sm dark:text-white">
              {{ $t('tit_modal_tambah_title') }}
            </Heading>
          </div>
        </template>
        <div class="flex flex-col gap-2 mt-1 p-1">
          <Heading variant="body2m" class="dark:text-gray-200">
            {{ $t('tit_label_indonesia') }} <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="addForm.long_text"
            :placeholder="$t('tit_placeholder_indonesia')"
            class="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 rounded-md text-sm bg-gray-50 mb-5 focus:ring-2 focus:ring-primary focus:outline-none"
          />
          <Heading variant="body2m" class="dark:text-gray-200">
            {{ $t('tit_label_inggris') }} <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="addForm.long_text_en"
            :placeholder="$t('tit_placeholder_inggris')"
            class="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 rounded-md text-sm bg-gray-50 mb-3 focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
      </Modal>
    </Teleport>

    <!-- POPUP DELETE -->
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      type="danger"
      :title="$t('tit_popup_hapus_title')"
      :message="$t('tit_popup_hapus_message')"
      :confirmText="$t('tit_popup_hapus_confirm')"
      :cancelText="$t('tit_popup_hapus_batal')"
      cancelColor="primary"
      :loading="isDeletingItem"
      @confirm="deleteNow"
    />
  </div>
</template>
