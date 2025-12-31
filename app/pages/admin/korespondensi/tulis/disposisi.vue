<template>
  <div class="relative">

    <Teleport to="body">
      <div v-if="isLoadingData"
        class="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-900/20 backdrop-blur-[2px] transition-all">
        <div
          class="flex flex-col items-center gap-3 p-5 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700">
          <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
          <span class="text-gray-700 dark:text-gray-200 font-medium text-sm">
            {{ loadingMessage || 'Mohon Tunggu...' }}
          </span>
        </div>
      </div>
    </Teleport>

    <div class="bg-white dark:bg-gray-800 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden transition-colors">
      <PageHeader title="Tulis Disposisi" :items="breadcrumbs" />
    </div>

    <UCard variant="soft" :ui="{
      root: 'rounded-t-none ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors',
    }">
      <div class="flex-1 overflow-y-auto space-y-4">

        <TulisInputTanggal v-model="date" label="Tanggal Disposisi" />

        <TulisInputSifat v-model="selectedSifat" />

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Ref. Nomor Surat
              <!-- <span class="text-gray-400 font-normal text-[10px] ml-1">(Optional)</span> -->
            </span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="refNumber"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Ketik Ref. Nomor Surat" />
            </div>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Ref. Perihal
              <!-- <span class="text-gray-400 font-normal text-[10px] ml-1">(Optional)</span> -->
            </span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="refPerihal"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Ketik Ref. Perihal" />
            </div>
          </div>
        </div>

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tertuju"
          :items="recipientList" />

        <div class="flex flex-col py-3 gap-3 mb-6">
          <span class="text-sm font-medium text-gray-500">Instruksi / Disposisi</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="opt in checklistOptions" :key="opt" class="flex gap-2 items-start">
              <input type="checkbox" :id="opt" :value="opt" v-model="selectedChecklist"
                class="mt-0.5 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
              <label :for="opt" class="text-sm text-gray-700 cursor-pointer select-none leading-tight">
                {{ opt }}
              </label>
            </div>
          </div>
        </div>

        <ClientOnly>
          <!-- <div class="text-center mb-2">
            <span class="text-xs font-medium text-gray-500 uppercase tracking-wider">Pratinjau Lembar Disposisi</span>
          </div> -->

          <div class="border border-gray-300 shadow-sm rounded-lg bg-gray-50 p-1 md:p-6 overflow-x-auto">
            <div
              class="bg-white mx-auto max-w-[210mm] border border-gray-400 p-8 min-h-[297mm] shadow-lg text-black font-['Times_New_Roman'] relative">

              <div class="border-2 border-black mb-0">
                <div class="flex border-b-2 border-black">
                  <div class="w-2/3 p-4 flex items-center gap-4 border-r-2 border-black">
                    <img src="/logoAirnav.png" alt="Logo" class="h-12 w-auto object-contain" />
                    <span class="font-bold text-xl tracking-wide">AirNav Indonesia</span>
                  </div>
                  <div class="w-1/3 p-2 flex flex-col justify-center text-center font-bold text-sm">
                    <div>LEMBAR DISPOSISI</div>
                    <div class="uppercase">{{ user?.positionText || "NAMA JABATAN" }}</div>
                  </div>
                </div>

                <div class="flex border-b-2 border-black">
                  <div class="w-[15%] border-r-2 border-black p-2 flex flex-col justify-between">
                    <div class="font-bold underline mb-4">AGENDA</div>
                    <div class="text-xs font-bold space-y-2">
                      <div>No: ........</div>
                      <div>Tgl: ........</div>
                    </div>
                  </div>

                  <div class="w-[55%] border-r-2 border-black p-2 text-xs">
                    <table class="w-full">
                      <tr>
                        <td class="w-16 py-1">Surat dari</td>
                        <td class="py-1">: {{ user?.positionText || "....................." }}</td>
                      </tr>
                      <tr>
                        <td class="py-1">Tanggal</td>
                        <td class="py-1">: {{ formattedDate }}</td>
                      </tr>
                      <tr>
                        <td class="py-1">Nomor</td>
                        <td class="py-1">: {{ refNumber || "-" }}</td>
                      </tr>
                      <tr>
                        <td class="py-1 align-top">Perihal</td>
                        <td class="py-1 align-top">: {{ refPerihal || "-" }}</td>
                      </tr>
                    </table>
                  </div>

                  <div class="w-[30%] p-2 text-xs">
                    <div class="font-bold underline mb-2">KLASIFIKASI</div>
                    <div class="space-y-1">
                      <div v-for="s in sifatOptions" :key="s.value" class="flex items-center gap-2">
                        <div class="w-4 h-4 border border-black flex items-center justify-center text-[10px]">
                          {{ selectedSifat?.value === s.value ? "✓" : "" }}
                        </div>
                        <span class="capitalize">{{ s.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="border-b-2 border-black p-2 text-xs">
                  <div class="font-bold underline mb-1">Kepada Yth. :</div>
                  <div v-if="selectedTertuju.length > 0" class="pl-4">
                    <ol class="list-decimal ml-4">
                      <li v-for="t in selectedTertuju" :key="t.value">{{ t.label }}</li>
                    </ol>
                  </div>
                  <div v-else class="pl-4 italic text-gray-500">
                    (Pilih penerima pada form di atas)
                  </div>
                </div>

                <div class="border-b-2 border-black p-2 text-xs flex">
                  <div class="w-20 font-bold underline shrink-0">DISPOSISI :</div>
                  <div class="flex-1 grid grid-cols-3 gap-2">
                    <div v-for="opt in checklistOptions" :key="opt" class="flex items-start gap-1">
                      <div
                        class="w-3 h-3 border border-black flex items-center justify-center text-[8px] mt-0.5 shrink-0">
                        {{ selectedChecklist.includes(opt) ? "✓" : "" }}
                      </div>
                      <span class="leading-tight">{{ opt }}</span>
                    </div>
                  </div>
                </div>

                <div class="p-0 min-h-[300px] relative group">
                  <div class="p-2 font-bold text-xs underline bg-gray-100 border-b border-gray-200">CATATAN :</div>

                  <div class="relative" v-if="showEditor">
                    <Editor api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" />
                    <!-- <div v-if="!editorContent"
                      class="absolute top-10 left-4 text-gray-400 pointer-events-none italic z-0 text-sm">
                      Ketik catatan disposisi di sini...
                    </div> -->
                  </div>
                  <div class="absolute bottom-4 right-4 z-10 pointer-events-none">
                    <div
                      class="border-2 border-black w-24 h-16 flex items-center justify-center font-bold text-xs bg-white/50">
                      Paraf
                    </div>
                  </div>
                </div>

                <div class="border-t-2 border-black p-1 text-[10px] font-bold text-center bg-gray-50">
                  Lembar disposisi ini menjadi bagian yang tidak terpisahkan dari nomor dan tanggal surat pada agenda
                  ini.
                </div>
              </div>

            </div>
          </div>
        </ClientOnly>

        <TulisInputLampiran v-model:existingFiles="existingFiles" />

        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-800">
          <UButton label="Pratinjau PDF" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold"
            @click="handlePreview" />
        </div>

      </div>
    </UCard>

    <USlideover v-model:open="isOpenPreview" title="Pratinjau Disposisi" side="bottom"
      :ui="{ content: 'h-screen max-h-screen', body: 'p-0', footer: 'p-4 border-t border-gray-200 dark:border-gray-800' }">
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
          <UButton label="Simpan Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text"
            class="px-8" :loading="isLoadingData" @click="confirmSaveDraft" />
          <UButton label="Kirim Disposisi" color="primary" size="lg" icon="i-heroicons-paper-airplane"
            class="px-8 font-bold" :loading="isLoadingData" @click="confirmKirimDokumen" />
        </div>
      </template>
    </USlideover>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import type { Editor as TinyMCEEditor } from 'tinymce';

// Components
import TulisInputSifat from "@/components/Tulis/InputSifat.vue";
import TulisInputPenerima from "@/components/Tulis/InputPenerima.vue";
import TulisInputTanggal from "@/components/Tulis/InputTanggal.vue";
import TulisInputLampiran from "@/components/Tulis/InputLampiran.vue";

// Types & Logic
import { validateDisposisiPayload, type DisposisiPayload } from "~/types/disposisi";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const { user, getProfile } = useAuth();
const { getRecipients, sendDisposisi, saveDraft, sendDraft, updateDraft, getDraftDetail, generatePdf } = useDisposisi();

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Tulis Disposisi", to: "#" },
];

// --- STATE ---
const isLoadingData = ref(false);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const editDraftId = ref<string | null>(null);

const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));

const selectedSifat = ref<any>(null);
const refNumber = ref("-");
const refPerihal = ref("-");

const recipientList = ref<any[]>([]);
const selectedTertuju = ref<any[]>([]);
const existingFiles = ref<any[]>([]);

// Menggunakan Array string untuk checkbox
const selectedChecklist = ref<string[]>([]);

const editorContent = ref("");
const tinymceEditor = ref<TinyMCEEditor | null>(null);

const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");

// --- CONSTANTS ---
const checklistOptions = [
  "Untuk Diketahui",
  "Proses Lanjut",
  "Koordinasikan",
  "Cek",
  "Monitor",
  "Evaluasi",
  "Dikaji Kemungkinannya",
  "Laporkan",
  "Untuk Menjadi Perhatian",
  "Untuk Dijadikan Acuan/Dipergunakan",
  "Harap Mewakili",
  "Harap Mendampingi",
  "Tunjuk Perwakilan",
  "Siapkan Bahan/Materi",
  "Lainnya",
];

const sifatOptions = [
  { label: "Sangat Rahasia", value: "sangat rahasia" },
  { label: "Rahasia", value: "rahasia" },
  { label: "Terbatas", value: "terbatas" },
  { label: "Biasa", value: "biasa" }
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

// --- COMPUTED ---
const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

// LOGIC BARU: Editor hanya muncul jika "Lainnya" dipilih
const showEditor = computed(() => {
  return selectedChecklist.value.includes("Lainnya");
});

// --- METHODS ---
const getPayload = (): DisposisiPayload => {
  const tglDb = `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`;
  const tglUi = `${String(date.value.day).padStart(2, "0")}/${String(date.value.month).padStart(2, "0")}/${date.value.year}`;

  return {
    id_naskah: editDraftId.value || null,
    pengirim: user.value?.position || "",
    tertuju: selectedTertuju.value.map(i => i.value),

    tanggal_disposisi: tglDb,
    tanggal_ui: tglUi, // Helper

    sifat: selectedSifat.value?.label || "Biasa",

    ref_nomor: refNumber.value || "-",
    ref_perihal: refPerihal.value || "-",

    // Jika editor tidak aktif, kosongkan catatan (atau biarkan sesuai kebutuhan)
    catatan: showEditor.value ? editorContent.value : "",
    htmlContent: showEditor.value ? editorContent.value : "",

    disposisi: selectedChecklist.value,
    lampiran_temp_ids: existingFiles.value.map(f => f.id).filter(Boolean)
  };
};

const createFormData = (payload: DisposisiPayload, includePdf: boolean = false) => {
  const formData = new FormData();
  Object.keys(payload).forEach((key) => {
    const k = key as keyof DisposisiPayload;
    if (k === 'tanggal_ui') return; // Skip helper UI

    const value = payload[k];
    if (Array.isArray(value)) {
      formData.append(k, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      formData.append(k, String(value));
    }
  });

  if (includePdf && pdfBlob.value) {
    const safeName = (payload.ref_perihal || 'disposisi').replace(/[^a-z0-9]/gi, '_').substring(0, 20);
    formData.append("final_pdf", pdfBlob.value, `DI_${safeName}.pdf`);
  }
  return formData;
};

const validateAndToast = (payload: DisposisiPayload) => {
  const check = validateDisposisiPayload(payload);
  if (!check.isValid) {
    const firstKey = Object.keys(check.errors)[0];
    toast.add({ title: 'Validasi Gagal', description: check.errors[firstKey], color: 'error' });
    return false;
  }
  return true;
};

// --- ACTIONS ---

const handlePreview = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) return;

  isLoadingData.value = true;
  loadingMessage.value = "Membuat PDF...";
  try {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    const fd = createFormData(payload, false);
    const blob = await generatePdf(fd);
    pdfBlob.value = new Blob([blob], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(pdfBlob.value);
    isOpenPreview.value = true;
  } catch (err) {
    console.error(err);
    toast.add({ title: 'Gagal Preview', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const confirmKirimDokumen = async () => {
  if (!confirm("Kirim Disposisi ini?")) return;
  const payload = getPayload();
  isLoadingData.value = true;

  try {
    // Regenerate PDF
    const fdPreview = createFormData(payload, false);
    const blob = await generatePdf(fdPreview);
    pdfBlob.value = new Blob([blob], { type: 'application/pdf' });

    const fdFinal = createFormData(payload, true);
    let res;

    if (editDraftId.value) {
      res = await sendDraft(fdFinal, editDraftId.value);
    } else {
      res = await sendDisposisi(fdFinal);
    }

    if (res?.success || res?.data?.success) {
      toast.add({ title: 'Berhasil', description: 'Disposisi Terkirim', color: 'success' });
      router.push("/admin/korespondensi/terkirim");
    }
  } catch (e: any) {
    toast.add({ title: 'Gagal', description: e.response?.data?.message, color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const confirmSaveDraft = async () => {
  const payload = getPayload();
  isLoadingData.value = true;
  try {
    const fd = createFormData(payload, false);
    if (editDraftId.value) {
      await updateDraft(fd, editDraftId.value);
    } else {
      await saveDraft(fd);
    }
    toast.add({ title: 'Draft Disimpan', color: 'success' });
    router.push("/admin/korespondensi/draft");
  } catch (e: any) {
    toast.add({ title: 'Gagal Simpan', description: e.response?.data?.message, color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

// --- LIFECYCLE ---
onMounted(async () => {
  isLoadingData.value = true;
  if (!user.value) await getProfile();

  try {
    // Get Recipient List
    const res = await getRecipients(user.value?.position);
    recipientList.value = res.recipients;

    // Load Draft if exists
    const draftId = route.query.draft_id as string;
    if (draftId) {
      editDraftId.value = draftId;
      loadingMessage.value = "Memuat Draft...";
      const resDraft = await getDraftDetail(draftId);

      if (resDraft.data) {
        const d = resDraft.data;

        // 1. Ref Nomor & Perihal (Handle null)
        refNumber.value = d.ref_nomor || "-";
        refPerihal.value = d.ref_perihal || "-";

        // 2. Tanggal (Parse YYYY-MM-DD)
        if (d.tanggal) {
          const [y, m, day] = d.tanggal.split('-').map(Number);
          date.value = new CalendarDate(y, m, day);
        }

        // 3. Catatan Editor
        editorContent.value = d.catatan || d.htmlContent || "";
        if (tinymceEditor.value) tinymceEditor.value.setContent(editorContent.value);

        // 4. Disposisi Checkbox (Split string by \n karena data API berupa string enter-separated)
        if (d.disposisi && typeof d.disposisi === 'string') {
          selectedChecklist.value = d.disposisi.split('\n');
        } else if (Array.isArray(d.disposisi)) {
          selectedChecklist.value = d.disposisi;
        } else {
          selectedChecklist.value = [];
        }

        // 5. Map Sifat
        // Mencari berdasarkan value (misal: 'biasa')
        const foundSifat = sifatOptions.find(s => s.value.toLowerCase() === (d.sifat || '').toLowerCase());
        selectedSifat.value = foundSifat || sifatOptions[3];

        // 6. Map Tertuju / Penerima
        // API mengembalikan key 'penerima', bukan 'tertuju'
        const rawPenerima = d.penerima || []; // Menggunakan d.penerima sesuai JSON

        selectedTertuju.value = rawPenerima.map((item: any) => {
          // Ambil ID dari position_id (API structure) atau value
          const val = String(item.position_id || item.value || item.id);

          // Cari data lengkap di recipientList agar labelnya sesuai format dropdown
          const found = recipientList.value.find(r => r.value === val);

          if (found) return found;

          // Fallback manual jika tidak ada di list master
          return {
            value: val,
            label: item.nama || item.positionText || item.label,
            labelJob: item.positionText || item.labelJob
          };
        });

        // 7. Map Files Lampiran
        if (d.lampiran_files) {
          existingFiles.value = d.lampiran_files.map((f: any) => ({
            id: f.id,
            // API mengembalikan 'fileName' (camelCase), bukan 'file_name'
            fileName: f.fileName,

            // Gunakan 'fileUrl' (link http lengkap) dan masukkan ke property 'filePath'
            // agar komponen anak mendeteksi "startsWith('http')" dan tidak menambahkan "/storage/"
            filePath: f.fileUrl || f.filePath,

            fileSize: 0
          }));
        }
      }
    }
  } catch (e) {
    console.error(e);
    toast.add({ title: 'Gagal memuat data', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
});
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
  background: transparent !important;
}

:deep(.tox-editor-container) {
  background: transparent !important;
}
</style>
