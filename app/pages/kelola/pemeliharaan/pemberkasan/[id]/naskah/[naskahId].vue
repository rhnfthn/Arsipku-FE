<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader
      :title="pageTitle"
      :items="[
        { label: 'Kelola' },
        { label: 'Pemeliharaan' },
        { label: 'Pemberkasan', to: '/kelola/pemeliharaan/pemberkasan/berkas-saya' },
        { label: 'Detail Naskah' },
      ]"
    />

    <div v-if="pending" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <template v-else-if="naskah">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <UButton
          color="primary"
          variant="soft"
          icon="i-lucide-arrow-left"
          :to="`/kelola/pemeliharaan/pemberkasan/${berkasId}`"
        >
          Kembali ke Berkas
        </UButton>
        <UBadge
          v-if="naskah.jenis_label"
          color="primary"
          variant="soft"
          size="lg"
          class="gap-1.5 rounded-full"
        >
          {{ naskah.jenis_label }}
        </UBadge>
      </div>

      <div
        class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <!-- Header metadata -->
        <div class="border-b border-gray-100 px-5 py-5 dark:border-gray-700">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ naskah.perihal || 'Tanpa perihal' }}
            </h1>
            <span
              v-if="naskah.label_ttd"
              class="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
            >
              {{ naskah.label_ttd }}
            </span>
          </div>
          <dl class="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            <div class="flex items-start gap-2 text-sm">
              <span class="min-w-16 text-gray-500 dark:text-gray-400">Nomor</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ naskah.nomor || '-' }}</span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <span class="min-w-16 text-gray-500 dark:text-gray-400">Tanggal</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ formatDate(naskah.tanggal) }}</span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <span class="min-w-16 text-gray-500 dark:text-gray-400">Sifat</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ naskah.sifat || '-' }}</span>
            </div>
            <div class="flex items-start gap-2 text-sm">
              <span class="min-w-16 text-gray-500 dark:text-gray-400">Status</span>
              <span class="font-medium capitalize text-gray-900 dark:text-white">{{ naskah.status || '-' }}</span>
            </div>
          </dl>
        </div>

        <!-- Sirkulasi -->
        <div class="grid grid-cols-1 gap-4 border-b border-gray-100 px-5 py-5 dark:border-gray-700 sm:grid-cols-3">
          <div>
            <p class="mb-1.5 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Pengirim</p>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ sirkulasiLabel(naskah.pengirim) || '-' }}</p>
          </div>
          <div>
            <p class="mb-1.5 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Kepada</p>
            <ul class="space-y-0.5 text-sm text-gray-900 dark:text-white">
              <li v-for="p in recipientList(naskah.penerima, naskah.penerima_grup)" :key="p.key">
                {{ p.label }}
              </li>
              <li v-if="!recipientList(naskah.penerima, naskah.penerima_grup).length">-</li>
            </ul>
          </div>
          <div>
            <p class="mb-1.5 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Tembusan</p>
            <ul class="space-y-0.5 text-sm text-gray-900 dark:text-white">
              <li v-for="t in recipientList(naskah.tembusan, naskah.tembusan_grup)" :key="t.key">
                {{ t.label }}
              </li>
              <li v-if="!recipientList(naskah.tembusan, naskah.tembusan_grup).length">-</li>
            </ul>
          </div>
        </div>

        <!-- Disposisi (jika DI) -->
        <div
          v-if="naskah.detail_disposisi"
          class="border-b border-gray-100 px-5 py-5 dark:border-gray-700"
        >
          <p class="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Disposisi</p>
          <p class="whitespace-pre-line text-sm text-gray-900 dark:text-white">
            {{ naskah.detail_disposisi.disposisi || '-' }}
          </p>
          <p v-if="naskah.detail_disposisi.catatan" class="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <span class="font-medium">Catatan:</span> {{ naskah.detail_disposisi.catatan }}
          </p>
        </div>

        <!-- Konten -->
        <div class="px-5 py-5">
          <p class="mb-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Isi Naskah</p>
          <div
            class="prose-naskah max-w-none text-sm leading-relaxed text-gray-800 dark:text-gray-200"
            v-html="naskah.konten || '<p class=\'text-gray-400\'>Naskah tidak memiliki konten.</p>'"
          />
        </div>

        <!-- Lampiran -->
        <div
          v-if="naskah.lampiran_files?.length || naskah.final_pdf"
          class="border-t border-gray-100 px-5 py-5 dark:border-gray-700"
        >
          <p class="mb-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Lampiran & Dokumen</p>
          <ul class="space-y-2">
            <li v-if="naskah.final_pdf">
              <button
                type="button"
                class="flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                @click="openDocumentPreview(naskah.final_pdf, naskah.perihal || 'Naskah final')"
              >
                <UIcon name="i-lucide-file-text" class="size-4" />
                Naskah final (PDF)
              </button>
            </li>
            <li v-for="file in naskah.lampiran_files" :key="file.id">
              <button
                type="button"
                class="flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                @click="openDocumentPreview(file.file_pdf, file.file_name)"
              >
                <UIcon name="i-lucide-paperclip" class="size-4" />
                {{ file.file_name || 'Lampiran' }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <div
      v-else
      class="flex min-h-96 flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400"
    >
      <UIcon name="i-lucide-file-question" class="size-10" />
      <p>Naskah tidak ditemukan di berkas ini.</p>
    </div>

    <!-- Preview modal -->
    <UModal v-model:open="isPreviewOpen" :ui="{ width: 'sm:max-w-5xl' }">
      <template #header>
        <span class="font-medium">{{ previewTitle }}</span>
      </template>
      <div class="min-h-96">
        <div v-if="isPdfLoading" class="flex min-h-96 items-center justify-center">
          <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
        </div>
        <iframe
          v-if="activePdfUrl"
          :src="activePdfUrl"
          class="h-96 w-full sm:h-[70vh]"
          title="Preview dokumen"
        />
      </div>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const { getNaskahDetailInBerkas } = useArsipDinamis();
const toast = useToast();

const berkasId = computed(() => String(route.params.id || ''));
const naskahIdParam = computed(() => String(route.params.naskahId || ''));

const naskah = ref<Record<string, any> | null>(null);
const pending = ref(true);

const pageTitle = computed(() =>
  naskah.value?.perihal ? `Naskah: ${naskah.value.perihal}` : 'Detail Naskah',
);

function formatDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function sirkulasiLabel(s: any): string {
  if (!s) return '';
  const parts = [s.position_text, s.organization_text, s.nama_sirkuler].filter(Boolean);
  return parts.join(' — ');
}

// Naskah penerima bisa per-individu (penerima[]) atau per-grup (penerima_grup[]).
function recipientList(individuals: any[], groups: any[]) {
  const out: { key: string; label: string }[] = [];
  if (Array.isArray(individuals)) {
    for (const p of individuals) out.push({ key: p.id || p.position || out.length, label: sirkulasiLabel(p) });
  }
  if (Array.isArray(groups)) {
    for (const g of groups) out.push({ key: g.id || `g-${out.length}`, label: `${g.nama || 'Grup'} (grup)` });
  }
  return out;
}

// Preview PDF via blob (hindari hot-link bocor ke viewer luar).
const isPreviewOpen = ref(false);
const isPdfLoading = ref(false);
const activePdfUrl = ref<string | null>(null);
const previewTitle = ref('Dokumen');

async function openDocumentPreview(url: string, title = 'Dokumen') {
  if (!url) {
    toast.add({ title: 'URL dokumen tidak valid', color: 'error' });
    return;
  }
  previewTitle.value = title;
  isPreviewOpen.value = true;
  isPdfLoading.value = true;
  activePdfUrl.value = null;
  try {
    const response = await fetch(url);
    const blob = new Blob([await response.arrayBuffer()], { type: 'application/pdf' });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch {
    activePdfUrl.value = url;
  } finally {
    isPdfLoading.value = false;
  }
}

onMounted(async () => {
  if (!berkasId.value || !naskahIdParam.value) {
    pending.value = false;
    return;
  }
  try {
    const response = await getNaskahDetailInBerkas(berkasId.value, naskahIdParam.value);
    naskah.value = response?.data ?? response;
  } catch (error: any) {
    naskah.value = null;
    toast.add({
      title: 'Detail naskah gagal dimuat',
      description: error?.message || 'Silakan coba kembali.',
      color: 'error',
    });
  } finally {
    pending.value = false;
  }
});
</script>