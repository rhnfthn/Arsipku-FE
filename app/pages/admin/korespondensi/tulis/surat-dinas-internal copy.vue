<template>
  <div class="">
    <div v-if="isLoadingData || isSdiLoading"
      class="fixed inset-0 z-[99999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-2">
        <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
        <span class="text-gray-600 font-medium">Memproses...</span>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden transition-colors">
      <PageHeader title="Tulis Surat Dinas Internal" :items="breadcrumbs" />
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
          </div>

          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 dark:bg-gray-800 transition-all duration-300 relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">

              <div
                class="bg-white dark:bg-gray-900 pt-10 pb-10 border-b border-gray-100 dark:border-gray-700 select-none text-black dark:text-white">

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
                          <td class="align-top">-</td>
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
                        </div>
                      </div>
                      <div v-else>................................................</div>
                    </div>
                    <div class="mb-1">Di Tempat</div>
                  </div>
                </div>

                <div class="min-h-[300px] text-justify leading-relaxed">
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
            class="px-8" :loading="isSdiLoading" @click="handleSaveDraft" />
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

import { useSdi } from "~/composables/useSdi";
import { type SdiPayload, validateSdiPayload } from "~/types/sdi";

const route = useRoute();
const router = useRouter();
const { getBerkasList } = useBerkas();
const { user, getProfile } = useAuth();
const toast = useToast();

const {
  getRecipients: getSdiRecipients,
  saveDraft: saveSdiDraft,
  updateDraft: updateSdiDraft,
  sendMessage: sendSdiMessage,
  getDraftDetail: getSdiDraftDetail,
  isLoading: isSdiLoading
} = useSdi();

const tinymceEditor = ref<TinyMCEEditor | null>(null);

// State
const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Surat Dinas Internal", to: "#" },
];
const isOpenPreview = ref(false);
const isLoadingData = ref(false);
const editDraftId = ref<string | null>(null);

const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));

const subject = ref("");
const selectedSifat = ref();
const english = ref(false);

const berkasList = ref<Berkas[]>([]);
const berkasStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const selectedBerkasId = ref<string | null>(null);

const items = ref<any[]>([]); // Data Dropdown
const selectedTertuju = ref<any[]>([]);
const selectedTembusan = ref<any[]>([]);

const editorContent = ref("");
const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");
const isTemplateModalOpen = ref(false);

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
  content_style: `body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.5; border: none !important; }`,
  setup(editor: TinyMCEEditor) { tinymceEditor.value = editor; }
};

const sifatOptions = [{ label: "Rahasia", value: "rahasia" }, { label: "Biasa", value: "biasa" }, { label: "Segera", value: "segera" }];

const selectedBerkas = computed(() => berkasList.value.find((b) => b.id === selectedBerkasId.value));
const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

// --- Logic Validasi ---
const validateAndToast = (payload: SdiPayload) => {
  const result = validateSdiPayload(payload);
  if (!result.isValid) {
    const firstError = Object.values(result.errors)[0];
    toast.add({ title: 'Validasi Gagal', description: firstError, color: 'red' });
    return false;
  }
  return true;
};

// --- Prepare Payload ---
const getBasePayload = (): SdiPayload => {
  const tglStr = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : new Date().toISOString().split("T")[0];

  return {
    id_naskah: editDraftId.value,
    pengirim: user.value?.position || "70007846",
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
    tanda_tangan: "vsydc526d728g29uwedhwidciwdcbhbddy2",
    nama_lengkap: user.value?.nama || "User",
    tgl: tglStr,
    lampiran: "-",
    final_pdf: null,
  };
};

const createFormData = (payload: SdiPayload, includePdf: boolean = false) => {
  const formData = new FormData();
  formData.append("pengirim", String(payload.pengirim));

  payload.penerima.forEach(id => formData.append("penerima[]", String(id)));
  payload.tembusan.forEach(id => formData.append("tembusan[]", String(id)));

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
  formData.append("lampiran", payload.lampiran);

  if (includePdf && pdfBlob.value) {
    formData.append("final_pdf", pdfBlob.value, `Surat_Dinas_Internal_${payload.tgl}.pdf`);
  }
  return formData;
};

// --- Handlers ---
const handlePreview = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  isLoadingData.value = true;
  try {
    isOpenPreview.value = true;
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    pdfBlob.value = null;

    const pdfPayload = {
      penerima: selectedTertuju.value.map(i => i.labelJob || i.label),
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
      await updateSdiDraft(editDraftId.value, formData);
      toast.add({ title: 'Berhasil', description: 'Draft diperbarui', color: 'green' });
    } else {
      await saveSdiDraft(formData);
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
    await sendSdiMessage(formData);
    toast.add({ title: 'Terkirim', description: 'Surat berhasil dikirim', color: 'green' });
    isOpenPreview.value = false;
    router.push("/admin/korespondensi/terkirim");
  } catch (e) {
    toast.add({ title: 'Gagal', description: 'Gagal mengirim dokumen', color: 'red' });
  }
};

// --- ON MOUNTED ---
onMounted(async () => {
  if (!user.value) try { await getProfile(); } catch (e) { return; }

  // Load Berkas
  try {
    berkasStatus.value = "loading";
    const res = await getBerkasList();
    berkasList.value = Array.isArray(res) ? res : (res?.data ?? []);
    berkasStatus.value = "success";
  } catch (e) { berkasStatus.value = "error"; }

  // --- Load Recipients (FIX LOGIC) ---
  try {
    const posId = user.value?.position;

    // Panggil getSdiRecipients dari composable
    // Return: { success: true, data: [...array flat] }
    const res = await getSdiRecipients(posId);

    const rawData = res.data || [];

    // Mapping ke format items dropdown
    items.value = rawData.map((r: any) => ({
      label: `${r.persnum_person_text} - (${r.position_abbreviation}) ${r.position_text}`,
      labelJob: r.position_text,
      value: String(r.position),
      raw: r
    }));

  } catch (e) { console.error("Gagal load recipients SDI", e); }

  // Edit Mode Logic
  const draftId = route.query.draft_id as string;
  if (draftId) {
    editDraftId.value = draftId;
    const res = await getSdiDraftDetail(draftId);

    if (res.success && res.data) {
      const d = res.data;
      subject.value = d.perihal || "";
      editorContent.value = d.konten || "";
      english.value = d.english || false;
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
