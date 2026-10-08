<template>
  <div class="flex flex-col gap-5">
    <!-- Card 1: Informasi Usulan + Keterangan + Total Arsip -->
    <div class="order-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Usulan</h3>
        <button
          type="button"
          class="inline-flex h-8 w-8 shrink-0 items-center justify-center text-gray-500 transition-colors hover:text-[#457fb6] dark:text-gray-300 dark:hover:text-blue-300"
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
          <p class="text-gray-900 dark:text-white font-medium">
            {{ usulan.atasanName }}<span v-if="usulan.atasanPositionText" class="font-normal text-gray-500 dark:text-gray-400"> - {{ usulan.atasanPositionText }}</span>
          </p>
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
              <td class="border-b border-gray-200 px-3 py-3 text-gray-700 whitespace-normal dark:border-gray-700 dark:text-gray-200">{{ a.uraianInformasi ?? a.namaBerkas ?? '-' }}</td>
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
      class="order-5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
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
const bacSignerOpen = ref(true);
const bacTembusanOpen = ref(true);

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

const printDaftarBerkas = () => {
  const el = document.getElementById('daftar-berkas-print');
  if (!el) return;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Daftar Berkas</title><style>
    body{font-family:Arial,sans-serif;padding:30px;color:#111}table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#457fb6;color:#fff;border:1px solid #457fb6;padding:8px;text-align:center}
    td{border:1px solid #d1d5db;padding:8px;vertical-align:top}.print-action{display:none}h2{text-align:center}
  </style></head><body><h2>Daftar Berkas</h2>${el.innerHTML}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 250);
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
