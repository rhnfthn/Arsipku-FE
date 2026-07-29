<script setup lang="ts">
// Detail naskah untuk SE pengusul yang punya entitlement
// Pakai endpoint khusus yang cek entitlement, bukan ownership
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ChevronLeft, FileText, Download } from 'lucide-vue-next';
import PageHeader from '~/components/PageHeader.vue';
import { useApi } from '~/composables/useApi';

definePageMeta({ middleware: 'auth' });
useHead({ title: 'Detail Naskah' });

const route = useRoute();
const { t } = useI18n();
const { apiGet } = useApi();
const toast = useToast();

const naskahId = computed(() => route.params.naskahId as string);
const usulanId = computed(() => route.params.usulanId as string);

const naskah = ref<any>(null);
const loading = ref(false);

const extractErrorMessage = (err: any): string => {
  const beMessage = err?.response?.data?.message;
  if (Array.isArray(beMessage) && beMessage.length > 0) return beMessage.join(', ');
  if (typeof beMessage === 'string' && beMessage.trim()) return beMessage;
  return err?.message || 'Terjadi kesalahan';
};

const breadcrumbs = computed(() => [
  { label: t('beranda') || 'Beranda', to: '/beranda' },
  { label: 'Penggunaan', to: '#' },
  { label: 'Pemberian', to: '/penggunaan/pemberian' },
  { label: 'Berkas', to: `/penggunaan/pemberian/${usulanId.value}/berkas` },
  { label: naskah.value?.perihal || 'Naskah', to: '#' },
]);

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const hasPermission = (perms: string[], action: string) => {
  return perms?.some((p: string) => p.toUpperCase() === action.toUpperCase()) ?? false;
};

const loadNaskah = async () => {
  loading.value = true;
  try {
    const res = await apiGet<any>(`/usulan-akses-berkas/naskah/${naskahId.value}`, undefined, { skipCache: true });
    naskah.value = (res as any)?.data ?? res;
  } catch (err: any) {
    toast.add({ title: 'Error', description: extractErrorMessage(err), color: 'error' });
  } finally {
    loading.value = false;
  }
};

const downloadPdf = () => {
  if (naskah.value?.final_pdf) {
    const pdfUrl = naskah.value.final_pdf.startsWith('http')
      ? naskah.value.final_pdf
      : `${useRuntimeConfig().public.apiBase || 'http://localhost:3011'}/${naskah.value.final_pdf.replace(/^\//, '')}`;
    window.open(pdfUrl, '_blank');
  }
};

const pdfUrl = computed(() => {
  if (!naskah.value?.final_pdf) return null;
  const path = naskah.value.final_pdf;
  return path.startsWith('http') ? path : `${useRuntimeConfig().public.apiBase || 'http://localhost:3011'}/${path.replace(/^\//, '')}`;
});

onMounted(() => { loadNaskah(); });
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-10 pt-5 dark:bg-gray-900 sm:px-5">
    <PageHeader :items="breadcrumbs">
      <template #title>
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          {{ naskah?.perihal || 'Detail Naskah' }}
        </h1>
      </template>
    </PageHeader>

    <button @click="$router.back()"
      class="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
      <ChevronLeft class="size-4" /> Kembali
    </button>

    <div v-if="loading" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <main v-else-if="naskah" class="mx-auto max-w-4xl space-y-5">
      <!-- Info Naskah -->
      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <FileText class="size-5 text-primary-600 dark:text-primary-400" />
          </span>
          <div>
            <h2 class="font-semibold text-gray-900 dark:text-white">Informasi Naskah</h2>
          </div>
          <div v-if="hasPermission(naskah.permissions, 'UNDUH') && naskah.final_pdf" class="ml-auto">
            <button @click="downloadPdf"
              class="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 dark:bg-primary-600">
              <Download class="size-4" /> Download
            </button>
          </div>
        </div>
        <dl class="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2">
          <div>
            <dt class="text-xs font-medium uppercase text-gray-500">Perihal</dt>
            <dd class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{{ naskah.perihal }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase text-gray-500">Nomor</dt>
            <dd class="mt-0.5 font-mono text-sm text-gray-900 dark:text-white">{{ naskah.nomor || '-' }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase text-gray-500">Jenis</dt>
            <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ naskah.jenis || '-' }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase text-gray-500">Sifat</dt>
            <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ naskah.sifat || '-' }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase text-gray-500">Tanggal</dt>
            <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ formatDate(naskah.tanggal) }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase text-gray-500">Klasifikasi</dt>
            <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ naskah.klasifikasi_text || naskah.klasifikasi || '-' }}</dd>
          </div>
        </dl>
      </section>

      <!-- Konten Naskah -->
      <section v-if="naskah.konten" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h2 class="font-semibold text-gray-900 dark:text-white">Isi Naskah</h2>
        </div>
        <div class="px-5 py-5">
          <div class="prose prose-sm max-w-none dark:prose-invert" v-html="naskah.konten"></div>
        </div>
      </section>

      <!-- PDF Viewer -->
      <section v-if="pdfUrl" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-700">
          <h2 class="font-semibold text-gray-900 dark:text-white">Dokumen PDF</h2>
        </div>
        <div class="p-5">
          <iframe :src="pdfUrl" class="h-[600px] w-full rounded-lg border border-gray-200 dark:border-gray-700" frameborder="0"></iframe>
        </div>
      </section>
    </main>
  </div>
</template>