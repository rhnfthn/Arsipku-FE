<template>
  <div class="relative">

    <LoadingOverlay :loading="isLoadingData && loadingMessage !== 'Memuat...'" :message="loadingMessage" />

    <PageHeader title="Tulis Disposisi" :items="breadcrumbs" />

    <UCard variant="soft" :ui="{
      root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm',
    }">

      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 4" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
        </div>
        <div class="py-4 space-y-3 border-t border-gray-100 dark:border-gray-800 mt-2">
          <USkeleton class="h-5 w-40 mb-2" />
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="j in 12" :key="j" class="flex items-center gap-3">
              <USkeleton class="h-5 w-5 rounded shrink-0" />
              <USkeleton class="h-4 w-full max-w-[150px] rounded" />
            </div>
          </div>
        </div>
        <div
          class="border border-gray-200 dark:border-gray-700 rounded-lg h-[400px] p-6 space-y-5 bg-white dark:bg-gray-800 mt-4">
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
        <TulisInputTanggal v-model="date" label="Tanggal Disposisi" />
        <TulisInputSifat v-model="selectedSifat" />

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Ref. Nomor Surat
            </span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="refNumber"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Ketik Ref. Nomor Surat" />
            </div>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Ref. Perihal
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
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Instruksi / Disposisi</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="opt in checklistOptions" :key="opt" class="flex gap-2 items-start group">
              <input type="checkbox" :id="opt" :value="opt" v-model="selectedChecklist"
                class="mt-0.5 w-4 h-4 shrink-0 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
              <label :for="opt"
                class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none leading-tight break-words">
                {{ opt }}
              </label>
            </div>
          </div>
        </div>

        <ClientOnly>
          <div
            class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">
            <div class="bg-white p-10 border-b border-gray-100 select-none text-black">
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
                  <div class="relative" v-if="showEditor" ref="editorContainerRef">
                    <Editor api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" />
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

        <div class="flex flex-col sm:flex-row sm:items-center py-4">
          <div class="flex items-center gap-2">
            <input type="checkbox" id="isPriority" :checked="isPriority" @change="handlePriorityChange"
              class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
            <label for="isPriority" class="text-sm cursor-pointer select-none">
              Tandai sebagai Prioritas
            </label>
          </div>
        </div>

        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-800">
          <UButton label="Pratinjau" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold"
            @click="handlePreview" />
        </div>
      </div>
    </UCard>

    <TulisPreviewSlideover v-model:open="isOpenPreview" :pdf-url="pdfUrl" :alert-is-open="alertState.isOpen"
      @save-draft="confirmSaveDraft" @send="confirmKirimDokumen" />

    <TulisDigsigPassphraseModal v-model:open="isPassphraseModalOpen" :signer-info="signerInfo"
      :is-loading="isLoadingData" @submit="handlePassphraseSubmit" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import type { Editor as TinyMCEEditor } from 'tinymce';
import { validateDisposisiPayload, type DisposisiPayload } from "~/types/disposisi";
import { Alert } from "@/composables/useAlert";
import { useDigSign } from "@/composables/useDigSign";

const { digsigConfig, fetchDigsigConfig } = useDigsig();
definePageMeta({ middleware: ['auth', 'tulis-access'] })

const editorContainerRef = ref<HTMLElement | null>(null);
const route = useRoute();
const router = useRouter();
const toast = useToast();

const { user, getProfile } = useAuth();
const { getRecipients, sendDisposisi, saveDraft, sendDraft, updateDraft, getDraftDetail, generatePdf } = useDisposisi();

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Tulis Disposisi", to: "#" },
];

const isSettingInitialData = ref(false);
const isLoadingData = ref(false);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const editDraftId = ref<string | null>(null);

const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));

const selectedSifat = ref<any>(null);
const isPriority = ref(false);
const refNumber = ref("-");
const refPerihal = ref("-");

const recipientList = ref<any[]>([]);
const selectedTertuju = ref<any[]>([]);
const existingFiles = ref<any[]>([]);
const selectedChecklist = ref<string[]>([]);

const editorContent = ref("");
const tinymceEditor = ref<TinyMCEEditor | null>(null);

const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");
const alertState = useAlertState();

const isPassphraseModalOpen = ref(false);
const selectedSendType = ref('qr_only');

const signerInfo = computed(() => ({
  name: user.value?.nama || 'Nama Lengkap',
  role: user.value?.positionText || 'Jabatan',
  label: 'Ditandatangani secara digital oleh'
}));

const checklistOptions = [
  "Untuk Diketahui", "Proses Lanjut", "Koordinasikan", "Cek", "Monitor", "Evaluasi",
  "Dikaji Kemungkinannya", "Laporkan", "Untuk Menjadi Perhatian",
  "Untuk Dijadikan Acuan/Dipergunakan", "Harap Mewakili", "Harap Mendampingi",
  "Tunjuk Perwakilan", "Siapkan Bahan/Materi", "Lainnya",
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

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

const showEditor = computed(() => {
  return selectedChecklist.value.includes("Lainnya");
});

watch(showEditor, async (isShown) => {
  if (isShown) {
    await nextTick();
    if (editorContainerRef.value) {
      editorContainerRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        if (tinymceEditor.value) tinymceEditor.value.focus();
      }, 500);
    }
  }
});

const handlePriorityChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const wantToCheck = target.checked;

  if (!wantToCheck) {
    isPriority.value = false;
    return;
  }

  target.checked = false;

  const isConfirmed = await Alert.confirm(
    'Tandai sebagai Prioritas?',
    'Dokumen ini akan mendapatkan label prioritas tinggi. Lanjutkan?',
    'Ya, Prioritas',
    'Batal',
    false
  );

  Alert.close();
  if (isConfirmed) {
    isPriority.value = true;
  }
};

const getPayload = (): DisposisiPayload => {
  const tglDb = `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`;
  const tglUi = `${String(date.value.day).padStart(2, "0")}/${String(date.value.month).padStart(2, "0")}/${date.value.year}`;

  return {
    id_naskah: editDraftId.value || null,
    pengirim: user.value?.position || "",
    tertuju: selectedTertuju.value.map(i => i.value),
    tanggal_disposisi: tglDb,
    tanggal_ui: tglUi,
    sifat: selectedSifat.value?.label || "Biasa",
    ref_nomor: refNumber.value || "-",
    ref_perihal: refPerihal.value || "-",
    catatan: showEditor.value ? editorContent.value : "",
    htmlContent: showEditor.value ? editorContent.value : "",
    disposisi: selectedChecklist.value,
    is_priority: isPriority.value,
    lampiran_temp_ids: existingFiles.value.map(f => f.id).filter(Boolean)
  };
};

const createFormData = (payload: DisposisiPayload, includePdf: boolean = false) => {
  const formData = new FormData();

  Object.keys(payload).forEach((key) => {
    const k = key as keyof DisposisiPayload;
    if (k === 'tanggal_ui') return;

    const value = payload[k];

    if (k === 'is_priority') {
      const boolValue = Boolean(value);
      formData.append(k, boolValue ? 'true' : 'false');
      return;
    }

    if (Array.isArray(value)) {
      formData.append(k, JSON.stringify(value));
    } else if (typeof value === 'boolean') {
      formData.append(k, value ? 'true' : 'false');
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
    toast.add({ title: 'Gagal Preview', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const confirmKirimDokumen = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) return;

  const diConfig = digsigConfig.value.find(c => c.jenisNaskah === 'DI');
  const isDigsigEnabled = diConfig?.enabled ?? false;

  if (isDigsigEnabled) {
    selectedSendType.value = "digsig";
    isPassphraseModalOpen.value = true;
  } else {
    selectedSendType.value = "qr_only";
    const isConfirmed = await Alert.confirm(
      'Konfirmasi Akhir',
      'Dokumen akan dikirim tanpa tanda tangan BSrE. Lanjutkan?',
      'Ya, Kirim Sekarang',
      'Periksa Lagi',
      false
    );

    if (isConfirmed) {
      await handleKirimDokumen();
    }
  }
};

const handlePassphraseSubmit = async (passphrase: string) => {
  if (selectedSendType.value === 'digsig' && !passphrase) {
    toast.add({
      title: 'Wajib Diisi',
      description: 'Harap masukkan passphrase Anda',
      color: 'warning'
    });
    isPassphraseModalOpen.value = true;
    return;
  }

  const confirmMessage = selectedSendType.value === 'digsig'
    ? 'Apakah Anda yakin Passphrase benar dan ingin mengirim dokumen ini?'
    : 'Dokumen akan dikirim tanpa tanda tangan BSrE. Lanjutkan?';

  const isConfirmed = await Alert.confirm(
    'Konfirmasi Akhir',
    confirmMessage,
    'Ya, Kirim Sekarang',
    'Periksa Lagi',
    false
  );

  if (isConfirmed) {
    await handleKirimDokumen(passphrase);
  }
};

const handleKirimDokumen = async (passphrase: string = '') => {
  const payload = getPayload();

  try {
    loadingMessage.value = "Mengirim Disposisi...";
    isLoadingData.value = true;

    let nikValue = '';

    if (selectedSendType.value === 'digsig') {
      if (!user.value?.nik) {
        throw new Error("NIK pengguna tidak ditemukan untuk TTE.");
      }
      nikValue = user.value.nik;
    }

    const fdPreview = createFormData(payload, false);
    const blobResponse = await generatePdf(fdPreview);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });

    const fdFinal = createFormData(payload, true);

    fdFinal.append('passphrase', passphrase);
    fdFinal.append('sign_option', selectedSendType.value);

    if (nikValue) {
      fdFinal.append('nik', nikValue);
    }

    let res;
    if (editDraftId.value) {
      res = await sendDraft(fdFinal, editDraftId.value);
    } else {
      res = await sendDisposisi(fdFinal);
    }

    if (res?.success || res?.data?.success) {
      if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
      toast.add({ title: 'Berhasil', description: 'Disposisi berhasil dikirim', color: 'success' });
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

const handleSaveDraft = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) throw new Error("Validation failed");

  try {
    loadingMessage.value = "Menyimpan Draft...";
    isLoadingData.value = true;

    const fd = createFormData(payload, false);
    if (editDraftId.value) {
      await updateDraft(fd, editDraftId.value);
    } else {
      await saveDraft(fd);
    }
    toast.add({ title: 'Berhasil', description: 'Draft berhasil disimpan', color: 'success' });
    router.push("/korespondensi/draf");
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

onMounted(async () => {
  await fetchDigsigConfig();

  loadingMessage.value = "Memuat...";
  isLoadingData.value = true;

  if (!user.value) await getProfile();

  try {
    const res = await getRecipients(user.value?.position);
    recipientList.value = res.recipients;

    const draftId = route.query.draft_id as string;
    if (draftId) {
      editDraftId.value = draftId;
      const resDraft = await getDraftDetail(draftId);

      if (resDraft.data && resDraft.data.flow && resDraft.data.flow.length > 0) {
        isSettingInitialData.value = true;

        const d = resDraft.data.flow[0];

        refNumber.value = d.ref_nomor || d.nomor || "-";
        refPerihal.value = d.ref_perihal || d.perihal || "-";
        isPriority.value = d.is_priority === true || d.is_priority === 1 || String(d.is_priority) === "1";

        if (d.tanggal) {
          const [y, m, day] = d.tanggal.split('-').map(Number);
          date.value = new CalendarDate(y, m, day);
        }

        editorContent.value = d.catatan || d.htmlContent || "";
        if (tinymceEditor.value) tinymceEditor.value.setContent(editorContent.value);

        if (d.disposisi) {
          if (Array.isArray(d.disposisi)) {
            selectedChecklist.value = d.disposisi;
          } else if (typeof d.disposisi === 'string') {
            selectedChecklist.value = d.disposisi.split('\n');
          }
        }

        const foundSifat = sifatOptions.find(s => s.value.toLowerCase() === (d.sifat || '').toLowerCase());
        selectedSifat.value = foundSifat || sifatOptions[3];

        const rawPenerima = d.penerima || [];
        selectedTertuju.value = rawPenerima.map((item: any) => {
          const val = String(item.position_id || item.value || item.id);
          const found = recipientList.value.find(r => r.value === val);
          return found || {
            value: val,
            label: item.nama || item.label,
            labelJob: item.position_text || item.positionText || item.labelJob
          };
        });

        if (d.lampiran_files) {
          existingFiles.value = d.lampiran_files.map((f: any) => ({
            id: f.id,
            fileName: f.file_name || f.fileName,
            filePath: f.file_url || f.file_path || f.filePath,
            fileSize: 0
          }));
        }

        await nextTick();
        isSettingInitialData.value = false;
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
