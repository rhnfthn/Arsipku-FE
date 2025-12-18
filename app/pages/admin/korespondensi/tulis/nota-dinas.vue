<template>
  <div class="">
    <div v-if="isLoadingData"
      class="fixed inset-0 z-[99999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-2">
        <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
        <span class="text-gray-600 font-medium">Proses Pratinjau...</span>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden transition-colors">
      <PageHeader title="Tulis Nota Dinas" :items="breadcrumbs" />
    </div>

    <UCard variant="soft" :ui="{
      root: 'rounded-t-none ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors',
    }">
      <div class="flex-1 overflow-y-auto space-y-1">
        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []"
          :loading="klasifikasiStatus === 'loading'" />

        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tertuju" :items="items"
          :exclude-items="selectedTembusan" disabled-message="Sudah dipilih di Tembusan" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan" :items="items"
          :exclude-items="selectedTertuju" disabled-message="Sudah dipilih di Tertuju" />

        <TulisInputSifat v-model="selectedSifat" />

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>

            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="subject" :maxlength="maxPerihal"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Ketik perihal" />

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
                  <div v-if="selectedTembusan.length > 5" class="ml-4 pl-2">
                    Periksa Alamat Terlampir
                  </div>
                  <div v-else-if="selectedTembusan.length === 1" class="ml-4 pl-2">
                    {{ selectedTembusan[0].labelJob || selectedTembusan[0].label }}
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
                class="bg-white dark:bg-gray-900 px-12 py-12 border-t-4 border-gray-200 dark:border-gray-700 text-black dark:text-white break-before-page">

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

                <div v-if="selectedTertuju.length > 0" class="mb-8">
                  <div class="font-bold text-[14px] mb-2 uppercase">KEPADA YTH :</div>
                  <ol class="list-decimal ml-6 text-[14px] space-y-1">
                    <li v-for="item in selectedTertuju" :key="item.value">
                      {{ item.labelJob || item.label }}
                    </li>
                  </ol>
                </div>

                <div v-if="selectedTembusan.length > 0">
                  <div class="font-bold text-[14px] mb-2 uppercase">TEMBUSAN :</div>
                  <ol class="list-decimal ml-6 text-[14px] space-y-1">
                    <li v-for="item in selectedTembusan" :key="item.value">
                      {{ item.labelJob || item.label }}
                    </li>
                  </ol>
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
            <span class="text-gray-500">Memuat PDF...</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-4 w-full">
          <UButton label="Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text"
            class="px-8" :loading="isLoadingDraft" @click="confirmSaveDraft" />
          <UButton label="Kirim" color="primary" size="lg" icon="i-heroicons-paper-airplane" class="px-8 font-bold"
            @click="confirmKirimDokumen" />
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/* 1. IMPORTS (Library & Components)                                          */
/* -------------------------------------------------------------------------- */
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';

// Components
import TulisInputKlasifikasi from "@/components/Tulis/InputKlasifikasi.vue";
import TulisInputLampiran from "@/components/Tulis/InputLampiran.vue";
import TulisInputSifat from "@/components/Tulis/InputSifat.vue";
import TemplateManager from '@/components/Tulis/TemplateManager.vue';

/* -------------------------------------------------------------------------- */
/* 2. TYPES                                                                   */
/* -------------------------------------------------------------------------- */
import type { Editor as TinyMCEEditor } from 'tinymce';
import type { Klasifikasi } from "~/types/klasifikasi";
import type { Berkas } from "~/types/berkas";
import { validateDraftPayload, type DraftPayload } from "~/types/nota-dinas";

/* -------------------------------------------------------------------------- */
/* 3. COMPOSABLES & INITIALIZATION                                            */
/* -------------------------------------------------------------------------- */
const route = useRoute();
const router = useRouter();
const toast = useToast();

const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { getBerkasList } = useBerkas();
const { getRecipients } = useRecipients();
const { saveDraft, sendMessage, isLoadingDraft, getDraftDetail } = useDraft();
const { generatePdf, sendNotaDinas, saveDraft: saveND, getNotaDinasDetail } = useNotaDinas();

/* -------------------------------------------------------------------------- */
/* 4. STATE & REFS                                                            */
/* -------------------------------------------------------------------------- */
// --- UI State ---
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Tulis Nota Dinas", to: "#" },
];
const isOpenPreview = ref(false);
const loading = ref(false);
const isLoadingData = ref(false);

// --- Form Data State ---
const editDraftId = ref<string | null>(null);
const subject = ref("");
const editorContent = ref("");
const content = ref(""); // Legacy fallback
const english = ref(false);
const maxPerihal = 200;

// Date State
const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));

// Confirm popup
const alertState = useAlertState();

const onConfirm = () => {
  alertState.isOpen = false;
  if (alertState.resolve) alertState.resolve(true);
};

const onCancel = () => {
  alertState.isOpen = false;
  if (alertState.resolve) alertState.resolve(false);
};

// Classification & Files
const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const selectedKlasifikasiId = ref<string | null>(null);
const uploadedFiles = ref<File[]>([]);
const existingFiles = ref<any[]>([]);

// Selection State
const selectedSifat = ref(null);
const items = ref<any[]>([]); // Master Data Penerima
const selectedTertuju = ref<any[]>([]);
const selectedTembusan = ref<any[]>([]);

// PDF State
const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");

// Editor Instance
const tinymceEditor = ref<TinyMCEEditor | null>(null);

// Constants/Options
const sifatOptions = [
  { label: "Sangat Rahasia", value: "sangat rahasia" },
  { label: "Rahasia", value: "rahasia" },
  { label: "Terbatas", value: "terbatas" },
  { label: "Biasa / Terbuka", value: "biasa" }
];

/* -------------------------------------------------------------------------- */
/* 5. TINYMCE CONFIG                                                          */
/* -------------------------------------------------------------------------- */
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
/* 6. COMPUTED PROPERTIES                                                     */
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
/* 7. HELPER & CORE METHODS                                                   */
/* -------------------------------------------------------------------------- */
const validateAndToast = (payload: DraftPayload) => {
  const validationResult = validateDraftPayload(payload);

  if (!validationResult.isValid) {
    // Ambil pesan error pertama dari objek errors
    const errorMessages = Object.values(validationResult.errors || {});
    const firstMessage = errorMessages.length > 0 ? errorMessages[0] : "Terjadi kesalahan input";

    toast.add({
      title: 'Validasi Gagal',
      description: firstMessage,
      icon: 'i-heroicons-x-circle-20-solid',
      color: 'red'
    });
    return false;
  }
  return true;
};

/* --- 7. CORE FUNCTIONS --- */
const getBasePayload = () => {
  const tglDb = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : "";

  const tglPreview = date.value
    ? `${String(date.value.day).padStart(2, "0")}/${String(date.value.month).padStart(2, "0")}/${date.value.year}`
    : "";

  const lampiranIds = existingFiles.value
    .map((f: any) => f.id || f.value) // Pastikan mengambil .id dari hasil upload baru
    .filter((id: any) => !!id);

  return {
    id_naskah: editDraftId.value,
    pengirim: user.value?.position || "",
    penerima: selectedTertuju.value.map(i => i.value),
    tembusan: selectedTembusan.value.map(i => i.value),
    tertuju: selectedTertuju.value.map(i => i.labelJob || i.label),

    klasifikasi: selectedKlasifikasi.value?.klasifikasi || null,
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || null,
    sifat: typeof selectedSifat.value === 'string' ? selectedSifat.value : (selectedSifat.value as any)?.value || 'biasa',
    perihal: subject.value,

    konten: String(editorContent.value || ''),
    htmlContent: String(editorContent.value || ''),

    english: english.value,
    nama_tempat: user.value?.areaText || "Kantor Pusat",
    nama_jabatan: user.value?.positionText || "",
    nama_lengkap: user.value?.nama || "",

    tgl: tglDb,            // YYYY-MM-DD
    tanggal: tglPreview,   // DD/MM/YYYY
    lampiran_temp_ids: lampiranIds,
  };
};

const createFormData = (payload: any, includePdf: boolean = false) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    // Array Handling sesuai format JSON string
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    }
    else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });

  // Tambahkan file PDF jika proses Kirim
  if (includePdf && pdfBlob.value) {
    formData.append("final_pdf", pdfBlob.value, `nota_dinas_${payload.tanggal}.pdf`);
  }

  return formData;
};

/* -------------------------------------------------------------------------- */
/* 8. EVENT HANDLERS                                                          */
/* -------------------------------------------------------------------------- */
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

  isLoadingData.value = true;
  try {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    const formData = createFormData(payload);
    const blobResponse = await generatePdf(formData);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(pdfBlob.value);
    isOpenPreview.value = true;
  } catch (err) {
    toast.add({ title: 'Gagal Preview', color: 'red' });
  } finally {
    isLoadingData.value = false;
  }
};

/* --- Fungsi Konfirmasi untuk Draft --- */
const confirmSaveDraft = async () => {
  // 1. Tampilkan Confirm dan tunggu hasilnya
  const isConfirmed = await Alert.confirm(
    'Simpan sebagai Draft?',
    'Dokumen akan disimpan ke folder draft dan bisa Anda edit kembali nanti.',
    'Ya, Simpan',
    'Batal',
    false
  );

  if (!isConfirmed) return;
  await handleSaveDraft();
};

/* --- Fungsi Konfirmasi untuk Kirim --- */
const confirmKirimDokumen = async () => {
  const isConfirmed = await Alert.confirm(
    'Kirim Dokumen?',
    'Dokumen yang sudah dikirim tidak dapat dibatalkan.',
    'Ya, Kirim',
    'Batal',
    false
  );

  if (!isConfirmed) return;
  await handleKirimDokumen();
};

/* --- Kode asli kamu tetap di bawah ini (Tanpa Ubah) --- */
const handleKirimDokumen = async () => {
  const payload = getBasePayload();

  if (!validateAndToast(payload)) return;

  try {
    isLoadingData.value = true;

    // Selalu generate PDF terbaru agar konten & lampiran_ids sinkron
    const formDataPreview = createFormData(payload, false);
    const blobResponse = await generatePdf(formDataPreview);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });

    // Kirim menggunakan payload terbaru
    const formData = createFormData(payload, true);
    const result = await sendNotaDinas(formData);

    if (result.success) {
      if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
      toast.add({ title: 'Berhasil', description: 'Nota Dinas berhasil dikirim', color: 'green' });
      router.push("/admin/korespondensi/terkirim");
    }
  } catch (e: any) {
    console.error("Gagal mengirim:", e);
    toast.add({
      title: 'Gagal Mengirim',
      description: e.response?.data?.message || 'Pastikan semua input sudah benar',
      color: 'red'
    });
  } finally {
    isLoadingData.value = false;
  }
};

const handleSaveDraft = async () => {
  const payload = getBasePayload();

  // Validasi payload
  if (!validateAndToast(payload)) return;

  try {
    isLoadingData.value = true;
    const formData = createFormData(payload, false); // Jangan sertakan PDF untuk draft

    // Panggil saveDraft (alias saveND dari destrukturisasi useNotaDinas)
    // Jika editDraftId.value ada, maka composable akan otomatis menggunakan PATCH
    await saveND(formData, editDraftId.value);

    toast.add({ title: 'Berhasil', description: 'Draft berhasil disimpan', color: 'green' });
    router.push("/admin/korespondensi/draft");
  } catch (e: any) {
    console.error("Gagal simpan draft:", e);
    toast.add({
      title: 'Gagal',
      description: e.response?.data?.message || 'Gagal memperbarui draft',
      color: 'red'
    });
  } finally {
    isLoadingData.value = false;
  }
};

/* -------------------------------------------------------------------------- */
/* 9. LIFECYCLE HOOKS                                                         */
/* -------------------------------------------------------------------------- */
// --- LIFECYCLE HOOKS ---
onMounted(async () => {
  // 1. Load Essentials (Classification & Recipients)
  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";
    klasifikasiList.value = await getKlasifikasi();
    klasifikasiStatus.value = "success";

    const resRec = await getRecipients(user.value?.position);
    const rawData = resRec.recipients || resRec.data || [];
    items.value = rawData.map((r: any) => ({
      label: `${r.persnum_person_text || r.persnum} - (${r.position_abbreviation || r.abbreviation}) ${r.position_text || r.positionText}`,
      labelJob: r.position_text || r.positionText,
      value: String(r.position || r.position_id || r.id),
      raw: r,
    }));
  } catch { klasifikasiStatus.value = "error"; }

  // 2. Populate Draft Data
  const draftId = route.query.draft_id as string;
  if (draftId) {
    editDraftId.value = draftId;
    const resDraft = await getDraftDetail(draftId);

    if (resDraft.success && resDraft.data) {
      const d = resDraft.data;
      subject.value = d.perihal || "";
      editorContent.value = d.konten || "";
      english.value = Boolean(d.english);

      // FIX KLASIFIKASI: Cari ID berdasarkan kode klasifikasi string (misal: "AUD.02.02")
      if (d.klasifikasi) {
        const foundKlas = klasifikasiList.value.find(k => k.klasifikasi === d.klasifikasi);
        if (foundKlas) selectedKlasifikasiId.value = foundKlas.id;
      }

      // FIX PENERIMA & TEMBUSAN: Map format API ke format UBadge/Dropdown
      const mapApiToUI = (list: any[]) => {
        return list?.map(item => {
          // Cek apakah sudah ada di master list 'items'
          const posId = String(item.position_id || item.position || item.value);
          const master = items.value.find(m => m.value === posId);
          if (master) return master;

          // Fallback jika tidak ada di master list
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

      // FIX LAMPIRAN: Map lampiran_files API ke existingFiles component
      if (d.lampiran_files && Array.isArray(d.lampiran_files)) {
        existingFiles.value = d.lampiran_files.map((f: any) => ({
          id: f.id,
          fileName: f.fileName || f.file_name,
          filePath: f.fileUrl || f.file_path,
          fileSize: f.fileSize || 0
        }));
      }

      // Sifat Mapping
      const draftSifat = String(d.sifat || 'biasa').toLowerCase();
      selectedSifat.value = sifatOptions.find(opt => opt.value === draftSifat) || sifatOptions[3];

      // Tanggal Mapping
      if (d.tanggal) {
        const dateParts = d.tanggal.split('-'); // Asumsi YYYY-MM-DD
        if (dateParts.length === 3) {
          date.value = new CalendarDate(Number(dateParts[0]), Number(dateParts[1]), Number(dateParts[2]));
        }
      }
    }
  }
});
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}
</style>
