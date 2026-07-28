<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        title="Persetujuan Pemindahan Arsip Aktif ke Inaktif"
        subtitle="Approval Transfer of Active File to Inactive File"
        :items="items"
      />
    </div>

    <!-- Tab Navigation -->
    <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4 overflow-hidden">
      <div class="flex border-b border-gray-200 dark:border-gray-700">
        <button
          v-if="showUnitKerjaTab"
          @click="activeTab = 'unit-kerja'"
          :class="[
            'px-5 py-3 text-sm font-medium transition-colors border-b-2',
            activeTab === 'unit-kerja'
              ? 'border-[#457fb6] text-[#457fb6] bg-[#457fb6]/5'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
          ]"
        >
          <UIcon name="i-lucide-file-check" class="w-4 h-4 inline mr-1.5" />
          Unit Kerja (Atasan Managerial)
        </button>
        <button
          v-if="showUnitTataNaskahTab"
          @click="activeTab = 'unit-tata-naskah'"
          :class="[
            'px-5 py-3 text-sm font-medium transition-colors border-b-2',
            activeTab === 'unit-tata-naskah'
              ? 'border-[#457fb6] text-[#457fb6] bg-[#457fb6]/5'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
          ]"
        >
          <UIcon name="i-lucide-shield-check" class="w-4 h-4 inline mr-1.5" />
          Unit Tata Naskah (Atasan TU)
        </button>
      </div>
    </div>

    <!-- ─── Tab Unit Kerja: Verifikasi & Persetujuan Atasan ─────────── -->
    <div v-show="activeTab === 'unit-kerja'">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs text-gray-500 dark:text-gray-400">Menunggu Verifikasi</p>
          <p class="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">{{ summary?.menungguVerifikasi ?? 0 }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs text-gray-500 dark:text-gray-400">Menunggu Verifikasi Terakhir</p>
          <p class="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{{ summary?.menungguFinal ?? 0 }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs text-gray-500 dark:text-gray-400">Disetujui</p>
          <p class="text-2xl font-bold mt-1 text-[#457fb6]">{{ summary?.disetujui ?? 0 }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs text-gray-500 dark:text-gray-400">Dikirim</p>
          <p class="text-2xl font-bold mt-1 text-purple-600 dark:text-purple-400">{{ summary?.dikirim ?? 0 }}</p>
        </div>
      </div>

      <!-- Filter -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
            <select v-model="unitKerjaFilter.status" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" @change="reloadUnitKerja">
              <option value="">Semua</option>
              <option value="MENUNGGU_VERIFIKASI_ATASAN">Menunggu Verifikasi</option>
              <option value="MENUNGGU_VERIFIKASI_TERAKHIR">Menunggu Verifikasi Terakhir</option>
              <option value="DISETUJUI_ATASAN">Disetujui Atasan</option>
              <option value="DISETUJUI_VERIFIKASI_TERAKHIR">Disetujui Verifikasi Terakhir</option>
              <option value="DITOLAK_ATASAN">Ditolak Atasan</option>
              <option value="DIKIRIM">Dikirim</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pencarian</label>
            <div class="relative">
              <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input v-model="unitKerjaFilter.search" type="text" placeholder="Cari nomor, perihal..." class="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" @keydown.enter="reloadUnitKerja" />
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="reloadUnitKerja" class="flex-1 h-10 px-4 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors">Tampilkan</button>
            <button @click="resetUnitKerjaFilter" class="flex-1 h-10 px-4 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Reset</button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead class="bg-[#457fb6] text-white text-left">
              <tr>
                <th class="px-4 py-3 font-semibold">No</th>
                <th class="px-4 py-3 font-semibold">Nomor Usulan</th>
                <th class="px-4 py-3 font-semibold">Perihal Arsip</th>
                <th class="px-4 py-3 font-semibold">Pengusul</th>
                <th class="px-4 py-3 font-semibold">Status</th>
                <th class="px-4 py-3 font-semibold">Tanggal</th>
                <th class="px-4 py-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading"><td colspan="7" class="px-4 py-6"><div class="space-y-4 animate-pulse"><div v-for="n in 5" :key="n" class="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-700" /></div></td></tr>
              <tr v-else-if="unitKerjaList.length === 0"><td colspan="7" class="px-4 py-10 text-center text-sm text-gray-400">Tidak ada usulan</td></tr>
              <template v-else>
                <tr v-for="(row, idx) in unitKerjaList" :key="row.id" class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                  <td class="px-4 py-3 text-gray-500">{{ idx + 1 + ((unitKerjaMeta?.page ?? 1) - 1) * (unitKerjaMeta?.limit ?? 10) }}</td>
                  <td class="px-4 py-3 font-medium whitespace-nowrap text-gray-700 dark:text-gray-200">{{ row.nomorUsulan }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="row.arsipPerihal">{{ row.arsipPerihal }}</td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-200">{{ row.sekretarisName }}</td>
                  <td class="px-4 py-3"><span :class="statusBadge(row.status)">{{ statusLabel(row.status) }}</span></td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{{ formatDate(row.tanggalUsulan) }}</td>
                  <td class="px-4 py-3 text-center">
                    <NuxtLink :to="`/maintenance/transfer-active-to-inactive/${row.id}`" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap">
                      <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" /> Verifikasi
                    </NuxtLink>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div v-if="unitKerjaMeta && unitKerjaMeta.total > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500">Menampilkan {{ (unitKerjaMeta.page - 1) * unitKerjaMeta.limit + 1 }}–{{ Math.min(unitKerjaMeta.page * unitKerjaMeta.limit, unitKerjaMeta.total) }} dari {{ unitKerjaMeta.total }}</div>
          <div v-if="unitKerjaMeta.totalPages > 1" class="flex gap-1">
            <button :disabled="unitKerjaMeta.page <= 1" @click="goUnitKerjaPage(unitKerjaMeta.page - 1)" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700">Prev</button>
            <button :disabled="unitKerjaMeta.page >= unitKerjaMeta.totalPages" @click="goUnitKerjaPage(unitKerjaMeta.page + 1)" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700">Next</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Tab Unit Tata Naskah: Persetujuan Penerimaan Atasan TU ──── -->
    <div v-show="activeTab === 'unit-tata-naskah'">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs text-gray-500 dark:text-gray-400">Menunggu Persetujuan</p>
          <p class="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">{{ summary?.menungguTU ?? 0 }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs text-gray-500 dark:text-gray-400">Menunggu Persetujuan Terakhir</p>
          <p class="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{{ summary?.menungguFinalTU ?? 0 }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs text-gray-500 dark:text-gray-400">Disetujui</p>
          <p class="text-2xl font-bold mt-1 text-[#457fb6]">{{ summary?.disetujuiTU ?? 0 }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <p class="text-xs text-gray-500 dark:text-gray-400">Selesai</p>
          <p class="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{{ summary?.selesai ?? 0 }}</p>
        </div>
      </div>

      <!-- Filter -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
            <select v-model="unitTataNaskahFilter.status" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" @change="reloadUnitTataNaskah">
              <option value="">Semua</option>
              <option value="BERKAS_FISIK_SESUAI">Berkas Sesuai (Menunggu Persetujuan TU)</option>
              <option value="DISETUJUI_PERSETUJUAN_TU">Disetujui TU (Menunggu Persetujuan Terakhir)</option>
              <option value="DISETUJUI_PERSETUJUAN_TERAKHIR_TU">Disetujui Final TU</option>
              <option value="DITOLAK_PERSETUJUAN_TU">Ditolak TU</option>
              <option value="DITOLAK_PERSETUJUAN_TERAKHIR_TU">Ditolak Final TU</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pencarian</label>
            <div class="relative">
              <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input v-model="unitTataNaskahFilter.search" type="text" placeholder="Cari nomor, perihal..." class="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" @keydown.enter="reloadUnitTataNaskah" />
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="reloadUnitTataNaskah" class="flex-1 h-10 px-4 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors">Tampilkan</button>
            <button @click="resetUnitTataNaskahFilter" class="flex-1 h-10 px-4 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Reset</button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead class="bg-[#457fb6] text-white text-left">
              <tr>
                <th class="px-4 py-3 font-semibold">No</th>
                <th class="px-4 py-3 font-semibold">Nomor Usulan</th>
                <th class="px-4 py-3 font-semibold">Perihal Arsip</th>
                <th class="px-4 py-3 font-semibold">Pengusul</th>
                <th class="px-4 py-3 font-semibold">Status</th>
                <th class="px-4 py-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading"><td colspan="6" class="px-4 py-6"><div class="space-y-4 animate-pulse"><div v-for="n in 5" :key="n" class="h-12 w-full rounded-lg bg-gray-200 dark:bg-gray-700" /></div></td></tr>
              <tr v-else-if="unitTataNaskahList.length === 0"><td colspan="6" class="px-4 py-10 text-center text-sm text-gray-400">Tidak ada usulan</td></tr>
              <template v-else>
                <tr v-for="(row, idx) in unitTataNaskahList" :key="row.id" class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                  <td class="px-4 py-3 text-gray-500">{{ idx + 1 + ((unitTataNaskahMeta?.page ?? 1) - 1) * (unitTataNaskahMeta?.limit ?? 10) }}</td>
                  <td class="px-4 py-3 font-medium whitespace-nowrap text-gray-700 dark:text-gray-200">{{ row.nomorUsulan }}</td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="row.arsipPerihal">{{ row.arsipPerihal }}</td>
                  <td class="px-4 py-3 text-gray-700 dark:text-gray-200">{{ row.sekretarisName }}</td>
                  <td class="px-4 py-3"><span :class="statusBadge(row.status)">{{ statusLabel(row.status) }}</span></td>
                  <td class="px-4 py-3 text-center">
                    <NuxtLink :to="`/maintenance/transfer-active-to-inactive/${row.id}`" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap">
                      <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" /> Verifikasi
                    </NuxtLink>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div v-if="unitTataNaskahMeta && unitTataNaskahMeta.total > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500">Menampilkan {{ (unitTataNaskahMeta.page - 1) * unitTataNaskahMeta.limit + 1 }}–{{ Math.min(unitTataNaskahMeta.page * unitTataNaskahMeta.limit, unitTataNaskahMeta.total) }} dari {{ unitTataNaskahMeta.total }}</div>
          <div v-if="unitTataNaskahMeta.totalPages > 1" class="flex gap-1">
            <button :disabled="unitTataNaskahMeta.page <= 1" @click="goUnitTataNaskahPage(unitTataNaskahMeta.page - 1)" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700">Prev</button>
            <button :disabled="unitTataNaskahMeta.page >= unitTataNaskahMeta.totalPages" @click="goUnitTataNaskahPage(unitTataNaskahMeta.page + 1)" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700">Next</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useTransferActiveToInactive } from '~/composables/useTransferActiveToInactive';
import { useAuth } from '~/composables/useAuth';
import type { TransferFilter, TransferActiveToInactiveStatus } from '~/types/transfer-active-to-inactive';

definePageMeta({ middleware: ['auth'] });

const { fetchList, fetchSummary, loading } = useTransferActiveToInactive();
const { user, isSuperadmin, isAdmin } = useAuth();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/maintenance/approval-transfer-active-to-inactive-file' },
  { label: 'Persetujuan Pemindahan Arsip Aktif ke Inaktif', to: '/maintenance/approval-transfer-active-to-inactive-file' },
];

// ─── Role-based tab visibility ────────────────────────────────────────
// Atasan Managerial Unit Kerja (ADMIN) → tab Unit Kerja.
// Atasan Managerial TU (SUPERADMIN / persnum 10010123) → tab Unit Tata Naskah.
// Atasan Managerial TU via persnum 10010123 (EVP Corporate Secretary).
const isAtasanManagerialTu = computed(
  () => isSuperadmin.value || Number(user.value?.persnum) === 10010123,
);
const showUnitKerjaTab = computed(() => isAdmin.value || isSuperadmin.value);
const showUnitTataNaskahTab = computed(() => isAtasanManagerialTu.value);

const activeTab = ref<'unit-kerja' | 'unit-tata-naskah'>('unit-kerja');

onMounted(() => {
  if (!showUnitKerjaTab.value && showUnitTataNaskahTab.value) activeTab.value = 'unit-tata-naskah';
  else if (showUnitKerjaTab.value && !showUnitTataNaskahTab.value) activeTab.value = 'unit-kerja';
});

// ─── Shared state ─────────────────────────────────────────────────────
const summary = ref<any>(null);
const unitKerjaList = ref<any[]>([]);
const unitTataNaskahList = ref<any[]>([]);
const unitKerjaMeta = ref<any>(null);
const unitTataNaskahMeta = ref<any>(null);

const unitKerjaFilter = reactive<TransferFilter>({ page: 1, limit: 10, status: undefined, search: '', sortBy: 'createdAt', sortOrder: 'DESC' });
const unitTataNaskahFilter = reactive<TransferFilter>({ page: 1, limit: 10, status: undefined, search: '', sortBy: 'createdAt', sortOrder: 'DESC' });

const statusBadge = (s: TransferActiveToInactiveStatus) => {
  const m: Record<string, string> = {
    MENUNGGU_VERIFIKASI_ATASAN: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DITOLAK_ATASAN: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_ATASAN: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    DIKIRIM: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    BERKAS_FISIK_SESUAI: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    BERKAS_FISIK_TIDAK_SESUAI: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_PERSETUJUAN_TU: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    DITOLAK_PERSETUJUAN_TU: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    ARSIP_INAKTIF_DITERIMA: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    SELESAI: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  };
  return `px-2 py-0.5 text-xs rounded-full font-medium ${m[s] || 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`;
};

const statusLabel = (s: TransferActiveToInactiveStatus) => {
  const m: Record<string, string> = {
    MENUNGGU_VERIFIKASI_ATASAN: 'Menunggu Verifikasi', DITOLAK_ATASAN: 'Ditolak',
    DISETUJUI_ATASAN: 'Disetujui — Menunggu Verifikasi Terakhir', MENUNGGU_VERIFIKASI_TERAKHIR: 'Menunggu Verifikasi Terakhir',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'Disetujui Verifikasi Terakhir', DIKIRIM: 'Dikirim',
    BERKAS_FISIK_SESUAI: 'Menunggu Persetujuan TU', DISETUJUI_PERSETUJUAN_TU: 'Disetujui TU',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Disetujui Final TU', DITOLAK_PERSETUJUAN_TU: 'Ditolak TU',
    DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'Ditolak Final TU', ARSIP_INAKTIF_DITERIMA: 'Arsip Diterima',
    SELESAI: 'Selesai',
  };
  return m[s] || s;
};

const formatDate = (d: string | Date) => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ─── Data loaders ─────────────────────────────────────────────────────
const loadUnitKerja = async () => {
  try {
    const res: any = await fetchList({ ...unitKerjaFilter });
    unitKerjaList.value = res?.data ?? [];
    unitKerjaMeta.value = res?.meta ?? null;
  } catch (e) { console.error('Gagal memuat usulan unit kerja:', e); }
};

const loadUnitTataNaskah = async () => {
  try {
    const res: any = await fetchList({ ...unitTataNaskahFilter });
    unitTataNaskahList.value = res?.data ?? [];
    unitTataNaskahMeta.value = res?.meta ?? null;
  } catch (e) { console.error('Gagal memuat usulan unit tata naskah:', e); }
};

const loadSummary = async () => {
  try {
    const res: any = await fetchSummary();
    summary.value = res;
  } catch (e) { console.error('Gagal memuat ringkasan:', e); }
};

const reloadUnitKerja = () => { unitKerjaFilter.page = 1; loadUnitKerja(); };
const resetUnitKerjaFilter = () => { unitKerjaFilter.status = undefined; unitKerjaFilter.search = ''; unitKerjaFilter.page = 1; loadUnitKerja(); };
const goUnitKerjaPage = (p: number) => { unitKerjaFilter.page = p; loadUnitKerja(); };

const reloadUnitTataNaskah = () => { unitTataNaskahFilter.page = 1; loadUnitTataNaskah(); };
const resetUnitTataNaskahFilter = () => { unitTataNaskahFilter.status = undefined; unitTataNaskahFilter.search = ''; unitTataNaskahFilter.page = 1; loadUnitTataNaskah(); };
const goUnitTataNaskahPage = (p: number) => { unitTataNaskahFilter.page = p; loadUnitTataNaskah(); };

watch(activeTab, (tab) => {
  if (tab === 'unit-kerja' && unitKerjaList.value.length === 0) loadUnitKerja();
  if (tab === 'unit-tata-naskah' && unitTataNaskahList.value.length === 0) loadUnitTataNaskah();
});

onMounted(() => {
  loadSummary();
  if (showUnitKerjaTab.value) loadUnitKerja();
  if (showUnitTataNaskahTab.value) loadUnitTataNaskah();
});
</script>