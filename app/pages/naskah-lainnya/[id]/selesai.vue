<template>
  <div class="space-y-6">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ detail?.perihal || 'Memuat…' }}
        </h1>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 animate-spin text-primary-500" />
    </div>

    <div v-else-if="!detail" class="py-20 text-center text-gray-500">Naskah tidak ditemukan.</div>

    <div v-else class="space-y-6">
      <!-- Satu panel terpadu: section dipisah divider, bukan card terpisah -->
      <div
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:divide-gray-700"
      >
        <!-- Section hero sukses -->
        <div
          class="relative overflow-hidden bg-linear-to-br from-green-50 via-white to-emerald-50 dark:from-green-950/40 dark:via-gray-900 dark:to-emerald-950/30"
        >
          <div
            class="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-green-200/40 blur-3xl dark:bg-green-900/20"
            aria-hidden="true"
          />
          <div
            class="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/10"
            aria-hidden="true"
          />
          <div
            class="relative flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:items-center sm:gap-6 sm:p-8 sm:text-left"
          >
            <span
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30 ring-8 ring-green-100 dark:bg-green-600 dark:ring-green-900/50"
            >
              <UIcon name="i-lucide-check" class="size-8" />
            </span>
            <div class="min-w-0 flex-1">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                Naskah Selesai
              </h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                Seluruh proses persetujuan dan tanda tangan telah selesai.
              </p>
              <div class="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <button
                  type="button"
                  title="Klik untuk menyalin nomor"
                  class="group inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-white/80 px-3 py-1.5 font-mono text-xs font-medium text-gray-800 shadow-sm transition hover:border-green-400 hover:bg-white dark:border-green-900/60 dark:bg-gray-800/80 dark:text-gray-200 dark:hover:border-green-700"
                  @click="copyNomor"
                >
                  {{ detail.nomor || '—' }}
                  <UIcon
                    name="i-lucide-copy"
                    class="size-3.5 text-gray-400 transition group-hover:text-green-600 dark:group-hover:text-green-400"
                  />
                </button>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm dark:border-green-900/60 dark:bg-gray-800/80 dark:text-gray-300"
                >
                  <UIcon
                    name="i-lucide-file-badge"
                    class="size-3.5 text-green-600 dark:text-green-400"
                  />
                  {{ jenisLabel(detail.jenis) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Dokumen Final -->
        <section>
          <div
            class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700/60"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
              >
                <UIcon name="i-lucide-folder-open" class="size-5" />
              </span>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">Dokumen Final</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ totalFiles }} dokumen tersedia
                </p>
              </div>
            </div>
            <UButton
              v-if="totalFiles > 1"
              size="sm"
              color="primary"
              variant="soft"
              icon="i-lucide-download"
              :loading="busyKey === 'dl:all'"
              :disabled="!!busyKey && busyKey !== 'dl:all'"
              @click="downloadAll"
              >Unduh Semua</UButton
            >
          </div>
          <div class="divide-y divide-gray-100 dark:divide-gray-700/60">
            <!-- Naskah final -->
            <div
              v-if="detail.fileUrl"
              class="flex flex-col gap-3 bg-green-50/50 px-5 py-4 transition-colors duration-200 hover:bg-green-50 dark:bg-green-950/20 dark:hover:bg-green-950/40 sm:flex-row sm:items-center"
            >
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
                >
                  <UIcon name="i-lucide-file-signature" class="size-5" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {{ naskahFileName(detail, 'pdf') }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Naskah final (PDF)</p>
                </div>
              </div>
              <div class="flex shrink-0 gap-2">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-eye"
                  class="flex-1 sm:flex-initial"
                  :loading="busyKey === 'preview:naskah'"
                  :disabled="!!busyKey && busyKey !== 'preview:naskah'"
                  @click="run('preview:naskah', previewNaskah)"
                  >Preview</UButton
                >
                <UButton
                  size="sm"
                  color="primary"
                  variant="soft"
                  icon="i-lucide-download"
                  class="flex-1 sm:flex-initial"
                  :loading="busyKey === 'dl:naskah'"
                  :disabled="!!busyKey && busyKey !== 'dl:naskah'"
                  @click="run('dl:naskah', downloadNaskah)"
                  >Unduh</UButton
                >
              </div>
            </div>

            <!-- Dokumen pendukung / lembar -->
            <div
              v-for="doc in allDokumen"
              :key="doc.id"
              class="flex flex-col gap-3 px-5 py-4 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/40 sm:flex-row sm:items-center"
            >
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <span
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg"
                  :class="docMeta(doc).tile"
                >
                  <UIcon :name="docMeta(doc).icon" class="size-5" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {{ doc.nama }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ docMeta(doc).label }}</p>
                </div>
              </div>
              <div class="flex shrink-0 gap-2">
                <UButton
                  size="sm"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-eye"
                  class="flex-1 sm:flex-initial"
                  :loading="busyKey === `preview:${doc.id}`"
                  :disabled="!!busyKey && busyKey !== `preview:${doc.id}`"
                  @click="run(`preview:${doc.id}`, () => previewDokumen(doc))"
                  >Preview</UButton
                >
                <UButton
                  size="sm"
                  color="primary"
                  variant="soft"
                  icon="i-lucide-download"
                  class="flex-1 sm:flex-initial"
                  :loading="busyKey === `dl:${doc.id}`"
                  :disabled="!!busyKey && busyKey !== `dl:${doc.id}`"
                  @click="run(`dl:${doc.id}`, () => downloadDokumen(doc))"
                  >Unduh</UButton
                >
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="totalFiles === 0"
              class="flex flex-col items-center gap-2 px-5 py-10 text-center"
            >
              <span
                class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500"
              >
                <UIcon name="i-lucide-files" class="size-6" />
              </span>
              <p class="text-sm text-gray-500 dark:text-gray-400">Belum ada dokumen final.</p>
            </div>
          </div>
        </section>

        <!-- Section Informasi + Penandatangan (bersebelahan di desktop) -->
        <section class="grid lg:grid-cols-2 lg:divide-x lg:divide-gray-200 dark:lg:divide-gray-700">
          <!-- Informasi Naskah -->
          <div class="border-b border-gray-200 dark:border-gray-700 lg:border-b-0">
            <div
              class="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700/60"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                <UIcon name="i-lucide-info" class="size-5" />
              </span>
              <h3 class="font-semibold text-gray-900 dark:text-white">Informasi Naskah</h3>
            </div>
            <dl class="grid grid-cols-1 gap-x-6 gap-y-4 p-5 xl:grid-cols-2">
              <div class="min-w-0 space-y-1 xl:col-span-2">
                <dt
                  class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Perihal
                </dt>
                <dd class="break-words text-sm font-medium text-gray-900 dark:text-white">
                  {{ detail.perihal }}
                </dd>
              </div>
              <div class="min-w-0 space-y-1">
                <dt
                  class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Nomor
                </dt>
                <dd class="break-words font-mono text-sm font-medium text-gray-900 dark:text-white">
                  {{ detail.nomor || '—' }}
                </dd>
              </div>
              <div class="min-w-0 space-y-1">
                <dt
                  class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Jenis
                </dt>
                <dd class="break-words text-sm font-medium text-gray-900 dark:text-white">
                  {{ jenisLabel(detail.jenis) }}
                </dd>
              </div>
              <div class="min-w-0 space-y-1">
                <dt
                  class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Tanggal
                </dt>
                <dd class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ fmtDate(detail.tanggal) }}
                </dd>
              </div>
              <div class="min-w-0 space-y-1">
                <dt
                  class="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  Status
                </dt>
                <dd><UBadge color="success" size="sm" icon="i-lucide-check">Selesai</UBadge></dd>
              </div>
            </dl>
          </div>

          <!-- Ringkasan Penandatangan -->
          <div>
            <div
              class="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700/60"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
              >
                <UIcon name="i-lucide-pen-line" class="size-5" />
              </span>
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white">Penandatangan</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ penandatanganItems.length }} penandatangan
                </p>
              </div>
            </div>
            <ul class="divide-y divide-gray-100 dark:divide-gray-700/60">
              <li
                v-for="(p, i) in penandatanganItems"
                :key="p.positionId || p.persnum || i"
                class="flex items-center gap-3 px-5 py-3.5"
              >
                <span
                  class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                >
                  {{ initials(p.nama) }}
                  <span
                    class="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white ring-2 ring-white dark:ring-gray-800"
                  >
                    <UIcon name="i-lucide-check" class="size-2.5" />
                  </span>
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {{ p.nama }}
                  </p>
                  <p class="truncate text-xs text-gray-500 dark:text-gray-400">{{ p.jabatan }}</p>
                </div>
                <span class="shrink-0 text-xs font-medium text-green-600 dark:text-green-400"
                  >Ditandatangani</span
                >
              </li>
            </ul>
            <p
              v-if="!penandatanganItems.length"
              class="px-5 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              Data penandatangan tidak tersedia.
            </p>
          </div>
        </section>
      </div>

      <!-- Aksi (highlighted) -->
      <div
        class="overflow-hidden rounded-xl border border-green-200 bg-linear-to-br from-green-50 to-white shadow-sm ring-1 ring-green-100 dark:border-green-900/40 dark:from-green-900/20 dark:to-gray-800 dark:ring-green-900/30"
      >
        <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400"
            >
              <UIcon name="i-lucide-circle-check-big" class="size-5" />
            </span>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">Naskah Selesai</h3>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Naskah telah diselesaikan. Unduh, lihat detail, atau sebarkan dokumen final.
              </p>
            </div>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <UButton
              v-if="canShareCompleted"
              color="success"
              icon="i-lucide-share-2"
              size="lg"
              class="w-full font-semibold shadow-lg shadow-green-500/20 sm:w-auto"
              @click="showShareModal = true"
              >Bagikan</UButton
            >
            <UButton
              color="primary"
              icon="i-lucide-eye"
              size="lg"
              class="w-full font-semibold shadow-lg shadow-primary-500/20 sm:w-auto"
              @click="navigateTo(`/naskah-lainnya/${id}`)"
              >Lihat Detail</UButton
            >
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-arrow-left"
              size="lg"
              class="w-full sm:w-auto"
              @click="navigateTo('/naskah-lainnya')"
              >Kembali ke Daftar</UButton
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Dokumen (PDF iframe / DOCX renderAsync) — fullscreen, pola USlideover side="bottom" -->
    <USlideover
      v-model:open="previewOpen"
      :title="previewTitle"
      description="Pratinjau dokumen"
      side="bottom"
      :ui="{
        content: 'h-[90vh] sm:h-screen max-h-screen rounded-t-2xl sm:rounded-none',
        body: 'p-0',
      }"
    >
      <template #body>
        <div class="w-full h-full relative bg-gray-100 dark:bg-gray-900 flex flex-col">
          <div
            v-if="previewLoading"
            class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10"
          >
            <UIcon name="i-lucide-loader-2" class="animate-spin w-6 h-6 text-primary-500" />
          </div>
          <iframe v-if="previewUrl" :src="previewUrl" class="w-full h-full border-0 bg-white" />
          <div
            v-else
            ref="previewDocxContainer"
            class="docx-preview-container w-full h-full overflow-auto"
          ></div>
        </div>
      </template>
    </USlideover>

    <SharedShareModal
      v-if="showShareModal && detail"
      :naskah-id="String(id)"
      :naskah-perihal="detail.perihal"
      :naskah-nomor="detail.nomor || undefined"
      :distribution-scope="shareDistributionScope"
      :recipient-hint="shareRecipientHint"
      @close="showShareModal = false"
      @shared="handleShared"
    />
  </div>
</template>

<script setup>
import { renderAsync } from 'docx-preview';
import { JENIS_LABELS } from '~/types/naskah-lainnya';
import { formatNaskahDate } from '~/utils/naskah-lainnya-date';

const route = useRoute();
const id = computed(() => route.params.id);
const { apiGet } = useApi();
const { detail, fetchDetail } = useNaskahLainnya();
const { user } = useAuth();
const toast = useToast();
const { t } = useI18n();

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: '/beranda' },
  { label: t('naskah_lainnya'), to: '/naskah-lainnya' },
  { label: detail.value?.perihal || 'Detail', to: `/naskah-lainnya/${id.value}` },
  { label: 'Selesai', to: '#' },
]);

const loading = ref(true);
// ── Popup preview dokumen (PDF iframe / DOCX renderAsync) ──
const previewOpen = ref(false);
const previewUrl = ref(null);
const previewTitle = ref('Preview Dokumen');
const previewDocxBuffer = ref(null);
const previewDocxContainer = ref(null);
const previewLoading = ref(false);
// Key aksi yang sedang berjalan (preview:/dl:<id>) — untuk loading & disable per tombol.
const busyKey = ref(null);
const showShareModal = ref(false);
const shareEnabled = ref(false);

// Penyebarluasan resmi hanya dilakukan pemrakarsa/pembuat naskah. Penandatangan
// yang kebetulan dapat membuka halaman selesai tidak otomatis menjadi pemberi.
const canShareCompleted = computed(() => {
  const ownerPersnum = detail.value?.pemrakarsa?.persnum;
  return (
    shareEnabled.value &&
    ownerPersnum != null &&
    Number(ownerPersnum) === Number(user.value?.persnum)
  );
});

const shareDistributionScope = computed(() =>
  detail.value?.jenis === 'EDR' ? 'ALL_EMPLOYEES' : 'SELECTED'
);

const shareRecipientHint = computed(() => {
  if (detail.value?.jenis === 'EDR') {
    return 'Surat Edaran akan masuk ke menu Dibagikan kepada Saya milik seluruh karyawan aktif.';
  }
  if (detail.value?.jenis === 'KEP') {
    return 'Pilih karyawan yang menjadi pihak dalam Keputusan Direksi ini.';
  }
  return 'Pilih karyawan yang berhak menerima naskah final ini.';
});

function handleShared() {
  showShareModal.value = false;
}

const jenisLabel = (j) => JENIS_LABELS[j] ?? j;

const penandatanganItems = computed(() => {
  if (!detail.value) return [];
  // BE `getDetail` tidak mengirim `penandatanganList`; `penandatangan` sudah array.
  // (Sama seperti pola di [id].vue — jangan dibungkus lagi jadi array-of-array.)
  const p = detail.value.penandatangan;
  if (Array.isArray(p) && p.length) return p;
  if (p && !Array.isArray(p) && p.nama) return [p]; // backward compat single object
  return [];
});

const allDokumen = computed(() => (detail.value?.dokumen ?? []).filter((d) => d.tipe !== 'naskah'));

const totalFiles = computed(() => (detail.value?.fileUrl ? 1 : 0) + allDokumen.value.length);

// Ikon & label per tipe dokumen. Sebelumnya semua tipe selain 'pendukung' dilabeli
// "Blanko Verbal" — salah untuk Lembar Persetujuan Direksi & Naskah Fisik.
function docMeta(doc) {
  switch (doc.tipe) {
    case 'pendukung':
      return {
        icon: 'i-lucide-paperclip',
        tile: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
        label: 'PDF · Dokumen Pendukung',
      };
    case 'lembar_persetujuan_direksi_pdf':
      return {
        icon: 'i-lucide-clipboard-check',
        tile: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
        label: 'PDF · Lembar Persetujuan Direksi',
      };
    case 'blanko_verbal_pdf':
      return {
        icon: 'i-lucide-file-text',
        tile: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
        label: 'PDF · Blanko Verbal',
      };
    case 'blanko_verbal':
      return {
        icon: 'i-lucide-file-text',
        tile: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
        label: 'DOCX · Blanko Verbal',
      };
    case 'naskah_fisik':
      return {
        icon: 'i-lucide-archive',
        tile: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        label: 'Naskah Fisik',
      };
    default:
      return {
        icon: 'i-lucide-file',
        tile: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
        label: doc.nama,
      };
  }
}

function initials(nama) {
  return (
    String(nama ?? '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

function fmtDate(iso) {
  return formatNaskahDate(iso);
}

async function loadDetail() {
  loading.value = true;
  try {
    await fetchDetail(id.value);
    shareEnabled.value = false;
    if (detail.value?.jenis) {
      try {
        const response = await apiGet(
          `/config/naskah-lainnya/${detail.value.jenis}`,
          {},
          {
            skipCache: true,
          }
        );
        const config = response?.data ?? response;
        shareEnabled.value = config?.shareEnabled === true;
      } catch {
        // Fail closed: bila konfigurasi tidak dapat dibaca, tombol tidak ditampilkan.
      }
    }
    if (detail.value?.signOption === 'ttd_basah' && detail.value?.manualFinalStatus !== 'final') {
      await navigateTo(`/naskah-lainnya/${id.value}`, { replace: true });
    }
  } catch {
    toast.add({ title: 'Gagal memuat detail naskah', color: 'error' });
  } finally {
    loading.value = false;
  }
}

// Jalankan aksi async dengan busyKey agar tombol lain ikut nonaktif sementara.
async function run(key, fn) {
  if (busyKey.value) return;
  busyKey.value = key;
  try {
    await fn();
  } finally {
    busyKey.value = null;
  }
}

async function copyNomor() {
  const nomor = detail.value?.nomor;
  if (!nomor) return;
  try {
    await navigator.clipboard.writeText(nomor);
    toast.add({ title: 'Nomor disalin', description: nomor, color: 'success' });
  } catch {
    toast.add({ title: 'Gagal menyalin nomor', color: 'error' });
  }
}

async function downloadNaskah() {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    // Artifact signed (QR/fisik) berupa PDF — ekstensi mengikuti tipe blob aktual.
    a.download = naskahFileName(detail.value, naskahFileExtFromBlob(blob));
    a.click();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.add({ title: 'Gagal mengunduh naskah', color: 'error' });
  }
}

// Unduh semua dokumen secara berurutan (naskah final dulu, lalu lampiran).
async function downloadAll() {
  await run('dl:all', async () => {
    if (detail.value?.fileUrl) await downloadNaskah();
    for (const doc of allDokumen.value) await downloadDokumen(doc);
  });
}

async function renderDocxPreview() {
  if (!previewDocxBuffer.value || !previewDocxContainer.value) return;
  previewDocxContainer.value.innerHTML = '';
  await renderAsync(previewDocxBuffer.value, previewDocxContainer.value, undefined, {
    className: 'docx',
    inWrapper: true,
    ignoreWidth: false,
    ignoreHeight: false,
    breakPages: true,
  });
}

// Buka popup preview dari blob sesuai tipe file (PDF → iframe, DOCX → renderAsync).
async function openPreviewFromBlob(blob, nama) {
  const lower = String(nama ?? '').toLowerCase();
  const isPdf = lower.endsWith('.pdf') || blob.type === 'application/pdf';
  const isDocx = lower.endsWith('.docx');
  previewTitle.value = nama || 'Preview Dokumen';
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
  previewDocxBuffer.value = null;
  if (isPdf) {
    // Re-wrap sebagai application/pdf → viewer bawaan browser (Chromium PDFium)
    // merender toolbar download/print/zoom, sama seperti pratinjau kotak masuk.
    const pdf = new Blob([await blob.arrayBuffer()], { type: 'application/pdf' });
    previewUrl.value = window.URL.createObjectURL(pdf);
    previewOpen.value = true;
  } else if (isDocx) {
    previewDocxBuffer.value = await blob.arrayBuffer();
    previewOpen.value = true;
    await nextTick();
    await renderDocxPreview();
  } else {
    // tipe lain (gambar/dll) — buka tab baru
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  }
}

function closePreview() {
  previewOpen.value = false;
  if (previewUrl.value) {
    window.URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
  previewDocxBuffer.value = null;
}

watch(previewOpen, (open) => {
  if (!open) closePreview();
});

async function previewNaskah() {
  previewLoading.value = true;
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/file?preview=1`, {
      responseType: 'blob',
    });
    await openPreviewFromBlob(blob, naskahFileName(detail.value));
  } catch {
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
  } finally {
    previewLoading.value = false;
  }
}

async function previewDokumen(doc) {
  previewLoading.value = true;
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/dokumen/${doc.id}/download?inline=1`, {
      responseType: 'blob',
    });
    await openPreviewFromBlob(blob, doc.nama);
  } catch {
    toast.add({ title: 'Gagal memuat preview', color: 'error' });
  } finally {
    previewLoading.value = false;
  }
}

async function downloadDokumen(doc) {
  try {
    const blob = await apiGet(`/naskah-lainnya/${id.value}/dokumen/${doc.id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = doc.nama;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.add({ title: 'Gagal mengunduh dokumen', color: 'error' });
  }
}

onMounted(loadDetail);
</script>

<style scoped>
:deep(.docx-preview-container) {
  padding: 16px;
}
:deep(.docx-wrapper) {
  background: #fff !important;
  padding: 0 !important;
}
:deep(.docx-wrapper > section.docx) {
  border: none !important;
  margin: 0 auto !important;
}
</style>
