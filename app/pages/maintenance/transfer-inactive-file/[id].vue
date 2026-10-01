<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader :title="`Detail ${item?.nomorUsulan ?? ''}`" :items="items" />
      <NuxtLink to="/maintenance/transfer-inactive-file" class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors">
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
      <div class="space-y-4 animate-pulse"><div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" /><div class="h-32 rounded bg-gray-200 dark:bg-gray-700" /></div>
    </div>

    <template v-else-if="item">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Info -->
        <div class="lg:col-span-2 space-y-5">
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Usulan</h3>
              <span :class="statusBadge(item.status)">{{ statusLabel(item.status) }}</span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Nomor</span><p class="text-gray-900 dark:text-white font-medium">{{ item.nomorUsulan }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal</span><p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tanggalUsulan) }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Pengusul</span><p class="text-gray-900 dark:text-white font-medium">{{ item.sekretarisName }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Atasan</span><p class="text-gray-900 dark:text-white font-medium">{{ item.atasanName }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Arsip</span><p class="text-gray-900 dark:text-white font-medium">{{ item.arsipPerihal }}</p></div>
              <div><span class="text-gray-500 dark:text-gray-400 text-xs">Retensi Habis</span><p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.tanggalRetensiAktifHabis) }}</p></div>
              <div v-if="item.tuName"><span class="text-gray-500 dark:text-gray-400 text-xs">TU</span><p class="text-gray-900 dark:text-white font-medium">{{ item.tuName }}</p></div>
              <div v-if="item.atasanTuName"><span class="text-gray-500 dark:text-gray-400 text-xs">Atasan TU</span><p class="text-gray-900 dark:text-white font-medium">{{ item.atasanTuName }}</p></div>
              <div v-if="item.keterangan" class="col-span-2"><span class="text-gray-500 dark:text-gray-400 text-xs">Keterangan</span><p class="text-gray-900 dark:text-white text-sm mt-1">{{ item.keterangan }}</p></div>
              <div v-if="item.rejectedNote" class="col-span-2"><span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Penolakan</span><p class="text-red-600 dark:text-red-400 text-sm mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ item.rejectedNote }}</p></div>
            </div>
          </div>

          <!-- Timeline -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Timeline</h3>
            <ol class="relative border-l border-gray-200 dark:border-gray-700 ml-3 space-y-3">
              <li v-for="step in timelineSteps" :key="step.status" class="ml-6">
                <span :class="step.active ? 'bg-[#457fb6] ring-4 ring-[#457fb6]/20' : step.done ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'" class="absolute -left-[9px] w-4 h-4 rounded-full"></span>
                <p :class="step.active ? 'text-[#457fb6] font-semibold' : step.done ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'" class="text-sm">{{ step.label }}</p>
                <p class="text-xs text-gray-400">{{ step.unit }}</p>
              </li>
            </ol>
          </div>
        </div>

        <!-- Aksi -->
        <div class="space-y-5">
          <!-- Kirim (Sekretaris) -->
          <div v-if="item.status === 'DRAFT' || item.status === 'DITOLAK_ATASAN'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Kirim Usulan</h3>
            <button @click="onSend" :disabled="actionLoading" class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50"><UIcon name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Kirim ke Atasan</button>
          </div>

          <!-- Verifikasi Atasan -->
          <div v-if="item.status === 'MENUNGGU_VERIFIKASI_ATASAN'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Verifikasi Usulan</h3>
            <textarea v-model="verifyNote" rows="3" placeholder="Catatan verifikasi..." class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none mb-3"></textarea>
            <div class="flex gap-2">
              <button @click="onApprove" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50"><UIcon name="i-lucide-check" class="w-4 h-4 mr-1 inline" /> Setujui & Verifikasi Terakhir</button>
              <button @click="onReject" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"><UIcon name="i-lucide-x" class="w-4 h-4 mr-1 inline" /> Tolak</button>
            </div>
            <p class="text-xs text-gray-400 mt-2">Setelah disetujui, status akan otomatis lanjut ke verifikasi terakhir oleh Atasan Managerial.</p>
          </div>

          <!-- Menunggu Verifikasi Terakhir (read-only untuk Sekretaris / user lain yang BUKAN atasan usulan) -->
          <div v-if="(item.status === 'DISETUJUI_ATASAN' || item.status === 'MENUNGGU_VERIFIKASI_TERAKHIR') && !isCurrentAtasan" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-clock" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-base font-semibold text-blue-700 dark:text-blue-300 mb-1">Menunggu Verifikasi Terakhir Atasan</h3>
                <p class="text-sm text-blue-600 dark:text-blue-400">Usulan telah disetujui atasan. Atasan Managerial akan melakukan verifikasi terakhir. Sekretaris menunggu hingga verifikasi terakhir selesai sebelum dapat mengirim ke Unit Tata Naskah.</p>
              </div>
            </div>
          </div>

          <!-- Verifikasi Terakhir (hanya untuk Atasan Managerial yang merupakan atasan dari usulan ini) -->
          <div v-if="isCurrentAtasan && item.status === 'MENUNGGU_VERIFIKASI_TERAKHIR'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Verifikasi Terakhir</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Anda adalah Atasan Managerial untuk usulan ini. Silakan lakukan verifikasi terakhir.</p>
            <textarea v-model="finalVerifyNote" rows="3" placeholder="Catatan verifikasi terakhir..." class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none mb-3"></textarea>
            <div class="flex gap-2">
              <button @click="onFinalVerify" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50"><UIcon name="i-lucide-check" class="w-4 h-4 mr-1 inline" /> Setujui Verifikasi Terakhir</button>
              <button @click="onReject" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"><UIcon name="i-lucide-x" class="w-4 h-4 mr-1 inline" /> Tolak</button>
            </div>
          </div>

          <!-- Dispatch -->
          <div v-if="item.status === 'DISETUJUI_VERIFIKASI_TERAKHIR'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Kirim ke Unit Tata Naskah</h3>
            <button @click="onDispatch" :disabled="actionLoading" class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"><UIcon name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Kirim</button>
          </div>

          <!-- Verifikasi Berkas Fisik (TU) -->
          <div v-if="item.status === 'DIKIRIM' || item.status === 'MENUNGGU_VERIFIKASI_BERKAS_FISIK'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Verifikasi Berkas Fisik</h3>
            <div class="space-y-2 mb-3">
              <label v-for="c in checklistItems" :key="c.key" class="flex items-center gap-2 cursor-pointer">
                <input v-model="checklist[c.key]" type="checkbox" class="w-4 h-4 text-[#457fb6] border-gray-300 rounded focus:ring-[#457fb6]" />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ c.label }}</span>
              </label>
            </div>
            <textarea v-model="physicalNote" rows="2" placeholder="Catatan..." class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-[#457fb6] resize-none mb-3"></textarea>
            <div class="flex gap-2">
              <button @click="onVerifyPhysical(true)" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50">Sesuai</button>
              <button @click="onVerifyPhysical(false)" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50">Tidak Sesuai</button>
            </div>
          </div>

          <!-- Persetujuan TU -->
          <div v-if="item.status === 'BERKAS_FISIK_SESUAI' || item.status === 'MENUNGGU_VERIFIKASI_PERSETUJUAN_TU'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Persetujuan TU</h3>
            <div class="flex gap-2">
              <button @click="onTuApprove" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50">Setujui</button>
              <button @click="onTuReject" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50">Tolak</button>
            </div>
          </div>

          <!-- Persetujuan Terakhir TU -->
          <div v-if="item.status === 'DISETUJUI_PERSETUJUAN_TU' || item.status === 'MENUNGGU_PERSETUJUAN_TERAKHIR_TU'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Persetujuan Terakhir TU</h3>
            <div class="flex gap-2">
              <button @click="onTuFinalApprove" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50">Setujui</button>
              <button @click="onTuFinalReject" :disabled="actionLoading" class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50">Tolak</button>
            </div>
          </div>

          <!-- Receive -->
          <div v-if="item.status === 'DISETUJUI_PERSETUJUAN_TERAKHIR_TU'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Terima Arsip</h3>
            <button @click="onReceive" :disabled="actionLoading" class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"><UIcon name="i-lucide-check-circle" class="w-4 h-4 mr-1 inline" /> Terima</button>
          </div>

          <!-- Arrange -->
          <div v-if="item.status === 'ARSIP_INAKTIF_DITERIMA'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Penataan Arsip</h3>
            <button @click="onArrange" :disabled="actionLoading" class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50">Tata Arsip</button>
          </div>

          <!-- Complete -->
          <div v-if="item.status === 'PENATAAN_ARSIP_INAKTIF'" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Selesai</h3>
            <button @click="onComplete" :disabled="actionLoading" class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"><UIcon name="i-lucide-check-circle" class="w-4 h-4 mr-1 inline" /> Selesai</button>
          </div>

          <!-- Berita Acara -->
          <div v-if="showBeritaAcara" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Berita Acara</h3>
            <button v-if="!item.beritaAcaraUrl" @click="onGenerateBA" :disabled="actionLoading" class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 mb-2"><UIcon name="i-lucide-file-text" class="w-4 h-4 mr-1 inline" /> Generate</button>
            <div v-else>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">{{ item.beritaAcaraNomor }}</p>
              <a :href="item.beritaAcaraUrl" target="_blank" class="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-[#457fb6] text-[#457fb6] hover:bg-[#457fb6]/10 transition-colors"><UIcon name="i-lucide-download" class="w-4 h-4" /> Unduh PDF</a>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">Usulan tidak ditemukan</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTransferInactiveFile } from '~/composables/useTransferInactiveFile';
import { useAuth } from '~/composables/useAuth';
import type { TransferInactiveFile, TransferInactiveFileStatus } from '~/types/transfer-inactive-file';

definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const { user: authUser } = useAuth();
const { fetchDetail, send, approve, reject, finalVerify, dispatch, verifyPhysical, tuApprove, tuReject, tuFinalApprove, tuFinalReject, receive, arrange, complete, generateBeritaAcara } = useTransferInactiveFile();

const item = ref<TransferInactiveFile | null>(null);
const loading = ref(true);
const actionLoading = ref(false);
const verifyNote = ref('');
const finalVerifyNote = ref('');
const physicalNote = ref('');
const checklist = reactive<Record<string, boolean>>({});

/** True jika user yang login adalah Atasan Managerial dari usulan ini. */
const isCurrentAtasan = computed(() => {
  if (!item.value || !authUser.value) return false;
  return Number(authUser.value.persnum) === Number(item.value.atasanPersnum);
});

const checklistItems = [
  { key: 'berkasAsli', label: 'Berkas arsip asli sesuai' },
  { key: 'beritaAcara', label: 'Berita acara serah terima lengkap' },
  { key: 'daftarIsi', label: 'Daftar isi berkas ada' },
  { key: 'lampiran', label: 'Lampiran pendukung ada' },
];

const items = computed(() => [
  { label: 'Beranda', to: '/' },
  { label: 'Pemindahan Arsip Inaktif', to: '/maintenance/transfer-inactive-file' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: `/maintenance/transfer-inactive-file/${route.params.id}` },
]);

const showBeritaAcara = computed(() => {
  if (!item.value) return false;
  return ['DISETUJUI_ATASAN', 'DISETUJUI_VERIFIKASI_TERAKHIR', 'DIKIRIM', 'BERKAS_FISIK_SESUAI', 'DISETUJUI_PERSETUJUAN_TU', 'DISETUJUI_PERSETUJUAN_TERAKHIR_TU', 'ARSIP_INAKTIF_DITERIMA', 'SELESAI'].includes(item.value.status);
});

const timelineSteps = computed(() => {
  if (!item.value) return [];
  const order: TransferInactiveFileStatus[] = ['DRAFT', 'MENUNGGU_VERIFIKASI_ATASAN', 'DISETUJUI_ATASAN', 'MENUNGGU_VERIFIKASI_TERAKHIR', 'DISETUJUI_VERIFIKASI_TERAKHIR', 'DIKIRIM', 'BERKAS_FISIK_SESUAI', 'DISETUJUI_PERSETUJUAN_TU', 'DISETUJUI_PERSETUJUAN_TERAKHIR_TU', 'ARSIP_INAKTIF_DITERIMA', 'PENATAAN_ARSIP_INAKTIF', 'SELESAI'];
  const labels: Record<string, string> = {
    DRAFT: 'Draft', MENUNGGU_VERIFIKASI_ATASAN: 'Verifikasi Atasan', DISETUJUI_ATASAN: 'Disetujui Atasan — Menunggu Verifikasi Terakhir',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'Verifikasi Terakhir Atasan', DISETUJUI_VERIFIKASI_TERAKHIR: 'Disetujui Verifikasi Terakhir',
    DIKIRIM: 'Dikirim ke Unit Tata Naskah', BERKAS_FISIK_SESUAI: 'Berkas Sesuai', DISETUJUI_PERSETUJUAN_TU: 'Disetujui TU',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Disetujui Final TU', ARSIP_INAKTIF_DITERIMA: 'Arsip Diterima',
    PENATAAN_ARSIP_INAKTIF: 'Penataan', SELESAI: 'Selesai',
  };
  const units: Record<string, string> = {
    DRAFT: 'Unit Kerja', MENUNGGU_VERIFIKASI_ATASAN: 'Unit Kerja', DISETUJUI_ATASAN: 'Unit Kerja',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'Unit Kerja', DISETUJUI_VERIFIKASI_TERAKHIR: 'Unit Kerja', DIKIRIM: 'Unit Kerja → Unit Tata Naskah',
    BERKAS_FISIK_SESUAI: 'Unit Tata Naskah', DISETUJUI_PERSETUJUAN_TU: 'Unit Tata Naskah',
    DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Unit Tata Naskah', ARSIP_INAKTIF_DITERIMA: 'Unit Tata Naskah',
    PENATAAN_ARSIP_INAKTIF: 'Unit Tata Naskah', SELESAI: 'Unit Tata Naskah',
  };
  const currentIdx = order.indexOf(item.value.status);
  return order.map((s, i) => ({ status: s, label: labels[s] || s, unit: units[s] || '', done: i < currentIdx, active: i === currentIdx }));
});

const statusBadge = (s: TransferInactiveFileStatus) => {
  const m: Record<string, string> = {
    DRAFT: 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300',
    MENUNGGU_VERIFIKASI_ATASAN: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DITOLAK_ATASAN: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    DISETUJUI_ATASAN: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    MENUNGGU_VERIFIKASI_TERAKHIR: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    DISETUJUI_VERIFIKASI_TERAKHIR: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    DIKIRIM: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    BERKAS_FISIK_SESUAI: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    DISETUJUI_PERSETUJUAN_TU: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    ARSIP_INAKTIF_DITERIMA: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    SELESAI: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  };
  return `px-2 py-0.5 text-xs rounded-full font-medium ${m[s] || m.DRAFT}`;
};

const statusLabel = (s: TransferInactiveFileStatus) => {
  const m: Record<string, string> = { DRAFT: 'Draft', MENUNGGU_VERIFIKASI_ATASAN: 'Menunggu Verifikasi', DITOLAK_ATASAN: 'Ditolak', DISETUJUI_ATASAN: 'Disetujui Atasan — Menunggu Verifikasi Terakhir', MENUNGGU_VERIFIKASI_TERAKHIR: 'Menunggu Verifikasi Terakhir', DISETUJUI_VERIFIKASI_TERAKHIR: 'Disetujui Verifikasi Terakhir', DIKIRIM: 'Dikirim', MENUNGGU_VERIFIKASI_BERKAS_FISIK: 'Menunggu Verifikasi Berkas', BERKAS_FISIK_TIDAK_SESUAI: 'Berkas Tidak Sesuai', BERKAS_FISIK_SESUAI: 'Berkas Sesuai', MENUNGGU_VERIFIKASI_PERSETUJUAN_TU: 'Menunggu Persetujuan TU', DITOLAK_PERSETUJUAN_TU: 'Ditolak TU', DISETUJUI_PERSETUJUAN_TU: 'Disetujui TU', MENUNGGU_PERSETUJUAN_TERAKHIR_TU: 'Menunggu Persetujuan Terakhir TU', DITOLAK_PERSETUJUAN_TERAKHIR_TU: 'Ditolak Final TU', DISETUJUI_PERSETUJUAN_TERAKHIR_TU: 'Disetujui Final TU', ARSIP_INAKTIF_DITERIMA: 'Arsip Diterima', PENATAAN_ARSIP_INAKTIF: 'Penataan', SELESAI: 'Selesai' };
  return m[s] || s;
};

const formatDate = (d: string | Date | null) => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const loadDetail = async () => {
  loading.value = true;
  try { item.value = await fetchDetail(route.params.id as string); } catch (e) { console.error('Gagal:', e); }
  finally { loading.value = false; }
};
const refresh = async () => { item.value = await fetchDetail(route.params.id as string); };

const act = async (fn: () => Promise<any>) => {
  actionLoading.value = true;
  try { await fn(); await refresh(); } catch (e) { alert('Gagal'); } finally { actionLoading.value = false; }
};

const onSend = () => act(() => send(item.value!.id));
const onApprove = () => act(() => approve(item.value!.id, { verifyNote: verifyNote.value }));
const onReject = () => { const n = prompt('Alasan penolakan?'); if (n) act(() => reject(item.value!.id, { rejectedNote: n })); };
const onFinalVerify = () => act(() => finalVerify(item.value!.id, { finalVerifyNote: finalVerifyNote.value }));
const onDispatch = () => act(() => dispatch(item.value!.id));
const onVerifyPhysical = (sesuai: boolean) => act(() => verifyPhysical(item.value!.id, { checklist: { ...checklist }, physicalVerificationNote: physicalNote.value, sesuai }));
const onTuApprove = () => act(() => tuApprove(item.value!.id, {}));
const onTuReject = () => { const n = prompt('Alasan penolakan TU?'); if (n) act(() => tuReject(item.value!.id, { rejectedNote: n })); };
const onTuFinalApprove = () => act(() => tuFinalApprove(item.value!.id, {}));
const onTuFinalReject = () => { const n = prompt('Alasan penolakan final TU?'); if (n) act(() => tuFinalReject(item.value!.id, { rejectedNote: n })); };
const onReceive = () => act(() => receive(item.value!.id));
const onArrange = () => act(() => arrange(item.value!.id));
const onComplete = () => act(() => complete(item.value!.id));
const onGenerateBA = () => act(() => generateBeritaAcara(item.value!.id));

onMounted(() => loadDetail());
</script>