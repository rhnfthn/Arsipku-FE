<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <Heading variant="heading6b" class="text-mobile-md">Pengajuan Penyusutan</Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- Filter & Search -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <!-- Items per page -->
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
              v-for="size in [10, 30, 50]"
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
              :key="k.klasifikasi"
              @click="filterKlasifikasi = k.klasifikasi; page = 1; klasifikasiOpen = false"
              :class="['w-full text-left px-4 py-2 text-sm transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0', filterKlasifikasi === k.klasifikasi ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600']"
            >{{ k.klasifikasi }} — {{ k.klasifikasi_text || '' }}</button>
          </div>
        </div>

        <!-- Filter Jenis Penyusutan -->
        <div ref="jenisRef" class="relative shrink-0 z-30">
          <button
            @click="jenisOpen = !jenisOpen"
            class="h-10 w-[150px] px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] flex items-center justify-between"
          >
            <span class="truncate">{{ jenisOptions.find(o => o.value === filterJenis)?.label ?? 'Semua Jenis' }}</span>
            <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" :class="{ 'rotate-180': jenisOpen }" />
          </button>
          <div v-if="jenisOpen" class="absolute top-full left-0 mt-1.5 z-50 min-w-[150px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
            <button
              v-for="opt in jenisOptions"
              :key="opt.value"
              @click="filterJenis = opt.value; page = 1; jenisOpen = false"
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              :class="filterJenis === opt.value ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200'"
            >{{ opt.label }}</button>
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
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-[#457fb6] text-white">
              <tr>
                <th class="px-3 py-3 text-center font-semibold">Nama Berkas</th>
                <th class="px-3 py-3 text-center font-semibold">Kode Berkas / No Usulan</th>
                <th class="px-3 py-3 text-center font-semibold">Klasifikasi</th>
                <th class="px-3 py-3 text-center font-semibold">Jenis</th>
                <th class="px-3 py-3 text-center font-semibold">Status</th>
                <th class="px-3 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="isLoading">
                <td colspan="6" class="px-3 py-10 text-center">
                  <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
                </td>
              </tr>
              <tr v-else-if="filteredList.length === 0">
                <td colspan="6" class="px-3 py-10 text-center text-gray-500 dark:text-gray-400">
                  Tidak ada arsip untuk diajukan.
                </td>
              </tr>
              <tr
                v-for="item in paginatedList"
                :key="item.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <td class="px-3 py-3">{{ item.nama_berkas }}</td>
                <td class="px-3 py-3">
                  <div class="font-medium text-gray-800 dark:text-white">{{ item.kode_berkas }}</div>
                  <div v-if="item.no_usulan" class="text-[11px] text-gray-400">{{ item.no_usulan }}</div>
                </td>
                <td class="px-3 py-3">
                  <div class="font-medium text-gray-800 dark:text-white">{{ item.klasifikasiText || item.klasifikasi_text || item.klasifikasi || '-' }}</div>
                  <div v-if="item.klasifikasi" class="text-[11px] text-gray-400">{{ item.klasifikasi }}</div>
                </td>
                <td class="px-3 py-3">
                  <span :class="item.jenis_penyusutan === 'permanen' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'" class="px-2 py-0.5 rounded-full text-[11px] font-medium">
                    {{ item.jenis_penyusutan === 'permanen' ? 'Permanen' : 'Musnah' }}
                  </span>
                </td>
                <td class="px-3 py-3">
                  <span :class="statusBadgeClass(item.status)" class="text-[11px]">{{ statusLabel(item.status) }}</span>
                </td>
                <td class="px-3 py-3 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <NuxtLink
                      :to="`/maintenance/penyusutan/pengajuan-penyusutan/detail/${item.id}`"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200 transition-colors"
                      title="Detail"
                    >
                      <UIcon name="i-lucide-eye" class="w-4 h-4" />
                    </NuxtLink>
                    <NuxtLink
                      v-if="item.atasan_managerial.length === 0"
                      :to="`/maintenance/penyusutan/pengajuan-penyusutan/ajukan/${item.id}`"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors"
                      title="Ajukan Penyusutan"
                    >
                      <UIcon name="i-lucide-send" class="w-4 h-4" />
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
            :rows-options="[10, 20, 50]"
            @update:page="onPageChange"
            @update:rows-per-page="onLimitChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePenyusutan } from '~/composables/usePenyusutan'
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import { useApi } from '~/composables/useApi'
import type { ArsipPenyusutan } from '~/types/penyusutan'

definePageMeta({ middleware: ['auth'] })

const { loadData: loadPenyusutan, list: penyusutanList } = usePenyusutan()
const { fetchPenataanList } = useTuVerifikasi()
const { apiGet } = useApi()

const list = ref<ArsipPenyusutan[]>([])

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Pengajuan Penyusutan', to: '/maintenance/penyusutan/pengajuan-penyusutan' },
])

const isLoading = ref(false)
const page = ref(1)
const limit = ref(10)
const searchInput = ref('')
const filterStatus = ref('')
const filterKlasifikasi = ref('')
const filterJenis = ref('')
const pageSizeOpen = ref(false)
const statusOpen = ref(false)
const klasifikasiOpen = ref(false)
const jenisOpen = ref(false)
const pageSizeRef = ref<HTMLElement | null>(null)
const statusRef = ref<HTMLElement | null>(null)
const klasifikasiRef = ref<HTMLElement | null>(null)
const jenisRef = ref<HTMLElement | null>(null)

const klasifikasiList = ref<any[]>([])

const klasifikasiLabel = computed(() => {
  if (!filterKlasifikasi.value) return 'Semua Klasifikasi'
  const k = klasifikasiList.value.find((x: any) => x.klasifikasi === filterKlasifikasi.value)
  return k ? `${k.klasifikasi} — ${k.klasifikasi_text || ''}` : 'Semua Klasifikasi'
})

const fetchKlasifikasi = async () => {
  try {
    const data: any = await apiGet('/arsip-dinamis/klasifikasi', {}, { skipCache: true })
    klasifikasiList.value = Array.isArray(data) ? data : (data?.data ?? [])
  } catch (e) {
    console.error('Gagal memuat klasifikasi:', e)
  }
}

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'diajukan', label: 'Diajukan' },
  { value: 'diterima', label: 'Diterima' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'selesai', label: 'Selesai' },
]

const jenisOptions = [
  { value: '', label: 'Semua Jenis' },
  { value: 'permanen', label: 'Permanen' },
  { value: 'musnah', label: 'Musnah' },
]

const filteredList = computed(() => {
  let result = list.value
  if (searchInput.value) {
    const q = searchInput.value.toLowerCase()
    result = result.filter((a) =>
      a.kode_berkas.toLowerCase().includes(q) ||
      a.nama_berkas.toLowerCase().includes(q) ||
      a.sekretaris.toLowerCase().includes(q) ||
      (a.no_usulan ?? '').toLowerCase().includes(q) ||
      (a.klasifikasi ?? '').toLowerCase().includes(q) ||
      (a.jenis_penyusutan === 'permanen' ? 'permanen' : 'musnah').includes(q) ||
      statusLabel(a.status).toLowerCase().includes(q)
    )
  }
  if (filterStatus.value) result = result.filter((a) => a.status === filterStatus.value)
  if (filterKlasifikasi.value) result = result.filter((a) => a.klasifikasi === filterKlasifikasi.value)
  if (filterJenis.value) result = result.filter((a) => a.jenis_penyusutan === filterJenis.value)
  return result
})

const total = computed(() => filteredList.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))
const paginatedList = computed(() => {
  const start = (page.value - 1) * limit.value
  return filteredList.value.slice(start, start + limit.value)
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = { draft: 'Draft', diajukan: 'Diajukan', diterima: 'Diterima', ditolak: 'Ditolak', selesai: 'Selesai' }
  return map[status] ?? status
}

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    draft: 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    diajukan: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    diterima: 'px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    ditolak: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    selesai: 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  }
  return map[status] ?? 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const verifikatorLabel = (status: string) => {
  const map: Record<string, string> = { menunggu: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak' }
  return map[status] ?? status
}

const verifikatorBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    menunggu: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    disetujui: 'px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    ditolak: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  }
  return map[status] ?? 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const onSearchInput = () => {
  clearTimeout((window as any).__penyusutanDebounce)
  ;(window as any).__penyusutanDebounce = setTimeout(() => { page.value = 1 }, 400)
}

const onPageChange = (p: number) => { page.value = p }
const onLimitChange = (l: number) => { limit.value = l; page.value = 1 }

const onExport = () => {
  if (filteredList.value.length === 0) { alert('Tidak ada data untuk diexport'); return }
  const headers = ['No', 'Kode Berkas', 'No Usulan', 'Nama Berkas', 'Sekretaris', 'Jenis', 'Status']
  const rows = filteredList.value.map((r, i) => [
    i + 1, r.kode_berkas, r.no_usulan ?? '', r.nama_berkas, r.sekretaris, r.jenis_penyusutan, statusLabel(r.status),
  ])
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pengajuan-penyusutan-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const onClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (pageSizeRef.value && !pageSizeRef.value.contains(target)) pageSizeOpen.value = false
  if (statusRef.value && !statusRef.value.contains(target)) statusOpen.value = false
  if (klasifikasiRef.value && !klasifikasiRef.value.contains(target)) klasifikasiOpen.value = false
  if (jenisRef.value && !jenisRef.value.contains(target)) jenisOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  fetchKlasifikasi()
  isLoading.value = true
  loadPenataanData().finally(() => { isLoading.value = false })
})

/** Ambil data pengajuan penyusutan dari API + arsip tersedia dari penataan
 *  (status SELESAI, belum diajukan penyusutan). */
const loadPenataanData = async () => {
  try {
    // 1. Load pengajuan penyusutan dari API (sudah diajukan)
    await loadPenyusutan()
    const pengajuan = JSON.parse(JSON.stringify(penyusutanList.value))

    // Kumpulkan berkasId yang sudah punya pengajuan penyusutan aktif
    // (bukan SELESAI/DITOLAK) agar tidak duplikat dengan data penataan.
    const sudahDiajukanBerkasIds = new Set(
      pengajuan
        .filter((p: any) => p.status !== 'selesai' && p.status !== 'ditolak')
        .map((p: any) => p.berkasId ?? p.berkas_id)
        .filter(Boolean)
    )

    // 2. Ambil data penataan status SELESAI (arsip yang bisa diajukan penyusutan)
    const res: any = await fetchPenataanList({
      status: 'SELESAI',
      page: 1,
      limit: 100,
    })
    const payload = res?.data ?? res
    const items = payload?.data || []

    // Map data penataan ke format ArsipPenyusutan, status diubah jadi "draft"
    // FILTER: hanya arsip yang BELUM punya pengajuan penyusutan aktif
    const penataan = items
      .filter((d: any) => {
        const berkasId = d.arsipIds?.[0]?.id ?? d.arsipId ?? d.id
        return !sudahDiajukanBerkasIds.has(berkasId)
      })
      .map((d: any) => ({
        id: d.id,
        no_usulan: d.nomorUsulan ?? '',
        kode_berkas: d.arsipKode ?? '',
        nama_berkas: d.arsipPerihal ?? '',
        klasifikasi: d.arsipKlasifikasiKode ?? '',
        klasifikasiText: d.arsipKlasifikasi ?? '',
        sekretaris: d.sekretarisName ?? '',
        atasan_managerial: [],
        status: 'draft',
        jenis_penyusutan: 'permanen',
        lokasi_simpan: d.lokasiPenataan ?? null,
        tanggal_retensi_habis: d.tanggalRetensiAktifHabis ?? '',
        tanggal_pengajuan: null,
        catatan: d.keterangan ?? '',
        keterangan: d.keterangan ?? null,
        daftar_arsip: (d.arsipIds && Array.isArray(d.arsipIds) ? d.arsipIds : []).map((a: any) => ({
          id: a.id ?? '',
          nama: a.perihal ?? '',
          kode: a.kode ?? '',
        })),
        foto_dokumentasi: d.fotoPenataan ?? null,
        berita_acara: d.beritaAcaraUrl ?? null,
        current_verifikator_urutan: 1,
        berkasId: d.arsipIds?.[0]?.id ?? d.arsipId ?? d.id,
      }))

    // Gabungkan: pengajuan dari API (sudah diajukan) + penataan (status draft, belum diajukan)
    list.value = [...pengajuan, ...penataan]
  } catch (e) {
    console.error('Gagal memuat data penyusutan:', e)
    // Fallback: hanya pengajuan dari API
    list.value = JSON.parse(JSON.stringify(penyusutanList.value))
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>