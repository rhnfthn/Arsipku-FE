<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900">
    <PageHeader title="Verifikasi SDE Massal" :items="breadcrumbs" />

    <div class="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div class="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
        <div>
          <h2 class="text-base font-semibold text-gray-900 dark:text-white">Daftar Verifikasi SDE Massal</h2>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Naskah massal yang masuk ke urutan verifikasi Anda.</p>
        </div>
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          @click="loadData"
        >
          <UIcon name="i-lucide-refresh-cw" class="size-4" />
          Refresh
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-primary-400 text-white dark:bg-primary-700">
            <tr>
              <th class="px-4 py-3 font-semibold">Tanggal</th>
              <th class="px-4 py-3 font-semibold">Perihal</th>
              <th class="px-4 py-3 font-semibold">Tertuju</th>
              <th class="px-4 py-3 font-semibold">Klasifikasi</th>
              <th class="px-4 py-3 font-semibold">Pengirim</th>
              <th class="px-4 py-3 text-center font-semibold">Status</th>
              <th class="px-4 py-3 text-center font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" v-for="i in 4" :key="i" class="border-b border-gray-100 dark:border-gray-700">
              <td v-for="j in 7" :key="j" class="px-4 py-3">
                <div class="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                Tidak ada SDE Massal untuk diverifikasi.
              </td>
            </tr>
            <tr v-else v-for="item in rows" :key="item.id" class="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40">
              <td class="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">{{ formatDate(item.submittedAt || item.createdAt) }}</td>
              <td class="max-w-[220px] truncate px-4 py-3 font-medium text-gray-900 dark:text-white" :title="item.perihal">{{ item.perihal || '-' }}</td>
              <td class="max-w-[180px] truncate px-4 py-3 text-gray-600 dark:text-gray-300" :title="item.tertuju">{{ item.tertuju || '-' }}</td>
              <td class="max-w-[220px] truncate px-4 py-3 text-gray-600 dark:text-gray-300" :title="item.klasifikasiName || ''">{{ item.klasifikasiName || '-' }}</td>
              <td class="max-w-[220px] truncate px-4 py-3 text-gray-600 dark:text-gray-300" :title="item.pengirimName || ''">{{ item.pengirimName || '-' }}</td>
              <td class="px-4 py-3 text-center">
                <span :class="statusBadge(item.statusVerifikasi)">{{ statusLabel(item.statusVerifikasi) }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700"
                    title="Lihat detail"
                    @click="openDetail(item)"
                  >
                    <UIcon name="i-lucide-eye" class="size-4" />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-emerald-600 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-emerald-900/20"
                    title="Setujui"
                    :disabled="!canVerify(item) || actionLoading === item.id"
                    @click="openDetail(item)"
                  >
                    <UIcon name="i-lucide-check" class="size-4" />
                  </button>
                  <button
                    type="button"
                    class="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-900/20"
                    title="Tolak"
                    :disabled="!canVerify(item) || actionLoading === item.id"
                    @click="reject(item)"
                  >
                    <UIcon name="i-lucide-x" class="size-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="selectedItem" class="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-10 sm:pt-20 backdrop-blur-sm" @click.self="selectedItem = null">
        <div class="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800 flex flex-col max-h-[85vh]">
          <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Detail Verifikasi SDE Massal</h3>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="selectedItem = null">
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
          <div class="overflow-y-auto flex-1 bg-gray-100 dark:bg-gray-900 p-4">
            <div class="mx-auto w-full max-w-[794px] bg-white shadow-sm">
              <SdeMasalLetterPreview
                :konsep="detailKonsep"
                :penerima-list="detailPenerimaList"
                :template="detailTemplate"
                :penerima-index="0"
              />
            </div>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center justify-between gap-3">
            <template v-if="canVerify(selectedItem)">
              <button
                type="button"
                class="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-900/20 transition-colors"
                :disabled="actionLoading === selectedItem.id"
                @click="reject(selectedItem)"
              >
                Tolak
              </button>
              <button
                type="button"
                class="px-5 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                :disabled="actionLoading === selectedItem.id"
                @click="approve(selectedItem)"
              >
                <UIcon v-if="actionLoading === selectedItem.id" name="i-lucide-loader-2" class="size-4 animate-spin" />
                <UIcon v-else name="i-lucide-check" class="size-4" />
                Setujui
              </button>
            </template>
            <button v-else @click="selectedItem = null" class="ml-auto px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Tutup</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { SdeMasalItem, SdeMasalVerifikator, SdeMasalConcept, SdeMasalPenerima, SdeMasalTemplate } from '~/types/sde-masal';
import { useSdeMasal } from '~/composables/useSdeMasal';
import { useAuth } from '~/composables/useAuth';
import SdeMasalLetterPreview from '~/components/korespondensi/sde-masal/SdeMasalLetterPreview.vue';

definePageMeta({ middleware: ['auth'] });

const toast = useToast();
const { user, getProfile } = useAuth();
const { fetchVerificationList, approveVerification, rejectVerification } = useSdeMasal();

const rows = ref<SdeMasalItem[]>([]);
const loading = ref(false);
const actionLoading = ref<string | null>(null);
const selectedItem = ref<SdeMasalItem | null>(null);

const breadcrumbs = [
  { label: 'Beranda', to: '/beranda' },
  { label: 'SDE Massal', to: '/korespondensi/sde-masal/verifikasi' },
  { label: 'Verifikasi SDE Massal', to: '#' },
];

const currentPersnum = computed(() => String(user.value?.persnum ?? '').trim());
const currentPosition = computed(() => String(user.value?.position ?? user.value?.positionId ?? '').trim());

const loadData = async () => {
  loading.value = true;
  try {
    rows.value = await fetchVerificationList();
  } catch (error: any) {
    toast.add({ title: 'Gagal memuat data', description: error?.message || 'Coba lagi.', color: 'error' });
  } finally {
    loading.value = false;
  }
};

const getWaitingVerifier = (item: SdeMasalItem) =>
  (item.verifikators || []).find((v) => v.status === 'waiting');

const isMe = (verifikator?: SdeMasalVerifikator) => {
  if (!verifikator) return false;
  return (
    (!!currentPersnum.value && String(verifikator.persnum) === currentPersnum.value) ||
    (!!currentPosition.value && String(verifikator.position) === currentPosition.value)
  );
};

const canVerify = (item: SdeMasalItem) =>
  item.statusVerifikasi === 'MENUNGGU_VERIFIKASI' && isMe(getWaitingVerifier(item));

const approve = async (item: SdeMasalItem) => {
  actionLoading.value = item.id;
  try {
    await approveVerification(item.id);
    toast.add({ title: 'Berhasil', description: 'SDE Massal berhasil diverifikasi.', color: 'success' });
    selectedItem.value = null;
    await loadData();
  } catch (error: any) {
    toast.add({ title: 'Gagal verifikasi', description: error?.response?.data?.message || error?.message || 'Coba lagi.', color: 'error' });
  } finally {
    actionLoading.value = null;
  }
};

const reject = async (item: SdeMasalItem) => {
  actionLoading.value = item.id;
  try {
    await rejectVerification(item.id, 'Ditolak verifikator');
    toast.add({ title: 'Ditolak', description: 'SDE Massal berhasil ditolak.', color: 'success' });
    selectedItem.value = null;
    await loadData();
  } catch (error: any) {
    toast.add({ title: 'Gagal menolak', description: error?.response?.data?.message || error?.message || 'Coba lagi.', color: 'error' });
  } finally {
    actionLoading.value = null;
  }
};

const openDetail = (item: SdeMasalItem) => {
  selectedItem.value = item;
};

// --- Detail preview (SdeMasalLetterPreview, sama dengan halaman pengirim) ---
const detailKonsep = computed<SdeMasalConcept | null>(() => {
  const s = selectedItem.value;
  if (!s) return null;
  return {
    tanggalKonsep: s.tanggalKonsep || '',
    klasifikasiId: s.klasifikasiId || '',
    klasifikasiName: s.klasifikasiName || '',
    pengirimId: s.pengirimId || '',
    pengirimName: s.pengirimName || '',
    sifat: s.sifatSurat || 'biasa',
    perihal: s.perihal,
    parentNaskahId: s.parentNaskahId || undefined,
  };
});

const detailPenerimaList = computed<SdeMasalPenerima[]>(() => {
  const s = selectedItem.value;
  if (!s) return [];
  return [{
    no: 1,
    tertuju: s.tertuju,
    alamat: s.alamat,
    kota: s.kota,
    kodePos: s.kodePos,
    jabatanPenerima: s.jabatanPenerima,
    perihal: s.perihal,
    idTertuju: s.idTertuju || undefined,
    email: s.email || undefined,
    tembusan: s.tembusan || undefined,
    emailTertuju: s.emailTertuju || undefined,
    emailCc: s.emailCc || undefined,
    emailBcc: s.emailBcc || undefined,
    jumlahTagihanIdr: s.jumlahTagihanIdr || undefined,
    jumlahTagihanUsd: s.jumlahTagihanUsd || undefined,
    namaCro: s.namaCro || undefined,
    emailCro: s.emailCro || undefined,
    jabatanSigner: s.jabatanSigner || undefined,
    namaSigner: s.namaSigner || undefined,
    jumlahLampiran: s.jumlahLampiran || undefined,
    alamatPenerima: s.alamatPenerima || undefined,
    panggilanPenerima: s.panggilanPenerima || undefined,
    nominalRupiah: s.nominalRupiah || undefined,
    nominalDolar: s.nominalDolar || undefined,
    tembusan1: s.tembusan1 || undefined,
    tembusan2: s.tembusan2 || undefined,
    isValid: true,
  }];
});

const detailTemplate = computed<SdeMasalTemplate | null>(() => {
  const s = selectedItem.value;
  if (!s) return null;
  return {
    skema: s.skemaTemplate || s.jenisTemplate || 'DINAMIS',
    versi: s.versiTemplate || 'v1',
    konten: s.isiRingkasan || '',
  };
});

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusLabel = (status: string) => ({
  MENUNGGU: 'Menunggu',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  TERKIRIM: 'Terkirim',
  TERVERIFIKASI: 'Terverifikasi',
  DITOLAK: 'Ditolak',
  GAGAL: 'Gagal',
}[status] || status);

const statusBadge = (status: string) => ({
  MENUNGGU: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium whitespace-nowrap dark:bg-yellow-900/40 dark:text-yellow-300',
  MENUNGGU_VERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium whitespace-nowrap dark:bg-indigo-900/40 dark:text-indigo-300',
  TERKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium whitespace-nowrap dark:bg-blue-900/40 dark:text-blue-300',
  TERVERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  DITOLAK: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap dark:bg-red-900/40 dark:text-red-400',
  GAGAL: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap dark:bg-red-900/40 dark:text-red-400',
}[status] || 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap');

onMounted(async () => {
  if (!user.value) await getProfile();
  await loadData();
});
</script>
