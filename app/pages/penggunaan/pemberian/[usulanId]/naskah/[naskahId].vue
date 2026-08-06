<script setup lang="ts">
// Detail naskah untuk SE pengusul yang punya entitlement akses berkas.
// Pakai endpoint /usulan-akses-berkas/naskah/:naskahId (cek entitlement) dan
// render dengan komponen DetailNaskah yang sama dengan halaman kelola
// pemeliharaan pemberkasan.
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import PageHeader from '~/components/PageHeader.vue';
import DetailNaskah from '@/components/DetailNaskah.vue';
import { useApi } from '~/composables/useApi';
import { useAuth } from '~/composables/useAuth';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Detail Naskah' });

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { apiGet } = useApi();
const { user } = useAuth();
const toast = useToast();

const usulanId = computed(() => route.params.usulanId as string);
const naskahId = computed(() => route.params.naskahId as string);

const details = ref<any[]>([]);
const pending = ref(true);

const positionId = computed(
  () => user.value?.position?.id || user.value?.position_id || user.value?.position || '',
);

const extractErrorMessage = (err: any): string => {
  const beMessage = err?.response?.data?.message;
  if (Array.isArray(beMessage) && beMessage.length > 0) return beMessage.join(', ');
  if (typeof beMessage === 'string' && beMessage.trim()) return beMessage;
  return err?.message || 'Terjadi kesalahan';
};

const pageTitle = computed(() => 'Detail Naskah');

// Mapping response entitlement → shape DetailNaskah (menyamakan halaman kelola)
function mapFlowToDetail(item: any) {
  return {
    id: item.id,
    sifat: item.sifat,
    aksi: 'read',
    jenis: item.jenis,
    jenis_label: item.jenis_label || item.jenis,
    nomor: item.nomor || '-',
    tanggal: item.tanggal || item.created_at,
    created_at: item.created_at,
    perihal: item.perihal,
    pengirim: item.pengirim || null,
    from: item.pengirim || null,
    to: Array.isArray(item.penerima) ? item.penerima : [],
    cc: Array.isArray(item.tembusan) ? item.tembusan : [],
    // Render konten rich text sebagai v-html di blok isi surat.
    rich_content: item.konten || '',
    mainDisplayContentHtml: item.konten || '',
    lampiran_files: item.lampiran_files || [],
    final_pdf_url: item.final_pdf_url || item.final_pdf || '',
    pdf_snapshot: item.final_pdf_url || item.final_pdf || '',
    _ui: { showAllRecipients: false, showAllCC: false, isContentExpanded: false, showReadMoreButton: false },
    _hasNewer: false,
    _hasOlder: false,
  };
}

function goBack() {
  router.push(`/penggunaan/pemberian/${usulanId.value}/berkas`);
}

// ── Preview PDF via slideover (sama dengan halaman kelola) ───────
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
    const res = await fetch(url);
    const blob = new Blob([await res.arrayBuffer()], { type: 'application/pdf' });
    activePdfUrl.value = URL.createObjectURL(blob);
  } catch {
    activePdfUrl.value = url;
  } finally {
    isPdfLoading.value = false;
  }
}

function openPreviewFile(file: any) {
  openDocumentPreview(file.file_url || file.file_pdf || file.file_path, file.file_name || 'Lampiran');
}

onMounted(async () => {
  if (!naskahId.value) {
    pending.value = false;
    return;
  }
  try {
    const res = await apiGet<any>(
      `/usulan-akses-berkas/naskah/${naskahId.value}`,
      undefined,
      { skipCache: true },
    );
    const rawData: any = (res as any)?.data ?? res;
    const item = Array.isArray(rawData) ? rawData[0] : rawData;
    details.value = item ? [mapFlowToDetail(item)] : [];
  } catch (error: any) {
    details.value = [];
    toast.add({
      title: 'Detail naskah gagal dimuat',
      description: extractErrorMessage(error),
      color: 'error',
    });
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader
      :title="pageTitle"
      :items="[
        { label: 'Kelola', to: '#' },
        { label: 'Penggunaan', to: '#' },
        { label: 'Pemberian', to: '/penggunaan/pemberian' },
        { label: 'Berkas', to: `/penggunaan/pemberian/${usulanId}/berkas` },
        { label: 'Detail Naskah' },
      ]"
    />

    <div v-if="pending" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <template v-else-if="details.length">
      <div class="space-y-4">
        <div
          v-for="(detail, index) in details"
          :key="detail.id || index"
          :id="`card-${detail.id || index}`"
        >
          <DetailNaskah
            context="inbox"
            read-only
            :data="detail"
            :is-head="index === 0"
            :user-position-id="positionId"
            @back="goBack"
            @preview="openDocumentPreview($event, detail.perihal || 'Naskah')"
            @preview-file="openPreviewFile"
          />
        </div>
      </div>
    </template>

    <div
      v-else
      class="flex min-h-96 flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400"
    >
      <UIcon name="i-lucide-file-question" class="size-10" />
      <p>Naskah tidak ditemukan.</p>
    </div>

    <!-- Preview dokumen (slideover bawah, menyamakan halaman detail naskah kelola) -->
    <USlideover
      v-model:open="isPreviewOpen"
      :title="previewTitle"
      :description="previewTitle"
      side="bottom"
      :ui="{
        content: 'h-[90vh] sm:h-screen max-h-screen rounded-t-2xl sm:rounded-none',
        body: 'p-0',
        footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
      }"
    >
      <template #body>
        <div class="relative flex h-full w-full flex-col bg-gray-100 dark:bg-gray-900">
          <div
            v-if="isPdfLoading"
            class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90"
          >
            <UIcon name="i-lucide-loader-circle" class="mb-2 size-10 animate-spin text-primary-500" />
            <span class="text-xs text-gray-500 dark:text-gray-400">Memuat Dokumen...</span>
          </div>
          <iframe
            v-if="activePdfUrl"
            :src="activePdfUrl"
            class="h-full w-full flex-1 border-none"
            title="Preview dokumen"
          />
          <div
            v-else-if="!isPdfLoading"
            class="flex h-full flex-col items-center justify-center gap-2 text-gray-500"
          >
            <UIcon name="i-lucide-file-text" class="size-12 opacity-30" />
            <span class="text-sm">Dokumen tidak dapat ditampilkan.</span>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>