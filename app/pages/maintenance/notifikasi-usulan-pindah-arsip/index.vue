<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <Heading variant="heading6b" class="text-mobile-md">Penerimaan Usulan</Heading>
        <PageHeader :items="breadcrumbs" />
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Daftar usulan pindah arsip yang dikirim oleh Atasan Managerial.
        </p>
      </div>

      <!-- Filter & Search -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <!-- Items per page (custom dropdown) -->
        <div ref="pageSizeRef" class="relative shrink-0 z-30">
          <button
            @click="pageSizeOpen = !pageSizeOpen"
            class="h-10 w-[80px] px-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] flex items-center justify-between"
          >
            <span>{{ limit }}</span>
            <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-gray-400" :class="{ 'rotate-180': pageSizeOpen }" />
          </button>
          <div
            v-if="pageSizeOpen"
            class="absolute top-full left-0 mt-1.5 z-50 min-w-[80px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
          >
            <button
              v-for="size in [10, 30, 50]"
              :key="size"
              @click="onLimitChange(size); pageSizeOpen = false"
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              :class="limit === size ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200'"
            >
              {{ size }}
            </button>
          </div>
        </div>
        <!-- Search -->
        <div class="relative flex-1 min-w-[200px]">
          <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Cari nomor/perihal/sekretaris..."
            class="w-full h-10 pl-10 pr-4 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
            @input="onSearchInput"
          />
        </div>
        <!-- Status Filter (custom dropdown) -->
        <div ref="statusRef" class="relative shrink-0 z-30">
          <button
            @click="statusOpen = !statusOpen"
            class="h-10 w-[180px] px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] flex items-center justify-between"
          >
            <span class="truncate">{{ statusOptions.find(o => o.value === filterStatus)?.label ?? 'Semua Status' }}</span>
            <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" :class="{ 'rotate-180': statusOpen }" />
          </button>
          <div
            v-if="statusOpen"
            class="absolute top-full left-0 mt-1.5 z-50 min-w-[180px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden"
          >
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              @click="filterStatus = opt.value; page = 1; fetchData(); statusOpen = false"
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              :class="filterStatus === opt.value ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200'"
            >
              {{ opt.label }}
            </button>
          </div>
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
                <th class="px-3 py-3 text-left font-semibold">No</th>
                <th class="px-3 py-3 text-left font-semibold">Nomor Usulan</th>
                <th class="px-3 py-3 text-left font-semibold">Sekretaris</th>
                <th class="px-3 py-3 text-left font-semibold">Arsip</th>
                <th class="px-3 py-3 text-left font-semibold">Atasan Managerial</th>
                <th class="px-3 py-3 text-left font-semibold">Tgl Dikirim</th>
                <th class="px-3 py-3 text-left font-semibold">Status</th>
                <th class="px-3 py-3 text-left font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="isLoading">
                <td colspan="8" class="px-3 py-10 text-center">
                  <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
                </td>
              </tr>
              <tr v-else-if="list.length === 0">
                <td colspan="8" class="px-3 py-10 text-center text-gray-500 dark:text-gray-400">
                  Belum ada usulan masuk.
                </td>
              </tr>
              <tr
                v-for="(item, index) in list"
                :key="item.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <td class="px-3 py-3">{{ (page - 1) * limit + index + 1 }}</td>
                <td class="px-3 py-3 font-medium text-gray-800 dark:text-white">{{ item.nomorUsulan }}</td>
                <td class="px-3 py-3">{{ item.sekretarisName }}</td>
                <td class="px-3 py-3">{{ item.arsipPerihal }}</td>
                <td class="px-3 py-3">{{ item.atasanName }}</td>
                <td class="px-3 py-3">{{ formatDate(item.tanggalDikirim) }}</td>
                <td class="px-3 py-3">
                  <span :class="statusBadgeClass(item.status)" class="text-[11px]">{{ statusLabel(item.status) }}</span>
                </td>
                <td class="px-3 py-3">
                  <NuxtLink
                    :to="`/maintenance/verifikasi-berkas-fisik/${item.id}`"
                    class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#457fb6] text-white hover:bg-[#3a6d9c] transition-colors"
                  >
                    <UIcon name="i-lucide-file-check" class="w-3.5 h-3.5" /> Verifikasi
                  </NuxtLink>
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
import { useTuVerifikasi } from '~/composables/useTuVerifikasi'
import type { TuUsulanItem } from '~/types/tu-verifikasi'

definePageMeta({ middleware: ['auth'] })

const { fetchNotifikasiList } = useTuVerifikasi()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penerimaan Usulan', to: '/maintenance/notifikasi-usulan-pindah-arsip' },
])

const list = ref<TuUsulanItem[]>([])
const isLoading = ref(false)
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const totalPages = ref(1)

const searchInput = ref('')
const filterStatus = ref('')
const pageSizeOpen = ref(false)
const pageSizeRef = ref<HTMLElement | null>(null)
const statusOpen = ref(false)
const statusRef = ref<HTMLElement | null>(null)

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'USUL_PINDAH_DIKIRIM', label: 'Menunggu Siapkan Berkas' },
  { value: 'SIAPKAN_BERKAS_FISIK', label: 'Siapkan Berkas Fisik' },
  { value: 'DIKIRIM', label: 'Menunggu Verifikasi' },
  { value: 'BERKAS_FISIK_TIDAK_SESUAI', label: 'Berkas Tidak Sesuai' },
];

const onClickOutside = (e: MouseEvent) => {
  if (pageSizeRef.value && !pageSizeRef.value.contains(e.target as Node)) {
    pageSizeOpen.value = false;
  }
  if (statusRef.value && !statusRef.value.contains(e.target as Node)) {
    statusOpen.value = false;
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
  if (status === 'USUL_PINDAH_DIKIRIM') return 'Menunggu Siapkan Berkas'
  if (status === 'SIAPKAN_BERKAS_FISIK') return 'Siapkan Berkas Fisik'
  if (status === 'BERKAS_FISIK_TIDAK_SESUAI') return 'Berkas Tidak Sesuai'
  if (status === 'DISETUJUI_PERSETUJUAN_TU' || status === 'ARSIP_INAKTIF_DITERIMA') return 'Sudah Diajukan ke Atasan TU'
  if (status === 'MENUNGGU_VERIFIKASI_BERKAS_FISIK') return 'Menunggu Verifikasi Berkas'
  if (status === 'BERKAS_FISIK_SESUAI') return 'Berkas Sesuai'
  if (status === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU') return 'Menunggu Persetujuan TU'
  return 'Menunggu Verifikasi'
}

const statusBadgeClass = (status: string) => {
  if (status === 'BERKAS_FISIK_TIDAK_SESUAI') return 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
  if (status === 'DISETUJUI_PERSETUJUAN_TU' || status === 'ARSIP_INAKTIF_DITERIMA') return 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
  if (status === 'USUL_PINDAH_DIKIRIM' || status === 'SIAPKAN_BERKAS_FISIK') return 'px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
  if (status === 'BERKAS_FISIK_SESUAI') return 'px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
  return 'px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
}

const onExport = () => {
  if (list.value.length === 0) {
    alert('Tidak ada data untuk diexport')
    return
  }
  const headers = ['Nomor Usulan', 'Sekretaris', 'Arsip', 'Atasan', 'Tgl Dikirim', 'Status']
  const rows = list.value.map((r: any) => [
    r.nomorUsulan ?? '',
    r.sekretarisName ?? '',
    r.arsipPerihal ?? '',
    r.atasanName ?? '',
    r.tanggalDikirim ?? '',
    statusLabel(r.status) ?? '',
  ])
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `penerimaan-usulan-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  fetchData()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>