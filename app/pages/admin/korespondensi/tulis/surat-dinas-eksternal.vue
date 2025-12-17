<template>
  <div class="">
    <div v-if="isLoadingData || isSdeLoading"
      class="fixed inset-0 z-[99999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-2">
        <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
        <span class="text-gray-600 font-medium">Memproses...</span>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden transition-colors">
      <PageHeader title="Tulis Surat Dinas Eksternal" :items="breadcrumbs" />
    </div>

    <UCard variant="soft" :ui="{
      root: 'rounded-t-none ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors',
    }">
      <div class="flex-1 overflow-y-auto space-y-2 p-2">

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Pesan</span>
            <input type="text" v-model="message"
              class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400"
              placeholder="Ketik pesan..." />
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Asal
              Instansi</span>
            <input type="text" v-model="origin"
              class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400"
              placeholder="Ketik nama perusahaan..." />
          </div>
        </div>

        <TulisInputBerkas v-model="selectedBerkasId" :items="berkasList || []" :loading="berkasStatus === 'loading'" />

        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm text-gray-500 font-medium shrink-0">Sifat Naskah</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedSifat" :items="sifatOptions" placeholder="Pilih sifat ..." class="w-full p-0"
              variant="none">
              <template #default>
                <div class="flex items-center gap-1.5 min-h-[28px] pr-10 w-full">
                  <span v-if="selectedSifat" class="text-sm font-medium">{{ selectedSifat.label }}</span>
                  <span v-else class="text-sm text-gray-400">Pilih sifat</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Kepada Yth ..." :items="items"
          :exclude-items="selectedTembusan" disabled-message="Sudah dipilih di Tembusan" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Tembusan ..." :items="items"
          :exclude-items="selectedTertuju" disabled-message="Sudah dipilih di Tertuju" />

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
            <input type="text" v-model="subject"
              class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400"
              placeholder="Ketik perihal surat" />
          </div>
        </div>

        <div class="flex flex-col py-4 mt-4 border-t border-gray-200">
          <div class="flex items-center justify-between w-full gap-3 mb-4">
            <UButton label="Pilih Template" color="primary" variant="soft" icon="i-heroicons-adjustments-horizontal"
              @click="isTemplateModalOpen = true" />

            <div class="flex gap-3 flex-shrink-0">
              <UButton label="Simpan Sebagai Template" icon="i-heroicons-plus" variant="soft" color="primary"
                @click="isAddTemplateOpen = true" />

              <UButton label="Template Saya" icon="i-heroicons-bookmark" variant="soft" color="primary"
                @click="isMyTemplateModalOpen = true" />
            </div>
          </div>

          <UModal v-model:open="isTemplateModalOpen" title="Pilih Template">
            <template #body>
              <div class="space-y-3">
                <UCard v-for="template in templates" :key="template.id">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-sm font-semibold text-gray-800">{{ template.name }}</h3>
                    <UButton label="Gunakan" size="xs" color="primary" variant="soft"
                      @click="applyTemplate(template)" />
                  </div>
                  <iframe :srcdoc="template.content" class="w-full rounded bg-white"
                    style="height: 90px; pointer-events: none;" />
                </UCard>
              </div>
            </template>
          </UModal>

          <UModal v-model:open="isAddTemplateOpen" :ui="{ width: 'sm:max-w-md' }">
            <template #header>
              <h3 class="text-lg font-semibold">Simpan Template</h3>
            </template>
            <template #body>
              <div class="space-y-4">
                <UInput v-model="newTemplateName" placeholder="Nama Template" icon="i-heroicons-tag" size="lg" />
                <p class="text-sm text-blue-600 bg-blue-50 p-2 rounded">Konten editor saat ini akan disimpan.</p>
              </div>
            </template>
            <template #footer>
              <div class="flex justify-end gap-3">
                <UButton label="Batal" variant="ghost" @click="isAddTemplateOpen = false" />
                <UButton label="Simpan" color="primary" :disabled="!newTemplateName.trim()" @click="saveMyTemplate" />
              </div>
            </template>
          </UModal>

          <UModal v-model:open="isMyTemplateModalOpen" :ui="{ width: 'sm:max-w-xl' }">
            <template #header>
              <div class="flex justify-between">
                <h3 class="text-lg font-semibold">Template Saya</h3>
                <UBadge color="primary" variant="subtle">{{ myTemplates.length }}</UBadge>
              </div>
            </template>
            <template #body>
              <div class="flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                <UCard v-for="template in myTemplates" :key="template.id" class="p-4">
                  <div class="flex justify-between mb-2">
                    <h4 class="font-semibold">{{ template.name }}</h4>
                    <UButton icon="i-heroicons-trash" color="red" variant="ghost" size="xs"
                      @click.stop="deleteTemplate(template.id)" />
                  </div>
                  <div v-html="template.content" class="text-sm truncate opacity-70 mb-2"></div>
                  <div class="flex justify-end">
                    <UButton label="Gunakan" size="sm" @click="applyTemplate(template)" />
                  </div>
                </UCard>
                <div v-if="myTemplates.length === 0" class="text-center text-gray-500 p-4">Belum ada template tersimpan.
                </div>
              </div>
            </template>
            <template #footer>
              <div class="flex justify-end">
                <UButton label="Tutup" variant="ghost" @click="isMyTemplateModalOpen = false" />
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
                  <div>{{ user?.areaText || "Tangerang" }}, {{ formattedDate }}</div>
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
                            {{ uploadedFiles.length > 0 ? `${uploadedFiles.length} Berkas` : '-' }}
                          </td>
                        </tr>
                        <tr>
                          <td class="align-top">Perihal</td>
                          <td class="align-top">:</td>
                          <td class="align-top font-bold text-justify">{{ subject ||
                            "................................................" }}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div class="mt-5">Kepada Yth.</div>
                    <div class="font-bold mb-1">
                      <div v-if="selectedTertuju.length > 0">
                        <div v-for="(p, idx) in selectedTertuju" :key="idx" class="leading-relaxed">
                          {{ p.labelJob || p.label }}
                          <span v-if="origin" class="font-normal italic ml-1"> - {{ origin }}</span>
                        </div>
                      </div>
                      <div v-else>................................................</div>
                    </div>
                    <div class="mb-1">Di Tempat</div>
                  </div>
                </div>

                <div class="min-h-[400px] text-justify leading-relaxed">
                  <Editor api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" />
                </div>

                <div class="flex justify-end mt-12 text-black dark:text-white px-10">
                  <div class="text-center min-w-[250px]">
                    <div class="mb-24 text-[14px]">
                      <div class="font-bold">{{ user?.positionText || 'Nama Jabatan' }}</div>
                    </div>
                    <div class="font-bold text-[14px] underline">{{ user?.nama || 'Nama Lengkap' }}</div>
                  </div>
                </div>

                <div class="mt-8 text-[12px] text-black dark:text-white" v-if="selectedTembusan.length > 0">
                  <div class="font-bold underline mb-1">Tembusan :</div>
                  <ol class="list-decimal ml-4 pl-2">
                    <li v-for="t in selectedTembusan" :key="t.value">{{ t.labelJob || t.label }}</li>
                  </ol>
                </div>

              </div>
            </div>
          </ClientOnly>
        </div>

        <TulisInputLampiran v-model:uploaded="uploadedFiles" v-model:existingFiles="existingFiles" />

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
            class="px-8" :loading="isSdeLoading" @click="handleSaveDraft" />
          <UButton label="Kirim Dokumen" color="primary" size="lg" icon="i-heroicons-paper-airplane"
            class="px-8 font-bold" @click="handleKirimDokumen" />
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import { useAuth } from "@/composables/useAuth";
import type { Editor as TinyMCEEditor } from 'tinymce';
import type { Berkas } from "~/types/berkas";

// --- REUSE COMPOSABLE SDI (Karena logic penerima/save mirip) ---
import { useSdi } from "~/composables/useSdi";
import { type SdiPayload, validateSdiPayload } from "~/types/sdi";

// --- INITIALIZATION ---
const route = useRoute();
const router = useRouter();
const { getBerkasList } = useBerkas();
const { user, getProfile } = useAuth();
const toast = useToast();

const {
  getRecipients: getSdeRecipients,
  saveDraft,
  updateDraft,
  sendMessage,
  getDraftDetail,
  isLoading: isSdeLoading
} = useSdi();

const tinymceEditor = ref<TinyMCEEditor | null>(null);

// --- STATE ---
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Surat Dinas Eksternal", to: "#" },
];

const isOpenPreview = ref(false);
const isLoadingData = ref(false);
const editDraftId = ref<string | null>(null);

// Form Fields (Urutan Sesuai Request)
const message = ref(""); // 1. Pesan
const origin = ref("");  // 2. Asal Instansi/Perusahaan
const selectedBerkasId = ref<string | null>(null); // 3. Berkas
const berkasList = ref<Berkas[]>([]);
const berkasStatus = ref<"idle" | "loading" | "success" | "error">("idle");

const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())); // 4. Tgl

const selectedSifat = ref(); // 5. Sifat
const selectedTertuju = ref<any[]>([]); // 6. Tertuju
const selectedTembusan = ref<any[]>([]); // 7. Tembusan
const subject = ref(""); // 8. Perihal
const uploadedFiles = ref<File[]>([]); // 9. Lampiran (Posisi di UI paling bawah)
const existingFiles = ref<any[]>([]);

// Editor & PDF
const editorContent = ref(""); // 10. Konten Surat (Editor)
const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");
const english = ref(false);

// Template State
const isTemplateModalOpen = ref(false);
const isAddTemplateOpen = ref(false);
const isMyTemplateModalOpen = ref(false);
const newTemplateName = ref('');
const myTemplates = ref<any[]>([]);
const templates = [
  { id: '1', name: 'Undangan Rapat', content: '<p>Sehubungan dengan...</p>' },
  { id: '2', name: 'Permohonan Data', content: '<p>Untuk melengkapi data...</p>' }
]; // Mock templates

const items = ref<any[]>([]); // Dropdown Data

// Config Editor
const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 400,
  menubar: false,
  promotion: false,
  branding: false,
  placeholder: 'Ketik isi surat disini...',
  plugins: 'lists advlist link image code table fullscreen',
  toolbar: 'undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist table | code | fullscreen',
  content_style: `body { font-family: "Times New Roman", Times, serif; font-size: 14pt; }`,
  setup(editor: TinyMCEEditor) { tinymceEditor.value = editor; }
};

const sifatOptions = [{ label: "Rahasia", value: "rahasia" }, { label: "Biasa", value: "biasa" }, { label: "Segera", value: "segera" }];

const selectedBerkas = computed(() => berkasList.value.find((b) => b.id === selectedBerkasId.value));
const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

// --- HELPER: Template Functions ---
const applyTemplate = (t: any) => {
  if (tinymceEditor.value) {
    tinymceEditor.value.setContent(t.content);
    editorContent.value = t.content;
  }
  isTemplateModalOpen.value = false;
  isMyTemplateModalOpen.value = false;
};

const saveMyTemplate = () => {
  if (!newTemplateName.value.trim()) return;
  myTemplates.value.push({ id: Date.now(), name: newTemplateName.value, content: editorContent.value });
  newTemplateName.value = '';
  isAddTemplateOpen.value = false;
  toast.add({ title: 'Berhasil', description: 'Template berhasil disimpan', color: 'green' });
};

const deleteTemplate = (id: number) => {
  myTemplates.value = myTemplates.value.filter(t => t.id !== id);
};

// --- HELPER: Payload & FormData ---
const getBasePayload = (): SdiPayload => {
  const tglStr = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : new Date().toISOString().split("T")[0];

  return {
    id_naskah: editDraftId.value,
    pengirim: user.value?.position || "0",
    penerima: selectedTertuju.value.map(i => i.value),
    tembusan: selectedTembusan.value.map(i => i.value),
    klasifikasi: selectedBerkas.value?.klasifikasi || "UM.01",
    klasifikasi_text: selectedBerkas.value?.judulBerkas || "Umum",
    sifat: selectedSifat.value?.value || 'biasa',
    perihal: subject.value,
    konten: editorContent.value,
    english: english.value,
    nama_tempat: user.value?.areaText || "Tangerang",
    nama_jabatan: user.value?.positionText || "Kepala Divisi",
    tanda_tangan: "hash_ttd_placeholder",
    nama_lengkap: user.value?.nama || "User",
    tgl: tglStr,
    lampiran: uploadedFiles.value.length > 0 ? "Terlampir" : "-",
    final_pdf: null,
  } as any;
};

const validateAndToast = (payload: any) => {
  const result = validateSdiPayload(payload);
  if (!result.isValid) {
    const firstError = Object.values(result.errors)[0];
    toast.add({ title: 'Validasi Gagal', description: firstError, color: 'red' });
    return false;
  }
  return true;
};

const createFormData = (payload: any, includePdf: boolean = false) => {
  const formData = new FormData();
  formData.append("pengirim", String(payload.pengirim));
  payload.penerima.forEach((id: any) => formData.append("penerima[]", String(id)));
  payload.tembusan.forEach((id: any) => formData.append("tembusan[]", String(id)));

  formData.append("klasifikasi", payload.klasifikasi);
  formData.append("klasifikasi_text", payload.klasifikasi_text);
  formData.append("sifat", payload.sifat);
  formData.append("perihal", payload.perihal);
  formData.append("konten", payload.konten);
  formData.append("english", String(payload.english));
  formData.append("nama_tempat", payload.nama_tempat);
  formData.append("nama_jabatan", payload.nama_jabatan);
  formData.append("tanda_tangan", payload.tanda_tangan);
  formData.append("nama_lengkap", payload.nama_lengkap);
  formData.append("tgl", payload.tgl);

  // Custom Fields SDE
  formData.append("message", message.value);
  formData.append("origin", origin.value);

  // Lampiran
  if (uploadedFiles.value.length > 0) {
    uploadedFiles.value.forEach((file) => formData.append("lampiran_files", file, file.name));
  }

  if (includePdf && pdfBlob.value) {
    formData.append("final_pdf", pdfBlob.value, `Surat_Dinas_Eksternal_${payload.tgl}.pdf`);
  }
  return formData;
};

// --- HANDLERS (Sama seperti Nodin/SDI) ---
const handlePreview = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  isLoadingData.value = true;
  try {
    isOpenPreview.value = true;
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    pdfBlob.value = null;

    // Masukkan "Asal Instansi" ke data penerima untuk Preview PDF
    const recipientsWithOrigin = selectedTertuju.value.map(i => {
      return origin.value
        ? `${i.labelJob || i.label} di ${origin.value}`
        : (i.labelJob || i.label);
    });

    const pdfPayload = {
      penerima: recipientsWithOrigin,
      tembusan: selectedTembusan.value.map(i => i.labelJob || i.label),
      tgl: payload.tgl,
      perihal: payload.perihal,
      sifat: payload.sifat,
      htmlContent: payload.konten,
      penandatangan: payload.nama_lengkap,
      nama_jabatan: payload.nama_jabatan,
      nama_tempat: payload.nama_tempat
    };

    const response = await fetch("http://172.20.16.115:3011/ND/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pdfPayload),
    });

    if (!response.ok) throw new Error("Gagal generate PDF");
    const blob = await response.blob();
    pdfBlob.value = blob;
    pdfUrl.value = URL.createObjectURL(blob);
  } catch (e) {
    console.error(e);
    toast.add({ title: 'Error Preview', description: 'Gagal membuat preview PDF', color: 'red' });
    isOpenPreview.value = false;
  } finally {
    isLoadingData.value = false;
  }
};

const handleSaveDraft = async () => {
  if (!user.value) await getProfile();
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;
  const formData = createFormData(payload, false);

  try {
    if (editDraftId.value) {
      await updateDraft(editDraftId.value, formData);
      toast.add({ title: 'Berhasil', description: 'Draft diperbarui', color: 'green' });
    } else {
      await saveDraft(formData);
      toast.add({ title: 'Berhasil', description: 'Draft disimpan', color: 'green' });
    }
    isOpenPreview.value = false;
    router.push("/admin/korespondensi/draft");
  } catch (e) {
    toast.add({ title: 'Gagal', description: 'Gagal menyimpan draft', color: 'red' });
  }
};

const handleKirimDokumen = async () => {
  if (!user.value) await getProfile();
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;
  if (!pdfBlob.value) {
    toast.add({ title: 'PDF Belum Siap', description: 'Tunggu preview selesai', color: 'orange' });
    return;
  }
  const formData = createFormData(payload, true);

  try {
    await sendMessage(formData);
    toast.add({ title: 'Terkirim', description: 'Surat berhasil dikirim', color: 'green' });
    isOpenPreview.value = false;
    router.push("/admin/korespondensi/terkirim");
  } catch (e) {
    toast.add({ title: 'Gagal', description: 'Gagal mengirim dokumen', color: 'red' });
  }
};

// --- LIFECYCLE ---
onMounted(async () => {
  if (!user.value) try { await getProfile(); } catch (e) { return; }

  // Load Berkas
  try {
    berkasStatus.value = "loading";
    const res = await getBerkasList();
    berkasList.value = Array.isArray(res) ? res : (res?.data ?? []);
    berkasStatus.value = "success";
  } catch (e) { berkasStatus.value = "error"; }

  // Load Recipients (Reuse logic)
  try {
    const posId = user.value?.position;
    const res = await getSdeRecipients(posId);

    // Mapping Data
    const rawData = res.data || [];
    items.value = rawData.map((r: any) => ({
      label: `${r.persnum_person_text} - (${r.position_abbreviation}) ${r.position_text}`,
      labelJob: r.position_text,
      value: String(r.position),
      raw: r
    }));
  } catch (e) { console.error("Gagal load recipients", e); }

  // Edit Mode Logic
  const draftId = route.query.draft_id as string;
  if (draftId) {
    editDraftId.value = draftId;
    const res = await getDraftDetail(draftId);

    if (res.success && res.data) {
      const d = res.data;
      subject.value = d.perihal || "";
      editorContent.value = d.konten || "";
      english.value = d.english || false;
      message.value = d.message || ""; // Populate Pesan
      origin.value = d.origin || "";   // Populate Asal Instansi

      const draftSifat = d.sifat?.toLowerCase();
      selectedSifat.value = sifatOptions.find(o => o.value === draftSifat) || sifatOptions[1];

      if (d.tgl) {
        const dateObj = new Date(d.tgl);
        date.value = new CalendarDate(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
      }

      if (d.klasifikasi && berkasList.value.length > 0) {
        const found = berkasList.value.find(b =>
          b.klasifikasi?.toString().toLowerCase() === d.klasifikasi.toString().toLowerCase()
        );
        if (found) selectedBerkasId.value = found.id;
      }

      const mapRecipients = (list: any[]) => {
        if (!Array.isArray(list)) return [];
        return list.map(item => {
          const id = typeof item === 'object' ? (item.position || item.value) : item;
          const strId = String(id);
          const found = items.value.find(i => i.value === strId);
          if (found) return found;
          return {
            label: item.nama || item.position_text || strId,
            labelJob: item.jabatan || item.position_text || '',
            value: strId
          };
        });
      };

      if (d.penerima) selectedTertuju.value = mapRecipients(d.penerima);
      if (d.tembusan) selectedTembusan.value = mapRecipients(d.tembusan);
      await nextTick();
    }
  }
});
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}

td {
  padding-bottom: 4px;
}
</style>
