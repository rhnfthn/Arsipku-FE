<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <Heading variant="heading6b" class="text-mobile-md">Verifikasi Persetujuan</Heading>
        <PageHeader :items="breadcrumbs" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Verifikasi penerimaan arsip pindah dari Unit Tata Naskah.
        </p>
      </div>

      <!-- Filter dan tabel memakai toolbar, tabel, serta card yang sama dengan halaman Pemindahan. -->
      <div class="rounded-xl border border-gray-100 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
        <VerifikasiFilterBar
          v-model="filter"
          :status-options="filterStatusOptions"
          :rows-per-page-options="[10, 30, 50]"
          search-placeholder="Cari nama berkas / nomor usulan / kode..."
          search-on-input
          :is-exporting="isExporting"
          @apply="applyFilters"
          @export="onExport"
        />

        <DataTable
          :columns="columns"
          :rows="sortedList"
          compact
          wrap-headers
          :loading="isLoading"
          :sort-key="sortKey"
          :sort-dir="sortDir"
          header-class="bg-primary dark:bg-primary-700 text-white text-left"
          body-class="divide-y divide-gray-100 dark:divide-gray-700"
          row-class="hover:bg-gray-50 dark:hover:bg-gray-700/30"
          :row-classes-fn="(row: any) => rowClass(row)"
          empty-message="Belum ada usulan."
          @sort="handleSort"
        >
          <template #cell-arsipPerihal="{ row }">
            <TruncatedText :text="String(row.arsipPerihal || '-')" text-class="font-medium text-gray-800 dark:text-white" />
          </template>
          <template #cell-arsipKode="{ row }">
            <TruncatedText :text="String(row.arsipKode || '-')" text-class="font-mono text-xs text-gray-600 dark:text-gray-300" />
          </template>
          <template #cell-arsipKlasifikasi="{ row }">
            <TruncatedText :text="String(row.arsipKlasifikasi || '-')" text-class="text-gray-700 dark:text-gray-200" />
          </template>
          <template #cell-lokasiAwal="{ row }">
            <TruncatedText :text="String(row.lokasiAwal || '-')" text-class="text-gray-700 dark:text-gray-200" />
          </template>
          <template #cell-tuName="{ row }">
            <TruncatedText :text="String(row.tuName || '-')" text-class="text-gray-700 dark:text-gray-200" />
          </template>
          <template #cell-tanggalDikirim="{ row }">
            <TruncatedText
              :text="row.tanggalDikirim ? formatDate(row.tanggalDikirim) : '-'"
              text-class="text-xs text-gray-600 dark:text-gray-300"
            />
          </template>
          <template #cell-status="{ row }">
            <span
              :class="statusBadgeClass(row.status)"
              class="inline-flex max-w-full whitespace-normal break-words text-[11px] leading-tight"
              :title="statusLabel(row.status)"
            >{{ statusLabel(row.status) }}</span>
          </template>
          <template #cell-aksi="{ row }">
            <div class="text-center" @click.stop>
              <NuxtLink
                :to="`/maintenance/verifikasi-persetujuan-tu/${row.id}`"
                @click="markViewed(row)"
                class="inline-flex h-8 w-8 items-center justify-center text-gray-900 transition-colors hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300"
                :aria-label="`Detail ${row.nomorUsulan || row.arsipPerihal || ''}`"
                :title="`Detail ${row.nomorUsulan || row.arsipPerihal || ''}`"
              >
                <UIcon name="i-lucide-eye" class="w-4 h-4" />
              </NuxtLink>
            </div>
          </template>
        </DataTable>
      </div>
    </div>

    <!-- Export Column Modal -->
    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="total"
      title="Pilih Kolom Export Verifikasi Persetujuan"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import type { TuUsulanItem } from '~/types/tu-verifikasi'
import type { VerifikasiFilter } from '~/types/verifikasi-usulan'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import ExportColumnModal from '~/components/ExportColumnModal.vue'
import DataTable from '~/components/DataTable.vue'
import VerifikasiFilterBar from '~/components/verifikasi-usulan/VerifikasiFilterBar.vue'
import TruncatedText from '~/components/TruncatedText.vue'

definePageMeta({ middleware: ['auth'] })

const showExportModal = ref(false)
const isExporting = ref(false)

const exportColumns = ref([
  { key: 'arsipPerihal', label: 'Nama Berkas', desc: 'Perihal atau nama berkas' },
  { key: 'arsipKode', label: 'Kode Berkas', desc: 'Kode berkas arsip' },
  { key: 'arsipKlasifikasi', label: 'Klasifikasi', desc: 'Klasifikasi arsip' },
  { key: 'lokasiAwal', label: 'Lokasi Fisik', desc: 'Lokasi fisik berkas' },
  { key: 'tuName', label: 'Unit Dokumen', desc: 'Nama unit tata naskah' },
  { key: 'tanggalDikirim', label: 'Tanggal Kirim', desc: 'Tanggal dikirim' },
  { key: 'status', label: 'Status', desc: 'Status verifikasi usulan' }
])

const { fetchAtasanTuList } = useTuVerifikasi()
const { rowClass, markViewed } = useViewedRows('verifikasi-persetujuan-tu')

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Verifikasi Persetujuan', to: '/maintenance/verifikasi-persetujuan-tu' },
])

const list = ref<TuUsulanItem[]>([])
const isLoading = ref(false)
const total = ref(0)
const filter = ref<VerifikasiFilter>({ status: '', klasifikasi: '', search: '', page: 1, limit: 10 })
const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')

const statusOptions = [
  { value: 'MENUNGGU_PENERIMAAN', label: 'Menunggu Penerimaan' },
  { value: 'SELESAI', label: 'Selesai' },
];
const filterStatusOptions = computed(() => statusOptions)

const columns = [
  { key: 'arsipPerihal', label: 'Nama Berkas', sortable: true, class: 'w-[18%] max-w-0', headerClass: 'w-[18%]' },
  { key: 'arsipKode', label: 'Kode Berkas', sortable: true, class: 'w-[12%] max-w-0', headerClass: 'w-[12%]' },
  { key: 'arsipKlasifikasi', label: 'Klasifikasi', sortable: true, class: 'w-[14%] max-w-0', headerClass: 'w-[14%]' },
  { key: 'lokasiAwal', label: 'Lokasi Fisik', sortable: true, class: 'w-[11%] max-w-0', headerClass: 'w-[11%]' },
  { key: 'tuName', label: 'Unit Dokumen', sortable: true, class: 'w-[14%] max-w-0', headerClass: 'w-[14%]' },
  { key: 'tanggalDikirim', label: 'Tanggal Kirim', sortable: true, class: 'w-[12%]', headerClass: 'w-[12%]' },
  { key: 'status', label: 'Status', sortable: true, class: 'w-[13%] max-w-0', headerClass: 'w-[13%]' },
  { key: 'aksi', label: 'Aksi', class: 'w-[6%] text-center', headerClass: 'w-[6%] text-center' },
]

const sortedList = computed(() => {
  if (!sortKey.value) return list.value
  const direction = sortDir.value === 'asc' ? 1 : -1
  return [...list.value].sort((left: any, right: any) => {
    const a = left[sortKey.value]
    const b = right[sortKey.value]
    if (a == null) return 1
    if (b == null) return -1
    const comparison = sortKey.value === 'tanggalDikirim'
      ? new Date(String(a)).getTime() - new Date(String(b)).getTime()
      : String(a).localeCompare(String(b), 'id', { numeric: true, sensitivity: 'base' })
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

const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await fetchAtasanTuList({
      search: filter.value.search || undefined,
      status: filter.value.status || undefined,
      klasifikasi: filter.value.klasifikasi || undefined,
      page: filter.value.page ?? 1,
      limit: filter.value.limit ?? 10,
    })
    const payload = res?.data ?? res
    list.value = payload?.data || []
    total.value = payload?.meta?.total || 0
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: 'Gagal mengambil data.', color: 'error' })
  } finally { isLoading.value = false }
}

const applyFilters = () => {
  filter.value.page = 1
  fetchData()
}

const formatDate = (d: string) => {
  if (!d) return '-'
  const date = new Date(d)
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const onExport = () => {
  if (list.value.length === 0) {
    useToast().add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' })
    return
  }
  showExportModal.value = true
}

const handleExportConfirm = (selectedKeys: string[]) => {
  if (list.value.length === 0 || selectedKeys.length === 0) return
  isExporting.value = true
  try {
    const data = list.value.map((item) => {
      const row: Record<string, any> = {}
      if (selectedKeys.includes('arsipPerihal')) row['Nama Berkas'] = item.arsipPerihal || '-'
      if (selectedKeys.includes('arsipKode')) row['Kode Berkas'] = item.arsipKode || '-'
      if (selectedKeys.includes('arsipKlasifikasi')) row['Klasifikasi'] = item.arsipKlasifikasi || '-'
      if (selectedKeys.includes('lokasiAwal')) row['Lokasi Fisik'] = item.lokasiAwal || '-'
      if (selectedKeys.includes('tuName')) row['Unit Dokumen'] = item.tuName || '-'
      if (selectedKeys.includes('tanggalDikirim')) row['Tanggal Kirim'] = formatDate(item.tanggalDikirim ?? '')
      if (selectedKeys.includes('status')) row['Status'] = statusLabel(item.status)
      return row
    })

    const worksheet = XLSX.utils.json_to_sheet(data)
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2
    }))
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verifikasi Persetujuan TU')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    saveAs(blob, `verifikasi_persetujuan_tu_${new Date().toISOString().slice(0, 10)}.xlsx`)

    showExportModal.value = false
    useToast().add({ title: 'Berhasil', description: `${data.length} data berhasil diexport`, color: 'success' })
  } catch (err) {
    console.error('Export verifikasi persetujuan TU error:', err)
    useToast().add({ title: 'Gagal export', description: 'Terjadi kesalahan saat export.', color: 'error' })
  } finally {
    isExporting.value = false
  }
}

const statusLabel = (s: string) => {
  const m: Record<string, string> = {
    // Menunggu Penerimaan (Unit Dokumen → Atasan Unit Dokumen)
    DIKIRIM: 'Menunggu Penerimaan',
    MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'Menunggu Penerimaan',
    DISETUJUI_PERSETUJUAN_TU: 'Menunggu Penerimaan',
    MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'Menunggu Penerimaan',
    MENUNGGU_TTD_PIHAK_KEDUA: 'Menunggu TTD',
    // Selesai
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Selesai',
    ARSIP_INAKTIF_DITERIMA: 'Selesai',
    PENATAAN_ARSIP_INAKTIF: 'Selesai',
    SELESAI: 'Selesai',
    // Ditolak
    DITOLAK_PERSETUJUAN_TU: 'Ditolak',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'Ditolak',
  }
  return m[s] || s
}

const statusBadgeClass = (s: string) => {
  if (s === 'DITOLAK_PERSETUJUAN_TU' || s === 'DITOLAK_PERSETUJUAN_TERAKHIR_TU') return 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
  if (s === 'DISETUJUI_PERSETUJUAN_TERAKHIR_TU' || s === 'ARSIP_INAKTIF_DITERIMA' || s === 'PENATAAN_ARSIP_INAKTIF' || s === 'SELESAI') return 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
  if (s === 'MENUNGGU_TTD_PIHAK_KEDUA') return 'px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
  return 'px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
}

onMounted(() => {
  fetchData()
})
</script>
