<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-5">
    <AccessDenied v-if="!canAccessPage()" />
    <div v-else class="w-full">
      <!-- HEADER -->
      <div class="mb-2">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <Heading variant="heading6b" class="text-2xl font-bold text-gray-900 dark:text-white">
              Log Email
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
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 p-3.5">
          <!-- ROWS PER PAGE + SEARCH + FILTER -->
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

            <!-- STATUS FILTER -->
            <div class="relative" ref="statusRef">
              <button
                type="button"
                @click.stop="showStatusDropdown = !showStatusDropdown"
                class="h-9 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[130px] justify-between hover:border-primary transition-all"
              >
                <span>{{ filterStatusLabel }}</span>
                <ChevronDown
                  class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
                  :class="{ 'rotate-180': showStatusDropdown }"
                />
              </button>
              <Transition name="filter-dd">
                <div
                  v-if="showStatusDropdown"
                  class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                >
                  <button
                    v-for="opt in statusOptions"
                    :key="opt.value"
                    type="button"
                    @click.stop="selectStatus(opt.value)"
                    :class="[
                      'w-full text-left px-4 py-2.5 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors',
                      filterStatus === opt.value
                        ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                    ]"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </Transition>
            </div>

            <!-- SEARCH -->
            <div class="relative flex-1">
              <input
                v-model="searchQuery"
                @input="debounceSearch"
                type="text"
                placeholder="Cari pengirim, subjek, atau penerima..."
                class="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
              />
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
              />
            </div>
          </div>

          <!-- REFRESH BUTTON -->
          <button
            @click="fetchLogs"
            :disabled="loading"
            class="flex items-center gap-2 text-white text-sm px-4 py-2.5 rounded-lg font-medium whitespace-nowrap shadow-sm hover:shadow-md bg-primary hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw class="w-4 h-4" :class="{ 'animate-spin': loading }" />
            Refresh
          </button>

          <!-- EXPORT BUTTON -->
          <button
            @click="openExportModal"
            class="flex items-center gap-2 text-white text-sm px-4 py-2.5 rounded-lg font-medium whitespace-nowrap shadow-sm hover:shadow-md bg-primary hover:bg-primary-700 transition-all"
          >
            <FileDown class="w-4 h-4" />
            Export
          </button>
        </div>

        <!-- TABLE -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <!-- THEAD -->
            <thead class="bg-primary dark:bg-primary-700 text-white sticky top-0 z-10">
              <tr>
                <th
                  @click="handleSort('created_at')"
                  class="px-4 py-3 text-left text-sm tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>Waktu</span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'created_at' ? 'opacity-100' : 'opacity-40',
                        sortKey === 'created_at' && sortOrder === 'desc' ? 'rotate-180' : ''
                      ]"
                    />
                  </div>
                </th>
                <th
                  @click="handleSort('sender_nama')"
                  class="px-4 py-3 text-left text-sm tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>Pengirim</span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'sender_nama' ? 'opacity-100' : 'opacity-40',
                        sortKey === 'sender_nama' && sortOrder === 'desc' ? 'rotate-180' : ''
                      ]"
                    />
                  </div>
                </th>
                <th
                  @click="handleSort('subjek')"
                  class="px-4 py-3 text-left text-sm tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>Subjek</span>
                    <ArrowUpDown
                      class="w-4 h-4 transition-transform duration-200"
                      :class="[
                        sortKey === 'subjek' ? 'opacity-100' : 'opacity-40',
                        sortKey === 'subjek' && sortOrder === 'desc' ? 'rotate-180' : ''
                      ]"
                    />
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-sm tracking-wider">
                  <span>To</span>
                </th>
                <th class="px-4 py-3 text-left text-sm tracking-wider">
                  <span>Surat</span>
                </th>
                <th class="px-4 py-3 text-left text-sm tracking-wider">
                  <span>Lampiran</span>
                </th>
                <th
                  @click="handleSort('status')"
                  class="px-4 py-3 text-left text-sm tracking-wider cursor-pointer transition-colors hover:bg-primary-600 dark:hover:bg-primary-800"
                >
                  <div class="flex items-center gap-2">
                    <span>Status</span>
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
              <template v-if="loading">
                <tr v-for="i in rowsPerPage" :key="`skeleton-${i}`">
                <td class="px-6 py-4">
                  <div class="space-y-2">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                    <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    <div class="space-y-1">
                      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-28"></div>
                      <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="space-y-1">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                    <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse w-20"></div>
                </td>
                </tr>
              </template>

              <!-- EMPTY -->
              <tr v-else-if="sortedLogs.length === 0">
                <td colspan="7" class="px-6 py-12 text-center">
                  <div class="flex flex-col items-center gap-2">
                    <Search class="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      Tidak ada log email
                    </span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">
                      Coba ubah filter atau kata kunci pencarian
                    </span>
                  </div>
                </td>
              </tr>

              <!-- DATA ROWS -->
              <tr
                v-else
                v-for="log in sortedLogs"
                :key="log.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <!-- Waktu -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <div class="flex flex-col">
                    <span class="font-medium">{{ formatDate(log.created_at) }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatTime(log.created_at) }}</span>
                  </div>
                </td>

                <!-- Pengirim -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-8 h-8 rounded-full bg-primary-500 dark:bg-primary-900 text-white dark:text-primary-300 flex items-center justify-center font-semibold text-xs"
                    >
                      {{ getUserInitials(log.sender_nama || log.sender_persnum) }}
                    </div>
                    <div class="flex flex-col">
                      <span class="font-medium">{{ log.sender_nama || log.sender_persnum || '-' }}</span>
                      <span class="text-xs text-gray-400">{{ log.from_as }}</span>
                    </div>
                  </div>
                </td>

                <!-- Subjek -->
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="log.subjek">
                  <span v-html="highlight(log.subjek, searchQuery)"></span>
                </td>

                <!-- To -->
                <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="log.to">
                  <span v-html="highlight(log.to, searchQuery)"></span>
                </td>

                <!-- Surat -->
                <td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div class="flex flex-col">
                    <span class="text-xs font-medium">{{ log.nomor_surat || '-' }}</span>
                    <span class="text-xs text-gray-400 max-w-xs truncate" :title="log.perihal">{{ log.perihal || '-' }}</span>
                  </div>
                </td>

                <!-- Lampiran -->
                <td class="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                  {{ log.lampiran_count || 0 }}
                </td>

                <!-- Status -->
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    :class="statusClass(log.status)"
                    class="px-3 py-1.5 text-xs rounded-full font-semibold inline-flex items-center gap-1.5"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="log.status === 'success' ? 'bg-green-600' : 'bg-red-600'"
                    ></span>
                    {{ log.status === 'success' ? 'Terkirim' : 'Gagal' }}
                  </span>
                  <p v-if="log.status === 'failed' && log.error_message" class="text-xs text-red-400 mt-1 max-w-xs truncate" :title="log.error_message">
                    {{ log.error_message }}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="pagination.totalPages > 0 && sortedLogs.length > 0"
          class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        >
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <!-- INFO -->
            <div class="text-xs text-gray-600 dark:text-gray-400">
              Menampilkan
              <span class="text-gray-700 dark:text-gray-300">{{ sortedLogs.length }}</span>
              dari
              <span class="text-gray-700 dark:text-gray-300">{{ pagination.total }}</span>
              data
            </div>

            <!-- CONTROLS -->
            <div class="flex items-center gap-2">
              <!-- PREV -->
              <button
                @click="changePage(pagination.page - 1)"
                :disabled="pagination.page === 1"
                :class="[
                  'flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-lg transition-all',
                  pagination.page === 1
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Sebelumnya
              </button>

              <!-- PAGE NUMBERS -->
              <div class="flex items-center gap-1">
                <button
                  v-if="paginationPages[0] > 1"
                  @click="changePage(1)"
                  class="w-10 h-10 flex items-center justify-center text-sm rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
                >
                  1
                </button>
                <span v-if="paginationPages[0] > 2" class="px-2 text-gray-400 dark:text-gray-500 text-sm">...</span>
                <button
                  v-for="page in paginationPages"
                  :key="page"
                  @click="changePage(page)"
                  :class="[
                    'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium transition-all',
                    pagination.page === page
                      ? 'bg-primary dark:bg-primary-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400'
                  ]"
                >
                  {{ page }}
                </button>
                <span v-if="paginationPages[paginationPages.length - 1] < pagination.totalPages - 1" class="px-2 text-gray-400 dark:text-gray-500 text-sm">...</span>
                <button
                  v-if="paginationPages[paginationPages.length - 1] < pagination.totalPages"
                  @click="changePage(pagination.totalPages)"
                  class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 transition-all"
                >
                  {{ pagination.totalPages }}
                </button>
              </div>

              <!-- NEXT -->
              <button
                @click="changePage(pagination.page + 1)"
                :disabled="pagination.page >= pagination.totalPages"
                :class="[
                  'flex items-center gap-2 px-4 py-1 text-sm font-medium rounded-lg transition-all',
                  pagination.page >= pagination.totalPages
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-white dark:bg-gray-700 text-primary dark:text-primary-400 border border-primary dark:border-primary-600 hover:bg-primary-50 dark:hover:bg-gray-600'
                ]"
              >
                Selanjutnya
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ExportColumnModal
    v-model="showExportModal"
    :columns="exportColumns"
    :total-rows="sortedLogs.length"
    title="Pilih Kolom Export Log Email"
    :is-exporting="isExporting"
    @confirm="handleExportConfirm"
  />
</template>

<script setup lang="ts">
import { RotateCcw, Search, ArrowUpDown, ChevronDown, X, FileDown } from 'lucide-vue-next'
import Heading from '~/components/Heading.vue'
import ExportColumnModal from '~/components/ExportColumnModal.vue'
import { useApi } from '~/composables/useApi'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

definePageMeta({ layout: 'default', middleware: 'auth' })

const { apiGet } = useApi()
const { hasPermission, isSuperadmin } = useAuth()

const { canAccessPage } = useFeatureAccess()

const breadcrumbs = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Log Email', to: '/layanan-email/log' },
]

// ─── Refs ──────────────────────────────────────
const rowsRef = ref<HTMLElement | null>(null)
const statusRef = ref<HTMLElement | null>(null)

const rowsPerPage = ref(20)
const rowsChoices = [10, 25, 50, 100]
const showRowsDropdown = ref(false)

const statusOptions = [
  { label: 'Semua Status', value: '' },
  { label: 'Success', value: 'success' },
  { label: 'Failed', value: 'failed' },
]
const filterStatus = ref('')
const showStatusDropdown = ref(false)

const filterStatusLabel = computed(() =>
  statusOptions.find((o) => o.value === filterStatus.value)?.label || 'Semua Status'
)

const logs = ref<any[]>([])
const loading = ref(false)
const searchQuery = ref('')
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
})

const sortKey = ref('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')

// ─── Computed ──────────────────────────────────
const paginationPages = computed(() => {
  const total = pagination.value.totalPages
  const current = pagination.value.page
  const pages: number[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else if (current <= 3) {
    for (let i = 1; i <= 5; i++) pages.push(i)
  } else if (current >= total - 2) {
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    for (let i = current - 1; i <= current + 1; i++) pages.push(i)
  }
  return pages
})

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

const sortedLogs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()

  const filtered = q
    ? logs.value.filter(
        (row) =>
          (row.sender_nama ?? '').toLowerCase().includes(q) ||
          (row.sender_persnum ?? '').toLowerCase().includes(q) ||
          (row.subjek ?? '').toLowerCase().includes(q) ||
          (row.to ?? '').toLowerCase().includes(q)
      )
    : logs.value

  if (!sortKey.value || !filtered.length) return filtered

  return [...filtered].sort((a, b) => {
    let aVal = a[sortKey.value]
    let bVal = b[sortKey.value]
    if (aVal == null) return 1
    if (bVal == null) return -1

    if (sortKey.value === 'created_at') {
      return sortOrder.value === 'asc'
        ? new Date(aVal).getTime() - new Date(bVal).getTime()
        : new Date(bVal).getTime() - new Date(aVal).getTime()
    }

    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    return sortOrder.value === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
  })
})

// ─── Methods ───────────────────────────────────
const fetchLogs = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', String(pagination.value.page))
    params.set('limit', String(rowsPerPage.value))
    if (filterStatus.value) params.set('status', filterStatus.value)

    const res = await apiGet(`/mail-service/logs?${params.toString()}`, {}, { skipCache: true })
    logs.value = res?.data || []
    if (res?.pagination) pagination.value = res.pagination
  } catch (err) {
    logs.value = []
  } finally {
    loading.value = false
  }
}

const selectRowsPerPage = (n: number) => {
  rowsPerPage.value = n
  showRowsDropdown.value = false
  pagination.value.page = 1
  fetchLogs()
}

const selectStatus = (value: string) => {
  filterStatus.value = value
  showStatusDropdown.value = false
  pagination.value.page = 1
  fetchLogs()
}

const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const changePage = (page: number) => {
  if (page < 1 || page > pagination.value.totalPages) return
  pagination.value.page = page
  fetchLogs()
}

let searchTimeout: ReturnType<typeof setTimeout>
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1
    fetchLogs()
  }, 500)
}

// Click-outside for dropdowns
const handleClickOutside = (e: MouseEvent) => {
  if (rowsRef.value && !rowsRef.value.contains(e.target as HTMLElement)) {
    showRowsDropdown.value = false
  }
  if (statusRef.value && !statusRef.value.contains(e.target as HTMLElement)) {
    showStatusDropdown.value = false
  }
}

// ─── Formatters ────────────────────────────────
const formatDate = (dt: string) => {
  if (!dt) return '-'
  const d = new Date(dt)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

const formatTime = (dt: string) => {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  })
}

const getUserInitials = (name: string) => {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 0 || !parts[0]) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

const statusClass = (status: string) =>
  status === 'success'
    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
    : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'

// ─── Export Excel ──────────────────────────────
const showExportModal = ref(false)
const isExporting = ref(false)

const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'waktu', label: 'Waktu', desc: 'Tanggal dan jam pengiriman email' },
  { key: 'pengirim', label: 'Pengirim', desc: 'Nama dan persnum pengirim' },
  { key: 'subjek', label: 'Subjek', desc: 'Subjek email' },
  { key: 'to', label: 'Penerima (To)', desc: 'Alamat penerima email' },
  { key: 'surat', label: 'Surat', desc: 'Nomor surat dan perihal' },
  { key: 'lampiran', label: 'Lampiran', desc: 'Jumlah lampiran' },
  { key: 'status', label: 'Status', desc: 'Status pengiriman (Terkirim/Gagal)' }
])

const openExportModal = () => {
  showExportModal.value = true
}

const handleExportConfirm = (selectedKeys: string[]) => {
  if (sortedLogs.value.length === 0 || selectedKeys.length === 0) return
  isExporting.value = true
  try {
    const excelData = sortedLogs.value.map((log: any, idx: number) => {
      const r: Record<string, any> = {}
      if (selectedKeys.includes('No')) r['No'] = idx + 1
      if (selectedKeys.includes('waktu'))
        r['Waktu'] = `${formatDate(log.created_at)} ${formatTime(log.created_at)}`
      if (selectedKeys.includes('pengirim'))
        r['Pengirim'] = log.sender_nama || log.sender_persnum || '-'
      if (selectedKeys.includes('subjek')) r['Subjek'] = log.subjek || '-'
      if (selectedKeys.includes('to')) r['Penerima (To)'] = log.to || '-'
      if (selectedKeys.includes('surat'))
        r['Surat'] = `${log.nomor_surat || '-'}${log.perihal ? ' - ' + log.perihal : ''}`
      if (selectedKeys.includes('lampiran')) r['Lampiran'] = log.lampiran_count || 0
      if (selectedKeys.includes('status'))
        r['Status'] = log.status === 'success' ? 'Terkirim' : 'Gagal'
      return r
    })

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Log Email')
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    saveAs(blob, `log_email_${new Date().toISOString().slice(0, 10)}.xlsx`)
    showExportModal.value = false
  } catch (error) {
    console.error('Gagal export log email:', error)
  } finally {
    isExporting.value = false
  }
}

// ─── Lifecycle ─────────────────────────────────
onMounted(() => {
  fetchLogs()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
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
