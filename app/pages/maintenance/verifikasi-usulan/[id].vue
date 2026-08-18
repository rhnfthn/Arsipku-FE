<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="`Detail Usulan ${usulan?.nomorUsulan ?? ''}`"
        :items="items"
      />
      <NuxtLink
        to="/maintenance/verifikasi-usulan"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors shrink-0"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <!-- Content -->
    <template v-else-if="usulan">
      <!-- Peringatan usulan sendiri -->
      <div
        v-if="isOwnUsulan"
        class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-5 mb-5"
      >
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <h3 class="text-base font-semibold text-red-700 dark:text-red-300 mb-1">Aksi Tidak Diizinkan</h3>
            <p class="text-sm text-red-600 dark:text-red-400">Anda tidak boleh memverifikasi usulan yang Anda buat sendiri sebagai Sekretaris.</p>
          </div>
        </div>
      </div>

      <!-- 2-column layout: info+timeline+aksi (left) + timeline (right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Left: Informasi Usulan + Timeline + Tombol Aksi (8/12) -->
        <div class="lg:col-span-8 space-y-5">
          <VerifikasiDetail :usulan="usulan" :daftar-arsip="daftarIsi" />

          <!-- ─── Card: Daftar Isi ─── -->
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Daftar Isi</h3>
              <button @click="printDaftarIsi" class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <UIcon name="i-lucide-printer" class="w-3.5 h-3.5" /> Print
              </button>
            </div>
            <div id="daftar-isi-print" class="text-sm">
              <p class="font-semibold text-gray-900 dark:text-white mb-3">{{ usulan.nomorUsulan }}</p>
              <table class="w-full border-collapse text-xs">
                <thead>
                  <tr class="border-b-2 border-gray-300 dark:border-gray-500">
                    <th class="text-left py-2 px-2 text-gray-500 w-10">No</th>
                    <th class="text-left py-2 px-2 text-gray-500">Kode Berkas</th>
                    <th class="text-left py-2 px-2 text-gray-500">Nama Berkas</th>
                    <th class="text-center py-2 px-2 text-gray-500 w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(d, idx) in daftarIsi" :key="idx" class="border-b border-gray-100 dark:border-gray-700">
                    <td class="py-2 px-2 text-gray-600 dark:text-gray-300">{{ d.no }}</td>
                    <td class="py-2 px-2 text-gray-700 dark:text-gray-200">{{ d.kode ?? '-' }}</td>
                    <td class="py-2 px-2 text-gray-700 dark:text-gray-200">{{ d.namaBerkas }}</td>
                    <td class="text-center py-2 px-2">
                      <NuxtLink
                        v-if="d.id"
                        :to="`/maintenance/preview-berkas/${d.id}?nomor_usulan=${usulan?.nomorUsulan ?? ''}&usulan_id=${usulan?.id ?? ''}`"
                        class="inline-flex rounded-md p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30"
                        title="Lihat detail berkas"
                      >
                        <UIcon name="i-lucide-eye" class="w-4 h-4" />
                      </NuxtLink>
                    </td>
                  </tr>
                  <tr v-if="daftarIsi.length === 0">
                    <td colspan="4" class="py-4 text-center text-gray-400 italic">Tidak ada arsip</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Berita Acara Serah Terima (hanya tampil setelah verifikasi disetujui) -->
          <div
            v-if="showBeritaAcara"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Berita Acara Serah Terima</h3>
              <div class="flex gap-2">
                <button @click="printBeritaAcara" class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <UIcon name="i-lucide-printer" class="w-3.5 h-3.5" /> Print
                </button>
                <button @click="downloadBeritaAcara" class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors">
                  <UIcon name="i-lucide-download" class="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            </div>
            <div id="berita-acara-print" class="text-sm" style="font-family: 'Times New Roman', serif;">
              <p class="font-bold text-center text-base mb-1">BERITA ACARA SERAH TERIMA PEKERJAAN</p>
              <p class="text-center text-xs mb-3">Nomor: {{ usulan.nomorUsulan }}</p>
              <p class="text-center text-xs text-gray-500 mb-4">Tanggal: {{ formatDate(usulan.tanggalUsulan) }}</p>

              <p class="text-xs leading-relaxed mb-4">
                Pada hari ini {{ hariIni }} tanggal {{ formatTanggalLengkap(usulan.tanggalUsulan) }}, yang bertanda tangan di bawah ini:
              </p>

              <div class="space-y-3 mb-4 text-xs">
                <div>
                  <p><span class="font-semibold">1. Nama</span> &nbsp;&nbsp;&nbsp;: {{ beritaAcaraData.atasan?.nama ?? usulan.atasanName ?? '-' }}</p>
                  <p><span class="font-semibold">&nbsp;&nbsp;&nbsp;Jabatan</span> : {{ beritaAcaraData.atasan?.jabatan ?? '-' }}</p>
                  <p class="text-gray-500 italic">Selanjutnya disebut pihak pertama</p>
                </div>
                <div>
                  <p><span class="font-semibold">2. Nama</span> &nbsp;&nbsp;&nbsp; :</p>
                  <p><span class="font-semibold">&nbsp;&nbsp;&nbsp;Jabatan</span> :</p>
                  <p class="text-gray-500 italic">Selanjutnya disebut pihak kedua</p>
                </div>
              </div>

              <p class="text-xs leading-relaxed mb-3">Dengan ini menerangkan bahwa:</p>
              <p class="text-xs leading-relaxed mb-3">
                Pihak pertama telah menyerahkan kepada pihak kedua berupa:
              </p>
              <ol class="list-decimal list-inside text-xs space-y-1 mb-4 ml-2">
                <li v-for="(a, idx) in beritaAcaraData.daftarArsip" :key="idx">
                  {{ a.kode ?? '-' }} — {{ a.perihal }}
                </li>
                <li v-if="beritaAcaraData.keterangan">{{ beritaAcaraData.keterangan }}</li>
              </ol>

              <p class="text-xs leading-relaxed mb-6">
                Demikian Berita Acara serah terima ini dibuat rangkap 2 untuk dapat digunakan sebagaimana mestinya.
              </p>

              <p class="text-xs text-right mb-6">{{ kotaIni }}, {{ formatTanggalLengkap(usulan.tanggalUsulan) }}</p>

              <div class="grid grid-cols-2 gap-8 text-xs">
                <div class="text-center">
                  <p class="font-semibold mb-16">Pihak Pertama</p>
                  <p class="border-t border-gray-400 pt-1 font-semibold">{{ beritaAcaraData.atasan?.nama ?? usulan.atasanName ?? '-' }}</p>
                  <p class="text-gray-500">{{ beritaAcaraData.atasan?.jabatan ?? '-' }}</p>
                </div>
                <div class="text-center">
                  <p class="font-semibold mb-16">Pihak Kedua</p>
                  <p class="border-t border-gray-400 pt-1 font-semibold">&nbsp;</p>
                  <p class="text-gray-500">&nbsp;</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Tombol Aksi di bawah card verifikasi -->
          <div v-if="canVerify || canFinalVerify || canKirimTU" class="flex items-center gap-2">
            <button
              @click="openRejectModal"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
            >
              <UIcon name="i-lucide-x" class="w-4 h-4 mr-1 inline" /> Tolak
            </button>
            <button
              v-if="canVerify"
              @click="onApprove"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 transition-colors"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Kirim
            </button>
            <button
              v-if="canFinalVerify"
              @click="onFinalVerify"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 transition-colors"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Pindah Usulan
            </button>
            <button
              v-if="canKirimTU"
              @click="onKirimTU"
              :disabled="actionLoading"
              class="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 transition-colors"
            >
              <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              <UIcon v-else name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Pindah Usulan
            </button>
          </div>

          <!-- Status info (read-only) -->
          <div
            v-if="usulan.status === 'MENUNGGU_VERIFIKASI_ATASAN' && !canVerify"
            class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-clock" class="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                  {{ (isCurrentTurn || isCurrentTurnFromLevels) ? 'Menunggu Verifikasi Anda' : 'Menunggu Verifikasi Atasan Lain' }}
                </h3>
                <p class="text-sm text-yellow-600 dark:text-yellow-400">
                  <template v-if="isCurrentTurn || isCurrentTurnFromLevels">
                    Usulan dari {{ usulan.sekretarisName }} menunggu verifikasi Anda.
                  </template>
                  <template v-else>
                    Usulan dari {{ usulan.sekretarisName }} sedang menunggu verifikasi atasan tahap {{ usulan.currentApprovalLevel }} dari {{ usulan.totalApprovalLevels }}.
                  </template>
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="usulan.status === 'DITOLAK_ATASAN' || usulan.status === 'DITOLAK_VERIFIKASI_TERAKHIR'"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-red-700 dark:text-red-300 mb-1">Usulan Ditolak</h3>
                <p class="text-sm text-red-600 dark:text-red-400">{{ usulan.rejectedNote ?? 'Tidak ada catatan' }}</p>
              </div>
            </div>
          </div>

          <div
            v-if="usulan.status === 'SELESAI'"
            class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Usulan Selesai</h3>
                <p class="text-sm text-green-600 dark:text-green-400">Proses pemindahan arsip selesai.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Timeline Riwayat (4/12, sticky) -->
        <div class="lg:col-span-4">
          <div class="lg:sticky lg:top-5 space-y-5">
            <TimelineRiwayat :item="usulanToTransfer" />
          </div>
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      Usulan tidak ditemukan
    </div>

    <!-- Reject Modal -->
    <RejectModal v-model="isRejectModalOpen" @confirm="onReject" />

    <!-- Approve Modal -->
    <ApproveUsulanModal
      v-model="isApproveModalOpen"
      :usulan="usulan"
      :title="approveMode === 'finalVerify' ? 'Konfirmasi Verifikasi Terakhir' : 'Konfirmasi Verifikasi'"
      :confirm-label="approveMode === 'finalVerify' ? 'Pindah Usulan' : 'Kirim'"
      @confirm="onConfirmApprove"
    />

    <!-- Send to TU Modal -->
    <SendToTUModal
      v-model="isSendToTUModalOpen"
      :usulan="usulan"
      :loading="actionLoading"
      @confirm="onConfirmKirimTU"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useVerifikasiUsulan } from '~/composables/useVerifikasiUsulan';
import { useAuth } from '~/composables/useAuth';
import { useApi } from '~/composables/useApi';
import VerifikasiDetail from '~/components/verifikasi-usulan/VerifikasiDetail.vue';
import TimelineRiwayat from '~/components/transfer-active-to-inactive/TimelineRiwayat.vue';
import BeritaAcaraCard from '~/components/verifikasi-usulan/BeritaAcaraCard.vue';
import RejectModal from '~/components/verifikasi-usulan/RejectModal.vue';
import ApproveUsulanModal from '~/components/verifikasi-usulan/ApproveUsulanModal.vue';
import SendToTUModal from '~/components/verifikasi-usulan/SendToTUModal.vue';
import type { VerifikasiUsulanItem, JenisUsulan } from '~/types/verifikasi-usulan';
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';
import { formatDate } from '~/utils/transfer-status';

definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const { user } = useAuth();
const {
  fetchDetail,
  verify,
  finalVerify,
  reject: rejectUsulan,
  generateBeritaAcara,
  kirimUsulPindah,
  siapkanBerkasFisik,
  uploadBerkas,
  selesaikanUsulan,
  approveReceipt,
  checkIsCurrentTurn,
} = useVerifikasiUsulan();

const usulan = ref<VerifikasiUsulanItem | null>(null);
const loading = ref(true);
const actionLoading = ref(false);
const showRiwayat = ref(true);
const isRejectModalOpen = ref(false);
const isApproveModalOpen = ref(false);
const isSendToTUModalOpen = ref(false);
const approveMode = ref<'verify' | 'finalVerify'>('verify');
const berkasFisikUrl = ref('');
const beritaAcaraUrl = ref('');
const isCurrentTurn = ref(false);
const daftarIsi = ref<any[]>([]);
const beritaAcaraData = ref<any>({ atasan: {}, pengirim: {}, daftarArsip: [] });
const checklistBerkasFisik = ref(false);
const checklistBeritaAcara = ref(false);

const canSendToTU = computed(() => checklistBerkasFisik.value && checklistBeritaAcara.value);

const { apiGet } = useApi();

const hariIni = computed(() => {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return hari[new Date().getDay()];
});
const kotaIni = 'Jakarta';
const formatTanggalLengkap = (d: string | Date | null): string => {
  if (!d) return '-';
  const date = typeof d === 'string' ? new Date(d) : d;
  const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
};

const loadDaftarIsi = async () => {
  try {
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/daftar-isi`, {}, { skipCache: true });
    daftarIsi.value = res?.data?.daftarIsi ?? [];
  } catch { daftarIsi.value = []; }
};
const loadBeritaAcaraData = async () => {
  try {
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/berita-acara-data`, {}, { skipCache: true });
    beritaAcaraData.value = res?.data ?? { atasan: {}, pengirim: {}, daftarArsip: [] };
  } catch { beritaAcaraData.value = { atasan: {}, pengirim: {}, daftarArsip: [] }; }
};

const printDaftarIsi = () => {
  const el = document.getElementById('daftar-isi-print');
  if (!el) return;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>${usulan.value?.nomorUsulan ?? ''}</title><style>
    body{font-family:Arial,sans-serif;padding:30px;color:#111}
    .text-sm{font-size:13px}.text-xs{font-size:12px}.font-semibold{font-weight:600}
    .mb-3{margin-bottom:12px}.text-gray-500{color:#6b7280}.text-gray-600{color:#4b5563}
    .text-gray-700{color:#374151}.text-gray-400{color:#9ca3af}.text-center{text-align:center}
    .italic{font-style:italic}.w-full{width:100%}.w-10{width:40px}
    table{width:100%;border-collapse:collapse}
    th{border-bottom:2px solid #d1d5db;padding:8px;text-align:left;font-weight:600}
    td{border-bottom:1px solid #f3f4f6;padding:8px}
    .px-2{padding-left:8px;padding-right:8px}.py-2{padding-top:8px;padding-bottom:8px}
    .py-4{padding-top:16px;padding-bottom:16px}p{margin:0}
  </style></head><body>${el.innerHTML}</body></html>`);
  w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 250);
};
const printBeritaAcara = () => {
  const el = document.getElementById('berita-acara-print');
  if (!el) return;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Berita Acara Serah Terima</title><style>
    *{box-sizing:border-box}body{font-family:'Times New Roman',serif;padding:40px;max-width:800px;margin:0 auto;color:#111}
    .text-sm{font-size:13px}.text-xs{font-size:12px}.text-base{font-size:16px}
    .text-center{text-align:center}.text-right{text-align:right}
    .font-bold{font-weight:700}.font-semibold{font-weight:600}.italic{font-style:italic}
    .mb-1{margin-bottom:4px}.mb-3{margin-bottom:12px}.mb-4{margin-bottom:16px}
    .mb-6{margin-bottom:24px}.mb-16{margin-bottom:64px}.space-y-3>*+*{margin-top:12px}
    .space-y-1>*+*{margin-top:4px}.leading-relaxed{line-height:1.625}
    .text-gray-500{color:#6b7280}.ml-2{margin-left:8px}
    .grid{display:grid}.grid-cols-2{grid-template-columns:1fr 1fr}
    .gap-8{gap:32px}.border-t{border-top:1px solid #9ca3af}.pt-1{padding-top:4px}
    ol{padding-left:20px;margin:0}li{margin-bottom:4px}p{margin:0}
  </style></head><body>${el.innerHTML}</body></html>`);
  w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 250);
};
const downloadBeritaAcara = () => {
  window.open(`/transfer-active-to-inactive/${route.params.id}/berita-acara.pdf`, '_blank');
};

/** Mapping usulan ke format TransferActiveToInactive untuk TimelineRiwayat. */
const usulanToTransfer = computed<TransferActiveToInactive>(() => ({
  id: usulan.value?.id ?? '',
  nomorUsulan: usulan.value?.nomorUsulan ?? '',
  tanggalUsulan: usulan.value?.tanggalUsulan ?? '',
  sekretarisPersnum: usulan.value?.sekretarisPersnum ?? 0,
  sekretarisName: usulan.value?.sekretarisName ?? '',
  divisiId: null,
  divisiName: null,
  atasanPersnum: usulan.value?.atasanPersnum ?? 0,
  atasanName: usulan.value?.atasanName ?? '',
  atasanPositionId: null,
  currentApprovalLevel: usulan.value?.currentApprovalLevel ?? 1,
  totalApprovalLevels: usulan.value?.totalApprovalLevels ?? 1,
  tuPersnum: null,
  tuName: null,
  atasanTuPersnum: null,
  atasanTuName: null,
  arsipId: usulan.value?.arsipId ?? '',
  arsipPerihal: usulan.value?.arsipPerihal ?? '',
  arsipKode: usulan.value?.arsipKode ?? null,
  tanggalRetensiAktifHabis: usulan.value?.tanggalRetensiAktifHabis ?? null,
  arsipIds: null,
  keterangan: usulan.value?.keterangan ?? null,
  status: usulan.value?.status as any ?? 'DRAFT',
  rejectedNote: usulan.value?.rejectedNote ?? null,
  verifyNote: usulan.value?.verifyNote ?? null,
  approvedBy: null,
  approvedAt: usulan.value?.approvedAt ?? null,
  finalVerifiedBy: null,
  finalVerifiedAt: usulan.value?.finalVerifiedAt ?? null,
  finalVerifyNote: null,
  beritaAcaraUrl: usulan.value?.beritaAcaraUrl ?? null,
  beritaAcaraNomor: usulan.value?.beritaAcaraNomor ?? null,
  tanggalDikirim: null,
  physicalChecklist: null,
  physicalVerifiedBy: null,
  physicalVerifiedAt: null,
  physicalVerificationNote: null,
  tuApprovedBy: null,
  tuApprovedAt: null,
  tuFinalApprovedBy: null,
  tuFinalApprovedAt: null,
  receivedAt: null,
  arrangedAt: null,
  createdAt: usulan.value?.createdAt ?? '',
  updatedAt: usulan.value?.updatedAt ?? '',
}));

const jenis = computed<JenisUsulan>(() => {
  const j = route.query.jenis as string;
  return j === 'aktif_ke_inaktif' ? 'aktif_ke_inaktif' : 'inaktif';
});

const items = computed(() => [
  { label: 'Beranda', to: '/' },
  { label: 'Verifikasi Usulan', to: '/maintenance/verifikasi-usulan' },
  { label: usulan.value?.nomorUsulan ?? 'Detail', to: `/maintenance/verifikasi-usulan/${route.params.id}` },
]);

const showBeritaAcara = computed(() => {
  if (!usulan.value) return false;
  return ['MENUNGGU_VERIFIKASI_TERAKHIR', 'DISETUJUI_ATASAN', 'DISETUJUI_VERIFIKASI_TERAKHIR', 'DIKIRIM', 'SELESAI'].includes(usulan.value.status);
});

/** Riwayat aktor yang terlibat dalam usulan. */
const riwayatList = computed(() => {
  if (!usulan.value) return [];
  const u = usulan.value;
  const items: { label: string; oleh: string; tanggal: string }[] = [];

  // 1. Draft — Sekretaris
  items.push({
    label: 'Draft',
    oleh: u.sekretarisName ?? '-',
    tanggal: formatDate(u.tanggalUsulan),
  });

  // 2. Menunggu Persetujuan — Atasan Managerial Sekretaris
  if (u.approvalLevels && u.approvalLevels.length > 0) {
    for (const level of u.approvalLevels) {
      if (level.status === 'DISETUJUI' || u.status !== 'DRAFT') {
        items.push({
          label: level.status === 'DISETUJUI' ? 'Disetujui' : 'Menunggu Persetujuan',
          oleh: level.atasanName ?? '-',
          tanggal: level.verifiedAt ? formatDate(level.verifiedAt) : '-',
        });
      }
    }
  } else if (u.atasanName) {
    items.push({
      label: 'Menunggu Persetujuan',
      oleh: u.atasanName,
      tanggal: '-',
    });
  }

  // 3. Menunggu Verifikasi — Atasan Managerial Sekretaris (verifikasi terakhir)
  if (['MENUNGGU_VERIFIKASI_TERAKHIR', 'DISETUJUI_ATASAN', 'DISETUJUI_VERIFIKASI_TERAKHIR', 'DIKIRIM', 'SELESAI'].includes(u.status)) {
    items.push({
      label: 'Menunggu Verifikasi',
      oleh: u.atasanName ?? '-',
      tanggal: '-',
    });
  }

  // 4. Menunggu Penerimaan — TU
  if (u.tuName && ['DIKIRIM', 'SELESAI'].includes(u.status)) {
    items.push({
      label: 'Menunggu Penerimaan',
      oleh: u.tuName,
      tanggal: u.tanggalDikirim ? formatDate(u.tanggalDikirim) : '-',
    });
  }

  // 5. Atasan Managerial TU
  if (u.atasanTuName) {
    items.push({
      label: 'Verifikasi Atasan TU',
      oleh: u.atasanTuName,
      tanggal: '-',
    });
  }

  return items;
});

/** True jika usulan ini dibuat oleh user yang login sebagai Sekretaris. */
const isOwnUsulan = computed(() => {
  if (!usulan.value || !user.value) return false;
  return Number(usulan.value.sekretarisPersnum) === Number(user.value.persnum);
});

/** True jika user login ada di daftar atasan berjenjang (approvalLevels). */
const isAtasanInLevels = computed(() => {
  if (!usulan.value || !user.value) return false;
  const userPersnum = Number(user.value.persnum);
  const levels = usulan.value.approvalLevels;
  if (!levels || levels.length === 0) return false;
  return levels.some((l) => Number(l.atasanPersnum) === userPersnum);
});

/**
 * Cek giliran dari approvalLevels (fallback jika checkIsCurrentTurn gagal).
 * User sedang giliran jika ada level dengan urutan = currentApprovalLevel,
 * status MENUNGGU, dan atasanPersnum = user login.
 * Jika approvalLevels tidak ada (legacy), cek atasanPersnum langsung untuk 1-level.
 */
const isCurrentTurnFromLevels = computed(() => {
  if (!usulan.value || !user.value) return false;
  const userPersnum = Number(user.value.persnum);
  const levels = usulan.value.approvalLevels;
  const currentLevel = usulan.value.currentApprovalLevel ?? 1;
  // Jika ada approvalLevels, cek dari sana
  if (levels && levels.length > 0) {
    const level = levels.find((l) => l.urutan === currentLevel);
    if (!level) return false;
    return (
      level.status === 'MENUNGGU' &&
      Number(level.atasanPersnum) === userPersnum
    );
  }
  // Fallback: jika tidak ada approvalLevels (legacy/single atasan),
  // cek atasanPersnum langsung dari usulan
  if (usulan.value.atasanPersnum) {
    return Number(usulan.value.atasanPersnum) === userPersnum;
  }
  return false;
});

/** Bisa verifikasi hanya jika status Menunggu Persetujuan/Verifikasi, bukan usulan sendiri, DAN sedang giliran. */
const canVerify = computed(() => {
  if (!usulan.value || isOwnUsulan.value) return false;
  if (
    usulan.value.status !== 'MENUNGGU_VERIFIKASI_ATASAN' &&
    usulan.value.status !== 'DISETUJUI_ATASAN'
  ) return false;
  // Gunakan isCurrentTurn dari API, fallback ke cek dari approvalLevels
  return isCurrentTurn.value || isCurrentTurnFromLevels.value;
});

/** Verifikasi terakhir: atasan managerial saat status MENUNGGU_VERIFIKASI_TERAKHIR.
 * Hanya atasan LEVEL 1 (urutan=1) yang bisa final verify — bukan level terakhir.
 * Setelah semua level approve, usulan kembali ke level 1 untuk verifikasi final. */
const canFinalVerify = computed(() => {
  if (!usulan.value || isOwnUsulan.value) return false;
  if (usulan.value.status !== 'MENUNGGU_VERIFIKASI_TERAKHIR') return false;
  // Cek apakah user login adalah atasan level 1 (urutan=1)
  const levels = usulan.value.approvalLevels;
  if (levels && levels.length > 0 && user.value) {
    const firstLevel = levels.find((l) => l.urutan === 1);
    if (!firstLevel) return false;
    return Number(firstLevel.atasanPersnum) === Number(user.value.persnum);
  }
  // Fallback: single-atasan — cek atasanPersnum langsung
  if (usulan.value.atasanPersnum) {
    return Number(usulan.value.atasanPersnum) === Number(user.value.persnum);
  }
  // Fallback: single-atasan (totalApprovalLevels <= 1) — izinkan
  return (usulan.value.totalApprovalLevels ?? 1) <= 1;
});

/** Atasan Managerial TU bisa approve penerimaan saat status DIKIRIM (Menunggu Penerimaan). */
const canApproveReceipt = computed(() => {
  if (!usulan.value || isOwnUsulan.value) return false;
  if (usulan.value.status !== 'DIKIRIM') return false;
  // Hanya ADMIN/SUPERADMIN (Atasan TU) yang bisa approve receipt
  const role = (user.value?.activeRole?.name ?? user.value?.role ?? '').toUpperCase();
  return role === 'ADMIN' || role === 'SUPERADMIN';
});

/** Atasan Managerial bisa kirim ke TU saat verifikasi terakhir selesai (DISETUJUI_VERIFIKASI_TERAKHIR).
 * Hanya atasan managerial (bukan sekretaris) yang bisa kirim ke TU. */
const canKirimTU = computed(() => {
  if (!usulan.value || !user.value) return false;
  if (usulan.value.status !== 'DISETUJUI_VERIFIKASI_TERAKHIR') return false;
  // Sekretaris tidak boleh kirim ke TU
  if (isOwnUsulan.value) return false;
  // Atasan managerial (ada di approvalLevels) yang bisa kirim ke TU
  if (isAtasanInLevels.value) return true;
  // Fallback: single-atasan tanpa approvalLevels — cek atasanPersnum langsung
  if (usulan.value.atasanPersnum) {
    return Number(usulan.value.atasanPersnum) === Number(user.value.persnum);
  }
  return false;
});

const loadDetail = async () => {
  loading.value = true;
  try {
    usulan.value = await fetchDetail(route.params.id as string, jenis.value);
    // Cek apakah user sedang giliran
    if (
      usulan.value &&
      jenis.value === 'aktif_ke_inaktif' &&
      (usulan.value.status === 'MENUNGGU_VERIFIKASI_ATASAN' ||
       usulan.value.status === 'DISETUJUI_ATASAN')
    ) {
      isCurrentTurn.value = await checkIsCurrentTurn(usulan.value.id, jenis.value);
      // Fallback: jika API return false, cek dari approvalLevels atau atasanPersnum langsung
      if (!isCurrentTurn.value && user.value) {
        const levels = usulan.value.approvalLevels;
        const currentLevel = usulan.value.currentApprovalLevel ?? 1;
        if (levels && levels.length > 0) {
          const level = levels.find((l) => l.urutan === currentLevel);
          if (level && level.status === 'MENUNGGU') {
            isCurrentTurn.value = Number(level.atasanPersnum) === Number(user.value.persnum);
          }
        } else if (usulan.value.atasanPersnum) {
          // Legacy: tidak ada approvalLevels, cek atasanPersnum langsung
          isCurrentTurn.value = Number(usulan.value.atasanPersnum) === Number(user.value.persnum);
        }
      }
    } else {
      isCurrentTurn.value = false;
    }
    await Promise.all([loadDaftarIsi(), loadBeritaAcaraData()]);
  } catch (e) {
    console.error('Gagal memuat detail:', e);
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  usulan.value = await fetchDetail(route.params.id as string, jenis.value);
  if (
    usulan.value &&
    jenis.value === 'aktif_ke_inaktif' &&
    (usulan.value.status === 'MENUNGGU_VERIFIKASI_ATASAN' ||
     usulan.value.status === 'DISETUJUI_ATASAN')
  ) {
    isCurrentTurn.value = await checkIsCurrentTurn(usulan.value.id, jenis.value);
    // Fallback: jika API return false, cek dari approvalLevels atau atasanPersnum langsung
    if (!isCurrentTurn.value && user.value) {
      const levels = usulan.value.approvalLevels;
      const currentLevel = usulan.value.currentApprovalLevel ?? 1;
      if (levels && levels.length > 0) {
        const level = levels.find((l) => l.urutan === currentLevel);
        if (level && level.status === 'MENUNGGU') {
          isCurrentTurn.value = Number(level.atasanPersnum) === Number(user.value.persnum);
        }
      } else if (usulan.value.atasanPersnum) {
        // Legacy: tidak ada approvalLevels, cek atasanPersnum langsung
        isCurrentTurn.value = Number(usulan.value.atasanPersnum) === Number(user.value.persnum);
      }
    }
  } else {
    isCurrentTurn.value = false;
  }
  await Promise.all([loadDaftarIsi(), loadBeritaAcaraData()]);
};

const act = async (fn: () => Promise<any>) => {
  actionLoading.value = true;
  try {
    await fn();
    await refresh();
  } catch (e) {
    console.error('Gagal:', e);
    alert('Gagal melakukan aksi.');
  } finally {
    actionLoading.value = false;
  }
};

const onApprove = () => {
  approveMode.value = 'verify';
  isApproveModalOpen.value = true;
};

const onFinalVerify = () => {
  approveMode.value = 'finalVerify';
  isApproveModalOpen.value = true;
};

const onConfirmApprove = (catatan: string) => {
  if (approveMode.value === 'finalVerify') {
    act(() => finalVerify(usulan.value!.id, jenis.value, { catatanVerifikasi: catatan }));
  } else {
    act(() => verify(usulan.value!.id, jenis.value, { catatanVerifikasi: catatan }));
  }
};

const openRejectModal = () => {
  isRejectModalOpen.value = true;
};

const onReject = (alasan: string) => {
  act(() => rejectUsulan(usulan.value!.id, jenis.value, { alasanPenolakan: alasan }));
};

const onGenerateBA = () => act(() => generateBeritaAcara(usulan.value!.id, jenis.value));

const onKirimUsulPindah = () => {
  if (!confirm('Kirim usul pindah arsip inaktif ke Unit Tata Naskah?')) return;
  act(() => kirimUsulPindah(usulan.value!.id, jenis.value));
};

const onKirimTU = () => {
  isSendToTUModalOpen.value = true;
};

const onConfirmKirimTU = (catatan: string) => {
  isSendToTUModalOpen.value = false;
  act(() => kirimUsulPindah(usulan.value!.id, jenis.value));
};

const onSiapkanBerkasFisik = () => {
  if (!confirm('Lanjutkan ke siapkan berkas fisik?')) return;
  act(() => siapkanBerkasFisik(usulan.value!.id, jenis.value));
};

const onUploadBerkasFisik = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    berkasFisikUrl.value = target.files[0].name;
    // TODO: Upload file ke storage dan dapatkan URL
    // Sementara simpan nama file
    act(() => uploadBerkas(usulan.value!.id, jenis.value, { berkasFisikUrl: target.files![0].name }));
  }
};

const onUploadBeritaAcara = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    beritaAcaraUrl.value = target.files[0].name;
    act(() => uploadBerkas(usulan.value!.id, jenis.value, { beritaAcaraSerahTerimaUrl: target.files![0].name }));
  }
};

const onSelesaikan = () => {
  if (!confirm('Selesaikan proses? Pastikan berkas fisik dan berita acara sudah diupload.')) return;
  act(() => selesaikanUsulan(usulan.value!.id, jenis.value));
};

const onApproveReceipt = () => {
  if (!confirm('Setujui penerimaan usulan ini? Usulan akan diselesaikan.')) return;
  act(() => approveReceipt(usulan.value!.id, jenis.value));
};

onMounted(() => loadDetail());
</script>