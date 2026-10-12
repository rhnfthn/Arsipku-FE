<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <Heading variant="heading6b" class="text-mobile-md">Penataan / Pemusnahan</Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- Filter, Search & Table -->
      <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
      <div class="flex flex-wrap items-center gap-3 border-b border-gray-300 p-4 dark:border-gray-700">
        <div ref="pageSizeRef" class="relative shrink-0 z-30">
          <button
            @click="pageSizeOpen = !pageSizeOpen"
            class="h-10 w-[80px] px-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] flex items-center justify-between"
          >
            <span>{{ limit }}</span>
            <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-gray-400" :class="{ 'rotate-180': pageSizeOpen }" />
          </button>
          <div v-if="pageSizeOpen" class="absolute top-full left-0 mt-1.5 z-50 min-w-[80px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
            <button
              v-for="size in [10, 25, 50]"
              :key="size"
              @click="onLimitChange(size); pageSizeOpen = false"
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              :class="limit === size ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200'"
            >{{ size }}</button>
          </div>
        </div>

        <!-- Filter Status -->
        <div ref="statusRef" class="relative shrink-0 z-30">
          <button
            @click="statusOpen = !statusOpen"
            class="h-10 w-[150px] px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] flex items-center justify-between"
          >
            <span class="truncate">{{ statusOptions.find(o => o.value === filterStatus)?.label ?? 'Semua Status' }}</span>
            <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" :class="{ 'rotate-180': statusOpen }" />
          </button>
          <div v-if="statusOpen" class="absolute top-full left-0 mt-1.5 z-50 min-w-[150px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              @click="filterStatus = opt.value; page = 1; statusOpen = false"
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              :class="filterStatus === opt.value ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200'"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- Filter Klasifikasi -->
        <div ref="klasifikasiRef" class="relative shrink-0 z-30">
          <button
            @click="klasifikasiOpen = !klasifikasiOpen"
            class="h-10 w-[180px] px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] flex items-center justify-between"
          >
            <span class="truncate">{{ klasifikasiLabel }}</span>
            <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" :class="{ 'rotate-180': klasifikasiOpen }" />
          </button>
          <div v-if="klasifikasiOpen" class="absolute top-full left-0 mt-1.5 z-50 min-w-[180px] max-h-56 overflow-y-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
            <button
              @click="filterKlasifikasi = ''; page = 1; klasifikasiOpen = false"
              :class="['w-full text-left px-4 py-2 text-sm transition-colors border-b border-gray-50 dark:border-gray-700', filterKlasifikasi === '' ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600']"
            >Semua Klasifikasi</button>
            <button
              v-for="k in klasifikasiList"
              :key="k"
              @click="filterKlasifikasi = k; page = 1; klasifikasiOpen = false"
              :class="['w-full text-left px-4 py-2 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0', filterKlasifikasi === k ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600']"
            >{{ k }}</button>
          </div>
        </div>

        <!-- Search -->
        <div class="relative flex-1 min-w-[200px]">
          <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Cari kode/nama berkas..."
            class="w-full h-10 pl-10 pr-4 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
            @input="onSearchInput"
          />
        </div>

        <!-- Export -->
        <button
          @click="onExport"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap shrink-0"
        >
          <UIcon name="i-lucide-download" class="w-4 h-4" /> Export
        </button>
      </div>

      <!-- Table -->
      <div>
          <table class="w-full table-fixed text-xs">
            <thead class="bg-[#457fb6] text-white">
              <tr>
                <th class="w-[4%] px-1.5 py-2 text-center font-semibold">No</th>
                <th class="w-[12%] px-1.5 py-2 text-center font-semibold">Kode Klasifikasi</th>
                <th class="w-[18%] px-1.5 py-2 text-center font-semibold">Uraian Informasi Berkas</th>
                <th class="w-[9%] px-1.5 py-2 text-center font-semibold">Kurun Waktu</th>
                <th class="w-[6%] px-1.5 py-2 text-center font-semibold">Jumlah Berkas</th>
                <th class="w-[9%] px-1.5 py-2 text-center font-semibold">Lokasi Simpan</th>
                <th class="w-[8%] px-1.5 py-2 text-center font-semibold">Klasifikasi Keamanan</th>
                <th class="w-[8%] px-1.5 py-2 text-center font-semibold">Nasib Akhir</th>
                <th class="w-[10%] px-1.5 py-2 text-center font-semibold">Keterangan</th>
                <th class="w-[10%] px-1.5 py-2 text-center font-semibold">Status</th>
                <th class="w-[6%] px-1.5 py-2 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="isLoading">
                <td colspan="11" class="px-3 py-10 text-center">
                  <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
                </td>
              </tr>
              <tr v-else-if="filteredList.length === 0">
                <td colspan="11" class="px-3 py-10 text-center text-gray-500 dark:text-gray-400">
                  Belum ada arsip untuk penataan/pemusnahan.
                </td>
              </tr>
              <tr
                v-for="(item, index) in paginatedList"
                :key="item.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                :class="rowClass(item)"
              >
                <td class="break-words px-1.5 py-2 text-center text-gray-700 dark:text-gray-200">{{ (page - 1) * limit + index + 1 }}</td>
                <td class="break-words px-1.5 py-2 text-center">
                  <div class="font-medium text-gray-800 dark:text-white">{{ item.klasifikasiText || item.klasifikasi_text || item.klasifikasi || '-' }}</div>
                  <div class="mt-0.5 text-[10px] text-gray-400">{{ item._archive?.klasifikasiKode || item.klasifikasi || '-' }}</div>
                </td>
                <td class="break-words px-1.5 py-2 text-gray-700 dark:text-gray-200">{{ item._archive?.uraianInformasi || item.nama_berkas || '-' }}</td>
                <td class="whitespace-nowrap px-1.5 py-2 text-center text-gray-600 dark:text-gray-300">{{ item.kurunWaktu || item.kurun_waktu || item._archive?.kurunWaktu || '-' }}</td>
                <td class="break-words px-1.5 py-2 text-center text-gray-600 dark:text-gray-300">{{ item.jumlahBerkas ?? item.jumlah_berkas ?? item._archive?.jumlahBerkas ?? item.daftarArsip?.length ?? item.daftar_arsip?.length ?? 1 }}</td>
                <td class="break-words px-1.5 py-2 text-center text-gray-600 dark:text-gray-300">{{ item._archive?.lokasiSimpan || item._transfer?.lokasiPenataan || item.lokasiSimpan || item.lokasi_simpan || '-' }}</td>
                <td class="break-words px-1.5 py-2 text-center text-gray-600 dark:text-gray-300">{{ item.klasifikasiKeamanan || item.klasifikasi_keamanan || item._archive?.klasifikasiKeamanan || '-' }}</td>
                <td class="whitespace-nowrap px-1.5 py-2 text-center text-gray-600 dark:text-gray-300">{{ item.nasibAkhir || item._archive?.nasibAkhir || (item.jenis_penyusutan === 'musnah' ? 'Musnah' : 'Permanen') }}</td>
                <td class="break-words px-1.5 py-2 text-center">
                  <button
                    v-if="item._transfer?.id || item.transferId || item.transfer_id || item.penataanData?.transferId"
                    type="button"
                    @click="openLampiranPreview({
                      id: item._transfer?.id ?? item.transferId ?? item.transfer_id ?? item.penataanData?.transferId,
                      nomorUsulan: item._transfer?.nomorUsulan ?? item.nomorUsulan ?? item.no_usulan,
                    })"
                    class="text-primary hover:underline dark:text-primary-400"
                  >
                    Lampiran/{{ item._transfer?.nomorUsulan ?? item.nomorUsulan ?? item.no_usulan ?? '-' }}
                  </button>
                  <span v-else class="text-primary dark:text-primary-400">
                    {{ item.no_usulan ? `Lampiran/${item.no_usulan}` : '-' }}
                  </span>
                </td>
                <td class="px-1.5 py-2 text-center">
                  <span :class="statusBadgeClass(item.status)" class="inline-flex max-w-full justify-center whitespace-normal break-words text-center text-[10px] leading-tight">{{ statusLabel(item.status) }}</span>
                </td>
                <td class="px-1.5 py-2 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <NuxtLink
                      v-if="item.status === 'selesai'"
                      :to="`/kelola/penyusutan/penataan-pemusnahan/${item.id}`"
                      @click="markViewed(item)"
                      class="inline-flex items-center justify-center rounded-md px-1.5 py-1 text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                      title="Detail"
                    >
                      <UIcon name="i-lucide-eye" class="w-4 h-4" />
                    </NuxtLink>
                    <NuxtLink
                      v-if="item.jenis_penyusutan === 'permanen' && item.status === 'diterima'"
                      :to="`/kelola/penyusutan/penataan-pemusnahan/${item.id}`"
                      @click="markViewed(item)"
                      class="inline-flex items-center justify-center rounded-md px-1.5 py-1 text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                      title="Penataan"
                    >
                      <UIcon name="i-lucide-archive" class="w-4 h-4" />
                    </NuxtLink>
                    <NuxtLink
                      v-if="item.jenis_penyusutan === 'musnah' && item.status === 'diterima'"
                      :to="`/kelola/penyusutan/penataan-pemusnahan/${item.id}`"
                      @click="markViewed(item)"
                      class="inline-flex items-center justify-center rounded-md px-1.5 py-1 text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                      title="Pemusnahan"
                    >
                      <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                    </NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="total > 0" class="border-t border-gray-200 dark:border-gray-700">
          <Pagination
            :current-page="page"
            :total-pages="totalPages"
            :total-items="total"
            :rows-per-page="limit"
            :rows-options="[]"
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
      :total-rows="filteredList.length"
      title="Pilih Kolom Export Penataan & Pemusnahan"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
    <SharedSharePdfViewer
      v-model="lampiranPreviewOpen"
      :url="lampiranPreviewUrl"
      :title="lampiranPreviewTitle"
      :loading="lampiranPreviewLoading"
      @close="closeLampiranPreview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { usePenyusutan } from '~/composables/usePenyusutan'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'

definePageMeta({
  middleware: ['auth', 'penyusutan-access'],
  alias: ['/kelola/penyusutan/penataan-pemusnahan'],
})

const route = useRoute()
if (route.path === '/maintenance/penyusutan/penataan-pemusnahan') {
  await navigateTo('/kelola/penyusutan/penataan-pemusnahan', { replace: true })
}

const { penataanList, loadPenataanList } = usePenyusutan()
const { fetchPenataanList } = useTuVerifikasi()
const { rowClass, markViewed } = useViewedRows('penyusutan-penataan-pemusnahan')
const { apiGet } = useApi()
const toast = useToast()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penyusutan', to: '/kelola/penyusutan/penataan-pemusnahan' },
  { label: 'Penataan / Pemusnahan', to: '/kelola/penyusutan/penataan-pemusnahan' },
])

const isLoading = ref(false)
const page = ref(1)
const limit = ref(10)
const searchInput = ref('')
const filterStatus = ref('')
const filterKlasifikasi = ref('')
const pageSizeOpen = ref(false)
const statusOpen = ref(false)
const klasifikasiOpen = ref(false)
const pageSizeRef = ref<HTMLElement | null>(null)
const statusRef = ref<HTMLElement | null>(null)
const klasifikasiRef = ref<HTMLElement | null>(null)
const archiveMetadataById = ref(new Map<string, { archive: any; transfer: any }>())
const lampiranPreviewOpen = ref(false)
const lampiranPreviewLoading = ref(false)
const lampiranPreviewUrl = ref('')
const lampiranPreviewTitle = ref('Preview Lampiran')

const closeLampiranPreview = () => {
  lampiranPreviewOpen.value = false
  if (lampiranPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(lampiranPreviewUrl.value)
  lampiranPreviewUrl.value = ''
}

const openLampiranPreview = async (transfer: any) => {
  if (!transfer?.id) return
  closeLampiranPreview()
  lampiranPreviewTitle.value = `Lampiran/${transfer.nomorUsulan || ''}`
  lampiranPreviewOpen.value = true
  lampiranPreviewLoading.value = true
  try {
    let response: any = await apiGet<unknown>(
      `/transfer-active-to-inactive/${transfer.id}/lampiran-penataan.pdf`,
      { responseType: 'blob', headers: { Accept: 'application/pdf' } },
      { skipCache: true },
    )
    if (response && typeof response === 'object' && !(response instanceof Blob) && 'data' in response) response = response.data
    const pdfBlob = response instanceof Blob
      ? response
      : response instanceof ArrayBuffer
        ? new Blob([response], { type: 'application/pdf' })
        : ArrayBuffer.isView(response)
          ? new Blob([new Uint8Array(response.buffer, response.byteOffset, response.byteLength)], { type: 'application/pdf' })
          : null
    if (!pdfBlob || pdfBlob.size === 0 || (await pdfBlob.slice(0, 5).text()) !== '%PDF-') throw new Error('Lampiran bukan PDF yang valid.')
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
    toast.add({ title: 'Preview lampiran gagal dibuka', description: description || 'Silakan coba kembali.', color: 'error' })
  } finally {
    lampiranPreviewLoading.value = false
  }
}

const loadArchiveMetadata = async () => {
  try {
    const metadata = new Map<string, { archive: any; transfer: any }>()
    let currentPage = 1
    let totalPages = 1

    do {
      const response: any = await fetchPenataanList({ page: currentPage, limit: 100 })
      const payload = response?.data ?? response
      const transfers = Array.isArray(payload?.data) ? payload.data : []

      for (const transfer of transfers) {
        for (const archive of transfer.arsipRows ?? []) {
          if (archive?.id != null) metadata.set(String(archive.id), { archive, transfer })
        }
      }

      totalPages = Math.max(1, Number(payload?.meta?.totalPages) || 1)
      currentPage += 1
    } while (currentPage <= totalPages)

    archiveMetadataById.value = metadata
  } catch (error) {
    // Detail penyusutan tetap dapat ditampilkan jika metadata arsip tidak tersedia.
    console.warn('Metadata arsip penataan tidak dapat dimuat:', error)
  }
}

const enrichedPenataanList = computed(() => penataanList.value.map((item: any) => {
  const archiveId = item.berkasId ?? item.berkas_id
  const metadata = archiveId != null ? archiveMetadataById.value.get(String(archiveId)) : undefined
  if (!metadata) return item

  return {
    ...item,
    _archive: metadata.archive,
    _transfer: metadata.transfer,
    klasifikasiText: item.klasifikasiText || item.klasifikasi_text || metadata.archive.klasifikasi,
    kurunWaktu: item.kurunWaktu || item.kurun_waktu || metadata.archive.kurunWaktu,
    jumlahBerkas: item.jumlahBerkas ?? item.jumlah_berkas ?? metadata.archive.jumlahBerkas,
    klasifikasiKeamanan: item.klasifikasiKeamanan || item.klasifikasi_keamanan || metadata.archive.klasifikasiKeamanan,
    nasibAkhir: item.nasibAkhir || metadata.archive.nasibAkhir,
  }
}))

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'diterima', label: 'Disetujui' },
  { value: 'selesai', label: 'Selesai' },
]

const klasifikasiList = computed(() => {
  const seen = new Set<string>()
  const result: string[] = []
  for (const a of enrichedPenataanList.value) {
    if (a.klasifikasi && !seen.has(a.klasifikasi)) {
      seen.add(a.klasifikasi)
      result.push(a.klasifikasi)
    }
  }
  return result
})

const klasifikasiLabel = computed(() => {
  if (!filterKlasifikasi.value) return 'Semua Klasifikasi'
  return filterKlasifikasi.value
})

const filteredList = computed(() => {
  let result = enrichedPenataanList.value.filter((a) => a.status === 'diterima' || a.status === 'selesai')
  if (searchInput.value) {
    const q = searchInput.value.toLowerCase()
    result = result.filter((a) =>
      (a.kode_berkas ?? '').toLowerCase().includes(q) ||
      (a.nama_berkas ?? '').toLowerCase().includes(q)
    )
  }
  if (filterStatus.value) {
    result = result.filter((a) => a.status === filterStatus.value)
  }
  if (filterKlasifikasi.value) {
    result = result.filter((a) => a.klasifikasi === filterKlasifikasi.value)
  }
  return result
})

const total = computed(() => filteredList.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))
const paginatedList = computed(() => {
  const start = (page.value - 1) * limit.value
  return filteredList.value.slice(start, start + limit.value)
})

const statusLabel = (status: string) => {
  const map: Record<string, string> = { diterima: 'Disetujui', selesai: 'Selesai', diajukan: 'Menunggu Persetujuan', ditolak: 'Ditolak' }
  return map[status] ?? status
}

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    diterima: 'px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    selesai: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    diajukan: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    ditolak: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  }
  return map[status] ?? 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const onSearchInput = () => {
  clearTimeout((window as any).__penyusutanDebounce4)
  ;(window as any).__penyusutanDebounce4 = setTimeout(() => { page.value = 1 }, 400)
}

const onPageChange = (p: number) => { page.value = p }
const onLimitChange = (l: number) => { limit.value = l; page.value = 1 }

// ─── Export Excel dengan Pemilihan Kolom ──────────────────────────────────────
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';

const showExportModal = ref(false);
const isExporting = ref(false);

const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'nama_berkas', label: 'Nama Berkas', desc: 'Perihal / nama berkas arsip' },
  { key: 'kode_berkas', label: 'Kode Berkas', desc: 'Kode berkas arsip' },
  { key: 'no_usulan', label: 'No Usulan', desc: 'Nomor berkas usulan' },
  { key: 'klasifikasi', label: 'Klasifikasi', desc: 'Kode klasifikasi arsip' },
  { key: 'jenis', label: 'Jenis Penyusutan', desc: 'Jenis tindakan penyusutan' },
  { key: 'status', label: 'Status', desc: 'Status persetujuan penyusutan' }
]);

const onExport = () => {
  if (filteredList.value.length === 0) {
    useToast().add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' });
    return;
  }
  showExportModal.value = true;
};

const handleExportConfirm = (selectedKeys: string[]) => {
  if (filteredList.value.length === 0 || selectedKeys.length === 0) return;
  isExporting.value = true;
  try {
    const data = filteredList.value.map((r: any, idx: number) => {
      const row: Record<string, any> = {};
      if (selectedKeys.includes('No')) row['No'] = idx + 1;
      if (selectedKeys.includes('nama_berkas')) row['Nama Berkas'] = r.nama_berkas || '-';
      if (selectedKeys.includes('kode_berkas')) row['Kode Berkas'] = r.kode_berkas || '-';
      if (selectedKeys.includes('no_usulan')) row['No Usulan'] = r.no_usulan || '-';
      if (selectedKeys.includes('klasifikasi')) row['Klasifikasi'] = r.klasifikasi || '-';
      if (selectedKeys.includes('jenis')) row['Jenis Penyusutan'] = r.jenis_penyusutan === 'permanen' ? 'Permanen' : 'Musnah';
      if (selectedKeys.includes('status')) row['Status'] = statusLabel(r.status);
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penataan Pemusnahan');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    saveAs(blob, `penataan_pemusnahan_${new Date().toISOString().slice(0, 10)}.xlsx`);

    showExportModal.value = false;
    useToast().add({ title: 'Berhasil', description: `${data.length} data berhasil diexport`, color: 'success' });
  } catch (err) {
    console.error('Export penataan pemusnahan error:', err);
    useToast().add({ title: 'Gagal export', description: 'Terjadi kesalahan saat export.', color: 'error' });
  } finally {
    isExporting.value = false;
  }
};

const onClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (pageSizeRef.value && !pageSizeRef.value.contains(target)) pageSizeOpen.value = false
  if (statusRef.value && !statusRef.value.contains(target)) statusOpen.value = false
  if (klasifikasiRef.value && !klasifikasiRef.value.contains(target)) klasifikasiOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  isLoading.value = true
  Promise.all([loadPenataanList(), loadArchiveMetadata()]).finally(() => { isLoading.value = false })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>
