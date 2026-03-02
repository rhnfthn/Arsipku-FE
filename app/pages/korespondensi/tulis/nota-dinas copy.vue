<template>
  <div class="relative">

    <InputLoadingOverlay :loading="isLoadingData && loadingMessage !== 'Memuat...'" :message="loadingMessage" />

    <PageHeader title="Tulis Nota Dinas" :items="breadcrumbs" />

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

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tertuju" :items="items"
          :groups="recipientGroups" :exclude-items="excludeTertujuList" disabled-message="Sudah dipilih" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan" :items="items"
          :groups="recipientGroups" :exclude-items="excludeTembusanList" disabled-message="Sudah dipilih" />

        <TulisInputSifat v-model="selectedSifat" />

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

        <div class="flex flex-col py-4">

          <TulisTemplateManager :current-content="editorContent" @apply="handleApplyTemplate" />

          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">
              <div class="bg-white pt-10 pb-10 border-b border-gray-100 select-none text-black">
                <div class="bg-white px-8 pt-8 pb-4 border-b border-gray-100 select-none">

                  <TulisKopSurat :alamat-info="user?.alamatInfo" />

                  <div class="text-center mb-6 text-black">
                    <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">
                      NOTA DINAS
                    </h1>
                    <p class="text-lg mt-1 text-[14px]">Nomor : ..............................................</p>
                  </div>
                  <table class="w-[50%] mx-auto text-lg leading-relaxed mb-4 tn-roman text-black">
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

                <div class="bg-white px-8 pt-4 pb-8 border-t border-gray-100 select-none">
                  <div class="flex justify-end mb-4 text-black">
                    <div class="text-center min-w-[250px]">
                      <div class="mb-24 text-[14px]">
                        <div>{{ user?.alamatInfo?.kota || 'Tangerang' }}, {{ formattedDate }}</div>
                        <div class="font-bold">{{ user?.positionText || 'Nama Jabatan' }}</div>
                      </div>
                      <div class="font-bold text-[14px]">{{ user?.nama || 'Nama Lengkap' }}</div>
                    </div>
                  </div>
                  <div class="text-[12px] mt-2 w-full text-left text-black">
                    <div class="font-bold underline mb-1">Tembusan :</div>
                    <div v-if="selectedTembusan.length > 5" class="ml-4 pl-2">
                      Periksa Alamat Terlampir
                    </div>
                    <div v-else-if="selectedTembusan.length === 1" class="ml-4 pl-2">
                      {{ selectedTembusan[0]?.labelJob || selectedTembusan[0]?.label }}
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
                  class="bg-white px-12 py-12 border-t-4 border-gray-200 text-black break-before-page">
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
                        {{ item.labelJob || item.label }}
                      </li>
                    </ol>
                  </div>
                  <div v-if="selectedTembusan.length > 5">
                    <div class="font-bold text-[14px] mb-2 uppercase">TEMBUSAN :</div>
                    <ol class="list-decimal ml-6 text-[14px] space-y-1">
                      <li v-for="item in selectedTembusan" :key="item.value">
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

    <!-- <InputPreviewSlideover v-model:open="isOpenPreview" :pdf-url="pdfUrl" :dismissible="!alertState.isOpen" @draft="confirmSaveDraft" @kirim="confirmKirimDokumen" /> -->
    <InputPreviewSlideover v-model:open="isOpenPreview" :pdf-url="pdfUrl" @draft="confirmSaveDraft"
      @kirim="confirmKirimDokumen" />

    <InputDigsigPassphraseModal v-model:open="isPassphraseModalOpen" :signer-info="signerInfo"
      :is-loading="isLoadingData" @submit="handlePassphraseSubmit" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import type { Editor as TinyMCEEditor } from 'tinymce';

import type { Klasifikasi } from "~/types/klasifikasi";
import { validateDraftPayload, type DraftPayload } from "~/types/nota-dinas";
import { Alert } from "@/composables/useAlert";

interface RecipientItem {
  label: string;
  labelJob: string;
  value: string;
  raw: any;
  isGroup?: boolean;
}

interface SifatOption {
  label: string;
  value: string;
}

interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
}

const route = useRoute();
const router = useRouter();
const toast = useToast();

const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { getRecipients, getRecipientGroups } = useRecipients();
const recipientGroups = ref<any[]>([]);
const { getDraftDetail } = useDraft();
const { generatePdf, sendNotaDinas, saveDraft: saveND } = useNotaDinas();
const { digsigConfig, fetchDigsigConfig } = useDigsig();

const isGroupSelected = (group: any, type: 'tertuju' | 'tembusan') => {
  const targetList = type === 'tertuju' ? selectedTertuju.value : selectedTembusan.value;
  return targetList.some(s => s.value === `GROUP_${group.id}`);
};

const toggleGroup = (isChecked: boolean, group: any, type: 'tertuju' | 'tembusan') => {
  const groupPositions = group.details?.map((d: any) => String(d.position)) || [];

  // Format objek untuk badge grup
  const groupItem: RecipientItem = {
    label: group.nama,
    labelJob: group.nama,
    value: `GROUP_${group.id}`,
    isGroup: true,
    raw: group
  };

  const targetList = type === 'tertuju' ? selectedTertuju : selectedTembusan;
  const otherList = type === 'tertuju' ? selectedTembusan : selectedTertuju;

  if (isChecked) {
    // Hapus individu dari tertuju & tembusan jika mereka adalah bagian dari grup ini
    selectedTertuju.value = selectedTertuju.value.filter(s => !groupPositions.includes(s.value));
    selectedTembusan.value = selectedTembusan.value.filter(s => !groupPositions.includes(s.value));

    // Tambahkan badge grup jika belum ada
    if (!targetList.value.some(s => s.value === groupItem.value) &&
      !otherList.value.some(s => s.value === groupItem.value)) {
      targetList.value.push(groupItem);
    }
  } else {
    // Hapus badge grup jika di-uncheck
    targetList.value = targetList.value.filter(s => s.value !== groupItem.value);
  }
};

// Computed ini bertugas men-disable dropdown individu/grup jika mereka tergabung dalam list lawan
const excludeTertujuList = computed(() => {
  // 1. Ambil semua item yang dipilih di Tembusan (Individu & Grup)
  const excluded: any[] = [...selectedTembusan.value];

  // 2. Tambahkan semua anggota individu yang berasal dari grup yang dipilih di Tembusan
  selectedTembusan.value.filter(i => i.isGroup).forEach(g => {
    const members = g.raw.details?.map((d: any) => ({ value: String(d.position) })) || [];
    excluded.push(...members);
  });

  // 3. Tambahkan pengecekan sebaliknya: Jika ada individu di Tembusan yang merupakan anggota suatu grup,
  // maka grup tersebut harusnya disabled di Tertuju (Logika ini sudah dicover oleh komponen anak via props excludeItems)

  return excluded;
});

const excludeTembusanList = computed(() => {
  // 1. Ambil semua item yang dipilih di Tertuju (Individu & Grup)
  const excluded: any[] = [...selectedTertuju.value];

  // 2. Tambahkan semua anggota individu yang berasal dari grup yang dipilih di Tertuju
  selectedTertuju.value.filter(i => i.isGroup).forEach(g => {
    const members = g.raw.details?.map((d: any) => ({ value: String(d.position) })) || [];
    excluded.push(...members);
  });

  return excluded;
});

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Tulis Nota Dinas", to: "#" },
];

const maxPerihal = 200;

const sifatOptions: SifatOption[] = [
  { label: "Sangat Rahasia", value: "sangat rahasia" },
  { label: "Rahasia", value: "rahasia" },
  { label: "Terbatas", value: "terbatas" },
  { label: "Biasa / Terbuka", value: "biasa" }
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

const isLoadingData = ref(false);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const alertState = useAlertState();

const isPassphraseModalOpen = ref(false)
const selectedSendType = ref('qr_only')
const passphrase = ref('')

const signerInfo = computed(() => ({
  name: user.value?.nama || 'Nama Lengkap',
  role: user.value?.positionText || 'Jabatan',
  label: 'Ditandatangani secara digital oleh'
}))

const editDraftId = ref<string | null>(null);
const subject = ref("");
const editorContent = ref("");
const english = ref(false);
const tinymceEditor = ref<TinyMCEEditor | null>(null);

const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));

const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const selectedKlasifikasiId = ref<string | null>(null);
const existingFiles = ref<UploadedFile[]>([]);

const selectedSifat = ref<SifatOption | null>(null);
const items = ref<RecipientItem[]>([]);
const selectedTertuju = ref<RecipientItem[]>([]);
const selectedTembusan = ref<RecipientItem[]>([]);

const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");

const selectedKlasifikasi = computed(() =>
  klasifikasiList.value.find((b) => b.id === selectedKlasifikasiId.value)
);

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

const validateAndToast = (payload: DraftPayload) => {
  const validationResult = validateDraftPayload(payload);
  if (!validationResult.isValid) {
    const errorKeys = Object.keys(validationResult.errors || {});
    const firstKey = errorKeys.length > 0 ? errorKeys[0] : null;
    const firstMessage = firstKey && validationResult.errors
      ? validationResult.errors[firstKey]
      : "Terjadi kesalahan input";

    toast.add({
      title: 'Validasi Gagal',
      description: firstMessage,
      icon: 'i-heroicons-x-circle-20-solid',
      color: 'error'
    });
    return false;
  }
  return true;
};

const getBasePayload = (): DraftPayload => {
  const tglDb = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : "";

  const tglPreview = date.value
    ? `${String(date.value.day).padStart(2, "0")}/${String(date.value.month).padStart(2, "0")}/${date.value.year}`
    : "";

  const lampiranIds = existingFiles.value
    .map((f) => f.id)
    .filter((id): id is string => !!id);

  // Pisahkan ID individu dan ID Grup
  const penerimaIndividu = selectedTertuju.value.filter(i => !i.isGroup).map(i => i.value);
  const tembusanIndividu = selectedTembusan.value.filter(i => !i.isGroup).map(i => i.value);

  const penerimaGrup = selectedTertuju.value.filter(i => i.isGroup).map(i => i.raw.id);
  const tembusanGrup = selectedTembusan.value.filter(i => i.isGroup).map(i => i.raw.id);

  return {
    id_naskah: editDraftId.value || null,
    pengirim: user.value?.position || "",
    penerima: penerimaIndividu, // <-- UBAH 'tertuju' MENJADI 'penerima' DI SINI
    tembusan: tembusanIndividu,
    penerima_grup: penerimaGrup,
    tembusan_grup: tembusanGrup,
    klasifikasi: selectedKlasifikasi.value?.klasifikasi || null,
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || null,
    sifat: selectedSifat.value?.value || 'biasa',
    perihal: subject.value,
    konten: String(editorContent.value || ''),
    htmlContent: String(editorContent.value || ''),
    english: english.value,
    nama_tempat: user.value?.areaText || "Kantor Pusat",
    nama_jabatan: user.value?.positionText || "",
    nama_lengkap: user.value?.nama || "",
    tgl: tglDb,
    tanggal: tglPreview,
    lampiran_temp_ids: lampiranIds,
  };
};

const createFormData = (payload: DraftPayload, includePdf: boolean = false) => {
  const formData = new FormData();

  (Object.keys(payload) as Array<keyof DraftPayload>).forEach((key) => {
    const value = payload[key];
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });

  if (includePdf && pdfBlob.value) {
    const safeDate = payload.tanggal ? payload.tanggal.replace(/\//g, '-') : 'draft';
    formData.append("final_pdf", pdfBlob.value, `nota_dinas_${safeDate}.pdf`);
  }

  return formData;
};

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

  loadingMessage.value = "Memproses Pratinjau...";
  isLoadingData.value = true;

  try {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    const formData = createFormData(payload, false);
    const blobResponse = await generatePdf(formData);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(pdfBlob.value);
    isOpenPreview.value = true;
  } catch (err) {
    toast.add({ title: 'Gagal Preview', color: 'error' });
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

const confirmKirimDokumen = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  // Cek apakah TTE (DigSig) aktif untuk Nota Dinas
  const ndConfig = digsigConfig.value.find(c => c.jenisNaskah === 'ND');
  const isDigsigEnabled = ndConfig?.enabled ?? false;

  if (isDigsigEnabled) {
    // Munculkan Pop-up Passphrase Langsung
    passphrase.value = "";
    selectedSendType.value = "digsig";
    isPassphraseModalOpen.value = true;
  } else {
    // Lewati Pop-up, langsung munculkan konfirmasi
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
    : 'Dokumen akan dikirim tanpa tanda tangan BSrE. Lanjutkan?';

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

const handleKirimDokumen = async () => {
  const payload = getBasePayload();

  try {
    loadingMessage.value = "Mengirim Nota Dinas...";
    isLoadingData.value = true;


    let nikValue = '';

    if (selectedSendType.value === 'digsig') {
      if (!user.value?.nik) {
        throw new Error("NIK pengguna tidak ditemukan untuk TTE.");
      }
      nikValue = user.value.nik;
    }


    const formDataPreview = createFormData(payload, false);
    const blobResponse = await generatePdf(formDataPreview);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });


    const formData = createFormData(payload, true);

    console.log("Mengirim Sign Option:", selectedSendType.value);
    console.log("Mengirim Passphrase (RAW):", passphrase.value);


    formData.append('passphrase', passphrase.value);
    formData.append('sign_option', selectedSendType.value);


    if (nikValue) {
      formData.append('nik', nikValue);
    }


    const result = await sendNotaDinas(formData);

    if (result.data.success) {
      if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
      toast.add({ title: 'Berhasil', description: 'Nota Dinas berhasil dikirim', color: 'success' });
      Alert.close();
      router.push("/korespondensi/terkirim");
    } else {
      throw new Error(result.data.message || 'Pengiriman gagal');
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
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  try {
    loadingMessage.value = "Menyimpan Draft...";
    isLoadingData.value = true;

    const formData = createFormData(payload, false);
    await saveND(formData, editDraftId.value);

    toast.add({ title: 'Berhasil', description: 'Draft berhasil disimpan', color: 'success' });
    router.push("/korespondensi/draf");
  } catch (e: any) {
    console.error("Gagal simpan draft:", e);
    toast.add({
      title: 'Gagal',
      description: e.response?.data?.message || 'Gagal memperbarui draft',
      color: 'error'
    });
  } finally {
    isLoadingData.value = false;
  }
};

onMounted(async () => {
  await fetchDigsigConfig();
  loadingMessage.value = "Memuat...";
  isLoadingData.value = true;

  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";
    klasifikasiList.value = await getKlasifikasi();
    klasifikasiStatus.value = "success";

    const resRec = await getRecipients();
    const rawData = resRec.recipients || resRec.data || [];

    items.value = rawData.map((r: any): RecipientItem => ({
      label: `${r.persnum_person_text || r.persnum || "empty"} - (${r.position_abbreviation || r.abbreviation}) ${r.position_text || r.positionText}`,
      labelJob: r.position_text || r.positionText,
      value: String(r.position || r.position_id || r.id),
      raw: r,
    }));
    const groups = await getRecipientGroups('ND');
    recipientGroups.value = groups.filter((g: any) => g.aktif);
  } catch {
    klasifikasiStatus.value = "error";
  }

  const draftId = route.query.draft_id as string;
  if (draftId) {
    try {
      editDraftId.value = draftId;
      const resDraft = await getDraftDetail(draftId);

      if (resDraft.success && resDraft.data) {
        const d = resDraft.data;
        subject.value = d.perihal || "";
        editorContent.value = d.konten || "";
        english.value = Boolean(d.english);

        if (d.klasifikasi) {
          const foundKlas = klasifikasiList.value.find(k => k.klasifikasi === d.klasifikasi);
          if (foundKlas) selectedKlasifikasiId.value = foundKlas.id;
        }

        // 1. Fungsi Mapping Individu
        const mapApiToUI = (list: any[]): RecipientItem[] => {
          if (!list || !Array.isArray(list)) return [];
          return list.map(item => {
            // Cek apakah item berupa object (dari master) atau hanya string ID
            const posId = String(item.position_id || item.position || item.value || item);
            const master = items.value.find(m => m.value === posId);

            if (master) return master;

            // Fallback jika tidak ada di master items
            return {
              label: item.positionText ? `${item.persnum || ''} - (${item.abbreviation || ''}) ${item.positionText || item.labelJob || ''}` : posId,
              labelJob: item.positionText || item.labelJob || posId,
              value: posId,
              raw: item
            };
          });
        };

        // 2. Fungsi Mapping Grup
        const mapGroupsToUI = (groupList: any[]): RecipientItem[] => {
          if (!groupList || !Array.isArray(groupList)) return [];
          return groupList.map(g => {
            // Karena API draft mungkin hanya mengembalikan ID String, kita bandingkan ID-nya
            const gId = String(g.id || g);
            const masterGroup = recipientGroups.value.find(mg => String(mg.id) === gId);

            if (masterGroup) {
              return {
                label: masterGroup.nama,
                labelJob: masterGroup.nama,
                value: `GROUP_${masterGroup.id}`, // Harus cocok dengan format grup di komponen anak
                isGroup: true,
                raw: masterGroup
              };
            }
            return null;
          }).filter(Boolean) as RecipientItem[];
        };

        // ==========================================
        // EKSEKUSI TERTUJU
        // ==========================================
        // 1. Petakan ID dari draft menjadi format UI
        const loadedTertujuGrup = mapGroupsToUI(d.penerima_grup);
        const loadedTertujuIndividu = mapApiToUI(d.penerima);

        // 2. Ambil semua ID individu yang sudah ter-cover oleh grup yang dipilih
        const tertujuGroupMemberIds = loadedTertujuGrup.flatMap(g =>
          g.raw.details?.map((x: any) => String(x.position)) || []
        );

        // 3. Buang individu dari list jika mereka ternyata bagian dari grup yang sudah diload
        const filteredTertujuIndividu = loadedTertujuIndividu.filter(i =>
          !tertujuGroupMemberIds.includes(String(i.value))
        );

        selectedTertuju.value = [...loadedTertujuGrup, ...filteredTertujuIndividu];

        // ==========================================
        // EKSEKUSI TEMBUSAN
        // ==========================================
        // 1. Petakan ID dari draft menjadi format UI
        const loadedTembusanGrup = mapGroupsToUI(d.tembusan_grup);
        const loadedTembusanIndividu = mapApiToUI(d.tembusan);

        // 2. Ambil semua ID individu yang sudah ter-cover oleh grup yang dipilih
        const tembusanGroupMemberIds = loadedTembusanGrup.flatMap(g =>
          g.raw.details?.map((x: any) => String(x.position)) || []
        );

        // 3. Buang individu dari list jika mereka ternyata bagian dari grup yang sudah diload
        const filteredTembusanIndividu = loadedTembusanIndividu.filter(i =>
          !tembusanGroupMemberIds.includes(String(i.value))
        );

        selectedTembusan.value = [...loadedTembusanGrup, ...filteredTembusanIndividu];

        if (d.lampiran_files && Array.isArray(d.lampiran_files)) {
          existingFiles.value = d.lampiran_files.map((f: any): UploadedFile => ({
            id: f.id,
            fileName: f.fileName || f.file_name,
            filePath: f.fileUrl || f.file_path,
            fileSize: f.fileSize || 0
          }));
        }

        const draftSifat = String(d.sifat || 'biasa').toLowerCase();
        selectedSifat.value = sifatOptions.find(opt => opt.value === draftSifat) || sifatOptions[3];

        if (d.tanggal) {
          const dateParts = d.tanggal.split('-');
          if (dateParts.length === 3) {
            date.value = new CalendarDate(Number(dateParts[0]), Number(dateParts[1]), Number(dateParts[2]));
          }
        }
      }
    } catch (error) {
      console.error("Error loading draft detail:", error);
      toast.add({ title: 'Gagal memuat data draft', color: 'error' });
    }
  }

  isLoadingData.value = false;
});
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

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}
</style>
