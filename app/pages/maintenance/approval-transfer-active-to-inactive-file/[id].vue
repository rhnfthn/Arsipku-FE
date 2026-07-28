<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="`Detail Usulan ${item?.nomorUsulan ?? ''}`"
        :items="items"
      />
      <NuxtLink
        to="/maintenance/approval-transfer-active-to-inactive-file"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition-colors"
      >
        <UIcon name="i-lucide-arrow-left" class="w-4 h-4" /> Kembali
      </NuxtLink>
    </div>

    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
      <div class="space-y-4 animate-pulse">
        <div class="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        <div class="h-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>

    <template v-else-if="item">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Left: Info + Timeline -->
        <div class="lg:col-span-2 space-y-5">
          <TransferDetailCard :transfer="item" />
          <TransferTimeline :status="item.status" />

          <!-- Verify Card -->
          <VerifyCard
            v-if="item.status === 'MENUNGGU_VERIFIKASI_ATASAN'"
            :transfer="item"
            :submitting="actionLoading"
            @approve="onApprove"
            @reject="openRejectModal"
          />

          <!-- Final Verify Card -->
          <FinalVerifyCard
            v-if="item.status === 'MENUNGGU_VERIFIKASI_TERAKHIR'"
            :submitting="actionLoading"
            @approve="onFinalVerify"
            @reject="openRejectModal"
          />

          <!-- Berita Acara Card -->
          <BeritaAcaraCard
            v-if="showBeritaAcara"
            :transfer="item"
            :generating="actionLoading"
            @generate="onGenerateBA"
          />
        </div>

        <!-- Right: Info tambahan -->
        <div class="space-y-5">
          <!-- Menunggu Verifikasi -->
          <div
            v-if="item.status === 'MENUNGGU_VERIFIKASI_ATASAN'"
            class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-clock" class="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-base font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Menunggu Verifikasi Anda</h3>
                <p class="text-sm text-yellow-600 dark:text-yellow-400">
                  Usulan dari {{ item.sekretarisName }} menunggu verifikasi Anda sebagai Atasan Managerial.
                </p>
              </div>
            </div>
          </div>

          <!-- Ditolak -->
          <div
            v-if="item.status === 'DITOLAK_ATASAN' || item.status === 'DITOLAK_VERIFIKASI_TERAKHIR'"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-base font-semibold text-red-700 dark:text-red-300 mb-1">Usulan Ditolak</h3>
                <p class="text-sm text-red-600 dark:text-red-400">{{ item.rejectedNote ?? 'Tidak ada catatan' }}</p>
              </div>
            </div>
          </div>

          <!-- Disetujui Verifikasi Terakhir — Siap Kirim -->
          <div
            v-if="item.status === 'DISETUJUI_VERIFIKASI_TERAKHIR'"
            class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <h3 class="text-base font-semibold text-green-700 dark:text-green-300 mb-1">Verifikasi Selesai</h3>
                <p class="text-sm text-green-600 dark:text-green-400">
                  Usulan telah lolos verifikasi terakhir. Sekretaris dapat melanjutkan pengiriman ke Unit Tata Naskah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      Usulan tidak ditemukan
    </div>

    <!-- Reject Modal -->
    <RejectModal v-model="isRejectModalOpen" @confirm="onReject" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTransferApproval } from '~/composables/useTransferApproval';
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';

definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const {
  fetchApprovalDetail,
  verifyTransfer,
  finalVerifyTransfer,
  rejectTransfer,
  generateBeritaAcara,
} = useTransferApproval();

const item = ref<TransferActiveToInactive | null>(null);
const loading = ref(true);
const actionLoading = ref(false);
const isRejectModalOpen = ref(false);

const items = computed(() => [
  { label: 'Beranda', to: '/' },
  { label: 'Persetujuan Pemindahan Arsip Aktif ke Inaktif', to: '/maintenance/approval-transfer-active-to-inactive-file' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: `/maintenance/approval-transfer-active-to-inactive-file/${route.params.id}` },
]);

const showBeritaAcara = computed(() => {
  if (!item.value) return false;
  return ['DISETUJUI_ATASAN', 'DISETUJUI_VERIFIKASI_TERAKHIR', 'DIKIRIM', 'SELESAI'].includes(item.value.status);
});

const loadDetail = async () => {
  loading.value = true;
  try {
    item.value = await fetchApprovalDetail(route.params.id as string);
  } catch (e) {
    console.error('Gagal memuat detail:', e);
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  item.value = await fetchApprovalDetail(route.params.id as string);
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

const onApprove = (catatan: string) => {
  if (!confirm('Setujui verifikasi usulan ini?')) return;
  act(() => verifyTransfer(item.value!.id, { verifyNote: catatan }));
};

const onFinalVerify = (catatan: string) => {
  if (!confirm('Setujui verifikasi terakhir usulan ini?')) return;
  act(() => finalVerifyTransfer(item.value!.id, { finalVerifyNote: catatan }));
};

const openRejectModal = () => {
  isRejectModalOpen.value = true;
};

const onReject = (alasan: string) => {
  act(() => rejectTransfer(item.value!.id, { rejectedNote: alasan }));
};

const onGenerateBA = () => act(() => generateBeritaAcara(item.value!.id));

onMounted(() => loadDetail());
</script>