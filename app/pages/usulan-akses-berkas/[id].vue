<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '~/components/PageHeader.vue';
import Modal from '~/components/Modal.vue';
import Heading from '~/components/Heading.vue';
import UsulanAksesBerkasBadge from '~/components/usulan-akses-berkas/UsulanAksesBerkasBadge.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { useUsulanAksesBerkasCounts } from '~/composables/useUsulanAksesBerkasCounts';
import { useUsulanAksesBerkasViewed } from '~/composables/useUsulanAksesBerkasViewed';
import { useAuth } from '~/composables/useAuth';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';
import {
  StatusUsulan,
  Keputusan,
  DurasiPreset,
  type VerifikasiPengusulPayload,
  type VerifikasiPemberiPayload,
  type PersetujuanPemberiPayload,
  type PilihBerkasPayload,
  type VerifikatorItem,
  type LevelJabatan,
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
  fetchVerifikatorBod,
  verifikatorList,
} = useUsulanAksesBerkas();
const { fetchCounts: refetchUsulanCounts } = useUsulanAksesBerkasCounts();
const { markViewed: markUsulanViewed } = useUsulanAksesBerkasViewed();
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

// ── Toggle expand timeline ──
const timelineExpanded = ref(false);

// ── Toggle expand naskah per berkas ──
const expandedBerkasNaskah = ref<Set<string>>(new Set());
const toggleBerkasNaskah = (berkasId: string) => {
  if (expandedBerkasNaskah.value.has(berkasId)) {
    expandedBerkasNaskah.value.delete(berkasId);
  } else {
    expandedBerkasNaskah.value.add(berkasId);
  }
};

// ── Modal Setuju/Tolak (standarisasi VerifyActionModal) ──
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const approveTitle = ref('');
const approveDescription = ref('');
const rejectTitle = ref('');
const rejectCatatanKeSELabel = ref(''); // 'Pengusul' atau 'Pemberi' — kosong = tidak tampilkan field
const rejectWarning = ref(''); // Banner warning (untuk tolak yang bersifat terminal/closed)
const savingAction = ref(false);
const pendingApproveAction = ref<((note: string) => Promise<void>) | null>(null);
const pendingRejectAction = ref<((note: string, catatanKeSE?: string) => Promise<void>) | null>(null);

// ── Modal Verifikasi Pemberi: custom durasi dropdown ──
const showVpbDurasiDropdown = ref(false);
const vpbDurasiDropdownRef = ref<HTMLElement | null>(null);

// ── Verifikasi Pengusul form (checkbox dihapus) ──
const showVerifikasiPengusul = ref(false);
const vpForm = ref<VerifikasiPengusulPayload>({
  catatan: '',
  catatanRevisi: '',
  catatanKeSE: '',
  keputusan: Keputusan.SETUJU,
});

// ── Verifikasi Pemberi form (checkbox dihapus) ──
const showVerifikasiPemberi = ref(false);
const vpbForm = ref<VerifikasiPemberiPayload>({
  durasiAksesDisetujui: undefined,
  customTanggalSelesai: '',
  catatanPerubahanDurasi: '',
  catatan: '',
  keputusan: Keputusan.LANJUT,
});

// ── Persetujuan Pemberi form (checkbox dihapus, +durasi adjustment) ──
const showPersetujuanPemberi = ref(false);
const ppForm = ref<PersetujuanPemberiPayload>({
  catatan: '',
  catatanRevisi: '',
  catatanKeSE: '',
  keputusan: Keputusan.SETUJU,
  durasiAksesDisetujui: undefined,
  catatanPerubahanDurasi: '',
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

// Format tampilan durasi: CUSTOM tampilkan tanggal, lainnya tampilkan label
function formatDurasiLabel(preset: string, customDate?: string | null): string {
  if (preset === DurasiPreset.CUSTOM && customDate) {
    const tgl = new Date(customDate);
    return tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return durasiOptions.find(d => d.value === preset)?.label || preset.replace('_', ' ');
}

// Label durasi dari pengusul (untuk ditampilkan di modal Verifikasi Pemberi)
const durasiUsulanLabel = computed(() => {
  if (!usulanDetail.value) return '-';
  return formatDurasiLabel(usulanDetail.value.durasiAkses, usulanDetail.value.customTanggalSelesai);
});

// Position status: SE = Sekretaris, null/YBS/PT/PH/PS = Managerial
const isSekretaris = computed(() => user.value?.position_status === 'SE');
const isManagerial = computed(() => {
  if (!user.value) return false; // null saat loading → tidak ada aksi
  const ps = user.value.position_status;
  if (ps === 'SE' || ps === 'VI') return false;
  // Cek jabatan: BOD atau legacy AVP/VP/EVP
  const pos = (user.value.positionText || '').toUpperCase();
  const hasBod = pos.includes('BOD');
  const hasLegacy = pos.includes('EVP') || pos.includes('AVP') || pos.includes(' VP ') || pos.startsWith('VP ') || pos === 'VP';
  return hasBod || hasLegacy;
});

// Normalize levelJabatan: BOD-1/2/3 → BOD untuk tampilan
const normalizeLevelJabatan = (level?: string | null): string => {
  if (!level) return '';
  if (level.startsWith('BOD')) return 'BOD';
  return level;
};

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
const showVerikPemberiDropdown = ref(false);
const verikPemberiDropdownRef = ref<HTMLElement | null>(null);

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

// Verifikator Pemberi list (BOD di divisi pemberi) — reuses fetchVerifikatorBod
const verifikatorPemberiList = ref<VerifikatorItem[]>([]);
const verifikatorPemberiLoading = ref(false);

const toggleBerkas = (id: string) => {
  const idx = pilihBerkasForm.value.berkasIds.indexOf(id);
  if (idx === -1) {
    pilihBerkasForm.value.berkasIds.push(id);
  } else {
    pilihBerkasForm.value.berkasIds.splice(idx, 1);
  }
};

const toggleVerifikatorPemberi = (persnum: number, levelJabatan: LevelJabatan) => {
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

// Sort order for verifikator pemberi chips: EVP → VP → AVP → BOD
const LEVEL_ORDER_PEMBERI: Record<string, number> = {
  EVP: 1, VP: 2, AVP: 3, BOD: 4,
  'BOD-1': 4, 'BOD-2': 4, 'BOD-3': 4,
};

const getVerifikatorPemberiItem = (persnum: number) =>
  verifikatorPemberiList.value.find((v) => v.persnum === persnum);

const sortedVerifikatorPemberi = computed(() => {
  return [...pilihBerkasForm.value.verifikatorPemberi].sort((a, b) => {
    const la = a.levelJabatan ?? '';
    const lb = b.levelJabatan ?? '';
    const na = la.startsWith('BOD') ? 'BOD' : la;
    const nb = lb.startsWith('BOD') ? 'BOD' : lb;
    return (LEVEL_ORDER_PEMBERI[na] ?? 99) - (LEVEL_ORDER_PEMBERI[nb] ?? 99);
  }).map((v) => {
    const item = getVerifikatorPemberiItem(v.persnum);
    return { ...v, nama: item?.nama, jabatan: item?.jabatan, catatan: v.catatan };
  });
});

const availableVerifikatorPemberi = computed(() => {
  const selectedPersnums = new Set(pilihBerkasForm.value.verifikatorPemberi.map((v) => v.persnum));
  const selectedLevels = new Set(pilihBerkasForm.value.verifikatorPemberi.map((v) => v.levelJabatan));
  return verifikatorPemberiList.value
    .filter((v) => !selectedPersnums.has(v.persnum) && !selectedLevels.has(v.levelJabatan))
    .sort((a, b) => (LEVEL_ORDER_PEMBERI[a.levelJabatan] ?? 99) - (LEVEL_ORDER_PEMBERI[b.levelJabatan] ?? 99));
});

const onSelectVerifikatorPemberi = (value: any) => {
  const persnum = Number(value);
  if (!persnum || isNaN(persnum)) return;
  const item = verifikatorPemberiList.value.find((v) => v.persnum === persnum);
  if (item && !isVerifikatorPemberiSelected(persnum)) {
    if (pilihBerkasForm.value.verifikatorPemberi.length >= 3) {
      toast.add({ title: 'Maksimal 3 verifikator', color: 'error' });
      return;
    }
    pilihBerkasForm.value.verifikatorPemberi.push({ persnum, levelJabatan: item.levelJabatan, catatan: '' });
  }
};

const loadBerkasEligible = async () => {
  berkasLoading.value = true;
  try {
    // Tampilkan semua berkas berstatus closed_retensi_aktif (tertutup).
    const status = 'closed_retensi_aktif';
    berkasEligibleList.value = await fetchBerkasEligible(status);
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
    // Fetch BOD + delegasi aktif di divisi pemberi (dari usulan).
    // Ini penting karena SE bisa didelegasikan dari divisi lain.
    const divisiPemberiId = usulanDetail.value?.divisiPemberiId;
    await fetchVerifikatorBod(divisiPemberiId ? Number(divisiPemberiId) : undefined);
    verifikatorPemberiList.value = verifikatorList.value || [];
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

// Reset state saat modal Verifikasi Pemberi dibuka — default kosong
watch(showVerifikasiPemberi, (newVal) => {
  if (newVal) {
    vpbForm.value.durasiAksesDisetujui = undefined;
    vpbForm.value.customTanggalSelesai = '';
    vpbForm.value.catatan = '';
  }
});

// Reset state saat modal dibuka — saat revisi/re-verify, pre-fill dengan berkas & verifikator sebelumnya
watch(showPilihBerkas, async (newVal) => {
  if (newVal) {
    // Pre-fill berkas yang sudah dipilih sebelumnya (jika ada — revisi case)
    const prevBerkas = (usulanDetail.value?.selectedBerkas || []).map((b: any) => b.berkasId);
    const prevVerifikator = (usulanDetail.value?.verifikatorPemberi || []).map((v: any) => ({
      persnum: v.persnum,
      levelJabatan: v.levelJabatan,
      catatan: v.catatan || '',
    }));
    pilihBerkasForm.value.berkasIds = prevBerkas;
    pilihBerkasForm.value.verifikatorPemberi = prevVerifikator;
    pilihBerkasForm.value.catatanPenerusan = '';
    berkasSearch.value = '';
    await Promise.all([loadBerkasEligible(), loadVerifikatorPemberi()]);
  }
});

// Click outside handler untuk dropdown verifikator pemberi
const handleClickOutsideVerikPemberi = (e: MouseEvent) => {
  if (verikPemberiDropdownRef.value && !verikPemberiDropdownRef.value.contains(e.target as Node)) {
    showVerikPemberiDropdown.value = false;
  }
};

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
  return usulanDetail.value?.status === StatusUsulan.PEMILIHAN_BERKAS ||
         usulanDetail.value?.status === StatusUsulan.REVISI_PEMBERI;
});

// SE pemberi bisa tolak (closed) saat usulan dikembalikan oleh verifikator pemberi
const canRejectPemberiClosed = computed(() => {
  if (!isSekretarisPemberi.value) return false;
  return (usulanDetail.value?.status === StatusUsulan.REVISI_PEMBERI ||
          usulanDetail.value?.status === StatusUsulan.TERKIRIM_KE_PEMBERI) &&
         !!usulanDetail.value?.catatanRevisiPemberi;
});

// Nama & jabatan verifikator pemberi yang memberikan revisi (step pemberi terbaru dengan TOLAK/REVISI)
const revisiPemberiVerifier = computed(() => {
  const steps = usulanDetail.value?.steps || [];
  const pemberiRejectSteps = steps
    .filter((s: any) => s.roleTahap?.includes('PEMBERI') && s.roleTahap !== 'SEKRETARIS_PEMBERI' &&
            (s.keputusan === Keputusan.TOLAK || s.keputusan === Keputusan.REVISI))
    .sort((a: any, b: any) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime());
  const step = pemberiRejectSteps[0];
  if (!step) return null;
  return {
    nama: step.verifierNama || null,
    jabatan: step.verifierJabatan || null,
  };
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

const formatDateOnly = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

// Hitung tanggal berakhir dari durasiAkses (untuk usulan yang belum diterbitkan)
const DURASI_HARI: Record<string, number> = {
  '7_HARI': 7,
  '14_HARI': 14,
  '1_BULAN': 30,
  '2_BULAN': 60,
  '3_BULAN': 90,
  '6_BULAN': 180,
  '1_TAHUN': 365,
};

const tanggalBerakhirDurasi = computed(() => {
  if (!usulanDetail.value) return null;
  // Jika sudah ada tanggalSelesai (sudah diterbitkan), pakai itu
  if (usulanDetail.value.tanggalSelesai) return usulanDetail.value.tanggalSelesai;
  // Custom: pakai customTanggalSelesai yang dipilih pengusul
  if (usulanDetail.value.durasiAkses === 'CUSTOM' && usulanDetail.value.customTanggalSelesai) {
    return usulanDetail.value.customTanggalSelesai;
  }
  if (usulanDetail.value.durasiAkses === 'CUSTOM') return null;
  // Hitung dari createdAt + durasi
  const hari = DURASI_HARI[usulanDetail.value.durasiAkses];
  if (!hari) return null;
  const base = new Date(usulanDetail.value.createdAt);
  base.setDate(base.getDate() + hari);
  return base.toISOString();
});

// True jika akses sudah lewat tanggal selesai (durasi habis).
const isAccessExpired = computed(() => {
  if (!usulanDetail.value) return false;
  const end = tanggalBerakhirDurasi.value;
  if (!end) return false;
  return new Date(end).getTime() < Date.now();
});

// ── Timeline: gabungkan step "Dibuat" + verification steps ──
// Catatan hanya bisa dilihat oleh pembuat catatan (verifierPersnum) dan pengusul.
interface TimelineEntry {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  jabatan?: string;
  action: string;
  actionColor: string;
  timestamp: string;
  catatan?: string | null;
  catatanRevisi?: string | null;
  catatanKeSE?: string | null; // catatan khusus dari verifikator ke SE-nya
  isPengusulStep?: boolean; // true jika step ini dari verifikator pengusul
}

const timelineEntries = computed<TimelineEntry[]>(() => {
  if (!usulanDetail.value) return [];
  const userPersnum = Number(user.value?.persnum);
  const pengusulPersnum = Number(usulanDetail.value.pengusulPersnum);
  const isPengusul = userPersnum === pengusulPersnum;

  const entries: TimelineEntry[] = [];

  // Step 0: Dibuat oleh SE
  entries.push({
    id: 'created',
    icon: 'i-lucide-file-plus',
    iconBg: 'bg-primary-500',
    title: usulanDetail.value.pengusulInfo?.nama || `Persnum ${pengusulPersnum}`,
    jabatan: usulanDetail.value.pengusulInfo?.jabatan,
    action: 'Pembuat Usulan',
    actionColor: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
    timestamp: usulanDetail.value.createdAt,
  });

  // Helper: build a step entry
  const buildStepEntry = (step: any): TimelineEntry => {
    const isCatatanOwner = Number(step.verifierPersnum) === userPersnum;
    const isPengusulStep = step.roleTahap?.includes('PENGUSUL');
    const isPemberiStep = step.roleTahap?.includes('PEMBERI') && step.roleTahap !== 'SEKRETARIS_PEMBERI';
    // catatan verifikasi biasa: hanya verifikator itu + SE terkait (pengusul/pemberi)
    const canSeeCatatan = isCatatanOwner ||
      (isPengusulStep && isPengusul) ||
      (isPemberiStep && isSekretarisPemberi.value);
    // catatanKeSE: sama — hanya verifikator itu + SE terkait
    const canSeeCatatanKeSE = canSeeCatatan;
    return {
      id: step.id,
      icon:
        step.keputusan === Keputusan.SETUJU || step.keputusan === Keputusan.LANJUT
          ? 'i-lucide-check'
          : step.keputusan === Keputusan.TOLAK
            ? 'i-lucide-x'
            : 'i-lucide-alert-triangle',
      iconBg:
        step.keputusan === Keputusan.SETUJU || step.keputusan === Keputusan.LANJUT
          ? 'bg-green-500'
          : step.keputusan === Keputusan.TOLAK
            ? 'bg-red-500'
            : 'bg-orange-500',
      title: step.verifierNama || `Persnum ${step.verifierPersnum}`,
      jabatan: step.verifierJabatan,
      action:
        step.keputusan === Keputusan.SETUJU ? 'Disetujui'
        : step.keputusan === Keputusan.TOLAK ? 'Ditolak'
        : step.keputusan === Keputusan.REVISI ? 'Diminta Revisi'
        : step.keputusan === Keputusan.LANJUT ? 'Dilanjutkan'
        : step.keputusan,
      actionColor:
        step.keputusan === Keputusan.SETUJU || step.keputusan === Keputusan.LANJUT
          ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : step.keputusan === Keputusan.TOLAK
            ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      timestamp: step.verifiedAt,
      catatan: canSeeCatatan ? step.catatan : null,
      catatanRevisi: canSeeCatatan ? step.catatanRevisi : null,
      catatanKeSE: canSeeCatatanKeSE ? step.catatanKeSE : null,
      isPengusulStep,
    };
  };

  const allSteps = usulanDetail.value.steps || [];

  // Phase 1: Verifikator Pengusul steps (urut by verifiedAt)
  const pengusulSteps = allSteps
    .filter((s: any) => s.roleTahap?.includes('PENGUSUL'))
    .sort((a: any, b: any) => new Date(a.verifiedAt).getTime() - new Date(b.verifiedAt).getTime());
  for (const step of pengusulSteps) {
    entries.push(buildStepEntry(step));
  }

  // Phase 2: Milestone — Terkirim ke Pemberi (setelah pengusul approve semua)
  if (usulanDetail.value.status === StatusUsulan.TERKIRIM_KE_PEMBERI ||
      usulanDetail.value.status === StatusUsulan.PEMILIHAN_BERKAS ||
      usulanDetail.value.status === StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI ||
      usulanDetail.value.status === StatusUsulan.MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI ||
      usulanDetail.value.status === StatusUsulan.MENUNGGU_PERSETUJUAN_EVP_PEMBERI ||
      usulanDetail.value.status === StatusUsulan.AKSES_DITERBITKAN ||
      usulanDetail.value.status === StatusUsulan.SELESAI) {
    const lanjutStep = allSteps
      .filter((s: any) => s.keputusan === Keputusan.LANJUT)
      .sort((a: any, b: any) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime())[0];
    entries.push({
      id: 'sent-to-pemberi',
      icon: 'i-lucide-send',
      iconBg: 'bg-primary-500',
      title: usulanDetail.value.divisiPemberiNama || 'Divisi Pemberi',
      jabatan: 'Sekretaris Divisi Pemberi',
      action: 'Terkirim ke Pemberi',
      actionColor: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      timestamp: lanjutStep?.verifiedAt || usulanDetail.value.updatedAt,
    });
  }

  // Phase 3: SE Pemberi step (LANJUT/TOLAK)
  const sePemberiSteps = allSteps
    .filter((s: any) => s.roleTahap === 'SEKRETARIS_PEMBERI')
    .sort((a: any, b: any) => new Date(a.verifiedAt).getTime() - new Date(b.verifiedAt).getTime());
  for (const step of sePemberiSteps) {
    entries.push(buildStepEntry(step));
  }

  // Phase 4: Milestone — Berkas Dipilih (setelah SE pemberi pilih berkas)
  if (usulanDetail.value.selectedBerkas && usulanDetail.value.selectedBerkas.length > 0) {
    // Timestamp = step SEKRETARIS_PEMBERI terbaru, atau updatedAt
    const lastSePemberi = sePemberiSteps[sePemberiSteps.length - 1];
    entries.push({
      id: 'berkas-selected',
      icon: 'i-lucide-folder-check',
      iconBg: 'bg-green-500',
      title: usulanDetail.value.divisiPemberiNama || 'Divisi Pemberi',
      jabatan: 'Sekretaris Divisi Pemberi',
      action: 'Berkas Dipilih',
      actionColor: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      timestamp: lastSePemberi?.verifiedAt || usulanDetail.value.updatedAt,
    });
  }

  // Phase 5: Verifikator Pemberi steps (urut by verifiedAt)
  const pemberiSteps = allSteps
    .filter((s: any) => s.roleTahap?.includes('PEMBERI') && s.roleTahap !== 'SEKRETARIS_PEMBERI')
    .sort((a: any, b: any) => new Date(a.verifiedAt).getTime() - new Date(b.verifiedAt).getTime());
  for (const step of pemberiSteps) {
    entries.push(buildStepEntry(step));
  }

  // Phase 6: Milestone — Akses Diterbitkan (setelah pemberi approve semua)
  if (usulanDetail.value.status === StatusUsulan.AKSES_DITERBITKAN ||
      usulanDetail.value.status === StatusUsulan.SELESAI) {
    const lastPemberiStep = pemberiSteps[pemberiSteps.length - 1];
    entries.push({
      id: 'akses-diterbitkan',
      icon: 'i-lucide-badge-check',
      iconBg: 'bg-green-500',
      title: 'Akses Diterbitkan',
      jabatan: `${usulanDetail.value.selectedBerkas?.length || 0} berkas diberikan`,
      action: 'Selesai',
      actionColor: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      timestamp: lastPemberiStep?.verifiedAt || usulanDetail.value.updatedAt,
    });
  }

  // Milestone: Akses kadaluarsa / menunggu berakhir
  if (usulanDetail.value.status === StatusUsulan.SELESAI) {
    entries.push({
      id: 'menunggu-berakhir',
      icon: 'i-lucide-hourglass',
      iconBg: 'bg-gray-400',
      title: 'Menunggu Berakhir',
      jabatan: usulanDetail.value.tanggalSelesai
        ? `Berakhir: ${formatDate(usulanDetail.value.tanggalSelesai)}`
        : 'Akses aktif sampai tanggal selesai',
      action: 'Akses Aktif',
      actionColor: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
      timestamp: usulanDetail.value.tanggalSelesai || usulanDetail.value.updatedAt,
    });
  }

  // Milestone: Ditolak
  if (usulanDetail.value.status === StatusUsulan.DITOLAK_PENGUSUL ||
      usulanDetail.value.status === StatusUsulan.DITOLAK_PEMBERI) {
    entries.push({
      id: 'ditolak',
      icon: 'i-lucide-x',
      iconBg: 'bg-red-500',
      title: 'Usulan Ditolak',
      action: usulanDetail.value.status === StatusUsulan.DITOLAK_PENGUSUL ? 'Ditolak Pengusul' : 'Ditolak Pemberi',
      actionColor: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      timestamp: usulanDetail.value.updatedAt,
    });
  }

  // Sort ascending by timestamp, with tie-breaker that puts:
  //   - created first (bottom)
  //   - pengusul verification steps
  //   - sent-to-pemberi (right after pengusul, before pemberi)
  //   - pemberi verification steps
  //   - berkas-selected, akses-diterbitkan, menunggu-berakhir, ditolak (top)
  const stepRoleTahap = (entry: TimelineEntry): string | null => {
    if (entry.id === 'created') return null;
    if (entry.id === 'sent-to-pemberi') return 'SENT_TO_PEMBERI';
    if (entry.id === 'berkas-selected') return 'BERKAS_SELECTED';
    if (entry.id === 'akses-diterbitkan') return 'AKSES_DITERBITKAN';
    if (entry.id === 'menunggu-berakhir') return 'MENUNGGU_BERAKHIR';
    if (entry.id === 'ditolak') return 'DITOLAK';
    // verification step: lookup roleTahap by id
    const step = (usulanDetail.value.steps || []).find((s: any) => s.id === entry.id);
    return step?.roleTahap || null;
  };
  const orderIndex = (entry: TimelineEntry): number => {
    const role = stepRoleTahap(entry);
    if (role === null) return 0; // created
    if (role === 'SENT_TO_PEMBERI') return 2;
    if (role && role.includes('_PENGUSUL')) return 1;
    if (role && (role === 'SEKRETARIS_PEMBERI' || role.includes('_PEMBERI'))) return 3;
    if (role === 'BERKAS_SELECTED') return 4;
    if (role === 'AKSES_DITERBITKAN') return 5;
    if (role === 'MENUNGGU_BERAKHIR') return 6;
    if (role === 'DITOLAK') return 7;
    return 1;
  };
  entries.sort((a, b) => {
    const ta = new Date(a.timestamp || 0).getTime();
    const tb = new Date(b.timestamp || 0).getTime();
    if (ta !== tb) return ta - tb;
    return orderIndex(a) - orderIndex(b);
  });
  return entries.reverse();
});

// ── Next Action: tampilkan langkah verifikasi berikutnya ──
const nextActionInfo = computed(() => {
  if (!usulanDetail.value) return null;
  const s = usulanDetail.value.status;
  const steps = usulanDetail.value.steps || [];

  // Jika sudah selesai/ditolak/kadaluarsa, tidak ada next action (milestone sudah ada di timeline)
  if ([StatusUsulan.SELESAI, StatusUsulan.DITOLAK_PENGUSUL, StatusUsulan.DITOLAK_PEMBERI, StatusUsulan.AKSES_KADALUARSA].includes(s)) {
    return null;
  }

  // Jika ditolak, tidak ada next action
  if (s === StatusUsulan.DITOLAK_PENGUSUL || s === StatusUsulan.DITOLAK_PEMBERI) {
    return null;
  }

  // Tahap pengusul
  if (s === StatusUsulan.MENUNGGU_VERIFIKASI_PENGUSUL || s === StatusUsulan.MENUNGGU_VERIFIKASI_AKHIR_PENGUSUL || s === StatusUsulan.MENUNGGU_VERIFIKASI_EVP_PENGUSUL) {
    let expectedUrutan = 1;
    if (s === StatusUsulan.MENUNGGU_VERIFIKASI_AKHIR_PENGUSUL) expectedUrutan = 2;
    if (s === StatusUsulan.MENUNGGU_VERIFIKASI_EVP_PENGUSUL) expectedUrutan = 3;
    const verifikator = usulanDetail.value.verifikatorPengusul?.find((v: any) => v.urutan === expectedUrutan);
    if (verifikator) {
      return {
        label: `Menunggu verifikasi pengusul jenjang ${expectedUrutan}`,
        oleh: verifikator.nama || `Persnum ${verifikator.persnum}`,
        jabatan: verifikator.jabatan || verifikator.levelJabatan || '',
      };
    }
  }

  // Tahap pemberi
  if (s === StatusUsulan.TERKIRIM_KE_PEMBERI) {
    return {
      label: 'Menunggu konfirmasi pemberi (Sekretaris)',
      oleh: usulanDetail.value.divisiPemberiNama || '-',
      jabatan: 'Sekretaris Divisi Pemberi',
    };
  }
  if (s === StatusUsulan.PEMILIHAN_BERKAS) {
    return {
      label: 'Menunggu pemilihan berkas oleh pemberi',
      oleh: usulanDetail.value.divisiPemberiNama || '-',
      jabatan: 'Sekretaris Divisi Pemberi',
    };
  }
  if (s === StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI || s === StatusUsulan.MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI || s === StatusUsulan.MENUNGGU_PERSETUJUAN_EVP_PEMBERI) {
    let expectedUrutan = 1;
    if (s === StatusUsulan.MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI) expectedUrutan = 2;
    if (s === StatusUsulan.MENUNGGU_PERSETUJUAN_EVP_PEMBERI) expectedUrutan = 3;
    const verifikator = usulanDetail.value.verifikatorPemberi?.find((v: any) => v.urutan === expectedUrutan);
    if (verifikator) {
      return {
        label: `Menunggu persetujuan pemberi jenjang ${expectedUrutan}`,
        oleh: verifikator.nama || `Persnum ${verifikator.persnum}`,
        jabatan: verifikator.jabatan || verifikator.levelJabatan || '',
      };
    }
  }

  // Akses sudah diterbitkan/selesai — tidak ada next action (lihat milestone di timeline)
  if (s === StatusUsulan.AKSES_DITERBITKAN) {
    return null;
  }

  return null;
});

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

const submitVerifikasiPengusulRevisi = async () => {
  if (!vpForm.value.catatanRevisi?.trim() || vpForm.value.catatanRevisi.trim().length < 5) {
    toast.add({ title: 'Catatan revisi wajib diisi (minimal 5 karakter)', color: 'error' });
    return;
  }
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
    await verifikasiPengusul(id.value, jenjang, {
      catatan: '',
      catatanRevisi: vpForm.value.catatanRevisi,
      catatanKeSE: vpForm.value.catatanKeSE || undefined,
      keputusan: Keputusan.REVISI,
    });
    toast.add({ title: 'Berhasil', description: 'Permintaan revisi terkirim', color: 'success' });
    showVerifikasiPengusul.value = false;
    vpForm.value.catatanRevisi = '';
    vpForm.value.catatanKeSE = '';
    await loadDetail();
  } catch (err: any) {
    toast.add({ title: 'Gagal Kirim Revisi', description: extractErrorMessage(err), color: 'error' });
  }
};

const submitVerifikasiPemberi = async () => {
  // Validasi: jika CUSTOM, tanggal berakhir wajib diisi
  if (vpbForm.value.durasiAksesDisetujui === 'CUSTOM' && !vpbForm.value.customTanggalSelesai) {
    toast.add({ title: 'Tanggal berakhir wajib diisi untuk durasi Custom', color: 'error' });
    return;
  }
  try {
    await verifikasiPemberi(id.value, vpbForm.value);
    toast.add({ title: 'Berhasil', description: 'Verifikasi pemberi terkirim', color: 'success' });
    showVerifikasiPemberi.value = false;
    await loadDetail();
  } catch (err: any) {
    toast.add({ title: 'Gagal Verifikasi', description: extractErrorMessage(err), color: 'error' });
  }
};

const submitVerifikasiPemberiLanjut = async () => {
  // Validasi: jika CUSTOM, tanggal berakhir wajib diisi
  if (vpbForm.value.durasiAksesDisetujui === 'CUSTOM' && !vpbForm.value.customTanggalSelesai) {
    toast.add({ title: 'Tanggal berakhir wajib diisi untuk durasi Custom', color: 'error' });
    return;
  }
  try {
    await verifikasiPemberi(id.value, {
      durasiAksesDisetujui: vpbForm.value.durasiAksesDisetujui,
      customTanggalSelesai: vpbForm.value.customTanggalSelesai || undefined,
      catatanPerubahanDurasi: '',
      catatan: vpbForm.value.catatan,
      keputusan: Keputusan.LANJUT,
    });
    toast.add({ title: 'Berhasil', description: 'Usulan diteruskan ke pemilihan berkas', color: 'success' });
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

const submitPersetujuanPemberiRevisi = async () => {
  if (!ppForm.value.catatanRevisi?.trim() || ppForm.value.catatanRevisi.trim().length < 5) {
    toast.add({ title: 'Catatan revisi wajib diisi (minimal 5 karakter)', color: 'error' });
    return;
  }
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
    await persetujuanPemberi(id.value, jenjang, {
      catatan: '',
      catatanRevisi: ppForm.value.catatanRevisi,
      catatanKeSE: ppForm.value.catatanKeSE || undefined,
      keputusan: Keputusan.REVISI,
      durasiAksesDisetujui: undefined,
      catatanPerubahanDurasi: '',
    });
    toast.add({ title: 'Berhasil', description: 'Permintaan revisi terkirim', color: 'success' });
    showPersetujuanPemberi.value = false;
    ppForm.value.catatanRevisi = '';
    ppForm.value.catatanKeSE = '';
    await loadDetail();
  } catch (err: any) {
    toast.add({ title: 'Gagal Kirim Revisi', description: extractErrorMessage(err), color: 'error' });
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

// ── Quick verify: Setuju/Tolak langsung dengan VerifyActionModal ──
const quickVerifyPengusul = (keputusan: Keputusan) => {
  const userPersnum = Number(user.value?.persnum);
  const verifikator = usulanDetail.value?.verifikatorPengusul?.find(
    (v: any) => v.persnum === userPersnum,
  );
  if (!verifikator) {
    toast.add({ title: 'Anda bukan verifikator pengusul', color: 'error' });
    return;
  }
  const jenjang = verifikator.urutan as 1 | 2 | 3;

  if (keputusan === Keputusan.TOLAK) {
    rejectTitle.value = 'Tolak Usulan (Verifikator Pengusul)';
    rejectCatatanKeSELabel.value = 'Pengusul';
    pendingRejectAction.value = async (note: string, catatanKeSE?: string) => {
      try {
        await verifikasiPengusul(id.value, jenjang, {
          catatan: note,
          catatanRevisi: '',
          catatanKeSE,
          keputusan,
        });
        toast.add({ title: 'Berhasil', description: 'Usulan ditolak', color: 'success' });
        await loadDetail();
        refetchUsulanCounts(true);
      } catch (err: any) {
        toast.add({ title: 'Gagal Verifikasi', description: extractErrorMessage(err), color: 'error' });
      }
    };
    showRejectModal.value = true;
    return;
  }

  // SETUJU
  approveTitle.value = 'Setujui Usulan Akses Berkas';
  approveDescription.value = 'Apakah Anda yakin ingin menyetujui usulan akses berkas ini?';
  pendingApproveAction.value = async (note: string) => {
    try {
      await verifikasiPengusul(id.value, jenjang, {
        catatan: note,
        catatanRevisi: '',
        keputusan,
      });
      toast.add({ title: 'Berhasil', description: 'Usulan disetujui', color: 'success' });
      await loadDetail();
      refetchUsulanCounts(true);
    } catch (err: any) {
      toast.add({ title: 'Gagal Verifikasi', description: extractErrorMessage(err), color: 'error' });
    }
  };
  showApproveModal.value = true;
};

const quickRejectPemberi = () => {
  rejectTitle.value = 'Tolak Usulan oleh Pemberi';
  rejectCatatanKeSELabel.value = ''; // SE pemberi tidak butuh catatanKeSE
  pendingRejectAction.value = async (note: string, _catatanKeSE?: string) => {
    try {
      await verifikasiPemberi(id.value, {
        durasiAksesDisetujui: usulanDetail.value?.durasiAkses || DurasiPreset.SATU_TAHUN,
        catatanPerubahanDurasi: '',
        catatan: note,
        keputusan: Keputusan.TOLAK,
      });
      toast.add({ title: 'Berhasil', description: 'Usulan ditolak', color: 'success' });
      await loadDetail();
      refetchUsulanCounts(true);
    } catch (err: any) {
      toast.add({ title: 'Gagal Verifikasi', description: extractErrorMessage(err), color: 'error' });
    }
  };
  showRejectModal.value = true;
};

// Tolak & tutup usulan (closed) — SE pemberi menutup usulan saat revisi dari verifikator
const rejectPemberiClosed = () => {
  rejectTitle.value = 'Tolak & Tutup Usulan';
  rejectCatatanKeSELabel.value = '';
  rejectWarning.value = 'Tindakan ini akan menutup usulan akses berkas secara permanen. Usulan yang sudah ditutup tidak dapat diproses lebih lanjut.';
  pendingRejectAction.value = async (note: string, _catatanKeSE?: string) => {
    try {
      await verifikasiPemberi(id.value, {
        durasiAksesDisetujui: usulanDetail.value?.durasiAkses || DurasiPreset.SATU_TAHUN,
        catatanPerubahanDurasi: '',
        catatan: note,
        keputusan: Keputusan.TOLAK,
      });
      toast.add({ title: 'Berhasil', description: 'Usulan ditolak dan ditutup', color: 'success' });
      await loadDetail();
      refetchUsulanCounts(true);
    } catch (err: any) {
      toast.add({ title: 'Gagal Menolak', description: extractErrorMessage(err), color: 'error' });
    }
  };
  showRejectModal.value = true;
};

const quickApprovePemberi = (keputusan: Keputusan) => {
  const userPersnum = Number(user.value?.persnum);
  const verifikator = usulanDetail.value?.verifikatorPemberi?.find(
    (v: any) => v.persnum === userPersnum,
  );
  if (!verifikator) {
    toast.add({ title: 'Anda bukan verifikator pemberi', color: 'error' });
    return;
  }
  const jenjang = verifikator.urutan as 1 | 2 | 3;

  if (keputusan === Keputusan.TOLAK) {
    rejectTitle.value = 'Tolak Usulan (Persetujuan Pemberi)';
    rejectCatatanKeSELabel.value = 'Pemberi';
    pendingRejectAction.value = async (note: string, catatanKeSE?: string) => {
      try {
        await persetujuanPemberi(id.value, jenjang, {
          catatan: note,
          catatanRevisi: '',
          catatanKeSE,
          keputusan,
          durasiAksesDisetujui: undefined,
          catatanPerubahanDurasi: '',
        });
        toast.add({ title: 'Berhasil', description: 'Usulan ditolak', color: 'success' });
        await loadDetail();
        refetchUsulanCounts(true);
      } catch (err: any) {
        toast.add({ title: 'Gagal Persetujuan', description: extractErrorMessage(err), color: 'error' });
      }
    };
    showRejectModal.value = true;
    return;
  }

  // SETUJU
  approveTitle.value = 'Setujui Usulan Akses Berkas';
  approveDescription.value = 'Apakah Anda yakin ingin menyetujui usulan akses berkas ini?';
  pendingApproveAction.value = async (note: string) => {
    try {
      await persetujuanPemberi(id.value, jenjang, {
        catatan: note,
        catatanRevisi: '',
        keputusan,
        durasiAksesDisetujui: undefined,
        catatanPerubahanDurasi: '',
      });
      toast.add({ title: 'Berhasil', description: 'Persetujuan terkirim', color: 'success' });
      await loadDetail();
      refetchUsulanCounts(true);
    } catch (err: any) {
      toast.add({ title: 'Gagal Persetujuan', description: extractErrorMessage(err), color: 'error' });
    }
  };
  showApproveModal.value = true;
};

// Handler untuk VerifyActionModal
const handleApprove = async (note: string) => {
  showApproveModal.value = false;
  if (pendingApproveAction.value) {
    savingAction.value = true;
    try {
      await pendingApproveAction.value(note);
    } finally {
      savingAction.value = false;
    }
    pendingApproveAction.value = null;
  }
};

const handleRejectAction = async (note: string, catatanKeSE?: string) => {
  if (!note.trim() || note.trim().length < 5) {
    toast.add({ title: 'Alasan penolakan wajib diisi (minimal 5 karakter)', color: 'error' });
    return;
  }
  showRejectModal.value = false;
  rejectWarning.value = '';
  if (pendingRejectAction.value) {
    savingAction.value = true;
    try {
      await pendingRejectAction.value(note, catatanKeSE);
    } finally {
      savingAction.value = false;
    }
    pendingRejectAction.value = null;
  }
};

// Click outside untuk dropdown durasi di modal Verifikasi Pemberi
const handleClickOutsideVpb = (e: MouseEvent) => {
  if (vpbDurasiDropdownRef.value && !vpbDurasiDropdownRef.value.contains(e.target as Node)) {
    showVpbDurasiDropdown.value = false;
  }
};

onMounted(() => {
  loadDetail();
  // Re-fetch counts untuk update badge di sidebar
  refetchUsulanCounts(true);
  // Mark usulan ini sebagai viewed (sinkron dengan BE → counts badge
  // akan exclude usulan ini pada next fetchCounts).
  markUsulanViewed(id.value);
  document.addEventListener('click', handleClickOutsideVpb);
  document.addEventListener('click', handleClickOutsideVerikPemberi);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutsideVpb);
  document.removeEventListener('click', handleClickOutsideVerikPemberi);
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <h1 class="text-xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
          {{ usulanDetail?.nomorUsulan || 'Detail Usulan' }}
        </h1>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="pending && !usulanDetail" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <!-- Error -->
    <div v-else-if="!usulanDetail" class="flex min-h-96 flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
      <UIcon name="i-lucide-circle-alert" class="size-12 opacity-30" />
      <p class="text-sm">Detail usulan tidak dapat dimuat.</p>
      <UButton color="primary" variant="soft" icon="i-lucide-arrow-left" to="/usulan-akses-berkas">Kembali ke Daftar</UButton>
    </div>

    <main v-else-if="usulanDetail" class="mx-auto max-w-6xl space-y-4">
      <!-- 2-column layout: info kiri, flow/status kanan -->
      <section class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <!-- KIRI: Informasi Usulan + Tujuan Akses + Catatan Revisi -->
        <div class="space-y-4 xl:col-span-2">
          <!-- Informasi Usulan -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-folder-archive" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Informasi Usulan</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Detail metadata usulan akses berkas.</p>
              </div>
              <UsulanAksesBerkasBadge :status="usulanDetail.status" class="ml-auto" />
            </div>
            <dl class="grid grid-cols-1 gap-x-8 px-5 sm:grid-cols-2">
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-file-text" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Jenis Berkas</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.jenisBerkas }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-user" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Pengusul</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.pengusulInfo?.nama || usulanDetail.pengusulPersnum }}</dd>
                  <dd v-if="usulanDetail.pengusulInfo?.jabatan" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ usulanDetail.pengusulInfo.jabatan }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-building-2" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Divisi Pengusul</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.divisiPengusulNama || usulanDetail.divisiPengusulId }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-building" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Divisi Pemberi</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ usulanDetail.divisiPemberiNama || usulanDetail.divisiPemberiId }}</dd>
                </div>
              </div>
              <div class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-clock" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Durasi Akses</dt>
                  <dd v-if="usulanDetail.durasiAksesDisetujui" class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">
                    {{ formatDurasiLabel(usulanDetail.durasiAksesDisetujui, usulanDetail.customTanggalSelesai) }}
                    <UTooltip v-if="usulanDetail.durasiAkses && usulanDetail.durasiAkses !== usulanDetail.durasiAksesDisetujui" :text="`Durasi usulan: ${formatDurasiLabel(usulanDetail.durasiAkses, usulanDetail.customTanggalSelesai)}`" :delay-duration="0">
                      <UIcon name="i-lucide-info" class="ml-1 inline-block h-3.5 w-3.5 cursor-help align-middle text-gray-400 hover:text-primary-500" />
                    </UTooltip>
                  </dd>
                  <dd v-else-if="usulanDetail.durasiAkses === 'CUSTOM' && tanggalBerakhirDurasi" class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ formatDateOnly(tanggalBerakhirDurasi) }}</dd>
                  <dd v-else class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ formatDurasiLabel(usulanDetail.durasiAkses, usulanDetail.customTanggalSelesai) }}</dd>
                </div>
              </div>
              <div v-if="usulanDetail.tanggalMulai" class="flex items-start gap-3 border-b border-gray-100 py-3 dark:border-gray-700 sm:col-span-2">
                <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                  <UIcon name="i-lucide-calendar" class="h-4 w-4" />
                </span>
                <div class="min-w-0">
                  <dt class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Periode Akses</dt>
                  <dd class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white">{{ formatDateOnly(usulanDetail.tanggalMulai) }} <UIcon name="i-lucide-arrow-right" class="mx-1 inline-block h-4 w-4 align-middle text-primary-500" /> {{ formatDateOnly(usulanDetail.tanggalSelesai) }}</dd>
                </div>
              </div>
            </dl>
          </div>

          <!-- Tujuan Akses -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-message-square" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Tujuan Akses</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Alasan pengajuan akses berkas.</p>
              </div>
            </div>
            <div class="px-4 py-3">
              <p class="whitespace-pre-line border-l-2 border-primary-300 pl-3 text-sm leading-5 text-gray-600 dark:border-primary-700 dark:text-gray-300">
                {{ usulanDetail.tujuanAkses || 'Tidak ada tujuan akses diisi.' }}
              </p>
            </div>
          </div>

          <!-- Berkas Dipilih -->
          <div v-if="usulanDetail.selectedBerkas?.length" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-paperclip" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Berkas Dipilih</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Berkas yang dipilih oleh Sekretaris pemberi.</p>
              </div>
              <span class="ml-auto text-xs text-gray-400">{{ usulanDetail.selectedBerkas.length }} berkas</span>
            </div>
            <div class="divide-y divide-gray-100 dark:divide-gray-700">
              <div v-for="b in usulanDetail.selectedBerkas" :key="b.id">
                <div class="flex items-start gap-3 px-4 py-2.5">
                  <UIcon name="i-lucide-file" class="mt-0.5 size-4 shrink-0 text-gray-400" />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ b.judulBerkas || b.berkasId }}</p>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <span v-if="b.kodeBerkas">{{ b.kodeBerkas }} · </span>
                      <span>{{ b.klasifikasiTeks || '-' }}</span>
                    </p>
                  </div>
                  <!-- Tombol expand naskah — jika ada naskah di berkas ini -->
                  <button
                    v-if="b.naskahList?.length > 0"
                    type="button"
                    @click="toggleBerkasNaskah(b.berkasId)"
                    class="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
                    :title="expandedBerkasNaskah.has(b.berkasId) ? 'Sembunyikan naskah' : 'Lihat naskah'"
                  >
                    <UIcon name="i-lucide-file-text" class="size-4" />
                    <span class="hidden sm:inline">{{ b.naskahList.length }} naskah</span>
                    <UIcon :name="expandedBerkasNaskah.has(b.berkasId) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-3.5" />
                  </button>
                  <!-- Tombol buka naskah — hanya jika akses sudah diberikan (AKSES_DITERBITKAN)
                   dan belum lewat tanggal selesai (durasi masih berlaku) -->
                  <button
                    v-if="usulanDetail.status === StatusUsulan.AKSES_DITERBITKAN && !isAccessExpired"
                    type="button"
                    @click="navigateTo(`/penggunaan/pemberian/${usulanDetail.id}/berkas`)"
                    class="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30"
                    title="Buka naskah di berkas ini"
                  >
                    <UIcon name="i-lucide-file-text" class="size-4" />
                    <span class="hidden sm:inline">Naskah</span>
                  </button>
                </div>
                <!-- Naskah list (expandable) -->
                <div v-if="b.naskahList?.length > 0 && expandedBerkasNaskah.has(b.berkasId)" class="border-t border-gray-50 bg-gray-50/50 px-4 py-2 dark:border-gray-700/50 dark:bg-gray-700/20">
                  <p class="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Daftar Naskah</p>
                  <div class="space-y-1">
                    <div v-for="(n, nIdx) in b.naskahList" :key="n.naskahId || nIdx" class="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700/40">
                      <span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-gray-200 text-[10px] font-semibold text-gray-600 dark:bg-gray-600 dark:text-gray-300">{{ nIdx + 1 }}</span>
                      <div class="min-w-0 flex-1">
                        <p class="truncate font-medium text-gray-800 dark:text-gray-200">{{ n.perihal || '(Tanpa perihal)' }}</p>
                        <div class="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-gray-500 dark:text-gray-400">
                          <span v-if="n.nomorSurat">{{ n.nomorSurat }}</span>
                          <span v-if="n.tanggalNaskah">{{ formatDateOnly(n.tanggalNaskah) }}</span>
                          <span v-if="n.jenis" class="rounded bg-gray-100 px-1 dark:bg-gray-600">{{ n.jenis }}</span>
                          <span v-if="n.sumber" class="text-gray-400">{{ n.sumber }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- KANAN: Timeline + Verifikator + Action Buttons -->
        <aside class="space-y-4">
          <!-- Timeline Verifikasi -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <button type="button" @click="timelineExpanded = !timelineExpanded" class="flex w-full items-center gap-2 border-b border-gray-100 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/30">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-route" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div class="flex-1 min-w-0">
                <h2 class="font-semibold text-gray-900 dark:text-white">Timeline Verifikasi</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Riwayat alur verifikasi usulan.</p>
              </div>
              <UIcon :name="timelineExpanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-5 shrink-0 text-gray-400" />
            </button>
            <div v-show="timelineExpanded" class="px-4 py-3">
              <!-- Next Action sebagai timeline node (di atas, status terkini) -->
              <div v-if="nextActionInfo" class="mb-3 flex gap-2.5 pb-3 border-b border-gray-100 dark:border-gray-700">
                <div class="flex flex-col items-center">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-300 ring-4 ring-white dark:bg-gray-600 dark:ring-gray-800">
                    <UIcon name="i-lucide-clock" class="size-3.5 text-white" />
                  </span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ nextActionInfo.oleh }}</p>
                  <p v-if="nextActionInfo.jabatan" class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{{ nextActionInfo.jabatan }}</p>
                  <p class="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{{ nextActionInfo.label }}</p>
                </div>
              </div>

              <ol class="space-y-3">
                <li v-for="(entry, idx) in timelineEntries" :key="entry.id" class="flex gap-2.5">
                  <div class="flex flex-col items-center">
                    <span
                      class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-800"
                      :class="entry.iconBg"
                    >
                      <UIcon :name="entry.icon" class="size-3.5 text-white" />
                    </span>
                    <span v-if="idx < timelineEntries.length - 1" class="mt-0.5 w-0.5 flex-1 bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <div class="min-w-0 flex-1 pb-2">
                    <div class="flex items-center justify-between gap-2">
                      <p class="text-xs font-semibold text-gray-900 dark:text-white">{{ entry.title }}</p>
                      <span class="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium" :class="entry.actionColor">{{ entry.action }}</span>
                    </div>
                    <p v-if="entry.jabatan" class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{{ entry.jabatan }}</p>
                    <p class="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">{{ formatDate(entry.timestamp) }}</p>
                    <p v-if="entry.catatan" class="mt-1 rounded bg-gray-50 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                      <span class="font-medium">Catatan:</span> {{ entry.catatan }}
                    </p>
                    <p v-if="entry.catatanKeSE" class="mt-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                      <span class="font-medium">Catatan ke SE {{ entry.isPengusulStep ? 'Pengusul' : 'Pemberi' }}:</span> {{ entry.catatanKeSE }}
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <!-- Verifikator -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <UIcon name="i-lucide-users" class="size-5 text-primary-600 dark:text-primary-400" />
              </span>
              <div>
                <h2 class="font-semibold text-gray-900 dark:text-white">Verifikator</h2>
                <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Daftar verifikator pengusul & pemberi.</p>
              </div>
            </div>
            <div class="px-4 py-3">
              <p class="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Pengusul</p>
              <div class="space-y-2">
                <div v-for="(v, idx) in usulanDetail.verifikatorPengusul" :key="idx">
                  <div class="flex items-center gap-2">
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                      {{ idx + 1 }}
                    </span>
                    <div class="flex-1 min-w-0">
                      <div class="truncate text-xs font-medium text-gray-800 dark:text-gray-200">{{ v.nama || `Persnum ${v.persnum}` }}</div>
                      <div class="truncate text-[11px] text-gray-500 dark:text-gray-400">{{ v.jabatan || v.levelJabatan }}</div>
                    </div>
                  </div>
                  <!-- Catatan dari SE pengusul: hanya terlihat oleh verifikator itu sendiri & SE pengusul -->
                  <div v-if="v.catatan && (Number(user?.persnum) === v.persnum || Number(user?.persnum) === Number(usulanDetail.pengusulPersnum))" class="ml-7 mt-1 rounded-md bg-amber-50 px-2 py-1.5 dark:bg-amber-900/20">
                    <p class="text-[10px] font-medium text-amber-600 dark:text-amber-400">Catatan untuk Verifikator:</p>
                    <p class="text-[11px] text-amber-800 dark:text-amber-300">{{ v.catatan }}</p>
                  </div>
                </div>
              </div>
              <div v-if="usulanDetail.verifikatorPemberi?.length" class="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                <p class="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Pemberi</p>
                <div class="space-y-2">
                  <div v-for="(v, idx) in usulanDetail.verifikatorPemberi" :key="idx">
                    <div class="flex items-center gap-2">
                      <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                        {{ idx + 1 }}
                      </span>
                      <div class="flex-1 min-w-0">
                        <div class="truncate text-xs font-medium text-gray-800 dark:text-gray-200">{{ v.nama || `Persnum ${v.persnum}` }}</div>
                        <div class="truncate text-[11px] text-gray-500 dark:text-gray-400">{{ v.jabatan || v.levelJabatan }}</div>
                      </div>
                    </div>
                    <!-- Catatan dari SE pemberi: hanya terlihat oleh verifikator itu sendiri & SE pemberi -->
                    <div v-if="v.catatan && (Number(user?.persnum) === v.persnum || isSekretarisPemberi)" class="ml-7 mt-1 rounded-md bg-amber-50 px-2 py-1.5 dark:bg-amber-900/20">
                      <p class="text-[10px] font-medium text-amber-600 dark:text-amber-400">Catatan untuk Verifikator:</p>
                      <p class="text-[11px] text-amber-800 dark:text-amber-300">{{ v.catatan }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Banner Revisi Pemberi -->
          <div v-if="usulanDetail?.catatanRevisiPemberi && isSekretarisPemberi && (usulanDetail?.status === StatusUsulan.REVISI_PEMBERI || usulanDetail?.status === StatusUsulan.TERKIRIM_KE_PEMBERI)" class="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/40 dark:bg-orange-900/20">
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-alert-triangle" class="mt-0.5 size-5 shrink-0 text-orange-600 dark:text-orange-400" />
              <div>
                <p class="text-sm font-semibold text-orange-800 dark:text-orange-300">
                  Usulan Ditolak oleh Verifikator Pemberi
                </p>
                <p v-if="revisiPemberiVerifier" class="mt-1 text-xs">
                  <span class="font-semibold text-red-700 dark:text-red-400">{{ revisiPemberiVerifier.nama }}</span>
                  <span v-if="revisiPemberiVerifier.jabatan" class="text-gray-600 dark:text-gray-400"> — {{ revisiPemberiVerifier.jabatan }}</span>
                </p>
                <p class="mt-1 text-xs text-orange-700 dark:text-orange-400">
                  Verifikator pemberi menolak usulan ini. Silakan verifikasi ulang dan/atau revisi berkas.
                </p>
                <p v-if="usulanDetail?.catatanRevisiPemberi" class="mt-2 rounded-md bg-white px-3 py-2 text-xs text-orange-800 dark:bg-gray-800 dark:text-orange-300">
                  <span class="font-medium">Catatan dari Verifikator:</span> {{ usulanDetail.catatanRevisiPemberi }}
                </p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div v-if="canVerifyPengusul || canVerifyPemberi || canSelectBerkas || canApprovePemberi || canRejectPemberiClosed" class="space-y-3">
            <!-- Verifikasi Pengusul: Tolak + Setuju -->
            <div v-if="canVerifyPengusul" class="space-y-2">
              <p class="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Verifikasi Pengusul</p>
              <div class="flex gap-3">
                <UButton
                  icon="i-lucide-circle-x"
                  color="error"
                  variant="outline"
                  size="lg"
                  class="flex-1 justify-center"
                  :loading="pending"
                  @click="quickVerifyPengusul(Keputusan.TOLAK)"
                >
                  Tolak
                </UButton>
                <UButton
                  icon="i-lucide-circle-check-big"
                  variant="solid"
                  size="lg"
                  class="flex-1 justify-center"
                  style="background-color: #175FA4"
                  :loading="pending"
                  @click="quickVerifyPengusul(Keputusan.SETUJU)"
                >
                  Setuju
                </UButton>
              </div>
            </div>

            <!-- Verifikasi Pemberi (SE): Tolak + Lanjut -->
            <div v-if="canVerifyPemberi" class="space-y-2">
              <p class="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Verifikasi Pemberi</p>
              <div class="flex gap-3">
                <UButton
                  icon="i-lucide-circle-x"
                  color="error"
                  variant="outline"
                  size="lg"
                  class="flex-1 justify-center"
                  :loading="pending"
                  @click="quickRejectPemberi"
                >
                  Tolak
                </UButton>
                <UButton
                  icon="i-lucide-arrow-right"
                  size="lg"
                  class="flex-1 justify-center"
                  style="background-color: #175FA4"
                  @click="showVerifikasiPemberi = true"
                >
                  Lanjut
                </UButton>
              </div>
            </div>

            <!-- Pilih Berkas (SE): buka modal form (berkas + verifikator) -->
            <div v-if="canSelectBerkas" class="space-y-2">
              <p class="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {{ (usulanDetail?.selectedBerkas?.length ?? 0) > 0 ? 'Revisi Berkas' : 'Pilih Berkas' }}
              </p>
              <UButton
                icon="i-lucide-folder-search"
                color="primary"
                size="lg"
                block
                class="justify-center"
                @click="showPilihBerkas = true"
              >
                {{ (usulanDetail?.selectedBerkas?.length ?? 0) > 0 ? 'Revisi Berkas & Verifikator' : 'Pilih Berkas & Verifikator' }}
              </UButton>
            </div>

            <!-- Tolak Usulan (Closed) — SE pemberi menutup usulan saat revisi -->
            <div v-if="canRejectPemberiClosed" class="space-y-2">
              <p class="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Tutup Usulan</p>
              <UButton
                icon="i-lucide-circle-x"
                color="error"
                variant="solid"
                size="lg"
                block
                class="justify-center"
                :loading="pending"
                @click="rejectPemberiClosed"
              >
                Tolak & Tutup Usulan
              </UButton>
            </div>

            <!-- Persetujuan Pemberi: Tolak + Setuju -->
            <div v-if="canApprovePemberi" class="space-y-2">
              <p class="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Persetujuan Pemberi</p>
              <div class="flex gap-3">
                <UButton
                  icon="i-lucide-circle-x"
                  color="error"
                  variant="outline"
                  size="lg"
                  class="flex-1 justify-center"
                  :loading="pending"
                  @click="quickApprovePemberi(Keputusan.TOLAK)"
                >
                  Tolak
                </UButton>
                <UButton
                  icon="i-lucide-circle-check-big"
                  size="lg"
                  class="flex-1 justify-center"
                  style="background-color: #175FA4"
                  :loading="pending"
                  @click="quickApprovePemberi(Keputusan.SETUJU)"
                >
                  Setuju
                </UButton>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>

    <!-- Modal Setuju (standarisasi) -->
    <VerifyActionModal
      v-model="showApproveModal"
      variant="approve"
      :title="approveTitle"
      :description="approveDescription"
      note-placeholder="Keterangan opsional"
      confirm-label="Setuju"
      :saving="savingAction"
      @confirm="handleApprove"
    />

    <!-- Modal Tolak (standarisasi) -->
    <VerifyActionModal
      v-model="showRejectModal"
      variant="reject"
      :title="rejectTitle"
      description="Usulan akan ditolak. Tindakan ini tidak dapat dibatalkan."
      :warning="rejectWarning"
      note-placeholder="Masukkan alasan penolakan (min 5 karakter)"
      confirm-label="Tolak"
      :saving="savingAction"
      :require-note="true"
      :min-note-length="5"
      :show-catatan-ke-s-e="!!rejectCatatanKeSELabel"
      :catatan-ke-s-e-label="rejectCatatanKeSELabel"
      @confirm="handleRejectAction"
    />

    <!-- Modal Verifikasi Pengusul (Minta Revisi) -->
    <Teleport to="body">
    <Modal v-model="showVerifikasiPengusul" :hideDefaultFooter="true" size="lg">
      <template #title>
        <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">Minta Revisi Pengusul</Heading>
      </template>

      <div class="px-6 pb-6 space-y-4">
        <!-- Banner info revisi -->
        <div class="flex items-start gap-2.5 rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-900/40 dark:bg-warning-900/20 dark:text-warning-300">
          <UIcon name="i-lucide-alert-triangle" class="mt-0.5 size-4 shrink-0" />
          <span>Pengusul akan diminta merevisi usulan. Wajib mengisi catatan revisi (minimal 5 karakter).</span>
        </div>

        <!-- Catatan Revisi (full width) -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Catatan Revisi <span class="text-error-500">*</span>
          </label>
          <textarea
            v-model="vpForm.catatanRevisi"
            rows="4"
            class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Jelaskan revisi yang diminta (min 5 karakter)…"
          />
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {{ (vpForm.catatanRevisi || '').trim().length }}/5 karakter minimum
          </p>
        </div>

        <!-- Catatan ke SE Pengusul (opsional) -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Catatan ke SE Pengusul
            <span class="text-xs font-normal text-gray-400">(opsional, hanya terlihat oleh SE Pengusul)</span>
          </label>
          <textarea
            v-model="vpForm.catatanKeSE"
            rows="2"
            class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Catatan khusus untuk SE Pengusul..."
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button
            class="flex-1 px-6 py-2 text-sm font-medium border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-900 dark:text-white"
            @click="showVerifikasiPengusul = false"
          >
            Batal
          </button>
          <button
            class="flex-1 px-6 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
            :disabled="(vpForm.catatanRevisi?.trim().length || 0) < 5 || pending"
            @click="submitVerifikasiPengusulRevisi"
          >
            {{ pending ? 'Memproses...' : 'Kirim Revisi' }}
          </button>
        </div>
      </div>
    </Modal>
    </Teleport>

    <!-- Modal Verifikasi Pemberi (Lanjut) -->
    <Teleport to="body">
    <Modal v-model="showVerifikasiPemberi" :hideDefaultFooter="true" size="lg">
      <template #title>
        <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">Verifikasi Pemberi (Sekretaris)</Heading>
      </template>

      <div class="px-6 pb-6 space-y-4">
        <!-- Banner info -->
        <div class="flex items-start gap-2.5 rounded-lg border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-800 dark:border-success-900/40 dark:bg-success-900/20 dark:text-success-300">
          <UIcon name="i-lucide-info" class="mt-0.5 size-4 shrink-0" />
          <span>Usulan akan diteruskan untuk pemilihan berkas oleh Sekretaris pemberi.</span>
        </div>

        <!-- Durasi Disetujui -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Durasi Disetujui <span class="text-error-500">*</span>
          </label>
          <div class="relative" ref="vpbDurasiDropdownRef">
            <button
              type="button"
              @click="showVpbDurasiDropdown = !showVpbDurasiDropdown"
              class="w-full flex items-center justify-between rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white transition hover:border-gray-400"
            >
              <span :class="vpbForm.durasiAksesDisetujui ? '' : 'text-gray-400 dark:text-gray-500'">{{ vpbForm.durasiAksesDisetujui === 'CUSTOM' && vpbForm.customTanggalSelesai ? formatDurasiLabel('CUSTOM', vpbForm.customTanggalSelesai) : vpbForm.durasiAksesDisetujui ? formatDurasiLabel(vpbForm.durasiAksesDisetujui) : 'Ingin mengubah durasi akses?' }}</span>
              <UIcon name="i-lucide-chevron-down" class="size-4 shrink-0 text-gray-400 transition-transform" :class="{ 'rotate-180': showVpbDurasiDropdown }" />
            </button>
            <div
              v-if="showVpbDurasiDropdown"
              class="absolute z-60 mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg"
            >
              <div class="max-h-[200px] overflow-y-auto">
                <button
                  v-for="d in durasiOptions"
                  :key="d.value"
                  type="button"
                  @click="vpbForm.durasiAksesDisetujui = d.value; if (d.value !== 'CUSTOM') vpbForm.customTanggalSelesai = ''; showVpbDurasiDropdown = false"
                  class="flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                  :class="vpbForm.durasiAksesDisetujui === d.value ? 'bg-blue-50 font-medium text-blue-700 dark:bg-gray-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'"
                >
                  {{ d.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- Custom: date picker muncul saat Custom dipilih -->
        <div v-if="vpbForm.durasiAksesDisetujui === 'CUSTOM'" class="mt-3">
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tanggal Berakhir <span class="text-error-500">*</span>
          </label>
          <input
            v-model="vpbForm.customTanggalSelesai"
            type="date"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 -mt-1">
          Durasi usulan pengusul: <span class="font-medium">{{ durasiUsulanLabel }}</span>
        </p>

        <!-- Catatan -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Catatan
          </label>
          <textarea
            v-model="vpbForm.catatan"
            rows="3"
            class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Catatan verifikasi atau alasan perubahan durasi (opsional)…"
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button
            class="flex-1 px-6 py-2 text-sm font-medium border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-900 dark:text-white"
            @click="showVerifikasiPemberi = false"
          >
            Batal
          </button>
          <button
            class="flex-1 px-6 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 hover:opacity-90 dark:hover:opacity-90"
            style="background-color: #175FA4"
            :disabled="pending || (vpbForm.durasiAksesDisetujui === 'CUSTOM' && !vpbForm.customTanggalSelesai)"
            @click="submitVerifikasiPemberiLanjut"
          >
            {{ pending ? 'Memproses...' : 'Lanjutkan' }}
          </button>
        </div>
      </div>
    </Modal>
    </Teleport>

    <!-- Modal Persetujuan Pemberi (Minta Revisi) -->
    <Teleport to="body">
    <Modal v-model="showPersetujuanPemberi" :hideDefaultFooter="true" size="lg">
      <template #title>
        <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">Minta Revisi Pemberi</Heading>
      </template>

      <div class="px-6 pb-6 space-y-4">
        <!-- Banner info revisi -->
        <div class="flex items-start gap-2.5 rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-800 dark:border-warning-900/40 dark:bg-warning-900/20 dark:text-warning-300">
          <UIcon name="i-lucide-alert-triangle" class="mt-0.5 size-4 shrink-0" />
          <span>Usulan akan dikembalikan untuk revisi. Wajib mengisi catatan revisi (minimal 5 karakter).</span>
        </div>

        <!-- Catatan Revisi (full width) -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Catatan Revisi <span class="text-error-500">*</span>
          </label>
          <textarea
            v-model="ppForm.catatanRevisi"
            rows="4"
            class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Jelaskan revisi yang diminta (min 5 karakter)…"
          />
          <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {{ (ppForm.catatanRevisi || '').trim().length }}/5 karakter minimum
          </p>
        </div>

        <!-- Catatan ke SE Pemberi (opsional) -->
        <div>
          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Catatan ke SE Pemberi
            <span class="text-xs font-normal text-gray-400">(opsional, hanya terlihat oleh SE Pemberi)</span>
          </label>
          <textarea
            v-model="ppForm.catatanKeSE"
            rows="2"
            class="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Catatan khusus untuk SE Pemberi..."
          />
        </div>

        <div class="flex gap-3 pt-2">
          <button
            class="flex-1 px-6 py-2 text-sm font-medium border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-900 dark:text-white"
            @click="showPersetujuanPemberi = false"
          >
            Batal
          </button>
          <button
            class="flex-1 px-6 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
            :disabled="(ppForm.catatanRevisi?.trim().length || 0) < 5 || pending"
            @click="submitPersetujuanPemberiRevisi"
          >
            {{ pending ? 'Memproses...' : 'Kirim Revisi' }}
          </button>
        </div>
      </div>
    </Modal>
    </Teleport>

    <!-- Modal Pilih Berkas (SE Pemberi) -->
    <Teleport to="body">
    <Modal v-model="showPilihBerkas" :hideDefaultFooter="true" size="xl">
      <template #title>
        <Heading variant="heading9b" class="ml-5 mt-5 mb-2 text-sm font-bold dark:text-white">Pilih Berkas & Verifikator</Heading>
      </template>

      <div class="space-y-1 p-1">
        <!-- Daftar Berkas -->
        <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
          <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
            Daftar Berkas <span class="text-red-500">*</span>
            <span class="block text-xs font-normal text-gray-400">({{ berkasEligibleList.length }} tersedia)</span>
          </span>
          <div class="flex-1">
            <!-- Search input (native, matching AddUsulanAksesBerkas style) -->
            <div class="relative mb-2">
              <UIcon name="i-lucide-search" class="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                v-model="berkasSearch"
                type="text"
                placeholder="Cari judul / klasifikasi / nomor berkas…"
                class="w-full rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-900 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div v-if="berkasLoading" class="flex items-center justify-center py-8">
              <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-primary-500" />
              <span class="ml-2 text-sm text-gray-500">Memuat berkas…</span>
            </div>
            <div v-else-if="filteredBerkas.length === 0" class="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-700">
              Tidak ada berkas eligible ditemukan.
            </div>
            <div v-else class="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
              <label
                v-for="b in filteredBerkas"
                :key="b.id"
                class="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                :class="{ 'bg-primary-50 dark:bg-primary-900/20': isBerkasSelected(b.id) }"
              >
                <UCheckbox
                  :model-value="isBerkasSelected(b.id)"
                  @update:model-value="toggleBerkas(b.id)"
                  class="mt-0.5"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <p class="truncate text-xs font-medium text-gray-900 dark:text-white">{{ b.judulBerkas }}</p>
                    <span class="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {{ b.status || '-' }}
                    </span>
                  </div>
                  <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    <span v-if="b.nomorBerkas">{{ b.nomorBerkas }} · </span>
                    <span>{{ b.klasifikasiTeks || b.klasifikasi }}</span>
                  </p>
                </div>
              </label>
            </div>
            <p v-if="pilihBerkasForm.berkasIds.length > 0" class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              {{ pilihBerkasForm.berkasIds.length }} berkas dipilih
            </p>
          </div>
        </div>

        <!-- Verifikator Pemberi -->
        <div class="flex flex-col justify-between gap-1 border-b border-gray-200 py-2 dark:border-gray-600 sm:flex-row sm:items-start sm:gap-0">
          <span class="w-full shrink-0 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
            Verifikator Pemberi <span class="text-red-500">*</span>
            <span class="block text-xs font-normal text-gray-400">(pilih 1-3)</span>
          </span>
          <div class="flex-1">
            <!-- Selected verifikator chips + per-verifikator catatan -->
            <div v-if="pilihBerkasForm.verifikatorPemberi.length > 0" class="mb-2 flex flex-col gap-2">
              <div
                v-for="(v, idx) in sortedVerifikatorPemberi"
                :key="v.persnum"
                class="rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700/30"
              >
                <div class="flex items-center gap-1.5 px-1.5 py-1">
                  <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                    {{ idx + 1 }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <div class="truncate text-xs font-medium text-gray-800 dark:text-gray-200">{{ v.nama || `Persnum ${v.persnum}` }}</div>
                    <div class="truncate text-[11px] text-gray-500 dark:text-gray-400">{{ v.jabatan || v.levelJabatan }}</div>
                  </div>
                  <button
                    type="button"
                    @click="toggleVerifikatorPemberi(v.persnum, v.levelJabatan as LevelJabatan)"
                    class="ml-0.5 shrink-0 text-gray-400 transition-colors hover:text-red-500"
                    aria-label="Hapus verifikator"
                  >
                    <UIcon name="i-lucide-trash-2" class="size-3.5" />
                  </button>
                </div>
                <!-- Catatan personal untuk verifikator ini -->
                <div class="border-t border-gray-200 px-2 py-1.5 dark:border-gray-600">
                  <textarea
                    v-model="v.catatan"
                    rows="1"
                    maxlength="500"
                    class="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-900 transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    :placeholder="`Catatan untuk ${v.nama || 'verifikator ini'} (opsional)`"
                  />
                </div>
              </div>
            </div>

            <div v-if="verifikatorPemberiLoading" class="flex items-center justify-center py-4">
              <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary-500" />
              <span class="ml-2 text-sm text-gray-500">Memuat verifikator…</span>
            </div>
            <div v-else-if="verifikatorPemberiList.length === 0" class="py-2 text-sm text-gray-400">
              Tidak ada managerial di divisi ini.
            </div>
            <div v-else-if="availableVerifikatorPemberi.length > 0" class="relative" ref="verikPemberiDropdownRef">
              <button
                type="button"
                @click="showVerikPemberiDropdown = !showVerikPemberiDropdown"
                class="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition hover:border-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <span class="text-gray-400">+ Pilih verifikator ({{ pilihBerkasForm.verifikatorPemberi.length }}/3)</span>
                <UIcon name="i-lucide-chevron-down" class="size-4 shrink-0 text-gray-400 transition-transform" :class="{ 'rotate-180': showVerikPemberiDropdown }" />
              </button>
              <div
                v-if="showVerikPemberiDropdown"
                class="absolute z-60 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
              >
                <div class="max-h-[200px] overflow-y-auto">
                  <button
                    v-for="v in availableVerifikatorPemberi"
                    :key="v.persnum"
                    type="button"
                    @click="onSelectVerifikatorPemberi(String(v.persnum)); showVerikPemberiDropdown = false"
                    class="flex w-full flex-col items-start px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <span class="font-medium">{{ v.nama || `Persnum ${v.persnum}` }}</span>
                    <span class="text-xs text-gray-400">{{ v.jabatan || v.levelJabatan || '' }}</span>
                  </button>
                </div>
              </div>
            </div>
            <p v-else-if="pilihBerkasForm.verifikatorPemberi.length >= 3" class="text-xs text-gray-400">
              Maksimal 3 verifikator. Hapus salah satu untuk mengganti.
            </p>
            <p v-else class="text-xs text-gray-400">
              Semua verifikator tersedia sudah dipilih.
            </p>
          </div>
        </div>


      </div>

      <div class="flex gap-3 px-6 pb-6 pt-2">
        <button
          class="flex-1 px-6 py-2 text-sm font-medium border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-gray-900 dark:text-white disabled:opacity-50"
          :disabled="pending"
          @click="showPilihBerkas = false"
        >
          Batal
        </button>
        <button
          class="flex-1 px-6 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 hover:opacity-90 dark:hover:opacity-90"
          style="background-color: #175FA4"
          :disabled="pilihBerkasForm.berkasIds.length === 0 || pilihBerkasForm.verifikatorPemberi.length === 0 || pending"
          @click="submitPilihBerkas"
        >
          {{ pending ? 'Memproses...' : 'Kirim' }}
        </button>
      </div>
    </Modal>
    </Teleport>
  </div>
</template>