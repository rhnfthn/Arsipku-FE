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
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-primary dark:bg-primary-700 text-white">
              <tr>
                <th class="px-3 py-3 text-left font-semibold">Nama Berkas</th>
                <th class="px-3 py-3 text-left font-semibold">Kode Berkas / No. Usulan</th>
                <th class="px-3 py-3 text-left font-semibold">Klasifikasi</th>
                <th class="px-3 py-3 text-left font-semibold">Lokasi</th>
                <th class="px-3 py-3 text-left font-semibold">Status</th>
                <th class="px-3 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="isLoading">
                <td colspan="6" class="px-3 py-10 text-center">
                  <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
                </td>
              </tr>
              <tr v-else-if="list.length === 0">
                <td colspan="6" class="px-3 py-10 text-center text-gray-500 dark:text-gray-400">
                  Belum ada arsip untuk ditata.
                </td>
              </tr>
              <tr v-for="item in list" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-3 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="item.arsipPerihal">{{ item.arsipPerihal }}</td>
                <td class="px-3 py-3 whitespace-nowrap">
                  <div class="font-medium text-gray-800 dark:text-white">{{ item.arsipKode ?? '-' }}</div>
                  <div class="text-[11px] text-gray-400">{{ item.nomorUsulan }}</div>
                </td>
                <td class="px-3 py-3 text-gray-600 dark:text-gray-300">{{ item.arsipKlasifikasi ?? '-' }}</td>
                <td class="px-3 py-3 text-gray-600 dark:text-gray-300">{{ item.lokasiPenataan || '-' }}</td>
                <td class="px-3 py-3">
                  <span :class="statusBadgeClass(item.status)" class="text-[11px]">{{ statusLabel(item.status) }}</span>
                </td>
                <td class="px-3 py-3 text-center">
                  <div class="flex items-center justify-center gap-1.5">
                    <NuxtLink
                      v-if="item.status !== 'ARSIP_INAKTIF_DITERIMA'"
                      :to="`/maintenance/penataan-arsip-inaktif/${item.id}`"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary hover:bg-primary-800 text-white transition-colors"
                      title="Detail"
                    >
                      <UIcon name="i-lucide-eye" class="w-4 h-4" />
                    </NuxtLink>
                    <NuxtLink
                      v-if="item.status === 'ARSIP_INAKTIF_DITERIMA'"
                      :to="`/maintenance/penataan-arsip-inaktif/${item.id}?mode=penataan`"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary hover:bg-primary-800 text-white transition-colors"
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
import type { TuUsulanItem } from '~/types/tu-verifikasi'

definePageMeta({ middleware: ['auth'] })

const { fetchPenataanList } = useTuVerifikasi()
const { apiGet } = useApi()
const { getKlasifikasiList } = useKlasifikasi()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penataan Arsip Inaktif', to: '/maintenance/penataan-arsip-inaktif' },
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
const pageSizeRef = ref<HTMLElement | null>(null)
const statusOpen = ref(false)
const statusRef = ref<HTMLElement | null>(null)
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
  { value: 'ARSIP_INAKTIF_DITERIMA', label: 'Diterima' },
  { value: 'SELESAI', label: 'Selesai' },
];

const onClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  const els = document.querySelectorAll('[data-custom-dropdown]')
  for (const el of Array.from(els)) {
    if (el.contains(target)) return
  }
  pageSizeOpen.value = false
  statusOpen.value = false
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

const statusLabel = (s: string) => {
  if (s === 'SELESAI') return 'Selesai'
  return 'Diterima'
}

const statusBadgeClass = (s: string) => {
  if (s === 'SELESAI') return 'px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
  return 'px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
}

// ─── Export Excel dengan Pemilihan Kolom ──────────────────────────────────────
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExportColumnModal from '~/components/ExportColumnModal.vue';

const showExportModal = ref(false);
const isExporting = ref(false);

const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'namaBerkas', label: 'Nama Berkas', desc: 'Perihal arsip berkas' },
  { key: 'kodeBerkas', label: 'Kode Berkas', desc: 'Kode berkas arsip' },
  { key: 'nomorUsulan', label: 'No. Usulan', desc: 'Nomor usulan pemindahan' },
  { key: 'klasifikasi', label: 'Klasifikasi', desc: 'Kode klasifikasi arsip' },
  { key: 'lokasi', label: 'Lokasi', desc: 'Lokasi penataan arsip' },
  { key: 'status', label: 'Status', desc: 'Status penataan arsip' }
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
        klasifikasi: filterKlasifikasi.value || undefined,
        page: 1,
        limit: total.value
      });
      const payload = res?.data ?? res;
      if (payload?.data && Array.isArray(payload.data)) {
        allRows = payload.data;
      }
    }

    const data = allRows.map((r: any, idx: number) => {
      const row: Record<string, any> = {};
      if (selectedKeys.includes('No')) row['No'] = idx + 1;
      if (selectedKeys.includes('namaBerkas')) row['Nama Berkas'] = r.arsipPerihal || '-';
      if (selectedKeys.includes('kodeBerkas')) row['Kode Berkas'] = r.arsipKode || '-';
      if (selectedKeys.includes('nomorUsulan')) row['No. Usulan'] = r.nomorUsulan || '-';
      if (selectedKeys.includes('klasifikasi')) row['Klasifikasi'] = r.arsipKlasifikasi || '-';
      if (selectedKeys.includes('lokasi')) row['Lokasi'] = r.lokasiPenataan || '-';
      if (selectedKeys.includes('status')) row['Status'] = statusLabel(r.status);
      return row;
    });

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
})
</script>