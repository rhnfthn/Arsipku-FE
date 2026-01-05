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

    <PageHeader title="Tulis Surat Dinas Eksternal" :items="breadcrumbs" />

    <UCard variant="soft" :ui="{
      root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm',
    }">

      <div class="flex-1 overflow-y-auto space-y-1">

        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []"
          :loading="klasifikasiStatus === 'loading'" />

        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <TulisInputSifat v-model="selectedSifat" />

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tujuan Eksternal"
          :items="externalItems" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan"
          :items="internalItems" />

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
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
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
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
              class="flex flex-col bg-gray-100 dark:bg-gray-800 transition-all duration-300 relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">

              <div
                class="bg-white dark:bg-gray-900 pt-10 pb-10 border-b border-gray-100 dark:border-gray-700 select-none text-black dark:text-white min-h-[1000px]">

                <div class="flex items-center pb-4 mb-6 px-10">
                  <div class="flex items-end gap-4">
                    <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
                    <div class="flex flex-col mb-1">
                      <span class="text-2xl font-bold tracking-wide text-[18px]">AirNav Indonesia</span>
                    </div>
                  </div>
                  <div class="ml-auto text-[10px] leading-[1.1] text-right">
                    <div class="font-bold">{{ user?.areaText || 'Kantor Pusat Perum LPPNPI' }}</div>
                    <div>Gedung AirNav Indonesia</div>
                    <div>Jl. Ir. H. Juanda, Tangerang 15121</div>
                    <div>Banten – Indonesia</div>
                    <div>Telp: 021-5591 5000</div>
                    <div>Fax: 021-5591 5100</div>
                    <div>www.airnavindonesia.co.id</div>
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

                <div class="flex justify-end mt-12 text-black dark:text-white px-10">
                  <div class="text-center min-w-[250px]">
                    <div class="mb-24 text-[14px]">
                      <div class="font-bold">{{ user?.positionText || 'Nama Jabatan' }}</div>
                    </div>
                    <div class="font-bold text-[14px] underline">{{ user?.nama || 'Nama Lengkap' }}</div>
                  </div>
                </div>

                <div class="mt-8 text-[12px] text-black dark:text-white px-10">
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
                  class="bg-white dark:bg-gray-900 px-12 py-12 border-t-4 border-gray-200 dark:border-gray-700 text-black dark:text-white break-before-page mt-10">

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

          <TulisInputLampiran v-model:existingFiles="existingFiles" />
        </div>

        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-800">
          <UButton label="Pratinjau" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold"
            @click="handlePreview" />
        </div>
      </div>
    </UCard>

    <USlideover v-model:open="isOpenPreview" title="Pratinjau Dokumen SDE" side="bottom" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
    }">
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full border-none" />
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
          <UButton label="Kirim Dokumen" color="primary" size="lg" icon="i-heroicons-paper-airplane"
            class="px-8 font-bold" :loading="isLoadingData" @click="confirmKirimDokumen" />
        </div>
      </template>
    </USlideover>

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

// --- CONFIG ---
const route = useRoute();
const router = useRouter();
const toast = useToast();

const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { getRecipients } = useSdi();
// Import getExternalRecipients dari composable
const { saveDraft, updateDraft, sendSDE, getSDEDetail, generatePdf, getExternalRecipients, getRecipientInfo } = useSde();

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Tulis Surat Dinas Eksternal", to: "#" },
];

const maxPerihal = 200;

// --- STATE ---
const isLoadingData = ref(false);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const editDraftId = ref<string | null>(null);

// Form Basic
const subject = ref("");
const lampiranText = ref("");
const editorContent = ref("");
const tinymceEditor = ref<TinyMCEEditor | null>(null);

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

    tembusan: selectedTembusan.value.map(i => i.value),
    klasifikasi: selectedKlasifikasi.value?.klasifikasi || "",
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || "",
    sifat: selectedSifat.value?.value || "biasa",
    perihal: subject.value,
    lampiran: lampiranText.value,
    konten: editorContent.value,
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

// --- ACTIONS ---
const handleApplyTemplate = (content: string) => {
  if (tinymceEditor.value) tinymceEditor.value.setContent(content);
  editorContent.value = content;
};

const handlePreview = async () => {
  const payload = getPayload();
  isLoadingData.value = true;
  loadingMessage.value = "Membuat Pratinjau PDF...";

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

const confirmSaveDraft = async () => {
  const payload = getPayload();
  isLoadingData.value = true;
  loadingMessage.value = "Menyimpan Draft...";

  try {
    const fd = createFormData(payload, false);
    let res;

    if (editDraftId.value) {
      res = await updateDraft(fd, editDraftId.value);
    } else {
      res = await saveDraft(fd);
    }

    if (res?.success) {
      toast.add({ title: 'Draft Disimpan', color: 'success' });
      if (res.data?.id) editDraftId.value = res.data.id;
    }
  } catch (e: any) {
    toast.add({ title: 'Gagal Simpan Draft', description: e.response?.data?.message, color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const confirmKirimDokumen = async () => {
  if (!confirm("Apakah Anda yakin ingin mengirim Surat Dinas Eksternal ini?")) return;

  const payload = getPayload();
  isLoadingData.value = true;
  loadingMessage.value = "Mengirim...";

  try {
    const fdPreview = createFormData(payload, false);
    const blob = await generatePdf(fdPreview);
    pdfBlob.value = new Blob([blob], { type: 'application/pdf' });

    const fdFinal = createFormData(payload, true);
    const res = await sendSDE(fdFinal);

    if (res?.success) {
      toast.add({ title: 'Berhasil', description: 'Surat Dinas Eksternal terkirim', color: 'success' });
      router.push("/korespondensi/terkirim");
    }
  } catch (e: any) {
    toast.add({ title: 'Gagal Mengirim', description: e.response?.data?.message, color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

// --- LIFECYCLE ---
onMounted(async () => {
  isLoadingData.value = true;
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
    const rawRec = internalRecRes.recipients || [];
    const mapInternalItems = (list: any[]) => list.map((r: any) => ({
      label: `${r.persnum_person_text || r.persnum} - (${r.position_abbreviation || r.abbreviation}) ${r.position_text || r.positionText}`,
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
            typeof t === 'object' ? String(t.id || t.position_id || t.value) : String(t)
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
