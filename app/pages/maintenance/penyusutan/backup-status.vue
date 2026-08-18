<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <Heading variant="heading6b" class="text-mobile-md">Status Backup Data</Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- Filter & Search -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <!-- Filter Jenis -->
        <div class="relative shrink-0 z-30">
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
              @click="filterJenis = opt.value; jenisOpen = false"
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              :class="filterJenis === opt.value ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200'"
            >{{ opt.label }}</button>
          </div>
        </div>

        <!-- Filter Status -->
        <div class="relative shrink-0 z-30">
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
              @click="filterStatus = opt.value; statusOpen = false"
              class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              :class="filterStatus === opt.value ? 'bg-[#457fb6]/10 text-[#457fb6] font-medium' : 'text-gray-700 dark:text-gray-200'"
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
                <th class="px-3 py-3 text-center font-semibold">Kode Berkas</th>
                <th class="px-3 py-3 text-center font-semibold">Klasifikasi</th>
                <th class="px-3 py-3 text-center font-semibold">ID Berkas Asli</th>
                <th class="px-3 py-3 text-center font-semibold">ID Penyusutan</th>
                <th class="px-3 py-3 text-center font-semibold">Jenis</th>
                <th class="px-3 py-3 text-center font-semibold">Status</th>
                <th class="px-3 py-3 text-center font-semibold">Tanggal Backup</th>
                <th class="px-3 py-3 text-center font-semibold">Diproses Oleh</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="isLoading">
                <td colspan="9" class="px-3 py-10 text-center">
                  <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
                </td>
              </tr>
              <tr v-else-if="filteredList.length === 0">
                <td colspan="9" class="px-3 py-10 text-center text-gray-500 dark:text-gray-400">
                  Belum ada data backup.
                </td>
              </tr>
              <tr v-for="(item, i) in filteredList" :key="i" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td class="px-3 py-3 text-gray-800 dark:text-gray-200">{{ item.judulBerkas }}</td>
                <td class="px-3 py-3 text-center font-mono text-xs text-gray-600 dark:text-gray-300">{{ item.kodeBerkas ?? '-' }}</td>
                <td class="px-3 py-3 text-center text-gray-600 dark:text-gray-300">{{ item.klasifikasiText || item.klasifikasi || '-' }}</td>
                <td class="px-3 py-3 text-center font-mono text-xs text-gray-500">{{ item.sourceBerkasId }}</td>
                <td class="px-3 py-3 text-center font-mono text-xs text-gray-500">{{ item.sourcePenyusutanId ?? '-' }}</td>
                <td class="px-3 py-3 text-center">
                  <span :class="item.isMusnah ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'" class="px-2 py-0.5 rounded-full text-[11px] font-medium">
                    {{ item.isMusnah ? 'Musnah' : 'Permanen' }}
                  </span>
                </td>
                <td class="px-3 py-3 text-center">
                  <span :class="statusBadgeClass(item.status)" class="text-[11px]">{{ statusLabel(item.status) }}</span>
                </td>
                <td class="px-3 py-3 text-center text-gray-600 dark:text-gray-300">{{ formatDate(item.tanggalBackup) }}</td>
                <td class="px-3 py-3 text-center text-gray-600 dark:text-gray-300">{{ item.diprosesOlehName ?? '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePenyusutan } from '~/composables/usePenyusutan'

definePageMeta({ middleware: ['auth'] })

const { loadBackupStatus } = usePenyusutan()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penyusutan', to: '/maintenance/penyusutan/penataan-pemusnahan' },
  { label: 'Status Backup Data', to: '/maintenance/penyusutan/backup-status' },
])

const list = ref<any[]>([])
const isLoading = ref(false)

// ── Filter state ──
const filterJenis = ref('')
const filterStatus = ref('')
const searchInput = ref('')
const jenisOpen = ref(false)
const statusOpen = ref(false)

const jenisOptions = [
  { value: '', label: 'Semua Jenis' },
  { value: 'musnah', label: 'Musnah' },
  { value: 'permanen', label: 'Permanen' },
]

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'sukses', label: 'Sukses' },
  { value: 'gagal', label: 'Gagal' },
  { value: 'pending', label: 'Pending' },
]

const filteredList = computed(() => {
  let result = list.value
  if (filterJenis.value) {
    result = result.filter((i) => (i.isMusnah ? 'musnah' : 'permanen') === filterJenis.value)
  }
  if (filterStatus.value) {
    result = result.filter((i) => i.status === filterStatus.value)
  }
  if (searchInput.value) {
    const q = searchInput.value.toLowerCase()
    result = result.filter((i) =>
      (i.judulBerkas ?? '').toLowerCase().includes(q) ||
      (i.kodeBerkas ?? '').toLowerCase().includes(q) ||
      (i.klasifikasiText ?? '').toLowerCase().includes(q) ||
      (i.klasifikasi ?? '').toLowerCase().includes(q)
    )
  }
  return result
})

const statusLabel = (status: string) => {
  const map: Record<string, string> = { sukses: 'Sukses', gagal: 'Gagal', pending: 'Pending' }
  return map[status] ?? status
}

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    sukses: 'px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    gagal: 'px-2 py-0.5 rounded-full font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    pending: 'px-2 py-0.5 rounded-full font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  }
  return map[status] ?? 'px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const onExport = () => {
  if (filteredList.value.length === 0) { alert('Tidak ada data untuk diexport'); return }
  const headers = ['Nama Berkas', 'Kode Berkas', 'Klasifikasi', 'ID Berkas Asli', 'ID Penyusutan', 'Jenis', 'Status', 'Tanggal Backup', 'Diproses Oleh']
  const rows = filteredList.value.map((r) => [
    r.judulBerkas, r.kodeBerkas ?? '', r.klasifikasiText || r.klasifikasi || '', r.sourceBerkasId, r.sourcePenyusutanId ?? '',
    r.isMusnah ? 'Musnah' : 'Permanen', statusLabel(r.status), formatDate(r.tanggalBackup), r.diprosesOlehName ?? '',
  ])
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `backup-status-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  isLoading.value = true
  try {
    list.value = await loadBackupStatus()
  } catch (e: any) {
    console.error('Gagal memuat status backup:', e)
    list.value = []
  } finally {
    isLoading.value = false
  }
})
</script>
