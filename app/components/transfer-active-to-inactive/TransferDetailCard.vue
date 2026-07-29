<template>
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Usulan</h3>
      <span :class="statusBadgeClass(transfer.status)">{{ statusLabel(transfer.status) }}</span>
    </div>
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
        <span class="text-gray-500 dark:text-gray-400 text-xs">Pengusul (Sekretaris)</span>
        <p class="text-gray-900 dark:text-white font-medium">{{ transfer.sekretarisName }}</p>
      </div>
      <div>
        <span class="text-gray-500 dark:text-gray-400 text-xs">Divisi</span>
        <p class="text-gray-900 dark:text-white font-medium">{{ transfer.divisiName ?? '-' }}</p>
      </div>
      <div>
        <span class="text-gray-500 dark:text-gray-400 text-xs">Atasan Managerial</span>
        <p class="text-gray-900 dark:text-white font-medium">{{ transfer.atasanName }}</p>
        <p v-if="transfer.totalApprovalLevels && transfer.totalApprovalLevels > 1" class="text-xs text-gray-400 mt-0.5">
          Tahap {{ transfer.currentApprovalLevel }} dari {{ transfer.totalApprovalLevels }}
        </p>
      </div>
      <div>
        <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Retensi Habis</span>
        <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(transfer.tanggalRetensiAktifHabis) }}</p>
      </div>
      <div class="md:col-span-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Perihal Arsip</span>
        <p class="text-gray-900 dark:text-white font-medium">{{ transfer.arsipPerihal }}</p>
        <p v-if="transfer.arsipKode" class="text-xs text-gray-400 mt-0.5">Kode: {{ transfer.arsipKode }}</p>
      </div>

      <!-- Daftar Atasan Berjenjang -->
      <div v-if="transfer.approvalLevels && transfer.approvalLevels.length > 0" class="md:col-span-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Daftar Atasan Verifikasi (Berjenjang)</span>
        <div class="mt-2 space-y-2">
          <div
            v-for="level in transfer.approvalLevels"
            :key="level.id"
            class="flex items-center gap-3 p-2.5 rounded-lg border"
            :class="levelStatusClass(level.status)"
          >
            <div class="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 shrink-0">
              {{ level.urutan }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ level.atasanName }}</p>
              <p v-if="level.atasanPositionText" class="text-xs text-gray-500 dark:text-gray-400">{{ level.atasanPositionText }}</p>
            </div>
            <span :class="levelBadgeClass(level.status)" class="text-xs px-2 py-0.5 rounded-full font-medium shrink-0">
              {{ levelStatusLabel(level.status) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Daftar Arsip (Multi-arsip) -->
      <div v-if="transfer.arsipIds && transfer.arsipIds.length > 1" class="md:col-span-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Daftar Arsip ({{ transfer.arsipIds.length }})</span>
        <div class="mt-2 space-y-1.5">
          <div
            v-for="(a, idx) in transfer.arsipIds"
            :key="a.id"
            class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <span class="text-xs font-semibold text-gray-400">{{ idx + 1 }}.</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900 dark:text-white truncate">{{ a.kode ?? '-' }} — {{ a.perihal }}</p>
            </div>
          </div>
        </div>
      </div>
      <div v-if="transfer.keterangan" class="md:col-span-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Keterangan</span>
        <p class="text-gray-900 dark:text-white text-sm mt-1 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">{{ transfer.keterangan }}</p>
      </div>
      <div v-if="transfer.rejectedNote" class="md:col-span-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Penolakan</span>
        <p class="text-red-600 dark:text-red-400 text-sm mt-1 bg-red-50 dark:bg-red-900/20 p-2 rounded">{{ transfer.rejectedNote }}</p>
      </div>
      <div v-if="transfer.verifyNote" class="md:col-span-2">
        <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan Verifikasi</span>
        <p class="text-gray-700 dark:text-gray-300 text-sm mt-1 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">{{ transfer.verifyNote }}</p>
      </div>
    </div>

    <!-- ─── Section: Total Arsip ─── -->
    <div class="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Total Arsip</h4>
        <button @click="showTotalArsip = !showTotalArsip" class="text-xs text-[#457fb6] hover:underline">
          {{ showTotalArsip ? 'Sembunyikan' : 'Tampilkan' }}
        </button>
      </div>
      <div v-if="showTotalArsip" class="text-sm text-gray-600 dark:text-gray-300">
        <p>Total: <span class="font-semibold text-gray-900 dark:text-white">{{ totalArsip }} berkas</span></p>
      </div>
    </div>

    <!-- ─── Section: File Rincian ─── -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">File Rincian</h4>
        <button @click="showFileRincian = !showFileRincian" class="text-xs text-[#457fb6] hover:underline">
          {{ showFileRincian ? 'Sembunyikan' : 'Tampilkan' }}
        </button>
      </div>
      <div v-if="showFileRincian" class="space-y-2">
        <div v-if="fileRincian.length === 0" class="text-sm text-gray-400 italic">Tidak ada file</div>
        <div
          v-for="(f, idx) in fileRincian"
          :key="idx"
          class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
        >
          <UIcon name="i-lucide-file-text" class="w-4 h-4 text-gray-400 shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-900 dark:text-white truncate">{{ f.nama ?? f.naskahId }}</p>
            <p v-if="f.ukuran" class="text-xs text-gray-400">{{ f.ukuran }}</p>
          </div>
          <button
            v-if="f.url"
            @click="downloadFile(f)"
            class="text-xs text-[#457fb6] hover:underline shrink-0"
          >Download</button>
        </div>
      </div>
    </div>

    <!-- ─── Section: Riwayat ─── -->
    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between mb-2">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Riwayat</h4>
        <button @click="showRiwayat = !showRiwayat" class="text-xs text-[#457fb6] hover:underline">
          {{ showRiwayat ? 'Sembunyikan' : 'Tampilkan' }}
        </button>
      </div>
      <div v-if="showRiwayat" class="space-y-2">
        <div
          v-for="(r, idx) in riwayatList"
          :key="idx"
          class="flex items-start gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
        >
          <div class="w-2 h-2 rounded-full bg-[#457fb6] mt-1.5 shrink-0"></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span :class="statusBadgeClass(r.status)" class="text-[11px]">{{ statusLabel(r.status) }}</span>
              <span class="text-xs text-gray-400">{{ formatDate(r.tanggal) }}</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Oleh: {{ r.oleh ?? '-' }}</p>
            <p v-if="r.catatan" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Catatan: {{ r.catatan }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TransferActiveToInactive, ApprovalLevel } from '~/types/transfer-active-to-inactive';
import { statusBadgeClass, statusLabel, formatDate } from '~/utils/transfer-status';

const props = defineProps<{ transfer: TransferActiveToInactive }>();

const showTotalArsip = ref(true);
const showFileRincian = ref(true);
const showRiwayat = ref(true);

const totalArsip = computed(() => props.transfer.arsipIds?.length ?? 1);

const fileRincian = computed(() => {
  // Placeholder — file di-load dari endpoint /:id/files (TODO: fetch di parent)
  return [];
});

const riwayatList = computed(() => {
  const r: Array<{ status: any; tanggal: string | null; oleh: string | null; catatan: string | null }> = [];
  r.push({ status: 'DRAFT' as any, tanggal: props.transfer.createdAt, oleh: props.transfer.sekretarisName, catatan: null });
  if (props.transfer.approvedAt) {
    r.push({ status: 'DISETUJUI_ATASAN' as any, tanggal: props.transfer.approvedAt, oleh: props.transfer.atasanName, catatan: props.transfer.verifyNote });
  }
  if (props.transfer.finalVerifiedAt) {
    r.push({ status: 'DISETUJUI_VERIFIKASI_TERAKHIR' as any, tanggal: props.transfer.finalVerifiedAt, oleh: props.transfer.atasanName, catatan: props.transfer.finalVerifyNote });
  }
  if (props.transfer.tanggalDikirim) {
    r.push({ status: 'DIKIRIM' as any, tanggal: props.transfer.tanggalDikirim, oleh: props.transfer.sekretarisName, catatan: null });
  }
  if (props.transfer.tuFinalApprovedAt) {
    r.push({ status: 'SELESAI' as any, tanggal: props.transfer.tuFinalApprovedAt, oleh: props.transfer.atasanTuName, catatan: null });
  }
  if (props.transfer.rejectedNote) {
    r.push({ status: 'DITOLAK_ATASAN' as any, tanggal: props.transfer.updatedAt, oleh: props.transfer.atasanName, catatan: props.transfer.rejectedNote });
  }
  return r;
});

const downloadFile = (f: any) => {
  if (f.url) window.open(f.url, '_blank');
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