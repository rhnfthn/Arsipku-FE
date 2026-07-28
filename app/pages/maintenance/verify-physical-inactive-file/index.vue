<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader title="Verifikasi Berkas Fisik" subtitle="Physical File Verification — Unit Tata Naskah" :items="items" />
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400">Menunggu Verifikasi</p>
        <p class="text-2xl font-bold mt-1 text-yellow-600 dark:text-yellow-400">{{ summary?.menungguBerkas ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400">Berkas Sesuai</p>
        <p class="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{{ summary?.berkasSesuai ?? 0 }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <p class="text-xs text-gray-500 dark:text-gray-400">Arsip Diterima</p>
        <p class="text-2xl font-bold mt-1 text-[#457fb6]">{{ summary?.diterima ?? 0 }}</p>
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
          <select v-model="filter.status" class="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" @change="reload">
            <option value="">Semua</option>
            <option value="DIKIRIM">Dikirim (Menunggu Verifikasi Berkas)</option>
            <option value="BERKAS_FISIK_SESUAI">Berkas Sesuai</option>
            <option value="BERKAS_FISIK_TIDAK_SESUAI">Berkas Tidak Sesuai</option>
            <option value="DISETUJUI_PERSETUJUAN_TERAKHIR_TU">Disetujui Final TU</option>
            <option value="ARSIP_INAKTIF_DITERIMA">Arsip Diterima</option>
            <option value="PENATAAN_ARSIP_INAKTIF">Penataan</option>
            <option value="SELESAI">Selesai</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Pencarian</label>
          <div class="relative">
            <UIcon name="i-heroicons-magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input v-model="filter.search" type="text" placeholder="Cari nomor, perihal..." class="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6]" @keydown.enter="reload" />
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="reload" class="flex-1 h-10 px-4 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors">Tampilkan</button>
          <button @click="resetFilter" class="flex-1 h-10 px-4 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Reset</button>
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
            <tr v-else-if="list.length === 0"><td colspan="6" class="px-4 py-10 text-center text-sm text-gray-400">Tidak ada usulan</td></tr>
            <template v-else>
              <tr v-for="(row, idx) in list" :key="row.id" class="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                <td class="px-4 py-3 text-gray-500">{{ idx + 1 + ((meta?.page ?? 1) - 1) * (meta?.limit ?? 10) }}</td>
                <td class="px-4 py-3 font-medium whitespace-nowrap text-gray-700 dark:text-gray-200">{{ row.nomorUsulan }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate" :title="row.arsipPerihal">{{ row.arsipPerihal }}</td>
                <td class="px-4 py-3 text-gray-700 dark:text-gray-200">{{ row.sekretarisName }}</td>
                <td class="px-4 py-3"><span :class="statusBadge(row.status)">{{ statusLabel(row.status) }}</span></td>
                <td class="px-4 py-3 text-center">
                  <NuxtLink :to="`/maintenance/transfer-inactive-file/${row.id}`" class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors whitespace-nowrap">
                    <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" /> Verifikasi
                  </NuxtLink>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div v-if="meta && meta.total > 0" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-500">Menampilkan {{ (meta.page - 1) * meta.limit + 1 }}–{{ Math.min(meta.page * meta.limit, meta.total) }} dari {{ meta.total }}</div>
        <div v-if="meta.totalPages > 1" class="flex gap-1">
          <button :disabled="meta.page <= 1" @click="goPage(meta.page - 1)" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700">Prev</button>
          <button :disabled="meta.page >= meta.totalPages" @click="goPage(meta.page + 1)" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700">Next</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useTransferInactiveFile } from '~/composables/useTransferInactiveFile';
import type { TransferFilter, TransferInactiveFileStatus } from '~/types/transfer-inactive-file';

definePageMeta({ middleware: ['auth'] });

const { fetchList, fetchSummary, list, summary, loading, meta } = useTransferInactiveFile();

const items = [
  { label: 'Beranda', to: '/' },
  { label: 'Verifikasi Berkas Fisik', to: '/maintenance/verify-physical-inactive-file' },
];

const filter = reactive<TransferFilter>({ page: 1, limit: 10, status: undefined, search: '', sortBy: 'createdAt', sortOrder: 'DESC' });

const statusBadge = (s: TransferInactiveFileStatus) => {
  const m: Record<string, string> = {
    DIKIRIM: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    BERKAS_FISIK_SESUAI: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    BERKAS_FISIK_TIDAK_SESUAI: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    ARSIP_INAKTIF_DITERIMA: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    PENATAAN_ARSIP_INAKTIF: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    SELESAI: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  };
  return `px-2 py-0.5 text-xs rounded-full font-medium ${m[s] || 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`;
};

const statusLabel = (s: TransferInactiveFileStatus) => {
  const m: Record<string, string> = { DIKIRIM: 'Menunggu Verifikasi Berkas', BERKAS_FISIK_SESUAI: 'Berkas Sesuai', BERKAS_FISIK_TIDAK_SESUAI: 'Berkas Tidak Sesuai', ARSIP_INAKTIF_DITERIMA: 'Arsip Diterima', PENATAAN_ARSIP_INAKTIF: 'Penataan', SELESAI: 'Selesai' };
  return m[s] || s;
};

const loadData = async () => { try { await Promise.all([fetchList({ ...filter }), fetchSummary()]); } catch (e) { console.error('Gagal:', e); } };
const reload = () => { filter.page = 1; loadData(); };
const resetFilter = () => { filter.status = undefined; filter.search = ''; filter.page = 1; loadData(); };
const goPage = (p: number) => { filter.page = p; loadData(); };

onMounted(() => loadData());
</script>