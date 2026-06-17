<template>
  <div class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== 'Memuat...'" :message="loadingMessage" />

    <PageHeader title="Tulis Lanjut Surat Dinas Eksternal" :items="breadcrumbs" />

    <div v-if="refData" class="mb-4 mt-6">
      <div
        class="rounded-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm overflow-hidden">
        <div @click="isRefExpanded = !isRefExpanded"
          class="flex items-center align-center justify-between px-5 py-3 cursor-pointer bg-white hover:bg-gray-50 dark:hover:bg-primary-900/30 transition-colors border-b border-primary-100 dark:border-primary-800/50">
          <div class="flex items-center py-2 gap-3">
            <div class="p-0.5 rounded-md bg-primary-500 text-white shadow-sm w-9 h-9 flex items-center justify-center">
              <UIcon name="i-lucide-mail" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-bold text-gray-800 dark:text-white leading-none mb-0.5">Referensi Surat Asal</h3>
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                {{ refData?.[0]?.nomor || '-' }} • {{ formatDateRef(refData?.[0]?.tanggal) }}
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
              <input type="text" v-model="lampiranText" readonly tabindex="-1"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 cursor-default opacity-75"
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
                    <div class="font-bold uppercase">{{ user?.alamatInfo?.kantor }}</div>
                    <div>{{ user?.alamatInfo?.gedung }} {{ user?.alamatInfo?.kota }}</div>
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
                          <td class="align-top">{{ lampiranText || '-' }}</td>
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
                      <div v-if="selectedTertuju.length > 5">Periksa Alamat Terlampir</div>
                      <div v-else-if="selectedTertuju.length > 0">
                        <div v-for="t in selectedTertuju" :key="t.value">{{ t.label }}</div>
                      </div>
                      <div v-else>................................................</div>
                    </div>
                    <div class="mb-1">Di Tempat</div>
                  </div>
                </div>

                <div class="min-h-[300px] relative group">
                  <Editor api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" />
                </div>

                <div class="flex mt-12 text-black px-10">
                  <div class="text-center min-w-[250px]">
                    <div class="mb-24 text-[14px]">
                      <div class="font-bold">{{ user?.positionText || 'Nama Jabatan' }}</div>
                    </div>
                    <div class="font-bold text-[14px] underline">{{ user?.nama || 'Nama Lengkap' }}</div>
                  </div>
                </div>

                <div class="mt-8 text-[12px] text-black px-10">
                  <div class="font-bold underline mb-1">Tembusan :</div>
                  <div v-if="selectedTembusan.length > 5" class="ml-4 pl-2">Periksa Alamat Terlampir</div>
                  <ol v-else-if="selectedTembusan.length > 0" class="list-decimal ml-4 pl-2">
                    <li v-for="t in selectedTembusan" :key="t.value">{{ t.labelJob + (t.raw?.area_text ? " - " +
                      t.raw.area_text : "") }}</li>
                  </ol>
                  <div v-else class="ml-4 pl-2 text-gray-400 italic">...</div>
                </div>

                <div v-if="selectedTertuju.length > 5 || selectedTembusan.length > 5"
                  class="bg-white px-12 py-12 border-t-4 border-gray-200 text-black break-before-page mt-10">
                  <div class="flex justify-end mb-10 text-[14px]">
                    <div class="text-left min-w-[300px]">
                      <table class="w-full">
                        <tbody>
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
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div v-if="selectedTertuju.length > 5" class="mb-8">
                    <div class="font-bold text-[14px] mb-2 uppercase">KEPADA YTH :</div>
                    <ol class="list-decimal ml-6 text-[14px] space-y-1">
                      <li v-for="item in selectedTertuju" :key="item.value">{{ item.label }}</li>
                    </ol>
                  </div>
                  <div v-if="selectedTembusan.length > 5">
                    <div class="font-bold text-[14px] mb-2 uppercase">TEMBUSAN :</div>
                    <ol class="list-decimal ml-6 text-[14px] space-y-1">
                      <li v-for="item in selectedTembusan" :key="item.value">
                        {{ item.labelJob + (item.raw?.area_text ? " - " + item.raw.area_text : "") }}
                      </li>
                    </ol>
                  </div>
                </div>

              </div>
            </div>
          </ClientOnly>

          <div class="flex items-center py-3 mt-2 gap-2">
            <input type="checkbox" id="check_english" v-model="isEnglish"
              class="w-4 h-4 shrink-0 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
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

    <TulisPreviewSlideover v-model:open="isOpenPreview" :pdf-url="pdfUrl" @save-draft="handleConfirmSaveDraft"
      @send="handleConfirmKirim" />

    <TulisDigsigPassphraseModal v-model:open="isSignMethodModalOpen" :signer-info="signerInfo"
      :is-loading="isLoadingData" :hide-bsre="bsreDisabled" :hide-qr="qrDisabled" :hide-basah="basahDisabled"
      ref="signMethodModalRef" @submit="handleSignMethodSubmit" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
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
import { Alert } from "@/composables/useAlert";
import { useDigsig } from "@/composables/useDigsig";
import { useInbox } from "@/composables/useInbox";
import { useSde } from "~/composables/useSde";
import { validateSDEPayload } from "~/types/sde";

definePageMeta({ middleware: ['auth', 'tulis-access'] })

const route = useRoute();
const router = useRouter();

const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { saveDraft, updateDraft, sendSDE, getSDEDetail, generatePdf, getExternalRecipients, getRecipientInfo } = useSde();
const { getConfigDigsig } = useDigsig();
const { fetchInboxDetail } = useInbox();

// ── Shared composable ────────────────────────────────────────────────────────
const {
  isLoadingData, loadingMessage, isOpenPreview,
  editDraftId, subject, editorContent, tinymceEditor,
  date, selectedKlasifikasiId, selectedSifat, existingFiles,
  klasifikasiList, klasifikasiStatus,
  selectedTertuju, selectedTembusan,
  pdfBlob, pdfUrl,
  maxPerihal, sifatOptions, tinyMceInit,
  selectedKlasifikasi, formattedDate, tglDb, tglDisplay,
  handleApplyTemplate, buildFormData, mapLampiranFiles, setDateFromString, setSifatFromString,
  setPdfBlob, revokePdfUrl, confirmSaveDraft, confirmKirim,
  toastError, toastSuccess, redirectTerkirim, redirectDraf,
} = useTulis();


// --- SDE & REF SPECIFIC STATE ---
const lampiranText = ref("");
const isEnglish = ref(false);

const externalItems = ref<any[]>([]); // Data dropdown Tertuju
const internalItems = ref<any[]>([]); // Data dropdown Tembusan

const selectedSendType = ref("qr_only");
const refData = ref<any>(null);
const isRefExpanded = ref(false);

// ── Sign method modal state ───────────────────────────────────────────────────
const isSignMethodModalOpen = ref(false);
const bsreDisabled = ref(false);
const qrDisabled = ref(false);
const basahDisabled = ref(false);
const signMethodModalRef = ref<any>(null);

const breadcrumbs = computed(() => {
  const refId = route.query.ref_id as string || "";
  const refJenis = route.query.ref_jenis as string || "";
  return [
    { label: "Beranda", to: "/beranda" },
    { label: "Kotak Masuk", to: "/korespondensi/kotak-masuk" },
    { label: "Detail Surat", to: `/korespondensi/kotak-masuk/${refId}?jenis=${refJenis}` },
    { label: "Tulis Lanjut Surat Dinas Eksternal", to: "#" },
  ];
});

const signerInfo = computed(() => ({
  name: user.value?.nama || 'Nama Lengkap',
  role: user.value?.positionText || 'Jabatan',
  label: 'Ditandatangani secara digital oleh'
}));

const refPdfUrl = computed(() => {
  if (!refData.value?.length) return "";
  const item = refData.value[0];
  if (item.final_pdf_url) return item.final_pdf_url;
  if (item.lampiran_files?.length) {
    const f = item.lampiran_files[0];
    return f.file_url || f.file_path || f.url || "";
  }
  return "";
});

const formatDateRef = (dateString: string) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return dateString; }
};

// --- METHODS: PAYLOAD & VALIDATION ---
const getPayload = () => {
  return {
    id_naskah: editDraftId.value || null,
    id_referensi_naskah: (route.query.ref_id as string) || null,
    pengirim: user.value?.position || "",
    penerima: selectedTertuju.value.map(item => item.value),
    tembusan: selectedTembusan.value.map(i => i.value),
    klasifikasi: selectedKlasifikasi.value?.klasifikasi || "",
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || "",
    sifat: selectedSifat.value?.value || "biasa",
    perihal: subject.value || "",
    lampiran: lampiranText.value,
    konten: editorContent.value || "",
    htmlContent: editorContent.value || "",
    english: isEnglish.value,
    nama_tempat: user.value?.areaText || "Tangerang",
    nama_jabatan: user.value?.positionText || "",
    nama_lengkap: user.value?.nama || "",
    tgl: tglDb.value || "",
    tanggal: tglDisplay.value || "",
    lampiran_temp_ids: existingFiles.value.map(f => f.id).filter(id => !!id)
  };
};

const createFormData = (payload: any, includePdf: boolean = false) => {
  const formData = new FormData();
  Object.keys(payload).forEach((key) => {
    if (key === 'tanggal') return;
    const value = payload[key];
    if (key === 'penerima' || key === 'tembusan' || key === 'lampiran_temp_ids') {
      formData.append(key, JSON.stringify(value));
    } else if (key === "english") {
      formData.append(key, value ? "1" : "0");
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });

  if (includePdf && pdfBlob.value) {
    const judul = payload.perihal || 'dokumen_sde';
    const safeName = judul.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
    formData.append("final_pdf", pdfBlob.value, `SDE_${safeName}.pdf`);
  }
  return formData;
};

const validateAndToast = (payload: any) => {
  const check = validateSDEPayload(payload);
  if (!check.isValid) {
    const firstKey = Object.keys(check.errors)[0];
    toastError('Validasi Gagal', check.errors[firstKey]);
    return false;
  }

  // Validasi konten TinyMCE — strip HTML dulu
  const rawHtml = payload.konten || "";
  const textOnly = rawHtml.replace(/<[^>]*>/g, '').trim();
  const hasImage = rawHtml.includes('<img');
  if (!textOnly && !hasImage) {
    toastError('Konten Kosong', 'Mohon isi badan surat terlebih dahulu.');
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
    const fd = createFormData(payload, false);
    const blob = await generatePdf(fd);
    setPdfBlob(blob);
    isOpenPreview.value = true;
  } catch (err) {
    toastError('Gagal membuat preview');
  } finally {
    isLoadingData.value = false;
  }
};

const handleSaveDraftAction = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) return;

  loadingMessage.value = "Menyimpan Draft...";
  isLoadingData.value = true;

  try {
    const fd = createFormData(payload, false);
    let res = editDraftId.value ? await updateDraft(fd, editDraftId.value) : await saveDraft(fd);

    if (res?.success || res?.data?.success) {
      toastSuccess('Berhasil', 'Draft berhasil disimpan');
      if (res.data?.id) editDraftId.value = res.data.id;
      redirectDraf();
    } else {
      throw new Error(res?.data?.message || 'Gagal menyimpan draft');
    }
  } catch (e: any) {
    toastError('Gagal', e.response?.data?.message || 'Gagal memperbarui draft');
  } finally {
    Alert.close();
    isLoadingData.value = false;
  }
};

const handleConfirmSaveDraft = () => confirmSaveDraft(handleSaveDraftAction);

const handleKirimDokumen = async (passphrase = "", fileBasah?: File) => {
  if (selectedSendType.value === "digsig" && !passphrase.trim()) {
    signMethodModalRef.value?.setPassphraseError("Harap masukkan passphrase Anda");
    return;
  }

  const payload = getPayload();
  loadingMessage.value = "Mengirim Surat Dinas Eksternal...";
  isLoadingData.value = true;

  try {
    const blobResponse = await generatePdf(createFormData(payload, false));
    setPdfBlob(blobResponse);

    const fdFinal = createFormData(payload, true);
    fdFinal.append('passphrase', passphrase);
    fdFinal.append('sign_option', selectedSendType.value);

    if (selectedSendType.value === 'digsig') {
      if (!user.value?.nik) throw new Error("NIK pengguna tidak ditemukan untuk TTE.");
      fdFinal.append('nik', user.value.nik);
    }

    if (selectedSendType.value === "basah" && fileBasah) {
      fdFinal.append("file_ttd_basah", fileBasah);
    }

    const res = await sendSDE(fdFinal);

    if (res?.success || res?.data?.success) {
      revokePdfUrl();
      toastSuccess('Berhasil', 'Surat Dinas Eksternal terkirim');
      Alert.close();
      redirectTerkirim();
    } else {
      throw new Error(res?.data?.message || res?.message || 'Pengiriman gagal');
    }
  } catch (e: any) {
    Alert.close();
    let errMsg = e.response?.data?.message || e.message || 'Gagal mengirim dokumen';
    if (errMsg.toLowerCase().includes('passphrase') || errMsg.toLowerCase().includes("salah")) {
      bsreDisabled.value = false;
      await nextTick();
      isSignMethodModalOpen.value = true;
      await nextTick();
      signMethodModalRef.value?.setPassphraseError(errMsg);
    } else {
      toastError('Gagal Mengirim', errMsg);
    }
  } finally {
    isLoadingData.value = false;
  }
};

const handleConfirmKirim = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) return;

  let configData = { digsig: false, ttdQr: false, ttdBasah: false };
  try {
    const res = await getConfigDigsig("SDE");
    configData = {
      digsig: res?.data?.digsig ?? false,
      ttdQr: res?.data?.ttdQr ?? false,
      ttdBasah: res?.data?.ttdBasah ?? false,
    };
  } catch { /* abaikan jika gagal memuat konfigurasi, semua false */ }

  bsreDisabled.value = !configData.digsig;
  qrDisabled.value = !configData.ttdQr;
  basahDisabled.value = !configData.ttdBasah;
  isSignMethodModalOpen.value = true;
};

const handleSignMethodSubmit = async (data: { method: string; passphrase?: string; file?: File | null }) => {
  selectedSendType.value = data.method;
  await handleKirimDokumen(data.passphrase || "", data.file ?? undefined);
};

// --- LIFECYCLE ---
onMounted(async () => {
  isLoadingData.value = true;
  loadingMessage.value = "Memuat...";
  if (!user.value) await getProfile();

  const refId = route.query.ref_id as string;
  const refJenis = route.query.ref_jenis as string;
  if (refId) {
    try {
      const result = await fetchInboxDetail(refId, refJenis);
      if (result) {
        refData.value = Array.isArray(result) ? result : [result];
      }
    } catch { /* abaikan error ref */ }
  }

  try {
    klasifikasiStatus.value = "loading";
    const [klasRes, internalRecRes, externalRecRes] = await Promise.all([
      getKlasifikasi(),
      getRecipientInfo(user.value?.position),
      getExternalRecipients()
    ]);

    klasifikasiList.value = klasRes;

    if (externalRecRes?.success && Array.isArray(externalRecRes.data)) {
      externalItems.value = externalRecRes.data.map((item: any) => ({
        label: item.nama,
        value: item.id,
        raw: item,
      }));
    }

    const rawRec = internalRecRes.rawRecipients || [];
    const mapInternalItems = (list: any[]) => list.map((r: any) => ({
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
        isEnglish.value = Boolean(d.english);
        if (tinymceEditor.value) tinymceEditor.value.setContent(d.konten || "");

        if (d.klasifikasi) {
          const found = klasifikasiList.value.find(k => k.klasifikasi === d.klasifikasi);
          if (found) selectedKlasifikasiId.value = found.id;
        }

        if (d.penerima && Array.isArray(d.penerima)) {
          selectedTertuju.value = d.penerima.map((item: any) => ({
            label: item.nama,
            value: item.id,
            raw: item
          }));
        }

        if (d.tembusan && Array.isArray(d.tembusan)) {
          const tembusanIds = d.tembusan.map((t: any) =>
            typeof t === 'object' ? String(t.position || t.position_id || t.id || t.value) : String(t)
          );
          selectedTembusan.value = internalItems.value.filter(item =>
            tembusanIds.includes(String(item.value))
          );
        }

        existingFiles.value = mapLampiranFiles(d.lampiran_files || []);
        setSifatFromString(d.sifat);
        if (d.tgl) setDateFromString(d.tgl);
      }
    }

  } catch (e) {
    toastError('Gagal memuat data awal');
  } finally {
    isLoadingData.value = false;
  }
});

watch(existingFiles, (newFiles) => {
  const jumlah = newFiles ? newFiles.length : 0;
  lampiranText.value = jumlah > 0 ? `${jumlah} Lampiran` : "0 Lampiran";
}, { deep: true, immediate: true });
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
