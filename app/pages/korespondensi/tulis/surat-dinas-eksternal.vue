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

    <PageHeader title="Tulis Surat Dinas Eksternal" :items="breadcrumbs" />

    <UCard variant="soft" :ui="{
      root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm',
    }">

        <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
        </div>

        <div class="pt-2">
          <div class="flex justify-between items-center gap-4">
            <div class="flex gap-3 sm:gap-4">
              <USkeleton class="h-8 w-36 rounded" />
              <USkeleton class="h-8 w-36 rounded" />
            </div>
            <USkeleton class="h-8 w-36 rounded" />
          </div>
        </div>

        <div
          class="border border-gray-200 dark:border-gray-700 rounded-lg h-[400px] p-6 space-y-5 bg-white dark:bg-gray-800">
          <div class="flex gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
            <USkeleton class="h-12 w-12 rounded-full" />
            <div class="flex-1 space-y-2 pt-1">
              <USkeleton class="h-3 w-1/2" />
              <USkeleton class="h-3 w-1/3" />
            </div>
          </div>
          <div class="space-y-3 px-4">
            <USkeleton class="h-3 w-full" />
            <USkeleton class="h-3 w-full" />
            <USkeleton class="h-3 w-11/12" />
            <USkeleton class="h-3 w-full" />
          </div>
        </div>

        <USkeleton class="h-30 w-full rounded-md" />

        <div class="pt-6 border-t border-gray-100 dark:border-gray-800">
          <USkeleton class="h-10 w-32 rounded-lg" />
        </div>
      </div>


      <div v-else class="flex-1 overflow-y-auto space-y-1">

        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []"
          :loading="klasifikasiStatus === 'loading'" />

        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <TulisInputSifat v-model="selectedSifat" />

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tujuan Eksternal"
          :items="externalItems" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan"
          :items="internalItems" />

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

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Lampiran</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="lampiranText" :maxlength="maxPerihal"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Otomatis terisi saat upload file..." />
            </div>
          </div>
        </div>

        <div class="flex flex-col py-4">
          <TemplateManager :current-content="editorContent" @apply="handleApplyTemplate" />

          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">

              <div class="bg-white pt-10 pb-10 border-b border-gray-100 select-none text-black min-h-[1000px]">

                <div class="flex items-center pb-4 mb-6 px-10">
                  <div class="flex items-end gap-4">
                    <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
                    <div class="flex flex-col mb-1">
                      <span class="text-2xl font-bold tracking-wide text-[18px]">AirNav Indonesia</span>
                    </div>
                  </div>
                  <div class="ml-auto text-[10px] leading-[1.1] text-gray-700 text-left">
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

                <div class="flex mb-4 text-[14px] px-10">
                  <div>{{ user?.areaText?.replace('Kantor', '') || "Tangerang" }}, {{ formattedDate }}</div>
                </div>

                <div class="flex flex-col md:flex-row gap-8 mb-8 text-[14px] px-10">
                  <div class="w-full">
                    <table class="w-full align-top">
                      <tbody>
                        <tr>
                          <td class="w-[80px] align-top">Nomor</td>
                          <td class="w-[10px] align-top">:</td>
                          <td class="align-top">................................................</td>
                        </tr>
                        <tr>
                          <td class="align-top">Sifat</td>
                          <td class="align-top">:</td>
                          <td class="align-top capitalize">{{ selectedSifat?.label || 'Biasa' }}</td>
                        </tr>
                        <tr>
                          <td class="align-top">Lampiran</td>
                          <td class="align-top">:</td>
                          <td class="align-top">
                            {{ lampiranText || '-' }}
                          </td>
                        </tr>
                        <tr>
                          <td class="align-top">Perihal</td>
                          <td class="align-top">:</td>
                          <td class="align-top font-bold text-justify">
                            {{ subject || "................................................" }}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div class="mt-5">Kepada Yth.</div>
                    <div class="font-bold mb-1">
                      <div v-if="selectedTertuju.length > 5">
                        Periksa Alamat Terlampir
                      </div>
                      <div v-else-if="selectedTertuju.length > 0">
                        <div v-for="(t, index) in selectedTertuju" :key="t.value">
                          {{ t.label }}
                        </div>
                      </div>
                      <div v-else>
                        <div>................................................</div>
                      </div>
                    </div>
                    <div class="mb-1">Di Tempat</div>
                  </div>
                </div>

                <div class="min-h-[300px] relative group">
                  <Editor api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" />
                  <div v-if="!editorContent"
                    class="absolute top-0 left-10 text-gray-400 pointer-events-none italic z-0 mt-2">
                    Ketik isi surat di sini...
                  </div>
                </div>

                <div class="flex justify-end mt-12 text-black px-10">
                  <div class="text-center min-w-[250px]">
                    <div class="mb-24 text-[14px]">
                      <div class="font-bold">{{ user?.positionText || 'Nama Jabatan' }}</div>
                    </div>
                    <div class="font-bold text-[14px] underline">{{ user?.nama || 'Nama Lengkap' }}</div>
                  </div>
                </div>

                <div class="mt-8 text-[12px] text-black px-10">
                  <div class="font-bold underline mb-1">Tembusan :</div>
                  <div v-if="selectedTembusan.length > 5" class="ml-4 pl-2">
                    Periksa Alamat Terlampir
                  </div>
                  <ol v-else-if="selectedTembusan.length > 0" class="list-decimal ml-4 pl-2">
                    <li v-for="t in selectedTembusan" :key="t.value">{{ t.labelJob + " - " + t.raw.area_text }}</li>
                  </ol>
                  <div v-else class="ml-4 pl-2 text-gray-400 italic">...</div>
                </div>

                <div v-if="selectedTertuju.length > 5 || selectedTembusan.length > 5"
                  class="bg-white px-12 py-12 border-t-4 border-gray-200 text-black break-before-page mt-10">

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
                        {{ item.label }}
                      </li>
                    </ol>
                  </div>

                  <div v-if="selectedTembusan.length > 5">
                    <div class="font-bold text-[14px] mb-2 uppercase">TEMBUSAN :</div>
                    <ol class="list-decimal ml-6 text-[14px] space-y-1">
                      <li v-for="item in selectedTembusan" :key="item.value">
                        {{ item.labelJob + " - " + item.raw.area_text }}
                      </li>
                    </ol>
                  </div>
                </div>

              </div>
            </div>
          </ClientOnly>

          <div class="flex items-center py-3 mt-2 gap-2">
            <input type="checkbox" id="check_english" v-model="isEnglish"
              class="w-4 h-4 shrink-0 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-900 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer" />
            <label for="check_english"
              class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Aktifkan Format Bahasa Inggris
            </label>
          </div>

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
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Pilih Metode Tanda Tangan
          </h3>
        </div>
      </template>

      <template #body>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Tentukan metode tanda tangan yang akan digunakan sebelum dokumen dikirim.
        </p>

        <div class="space-y-4">
          <label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition" :class="selectedSendType === 'digsig'
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'">
            <input type="radio" name="send_type" value="digsig" v-model="selectedSendType" class="mt-1" />

            <div class="flex flex-col flex-1">
              <span class="font-medium text-gray-900 dark:text-white">
                Tanda Tangan Digital (BSrE)
              </span>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Dokumen ditandatangani secara elektronik resmi (TTE).
              </span>

              <div v-if="selectedSendType === 'digsig'"
                class="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div class="flex items-start gap-4 p-4">
                  <div class="flex-shrink-0">
                    <div class="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <UIcon name="i-heroicons-user" class="w-6 h-6" />
                    </div>
                  </div>

                  <div class="flex flex-col">
                    <span class="text-xs text-gray-500 mb-0.5">
                      {{ signerInfo.label }}
                    </span>
                    <span class="text-sm text-gray-700 dark:text-gray-300 leading-tight mb-0.5">
                      {{ signerInfo.role }}
                    </span>
                    <span class="text-base font-semibold text-gray-900 dark:text-white">
                      {{ signerInfo.name }}
                    </span>
                  </div>
                </div>

                <div class="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div @click.stop>
                    <UFormGroup label="Passphrase" required>
                      <UInput type="password" v-model="passphrase" size="lg" placeholder="Masukkan passphrase TTE Anda"
                        class="w-full" autofocus />
                    </UFormGroup>
                  </div>
                </div>
              </div>
            </div>
          </label>

          <label class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition" :class="selectedSendType === 'qr_only'
            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'">
            <input type="radio" name="send_type" value="qr_only" v-model="selectedSendType" class="mt-1" />

            <div class="flex flex-col">
              <span class="font-medium text-gray-900 dark:text-white">
                Kirim Tanpa Tanda Tangan
              </span>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Dokumen dikirim tanpa proses tanda tangan digital.
              </span>
            </div>
          </label>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton label="Batal" color="secondary" size="lg" variant="ghost" @click="isPassphraseModalOpen = false" />
          <UButton label="Lanjutkan" color="primary" size="lg" icon="i-heroicons-paper-airplane"
            :loading="isLoadingData" @click="handlePassphraseSubmit" />
        </div>
      </template>
    </UModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import type { Editor as TinyMCEEditor } from 'tinymce';

// --- COMPONENTS ---
import TulisInputKlasifikasi from "@/components/Tulis/InputKlasifikasi.vue";
import TulisInputLampiran from "@/components/Tulis/InputLampiran.vue";
import TulisInputSifat from "@/components/Tulis/InputSifat.vue";
import TulisInputPenerima from "@/components/Tulis/InputPenerima.vue";
import TulisInputTanggal from "@/components/Tulis/InputTanggal.vue";
import TemplateManager from '@/components/Tulis/TemplateManager.vue';

// --- TYPES & COMPOSABLES ---
import type { Klasifikasi } from "~/types/klasifikasi";
import type { SDEPayload } from "~/types/sde";
import { useSde } from "~/composables/useSde";
import { Alert } from "@/composables/useAlert"; // Add this import
import { useDigSign } from "@/composables/useDigSign"; // Add this import

// const Alert = useAlert(); // Initialize Alert

// --- CONFIG ---
const route = useRoute();
const router = useRouter();
const toast = useToast();

const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
// Import getExternalRecipients dari composable
const { saveDraft, updateDraft, sendSDE, getSDEDetail, generatePdf, getExternalRecipients, getRecipientInfo } = useSde();

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Tulis Surat Dinas Eksternal", to: "#" },
];

const maxPerihal = 200;

// --- STATE ---
const isLoadingData = ref(false);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const alertState = useAlertState(); // Initialize alertState

const isPassphraseModalOpen = ref(false)
const selectedSendType = ref('digsig') // Default to 'digsig' as per instructions
const passphrase = ref('')

const signerInfo = computed(() => ({
  name: user.value?.nama || 'Nama Lengkap',
  role: user.value?.positionText || 'Jabatan',
  label: 'Ditandatangani secara digital oleh'
}))
const editDraftId = ref<string | null>(null);

// Form Basic
const subject = ref("");
const lampiranText = ref("");
const editorContent = ref("");
const tinymceEditor = ref<TinyMCEEditor | null>(null);
const isEnglish = ref(false);

// Date
const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));

// Klasifikasi & Files
const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref("idle");
const selectedKlasifikasiId = ref<string | null>(null);
const existingFiles = ref<any[]>([]);

// Selection State
const internalItems = ref<any[]>([]);
const selectedTembusan = ref<any[]>([]);
const selectedSifat = ref<any>(null);

// --- NEW SDE RECIPIENT STATE ---
const externalItems = ref<any[]>([]); // Data dropdown
const selectedTertuju = ref<any[]>([]); // Model input

// PDF State
const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");

// TinyMCE Config
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


// --- COMPUTED ---
const selectedKlasifikasi = computed(() =>
  klasifikasiList.value.find((b) => b.id === selectedKlasifikasiId.value)
);

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

// --- METHODS: PAYLOAD GENERATION ---
const getPayload = (): SDEPayload => {
  const tglDb = `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`;
  const tglDisplay = `${String(date.value.day).padStart(2, "0")}/${String(date.value.month).padStart(2, "0")}/${date.value.year}`;

  return {
    id_naskah: editDraftId.value || null,
    pengirim: user.value?.position || "",

    // UPDATE: Kirim Array of IDs dari Selected Tertuju
    penerima: selectedTertuju.value.map(item => item.value),
    english: isEnglish.value || false,
    tembusan: selectedTembusan.value.map(i => i.value),
    klasifikasi: selectedKlasifikasi.value?.klasifikasi || "",
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || "",
    sifat: selectedSifat.value?.value || "biasa",
    perihal: subject.value,
    lampiran: lampiranText.value,
    konten: editorContent.value,
    htmlContent: editorContent.value,
    nama_tempat: user.value?.areaText || "Tangerang",
    nama_jabatan: user.value?.positionText || "",
    nama_lengkap: user.value?.nama || "",
    tgl: tglDb,
    tanggal: tglDisplay,
    lampiran_temp_ids: existingFiles.value.map(f => f.id).filter(id => !!id)
  };
};

const createFormData = (payload: SDEPayload, includePdf: boolean = false) => {
  const formData = new FormData();

  Object.keys(payload).forEach((key) => {
    const k = key as keyof SDEPayload;
    if (k === 'tanggal') return;

    const value = payload[k];

    // Penerima dan Tembusan dikirim sebagai stringified array (standard multipart)
    if (k === 'penerima' || k === 'tembusan' || k === 'lampiran_temp_ids') {
      formData.append(k, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      formData.append(k, String(value));
    }
  });

  if (includePdf && pdfBlob.value) {
    const judul = payload.perihal || 'dokumen_sde';
    const safeName = judul.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
    formData.append("final_pdf", pdfBlob.value, `SDE_${safeName}.pdf`);
  }

  return formData;
};

const validateAndToast = (payload: SDEPayload) => {
  // 1. Cek Perihal
  if (!payload.perihal || payload.perihal.trim() === '') {
    toast.add({ title: 'Gagal', description: 'Perihal surat wajib diisi', color: 'error' });
    return false;
  }

  // 2. Cek Penerima
  if (!payload.penerima || payload.penerima.length === 0) {
    toast.add({ title: 'Gagal', description: 'Penerima (Tertuju) wajib dipilih', color: 'error' });
    return false;
  }

  // 3. CEK KONTEN (EDITOR)
  const rawHtml = payload.konten || "";

  // Bersihkan tag HTML untuk cek teks murni
  // Contoh: "<p><br></p>" menjadi ""
  const textOnly = rawHtml.replace(/<[^>]*>/g, '').trim();

  // Cek khusus: jika ada gambar <img>, dianggap tidak kosong
  const hasImage = rawHtml.includes('<img');

  // Jika teks kosong DAN tidak ada gambar -> ERROR
  if (!textOnly && !hasImage) {
    toast.add({
      title: 'Konten Kosong',
      description: 'Mohon isi badan surat terlebih dahulu.',
      color: 'error'
    });
    return false;
  }

  return true;
};

// --- ACTIONS ---
const handlePreview = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) return;

  isLoadingData.value = true;
  loadingMessage.value = "Memproses Pratinjau...";

  try {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);

    const fd = createFormData(payload, false);
    const blob = await generatePdf(fd);

    pdfBlob.value = new Blob([blob], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(pdfBlob.value);
    isOpenPreview.value = true;
  } catch (err) {
    console.error(err);
    toast.add({ title: 'Gagal membuat preview', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const handleSaveDraft = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) throw new Error("Validation failed");

  try {
    loadingMessage.value = "Menyimpan Draft...";
    isLoadingData.value = true;

    const fd = createFormData(payload, false);
    let res;

    if (editDraftId.value) {
      res = await updateDraft(fd, editDraftId.value);
    } else {
      res = await saveDraft(fd);
    }

    if (res?.success) {
      toast.add({ title: 'Berhasil', description: 'Draft berhasil disimpan', color: 'success' });
      if (res.data?.id) editDraftId.value = res.data.id;
    } else {
      throw new Error(res?.data?.message || 'Gagal menyimpan draft');
    }
  } catch (e: any) {
    console.error("Gagal simpan draft:", e);
    throw new Error(e.response?.data?.message || 'Gagal memperbarui draft');
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
    await handleSaveDraft();
    Alert.close();
  } catch (error) {
    console.error(error);
    Alert.close();
  }
};

const handleKirimDokumen = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) return;

  try {
    loadingMessage.value = "Mengirim Surat Dinas Eksternal...";
    isLoadingData.value = true;

    let nikValue = '';

    if (selectedSendType.value === 'digsig') {
      const { getKtp } = useDigSign();
      try {
        const ktpResponse = await getKtp();
        if (ktpResponse?.data?.noktp) {
          nikValue = ktpResponse.data.noktp;
        } else {
          throw new Error("NIK pengguna tidak ditemukan untuk TTE.");
        }
      } catch (err) {
        console.error("Gagal mengambil data KTP:", err);
        throw new Error("Gagal mengambil data KTP untuk verifikasi TTE");
      }
    }

    const fdPreview = createFormData(payload, false);
    const blobResponse = await generatePdf(fdPreview);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });

    const fdFinal = createFormData(payload, true);

    fdFinal.append('passphrase', passphrase.value);
    fdFinal.append('sign_option', selectedSendType.value);

    if (nikValue) {
      fdFinal.append('nik', nikValue);
    }

    const res = await sendSEE(fdFinal);

    if (res?.success) {
      if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
      toast.add({ title: 'Berhasil', description: 'Surat Dinas Eksternal terkirim', color: 'success' });
      Alert.close();
      router.push("/korespondensi/terkirim");
    } else {
      throw new Error(res?.data?.message || 'Pengiriman gagal');
    }
  } catch (e: any) {
    isLoadingData.value = false;
    Alert.close();

    console.error("Gagal mengirim:", e);
    let errMsg = e.response?.data?.message || e.message || 'Gagal mengirim dokumen';

    if (errMsg.toLowerCase().includes('passphrase')) {
      isPassphraseModalOpen.value = true;
    }

    toast.add({
      title: 'Gagal Mengirim',
      description: errMsg,
      color: 'error'
    });
  } finally {
    isLoadingData.value = false;
  }
};

const handlePassphraseSubmit = async () => {
  // 1. Validasi Input Modal
  if (!selectedSendType.value) {
    toast.add({ title: 'Wajib Diisi', description: 'Pilih metode tanda tangan', color: 'warning' });
    return;
  }
  if (selectedSendType.value === 'digsig' && !passphrase.value) {
    toast.add({ title: 'Wajib Diisi', description: 'Harap masukkan passphrase Anda', color: 'warning' });
    return;
  }

  // 2. Tutup Modal Passphrase dulu
  isPassphraseModalOpen.value = false;

  // 3. Konfirmasi Akhir
  const isConfirmed = await Alert.confirm(
    'Konfirmasi Akhir',
    'Dokumen akan dikirim dan ditandatangani. Lanjutkan?',
    'Ya, Kirim',
    'Batal',
    false
  );

  if (!isConfirmed) return;

  // 4. Mulai Proses
  const payload = getPayload();
  isLoadingData.value = true;
  loadingMessage.value = "Mengirim...";

  try {
    let nikValue = '';
    // ... (Logic KTP UseDigSign TETAP SAMA) ...
    if (selectedSendType.value === 'digsig') {
      const { getKtp } = useDigSign();
      try {
        const ktpResponse = await getKtp();
        if (ktpResponse?.data?.noktp) {
          nikValue = ktpResponse.data.noktp;
        } else {
          throw new Error("NIK pengguna tidak ditemukan untuk TTE.");
        }
      } catch (err) {
        throw new Error("Gagal mengambil data KTP untuk verifikasi TTE");
      }
    }

    // Generate Preview untuk Final
    const fdPreview = createFormData(payload, false);
    const blobResponse = await generatePdf(fdPreview);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });

    // Final Payload
    const fdFinal = createFormData(payload, true);
    fdFinal.append('passphrase', passphrase.value);
    fdFinal.append('sign_option', selectedSendType.value);
    if (nikValue) fdFinal.append('nik', nikValue);

    // Kirim API
    let res;
    if (editDraftId.value) {
      res = await sendSDE(fdFinal);
    } else {
      res = await sendSDE(fdFinal);
    }

    // PERBAIKAN LOGIC RESPONSE
    if (res?.success || res?.data?.success) {
      toast.add({ title: 'Berhasil', description: 'Surat Dinas Internal terkirim', color: 'success' });
      router.push("/korespondensi/terkirim");
    } else {
      // TAMBAHKAN INI: Lempar error jika success false
      throw new Error(res?.data?.message || res?.message || 'Gagal mengirim dokumen');
    }

  } catch (e: any) {
    console.error("Error Kirim:", e);

    // Jika error karena passphrase salah, buka modal lagi
    let errMsg = e.response?.data?.message || e.message;
    if (errMsg && errMsg.toLowerCase().includes('passphrase')) {
       isPassphraseModalOpen.value = true;
    }

    toast.add({ title: 'Gagal Mengirim', description: errMsg, color: 'error' });
  } finally {
    isLoadingData.value = false;
    Alert.close(); // Pastikan alert tertutup
  }
};


const confirmKirimDokumen = async () => {
  // Validasi dulu
  const payload = getPayload();
  if (!validateAndToast(payload)) return;

  // Tutup Preview
  // isOpenPreview.value = false;

  // Reset & Buka Modal Passphrase
  passphrase.value = "";
  selectedSendType.value = "digsig";
  isPassphraseModalOpen.value = true;
};


// --- LIFECYCLE ---
onMounted(async () => {
  isLoadingData.value = true;
  loadingMessage.value = "Memuat...";
  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";
    const [klasRes, internalRecRes, externalRecRes] = await Promise.all([
      getKlasifikasi(),
      getRecipientInfo(user.value?.position),
      getExternalRecipients()
    ]);

    klasifikasiList.value = klasRes;

    // --- MAPPING EXTERNAL (TERTUJU) ---
    if (externalRecRes?.success && Array.isArray(externalRecRes.data)) {
      externalItems.value = externalRecRes.data.map((item: any) => ({
        label: item.nama,
        value: item.id,
        raw: item,
      }));
    }

    // --- MAPPING INTERNAL (TEMBUSAN) ---
    const rawRec = internalRecRes.rawRecipients || [];

    const mapInternalItems = (list: any[]) => list.map((r: any) => ({
      // Mapping sudah sesuai dengan JSON response API
      label: `${r.persnum_person_text || r.persnum_person || r.persnum} - (${r.position_abbreviation || r.abbreviation || '-'}) ${r.position_text || r.positionText}`,
      labelJob: r.position_text || r.positionText,
      value: String(r.position || r.position_id || r.id),
      raw: r
    }));

    let flatRecipients: any[] = [];
    if (Array.isArray(rawRec)) {
      flatRecipients = rawRec;
    } else {
      Object.values(rawRec).forEach((arr: any) => flatRecipients.push(...arr));
    }
    internalItems.value = mapInternalItems(flatRecipients);

    klasifikasiStatus.value = "success";

    // --- LOAD DRAFT ---
    const draftId = route.query.draft_id as string;
    if (draftId) {
      editDraftId.value = draftId;
      loadingMessage.value = "Memuat draft...";

      const resDraft = await getSDEDetail(draftId);
      if (resDraft.success && resDraft.data) {
        const d = resDraft.data;

        subject.value = d.perihal || "";
        lampiranText.value = d.lampiran || "";
        editorContent.value = d.konten || "";
        if (tinymceEditor.value) tinymceEditor.value.setContent(d.konten || "");

        if (d.klasifikasi) {
          const found = klasifikasiList.value.find(k => k.klasifikasi === d.klasifikasi);
          if (found) selectedKlasifikasiId.value = found.id;
        }

        // --- POPULATE TERTUJU & TEMBUSAN ---

        // 1. Populate Tertuju (External)
        if (d.penerima && Array.isArray(d.penerima)) {
          selectedTertuju.value = d.penerima.map((item: any) => ({
            label: item.nama,
            value: item.id,
            raw: item
          }));
        }

        // 2. Populate Tembusan (Internal)
        if (d.tembusan && Array.isArray(d.tembusan)) {
          const tembusanIds = d.tembusan.map((t: any) =>
            // PERBAIKAN: Tambahkan 't.position' di sini sesuai JSON response
            typeof t === 'object' ? String(t.position || t.position_id || t.id || t.value) : String(t)
          );

          selectedTembusan.value = internalItems.value.filter(item =>
            tembusanIds.includes(String(item.value))
          );
        }

        if (d.lampiran_files) {
          existingFiles.value = d.lampiran_files.map((f: any) => ({
            id: f.id,
            fileName: f.fileName || f.file_name,
            filePath: f.fileUrl || f.file_path,
            fileSize: f.fileSize || 0
          }));
        }
      }
    }

  } catch (e) {
    console.error(e);
    toast.add({ title: 'Gagal memuat data awal', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
});

// Watch Existing Files untuk update text lampiran otomatis
watch(existingFiles, (newFiles) => {
  const jumlah = newFiles ? newFiles.length : 0;
  if (jumlah > 0) {
    lampiranText.value = `${jumlah} Lampiran`;
  } else {
    lampiranText.value = "0 Lampiran";
  }
}, { deep: true, immediate: true });
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}
</style>
