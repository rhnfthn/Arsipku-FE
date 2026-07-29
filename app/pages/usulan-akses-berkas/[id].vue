<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '~/components/PageHeader.vue';
import UsulanAksesBerkasBadge from '~/components/usulan-akses-berkas/UsulanAksesBerkasBadge.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { useAuth } from '~/composables/useAuth';
import {
  StatusUsulan,
  Keputusan,
  DurasiPreset,
  type VerifikasiPengusulPayload,
  type VerifikasiPemberiPayload,
  type PersetujuanPemberiPayload,
  type PilihBerkasPayload,
} from '~/types/usulan-akses-berkas';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Detail Usulan Akses Berkas' });

const route = useRoute();
const { t } = useI18n();
const { user } = useAuth();
const {
  usulanDetail,
  pending,
  fetchDetail,
  verifikasiPengusul,
  verifikasiPemberi,
  persetujuanPemberi,
  pilihBerkas,
  fetchBerkasEligible,
  fetchVerifikator,
  verifikatorList,
} = useUsulanAksesBerkas();
const toast = useToast();

// Helper: extract error message dari AxiosError (BE return { message: [...] | string })
const extractErrorMessage = (err: any): string => {
  // AxiosError: err.response.data.message bisa string atau array
  const beMessage = err?.response?.data?.message;
  if (Array.isArray(beMessage) && beMessage.length > 0) {
    return beMessage.join(', ');
  }
  if (typeof beMessage === 'string' && beMessage.trim()) {
    return beMessage;
  }
  // Fallback ke err.message
  return err?.message || 'Terjadi kesalahan';
};

const id = computed(() => route.params.id as string);

// ── Verifikasi Pengusul form ─────────────────────
const showVerifikasiPengusul = ref(false);
const vpForm = ref<VerifikasiPengusulPayload>({
  kelengkapanBerkas: false,
  kesesuaianTujuan: false,
  periodeWajar: false,
  suratSah: false,
  tidakDuplikasi: false,
  catatan: '',
  catatanRevisi: '',
  keputusan: Keputusan.SETUJU,
});

// ── Verifikasi Pemberi form ──────────────────────
const showVerifikasiPemberi = ref(false);
const vpbForm = ref<VerifikasiPemberiPayload>({
  berkasTersedia: false,
  tidakAdaPembatasan: false,
  tujuanMemadai: false,
  tidakBentrokRetensi: false,
  disetujuiLanjut: false,
  durasiAksesDisetujui: DurasiPreset.EMPAT_BELAS_HARI,
  catatanPerubahanDurasi: '',
  catatan: '',
  keputusan: Keputusan.LANJUT,
});

// ── Persetujuan Pemberi form ─────────────────────
const showPersetujuanPemberi = ref(false);
const ppForm = ref<PersetujuanPemberiPayload>({
  berkasSesuai: false,
  tidakMelanggarKebijakan: false,
  peminjamanTidakBerlebihan: false,
  sudahDiverifikasiSekretaris: false,
  disetujuiDiberikan: false,
  catatan: '',
  catatanRevisi: '',
  keputusan: Keputusan.SETUJU,
});

const breadcrumbs = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/beranda' },
  { label: 'Usulan Akses Berkas', to: '/usulan-akses-berkas' },
  { label: usulanDetail.value?.nomorUsulan || 'Detail', to: '#' },
]);

const durasiOptions = [
  { label: '7 Hari', value: DurasiPreset.TUJUH_HARI },
  { label: '14 Hari', value: DurasiPreset.EMPAT_BELAS_HARI },
  { label: '1 Bulan', value: DurasiPreset.SATU_BULAN },
  { label: '2 Bulan', value: DurasiPreset.DUA_BULAN },
  { label: '3 Bulan', value: DurasiPreset.TIGA_BULAN },
  { label: '6 Bulan', value: DurasiPreset.ENAM_BULAN },
  { label: '1 Tahun', value: DurasiPreset.SATU_TAHUN },
  { label: 'Custom', value: DurasiPreset.CUSTOM },
];

// Position status: SE = Sekretaris, null/YBS/PT/PH/PS = Managerial
const isSekretaris = computed(() => user.value?.position_status === 'SE');
const isManagerial = computed(() => {
  if (!user.value) return false; // null saat loading → tidak ada aksi
  const ps = user.value.position_status;
  if (ps === 'SE' || ps === 'VI') return false;
  // Cek jabatan: hanya AVP/VP/EVP yang managerial
  const pos = (user.value.positionText || '').toUpperCase();
  return pos.includes('EVP') || pos.includes('AVP') || pos.includes(' VP ') || pos.startsWith('VP ') || pos === 'VP';
});

// ── Pilih Berkas form (SE pemberi) ──────────────
const showPilihBerkas = ref(false);
const pilihBerkasForm = ref<PilihBerkasPayload>({
  berkasIds: [],
  catatanPenerusan: '',
  verifikatorPemberi: [],
});

// State untuk modal Pilih Berkas
interface BerkasItem {
  id: string;
  judulBerkas: string;
  klasifikasi?: string;
  klasifikasiTeks?: string;
  nomorBerkas?: string;
  status?: string;
  lokasi?: string;
  [key: string]: any;
}
const berkasEligibleList = ref<BerkasItem[]>([]);
const berkasLoading = ref(false);
const berkasSearch = ref('');
const showBerkasDropdown = ref(false);

const filteredBerkas = computed(() => {
  if (!berkasSearch.value.trim()) return berkasEligibleList.value;
  const q = berkasSearch.value.toLowerCase();
  return berkasEligibleList.value.filter(
    (b) =>
      (b.judulBerkas || '').toLowerCase().includes(q) ||
      (b.klasifikasi || '').toLowerCase().includes(q) ||
      (b.klasifikasiTeks || '').toLowerCase().includes(q) ||
      (b.nomorBerkas || '').toLowerCase().includes(q),
  );
});

// Verifikator Pemberi list (managerial di divisi pemberi) — reuses fetchVerifikator
const verifikatorPemberiList = ref<Array<{
  persnum: number;
  nama: string;
  jabatan: string;
  levelJabatan: 'AVP' | 'VP' | 'EVP';
  urutan: number;
}>>([]);
const verifikatorPemberiLoading = ref(false);

const toggleBerkas = (id: string) => {
  const idx = pilihBerkasForm.value.berkasIds.indexOf(id);
  if (idx === -1) {
    pilihBerkasForm.value.berkasIds.push(id);
  } else {
    pilihBerkasForm.value.berkasIds.splice(idx, 1);
  }
};

const toggleVerifikatorPemberi = (persnum: number, levelJabatan: 'AVP' | 'VP' | 'EVP') => {
  const idx = pilihBerkasForm.value.verifikatorPemberi.findIndex(
    (v) => v.persnum === persnum,
  );
  if (idx === -1) {
    pilihBerkasForm.value.verifikatorPemberi.push({ persnum, levelJabatan });
  } else {
    pilihBerkasForm.value.verifikatorPemberi.splice(idx, 1);
  }
};

const isBerkasSelected = (id: string) =>
  pilihBerkasForm.value.berkasIds.includes(id);

const isVerifikatorPemberiSelected = (persnum: number) =>
  pilihBerkasForm.value.verifikatorPemberi.some((v) => v.persnum === persnum);

const loadBerkasEligible = async () => {
  berkasLoading.value = true;
  try {
    berkasEligibleList.value = await fetchBerkasEligible('closed_retensi_aktif');
  } catch (err: any) {
    toast.add({
      title: 'Gagal Memuat Berkas',
      description: extractErrorMessage(err),
      color: 'error',
    });
  } finally {
    berkasLoading.value = false;
  }
};

const loadVerifikatorPemberi = async () => {
  verifikatorPemberiLoading.value = true;
  try {
    // Fetch managerial di divisi pemberi (dari usulan), bukan divisi user.
    // Ini penting karena SE bisa didelegasikan dari divisi lain.
    const divisiPemberiId = usulanDetail.value?.divisiPemberiId;
    await fetchVerifikator(divisiPemberiId ? Number(divisiPemberiId) : undefined);
    verifikatorPemberiList.value = verifikatorList.value as any[] || [];
  } catch (err: any) {
    toast.add({
      title: 'Gagal Memuat Verifikator',
      description: extractErrorMessage(err),
      color: 'error',
    });
  } finally {
    verifikatorPemberiLoading.value = false;
  }
};

// Reset state saat modal dibuka
watch(showPilihBerkas, async (newVal) => {
  if (newVal) {
    pilihBerkasForm.value.berkasIds = [];
    pilihBerkasForm.value.verifikatorPemberi = [];
    pilihBerkasForm.value.catatanPenerusan = '';
    berkasSearch.value = '';
    await Promise.all([loadBerkasEligible(), loadVerifikatorPemberi()]);
  }
});

// Cek apakah SE ini adalah SE pemberi (divisi user = divisi pemberi usulan)
const isSekretarisPemberi = computed(() => {
  if (!isSekretaris.value) return false;
  const userOrg = Number(user.value?.organization);
  const pemberiId = Number(usulanDetail.value?.divisiPemberiId);
  return userOrg === pemberiId;
});

// Cek apakah user adalah verifikator pengusul di jenjang yang sesuai dengan status
const isVerifikatorPengusulAktif = computed(() => {
  if (!isManagerial.value || !usulanDetail.value) return false;
  const userPersnum = Number(user.value?.persnum);
  const s = usulanDetail.value.status;
  // Map status ke jenjang yang sedang menunggu
  let expectedUrutan: number | null = null;
  if (s === StatusUsulan.MENUNGGU_VERIFIKASI_PENGUSUL) expectedUrutan = 1;
  else if (s === StatusUsulan.MENUNGGU_VERIFIKASI_AKHIR_PENGUSUL) expectedUrutan = 2;
  else if (s === StatusUsulan.MENUNGGU_VERIFIKASI_EVP_PENGUSUL) expectedUrutan = 3;
  if (expectedUrutan === null) return false;
  const verifikator = usulanDetail.value.verifikatorPengusul?.find(
    (v: any) => v.urutan === expectedUrutan,
  );
  return verifikator?.persnum === userPersnum;
});

// Cek apakah user adalah verifikator pemberi di jenjang yang sesuai dengan status
const isVerifikatorPemberiAktif = computed(() => {
  if (!isManagerial.value || !usulanDetail.value) return false;
  const userPersnum = Number(user.value?.persnum);
  const s = usulanDetail.value.status;
  let expectedUrutan: number | null = null;
  if (s === StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI) expectedUrutan = 1;
  else if (s === StatusUsulan.MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI) expectedUrutan = 2;
  else if (s === StatusUsulan.MENUNGGU_PERSETUJUAN_EVP_PEMBERI) expectedUrutan = 3;
  if (expectedUrutan === null) return false;
  const verifikator = usulanDetail.value.verifikatorPemberi?.find(
    (v: any) => v.urutan === expectedUrutan,
  );
  return verifikator?.persnum === userPersnum;
});

const canVerifyPengusul = computed(() => {
  return isVerifikatorPengusulAktif.value;
});

const canVerifyPemberi = computed(() => {
  if (!isSekretarisPemberi.value) return false;
  return usulanDetail.value?.status === StatusUsulan.TERKIRIM_KE_PEMBERI;
});

const canSelectBerkas = computed(() => {
  if (!isSekretarisPemberi.value) return false;
  return usulanDetail.value?.status === StatusUsulan.PEMILIHAN_BERKAS;
});

const canApprovePemberi = computed(() => {
  return isVerifikatorPemberiAktif.value;
});

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const loadDetail = async () => {
  try {
    await fetchDetail(id.value);
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: extractErrorMessage(err),
      color: 'error',
    });
  }
};

const submitVerifikasiPengusul = async () => {
  if (vpForm.value.keputusan === Keputusan.REVISI && (!vpForm.value.catatanRevisi?.trim() || vpForm.value.catatanRevisi.trim().length < 5)) {
    toast.add({ title: 'Catatan revisi wajib diisi (minimal 5 karakter)', color: 'error' });
    return;
  }
  // Cari jenjang user dari verifikatorPengusul
  const userPersnum = Number(user.value?.persnum);
  const verifikator = usulanDetail.value?.verifikatorPengusul?.find(
    (v: any) => v.persnum === userPersnum,
  );
  if (!verifikator) {
    toast.add({ title: 'Anda bukan verifikator pengusul', color: 'error' });
    return;
  }
  const jenjang = verifikator.urutan as 1 | 2 | 3;
  try {
    await verifikasiPengusul(id.value, jenjang, vpForm.value);
    toast.add({ title: 'Berhasil', description: 'Verifikasi terkirim', color: 'success' });
    showVerifikasiPengusul.value = false;
    await loadDetail();
  } catch (err: any) {
    toast.add({ title: 'Gagal Verifikasi', description: extractErrorMessage(err), color: 'error' });
  }
};

const submitVerifikasiPemberi = async () => {
  try {
    await verifikasiPemberi(id.value, vpbForm.value);
    toast.add({ title: 'Berhasil', description: 'Verifikasi pemberi terkirim', color: 'success' });
    showVerifikasiPemberi.value = false;
    await loadDetail();
  } catch (err: any) {
    toast.add({ title: 'Gagal Verifikasi', description: extractErrorMessage(err), color: 'error' });
  }
};

const submitPersetujuanPemberi = async () => {
  if (ppForm.value.keputusan === Keputusan.REVISI && (!ppForm.value.catatanRevisi?.trim() || ppForm.value.catatanRevisi.trim().length < 5)) {
    toast.add({ title: 'Catatan revisi wajib diisi (minimal 5 karakter)', color: 'error' });
    return;
  }
  // Cari jenjang user dari verifikatorPemberi
  const userPersnum = Number(user.value?.persnum);
  const verifikator = usulanDetail.value?.verifikatorPemberi?.find(
    (v: any) => v.persnum === userPersnum,
  );
  if (!verifikator) {
    toast.add({ title: 'Anda bukan verifikator pemberi', color: 'error' });
    return;
  }
  const jenjang = verifikator.urutan as 1 | 2 | 3;
  try {
    await persetujuanPemberi(id.value, jenjang, ppForm.value);
    toast.add({ title: 'Berhasil', description: 'Persetujuan terkirim', color: 'success' });
    showPersetujuanPemberi.value = false;
    await loadDetail();
  } catch (err: any) {
    toast.add({ title: 'Gagal Persetujuan', description: extractErrorMessage(err), color: 'error' });
  }
};

const submitPilihBerkas = async () => {
  if (pilihBerkasForm.value.berkasIds.length === 0) {
    toast.add({ title: 'Pilih minimal 1 berkas', color: 'error' });
    return;
  }
  if (pilihBerkasForm.value.verifikatorPemberi.length === 0) {
    toast.add({ title: 'Pilih minimal 1 verifikator pemberi', color: 'error' });
    return;
  }
  try {
    await pilihBerkas(id.value, pilihBerkasForm.value);
    toast.add({ title: 'Berhasil', description: 'Berkas dipilih, usulan diteruskan ke verifikator pemberi', color: 'success' });
    showPilihBerkas.value = false;
    await loadDetail();
  } catch (err: any) {
    toast.add({ title: 'Gagal Pilih Berkas', description: extractErrorMessage(err), color: 'error' });
  }
};

onMounted(() => {
  loadDetail();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <div class="flex flex-wrap items-center gap-3">
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {{ usulanDetail?.nomorUsulan || 'Detail Usulan' }}
          </h1>
          <UsulanAksesBerkasBadge v-if="usulanDetail" :status="usulanDetail.status" />
        </div>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="pending && !usulanDetail" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <main v-else-if="usulanDetail" class="mx-auto max-w-6xl space-y-5">
      <!-- Informasi Usulan -->
      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <UIcon name="i-lucide-file-text" class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Informasi Usulan</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Detail usulan peminjaman akses berkas.</p>
          </div>
          <div class="ml-auto text-right text-xs text-gray-500 dark:text-gray-400">
            <div>Dibuat: {{ formatDate(usulanDetail.createdAt) }}</div>
            <div>Update: {{ formatDate(usulanDetail.updatedAt) }}</div>
          </div>
        </div>
        <dl class="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
              <UIcon name="i-lucide-folder" class="size-4" />
            </span>
            <div class="min-w-0">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Jenis Berkas</dt>
              <dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.jenisBerkas }}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
              <UIcon name="i-lucide-user" class="size-4" />
            </span>
            <div class="min-w-0">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Pengusul</dt>
              <dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
                {{ usulanDetail.pengusulInfo?.nama || usulanDetail.pengusulPersnum }}
                <span v-if="usulanDetail.pengusulInfo?.jabatan" class="ml-1 text-xs font-normal text-gray-400">({{ usulanDetail.pengusulInfo.jabatan }})</span>
              </dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
              <UIcon name="i-lucide-building" class="size-4" />
            </span>
            <div class="min-w-0">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Divisi Pengusul</dt>
              <dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.divisiPengusulNama || usulanDetail.divisiPengusulId }}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
              <UIcon name="i-lucide-building-2" class="size-4" />
            </span>
            <div class="min-w-0">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Divisi Pemberi</dt>
              <dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.divisiPemberiNama || usulanDetail.divisiPemberiId }}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
              <UIcon name="i-lucide-clock" class="size-4" />
            </span>
            <div class="min-w-0">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Durasi Akses</dt>
              <dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.durasiAkses?.replace('_', ' ') }}</dd>
            </div>
          </div>
          <div v-if="usulanDetail.durasiAksesDisetujui" class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
              <UIcon name="i-lucide-check-clock" class="size-4" />
            </span>
            <div class="min-w-0">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Durasi Disetujui</dt>
              <dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.durasiAksesDisetujui.replace('_', ' ') }}</dd>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
              <UIcon name="i-lucide-key" class="size-4" />
            </span>
            <div class="min-w-0">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Jenis Akses</dt>
              <dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.jenisAkses?.join(', ') }}</dd>
            </div>
          </div>
          <div v-if="usulanDetail.tanggalMulai" class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
              <UIcon name="i-lucide-calendar" class="size-4" />
            </span>
            <div class="min-w-0">
              <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Periode Akses</dt>
              <dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(usulanDetail.tanggalMulai) }} — {{ formatDate(usulanDetail.tanggalSelesai) }}</dd>
            </div>
          </div>
        </dl>
        <div class="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
          <p class="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Tujuan Akses</p>
          <p class="text-sm text-gray-800 dark:text-gray-200">{{ usulanDetail.tujuanAkses }}</p>
        </div>
        <!-- Catatan Revisi -->
        <div v-if="usulanDetail.catatanRevisiPengusul" class="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
          <div class="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
            <p class="text-sm font-medium text-orange-700 dark:text-orange-400">Catatan Revisi Pengusul:</p>
            <p class="mt-1 text-sm text-orange-800 dark:text-orange-300">{{ usulanDetail.catatanRevisiPengusul }}</p>
          </div>
        </div>
        <div v-if="usulanDetail.catatanRevisiPemberi" class="border-t border-gray-100 px-5 py-4 dark:border-gray-700">
          <div class="rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
            <p class="text-sm font-medium text-orange-700 dark:text-orange-400">Catatan Revisi Pemberi:</p>
            <p class="mt-1 text-sm text-orange-800 dark:text-orange-300">{{ usulanDetail.catatanRevisiPemberi }}</p>
          </div>
        </div>
      </section>

      <!-- Verifikator -->
      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <UIcon name="i-lucide-users" class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Verifikator</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Daftar verifikator pengusul & pemberi.</p>
          </div>
        </div>
        <div class="px-5 py-5">
          <!-- Verifikator Pengusul -->
          <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Verifikator Pengusul</p>
          <div class="space-y-2">
            <div v-for="(v, idx) in usulanDetail.verifikatorPengusul" :key="idx" class="flex items-center gap-3 text-sm">
              <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="{ 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': v.levelJabatan === 'AVP', 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': v.levelJabatan === 'VP', 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': v.levelJabatan === 'EVP' }">{{ v.levelJabatan }}</span>
              <span class="font-medium text-gray-700 dark:text-gray-300">{{ v.nama || `Persnum ${v.persnum}` }}</span>
              <span v-if="v.jabatan" class="text-xs text-gray-400">{{ v.jabatan }}</span>
              <span v-if="v.divisiNama" class="text-xs text-gray-400">· {{ v.divisiNama }}</span>
              <span class="ml-auto text-xs text-gray-400">Jenjang {{ v.urutan }}</span>
            </div>
          </div>
          <!-- Verifikator Pemberi -->
          <div v-if="usulanDetail.verifikatorPemberi?.length" class="mt-5 border-t border-gray-100 pt-4 dark:border-gray-700">
            <p class="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Verifikator Pemberi</p>
            <div class="space-y-2">
              <div v-for="(v, idx) in usulanDetail.verifikatorPemberi" :key="idx" class="flex items-center gap-3 text-sm">
                <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="{ 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': v.levelJabatan === 'AVP', 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': v.levelJabatan === 'VP', 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': v.levelJabatan === 'EVP' }">{{ v.levelJabatan }}</span>
                <span class="font-medium text-gray-700 dark:text-gray-300">{{ v.nama || `Persnum ${v.persnum}` }}</span>
                <span v-if="v.jabatan" class="text-xs text-gray-400">{{ v.jabatan }}</span>
                <span v-if="v.divisiNama" class="text-xs text-gray-400">· {{ v.divisiNama }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Timeline Verifikasi -->
      <section v-if="usulanDetail.steps?.length" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <UIcon name="i-lucide-route" class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Timeline Verifikasi</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Riwayat keputusan verifikasi.</p>
          </div>
        </div>
        <div class="space-y-4 px-5 py-5">
          <div v-for="step in usulanDetail.steps" :key="step.id" class="flex gap-3">
            <div class="flex-shrink-0">
              <div class="flex h-10 w-10 items-center justify-center rounded-full" :class="{ 'bg-green-100 dark:bg-green-900/30': step.keputusan === Keputusan.SETUJU || step.keputusan === Keputusan.LANJUT, 'bg-red-100 dark:bg-red-900/30': step.keputusan === Keputusan.TOLAK, 'bg-orange-100 dark:bg-orange-900/30': step.keputusan === Keputusan.REVISI }">
                <UIcon v-if="step.keputusan === Keputusan.SETUJU || step.keputusan === Keputusan.LANJUT" name="i-lucide-check" class="size-5 text-green-600 dark:text-green-400" />
                <UIcon v-else-if="step.keputusan === Keputusan.TOLAK" name="i-lucide-x" class="size-5 text-red-600 dark:text-red-400" />
                <UIcon v-else name="i-lucide-alert-triangle" class="size-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div class="flex-1 border-l-2 border-gray-100 pb-4 pl-4 dark:border-gray-700">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ step.roleTahap }}</span>
                <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="{ 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400': step.keputusan === Keputusan.SETUJU || step.keputusan === Keputusan.LANJUT, 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': step.keputusan === Keputusan.TOLAK, 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400': step.keputusan === Keputusan.REVISI }">{{ step.keputusan }}</span>
              </div>
              <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ step.verifierNama || `Persnum ${step.verifierPersnum}` }}<span v-if="step.verifierJabatan"> · {{ step.verifierJabatan }}</span> · {{ formatDate(step.verifiedAt) }}
              </div>
              <div v-if="step.catatan" class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ step.catatan }}</div>
              <div v-if="step.catatanRevisi" class="mt-1 text-sm text-orange-600 dark:text-orange-400">Revisi: {{ step.catatanRevisi }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Action Buttons -->
      <div v-if="canVerifyPengusul || canVerifyPemberi || canSelectBerkas || canApprovePemberi" class="flex flex-wrap gap-3">
        <button v-if="canVerifyPengusul" @click="showVerifikasiPengusul = true" class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700">
          <UIcon name="i-lucide-check-circle" class="size-4" /> Verifikasi Pengusul
        </button>
        <button v-if="canVerifyPemberi" @click="showVerifikasiPemberi = true" class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700">
          <UIcon name="i-lucide-check-circle" class="size-4" /> Verifikasi Pemberi
        </button>
        <button v-if="canSelectBerkas" @click="showPilihBerkas = true" class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700">
          <UIcon name="i-lucide-folder-search" class="size-4" /> Pilih Berkas
        </button>
        <button v-if="canApprovePemberi" @click="showPersetujuanPemberi = true" class="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700">
          <UIcon name="i-lucide-check-check" class="size-4" /> Persetujuan Pemberi
        </button>
      </div>
    </main>

    <!-- Modal Verifikasi Pengusul -->
    <Teleport to="body">
      <div v-if="showVerifikasiPengusul" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showVerifikasiPengusul = false">
        <div class="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Verifikasi Pengusul</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="vpForm.kelengkapanBerkas" class="rounded border-gray-300 dark:border-gray-600" /> Kelengkapan berkas</label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="vpForm.kesesuaianTujuan" class="rounded border-gray-300 dark:border-gray-600" /> Kesesuaian tujuan</label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="vpForm.periodeWajar" class="rounded border-gray-300 dark:border-gray-600" /> Periode wajar</label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="vpForm.suratSah" class="rounded border-gray-300 dark:border-gray-600" /> Surat sah</label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="vpForm.tidakDuplikasi" class="rounded border-gray-300 dark:border-gray-600" /> Tidak duplikasi</label>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Keputusan</label>
              <select v-model="vpForm.keputusan" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <option :value="Keputusan.SETUJU">Setuju</option>
                <option :value="Keputusan.REVISI">Revisi</option>
                <option :value="Keputusan.TOLAK">Tolak</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Catatan</label>
              <textarea v-model="vpForm.catatan" rows="2" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"></textarea>
            </div>
            <div v-if="vpForm.keputusan === Keputusan.REVISI">
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Catatan Revisi <span class="text-red-500">*</span></label>
              <textarea v-model="vpForm.catatanRevisi" rows="2" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"></textarea>
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-3">
            <button @click="showVerifikasiPengusul = false" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Batal</button>
            <button @click="submitVerifikasiPengusul" :disabled="pending" class="rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-700 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700">{{ pending ? 'Mengirim...' : 'Kirim' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Verifikasi Pemberi -->
    <Teleport to="body">
      <div v-if="showVerifikasiPemberi" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showVerifikasiPemberi = false">
        <div class="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Verifikasi Pemberi (Sekretaris)</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="vpbForm.berkasTersedia" class="rounded border-gray-300 dark:border-gray-600" /> Berkas tersedia</label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="vpbForm.tidakAdaPembatasan" class="rounded border-gray-300 dark:border-gray-600" /> Tidak ada pembatasan</label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="vpbForm.tujuanMemadai" class="rounded border-gray-300 dark:border-gray-600" /> Tujuan memadai</label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="vpbForm.tidakBentrokRetensi" class="rounded border-gray-300 dark:border-gray-600" /> Tidak bentrok retensi</label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="vpbForm.disetujuiLanjut" class="rounded border-gray-300 dark:border-gray-600" /> Disetujui lanjut</label>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Durasi Disetujui</label>
              <select v-model="vpbForm.durasiAksesDisetujui" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <option v-for="opt in durasiOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Catatan Perubahan Durasi</label>
              <textarea v-model="vpbForm.catatanPerubahanDurasi" rows="2" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"></textarea>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Keputusan</label>
              <select v-model="vpbForm.keputusan" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <option :value="Keputusan.LANJUT">Lanjut</option>
                <option :value="Keputusan.TOLAK">Tolak</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Catatan</label>
              <textarea v-model="vpbForm.catatan" rows="2" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"></textarea>
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-3">
            <button @click="showVerifikasiPemberi = false" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Batal</button>
            <button @click="submitVerifikasiPemberi" :disabled="pending" class="rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-700 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700">{{ pending ? 'Mengirim...' : 'Kirim' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Persetujuan Pemberi -->
    <Teleport to="body">
      <div v-if="showPersetujuanPemberi" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showPersetujuanPemberi = false">
        <div class="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Persetujuan Pemberi (Managerial)</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="ppForm.berkasSesuai" class="rounded border-gray-300 dark:border-gray-600" /> Berkas sesuai</label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="ppForm.tidakMelanggarKebijakan" class="rounded border-gray-300 dark:border-gray-600" /> Tidak melanggar kebijakan</label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="ppForm.peminjamanTidakBerlebihan" class="rounded border-gray-300 dark:border-gray-600" /> Peminjaman tidak berlebihan</label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="ppForm.sudahDiverifikasiSekretaris" class="rounded border-gray-300 dark:border-gray-600" /> Sudah diverifikasi sekretaris</label>
            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" v-model="ppForm.disetujuiDiberikan" class="rounded border-gray-300 dark:border-gray-600" /> Disetujui diberikan</label>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Keputusan</label>
              <select v-model="ppForm.keputusan" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600">
                <option :value="Keputusan.SETUJU">Setuju</option>
                <option :value="Keputusan.REVISI">Revisi</option>
                <option :value="Keputusan.TOLAK">Tolak</option>
              </select>
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Catatan</label>
              <textarea v-model="ppForm.catatan" rows="2" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"></textarea>
            </div>
            <div v-if="ppForm.keputusan === Keputusan.REVISI">
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Catatan Revisi <span class="text-red-500">*</span></label>
              <textarea v-model="ppForm.catatanRevisi" rows="2" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"></textarea>
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-3">
            <button @click="showPersetujuanPemberi = false" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Batal</button>
            <button @click="submitPersetujuanPemberi" :disabled="pending" class="rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-700 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700">{{ pending ? 'Mengirim...' : 'Kirim' }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Pilih Berkas (SE Pemberi) -->
    <Teleport to="body">
      <div v-if="showPilihBerkas" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="showPilihBerkas = false">
        <div class="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-gray-800">
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Pilih Berkas</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Pilih berkas berstatus <strong>closed_retensi_aktif</strong> yang akan dipinjamkan.</p>
            </div>
            <button @click="showPilihBerkas = false" class="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700">
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>

          <div class="space-y-5 px-6 py-5">
            <!-- Section: Pilih Berkas -->
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Daftar Berkas Tersedia ({{ berkasEligibleList.length }})
              </label>
              <div class="relative mb-3">
                <UIcon name="i-lucide-search" class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="berkasSearch"
                  type="text"
                  placeholder="Cari judul / klasifikasi / nomor berkas…"
                  class="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>

              <div v-if="berkasLoading" class="flex items-center justify-center py-8">
                <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-primary-500" />
                <span class="ml-2 text-sm text-gray-500">Memuat berkas…</span>
              </div>
              <div v-else-if="filteredBerkas.length === 0" class="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-700">
                Tidak ada berkas eligible (closed_retensi_aktif) ditemukan.
              </div>
              <div v-else class="max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                <label
                  v-for="b in filteredBerkas"
                  :key="b.id"
                  class="flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  :class="{ 'bg-blue-50 dark:bg-blue-900/20': isBerkasSelected(b.id) }"
                >
                  <input
                    type="checkbox"
                    :checked="isBerkasSelected(b.id)"
                    @change="toggleBerkas(b.id)"
                    class="mt-0.5 rounded border-gray-300 dark:border-gray-600"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ b.judulBerkas }}</p>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <span v-if="b.nomorBerkas">{{ b.nomorBerkas }} · </span>
                      <span>{{ b.klasifikasiTeks || b.klasifikasi }}</span>
                      <span v-if="b.lokasi"> · {{ b.lokasi }}</span>
                    </p>
                  </div>
                </label>
              </div>
              <p v-if="pilihBerkasForm.berkasIds.length > 0" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {{ pilihBerkasForm.berkasIds.length }} berkas dipilih
              </p>
            </div>

            <!-- Section: Pilih Verifikator Pemberi -->
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Verifikator Pemberi (Managerial di Divisi Ini)
              </label>
              <div v-if="verifikatorPemberiLoading" class="flex items-center justify-center py-4">
                <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary-500" />
                <span class="ml-2 text-sm text-gray-500">Memuat verifikator…</span>
              </div>
              <div v-else-if="verifikatorPemberiList.length === 0" class="rounded-lg border border-dashed border-gray-200 py-6 text-center text-sm text-gray-500 dark:border-gray-700">
                Tidak ada managerial di divisi ini.
              </div>
              <div v-else class="space-y-1.5">
                <label
                  v-for="v in verifikatorPemberiList"
                  :key="v.persnum"
                  class="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-3 py-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                  :class="{ 'bg-blue-50 dark:bg-blue-900/20 border-blue-300': isVerifikatorPemberiSelected(v.persnum) }"
                >
                  <input
                    type="checkbox"
                    :checked="isVerifikatorPemberiSelected(v.persnum)"
                    @change="toggleVerifikatorPemberi(v.persnum, v.levelJabatan)"
                    class="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="{ 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': v.levelJabatan === 'AVP', 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': v.levelJabatan === 'VP', 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400': v.levelJabatan === 'EVP' }">{{ v.levelJabatan }}</span>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">{{ v.nama }}</span>
                  <span class="text-xs text-gray-500">· {{ v.jabatan }}</span>
                  <span class="ml-auto text-xs text-gray-400">Jenjang {{ v.urutan }}</span>
                </label>
              </div>
            </div>

            <!-- Section: Catatan -->
            <div>
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Catatan (opsional)</label>
              <textarea v-model="pilihBerkasForm.catatanPenerusan" rows="2" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white dark:border-gray-600"></textarea>
            </div>
          </div>

          <div class="flex justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Pilih minimal 1 berkas & 1 verifikator.
            </p>
            <div class="flex gap-3">
              <button @click="showPilihBerkas = false" class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Batal</button>
              <button @click="submitPilihBerkas" :disabled="pending" class="rounded-lg bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-700 disabled:opacity-50 dark:bg-primary-600 dark:hover:bg-primary-700">{{ pending ? 'Mengirim...' : 'Kirim' }}</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>