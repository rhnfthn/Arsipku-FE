<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-28 pt-5 dark:bg-gray-900 sm:px-6 lg:px-8">
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
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Review Penutupan Berkas
        </h1>
        <span
          class="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:text-sm"
        >
          Ref: #{{ berkas?.kodeBerkas || berkasId.slice(0, 8).toUpperCase() }}
        </span>
      </template>
    </PageHeader>

    <div v-if="isLoading" class="flex min-h-96 items-center justify-center">
      <UIcon name="i-lucide-loader-circle" class="size-8 animate-spin text-primary-500" />
    </div>

    <main v-else class="mx-auto max-w-6xl space-y-6">
      <section
        class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-7"
      >
        <div
          class="mb-6 flex items-center gap-2 border-b border-gray-200 pb-3 text-xs font-semibold uppercase tracking-[0.08em] text-primary-700 dark:border-gray-700 dark:text-primary-300"
        >
          <UIcon name="i-lucide-route" class="size-4" />
          Langkah Verifikasi
        </div>
        <div class="overflow-x-auto pb-1">
          <div class="flex min-w-[600px] items-center px-1 py-5">
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
        <div
          class="inline-flex rounded-lg bg-primary-50 px-4 py-2.5 text-sm text-gray-600 dark:bg-primary-950/40 dark:text-gray-300"
        >
          Status:
          <strong class="ml-1 text-primary-700 dark:text-primary-300">{{ progressLabel }}</strong>
        </div>
      </section>

      <section
        class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-7"
      >
        <div
          class="mb-6 flex items-center gap-2 border-b border-gray-200 pb-3 text-xs font-semibold uppercase tracking-[0.08em] text-primary-700 dark:border-gray-700 dark:text-primary-300"
        >
          <UIcon name="i-lucide-folder-archive" class="size-4" />
          Informasi Berkas
        </div>
        <div class="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="item in informationItems" :key="item.label" :class="item.className">
            <p class="mb-1.5 text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
              {{ item.label }}
            </p>
            <p
              class="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white"
            >
              <UIcon v-if="item.icon" :name="item.icon" class="size-5 text-gray-500" />
              {{ item.value }}
            </p>
          </div>
        </div>
      </section>

      <section
        class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-7"
      >
        <div
          class="mb-6 flex items-center gap-2 border-b border-gray-200 pb-3 text-xs font-semibold uppercase tracking-[0.08em] text-primary-700 dark:border-gray-700 dark:text-primary-300"
        >
          <UIcon name="i-lucide-files" class="size-4" />
          Daftar Naskah (Isi Berkas)
        </div>
        <div class="overflow-x-auto rounded-xl border border-gray-300 dark:border-gray-600">
          <div
            class="grid min-w-[680px] grid-cols-[1.1fr_2.5fr_1.2fr_0.8fr] bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300"
          >
            <span>No Naskah</span><span>Perihal</span><span>Tanggal</span><span>Status</span>
          </div>
          <div v-if="naskahList.length === 0" class="px-4 py-10 text-center text-sm text-gray-500">
            Belum ada naskah dalam berkas ini.
          </div>
          <div
            v-for="item in naskahList"
            :key="item.id || item.nomorSurat"
            class="grid min-w-[680px] grid-cols-[1.1fr_2.5fr_1.2fr_0.8fr] items-center border-t border-gray-200 px-4 py-4 text-sm dark:border-gray-700"
          >
            <span class="font-mono text-gray-700 dark:text-gray-300">{{
              item.nomorSurat || '-'
            }}</span>
            <span class="text-gray-900 dark:text-white">{{ item.perihal || '-' }}</span>
            <span class="text-gray-600 dark:text-gray-400">{{
              formatDate(item.tanggalNaskah)
            }}</span>
            <span>
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-950/40 dark:text-success-300"
              >
                <span class="size-1.5 rounded-full bg-success-500" /> Final
              </span>
            </span>
          </div>
        </div>
      </section>

      <section
        class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-7"
      >
        <div
          class="mb-6 flex items-center gap-2 border-b border-gray-200 pb-3 text-xs font-semibold uppercase tracking-[0.08em] text-primary-700 dark:border-gray-700 dark:text-primary-300"
        >
          <UIcon name="i-lucide-message-square-text" class="size-4" />
          Catatan Pengusul
        </div>
        <p class="whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
          {{ berkas?.isiRingkas || 'Tidak ada catatan pengusul.' }}
        </p>
      </section>

      <section
        class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-7"
      >
        <div
          class="mb-6 flex items-center gap-2 border-b border-gray-200 pb-3 text-xs font-semibold uppercase tracking-[0.08em] text-primary-700 dark:border-gray-700 dark:text-primary-300"
        >
          <UIcon name="i-lucide-history" class="size-4" /> Timeline Singkat
        </div>
        <ol class="space-y-3">
          <li v-for="item in timelineItems" :key="item.label" class="flex items-start gap-3">
            <span class="mt-1.5 h-2.5 w-2.5 rounded-full bg-primary-500" />
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.label }}</p>
              <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ item.value }}</p>
            </div>
          </li>
        </ol>
      </section>
    </main>

    <div
      v-if="!isLoading"
      class="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95 sm:px-6"
    >
      <div class="mx-auto flex max-w-6xl flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <UButton
          color="error"
          variant="ghost"
          size="lg"
          icon="i-lucide-circle-x"
          :loading="isProcessing"
          @click="showRejectModal = true"
        >
          Tolak Penutupan
        </UButton>
        <UButton
          color="primary"
          size="lg"
          icon="i-lucide-arrow-right"
          :loading="isProcessing"
          @click="showApproveModal = true"
        >
          {{ isLastVerifikator ? 'Setujui Penutupan' : 'Lanjutkan Verifikasi' }}
        </UButton>
      </div>
    </div>

    <UModal v-model:open="showApproveModal">
      <template #header><h3 class="text-lg font-semibold">Konfirmasi Persetujuan</h3></template>
      <template #body>
        <div class="space-y-4 p-4">
          <p class="text-sm leading-6 text-gray-600 dark:text-gray-300">
            {{
              isLastVerifikator
                ? 'Anda yakin menyetujui penutupan berkas ini?'
                : 'Anda yakin menyetujui verifikasi ini dan meneruskannya ke verifikator berikutnya?'
            }}
          </p>
          <div>
            <p class="mb-3 text-sm text-gray-600 dark:text-gray-300">
              Catatan persetujuan wajib diisi, minimal 10 karakter.
            </p>
            <UTextarea
              v-model="approveCatatan"
              :rows="4"
              autoresize
              class="w-full"
              placeholder="Tuliskan catatan persetujuan…"
            />
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="showApproveModal = false">Batal</UButton>
          <UButton
            color="primary"
            :disabled="approveCatatan.trim().length < 10"
            :loading="isProcessing"
            @click="handleApprove"
            >Ya, Setujui</UButton
          >
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showRejectModal">
      <template #header><h3 class="text-lg font-semibold">Tolak Penutupan</h3></template>
      <template #body>
        <div class="p-4">
          <p class="mb-3 text-sm text-gray-600 dark:text-gray-300">
            Alasan penolakan wajib diisi, minimal 10 karakter.
          </p>
          <UTextarea
            v-model="rejectCatatan"
            :rows="4"
            autoresize
            class="w-full"
            placeholder="Tuliskan alasan penolakan…"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="showRejectModal = false">Batal</UButton>
          <UButton
            color="error"
            :disabled="rejectCatatan.length < 10"
            :loading="isProcessing"
            @click="handleReject"
            >Tolak</UButton
          >
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

definePageMeta({ middleware: 'auth' });
const route = useRoute();
const router = useRouter();
const { getBerkasById, getVerifikasiDetail, getDaftarNaskah, approveVerifikasi, rejectVerifikasi } =
  useArsipDinamis();
const toast = useToast();
const berkasId = computed(() => route.params.id as string);
const berkas = ref<any>(null);
const verifikasiList = ref<any[]>([]);
const naskahList = ref<any[]>([]);
const isLoading = ref(true);
const isProcessing = ref(false);
const showApproveModal = ref(false);
const showRejectModal = ref(false);
const approveCatatan = ref('');
const rejectCatatan = ref('');

const pendingIndex = computed(() =>
  verifikasiList.value.findIndex((item) => item.status === 'pending')
);
const isLastVerifikator = computed(
  () => pendingIndex.value < 0 || pendingIndex.value === verifikasiList.value.length - 1
);
const progressLabel = computed(() =>
  pendingIndex.value < 0
    ? 'Verifikasi selesai'
    : `Verifikasi Tahap ${pendingIndex.value + 1} dari ${verifikasiList.value.length}`
);
const informationItems = computed(() => [
  { label: 'Nama Berkas', value: berkas.value?.judulBerkas || '-', className: 'sm:col-span-2' },
  {
    label: 'Kode Klasifikasi',
    value: berkas.value?.klasifikasi || berkas.value?.klasifikasiTeks || '-',
  },
  {
    label: 'Penanggung Jawab (PIC)',
    value: berkas.value?.picPersnum || berkas.value?.pic_persnum || '-',
    icon: 'i-lucide-user-round',
  },
  { label: 'Retensi Aktif', value: `${berkas.value?.retensiAktifTahun || 0} Tahun` },
  { label: 'Retensi Inaktif', value: `${berkas.value?.retensiInaktifTahun || 0} Tahun` },
  { label: 'Lokasi Fisik', value: berkas.value?.lokasi || '-', className: 'sm:col-span-2' },
]);
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
  if (latestNaskah) items.push({ label: 'Dokumen Terakhir Ditambahkan', value: formatDate(latestNaskah) });
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

const handleApprove = async () => {
  const catatan = approveCatatan.value.trim();
  if (catatan.length < 10) return;

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

const handleReject = async () => {
  if (rejectCatatan.value.length < 10) return;
  isProcessing.value = true;
  try {
    await rejectVerifikasi(berkasId.value, rejectCatatan.value);
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
      getDaftarNaskah(berkasId.value),
    ]);
    berkas.value = unwrap(b);
    const verificationPayload = unwrap(v);
    verifikasiList.value = Array.isArray(verificationPayload) ? verificationPayload : [];
    const naskahPayload = unwrap(n);
    naskahList.value = (
      Array.isArray(naskahPayload) ? naskahPayload : naskahPayload?.data || []
    ).map((item: any) => ({
      ...item,
      nomorSurat: item.nomorSurat ?? item.nomor_surat,
      tanggalNaskah: item.tanggalNaskah ?? item.tanggal_naskah,
    }));
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
</script>
