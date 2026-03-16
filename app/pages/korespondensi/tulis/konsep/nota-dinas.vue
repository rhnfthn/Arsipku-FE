<template>
  <div class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== 'Memuat...'" :message="loadingMessage" />

    <PageHeader title="Lanjut Konsep Nota Dinas" :items="breadcrumbs" />

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
                <span class="font-mono font-medium">
                  {{ refData.nomor || '-' }}
                </span> •
                {{ formatDateRef(refData.tanggal) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': isRefExpanded }" />
          </div>
        </div>
        <div v-show="isRefExpanded" class="bg-gray-100 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
          <div v-if="detail && (detail.catatan_reject || detail.data?.catatan_reject)"
            class="bg-white dark:bg-gray-800 px-5 py-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex flex-col gap-1">
              <span class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wide">
                Catatan Penolakan
              </span>
              <p class="text-sm text-gray-900 dark:text-white leading-relaxed">
                {{ detail.catatan_reject || detail.data?.catatan_reject }}
              </p>
            </div>
          </div>

          <div v-if="refPdfUrl" class="w-full">
            <iframe :src="`${refPdfUrl}#toolbar=0&navpanes=0`" class="w-full h-[400px] border-none"
              title="Preview Surat Referensi"></iframe>
          </div>
          <div v-else class="flex flex-col items-center justify-center h-[300px] text-gray-500 gap-2">
            <UIcon name="i-lucide-file-x" class="w-12 h-12 opacity-30" />
            <span class="text-sm font-medium">Dokumen PDF tidak tersedia untuk ditampilkan.</span>
          </div>
        </div>
      </div>
    </div>

    <UCard variant="soft"
      :ui="{ root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm' }">

      <!-- Skeleton loading -->
      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
        </div>
      </div>

      <!-- Form -->
      <div v-else class="flex-1 overflow-y-auto space-y-1">
        <!-- Pesan -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Pesan</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="message"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Ketik Pesan" />
            </div>
          </div>
        </div>

        <TulisInputPengirim v-model="selectedSender" label="Pengirim" placeholder="Pilih Pengirim"
          :items="senderItems" />
        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []"
          :loading="klasifikasiStatus === 'loading'" />
        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <div :class="{ 'opacity-60 grayscale pointer-events-none': !isSenderSelected }">
          <TulisInputPenerima v-model="selectedTertuju" label="Tertuju"
            :placeholder="isSenderSelected ? 'Pilih Tertuju' : 'Pilih pengirim terlebih dahulu'" :items="items"
            :groups="recipientGroups" :exclude-items="excludeTembusanList" :disabled="!isSenderSelected"
            disabled-message="Sudah dipilih di Tembusan" />
        </div>

        <div :class="{ 'opacity-60 grayscale pointer-events-none': !isSenderSelected }">
          <TulisInputPenerima v-model="selectedTembusan" label="Tembusan"
            :placeholder="isSenderSelected ? 'Pilih Tembusan' : 'Pilih pengirim terlebih dahulu'" :items="items"
            :groups="recipientGroups" :exclude-items="excludeTertujuList" :disabled="!isSenderSelected"
            disabled-message="Sudah dipilih di Tertuju" />
        </div>

        <TulisInputSifat v-model="selectedSifat" />

        <!-- Perihal -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="subject" :maxlength="maxPerihal"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Ketik Perihal Surat" />
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
                    <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">NOTA
                      DINAS</h1>
                    <p class="text-lg mt-1 text-[14px]">Nomor : ..............................................</p>
                  </div>
                  <table class="w-[50%] mx-auto text-lg leading-relaxed mb-4 tn-roman text-black">
                    <tbody>
                      <tr>
                        <td class="text-[14px] w-[120px] font-bold align-top">Kepada Yth.</td>
                        <td class="text-[14px] w-[20px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          <span v-if="selectedTertuju.length > 5">Periksa Alamat Terlampir</span>
                          <span v-else
                            v-html="selectedTertuju.length ? selectedTertuju.map((s: any, i: number) => selectedTertuju.length === 1 ? `<div>${s.labelJob || s.label}</div>` : `<div style='margin-left:1em;text-indent:-1em'>${i + 1}. ${s.labelJob || s.label}</div>`).join('') : '................................................'"></span>
                        </td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Dari</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top">{{ selectedSender?.labelJob || user?.positionText || 'Posisi'
                          }}</td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Perihal</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top">{{ subject ||
                          "................................................" }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Editor api-key="no-api-key" v-model="editorContent" :initial-value="editorContent" :init="tinyMceInit"
                  class="min-h-[400px]" />

                <div class="bg-white px-8 pt-4 pb-8 border-t border-gray-100 select-none">
                  <div class="flex justify-end mb-4 text-black">
                    <div class="text-center min-w-[250px]">
                      <div class="mb-24 text-[14px]">
                        <div>{{ user?.alamatInfo?.kota || 'Tangerang' }}, {{ formattedDate }}</div>
                        <div class="font-bold">{{ selectedSender?.labelJob || user?.positionText || 'Nama Jabatan' }}
                        </div>
                      </div>
                      <div class="font-bold text-[14px]">{{ selectedSender?.raw?.persnum_person_text || user?.nama ||
                        'Nama Lengkap' }}</div>
                    </div>
                  </div>
                  <div class="text-[12px] mt-2 w-full text-left text-black">
                    <div class="font-bold underline mb-1">Tembusan :</div>
                    <div v-if="selectedTembusan.length > 5" class="ml-4 pl-2">Periksa Alamat Terlampir</div>
                    <div v-else-if="selectedTembusan.length === 1" class="ml-4 pl-2">{{ selectedTembusan[0]?.labelJob ||
                      selectedTembusan[0]?.label }}</div>
                    <ol v-else-if="selectedTembusan.length > 1" class="list-decimal ml-4 pl-2">
                      <li v-for="t in selectedTembusan" :key="t.value">{{ t.labelJob || t.label }}</li>
                    </ol>
                    <div v-else class="text-gray-400 italic">...</div>
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

    <TulisPreviewSlideover v-model:open="isOpenPreview" :pdf-url="pdfUrl" :alert-is-open="alertState.isOpen"
      @save-draft="confirmSaveDraft" @send="handleKirimDokumen" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import type { Editor as TinyMCEEditor } from 'tinymce';
import type { Klasifikasi } from "~/types/klasifikasi";
import { validateDraftPayload, type DraftPayload } from "~/types/nota-dinas";
import { Alert } from "@/composables/useAlert";

// --- Interfaces ---
interface RecipientItem {
  label: string;
  labelJob: string;
  value: string;
  raw: any;
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

// --- Composables ---
const { createKonsep, getSendersById, previewPdf, getRecipientsBySender, forwardKonsep } = useKonsep();
const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { getDraftDetail } = useDraft();
const { saveDraft: saveND } = useNotaDinas();
const { fetchInboxDetail, fetchKonsepDetail } = useInbox(null);
const { getRecipientGroups } = useRecipients();

const route = useRoute();
const router = useRouter();
const toast = useToast();
const alertState = useAlertState();

// --- State ---
const isLoadingData = ref(false);
const detail = ref<any>(null);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const editDraftId = ref<string | null>(null);
const message = ref("");
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
const senderItems = ref<RecipientItem[]>([]);
const selectedSender = ref<RecipientItem | undefined>();
const selectedTertuju = ref<RecipientItem[]>([]);
const selectedTembusan = ref<RecipientItem[]>([]);
const recipientGroups = ref<any[]>([]);
const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");
const refData = ref<any>(null);
const isRefExpanded = ref(false);
const maxPerihal = 200;

const sifatOptions: SifatOption[] = [
  { label: "Sangat Rahasia", value: "sangat rahasia" },
  { label: "Rahasia", value: "rahasia" },
  { label: "Terbatas", value: "terbatas" },
  { label: "Biasa / Terbuka", value: "biasa" },
];

// --- Helpers ---
const mapPersonToUI = (person: any): RecipientItem => {
  if (!person) return {} as RecipientItem;
  const val = String(person.position_id || person.position || '');
  return {
    label: `${person.nama || ''} - ${person.position_text || ''}`,
    labelJob: person.position_text || '',
    value: val,
    raw: person,
  };
};

const mapGroupsToUI = (groups: any[]): any[] => {
  if (!Array.isArray(groups)) return [];
  return groups.map((g: any) => ({
    label: g.nama || g.name || g.label || '',
    labelJob: g.nama || g.name || g.label || '',
    value: String(g.id || g.value || ''),
    isGroup: true,
    raw: g,
  }));
};

const formatDateRef = (value?: string) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch { return value; }
};

// --- Computed ---
const refPdfUrl = computed(() => {
  if (!refData.value) return '';
  if (refData.value.final_pdf_url) return refData.value.final_pdf_url;
  if (refData.value.lampiran_files?.length > 0) {
    return refData.value.lampiran_files[0].file_url || refData.value.lampiran_files[0].file_path;
  }
  return '';
});

const isEditMode = computed(() => route.query.action === 'edit' && !!route.query.ref_id);

const isSenderSelected = computed(() => !!selectedSender.value);

// Computed exclude lists — gabungkan individu + grup agar cross-exclude berjalan dengan benar
const excludeTertujuList = computed(() => selectedTertuju.value);
const excludeTembusanList = computed(() => selectedTembusan.value);

// Helper untuk pisahkan individu dan grup dari selectedTertuju/Tembusan
const tertujuIndividu = computed(() =>
  selectedTertuju.value.filter((i: any) => !i.isGroup).map((i: any) => i.value)
);
const tembusanIndividu = computed(() =>
  selectedTembusan.value.filter((i: any) => !i.isGroup).map((i: any) => i.value)
);
const tertujuGrup = computed(() =>
  selectedTertuju.value.filter((i: any) => i.isGroup).map((i: any) => i.value)
);
const tembusanGrup = computed(() =>
  selectedTembusan.value.filter((i: any) => i.isGroup).map((i: any) => i.value)
);

const selectedKlasifikasi = computed(() =>
  klasifikasiList.value.find((b) => b.id === selectedKlasifikasiId.value)
);

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

const breadcrumbs = computed(() => {
  const refId = route.query.ref_id as string;
  const refJenis = route.query.ref_jenis as string;
  const detailLink = refId ? `/korespondensi/kotak-masuk/${refId}?jenis=${refJenis || 'surat'}` : '#';
  return [
    { label: "Beranda", to: "/beranda" },
    { label: "Kotak Masuk", to: "/korespondensi/kotak-masuk" },
    { label: "Detail Surat", to: detailLink, class: !refId ? 'opacity-50 cursor-default' : '' },
    { label: "Lanjut Konsep Nota Dinas", to: "#" },
  ];
});

// --- Editor Config ---
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
    editor.on('change keyup input', () => {
      editorContent.value = editor.getContent();
    });
  },
};

// --- Methods ---
const fetchRecipientsBySender = async (senderPositionId: string) => {
  try {
    const res = await getRecipientsBySender(senderPositionId);
    const recipientsData = res.data?.recipients;
    if (recipientsData) {
      const combinedArray = [
        ...(recipientsData.ATASAN || []),
        ...(recipientsData.REKAN || []),
        ...(recipientsData.BAWAHAN || []),
      ];
      items.value = combinedArray.map((r: any): RecipientItem => ({
        label: `${r.persnum_person_text || '-'} - ${r.position_text}`,
        labelJob: r.position_text,
        value: String(r.position),
        raw: r,
      }));
    } else {
      items.value = [];
    }
  } catch (e) {
    console.error("Gagal memuat penerima", e);
    toast.add({ title: 'Gagal memuat daftar tujuan', color: 'error' });
    items.value = [];
  }
};

const fetchSenderList = async (posId: string | number) => {
  try {
    const res = await getSendersById(posId);
    if (res.success && Array.isArray(res.data)) {
      senderItems.value = res.data.map((r: any) => ({
        label: `${r.persnum_person_text} - ${r.position_text}`,
        labelJob: r.position_text,
        value: String(r.position),
        raw: r,
      }));
      if (senderItems.value.length === 1 && !selectedSender.value) {
        selectedSender.value = senderItems.value[0];
      }
    }
  } catch (e) {
    console.error("Gagal memuat list pengirim", e);
  }
};

const validateAndToast = (payload: DraftPayload) => {
  const validationResult = validateDraftPayload(payload);
  if (!validationResult.isValid) {
    const errorKeys = Object.keys(validationResult.errors || {});
    const firstMessage = errorKeys.length > 0 && validationResult.errors
      ? validationResult.errors[errorKeys[0]]
      : "Terjadi kesalahan input";
    toast.add({ title: 'Validasi Gagal', description: firstMessage, icon: 'i-heroicons-x-circle-20-solid', color: 'error' });
    return false;
  }
  return true;
};

const getBasePayload = (): DraftPayload => {
  const currentSender = selectedSender.value || {};
  const senderRaw = (currentSender as any).raw || {};
  const tglDb = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : "";
  const lampiranIds = existingFiles.value.map((f) => f.id).filter(Boolean);
  return {
    id_naskah: editDraftId.value || null,
    pengirim: (currentSender as any).value || user.value?.position || "",
    penerima: tertujuIndividu.value,
    tembusan: tembusanIndividu.value,
    penerima_grup: tertujuGrup.value,
    tembusan_grup: tembusanGrup.value,
    tertuju: selectedTertuju.value.map(i => i.labelJob || i.label),
    klasifikasi: selectedKlasifikasi.value?.klasifikasi || null,
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || null,
    sifat: selectedSifat.value?.value || 'biasa',
    perihal: subject.value,
    konten: String(editorContent.value || ''),
    htmlContent: String(editorContent.value || ''),
    english: english.value,
    nama_tempat: senderRaw.area_text || senderRaw.areaText || user.value?.areaText || "Kantor Pusat",
    nama_jabatan: senderRaw.position_text || senderRaw.positionText || (currentSender as any).labelJob || "",
    nama_lengkap: senderRaw.persnum_person_text || senderRaw.nama || user.value?.nama || "",
    tgl: tglDb,
    tanggal: formattedDate.value,
    lampiran_temp_ids: lampiranIds,
    catatan: message.value || '',
  };
};

const createFormData = (payload: DraftPayload) => {
  const formData = new FormData();
  (Object.keys(payload) as Array<keyof DraftPayload>).forEach((key) => {
    const value = payload[key];
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      formData.append(key, String(value));
    }
  });
  return formData;
};

const prepareKonsepFormData = () => {
  const formData = new FormData();
  const signerInfo = selectedSender.value || {} as any;
  const signerRaw = signerInfo.raw || {};
  const creatorId = user.value?.position || '';
  const tglDb = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : "";
  const lampiranIds = existingFiles.value.map((f) => f.id).filter(Boolean);

  formData.append('jenis', 'ND');
  formData.append('id_disposisi_referensi', refData.value?.id || '');
  formData.append('from_position_id', creatorId);
  formData.append('to_position_id', signerInfo.value || '');
  formData.append('pengirim_position_id', signerInfo.value || '');
  formData.append('penerima_position_ids', JSON.stringify(tertujuIndividu.value));
  formData.append('tembusan_position_ids', JSON.stringify(tembusanIndividu.value));
  formData.append('penerima_grup_ids', JSON.stringify(tertujuGrup.value));
  formData.append('tembusan_grup_ids', JSON.stringify(tembusanGrup.value));
  formData.append('tgl', tglDb);
  formData.append('klasifikasi', selectedKlasifikasi.value?.klasifikasi || '');
  formData.append('klasifikasi_text', selectedKlasifikasi.value?.nama || selectedKlasifikasi.value?.klasifikasi_text || '');
  formData.append('sifat', selectedSifat.value?.value || 'biasa');
  formData.append('perihal', subject.value);
  formData.append('konten', editorContent.value);
  formData.append('english', String(english.value));
  formData.append('nama_tempat', signerRaw.area_text || user.value?.areaText || "Jakarta");
  formData.append('nama_jabatan', signerRaw.position_text || signerInfo.labelJob || "");
  formData.append('nama_lengkap', signerRaw.persnum_person_text || user.value?.nama || "");
  formData.append('lampiran_temp_ids', JSON.stringify(lampiranIds));
  formData.append('catatan', message.value || '-');
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
  if (!subject.value || !selectedSender.value) {
    toast.add({ title: 'Data Belum Lengkap', description: 'Harap isi Pengirim dan Perihal', color: 'warning' });
    return;
  }
  loadingMessage.value = "Memproses Pratinjau PDF...";
  isLoadingData.value = true;
  try {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    const formData = prepareKonsepFormData();
    const blobResponse = await previewPdf(formData);
    if (blobResponse) {
      pdfBlob.value = blobResponse;
      pdfUrl.value = URL.createObjectURL(blobResponse);
      isOpenPreview.value = true;
    } else {
      throw new Error("Gagal generate PDF");
    }
  } catch {
    toast.add({ title: 'Gagal Preview', description: 'Terjadi kesalahan saat memuat preview', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

// Kirim langsung tanpa sign option / passphrase modal
const handleKirimDokumen = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  const isRevision = route.query.action === 'edit';

  const isConfirmed = await Alert.confirm(
    isRevision ? 'Kirim Perbaikan?' : 'Kirim Konsep?',
    isRevision ? 'Perbaikan konsep akan dikirim.' : 'Konsep Nota Dinas akan dikirim.',
    'Ya, Kirim',
    'Batal',
    false
  );
  if (!isConfirmed) return;

  loadingMessage.value = isRevision ? "Mengirim Perbaikan..." : "Membuat Konsep Nota Dinas...";
  isLoadingData.value = true;

  try {
    let result;

    if (isRevision) {
      const formData = new FormData();
      const currentSender = selectedSender.value || {} as any;
      const signerRaw = currentSender.raw || {};
      const tglDb = date.value
        ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
        : "";
      const lampiranIds = existingFiles.value.map((f) => f.id).filter(Boolean);

      formData.append('jenis', 'ND');
      formData.append('from_position_id', user.value?.position || '');
      formData.append('to_position_id', currentSender.value || '');
      formData.append('pengirim_position_id', currentSender.value || '');
      formData.append('penerima_position_ids', JSON.stringify(tertujuIndividu.value));
      formData.append('tembusan_position_ids', JSON.stringify(tembusanIndividu.value));
      formData.append('penerima_grup_ids', JSON.stringify(tertujuGrup.value));
      formData.append('tembusan_grup_ids', JSON.stringify(tembusanGrup.value));
      formData.append('tgl', tglDb);
      formData.append('klasifikasi', selectedKlasifikasi.value?.klasifikasi || '');
      formData.append('klasifikasi_text', selectedKlasifikasi.value?.nama || selectedKlasifikasi.value?.klasifikasi_text || '');
      formData.append('sifat', selectedSifat.value?.value || 'biasa');
      formData.append('perihal', subject.value);
      formData.append('konten', editorContent.value);
      formData.append('english', String(english.value));
      formData.append('nama_tempat', signerRaw.area_text || user.value?.areaText || "Tangerang");
      formData.append('nama_jabatan', signerRaw.position_text || currentSender.labelJob || "");
      formData.append('nama_lengkap', signerRaw.persnum_person_text || user.value?.nama || "");
      formData.append('lampiran_temp_ids', JSON.stringify(lampiranIds));
      formData.append('catatan', message.value || '-');
      formData.append('lampiran', existingFiles.value.length > 0 ? '1' : '0');

      const dataWrapper = detail.value?.data || detail.value;
      const konsepId = dataWrapper?.konsep?.id;
      if (!konsepId) throw new Error("ID Konsep tidak ditemukan untuk proses perbaikan (forward)");

      result = await forwardKonsep(konsepId, formData);
    } else {
      const formData = prepareKonsepFormData();
      result = await createKonsep(formData);
    }

    if (result.success) {
      toast.add({
        title: 'Berhasil',
        description: isRevision ? 'Perbaikan berhasil dikirim' : 'Konsep Nota Dinas berhasil dibuat',
        color: 'success',
      });
      if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
      isOpenPreview.value = false;
      router.push("/korespondensi/terkirim");
    } else {
      throw new Error(result.message || 'Gagal memproses dokumen');
    }
  } catch (e: any) {
    console.error("Error Kirim:", e);
    const errMsg = e.response?.data?.message || e.message || 'Terjadi kesalahan saat mengirim';
    toast.add({ title: 'Gagal', description: errMsg, color: 'error' });
  } finally {
    isLoadingData.value = false;
    Alert.close();
  }
};

const handleSaveDraft = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) throw new Error("Validation failed");

  loadingMessage.value = "Menyimpan Draft...";
  isLoadingData.value = true;
  try {
    const formData = createFormData(payload);
    await saveND(formData, editDraftId.value);
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
  } catch {
    Alert.close();
  }
};

// --- Watchers ---
watch(editorContent, (newVal) => {
  if (tinymceEditor.value && newVal) {
    if (tinymceEditor.value.getContent() !== newVal) {
      tinymceEditor.value.setContent(newVal);
    }
  }
});

watch(selectedSender, async (newVal, oldVal) => {
  if (newVal?.value !== oldVal?.value) {
    items.value = [];
    selectedTertuju.value = [];
    selectedTembusan.value = [];
  }
  if (newVal?.value) {
    loadingMessage.value = "Memuat daftar penerima...";
    isLoadingData.value = true;
    await fetchRecipientsBySender(newVal.value);
    isLoadingData.value = false;
  }
}, { deep: true });

// --- Lifecycle ---
onMounted(async () => {
  const queryAction = route.query.action as string;
  const refId = route.query.ref_id as string;
  const refJenis = route.query.ref_jenis as string;
  const draftId = route.query.draft_id as string;

  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";
    klasifikasiList.value = await getKlasifikasi();
    klasifikasiStatus.value = "success";

    const groups = await getRecipientGroups("ND");
    recipientGroups.value = groups.filter((g: any) => g.aktif);
  } catch {
    klasifikasiStatus.value = "error";
  }

  // A. EDIT MODE
  if (queryAction === 'edit' && refId) {
    loadingMessage.value = "Memuat data konsep...";
    isLoadingData.value = true;
    try {
      const result = await fetchKonsepDetail(refId);
      if (result) {
        const unwrappedData = result.data || result;
        detail.value = unwrappedData;
        editDraftId.value = unwrappedData.id || unwrappedData.konsep?.id;
        subject.value = unwrappedData.perihal || unwrappedData.konsep?.perihal || "";

        if (unwrappedData.flow && Array.isArray(unwrappedData.flow)) {
          const createFlow = unwrappedData.flow.find((f: any) => f.aksi === 'create');
          if (createFlow?.catatan) message.value = createFlow.catatan;
        }

        const tglStr = unwrappedData.tanggal || unwrappedData.naskah?.tanggal;
        if (tglStr) {
          const tglParts = new Date(tglStr);
          date.value = new CalendarDate(tglParts.getFullYear(), tglParts.getMonth() + 1, tglParts.getDate());
        }

        const sifatStr = unwrappedData.sifat || unwrappedData.naskah?.sifat;
        if (sifatStr) {
          selectedSifat.value = sifatOptions.find(opt => opt.value === sifatStr.toLowerCase()) || sifatOptions[3];
        }

        const klasCode = unwrappedData.naskah?.klasifikasi;
        if (klasCode) {
          const foundKlas = klasifikasiList.value.find(k => k.klasifikasi === klasCode);
          if (foundKlas) selectedKlasifikasiId.value = foundKlas.id;
        }

        const contentStr = unwrappedData.konten || unwrappedData.naskah?.konten || "";
        editorContent.value = contentStr;

        if (unwrappedData.pengirim) {
          const senderObj = mapPersonToUI(unwrappedData.pengirim);
          selectedSender.value = senderObj;
          await fetchSenderList(senderObj.value);
          await fetchRecipientsBySender(senderObj.value);
        }

        if (unwrappedData.kepada && Array.isArray(unwrappedData.kepada)) {
          const grupTertuju = mapGroupsToUI(unwrappedData.kepada_grup || []);
          const individTertuju = unwrappedData.kepada.map((p: any) => mapPersonToUI(p));
          selectedTertuju.value = [...grupTertuju, ...individTertuju];
        }

        if (unwrappedData.tembusan && Array.isArray(unwrappedData.tembusan)) {
          const grupTembusan = mapGroupsToUI(unwrappedData.tembusan_grup || []);
          const individTembusan = unwrappedData.tembusan.map((t: any) => mapPersonToUI(t));
          selectedTembusan.value = [...grupTembusan, ...individTembusan];
        }

        if (unwrappedData.lampiran_files && Array.isArray(unwrappedData.lampiran_files)) {
          existingFiles.value = unwrappedData.lampiran_files.map((f: any) => ({
            id: f.id,
            fileName: f.filename || f.file_name || 'File',
            filePath: f.url || f.file_path || '',
            fileSize: f.size || 0,
          }));
        }

        const flows = unwrappedData.flow || [];
        if (flows.length > 0) {
          const originFlow = flows[0];
          if (originFlow.naskah || originFlow.pdf_snapshot) {
            refData.value = {
              id: originFlow.naskah?.id || 'ref-flow',
              nomor: originFlow.naskah?.nomor || '-',
              tanggal: originFlow.naskah?.tanggal || originFlow.tanggal,
              final_pdf_url: originFlow.naskah?.final_pdf || originFlow.pdf_snapshot,
              jenis: originFlow.naskah?.jenis || 'Naskah',
              catatan: originFlow.catatan || '',
            };
          }
        }
      } else {
        toast.add({ title: 'Gagal', description: 'Data konsep tidak ditemukan', color: 'error' });
      }
    } catch (e) {
      console.error("Error fetching edit data:", e);
      toast.add({ title: 'Error', description: 'Gagal memuat data edit', color: 'error' });
    } finally {
      isLoadingData.value = false;
    }
  }

  // B. REPLY / DISPOSISI
  else if (refId && refJenis) {
    loadingMessage.value = "Memuat data referensi...";
    isLoadingData.value = true;
    try {
      const result = await fetchInboxDetail(refId, refJenis);
      if (result) {
        const rawData = result.data || result;
        const rawFlow = (rawData.raw?.flow?.length > 0) ? rawData.raw.flow[0] : rawData;
        refData.value = {
          id: rawFlow.id,
          nomor: rawFlow.nomor || '-',
          tanggal: rawFlow.tanggal,
          final_pdf_url: rawFlow.final_pdf_url,
          lampiran_files: rawFlow.lampiran_files || [],
          jenis: rawFlow.jenis,
        };
      }
    } catch (e) { console.error(e); }

    if (user.value?.position) await fetchSenderList(user.value.position);
    if (selectedSender.value?.value) await fetchRecipientsBySender(selectedSender.value.value);
    isLoadingData.value = false;
  }

  // C. DRAFT
  else if (draftId) {
    loadingMessage.value = "Memuat draft...";
    isLoadingData.value = true;
    try {
      editDraftId.value = draftId;
      const resDraft = await getDraftDetail(draftId);
      if (resDraft.success && resDraft.data) {
        const d = resDraft.data;
        subject.value = d.perihal || "";
        editorContent.value = d.konten || "";
        message.value = d.catatan || "";
        english.value = Boolean(d.english);
        if (d.klasifikasi) {
          const foundKlas = klasifikasiList.value.find((k: any) => k.klasifikasi === d.klasifikasi);
          if (foundKlas) selectedKlasifikasiId.value = foundKlas.id;
        }

        if (user.value?.position) await fetchSenderList(user.value.position);

        const mapApiToUI = (list: any[]) => list?.map(item => {
          const posId = String(item.position_id || item.position || item.value);
          const master = items.value.find(m => m.value === posId);
          return master || {
            label: `${item.persnum || ''} - ${item.positionText || item.labelJob || ''}`,
            labelJob: item.positionText || item.labelJob || '',
            value: posId,
            raw: item,
          };
        }) || [];

        const grupTertuju = mapGroupsToUI(d.penerima_grup || []);
        const grupTembusan = mapGroupsToUI(d.tembusan_grup || []);
        selectedTertuju.value = [...grupTertuju, ...mapApiToUI(d.penerima)];
        selectedTembusan.value = [...grupTembusan, ...mapApiToUI(d.tembusan)];

        if (Array.isArray(d.lampiran_files)) {
          existingFiles.value = d.lampiran_files.map((f: any) => ({
            id: f.id,
            fileName: f.fileName || f.file_name,
            filePath: f.fileUrl || f.file_path,
            fileSize: f.fileSize || 0,
          }));
        }
        selectedSifat.value = sifatOptions.find(opt => opt.value === String(d.sifat || 'biasa').toLowerCase()) || sifatOptions[3];
        if (d.tanggal) {
          const p = d.tanggal.split('-');
          if (p.length === 3) date.value = new CalendarDate(Number(p[0]), Number(p[1]), Number(p[2]));
        }
      }
    } catch (e) { console.error(e); }
    isLoadingData.value = false;
  }

  // D. NEW
  else {
    isLoadingData.value = true;
    if (user.value?.position) await fetchSenderList(user.value.position);
    if (selectedSender.value?.value) await fetchRecipientsBySender(selectedSender.value.value);
    isLoadingData.value = false;
  }
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
