<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-vue-next';
import Heading from '~/components/Heading.vue';
import PageHeader from '~/components/PageHeader.vue';
import UsulanAksesBerkasBadge from '~/components/usulan-akses-berkas/UsulanAksesBerkasBadge.vue';
import { useUsulanAksesBerkas } from '~/composables/useUsulanAksesBerkas';
import { useFeatureAccess } from '~/composables/useFeatureAccess';
import {
  StatusUsulan,
  Keputusan,
  DurasiPreset,
  type VerifikasiPengusulPayload,
  type VerifikasiPemberiPayload,
  type PersetujuanPemberiPayload,
} from '~/types/usulan-akses-berkas';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Detail Usulan Akses Berkas' });

const route = useRoute();
const { t } = useI18n();
const { canAccessPage, hasPermission } = useFeatureAccess();
const {
  usulanDetail,
  pending,
  fetchDetail,
  verifikasiPengusul,
  verifikasiPemberi,
  persetujuanPemberi,
} = useUsulanAksesBerkas();
const toast = useToast();

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

const canVerifyPengusul = computed(() => {
  const s = usulanDetail.value?.status;
  return (
    hasPermission('usulan-akses-berkas', 'verify-pengusul') &&
    [
      StatusUsulan.MENUNGGU_VERIFIKASI_PENGUSUL,
      StatusUsulan.MENUNGGU_VERIFIKASI_AKHIR_PENGUSUL,
      StatusUsulan.MENUNGGU_VERIFIKASI_EVP_PENGUSUL,
    ].includes(s as StatusUsulan)
  );
});

const canVerifyPemberi = computed(() => {
  return (
    hasPermission('usulan-akses-berkas', 'verify-pemberi') &&
    usulanDetail.value?.status === StatusUsulan.TERKIRIM_KE_PEMBERI
  );
});

const canApprovePemberi = computed(() => {
  const s = usulanDetail.value?.status;
  return (
    hasPermission('usulan-akses-berkas', 'approve-pemberi') &&
    [
      StatusUsulan.MENUNGGU_PERSETUJUAN_PEMBERI,
      StatusUsulan.MENUNGGU_PERSETUJUAN_AKHIR_PEMBERI,
      StatusUsulan.MENUNGGU_PERSETUJUAN_EVP_PEMBERI,
    ].includes(s as StatusUsulan)
  );
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
      description: err?.message || 'Gagal memuat detail',
      color: 'error',
    });
  }
};

const submitVerifikasiPengusul = async () => {
  if (vpForm.value.keputusan === Keputusan.REVISI && !vpForm.value.catatanRevisi?.trim()) {
    toast.add({ title: 'Catatan revisi wajib diisi', color: 'error' });
    return;
  }
  try {
    await verifikasiPengusul(id.value, 1, vpForm.value);
    toast.add({ title: 'Berhasil', description: 'Verifikasi terkirim', color: 'success' });
    showVerifikasiPengusul.value = false;
    await loadDetail();
  } catch (err: any) {
    toast.add({ title: 'Gagal', description: err?.message, color: 'error' });
  }
};

const submitVerifikasiPemberi = async () => {
  try {
    await verifikasiPemberi(id.value, vpbForm.value);
    toast.add({ title: 'Berhasil', description: 'Verifikasi pemberi terkirim', color: 'success' });
    showVerifikasiPemberi.value = false;
    await loadDetail();
  } catch (err: any) {
    toast.add({ title: 'Gagal', description: err?.message, color: 'error' });
  }
};

const submitPersetujuanPemberi = async () => {
  if (ppForm.value.keputusan === Keputusan.REVISI && !ppForm.value.catatanRevisi?.trim()) {
    toast.add({ title: 'Catatan revisi wajib diisi', color: 'error' });
    return;
  }
  try {
    await persetujuanPemberi(id.value, 1, ppForm.value);
    toast.add({ title: 'Berhasil', description: 'Persetujuan terkirim', color: 'success' });
    showPersetujuanPemberi.value = false;
    await loadDetail();
  } catch (err: any) {
    toast.add({ title: 'Gagal', description: err?.message, color: 'error' });
  }
};

onMounted(() => {
  loadDetail();
});
</script>

<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="min-h-screen bg-gray-50 dark:bg-gray-900 pt-5">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-5">
        <button
          @click="navigateTo('/usulan-akses-berkas')"
          class="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary mb-3"
        >
          <ArrowLeft class="w-4 h-4" />
          Kembali
        </button>
        <Heading variant="heading6b">{{ usulanDetail?.nomorUsulan || 'Detail Usulan' }}</Heading>
        <PageHeader :items="breadcrumbs" />
      </div>

      <div v-if="pending && !usulanDetail" class="text-center py-20 text-gray-400">
        <div class="animate-pulse">Memuat data...</div>
      </div>

      <div v-else-if="usulanDetail" class="space-y-5">
        <!-- Info Card -->
        <div class="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ usulanDetail.nomorUsulan }}
              </h3>
              <UsulanAksesBerkasBadge :status="usulanDetail.status" />
            </div>
            <div class="text-right text-sm text-gray-500">
              <div>Dibuat: {{ formatDate(usulanDetail.createdAt) }}</div>
              <div>Update: {{ formatDate(usulanDetail.updatedAt) }}</div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Jenis Berkas:</span>
              <span class="ml-2 font-medium text-gray-800 dark:text-gray-200">{{ usulanDetail.jenisBerkas }}</span>
            </div>
            <div>
              <span class="text-gray-500">Divisi Pengusul ID:</span>
              <span class="ml-2 font-medium text-gray-800 dark:text-gray-200">{{ usulanDetail.divisiPengusulId }}</span>
            </div>
            <div>
              <span class="text-gray-500">Divisi Pemberi ID:</span>
              <span class="ml-2 font-medium text-gray-800 dark:text-gray-200">{{ usulanDetail.divisiPemberiId }}</span>
            </div>
            <div>
              <span class="text-gray-500">Durasi Akses:</span>
              <span class="ml-2 font-medium text-gray-800 dark:text-gray-200">{{ usulanDetail.durasiAkses?.replace('_', ' ') }}</span>
            </div>
            <div v-if="usulanDetail.durasiAksesDisetujui">
              <span class="text-gray-500">Durasi Disetujui:</span>
              <span class="ml-2 font-medium text-gray-800 dark:text-gray-200">{{ usulanDetail.durasiAksesDisetujui.replace('_', ' ') }}</span>
            </div>
            <div>
              <span class="text-gray-500">Jenis Akses:</span>
              <span class="ml-2 font-medium text-gray-800 dark:text-gray-200">{{ usulanDetail.jenisAkses?.join(', ') }}</span>
            </div>
            <div v-if="usulanDetail.tanggalMulai">
              <span class="text-gray-500">Tanggal Mulai:</span>
              <span class="ml-2 font-medium text-gray-800 dark:text-gray-200">{{ formatDate(usulanDetail.tanggalMulai) }}</span>
            </div>
            <div v-if="usulanDetail.tanggalSelesai">
              <span class="text-gray-500">Tanggal Selesai:</span>
              <span class="ml-2 font-medium text-gray-800 dark:text-gray-200">{{ formatDate(usulanDetail.tanggalSelesai) }}</span>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="text-sm text-gray-500 mb-1">Tujuan Akses</div>
            <p class="text-sm text-gray-800 dark:text-gray-200">{{ usulanDetail.tujuanAkses }}</p>
          </div>

          <!-- Catatan Revisi -->
          <div v-if="usulanDetail.catatanRevisiPengusul" class="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div class="text-sm font-medium text-orange-700 dark:text-orange-400">Catatan Revisi Pengusul:</div>
            <p class="text-sm text-orange-800 dark:text-orange-300 mt-1">{{ usulanDetail.catatanRevisiPengusul }}</p>
          </div>
          <div v-if="usulanDetail.catatanRevisiPemberi" class="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div class="text-sm font-medium text-orange-700 dark:text-orange-400">Catatan Revisi Pemberi:</div>
            <p class="text-sm text-orange-800 dark:text-orange-300 mt-1">{{ usulanDetail.catatanRevisiPemberi }}</p>
          </div>
        </div>

        <!-- Verifikator Info -->
        <div class="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Verifikator Pengusul</h3>
          <div class="space-y-2">
            <div
              v-for="(v, idx) in usulanDetail.verifikatorPengusul"
              :key="idx"
              class="flex items-center gap-3 text-sm"
            >
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="{
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400': v.levelJabatan === 'AVP',
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400': v.levelJabatan === 'VP',
                  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400': v.levelJabatan === 'EVP',
                }"
              >
                {{ v.levelJabatan }}
              </span>
              <span class="text-gray-700 dark:text-gray-300">Persnum: {{ v.persnum }}</span>
              <span class="text-gray-400">· Jenjang {{ v.urutan }}</span>
            </div>
          </div>

          <div v-if="usulanDetail.verifikatorPemberi?.length" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Verifikator Pemberi</h3>
            <div class="space-y-2">
              <div
                v-for="(v, idx) in usulanDetail.verifikatorPemberi"
                :key="idx"
                class="flex items-center gap-3 text-sm"
              >
                <span
                  class="px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400': v.levelJabatan === 'AVP',
                    'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400': v.levelJabatan === 'VP',
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400': v.levelJabatan === 'EVP',
                  }"
                >
                  {{ v.levelJabatan }}
                </span>
                <span class="text-gray-700 dark:text-gray-300">Persnum: {{ v.persnum }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline / Audit Trail -->
        <div v-if="usulanDetail.steps?.length" class="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Timeline Verifikasi</h3>
          <div class="space-y-4">
            <div
              v-for="step in usulanDetail.steps"
              :key="step.id"
              class="flex gap-3"
            >
              <div class="flex-shrink-0">
                <CheckCircle v-if="step.keputusan === Keputusan.SETUJU || step.keputusan === Keputusan.LANJUT" class="w-5 h-5 text-green-500" />
                <XCircle v-else-if="step.keputusan === Keputusan.TOLAK" class="w-5 h-5 text-red-500" />
                <AlertCircle v-else class="w-5 h-5 text-orange-500" />
              </div>
              <div class="flex-1 pb-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4 -ml-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ step.roleTahap }}</span>
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :class="{
                      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400': step.keputusan === Keputusan.SETUJU || step.keputusan === Keputusan.LANJUT,
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400': step.keputusan === Keputusan.TOLAK,
                      'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400': step.keputusan === Keputusan.REVISI,
                    }"
                  >
                    {{ step.keputusan }}
                  </span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  Persnum: {{ step.verifierPersnum }} · {{ formatDate(step.verifiedAt) }}
                </div>
                <div v-if="step.catatan" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {{ step.catatan }}
                </div>
                <div v-if="step.catatanRevisi" class="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  Revisi: {{ step.catatanRevisi }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3">
          <button
            v-if="canVerifyPengusul"
            @click="showVerifikasiPengusul = true"
            class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Verifikasi Pengusul
          </button>
          <button
            v-if="canVerifyPemberi"
            @click="showVerifikasiPemberi = true"
            class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Verifikasi Pemberi
          </button>
          <button
            v-if="canApprovePemberi"
            @click="showPersetujuanPemberi = true"
            class="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Persetujuan Pemberi
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Verifikasi Pengusul -->
    <Teleport to="body">
      <div
        v-if="showVerifikasiPengusul"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="showVerifikasiPengusul = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Verifikasi Pengusul</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="vpForm.kelengkapanBerkas" /> Kelengkapan berkas</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="vpForm.kesesuaianTujuan" /> Kesesuaian tujuan</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="vpForm.periodeWajar" /> Periode wajar</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="vpForm.suratSah" /> Surat sah</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="vpForm.tidakDuplikasi" /> Tidak duplikasi</label>
            <div>
              <label class="block text-sm font-medium mb-1">Keputusan</label>
              <select v-model="vpForm.keputusan" class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700">
                <option :value="Keputusan.SETUJU">Setuju</option>
                <option :value="Keputusan.REVISI">Revisi</option>
                <option :value="Keputusan.TOLAK">Tolak</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Catatan</label>
              <textarea v-model="vpForm.catatan" rows="2" class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700"></textarea>
            </div>
            <div v-if="vpForm.keputusan === Keputusan.REVISI">
              <label class="block text-sm font-medium mb-1">Catatan Revisi <span class="text-red-500">*</span></label>
              <textarea v-model="vpForm.catatanRevisi" rows="2" class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-5">
            <button @click="showVerifikasiPengusul = false" class="px-4 py-2 text-sm border rounded-lg">Batal</button>
            <button @click="submitVerifikasiPengusul" :disabled="pending" class="px-4 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-50">
              {{ pending ? 'Mengirim...' : 'Kirim' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Verifikasi Pemberi -->
    <Teleport to="body">
      <div
        v-if="showVerifikasiPemberi"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="showVerifikasiPemberi = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Verifikasi Pemberi (Sekretaris)</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="vpbForm.berkasTersedia" /> Berkas tersedia</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="vpbForm.tidakAdaPembatasan" /> Tidak ada pembatasan</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="vpbForm.tujuanMemadai" /> Tujuan memadai</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="vpbForm.tidakBentrokRetensi" /> Tidak bentrok retensi</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="vpbForm.disetujuiLanjut" /> Disetujui lanjut</label>
            <div>
              <label class="block text-sm font-medium mb-1">Durasi Disetujui</label>
              <select v-model="vpbForm.durasiAksesDisetujui" class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700">
                <option v-for="opt in durasiOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Catatan Perubahan Durasi</label>
              <textarea v-model="vpbForm.catatanPerubahanDurasi" rows="2" class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Keputusan</label>
              <select v-model="vpbForm.keputusan" class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700">
                <option :value="Keputusan.LANJUT">Lanjut</option>
                <option :value="Keputusan.TOLAK">Tolak</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Catatan</label>
              <textarea v-model="vpbForm.catatan" rows="2" class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-5">
            <button @click="showVerifikasiPemberi = false" class="px-4 py-2 text-sm border rounded-lg">Batal</button>
            <button @click="submitVerifikasiPemberi" :disabled="pending" class="px-4 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-50">
              {{ pending ? 'Mengirim...' : 'Kirim' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Persetujuan Pemberi -->
    <Teleport to="body">
      <div
        v-if="showPersetujuanPemberi"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="showPersetujuanPemberi = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Persetujuan Pemberi (Managerial)</h3>
          <div class="space-y-3">
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="ppForm.berkasSesuai" /> Berkas sesuai</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="ppForm.tidakMelanggarKebijakan" /> Tidak melanggar kebijakan</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="ppForm.peminjamanTidakBerlebihan" /> Peminjaman tidak berlebihan</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="ppForm.sudahDiverifikasiSekretaris" /> Sudah diverifikasi sekretaris</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="ppForm.disetujuiDiberikan" /> Disetujui diberikan</label>
            <div>
              <label class="block text-sm font-medium mb-1">Keputusan</label>
              <select v-model="ppForm.keputusan" class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700">
                <option :value="Keputusan.SETUJU">Setuju</option>
                <option :value="Keputusan.REVISI">Revisi</option>
                <option :value="Keputusan.TOLAK">Tolak</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Catatan</label>
              <textarea v-model="ppForm.catatan" rows="2" class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700"></textarea>
            </div>
            <div v-if="ppForm.keputusan === Keputusan.REVISI">
              <label class="block text-sm font-medium mb-1">Catatan Revisi <span class="text-red-500">*</span></label>
              <textarea v-model="ppForm.catatanRevisi" rows="2" class="w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-5">
            <button @click="showPersetujuanPemberi = false" class="px-4 py-2 text-sm border rounded-lg">Batal</button>
            <button @click="submitPersetujuanPemberi" :disabled="pending" class="px-4 py-2 text-sm bg-primary text-white rounded-lg disabled:opacity-50">
              {{ pending ? 'Mengirim...' : 'Kirim' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>