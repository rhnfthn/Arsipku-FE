<template>
  <div class="flex-1 overflow-y-auto space-y-4">
    <!-- Informasi Folder (sama dengan halaman folder detail) -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm p-5">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Informasi Folder</h3>
      <div class="grid grid-cols-1 gap-y-5 gap-x-8 sm:grid-cols-2">
        <div class="flex flex-col gap-1">
          <p class="text-xs text-gray-500 dark:text-gray-400">Judul Folder</p>
          <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ konsep?.judul || '-' }}</p>
        </div>
        <div class="flex flex-col gap-1">
          <p class="text-xs text-gray-500 dark:text-gray-400">Total Surat</p>
          <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ penerimaList.length }}</p>
        </div>
        <div class="flex flex-col gap-1">
          <p class="text-xs text-gray-500 dark:text-gray-400">Sifat</p>
          <p class="text-sm font-semibold capitalize text-gray-900 dark:text-white">{{ konsep?.sifat || 'biasa' }}</p>
        </div>
        <div class="flex flex-col gap-1">
          <p class="text-xs text-gray-500 dark:text-gray-400">Pengirim</p>
          <p class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ pengirimNama }}
            <span class="font-normal text-gray-500 dark:text-gray-400">— {{ pengirimJabatan }}</span>
          </p>
        </div>
        <div class="flex flex-col gap-1">
          <p class="text-xs text-gray-500 dark:text-gray-400">Klasifikasi</p>
          <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ konsep?.klasifikasiName || '-' }}</p>
        </div>
      </div>
    </div>

    <!-- Daftar Penerima -->
    <div>
      <div class="mb-2 flex items-center justify-between gap-3">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Daftar Penerima ({{ penerimaList.length }})
        </h4>
      </div>
      <div
        class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-[300px] overflow-y-auto"
      >
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th
                class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
              >
                No
              </th>
              <th
                class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
              >
                Tertuju
              </th>
              <th
                class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
              >
                Alamat
              </th>
              <th
                class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
              >
                No. Telepon
              </th>
              <th
                class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
              >
                Email
              </th>
              <th
                class="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, idx) in penerimaList"
              :key="item.no"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td
                class="px-3 py-2 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700"
              >
                {{ item.no }}
              </td>
              <td
                class="px-3 py-2 text-gray-900 dark:text-white font-medium border-b border-gray-100 dark:border-gray-700"
              >
                {{ getPenerimaName(item) }}
              </td>
              <td
                class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700"
              >
                {{ getTertujuEksternal(item)?.alamat || item.alamatPenerima || item.alamat || '-' }}
              </td>
              <td
                class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700"
              >
                {{ getTertujuEksternal(item)?.telepon || '-' }}
              </td>
              <td
                class="px-3 py-2 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700"
              >
                {{ getTertujuEksternal(item)?.email || item.emailTertuju || item.email || '-' }}
              </td>
              <td class="px-3 py-2 text-center border-b border-gray-100 dark:border-gray-700">
                <UButton
                  icon="i-lucide-file-text"
                  color="primary"
                  variant="soft"
                  size="xs"
                  label="Preview"
                  :loading="isLoadingPdf && previewIndex === idx"
                  @click="openPreview(idx)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showVerifierModal"
        class="fixed inset-0 z-[70] flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="showVerifierModal = false"
        />
        <div
          class="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
        >
          <div class="p-6">
            <div
              class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div
                class="flex items-center justify-between gap-2 border-b border-gray-100 px-5 py-4 dark:border-gray-700"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="flex size-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30"
                    ><UIcon
                      name="i-lucide-users"
                      class="size-5 text-primary-600 dark:text-primary-400"
                  /></span>
                  <div>
                    <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                      Atasan Managerial Berjenjang <span class="text-red-500">*</span>
                    </h2>
                    <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      Pilih satu atau lebih atasan. Urutan pemilihan = urutan verifikasi.
                    </p>
                  </div>
                </div>
                <UButton
                  v-if="selectedVerifiers.length < 3"
                  label="Tambah"
                  icon="i-lucide-user-round-plus"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  @click="showVerifierInput = true"
                />
              </div>
              <div class="space-y-5 px-5 py-5">
                <div v-if="selectedVerifiers.length < 3 && showVerifierInput">
                  <input
                    v-model="verifierSearch"
                    type="text"
                    placeholder="Ketik nama atau persnum atasan..."
                    class="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    @focus="showVerifierInput = true"
                  />
                  <div v-if="verifierLoading" class="py-5 text-center text-sm text-gray-400">
                    Memuat data atasan...
                  </div>
                  <div
                    v-else-if="verifierSearch.trim()"
                    class="mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <button
                      v-for="person in filteredVerifiers"
                      :key="person.position"
                      type="button"
                      class="flex w-full items-center justify-between border-b border-gray-100 px-4 py-3 text-left last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                      @click="toggleVerifier(person)"
                    >
                      <span
                        ><span class="block text-sm font-medium text-gray-900 dark:text-white">{{
                          person.nama
                        }}</span
                        ><span class="block text-xs text-gray-500">{{ person.jabatan }}</span></span
                      ><UIcon
                        v-if="isVerifierSelected(person)"
                        name="i-lucide-check-circle"
                        class="size-5 text-green-500"
                      />
                    </button>
                    <p
                      v-if="!filteredVerifiers.length"
                      class="p-4 text-center text-sm text-gray-400"
                    >
                      Verifikator tidak ditemukan.
                    </p>
                  </div>
                </div>
                <div v-if="selectedVerifiers.length" class="space-y-4">
                  <div
                    v-for="(person, index) in selectedVerifiers"
                    :key="person.position"
                    class="flex items-center gap-4"
                  >
                    <span
                      class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-md"
                      >{{ index + 1 }}</span
                    >
                    <div class="min-w-0 flex-1">
                      <p
                        class="truncate text-base font-bold uppercase tracking-normal text-gray-900 dark:text-white"
                      >
                        {{ person.nama }}
                      </p>
                      <p class="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                        {{ person.jabatan }}
                      </p>
                    </div>
                    <UButton
                      color="error"
                      variant="ghost"
                      icon="i-lucide-trash-2"
                      size="sm"
                      @click="toggleVerifier(person)"
                    />
                  </div>
                </div>
                <p v-if="selectedVerifiers.length" class="text-sm text-gray-500">
                  {{ selectedVerifiers.length }} atasan dipilih. Verifikasi:
                  {{ selectedVerifiers.map((person) => person.nama).join(' → ') }}
                </p>
              </div>
            </div>
          </div>
          <div
            class="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-700"
          >
            <UButton
              label="Batal"
              color="neutral"
              variant="outline"
              @click="showVerifierModal = false"
            /><UButton
              label="Ajukan Verifikasi"
              color="primary"
              :loading="generating"
              :disabled="!selectedVerifiers.length || generating"
              @click="submitVerifiers"
            />
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Preview Full-screen PDF (native PDF viewer browser, seragam dengan preview-berkas) -->
    <Teleport to="body">
      <div
        v-if="showPreview"
        class="fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-950"
      >
        <!-- Top Bar -->
        <div
          class="h-12 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0"
        >
          <div class="flex items-center gap-2 min-w-0">
            <UIcon name="i-lucide-file-text" class="w-4 h-4 text-primary-500 shrink-0" />
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              Preview Surat — Penerima {{ previewIndex + 1 }}
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <UButton
              icon="i-lucide-chevron-left"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewIndex <= 0 || isLoadingPdf"
              @click="gotoPreview(previewIndex - 1)"
            />
            <span class="min-w-14 text-center text-xs text-gray-500 dark:text-gray-400"
              >{{ previewIndex + 1 }} / {{ penerimaList.length }}</span
            >
            <UButton
              icon="i-lucide-chevron-right"
              color="neutral"
              variant="ghost"
              size="xs"
              :disabled="previewIndex >= penerimaList.length - 1 || isLoadingPdf"
              @click="gotoPreview(previewIndex + 1)"
            />
            <div class="mx-2 h-5 w-px bg-gray-200 dark:bg-gray-700" />
            <button
              class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="Tutup"
              @click="closePreview"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <!-- PDF Content (iframe → native PDF viewer browser) -->
        <div class="flex-1 relative bg-gray-100 dark:bg-gray-900 min-h-0">
          <div v-if="isLoadingPdf" class="absolute inset-0 flex items-center justify-center z-10">
            <div
              class="flex flex-col items-center gap-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-lg"
            >
              <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Memuat dokumen…</p>
            </div>
          </div>
          <iframe v-if="pdfUrl" :key="pdfUrl" :src="pdfUrl" class="w-full h-full border-none" />
          <div
            v-else-if="pdfError"
            class="flex items-center justify-center h-full text-gray-500 flex-col gap-2"
          >
            <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-red-300" />
            <span class="text-sm text-red-500">{{ pdfError }}</span>
          </div>
          <div
            v-else-if="!isLoadingPdf"
            class="flex items-center justify-center h-full text-gray-500 flex-col gap-2"
          >
            <UIcon name="i-lucide-file-text" class="w-12 h-12 opacity-30" />
            <span class="text-sm">PDF tidak tersedia.</span>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-end gap-3">
        <UButton
          v-if="!isPembuatPenandatangan"
          label="Submit ke Verifikator"
          color="primary"
          size="lg"
          icon="i-lucide-shield-check"
          class="font-bold"
          :loading="generating"
          @click="openVerificationSelection"
        />
        <UButton
          v-if="isPembuatPenandatangan"
          label="Pratinjau"
          color="primary"
          size="lg"
          icon="i-lucide-eye"
          class="px-8 font-bold"
          :loading="generating"
          @click="previewPenerimaIdx = 0; isPreviewOpen = true; handlePratinjau()"
        />
      </div>
    </div>

    <!-- Slideover Pratinjau dengan dropdown penerima -->
    <USlideover v-model:open="isPreviewOpen" title="Pratinjau" description="Pratinjau dokumen" side="bottom" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
      wrapper: 'z-50'
    }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Pratinjau</h3>
          </div>
          <!-- Dropdown pilih penerima (USelectMenu — seragam dengan komponen lain) -->
          <div v-if="penerimaList.length > 1" class="flex items-center gap-2">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Penerima:</span>
            <USelectMenu
              :model-value="penerimaOptions.find((o) => o.value === previewPenerimaIdx)"
              :items="penerimaOptions"
              by="value"
              :search-input="false"
              class="w-64"
              :ui="{
                trigger: 'h-9 text-sm font-medium w-full justify-between',
              }"
              @update:model-value="onPenerimaChange"
            >
              <template #item="{ item }">
                <div class="flex items-center gap-2 w-full">
                  <UIcon
                    :name="item.value === previewPenerimaIdx ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                    :class="item.value === previewPenerimaIdx ? 'size-4 text-primary-500' : 'size-4 text-gray-300 dark:text-gray-600'"
                  />
                  <span class="text-sm">{{ item.label }}</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>
      </template>

      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <iframe v-if="previewPdfUrl" :key="previewPdfUrl" :src="previewPdfUrl" class="w-full h-full rounded-lg shadow-lg border border-gray-200" />
          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500">Memuat Pratinjau...</span>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-4 w-full">
          <UButton
            label="Draft"
            color="neutral"
            variant="outline"
            size="lg"
            icon="i-heroicons-document-text"
            class="px-8"
            @click="handleSaveDraft"
          />
          <UButton
            label="Kirim"
            color="primary"
            size="lg"
            icon="i-heroicons-paper-airplane"
            class="px-8 font-bold"
            @click="handleKirim"
          />
        </div>
      </template>
    </USlideover>

    <!-- Modal Pilih Metode Tanda Tangan — Teleport ke body agar di atas pratinjau (z-50) -->
    <Teleport to="body">
      <TulisDigsigPassphraseModal
        v-model:open="isSignModalOpen"
        :signer-info="signerInfo"
        :is-loading="generating"
        :hide-basah="true"
        @submit="handleSignSubmit"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { SdeMasalConcept, SdeMasalPenerima, SdeMasalTemplate } from '~/types/sde-masal';
import { useTertujuEksternal } from '~/composables/useTertujuEksternal';
import { useApi } from '~/composables/useApi';
import {
  renderSdeMasalKonten,
  setTertujuEksternalLookup,
  setInternalPositionLookup,
} from '~/utils/sde-masal-render';
import TulisDigsigPassphraseModal from '~/components/Tulis/DigsigPassphraseModalAsync.vue';

const props = defineProps<{
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
  template: SdeMasalTemplate | null;
  folderId: string | null;
  generating: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit-verification', verifikators: any[], signOption: 'qr_only' | 'ttd_basah'): void;
  (
    e: 'finalize-direct',
    payload: { signOption: 'digsig' | 'qr_only' | 'ttd_basah'; passphrase?: string }
  ): void;
}>();

const showPreview = ref(false);
const previewIndex = ref<number>(0);

// PDF preview state (native PDF viewer via iframe)
const isLoadingPdf = ref(false);
const pdfUrl = ref<string | null>(null);
const pdfError = ref<string | null>(null);
let currentBlobUrl: string | null = null;

// --- Pratinjau slideover + Sign modal state ---
const isPreviewOpen = ref(false);
const previewPdfUrl = ref<string | null>(null);
let previewBlobUrl: string | null = null;
const isSignModalOpen = ref(false);
const previewPenerimaIdx = ref(0);

// Opsi dropdown penerima untuk USelectMenu
const penerimaOptions = computed(() =>
  props.penerimaList.map((item, idx) => ({
    label: `${idx + 1}. ${getPenerimaName(item)}`,
    value: idx,
  }))
);

const onPenerimaChange = (selected: any) => {
  if (selected && typeof selected.value === 'number') {
    previewPenerimaIdx.value = selected.value;
    handlePratinjau();
  }
};

const signerInfo = computed(() => ({
  label: pengirimJabatan.value || 'Penandatangan',
  role: pengirimNama.value || '-',
}));

const revokePreviewPdf = () => {
  if (previewBlobUrl) {
    URL.revokeObjectURL(previewBlobUrl);
    previewBlobUrl = null;
  }
  previewPdfUrl.value = null;
};

const revokePdf = () => {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
  pdfUrl.value = null;
};

const closePreview = () => {
  showPreview.value = false;
  revokePdf();
};

const openPreview = async (idx: number) => {
  showPreview.value = true;
  await generatePdfFor(idx);
};

const gotoPreview = async (idx: number) => {
  if (idx < 0 || idx >= props.penerimaList.length) return;
  previewIndex.value = idx;
  await generatePdfFor(idx);
};

/**
 * Generate PDF pratinjau untuk slideover (penerima terpilih dari dropdown).
 */
const handlePratinjau = async () => {
  if (!props.penerimaList.length) return;
  const idx = previewPenerimaIdx.value;
  const item = props.penerimaList[idx];
  if (!item) return;
  revokePreviewPdf();
  try {
    if (!tertujuEksternal.value.length) {
      await fetchTertujuEksternal().catch(() => {});
    }
    setTertujuEksternalLookup(tertujuEksternal.value);
    const konten = renderSdeMasalKonten(
      props.template?.konten || '',
      item,
      props.konsep,
      getRecipientCompanyName(item)
    );
    const formData = new FormData();
    formData.append('htmlContent', konten);
    formData.append('perihal', item.perihal || props.konsep?.perihal || '');
    formData.append('sifat', props.konsep?.sifat || 'biasa');
    formData.append('penerima', JSON.stringify([getRecipientCompanyName(item) || item.tertuju || '']));
    formData.append('tembusan_eksternal', item.tembusanEksternal || '');
    formData.append('tembusan_internal', item.tembusanInternal || '');
    formData.append('tembusan', JSON.stringify(item.tembusan ? [item.tembusan] : []));
    formData.append('nama_tempat', user.value?.areaText?.replace('Kantor', '').trim() || 'Tangerang');
    formData.append('nama_jabatan', user.value?.positionText || '');
    formData.append('nama_lengkap', user.value?.nama || '');
    if (props.konsep?.tanggalKonsep) formData.append('tgl', props.konsep.tanggalKonsep);

    const response = await api.post('/sde-masal/preview-pdf', formData, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    previewBlobUrl = URL.createObjectURL(blob);
    previewPdfUrl.value = previewBlobUrl;
  } catch (e: any) {
    console.error('Gagal generate pratinjau:', e);
    previewPdfUrl.value = null;
  }
};

const handleSaveDraft = () => {
  isPreviewOpen.value = false;
  // Emit finalize dengan status draft (simpan folder saja, tidak kirim)
  emit('finalize-direct', { signOption: 'qr_only' });
};

const handleKirim = () => {
  // Jangan close pratinjau — modal tanda tangan muncul di atas slideover
  isSignModalOpen.value = true;
};

const handleSignSubmit = (payload: { signOption: string; passphrase?: string }) => {
  isSignModalOpen.value = false;
  emit('finalize-direct', {
    signOption: payload.signOption as 'digsig' | 'qr_only' | 'ttd_basah',
    passphrase: payload.passphrase,
  });
};

/**
 * Generate PDF asli via POST /SDE/preview-pdf (Puppeteer di backend),
 * lalu tampilkan via iframe → native PDF viewer browser.
 */
const generatePdfFor = async (idx: number) => {
  const item = props.penerimaList[idx];
  if (!item || !props.template) return;

  isLoadingPdf.value = true;
  revokePdf();
  try {
    if (!tertujuEksternal.value.length) {
      await fetchTertujuEksternal().catch(() => {});
    }
    setTertujuEksternalLookup(tertujuEksternal.value);
    await ensureInternalPositionLookup();

    const konten = renderSdeMasalKonten(
      props.template.konten,
      item,
      props.konsep,
      getRecipientCompanyName(item)
    );

    const formData = new FormData();
    formData.append('htmlContent', konten);
    formData.append('konten', konten);
    formData.append('klasifikasi', props.konsep?.klasifikasiName?.split(' - ')[0] || '');
    formData.append('perihal', item.perihal || props.konsep?.perihal || '');
    formData.append('sifat', props.konsep?.sifat || 'biasa');
    formData.append(
      'penerima',
      JSON.stringify([getRecipientCompanyName(item) || item.tertuju || item.idTertuju || ''])
    );
    // Tembusan: kirim kode eksternal & internal untuk di-resolve backend
    // (urutan: eksternal dulu, lalu internal) → di-hardcode di kanvas PDF.
    // tembusan legacy dikirim sebagai fallback bila kolom baru kosong.
    formData.append('tembusan_eksternal', item.tembusanEksternal || '');
    formData.append('tembusan_internal', item.tembusanInternal || '');
    formData.append('tembusan', JSON.stringify(item.tembusan ? [item.tembusan] : []));
    formData.append(
      'nama_tempat',
      user.value?.areaText?.replace('Kantor', '').trim() || 'Tangerang'
    );
    formData.append('nama_jabatan', user.value?.positionText || '');
    formData.append('nama_lengkap', user.value?.nama || '');
    if (props.konsep?.tanggalKonsep) {
      formData.append('tgl', props.konsep.tanggalKonsep);
    }

    const response = await api.post('/sde-masal/preview-pdf', formData, {
      responseType: 'blob',
    });

    // Validasi: pastikan response benar-benar PDF (bukan JSON error)
    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('application/json')) {
      const text = await (response.data as Blob).text();
      const errJson = JSON.parse(text);
      throw new Error(errJson?.message?.[0] || errJson?.message || 'Gagal generate PDF');
    }

    const blob = new Blob([response.data], { type: 'application/pdf' });
    if (blob.size === 0) throw new Error('PDF kosong dari server');
    currentBlobUrl = URL.createObjectURL(blob);
    pdfUrl.value = currentBlobUrl;
  } catch (e: any) {
    console.error('Gagal generate preview PDF SDE Masal:', e);
    // Coba baca error dari blob response (backend mengembalikan JSON error)
    let detail = e?.message || 'Gagal generate PDF';
    if (e?.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text();
        const errJson = JSON.parse(text);
        detail = errJson?.message?.[0] || errJson?.message || detail;
      } catch {
        /* bukan JSON, pakai pesan default */
      }
    }
    pdfError.value = detail;
    toast.add({ title: 'Gagal membuat preview', description: detail, color: 'error' });
    pdfUrl.value = null;
  } finally {
    isLoadingPdf.value = false;
  }
};
const showVerifierModal = ref(false);
const showVerifierInput = ref(false);
const verifierLoading = ref(false);
const verifierSearch = ref('');
const selectedVerifiers = ref<any[]>([]);
const verifierList = ref<any[]>([]);
const { api, apiGet } = useApi();
const toast = useToast();
const { user } = useAuth();
const isPembuatPenandatangan = computed(
  () => String(user.value?.position || '') === String(props.konsep?.pengirimId || '')
);
const { data: tertujuEksternal, fetchTertujuEksternal } = useTertujuEksternal();

/**
 * Muat data posisi internal (org-data) untuk resolve position ID tembusan
 * internal menjadi jabatan. Dipanggil sekali per sesi.
 */
let internalPositionLookupLoaded = false;
const ensureInternalPositionLookup = async () => {
  if (internalPositionLookupLoaded) return;
  internalPositionLookupLoaded = true;
  try {
    const result: any = await apiGet(
      `/org-data/getdata?tgl=${new Date().toISOString().slice(0, 10)}`
    );
    const rows = result?.data?.barisData || result?.barisData || [];
    setInternalPositionLookup(rows);
  } catch {
    /* gagal load → fallback tampilkan kode position */
  }
};

const findTertujuEksternal = (value: string | number | null | undefined) => {
  const raw = String(value ?? '').trim();
  const code = raw.split(/\s*(?:—|-)\s*/)[0].padStart(3, '0');
  return tertujuEksternal.value.find(
    (item) =>
      String(item.kode ?? '')
        .trim()
        .padStart(3, '0') === code
  );
};

const getRecipientCompanyName = (item: SdeMasalPenerima) =>
  findTertujuEksternal(item.idTertuju || item.tertuju)?.nama || null;

// PengirimName format: "Nama - Jabatan" (dipisah " - ")
const pengirimParts = computed(() =>
  (props.konsep?.pengirimName || '')
    .split(' - ')
    .map((part) => part.trim())
    .filter(Boolean)
);
const pengirimNama = computed(() => pengirimParts.value[0] || '-');
const pengirimJabatan = computed(() => pengirimParts.value.slice(1).join(' - ') || '-');

onMounted(() => {
  fetchTertujuEksternal().catch((error) => {
    console.warn('Gagal memuat master tertuju eksternal untuk daftar penerima SDE Masal', error);
  });
});

const getTertujuEksternal = (penerima: SdeMasalPenerima) => {
  const raw = String(penerima.idTertuju || penerima.tertuju || '').trim();
  const kode = raw.split(/\s*(?:—|-)\s*/)[0].padStart(3, '0');
  return tertujuEksternal.value.find(
    (item) =>
      String(item.kode ?? '')
        .trim()
        .padStart(3, '0') === kode
  );
};

const getPenerimaName = (penerima: SdeMasalPenerima) =>
  getTertujuEksternal(penerima)?.nama || penerima.tertuju || penerima.idTertuju || '-';

const filteredVerifiers = computed(() => {
  const query = verifierSearch.value.toLowerCase().trim();
  return !query
    ? verifierList.value
    : verifierList.value.filter((person) =>
        `${person.nama} ${person.jabatan}`.toLowerCase().includes(query)
      );
});
const isVerifierSelected = (person: any) =>
  selectedVerifiers.value.some((item) => item.position === person.position);
const toggleVerifier = (person: any) => {
  const index = selectedVerifiers.value.findIndex((item) => item.position === person.position);
  if (index >= 0) return selectedVerifiers.value.splice(index, 1);
  if (selectedVerifiers.value.length >= 3)
    return toast.add({ title: 'Maksimal 3 verifikator', color: 'error' });
  selectedVerifiers.value.push(person);
  verifierSearch.value = '';
  showVerifierInput.value = false;
};
const openVerificationSelection = async () => {
  showVerifierModal.value = true;
  const storageKey = `sde-masal-wizard:${props.konsep?.parentNaskahId || 'new'}`;
  const draft = JSON.parse(localStorage.getItem(storageKey) || '{}');
  selectedVerifiers.value = Array.isArray(draft.verifikators) ? draft.verifikators : [];
  showVerifierInput.value = selectedVerifiers.value.length === 0;
  if (verifierList.value.length) return;
  verifierLoading.value = true;
  try {
    const result: any = await apiGet(
      `/org-data/getdata?tgl=${new Date().toISOString().slice(0, 10)}`
    );
    const rows = result?.data?.barisData || result?.barisData || [];
    verifierList.value = rows
      .filter((row: any) => row.persnum_person || row.persnum)
      .map((row: any) => ({
        persnum: String(row.persnum_person || row.persnum),
        position: String(row.position),
        nama: row.persnum_person_text || row.nama || '-',
        jabatan: row.position_text || '-',
      }))
      .filter((person: any) => person.persnum && person.nama !== '-');
  } catch {
    toast.add({ title: 'Gagal memuat verifikator', color: 'error' });
  } finally {
    verifierLoading.value = false;
  }
};
const saveVerifiers = () => {
  const storageKey = `sde-masal-wizard:${props.konsep?.parentNaskahId || 'new'}`;
  const draft = JSON.parse(localStorage.getItem(storageKey) || '{}');
  localStorage.setItem(
    storageKey,
    JSON.stringify({ ...draft, verifikators: selectedVerifiers.value })
  );
  showVerifierModal.value = false;
  toast.add({
    title: 'Verifikator tersimpan',
    description: `${selectedVerifiers.value.length} verifikator dipilih.`,
    color: 'success',
  });
};
const submitVerifiers = () => {
  saveVerifiers();
  emit(
    'submit-verification',
    selectedVerifiers.value,
    signOption.value === 'ttd_basah' ? 'ttd_basah' : 'qr_only'
  );
};
</script>
