<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader
      :items="[
        { label: 'Kelola' },
        { label: 'Pemeliharaan' },
        {
          label: 'Persetujuan Pemberkasan',
          to: '/kelola/pemeliharaan/persetujuan-pemberkasan',
        },
        { label: 'Review' },
      ]"
    >
      <template #title>
        <div class="flex flex-wrap items-center gap-3">
          <h1
            class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl"
          >
            Review Penutupan Berkas
          </h1>
          <span
            class="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
          >
            Ref: #{{ berkas?.kodeBerkas || berkasId.slice(0, 8).toUpperCase() }}
          </span>
        </div>
      </template>
    </PageHeader>

    <div v-if="isLoading" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <main v-else class="mx-auto max-w-6xl space-y-5">
      <!-- Langkah Verifikasi -->
      <section
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
          >
            <UIcon name="i-lucide-route" class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Langkah Verifikasi</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Progress persetujuan penutupan berkas.
            </p>
          </div>
          <span
            class="ml-auto inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
          >
            {{ progressLabel }}
          </span>
        </div>
        <div class="overflow-x-auto px-5 py-5">
          <div class="flex min-w-[600px] items-center px-1 py-2">
            <template v-for="(step, index) in stepItems" :key="step.id">
              <div class="flex min-w-36 items-center gap-3">
                <div
                  class="flex size-12 shrink-0 items-center justify-center rounded-full text-base font-bold"
                  :class="step.className"
                >
                  <UIcon v-if="step.status === 'approved'" name="i-lucide-check" class="size-5" />
                  <UIcon
                    v-else-if="step.status === 'closed'"
                    name="i-lucide-check-check"
                    class="size-5"
                  />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <span class="text-sm font-semibold" :class="step.textClass">{{ step.label }}</span>
              </div>
              <div
                v-if="index < stepItems.length - 1"
                class="mx-4 h-0.5 min-w-12 flex-1 bg-gray-300 dark:bg-gray-600"
              />
            </template>
          </div>
        </div>
      </section>

      <!-- Informasi Berkas -->
      <section
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
          >
            <UIcon
              name="i-lucide-folder-archive"
              class="size-5 text-primary-600 dark:text-primary-400"
            />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Informasi Berkas</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Metadata berkas yang diajukan untuk ditutup.
            </p>
          </div>
        </div>
        <dl class="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2">
          <div v-for="item in metadata" :key="item.label" class="flex items-start gap-3">
            <span
              class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
            >
              <UIcon :name="item.icon" class="size-4" />
            </span>
            <div class="min-w-0">
              <dt
                class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                {{ item.label }}
              </dt>
              <dd
                class="mt-0.5 break-words text-sm font-semibold text-gray-900 dark:text-white"
                :title="item.value"
              >
                {{ item.value }}
              </dd>
            </div>
          </div>
        </dl>
      </section>

      <!-- Foto Lokasi Fisik -->
      <section
        v-if="berkas?.fotoLokasiFisik"
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
          >
            <UIcon
              name="i-lucide-camera"
              class="size-5 text-primary-600 dark:text-primary-400"
            />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Foto Lokasi Fisik</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Lokasi penyimpanan fisik berkas.
            </p>
          </div>
        </div>
        <div class="max-w-md px-5 py-5">
          <div
            v-if="fotoLoading"
            class="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700/50"
          >
            <span class="text-xs text-gray-400">Memuat foto…</span>
          </div>
          <button
            v-else-if="fotoObjectUrl"
            type="button"
            class="group relative block w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
            @click="openLightbox"
          >
            <img
              :src="fotoObjectUrl"
              alt="Foto lokasi fisik"
              class="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
            />
            <span
              class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/50 py-1.5 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <UIcon name="i-lucide-eye" class="size-3.5" /> Klik untuk perbesar
            </span>
          </button>
          <div
            v-else
            class="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 text-center dark:border-gray-700 dark:bg-gray-700/30"
          >
            <span class="text-xs text-gray-400">{{
              fotoError ? 'File tidak tersedia' : 'Belum ada foto'
            }}</span>
          </div>
        </div>
      </section>

      <!-- Daftar Naskah (Isi Berkas) -->
      <section
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
          >
            <UIcon name="i-lucide-files" class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Daftar Naskah</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {{ naskahTotal }} naskah dalam berkas ini.
            </p>
          </div>
        </div>
        <div class="overflow-x-auto p-5">
          <DataTable
            :columns="naskahColumns"
            :rows="naskahList"
            empty-message="Belum ada naskah dalam berkas ini."
          >
            <template #cell-nomorSurat="{ row }"
              ><span class="font-mono text-xs text-gray-700 dark:text-gray-300">{{
                row.nomorSurat || '-'
              }}</span></template
            >
            <template #cell-perihal="{ row }"
              ><span class="text-sm text-gray-900 dark:text-white">{{
                row.perihal || '-'
              }}</span></template
            >
            <template #cell-naskahTipe="{ row }"
              ><span
                class="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
              >
                {{ naskahTipeLabel(row.naskahTipe) }}
              </span></template
            >
            <template #cell-tanggalNaskah="{ row }"
              ><span class="text-sm text-gray-600 dark:text-gray-400">{{
                formatDate(row.tanggalNaskah)
              }}</span></template
            >
            <template #cell-status
              ><span
                class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400"
              >
                <span class="size-1.5 rounded-full bg-success-500" /> Final
              </span></template
            >
            <template #cell-aksi="{ row }">
              <button
                type="button"
                class="inline-flex rounded-md p-2 text-gray-500 transition-colors hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30"
                title="Lihat PDF naskah"
                @click="openNaskahPdf(row)"
              >
                <Eye class="h-4 w-4" />
              </button>
            </template>
          </DataTable>
        </div>
      </section>

      <!-- Uraian / Catatan Pengusul -->
      <section
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
          >
            <UIcon
              name="i-lucide-message-square-text"
              class="size-5 text-primary-600 dark:text-primary-400"
            />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Uraian & Catatan Pengusul</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Catatan pengusul saat mengajukan penutupan berkas.
            </p>
          </div>
        </div>
        <div class="px-5 py-4">
          <p
            class="whitespace-pre-wrap border-l-2 border-primary-300 pl-4 text-sm leading-6 text-gray-600 dark:border-primary-700 dark:text-gray-300"
          >
            {{ berkas?.catatanPenutupan || 'Tidak ada catatan pengusul.' }}
          </p>
        </div>
      </section>

      <!-- Timeline Singkat -->
      <section
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div
          class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
        >
          <span
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
          >
            <UIcon name="i-lucide-history" class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Timeline Singkat</h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Ringkasan waktu penting berkas.
            </p>
          </div>
        </div>
        <ol class="space-y-4 px-5 py-5">
          <li v-for="item in timelineItems" :key="item.label" class="flex items-start gap-3">
            <span class="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary-500" />
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.label }}</p>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.value }}</p>
            </div>
          </li>
        </ol>
      </section>

      <!-- Aksi Verifikasi -->
      <section
        v-if="!isLoading && !verifikasiSelesai && !isRiwayatMode"
        class="overflow-hidden rounded-xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-5 shadow-sm dark:border-primary-900/40 dark:from-primary-900/20 dark:to-gray-800"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400"
            >
              <UIcon name="i-lucide-circle-check-big" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Aksi Verifikasi</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{
                  isLastVerifikator
                    ? 'Setujui untuk menutup berkas, atau tolak pengajuan ini.'
                    : 'Setujui untuk meneruskan ke verifikator berikutnya, atau tolak.'
                }}
              </p>
            </div>
          </div>
          <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <UButton
              class="w-full sm:w-auto"
              color="error"
              variant="outline"
              size="lg"
              icon="i-lucide-circle-x"
              :loading="isProcessing"
              @click="openReject"
              >Tolak Penutupan</UButton
            >
            <UButton
              class="w-full sm:w-auto"
              color="primary"
              size="lg"
              icon="i-lucide-arrow-right"
              :loading="isProcessing"
              @click="openApprove"
              >{{ isLastVerifikator ? 'Setujui Penutupan' : 'Lanjutkan Verifikasi' }}</UButton
            >
          </div>
        </div>
      </section>

      <!-- Keputusan Anda (mode riwayat — read-only) -->
      <section
        v-else-if="isRiwayatMode && !isLoading"
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              :class="
                myDecision?.status === 'approved'
                  ? 'bg-success-100 text-success-600 dark:bg-success-900/40 dark:text-success-400'
                  : 'bg-error-100 text-error-600 dark:bg-error-900/40 dark:text-error-400'
              "
            >
              <UIcon
                :name="myDecision?.status === 'approved' ? 'i-lucide-circle-check-big' : 'i-lucide-circle-x'"
                class="size-5"
              />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Keputusan Anda</h3>
              <p v-if="myDecision" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Anda
                <span
                  :class="
                    myDecision?.status === 'approved'
                      ? 'font-medium text-success-700 dark:text-success-400'
                      : 'font-medium text-error-700 dark:text-error-400'
                  "
                >{{ myDecision?.status === 'approved' ? 'menyetujui' : 'menolak' }}</span>
                pengajuan penutupan berkas ini pada {{ formatDate(myDecision?.actionAt) }}.
              </p>
              <p v-else class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Data keputusan tidak ditemukan.
              </p>
            </div>
          </div>
          <UButton
            class="w-full sm:w-auto"
            color="neutral"
            variant="outline"
            size="lg"
            icon="i-lucide-arrow-left"
            to="/kelola/pemeliharaan/persetujuan-pemberkasan"
            >Kembali ke Daftar Persetujuan</UButton
          >
        </div>
        <div v-if="myDecision?.catatan" class="border-t border-gray-100 px-5 py-3 dark:border-gray-700">
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Catatan</p>
          <p class="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{{ myDecision?.catatan }}</p>
        </div>
      </section>

      <!-- Verifikasi Selesai (tidak ada langkah pending) -->
      <section
        v-else-if="!isLoading && verifikasiSelesai"
        class="overflow-hidden rounded-xl border border-success-100 bg-gradient-to-br from-success-50 to-white p-5 shadow-sm dark:border-success-900/40 dark:from-success-900/20 dark:to-gray-800"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-100 text-success-600 dark:bg-success-900/40 dark:text-success-400"
            >
              <UIcon name="i-lucide-circle-check-big" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Verifikasi Selesai</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Pengajuan penutupan berkas ini sudah selesai diproses. Tidak ada aksi lain
                diperlukan.
              </p>
            </div>
          </div>
          <UButton
            class="w-full sm:w-auto"
            color="neutral"
            variant="outline"
            size="lg"
            icon="i-lucide-arrow-left"
            to="/kelola/pemeliharaan/persetujuan-pemberkasan"
            >Kembali ke Daftar Persetujuan</UButton
          >
        </div>
      </section>
    </main>

    <!-- Lightbox foto -->
    <UModal
      v-model:open="lightboxOpen"
      :ui="{ content: 'max-w-4xl', overlay: 'bg-black/80 backdrop-blur-sm' }"
    >
      <template #body>
        <div class="flex items-center justify-center bg-black p-2">
          <img
            v-if="fotoObjectUrl"
            :src="fotoObjectUrl"
            alt="Foto lokasi fisik"
            class="max-h-[80vh] w-full rounded-lg object-contain"
          />
        </div>
      </template>
    </UModal>

    <!-- Modal Setuju (standarisasi) -->
    <VerifyActionModal
      v-model="showApproveModal"
      variant="approve"
      title="Setujui Penutupan Berkas"
      :description="
        isLastVerifikator
          ? 'Anda akan menyetujui penutupan berkas ini. Berkas ditutup setelah seluruh verifikator menyetujui.'
          : 'Anda akan menyetujui verifikasi ini dan meneruskannya ke verifikator berikutnya.'
      "
      note-placeholder="Tuliskan catatan persetujuan (minimal 10 karakter)…"
      confirm-label="Ya, Setujui"
      :saving="isProcessing"
      :require-note="true"
      :min-note-length="10"
      @confirm="handleApprove"
    />

    <!-- Modal Tolak (standarisasi) -->
    <VerifyActionModal
      v-model="showRejectModal"
      variant="reject"
      title="Tolak Penutupan Berkas"
      description="Penolakan akan membatalkan pengajuan penutupan berkas ini."
      warning="Berkas kembali ke status ditolak (dapat direvisi &amp; diajukan ulang)."
      note-placeholder="Tuliskan alasan penolakan (minimal 10 karakter)…"
      confirm-label="Tolak Penutupan"
      :saving="isProcessing"
      :require-note="true"
      :min-note-length="10"
      @confirm="handleReject"
    />

    <!-- Popup PDF naskah -->
    <UModal
      v-model:open="showPdfModal"
      fullscreen
      :ui="{ overlay: 'bg-black/80 backdrop-blur-sm', body: 'p-0' }"
    >
      <template #header>
        <div class="flex items-center justify-end pr-2">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            :padded="false"
            @click="closePdfModal"
          />
        </div>
      </template>
      <template #body>
        <div class="relative flex h-full min-h-0 w-full flex-col bg-gray-100 dark:bg-gray-900">
          <div
            v-if="pdfLoading"
            class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="mb-2 size-10 animate-spin text-primary-500"
            />
            <span class="text-xs text-gray-500 dark:text-gray-400">Memuat Dokumen...</span>
          </div>
          <iframe
            v-if="pdfUrl"
            :src="pdfUrl"
            class="h-full w-full flex-1 border-none"
            title="Preview dokumen"
          />
          <div
            v-else-if="!pdfLoading"
            class="flex h-full flex-col items-center justify-center gap-2 text-gray-500"
          >
            <UIcon name="i-lucide-file-text" class="size-12 opacity-30" />
            <span class="text-sm">Dokumen tidak dapat ditampilkan.</span>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Eye } from 'lucide-vue-next';
import VerifyActionModal from '~/components/usulan-akses-berkas/VerifyActionModal.vue';

definePageMeta({ middleware: 'auth' });
const route = useRoute();
const router = useRouter();
const {
  getBerkasById,
  getVerifikasiDetail,
  getDaftarNaskah,
  getNaskahDetailInBerkas,
  approveVerifikasi,
  rejectVerifikasi,
  fetchBerkasFileBlob,
} = useArsipDinamis();
const toast = useToast();
const { user } = useAuth();
const berkasId = computed(() => route.params.id as string);
const berkas = ref<any>(null);
const verifikasiList = ref<any[]>([]);
const naskahList = ref<any[]>([]);
const naskahTotal = ref(0);
const isLoading = ref(true);
const isProcessing = ref(false);
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const openApprove = () => {
  showApproveModal.value = true;
};
const openReject = () => {
  showRejectModal.value = true;
};

// ── Popup PDF naskah ──
const showPdfModal = ref(false);
const pdfLoading = ref(false);
const pdfUrl = ref<string | null>(null);

function closePdfModal() {
  showPdfModal.value = false;
  pdfUrl.value = null;
}

// Popup PDF naskah — dibuka langsung dari daftar naskah tanpa pindah halaman.
// URL PDF final didapat dari getNaskahDetailInBerkas (satu-satunya endpoint
// yang menyertakan final_pdf_url), lalu dirender via blob.
async function openNaskahPdf(row: Record<string, any>) {
  showPdfModal.value = true;
  pdfLoading.value = true;
  pdfUrl.value = null;
  try {
    const response = await getNaskahDetailInBerkas(berkasId.value, row.naskahId);
    const rawData: any = response?.data ?? response;
    let flow: any[] = [];
    if (Array.isArray(rawData)) flow = rawData;
    else if (rawData && Array.isArray(rawData.flow)) flow = rawData.flow;
    else if (rawData) flow = [rawData];
    const url = flow[0]?.final_pdf_url || flow[0]?.final_pdf || '';
    if (!url) throw new Error('Naskah tidak memiliki PDF final');
    const res = await fetch(url);
    const blob = new Blob([await res.arrayBuffer()], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(blob);
  } catch (e: any) {
    toast.add({
      title: 'Gagal memuat PDF',
      description: e?.message || 'Silakan coba kembali.',
      color: 'error',
    });
    showPdfModal.value = false;
  } finally {
    pdfLoading.value = false;
  }
}

const pendingIndex = computed(() =>
  verifikasiList.value.findIndex((item) => item.status === 'pending')
);
const isLastVerifikator = computed(
  () =>
    pendingIndex.value >= 0 &&
    pendingIndex.value === verifikasiList.value.length - 1
);
const verifikasiSelesai = computed(() => pendingIndex.value < 0);
const progressLabel = computed(() =>
  pendingIndex.value < 0
    ? 'Verifikasi selesai'
    : `Verifikasi Tahap ${pendingIndex.value + 1} dari ${verifikasiList.value.length}`
);

const isRiwayatMode = computed(() => !!route.query.riwayat);
const myPersnum = computed(() => String(user.value?.persnum ?? ''));
const myDecision = computed(() =>
  verifikasiList.value.find((v: any) => String(v.verifikatorPersnum) === myPersnum.value),
);

const display = (value: any) =>
  value === null || value === undefined || value === '' ? '-' : String(value);

const metadata = computed(() => [
  { label: 'Nama Berkas', value: display(berkas.value?.judulBerkas), icon: 'i-lucide-folder-open' },
  { label: 'Kode Berkas', value: display(berkas.value?.kodeBerkas), icon: 'i-lucide-hash' },
  {
    label: 'Klasifikasi',
    value: display(berkas.value?.klasifikasiTeks || berkas.value?.klasifikasi),
    icon: 'i-lucide-tag',
  },
  {
    label: 'Unit Pencipta',
    value: display(
      berkas.value?.unitPenciptaNama ||
        berkas.value?.penciptaNama ||
        berkas.value?.picPersnum ||
        berkas.value?.pic_persnum
    ),
    icon: 'i-lucide-building-2',
  },
  {
    label: 'Retensi Aktif',
    value: `${berkas.value?.retensiAktifTahun || 0} Tahun`,
    icon: 'i-lucide-clock',
  },
  {
    label: 'Retensi Inaktif',
    value: `${berkas.value?.retensiInaktifTahun || 0} Tahun`,
    icon: 'i-lucide-archive',
  },
  { label: 'Lokasi Fisik', value: display(berkas.value?.lokasi), icon: 'i-lucide-map-pin' },
  {
    label: 'Nasib Akhir',
    value: display(berkas.value?.tindakanPenyusutanAkhir),
    icon: 'i-lucide-scale',
  },
  {
    label: 'Jumlah Naskah',
    value: `${naskahTotal.value} Dokumen`,
    icon: 'i-lucide-file-text',
  },
  {
    label: 'Tanggal Dibuat',
    value: formatDate(berkas.value?.tanggalDibuat),
    icon: 'i-lucide-calendar-plus',
  },
]);

const naskahTipeLabel = (t?: string) => {
  const map: Record<string, string> = {
    ND: 'Nota Dinas',
    SDI: 'Surat Dinas Internal',
    SDE: 'Surat Dinas Eksternal',
    DI: 'Disposisi',
    K: 'Konsep',
  };
  return map[String(t || '').toUpperCase()] || t || '-';
};

const naskahColumns = [
  { key: 'nomorSurat', label: 'No Naskah' },
  { key: 'perihal', label: 'Perihal' },
  { key: 'naskahTipe', label: 'Jenis' },
  { key: 'tanggalNaskah', label: 'Tanggal' },
  { key: 'status', label: 'Status' },
  { key: 'aksi', label: '' },
];

const stepItems = computed(() => [
  ...verifikasiList.value.map((item, index) => ({
    id: item.id || index,
    label: item.jabatanVerifikator || item.jabatan_verifikator || `Verifikator ${index + 1}`,
    status: item.status,
    className:
      item.status === 'approved'
        ? 'bg-success-500 text-white'
        : item.status === 'pending'
          ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/50'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700',
    textClass:
      item.status === 'approved'
        ? 'text-success-600'
        : item.status === 'pending'
          ? 'text-primary-700 dark:text-primary-300'
          : 'text-gray-500',
  })),
  {
    id: 'closed',
    label: 'Penutupan',
    status: 'closed',
    className:
      pendingIndex.value < 0
        ? 'bg-success-500 text-white'
        : 'bg-gray-100 text-gray-500 dark:bg-gray-700',
    textClass: pendingIndex.value < 0 ? 'text-success-600' : 'text-gray-500',
  },
]);

const timelineItems = computed(() => {
  const items = [{ label: 'Berkas Dibuat', value: formatDate(berkas.value?.tanggalDibuat) }];
  const latestNaskah = naskahList.value
    .map((n: any) => n.tanggalNaskah)
    .filter(Boolean)
    .sort()
    .pop();
  if (latestNaskah)
    items.push({ label: 'Dokumen Terakhir Ditambahkan', value: formatDate(latestNaskah) });
  const pengajuanAt = verifikasiList.value[0]?.createdAt;
  if (pengajuanAt) items.push({ label: 'Pengajuan Penutupan', value: formatDateTime(pengajuanAt) });
  return items;
});

const unwrap = (response: any) =>
  response?.data?.data ? response.data : (response?.data ?? response);
const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

// ── Foto lokasi fisik ──
const fotoObjectUrl = ref('');
const fotoError = ref(false);
const fotoLoading = ref(false);
const lightboxOpen = ref(false);
const isHttpUrl = (v?: string) => !!v && /^https?:\/\//i.test(v);
async function loadBerkasFiles() {
  if (!berkas.value) return;
  if (fotoObjectUrl.value) URL.revokeObjectURL(fotoObjectUrl.value);
  fotoObjectUrl.value = '';
  fotoError.value = false;
  const fotoKey = berkas.value.fotoLokasiFisik;
  if (!fotoKey) return;
  if (isHttpUrl(fotoKey)) {
    fotoObjectUrl.value = fotoKey;
    return;
  }
  fotoLoading.value = true;
  try {
    const blob = await fetchBerkasFileBlob(fotoKey);
    fotoObjectUrl.value = URL.createObjectURL(blob);
  } catch {
    fotoError.value = true;
  } finally {
    fotoLoading.value = false;
  }
}
function revokeBerkasFiles() {
  if (fotoObjectUrl.value) {
    URL.revokeObjectURL(fotoObjectUrl.value);
    fotoObjectUrl.value = '';
  }
}
const openLightbox = () => {
  lightboxOpen.value = true;
};

const handleApprove = async (catatan: string) => {
  if (catatan.trim().length < 10) return;

  isProcessing.value = true;
  try {
    await approveVerifikasi(berkasId.value, catatan);
    toast.add({ title: 'Verifikasi berhasil disetujui', color: 'success' });
    router.push('/kelola/pemeliharaan/persetujuan-pemberkasan');
  } catch (e: any) {
    toast.add({ title: e?.data?.message || e?.message || 'Gagal menyetujui', color: 'error' });
  } finally {
    isProcessing.value = false;
    showApproveModal.value = false;
  }
};

const handleReject = async (catatan: string) => {
  if (catatan.trim().length < 10) return;
  isProcessing.value = true;
  try {
    await rejectVerifikasi(berkasId.value, catatan);
    toast.add({ title: 'Penutupan ditolak', color: 'warning' });
    router.push('/kelola/pemeliharaan/persetujuan-pemberkasan');
  } catch (e: any) {
    toast.add({ title: e?.data?.message || e?.message || 'Gagal menolak', color: 'error' });
  } finally {
    isProcessing.value = false;
    showRejectModal.value = false;
  }
};

onMounted(async () => {
  try {
    const [b, v, n] = await Promise.all([
      getBerkasById(berkasId.value),
      getVerifikasiDetail(berkasId.value),
      getDaftarNaskah(berkasId.value, { page: 1, limit: 100 }),
    ]);
    berkas.value = unwrap(b);
    const verificationPayload = unwrap(v);
    verifikasiList.value = Array.isArray(verificationPayload) ? verificationPayload : [];
    const naskahPayload = unwrap(n);
    const naskahRows = Array.isArray(naskahPayload) ? naskahPayload : naskahPayload?.data || [];
    naskahList.value = naskahRows.map((item: any) => ({
      ...item,
      nomorSurat: item.nomorSurat ?? item.nomor_surat,
      tanggalNaskah: item.tanggalNaskah ?? item.tanggal_naskah,
      naskahTipe: item.naskahTipe ?? item.naskah_tipe,
    }));
    naskahTotal.value = Number(naskahPayload?.meta?.total ?? naskahRows.length);
    // Muat foto lokasi fisik secara non-blocking
    loadBerkasFiles();
  } catch (e: any) {
    toast.add({
      title: 'Gagal memuat data review',
      description: e?.data?.message || e?.message || 'Silakan coba kembali.',
      color: 'error',
    });
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  revokeBerkasFiles();
});
</script>
