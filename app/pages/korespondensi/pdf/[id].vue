<template>
  <div class="space-y-4">
    <Heading variant="heading9b" as="h1">{{ $t('qr_pdf_title') }}</Heading>
    <USkeleton v-if="loading" class="h-[70vh] w-full rounded-card" />
    <UAlert v-else-if="error" color="error" icon="i-lucide-circle-alert"
      :title="$t('qr_pdf_unavailable')" :description="error" />
    <iframe v-else-if="pdfUrl" :src="pdfUrl" :title="$t('qr_pdf_title')"
      class="h-[80vh] w-full rounded-card border border-neutral-200 bg-white dark:border-neutral-700" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const { t } = useI18n();
const route = useRoute();
const { apiGet } = useApi();
const loading = ref(true);
const error = ref('');
const pdfUrl = ref('');
let requestVersion = 0;

const releasePdf = () => {
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
  pdfUrl.value = '';
};

const loadPdf = async () => {
  const version = ++requestVersion;
  releasePdf();
  loading.value = true;
  error.value = '';
  const id = String(route.params.id || '');
  const reference = String(route.query.ref || '');
  try {
    if (!/^[a-f0-9-]{36}$/i.test(id) || !/^[a-f0-9]{24}$/.test(reference)) {
      throw new Error('Invalid PDF reference');
    }
    const pdf = await apiGet<Blob>(
      `/digsig/pdf/${encodeURIComponent(id)}/content`,
      { params: { ref: reference }, responseType: 'blob' },
      { skipCache: true },
    );
    if (version !== requestVersion) return;
    if (!(pdf instanceof Blob) || pdf.type.split(';')[0] !== 'application/pdf') {
      throw new Error('Invalid PDF response');
    }
    pdfUrl.value = URL.createObjectURL(pdf);
  } catch {
    if (version === requestVersion) error.value = t('qr_pdf_error');
  } finally {
    if (version === requestVersion) loading.value = false;
  }
};

onMounted(loadPdf);
watch(() => route.fullPath, loadPdf);
onBeforeUnmount(() => {
  requestVersion++;
  releasePdf();
});
</script>
