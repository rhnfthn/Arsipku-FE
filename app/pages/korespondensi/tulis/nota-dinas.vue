<template>
  <div class="relative">

    <Teleport to="body">
      <div v-if="isLoadingData && loadingMessage !== 'Memuat...'"
        class="fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-br from-white/75 to-[#e8eff6]/75 backdrop-blur-[2px] transition-all duration-500">

        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="w-[400px] h-[400px] rounded-full bg-gradient-radial from-white/95 via-white/60 to-transparent">
          </div>
        </div>

        <div class="relative flex flex-col items-center gap-6 z-10">
          <div class="relative flex items-center justify-center w-24 h-24">
            <div
              class="absolute inset-0 rounded-full border-4 border-transparent border-t-[#457fb6] border-r-[#749fc8] animate-spin"
              style="animation-duration: 1.5s;">
            </div>
            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg relative z-10">
              <div class="plane-float">
                <UIcon name="i-lucide-plane" class="w-8 h-8 text-[#457fb6] -rotate-45" />
              </div>
            </div>
          </div>

          <div class="flex flex-col items-center gap-2">
            <span class="text-gray-900 font-semibold text-lg">
              {{ loadingMessage || 'Memproses Data' }}
            </span>
            <span class="text-sm text-gray-600">
              Mohon tunggu sebentar
            </span>
          </div>
        </div>
      </div>
    </Teleport>

    <PageHeader title="Tulis Nota Dinas" :items="breadcrumbs" />

    <UCard variant="soft" :ui="{
      root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm',
    }">

      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="space-y-6 animate-pulse">
        <div class="space-y-2 pt-4">
           <div class="h-11 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
           <div class="h-11 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
           <div class="h-11 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
           <div class="h-11 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
           <div class="h-11 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
           <div class="h-11 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
           <div class="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
           <div class="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg w-full"></div>
        </div>
      </div>

      <div v-else class="flex-1 overflow-y-auto space-y-1">

        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []"
          :loading="klasifikasiStatus === 'loading'" />

        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tertuju" :items="items"
          :exclude-items="selectedTembusan" disabled-message="Sudah dipilih di Tembusan" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan" :items="items"
          :exclude-items="selectedTertuju" disabled-message="Sudah dipilih di Tertuju" />

        <TulisInputSifat v-model="selectedSifat" />

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

        <div class="flex flex-col py-4">
          <TemplateManager :current-content="editorContent" @apply="handleApplyTemplate" />

          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">

              <div class="bg-white pt-10 pb-10 border-b border-gray-100 select-none text-black">

                <div class="bg-white px-8 pt-8 pb-4 border-b border-gray-100 select-none">
                  <div class="flex items-center pb-2 mb-6">
                    <div class="flex items-end gap-4">
                      <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
                      <div class="flex flex-col mb-1">
                        <span class="text-2xl font-bold tracking-wide text-[18px] text-black">
                          AirNav Indonesia
                        </span>
                      </div>
                    </div>

                    <div class="ml-auto text-[10px] leading-[1.1] text-gray-700 text-right">
                      <div class="font-bold uppercase">
                        {{ user?.alamatInfo?.kantor }}
                      </div>
                      <div>
                        {{ user?.alamatInfo?.gedung }}
                        {{ user?.alamatInfo?.kota }}
                      </div>
                      <div v-html="user?.alamatInfo?.alamat"></div>
                    </div>
                  </div>

                  <div class="text-center mb-6 text-black">
                    <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">
                      NOTA DINAS
                    </h1>
                    <p class="text-lg mt-1 text-[14px]">Nomor : ..............................................</p>
                  </div>

                  <table class="w-[50%] mx-auto text-lg leading-relaxed mb-4 tn-roman text-black">
                    <tbody>
                      <tr>
                        <td class="text-[14px] w-[120px] font-bold align-top">Kepada Yth.</td>
                        <td class="text-[14px] w-[20px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          <span v-if="selectedTertuju.length > 5">
                            Periksa Alamat Terlampir
                          </span>
                          <span v-else v-html="selectedTertuju.length
                            ? selectedTertuju
                              .map((s: any, i: number) =>
                                selectedTertuju.length === 1
                                  ? `<div>${s.labelJob || s.label}</div>`
                                  : `<div style='margin-left:1em;text-indent:-1em'>
                                                                                                        ${i + 1}. ${s.labelJob || s.label}
                                                                                                      </div>`
                              )
                              .join('')
                            : '................................................'
                            "></span>
                        </td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Dari</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          {{ user?.positionText || 'Posisi' }}
                        </td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Perihal</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          {{ subject || "................................................" }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Editor api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" class="min-h-[400px]" />

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

                  <div class="text-[12px] mt-2 w-full text-left text-black">
                    <div class="font-bold underline mb-1">Tembusan :</div>
                    <div v-if="selectedTembusan.length > 5" class="ml-4 pl-2">
                      Periksa Alamat Terlampir
                    </div>
                    <div v-else-if="selectedTembusan.length === 1" class="ml-4 pl-2">
                      {{ selectedTembusan[0]?.labelJob || selectedTembusan[0]?.label }}
                    </div>
                    <ol v-else-if="selectedTembusan.length > 1" class="list-decimal ml-4 pl-2">
                      <li v-for="t in selectedTembusan" :key="t.value">
                        {{ t.labelJob || t.label }}
                      </li>
                    </ol>
                    <div v-else class="text-gray-400 italic">...</div>
                  </div>
                </div>

                <div v-if="selectedTertuju.length > 5 || selectedTembusan.length > 5"
                  class="bg-white px-12 py-12 border-t-4 border-gray-200 text-black break-before-page">

                  <div class="flex justify-end mb-10 text-[14px]">
                    <div class="text-left min-w-[300px]">
                      <table class="w-full">
                        <tr>
                          <td class="align-top pr-2">Lampiran Surat</td>
                        </tr>
                        <tr>
                          <td class="align-top pr-2">Nomor Surat :</td>
                          <td>.....................................</td>
                        </tr>
                        <tr>
                          <td class="align-top pr-2">Tanggal Surat :</td>
                          <td>{{ formattedDate }}</td>
                        </tr>
                      </table>
                    </div>
                  </div>

                  <div v-if="selectedTertuju.length > 5" class="mb-8">
                    <div class="font-bold text-[14px] mb-2 uppercase">KEPADA YTH :</div>
                    <ol class="list-decimal ml-6 text-[14px] space-y-1">
                      <li v-for="item in selectedTertuju" :key="item.value">
                        {{ item.labelJob || item.label }}
                      </li>
                    </ol>
                  </div>

                  <div v-if="selectedTembusan.length > 5">
                    <div class="font-bold text-[14px] mb-2 uppercase">TEMBUSAN :</div>
                    <ol class="list-decimal ml-6 text-[14px] space-y-1">
                      <li v-for="item in selectedTembusan" :key="item.value">
                        {{ item.labelJob || item.label }}
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </ClientOnly>

          <TulisInputLampiran v-model:existingFiles="existingFiles" />
        </div>

        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-800">
          <UButton label="Pratinjau" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold"
            @click="handlePreview" />
        </div>
      </div>
    </UCard>

    <USlideover v-model:open="isOpenPreview" title="Pratinjau" side="bottom" :dismissible="!alertState.isOpen" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
    }">
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full rounded-lg shadow-lg border border-gray-200" />
          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500">Memuat Pratinjau...</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-4 w-full">
          <UButton label="Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text"
            class="px-8" @click="confirmSaveDraft" />

          <UButton label="Kirim" color="primary" size="lg" icon="i-heroicons-paper-airplane" class="px-8 font-bold"
            @click="confirmKirimDokumen" />
        </div>
      </template>
    </USlideover>

    <UModal v-model:open="isPassphraseModalOpen" :dismissible="false" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-semibold">Kirim Dokumen</h3>
        </div>
      </template>

      <template #body>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Pilih metode pengiriman dokumen:
        </p>

        <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">

          <label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition" :class="selectedSendType === 'digital'
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'">
            <input type="radio" name="send_type" value="digital" v-model="selectedSendType" class="mt-1" />

            <div class="flex flex-col flex-1">
              <span class="font-medium text-gray-900 dark:text-white">
                Kirim dengan Digital Signature
              </span>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Dokumen akan ditandatangani secara digital dan memiliki kekuatan legal.
              </span>

              <div v-if="selectedSendType === 'digital'"
                class="flex items-start mt-3 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                <div class="flex-shrink-0">
                  <div class="h-12 w-12 rounded-full bg-[#3b82f6] flex items-center justify-center text-white">
                    <UIcon name="i-heroicons-user" class="w-6 h-6" />
                  </div>
                </div>

                <div class="flex flex-col">
                  <span class="text-xs text-gray-500 mb-0.5">{{ signerInfo.label }}</span>
                  <span class="text-sm text-gray-700 dark:text-gray-300 leading-tight mb-0.5">
                    {{ signerInfo.role }}
                  </span>
                  <span class="text-base font-bold text-gray-900 dark:text-white">
                    {{ signerInfo.name }}
                  </span>
                </div>
              </div>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition" :class="selectedSendType === 'internal'
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'">
            <input type="radio" name="send_type" value="internal" v-model="selectedSendType" class="mt-1" />

            <div class="flex flex-col">
              <span class="font-medium text-gray-900 dark:text-white">
                Kirim dengan Tanda Tangan Internal
              </span>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Dokumen dikirim dengan tanda tangan digital internal.
              </span>
            </div>
          </label>

          <UFormGroup label="Input Passphrase" v-if="selectedSendType">
            <UInput type="password" v-model="passphrase" size="lg" placeholder="Ketik Passphrase" class="w-full"
              autofocus />
          </UFormGroup>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Batal" color="gray" variant="ghost" @click="isPassphraseModalOpen = false" />
          <UButton label="Kirim Dokumen" color="primary" :loading="isLoadingData" @click="handlePassphraseSubmit" />
        </div>
      </template>
    </UModal>

  </div>
</template>

<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/* 1. IMPORTS                                                                 */
/* -------------------------------------------------------------------------- */
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import type { Editor as TinyMCEEditor } from 'tinymce';

// Components
import TulisInputKlasifikasi from "@/components/Tulis/InputKlasifikasi.vue";
import TulisInputLampiran from "@/components/Tulis/InputLampiran.vue";
import TulisInputSifat from "@/components/Tulis/InputSifat.vue";
import TemplateManager from '@/components/Tulis/TemplateManager.vue';

// Types & Validation (Dari file Zod kamu)
import type { Klasifikasi } from "~/types/klasifikasi";
import { validateDraftPayload, type DraftPayload } from "~/types/nota-dinas";
import { Alert } from "@/composables/useAlert";

/* -------------------------------------------------------------------------- */
/* 2. LOCAL TYPES (Helper UI)                                                 */
/* -------------------------------------------------------------------------- */
interface RecipientItem {
  label: string;
  labelJob: string;
  value: string;
  raw: any;
}

interface SifatOption {
  label: string;
  value: string;
}

interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
}

/* -------------------------------------------------------------------------- */
/* 3. COMPOSABLES & CONFIG                                                    */
/* -------------------------------------------------------------------------- */
const route = useRoute();
const router = useRouter();
const toast = useToast();

const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { getRecipients } = useRecipients();
const { isLoadingDraft, getDraftDetail } = useDraft();
const { generatePdf, sendNotaDinas, saveDraft: saveND } = useNotaDinas();

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Tulis Nota Dinas", to: "#" },
];

const maxPerihal = 200;

const sifatOptions: SifatOption[] = [
  { label: "Sangat Rahasia", value: "sangat rahasia" },
  { label: "Rahasia", value: "rahasia" },
  { label: "Terbatas", value: "terbatas" },
  { label: "Biasa / Terbuka", value: "biasa" }
];

const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 400,
  menubar: false,
  promotion: false,
  branding: false,
  placeholder: 'Ketik konten disini...',
  plugins: 'lists advlist link image code table fullscreen',
  toolbar: 'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist table | code | fullscreen',
  content_style: `body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; border: none !important; }`,
  setup(editor: TinyMCEEditor) {
    tinymceEditor.value = editor;
  }
};

/* -------------------------------------------------------------------------- */
/* 4. STATE & REFS                                                            */
/* -------------------------------------------------------------------------- */
// UI State
const isLoadingData = ref(false);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const alertState = useAlertState();

// [NEW] Passphrase State
const isPassphraseModalOpen = ref(false)

// Tambahkan di bagian data/ref
const selectedSendType = ref('') // default kosong (tidak ada yang dipilih)
const passphrase = ref('')

// Reset saat modal ditutup
watch(() => isPassphraseModalOpen.value, (newVal) => {
  if (!newVal) {
    selectedSendType.value = ''
    passphrase.value = ''
  }
})

const signerInfo = computed(() => ({
  name: user.value?.nama || 'Nama Lengkap',
  role: user.value?.positionText || 'Jabatan',
  label: 'Ditandatangani secara digital oleh'
}))

// Form Data State
const editDraftId = ref<string | null>(null);
const subject = ref("");
const editorContent = ref("");
const english = ref(false);
const tinymceEditor = ref<TinyMCEEditor | null>(null);

// Date State
const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));

// Classification & Files
const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const selectedKlasifikasiId = ref<string | null>(null);
const existingFiles = ref<UploadedFile[]>([]);

// Selection/Recipients
const selectedSifat = ref<SifatOption | null>(null);
const items = ref<RecipientItem[]>([]);
const selectedTertuju = ref<RecipientItem[]>([]);
const selectedTembusan = ref<RecipientItem[]>([]);

// PDF Generation
const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");

/* -------------------------------------------------------------------------- */
/* 5. COMPUTED PROPERTIES                                                     */
/* -------------------------------------------------------------------------- */
const selectedKlasifikasi = computed(() =>
  klasifikasiList.value.find((b) => b.id === selectedKlasifikasiId.value)
);

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

/* -------------------------------------------------------------------------- */
/* 6. METHODS                                                                 */
/* -------------------------------------------------------------------------- */
const validateAndToast = (payload: DraftPayload) => {
  const validationResult = validateDraftPayload(payload);
  if (!validationResult.isValid) {
    // Mengambil error pertama dari object errors yang dikembalikan fungsi validasi kamu
    const errorKeys = Object.keys(validationResult.errors || {});
    const firstKey = errorKeys.length > 0 ? errorKeys[0] : null;
    const firstMessage = firstKey && validationResult.errors
      ? validationResult.errors[firstKey]
      : "Terjadi kesalahan input";

    toast.add({
      title: 'Validasi Gagal',
      description: firstMessage,
      icon: 'i-heroicons-x-circle-20-solid',
      color: 'error'
    });
    return false;
  }
  return true;
};

// --- Payload Generators ---
// Fungsi ini sekarang return-nya strict sesuai Zod Schema
const getBasePayload = (): DraftPayload => {
  const tglDb = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : "";

  const tglPreview = date.value
    ? `${String(date.value.day).padStart(2, "0")}/${String(date.value.month).padStart(2, "0")}/${date.value.year}`
    : "";

  const lampiranIds = existingFiles.value
    .map((f) => f.id)
    .filter((id): id is string => !!id);

  return {
    // Jika null undefined, biarkan undefined agar Zod handle (atau null)
    id_naskah: editDraftId.value || null,

    pengirim: user.value?.position || "",
    penerima: selectedTertuju.value.map(i => i.value),
    tembusan: selectedTembusan.value.map(i => i.value),
    tertuju: selectedTertuju.value.map(i => i.labelJob || i.label),

    klasifikasi: selectedKlasifikasi.value?.klasifikasi || null,
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || null,

    sifat: selectedSifat.value?.value || 'biasa',

    perihal: subject.value,
    konten: String(editorContent.value || ''),
    htmlContent: String(editorContent.value || ''),
    english: english.value,

    nama_tempat: user.value?.areaText || "Kantor Pusat",
    nama_jabatan: user.value?.positionText || "",
    nama_lengkap: user.value?.nama || "",

    tgl: tglDb,
    tanggal: tglPreview,
    lampiran_temp_ids: lampiranIds,
  };
};

const createFormData = (payload: DraftPayload, includePdf: boolean = false) => {
  const formData = new FormData();

  // Loop keys dari DraftPayload (Zod inferred type)
  (Object.keys(payload) as Array<keyof DraftPayload>).forEach((key) => {
    const value = payload[key];
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });

  // Handle PDF secara manual karena tidak ada di schema Zod
  if (includePdf && pdfBlob.value) {
    // Pastikan nama file PDF valid
    const safeDate = payload.tanggal ? payload.tanggal.replace(/\//g, '-') : 'draft';
    formData.append("final_pdf", pdfBlob.value, `nota_dinas_${safeDate}.pdf`);
  }

  return formData;
};

// --- Event Handlers & Core Actions ---
const handleApplyTemplate = (htmlContent: string) => {
  if (tinymceEditor.value) {
    const cleanContent = htmlContent.trim().replace(/>\s+</g, '><');
    tinymceEditor.value.setContent(cleanContent);
    editorContent.value = tinymceEditor.value.getContent();
  }
};

const handlePreview = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  loadingMessage.value = "Memproses Pratinjau...";
  isLoadingData.value = true;

  try {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    // Preview tidak butuh PDF di formData karena backend yang generate
    const formData = createFormData(payload, false);
    const blobResponse = await generatePdf(formData);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(pdfBlob.value);
    isOpenPreview.value = true;
  } catch (err) {
    toast.add({ title: 'Gagal Preview', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const confirmSaveDraft = async () => {
  const isConfirmed = await Alert.confirm(
    'Simpan sebagai Draft?',
    'Dokumen akan disimpan ke folder draft dan bisa Anda edit kembali nanti.',
    'Ya, Simpan',
    'Batal',
    false
  );

  if (!isConfirmed) return;

  try {
    // Loading spinner sedang berputar di sini...
    await handleSaveDraft();

    // SUKSES: Panggil ini untuk menutup modal & mematikan loading
    Alert.close();
  } catch (error) {
    console.error(error);
    // JIKA ERROR: Tetap tutup alert, atau matikan loading saja
    Alert.close();
  }
};

const confirmKirimDokumen = async () => {
  const isConfirmed = await Alert.confirm(
    'Kirim Dokumen?',
    'Dokumen yang sudah dikirim tidak dapat dibatalkan.',
    'Ya, Lanjutkan', // Text diubah sedikit agar user tahu ada step berikutnya
    'Batal',
    false
  );

  if (!isConfirmed) return;

  // [MODIFIED] Alih-alih langsung kirim, buka modal passphrase
  Alert.close();
  passphrase.value = ""; // Reset passphrase
  isPassphraseModalOpen.value = true;
};

// [NEW] Handler saat user submit passphrase di modal
const handlePassphraseSubmit = async () => {
  if (!passphrase.value) {
    toast.add({
      title: 'Validasi',
      description: 'Harap masukkan passphrase Anda',
      color: 'warning'
    });
    return;
  }

  // Tutup modal dan panggil fungsi kirim utama
  isPassphraseModalOpen.value = false;
  await handleKirimDokumen();
};

const handleKirimDokumen = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  try {
    loadingMessage.value = "Mengirim Nota Dinas...";
    isLoadingData.value = true;

    // 1. Generate PDF terbaru dulu untuk memastikan konten sinkron
    const formDataPreview = createFormData(payload, false);
    const blobResponse = await generatePdf(formDataPreview);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });

    // 2. Kirim payload + PDF Binary
    const formData = createFormData(payload, true);

    // [MODIFIED] Append passphrase ke FormData agar backend bisa proses digsig
    formData.append('passphrase', passphrase.value);

    const result = await sendNotaDinas(formData);

    if (result.data.success) {
      if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
      toast.add({ title: 'Berhasil', description: 'Nota Dinas berhasil dikirim', color: 'success' });
      router.push("/korespondensi/terkirim");
    }
  } catch (e: any) {
    console.error("Gagal mengirim:", e);
    // Jika gagal, mungkin perlu buka modal lagi atau reset passphrase?
    // Di sini kita biarkan user coba lagi tombol "Kirim" -> Modal
    toast.add({
      title: 'Gagal Mengirim',
      description: e.response?.data?.message || 'Pastikan semua input & passphrase sudah benar',
      color: 'error'
    });
  } finally {
    isLoadingData.value = false;
  }
};

const handleSaveDraft = async () => {
  const payload = getBasePayload();

  // Validasi Zod tetap dijalankan untuk Draft (Opsional, tapi bagus untuk data integrity)
  // Kalau mau draft bisa disimpan walau error, komen baris validasi ini.
  if (!validateAndToast(payload)) return;

  try {
    loadingMessage.value = "Menyimpan Draft...";
    isLoadingData.value = true;

    // Draft biasanya tidak butuh PDF binary, cukup JSON datanya
    const formData = createFormData(payload, false);
    await saveND(formData, editDraftId.value);

    toast.add({ title: 'Berhasil', description: 'Draft berhasil disimpan', color: 'success' });
    router.push("/korespondensi/draft");
  } catch (e: any) {
    console.error("Gagal simpan draft:", e);
    toast.add({
      title: 'Gagal',
      description: e.response?.data?.message || 'Gagal memperbarui draft',
      color: 'error'
    });
  } finally {
    isLoadingData.value = false;
  }
};

/* -------------------------------------------------------------------------- */
/* 7. LIFECYCLE HOOKS                                                         */
/* -------------------------------------------------------------------------- */
onMounted(async () => {
  loadingMessage.value = "Memuat...";
  isLoadingData.value = true;

  // Helpers
  const onConfirm = () => {
    alertState.isOpen = false;
    if (alertState.resolve) alertState.resolve(true);
  };

  const onCancel = () => {
    alertState.isOpen = false;
    if (alertState.resolve) alertState.resolve(false);
  };

  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";
    klasifikasiList.value = await getKlasifikasi();
    klasifikasiStatus.value = "success";

    const resRec = await getRecipients(user.value?.position);
    const rawData = resRec.recipients || resRec.data || [];

    items.value = rawData.map((r: any): RecipientItem => ({
      label: `${r.persnum_person_text || r.persnum || "empty"} - (${r.position_abbreviation || r.abbreviation}) ${r.position_text || r.positionText}`,
      labelJob: r.position_text || r.positionText,
      value: String(r.position || r.position_id || r.id),
      raw: r,
    }));
  } catch {
    klasifikasiStatus.value = "error";
  }

  // Populate Draft Data
  const draftId = route.query.draft_id as string;
  if (draftId) {
    try {
      editDraftId.value = draftId;
      const resDraft = await getDraftDetail(draftId);

      if (resDraft.success && resDraft.data) {
        const d = resDraft.data;
        subject.value = d.perihal || "";
        editorContent.value = d.konten || "";
        english.value = Boolean(d.english);

        if (d.klasifikasi) {
          const foundKlas = klasifikasiList.value.find(k => k.klasifikasi === d.klasifikasi);
          if (foundKlas) selectedKlasifikasiId.value = foundKlas.id;
        }

        const mapApiToUI = (list: any[]): RecipientItem[] => {
          return list?.map(item => {
            const posId = String(item.position_id || item.position || item.value);
            const master = items.value.find(m => m.value === posId);
            if (master) return master;
            return {
              label: `${item.persnum || ''} - (${item.abbreviation || ''}) ${item.positionText || item.labelJob || ''}`,
              labelJob: item.positionText || item.labelJob || '',
              value: posId,
              raw: item
            };
          }) || [];
        };

        selectedTertuju.value = mapApiToUI(d.penerima);
        selectedTembusan.value = mapApiToUI(d.tembusan);

        if (d.lampiran_files && Array.isArray(d.lampiran_files)) {
          existingFiles.value = d.lampiran_files.map((f: any): UploadedFile => ({
            id: f.id,
            fileName: f.fileName || f.file_name,
            filePath: f.fileUrl || f.file_path,
            fileSize: f.fileSize || 0
          }));
        }

        const draftSifat = String(d.sifat || 'biasa').toLowerCase();
        selectedSifat.value = sifatOptions.find(opt => opt.value === draftSifat) || sifatOptions[3];

        if (d.tanggal) {
          const dateParts = d.tanggal.split('-');
          if (dateParts.length === 3) {
            date.value = new CalendarDate(Number(dateParts[0]), Number(dateParts[1]), Number(dateParts[2]));
          }
        }
      }
    } catch (error) {
      console.error("Error loading draft detail:", error);
      toast.add({ title: 'Gagal memuat data draft', color: 'error' });
    }
  }

  isLoadingData.value = false;
});
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}
</style>
