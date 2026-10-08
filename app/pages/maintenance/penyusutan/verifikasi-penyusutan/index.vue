<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <Heading variant="heading6b" class="text-mobile-md">Verifikasi Penyusutan</Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <!-- Filter & Search -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
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
            class="h-10 w-[160px] px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] flex items-center justify-between"
          >
            <span class="truncate">{{ statusOptions.find(o => o.value === filterStatus)?.label ?? 'Semua Status' }}</span>
            <UIcon name="i-lucide-chevron-down" class="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" :class="{ 'rotate-180': statusOpen }" />
          </button>
          <div v-if="statusOpen" class="absolute top-full left-0 mt-1.5 z-50 min-w-[160px] bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
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
                <th class="px-3 py-3 text-center font-semibold">Pengusul</th>
                <th class="px-3 py-3 text-center font-semibold">Klasifikasi</th>
                <th class="px-3 py-3 text-center font-semibold">Jenis</th>
                <th class="px-3 py-3 text-center font-semibold">Status</th>
                <th class="px-3 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="isLoading">
                <td colspan="7" class="px-3 py-10 text-center">
                  <UIcon name="i-lucide-loader-2" class="w-6 h-6 text-primary animate-spin mx-auto" />
                </td>
              </tr>
              <tr v-else-if="filteredList.length === 0">
                <td colspan="7" class="px-3 py-10 text-center text-gray-500 dark:text-gray-400">
                  Tidak ada pengajuan untuk diverifikasi.
                </td>
              </tr>
              <tr
                v-for="item in paginatedList"
                :key="item.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                :class="rowClass(item)"
              >
                <td class="px-3 py-3">{{ item.nama_berkas }}</td>
                <td class="px-3 py-3">
                  <div class="font-medium text-gray-800 dark:text-white">{{ item.kode_berkas }}</div>
                  <div v-if="item.no_usulan" class="text-[11px] text-gray-400">{{ item.no_usulan }}</div>
                </td>
                <td class="px-3 py-3">{{ item.sekretaris }}</td>
                <td class="px-3 py-3">
                  <div class="font-medium text-gray-800 dark:text-white">{{ item.klasifikasiText || item.klasifikasi_text || item.klasifikasi || '-' }}</div>
                  <div v-if="item.klasifikasi" class="text-[11px] text-gray-400">{{ item.klasifikasi }}</div>
                </td>
                <td class="px-3 py-3">
                  <span :class="item.jenis_penyusutan === 'permanen' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'" class="px-2 py-0.5 rounded-full text-[11px] font-medium">
                    {{ item.jenis_penyusutan === 'permanen' ? 'Permanen' : 'Musnah' }}
                  </span>
                </td>
                <td class="px-3 py-3">
                  <span :class="statusBadgeClass(item.status)" class="text-[11px]">{{ statusLabel(item.status) }}</span>
                </td>
                <td class="px-3 py-3">
                  <div class="flex items-center justify-center gap-1.5">
                    <NuxtLink
                      v-if="item.status === 'selesai' || item.status === 'diterima' || item.status === 'ditolak' || hasUserApproved(item)"
                      :to="`/maintenance/penyusutan/verifikasi-penyusutan/detail/${item.id}`"
                      @click="markViewed(item)"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200 transition-colors"
                      title="Detail"
                    >
                      <UIcon name="i-lucide-eye" class="w-4 h-4" />
                    </NuxtLink>
                    <NuxtLink
                      v-if="item.status === 'diajukan' && isCurrentVerifikator(item) && canApprove"
                      :to="`/maintenance/penyusutan/verifikasi-penyusutan/tindak-lanjuti/${item.id}`"
                      @click="markViewed(item)"
                      class="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors"
                      title="Tindak Lanjuti"
                    >
                      <UIcon name="i-lucide-file-check-2" class="w-4 h-4" />
                    </NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

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

      <!-- Modal Detail / Verifikasi -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="showDetailModal = false" />
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Detail Pengajuan Penyusutan</h3>
            <button @click="showDetailModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6 space-y-4">
            <!-- Info Arsip -->
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
              <div class="flex justify-between text-sm"><span class="text-gray-500">Kode Berkas</span><span class="font-medium text-gray-800 dark:text-white">{{ detailArsip?.kode_berkas }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500">Nama Berkas</span><span class="font-medium text-gray-800 dark:text-white">{{ detailArsip?.nama_berkas }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500">Pengusul</span><span class="font-medium text-gray-800 dark:text-white">{{ detailArsip?.sekretaris }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500">Jenis Penyusutan</span><span class="font-medium text-gray-800 dark:text-white">{{ detailArsip?.jenis_penyusutan === 'permanen' ? 'Permanen' : 'Musnah' }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500">Tgl Pengajuan</span><span class="font-medium text-gray-800 dark:text-white">{{ formatDate(detailArsip?.tanggal_pengajuan) }}</span></div>
              <div class="flex justify-between text-sm"><span class="text-gray-500">Status</span><span :class="statusBadgeClass(detailArsip?.status ?? '')" class="text-[11px]">{{ statusLabel(detailArsip?.status ?? '') }}</span></div>
            </div>

            <!-- Verifikator Berjenjang -->
            <div>
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Atasan Managerial Berjenjang</h4>
              <div class="space-y-2">
                <div
                  v-for="(v, i) in detailArsip?.atasan_managerial"
                  :key="i"
                  class="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                >
                  <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded-full bg-[#457fb6] text-white text-xs flex items-center justify-center font-medium">{{ v.urutan }}</span>
                    <div>
                      <p class="text-sm font-medium text-gray-800 dark:text-white">{{ v.name }}</p>
                      <p class="text-xs text-gray-500">{{ v.jabatan }}</p>
                    </div>
                  </div>
                  <span :class="verifikatorBadgeClass(v.status)" class="text-[11px]">{{ verifikatorLabel(v.status) }}</span>
                </div>
              </div>
            </div>

            <!-- Catatan Pengusul -->
            <div v-if="detailArsip?.catatan" class="pt-2 border-t border-gray-100 dark:border-gray-700">
              <span class="text-sm text-gray-500">Catatan Pengusul:</span>
              <p class="text-sm text-gray-700 dark:text-gray-200 mt-1">{{ detailArsip.catatan }}</p>
            </div>

            <!-- Catatan Verifikasi (saat verifikasi) -->
            <div v-if="showVerifyForm" class="pt-2 border-t border-gray-100 dark:border-gray-700">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Catatan {{ verifyAction ? 'Penolakan' : 'Verifikasi' }}
                <span v-if="!verifyAction" class="text-gray-400 font-normal">(opsional)</span>
              </label>
              <textarea
                v-model="verifyCatatan"
                rows="3"
                :placeholder="verifyAction ? 'Catatan untuk penolakan...' : 'Catatan untuk persetujuan...'"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]"
              />
            </div>
          </div>

          <!-- Footer -->
          <div class="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button
              @click="showDetailModal = false"
              class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >Tutup</button>
            <template v-if="showVerifyForm">
              <button
                @click="submitVerify"
                :disabled="submitting"
                :class="verifyAction ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'"
                class="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              >
                <UIcon v-if="submitting" name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
                {{ verifyAction ? 'Setuju' : 'Tolak' }}
              </button>
            </template>
            <template v-else>
              <button
                v-if="detailArsip?.status === 'diajukan' && canApprove"
                @click="showVerifyForm = true; verifyAction = true"
                class="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
              >Setuju</button>
              <button
                v-if="detailArsip?.status === 'diajukan' && canReject"
                @click="showVerifyForm = true; verifyAction = false"
                class="px-4 py-2 text-sm font-medium rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              >Tolak</button>
            </template>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Export Column Modal -->
    <ExportColumnModal
      v-model="showExportModal"
      :columns="exportColumns"
      :total-rows="filteredList.length"
      title="Pilih Kolom Export Verifikasi Penyusutan"
      :is-exporting="isExporting"
      @confirm="handleExportConfirm"
    />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { usePenyusutan } from '~/composables/usePenyusutan'
import { usePenyusutanPermission } from '~/composables/usePenyusutanPermission'
import { useAuth } from '~/composables/useAuth'
import type { ArsipPenyusutan } from '~/types/penyusutan'

import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import ExportColumnModal from '~/components/ExportColumnModal.vue'

definePageMeta({ middleware: ['auth', 'penyusutan-access'] })

const showExportModal = ref(false)
const isExporting = ref(false)

const exportColumns = ref([
  { key: 'No', label: 'No', desc: 'Nomor urut data' },
  { key: 'nama_berkas', label: 'Nama Berkas', desc: 'Perihal / nama berkas arsip' },
  { key: 'kode_berkas', label: 'Kode Berkas', desc: 'Kode berkas arsip' },
  { key: 'no_usulan', label: 'No Usulan', desc: 'Nomor berkas usulan' },
  { key: 'sekretaris', label: 'Pengusul', desc: 'Nama pengusul' },
  { key: 'klasifikasi', label: 'Klasifikasi', desc: 'Kode klasifikasi arsip' },
  { key: 'jenis', label: 'Jenis Penyusutan', desc: 'Jenis tindakan penyusutan' },
  { key: 'status', label: 'Status', desc: 'Status persetujuan penyusutan' }
])

const { user } = useAuth()
const { rowClass, markViewed } = useViewedRows('penyusutan-verifikasi')
const { verifikasiList, loadVerifikasiList, verifyPenyusutan } = usePenyusutan()
const { canApprove, canReject } = usePenyusutanPermission()

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Penyusutan', to: '/maintenance/penyusutan/daftar-retensi-habis' },
  { label: 'Verifikasi Penyusutan', to: '/maintenance/penyusutan/verifikasi-penyusutan' },
])

const isLoading = ref(false)
const submitting = ref(false)
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

const showDetailModal = ref(false)
const detailArsip = ref<ArsipPenyusutan | null>(null)
const showVerifyForm = ref(false)
const verifyAction = ref(true)
const verifyCatatan = ref('')

const statusOptions = [
  { value: '', label: 'Semua Status' },
  { value: 'diajukan', label: 'Menunggu Persetujuan' },
  { value: 'diterima', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
]

const jenisOptions = [
  { value: '', label: 'Semua Jenis' },
  { value: 'permanen', label: 'Permanen' },
  { value: 'musnah', label: 'Musnah' },
]

const klasifikasiList = computed(() => {
  const seen = new Set<string>()
  const result: string[] = []
  for (const a of verifikasiList.value) {
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
  let result = verifikasiList.value
  if (searchInput.value) {
    const q = searchInput.value.toLowerCase()
    result = result.filter((a) =>
      (a.kode_berkas ?? '').toLowerCase().includes(q) ||
      (a.nama_berkas ?? '').toLowerCase().includes(q) ||
      (a.sekretaris ?? '').toLowerCase().includes(q) ||
      (a.no_usulan ?? '').toLowerCase().includes(q)
    )
  }
  if (filterStatus.value) {
    result = result.filter((a) => a.status === filterStatus.value)
  }
  if (filterKlasifikasi.value) {
    result = result.filter((a) => a.klasifikasi === filterKlasifikasi.value)
  }
  if (filterJenis.value) {
    result = result.filter((a) => a.jenis_penyusutan === filterJenis.value)
  }
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
  const map: Record<string, string> = { diajukan: 'Menunggu Persetujuan', diterima: 'Disetujui', ditolak: 'Ditolak', selesai: 'Selesai' }
  return map[status] ?? status
}

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
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

/** True jika user login adalah verifikator yang sedang giliran (urutan = current_verifikator_urutan). */
const isCurrentVerifikator = (item: ArsipPenyusutan) => {
  if (!item || !user.value) return false
  const userPersnum = Number(user.value.persnum)
  const currentUrutan = item.current_verifikator_urutan ?? item.currentVerifikatorUrutan ?? 1
  const level = (item.atasan_managerial ?? []).find((v) => v.urutan === currentUrutan)
  if (!level) return false
  return Number(level.persnum) === userPersnum
}

/** True jika user login sudah pernah approve pengajuan ini (status verifikator = disetujui). */
const hasUserApproved = (item: ArsipPenyusutan) => {
  if (!item || !user.value) return false
  const userPersnum = Number(user.value.persnum)
  return (item.atasan_managerial ?? []).some(
    (v) => Number(v.persnum) === userPersnum && (v.status === 'disetujui' || v.status === 'DISETUJUI')
  )
}

const onSearchInput = () => {
  clearTimeout((window as any).__penyusutanDebounce3)
  ;(window as any).__penyusutanDebounce3 = setTimeout(() => { page.value = 1 }, 400)
}

const onPageChange = (p: number) => { page.value = p }
const onLimitChange = (l: number) => { limit.value = l; page.value = 1 }

const onExport = () => {
  if (filteredList.value.length === 0) {
    useToast().add({ title: 'Tidak ada data', description: 'Tidak ada data untuk diexport', color: 'warning' })
    return
  }
  showExportModal.value = true
}

const handleExportConfirm = (selectedKeys: string[]) => {
  if (filteredList.value.length === 0 || selectedKeys.length === 0) return
  isExporting.value = true
  try {
    const data = filteredList.value.map((r: any, idx: number) => {
      const row: Record<string, any> = {}
      if (selectedKeys.includes('No')) row['No'] = idx + 1
      if (selectedKeys.includes('nama_berkas')) row['Nama Berkas'] = r.nama_berkas || '-'
      if (selectedKeys.includes('kode_berkas')) row['Kode Berkas'] = r.kode_berkas || '-'
      if (selectedKeys.includes('no_usulan')) row['No Usulan'] = r.no_usulan || '-'
      if (selectedKeys.includes('sekretaris')) row['Pengusul'] = r.sekretaris || '-'
      if (selectedKeys.includes('klasifikasi')) row['Klasifikasi'] = r.klasifikasi || '-'
      if (selectedKeys.includes('jenis')) row['Jenis Penyusutan'] = r.jenis_penyusutan || '-'
      if (selectedKeys.includes('status')) row['Status'] = statusLabel(r.status)
      return row
    })

    const worksheet = XLSX.utils.json_to_sheet(data)
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row: any) => String(row[key] ?? '').length)) + 2
    }))
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Verifikasi Penyusutan')
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    saveAs(blob, `verifikasi_penyusutan_${new Date().toISOString().slice(0, 10)}.xlsx`)

    showExportModal.value = false
    useToast().add({ title: 'Berhasil', description: `${data.length} data berhasil diexport`, color: 'success' })
  } catch (err) {
    console.error('Export verifikasi penyusutan error:', err)
    useToast().add({ title: 'Gagal export', description: 'Terjadi kesalahan saat export.', color: 'error' })
  } finally {
    isExporting.value = false
  }
}

const openDetail = (item: ArsipPenyusutan) => {
  detailArsip.value = item
  showVerifyForm.value = false
  verifyCatatan.value = ''
  showDetailModal.value = true
}

const openVerifyModal = (item: ArsipPenyusutan, disetujui: boolean) => {
  detailArsip.value = item
  showVerifyForm.value = true
  verifyAction.value = disetujui
  verifyCatatan.value = ''
  showDetailModal.value = true
}

const submitVerify = async () => {
  if (!detailArsip.value) return
  submitting.value = true
  try {
    await verifyPenyusutan(detailArsip.value.id, verifyAction.value, {
      catatan: verifyCatatan.value || undefined,
    })
    showDetailModal.value = false
    useToast().add({
      title: 'Berhasil',
      description: verifyAction.value ? 'Pengajuan disetujui.' : 'Pengajuan ditolak.',
      color: 'success',
    })
    // Reload list
    isLoading.value = true
    loadVerifikasiList().finally(() => { isLoading.value = false })
  } catch (e: any) {
    useToast().add({
      title: 'Gagal',
      description: e?.message || 'Gagal verifikasi penyusutan',
      color: 'error',
    })
  } finally {
    submitting.value = false
  }
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
  isLoading.value = true
  loadVerifikasiList().finally(() => { isLoading.value = false })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>
