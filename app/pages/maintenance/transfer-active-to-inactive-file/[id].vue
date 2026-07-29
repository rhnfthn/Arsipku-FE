<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
      <PageHeader
        :title="`Detail Usulan ${item?.nomorUsulan ?? ''}`"
        :items="items"
      />
      <NuxtLink
        to="/maintenance/transfer-active-to-inactive-file"
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
    <template v-else-if="item">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Left: Informasi Usulan (8/12) -->
        <div class="lg:col-span-8 space-y-5">
          <TransferDetailCard :transfer="item" />

          <!-- Catatan Penolakan (hanya jika DITOLAK_ATASAN) -->
          <div
            v-if="item.status === 'DITOLAK_ATASAN' && item.rejectedNote"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm p-5"
          >
            <div class="flex items-start gap-3">
              <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div class="flex-1">
                <h3 class="text-base font-semibold text-red-700 dark:text-red-300 mb-1">Usulan Ditolak</h3>
                <p class="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg mt-2">
                  {{ item.rejectedNote }}
                </p>
              </div>
            </div>
          </div>

          <!-- ─── Button Action (di bawah detail) ─── -->

          <!-- DRAFT: Edit + Kirim -->
          <div
            v-if="item.status === 'DRAFT'"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
          >
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Aksi Sekretaris</h3>
            <div class="flex flex-col gap-2">
              <button
                @click="onEdit"
                class="w-full px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <UIcon name="i-lucide-pencil" class="w-4 h-4 mr-1 inline" /> Edit Usulan
              </button>
              <button
                @click="onSend"
                :disabled="actionLoading"
                class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50"
              >
                <UIcon name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Kirim ke Atasan
              </button>
            </div>
          </div>

          <!-- DITOLAK_ATASAN: Edit + Ajukan Kembali -->
          <div
            v-if="item.status === 'DITOLAK_ATASAN'"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
          >
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Aksi Sekretaris</h3>
            <div class="flex flex-col gap-2">
              <button
                @click="onEdit"
                class="w-full px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <UIcon name="i-lucide-pencil" class="w-4 h-4 mr-1 inline" /> Edit Usulan
              </button>
              <button
                @click="onResubmit"
                :disabled="actionLoading"
                class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50"
              >
                <UIcon v-if="actionLoading" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
                <UIcon v-else name="i-lucide-refresh-cw" class="w-4 h-4 mr-1 inline" /> Ajukan Kembali
              </button>
            </div>
          </div>

            <!-- MENUNGGU_VERIFIKASI_ATASAN -->
            <div
              v-if="item.status === 'MENUNGGU_VERIFIKASI_ATASAN'"
              class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-clock" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h3 class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Menunggu Verifikasi Atasan</h3>
                  <p class="text-sm text-blue-600 dark:text-blue-400">
                    Usulan dikirim ke {{ item.atasanName }}. Menunggu verifikasi.
                  </p>
                </div>
              </div>
            </div>

            <!-- DISETUJUI_ATASAN / MENUNGGU_VERIFIKASI_TERAKHIR -->
            <div
              v-if="item.status === 'DISETUJUI_ATASAN' || item.status === 'MENUNGGU_VERIFIKASI_TERAKHIR'"
              class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-clock" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h3 class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Menunggu Verifikasi Terakhir</h3>
                  <p class="text-sm text-blue-600 dark:text-blue-400">
                    Usulan disetujui atasan. Menunggu verifikasi terakhir.
                  </p>
                </div>
              </div>
            </div>

            <!-- DISETUJUI_VERIFIKASI_TERAKHIR: Menunggu atasan kirim ke TU (bukan sekretaris) -->
            <div
              v-if="item.status === 'DISETUJUI_VERIFIKASI_TERAKHIR'"
              class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-clock" class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <h3 class="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Menunggu Verifikasi</h3>
                  <p class="text-sm text-blue-600 dark:text-blue-400">
                    Verifikasi terakhir selesai. Atasan Managerial akan mengirim usulan ke Unit Tata Naskah.
                  </p>
                </div>
              </div>
            </div>

            <!-- Berita Acara -->
            <div
              v-if="showBeritaAcara"
              class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
            >
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Berita Acara</h3>
              <button
                v-if="!item.beritaAcaraUrl"
                @click="onGenerateBA"
                :disabled="actionLoading"
                class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 mb-2"
              >
                <UIcon name="i-lucide-file-text" class="w-4 h-4 mr-1 inline" /> Generate
              </button>
              <div v-else>
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">{{ item.beritaAcaraNomor }}</p>
                <a
                  :href="item.beritaAcaraUrl"
                  target="_blank"
                  class="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-[#457fb6] text-[#457fb6] hover:bg-[#457fb6]/10 transition-colors"
                >
                  <UIcon name="i-lucide-download" class="w-4 h-4" /> Download PDF
                </a>
              </div>
            </div>

            <!-- DIKIRIM: Menunggu Penerimaan -->
            <div
              v-if="item.status === 'DIKIRIM'"
              class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-clock" class="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                <div>
                  <h3 class="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-1">Menunggu Penerimaan</h3>
                  <p class="text-sm text-purple-600 dark:text-purple-400">
                    Usulan dikirim ke Unit Tata Naskah. Menunggu penerimaan dari Atasan Managerial TU.
                  </p>
                </div>
              </div>
            </div>

            <!-- USUL_PINDAH_DIKIRIM: Sekretaris siapkan berkas fisik -->
            <div
              v-if="item.status === 'USUL_PINDAH_DIKIRIM'"
              class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
            >
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Siapkan Berkas Fisik</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Atasan telah mengirim usul pindah. Silakan siapkan berkas fisik dan Berita Acara Serah Terima.
              </p>
              <button
                @click="onSiapkanBerkasFisik"
                :disabled="actionLoading"
                class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50"
              >
                <UIcon name="i-lucide-file-check" class="w-4 h-4 mr-1 inline" /> Siapkan Berkas Fisik
              </button>
            </div>

            <!-- SIAPKAN_BERKAS_FISIK: Upload file + Kirim ke TU -->
            <div
              v-if="item.status === 'SIAPKAN_BERKAS_FISIK'"
              class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5"
            >
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">Upload Berkas Fisik</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Upload berkas fisik dan Berita Acara Serah Terima, lalu kirim ke Unit Tata Naskah.
              </p>
              <button
                @click="onSelesai"
                :disabled="actionLoading"
                class="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50"
              >
                <UIcon name="i-lucide-send" class="w-4 h-4 mr-1 inline" /> Kirim ke TU
              </button>
            </div>

            <!-- SELESAI -->
            <div
              v-if="item.status === 'SELESAI'"
              class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl shadow-sm p-5"
            >
              <div class="flex items-start gap-3">
                <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <h3 class="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">Usulan Selesai</h3>
                  <p class="text-sm text-green-600 dark:text-green-400">
                    Proses pemindahan arsip selesai.
                  </p>
                </div>
              </div>
            </div>

            <!-- ─── Card: Daftar Isi ─── -->
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Daftar Isi</h3>
                <button @click="printDaftarIsi" class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <UIcon name="i-lucide-printer" class="w-3.5 h-3.5" /> Print Daftar Isi
                </button>
              </div>
              <div id="daftar-isi-print" class="text-sm">
                <p class="font-semibold text-gray-900 dark:text-white mb-3">Daftar Isi — {{ item.nomorUsulan }}</p>
                <table class="w-full border-collapse text-xs">
                  <thead>
                    <tr class="border-b-2 border-gray-300 dark:border-gray-500">
                      <th class="text-center py-2 px-2 text-gray-500 w-8">✓</th>
                      <th class="text-left py-2 px-2 text-gray-500 w-10">No</th>
                      <th class="text-left py-2 px-2 text-gray-500">Nama Berkas / Perihal</th>
                      <th class="text-left py-2 px-2 text-gray-500">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(d, idx) in daftarIsi" :key="idx" class="border-b border-gray-100 dark:border-gray-700">
                      <td class="text-center py-2 px-2">
                        <input type="checkbox" class="w-4 h-4 text-[#457fb6] border-gray-300 rounded" />
                      </td>
                      <td class="py-2 px-2 text-gray-600 dark:text-gray-300">{{ d.no }}</td>
                      <td class="py-2 px-2 text-gray-700 dark:text-gray-200">{{ d.namaBerkas }}</td>
                      <td class="py-2 px-2 text-gray-500">{{ d.keterangan }}</td>
                    </tr>
                    <tr v-if="daftarIsi.length === 0">
                      <td colspan="4" class="py-4 text-center text-gray-400 italic">Tidak ada arsip</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- ─── Card: Berita Acara Serah Terima ─── -->
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
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
                <p class="text-center text-xs mb-3">Nomor: {{ item.nomorUsulan }}</p>
                <p class="text-center text-xs text-gray-500 mb-4">Tanggal: {{ formatDate(item.tanggalUsulan) }}</p>

                <p class="text-xs leading-relaxed mb-4">
                  Pada hari ini {{ hariIni }} tanggal {{ formatTanggalLengkap(item.tanggalUsulan) }}, yang bertanda tangan di bawah ini:
                </p>

                <div class="space-y-3 mb-4 text-xs">
                  <div>
                    <p><span class="font-semibold">1. Nama</span> &nbsp;&nbsp;&nbsp;: {{ beritaAcaraData.atasan?.nama ?? '-' }}</p>
                    <p><span class="font-semibold">&nbsp;&nbsp;&nbsp;Jabatan</span> : {{ beritaAcaraData.atasan?.jabatan ?? '-' }}</p>
                    <p class="text-gray-500 italic">Selanjutnya disebut pihak pertama</p>
                  </div>
                  <div>
                    <p><span class="font-semibold">2. Nama</span> &nbsp;&nbsp;&nbsp; : {{ beritaAcaraData.pengirim?.nama ?? '-' }}</p>
                    <p><span class="font-semibold">&nbsp;&nbsp;&nbsp;Jabatan</span> : {{ beritaAcaraData.pengirim?.jabatan ?? '-' }}</p>
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

                <p class="text-xs text-right mb-6">{{ kotaIni }}, {{ formatTanggalLengkap(item.tanggalUsulan) }}</p>

                <div class="grid grid-cols-2 gap-8 text-xs">
                  <div class="text-center">
                    <p class="font-semibold mb-16">Pihak Pertama</p>
                    <p class="border-t border-gray-400 pt-1 font-semibold">{{ beritaAcaraData.atasan?.nama ?? '-' }}</p>
                    <p class="text-gray-500">{{ beritaAcaraData.atasan?.jabatan ?? '-' }}</p>
                  </div>
                  <div class="text-center">
                    <p class="font-semibold mb-16">Pihak Kedua</p>
                    <p class="border-t border-gray-400 pt-1 font-semibold">{{ beritaAcaraData.pengirim?.nama ?? '-' }}</p>
                    <p class="text-gray-500">{{ beritaAcaraData.pengirim?.jabatan ?? '-' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        <!-- Right: Timeline Riwayat (4/12, sticky) -->
        <div class="lg:col-span-4">
          <div class="lg:sticky lg:top-4 space-y-5">
            <TimelineRiwayat :item="item" />
          </div>
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
      Usulan tidak ditemukan
    </div>

    <!-- Edit Modal -->
    <CreateTransferModal
      v-model="isEditModalOpen"
      :edit-data="item"
      @updated="onUpdated"
    />

    <!-- Resubmit Confirm Modal -->
    <div v-if="isResubmitModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" @click="isResubmitModalOpen = false"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden z-10">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ajukan Kembali Usulan</h3>
        </div>
        <div class="p-6">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Usulan akan diajukan ulang ke Atasan Managerial untuk verifikasi.
          </p>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button @click="isResubmitModalOpen = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Batal</button>
          <button @click="confirmResubmit" :disabled="actionLoading" class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50">
            {{ actionLoading ? 'Mengirim...' : 'Ajukan Kembali' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  #daftar-isi-print,
  #daftar-isi-print *,
  #berita-acara-print,
  #berita-acara-print * {
    visibility: visible;
  }
  #daftar-isi-print,
  #berita-acara-print {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    padding: 20px;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useTransferActiveToInactive } from '~/composables/useTransferActiveToInactive';
import { useApi } from '~/composables/useApi';
import TransferDetailCard from '~/components/transfer-active-to-inactive/TransferDetailCard.vue';
import TimelineRiwayat from '~/components/transfer-active-to-inactive/TimelineRiwayat.vue';
import CreateTransferModal from '~/components/transfer-active-to-inactive/CreateTransferModal.vue';
import type { TransferActiveToInactive } from '~/types/transfer-active-to-inactive';

definePageMeta({ middleware: ['auth'] });

const route = useRoute();
const { apiGet } = useApi();
const {
  fetchDetail,
  send,
  resubmit,
  dispatch,
  generateBeritaAcara,
  siapkanBerkasFisik,
  selesaikanUsulan,
} = useTransferActiveToInactive();

const item = ref<TransferActiveToInactive | null>(null);
const loading = ref(true);
const actionLoading = ref(false);
const isEditModalOpen = ref(false);
const isResubmitModalOpen = ref(false);
const daftarIsi = ref<any[]>([]);
const beritaAcaraData = ref<any>({ atasan: {}, pengirim: {}, daftarArsip: [] });

const items = computed(() => [
  { label: 'Beranda', to: '/' },
  { label: 'Pemeliharaan', to: '/maintenance/transfer-active-to-inactive-file' },
  { label: item.value?.nomorUsulan ?? 'Detail', to: `/maintenance/transfer-active-to-inactive-file/${route.params.id}` },
]);

const showBeritaAcara = computed(() => {
  if (!item.value) return false;
  return ['DISETUJUI_ATASAN', 'DISETUJUI_VERIFIKASI_TERAKHIR', 'DIKIRIM', 'SELESAI'].includes(item.value.status);
});

const loadDetail = async () => {
  loading.value = true;
  try {
    item.value = await fetchDetail(route.params.id as string);
    await Promise.all([loadDaftarIsi(), loadBeritaAcaraData()]);
  } catch (e) {
    console.error('Gagal memuat detail:', e);
  } finally {
    loading.value = false;
  }
};

const refresh = async () => {
  item.value = await fetchDetail(route.params.id as string);
  await Promise.all([loadDaftarIsi(), loadBeritaAcaraData()]);
};

const loadDaftarIsi = async () => {
  try {
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/daftar-isi`, {}, { skipCache: true });
    daftarIsi.value = res?.data?.daftarIsi ?? [];
  } catch (e) {
    daftarIsi.value = [];
  }
};

const loadBeritaAcaraData = async () => {
  try {
    const res: any = await apiGet(`/transfer-active-to-inactive/${route.params.id}/berita-acara-data`, {}, { skipCache: true });
    beritaAcaraData.value = res?.data ?? { atasan: {}, pengirim: {}, daftarArsip: [] };
  } catch (e) {
    beritaAcaraData.value = { atasan: {}, pengirim: {}, daftarArsip: [] };
  }
};

const printDaftarIsi = () => {
  const el = document.getElementById('daftar-isi-print');
  if (!el) return;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Daftar Isi</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
    .text-sm { font-size: 13px; }
    .text-xs { font-size: 12px; }
    .font-semibold { font-weight: 600; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-700 { color: #374151; }
    .text-gray-400 { color: #9ca3af; }
    .text-center { text-align: center; }
    .italic { font-style: italic; }
    .w-full { width: 100%; }
    .w-8 { width: 32px; }
    .w-10 { width: 40px; }
    .w-4 { width: 16px; }
    .h-4 { height: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { border-bottom: 2px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600; }
    td { border-bottom: 1px solid #f3f4f6; padding: 8px; }
    .px-2 { padding-left: 8px; padding-right: 8px; }
    .py-2 { padding-top: 8px; padding-bottom: 8px; }
    .py-4 { padding-top: 16px; padding-bottom: 16px; }
    .pr-2 { padding-right: 8px; }
    input[type="checkbox"] { width: 16px; height: 16px; }
    p { margin: 0; }
  </style>
  </head><body>${el.innerHTML}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 250);
};

const printBeritaAcara = () => {
  const el = document.getElementById('berita-acara-print');
  if (!el) return;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Berita Acara Serah Terima</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #111; }
    /* Replikasi Tailwind classes */
    .text-sm { font-size: 13px; }
    .text-xs { font-size: 12px; }
    .text-base { font-size: 16px; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .italic { font-style: italic; }
    .mb-1 { margin-bottom: 4px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .mb-6 { margin-bottom: 24px; }
    .mb-16 { margin-bottom: 64px; }
    .mt-3 { margin-top: 12px; }
    .space-y-3 > * + * { margin-top: 12px; }
    .space-y-1 > * + * { margin-top: 4px; }
    .leading-relaxed { line-height: 1.625; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-400 { color: #9ca3af; }
    .ml-2 { margin-left: 8px; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: 1fr 1fr; }
    .gap-8 { gap: 32px; }
    .gap-4 { gap: 16px; }
    .border-t { border-top: 1px solid #9ca3af; }
    .border-gray-400 { border-color: #9ca3af; }
    .pt-1 { padding-top: 4px; }
    ol { padding-left: 20px; margin: 0; }
    li { margin-bottom: 4px; }
    p { margin: 0; }
  </style>
  </head><body>${el.innerHTML}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 250);
};

const downloadBeritaAcara = () => {
  // Trigger PDF download via backend (placeholder — generate PDF di backend)
  window.open(`/transfer-active-to-inactive/${route.params.id}/berita-acara.pdf`, '_blank');
};

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

const onEdit = () => {
  isEditModalOpen.value = true;
};

const onUpdated = async () => {
  isEditModalOpen.value = false;
  await refresh();
};

const onSend = () => {
  if (!confirm('Kirim usulan ke atasan?')) return;
  act(() => send(item.value!.id));
};

const onResubmit = () => {
  isResubmitModalOpen.value = true;
};

const confirmResubmit = () => {
  act(async () => {
    await resubmit(item.value!.id);
    isResubmitModalOpen.value = false;
  });
};

const onDispatch = () => {
  if (!confirm('Kirim usulan ke Unit Tata Naskah?')) return;
  act(() => dispatch(item.value!.id));
};

const onGenerateBA = () => act(() => generateBeritaAcara(item.value!.id));

const onSiapkanBerkasFisik = () => {
  if (!confirm('Siapkan berkas fisik untuk usulan ini?')) return;
  act(() => siapkanBerkasFisik(item.value!.id));
};

const onSelesai = () => {
  if (!confirm('Selesaikan usulan? Pastikan berkas fisik sudah disiapkan.')) return;
  act(() => selesaikanUsulan(item.value!.id));
};

onMounted(() => loadDetail());
</script>