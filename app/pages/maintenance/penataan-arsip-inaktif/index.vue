<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <Heading variant="heading6b" class="text-mobile-md">Penataan Arsip Inaktif</Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- Table Card (filter + table + pagination in one card) -->
      <div class="rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 transition-colors overflow-hidden">
        <!-- Filter Bar -->
        <div class="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center gap-3 w-full">
          <div class="flex items-center gap-3 flex-wrap flex-1">
            <!-- ROWS PER PAGE -->
            <div ref="pageSizeRef" class="relative shrink-0" data-custom-dropdown>
              <button
                type="button"
                @click.stop="pageSizeOpen = !pageSizeOpen"
                class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[70px] justify-between"
              >
                <span>{{ limit }}</span>
                <UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-gray-400" :class="{ 'rotate-180': pageSizeOpen }" />
              </button>
              <div v-if="pageSizeOpen" class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[80px]">
                <button v-for="n in [10, 25, 50]" :key="n" type="button" @click.stop="onLimitChange(n); pageSizeOpen = false"
                  :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0', limit === n ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
                >{{ n }}</button>
              </div>
            </div>

            <!-- FILTER STATUS -->
            <div ref="statusRef" class="relative shrink-0" data-custom-dropdown>
              <button
                type="button"
                @click.stop="statusOpen = !statusOpen"
                class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[130px] justify-between"
              >
                <span class="truncate">{{ statusOptions.find(o => o.value === filterStatus)?.label ?? 'Semua Status' }}</span>
                <UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-gray-400 shrink-0" :class="{ 'rotate-180': statusOpen }" />
              </button>
              <div v-if="statusOpen" class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[160px]">
                <button v-for="opt in statusOptions" :key="opt.value" type="button" @click.stop="filterStatus = opt.value; page = 1; fetchData(); statusOpen = false"
                  :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0', filterStatus === opt.value ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
                >{{ opt.label }}</button>
              </div>
            </div>

            <!-- FILTER NASIB AKHIR -->
            <div ref="nasibRef" class="relative shrink-0" data-custom-dropdown>
              <button
                type="button"
                @click.stop="nasibOpen = !nasibOpen"
                class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[135px] justify-between"
              >
                <span class="truncate">{{ nasibOptions.find(o => o.value === filterNasib)?.label ?? 'Semua Nasib' }}</span>
                <UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-gray-400 shrink-0" :class="{ 'rotate-180': nasibOpen }" />
              </button>
              <div v-if="nasibOpen" class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[160px]">
                <button v-for="opt in nasibOptions" :key="opt.value" type="button" @click.stop="filterNasib = opt.value; page = 1; fetchData(); nasibOpen = false"
                  :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0', filterNasib === opt.value ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
                >{{ opt.label }}</button>
              </div>
            </div>

            <!-- FILTER KLASIFIKASI -->
            <div ref="klasifikasiRef" class="relative shrink-0" data-custom-dropdown>
              <button
                type="button"
                @click.stop="klasifikasiOpen = !klasifikasiOpen"
                class="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white rounded-lg px-3 py-1.5 hover:border-primary outline-none transition-all min-w-[150px] justify-between"
              >
                <span class="truncate">{{ klasifikasiLabel }}</span>
                <UIcon name="i-lucide-chevron-down" class="w-4 h-4 text-gray-400 shrink-0" :class="{ 'rotate-180': klasifikasiOpen }" />
              </button>
              <div v-if="klasifikasiOpen" class="absolute left-0 top-full mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden min-w-[220px] max-h-[280px] overflow-y-auto">
                <button type="button" @click.stop="filterKlasifikasi = ''; page = 1; fetchData(); klasifikasiOpen = false"
                  :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700', filterKlasifikasi === '' ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
                >Semua Klasifikasi</button>
                <button v-for="k in klasifikasiList" :key="k.klasifikasi" type="button" @click.stop="filterKlasifikasi = k.klasifikasi; page = 1; fetchData(); klasifikasiOpen = false"
                  :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0', filterKlasifikasi === k.klasifikasi ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
                >{{ k.klasifikasi }} — {{ k.klasifikasi_text || '' }}</button>
              </div>
            </div>

            <!-- SEARCH -->
            <div class="relative flex-1 min-w-[180px]">
              <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input v-model="searchInput" type="text" placeholder="Cari Berkas…" @input="onSearchInput"
                class="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-600 transition" />
            </div>
          </div>

          <!-- EXPORT -->
          <button @click="onExport"
            class="shrink-0 flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-medium text-white bg-primary dark:bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap">
            <UIcon name="i-lucide-download" class="w-3.5 h-3.5" /> Export
          </button>
        </div>

        <!-- Table -->
        <div class="w-full overflow-hidden">
          <table class="w-full table-fixed text-xs">
            <thead class="bg-primary dark:bg-primary-700 text-white">
              <tr>
                <th class="w-[4%] px-1.5 py-2 text-center font-semibold">No</th>
                <th class="w-[12%] px-1.5 py-2 text-center font-semibold">Kode Klasifikasi</th>
                <th class="w-[18%] px-1.5 py-2 text-center font-semibold">Uraian Informasi Berkas</th>
                <th class="w-[7%] px-1.5 py-2 text-center font-semibold">Kurun Waktu</th>
                <th class="w-[6%] px-1.5 py-2 text-center font-semibold">Jumlah Berkas</th>
                <th class="w-[9%] px-1.5 py-2 text-center font-semibold">Lokasi Simpan</th>
                <th class="w-[8%] px-1.5 py-2 text-center font-semibold">Klasifikasi Keamanan</th>
                <th class="w-[8%] px-1.5 py-2 text-center font-semibold">Retensi Arsip Inaktif</th>
                <th class="w-[7%] px-1.5 py-2 text-center font-semibold">Nasib Akhir</th>
                <th class="w-[8%] px-1.5 py-2 text-center font-semibold">Keterangan</th>
                <th class="w-[9%] px-1.5 py-2 text-center font-semibold">Status</th>
                <th class="w-[4%] px-1.5 py-2 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="isLoading">
                <td colspan="12" class="px-3 py-10 text-center">
                  <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
                </td>
              </tr>
              <tr v-else-if="list.length === 0">
                <td colspan="12" class="px-3 py-10 text-center text-gray-500 dark:text-gray-400">
                  Belum ada arsip untuk ditata.
                </td>
              </tr>
              <tr v-for="row in tableRows" :key="`${row.transferId}-${row.id}`" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors" :class="rowClass(row.transfer)">
                <td class="break-words px-1.5 py-2 text-center text-gray-700 dark:text-gray-200">{{ row.no }}</td>
                <td class="break-words px-1.5 py-2 text-center">
                  <div class="font-medium text-gray-800 dark:text-white">{{ row.klasifikasi ?? '-' }}</div>
                  <div class="mt-0.5 text-[10px] text-gray-400">{{ row.klasifikasiKode ?? '-' }}</div>
                </td>
                <td class="break-words px-1.5 py-2 text-gray-700 dark:text-gray-200">{{ row.uraianInformasi ?? '-' }}</td>
                <td class="break-words px-1.5 py-2 text-center text-gray-600 dark:text-gray-300">{{ row.kurunWaktu ?? '-' }}</td>
                <td class="break-words px-1.5 py-2 text-center text-gray-600 dark:text-gray-300">{{ row.jumlahBerkas ?? '-' }}</td>
                <td class="break-words px-1.5 py-2 text-gray-600 dark:text-gray-300">{{ row.lokasiSimpan ?? '-' }}</td>
                <td class="break-words px-1.5 py-2 text-center text-gray-600 dark:text-gray-300">{{ row.klasifikasiKeamanan ?? '-' }}</td>
                <td class="break-words px-1.5 py-2 text-center text-gray-600 dark:text-gray-300">{{ formatRetensiEndDate(row.tanggalRetensiInaktifBerakhir) }}</td>
                <td class="break-words px-1.5 py-2 text-center text-gray-600 dark:text-gray-300">{{ row.nasibAkhir ?? '-' }}</td>
                <td class="break-words px-1.5 py-2 text-gray-600 dark:text-gray-300">
                  <button
                    v-if="row.transfer.beritaAcaraNomor"
                    type="button"
                    class="text-left text-primary hover:underline dark:text-primary-400"
                    :title="`Preview PDF gabungan Berita Acara, Daftar Berkas, dan Daftar Isi — ${row.transfer.nomorUsulan}`"
                    @click.stop="openPenataanLampiran(row.transfer)"
                  >Lampiran/{{ row.transfer.nomorUsulan }}</button>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-1.5 py-2 text-center">
                  <span :class="statusBadgeClass(row.status, row.tanggalRetensiInaktifBerakhir, row.penyusutanSudahDiajukan)" class="inline-flex max-w-full justify-center whitespace-normal break-words text-center text-[10px] leading-tight">{{ statusLabel(row.status, row.tanggalRetensiInaktifBerakhir, row.penyusutanSudahDiajukan) }}</span>
                </td>
                <td class="px-1.5 py-2 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <NuxtLink
                      v-if="row.transfer.status !== 'ARSIP_INAKTIF_DITERIMA'"
                      :to="`/maintenance/penataan-arsip-inaktif/${row.transfer.id}`"
                      @click="markViewed(row.transfer)"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-900 hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300 transition-colors"
                      title="Detail"
                    >
                      <UIcon name="i-lucide-eye" class="w-4 h-4" />
                    </NuxtLink>
                    <NuxtLink
                      v-if="row.transfer.status === 'ARSIP_INAKTIF_DITERIMA'"
                      :to="`/maintenance/penataan-arsip-inaktif/${row.transfer.id}?mode=penataan`"
                      @click="markViewed(row.transfer)"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-md text-gray-900 hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300 transition-colors"
                      title="Penataan"
                    >
                      <UIcon name="i-lucide-archive" class="w-4 h-4" />
                    </NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="total > 0">
          <Pagination
            :current-page="page"
            :total-pages="totalPages"
            :total-items="total"
            :rows-per-page="limit"
            @update:page="onPageChange"
            @update:rows-per-page="onLimitChange"
          />
        </div>
      </div>
    </div>

    <SharedSharePdfViewer
      v-model="bacPreviewOpen"
      :url="bacPreviewUrl"
      :title="bacPreviewTitle"
      :loading="bacPreviewLoading"
      @close="closeBacPreview"
    />

    <SharedSharePdfViewer
      v-model="lampiranPreviewOpen"
      :url="lampiranPreviewUrl"
      :title="lampiranPreviewTitle"
      :loading="lampiranPreviewLoading"
      @close="closePenataanLampiranPreview"
    />

    <!-- Export Column Modal -->
    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="total || list.length"
      title="Pilih Kolom Export Penataan Arsip Inaktif"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import { useApi } from '~/composables/useApi'
import { useKlasifikasi } from '~/composables/useKlasifikasi'
import { useBacPdfPreview } from '~/composables/useBacPdfPreview'
import type { TuUsulanItem } from '~/types/tu-verifikasi'

definePageMeta({ middleware: ['auth'] })

const { fetchPenataanList } = useTuVerifikasi()
const { rowClass, markViewed } = useViewedRows('penataan-arsip-inaktif')
const { apiGet } = useApi()
const { getKlasifikasiList } = useKlasifikasi()
const {
  bacPreviewOpen,
  bacPreviewLoading,
  bacPreviewUrl,
  bacPreviewTitle,
  openBacPreview,
  closeBacPreview,
} = useBacPdfPreview()

const lampiranPreviewOpen = ref(false)
const lampiranPreviewLoading = ref(false)
const lampiranPreviewUrl = ref('')
const lampiranPreviewTitle = ref('Preview Lampiran')

const closePenataanLampiranPreview = () => {
  lampiranPreviewOpen.value = false
  if (lampiranPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(lampiranPreviewUrl.value)
  lampiranPreviewUrl.value = ''
}

const openPenataanLampiran = async (transfer: any) => {
  closePenataanLampiranPreview()
  lampiranPreviewTitle.value = `Lampiran/${transfer.nomorUsulan || ''}`
  lampiranPreviewOpen.value = true
  lampiranPreviewLoading.value = true
  try {
    let response: any = await apiGet<unknown>(
      `/transfer-active-to-inactive/${transfer.id}/lampiran-penataan.pdf`,
      { responseType: 'blob', headers: { Accept: 'application/pdf' } },
      { skipCache: true },
    )
    if (response && typeof response === 'object' && !(response instanceof Blob) && 'data' in response) {
      response = response.data
    }
    const pdfBlob = response instanceof Blob
      ? response
      : response instanceof ArrayBuffer
        ? new Blob([response], { type: 'application/pdf' })
        : ArrayBuffer.isView(response)
          ? new Blob([new Uint8Array(response.buffer, response.byteOffset, response.byteLength)], { type: 'application/pdf' })
          : null
    if (!pdfBlob || pdfBlob.size === 0 || (await pdfBlob.slice(0, 5).text()) !== '%PDF-') {
      throw new Error('Lampiran bukan PDF yang valid.')
    }
    lampiranPreviewUrl.value = URL.createObjectURL(pdfBlob)
  } catch (error: any) {
    let description = error?.response?.data?.message || error?.message
    if (error?.response?.data instanceof Blob) {
      try {
        const body = JSON.parse(await error.response.data.text())
        description = body?.message || description
      } catch { /* gunakan pesan fallback */ }
    }
    lampiranPreviewOpen.value = false
    useToast().add({
      title: 'Preview lampiran gagal dibuka',
      description: description || 'Silakan coba kembali.',
      color: 'error',
    })
  } finally {
    lampiranPreviewLoading.value = false
  }
}

const breadcrumbs = computed(() => [
  { label: 'Kelola', to: '/kelola' },
  { label: 'Pemeliharaan', to: '/pemeliharaan' },
  { label: 'Penataan Arsip Inaktif', to: '/maintenance/penataan-arsip-inaktif' },
])

const list = ref<TuUsulanItem[]>([])
const penyusutanBerkasIds = ref<Set<string>>(new Set())
const tableRows = computed(() => {
  let number = (page.value - 1) * limit.value + 1
  return list.value.flatMap((transfer: any) => {
    const archives = Array.isArray(transfer.arsipRows) && transfer.arsipRows.length
      ? transfer.arsipRows
      : [{
          id: transfer.arsipId,
          klasifikasi: transfer.arsipKlasifikasi,
          klasifikasiKode: transfer.arsipKlasifikasiKode,
          uraianInformasi: transfer.arsipPerihal,
          kurunWaktu: '-',
          jumlahBerkas: '-',
          status: transfer.status,
          lokasiSimpan: '-',
          klasifikasiKeamanan: '-',
          retensiArsipInaktif: '-',
          tanggalRetensiInaktifBerakhir: null,
          nasibAkhir: transfer.arsipTindakanPenyusutan,
          keterangan: transfer.beritaAcaraNomor ? `No. BA: ${transfer.beritaAcaraNomor}` : '-',
        }]
    return archives.map((archive: any) => ({
      ...archive,
      penyusutanSudahDiajukan: penyusutanBerkasIds.value.has(String(archive.id)),
      lokasiSimpan: transfer.status === 'SELESAI' ? (transfer.lokasiPenataan || '-') : '-',
      no: number++,
      transfer,
      transferId: transfer.id,
    }))
  })
})
const formatRetensiEndDate = (value: string | null | undefined) => {
  if (!value) return '-'
  const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value)
}
const isLoading = ref(false)
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const totalPages = ref(1)

const searchInput = ref('')
const filterStatus = ref('')
const filterNasib = ref('')
const filterKlasifikasi = ref('')
const pageSizeOpen = ref(false)
const pageSizeRef = ref<HTMLElement | null>(null)
const statusOpen = ref(false)
const statusRef = ref<HTMLElement | null>(null)
const nasibOpen = ref(false)
const nasibRef = ref<HTMLElement | null>(null)
const klasifikasiOpen = ref(false)
const klasifikasiRef = ref<HTMLElement | null>(null)
const klasifikasiList = ref<{ klasifikasi: string; klasifikasi_text: string }[]>([])

const klasifikasiLabel = computed(() => {
  if (!filterKlasifikasi.value) return 'Semua Klasifikasi'
  const k = klasifikasiList.value.find((x) => x.klasifikasi === filterKlasifikasi.value)
  return k ? `${k.klasifikasi} — ${k.klasifikasi_text}` : 'Semua Klasifikasi'
})

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'DITERIMA', label: 'Diterima' },
  { value: 'MENUNGGU_RETENSI_INAKTIF', label: 'Menunggu Retensi Inaktif' },
  { value: 'SIAP_PENYUSUTAN', label: 'Siap Penyusutan' },
];

const nasibOptions = [
  { value: '', label: 'Semua Nasib' },
  { value: 'PERMANEN', label: 'Permanen' },
  { value: 'MUSNAH', label: 'Musnah' },
];

const onClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  const els = document.querySelectorAll('[data-custom-dropdown]')
  for (const el of Array.from(els)) {
    if (el.contains(target)) return
  }
  pageSizeOpen.value = false
  statusOpen.value = false
  nasibOpen.value = false
  klasifikasiOpen.value = false
}

let searchDebounce: any = null
const onSearchInput = () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => { page.value = 1; fetchData() }, 400)
}

const fetchData = async () => {
  isLoading.value = true
  try {
    const res = await fetchPenataanList({
      search: searchInput.value || undefined,
      status: filterStatus.value || undefined,
      nasibAkhir: filterNasib.value || undefined,
      klasifikasi: filterKlasifikasi.value || undefined,
      page: page.value, limit: limit.value,
    })
    const payload = res?.data ?? res
    list.value = payload?.data || []
    total.value = payload?.meta?.total || 0
    totalPages.value = payload?.meta?.totalPages || 1
  } catch (e: any) {
    useToast().add({ title: 'Gagal', description: 'Gagal mengambil data.', color: 'error' })
  } finally { isLoading.value = false }
}

const onPageChange = (p: number) => { page.value = p; fetchData() }
const onLimitChange = (l: number) => { limit.value = l; page.value = 1; fetchData() }

const isRetentionExpired = (date: string | null | undefined) => {
  if (!date) return false
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return String(date).slice(0, 10) <= today
}

const statusLabel = (s: string, retentionEnd?: string | null, penyusutanSudahDiajukan = false) => {
  if (penyusutanSudahDiajukan) return 'Selesai'
  if (s === 'SELESAI') return isRetentionExpired(retentionEnd) ? 'Siap Penyusutan' : 'Menunggu Retensi Inaktif'
  return 'Diterima'
}

const statusBadgeClass = (s: string, retentionEnd?: string | null, penyusutanSudahDiajukan = false) => {
  if (penyusutanSudahDiajukan) return 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
  if (s === 'SELESAI' && isRetentionExpired(retentionEnd)) return 'px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
  if (s === 'SELESAI') return 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
  return 'px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
}

// ─── Export Excel dengan Pemilihan Kolom ──────────────────────────────────────
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';

const showExportModal = ref(false);
const isExporting = ref(false);

const exportColumns = ref([
  { key: 'no', label: 'No. Berkas', desc: 'Nomor urut berkas' },
  { key: 'klasifikasi', label: 'Klasifikasi', desc: 'Nama klasifikasi arsip' },
  { key: 'klasifikasiKode', label: 'Kode Klasifikasi', desc: 'Kode klasifikasi arsip' },
  { key: 'uraianInformasi', label: 'Uraian Informasi Berkas', desc: 'Uraian berkas' },
  { key: 'kurunWaktu', label: 'Kurun Waktu', desc: 'Waktu arsip tercipta' },
  { key: 'jumlahBerkas', label: 'Jumlah Berkas', desc: 'Jumlah naskah dalam berkas' },
  { key: 'lokasiSimpan', label: 'Lokasi Simpan', desc: 'Lokasi penyimpanan arsip' },
  { key: 'klasifikasiKeamanan', label: 'Klasifikasi Keamanan', desc: 'Keamanan dari master klasifikasi' },
  { key: 'retensiArsipInaktif', label: 'Retensi Arsip Inaktif', desc: 'Retensi dari pemberkasan' },
  { key: 'nasibAkhir', label: 'Nasib Akhir', desc: 'Nasib akhir sesuai jadwal retensi' },
  { key: 'keterangan', label: 'Keterangan', desc: 'Kondisi, media, dan nomor berita acara' },
  { key: 'status', label: 'Status', desc: 'Status penataan arsip' },
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
      const res = await fetchPenataanList({
        search: searchInput.value || undefined,
        status: filterStatus.value || undefined,
        nasibAkhir: filterNasib.value || undefined,
        klasifikasi: filterKlasifikasi.value || undefined,
        page: 1,
        limit: total.value
      });
      const payload = res?.data ?? res;
      if (payload?.data && Array.isArray(payload.data)) {
        allRows = payload.data;
      }
    }

    let exportNumber = 1
    const data = allRows.flatMap((transfer: any) =>
      (transfer.arsipRows ?? []).map((archive: any) => {
        const row: Record<string, any> = {};
        for (const column of exportColumns.value) {
          if (selectedKeys.includes(column.key)) {
            row[column.label] = column.key === 'no'
              ? exportNumber++
              : column.key === 'keterangan' && transfer.status === 'SELESAI'
                ? `Lampiran/${transfer.nomorUsulan}`
                : archive[column.key] ?? '-';
          }
        }
        return row;
      }),
    );

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penataan Arsip Inaktif');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `penataan_arsip_inaktif_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showExportModal.value = false;
    useToast().add({ title: 'Berhasil', description: `${data.length} data penataan berhasil diexport`, color: 'success' });
  } catch (err) {
    console.error('Export penataan error:', err);
    useToast().add({ title: 'Gagal export', description: 'Terjadi kesalahan saat export.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

onMounted(async () => {
  fetchData()
  try {
    const response: any = await apiGet('/penyusutan/pengajuan', {}, { skipCache: true })
    const penyusutanList = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
        ? response
        : []
    penyusutanBerkasIds.value = new Set(
      penyusutanList
        .map((entry: any) => entry.berkasId ?? entry.berkas_id)
        .filter(Boolean)
        .map((id: string) => String(id)),
    )
  } catch {
    // Penataan tetap dapat dibuka walau daftar pengajuan tidak bisa diakses.
  }
  document.addEventListener('mousedown', onClickOutside)
  try {
    const list = await getKlasifikasiList()
    klasifikasiList.value = (list ?? []).map((k) => ({
      klasifikasi: k.klasifikasi,
      klasifikasi_text: k.klasifikasi_text ?? k.nama ?? k.klasifikasi,
    }))
  } catch (e) {
    console.error('Gagal memuat klasifikasi:', e)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  closePenataanLampiranPreview()
})
</script>
