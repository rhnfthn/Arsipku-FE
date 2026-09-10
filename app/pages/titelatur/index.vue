<script setup lang="ts">
const { canAccessPage } = useFeatureAccess()
const { hasPermission, user } = useAuth()
const isUser = computed(() => (user.value?.role || '').toUpperCase() === 'USER')
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, ArrowUpDown, Pencil, Trash2, Plus, RotateCcw, ChevronDown, FileDown } from 'lucide-vue-next'
import Heading from '~/components/Heading.vue'
import Modal from '~/components/Modal.vue'
import ConfirmPopup from '~/components/ConfirmPopup.vue'
import ExportColumnModal from '~/components/ExportColumnModal.vue'
import { useTitelatur } from '~/composables/useTitelatur'
import type { TitelaturItem } from '~/types/titelatur'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('tit_title'), to: '/admin/titelatur' }
])

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
const addErrors = ref({
  long_text: '',
  long_text_en: ''
})
onMounted(async () => {
  await fetchTitelatur(true)
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})

// ─── Search + Sort ────────────────────────────────────────────────────────────
const search = ref('')

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

function highlight(text: string | null | undefined, keyword: string): string {
  const safeText = escapeHtml(String(text ?? '-'))
  const q = keyword.trim()
  if (!q) return safeText

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')

  return safeText.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-white rounded px-0.5">$1</mark>'
  )
}

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

// ─── Pagination ───────────────────────────────────────────────────────────────
const currentPage = ref(1)
const rowsPerPage = ref(10)
const rowsChoices = [10, 25, 50, 100]
const showRowsDropdown = ref(false)
const rowsRef = ref<HTMLElement | null>(null)

const selectRowsPerPage = (n: number) => {
  rowsPerPage.value = n
  showRowsDropdown.value = false
  currentPage.value = 1
}

const totalItems = computed(() => filteredItems.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / rowsPerPage.value)))

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

// ─── Click outside ────────────────────────────────────────────────────────────
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (rowsRef.value && !rowsRef.value.contains(target)) showRowsDropdown.value = false
}

// ─── Modal: Edit ──────────────────────────────────────────────────────────────
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

// ─── Modal: Add ───────────────────────────────────────────────────────────────
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
  // reset error
  addErrors.value = {
    long_text: '',
    long_text_en: ''
  }

  // validasi
  let isValid = true

  if (!addForm.value.long_text.trim()) {
    addErrors.value.long_text = t('tit_validationI_required')
    isValid = false
  }

  if (!addForm.value.long_text_en.trim()) {
    addErrors.value.long_text_en = t('tit_validationE_required')
    isValid = false
  }

  if (!isValid) return

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

// ─── Popup Delete ─────────────────────────────────────────────────────────────
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
    const success = await deleteTitelatur(itemToDelete.value.id, itemToDelete.value.long_text || undefined)
    if (success) confirmDeleteOpen.value = false
  } finally {
    isDeletingItem.value = false
  }
}

// ─── Export Excel ─────────────────────────────────────────────────────────────
const showExportModal = ref(false)
const isExporting = ref(false)

const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'indonesia', label: t('tit_col_indonesia'), desc: 'Titelatur bahasa Indonesia' },
  { key: 'inggris', label: t('tit_col_inggris'), desc: 'Titelatur bahasa Inggris' }
])

const openExportModal = () => {
  showExportModal.value = true
}

const handleExportConfirm = (selectedKeys: string[]) => {
  if (filteredItems.value.length === 0 || selectedKeys.length === 0) return
  isExporting.value = true
  try {
    const excelData = filteredItems.value.map((item: TitelaturItem, idx: number) => {
      const r: Record<string, any> = {}
      if (selectedKeys.includes('No')) r['No'] = idx + 1
      if (selectedKeys.includes('indonesia')) r[t('tit_col_indonesia')] = item.long_text || '-'
      if (selectedKeys.includes('inggris')) r[t('tit_col_inggris')] = item.long_text_en || '-'
      return r
    })

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, t('tit_title'))
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    saveAs(blob, `titelatur_${new Date().toISOString().slice(0, 10)}.xlsx`)
    showExportModal.value = false
  } catch (error) {
    console.error('Gagal export titelatur:', error)
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="space-y-6 pt-5 min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-2">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-white">
          {{ $t('tit_title') }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>
      <button
        v-if="!isUser && hasPermission('titelatur', 'create')"
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
        class="p-3.5 border-b border-gray-300 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-3"
      >
        <div class="flex items-center gap-3 flex-wrap">
          <!-- ROWS PER PAGE -->
          <div class="relative" ref="rowsRef">
            <button
              type="button"
              @click.stop="showRowsDropdown = !showRowsDropdown"
              class="h-9 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
            >
              <span>{{ rowsPerPage }}</span>
              <ChevronDown
                class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                :class="{ 'rotate-180': showRowsDropdown }"
              />
            </button>
            <Transition name="rows-dd">
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

        <!-- EXPORT BUTTON -->
        <button
          @click="openExportModal"
          class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm transition whitespace-nowrap"
        >
          <FileDown class="w-4 h-4" />
          Export
        </button>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-primary dark:bg-primary-700 text-white">
            <tr>
              <th class="px-4 py-3 font-semibold">{{ $t('tit_col_indonesia') }}</th>
              <th class="px-4 py-3 font-semibold">{{ $t('tit_col_inggris') }}</th>
              <th class="px-4 py-3 font-semibold text-center">{{ $t('tit_col_aksi') }}</th>
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
                <td
                  class="px-5 py-3 text-gray-900 dark:text-white"
                  v-html="highlight(it.long_text || '-', search)"
                ></td>
                <td class="px-5 py-3 text-gray-900 dark:text-white">
                  <span v-html="highlight(it.long_text_en || '-', search)"></span>
                </td>
                <td class="px-4 py-3 text-center flex justify-center gap-1">
                  <button
                    v-if="!isUser"
                    @click="openEdit(it)"
                    class="text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 hover:bg-yellow-100 p-2 rounded-lg dark:hover:text-yellow-300 dark:hover:bg-yellow-50 transition"
                    :title="$t('tit_tooltip_edit')"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    v-if="!isUser"
                    @click="openDelete(it)"
                    class="text-red-500 dark:text-red-400 hover:text-red-600 dark:bg-red-100 hover:bg-red-100 p-2 rounded-lg dark:hover:text-red-300 transition"
                    :title="$t('tit_tooltip_hapus')"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>

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
      <!-- <Modal v-model="showAddModal" @save="saveAdd" size="xl"> -->
      <Modal
        v-model="showAddModal"
        @save="saveAdd"
        :disableSave="!addForm.long_text || !addForm.long_text_en"
        size="xl"
      >
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
            @input="addErrors.long_text = ''"
            :class="[
              'w-full border px-3 py-2 rounded-md text-sm bg-gray-50 dark:bg-gray-700 dark:text-white mb-1 focus:ring-2 focus:outline-none transition',
              addErrors.long_text
                ? 'border-red-500 focus:ring-red-400'
                : 'border-gray-200 dark:border-gray-600 focus:ring-primary'
            ]"
          />
          <p v-if="addErrors.long_text" class="text-red-500 text-xs mb-3">
            {{ addErrors.long_text }}
          </p>
          <Heading variant="body2m" class="dark:text-gray-200">
            {{ $t('tit_label_inggris') }} <span class="text-red-500">*</span>
          </Heading>
          <input
            v-model="addForm.long_text_en"
            :placeholder="$t('tit_placeholder_inggris')"
            @input="addErrors.long_text_en = ''"
            :class="[
              'w-full border px-3 py-2 rounded-md text-sm bg-gray-50 dark:bg-gray-700 dark:text-white mb-1 focus:ring-2 focus:outline-none transition',
              addErrors.long_text_en
                ? 'border-red-500 focus:ring-red-400'
                : 'border-gray-200 dark:border-gray-600 focus:ring-primary'
            ]"
          />
          <p v-if="addErrors.long_text_en" class="text-red-500 text-xs mb-3">
            {{ addErrors.long_text_en }}
          </p>
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

    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="filteredItems.length"
      :title="$t('tit_export_title')"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<style scoped>
.rows-dd-enter-active,
.rows-dd-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}
.rows-dd-enter-from,
.rows-dd-leave-to {
  opacity: 0;
  transform: scaleY(0.9) translateY(-4px);
}
.rows-dd-enter-to,
.rows-dd-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}
</style>
