<template>
  <div class="flex flex-col gap-5">
    <!-- Card 1: Informasi Usulan + Keterangan + Total Arsip -->
    <div class="order-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Usulan</h3>
        <button
          type="button"
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          @click="infoOpen = !infoOpen"
          :title="infoOpen ? 'Lipat Informasi Usulan' : 'Buka Informasi Usulan'"
          :aria-expanded="infoOpen"
        >
          <UIcon :name="infoOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4 text-gray-400" />
        </button>
      </div>
      <div v-show="infoOpen" class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ usulan.nomorUsulan }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Usulan</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ formatVerifikasiDate(usulan.tanggalUsulan) }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Status</span>
          <p class="mt-1"><span :class="verifikasiStatusBadge(usulan.status)">{{ verifikasiStatusLabel(usulan.status) }}</span></p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Pengusul (Sekretaris)</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ usulan.sekretarisName }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ usulan.arsipKode ?? '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ usulan.atasanName }}</p>
          <p v-if="usulan.totalApprovalLevels && usulan.totalApprovalLevels > 1" class="text-xs text-gray-400 mt-0.5">
            Tahap {{ usulan.currentApprovalLevel }} dari {{ usulan.totalApprovalLevels }}
          </p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Jenis</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ usulan.arsipTindakanPenyusutan ?? '-' }}</p>
        </div>
        <div v-if="usulan.tanggalRetensiAktifHabis">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ formatVerifikasiDate(usulan.tanggalRetensiAktifHabis) }}</p>
        </div>
        <div class="md:col-span-2">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Perihal Arsip</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ usulan.arsipPerihal }}</p>
        </div>
      </div>
      <div v-if="infoOpen && usulan.rejectedNote" class="mt-4">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Penolakan</span>
        <p class="text-red-600 dark:text-red-400 text-sm mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ usulan.rejectedNote }}</p>
      </div>
      <div v-if="infoOpen && usulan.verifyNote" class="mt-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Verifikasi</span>
        <p class="text-gray-700 dark:text-gray-300 text-sm mt-1 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">{{ usulan.verifyNote }}</p>
      </div>

      <!-- Keterangan -->
      <div v-if="infoOpen && usulan.keterangan" class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Keterangan</h4>
        <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
          {{ usulan.keterangan }}
        </p>
      </div>
    </div>

    <!-- Card 2: Daftar Berkas yang Akan Dipindahkan -->
    <div
      v-if="daftarArsip && daftarArsip.length > 0"
      class="order-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <button type="button" class="flex w-full items-center justify-between gap-3 text-left" @click="berkasOpen = !berkasOpen">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Daftar Berkas ({{ daftarArsip.length }})
        </h3>
        <UIcon :name="berkasOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4 text-gray-400" />
      </button>
      <div v-show="berkasOpen" class="mt-4 space-y-1.5">
        <div
          v-for="(a, idx) in daftarArsip"
          :key="idx"
          class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
        >
          <span class="text-xs font-semibold text-gray-400">{{ idx + 1 }}.</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-900 dark:text-white truncate">
              <span v-if="a.kode" class="font-mono text-xs text-gray-500">{{ a.kode }}</span>
              — {{ a.namaBerkas }}
            </p>
          </div>
          <NuxtLink
            v-if="a.id"
            :to="`/maintenance/preview-berkas/${a.id}?nomor_usulan=${usulan.nomorUsulan}&usulan_id=${usulan.id}`"
            class="inline-flex rounded-md p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30 shrink-0"
            title="Lihat detail berkas"
          >
            <UIcon name="i-lucide-eye" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Card: Daftar Atasan Verifikasi (Berjenjang) — sisi Atasan Managerial Sekretaris -->
    <div
      v-if="usulan.approvalLevels && usulan.approvalLevels.length > 0"
      class="order-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <button type="button" class="flex w-full items-center justify-between gap-3 text-left" @click="atasanOpen = !atasanOpen">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Daftar Atasan Verifikasi</h3>
        <UIcon :name="atasanOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4 text-gray-400" />
      </button>
      <div v-show="atasanOpen" class="mt-4 space-y-2">
        <div
          v-for="level in usulan.approvalLevels"
          :key="level.id"
          class="flex items-center gap-3 p-3 rounded-lg border"
          :class="levelStatusClass(level.status)"
        >
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">
            {{ level.urutan }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ level.atasanName }}</p>
            <p v-if="level.atasanPositionText" class="text-xs text-gray-500 dark:text-gray-400">{{ level.atasanPositionText }}</p>
          </div>
          <span :class="levelBadgeClass(level.status)" class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
            {{ levelStatusLabel(level.status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { VerifikasiUsulanItem } from '~/types/verifikasi-usulan';
import {
  verifikasiStatusBadge,
  verifikasiStatusLabel,
  formatVerifikasiDate,
} from '~/utils/verifikasi-status';

const props = defineProps<{
  usulan: VerifikasiUsulanItem;
  daftarArsip?: any[];
}>();

const infoOpen = ref(true);
const atasanOpen = ref(true);
const berkasOpen = ref(true);

const levelStatusClass = (status: string): string => {
  if (status === 'DISETUJUI') return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  if (status === 'DITOLAK') return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
};

const levelBadgeClass = (status: string): string => {
  if (status === 'DISETUJUI') return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
  if (status === 'DITOLAK') return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
  return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
};

const levelStatusLabel = (status: string): string => {
  if (status === 'DISETUJUI') return 'Disetujui';
  if (status === 'DITOLAK') return 'Ditolak';
  return 'Menunggu';
};
</script>
