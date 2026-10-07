<template>
  <div class="space-y-5">
    <!-- Card 1: Informasi Usulan + Keterangan + Total Arsip + File Rincian -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left mb-4"
        :class="collapsible ? 'cursor-pointer' : 'cursor-default'"
        :aria-expanded="collapsible ? infoOpen : undefined"
        @click="collapsible && (infoOpen = !infoOpen)"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Usulan</h3>
        <div class="flex items-center gap-3">
          <span
            v-if="showHeaderStatus"
            :class="statusBadgeClass(transfer.status)"
          >{{ statusLabel(transfer.status) }}</span>
          <UIcon
            v-if="collapsible"
            :name="infoOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            class="h-4 w-4 text-gray-400"
          />
        </div>
      </button>
      <div v-show="!collapsible || infoOpen">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.nomorUsulan }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Usulan</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(transfer.tanggalUsulan) }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Status</span>
          <div class="mt-1">
            <span :class="statusBadgeClass(transfer.status)">{{ statusLabel(transfer.status) }}</span>
          </div>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Status BAC</span>
          <p class="text-gray-900 dark:text-white font-medium">
            {{ transfer.bacSignedAt ? 'Ditandatangani' : transfer.bacPihakPertamaPersnum ? 'Menunggu Tanda Tangan' : 'Belum Ditandatangani' }}
          </p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Pengusul (Sekretaris)</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.sekretarisName }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipKode ?? '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipKlasifikasi ?? '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
          <p class="text-gray-900 dark:text-white font-medium">
            {{ transfer.atasanName }}<span v-if="transfer.atasanPositionText" class="font-normal text-gray-500 dark:text-gray-400"> - {{ transfer.atasanPositionText }}</span>
          </p>
          <p v-if="transfer.totalApprovalLevels && transfer.totalApprovalLevels > 1" class="text-xs text-gray-400 mt-0.5">
            Tahap {{ transfer.currentApprovalLevel }} dari {{ transfer.totalApprovalLevels }}
          </p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Jenis</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipTindakanPenyusutan ?? '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(transfer.tanggalRetensiAktifHabis) }}</p>
        </div>
        <div class="md:col-span-2">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Perihal Arsip</span>
          <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipPerihal }}</p>
        </div>
        </div>
        <div v-if="transfer.rejectedNote" class="mt-4">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Penolakan</span>
          <p class="text-red-600 dark:text-red-400 text-sm mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ transfer.rejectedNote }}</p>
        </div>
        <div v-if="transfer.verifyNote" class="mt-2">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Verifikasi</span>
          <p class="text-gray-700 dark:text-gray-300 text-sm mt-1 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">{{ transfer.verifyNote }}</p>
        </div>

        <!-- Keterangan -->
        <div v-if="transfer.keterangan" class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Keterangan</h4>
          <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg italic">
            {{ transfer.keterangan }}
          </p>
        </div>
      </div>
    </div>

    <!-- Card 2: Daftar Berkas (format item-level, seragam dengan halaman atasan managerial) -->
    <div
      v-if="berkasRows.length > 0"
      class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex flex-col gap-3 px-5 pb-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Daftar Berkas ({{ berkasRows.length }})
        </h3>
        <div class="flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            @click="printDaftarBerkas"
            class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300 dark:hover:text-blue-300"
            title="Print Daftar Berkas"
            aria-label="Print Daftar Berkas"
          >
            <UIcon name="i-lucide-printer" class="h-4 w-4" />
          </button>
          <button
            type="button"
            @click="berkasOpen = !berkasOpen"
            class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300 dark:hover:text-blue-300"
            :title="berkasOpen ? 'Lipat Daftar Berkas' : 'Buka Daftar Berkas'"
            :aria-expanded="berkasOpen"
          >
            <UIcon :name="berkasOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div v-show="!collapsible || berkasOpen" id="daftar-berkas-print" class="overflow-x-auto">
        <table class="w-full min-w-[1120px] border-collapse text-xs">
          <thead>
            <tr class="bg-[#457fb6] text-white">
              <th class="border border-[#457fb6] px-3 py-3 text-center font-semibold whitespace-nowrap">Nomor Berkas</th>
              <th class="border border-[#457fb6] px-3 py-3 text-center font-semibold"><span class="block">Kode</span><span class="block">Klasifikasi</span></th>
              <th class="border border-[#457fb6] px-3 py-3 text-center font-semibold min-w-[280px]"><span class="block">Uraian Informasi</span><span class="block">Isi Berkas</span></th>
              <th class="border border-[#457fb6] px-3 py-3 text-center font-semibold whitespace-nowrap">Tanggal</th>
              <th class="border border-[#457fb6] px-3 py-3 text-center font-semibold whitespace-nowrap">Jumlah</th>
              <th class="border border-[#457fb6] px-3 py-3 text-center font-semibold"><span class="block">Lokasi</span><span class="block">Simpan</span></th>
              <th class="border border-[#457fb6] px-3 py-3 text-center font-semibold"><span class="block">Klasifikasi</span><span class="block">Keamanan</span></th>
              <th class="print-action border border-[#457fb6] px-3 py-3 text-center font-semibold whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in berkasRows" :key="row.id ?? idx" class="odd:bg-white even:bg-gray-50/70 dark:odd:bg-gray-800 dark:even:bg-gray-700/30">
              <td class="border-b border-gray-200 px-3 py-3 font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.kode ?? '-' }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.kodeKlasifikasi ?? '-' }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-gray-700 whitespace-normal dark:border-gray-700 dark:text-gray-200">{{ row.uraianInformasi ?? row.namaBerkas ?? row.perihal ?? '-' }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-gray-600 whitespace-nowrap dark:border-gray-700 dark:text-gray-300">{{ formatDate(row.tanggal) }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.jumlah ?? row.jumlahBerkas ?? '-' }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.lokasiSimpan ?? '-' }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.klasifikasiKeamanan ?? '-' }}</td>
              <td class="print-action border-b border-gray-200 px-3 py-3 text-center dark:border-gray-700">
                <NuxtLink
                  v-if="row.id"
                  :to="`/maintenance/preview-berkas/${row.id}?nomor_usulan=${transfer.nomorUsulan}&usulan_id=${transfer.id}&from=${previewFrom}`"
                  class="inline-flex p-2 text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
                  title="Buka detail berkas"
                >
                  <UIcon name="i-lucide-eye" class="w-4 h-4" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Daftar Isi Berkas -->
    <div
      v-if="showDaftarIsiCard"
      class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Daftar Isi Berkas ({{ daftarIsiRows.length }})
        </h3>
        <div class="flex items-center gap-1">
          <button
            type="button"
            @click="printDaftarIsi"
            class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
            title="Print Daftar Isi Berkas"
            aria-label="Print Daftar Isi Berkas"
          >
            <UIcon name="i-lucide-printer" class="h-4 w-4" />
          </button>
          <button
            type="button"
            @click="daftarIsiOpen = !daftarIsiOpen"
            class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
            :title="daftarIsiOpen ? 'Lipat Daftar Isi Berkas' : 'Buka Daftar Isi Berkas'"
            :aria-expanded="daftarIsiOpen"
          >
            <UIcon :name="daftarIsiOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div v-show="!collapsible || daftarIsiOpen" id="daftar-isi-print" class="overflow-x-auto">
        <table class="w-full min-w-[900px] border-collapse text-xs">
          <thead>
            <tr class="bg-[#457fb6] text-white">
              <th class="border border-[#457fb6] px-3 py-3 text-left font-semibold whitespace-nowrap">Nomor &amp; Tanggal</th>
              <th class="border border-[#457fb6] px-3 py-3 text-center font-semibold">Kode Klasifikasi</th>
              <th class="border border-[#457fb6] px-3 py-3 text-left font-semibold min-w-[280px]">Uraian Informasi Isi Berkas</th>
              <th class="border border-[#457fb6] px-3 py-3 text-center font-semibold">Jumlah</th>
              <th class="print-action border border-[#457fb6] px-3 py-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in daftarIsiRows" :key="row.naskahId ?? `${row.id}-${idx}`" class="odd:bg-white even:bg-gray-50/70 dark:odd:bg-gray-800 dark:even:bg-gray-700/30">
              <td class="border-b border-gray-200 px-3 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">
                <p class="font-semibold">{{ row.nomorSurat ?? row.nomor_surat ?? row.nomor ?? '-' }}</p>
                <p class="mt-1 text-gray-400">{{ formatDate(row.tanggal) }}</p>
              </td>
              <td class="border-b border-gray-200 px-3 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.kodeKlasifikasi ?? '-' }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-gray-700 whitespace-normal dark:border-gray-700 dark:text-gray-200">{{ row.uraianInformasi ?? row.perihal ?? '-' }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.jumlah ?? row.jumlahBerkas ?? '-' }}</td>
              <td class="print-action border-b border-gray-200 px-3 py-3 text-center dark:border-gray-700">
                <NuxtLink
                  v-if="row.id"
                  :to="`/maintenance/preview-berkas/${row.id}?nomor_usulan=${transfer.nomorUsulan}&usulan_id=${transfer.id}&from=${previewFrom}`"
                  class="inline-flex p-2 text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
                  title="Buka detail berkas"
                >
                  <UIcon name="i-lucide-eye" class="h-4 w-4" />
                </NuxtLink>
              </td>
            </tr>
            <tr v-if="daftarIsiRows.length === 0">
              <td colspan="5" class="border-b border-gray-200 px-3 py-6 text-center text-gray-400 dark:border-gray-700">Belum ada isi berkas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Penandatangan BAC ditampilkan sebelum riwayat verifikasi. -->
    <div
      v-if="showBacSigner && hasBacSigner"
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left mb-4"
        aria-expanded="bacSignerOpen"
        @click="bacSignerOpen = !bacSignerOpen"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Penandatangan BAC</h3>
        <UIcon
          :name="bacSignerOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="h-4 w-4 text-gray-400"
        />
      </button>
      <div v-show="bacSignerOpen" class="space-y-3">
        <div
          v-if="transfer.bacPihakPertamaPersnum || transfer.bacPihakPertamaName"
          class="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ transfer.bacPihakPertamaName || '-' }}<span v-if="transfer.bacPihakPertamaJabatan" class="font-normal text-gray-500 dark:text-gray-400"> - {{ transfer.bacPihakPertamaJabatan }}</span>
            </p>
          </div>
          <span class="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            Pihak Pertama
          </span>
        </div>
        <div
          v-if="transfer.bacPihakKeduaPersnum || transfer.bacPihakKeduaName"
          class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ transfer.bacPihakKeduaName || '-' }}<span v-if="transfer.bacPihakKeduaJabatan" class="font-normal text-gray-500 dark:text-gray-400"> - {{ transfer.bacPihakKeduaJabatan }}</span>
            </p>
          </div>
          <span class="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            Pihak Kedua
          </span>
        </div>
      </div>
    </div>

    <!-- Daftar Atasan Verifikasi (Berjenjang) -->
    <div
      v-if="showApprovalLevels && transfer.approvalLevels && transfer.approvalLevels.length > 0"
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left mb-4"
        :class="collapsible ? 'cursor-pointer' : 'cursor-default'"
        :aria-expanded="collapsible ? approvalOpen : undefined"
        @click="collapsible && (approvalOpen = !approvalOpen)"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Daftar Atasan Verifikasi</h3>
        <UIcon
          v-if="collapsible"
          :name="approvalOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="h-4 w-4 text-gray-400"
        />
      </button>
      <div v-show="!collapsible || approvalOpen" class="space-y-2">
        <div
          v-for="level in transfer.approvalLevels"
          :key="level.id"
          class="flex items-center gap-3 p-3 rounded-lg border"
          :class="levelStatusClass(level.status)"
        >
          <div
            v-if="(transfer.approvalLevels?.length ?? 0) > 1"
            class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0"
          >
            {{ level.urutan }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ level.atasanName }}<span v-if="level.atasanPositionText" class="font-normal text-gray-500 dark:text-gray-400"> - {{ level.atasanPositionText }}</span>
            </p>
          </div>
          <span :class="levelBadgeClass(level.status)" class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
            {{ levelStatusLabel(level.status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Card 5: Tembusan BAC -->
    <div
      v-if="showBacTembusan && hasBacTembusan"
      class="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left mb-4"
        aria-expanded="bacTembusanOpen"
        @click="bacTembusanOpen = !bacTembusanOpen"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Tembusan BAC</h3>
        <UIcon
          :name="bacTembusanOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="h-4 w-4 text-gray-400"
        />
      </button>
      <div v-show="bacTembusanOpen" class="space-y-2">
        <div
          v-for="(copy, index) in bacTembusan"
          :key="`bac-copy-${copy.persnum}-${index}`"
          class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ copy.name || '-' }}<span v-if="copy.jabatan" class="font-normal text-gray-500 dark:text-gray-400"> - {{ copy.jabatan }}</span>
            </p>
          </div>
          <span class="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            Tembusan
          </span>
        </div>
      </div>
    </div>

    <!-- Card 6: Daftar Atasan TU Verifikasi (Berjenjang) -->
    <div
      v-if="showTuApprovalLevels && transfer.tuApprovalLevels && transfer.tuApprovalLevels.length > 0"
      class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left mb-4"
        :class="collapsible ? 'cursor-pointer' : 'cursor-default'"
        :aria-expanded="collapsible ? tuApprovalOpen : undefined"
        @click="collapsible && (tuApprovalOpen = !tuApprovalOpen)"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Daftar Atasan TU Verifikasi (Berjenjang)</h3>
        <UIcon
          v-if="collapsible"
          :name="tuApprovalOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="h-4 w-4 text-gray-400"
        />
      </button>
      <div v-show="!collapsible || tuApprovalOpen" class="space-y-2">
        <div
          v-for="level in transfer.tuApprovalLevels"
          :key="level.urutan"
          class="flex items-center gap-3 p-3 rounded-lg border"
          :class="levelStatusClass(level.status)"
        >
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">
            {{ level.urutan }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ level.name }}<span v-if="level.jabatan" class="font-normal text-gray-500 dark:text-gray-400"> - {{ level.jabatan }}</span>
            </p>
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
import { computed, ref } from 'vue';
import type { TransferActiveToInactive, ApprovalLevel } from '~/types/transfer-active-to-inactive';
import { statusBadgeClass, statusLabel, formatDate } from '~/utils/transfer-status';

const props = defineProps<{
  transfer: TransferActiveToInactive;
  daftarBerkas?: any[];
  daftarIsi?: any[];
  unitKerjaPihakPertama?: string;
  collapsible?: boolean;
  showHeaderStatus?: boolean;
  previewFrom?: string;
  showApprovalLevels?: boolean;
  showBacSigner?: boolean;
  showBacTembusan?: boolean;
  showTuApprovalLevels?: boolean;
}>();

const collapsible = computed(() => props.collapsible === true);
const showHeaderStatus = computed(() => props.showHeaderStatus !== false);
const showApprovalLevels = computed(() => props.showApprovalLevels !== false);
const showBacSigner = computed(() => props.showBacSigner !== false);
const showBacTembusan = computed(() => props.showBacTembusan !== false);
const showTuApprovalLevels = computed(() => props.showTuApprovalLevels !== false);
const previewFrom = computed(() => props.previewFrom ?? 'transfer');
const infoOpen = ref(true);
const berkasOpen = ref(true);
const daftarIsiOpen = ref(true);
const approvalOpen = ref(true);
const tuApprovalOpen = ref(true);
const bacSignerOpen = ref(true);
const bacTembusanOpen = ref(true);

const bacTembusan = computed(() =>
  Array.isArray(props.transfer.bacTembusan) ? props.transfer.bacTembusan : [],
);
const hasBacSigner = computed(
  () => Boolean(
    props.transfer.bacPihakPertamaPersnum ||
    props.transfer.bacPihakPertamaName ||
    props.transfer.bacPihakKeduaPersnum ||
    props.transfer.bacPihakKeduaName,
  ),
);
const hasBacTembusan = computed(() => bacTembusan.value.length > 0);

const printDaftarBerkas = () => {
  openTablePrintPreview('Daftar Berkas', 'daftar-berkas-print', 'table');
};

const printDaftarIsi = () => {
  openTablePrintPreview('Daftar Isi Berkas', 'daftar-isi-print', 'table');
};

const openTablePrintPreview = (title: string, elementId: string, selector: string) => {
  const element = document.getElementById(elementId);
  const table = element?.querySelector(selector);
  if (!table) return;
  const w = window.open('', '_blank');
  if (!w) return;
  const unitKerja = props.unitKerjaPihakPertama || props.transfer.divisiName || '................................';
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  };
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => htmlEscapes[char] ?? char);
  w.document.write(`<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title><style>
    *{box-sizing:border-box}body{font-family:'Times New Roman',serif;padding:36px;color:#111;font-size:12pt}
    h1{font-size:18pt;margin:0 0 18px;font-weight:bold}.unit{font-size:14pt;margin:0 0 18px}
    hr{border:0;border-top:1px solid #222;margin:0 0 20px}table{width:100%;border-collapse:collapse;font-size:10pt}
    th{background:#457fb6;color:#fff;border:1px solid #457fb6;padding:8px;text-align:center}
    td{border:1px solid #d1d5db;padding:8px;vertical-align:top}.print-action{display:none!important}
    @page{size:A4 landscape;margin:15mm}
  </style></head><body><h1>${escapeHtml(title)}</h1><p class="unit">Unit Kerja: ${escapeHtml(unitKerja)}</p><hr>${table.outerHTML}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 250);
};

const berkasRows = computed(() => {
  if (props.daftarBerkas && props.daftarBerkas.length > 0) return props.daftarBerkas;
  return (props.transfer.arsipIds ?? []).map((a, idx) => ({
    no: idx + 1,
    id: a.id,
    kode: a.kode,
    namaBerkas: a.perihal,
    uraianInformasi: a.perihal,
    kodeKlasifikasi: '-',
    nomorItem: idx + 1,
    tanggal: null,
    jumlah: 1,
    lokasiSimpan: '-',
    klasifikasiKeamanan: '-',
  }));
});

const daftarIsiRows = computed(() => props.daftarIsi ?? []);
const showDaftarIsiCard = computed(() => props.daftarIsi !== undefined);

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
