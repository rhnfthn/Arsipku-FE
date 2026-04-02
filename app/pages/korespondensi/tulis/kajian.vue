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

    <PageHeader title="Tulis Kajian" :items="breadcrumbs" />

    <UCard variant="soft" :ui="{
      root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm',
    }">
      <div class="flex-1 overflow-y-auto space-y-1">

        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []"
          :loading="klasifikasiStatus === 'loading'" />

        <TulisInputTanggal v-model="date" label="Tanggal Kajian" />

        <TulisInputSifat v-model="selectedSifat" />

        <TulisInputPenerima v-model="selectedPenerima" label="Tertuju" placeholder="Pilih Penerima"
          :items="recipientItems" />

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
              class="flex flex-col bg-gray-100 dark:bg-gray-800 transition-all duration-300 relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">

              <div
                class="bg-white dark:bg-gray-900 pt-10 pb-10 border-b border-gray-100 dark:border-gray-700 select-none text-black dark:text-white min-h-[800px]">

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

                  <div class="text-center mb-6 text-black dark:text-white">
                    <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">
                      KAJIAN
                    </h1>
                    <p class="text-lg mt-1 text-[14px]">Nomor : ..............................................</p>
                  </div>

                  <table class="w-[60%] mx-auto text-lg leading-relaxed mb-4 tn-roman text-black dark:text-white">
                    <tbody>
                      <tr>
                        <td class="text-[14px] w-[120px] font-bold align-top">Kepada Yth.</td>
                        <td class="text-[14px] w-[20px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          <span v-if="selectedPenerima.length > 5">
                            Periksa Alamat Terlampir
                          </span>
                          <span v-else v-html="selectedPenerima.length
                            ? selectedPenerima.map((s: any, i: number) =>
                              selectedPenerima.length === 1
                                ? `<div>${s.labelJob || s.label}</div>`
                                : `<div style='margin-left:1em;text-indent:-1em'>${i + 1}. ${s.labelJob || s.label}</div>`
                            ).join('')
                            : '................................................'
                            "></span>
                        </td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Dari</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          {{ user?.positionText || 'Posisi Pengirim' }}
                        </td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Perihal</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top font-bold">
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
                        <div>{{ user?.alamatInfo?.kota }}, {{ formattedDate }}</div>
                        <div class="font-bold">{{ user?.positionText || 'Nama Jabatan' }}</div>
                      </div>
                      <div class="font-bold text-[14px] underline">{{ user?.nama || 'Nama Lengkap' }}</div>
                    </div>
                  </div>
                </div>

                <div v-if="selectedPenerima.length > 5"
                  class="bg-white dark:bg-gray-900 px-12 py-12 border-t-4 border-gray-200 dark:border-gray-700 text-black dark:text-white break-before-page">
                  <div class="flex justify-end mb-10 text-[14px]">
                    <div class="text-left min-w-[300px]">
                      <table class="w-full">
                        <tr>
                          <td class="align-top pr-2">Lampiran Kajian</td>
                        </tr>
                        <tr>
                          <td class="align-top pr-2">Tanggal :</td>
                          <td>{{ formattedDate }}</td>
                        </tr>
                      </table>
                    </div>
                  </div>

                  <div class="mb-8">
                    <div class="font-bold text-[14px] mb-2 uppercase">KEPADA YTH :</div>
                    <ol class="list-decimal ml-6 text-[14px] space-y-1">
                      <li v-for="item in selectedPenerima" :key="item.value">
                        {{ item.labelJob || item.label }}
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
            @click="handleConfirmKirim" />
        </div>
      </template>
    </USlideover>

    <TulisDigsigPassphraseModal v-model:open="isPassphraseModalOpen" :signer-info="signerInfo"
      :is-loading="isLoadingData" :hide-bsre="bsreDisabled" :hide-qr="qrDisabled" :hide-basah="basahDisabled"
      ref="signMethodModalRef" @submit="handleSignMethodSubmit" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import type { Editor as TinyMCEEditor } from 'tinymce';

import TulisInputKlasifikasi from "@/components/Tulis/InputKlasifikasi.vue";
import TulisInputLampiran from "@/components/Tulis/InputLampiran.vue";
import TulisInputSifat from "@/components/Tulis/InputSifat.vue";
import TulisInputPenerima from "@/components/Tulis/InputPenerima.vue";
import TulisInputTanggal from "@/components/Tulis/InputTanggal.vue";
import TemplateManager from '@/components/Tulis/TemplateManager.vue';

import type { Klasifikasi } from "~/types/klasifikasi";
import { KajianSchema, validateKajianPayload, type KajianPayload } from "~/types/kajian";
import { useKajian } from "~/composables/useKajian";
import { Alert } from "@/composables/useAlert";
import { useDigSign } from "@/composables/useDigSign"; // Add this import

definePageMeta({ middleware: ['auth', 'tulis-access'] })

// const Alert = useAlert(); // Initialize Alert

const route = useRoute();
const router = useRouter();
const toast = useToast();

const bsreDisabled = ref(false);
const qrDisabled = ref(false);
const basahDisabled = ref(false);
const signMethodModalRef = ref<any>(null);
const { getConfigDigsig } = useDigsig();

const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const {
  getRecipients,
  generatePdf,
  sendKajian,
  sendDraft,
  saveDraft,
  updateDraft,
  getKajianDetail
} = useKajian();

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Tulis Kajian", to: "#" },
];

const maxPerihal = 200;

// STATE
const isLoadingData = ref(false);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const alertState = useAlertState(); // Initialize alertState

const isPassphraseModalOpen = ref(false)
const selectedSendType = ref('qr_only') // Default to 'qr_only' as per instructions

const signerInfo = computed(() => ({
  name: user.value?.nama || 'Nama Lengkap',
  role: user.value?.positionText || 'Jabatan',
  label: 'Ditandatangani secara digital oleh'
}))

const editDraftId = ref<string | null>(null);
const subject = ref("");
const lampiranText = ref("-");
const editorContent = ref("");
const tinymceEditor = ref<TinyMCEEditor | null>(null);

const today = new Date();
const date = ref<CalendarDate | null>(
  new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
)

const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref("idle");
const selectedKlasifikasiId = ref<string | null>(null);
const selectedSifat = ref<any>(null);

// Penerima only (No Tembusan)
const recipientItems = ref<any[]>([]);
const selectedPenerima = ref<any[]>([]);

const existingFiles = ref<any[]>([]);
const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");

// Konfigurasi TinyMCE sama persis dengan Nota Dinas
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

const selectedKlasifikasi = computed(() =>
  klasifikasiList.value.find((b) => b.id === selectedKlasifikasiId.value)
);

const formattedDate = computed(() => {
  if (!date.value) return "-"
  return new Date(date.value.year, date.value.month - 1, date.value.day)
    .toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
})

watch(existingFiles, (files) => {
  lampiranText.value = files.length > 0 ? `${files.length} Berkas` : "-";
}, { deep: true });

// --- PAYLOAD ---
const getPayload = (): KajianPayload => {
  const tglDb = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : "" // kosong → validasi min(1) akan catch

  const positionId = Number(user.value?.position)

  return {
    id_naskah: editDraftId.value || null,
    pengirim: isNaN(positionId) ? 0 : positionId,
    penerima: selectedPenerima.value.map(i => Number(i.value)),
    tanggal: tglDb,
    klasifikasi: selectedKlasifikasi.value?.klasifikasi ?? "",
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text ?? "",
    sifat: selectedSifat.value?.value || "biasa",
    perihal: subject.value,
    konten: editorContent.value,
    lampiran_temp_ids: existingFiles.value.map(f => f.id).filter(Boolean) as string[],
    lampiran_text: lampiranText.value
  }
}

const createFormData = (payload: KajianPayload, includePdf: boolean) => {
  const fd = new FormData();

  Object.keys(payload).forEach(key => {
    const k = key as keyof KajianPayload;
    const val = payload[k];

    // Semua array field harus di-serialize sebagai JSON
    if (k === 'penerima' || k === 'lampiran_temp_ids') {
      fd.append(k, JSON.stringify(val ?? []));
    } else if (val !== undefined && val !== null) {
      fd.append(k, String(val));
    }
  });

  if (includePdf && pdfBlob.value) {
    const safeName = (payload.perihal || 'kajian').replace(/[^a-z0-9]/gi, '_').substring(0, 20);
    fd.append("final_pdf", pdfBlob.value, `KAJIAN_${safeName}.pdf`);
  }

  return fd;
};

// --- ACTIONS ---
const validateInput = (payload: KajianPayload) => {
  const check = validateKajianPayload(payload)
  if (!check.isValid) {
    const firstKey = Object.keys(check.errors)[0]
    const message = firstKey ? check.errors[firstKey] : 'Mohon lengkapi semua field yang wajib diisi.'
    toast.add({ title: 'Validasi Gagal', description: message, color: 'error' })
    return false
  }
  return true
}

const handlePreview = async () => {
  const payload = getPayload();

  // DEBUG SEMENTARA - hapus setelah fix
  console.log('=== PAYLOAD DEBUG ===', JSON.stringify(payload, null, 2));
  console.log('user.value:', user.value);
  console.log('selectedKlasifikasiId:', selectedKlasifikasiId.value);
  console.log('selectedKlasifikasi:', selectedKlasifikasi.value);
  console.log('editorContent:', editorContent.value);

  if (!validateInput(payload)) return;

  isLoadingData.value = true;
  loadingMessage.value = "Memproses Pratinjau...";

  try {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    const fd = createFormData(payload, false);
    const blob = await generatePdf(fd);

    pdfBlob.value = new Blob([blob], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(pdfBlob.value);
    isOpenPreview.value = true;
  } catch (e) {
    console.error(e);
    toast.add({ title: 'Gagal Preview', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const handleSaveDraft = async () => {
  const payload = getPayload();
  if (!validateInput(payload)) throw new Error("Validation failed"); // Throw error for Alert.confirm catch

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

    if (res?.data?.success || res?.success) {
      toast.add({ title: 'Berhasil', description: 'Draft berhasil disimpan', color: 'success' }); // Changed description
      if (res.data?.id) editDraftId.value = res.data.id;
      router.push("/korespondensi/draf");
    } else {
      throw new Error(res?.data?.message || 'Gagal menyimpan draft');
    }
  } catch (e: any) {
    console.error("Gagal simpan draft:", e);
    throw new Error(e.response?.data?.message || 'Gagal memperbarui draft'); // Re-throw error
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
    false // dismissible
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

const handleKirimDokumen = async (passphrase = '') => {
  if (selectedSendType.value === 'digsig' && !passphrase.trim()) {
    signMethodModalRef.value?.setPassphraseError('Harap masukkan passphrase Anda')
    return
  }

  const payload = getPayload();
  if (!validateInput(payload)) return;

  loadingMessage.value = "Mengirim Kajian...";
  isLoadingData.value = true;

  try {
    const fdPreview = createFormData(payload, false);
    const blobResponse = await generatePdf(fdPreview);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });

    const fdFinal = createFormData(payload, true);
    fdFinal.append('sign_option', selectedSendType.value);

    if (selectedSendType.value === 'digsig') {
      fdFinal.append('passphrase', passphrase);
      if (!user.value?.nik) throw new Error("NIK pengguna tidak ditemukan untuk TTE.");
      fdFinal.append('nik', user.value.nik);
    }

    const res = editDraftId.value
      ? await sendDraft(fdFinal, editDraftId.value)
      : await sendKajian(fdFinal);

    if (res?.data?.success || res?.success) {
      toast.add({ title: 'Berhasil', description: 'Kajian terkirim', color: 'success' });
      Alert.close();
      router.push("/korespondensi/terkirim");
    } else {
      throw new Error(res?.data?.message || 'Pengiriman gagal');
    }
  } catch (e: any) {
    Alert.close();
    const errMsg = e.response?.data?.message || e.message || 'Gagal mengirim dokumen';

    if (errMsg.toLowerCase().includes('passphrase') || errMsg.toLowerCase().includes('salah')) {
      bsreDisabled.value = false;
      await nextTick();
      isPassphraseModalOpen.value = true;
      await nextTick();
      signMethodModalRef.value?.setPassphraseError(errMsg);
    } else {
      toast.add({ title: 'Gagal Mengirim', description: errMsg, color: 'error' });
    }
  } finally {
    isLoadingData.value = false;
  }
};

const handleConfirmKirim = async () => {
  const payload = getPayload();
  if (!validateInput(payload)) return;

  let configData = { digsig: false, ttdQr: false, ttdBasah: false };
  try {
    const res = await getConfigDigsig('KA');
    configData = {
      digsig: res?.data?.digsig ?? false,
      ttdQr: res?.data?.ttdQr ?? false,
      ttdBasah: res?.data?.ttdBasah ?? false,
    };
  } catch {
    // semua false jika gagal fetch
  }

  bsreDisabled.value = !configData.digsig;
  qrDisabled.value = !configData.ttdQr;
  basahDisabled.value = !configData.ttdBasah;
  isPassphraseModalOpen.value = true;
};

const handleSignMethodSubmit = async (data: { method: string; passphrase?: string }) => {
  selectedSendType.value = data.method;
  await handleKirimDokumen(data.passphrase || '');
};

const handlePassphraseSubmit = async () => {
  if (!selectedSendType.value) {
    toast.add({ title: 'Wajib Diisi', description: 'Pilih metode tanda tangan', color: 'warning' });
    return;
  }

  if (selectedSendType.value === 'digsig' && !passphrase.value) {
    toast.add({ title: 'Wajib Diisi', description: 'Harap masukkan passphrase Anda', color: 'warning' });
    return;
  }

  isPassphraseModalOpen.value = false;

  const confirmMessage = selectedSendType.value === 'digsig'
    ? 'Apakah Anda yakin Passphrase benar dan ingin mengirim dokumen ini?'
    : 'Dokumen akan dikirim tanpa tanda tangan. Lanjutkan?';

  const isConfirmed = await Alert.confirm(
    'Konfirmasi Akhir',
    confirmMessage,
    'Ya, Kirim Sekarang',
    'Periksa Lagi',
    false
  );

  if (isConfirmed) {
    await handleKirimDokumen();
  }
};

const handleApplyTemplate = (content: string) => {
  if (tinymceEditor.value) tinymceEditor.value.setContent(content);
  editorContent.value = content;
};

// --- LIFECYCLE ---
onMounted(async () => {
  isLoadingData.value = true;

  // 1. Pastikan User Profile sudah ada
  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";

    // 2. Fetch API secara Parallel
    const [klasRes, recipientRes] = await Promise.all([
      getKlasifikasi(),
      getRecipients(user.value?.position)
    ]);

    klasifikasiList.value = klasRes;

    // 3. LOGIC MAPPING RECIPIENTS YANG DIPERBAIKI
    // JSON Anda: { recipients: { ATASAN: [...], ... } }
    const recData = recipientRes.data?.recipients || recipientRes.recipients || {};
    // Fallback jika API return data flat di root (jaga-jaga)
    // const recData = recipientRes.data?.recipients || recipientRes.recipients || {};

    const flatList: any[] = [];

    // Helper untuk memetakan object array dari API ke format dropdown component
    const mapRec = (arr: any[], group: string) => {
      if (!Array.isArray(arr)) return [];

      return arr.map(r => {
        // Nama field sesuai JSON: "nama", "positionName", "position" (id)
        // Fallback ke snake_case jika camelCase tidak ada
        const nama = r.nama || r.persnum_person_text || '';
        const jabatan = r.positionName || r.position_text || '';
        const idPos = String(r.position || r.position_id || r.id);

        return {
          label: nama ? `${nama} - ${jabatan}` : jabatan, // Tampilan di dropdown
          labelJob: jabatan, // Tampilan di Preview Surat
          value: idPos, // ID yang dikirim ke backend
          raw: r,
          group
        };
      });
    };

    // Gabungkan list ATASAN, BAWAHAN, REKAN
    if (recData.ATASAN) flatList.push(...mapRec(recData.ATASAN, 'ATASAN'));
    if (recData.BAWAHAN) flatList.push(...mapRec(recData.BAWAHAN, 'BAWAHAN'));
    if (recData.REKAN) flatList.push(...mapRec(recData.REKAN, 'REKAN'));

    // Masukkan ke state
    recipientItems.value = flatList;
    klasifikasiStatus.value = "success";

    // 4. Load Draft Logic (sama seperti sebelumnya)
    const draftId = route.query.draft_id as string;
    if (draftId) {
      editDraftId.value = draftId;
      loadingMessage.value = "Memuat Draft...";
      const resDraft = await getKajianDetail(draftId);

      if (resDraft.data) {
        const d = resDraft.data;
        subject.value = d.perihal || "";
        editorContent.value = d.konten || "";

        if (d.klasifikasi) {
          const k = klasifikasiList.value.find(item => item.klasifikasi === d.klasifikasi);
          if (k) selectedKlasifikasiId.value = k.id;
        }

        if (d.sifat) {
          selectedSifat.value = { value: d.sifat, label: d.sifat.toUpperCase() };
        }

        if (d.lampiran_files) {
          existingFiles.value = d.lampiran_files.map((f: any) => ({
            id: f.id,
            fileName: f.file_name || f.nama_file,
            filePath: f.file_path || f.url,
            fileSize: f.file_size || 0
          }));
        }

        if (d.penerima) {
          const mapDraftRecipients = (list: any[]) => list.map(item => {
            const idStr = String(item.id || item.position_id || item.value);
            const found = recipientItems.value.find(r => r.value === idStr);

            if (found) return found;

            // Fallback object construction
            return {
              label: item.nama ? `${item.nama} - ${item.position_text}` : item.position_text,
              labelJob: item.position_text || item.nama,
              value: idStr
            };
          });
          selectedPenerima.value = mapDraftRecipients(d.penerima);
        }

        if (tinymceEditor.value) tinymceEditor.value.setContent(d.konten || "");
      }
    }

  } catch (e) {
    console.error("Init Error", e);
    toast.add({ title: 'Gagal memuat data awal', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
});
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}
</style>
