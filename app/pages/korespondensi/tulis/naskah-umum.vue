<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from "vue";
import { useRoute } from "vue-router";

import TulisInputLampiran from "@/components/Tulis/InputLampiranAsync.vue";

definePageMeta({ middleware: ['auth', 'tulis-access'] })

const route = useRoute();
const toast = useToast();

const { user, getProfile, hasPermission } = useAuth();
const { getJenisList } = useJenis();
const { apiGet, apiPost, api } = useApi();
const { initEditor, destroyEditor, isReady, error: editorError } = useOnlyOffice();
const { getKlasifikasi } = useKlasifikasi();

// ── Shared composable ────────────────────────────────────────────────────────
const {
  isLoadingData, loadingMessage,
  subject,
  date, selectedKlasifikasiId, selectedKlasifikasi, selectedSifat, existingFiles,
  klasifikasiList, klasifikasiStatus,
  selectedTertuju, selectedTembusan,
  maxPerihal, sifatOptions,
  formattedDate, tglDb, tglDisplay,
  toastError, toastSuccess,
} = useTulis();

// ── Naskah Umum state ─────────────────────────────────────────────────────────
const selectedJenisId = ref<string>("");
const jenisList = ref<any[]>([]);

// Dropdown open state (controlled)
const isJenisMenuOpen = ref(false);

// Close dropdown when item is selected
watch(selectedJenisId, () => {
  isJenisMenuOpen.value = false;
});

// ── OnlyOffice editor state ───────────────────────────────────────────────────
const editorPlaceholder = ref<HTMLElement | null>(null);
const currentTempId = ref<string>('');
const currentS3Key = ref<string>('');
const isEditorOpen = ref(false);
const isSavingFromEditor = ref(false);
const editorInitSeq = ref(0);

// ── Form state (dinamis from schema) ─────────────────────────────────────────
const templateSchema = ref<any>(null);

type SignOption = 'qr_only' | 'ttd_basah' | 'digsig';
const selectedSendType = ref<SignOption>('qr_only');
const passphrase = ref('');
const showPassphrase = ref(false);

// Get jenis code from route query or selected dropdown
const currentJenis = computed(() => {
  if (route.query.jenis) return route.query.jenis as string;
  const found = jenisList.value.find((j: any) => j.id === selectedJenisId.value);
  return found?.jenis || "";
});

const breadcrumbs = computed(() => [
  { label: "Beranda", to: "/beranda" },
  { label: `Tulis ${currentJenisLabel.value}`, to: "#" },
]);

const currentJenisLabel = computed(() => {
  if (!currentJenis.value) return "Naskah Dinas";
  const found = jenisList.value.find((j: any) => j.jenis === currentJenis.value);
  return found?.jenis_text || currentJenis.value;
});

// ── Kategori grouping untuk dropdown ──────────────────────────────────────────
const KATEGORI_LABELS: Record<string, string> = {
  pengaturan: 'Pengaturan dan Penetapan',
  korespondensi_internal: 'Korespondensi Internal',
  korespondensi_eksternal: 'Korespondensi Eksternal',
  khusus: 'Naskah Khusus',
};

// Daftar jenis yang sudah punya dedicated page (tidak perlu muncul di sini)
const DEDICATED_JENIS = ['ND', 'SDI', 'SDE', 'DI', 'KA'];

// Kategori mapping untuk jenis-jenis URS poin 6
const JENIS_KATEGORI: Record<string, string> = {
  // Pengaturan dan Penetapan
  PER: 'pengaturan', KEP: 'pengaturan', INS: 'pengaturan',
  SPR: 'pengaturan', SOP: 'pengaturan', SE: 'pengaturan',
  // Khusus - Surat Perjanjian
  NK: 'khusus', PKS: 'khusus', LOA: 'khusus', LOCA: 'khusus',
  KTR: 'khusus', PLN: 'khusus', ADN: 'khusus', SPK: 'khusus',
  ASP: 'khusus', SK: 'khusus',
  // Khusus - Lainnya
  BA: 'khusus', UND: 'khusus', KET: 'khusus', PGN: 'khusus',
  RIS: 'khusus', PUM: 'khusus', SRT: 'khusus', PGA: 'khusus',
  LAP: 'khusus', BVB: 'khusus',
};

// Urutan kategori untuk dropdown (pengaturan di atas, khusus di bawah)
const KATEGORI_ORDER = ['pengaturan', 'khusus'];

// Selected object untuk display di USelectMenu
const selectedJenisObj = computed(() => {
  return jenisList.value.find((j: any) => j.id === selectedJenisId.value) || null;
});

// Flat list untuk USelectMenu dengan grouping via isParent flag
const jenisSelectItems = computed(() => {
  const groups: Record<string, any[]> = {};
  for (const j of jenisList.value) {
    if (DEDICATED_JENIS.includes(j.jenis)) continue;
    const kategori = JENIS_KATEGORI[j.jenis] || 'khusus';
    if (!groups[kategori]) groups[kategori] = [];
    groups[kategori].push(j);
  }

  const result: any[] = [];
  for (const kategori of KATEGORI_ORDER) {
    if (!groups[kategori]) continue;
    result.push({
      id: `cat-${kategori}`,
      jenis: '',
      jenis_text: KATEGORI_LABELS[kategori] || kategori,
      searchLabel: KATEGORI_LABELS[kategori] || kategori,
      isParent: true,
      disabled: true,
    });
    for (const j of groups[kategori]) {
      result.push({
        ...j,
        searchLabel: `${j.jenis} - ${j.jenis_text}`,
        isParent: false,
        disabled: false,
      });
    }
  }
  return result;
});

const loadSchema = async () => {
  const seq = ++editorInitSeq.value;
  destroyEditor();
  currentTempId.value = '';
  currentS3Key.value = '';
  isEditorOpen.value = false;
  isSavingFromEditor.value = false;
  if (!currentJenis.value) {
    templateSchema.value = null;
    return;
  }
  try {
    const res = await apiGet(`/NU/template-schema/${currentJenis.value}`);
    if (seq !== editorInitSeq.value) return;
    templateSchema.value = res?.data || res || null;
    await openEditorForCurrentJenis(seq);
  } catch (e: any) {
    if (seq !== editorInitSeq.value) return;
    templateSchema.value = null;
    isEditorOpen.value = false;
    currentTempId.value = '';
    currentS3Key.value = '';
    destroyEditor();
    toastError('Gagal Membuka Editor', e?.response?.data?.message || e.message || 'Gagal membuka editor OnlyOffice');
  }
};


// ── Validation ────────────────────────────────────────────────────────────────
const validateJenis = (): boolean => {
  if (!currentJenis.value) {
    toastError("Validasi Gagal", "Jenis naskah harus dipilih");
    return false;
  }
  return true;
};

const buildFieldPayload = (): Record<string, string | string[]> => {
  const fields: Record<string, string | string[]> = {};
  for (const key of templateSchema.value?.placeholders || []) {
    fields[key] = '';
  }

  const recipientNames = selectedTertuju.value
    .filter((i: any) => !i.isGroup)
    .map((i: any) => i.label || i.raw?.nama || i.raw?.name || i.raw?.positionText || i.value)
    .filter(Boolean);

  fields.perihal = subject.value;
  fields.tanggal = tglDb.value;
  fields.tglsurat = tglDb.value;
  fields.dari = user.value?.positionText || '';
  fields.namapengirim = user.value?.nama || '';
  fields.tujuan = recipientNames.length ? recipientNames.join('\n') : '';
  fields.klasifikasi = selectedKlasifikasi.value?.klasifikasi || '';
  fields.sifat = selectedSifat.value?.value || '';

  return fields;
};

// ── Pratinjau / buka editor ───────────────────────────────────────────────────
const openEditorForCurrentJenis = async (seq = ++editorInitSeq.value) => {
  if (!validateJenis()) return;
  isLoadingData.value = true;
  loadingMessage.value = 'Membuka editor...';
  try {
    const res = await apiPost('/NU/preview', {
      jenis: currentJenis.value,
      fields: buildFieldPayload(),
    });
    if (seq !== editorInitSeq.value) return;

    const payload = res?.data || res || {};
    currentTempId.value = payload.tempId || '';
    currentS3Key.value = payload.s3Key || '';
    if (!currentTempId.value || !currentS3Key.value) {
      throw new Error('Respons preview tidak lengkap');
    }

    isEditorOpen.value = true;
    isSavingFromEditor.value = false;
    await nextTick();
    if (editorPlaceholder.value) {
      await initEditor(
        editorPlaceholder.value,
        currentTempId.value,
        currentS3Key.value,
        `${currentJenis.value}.docx`,
        () => {
          isSavingFromEditor.value = true;
          toastSuccess('Tersimpan', 'Naskah tersimpan dari editor. Klik Kirim untuk finalize.');
        },
        () => {
          isSavingFromEditor.value = false;
          toastError('Simpan Belum Terkonfirmasi', 'Simpan belum terkonfirmasi server, coba Simpan lagi');
        },
      );
    }
  } catch (e: any) {
    if (seq !== editorInitSeq.value) return;
    isEditorOpen.value = false;
    currentTempId.value = '';
    currentS3Key.value = '';
    destroyEditor();
    toastError('Gagal Membuka Editor', e?.response?.data?.message || e.message || 'Gagal membuka editor OnlyOffice');
  } finally {
    if (seq === editorInitSeq.value) {
      isLoadingData.value = false;
      loadingMessage.value = '';
    }
  }
};

const handleOpenEditor = async () => {
  await openEditorForCurrentJenis();
};

watch(currentJenis, loadSchema, { immediate: true });

// ── Kirim / finalize ──────────────────────────────────────────────────────────
const handleKirim = async () => {
  if (!currentTempId.value || !isSavingFromEditor.value) {
    toastError('Belum Simpan', 'Buka editor lalu Simpan dulu sebelum kirim.');
    return;
  }

  const sign_option = selectedSendType.value;
  if (sign_option === 'digsig' && !passphrase.value.trim()) {
    toastError('Passphrase Wajib', 'Masukkan passphrase untuk TTE.');
    return;
  }

  // Recipients
  const mapRecipients = (list: any[]) =>
    list
      .filter((i) => !i.isGroup)
      .map((i) => Number(i.value))
      .filter((n) => !Number.isNaN(n));
  const mapGroups = (list: any[]) =>
    list
      .filter((i) => i.isGroup)
      .map((i) => String(i.raw?.id ?? i.value));

  const penerima = mapRecipients(selectedTertuju.value);
  const tembusan = mapRecipients(selectedTembusan.value);
  const penerimaGrup = mapGroups(selectedTertuju.value);
  const tembusanGrup = mapGroups(selectedTembusan.value);

  const payload: Record<string, any> = {
    tempId: currentTempId.value,
    jenis: currentJenis.value,
    sign_option,
    penerima,
  };

  if (sign_option === 'digsig' && passphrase.value) {
    payload.passphrase = passphrase.value;
  }
  if (tembusan.length) payload.tembusan = tembusan;
  if (penerimaGrup.length) payload.penerima_grup = penerimaGrup;
  if (tembusanGrup.length) payload.tembusan_grup = tembusanGrup;
  if (selectedSifat.value?.value) payload.sifat = selectedSifat.value.value;
  if (selectedKlasifikasi.value?.klasifikasi) {
    payload.klasifikasi = selectedKlasifikasi.value.klasifikasi;
  }
  if (existingFiles.value?.length) {
    const lampiranIds = existingFiles.value
      .map((f) => f.id)
      .filter((id): id is string => !!id);
    if (lampiranIds.length) payload.lampiran_temp_ids = lampiranIds;
  }

  isLoadingData.value = true;
  loadingMessage.value = 'Mengirim naskah...';
  try {
    const res = await apiPost('/NU/send', payload);
    const result = res?.data || res;
    if (result?.success || result?.data) {
      toastSuccess('Berhasil', 'Naskah berhasil dikirim');
      destroyEditor();
      navigateTo('/korespondensi/terkirim');
    } else {
      throw new Error(result?.message || 'Pengiriman gagal');
    }
  } catch (e: any) {
    toastError('Gagal Mengirim', e?.response?.data?.message || e.message || 'Gagal mengirim naskah');
  } finally {
    isLoadingData.value = false;
    loadingMessage.value = '';
  }
};

// ── onMounted ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  loadingMessage.value = "Memuat...";
  isLoadingData.value = true;

  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";
    klasifikasiList.value = await getKlasifikasi();
    klasifikasiStatus.value = "success";

    const jenisRes = await getJenisList();
    jenisList.value = jenisRes.data || [];

    if (route.query.jenis) {
      const found = jenisList.value.find((j: any) => j.jenis === route.query.jenis);
      if (found) selectedJenisId.value = found.id;
    }
  } catch {
    klasifikasiStatus.value = "error";
  }

  isLoadingData.value = false;
});

onUnmounted(() => {
  destroyEditor();
});
</script>

<template>
  <div class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== 'Memuat...'" :message="loadingMessage" />
    <PageHeader :title="`Tulis ${currentJenisLabel}`" :items="breadcrumbs" />

    <UCard variant="soft"
      :ui="{ root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm' }">

      <!-- Skeleton loading -->
      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
        </div>
      </div>

      <!-- Form -->
      <div v-else class="flex-1 overflow-y-auto space-y-1">
        <!-- Jenis Naskah Selector (USelectMenu - match InputKlasifikasi style) -->
        <div v-if="!route.query.jenis"
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
            Jenis Naskah
          </span>

          <div class="flex flex-wrap gap-1 w-full items-center min-w-0">
            <USelectMenu v-model="selectedJenisId" v-model:open="isJenisMenuOpen" :items="jenisSelectItems" value-key="id" label-key="searchLabel"
              variant="none" class="w-full" searchable
              :content="({ class: 'max-h-[380px]' } as any)"
              :search-attributes="['searchLabel']" placeholder="Pilih Jenis Naskah"
              :search-input="{ placeholder: 'Cari jenis naskah...' }" :ui="{
                base: '!px-0 !bg-transparent w-full dark:text-white',
                ring: 'ring-0',
                shadow: 'shadow-none',
                width: 'w-full sm:w-auto max-w-[calc(100vw-2rem)]'
              } as any">

              <template #item="{ item }">
                <div v-if="item.isParent" class="w-full py-1 overflow-hidden">
                  <span
                    class="text-xs font-bold text-primary-500 dark:text-primary-400 uppercase tracking-widest block w-full truncate">
                    {{ item.jenis_text }}
                  </span>
                </div>

                <div v-else class="flex flex-col min-w-0 w-full overflow-hidden">
                  <span class="text-sm font-medium text-gray-900 dark:text-white block w-full truncate">
                    {{ item.jenis }} - {{ item.jenis_text }}
                  </span>
                </div>
              </template>

              <template #default>
                <span v-if="selectedJenisObj" class="truncate text-sm block w-full text-left dark:text-white">
                  {{ selectedJenisObj.jenis }} - {{ selectedJenisObj.jenis_text }}
                </span>
                <span v-else class="text-gray-400 dark:text-gray-500 text-sm block w-full text-left">
                  Pilih Jenis Naskah
                </span>
              </template>

            </USelectMenu>
          </div>
        </div>

        <!-- Jenis display (from query) -->
        <div v-else
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Jenis Naskah</span>
            <div class="flex items-center flex-1 w-full">
              <span class="text-sm text-gray-900 dark:text-white py-1">{{ currentJenisLabel }}</span>
            </div>
          </div>
        </div>

        <!-- â”€â”€ OnlyOffice Editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
        <div v-if="currentJenis" class="flex flex-col py-4 gap-2">
          <div v-if="editorError"
            class="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
            <Icon name="i-lucide-alert-circle" class="w-4 h-4 mt-0.5 shrink-0" />
            <span>{{ editorError }}</span>
          </div>

          <div v-if="!isEditorOpen && !isLoadingData"
            class="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-4 flex items-center justify-between gap-3">
            <span class="text-sm text-gray-500 dark:text-gray-400">Editor belum terbuka.</span>
            <UButton color="primary" variant="soft" size="sm" @click="handleOpenEditor">
              <Icon name="i-lucide-refresh-cw" class="w-4 h-4 mr-2" />
              Buka Editor
            </UButton>
          </div>

          <div
            v-show="isEditorOpen"
            class="onlyoffice-editor-shell w-full overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <div ref="editorPlaceholder" id="oo-editor" class="w-full h-full" />
          </div>
        </div>

        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []"
          :loading="klasifikasiStatus === 'loading'" />

        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tertuju" :items="[]"
          :groups="[]" :exclude-items="[]" disabled-message="Sudah dipilih" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan" :items="[]"
          :groups="[]" :exclude-items="[]" disabled-message="Sudah dipilih" />

        <TulisInputSifat v-model="selectedSifat" />

        <!-- Perihal -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="subject" :maxlength="maxPerihal"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Ketik Perihal" />
              <span class="text-[10px] font-mono shrink-0 transition-colors"
                :class="subject.length >= maxPerihal ? 'text-red-500 font-bold' : 'text-gray-400'">
                {{ subject.length }}/{{ maxPerihal }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Dynamic Form dari Schema ─────────────────────────────────────── -->
        <!-- ── Static preview (letterhead) ──────────────────────────────────── -->
        <div v-if="false" class="flex flex-col py-4 gap-4">
          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden font-['Times_New_Roman']">
              <div class="bg-white pt-10 pb-10 border-b border-gray-100 select-none text-black">
                <div class="bg-white px-8 pt-8 pb-4 border-b border-gray-100 select-none">
                  <TulisKopSurat :alamat-info="user?.alamatInfo" />
                  <div class="text-center mb-6 text-black">
                    <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">
                      {{ currentJenisLabel.toUpperCase() }}
                    </h1>
                    <p class="text-lg mt-1 text-[14px]">Nomor : ..............................................</p>
                  </div>
                </div>

                <div class="bg-white px-8 py-12 min-h-[200px] text-black flex flex-col items-center justify-center gap-3">
                  <Icon name="i-lucide-file-text" class="w-12 h-12 text-gray-300" />
                  <p class="text-[14px] text-gray-500 text-center">
                    Klik "Buat / Pratinjau" untuk mengisi template dan membuka editor OnlyOffice.
                  </p>
                </div>

                <div class="bg-white px-8 pt-4 pb-8 border-t border-gray-100 select-none">
                  <div class="flex justify-end mb-4 text-black">
                    <div class="text-center min-w-[250px]">
                      <div class="mb-24 text-[14px]">
                        <div>{{ user?.alamatInfo?.kota || 'Tangerang' }}, {{ formattedDate }}</div>
                        <div class="font-bold">{{ user?.positionText || 'Nama Jabatan' }}</div>
                      </div>
                      <div class="font-bold text-[14px]">{{ user?.nama || 'Nama Lengkap' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ClientOnly>
        </div>

        <!-- ── OnlyOffice Editor ──────────────────────────────────────────────── -->
        <!-- Lampiran (additional attachments) -->
        <TulisInputLampiran v-if="currentJenis" v-model="existingFiles" />

        <!-- ── Sign Option Selector ───────────────────────────────────────────── -->
        <div v-if="currentJenis" class="flex flex-col py-4 gap-3 border-t border-gray-200 dark:border-gray-600">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Metode Tanda Tangan</span>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="rounded-xl border-2 p-4 cursor-pointer transition-all overflow-hidden"
              :class="selectedSendType === 'qr_only'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
              @click="selectedSendType = 'qr_only'">
              <div class="flex items-start gap-3">
                <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                  :class="selectedSendType === 'qr_only' ? 'border-primary-500' : 'border-gray-300'">
                  <div v-if="selectedSendType === 'qr_only'" class="w-2 h-2 rounded-full bg-primary-500" />
                </div>
                <div class="flex-1">
                  <div class="font-semibold text-sm text-gray-900 dark:text-white">Tanda Tangan QR</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Dokumen ditandatangani secara internal (QR)</div>
                </div>
              </div>
            </div>

            <div class="rounded-xl border-2 p-4 cursor-pointer transition-all overflow-hidden"
              :class="selectedSendType === 'ttd_basah'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
              @click="selectedSendType = 'ttd_basah'">
              <div class="flex items-start gap-3">
                <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                  :class="selectedSendType === 'ttd_basah' ? 'border-primary-500' : 'border-gray-300'">
                  <div v-if="selectedSendType === 'ttd_basah'" class="w-2 h-2 rounded-full bg-primary-500" />
                </div>
                <div class="flex-1">
                  <div class="font-semibold text-sm text-gray-900 dark:text-white">Tanda Tangan Basah</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Dokumen ditandatangani secara fisik</div>
                </div>
              </div>
            </div>

            <div class="rounded-xl border-2 p-4 cursor-pointer transition-all overflow-hidden"
              :class="selectedSendType === 'digsig'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
              @click="selectedSendType = 'digsig'">
              <div class="flex items-start gap-3">
                <div class="w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                  :class="selectedSendType === 'digsig' ? 'border-primary-500' : 'border-gray-300'">
                  <div v-if="selectedSendType === 'digsig'" class="w-2 h-2 rounded-full bg-primary-500" />
                </div>
                <div class="flex-1">
                  <div class="font-semibold text-sm text-gray-900 dark:text-white">Tanda Tangan Digital (BSrE)</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Dokumen ditandatangani secara elektronik resmi</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Passphrase input for digsig -->
          <div v-if="selectedSendType === 'digsig'" class="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Passphrase TTE</label>
            <div class="relative max-w-md">
              <input :type="showPassphrase ? 'text' : 'password'" v-model="passphrase"
                placeholder="Masukkan passphrase TTE Anda"
                class="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 pr-10" />
              <button type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showPassphrase = !showPassphrase">
                <Icon :name="showPassphrase ? 'i-lucide-eye-off' : 'i-lucide-eye'" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 gap-3">
          <UButton v-if="hasPermission('naskah-dinas', 'create')" color="primary" size="lg" block
            @click="handleKirim" :disabled="!currentJenis || !isSavingFromEditor || isLoadingData">
            <Icon name="i-lucide-send" class="w-4 h-4 mr-2" />
            Kirim
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>

<style scoped>
.onlyoffice-editor-shell {
  height: 78vh;
  min-height: 760px;
}

.onlyoffice-editor-shell :deep(iframe) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
</style>
