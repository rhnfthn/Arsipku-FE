<template>
  <div class="flex flex-col gap-5">
    <!-- Card 1: Informasi Usulan + Keterangan + Total Arsip -->
    <div class="order-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <button
        type="button"
        class="flex min-h-16 w-full items-center justify-between gap-3 px-5 py-4 text-left"
        @click="infoOpen = !infoOpen"
        :title="infoOpen ? 'Lipat Informasi Usulan' : 'Buka Informasi Usulan'"
        :aria-expanded="infoOpen"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Usulan</h3>
        <UIcon :name="infoOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4 text-gray-400" />
      </button>
      <div v-show="infoOpen" class="px-5 pb-5">
        <div class="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Nomor Usulan</span>
          <p class="font-normal text-gray-900 dark:text-white">{{ usulan.nomorUsulan }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Usulan</span>
          <p class="font-normal text-gray-900 dark:text-white">{{ formatVerifikasiDate(usulan.tanggalUsulan) }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Status</span>
          <p class="mt-1"><span :class="verifikasiStatusBadge(usulan.status)">{{ verifikasiStatusLabel(usulan.status) }}</span></p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Status BAC</span>
          <p class="font-normal text-gray-900 dark:text-white">
            {{ usulan.bacSignedAt ? 'Ditandatangani' : usulan.bacPihakPertamaPersnum ? 'Menunggu Tanda Tangan' : 'Belum Ditandatangani' }}
          </p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Pengusul (Sekretaris)</span>
          <p class="font-normal text-gray-900 dark:text-white">{{ usulan.sekretarisName || '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Kode Berkas</span>
          <p class="font-normal text-gray-900 dark:text-white">{{ usulan.arsipKode ?? '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</span>
          <p class="font-normal text-gray-900 dark:text-white">
            {{ [usulan.arsipKlasifikasiKode, usulan.arsipKlasifikasi].filter(Boolean).join(' — ') || '-' }}
          </p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Nasib Akhir</span>
          <p class="font-normal text-gray-900 dark:text-white">{{ usulan.arsipTindakanPenyusutan ?? '-' }}</p>
        </div>
        <div>
          <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span>
          <p class="font-normal text-gray-900 dark:text-white">{{ formatVerifikasiDate(usulan.tanggalRetensiAktifHabis ?? null) }}</p>
        </div>
        <div class="md:col-span-2">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Uraian Informasi Berkas</span>
          <p class="font-normal text-gray-900 dark:text-white">{{ usulan.arsipPerihal || '-' }}</p>
        </div>
        </div>
        <div v-if="usulan.rejectedNote" class="mt-4">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Penolakan</span>
          <p class="text-red-600 dark:text-red-400 text-sm mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ usulan.rejectedNote }}</p>
        </div>
        <div v-if="usulan.verifyNote" class="mt-2">
          <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Verifikasi</span>
          <p class="text-gray-700 dark:text-gray-300 text-sm mt-1 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">{{ usulan.verifyNote }}</p>
        </div>

        <!-- Keterangan -->
        <div v-if="usulan.keterangan" class="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">
          <h4 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Keterangan</h4>
          <p class="rounded-lg bg-gray-50 p-3 text-sm italic text-gray-700 dark:bg-gray-700/50 dark:text-gray-300">
            {{ usulan.keterangan }}
          </p>
        </div>
      </div>
    </div>

    <!-- Card 2: Daftar Berkas + Daftar Isi Berkas -->
    <div
      v-if="daftarArsip && daftarArsip.length > 0"
      class="order-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Daftar Berkas ({{ daftarArsip.length }})
        </h3>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center text-gray-500 transition-colors hover:text-[#457fb6] dark:text-gray-300"
            @click="printDaftarBerkas"
            title="Print Daftar Berkas"
            aria-label="Print Daftar Berkas"
          >
            <UIcon name="i-lucide-printer" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center text-gray-500 transition-colors hover:text-[#457fb6] dark:text-gray-300"
            @click="berkasOpen = !berkasOpen"
            :title="berkasOpen ? 'Lipat Daftar Berkas' : 'Buka Daftar Berkas'"
            :aria-expanded="berkasOpen"
          >
            <UIcon :name="berkasOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div v-show="berkasOpen" id="daftar-berkas-print" class="overflow-x-auto">
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
              <th class="border border-[#457fb6] px-3 py-3 text-center font-semibold whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(a, idx) in daftarArsip" :key="a.id ?? idx" class="odd:bg-white even:bg-gray-50/70 dark:odd:bg-gray-800 dark:even:bg-gray-700/30">
              <td class="border-b border-gray-200 px-3 py-3 font-medium text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ a.kode ?? '-' }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ a.kodeKlasifikasi ?? '-' }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">
                <div
                  class="block max-w-[320px] truncate"
                  :aria-label="String(a.uraianInformasi ?? a.namaBerkas ?? '-')"
                  tabindex="0"
                  @mouseenter="showPerihalTooltip($event, String(a.uraianInformasi ?? a.namaBerkas ?? '-'))"
                  @mouseleave="hidePerihalTooltip"
                  @focus="showPerihalTooltip($event, String(a.uraianInformasi ?? a.namaBerkas ?? '-'))"
                  @blur="hidePerihalTooltip"
                >
                  {{ a.uraianInformasi ?? a.namaBerkas ?? '-' }}
                </div>
              </td>
              <td class="border-b border-gray-200 px-3 py-3 text-gray-600 whitespace-nowrap dark:border-gray-700 dark:text-gray-300">{{ formatVerifikasiDate(a.tanggal) }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ a.jumlah ?? a.jumlahBerkas ?? '-' }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ a.lokasiSimpan ?? '-' }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ a.klasifikasiKeamanan ?? '-' }}</td>
              <td class="border-b border-gray-200 px-3 py-3 text-center dark:border-gray-700">
                <NuxtLink
                  v-if="a.id"
                  :to="`/maintenance/preview-berkas/${a.id}?nomor_usulan=${usulan.nomorUsulan}&usulan_id=${usulan.id}`"
                  class="inline-flex p-2 text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
                  title="Buka detail berkas"
                >
                  <UIcon name="i-lucide-eye" class="h-4 w-4" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Card: Daftar Isi Berkas -->
    <div
      v-if="daftarIsi !== undefined"
      class="order-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div class="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          Daftar Isi Berkas ({{ daftarIsi.length }})
        </h3>
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="inline-flex h-8 w-8 items-center justify-center text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
            @click="printDaftarIsi"
            title="Print Daftar Isi Berkas"
            aria-label="Print Daftar Isi Berkas"
          >
            <UIcon name="i-lucide-printer" class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center text-gray-500 transition-colors hover:text-[#457fb6] dark:text-gray-300"
            @click="daftarIsiOpen = !daftarIsiOpen"
            :title="daftarIsiOpen ? 'Lipat Daftar Isi Berkas' : 'Buka Daftar Isi Berkas'"
            :aria-expanded="daftarIsiOpen"
          >
            <UIcon :name="daftarIsiOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div v-show="daftarIsiOpen" id="verifikasi-daftar-isi-print" class="w-full overflow-hidden">
        <table class="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr class="bg-[#457fb6] text-white">
              <th class="w-[16%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Nomor Naskah</th>
              <th class="w-[18%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Kode Klasifikasi</th>
              <th class="w-[10%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Kode Berkas</th>
              <th class="w-[21%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Uraian Informasi Isi Berkas</th>
              <th class="w-[9%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Tanggal</th>
              <th class="w-[5%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Jumlah</th>
              <th class="w-[9%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Lokasi Simpan</th>
              <th class="w-[8%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Klasifikasi Keamanan</th>
              <th class="print-action w-[4%] border border-[#457fb6] px-1.5 py-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in daftarIsi"
              :key="row.naskahId ?? `${row.id}-${idx}`"
              class="odd:bg-white even:bg-gray-50/70 dark:odd:bg-gray-800 dark:even:bg-gray-700/30"
            >
              <td class="break-words border-b border-gray-200 px-1.5 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.nomorSurat ?? row.nomor_surat ?? row.nomor ?? '-' }}</td>
              <td class="break-words border-b border-gray-200 px-1.5 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ archiveClassificationLabel(row) }}</td>
              <td class="break-words border-b border-gray-200 px-1.5 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.kode ?? row.kodeBerkas ?? '-' }}</td>
              <td class="break-words border-b border-gray-200 px-1.5 py-3 text-gray-700 dark:border-gray-700 dark:text-gray-200">{{ row.uraianInformasi ?? row.perihal ?? '-' }}</td>
              <td class="break-words border-b border-gray-200 px-1.5 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ formatVerifikasiDate(row.tanggal ?? row.tanggalNaskah ?? row.createdAt ?? null) }}</td>
              <td class="break-words border-b border-gray-200 px-1.5 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.jumlah ?? row.jumlahBerkas ?? '-' }}</td>
              <td class="break-words border-b border-gray-200 px-1.5 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.lokasiSimpan ?? '-' }}</td>
              <td class="break-words border-b border-gray-200 px-1.5 py-3 text-center text-gray-600 dark:border-gray-700 dark:text-gray-300">{{ row.klasifikasiKeamanan ?? '-' }}</td>
              <td class="print-action border-b border-gray-200 px-1.5 py-3 text-center dark:border-gray-700">
                <button
                  v-if="row.id && (row.naskahId ?? row.idNaskah)"
                  type="button"
                  @click="openNaskahPreview(row)"
                  class="inline-flex p-1 text-gray-600 transition-colors hover:text-[#457fb6] dark:text-gray-300"
                  title="Preview PDF naskah"
                >
                  <UIcon name="i-lucide-eye" class="h-4 w-4" />
                </button>
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
            <tr v-if="daftarIsi.length === 0">
              <td colspan="9" class="border-b border-gray-200 px-4 py-6 text-center text-gray-400 dark:border-gray-700">Belum ada isi berkas.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Card: Daftar Atasan Verifikasi (Berjenjang) — sisi Atasan Managerial Sekretaris -->
    <div
      v-if="usulan.approvalLevels && usulan.approvalLevels.length > 0"
      class="order-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
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
          <div
            v-if="(usulan.approvalLevels?.length ?? 0) > 1"
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

    <!-- Card: Pejabat Penandatangan BAC -->
    <div
      v-if="hasBacSigner"
      class="order-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left"
        @click="bacSignerOpen = !bacSignerOpen"
        :aria-expanded="bacSignerOpen"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Penandatangan BAC</h3>
        <UIcon
          :name="bacSignerOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="h-4 w-4 text-gray-400"
        />
      </button>
      <div v-show="bacSignerOpen" class="mt-4 space-y-3">
        <div class="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ usulan.bacPihakPertamaName || '-' }}<span v-if="usulan.bacPihakPertamaJabatan" class="font-normal text-gray-500 dark:text-gray-400"> - {{ usulan.bacPihakPertamaJabatan }}</span>
            </p>
          </div>
          <span class="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
            Pihak Pertama
          </span>
        </div>
        <div
          v-if="usulan.bacPihakKeduaPersnum || usulan.bacPihakKeduaName"
          class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20"
        >
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-gray-900 dark:text-white">
              {{ usulan.bacPihakKeduaName || '-' }}<span v-if="usulan.bacPihakKeduaJabatan" class="font-normal text-gray-500 dark:text-gray-400"> - {{ usulan.bacPihakKeduaJabatan }}</span>
            </p>
          </div>
          <span class="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            Pihak Kedua
          </span>
        </div>
      </div>
    </div>

    <!-- Card: Tembusan BAC -->
    <div
      v-if="hasBacTembusan"
      class="order-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <button
        type="button"
        class="flex w-full items-center justify-between gap-3 text-left"
        @click="bacTembusanOpen = !bacTembusanOpen"
        :aria-expanded="bacTembusanOpen"
      >
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Tembusan BAC</h3>
        <UIcon
          :name="bacTembusanOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="h-4 w-4 text-gray-400"
        />
      </button>
      <div v-show="bacTembusanOpen" class="mt-4 space-y-2">
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
  </div>
  <Teleport to="body">
    <div
      v-if="perihalTooltip.visible"
      role="tooltip"
      class="pointer-events-none fixed z-[9999] max-h-[40vh] overflow-y-auto rounded-lg bg-gray-900 px-3 py-2 text-sm font-normal text-white shadow-xl"
      :style="{
        top: `${perihalTooltip.top}px`,
        left: `${perihalTooltip.left}px`,
        maxWidth: 'min(26rem, calc(100vw - 24px))',
      }"
    >
      {{ perihalTooltip.text }}
    </div>
  </Teleport>
  <SharedSharePdfViewer
    v-model="tablePdfPreviewOpen"
    :url="tablePdfPreviewUrl"
    :title="tablePdfPreviewTitle"
    :loading="tablePdfPreviewLoading"
    @close="closeTablePdfPreview"
  />
  <SharedSharePdfViewer
    v-model="naskahPreviewOpen"
    :url="naskahPreviewUrl"
    :title="naskahPreviewTitle"
    :loading="naskahPreviewLoading"
    @close="closeNaskahPreview"
  />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import type { VerifikasiUsulanItem } from '~/types/verifikasi-usulan';
import {
  verifikasiStatusBadge,
  verifikasiStatusLabel,
  formatVerifikasiDate,
} from '~/utils/verifikasi-status';
import { useArsipDinamis } from '~/composables/useArsipDinamis';

const props = defineProps<{
  usulan: VerifikasiUsulanItem;
  daftarArsip?: any[];
  daftarIsi?: any[];
  unitKerja?: string | null;
}>();

const infoOpen = ref(true);
const atasanOpen = ref(true);
const berkasOpen = ref(true);
const daftarIsiOpen = ref(true);
const bacSignerOpen = ref(true);
const bacTembusanOpen = ref(true);
const perihalTooltip = reactive({ visible: false, text: '', top: 0, left: 0 });
const tablePdfPreviewOpen = ref(false);
const tablePdfPreviewLoading = ref(false);
const tablePdfPreviewUrl = ref('');
const tablePdfPreviewTitle = ref('Preview Daftar Berkas');
const naskahPreviewOpen = ref(false);
const naskahPreviewLoading = ref(false);
const naskahPreviewUrl = ref('');
const naskahPreviewTitle = ref('Preview Naskah');
const { getNaskahDetailInBerkas, getNaskahPdfUrl } = useArsipDinamis();

const showPerihalTooltip = (event: MouseEvent | FocusEvent, text: string) => {
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement) || target.scrollWidth <= target.clientWidth) return;

  const rect = target.getBoundingClientRect();
  const viewportPadding = 12;
  const tooltipWidth = Math.min(416, window.innerWidth - viewportPadding * 2);
  const tooltipHeight = Math.min(320, window.innerHeight * 0.4);
  const left = Math.min(
    Math.max(viewportPadding, rect.left),
    window.innerWidth - tooltipWidth - viewportPadding,
  );
  const below = rect.bottom + 8;
  const top = below + tooltipHeight <= window.innerHeight - viewportPadding
    ? below
    : Math.max(viewportPadding, rect.top - tooltipHeight - 8);

  perihalTooltip.text = text;
  perihalTooltip.left = left;
  perihalTooltip.top = top;
  perihalTooltip.visible = true;
};

const hidePerihalTooltip = () => {
  perihalTooltip.visible = false;
};

const bacTembusan = computed(() =>
  Array.isArray(props.usulan.bacTembusan) ? props.usulan.bacTembusan : [],
);
const hasBacSigner = computed(
  () => Boolean(
    props.usulan.bacPihakPertamaPersnum ||
    props.usulan.bacPihakPertamaName ||
    props.usulan.bacPihakKeduaPersnum ||
    props.usulan.bacPihakKeduaName,
  ),
);
const hasBacTembusan = computed(() => bacTembusan.value.length > 0);
const daftarArsip = computed(() => props.daftarArsip ?? []);
const daftarIsi = computed(() => props.daftarIsi ?? []);

const archiveClassificationLabel = (row: any) => {
  const archive = daftarArsip.value.find((item: any) =>
    String(item.id ?? '') === String(row.id ?? row.arsipId ?? ''),
  );
  const code = archive?.kodeKlasifikasi ?? row.kodeKlasifikasi ?? '';
  const name = archive?.klasifikasi ?? row.klasifikasi ?? row.klasifikasiNama ?? '';
  return [code, name].filter(Boolean).join(' — ') || '-';
};

const closeTablePdfPreview = () => {
  if (tablePdfPreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(tablePdfPreviewUrl.value);
  tablePdfPreviewUrl.value = '';
};

onBeforeUnmount(closeTablePdfPreview);

const printDaftarBerkas = async () => {
  if (!daftarArsip.value.length) return;
  closeTablePdfPreview();
  tablePdfPreviewTitle.value = 'Preview Daftar Berkas';
  tablePdfPreviewOpen.value = true;
  tablePdfPreviewLoading.value = true;

  try {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const margin = 12;
    const pageWidth = 297;
    const pageHeight = 210;
    const contentWidth = pageWidth - margin * 2;
    const unitKerja = props.unitKerja || '................................';
    const headers = [
      'Nomor Berkas', 'Kode Klasifikasi', 'Uraian Informasi Isi Berkas', 'Kurun Waktu',
      'Jumlah', 'Lokasi Simpan', 'Klasifikasi Keamanan', 'Retensi Arsip Aktif',
    ];
    const rows = daftarArsip.value.map((archive: any) => [
      String(archive.kode ?? '-'),
      [archive.kodeKlasifikasi, archive.klasifikasi].filter(Boolean).join(' — ') || '-',
      String(archive.uraianInformasi ?? archive.namaBerkas ?? archive.perihal ?? '-'),
      String(archive.kurunWaktu ?? formatVerifikasiDate(archive.tanggal ?? null)),
      String(archive.jumlah ?? archive.jumlahBerkas ?? '-'),
      String(archive.lokasiSimpan ?? '-'),
      String(archive.klasifikasiKeamanan ?? '-'),
      formatVerifikasiDate(archive.tanggalRetensiAktifBerakhir ?? archive.tanggalRetensiAktifHabis ?? null),
    ]);
    const weights = [1.6, 1.3, 3.2, 1, 1, 1.25, 1.25, 1.25];
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const columnWidths = weights.map((weight) => (weight / totalWeight) * contentWidth);
    const xPositions = columnWidths.map((_, index) =>
      margin + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0),
    );
    const lineHeight = 4;
    const drawHeading = () => {
      pdf.setTextColor(20, 20, 20);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(15);
      pdf.text('Daftar Berkas', pageWidth / 2, 15, { align: 'center' });
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      pdf.text(`Unit Kerja: ${unitKerja}`, pageWidth / 2, 22, { align: 'center' });
      return 32;
    };
    const drawRow = (cells: string[], y: number, isHeader = false) => {
      pdf.setFont('times', isHeader ? 'bold' : 'normal');
      pdf.setFontSize(isHeader ? 9 : 9.5);
      const lines = columnWidths.map((width, index) =>
        pdf.splitTextToSize(cells[index] || '-', Math.max(8, width - 4)) as string[],
      );
      const rowHeight = Math.max(8, ...lines.map((cellLines) => cellLines.length * lineHeight + 4));
      const fontHeight = pdf.getFontSize() * 0.3528;
      cells.forEach((_, index) => {
        const width = columnWidths[index];
        const textHeight = (lines[index].length - 1) * lineHeight + fontHeight;
        const textY = y + (rowHeight - textHeight) / 2 + fontHeight;
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(40, 40, 40);
        pdf.rect(xPositions[index], y, width, rowHeight, 'FD');
        pdf.setTextColor(20, 20, 20);
        pdf.text(lines[index], xPositions[index] + width / 2, textY, {
          align: 'center', maxWidth: width - 4, lineHeightFactor: 1.1,
        });
      });
      return rowHeight;
    };

    let y = drawHeading();
    y += drawRow(headers, y, true);
    for (const row of rows) {
      const estimatedHeight = Math.max(
        8,
        ...row.map((cell, index) => pdf.splitTextToSize(cell, Math.max(8, columnWidths[index] - 4)).length * lineHeight + 4),
      );
      if (y + estimatedHeight > pageHeight - margin) {
        pdf.addPage();
        y = drawHeading();
        y += drawRow(headers, y, true);
      }
      y += drawRow(row, y);
    }
    tablePdfPreviewUrl.value = URL.createObjectURL(pdf.output('blob'));
  } catch (error: any) {
    useToast().add({
      title: 'Preview PDF gagal dibuat',
      description: error?.message || 'Silakan coba kembali.',
      color: 'error',
    });
    tablePdfPreviewOpen.value = false;
  } finally {
    tablePdfPreviewLoading.value = false;
  }
};

const printDaftarIsi = async () => {
  const table = document.querySelector<HTMLTableElement>('#verifikasi-daftar-isi-print table');
  if (!table) return;

  closeTablePdfPreview();
  tablePdfPreviewTitle.value = 'Preview Daftar Isi Berkas';
  tablePdfPreviewOpen.value = true;
  tablePdfPreviewLoading.value = true;

  try {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const margin = 12;
    const pageWidth = 297;
    const pageHeight = 210;
    const contentWidth = pageWidth - margin * 2;
    const headers = Array.from(table.querySelectorAll('thead th'))
      .filter((cell) => !cell.classList.contains('print-action'))
      .map((cell) => (cell.textContent || '').trim());
    const rows = Array.from(table.querySelectorAll('tbody tr'))
      .filter((row) => row.querySelector('td') && !row.querySelector('td[colspan]'))
      .map((row) => Array.from(row.querySelectorAll('td'))
        .filter((cell) => !cell.classList.contains('print-action'))
        .map((cell) => ((cell as HTMLElement).innerText || cell.textContent || '').trim().replace(/\s*\n\s*/g, ' ') || '-'));
    const weights = headers.map((label) => {
      if (/uraian|informasi/i.test(label)) return 3;
      if (/nomor/i.test(label)) return 1.7;
      if (/kode|lokasi|keamanan/i.test(label)) return 1.25;
      return 0.8;
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
    const widths = weights.map((weight) => (weight / totalWeight) * contentWidth);
    const xPositions = widths.map((_, index) => margin + widths.slice(0, index).reduce((sum, width) => sum + width, 0));
    const drawHeading = () => {
      pdf.setTextColor(20, 20, 20);
      pdf.setFont('times', 'bold');
      pdf.setFontSize(15);
      pdf.text('Daftar Isi Berkas', pageWidth / 2, 15, { align: 'center' });
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      pdf.text(`Unit Kerja: ${props.unitKerja || '........................'}`, pageWidth / 2, 22, { align: 'center' });
      return 32;
    };
    const drawRow = (cells: string[], y: number, isHeader = false) => {
      pdf.setFont('times', isHeader ? 'bold' : 'normal');
      pdf.setFontSize(9);
      const lines = widths.map((width, index) => pdf.splitTextToSize(cells[index] || '-', Math.max(8, width - 4)) as string[]);
      const rowHeight = Math.max(8, ...lines.map((cellLines) => cellLines.length * 4 + 4));
      const fontHeight = pdf.getFontSize() * 0.3528;
      cells.forEach((_, index) => {
        const width = widths[index];
        const textHeight = (lines[index].length - 1) * 4 + fontHeight;
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(40, 40, 40);
        pdf.rect(xPositions[index], y, width, rowHeight, 'FD');
        pdf.setTextColor(20, 20, 20);
        pdf.text(lines[index], xPositions[index] + width / 2, y + (rowHeight - textHeight) / 2 + fontHeight, {
          align: 'center', maxWidth: width - 4, lineHeightFactor: 1.1,
        });
      });
      return rowHeight;
    };

    let y = drawHeading();
    y += drawRow(headers, y, true);
    for (const row of rows) {
      const estimatedHeight = Math.max(
        8,
        ...row.map((cell, index) => pdf.splitTextToSize(cell, Math.max(8, widths[index] - 4)).length * 4 + 4),
      );
      if (y + estimatedHeight > pageHeight - margin) {
        pdf.addPage();
        y = drawHeading();
        y += drawRow(headers, y, true);
      }
      y += drawRow(row, y);
    }
    tablePdfPreviewUrl.value = URL.createObjectURL(pdf.output('blob'));
  } catch (error: any) {
    useToast().add({
      title: 'Preview PDF gagal dibuat',
      description: error?.message || 'Silakan coba kembali.',
      color: 'error',
    });
    tablePdfPreviewOpen.value = false;
  } finally {
    tablePdfPreviewLoading.value = false;
  }
};

const closeNaskahPreview = () => {
  naskahPreviewOpen.value = false;
  naskahPreviewUrl.value = '';
  naskahPreviewLoading.value = false;
};

const openNaskahPreview = async (row: any) => {
  const naskahId = row.naskahId ?? row.idNaskah;
  if (!row.id || !naskahId) return;
  naskahPreviewTitle.value = row.uraianInformasi || row.perihal || row.nomorSurat || 'Preview Naskah';
  naskahPreviewUrl.value = '';
  naskahPreviewOpen.value = true;
  naskahPreviewLoading.value = true;

  try {
    const detailRes: any = await getNaskahDetailInBerkas(String(row.id), String(naskahId));
    const detailData = detailRes?.data?.data ?? detailRes?.data ?? detailRes;
    const detail = Array.isArray(detailData) ? detailData[0] : detailData;
    let pdfUrl = detail?.final_pdf_url ?? detail?.finalPdfUrl ?? detail?.final_pdf ?? detail?.pdf_url ?? null;
    if (!pdfUrl) {
      const pdfRes: any = await getNaskahPdfUrl(String(naskahId));
      const pdfData = pdfRes?.data?.data ?? pdfRes?.data ?? pdfRes;
      pdfUrl = pdfData?.url ?? pdfData?.final_pdf_url ?? null;
    }
    if (!pdfUrl) throw new Error('PDF naskah tidak tersedia.');
    naskahPreviewUrl.value = pdfUrl;
  } catch (error: any) {
    closeNaskahPreview();
    useToast().add({
      title: 'Preview naskah gagal dibuka',
      description: error?.message || 'PDF naskah tidak tersedia.',
      color: 'error',
    });
  } finally {
    naskahPreviewLoading.value = false;
  }
};

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
