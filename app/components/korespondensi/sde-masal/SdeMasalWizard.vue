<template>
  <div class="min-h-screen pt-5 dark:bg-gray-900 transition-colors">
    <PageHeader title="SDE Masal" :items="breadcrumbs" />

    <!-- Informasi Folder saat melanjutkan folder yang sudah tersimpan -->
    <div
      v-if="currentStep === 3 && folderId && wizardState.konsep"
      class="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <h2 class="mb-3 text-base font-semibold text-gray-900 dark:text-white">Informasi Folder</h2>
      <div class="grid grid-cols-1 gap-x-10 md:grid-cols-2">
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm text-gray-500 dark:text-gray-400 sm:w-40">Judul Folder</span>
            <p class="w-full break-words text-sm text-gray-900 dark:text-white sm:ml-6">{{ wizardState.konsep.judul || '-' }}</p>
          </div>
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm text-gray-500 dark:text-gray-400 sm:w-40">Tanggal</span>
            <p class="w-full text-sm text-gray-900 dark:text-white sm:ml-6">{{ wizardState.konsep.tanggalKonsep || '-' }}</p>
          </div>
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm text-gray-500 dark:text-gray-400 sm:w-40">Klasifikasi</span>
            <p class="w-full break-words text-sm text-gray-900 dark:text-white sm:ml-6">{{ wizardState.konsep.klasifikasiName || '-' }}</p>
          </div>
        </div>
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm text-gray-500 dark:text-gray-400 sm:w-40">Sifat</span>
            <p class="w-full text-sm capitalize text-gray-900 dark:text-white sm:ml-6">
              {{ wizardState.konsep.sifat === 'biasa' ? 'Biasa' : wizardState.konsep.sifat || '-' }}
            </p>
          </div>
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm text-gray-500 dark:text-gray-400 sm:w-40">Total Surat</span>
            <p class="w-full text-sm text-gray-900 dark:text-white sm:ml-6">{{ wizardState.penerimaList.length }}</p>
          </div>
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm text-gray-500 dark:text-gray-400 sm:w-40">Pengirim</span>
            <p class="w-full break-words text-sm text-gray-900 dark:text-white sm:ml-6">{{ wizardState.konsep.pengirimName || '-' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Step Content -->
    <UCard
      variant="soft"
      :ui="{
        root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm',
      }"
    >
      <!-- Step 1: Konsep Surat -->
      <SdeMasalStepKonsep
        v-if="currentStep === 1"
        v-model="wizardState.konsep"
        :parent-naskah-id="parentNaskahId"
      />

      <!-- Step 2: Template, variabel, dan penerima dalam satu langkah -->
      <div v-else-if="currentStep === 2" class="space-y-6">
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
              Judul Folder
            </span>
            <p class="w-full text-sm text-gray-900 dark:text-white sm:ml-6">
              {{ wizardState.konsep?.judul || '-' }}
            </p>
          </div>
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
              Tanggal
            </span>
            <p class="w-full text-sm text-gray-900 dark:text-white sm:ml-6">
                {{ wizardState.konsep?.tanggalKonsep || '-' }}
            </p>
          </div>
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
              Klasifikasi
            </span>
            <p class="w-full text-sm leading-relaxed text-gray-900 dark:text-white sm:ml-6">
                {{ wizardState.konsep?.klasifikasiName || '-' }}
            </p>
          </div>
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
              Pengirim
            </span>
            <p class="w-full text-sm leading-relaxed text-gray-900 dark:text-white sm:ml-6">
                {{ wizardState.konsep?.pengirimName || '-' }}
            </p>
          </div>
          <div class="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-0">
            <span class="w-full shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-40">
              Sifat
            </span>
            <p class="w-full text-sm capitalize text-gray-900 dark:text-white sm:ml-6">
                {{
                  wizardState.konsep?.sifat === 'biasa'
                    ? 'Biasa / Terbuka'
                    : wizardState.konsep?.sifat || '-'
                }}
            </p>
          </div>
        </div>
        <SdeMasalStepTemplate
          v-model="wizardState.template"
          :konsep="wizardState.konsep"
          :penerima-list="wizardState.penerimaList"
          @update:variables="wizardState.variables = $event"
        />
        <SdeMasalStepUpload
          v-model="wizardState.penerimaList"
          :konsep="wizardState.konsep"
          :dynamic-variables="wizardState.variables"
          :template="wizardState.template"
          :folder-id="folderId"
        />
      </div>

      <!-- Step 3: Preview dan Konfirmasi -->
      <SdeMasalStepPreview
        v-else-if="currentStep === 3"
        :konsep="wizardState.konsep"
        :penerima-list="wizardState.penerimaList"
        :template="wizardState.template"
        :folder-id="folderId"
        :generating="generating"
        @submit-verification="handleSubmitVerification"
        @send-to-signer="handleSendToSigner"
        @finalize-direct="handleFinalizeDirect"
        @submit-all="handleSubmitAll"
        @clear-data="handleClearData"
        @remove-item="handleRemoveItem"
        @edit-email="handleEditEmail"
        @upload-lampiran="handleUploadLampiran"
      />
    </UCard>

    <!-- Navigation Buttons -->
    <div class="flex items-center justify-between mt-4 px-1">
      <!-- Kembali -->
      <UButton
        v-if="currentStep > 1"
        label="Kembali"
        color="neutral"
        variant="outline"
        icon="i-lucide-arrow-left"
        @click="goBack"
      />
      <div v-else />

      <!-- Selanjutnya / Generate -->
      <div class="flex items-center gap-2">
        <UButton
          v-if="currentStep < 3"
          label="Selanjutnya"
          color="primary"
          icon="i-lucide-arrow-right"
          :disabled="!canProceed"
          @click="goNext"
        />
      </div>
    </div>

    <!-- Modal Edit Email -->
    <Teleport to="body">
      <div v-if="showEditEmailModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" @click="showEditEmailModal = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] max-w-[480px] overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Edit Email</h3>
            <button @click="showEditEmailModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Tertuju</label>
              <input
                v-model="editEmailForm.emailTertuju"
                type="email"
                placeholder="penerima@example.com"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#457fb6]"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email CC</label>
              <input
                v-model="editEmailForm.emailCc"
                type="email"
                placeholder="cc@example.com"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#457fb6]"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email BCC</label>
              <input
                v-model="editEmailForm.emailBcc"
                type="email"
                placeholder="bcc@example.com"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#457fb6]"
              />
            </div>
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="showEditEmailModal = false" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Batal
            </button>
            <button @click="saveEditEmail" class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white transition-colors">
              Simpan
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal Upload Lampiran -->
    <Teleport to="body">
      <div v-if="showUploadLampiranModal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity" @click="closeUploadLampiran"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[90%] max-w-[480px] overflow-hidden z-[10000]">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Upload Lampiran</h3>
            <button @click="closeUploadLampiran" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <UIcon name="i-lucide-x" class="w-5 h-5" />
            </button>
          </div>
          <div class="p-6">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Lampiran untuk item ke-{{ (uploadLampiranIndex ?? 0) + 1 }}
            </p>
            <FileUpload
              v-model="lampiranFiles"
              accept=".pdf,.zip"
              :multiple="false"
              description="Format PDF atau ZIP"
            />
          </div>
          <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button @click="closeUploadLampiran" class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              Tutup
            </button>
            <button @click="doUploadLampiran" :disabled="uploadingLampiran" class="px-4 py-2 text-sm font-medium rounded-lg bg-[#457fb6] hover:bg-[#3a6d9c] text-white disabled:opacity-50 transition-colors">
              <UIcon v-if="uploadingLampiran" name="i-lucide-loader-2" class="w-4 h-4 mr-1 inline animate-spin" />
              Upload
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSdeMasal } from '~/composables/useSdeMasal';
import { useApi } from '~/composables/useApi';
import { useToast } from '#imports';
import type {
  SdeMasalAttachmentRef,
  SdeMasalConcept,
  SdeMasalPenerima,
  SdeMasalTemplate,
} from '~/types/sde-masal';
import SdeMasalStepKonsep from './SdeMasalStepKonsep.vue';
import SdeMasalStepUpload from './SdeMasalStepUpload.vue';
import SdeMasalStepTemplate from './SdeMasalStepTemplate.vue';
import SdeMasalStepPreview from './SdeMasalStepPreview.vue';
import FileUpload from '~/components/FileUpload.vue';

const props = defineProps<{
  parentNaskahId?: string;
  folderId?: string;
}>();

const router = useRouter();
const toast = useToast();
const { api } = useApi();
const {
  generateMassal,
  createFolder,
  updateFolder,
  finalizeDirect,
  sendToSigner,
  submitVerification,
  findNaskahInFolder,
  commitMassAttachments,
} = useSdeMasal();

const currentStep = ref(1);
const generating = ref(false);
const folderId = ref<string | null>(null);

const wizardState = reactive<{
  konsep: SdeMasalConcept | null;
  penerimaList: SdeMasalPenerima[];
  template: SdeMasalTemplate | null;
  variables: string[];
}>({
  konsep: null,
  penerimaList: [],
  template: null,
  variables: [],
});

const draftStorageKey = `sde-masal-wizard:${props.parentNaskahId || 'new'}`;
const persistenceReady = ref(false);

onMounted(async () => {
  // Jika dibuka dari halaman pengajuan (folder draft), pulihkan dari server.
  if (props.folderId) {
    try {
      const data = await findNaskahInFolder(props.folderId);
      const f = data?.folder;
      const list = data?.items || [];
      if (f) {
        folderId.value = f.id;
        wizardState.konsep = {
          judul: f.judul || '',
          tanggalKonsep: f.tanggal ? String(f.tanggal).slice(0, 10) : '',
          klasifikasiId: f.klasifikasi || '',
          klasifikasiName: [f.klasifikasi, f.klasifikasiText].filter(Boolean).join(' - '),
          pengirimId: f.pengirimId || '',
          pengirimName: f.pengirimName || '',
          sifat: f.sifat || 'biasa',
          parentNaskahId: f.parentNaskahId || undefined,
          atasNama: f.atasNama || null,
          atasNamaPositionId: f.atasNamaPositionId || null,
        };
        wizardState.template = f.kontenTemplate
          ? { skema: 'DINAMIS', versi: 'v1', konten: f.kontenTemplate }
          : null;
        wizardState.variables = Array.isArray(f.dynamicVariables) ? f.dynamicVariables : [];
        wizardState.penerimaList = list.map((item: any) => ({
          ...(item.recipient || {}),
          id: item.id,
          isValid: true,
        }));
        currentStep.value = 3;
      }
    } catch (error) {
      console.warn('Gagal memulihkan draft folder SDE Masal:', error);
    } finally {
      persistenceReady.value = true;
    }
    return;
  }

  try {
    const saved = localStorage.getItem(draftStorageKey);
    if (saved) {
      const draft = JSON.parse(saved);
      const savedStep = [1, 2, 3].includes(draft.currentStep) ? draft.currentStep : 1;
      const savedKonsep = draft.konsep || null;
      // Draft lama bisa berisi pengirim hasil auto-select sebelumnya. Pada
      // langkah awal, pengirim harus tetap kosong dan dipilih manual oleh user.
      wizardState.konsep = savedKonsep && savedStep === 1
        ? { ...savedKonsep, pengirimId: '', pengirimName: '' }
        : savedKonsep;
      wizardState.penerimaList = Array.isArray(draft.penerimaList) ? draft.penerimaList : [];
      wizardState.template = draft.template || null;
      wizardState.variables = Array.isArray(draft.variables) ? draft.variables : [];
      folderId.value = draft.folderId || null;
      currentStep.value = savedStep;
    }
  } catch (error) {
    console.warn('Gagal memulihkan draft SDE Masal:', error);
  } finally {
    persistenceReady.value = true;
  }

  // Jika draft dipulihkan langsung di step 3 (mis. sebelum field id ada),
  // pastikan item sudah punya id agar upload lampiran bisa bekerja.
  if (currentStep.value === 3 && wizardState.penerimaList.length) {
    ensureItemsGenerated().catch((error) => {
      console.warn('Gagal menyiapkan id item SDE Masal:', error);
    });
  }
});

watch(
  () => ({
    konsep: wizardState.konsep,
    penerimaList: wizardState.penerimaList,
    template: wizardState.template,
    variables: wizardState.variables,
    folderId: folderId.value,
    currentStep: currentStep.value,
  }),
  (draft) => {
    if (!persistenceReady.value) return;
    localStorage.setItem(draftStorageKey, JSON.stringify(draft));
    // Auto-save ke server saat melanjutkan draft folder (folderId dari query).
    scheduleAutoSave();
  },
  { deep: true }
);

// Auto-save ke server (debounce) saat melanjutkan draft folder.
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
const scheduleAutoSave = () => {
  if (!props.folderId || !folderId.value) return;
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    try {
      await persistCompleteFolder();
      await ensureItemsGenerated();
    } catch (error) {
      console.warn('Gagal auto-save draft SDE Masal:', error);
    }
  }, 1200);
};

const breadcrumbs = computed(() => [
  { label: 'Beranda', to: '/beranda' },
  { label: 'Korespondensi', to: '/korespondensi/kotak-masuk' },
  { label: 'SDE Masal', to: '#' },
]);

// Validasi per step
const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return !!(
      wizardState.konsep?.tanggalKonsep &&
      wizardState.konsep?.judul?.trim() &&
      wizardState.konsep?.klasifikasiId &&
      wizardState.konsep?.pengirimId
    );
  }
  if (currentStep.value === 2) {
    const hasUnmappedAttachments = wizardState.penerimaList.some(
      (item) => typeof item.lampiran === 'string' && item.lampiran.trim().length > 0
    );
    return !!(
      wizardState.konsep?.tanggalKonsep &&
      wizardState.konsep?.judul?.trim() &&
      wizardState.konsep?.klasifikasiId &&
      wizardState.konsep?.pengirimId &&
      wizardState.template?.konten &&
      wizardState.penerimaList.length > 0 &&
      wizardState.penerimaList.every((p) => p.isValid) &&
      !hasUnmappedAttachments
    );
  }
  return true;
});

const goBack = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const goNext = async () => {
  if (!canProceed.value) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Mohon lengkapi data pada step ini terlebih dahulu',
      color: 'error',
    });
    return;
  }
  if (wizardState.konsep && !folderId.value) {
    try {
      const saved = await createFolder(buildFolderPayload());
      folderId.value = saved?.id ?? null;
      toast.add({
        title: 'Folder tersimpan',
        description: 'Konsep SDE Massal disimpan sebagai draft.',
        color: 'success',
      });
    } catch (error: any) {
      toast.add({
        title: 'Gagal menyimpan konsep',
        description: error?.message || 'Coba lagi.',
        color: 'error',
      });
      return;
    }
  }
  if (currentStep.value === 2) {
    try {
      await ensureItemsGenerated();
      await ensureMassAttachmentsCommitted();
    } catch (error: any) {
      toast.add({
        title: 'Gagal menyiapkan data',
        description: error?.message || 'Coba lagi.',
        color: 'error',
      });
      return;
    }
  }
  if (currentStep.value < 3) currentStep.value++;
};

const buildFolderPayload = (signOption?: 'digsig' | 'qr_only' | 'ttd_basah') => {
  const konsep = wizardState.konsep;
  const [klasifikasi, ...klasifikasiText] = (konsep?.klasifikasiName || '').split(' - ');
  return {
    judul: konsep?.judul?.trim() || 'SDE Massal',
    parentNaskahId: konsep?.parentNaskahId,
    tanggal: konsep?.tanggalKonsep,
    klasifikasi: klasifikasi || konsep?.klasifikasiId,
    klasifikasiText: klasifikasiText.join(' - ') || konsep?.klasifikasiName,
    pengirimId: konsep?.pengirimId,
    pengirimName: konsep?.pengirimName,
    sifat: konsep?.sifat || 'biasa',
    atasNama: konsep?.atasNama || null,
    atasNamaPositionId: konsep?.atasNamaPositionId || null,
    kontenTemplate: wizardState.template?.konten,
    dynamicVariables: wizardState.variables,
    signOption,
  };
};

const persistCompleteFolder = async (signOption?: 'digsig' | 'qr_only' | 'ttd_basah') => {
  if (!folderId.value) {
    const saved = await createFolder(buildFolderPayload(signOption));
    folderId.value = saved?.id ?? null;
  } else {
    await updateFolder(folderId.value, buildFolderPayload(signOption));
  }
  if (!folderId.value) throw new Error('Folder SDE Massal gagal disimpan');
  return folderId.value;
};

/**
 * Pastikan setiap item penerima sudah tersimpan di DB (punya id) agar fitur
 * upload lampiran per item bisa bekerja. Dipanggil saat masuk step 3 dan
 * dipakai ulang oleh submit/finalize agar tidak generate duplikat.
 */
let itemsGenerationPromise: Promise<void> | null = null;

const ensureItemsGenerated = async () => {
  // Fungsi ini dipanggil oleh watcher/autosave dan juga oleh tombol aksi.
  // Jika keduanya berjalan bersamaan, tanpa lock masing-masing request akan
  // melihat item yang sama-sama belum memiliki id lalu membuat baris baru.
  if (itemsGenerationPromise) return itemsGenerationPromise;

  itemsGenerationPromise = (async () => {
    try {
      // Hanya generate item yang belum punya id (hindari duplikat saat user
      // kembali ke step 2 lalu mengedit daftar penerima).
      const missing = wizardState.penerimaList.filter(
        (p) => p.isValid !== false && !p.id
      );
      if (missing.length === 0) return;

      if (!folderId.value) {
        const saved = await createFolder(buildFolderPayload());
        folderId.value = saved?.id ?? null;
      }
      if (!folderId.value) throw new Error('Folder SDE Massal gagal disimpan');
      if (!wizardState.konsep || !wizardState.template) {
        throw new Error('Konsep dan template SDE Massal belum lengkap');
      }

      const konsep = wizardState.konsep;
      const template = wizardState.template;
      const result = await generateMassal({
        konsep,
        folderId: folderId.value,
        penerimaList: missing,
        template,
      });

      // generateMassal mengembalikan items 1:1 dengan baris valid yang dikirim.
      const items = result?.items || [];
      missing.forEach((p, idx) => {
        if (items[idx]) p.id = items[idx].id;
      });
    } finally {
      itemsGenerationPromise = null;
    }
  })();

  return itemsGenerationPromise;
};

const getAttachmentRefs = (item: SdeMasalPenerima): SdeMasalAttachmentRef[] =>
  Array.isArray(item.lampiran) ? item.lampiran : [];

const ensureMassAttachmentsCommitted = async () => {
  if (!folderId.value) return;
  const items = wizardState.penerimaList
    .filter((item) => item.id && Array.isArray(item.lampiran))
    .map((item) => ({
      itemId: item.id as string,
      attachments: getAttachmentRefs(item),
    }));
  if (items.length > 0) {
    await commitMassAttachments(folderId.value, items);
  }
};

const resetWizard = () => {
  wizardState.konsep = null;
  wizardState.penerimaList = [];
  wizardState.template = null;
  wizardState.variables = [];
  folderId.value = null;
  currentStep.value = 1;
  persistenceReady.value = false;
  localStorage.removeItem(draftStorageKey);
};

const handleFinalizeDirect = async (payload: {
  signOption: 'digsig' | 'qr_only' | 'ttd_basah';
  passphrase?: string;
}) => {
  if (!wizardState.konsep || !wizardState.template) return;
  generating.value = true;
  try {
    const id = await persistCompleteFolder(payload.signOption);
    await ensureItemsGenerated();
    await ensureMassAttachmentsCommitted();
    const itemIds = wizardState.penerimaList
      .filter((p) => p.id)
      .map((p) => p.id as string);
    const result = await finalizeDirect({
      folderId: id,
      itemIds,
      penerimaList: wizardState.penerimaList,
      signOption: payload.signOption,
      passphrase: payload.passphrase,
    });
    toast.add({
      title: result?.failed ? 'Selesai dengan catatan' : 'SDE Massal terkirim',
      description: `${result?.success || 0} berhasil, ${result?.failed || 0} gagal.`,
      color: result?.failed ? 'warning' : 'success',
    });
    resetWizard();
    router.push('/korespondensi/sde-masal');
  } catch (error: any) {
    toast.add({
      title: 'Gagal mengirim SDE Massal',
      description: error?.message || 'Coba lagi.',
      color: 'error',
    });
  } finally {
    generating.value = false;
  }
};

const handleSendToSigner = async () => {
  if (!wizardState.konsep || !wizardState.template) {
    toast.add({ title: 'Data belum lengkap', description: 'Lengkapi konsep, template, dan penerima terlebih dahulu.', color: 'error' });
    return;
  }
  generating.value = true;
  try {
    const id = await persistCompleteFolder('qr_only');
    await ensureItemsGenerated();
    await ensureMassAttachmentsCommitted();
    const ids = wizardState.penerimaList.filter((p) => p.id).map((p) => p.id as string);
    await sendToSigner(id, ids);
    toast.add({ title: 'Berhasil dikirim', description: 'SDE Massal telah dikirim ke kotak masuk pengirim.', color: 'success' });
    resetWizard();
    router.push('/korespondensi/terkirim');
  } catch (error: any) {
    toast.add({ title: 'Gagal mengirim SDE Massal', description: error?.message || 'Coba lagi.', color: 'error' });
  } finally {
    generating.value = false;
  }
};

const handleSubmitVerification = async (
  verifikators: any[],
  signOption: 'qr_only' | 'ttd_basah' = 'qr_only'
) => {
  if (!wizardState.konsep || !wizardState.template) {
    toast.add({ title: 'Error', description: 'Data wizard tidak lengkap', color: 'error' });
    return;
  }
  if (!Array.isArray(verifikators) || verifikators.length === 0) {
    toast.add({
      title: 'Verifikator belum dipilih',
      description: 'Pilih minimal satu verifikator.',
      color: 'error',
    });
    return;
  }

  generating.value = true;
  try {
    const id = await persistCompleteFolder(signOption);
    await ensureItemsGenerated();
    await ensureMassAttachmentsCommitted();

    const ids = wizardState.penerimaList
      .filter((p) => p.id)
      .map((p) => p.id as string);
    if (ids.length > 0) {
      await submitVerification(ids, verifikators);
    }

    toast.add({
      title: 'Berhasil',
      description: `${ids.length} SDE Massal berhasil diajukan ke verifikator`,
      color: 'success',
    });

    // Reset wizard state
    resetWizard();

    // Langsung diarahkan ke halaman dashboard SDE Masal (pengajuan)
    router.push('/korespondensi/sde-masal');
  } catch (e: any) {
    console.error('Gagal mengajukan verifikasi SDE Massal:', e);
    toast.add({
      title: 'Gagal Mengajukan',
      description: e?.message || 'Terjadi kesalahan saat mengajukan verifikasi',
      color: 'error',
    });
  } finally {
    generating.value = false;
  }
};

// ============================================================
// Aksi dari Daftar SDE Masal (step 3)
// ============================================================

// Submit All → finalize semua item langsung (qr_only)
const handleSubmitAll = () => {
  if (!wizardState.penerimaList.length) {
    toast.add({ title: 'Tidak ada data', description: 'Daftar SDE Masal kosong.', color: 'error' });
    return;
  }
  handleFinalizeDirect({ signOption: 'qr_only' });
};

// Kosongkan Data → hapus semua penerima
const handleClearData = () => {
  wizardState.penerimaList = [];
  toast.add({ title: 'Data dikosongkan', description: 'Daftar SDE Masal telah dikosongkan.', color: 'success' });
};

// Hapus satu item
const handleRemoveItem = (index: number) => {
  if (index < 0 || index >= wizardState.penerimaList.length) return;
  wizardState.penerimaList.splice(index, 1);
  toast.add({ title: 'Item dihapus', color: 'success' });
};

// Edit email (email_tertuju, email_cc, email_bcc)
const editEmailIndex = ref<number | null>(null);
const editEmailForm = reactive({ emailTertuju: '', emailCc: '', emailBcc: '' });
const showEditEmailModal = computed({
  get: () => editEmailIndex.value !== null,
  set: (val: boolean) => {
    if (!val) editEmailIndex.value = null;
  },
});
const handleEditEmail = (index: number) => {
  const item = wizardState.penerimaList[index];
  if (!item) return;
  editEmailIndex.value = index;
  editEmailForm.emailTertuju = item.emailTertuju || '';
  editEmailForm.emailCc = item.emailCc || '';
  editEmailForm.emailBcc = item.emailBcc || '';
};
const saveEditEmail = () => {
  if (editEmailIndex.value === null) return;
  const item = wizardState.penerimaList[editEmailIndex.value];
  if (item) {
    item.emailTertuju = editEmailForm.emailTertuju;
    item.emailCc = editEmailForm.emailCc;
    item.emailBcc = editEmailForm.emailBcc;
  }
  editEmailIndex.value = null;
  toast.add({ title: 'Email tersimpan', color: 'success' });
};

// Upload lampiran
const uploadLampiranIndex = ref<number | null>(null);
const showUploadLampiranModal = computed({
  get: () => uploadLampiranIndex.value !== null,
  set: (val: boolean) => {
    if (!val) uploadLampiranIndex.value = null;
  },
});
const handleUploadLampiran = (index: number) => {
  uploadLampiranIndex.value = index;
};
const closeUploadLampiran = () => {
  uploadLampiranIndex.value = null;
  lampiranFiles.value = [];
};

const lampiranFileInput = ref<HTMLInputElement | null>(null);
const lampiranFiles = ref<File[]>([]);
const uploadingLampiran = ref(false);
const doUploadLampiran = async () => {
  const file = lampiranFiles.value[0];
  if (!file || uploadLampiranIndex.value === null) {
    toast.add({ title: 'Pilih file terlebih dahulu', color: 'error' });
    return;
  }
  const item = wizardState.penerimaList[uploadLampiranIndex.value];
  if (!item) return;

  // Pastikan item sudah punya id (di-generate saat masuk step 3). Jika belum
  // (mis. draft lama), generate dulu sebelum upload.
  if (!item.id) {
    try {
      await ensureItemsGenerated();
    } catch (e: any) {
      toast.add({
        title: 'Gagal menyiapkan data',
        description: e?.message || 'Coba lagi.',
        color: 'error',
      });
      return;
    }
  }
  if (!item.id) {
    toast.add({ title: 'Item belum tersimpan', color: 'error' });
    return;
  }

  uploadingLampiran.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res: any = await api.post(`/sde-masal/${item.id}/lampiran`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // `api` adalah instance axios mentah → res.data = body { success, data }.
    // Data asli (lampiran key + url presigned) ada di res.data.data.
    const body = res?.data?.data || res?.data || {};
    item.lampiran = body?.url || body?.lampiran || null;
    item.lampiranKey = body?.lampiran || null;
    toast.add({ title: 'Lampiran terupload', color: 'success' });
    closeUploadLampiran();
  } catch (e: any) {
    toast.add({
      title: 'Gagal upload lampiran',
      description: e?.response?.data?.message || e?.message || 'Coba lagi.',
      color: 'error',
    });
  } finally {
    uploadingLampiran.value = false;
  }
};
</script>
