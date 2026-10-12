<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="`Detail Pemindahan ${usulan?.nomorUsulan ?? ''}`"
        :items="items"
      />
      <NuxtLink
        to="/pemeliharaan/pemindahan"
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

      <!-- Alur detail satu kolom agar urutan verifikasi mudah diikuti. -->
      <div class="mx-auto w-full max-w-none space-y-5">
          <VerifikasiDetail
            :usulan="usulan"
            :daftar-arsip="daftarIsi"
            :daftar-isi="daftarIsiNaskah"
            :unit-kerja="beritaAcaraData?.unitKerjaPengusul || usulanToTransfer.divisiName"
            :description-next-to-number="true"
          />

          <TimelineRiwayat :item="usulanToTransfer" />

          <!-- Tombol Aksi di bawah card verifikasi -->
          <div v-if="canVerify || canFinalVerify || canKirimTU" class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
              <UIcon v-else name="i-lucide-check" class="w-4 h-4 mr-1 inline" /> Terima
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
      :confirm-label="approveMode === 'finalVerify' ? 'Pindah Usulan' : 'Terima'"
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
import RejectModal from '~/components/verifikasi-usulan/RejectModal.vue';
import ApproveUsulanModal from '~/components/verifikasi-usulan/ApproveUsulanModal.vue';
import SendToTUModal from '~/components/verifikasi-usulan/SendToTUModal.vue';
import type { VerifikasiUsulanItem, JenisUsulan } from '~/types/verifikasi-usulan';
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';
import { formatDate } from '~/utils/transfer-status';

definePageMeta({ middleware: ['auth', 'atasan-managerial-secretary-only'] });

const route = useRoute();
const { user } = useAuth();

if (route.path.startsWith('/maintenance/verifikasi-usulan/')) {
  await navigateTo(
    route.fullPath.replace('/maintenance/verifikasi-usulan', '/pemeliharaan/pemindahan'),
    { replace: true },
  );
}

const {
  fetchDetail,
  verify,
  finalVerify,
  reject: rejectUsulan,
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
const daftarIsiNaskah = ref<any[]>([]);
const beritaAcaraData = ref<any>({});
const checklistBerkasFisik = ref(false);
const checklistBeritaAcara = ref(false);

const canSendToTU = computed(() => checklistBerkasFisik.value && checklistBeritaAcara.value);

const { apiGet } = useApi();
const loadDaftarIsi = async () => {
  try {
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/daftar-isi`, {}, { skipCache: true });
    const data = res?.data?.data ?? res?.data ?? res;
    daftarIsi.value = Array.isArray(data?.daftarBerkas) ? data.daftarBerkas : [];
    daftarIsiNaskah.value = Array.isArray(data?.daftarIsi) ? data.daftarIsi : [];
  } catch {
    daftarIsi.value = [];
    daftarIsiNaskah.value = [];
  }
};
const loadBeritaAcaraData = async () => {
  try {
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/berita-acara-data`, {}, { skipCache: true });
    beritaAcaraData.value = res?.data ?? {};
  } catch (error) {
    console.error('Gagal memuat data Berita Acara:', error);
    beritaAcaraData.value = {};
  }
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
  bacPihakPertamaPersnum: usulan.value?.bacPihakPertamaPersnum ?? null,
  bacPihakPertamaName: usulan.value?.bacPihakPertamaName ?? null,
  bacPihakPertamaJabatan: usulan.value?.bacPihakPertamaJabatan ?? null,
  bacPihakKeduaPersnum: usulan.value?.bacPihakKeduaPersnum ?? null,
  bacPihakKeduaName: usulan.value?.bacPihakKeduaName ?? null,
  bacPihakKeduaJabatan: usulan.value?.bacPihakKeduaJabatan ?? null,
  bacSignedAt: usulan.value?.bacSignedAt ?? null,
  bacSignedBy: usulan.value?.bacSignedBy ?? null,
  bacSignatureQr: usulan.value?.bacSignatureQr ?? null,
  bacPihakKeduaSignedAt: usulan.value?.bacPihakKeduaSignedAt ?? null,
  bacPihakKeduaSignedBy: usulan.value?.bacPihakKeduaSignedBy ?? null,
  bacPihakKeduaSignatureQr: usulan.value?.bacPihakKeduaSignatureQr ?? null,
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
  { label: 'Kelola', to: '/kelola' },
  { label: 'Pemeliharaan', to: '/pemeliharaan' },
  { label: 'Pemindahan', to: '/pemeliharaan/pemindahan' },
  { label: usulan.value?.nomorUsulan ?? 'Detail', to: `/pemeliharaan/pemindahan/${route.params.id}` },
]);

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
  const levels = usulan.value.approvalLevels;
  if (!levels || levels.length === 0) return false;
  return levels.some((l) => Number(l.atasanPersnum) === Number(user.value.persnum));
});

/**
 * Cek giliran dari approvalLevels (fallback jika checkIsCurrentTurn gagal).
 * User sedang giliran jika ada level dengan urutan = currentApprovalLevel,
 * status MENUNGGU, dan atasanPersnum = user login.
 * Jika approvalLevels tidak ada (legacy), cek atasanPersnum langsung untuk 1-level.
 */
const isCurrentTurnFromLevels = computed(() => {
  if (!usulan.value || !user.value) return false;
  const levels = usulan.value.approvalLevels;
  const currentLevel = usulan.value.currentApprovalLevel ?? 1;
  // Jika ada approvalLevels, cek dari sana
  if (levels && levels.length > 0) {
    const level = levels.find((l) => l.urutan === currentLevel);
    if (!level) return false;
    return (
      level.status === 'MENUNGGU' &&
      Number(level.atasanPersnum) === Number(user.value.persnum)
    );
  }
  // Fallback: jika tidak ada approvalLevels (legacy/single atasan),
  // cek atasanPersnum langsung dari usulan
  if (usulan.value.atasanPersnum) {
    return Number(usulan.value.atasanPersnum) === Number(user.value.persnum);
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
 * Aksi ini hanya boleh dilakukan oleh verifikator terakhir. */
const canFinalVerify = computed(() => {
  if (!usulan.value || isOwnUsulan.value) return false;
  if (usulan.value.status !== 'MENUNGGU_VERIFIKASI_TERAKHIR') return false;
  // Cek apakah user login adalah verifikator terakhir.
  const levels = usulan.value.approvalLevels;
  if (levels && levels.length > 0 && user.value) {
    const finalLevel = levels[levels.length - 1];
    return Number(finalLevel.atasanPersnum) === Number(user.value.persnum);
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
 * Hanya verifikator terakhir yang bisa meneruskan usulan ke TU. */
const canKirimTU = computed(() => {
  if (!usulan.value || !user.value) return false;
  if (usulan.value.status !== 'DISETUJUI_VERIFIKASI_TERAKHIR') return false;
  // Sekretaris tidak boleh kirim ke TU
  if (isOwnUsulan.value) return false;
  // Cek apakah user login adalah verifikator terakhir.
  const levels = usulan.value.approvalLevels;
  if (levels && levels.length > 0) {
    const finalLevel = levels[levels.length - 1];
    return Number(finalLevel.atasanPersnum) === Number(user.value.persnum);
  }
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
  if (!confirm('Setujui penerimaan arsip ini? Usulan akan diselesaikan.')) return;
  act(() => approveReceipt(usulan.value!.id, jenis.value));
};

onMounted(() => loadDetail());
</script>

<style scoped>
.ba-title {
  text-align: center;
  font-size: 1.05rem;
  line-height: 1.45;
  text-transform: uppercase;
}

.ba-title p {
  margin: 0;
}

.ba-number {
  margin-top: 0.9rem !important;
  font-size: 0.95rem;
  text-transform: none;
}

.ba-intro {
  margin: 1.5rem 0 1.1rem;
  text-align: justify;
}

.ba-party {
  margin-bottom: 1.35rem;
}

.ba-party p {
  margin: 0;
}

.ba-party p strong {
  display: inline-block;
  width: 7.25rem;
}

.ba-party-note {
  margin: 0.75rem 0 0 7.25rem !important;
  text-align: justify;
}

.ba-body {
  margin: 1.75rem 0 1.25rem;
  text-align: justify;
}

.ba-archive-list {
  margin-bottom: 1.8rem;
}

.ba-archive-list p {
  margin: 0 0 0.35rem;
}

.ba-archive-list ol {
  margin: 0;
  padding-left: 1.75rem;
}

.ba-archive-list li {
  margin-bottom: 0.25rem;
}

.ba-signature-date {
  margin-bottom: 2rem;
  text-align: right;
}

.ba-signatures {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  text-align: center;
}

.ba-signatures p {
  margin: 0;
}

.ba-signature-role {
  min-height: 1.4rem;
}

.ba-signature-space {
  height: 3.4rem;
}

@media (max-width: 640px) {
  .berita-acara-a4 {
    min-height: auto;
    padding: 1.25rem;
  }

  .ba-party p strong {
    width: 6.5rem;
  }

  .ba-party-note {
    margin-left: 0 !important;
  }

  .ba-signatures {
    gap: 1rem;
  }
}
</style>
