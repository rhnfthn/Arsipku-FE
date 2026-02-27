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
              style="animation-duration: 1.5s;"></div>
            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg relative z-10">
              <div class="plane-float">
                <UIcon name="i-lucide-plane" class="w-8 h-8 text-[#457fb6] -rotate-45" />
              </div>
            </div>
          </div>
          <div class="flex flex-col items-center gap-2">
            <span class="text-gray-900 font-semibold text-lg">{{ loadingMessage || 'Memproses Data' }}</span>
            <span class="text-sm text-gray-600">Mohon tunggu sebentar</span>
          </div>
        </div>
      </div>
    </Teleport>

    <PageHeader title="Tulis Lanjut Nota Dinas" :items="breadcrumbs" />
<!-- {{refData?.[0]?.final_pdf_url}} -->
    <div v-if="refData" class="mb-4 mt-6">
      <div class="rounded-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm overflow-hidden">
        <div @click="isRefExpanded = !isRefExpanded"
          class="flex items-center align-center justify-between px-5 py-3 cursor-pointer bg-white hover:bg-gray-50 dark:hover:bg-primary-900/30 transition-colors border-b border-primary-100 dark:border-primary-800/50">
          <div class="flex items-center py-2 gap-3">
            <div class="p-0.5 rounded-md bg-primary-500 text-white shadow-sm w-9 h-9 flex items-center justify-center">
              <UIcon name="i-lucide-mail" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-gray-800 dark:text-white leading-none mb-0.5">Referensi Surat Asal</h3>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                {{ refData?.[0].nomor || '-' }} • {{ formatDateRef(refData?.[0].tanggal) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': isRefExpanded }" />
          </div>
        </div>

        <div v-show="isRefExpanded" class="bg-gray-100 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
          <div v-if="refPdfUrl" class="w-full">
             <iframe :src="`${refPdfUrl}#toolbar=0&navpanes=0`" class="w-full h-[500px] border-none"
              title="Preview Surat Referensi"></iframe>
          </div>
          <div v-else class="flex flex-col items-center justify-center h-[300px] text-gray-500 gap-2">
            <UIcon name="i-lucide-file-x" class="w-12 h-12 opacity-30" />
            <span class="text-sm font-medium">Dokumen PDF tidak tersedia untuk ditampilkan.</span>
          </div>
        </div>
      </div>
    </div>

    <UCard variant="soft" :ui="{ root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm' }">

      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
        </div>
        <USkeleton class="h-30 w-full rounded-md mt-4" />
      </div>

      <div v-else class="flex-1 overflow-y-auto space-y-1">

        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []" :loading="klasifikasiStatus === 'loading'" />

        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tertuju" :items="items" :exclude-items="selectedTembusan" disabled-message="Sudah dipilih di Tembusan" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan" :items="items" :exclude-items="selectedTertuju" disabled-message="Sudah dipilih di Tertuju" />

        <TulisInputSifat v-model="selectedSifat" />

        <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
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
            <div class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">
              <div class="bg-white pt-10 pb-10 border-b border-gray-100 select-none text-black">
                <div class="bg-white px-8 pt-8 pb-4 border-b border-gray-100 select-none">
                  <div class="flex items-center pb-2 mb-6">
                    <div class="flex items-end gap-4">
                      <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
                      <div class="flex flex-col mb-1">
                        <span class="text-2xl font-bold tracking-wide text-[18px] text-black">AirNav Indonesia</span>
                      </div>
                    </div>
                    <div class="ml-auto text-[10px] leading-[1.1] text-gray-700 text-left">
                      <div class="font-bold uppercase">{{ user?.alamatInfo?.kantor }}</div>
                      <div>{{ user?.alamatInfo?.gedung }} {{ user?.alamatInfo?.kota }}</div>
                      <div v-html="user?.alamatInfo?.alamat"></div>
                    </div>
                  </div>
                  <div class="text-center mb-6 text-black">
                    <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">NOTA DINAS</h1>
                    <p class="text-lg mt-1 text-[14px]">Nomor : ..............................................</p>
                  </div>
                  <table class="w-[50%] mx-auto text-lg leading-relaxed mb-4 tn-roman text-black">
                    <tbody>
                      <tr>
                        <td class="text-[14px] w-[120px] font-bold align-top">Kepada Yth.</td>
                        <td class="text-[14px] w-[20px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          <span v-if="selectedTertuju.length > 5">Periksa Alamat Terlampir</span>
                          <span v-else v-html="selectedTertuju.length ? selectedTertuju.map((s: any, i: number) => selectedTertuju.length === 1 ? `<div>${s.labelJob || s.label}</div>` : `<div style='margin-left:1em;text-indent:-1em'>${i + 1}. ${s.labelJob || s.label}</div>`).join('') : '................................................'"></span>
                        </td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Dari</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top">{{ user?.positionText || 'Posisi' }}</td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Perihal</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top">{{ subject || "................................................" }}</td>
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
                    <div v-if="selectedTembusan.length > 5" class="ml-4 pl-2">Periksa Alamat Terlampir</div>
                    <div v-else-if="selectedTembusan.length === 1" class="ml-4 pl-2">{{ selectedTembusan[0]?.labelJob || selectedTembusan[0]?.label }}</div>
                    <ol v-else-if="selectedTembusan.length > 1" class="list-decimal ml-4 pl-2">
                      <li v-for="t in selectedTembusan" :key="t.value">{{ t.labelJob || t.label }}</li>
                    </ol>
                    <div v-else class="text-gray-400 italic">...</div>
                  </div>
                </div>
              </div>
            </div>
          </ClientOnly>

          <TulisInputLampiran v-model:existingFiles="existingFiles" />
        </div>

        <div class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-800">
          <UButton label="Pratinjau" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold" @click="handlePreview" />
        </div>
      </div>
    </UCard>

    <USlideover v-model:open="isOpenPreview" title="Pratinjau" side="bottom" :dismissible="!alertState.isOpen" :ui="{ content: 'h-screen max-h-screen', body: 'p-0', footer: 'p-4 border-t border-gray-200 dark:border-gray-800' }">
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
          <UButton label="Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text" class="px-8" @click="confirmSaveDraft" />
          <UButton label="Kirim" color="primary" size="lg" icon="i-heroicons-paper-airplane" class="px-8 font-bold" @click="confirmKirimDokumen" />
        </div>
      </template>
    </USlideover>

    <UModal v-model:open="isPassphraseModalOpen" :dismissible="false" :ui="{ overlay: 'bg-black/50 backdrop-blur-sm' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Pilih Metode Tanda Tangan</h3>
        </div>
      </template>
      <template #body>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Tentukan metode tanda tangan yang akan digunakan sebelum dokumen dikirim.</p>
        <div class="space-y-4">
          <label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition" :class="selectedSendType === 'digsig' ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'">
            <input type="radio" name="send_type" value="digsig" v-model="selectedSendType" class="mt-1" />
            <div class="flex flex-col flex-1">
              <span class="font-medium text-gray-900 dark:text-white">Tanda Tangan Digital (BSrE)</span>
              <span class="text-sm text-gray-600 dark:text-gray-400">Dokumen ditandatangani secara elektronik resmi (TTE).</span>
              <div v-if="selectedSendType === 'digsig'" class="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div class="flex items-start gap-4 p-4">
                  <div class="flex-shrink-0">
                    <div class="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white"><UIcon name="i-heroicons-user" class="w-6 h-6" /></div>
                  </div>
                  <div class="flex flex-col">
                    <span class="text-xs text-gray-500 mb-0.5">{{ signerInfo.label }}</span>
                    <span class="text-sm text-gray-700 dark:text-gray-300 leading-tight mb-0.5">{{ signerInfo.role }}</span>
                    <span class="text-base font-semibold text-gray-900 dark:text-white">{{ signerInfo.name }}</span>
                  </div>
                </div>
                <div class="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div @click.stop><UFormGroup label="Passphrase" required><UInput type="password" v-model="passphrase" size="lg" placeholder="Masukkan passphrase TTE Anda" class="w-full" autofocus /></UFormGroup></div>
                </div>
              </div>
            </div>
          </label>
          <label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition" :class="selectedSendType === 'qr_only' ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'">
            <input type="radio" name="send_type" value="qr_only" v-model="selectedSendType" class="mt-1" />
            <div class="flex flex-col">
              <span class="font-medium text-gray-900 dark:text-white">Kirim Tanpa Tanda Tangan</span>
              <span class="text-sm text-gray-600 dark:text-gray-400">Dokumen dikirim tanpa proses tanda tangan digital.</span>
            </div>
          </label>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Batal" color="secondary" size="lg" variant="ghost" @click="isPassphraseModalOpen = false" />
          <UButton label="Lanjutkan" color="primary" size="lg" icon="i-heroicons-paper-airplane" :loading="isLoadingData" @click="handlePassphraseSubmit" />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import type { Editor as TinyMCEEditor } from 'tinymce';
import { Hash, Calendar, Tag } from "lucide-vue-next";

// Components
import TulisInputKlasifikasi from "@/components/Tulis/InputKlasifikasi.vue";
import TulisInputLampiran from "@/components/Tulis/InputLampiran.vue";
import TulisInputSifat from "@/components/Tulis/InputSifat.vue";
import TemplateManager from '@/components/Tulis/TemplateManager.vue';

// Types & Validation
import type { Klasifikasi } from "~/types/klasifikasi";
import { validateDraftPayload, type DraftPayload } from "~/types/nota-dinas";
import { Alert } from "@/composables/useAlert";

// Composables
import { useDigSign } from "@/composables/useDigSign";
import { useInbox } from "@/composables/useInbox";

// Interfaces
interface RecipientItem { label: string; labelJob: string; value: string; raw: any; }
interface SifatOption { label: string; value: string; }
interface UploadedFile { id: string; fileName: string; filePath: string; fileSize: number; }

const route = useRoute();
const router = useRouter();
const toast = useToast();

const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { getRecipients } = useRecipients();
const { isLoadingDraft, getDraftDetail } = useDraft();
const { generatePdf, sendNotaDinas, saveDraft: saveND } = useNotaDinas();
const { getKtp } = useDigSign();

// PENTING: Destructure composable
const { fetchInboxDetail } = useInbox();

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Detail", to: "#" },
  { label: "Tulis Lanjut Nota Dinas", to: "#" },
];

const maxPerihal = 200;
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
  setup(editor: TinyMCEEditor) { tinymceEditor.value = editor; }
};

const sifatOptions: SifatOption[] = [
  { label: "Sangat Rahasia", value: "sangat rahasia" },
  { label: "Rahasia", value: "rahasia" },
  { label: "Terbatas", value: "terbatas" },
  { label: "Biasa / Terbuka", value: "biasa" }
];

// STATE
const isLoadingData = ref(false);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const alertState = useAlertState();
const isPassphraseModalOpen = ref(false);
const selectedSendType = ref('');
const passphrase = ref('');
const refData = ref<any>(null);
const isRefExpanded = ref(true);
const editDraftId = ref<string | null>(null);
const subject = ref("");
const editorContent = ref("");
const english = ref(false);
const tinymceEditor = ref<TinyMCEEditor | null>(null);
const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));
const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const selectedKlasifikasiId = ref<string | null>(null);
const existingFiles = ref<UploadedFile[]>([]);
const selectedSifat = ref<SifatOption | null>(null);
const items = ref<RecipientItem[]>([]);
const selectedTertuju = ref<RecipientItem[]>([]);
const selectedTembusan = ref<RecipientItem[]>([]);
const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");

// COMPUTED PROPERTIES
const signerInfo = computed(() => ({
  name: user.value?.nama || 'Nama Lengkap',
  role: user.value?.positionText || 'Jabatan',
  label: 'Ditandatangani secara digital oleh'
}));

const selectedKlasifikasi = computed(() => klasifikasiList.value.find((b) => b.id === selectedKlasifikasiId.value));

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

const formatDateRef = (dateString: string) => {
  if (!dateString) return "-";
  try { return new Date(dateString).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return dateString; }
};

// LOGIKA PDF URL
const refPdfUrl = computed(() => {
  if (!refData.value || refData.value.length === 0) return '';

  const item = refData.value[0];

  if (item.final_pdf_url) return item.final_pdf_url;

  if (item.lampiran_files && item.lampiran_files.length > 0) {
    const file = item.lampiran_files[0];
    return file.file_url || file.file_path || file.url || '';
  }

  return '';
});

// METHODS
const validateAndToast = (payload: DraftPayload) => {
  const validationResult = validateDraftPayload(payload);
  if (!validationResult.isValid) {
    const errorKeys = Object.keys(validationResult.errors || {});
    const firstKey = errorKeys.length > 0 ? errorKeys[0] : null;
    toast.add({ title: 'Validasi Gagal', description: firstKey ? validationResult.errors![firstKey] : "Terjadi kesalahan input", icon: 'i-heroicons-x-circle-20-solid', color: 'error' });
    return false;
  }
  return true;
};

const getBasePayload = () => {
  const tglDb = date.value ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}` : "";
  const tglPreview = date.value ? `${String(date.value.day).padStart(2, "0")}/${String(date.value.month).padStart(2, "0")}/${date.value.year}` : "";
  const lampiranIds = existingFiles.value.map((f) => f.id).filter((id): id is string => !!id);

  return {
    id_naskah: editDraftId.value || null,
    id_referensi_naskah: (route.query.ref_id as string) || null,
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

const createFormData = (payload: any, includePdf: boolean = false) => {
  const formData = new FormData();
  Object.keys(payload).forEach((key) => {
    const value = payload[key];
    if (Array.isArray(value)) formData.append(key, JSON.stringify(value));
    else if (value !== null && value !== undefined) formData.append(key, String(value));
  });
  if (includePdf && pdfBlob.value) {
    const safeDate = payload.tanggal ? payload.tanggal.replace(/\//g, '-') : 'draft';
    formData.append("final_pdf", pdfBlob.value, `nota_dinas_${safeDate}.pdf`);
  }
  return formData;
};

const handleApplyTemplate = (htmlContent: string) => {
  if (tinymceEditor.value) {
    tinymceEditor.value.setContent(htmlContent.trim().replace(/>\s+</g, '><'));
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
    const formData = createFormData(payload, false);
    const blobResponse = await generatePdf(formData);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(pdfBlob.value);
    isOpenPreview.value = true;
  } catch (err) {
    toast.add({ title: 'Gagal Preview', color: 'error' });
  } finally { isLoadingData.value = false; }
};

const confirmSaveDraft = async () => {
  const isConfirmed = await Alert.confirm('Simpan sebagai Draft?', 'Dokumen akan disimpan ke folder draft.', 'Ya, Simpan', 'Batal', false);
  if (isConfirmed) try { await handleSaveDraft(); Alert.close(); } catch (error) { console.error(error); Alert.close(); }
};

const handleSaveDraft = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;
  try {
    loadingMessage.value = "Menyimpan Draft...";
    isLoadingData.value = true;
    const formData = createFormData(payload, false);
    await saveND(formData, editDraftId.value);
    toast.add({ title: 'Berhasil', description: 'Draft berhasil disimpan', color: 'success' });
    router.push("/korespondensi/draf");
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e.response?.data?.message || 'Gagal memperbarui draft', color: 'error' });
  } finally { isLoadingData.value = false; }
};

const confirmKirimDokumen = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;
  passphrase.value = "";
  selectedSendType.value = "digsig";
  isPassphraseModalOpen.value = true;
};

const handlePassphraseSubmit = async () => {
  if (!selectedSendType.value) { toast.add({ title: 'Wajib Diisi', description: 'Pilih metode tanda tangan', color: 'warning' }); return; }
  if (selectedSendType.value === 'digsig' && !passphrase.value) { toast.add({ title: 'Wajib Diisi', description: 'Harap masukkan passphrase Anda', color: 'warning' }); return; }
  isPassphraseModalOpen.value = false;
  if (await Alert.confirm('Konfirmasi Akhir', 'Kirim dokumen sekarang?', 'Ya, Kirim', 'Periksa Lagi', false)) await handleKirimDokumen();
};

const handleKirimDokumen = async () => {
  const payload = getBasePayload();
  try {
    loadingMessage.value = "Mengirim Nota Dinas...";
    isLoadingData.value = true;
    let noktpValue = '';
    if (selectedSendType.value === 'digsig') {
      try {
        const ktpResponse = await getKtp();
        if (ktpResponse?.data?.noktp) noktpValue = ktpResponse.data.noktp;
      } catch (err) { console.error(err); throw new Error("Gagal mengambil data KTP"); }
    }
    const blobResponse = await generatePdf(createFormData(payload, false));
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });
    const formData = createFormData(payload, true);
    formData.append('passphrase', passphrase.value);
    formData.append('sign_option', selectedSendType.value);
    if (noktpValue) formData.append('nik', noktpValue);
    const result = await sendNotaDinas(formData);
    if (result.data.success) {
      if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
      toast.add({ title: 'Berhasil', description: 'Nota Dinas berhasil dikirim', color: 'success' });
      Alert.close();
      router.push("/korespondensi/terkirim");
    } else { throw new Error(result.data.message || 'Pengiriman gagal'); }
  } catch (e: any) {
    let errMsg = e.response?.data?.message || e.message || 'Gagal mengirim dokumen';
    if (errMsg.toLowerCase().includes('passphrase')) isPassphraseModalOpen.value = true;
    toast.add({ title: 'Gagal Mengirim', description: errMsg, color: 'error' });
  } finally { isLoadingData.value = false; Alert.close(); }
};

// LIFECYCLE ONMOUNTED
onMounted(async () => {
  loadingMessage.value = "Memuat...";
  isLoadingData.value = true;

  if (!user.value) await getProfile();

  // --- LOGIC FETCH REFERENSI ---
  const refId = route.query.ref_id as string;
  const refJenis = route.query.ref_jenis as string;

  // Debug Log: Cek apakah ID terbaca dari URL
  console.log("OnMounted - Params dari URL:", { refId, refJenis });

  if (refId) {
    try {
      // Pastikan useInbox sudah diimport dan fetchInboxDetail dipanggil
      console.log("Memanggil fetchInboxDetail...");

      const result = await fetchInboxDetail(refId, refJenis);

      // Debug Log: Cek hasil API
      console.log("Hasil fetchInboxDetail:", result);

      if (result) {
        refData.value = result;
      } else {
        console.warn("API mengembalikan null/undefined");
        toast.add({ title: 'Info', description: 'Data referensi tidak ditemukan', color: 'gray' });
      }
    } catch (error) {
      console.error("Error Fetch Inbox Detail:", error);
      toast.add({ title: 'Error', description: 'Gagal memuat data referensi', color: 'error' });
    }
  }

  // --- INIT DATA LAINNYA ---
  try {
    klasifikasiStatus.value = "loading";
    klasifikasiList.value = await getKlasifikasi();
    klasifikasiStatus.value = "success";
    const resRec = await getRecipients();
    const rawData = resRec.recipients || resRec.data || [];
    items.value = rawData.map((r: any) => ({
      label: `${r.persnum_person_text || r.persnum || "empty"} - (${r.position_abbreviation || r.abbreviation}) ${r.position_text || r.positionText}`,
      labelJob: r.position_text || r.positionText,
      value: String(r.position || r.position_id || r.id),
      raw: r,
    }));
  } catch { klasifikasiStatus.value = "error"; }

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
        const mapApiToUI = (list: any[]) => list?.map(item => {
          const posId = String(item.position_id || item.position || item.value);
          const master = items.value.find(m => m.value === posId);
          return master || { label: `${item.persnum} - ${item.positionText}`, labelJob: item.positionText, value: posId, raw: item };
        }) || [];
        selectedTertuju.value = mapApiToUI(d.penerima);
        selectedTembusan.value = mapApiToUI(d.tembusan);
        if (d.lampiran_files) existingFiles.value = d.lampiran_files.map((f: any) => ({ id: f.id, fileName: f.fileName || f.file_name, filePath: f.fileUrl || f.file_path, fileSize: f.fileSize || 0 }));
        selectedSifat.value = sifatOptions.find(opt => opt.value === String(d.sifat).toLowerCase()) || sifatOptions[3];
        if (d.tanggal) {
          const p = d.tanggal.split('-');
          if (p.length === 3) date.value = new CalendarDate(Number(p[0]), Number(p[1]), Number(p[2]));
        }
      }
    } catch (e) { console.error(e); }
  }

  isLoadingData.value = false;
});
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}

.tox-fullscreen {
  z-index: 9999 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
}

.tox-dialog-wrap,
.tox-dropzone,
.tox-promotions {
  z-index: 10000 !important;
}
</style>
