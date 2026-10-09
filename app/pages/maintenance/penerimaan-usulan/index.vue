<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <Heading variant="heading6b" class="text-mobile-md">Penerimaan Arsip</Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- Table Card (filter + table + pagination in one card) -->
      <div class="rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors overflow-hidden">
        <!-- Filter & Search -->
        <div class="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center gap-3 w-full">
          <div class="flex items-center gap-3 flex-wrap flex-1">
            <!-- ROWS PER PAGE -->
            <div class="relative" data-custom-dropdown>
              <button
                type="button"
                @click.stop="pageSizeOpen = !pageSizeOpen"
                class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[70px] justify-between"
              >
                <span>{{ limit }}</span>
                <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200" :class="{ 'rotate-180': pageSizeOpen }" />
              </button>
              <Transition name="filter-dd">
                <div v-if="pageSizeOpen" class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[80px]">
                  <button
                    v-for="n in [10, 25, 50]"
                    :key="n"
                    type="button"
                    @click.stop="onLimitChange(n); pageSizeOpen = false"
                    :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0', limit === n ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
                  >{{ n }}</button>
                </div>
              </Transition>
            </div>

            <!-- FILTER STATUS -->
            <div class="relative" data-custom-dropdown>
              <button
                type="button"
                @click.stop="statusOpen = !statusOpen"
                class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] justify-between"
              >
                <span class="truncate">{{ statusOptions.find(o => o.value === filterStatus)?.label ?? 'Semua Status' }}</span>
                <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200" :class="{ 'rotate-180': statusOpen }" />
              </button>
              <Transition name="filter-dd">
                <div v-if="statusOpen" class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[160px]">
                  <button
                    v-for="opt in statusOptions"
                    :key="opt.value"
                    type="button"
                    @click.stop="filterStatus = opt.value; page = 1; fetchData(); statusOpen = false"
                    :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0', filterStatus === opt.value ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
                  >{{ opt.label }}</button>
                </div>
              </Transition>
            </div>

            <!-- FILTER KLASIFIKASI -->
            <div class="relative" data-custom-dropdown>
              <button
                type="button"
                @click.stop="klasifikasiOpen = !klasifikasiOpen"
                class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] max-w-[200px] justify-between"
              >
                <span class="truncate">{{ klasifikasiLabel }}</span>
                <ChevronDown class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200" :class="{ 'rotate-180': klasifikasiOpen }" />
              </button>
              <Transition name="filter-dd">
                <div v-if="klasifikasiOpen" class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[180px] max-h-56 overflow-y-auto">
                  <button
                    type="button"
                    @click.stop="filterKlasifikasi = ''; page = 1; fetchData(); klasifikasiOpen = false"
                    :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700', filterKlasifikasi === '' ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
                  >Semua Klasifikasi</button>
                  <button
                    v-for="k in klasifikasiList"
                    :key="k.klasifikasi"
                    type="button"
                    @click.stop="filterKlasifikasi = k.klasifikasi; page = 1; fetchData(); klasifikasiOpen = false"
                    :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0', filterKlasifikasi === k.klasifikasi ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
                  >{{ k.klasifikasi }} — {{ k.klasifikasi_text || '' }}</button>
                </div>
              </Transition>
            </div>

            <!-- SEARCH -->
            <div class="relative flex-1 min-w-[180px]">
              <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="searchInput"
                type="text"
                placeholder="Cari Berkas…"
                class="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition"
                @input="onSearchInput"
              />
            </div>
          </div>

          <!-- EXPORT -->
          <button
            @click="onExport"
            class="shrink-0 flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium text-white bg-primary dark:bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <UIcon name="i-lucide-download" class="w-3.5 h-3.5" /> Export
          </button>
        </div>

        <!-- Tabel memakai kolom yang sama dengan Pemindahan Arsip. -->
        <DataTable
          :columns="columns"
          :rows="sortedList"
          compact
          :loading="isLoading"
          :sort-key="sortKey"
          :sort-dir="sortDir"
          header-class="bg-primary dark:bg-primary-700 text-white text-left"
          body-class="divide-y divide-gray-100 dark:divide-gray-700"
          row-class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          :row-classes-fn="penerimaanRowClass"
          empty-message="Belum ada usulan masuk."
          @sort="handleSort"
        >
          <template #cell-arsipPerihal="{ row }">
            <div
              class="block min-w-0 truncate text-gray-600 dark:text-gray-300"
              :aria-label="row.arsipPerihal || '-'"
              :title="row.arsipPerihal || '-'"
              tabindex="0"
              @mouseenter="showCellTooltip($event, row.arsipPerihal || '-')"
              @mouseleave="hideCellTooltip"
              @focus="showCellTooltip($event, row.arsipPerihal || '-')"
              @blur="hideCellTooltip"
            >
              {{ row.arsipPerihal || '-' }}
            </div>
          </template>
          <template #cell-arsipKode="{ row }">
            <div
              class="block min-w-0 truncate font-medium text-gray-700 dark:text-gray-200"
              :title="row.arsipKode || '-'"
              tabindex="0"
              @mouseenter="showCellTooltip($event, row.arsipKode || '-')"
              @mouseleave="hideCellTooltip"
              @focus="showCellTooltip($event, row.arsipKode || '-')"
              @blur="hideCellTooltip"
            >
              {{ row.arsipKode || '-' }}
            </div>
          </template>
          <template #cell-arsipKlasifikasi="{ row }">
            <div
              class="block min-w-0 truncate text-gray-600 dark:text-gray-300"
              :aria-label="row.arsipKlasifikasi || '-'"
              :title="row.arsipKlasifikasi || '-'"
              tabindex="0"
              @mouseenter="showCellTooltip($event, row.arsipKlasifikasi || '-')"
              @mouseleave="hideCellTooltip"
              @focus="showCellTooltip($event, row.arsipKlasifikasi || '-')"
              @blur="hideCellTooltip"
            >
              {{ row.arsipKlasifikasi || '-' }}
            </div>
          </template>
          <template #cell-lokasiFisik="{ row }">
            <div
              class="block min-w-0 truncate text-gray-600 dark:text-gray-300"
              :title="row.lokasiAwal || '-'"
              tabindex="0"
              @mouseenter="showCellTooltip($event, row.lokasiAwal || '-')"
              @mouseleave="hideCellTooltip"
              @focus="showCellTooltip($event, row.lokasiAwal || '-')"
              @blur="hideCellTooltip"
            >
              {{ row.lokasiAwal || '-' }}
            </div>
          </template>
          <template #cell-tanggalRetensiAktifHabis="{ row }">
            <span class="whitespace-nowrap text-gray-600 dark:text-gray-300">
              {{ formatDate(row.tanggalRetensiAktifHabis) }}
            </span>
          </template>
          <template #cell-status="{ row }">
            <span
              :class="statusBadgeClass(row.status)"
              class="inline-flex max-w-full whitespace-normal break-words text-[11px] leading-tight"
              :title="statusLabel(row.status)"
            >
              {{ statusLabel(row.status) }}
            </span>
          </template>
          <template #cell-updatedAt="{ row }">
            <span class="whitespace-nowrap text-gray-600 dark:text-gray-300">
              {{ formatDate(row.updatedAt) }}
            </span>
          </template>
          <template #cell-aksi="{ row }">
            <div class="text-center" @click.stop>
              <NuxtLink
                :to="`/maintenance/penerimaan-usulan/${row.id}?jenis=aktif_ke_inaktif`"
                @click="markRowAsViewed(row)"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-800"
                :title="isDetailOnly(row.status) ? 'Detail' : 'Verifikasi'"
                :aria-label="isDetailOnly(row.status) ? 'Detail' : 'Verifikasi'"
              >
                <UIcon :name="isDetailOnly(row.status) ? 'i-lucide-eye' : 'i-lucide-file-check'" class="h-4 w-4" />
              </NuxtLink>
            </div>
          </template>
        </DataTable>

        <Teleport to="body">
          <div
            v-if="cellTooltip.visible"
            role="tooltip"
            class="pointer-events-none fixed z-[9999] max-h-[40vh] overflow-y-auto rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-xl"
            :style="{
              top: `${cellTooltip.top}px`,
              left: `${cellTooltip.left}px`,
              maxWidth: 'min(26rem, calc(100vw - 24px))',
            }"
          >
            {{ cellTooltip.text }}
          </div>
        </Teleport>

        <!-- Pagination -->
        <div v-if="total > 0">
          <Pagination
            :current-page="page"
            :total-pages="totalPages"
            :total-items="total"
            :rows-per-page="limit"
            :rows-options="[10, 20, 50]"
            @update:page="onPageChange"
            @update:rows-per-page="onLimitChange"
          />
        </div>
      </div>
    </div>

    <!-- Export Column Modal -->
    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="total || list.length"
      title="Pilih Kolom Export Penerimaan Arsip"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import { useApi } from '~/composables/useApi'
import type { TuUsulanItem } from '~/types/tu-verifikasi'
import DataTable from '~/components/DataTable.vue'
import { newRowClass } from '~/utils/newRow'

definePageMeta({ middleware: ['auth'] })

const { fetchNotifikasiList } = useTuVerifikasi()
const { apiGet } = useApi()
const { user } = useAuth()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penerimaan Arsip', to: '/maintenance/penerimaan-usulan' },
])

const list = ref<TuUsulanItem[]>([])
const isLoading = ref(false)
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const totalPages = ref(1)

const searchInput = ref('')
const filterStatus = ref('')
const filterKlasifikasi = ref('')
const pageSizeOpen = ref(false)
const statusOpen = ref(false)
const klasifikasiOpen = ref(false)
const klasifikasiList = ref<any[]>([])

const columns = [
  { key: 'arsipPerihal', label: 'Nama Berkas', sortable: true, class: 'w-[18%] max-w-0', headerClass: 'w-[18%]' },
  { key: 'arsipKode', label: 'Kode Berkas', sortable: true, class: 'w-[12%] max-w-0', headerClass: 'w-[12%]' },
  { key: 'arsipKlasifikasi', label: 'Klasifikasi', sortable: true, class: 'w-[13%] max-w-0', headerClass: 'w-[13%]' },
  { key: 'lokasiFisik', label: 'Lokasi Fisik', sortable: true, class: 'w-[11%] max-w-0', headerClass: 'w-[11%]' },
  { key: 'tanggalRetensiAktifHabis', label: 'Retensi Habis', sortable: true, class: 'w-[13%]', headerClass: 'w-[13%]' },
  { key: 'status', label: 'Status', sortable: true, class: 'w-[16%] max-w-0', headerClass: 'w-[16%]' },
  { key: 'updatedAt', label: 'Updated', sortable: true, class: 'w-[11%]', headerClass: 'w-[11%]' },
  { key: 'aksi', label: 'Aksi', class: 'w-[6%] text-center', headerClass: 'w-[6%] text-center' },
]
const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')
const sortedList = computed(() => {
  if (!sortKey.value) return list.value
  const key = (sortKey.value === 'lokasiFisik' ? 'lokasiAwal' : sortKey.value) as keyof TuUsulanItem
  const direction = sortDir.value === 'asc' ? 1 : -1
  return [...list.value].sort((a, b) => {
    const left = a[key]
    const right = b[key]
    if (left == null || left === '') return right == null || right === '' ? 0 : 1
    if (right == null || right === '') return -1
    const aValue = String(left)
    const bValue = String(right)
    const aTime = Date.parse(aValue)
    const bTime = Date.parse(bValue)
    const comparison = !Number.isNaN(aTime) && !Number.isNaN(bTime)
      ? aTime - bTime
      : aValue.localeCompare(bValue, 'id', { numeric: true, sensitivity: 'base' })
    return comparison * direction
  })
})
const handleSort = (key: string) => {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

const cellTooltip = reactive({ visible: false, text: '', top: 0, left: 0 })
const showCellTooltip = (event: Event, text: string) => {
  if (!import.meta.client) return
  const target = event.currentTarget
  if (!(target instanceof HTMLElement) || target.scrollWidth <= target.clientWidth) return
  const rect = target.getBoundingClientRect()
  const padding = 12
  const maxWidth = Math.min(416, window.innerWidth - padding * 2)
  const maxHeight = Math.min(320, window.innerHeight * 0.4)
  const left = Math.min(Math.max(padding, rect.left), window.innerWidth - maxWidth - padding)
  const below = rect.bottom + 8
  const top = below + maxHeight <= window.innerHeight - padding
    ? below
    : Math.max(padding, rect.top - maxHeight - 8)
  cellTooltip.text = text
  cellTooltip.left = left
  cellTooltip.top = top
  cellTooltip.visible = true
}
const hideCellTooltip = () => { cellTooltip.visible = false }

// Baris baru ditebalkan sampai pengguna membuka detail atau menekan aksi.
const viewedRowIds = ref<Set<string>>(new Set())
const viewedRowsStorageKey = computed(
  () => `penerimaan-arsip:viewed:${String(user.value?.persnum ?? user.value?.id ?? 'anonymous')}`,
)

const loadViewedRows = () => {
  if (!import.meta.client) return
  try {
    const raw = localStorage.getItem(viewedRowsStorageKey.value)
    const ids = raw ? JSON.parse(raw) : []
    viewedRowIds.value = new Set(Array.isArray(ids) ? ids.map((id) => String(id)) : [])
  } catch {
    viewedRowIds.value = new Set()
  }
}

const markRowAsViewed = (item: TuUsulanItem) => {
  if (!import.meta.client || !item?.id) return
  const next = new Set(viewedRowIds.value)
  next.add(String(item.id))
  viewedRowIds.value = next
  try {
    localStorage.setItem(viewedRowsStorageKey.value, JSON.stringify([...next]))
  } catch {
    // Tetap hilangkan bold pada halaman aktif jika storage tidak tersedia.
  }
}

const penerimaanRowClass = (item: TuUsulanItem): string =>
  viewedRowIds.value.has(String(item.id)) ? '' : newRowClass(item)

const klasifikasiLabel = computed(() => {
  if (!filterKlasifikasi.value) return 'Semua Klasifikasi'
  const k = klasifikasiList.value.find((x: any) => x.klasifikasi === filterKlasifikasi.value)
  return k ? `${k.klasifikasi} — ${k.klasifikasi_text || ''}` : 'Semua Klasifikasi'
})

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'MENUNGGU_VERIFIKASI', label: 'Menunggu Verifikasi' },
  { value: 'MENUNGGU_PENERIMAAN', label: 'Menunggu Penerimaan' },
  { value: 'SELESAI', label: 'Selesai' },
];

const onClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  pageSizeOpen.value = false;
  statusOpen.value = false;
  klasifikasiOpen.value = false;
};

const fetchKlasifikasi = async () => {
  try {
    const data: any = await apiGet('/arsip-dinamis/klasifikasi', {}, { skipCache: true });
    klasifikasiList.value = Array.isArray(data) ? data : (data?.data ?? []);
  } catch (e) {
    console.error('Gagal memuat klasifikasi:', e);
  }
};

let searchDebounce: any = null
const onSearchInput = () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    fetchData()
  }, 400)
}

const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await fetchNotifikasiList({
      search: searchInput.value || undefined,
      status: filterStatus.value || undefined,
      klasifikasi: filterKlasifikasi.value || undefined,
      page: page.value,
      limit: limit.value,
    })
    // Response di-wrap interceptor: { success, data: { data, meta } }
    const payload = res?.data ?? res
    list.value = payload?.data || []
    total.value = payload?.meta?.total || 0
    totalPages.value = payload?.meta?.totalPages || 1
  } catch (error: any) {
    console.error('Fetch notifikasi error:', error)
    useToast().add({ title: 'Gagal', description: 'Gagal mengambil data notifikasi.', color: 'error' })
  } finally {
    isLoading.value = false
  }
}

const onPageChange = (p: number) => { page.value = p; fetchData() }
const onLimitChange = (l: number) => { limit.value = l; page.value = 1; fetchData() }

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabel = (status: string) => {
  if (status === 'DIKIRIM') return 'Menunggu Verifikasi'
  if (status === 'MENUNGGU_VERIFIKASI_BERKAS_FISIK') return 'Menunggu Verifikasi'
  if (status === 'BERKAS_FISIK_SESUAI') return 'Menunggu Verifikasi'
  if (status === 'USUL_PINDAH_DIKIRIM') return 'Menunggu TTD'
  if (status === 'SIAPKAN_BERKAS_FISIK') return 'Menunggu Verifikasi'
  // Menunggu Penerimaan (Unit Dokumen → Atasan Unit Dokumen)
  if (status === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU') return 'Menunggu Penerimaan'
  if (status === 'DISETUJUI_PERSETUJUAN_TU') return 'Menunggu Penerimaan'
  if (status === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU') return 'Menunggu Penerimaan'
  // Selesai
  if (status === 'DISETUJUI_PERSETUJUAN_TERAKHIR_TU') return 'Selesai'
  if (status === 'ARSIP_INAKTIF_DITERIMA') return 'Selesai'
  if (status === 'PENATAAN_ARSIP_INAKTIF') return 'Selesai'
  if (status === 'SELESAI') return 'Selesai'
  // Ditolak
  if (status === 'BERKAS_FISIK_TIDAK_SESUAI') return 'Ditolak'
  return 'Menunggu Verifikasi'
}

const statusBadgeClass = (status: string) => {
  if (status === 'BERKAS_FISIK_TIDAK_SESUAI') return 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
  if (status === 'SELESAI' || status === 'DISETUJUI_PERSETUJUAN_TERAKHIR_TU' || status === 'ARSIP_INAKTIF_DITERIMA' || status === 'PENATAAN_ARSIP_INAKTIF') return 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
  if (status === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU' || status === 'DISETUJUI_PERSETUJUAN_TU' || status === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU') return 'px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
  if (status === 'USUL_PINDAH_DIKIRIM') return 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
  return 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
}

/** Status yang hanya menampilkan tombol "Detail" (bukan "Verifikasi"). */
const isDetailOnly = (status: string) => {
  return (
    status === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU' ||
    status === 'DISETUJUI_PERSETUJUAN_TU' ||
    status === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU' ||
    status === 'DISETUJUI_PERSETUJUAN_TERAKHIR_TU' ||
    status === 'ARSIP_INAKTIF_DITERIMA' ||
    status === 'PENATAAN_ARSIP_INAKTIF' ||
    status === 'SELESAI'
  )
}

// ─── Export Excel dengan Pemilihan Kolom ──────────────────────────────────────
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';

const showExportModal = ref(false);
const isExporting = ref(false);

const exportColumns = ref([
  { key: 'arsipPerihal', label: 'Nama Berkas', desc: 'Nama berkas arsip' },
  { key: 'arsipKode', label: 'Kode Berkas', desc: 'Kode berkas arsip' },
  { key: 'arsipKlasifikasi', label: 'Klasifikasi', desc: 'Klasifikasi arsip' },
  { key: 'lokasiAwal', label: 'Lokasi Fisik', desc: 'Lokasi fisik dari pemberkasan' },
  { key: 'tanggalRetensiAktifHabis', label: 'Retensi Habis', desc: 'Tanggal retensi aktif berakhir' },
  { key: 'status', label: 'Status', desc: 'Status usulan' },
  { key: 'updatedAt', label: 'Updated', desc: 'Tanggal pembaruan terakhir' },
]);

const onExport = () => {
  if (list.value.length === 0) {
    useToast().add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  showExportModal.value = true;
};

const handleExportConfirm = async (selectedKeys: string[]) => {
  if (list.value.length === 0 || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    let allRows = list.value;
    if (total.value > limit.value) {
      // Ambil semua baris untuk export. Endpoint sama dengan fetchData
      // (/tu/notifikasi-usulan) — /usulan-pindah/notifikasi-tu tidak ada di BE.
      const res = await fetchNotifikasiList({
        search: searchInput.value || undefined,
        status: filterStatus.value || undefined,
        klasifikasi: filterKlasifikasi.value || undefined,
        page: 1,
        limit: total.value,
      });
      const payload = res?.data ?? res;
      if (payload?.data && Array.isArray(payload.data)) {
        allRows = payload.data;
      }
    }

    const data = allRows.map((r: any, idx: number) => {
      const row: Record<string, any> = {};
      if (selectedKeys.includes('arsipPerihal')) row['Nama Berkas'] = r.arsipPerihal || '-';
      if (selectedKeys.includes('arsipKode')) row['Kode Berkas'] = r.arsipKode || '-';
      if (selectedKeys.includes('arsipKlasifikasi')) row['Klasifikasi'] = r.arsipKlasifikasi || '-';
      if (selectedKeys.includes('lokasiAwal')) row['Lokasi Fisik'] = r.lokasiAwal || '-';
      if (selectedKeys.includes('tanggalRetensiAktifHabis')) row['Retensi Habis'] = formatDate(r.tanggalRetensiAktifHabis);
      if (selectedKeys.includes('status')) row['Status'] = statusLabel(r.status);
      if (selectedKeys.includes('updatedAt')) row['Updated'] = formatDate(r.updatedAt);
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penerimaan Arsip');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `penerimaan_arsip_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showExportModal.value = false;
    useToast().add({ title: 'Berhasil', description: `${data.length} data usulan berhasil diexport`, color: 'success' });
  } catch (err) {
    console.error('Export penerimaan usulan error:', err);
    useToast().add({ title: 'Gagal export', description: 'Terjadi kesalahan saat export.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  loadViewedRows()
  fetchKlasifikasi()
  fetchData()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
[data-custom-dropdown] button:focus {
  outline: none;
}
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
