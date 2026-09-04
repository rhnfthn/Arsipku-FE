<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 px-4">
      <PageHeader title="Verifikasi SDE Massal" :items="breadcrumbs" />
      <UButton
        label="Kembali"
        color="neutral"
        variant="outline"
        icon="i-lucide-arrow-left"
        @click="$router.back()"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
    </div>

    <!-- Not Found -->
    <div v-else-if="!item" class="text-center py-20">
      <UIcon name="i-lucide-file-x" class="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
      <p class="text-sm text-gray-500 dark:text-gray-400">Data tidak ditemukan.</p>
    </div>

    <!-- Content: grid 12 kolom — kiri konten, kanan timeline (sticky) -->
    <template v-else>
      <div class="mx-auto w-full max-w-7xl px-4 pb-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <!-- Kolom Kiri -->
          <div class="lg:col-span-8 space-y-5">
            <!-- Card: Informasi Naskah -->
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">Informasi Naskah</h3>
                <span :class="statusBadge(item.statusVerifikasi)">{{ statusLabel(item.statusVerifikasi) }}</span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">Judul Folder</span>
                  <p class="text-gray-900 dark:text-white font-medium">{{ folder?.judul || '-' }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">Perihal</span>
                  <p class="text-gray-900 dark:text-white font-medium">{{ recipient?.perihal || '-' }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">Tertuju</span>
                  <p class="text-gray-900 dark:text-white font-medium">{{ recipient?.tertuju || recipient?.idTertuju || '-' }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">Klasifikasi</span>
                  <p class="text-gray-900 dark:text-white font-medium">{{ klasifikasiName }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">Pengirim</span>
                  <p class="text-gray-900 dark:text-white font-medium">{{ folder?.pengirimName || '-' }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Surat</span>
                  <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(folder?.tanggal) }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400 text-xs">Tanggal Diajukan</span>
                  <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(item.submittedAt || item.createdAt) }}</p>
                </div>
                <div v-if="item.errorMessage" class="md:col-span-2">
                  <span class="text-gray-500 dark:text-gray-400 text-xs">Catatan</span>
                  <p class="text-red-600 dark:text-red-400 font-medium">{{ item.errorMessage }}</p>
                </div>
              </div>
            </div>

            <!-- Card: Lampiran -->
            <div v-if="folder?.originalFileUrl" class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
              <div class="mb-3 flex items-center gap-2">
                <UIcon name="i-lucide-paperclip" class="size-5 text-primary-500" />
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">Lampiran</h3>
              </div>
              <a :href="folder.originalFileUrl" target="_blank" class="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline">
                <UIcon name="i-lucide-file" class="size-4" />
                <span class="truncate max-w-xs">{{ folder.originalFileUrl }}</span>
                <UIcon name="i-lucide-external-link" class="size-3.5" />
              </a>
            </div>

            <!-- Card: Preview Surat -->
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
              <div class="mb-4 flex items-center gap-2">
                <UIcon name="i-lucide-file-text" class="size-5 text-primary-500" />
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">Preview Surat</h3>
              </div>
              <div class="overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-700" :class="detailPenerimaList.length > 1 ? 'max-h-[65vh]' : ''">
                <div class="mx-auto w-full max-w-[794px] bg-white">
                  <SdeMasalLetterPreview
                    :konsep="detailKonsep"
                    :penerima-list="detailPenerimaList"
                    :template="detailTemplate"
                    :penerima-index="0"
                  />
                </div>
              </div>
            </div>

            <!-- Card: Aksi Verifikasi -->
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
              <div class="flex items-center gap-3">
                <UButton
                  label="Tolak"
                  color="error"
                  variant="outline"
                  icon="i-lucide-x"
                  size="lg"
                  :loading="actionLoading === 'reject'"
                  :disabled="!!actionLoading"
                  @click="handleReject"
                />
                <UButton
                  label="Setujui"
                  color="primary"
                  icon="i-lucide-check"
                  size="lg"
                  :loading="actionLoading === 'approve'"
                  :disabled="!!actionLoading"
                  @click="handleApprove"
                />
              </div>
            </div>

            <!-- Card: Status Terverifikasi (auto-generate naskah sudah dilakukan sistem) -->
            <div
              v-if="allApproved"
              class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-300">
                <UIcon name="i-lucide-check-circle" class="size-5 shrink-0" />
                <span>Semua verifikator telah menyetujui. Naskah SDE individual otomatis dibuat dan dikirim ke arsip pengirim.</span>
              </div>
            </div>
          </div>

          <!-- Kolom Kanan: Timeline (sticky) -->
          <div class="lg:col-span-4">
            <div class="lg:sticky lg:top-5 space-y-5">
              <!-- Card: Timeline Riwayat -->
              <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-4">Timeline Riwayat</h3>
                <div v-if="timelineSteps.length === 0" class="text-sm text-gray-400">
                  Belum ada riwayat.
                </div>
                <div v-else class="space-y-1">
                  <div
                    v-for="(step, idx) in timelineSteps"
                    :key="idx"
                    class="flex gap-3"
                    :class="idx < timelineSteps.length - 1 ? 'pb-4' : ''"
                  >
                    <!-- Dot + connector -->
                    <div class="flex flex-col items-center">
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
                        :class="step.dotClass"
                      >
                        <UIcon v-if="step.icon === 'check'" name="i-lucide-check" class="w-4 h-4" />
                        <UIcon v-else-if="step.icon === 'x'" name="i-lucide-x" class="w-4 h-4" />
                        <span v-else>{{ step.number }}</span>
                      </div>
                      <div
                        v-if="idx < timelineSteps.length - 1"
                        class="w-0.5 flex-1 mt-1"
                        :class="step.done ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-700'"
                      />
                    </div>
                    <!-- Info -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium" :class="step.textClass">{{ step.label }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ step.desc }}</p>
                      <p v-if="step.date" class="text-xs text-gray-400 mt-0.5">{{ step.date }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { SdeMasalVerifikator, SdeMasalConcept, SdeMasalPenerima, SdeMasalTemplate } from '~/types/sde-masal';
import { useSdeMasal } from '~/composables/useSdeMasal';
import { useAuth } from '~/composables/useAuth';
import SdeMasalLetterPreview from '~/components/korespondensi/sde-masal/SdeMasalLetterPreview.vue';

definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { user, getProfile } = useAuth();
const { fetchDetail, approveVerification, rejectVerification } = useSdeMasal();

const item = ref<any | null>(null);
const loading = ref(false);
const actionLoading = ref<string | null>(null);

const folder = computed(() => item.value?.folder || null);
const recipient = computed(() => item.value?.recipient || {});
const klasifikasiName = computed(() => {
  const f = folder.value;
  if (!f) return '-';
  return [f.klasifikasi, f.klasifikasiText].filter(Boolean).join(' - ') || '-';
});

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Verifikasi SDE Massal', to: '/korespondensi/sde-masal/verifikasi' },
  { label: 'Detail Verifikasi', to: '#' },
]);

const currentPersnum = computed(() => String(user.value?.persnum ?? '').trim());
const currentPosition = computed(() => String(user.value?.position ?? '').trim());

const getWaitingVerifier = (data: any) =>
  (data.verifikators || []).find((v) => v.status === 'waiting');

const isMe = (verifikator?: SdeMasalVerifikator) => {
  if (!verifikator) return false;
  return (
    (!!currentPersnum.value && String(verifikator.persnum) === currentPersnum.value) ||
    (!!currentPosition.value && String(verifikator.position) === currentPosition.value)
  );
};

const canVerify = computed(() =>
  item.value?.statusVerifikasi === 'MENUNGGU_VERIFIKASI' && isMe(getWaitingVerifier(item.value)),
);

// Semua verifikator sudah setuju (status TERVERIFIKASI)
const allApproved = computed(() => item.value?.statusVerifikasi === 'TERVERIFIKASI');

// --- Detail preview ---
const detailKonsep = computed<SdeMasalConcept | null>(() => {
  const f = folder.value;
  const r = recipient.value;
  if (!f) return null;
  return {
    tanggalKonsep: f.tanggal ? String(f.tanggal).slice(0, 10) : '',
    klasifikasiId: f.klasifikasi || '',
    klasifikasiName: klasifikasiName.value,
    pengirimId: f.pengirimId || '',
    pengirimName: f.pengirimName || '',
    sifat: f.sifat || 'biasa',
    perihal: r.perihal || '',
    parentNaskahId: f.parentNaskahId || undefined,
  };
});

const detailPenerimaList = computed<SdeMasalPenerima[]>(() => {
  const r = recipient.value;
  if (!r || !Object.keys(r).length) return [];
  return [{
    no: 1,
    tertuju: r.tertuju || r.idTertuju || '',
    alamat: r.alamatPenerima || r.alamat || null,
    kota: r.kota || null,
    kodePos: r.kodePos || null,
    jabatanPenerima: r.jabatanPenerima || r.jabatan || null,
    keterangan: null,
    perihal: r.perihal || '',
    idTertuju: r.idTertuju || '',
    email: r.email || '',
    tembusan: r.tembusan || '',
    emailTertuju: r.emailTertuju || '',
    emailCc: r.emailCc || '',
    emailBcc: r.emailBcc || '',
    jumlahTagihanIdr: r.jumlahTagihanIdr || '',
    jumlahTagihanUsd: r.jumlahTagihanUsd || '',
    namaCro: r.namaCro || '',
    emailCro: r.emailCro || '',
    jabatanSigner: r.jabatanSigner || '',
    namaSigner: r.namaSigner || '',
    jumlahLampiran: r.jumlahLampiran || '',
    alamatPenerima: r.alamatPenerima || null,
    panggilanPenerima: r.panggilanPenerima || null,
    nominalRupiah: r.nominalRupiah || null,
    nominalDolar: r.nominalDolar || null,
    tembusan1: r.tembusan1 || null,
    tembusan2: r.tembusan2 || null,
    isValid: true,
  }];
});

const detailTemplate = computed<SdeMasalTemplate | null>(() => {
  const f = folder.value;
  if (!f) return null;
  return {
    skema: 'DINAMIS',
    versi: 'v1',
    konten: f.kontenTemplate || '',
  };
});

const statusLabel = (status: string) => ({
  MENUNGGU: 'Menunggu',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  TERKIRIM: 'Dikirim',
  TERVERIFIKASI: 'Disetujui',
  DITOLAK: 'Ditolak',
  GAGAL: 'Gagal',
}[status] || status);

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const verifierStatusLabel = (status: string) => ({
  pending: 'Menunggu Giliran',
  waiting: 'Giliran Aktif',
  verified: 'Disetujui',
  rejected: 'Ditolak',
}[status] || status);

const verifierDotClass = (status: string) => ({
  pending: 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200',
  waiting: 'bg-[#457fb6] text-white ring-4 ring-[#457fb6]/20',
  verified: 'bg-green-500 text-white',
  rejected: 'bg-red-500 text-white',
}[status] || 'bg-gray-200 text-gray-700');

const verifierTextClass = (status: string) => ({
  pending: 'text-gray-500 dark:text-gray-400',
  waiting: 'text-[#457fb6] dark:text-[#5a9ad6] font-semibold',
  verified: 'text-green-600 dark:text-green-400 font-semibold',
  rejected: 'text-red-600 dark:text-red-400 font-semibold',
}[status] || 'text-gray-500');

// Timeline Riwayat: dibuat dari status naskah + verifikator (urutan terbalik, terbaru di atas)
const timelineSteps = computed(() => {
  if (!item.value) return [];
  const steps: { number?: number; label: string; desc: string; date?: string; dotClass: string; textClass: string; icon?: string; done: boolean }[] = [];

  // Step: Dikirim (jika status TERKIRIM)
  if (item.value.statusVerifikasi === 'TERKIRIM') {
    steps.push({
      number: steps.length + 1,
      label: 'Dikirim',
      desc: 'Naskah SDE Massal telah dikirim ke penerima',
      dotClass: 'bg-green-500 text-white',
      textClass: 'text-green-600 dark:text-green-400 font-semibold',
      icon: 'check',
      done: true,
    });
  }

  // Step: Disetujui (jika semua verifikator setuju)
  if (item.value.statusVerifikasi === 'TERVERIFIKASI' || item.value.statusVerifikasi === 'TERKIRIM') {
    steps.push({
      number: steps.length + 1,
      label: 'Disetujui',
      desc: 'Semua verifikator telah menyetujui',
      dotClass: 'bg-green-500 text-white',
      textClass: 'text-green-600 dark:text-green-400 font-semibold',
      icon: 'check',
      done: true,
    });
  }

  // Step per verifikator (urutan terbalik: terbaru di atas)
  const verifikators = [...(item.value.verifikators || [])].reverse();
  for (const v of verifikators) {
    const urutan = Number(v.urutan);
    if (v.status === 'verified') {
      steps.push({
        number: urutan,
        label: `Disetujui oleh Verifikator ${urutan}`,
        desc: `${v.nama} — ${v.jabatan}`,
        date: v.verifiedAt ? formatDate(v.verifiedAt) : undefined,
        dotClass: 'bg-green-500 text-white',
        textClass: 'text-gray-900 dark:text-white',
        icon: 'check',
        done: true,
      });
    } else if (v.status === 'rejected') {
      steps.push({
        number: urutan,
        label: `Ditolak oleh Verifikator ${urutan}`,
        desc: `${v.nama} — ${v.jabatan}`,
        date: v.rejectedAt ? formatDate(v.rejectedAt) : undefined,
        dotClass: 'bg-red-500 text-white',
        textClass: 'text-red-600 dark:text-red-400 font-semibold',
        icon: 'x',
        done: true,
      });
    } else if (v.status === 'waiting') {
      steps.push({
        number: urutan,
        label: `Menunggu Verifikasi ${urutan}`,
        desc: `${v.nama} — ${v.jabatan}`,
        dotClass: 'bg-[#457fb6] text-white ring-4 ring-[#457fb6]/20',
        textClass: 'text-[#457fb6] dark:text-[#5a9ad6] font-semibold',
        done: false,
      });
    } else {
      steps.push({
        number: urutan,
        label: `Menunggu Giliran Verifikator ${urutan}`,
        desc: `${v.nama} — ${v.jabatan}`,
        dotClass: 'bg-gray-200 dark:bg-gray-600 text-gray-400',
        textClass: 'text-gray-500 dark:text-gray-400',
        done: false,
      });
    }
  }

  // Step: Pengajuan (selalu ada di bawah)
  steps.push({
    number: steps.length + 1,
    label: 'Pengajuan',
    desc: `${folder.value?.pengirimName || 'Pengirim'} mengajukan SDE Massal`,
    date: formatDate(item.value.submittedAt || item.value.createdAt),
    dotClass: 'bg-green-500 text-white',
    textClass: 'text-gray-900 dark:text-white',
    icon: 'check',
    done: true,
  });

  return steps;
});

const statusBadge = (status: string) => ({
  MENUNGGU: 'px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium whitespace-nowrap dark:bg-yellow-900/40 dark:text-yellow-300',
  MENUNGGU_VERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 font-medium whitespace-nowrap dark:bg-indigo-900/40 dark:text-indigo-300',
  TERKIRIM: 'px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium whitespace-nowrap dark:bg-blue-900/40 dark:text-blue-300',
  TERVERIFIKASI: 'px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap dark:bg-emerald-900/40 dark:text-emerald-300',
  DITOLAK: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap dark:bg-red-900/40 dark:text-red-400',
  GAGAL: 'px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium whitespace-nowrap dark:bg-red-900/40 dark:text-red-400',
}[status] || 'px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap');

const handleApprove = async () => {
  if (!item.value) return;
  actionLoading.value = 'approve';
  try {
    await approveVerification(item.value.id);
    toast.add({ title: 'Berhasil', description: 'SDE Massal berhasil diverifikasi.', color: 'success' });
    // Reload item agar status/tombol ter-update (bukan redirect)
    item.value = await fetchDetail(item.value.id);
  } catch (error: any) {
    toast.add({ title: 'Gagal verifikasi', description: error?.response?.data?.message || error?.message || 'Coba lagi.', color: 'error' });
  } finally {
    actionLoading.value = null;
  }
};

const handleReject = async () => {
  if (!item.value) return;
  actionLoading.value = 'reject';
  try {
    await rejectVerification(item.value.id, 'Ditolak verifikator');
    toast.add({ title: 'Ditolak', description: 'SDE Massal berhasil ditolak.', color: 'success' });
    item.value = await fetchDetail(item.value.id);
  } catch (error: any) {
    toast.add({ title: 'Gagal menolak', description: error?.response?.data?.message || error?.message || 'Coba lagi.', color: 'error' });
  } finally {
    actionLoading.value = null;
  }
};

onMounted(async () => {
  if (!user.value) await getProfile();
  loading.value = true;
  try {
    const id = String(route.params.id ?? route.params.pathMatch ?? route.query.id ?? '');
    item.value = await fetchDetail(id);
  } catch (error: any) {
    toast.add({ title: 'Gagal memuat data', description: error?.message || 'Coba lagi.', color: 'error' });
  } finally {
    loading.value = false;
  }
});
</script>