<template>
  <div class="flex items-center justify-between pt-5">
    <div>
      <Heading variant="heading6b" class="text-mobile-md dark:text-white">
        {{ $t('rn_title') }}
      </Heading>
      <PageHeader :items="breadcrumbs" />
    </div>
    <!-- EXPORT BUTTON -->
    <button
      @click="exportExcel"
      class="flex items-center gap-2 bg-primary text-white h-9 px-6 rounded-lg hover:bg-primary-800 transition-colors text-sm font-medium shadow-sm"
    >
      <FileDown class="w-4 h-4" />
      {{ $t('export') }}
    </button>
  </div>

  <div
    class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800"
  >
    <!-- FILTER BAR -->
    <div class="top-0 bg-white dark:bg-gray-800 p-3 relative z-50">
      <div class="flex items-center gap-2 flex-nowrap w-full mt-1">
        <!-- REFRESH -->
        <button
          @click="refreshData"
          :disabled="loading"
          class="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400"
        >
          <RotateCcw class="w-4 h-4" :class="loading ? 'animate-spin' : ''" />
        </button>

        <!-- ROWS PER PAGE -->
        <div class="relative" ref="rowsRef">
          <button
            type="button"
            @click="toggle('rows')"
            class="h-8 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg flex items-center gap-2 min-w-[70px] justify-between hover:border-primary transition-all"
          >
            <span>{{ rowsPerPage }}</span>
            <ChevronDown
              class="w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': openDropdown === 'rows' }"
            />
          </button>
          <Transition name="filter-dd">
            <div
              v-if="openDropdown === 'rows'"
              class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            >
              <button
                v-for="n in rowsChoices"
                :key="n"
                type="button"
                @click="selectRows(n)"
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

        <!-- JENIS FILTER -->
        <div class="relative w-[160px] shrink-0">
          <div
            @click="toggle('type')"
            class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
          >
            <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
              {{ jenisOptions.find((j) => j.jenis === selectedType)?.jenis_text || $t('semua_jenis') }}
            </span>
            <ChevronDown
              class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
              :class="{ 'rotate-180': openDropdown === 'type' }"
            />
          </div>
          <Transition name="filter-dd">
            <div
              v-if="openDropdown === 'type'"
              class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
            >
              <!-- Search input inside dropdown -->
              <div class="mb-1">
                <input
                  v-model="jenisSearch"
                  @click.stop
                  type="text"
                  :placeholder="$t('cari')"
                  class="h-7 w-full rounded-lg px-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-primary"
                />
              </div>
              <div class="flex flex-col gap-1 max-h-48 overflow-y-auto">
                <button
                  @mousedown.prevent
                  @click="selectJenis(null)"
                  class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                  :class="
                    !selectedType
                      ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                  "
                >
                  {{ $t('semua_jenis') }}
                </button>
                <button
                  v-for="item in filteredJenisOptions"
                  :key="item.id"
                  @mousedown.prevent
                  @click="selectJenis(item)"
                  class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                  :class="
                    selectedType === item.jenis
                      ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                  "
                >
                  {{ item.jenis_text }}
                </button>
                <div
                  v-if="filteredJenisOptions.length === 0"
                  class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 italic"
                >
                  {{ $t('tidak_ditemukan') }}
                </div>
              </div>
            </div>
          </Transition>
        </div>

          <!-- STATUS FILTER -->
          <div class="relative w-[180px] shrink-0">
            <div
              @click="toggle('status')"
              class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
            >
              <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
                {{ statusOptions.find(s => s.value === selectedStatus)?.label || $t('semua_status') }}
              </span>
              <ChevronDown
                class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
                :class="{ 'rotate-180': openDropdown === 'status' }"
              />
            </div>
            <Transition name="filter-dd">
              <div
                v-if="openDropdown === 'status'"
                class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
              >
                <div class="flex flex-col gap-1">
                  <button
                    @mousedown.prevent
                    @click="
                      selectedStatus = '';
                      openDropdown = null;
                    "
                    class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                    :class="
                      !selectedStatus
                        ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                    "
                  >
                    {{ $t('semua_status') }}
                  </button>
                  <button
                    v-for="status in statusOptions"
                    :key="status.value"
                    @mousedown.prevent
                    @click="
                      selectedStatus = status.value;
                      openDropdown = null;
                    "
                    class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                    :class="
                      selectedStatus === status.value
                        ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                    "
                  >
                    {{ status.label }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>

        <!-- BULAN -->
        <div class="relative w-[150px] shrink-0">
          <div
            @click="toggle('month')"
            class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
          >
            <span class="flex-1 truncate text-sm text-gray-700 dark:text-white">
              {{ selectedMonthLabel || $t('semua_bulan') }}
            </span>
            <ChevronDown
              class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
              :class="{ 'rotate-180': openDropdown === 'month' }"
            />
          </div>
          <Transition name="filter-dd">
            <div
              v-if="openDropdown === 'month'"
              class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
            >
              <div class="flex flex-col gap-1 max-h-60 overflow-y-auto">
                <button
                  @mousedown.prevent
                  @click="selectMonth('')"
                  class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                  :class="
                    !selectedMonth
                      ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                  "
                >
                  {{ $t('semua_bulan') }}
                </button>
                <button
                  v-for="bulan in monthOptions"
                  :key="bulan.value"
                  @mousedown.prevent
                  @click="selectMonth(bulan.value)"
                  class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                  :class="
                    selectedMonth === bulan.value
                      ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                  "
                >
                  {{ bulan.label }}
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- TAHUN -->
        <div class="relative w-[120px] shrink-0">
          <div
            @click="toggle('year')"
            class="h-8 w-full px-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center gap-1 cursor-pointer overflow-hidden hover:border-primary transition-all"
          >
            <span
              class="flex-1 truncate text-sm"
              :class="
                selectedYear ? 'text-gray-700 dark:text-white' : 'text-gray-400 dark:text-white'
              "
            >
              {{ selectedYear || $t('semua_tahun') }}
            </span>
            <ChevronDown
              class="w-4 h-4 flex-shrink-0 text-gray-400 pointer-events-none transition-transform duration-200"
              :class="{ 'rotate-180': openDropdown === 'year' }"
            />
          </div>
          <Transition name="filter-dd">
            <div
              v-if="openDropdown === 'year'"
              class="absolute z-[999] mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-full p-2"
            >
              <div class="flex flex-col gap-1">
                <button
                  v-for="tahun in yearOptions"
                  :key="tahun"
                  @mousedown.prevent
                  @click="selectYear(tahun)"
                  class="px-3 py-2 text-left text-sm rounded-md transition-colors"
                  :class="
                    selectedYear === tahun
                      ? 'bg-primary/10 text-primary dark:bg-primary-900/40 dark:text-primary-300 font-medium'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100'
                  "
                >
                  {{ tahun }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- TABLE -->
    <div class="max-h-[70vh] overflow-y-auto">
      <div class="overflow-x-auto">
        <table class="text-center w-full">
          <thead>
            <tr class="bg-primary-400 dark:bg-primary-700 text-white">
              <th
                class="px-4 py-3 border-b-2 border-b-primary-500 dark:border-b-primary-700 font-semibold text-sm w-[350px] text-start"
              >
                {{ $t('naskah_tbl') }}
              </th>
              <template v-if="!selectedMonth">
                <th
                  v-for="bulan in monthOptions"
                  :key="bulan.value"
                  class="px-4 py-3 border-b-2 border-b-primary-500 dark:border-b-primary-700 font-semibold text-sm"
                >
                  {{ bulan.label }}
                </th>
              </template>
              <template v-else>
                <th
                  class="px-4 py-3 border-b-2 border-b-primary-500 dark:border-b-primary-700 font-semibold text-sm"
                >
                  {{ selectedMonthLabel }}
                </th>
              </template>
              <th
                class="px-4 py-3 border-b-2 border-b-primary-500 dark:border-b-primary-700 font-semibold text-sm"
              >
                {{ $t('jumlah') }}
              </th>
              <th
                class="px-4 py-3 border-b-2 border-b-primary-500 dark:border-b-primary-700 font-semibold text-sm sticky right-0 z-20 bg-primary-400 dark:bg-primary-700 min-w-[140px]"
              >
                {{ $t('sign_status') }}
              </th>
            </tr>
          </thead>

          <tbody class="bg-white dark:bg-gray-800">
            <!-- LOADING -->
            <tr v-if="loading">
              <td :colspan="tableColCount" class="px-4 py-6">
                <div class="space-y-4 animate-pulse">
                  <div
                    v-for="n in skeletonRows"
                    :key="'skeleton-' + n"
                    class="h-14 w-full rounded-lg bg-gray-200 dark:bg-gray-700"
                  />
                </div>
              </td>
            </tr>

            <!-- EMPTY -->
            <tr v-else-if="!filteredTableData.length">
              <td :colspan="tableColCount" class="py-8 text-gray-400 dark:text-gray-500 text-sm">
                {{ $t('tidak_ada_data') }}
              </td>
            </tr>

            <!-- DATA ROWS -->
            <tr
              v-else
              v-for="row in paginatedTableData"
              :key="row.id"
              class="hover:bg-blue-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
            >
              <td
                class="px-4 py-3 text-sm text-start max-w-[350px] whitespace-nowrap overflow-x-visible text-gray-900 dark:text-gray-100"
              >
                {{ row.naskah }}
              </td>

              <template v-if="!selectedMonth">
                <td
                  v-for="bulan in monthOptions"
                  :key="bulan.value"
                  class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
                >
                  {{ row[bulan.value] || '-' }}
                </td>
              </template>
              <template v-else>
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {{ row[selectedMonth] || '-' }}
                </td>
              </template>

              <td class="px-4 py-3 font-bold text-sm text-gray-900 dark:text-gray-100">
                {{ row.jumlah }}
              </td>

              <td
                class="bg-white dark:bg-gray-800 px-4 py-3 text-sm sticky right-0 z-10 min-w-[140px] shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)] dark:shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.4)]"
              >
                <span
                  class="px-2 py-1 rounded-full text-xs font-semibold capitalize"
                  :class="getStatusClass(row.status)"
                >
                  {{ formatStatusLabel(row.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PAGINATION -->
    <div
      v-if="totalItems > 0"
      class="flex items-center justify-between px-4 py-4 border-t border-gray-100 dark:border-gray-700"
    >
      <div class="text-xs text-gray-600 dark:text-gray-400">
        {{ $t('menampilkan') }} {{ paginatedTableData.length }} {{ $t('dari') }} {{ totalItems }}
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
              : 'bg-white dark:bg-gray-800 text-primary border border-primary hover:bg-primary-50 dark:hover:bg-gray-700'
          ]"
        >
          {{ $t('sebelumnya') }}
        </button>

        <!-- PAGE NUMBERS -->
        <div class="flex items-center gap-1">
          <button
            v-if="paginationPages[0] > 1"
            @click="currentPage = 1"
            class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            1
          </button>

          <span v-if="paginationPages[0] > 2" class="px-2 text-gray-400 dark:text-gray-500">
            ...
          </span>

          <button
            v-for="page in paginationPages"
            :key="page"
            @click="currentPage = page"
            :class="[
              'w-7 h-7 flex items-center justify-center text-sm rounded-lg font-medium',
              currentPage === page
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            ]"
          >
            {{ page }}
          </button>

          <span
            v-if="paginationPages[paginationPages.length - 1] < totalPages - 1"
            class="px-2 text-gray-400 dark:text-gray-500"
          >
            ...
          </span>

          <button
            v-if="paginationPages[paginationPages.length - 1] < totalPages"
            @click="currentPage = totalPages"
            class="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
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
              : 'bg-white dark:bg-gray-800 text-primary border border-primary hover:bg-primary-50 dark:hover:bg-gray-700'
          ]"
        >
          {{ $t('selanjutnya') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

//IMPORT
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { FileDown, RotateCcw, ChevronDown } from 'lucide-vue-next'
import { useToast } from '#imports'
import { useLaporan } from '~/composables/useLaporan'
import * as XLSX from 'xlsx'

//COMPOSABLE
const { getRekapNaskah, getAreaList, getJenisList } = useLaporan()
const toast = useToast()
const { t, locale, availableLocales, setLocale } = useI18n()

//CONST UTIL
const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('rekap'), to: '/laporan/rekap-naskah' }
])

const getStatusClass = (status: string) => {
  if (status === 'terpakai')
    return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
  if (status === 'terpakai_final')
    return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
  if (status === 'booking')
    return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
  return 'bg-red-200 dark:bg-red-700 text-red-700 dark:text-red-300'
}

//STATE
const selectedYear = ref<number | null>(new Date().getFullYear())
const selectedMonth = ref('')
const selectedType = ref('')
const selectedArea = ref('')
const selectedStatus = ref('')

const openDropdown = ref<null | string>(null)
const jenisSearch = ref('')
const showLangDropdown = ref(false)

const currentPage = ref(1)
const rowsPerPage = ref(10)
const rowsChoices = [5, 10, 20, 50]

const rekapData = ref<any[]>([])
const areaOptions = ref<{ label: string; value: string }[]>([])
const jenisOptions = ref<any[]>([])
const loading = ref(false)

//LANGUAGE SWITCH
const switchLocale = async (lang: string) => {
  await setLocale(lang)
  showLangDropdown.value = false
}

//COMPUTED
const yearOptions = computed(() => {
  const y = new Date().getFullYear()
  return [y, y - 1, y - 2]
})

const monthOptions = computed(() => [
  { label: t('jan'), value: 'januari' },
  { label: t('feb'), value: 'februari' },
  { label: t('mar'), value: 'maret' },
  { label: t('apr'), value: 'april' },
  { label: t('mei'), value: 'mei' },
  { label: t('juni'), value: 'juni' },
  { label: t('juli'), value: 'juli' },
  { label: t('agu'), value: 'agustus' },
  { label: t('sep'), value: 'september' },
  { label: t('okt'), value: 'oktober' },
  { label: t('nov'), value: 'november' },
  { label: t('des'), value: 'desember' }
])

const statusOptions = computed(() => [
  { label: t('nom_status_final'), value: 'terpakai_final' },
  { label: t('nom_status_terpakai'), value: 'terpakai' },
  { label: t('nom_status_hangus'), value: 'hangus' },
  { label: t('nom_status_booking'), value: 'booking' }
])

const selectedMonthLabel = computed(
  () => monthOptions.value.find((m) => m.value === selectedMonth.value)?.label ?? ''
)

//FILTERING
const filteredJenisOptions = computed(() => {
  if (!jenisSearch.value) return jenisOptions.value
  return jenisOptions.value.filter((item) =>
    item.jenis_text.toLowerCase().includes(jenisSearch.value.toLowerCase())
  )
})

const filteredTableData = computed(() => {
  let data = [...rekapData.value]

  if (selectedStatus.value) {
    data = data.filter((row) => row.status === selectedStatus.value)
  }

  if (selectedType.value) {
    const jenisText = jenisOptions.value.find((j) => j.jenis === selectedType.value)?.jenis_text
    data = data.filter((row) => row.naskah === jenisText)
  }

  return data
})

//PAGINATION
const totalItems = computed(() => filteredTableData.value.length)
const totalPages = computed(() => Math.ceil(totalItems.value / rowsPerPage.value))
const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value
  return filteredTableData.value.slice(start, start + rowsPerPage.value)
})
const paginationPages = computed(() => {
  const windowSize = 5
  const pages: number[] = []
  let start = Math.max(1, currentPage.value - Math.floor(windowSize / 2))
  let end = start + windowSize - 1
  if (end > totalPages.value) {
    end = totalPages.value
    start = Math.max(1, end - windowSize + 1)
  }
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

//WATCH
watch(rowsPerPage, () => {
  currentPage.value = 1
})
watch(
  [selectedYear, selectedArea, selectedStatus, selectedType, selectedMonth],
  () => {
    currentPage.value = 1
  },
  { deep: true }
)
watch(selectedType, (val) => {
  if (!val) {
    jenisSearch.value = ''
    return
  }
  const found = jenisOptions.value.find((j) => j.jenis === val)
  if (found) jenisSearch.value = found.jenis_text
})
// Re-fetch when year changes
watch(selectedYear, () => {
  if (selectedYear.value) fetchRekap()
})

//API FETCH
const fetchRekap = async () => {
  loading.value = true
  try {
    const params: any = {
      tahun: selectedYear.value ?? new Date().getFullYear()
    }
    if (selectedArea.value) params.area = selectedArea.value
    if (selectedStatus.value) params.status = selectedStatus.value
    if (selectedType.value) params.jenis = selectedType.value

    const res = await getRekapNaskah(params)
    rekapData.value = res.data.rekap.map((item: any, idx: number) => ({
      id: idx,
      naskah: item.jenis_text,
      status: item.status,
      januari: item.jan,
      februari: item.feb,
      maret: item.mar,
      april: item.apr,
      mei: item.mei,
      juni: item.jun,
      juli: item.jul,
      agustus: item.agu,
      september: item.sep,
      oktober: item.okt,
      november: item.nov,
      desember: item.des,
      jumlah: item.total
    }))
  } finally {
    loading.value = false
  }
}

const fetchArea = async () => {
  const res = await getAreaList()
  const raw = res?.data?.data || res?.data || []
  areaOptions.value = raw.map((item: any) => ({
    label: item.longText,
    value: item.area
  }))
}

const fetchJenis = async () => {
  const res = await getJenisList()
  jenisOptions.value = res.data
}

//SELECT HANDLER
const selectJenis = (item: any | null) => {
  if (!item) {
    selectedType.value = ''
    jenisSearch.value = ''
  } else {
    selectedType.value = item.jenis
    jenisSearch.value = item.jenis_text
  }
  openDropdown.value = null
}

const toggle = (key: string) => {
  openDropdown.value = openDropdown.value === key ? null : key
}

// ─── Inline multi-statement handler replacements ──────────────────────────────

const selectRows = (n: number) => {
  rowsPerPage.value = n
  openDropdown.value = null
}

const selectMonth = (val: string) => {
  selectedMonth.value = val
  openDropdown.value = null
}

const selectYear = (val: number) => {
  selectedYear.value = val
  openDropdown.value = null
}

//EXPORT
const exportExcel = () => {
  if (!filteredTableData.value.length) {
    toast.add({
      title: t('export_dibatalkan'),
      description: t('export_data_kosong'),
      color: 'warning',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  try {
    const rows: any[] = []
    filteredTableData.value.forEach((row) => {
      const baseRow: any = { [t('naskah_tbl')]: row.naskah }
      if (selectedMonth.value) {
        baseRow[selectedMonthLabel.value] = row[selectedMonth.value] ?? 0
      } else {
        monthOptions.value.forEach((b) => {
          baseRow[b.label] = row[b.value] ?? 0
        })
      }
      baseRow[t('jumlah')] = row.jumlah
      baseRow[t('sign_status')] = formatStatusLabel(row.status)
      rows.push(baseRow)
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, t('rekap'))
    const fileName = `rekap-naskah-${selectedYear.value ?? new Date().getFullYear()}.xlsx`
    XLSX.writeFile(wb, fileName)

    toast.add({
      title: t('export_berhasil'),
      description: t('export_file_berhasil'),
      color: 'success',
      icon: 'i-lucide-file-check'
    })
  } catch (error) {
    console.error(error)
    toast.add({
      title: t('export_gagal'),
      description: t('export_error'),
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  }
}

//LIFECYCLE
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    openDropdown.value = null
    showLangDropdown.value = false
  }
}

onMounted(() => {
  fetchRekap()
  fetchArea()
  fetchJenis()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

//UI HELPER
const refreshData = async () => {
  selectedMonth.value = ''
  selectedType.value = ''
  jenisSearch.value = ''
  selectedStatus.value = ''
  selectedArea.value = ''
  selectedYear.value = new Date().getFullYear()
  await fetchRekap()
}

const tableColCount = computed(() => {
  if (selectedMonth.value) return 4
  return 1 + monthOptions.value.length + 2
})

const skeletonRows = computed(() => (selectedMonth.value ? 4 : 6))

const formatStatusLabel = (status: string) => {
  if (!status) return '-'
  const found = statusOptions.value.find((s) => s.value === status)
  return found?.label ?? status
}
</script>

<style scoped>
/* Animasi dropdown filter */
.filter-dd-enter-active,
.filter-dd-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}
.filter-dd-enter-from,
.filter-dd-leave-to {
  opacity: 0;
  transform: scaleY(0.9) translateY(-4px);
}
.filter-dd-enter-to,
.filter-dd-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}
</style>
