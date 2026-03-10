<template>
  <div
    class="w-full pt-5 flex flex-col text-gray-800 dark:text-gray-100 bg-gray-50 dark:bg-gray-900"
  >
    <!-- HEADER -->
    <div class="flex items-center justify-between w-full mb-2">
      <div>
        <Heading variant="heading6b" class="text-mobile-md dark:text-gray-100">
          {{ $t('tmpl_title') }}
        </Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <button
        @click="openAdd"
        :disabled="isLoadingCreate"
        class="flex items-center gap-2 bg-primary dark:bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-800 dark:hover:bg-primary-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        <Plus class="w-4 h-4" />
        {{ isLoadingCreate ? $t('tmpl_btn_menyimpan') : $t('tmpl_btn_tambah') }}
      </button>
    </div>

    <!-- CARD -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm w-full border border-gray-200 dark:border-gray-700"
    >
      <!-- TOP BAR -->
      <div
        class="flex flex-col md:flex-row justify-between items-center gap-4 p-3 border-b border-gray-200 dark:border-gray-700"
      >
        <!-- ROWS PER PAGE -->
        <div class="flex items-center gap-2">
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
        </div>

        <!-- SEARCH -->
        <div class="relative w-full justify-between">
          <Search
            class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
          />
          <input
            v-model="search"
            :placeholder="$t('tmpl_cari_placeholder')"
            class="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
          />
        </div>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <table class="w-full text-xs border-collapse">
          <thead class="bg-primary dark:bg-primary-700 text-white sticky top-0 z-10">
            <tr class="p-3">
              <th
                class="text-left text-[14px] px-4 py-3 dark:border-gray-700 cursor-pointer hover:bg-primary-600 dark:hover:bg-primary-800 transition"
                @click="handleSort('nama_templat')"
              >
                <div class="flex items-center gap-2">
                  {{ $t('tmpl_col_nama') }}
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="[
                      sortKey === 'nama_templat' ? 'opacity-100' : 'opacity-50',
                      sortKey === 'nama_templat' && sortOrder === 'desc' ? 'rotate-180' : 'rotate-0'
                    ]"
                  />
                </div>
              </th>

              <th
                class="text-left text-[14px] border-b border-gray-300 dark:border-gray-700 cursor-pointer hover:bg-primary-600 dark:hover:bg-primary-800 transition"
                @click="handleSort('file')"
              >
                <div class="flex items-center gap-2">
                  {{ $t('tmpl_col_file') }}
                  <ArrowUpDown
                    class="w-4 h-4 origin-center transition-transform duration-200"
                    :class="[
                      sortKey === 'file' ? 'opacity-100' : 'opacity-50',
                      sortKey === 'file' && sortOrder === 'desc' ? 'rotate-180' : 'rotate-0'
                    ]"
                  />
                </div>
              </th>

              <th
                class="text-center text-[14px] border-b border-gray-300 dark:border-gray-700 w-28"
              >
                {{ $t('tmpl_col_aksi') }}
              </th>
            </tr>
          </thead>

          <tbody>
            <!-- SKELETON -->
            <tr
              v-if="isLoadingList"
              v-for="i in rowsPerPage"
              :key="`sk-${i}`"
              class="border-b border-gray-100 dark:border-gray-700"
            >
              <td class="px-4 py-3.5">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  :style="{ width: `${50 + (i % 4) * 10}%` }"
                ></div>
              </td>
              <td class="px-4 py-3.5">
                <div
                  class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
                  :style="{ width: `${40 + (i % 3) * 12}%` }"
                ></div>
              </td>
              <td class="px-4 py-3.5">
                <div class="flex items-center justify-center gap-2">
                  <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
              </td>
            </tr>

            <!-- EMPTY -->
            <tr v-else-if="paginatedTemplates.length === 0">
              <td colspan="3" class="text-center py-10 text-gray-400 dark:text-gray-500">
                <Inbox class="w-10 h-10 mx-auto mb-2 opacity-20" />
                {{ $t('tmpl_empty') }}
              </td>
            </tr>

            <!-- DATA ROWS -->
            <tr
              v-else
              v-for="template in paginatedTemplates"
              :key="template.id"
              class="border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <td class="p-4 text-sm dark:text-gray-200">{{ template.nama_template }}</td>
              <td class="p-4 text-primary dark:text-primary-400 text-sm">
                {{ getFileName(template.file) }}
              </td>
              <td class="px-4 py-2">
                <div class="flex justify-center gap-3">
                  <button
                    @click="downloadTemplate(template)"
                    class="p-2 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-lg text-sky-600 dark:text-sky-500 transition-colors"
                    :title="$t('tmpl_tooltip_download')"
                  >
                    <Download class="w-4 h-4" />
                  </button>
                  <button
                    class="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-500 transition-colors"
                    @click="openEdit(template)"
                    :title="$t('tmpl_tooltip_edit')"
                    :disabled="isLoadingUpdate"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="openDelete(template)"
                    class="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-500 transition-colors"
                    :title="$t('tmpl_tooltip_hapus')"
                    :disabled="isLoadingDelete"
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
        v-if="filteredTemplates.length > 0"
        class="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div class="text-xs text-gray-600 dark:text-gray-400">
          {{ $t('tmpl_menampilkan') }} {{ paginatedTemplates.length }} {{ $t('dari') }}
          {{ totalItems }} {{ $t('data') }}
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
              currentPage === 1
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
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
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all dark:text-gray-200"
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
                  ? 'bg-primary dark:bg-primary-700 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400'
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
              class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary dark:hover:text-primary-400 transition-all dark:text-gray-200"
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
                : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
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

    <!-- MODAL TAMBAH -->
    <Teleport to="body">
      <Modal v-model="addModal" @save="saveAdd" size="xl">
        <template #title>
          <Heading
            variant="heading8b"
            class="font-semibold text-xl mb-5 mt-5 ml-7 dark:text-gray-100"
          >
            {{ $t('tmpl_modal_tambah_title') }}
          </Heading>
        </template>
        <div class="px-2 py-3 flex flex-col gap-6">
          <div class="flex flex-col">
            <Heading variant="heading10sb" class="mb-2 dark:text-gray-200">
              {{ $t('tmpl_label_nama') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="addData.nama_template"
              class="w-full px-5 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:outline-none"
              :placeholder="$t('tmpl_placeholder_nama')"
            />
          </div>
          <div class="flex flex-col">
            <Heading variant="heading10sb" class="mb-2 dark:text-gray-200">
              {{ $t('tmpl_label_file') }} <span class="text-red-500">*</span>
            </Heading>
            <label
              class="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <FileCheck class="w-6 h-6 text-gray-500 dark:text-gray-400" />
              <span class="font-medium dark:text-gray-200">{{ $t('tmpl_pilih_file') }}</span>
              <span class="ml-2 text-gray-500 dark:text-gray-400">{{
                addData.fileName || $t('tmpl_belum_ada_file')
              }}</span>
              <input
                type="file"
                class="hidden"
                accept=".pdf,.doc,.docx,.xlsx,.xls,.html"
                @change="handleAddFile"
              />
            </label>
            <div
              v-if="addData.file"
              class="mt-3 px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <FileCheck class="w-6 h-6 text-primary-500 dark:text-primary-400" />
                <div>
                  <p class="text-xs font-medium dark:text-gray-200">{{ addData.fileName }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatFileSize(addData.file.size) }}
                  </p>
                </div>
              </div>
              <button
                @click="clearAddFile"
                class="p-2 text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300 transition"
                :title="$t('tmpl_tooltip_hapus')"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- MODAL EDIT -->
    <Teleport to="body">
      <Modal v-model="editModal" @save="saveEdit" size="xl">
        <template #title>
          <Heading
            variant="heading9b"
            class="font-semibold text-xl mb-2 mt-5 ml-7 dark:text-gray-100"
          >
            {{ $t('tmpl_modal_edit_title') }}
          </Heading>
        </template>
        <div class="px-2 py-3 flex flex-col gap-6">
          <div class="flex flex-col">
            <Heading variant="heading10sb" class="font-semibold mb-2 dark:text-gray-200">
              {{ $t('tmpl_label_nama') }} <span class="text-red-500">*</span>
            </Heading>
            <input
              v-model="editData.nama_template"
              class="w-full px-5 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:outline-none"
              :placeholder="$t('tmpl_placeholder_nama')"
            />
          </div>
          <div class="flex flex-col">
            <Heading variant="heading10sb" class="font-semibold mb-2 dark:text-gray-200">
              {{ $t('tmpl_label_file') }}
              <span class="text-xs text-gray-500 dark:text-gray-400"
                >({{ $t('tmpl_label_file_opsional') }})</span
              >
            </Heading>
            <label
              class="w-full px-4 py-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <FileCheck class="w-6 h-6 text-gray-500 dark:text-gray-400" />
              <span class="font-medium dark:text-gray-200">{{ $t('tmpl_pilih_file_baru') }}</span>
              <span class="ml-2 text-gray-500 dark:text-gray-400">{{
                editData.newFileName || $t('tmpl_tidak_ada_file_baru')
              }}</span>
              <input type="file" class="hidden" @change="handleEditFile" />
            </label>
            <div
              v-if="!editData.newFileName && editData.file"
              class="mt-3 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-3"
            >
              <FileCheck class="w-6 h-6 text-gray-400 dark:text-gray-500" />
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ $t('tmpl_file_saat_ini') }}
                </p>
                <p class="text-sm font-medium dark:text-gray-200">
                  {{ getFileName(editData.file) }}
                </p>
              </div>
            </div>
            <div
              v-if="editData.newFileName"
              class="mt-3 px-4 py-2 rounded-lg border border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <FileCheck class="w-6 h-6 text-primary-500 dark:text-primary-400" />
                <div>
                  <p class="text-xs text-primary-600 dark:text-primary-400">
                    {{ $t('tmpl_file_baru') }}
                  </p>
                  <p class="text-sm font-medium dark:text-gray-200">{{ editData.newFileName }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ editData.newFile ? formatFileSize(editData.newFile.size) : '-' }}
                  </p>
                </div>
              </div>
              <button
                @click="clearEditFile"
                class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                :title="$t('tmpl_tooltip_hapus')"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </Teleport>

    <!-- POPUP DELETE -->
    <ConfirmPopup
      v-model="confirmDeleteOpen"
      type="danger"
      :title="$t('tmpl_popup_hapus_title')"
      :message="$t('tmpl_popup_hapus_pesan')"
      :confirmText="$t('tmpl_popup_hapus_confirm')"
      :cancelText="$t('tmpl_popup_hapus_batal')"
      cancelColor="primary"
      @confirm="deleteNow"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Inbox,
  FileCheck,
  Search,
  ArrowUpDown,
  Download,
  Pencil,
  Trash2,
  Plus,
  ChevronDown
} from 'lucide-vue-next'
import Heading from '~/components/Heading.vue'
import Modal from '~/components/Modal.vue'
import PageHeader from '~/components/PageHeader.vue'
import ConfirmPopup from '~/components/ConfirmPopup.vue'
import { useTemplate } from '~/composables/useTemplate'
import type { Template } from '~/types/template'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const toast = useToast()

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('tmpl_title'), to: '/admin/template' }
])

const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  isLoadingList,
  isLoadingCreate,
  isLoadingUpdate,
  isLoadingDelete
} = useTemplate()

// ─── State ────────────────────────────────────────────────────────────────────
const templates = ref<Template[]>([])
const search = ref('')
const editModal = ref(false)
const addModal = ref(false)
const confirmDeleteOpen = ref(false)
const itemToDelete = ref<Template | null>(null)

const editData = ref<any>({ id: '', nama_template: '', file: '', newFile: null, newFileName: '' })
const addData = ref<any>({ nama_template: '', file: null, fileName: '' })

// ─── Fetch ────────────────────────────────────────────────────────────────────
const fetchData = async () => {
  try {
    const data = await getTemplates()
    templates.value = data
  } catch (error) {
    console.error('❌ Error loading templates:', error)
  }
}

// ─── Sort ─────────────────────────────────────────────────────────────────────
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

const filteredTemplates = computed(() => {
  const s = search.value.toLowerCase()
  return templates.value.filter(
    (template) =>
      template.nama_template.toLowerCase().includes(s) || template.file.toLowerCase().includes(s)
  )
})

const sortedTemplates = computed(() => {
  if (!sortKey.value) return filteredTemplates.value
  return [...filteredTemplates.value].sort((a, b) => {
    const A = a[sortKey.value]
    const B = b[sortKey.value]
    if (A < B) return sortOrder.value === 'asc' ? -1 : 1
    if (A > B) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

// ─── Pagination ───────────────────────────────────────────────────────────────
const rowsPerPage = ref(10)
const rowsChoices = [10, 25, 50, 100]
const showRowsDropdown = ref(false)
const rowsRef = ref<HTMLElement | null>(null)
const currentPage = ref(1)

const selectRowsPerPage = (n: number) => {
  rowsPerPage.value = n
  showRowsDropdown.value = false
  currentPage.value = 1
}

const paginatedTemplates = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return sortedTemplates.value.slice(start, start + rowsPerPage.value)
})

const totalItems = computed(() => filteredTemplates.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / rowsPerPage.value)))

const paginationPages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const delta = 2
  const range: number[] = []
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
    range.push(i)
  }
  return range
})

watch([search, rowsPerPage], () => {
  currentPage.value = 1
})

// ─── Click outside ────────────────────────────────────────────────────────────
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (rowsRef.value && !rowsRef.value.contains(target)) showRowsDropdown.value = false
}

// ─── Add ──────────────────────────────────────────────────────────────────────
const openAdd = () => {
  addData.value = { nama_template: '', file: null, fileName: '' }
  addModal.value = true
}
const handleAddFile = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  addData.value.file = file
  addData.value.fileName = file.name
}
const clearAddFile = () => {
  addData.value.file = null
  addData.value.fileName = ''
}
const saveAdd = async () => {
  if (!addData.value.nama_template || !addData.value.file) {
    toast.add({
      title: t('tmpl_toast_form_tidak_lengkap'),
      description: t('tmpl_toast_nama_file_wajib'),
      color: 'yellow'
    })
    return
  }
  try {
    await createTemplate({ nama_template: addData.value.nama_template, file: addData.value.file })
    addModal.value = false
    await fetchData()
    currentPage.value = 1
  } catch (error) {
    console.error('❌ Error creating template:', error)
  }
}

// ─── Edit ─────────────────────────────────────────────────────────────────────
const openEdit = async (template: Template) => {
  try {
    const detail = await getTemplateById(template.id)
    if (detail) {
      editData.value = {
        id: detail.id,
        nama_template: detail.nama_template,
        file: detail.file,
        file_url: detail.file_url,
        newFile: null,
        newFileName: ''
      }
      editModal.value = true
    }
  } catch (error) {
    console.error('❌ Error opening edit modal:', error)
  }
}
const handleEditFile = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  editData.value.newFile = file
  editData.value.newFileName = file.name
}
const clearEditFile = () => {
  editData.value.newFile = null
  editData.value.newFileName = ''
}
const saveEdit = async () => {
  if (!editData.value.nama_template) {
    toast.add({
      title: t('tmpl_toast_form_tidak_lengkap'),
      description: t('tmpl_toast_nama_wajib'),
      color: 'yellow'
    })
    return
  }
  try {
    const payload: any = { nama_template: editData.value.nama_template }
    if (editData.value.newFile) payload.file = editData.value.newFile
    await updateTemplate(editData.value.id, payload)
    editModal.value = false
    await fetchData()
  } catch (error) {
    console.error('❌ Error updating template:', error)
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
const openDelete = (template: Template) => {
  itemToDelete.value = template
  confirmDeleteOpen.value = true
}
const deleteNow = async () => {
  if (!itemToDelete.value) return
  try {
    await deleteTemplate(itemToDelete.value.id)
    confirmDeleteOpen.value = false
    await fetchData()
  } catch (error) {
    console.error('❌ Error deleting template:', error)
  } finally {
    itemToDelete.value = null
  }
}

// ─── Download ─────────────────────────────────────────────────────────────────
const downloadTemplate = (template: Template) => {
  if (template.file_url) {
    window.open(template.file_url, '_blank')
  } else {
    toast.add({
      title: t('tmpl_toast_url_tidak_tersedia'),
      description: t('tmpl_toast_tidak_bisa_unduh'),
      color: 'red'
    })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getFileName = (filePath: string): string => {
  if (!filePath) return '-'
  const parts = filePath.split('/')
  return parts[parts.length - 1]
}
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchData()
  document.addEventListener('click', handleDocumentClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

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
