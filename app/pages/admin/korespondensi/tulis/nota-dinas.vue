<template>
  <div class="">
    <div v-if="isLoadingData"
      class="fixed inset-0 z-[99999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-2">
        <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
        <span class="text-gray-600 font-medium">Memproses PDF...</span>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden transition-colors">
      <PageHeader title="Tulis Nota Dinas" :items="breadcrumbs" />
    </div>

    <UCard variant="soft" :ui="{
      root: 'rounded-t-none ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors',
    }">
      <div class="flex-1 overflow-y-auto space-y-1">
        <TulisInputBerkas v-model="selectedBerkasId" :items="berkasList || []" :loading="berkasStatus === 'loading'" />
        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Kepada ..." :items="items"
          :exclude-items="selectedTembusan" disabled-message="Sudah dipilih di Tembusan" />
        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Tembusan ..." :items="items"
          :exclude-items="selectedTertuju" disabled-message="Sudah dipilih di Tertuju" />

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm text-gray-500 font-medium shrink-0">Sifat</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedSifat" :items="sifatOptions" placeholder="Pilih sifat ..." class="w-full p-0"
              :search-input="{ placeholder: 'Cari sifat ...', size: 'lg' }" variant="none">
              <template #default>
                <div class="flex items-center gap-1.5 min-h-[28px] pr-10 w-full">
                  <span v-if="selectedSifat" class="text-sm font-medium text-left truncate max-w-[200px]">
                    {{ selectedSifat.label }}
                  </span>
                  <span v-else class="text-sm text-gray-400">Pilih sifat</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
            <input type="text" v-model="subject"
              class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
              placeholder="Ketik perihal" />
          </div>
        </div>

        <div class="flex flex-col py-4">
          <div class="flex items-center justify-between w-full gap-3">
            <UButton label="Pilih Template" color="primary" variant="soft" icon="i-heroicons-adjustments-horizontal"
              @click="isTemplateModalOpen = true" />

            <div class="flex gap-3 flex-shrink-0">
              <UButton label="Simpan Sebagai Template" icon="i-heroicons-plus" variant="soft" color="primary"
                @click="isAddTemplateOpen = true" />

              <UButton label="Template Saya" icon="i-heroicons-bookmark" variant="soft" color="primary"
                @click="isMyTemplateModalOpen = true" />
            </div>
          </div>

          <!-- Modal Pilih Template Publik -->
          <UModal v-model:open="isTemplateModalOpen" title="Pilih Template">
            <template #body>
              <div class="space-y-3">
                <UCard v-for="template in templates" :key="template.id">
                  <!-- Header -->
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-semibold text-gray-800">
                      {{ template.name }}
                    </h3>

                    <UButton label="Gunakan" size="xs" color="primary" variant="soft"
                      @click="applyTemplate(template)" />
                  </div>

                  <!-- Preview (TANPA border) -->
                  <iframe :srcdoc="template.content" class="w-full rounded bg-white"
                    style="height: 90px; pointer-events: none;" />
                </UCard>
              </div>
            </template>
          </UModal>

          <!-- Modal Simpan Template -->
          <UModal v-model:open="isAddTemplateOpen" :ui="{ width: 'sm:max-w-md' }">
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Simpan Template
              </h3>
            </template>

            <template #body>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nama Template
                  </label>
                  <UInput v-model="newTemplateName" placeholder="Masukkan nama template" icon="i-heroicons-tag"
                    size="lg" class="w-full" />
                </div>

                <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div class="flex items-start gap-2">
                    <UIicon name="i-heroicons-information-circle"
                      class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p class="text-sm text-blue-800 dark:text-blue-300">
                      Konten editor saat ini akan disimpan sebagai template
                      <strong>{{ newTemplateName || '(belum diberi nama)' }}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </template>

            <template #footer>
              <div class="flex w-full justify-end gap-3">
                <UButton label="Batal" variant="ghost" color="gray" @click="isAddTemplateOpen = false" />
                <UButton label="Simpan Template" color="primary" icon="i-heroicons-check-circle"
                  :disabled="!newTemplateName.trim()" @click="saveMyTemplate" />
              </div>
            </template>
          </UModal>

          <!-- Modal Template Saya -->
          <UModal v-model:open="isMyTemplateModalOpen" :ui="{ width: 'sm:max-w-xl' }">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mr-2">
                  Template Saya
                </h3>
                <UBadge color="primary" variant="subtle">
                  {{ myTemplates.length }}
                </UBadge>
              </div>
            </template>

            <template #body>
              <div class="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">

                <UCard v-for="template in myTemplates" :key="template.id"
                  class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div class="space-y-4">

                    <!-- Header (selaras dgn form label style) -->
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex items-center gap-2 flex-1 min-w-0">
                        <UIicon name="i-heroicons-bookmark-solid"
                          class="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {{ template.name }}
                        </h4>
                      </div>

                      <UButton icon="i-heroicons-trash" color="red" variant="ghost" size="xs"
                        @click.stop="deleteTemplate(template.id)" />
                    </div>

                    <!-- Content (samakan tone text + prose) -->
                    <div v-html="template.content" style="
                      font-family: 'Times New Roman', serif;
                      font-size: 14px;
                      line-height: 1.4;
                    "></div>

                    <!-- Action (posisi & feel sama) -->
                    <div class="flex justify-end pt-1">
                      <UButton label="Gunakan Template" size="sm" color="primary" @click="applyTemplate(template)" />
                    </div>
                  </div>
                </UCard>

                <!-- Empty state (selaras tone info box) -->
                <div v-if="myTemplates.length === 0"
                  class="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                  <UIicon name="i-heroicons-bookmark" class="w-10 h-10 mx-auto mb-2 text-gray-400" />
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Belum ada template tersimpan
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Klik "Simpan Sebagai Template" untuk menyimpan konten sebagai template
                  </p>
                </div>

              </div>
            </template>


            <template #footer>
              <div class="flex w-full justify-end">
                <UButton label="Tutup" variant="ghost" color="gray" @click="isMyTemplateModalOpen = false" />
              </div>
            </template>
          </UModal>

          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 dark:bg-gray-800 transition-all duration-300 relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">
              <div
                class="bg-white dark:bg-gray-900 px-8 pt-8 pb-4 border-b border-gray-100 dark:border-gray-700 select-none">
                <div class="flex items-center pb-2 mb-6">
                  <div class="flex items-end gap-4">
                    <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
                    <div class="flex flex-col mb-1">
                      <span class="text-2xl font-bold tracking-wide text-[18px] text-black dark:text-white">AirNav
                        Indonesia</span>
                    </div>
                  </div>
                  <div class="ml-auto text-[10px] leading-[1.1] text-gray-700 dark:text-gray-300 text-right">
                    <div class="font-bold">Kantor Pusat Perum LPPNPI</div>
                    <div>Gedung AirNav Indonesia</div>
                    <div>Jl. Ir. H. Juanda, Tangerang 15121</div>
                    <div>Banten – Indonesia</div>
                    <div>Telp: 021-5591 5000</div>
                    <div>Fax: 021-5591 5100</div>
                    <div>www.airnavindonesia.co.id</div>
                  </div>
                </div>

                <div class="text-center mb-6 text-black dark:text-white">
                  <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">
                    NOTA DINAS
                  </h1>
                  <p class="text-lg mt-1 text-[14px]">Nomor : ..............................................</p>
                </div>

                <table class="w-[50%] mx-auto text-lg leading-relaxed mb-4 tn-roman text-black dark:text-white">
                  <tbody>
                    <tr>
                      <td class="text-[14px] w-[120px] font-bold align-top">Kepada Yth.</td>
                      <td class="text-[14px] w-[20px] align-top">:</td>
                      <td class="text-[14px] align-top">
                        <span v-html="selectedTertuju.length
                          ? selectedTertuju
                            .map(
                              (s: any, i: number) =>
                                `<div style='margin-left:1em;text-indent:-1em'>
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
                        {{ selectedBerkas?.judulBerkas || "................................................" }}
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

              <div
                class="bg-white dark:bg-gray-900 px-8 pt-4 pb-8 border-t border-gray-100 dark:border-gray-700 select-none">
                <div class="flex justify-end mb-4 text-black dark:text-white">
                  <div class="text-center min-w-[250px]">
                    <div class="mb-24 text-[14px]">
                      <div>Tangerang, {{ formattedDate }}</div>
                      <div class="font-bold">{{ user?.positionText || 'Nama Jabatan' }}</div>
                    </div>
                    <div class="font-bold text-[14px]">{{ user?.nama || 'Nama Lengkap' }}</div>
                  </div>
                </div>
                <div class="text-[12px] mt-2 w-full text-left text-black dark:text-white">
                  <div class="font-bold underline mb-1">Tembusan :</div>
                  <ol v-if="selectedTembusan.length > 0" class="list-decimal ml-4 pl-2">
                    <li v-for="t in selectedTembusan" :key="t.value">
                      {{ t.labelJob || t.label }}
                    </li>
                  </ol>
                  <div v-else class="text-gray-400 italic">...</div>
                </div>
              </div>
            </div>
          </ClientOnly>

          <TulisInputLampiran v-model:uploaded="uploadedFiles" v-model:existingFiles="existingFiles" />
        </div>

        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end bg-white dark:bg-gray-800">
          <UButton label="Preview Dokumen" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold"
            @click="handlePreview" />
        </div>
      </div>
    </UCard>

    <USlideover v-model:open="isOpenPreview" title="Preview PDF" side="bottom" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
    }">
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full rounded-lg shadow-lg border border-gray-200" />
          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500">Memuat PDF...</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-4 w-full">
          <UButton label="Simpan Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text"
            class="px-8" :loading="isLoadingDraft" @click="handleSaveDraft" />
          <UButton label="Kirim Dokumen" color="primary" size="lg" icon="i-heroicons-paper-airplane"
            class="px-8 font-bold" @click="handleKirimDokumen" />
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/* IMPORTS                                                                    */
/* -------------------------------------------------------------------------- */
// ... IMPORTS tidak berubah ...
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import { useAuth } from "@/composables/useAuth";
import type { Editor as TinyMCEEditor } from 'tinymce';

// Types
import type { Berkas } from "~/types/berkas";
// Import validateDraftPayload dari types/drafts
import { validateDraftPayload, type DraftPayload } from "~/types/drafts";

/* -------------------------------------------------------------------------- */
/* COMPOSABLES                                                                */
/* -------------------------------------------------------------------------- */
const route = useRoute();
const router = useRouter();
const { saveDraft, sendMessage, isLoadingDraft, getDraftDetail } = useDraft();
const { getBerkasList } = useBerkas();
const { getRecipients } = useRecipients();
const { user, getProfile } = useAuth();
const toast = useToast(); // Inisialisasi Toast

const tinymceEditor = ref<TinyMCEEditor | null>(null);

/* -------------------------------------------------------------------------- */
/* STATE & REFS                                                               */
/* -------------------------------------------------------------------------- */
// --- UI State ---
const breadcrumbs = [
  { label: "Dashboard", to: "/user/dashboard" },
  { label: "Tulis Nota Dinas", to: "#" },
];

const isOpenPreview = ref(false);
const loading = ref(false);
const isLoadingData = ref(false); // Tambahkan state ini jika belum ada, untuk loading generate PDF
const myTemplates = ref<any[]>([]);
const isTemplateModalOpen = ref(false)
const isAddTemplateOpen = ref(false)
const isMyTemplateModalOpen = ref(false)
const newTemplateName = ref('')

// --- Form State ---
const editDraftId = ref<string | null>(null);
// TANGGAL SURAT KASIH DEFAULT HARI INI
const today = new Date();
const defaultDate = new CalendarDate(
  today.getFullYear(),
  today.getMonth() + 1,
  today.getDate()
);
const date = ref<CalendarDate>(defaultDate);
const subject = ref("");
const selectedSifat = ref();
const uploadedFiles = ref<File[]>([]);
const existingFiles = ref<any[]>([]);
const english = ref(false);

// --- Data Lists ---
const berkasList = ref<Berkas[]>([]);
const berkasStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const selectedBerkasId = ref<string | null>(null);

// --- Select Menu State ---
const items = ref<any[]>([]); // Master Data Penerima
const selectedTertuju = ref<any[]>([]);
const selectedTembusan = ref<any[]>([]);

// --- Editor ---
const content = ref("");
const editorContent = ref("");
const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");

// --- TinyMCE Config ---
// TOMBOL FULLSCREEN PINDAH KE KANAN
const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 400,
  menubar: false,
  promotion: false,
  branding: false,
  placeholder: 'Ketik konten disini...',
  plugins: 'lists advlist link image code table fullscreen',
  // Tombol fullscreen diletakkan di akhir toolbar
  toolbar: 'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist table | code | fullscreen',

  content_style: `
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 14pt;
    }
  `,

  setup(editor: TinyMCEEditor) {
    tinymceEditor.value = editor;
  }
};

// --- Options ---
// MOCK TEMPLATES (Bisa diisi dari data statis/API jika ada template publik)
const templates = [
  {
    id: 'list-decimal',
    name: 'List Angka (1,2,3)',
    content: '<ol><li>Poin pertama</li><li>Poin kedua</li><li>Poin ketiga</li></ol>'
  },
  {
    id: 'list-alpha',
    name: 'List Huruf (A,B,C)',
    content: '<ol type="A"><li>Poin A</li><li>Poin B</li><li>Poin C</li></ol>'
  },
  {
    id: 'bullet',
    name: 'Bullet List',
    content: '<ul><li>Item pertama</li><li>Item kedua</li><li>Item ketiga</li></ul>'
  },
  {
    id: 'table',
    name: 'Tabel',
    content:
      '<table border="1" width="100%" style="border-collapse:collapse;">' +
      '<tr><th>Kolom 1</th><th>Kolom 2</th></tr>' +
      '<tr><td>Isi</td><td>Isi</td></tr>' +
      '</table>'
  }
];


const sifatOptions = [{ label: "Rahasia", value: "rahasia" }, { label: "Biasa", value: "biasa" }];

/* -------------------------------------------------------------------------- */
/* COMPUTED PROPERTIES (Tidak Berubah)                                        */
/* -------------------------------------------------------------------------- */
const selectedBerkas = computed(() => berkasList.value.find((b) => b.id === selectedBerkasId.value));

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

// ... sortedItemsTertuju & sortedItemsTembusan (Tidak Berubah) ...
const sortedItemsTertuju = computed(() => {
  if (selectedTertuju.value.length === 0) return items.value;
  // Pisahkan yang terpilih dan belum
  const selectedVals = new Set(selectedTertuju.value.map(i => i.value));
  const selectedItems = items.value.filter(i => selectedVals.has(i.value));
  const unselectedItems = items.value.filter(i => !selectedVals.has(i.value));
  return [...selectedItems, ...unselectedItems];
});

const sortedItemsTembusan = computed(() => {
  if (selectedTembusan.value.length === 0) return items.value;
  const selectedVals = new Set(selectedTembusan.value.map(i => i.value));
  const selectedItems = items.value.filter(i => selectedVals.has(i.value));
  const unselectedItems = items.value.filter(i => !selectedVals.has(i.value));
  return [...selectedItems, ...unselectedItems];
});

/* -------------------------------------------------------------------------- */
/* HELPER METHODS (DIPERBAIKI)                                             */
/* -------------------------------------------------------------------------- */
const applyTemplate = async (t: any) => {
  if (!tinymceEditor.value) return;

  // BERSIHKAN HTML TEMPLATE
  const cleanContent = t.content
    .trim()                 // buang enter awal & akhir
    .replace(/>\s+</g, '><') // rapikan antar tag

  // Insert di cursor aktif (TIDAK menimpa konten lama)
  tinymceEditor.value.insertContent(cleanContent);

  // Sinkronkan ke v-model
  editorContent.value = tinymceEditor.value.getContent();

  // Tutup modal
  await nextTick();
  isTemplateModalOpen.value = false;
  isMyTemplateModalOpen.value = false;
};


// Fungsi Helper untuk Validasi dan Menampilkan Toast
const validateAndToast = (payload: DraftPayload) => {
  const validationResult = validateDraftPayload(payload);

  if (!validationResult.isValid) {
    // Ambil pesan error pertama
    const firstErrorKey = Object.keys(validationResult.errors)[0];
    const errorMessage = validationResult.errors[firstErrorKey];

    toast.add({
      title: 'Validasi Gagal',
      description: errorMessage,
      icon: 'i-heroicons-x-circle-20-solid',
      color: 'red'
    });
    return false;
  }
  return true;
}


/* -------------------------------------------------------------------------- */
/* CORE FUNCTIONS (Preview & Save)                                            */
/* -------------------------------------------------------------------------- */

const getBasePayload = () => {
  const tglStr = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : new Date().toISOString().split("T")[0];

  const pengirimId = user.value?.position || "70007846"; // Fallback ke contoh user

  return {
    id_naskah: editDraftId.value,
    pengirim: pengirimId,
    penerima: selectedTertuju.value.map(i => i.value),
    tembusan: selectedTembusan.value.map(i => i.value),
    klasifikasi: selectedBerkas.value?.klasifikasi || "OPS.02", // Fallback contoh
    klasifikasi_text: selectedBerkas.value?.judulBerkas || "Air Traffic Flow Management (ATFM)",
    sifat: selectedSifat.value?.value || 'biasa',
    perihal: subject.value,
    konten: editorContent.value,
    english: english.value,
    nama_tempat: user.value?.areaText || "Tangerang",
    nama_jabatan: user.value?.positionText || "Direktur Utama",
    tanda_tangan: "vsydc526d728g29uwedhwidciwdcbhbddy2",
    nama_lengkap: user.value?.nama || "John Doe",
    tgl: tglStr,
    lampiran_files: uploadedFiles.value,
    final_pdf: null, // Kita set null di payload object, nanti dihandle di FormData
  } as DraftPayload;
}

const handlePreview = async () => {
  const payload = getBasePayload();

  // 1. Validasi Input sebelum generate PDF
  if (!validateAndToast(payload)) {
    return;
  }

  // 2. Jika valid, jalankan proses preview
  await openPreview();
};

// --- 2. Preview PDF (UPDATE: SIMPAN BLOB) ---
async function openPreview() {
  isLoadingData.value = true;
  try {
    isOpenPreview.value = true;
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);

    // Reset Blob lama
    pdfBlob.value = null;

    const draftData = getBasePayload();

    // Payload khusus generate PDF (String only)
    const pdfPayload: any = {
      penerima: selectedTertuju.value.map(i => i.labelJob || i.label),
      tembusan: selectedTembusan.value.map(i => i.labelJob || i.label),
      tgl: draftData.tgl,
      perihal: draftData.perihal,
      sifat: draftData.sifat,
      htmlContent: draftData.konten,
      penandatangan: draftData.nama_lengkap,
      nama_jabatan: draftData.nama_jabatan,
      nama_tempat: draftData.nama_tempat,
    };

    const response = await fetch("http://172.20.16.115:3011/ND/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pdfPayload),
    });

    if (!response.ok) throw new Error("Gagal generate PDF");

    // AMBIL BLOB DAN SIMPAN KE STATE
    const blob = await response.blob();
    pdfBlob.value = blob; // <--- PENTING: Disimpan untuk proses kirim
    pdfUrl.value = URL.createObjectURL(blob);

  } catch (err) {
    console.error("PDF generate error:", err);
    toast.add({ title: 'Error Preview', description: "Gagal generate PDF.", color: 'red' });
    isOpenPreview.value = false;
  } finally {
    isLoadingData.value = false;
  }
}

// Helper untuk membuat FormData (DRY Code)
const createFormData = (payload: DraftPayload, includePdf: boolean = false) => {
  const formData = new FormData();

  formData.append("pengirim", payload.pengirim);

  // Array Handling
  payload.penerima.forEach((id) => formData.append("penerima[]", String(id)));
  payload.tembusan.forEach((id) => formData.append("tembusan[]", String(id)));

  formData.append("klasifikasi", payload.klasifikasi);
  formData.append("klasifikasi_text", payload.klasifikasi_text);
  formData.append("sifat", payload.sifat);
  formData.append("perihal", payload.perihal);
  formData.append("konten", payload.konten);

  formData.append("nama_tempat", payload.nama_tempat);
  formData.append("nama_jabatan", payload.nama_jabatan);
  formData.append("tanda_tangan", payload.tanda_tangan);
  formData.append("nama_lengkap", payload.nama_lengkap);

  formData.append("tgl", payload.tgl);
  formData.append("english", String(payload.english));

  // Upload File Baru
  if (uploadedFiles.value && uploadedFiles.value.length > 0) {
    uploadedFiles.value.forEach((file) => {
      formData.append("lampiran_files", file, file.name);
    });
  }

  // File Lama
  if (existingFiles.value && existingFiles.value.length > 0) {
    existingFiles.value.forEach((file) => {
      formData.append("existing_lampiran_ids[]", file.id);
    });
  }

  // LOGIC FINAL PDF (Hanya untuk KIRIM)
  if (includePdf && pdfBlob.value) {
    // Nama file diset statis atau dinamis sesuai kebutuhan
    const fileName = `Nota_Dinas_${payload.tgl}.pdf`;
    formData.append("final_pdf", pdfBlob.value, fileName);
  } else if (includePdf && !pdfBlob.value) {
    console.warn("PDF Blob is missing during send!");
  }

  return formData;
}

// --- 3. Save Draft (UPDATE: HAPUS FINAL PDF) ---
const handleSaveDraft = async () => {
  if (!user.value) await getProfile();
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  // Generate FormData TANPA PDF (parameter kedua false)
  const formData = createFormData(payload, false);

  // Pastikan key final_pdf TIDAK ADA atau dihapus jika createFormData defaultnya ada
  // (Di fungsi createFormData di atas saya sudah buat conditional `includePdf`)

  try {
    await saveDraft(formData, editDraftId.value);
    isOpenPreview.value = false;
    await router.push("/admin/korespondensi/draft");
  } catch (e) {
    // Error handled in composable
  }
};

// --- 4. Kirim Dokumen (UPDATE: IMPLEMENTASI BARU) ---
const handleKirimDokumen = async () => {
  if (!user.value) await getProfile();
  const payload = getBasePayload();

  // Validasi
  if (!validateAndToast(payload)) return;

  // Cek apakah PDF hasil preview sudah ada
  if (!pdfBlob.value) {
    toast.add({
      title: 'PDF Belum Siap',
      description: "Silakan tunggu proses preview selesai atau refresh preview.",
      color: 'orange'
    });
    return;
  }

  // Generate FormData DENGAN PDF (parameter kedua true)
  const formData = createFormData(payload, true);

  try {
    // Panggil endpoint /ND/send-message
    await sendMessage(formData);

    // Sukses
    isOpenPreview.value = false;
    // Redirect ke halaman Outbox atau Dashboard setelah kirim
    await router.push("/admin/korespondensi/terkirim");
  } catch (e) {
    // Error handled in composable
    console.error("Gagal Kirim:", e);
  }
};


// Perbaikan 3: Menggunakan editorContent.value dan mereset newTemplateName
const saveMyTemplate = () => {
  if (!newTemplateName.value.trim()) return;

  if (!tinymceEditor.value) return;

  const content = tinymceEditor.value.getContent();

  myTemplates.value.push({
    id: Date.now(),
    name: newTemplateName.value,
    content
  });

  newTemplateName.value = "";
  isAddTemplateOpen.value = false;

  toast.add({
    title: 'Berhasil',
    description: 'Template berhasil disimpan.',
    icon: 'i-heroicons-check-circle-20-solid',
    color: 'green'
  });
};


const deleteTemplate = (id: number) => {
  myTemplates.value = myTemplates.value.filter(t => t.id !== id);
  toast.add({
    title: 'Dihapus',
    description: "Template berhasil dihapus.",
    icon: 'i-heroicons-trash-20-solid',
    color: 'orange'
  });
};


/* -------------------------------------------------------------------------- */
/* LIFECYCLE HOOKS                                                            */
/* -------------------------------------------------------------------------- */
onMounted(async () => {
  // ... (Logic Loading User, Berkas, dan Penerima tidak berubah) ...

  // A. LOAD USER
  if (!user.value) {
    try {
      await getProfile();
    } catch (e) {
      console.error("Gagal load profile user");
      return;
    }
  }

  // B. LOAD BERKAS (MASTER DATA)
  try {
    berkasStatus.value = "loading";
    const response = await getBerkasList();
    berkasList.value = Array.isArray(response) ? response : (response?.data ?? []);
    berkasStatus.value = "success";
  } catch (err) {
    console.error("Gagal load berkas", err);
    berkasStatus.value = "error";
  }

  // C. LOAD PENERIMA & POPULATE DRAFT
  try {
    // 1. Ambil Master Data Penerima Dulu
    const userPositionId = user.value?.position;
    const res = await getRecipients(userPositionId);
    const rawData = res.recipients || res.data || [];

    // --- MAPPING MASTER DATA (Supaya Dropdown & Badge Benar) ---
    items.value = rawData.map((r: any) => {
      // Pastikan ID diambil dengan benar. Tambahkan fallback '0' biar tidak NaN.
      const id = r.position || r.id || r.position_id || r.persnum || "0";

      return {
        // FORMAT LABEL SESUAI REQUEST (Badge & Dropdown)
        label: `${r.persnum_person_text} - (${r.position_abbreviation}) ${r.position_text}`,

        // Simpan info jabatan saja untuk keperluan PDF Preview (cleaner)
        labelJob: r.position_text,

        // ID Jabatan (Pastikan String)
        value: String(id),

        raw: r,
      };
    });

    // 2. CEK JIKA INI EDIT MODE
    const draftId = route.query.draft_id as string;

    if (draftId) {
      loading.value = true;
      editDraftId.value = draftId;

      const resDraft = await getDraftDetail(draftId);
      if (resDraft.success && resDraft.data) {
        const d = resDraft.data;

        // Populate Field Sederhana
        subject.value = d.perihal || "";
        content.value = d.konten || "";
        editorContent.value = d.konten || ""; // Pastikan editorContent juga terisi
        english.value = d.english || false;

        const draftSifat = d.sifat?.toLowerCase();
        selectedSifat.value = sifatOptions.find(opt => opt.value === draftSifat) || sifatOptions.find(opt => opt.value === 'biasa');

        if (d.tanggal) {
          const dateObj = new Date(d.tanggal);
          date.value = new CalendarDate(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
        }

        if (d.klasifikasi && berkasList.value.length > 0) {
          const foundBerkas = berkasList.value.find(b =>
            b.id === d.id_berkas ||
            b.klasifikasi?.toString().toLowerCase() === d.klasifikasi.toString().toLowerCase()
          );
          if (foundBerkas) selectedBerkasId.value = foundBerkas.id;
        }

        if (d.lampiran_files) existingFiles.value = d.lampiran_files;

        // --- LOGIC VITAL: POPULATE PENERIMA (FIX SELECT & BADGE) ---
        const processDraftItems = (list: any[]) => {
          if (!Array.isArray(list)) return [];
          return list.map((draftItem) => {
            // 1. Ambil ID dari draft item. Cek field 'position' atau 'value'.
            const rawId = draftItem.position || draftItem.value || draftItem.id;
            const targetId = String(rawId);

            // 2. CARI DI MASTER DATA (ITEMS)
            const foundInMaster = items.value.find(m => m.value === targetId);

            if (foundInMaster) {
              return foundInMaster;
            } else {
              // JIKA TIDAK KETEMU (Fallback):
              const pName = draftItem.nama || draftItem.persnum_person_text || 'Unknown';
              const pAbbr = draftItem.kode || draftItem.position_abbreviation || '-';
              const pJob = draftItem.jabatan || draftItem.positionText || draftItem.position_text || 'Unknown Job';

              return {
                label: `${pName} - (${pAbbr}) ${pJob}`,
                labelJob: pJob,
                value: targetId !== 'undefined' ? targetId : "0", // Cegah NaN
                raw: draftItem
              }
            }
          });
        };

        if (d.penerima) selectedTertuju.value = processDraftItems(d.penerima);
        if (d.tembusan) selectedTembusan.value = processDraftItems(d.tembusan);

        await nextTick();
      }
    }
  } catch (err) {
    console.error("Error init data:", err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}
</style>
