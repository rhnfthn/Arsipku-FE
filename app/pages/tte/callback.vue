<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50 px-6">
    <section class="w-full max-w-md rounded-card bg-white p-8 text-center shadow-sm">
      <UIcon :name="iconName" class="mx-auto mb-4 h-10 w-10" :class="iconClass" />
      <Heading variant="heading9b" as="h1">
        {{ titleText }}
      </Heading>
      <Paragraph variant="body2" as="p" class="mt-2 text-neutral-500">
        {{ messageText }}
      </Paragraph>

      <!-- Detail status transaksi -->
      <div v-if="transaction" class="mt-6 space-y-2 rounded-card bg-slate-50 p-4 text-left">
        <div class="flex items-center justify-between text-sm">
          <span class="text-neutral-500">Status</span>
          <UBadge :color="statusColor" variant="subtle">
            {{ transaction.status }}
          </UBadge>
        </div>
        <div v-if="transaction.nomorNaskah" class="flex items-center justify-between text-sm">
          <span class="text-neutral-500">Naskah</span>
          <span class="font-medium">{{ transaction.nomorNaskah }}</span>
        </div>
        <div v-if="transaction.jenisNaskah" class="flex items-center justify-between text-sm">
          <span class="text-neutral-500">Jenis</span>
          <span class="font-medium">{{ transaction.jenisNaskah }}</span>
        </div>
      </div>

      <div class="mt-6 flex justify-center gap-3">
        <UButton v-if="done" color="primary" icon="i-lucide-check" :to="returnTo">
          Kembali ke Naskah
        </UButton>
        <UButton
          v-if="failed && canRetry"
          color="primary"
          icon="i-lucide-rotate-ccw"
          :loading="retrying"
          @click="processCallback"
        >
          Coba Lagi
        </UButton>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { TteTransactionStatus } from '~/composables/useTtePortal';

definePageMeta({ layout: false, middleware: 'auth' });

const route = useRoute();
const { submitCallback, getTransactionStatus } = useTtePortal();

const transaction = ref<TteTransactionStatus | null>(null);
const phase = ref<'processing' | 'done' | 'failed'>('processing');
const errorMessage = ref('');
const callbackCode = ref('');
const callbackState = ref('');
const retrying = ref(false);

const queryValue = (value: unknown): string =>
  Array.isArray(value) ? String(value[0] || '') : String(value || '');

// Halaman tujuan setelah selesai — default beranda bila tidak ada
const returnTo = computed(() => {
  const target = queryValue(route.query.return_to);
  if (target && target.startsWith('/') && !target.startsWith('//') && !target.includes('\\')) {
    return target;
  }
  return '/beranda';
});

const done = computed(() => phase.value === 'done');
const failed = computed(() => phase.value === 'failed');

const canRetry = computed(
  () =>
    Boolean(callbackCode.value && callbackState.value) &&
    !['EXPIRED', 'CANCELLED'].includes(transaction.value?.status || '')
);

const iconName = computed(() => {
  if (phase.value === 'done') return 'i-lucide-circle-check-big';
  if (phase.value === 'failed') return 'i-lucide-circle-x';
  return 'i-lucide-loader-circle';
});

const iconClass = computed(() => {
  if (phase.value === 'done') return 'text-green-600';
  if (phase.value === 'failed') return 'text-red-500';
  return 'animate-spin text-primary-600';
});

const titleText = computed(() => {
  if (phase.value === 'done') return 'Dokumen berhasil ditandatangani';
  if (phase.value === 'failed') return 'Penandatanganan tidak selesai';
  return 'Memproses hasil penandatanganan';
});

const messageText = computed(() => {
  if (phase.value === 'done') return 'Tanda tangan elektronik telah diterapkan pada dokumen Anda.';
  if (phase.value === 'failed')
    return (
      errorMessage.value || 'Terjadi kendala saat memproses penandatanganan. Silakan coba lagi.'
    );
  return 'Mohon tunggu, hasil dari Portal TTE sedang diverifikasi.';
});

const statusColor = computed(() => {
  const status = transaction.value?.status;
  if (status === 'SIGNED') return 'success';
  if (status === 'PARTIAL') return 'warning';
  if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(status || '')) return 'error';
  return 'primary';
});

const processCallback = async () => {
  if (!callbackCode.value || !callbackState.value) return;
  retrying.value = true;
  phase.value = 'processing';
  errorMessage.value = '';

  try {
    const result = await submitCallback({
      code: callbackCode.value,
      state: callbackState.value,
    });
    transaction.value = await getTransactionStatus(result.transactionId);

    if (result.status === 'SIGNED' && transaction.value.completedAt) {
      phase.value = 'done';
    } else {
      phase.value = 'failed';
      errorMessage.value =
        transaction.value.completionError ||
        result.message ||
        'Hasil TTE diterima tetapi penyelesaian naskah belum selesai.';
    }
  } catch (error: any) {
    phase.value = 'failed';
    errorMessage.value =
      error?.response?._data?.message ||
      error?.message ||
      'Gagal memproses callback dari Portal TTE.';
  } finally {
    retrying.value = false;
  }
};

onMounted(async () => {
  callbackCode.value = queryValue(route.query.code);
  callbackState.value = queryValue(route.query.state);

  // Bersihkan query dari URL (code single-use — jangan biarkan ter-refresh)
  window.history.replaceState({}, document.title, '/tte/callback');

  if (!callbackCode.value || !callbackState.value) {
    phase.value = 'failed';
    errorMessage.value = 'Parameter callback tidak lengkap. Silakan ulangi proses penandatanganan.';
    return;
  }

  await processCallback();
});
</script>
