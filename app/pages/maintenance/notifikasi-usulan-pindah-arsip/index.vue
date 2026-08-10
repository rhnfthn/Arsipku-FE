<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <Heading variant="heading6b" class="text-mobile-md">Penerimaan Usulan</Heading>
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
                    type="button"
                    @click.stop="filterStatus = ''; page = 1; fetchData(); statusOpen = false"
                    :class="['w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-gray-50 dark:border-gray-700', filterStatus === '' ? 'bg-primary/5 text-primary dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700']"
                  >Semua Status</button>
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

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-primary dark:bg-primary-700 text-white">
              <tr>
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
                <td colspan="7" class="px-3 py-10 text-center">
                  <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
                </td>
              </tr>
              <tr v-else-if="list.length === 0">
                <td colspan="7" class="px-3 py-10 text-center text-gray-500 dark:text-gray-400">
                  Belum ada usulan masuk.
                </td>
              </tr>
              <tr
                v-for="item in list"
                :key="item.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
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
                    class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-white hover:bg-primary-800 transition-colors"
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
import { ChevronDown } from 'lucide-vue-next'
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
const statusOpen = ref(false)

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'USUL_PINDAH_DIKIRIM', label: 'Menunggu Siapkan Berkas' },
  { value: 'SIAPKAN_BERKAS_FISIK', label: 'Siapkan Berkas Fisik' },
  { value: 'DIKIRIM', label: 'Menunggu Verifikasi' },
  { value: 'BERKAS_FISIK_TIDAK_SESUAI', label: 'Berkas Tidak Sesuai' },
];

const onClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const els = document.querySelectorAll('[data-custom-dropdown]');
  for (const el of Array.from(els)) {
    if (el.contains(target)) return;
  }
  pageSizeOpen.value = false;
  statusOpen.value = false;
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