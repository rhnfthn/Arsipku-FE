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

      <!-- 2-column layout: info (left) + aksi (right sticky) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Left: Informasi Usulan (8/12) -->
        <div class="lg:col-span-8">
          <VerifikasiDetail :usulan="usulan" />
        </div>

        <!-- Right: Card Verifikasi / Aksi (4/12, sticky) -->
        <div class="lg:col-span-4">
          <div class="lg:sticky lg:top-5 space-y-5">
            <!-- MENUNGGU_VERIFIKASI_ATASAN: Verifikasi Usulan -->
            <VerifikasiCard
              v-if="canVerify"
              :usulan="usulan"
              :submitting="actionLoading"
              @approve="onApprove"
              @reject="openRejectModal"
            />

            <!-- MENUNGGU_VERIFIKASI_TERAKHIR: Verifikasi Terakhir -->
            <FinalVerifikasiCard
              v-if="canFinalVerify"
              :submitting="actionLoading"
              @approve="onFinalVerify"
              @reject="openRejectModal"
            />

            <!-- DISETUJUI_ATASAN / DISETUJUI_VERIFIKASI_TERAKHIR / DIKIRIM / SELESAI: Berita Acara -->
            <BeritaAcaraCard
              v-if="showBeritaAcara"
              :usulan="usulan"
              :generating="actionLoading"
              @generate="onGenerateBA"
            />

            <!-- Status info cards (read-only) -->
            <div
              v-if="usulan.status === 'MENUNGGU_VERIFIKASI_ATASAN' && !canVerify"
              class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-clock" class="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <h3 class="text-sm font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                    {{ isCurrentTurn ? 'Menunggu Verifikasi Anda' : 'Menunggu Verifikasi Atasan Lain' }}
                  </h3>
                    <p class="text-sm text-yellow-600 dark:text-yellow-400">
                      <template v-if="isCurrentTurn">
                        Usulan dari {{ usulan.sekretarisName }} menunggu verifikasi Anda.
                      </template>
                      <template v-else>
                        Usulan dari {{ usulan.sekretarisName }} sedang menunggu verifikasi atasan tahap {{ usulan.currentApprovalLevel }}.
                        Akan tiba ke Anda setelah atasan sebelumnya menyetujui.
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
              v-if="usulan.status === 'DISETUJUI_VERIFIKASI_TERAKHIR'"
              class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <h3 class="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Verifikasi Selesai</h3>
                  <p class="text-sm text-green-600 dark:text-green-400">
                    Usulan lolos verifikasi. Sekretaris dapat mengirim ke Unit Tata Naskah.
                  </p>
                </div>
              </div>
            </div>

            <div
              v-if="usulan.status === 'DISETUJUI_VERIFIKASI_TERAKHIR'"
              class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
            >
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Kirim Usul Pindah Arsip Inaktif</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Kirim usulan ke Unit Tata Naskah untuk proses selanjutnya.
              </p>
              <button
                @click="onKirimUsulPindah"
                :disabled="actionLoading"
                class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50"
              >
                <UIcon name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Kirim Usul Pindah
              </button>
            </div>

            <div
              v-if="usulan.status === 'USUL_PINDAH_DIKIRIM'"
              class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-send" class="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                <div>
                  <h3 class="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">Usul Pindah Arsip Inaktif Dikirim</h3>
                  <p class="text-sm text-purple-600 dark:text-purple-400">
                    Usulan sudah dikirim. Siapkan Berkas Fisik dan Berita Acara Serah Terima untuk penyelesaian.
                  </p>
                </div>
              </div>
            </div>

            <!-- USUL_PINDAH_DIKIRIM: Tombol Lanjutkan Siapkan Berkas Fisik -->
            <div
              v-if="usulan.status === 'USUL_PINDAH_DIKIRIM'"
              class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
            >
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Siapkan Berkas Fisik</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Upload Berkas Fisik dan Berita Acara Serah Terima untuk menyelesaikan usulan.
              </p>
              <button
                @click="onSiapkanBerkasFisik"
                :disabled="actionLoading"
                class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50"
              >
                <UIcon name="i-lucide-file-check" class="w-4 h-4 mr-1 inline" /> Lanjutkan Siapkan Berkas Fisik
              </button>
            </div>

            <!-- SIAPKAN_BERKAS_FISIK: Upload form + Selesaikan -->
            <div
              v-if="usulan.status === 'SIAPKAN_BERKAS_FISIK'"
              class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
            >
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Upload Berkas Fisik</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Upload Berkas Fisik dan Berita Acara Serah Terima, lalu klik Selesaikan Proses.
              </p>
              <div class="space-y-4">
                <!-- Berkas Fisik -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Berkas Fisik (PDF)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    @change="onUploadBerkasFisik"
                    class="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#457fb6] file:text-white hover:file:bg-[#3a6d9c]"
                  />
                  <p v-if="berkasFisikUrl" class="text-xs text-green-600 mt-1">✓ {{ berkasFisikUrl }}</p>
                </div>
                <!-- Berita Acara Serah Terima -->
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Berita Acara Serah Terima (PDF)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    @change="onUploadBeritaAcara"
                    class="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#457fb6] file:text-white hover:file:bg-[#3a6d9c]"
                  />
                  <p v-if="beritaAcaraUrl" class="text-xs text-green-600 mt-1">✓ {{ beritaAcaraUrl }}</p>
                </div>
                <!-- Tombol Selesaikan -->
                <button
                  @click="onSelesaikan"
                  :disabled="actionLoading"
                  class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  <UIcon name="i-lucide-check-circle" class="w-4 h-4 mr-1 inline" /> Selesaikan Proses
                </button>
              </div>
            </div>

            <div
              v-if="usulan.status === 'SIAPKAN_BERKAS_FISIK' || usulan.status === 'SELESAI'"
              class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <h3 class="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">
                    {{ usulan.status === 'SELESAI' ? 'Usulan Selesai' : 'Berkas Fisik Disiapkan' }}
                  </h3>
                  <p class="text-sm text-green-600 dark:text-green-400">
                    {{ usulan.status === 'SELESAI' ? 'Proses pemindahan arsip selesai.' : 'Sekretaris sedang menyiapkan berkas fisik.' }}
                  </p>
                </div>
              </div>
            </div>

            <div
              v-if="usulan.status === 'DIKIRIM'"
              class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-send" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h3 class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Usulan Dikirim</h3>
                  <p class="text-sm text-blue-600 dark:text-blue-400">
                    Usulan telah dikirim ke Unit Tata Naskah untuk verifikasi berkas fisik.
                  </p>
                </div>
              </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useVerifikasiUsulan } from '~/composables/useVerifikasiUsulan';
import { useAuth } from '~/composables/useAuth';
import VerifikasiDetail from '~/components/verifikasi-usulan/VerifikasiDetail.vue';
import VerifikasiCard from '~/components/verifikasi-usulan/VerifikasiCard.vue';
import FinalVerifikasiCard from '~/components/verifikasi-usulan/FinalVerifikasiCard.vue';
import BeritaAcaraCard from '~/components/verifikasi-usulan/BeritaAcaraCard.vue';
import RejectModal from '~/components/verifikasi-usulan/RejectModal.vue';
import type { VerifikasiUsulanItem, JenisUsulan } from '~/types/verifikasi-usulan';

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
  checkIsCurrentTurn,
} = useVerifikasiUsulan();

const usulan = ref<VerifikasiUsulanItem | null>(null);
const loading = ref(true);
const actionLoading = ref(false);
const isRejectModalOpen = ref(false);
const berkasFisikUrl = ref('');
const beritaAcaraUrl = ref('');
const isCurrentTurn = ref(false);

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
  return ['DISETUJUI_ATASAN', 'DISETUJUI_VERIFIKASI_TERAKHIR', 'DIKIRIM', 'SELESAI'].includes(usulan.value.status);
});

/** True jika usulan ini dibuat oleh user yang login sebagai Sekretaris. */
const isOwnUsulan = computed(() => {
  if (!usulan.value || !user.value) return false;
  return Number(usulan.value.sekretarisPersnum) === Number(user.value.persnum);
});

/** Bisa verifikasi hanya jika status MENUNGGU_VERIFIKASI_ATASAN, bukan usulan sendiri, DAN sedang giliran. */
const canVerify = computed(() => {
  if (!usulan.value || isOwnUsulan.value) return false;
  if (usulan.value.status !== 'MENUNGGU_VERIFIKASI_ATASAN') return false;
  return isCurrentTurn.value;
});

/** Verifikasi terakhir tidak lagi dipakai untuk multi-level (final di-handle oleh approve). */
const canFinalVerify = computed(() => false);

const loadDetail = async () => {
  loading.value = true;
  try {
    usulan.value = await fetchDetail(route.params.id as string, jenis.value);
    // Cek apakah user sedang giliran
    if (
      usulan.value &&
      jenis.value === 'aktif_ke_inaktif' &&
      usulan.value.status === 'MENUNGGU_VERIFIKASI_ATASAN'
    ) {
      isCurrentTurn.value = await checkIsCurrentTurn(usulan.value.id, jenis.value);
    } else {
      isCurrentTurn.value = false;
    }
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
    usulan.value.status === 'MENUNGGU_VERIFIKASI_ATASAN'
  ) {
    isCurrentTurn.value = await checkIsCurrentTurn(usulan.value.id, jenis.value);
  } else {
    isCurrentTurn.value = false;
  }
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
  act(() => verify(usulan.value!.id, jenis.value, { catatanVerifikasi: catatan }));
};

const onFinalVerify = (catatan: string) => {
  if (!confirm('Setujui verifikasi terakhir usulan ini?')) return;
  act(() => finalVerify(usulan.value!.id, jenis.value, { catatanVerifikasi: catatan }));
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

onMounted(() => loadDetail());
</script>