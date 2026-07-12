<template>
  <div class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== 'Memuat...'" :message="loadingMessage" />

    <PageHeader title="Lanjut Konsep Surat Dinas Eksternal" :items="breadcrumbs" />

    <!-- Referensi Surat Asal -->
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
                <span class="font-mono font-medium">{{ refData.nomor || '-' }}</span> •
                {{ formatDateRef(refData.tanggal) }}
              </p>
            </div>
          </div>
          <UIcon name="i-heroicons-chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-200"
            :class="{ 'rotate-180': isRefExpanded }" />
        </div>

        <div v-show="isRefExpanded" class="bg-gray-100 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
          <div v-if="detail && (detail.catatan_reject || detail.data?.catatan_reject)"
            class="bg-white dark:bg-gray-800 px-5 py-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex flex-col gap-1">
              <span class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wide">Catatan
                Penolakan</span>
              <p class="text-sm text-gray-900 dark:text-white leading-relaxed">
                {{ detail.catatan_reject || detail.data?.catatan_reject }}
              </p>
            </div>
          </div>

          <div v-if="refPdfUrl" class="w-full">
            <iframe :src="`${refPdfUrl}#toolbar=0&navpanes=0`" class="w-full h-[400px] border-none"
              title="Preview Surat Referensi" />
          </div>
          <div v-else class="flex flex-col items-center justify-center h-[300px] text-gray-500 gap-2">
            <UIcon name="i-lucide-file-x" class="w-12 h-12 opacity-30" />
            <span class="text-sm font-medium">Dokumen PDF tidak tersedia untuk ditampilkan.</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="forwardTargetInfo" class="mb-4">
      <div class="rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 px-4 py-3">
        <div class="flex items-start gap-2">
          <UIcon name="i-lucide-user-round-check" class="w-4 h-4 text-primary-500 mt-0.5" />
          <div class="min-w-0">
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-200">Konsep Akan Diteruskan Ke</p>
            <div class="text-xs text-gray-600 dark:text-gray-300 mt-0.5 break-words leading-5">
              <div class="font-semibold text-primary-600 dark:text-primary-400">{{ forwardTargetInfo.positionText || '-' }}</div>
              <div>{{ forwardTargetInfo.nama || '-' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isRejectAction"
      class="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
    >
      Mode revisi: konsep ini dikembalikan dan perlu diperbaiki.
    </div>

    <UCard variant="soft"
      :ui="{ root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm' }">

      <!-- Skeleton -->
      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
        </div>
      </div>

      <!-- Form -->
      <div v-else class="flex-1 overflow-y-auto space-y-1">

        <!-- Pesan -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Pesan</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="message"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Ketik Pesan" />
            </div>
          </div>
        </div>

        <TulisInputPengirim v-model="selectedSender" label="Pengirim" placeholder="Pilih Pengirim" :items="senderItems" />
        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []" :loading="klasifikasiStatus === 'loading'" />
        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <!-- Tertuju: Penerima Eksternal -->
        <div :class="{ 'opacity-60 grayscale pointer-events-none': !isSenderSelected }">
          <TulisInputPenerima v-model="selectedTertuju" label="Tertuju"
            :placeholder="isSenderSelected ? 'Pilih Tujuan Eksternal' : 'Pilih pengirim terlebih dahulu'"
            :items="externalItems" :disabled="!isSenderSelected"
            disabled-message="Sudah dipilih di Tembusan" />
        </div>

        <!-- Tembusan: Penerima Internal -->
        <div :class="{ 'opacity-60 grayscale pointer-events-none': !isSenderSelected }">
          <TulisInputPenerima v-model="selectedTembusan" label="Tembusan"
            :placeholder="isSenderSelected ? 'Pilih Tembusan Internal' : 'Pilih pengirim terlebih dahulu'"
            :items="internalItems" :disabled="!isSenderSelected"
            disabled-message="Sudah dipilih di Tertuju" />
        </div>

        <TulisInputSifat v-model="selectedSifat" />

        <!-- Perihal -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
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

        <!-- Lampiran text -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Lampiran</span>
            <input type="text" v-model="lampiranText" readonly tabindex="-1"
              class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 cursor-default opacity-75"
              placeholder="Otomatis terisi saat upload file..." />
          </div>
        </div>

        <div class="flex flex-col py-4">
          <TulisTemplateManager :current-content="editorContent" @apply="handleApplyTemplate" />

          <ClientOnly>
            <div class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">
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
                  <div>{{ user?.areaText?.replace('Kantor', '') || 'Tangerang' }}, {{ formattedDate }}</div>
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
                          <td class="align-top font-bold text-justify">{{ subject || "................................................" }}</td>
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
                  <TinymceEditorAsync api-key="no-api-key" v-model="editorContent" :initial-value="editorContent" :init="tinyMceInit" />
                </div>

                <div class="flex mt-12 text-black px-10">
                  <div class="text-center min-w-[250px]">
                    <div class="mb-24 text-[14px]">
                      <div class="font-bold">{{ selectedSender?.labelJob || user?.positionText || 'Nama Jabatan' }}</div>
                    </div>
                    <div class="font-bold text-[14px] underline">{{ toTitleCase(selectedSender?.raw?.persnum_person_text || user?.nama) || 'Nama Lengkap' }}</div>
                  </div>
                </div>

                <div class="mt-8 text-[12px] text-black px-10">
                  <div class="font-bold underline mb-1">Tembusan :</div>
                  <div v-if="selectedTembusan.length > 5" class="ml-4 pl-2">Periksa Alamat Terlampir</div>
                  <ol v-else-if="selectedTembusan.length > 0" class="list-decimal ml-4 pl-2">
                    <li v-for="t in selectedTembusan" :key="t.value">
                      {{ t.labelJob || t.label }}{{ t.raw?.area_text ? ' - ' + t.raw.area_text : '' }}
                    </li>
                  </ol>
                  <div v-else class="ml-4 pl-2 text-gray-400 italic">...</div>
                </div>

                <div v-if="selectedTertuju.length > 5 || selectedTembusan.length > 5"
                  class="bg-white px-12 py-12 border-t-4 border-gray-200 text-black break-before-page mt-10">
                  <div class="flex justify-end mb-10 text-[14px]">
                    <div class="text-left min-w-[300px]">
                      <table class="w-full">
                        <tbody>
                          <tr><td class="align-top pr-2">Lampiran Surat</td></tr>
                          <tr><td class="align-top pr-2">Nomor Surat :</td><td>.....................................</td></tr>
                          <tr><td class="align-top pr-2">Tanggal Surat :</td><td>{{ formattedDate }}</td></tr>
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
                        {{ item.labelJob || item.label }}{{ item.raw?.area_text ? ' - ' + item.raw.area_text : '' }}
                      </li>
                    </ol>
                  </div>
                </div>

              </div>
            </div>
          </ClientOnly>

          <TulisInputLampiran v-model:existingFiles="existingFiles" />

          <div class="flex items-center py-3 mt-2 gap-2">
            <input type="checkbox" id="check_english" v-model="english"
              class="w-4 h-4 shrink-0 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
            <label for="check_english"
              class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              Aktifkan Format Bahasa Inggris
            </label>
          </div>
        </div>

        <div class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-800">
          <UButton label="Pratinjau" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold" @click="handlePreview" />
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
import TinymceEditorAsync from '~/components/TinymceEditorAsync.vue';
import type { Editor as TinyMCEEditor } from 'tinymce';
import { pickKorespondensiListQuery } from "~/utils/korespondensi-list-state";
import { Hash, Calendar, Tag } from "lucide-vue-next";
import type { Klasifikasi } from "~/types/klasifikasi";
import { Alert } from "@/composables/useAlert";
import TulisInputLampiran from "@/components/Tulis/InputLampiranAsync.vue";

definePageMeta({ middleware: "auth" });

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
const { createKonsep, previewPdf, forwardKonsep, createDraft, updateDraft, getKonsepDraftDetail } = useKonsep();
const { apiGet } = useApi();
const { getExternalRecipients } = useSde();
const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { fetchInboxDetail, fetchKonsepDetail } = useInbox();

const route = useRoute();
const router = useRouter();
const draftListQuery = computed(() => pickKorespondensiListQuery(route.query));
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
const lampiranText = ref("");
const english = ref(false);
const tinymceEditor = ref<TinyMCEEditor | null>(null);
const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));
const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const selectedKlasifikasiId = ref<string | null>(null);
const existingFiles = ref<UploadedFile[]>([]);
const selectedSifat = ref<SifatOption | null>(null);

// SDE: dua list terpisah
const externalItems = ref<RecipientItem[]>([]);  // untuk Tertuju
const internalItems = ref<RecipientItem[]>([]);  // untuk Tembusan
const senderItems = ref<RecipientItem[]>([]);

const selectedSender = ref<RecipientItem | undefined>();
const selectedTertuju = ref<RecipientItem[]>([]);   // eksternal
const selectedTembusan = ref<RecipientItem[]>([]);  // internal
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
const formatDateRef = (value?: string) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch { return value; }
};

const getCategoryStyle = (cat: string) => {
  const c = (cat || '').toUpperCase();
  if (['ND', 'NOTA DINAS'].includes(c)) return 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-300';
  if (['DI', 'DISPOSISI'].includes(c)) return 'bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-300';
  if (['SDI', 'INTERNAL', 'SURAT DINAS INTERNAL'].includes(c)) return 'bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-300';
  if (['SDE', 'SURAT DINAS EKSTERNAL'].includes(c)) return 'bg-orange-50 text-orange-500 dark:bg-orange-900/30 dark:text-orange-300';
  return 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-300';
};

const formatDisposisiInline = (val: any) => {
  if (!val) return '';
  if (Array.isArray(val)) return val.join(', ');
  return String(val).replace(/(\r\n|\n|\r)/gm, ", ");
};

// --- Computed ---
const isSenderSelected = computed(() => !!selectedSender.value);

// ponytail: replikasi pola ND — konsep harus turun dulu ke previous disposer
// (pengirim disposisi acuan) sebelum ke penandatangan. Saat reject, kembali ke
// previous konseptor (detail.from_position_id). Fallback atasan langsung.
const atasanLangsungInfo = computed(() => user.value?.atasan_langsung || null);
const isRejectAction = computed(() => String(detail.value?.aksi || '').toLowerCase() === 'reject');
const isNewKonsepFromReference = computed(() =>
  String(route.query.workflow || '').toLowerCase() === 'konsep' &&
  String(route.query.action || '').toLowerCase() !== 'edit'
);
const forwardTargetInfo = computed(() => {
  if (isRejectAction.value) {
    const fromPositionId = detail.value?.from_position_id;
    const fromPositionText = detail.value?.from_position_text;
    const fromNama = detail.value?.from_nama;
    if (fromPositionId || fromPositionText || fromNama) {
      return {
        position: fromPositionId || '',
        positionText: fromPositionText || '',
        nama: fromNama || '',
      };
    }
  }
  if (isNewKonsepFromReference.value && refData.value?.pengirim) {
    const p = refData.value.pengirim;
    return {
      position: p.position_id || p.position || '',
      positionText: p.position_text || p.positionText || '',
      nama: p.nama || p.persnum_person_text || '',
    };
  }
  return atasanLangsungInfo.value;
});
const forwardTargetPositionId = computed(() => String(forwardTargetInfo.value?.position || ''));

const refSenderInitials = computed(() => {
  if (!refData.value) return "?";
  const name = refData.value.pengirim_nama || refData.value.pengirim?.nama;
  if (!name) return "?";
  return name.trim().split(" ").filter(Boolean).slice(0, 2).map((n: string) => n.charAt(0).toUpperCase()).join("");
});

const refPdfUrl = computed(() => {
  if (!refData.value) return '';
  if (refData.value.final_pdf_url) return refData.value.final_pdf_url;
  if (refData.value.lampiran_files?.length > 0) {
    return refData.value.lampiran_files[0].file_url || refData.value.lampiran_files[0].file_path;
  }
  return '';
});

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
    { label: "Lanjut Konsep Surat Dinas Eksternal", to: "#" },
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
const fetchSenderList = async (posId: string | number) => {
  try {
    const res = await apiGet<{ success: boolean; data: any[] }>(
      `/SDE/get-senders?pengirim=${posId}`
    );
    if (res?.success && Array.isArray(res.data)) {
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

const validateAndToast = (payload: any): boolean => {
  if (!payload.perihal?.trim()) {
    toast.add({ title: 'Validasi Gagal', description: 'Perihal wajib diisi', color: 'error' });
    return false;
  }
  if (!payload.penerima || payload.penerima.length === 0) {
    toast.add({ title: 'Validasi Gagal', description: 'Tertuju (penerima eksternal) wajib dipilih', color: 'error' });
    return false;
  }
  return true;
};

const getBasePayload = () => {
  const currentSender = selectedSender.value || {} as any;
  const senderRaw = currentSender.raw || {};
  const tglDb = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : "";
  return {
    id_naskah: editDraftId.value || null,
    pengirim: currentSender.value || user.value?.position || "",
    penerima: selectedTertuju.value.map(i => i.value),       // eksternal
    tembusan: selectedTembusan.value.map(i => i.value),      // internal
    klasifikasi: selectedKlasifikasi.value?.klasifikasi || "",
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || "",
    sifat: selectedSifat.value?.value || "biasa",
    perihal: subject.value,
    lampiran: lampiranText.value,
    konten: String(editorContent.value || ''),
    english: english.value,
    nama_tempat: senderRaw.area_text || user.value?.areaText || "Tangerang",
    nama_jabatan: senderRaw.position_text || currentSender.labelJob || user.value?.positionText || "",
    nama_lengkap: senderRaw.persnum_person_text || user.value?.nama || "",
    tgl: tglDb,
    tanggal: formattedDate.value,
    lampiran_temp_ids: existingFiles.value.map(f => f.id).filter(Boolean),
    catatan: message.value || '',
  };
};

const createFormData = (payload: any) => {
  const formData = new FormData();
  Object.keys(payload).forEach((key) => {
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

  formData.append('jenis', 'SDE');
  formData.append('id_disposisi_referensi', refData.value?.id || '');
  formData.append('from_position_id', creatorId);
  formData.append('to_position_id', forwardTargetPositionId.value || String(signerInfo.value || ''));
  formData.append('pengirim_position_id', signerInfo.value || '');
  // SDE: penerima = eksternal (by id), tembusan = internal (by position id)
  formData.append('penerima_ids', JSON.stringify(selectedTertuju.value.map(i => i.value)));
  formData.append('tembusan_position_ids', JSON.stringify(selectedTembusan.value.map(i => i.value)));
  formData.append('tgl', tglDb);
  formData.append('klasifikasi', selectedKlasifikasi.value?.klasifikasi || '');
  formData.append('klasifikasi_text', selectedKlasifikasi.value?.nama || selectedKlasifikasi.value?.klasifikasi_text || '');
  formData.append('sifat', selectedSifat.value?.value || 'biasa');
  formData.append('perihal', subject.value);
  formData.append('lampiran', lampiranText.value);
  formData.append('konten', editorContent.value);
  formData.append('english', String(english.value));
  formData.append('nama_tempat', signerRaw.area_text || user.value?.areaText || "Tangerang");
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
    isRevision ? 'Perbaikan konsep akan dikirim.' : 'Konsep Surat Dinas Eksternal akan dikirim.',
    'Ya, Kirim', 'Batal', false
  );
  if (!isConfirmed) return;

  loadingMessage.value = isRevision ? "Mengirim Perbaikan..." : "Membuat Konsep Surat Dinas Eksternal...";
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

      formData.append('jenis', 'SDE');
      formData.append('from_position_id', user.value?.position || '');
      formData.append('to_position_id', forwardTargetPositionId.value || String(currentSender.value || ''));
      formData.append('pengirim_position_id', currentSender.value || '');
      formData.append('penerima_ids', JSON.stringify(selectedTertuju.value.map(i => i.value)));
      formData.append('tembusan_position_ids', JSON.stringify(selectedTembusan.value.map(i => i.value)));
      formData.append('tgl', tglDb);
      formData.append('klasifikasi', selectedKlasifikasi.value?.klasifikasi || '');
      formData.append('klasifikasi_text', selectedKlasifikasi.value?.nama || selectedKlasifikasi.value?.klasifikasi_text || '');
      formData.append('sifat', selectedSifat.value?.value || 'biasa');
      formData.append('perihal', subject.value);
      formData.append('lampiran', lampiranText.value);
      formData.append('konten', editorContent.value);
      formData.append('english', String(english.value));
      formData.append('nama_tempat', signerRaw.area_text || user.value?.areaText || "Tangerang");
      formData.append('nama_jabatan', signerRaw.position_text || currentSender.labelJob || "");
      formData.append('nama_lengkap', signerRaw.persnum_person_text || user.value?.nama || "");
      formData.append('lampiran_temp_ids', JSON.stringify(lampiranIds));
      formData.append('catatan', message.value || '-');
      formData.append('lampiran_count', existingFiles.value.length > 0 ? '1' : '0');

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
        description: isRevision ? 'Perbaikan berhasil dikirim' : 'Konsep Surat Dinas Eksternal berhasil dibuat',
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
    toast.add({ title: 'Gagal', description: e.response?.data?.message || e.message || 'Terjadi kesalahan saat mengirim', color: 'error' });
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
    const formData = prepareKonsepFormData();
    if (editDraftId.value) {
      await updateDraft(editDraftId.value, formData);
    } else {
      await createDraft(formData);
    }
    toast.add({ title: 'Berhasil', description: 'Draft berhasil disimpan', color: 'success' });
    router.push({ path: "/korespondensi/draf", query: draftListQuery.value });
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
    'Ya, Simpan', 'Batal', false
  );
  if (!isConfirmed) return;
  try {
    await handleSaveDraft();
    Alert.close();
  } catch { Alert.close(); }
};

// --- Watchers ---
watch(editorContent, (newVal) => {
  if (tinymceEditor.value && newVal && tinymceEditor.value.getContent() !== newVal) {
    tinymceEditor.value.setContent(newVal);
  }
});

const fetchTembusanBySender = async (senderPositionId: string) => {
  if (!senderPositionId) {
    internalItems.value = [];
    return;
  }
  try {
    const tembusanRes = await apiGet<any>(
      `/SDE/get-tembusan?pengirim=${senderPositionId}`,
    );
    const tembusanData = tembusanRes?.data?.tembusan || tembusanRes?.tembusan || [];
    if (Array.isArray(tembusanData)) {
      internalItems.value = tembusanData.map((r: any) => ({
        label: `${r.persnum_person_text || r.persnum || '-'} - (${r.position_abbreviation || r.abbreviation || '-'}) ${r.position_text || r.positionText}`,
        labelJob: r.position_text || r.positionText,
        value: String(r.position || r.position_id || r.id),
        raw: r,
      }));
    }
  } catch (e) {
    console.error('Gagal memuat tembusan:', e);
    internalItems.value = [];
  }
};

watch(selectedSender, async (newVal, oldVal) => {
  if (newVal?.value !== oldVal?.value) {
    selectedTertuju.value = [];
    selectedTembusan.value = [];
  }
  // ponytail: tembusan internal pakai position_id pengirim (managerial chief), bukan user login.
  // Fix 403 "bukan managerial" — fetch ulang tiap ganti pengirim.
  await fetchTembusanBySender(String(newVal?.value || ''));
}, { deep: true });

watch(existingFiles, (files) => {
  lampiranText.value = files?.length > 0 ? `${files.length} Lampiran` : "0 Lampiran";
}, { deep: true, immediate: true });

// --- Lifecycle ---
onMounted(async () => {
  const queryAction = route.query.action as string;
  const refId = route.query.ref_id as string;
  const refJenis = route.query.ref_jenis as string;
  const draftId = route.query.draft_id as string;

  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";
    // ponytail: klasifikasi + tertuju(eksternal) tidak bergantung pengirim — fetch independent.
    // Tembusan(internal) bergantung position_id PENGIRIM (managerial chief), fetch di watch(selectedSender)
    // agar pakai signer, bukan user login (fix 403 "bukan managerial").
    const [klasRes, externalRecRes] = await Promise.all([
      getKlasifikasi(),
      getExternalRecipients(),
    ]);

    klasifikasiList.value = klasRes;
    klasifikasiStatus.value = "success";

    // Mapping external items (Tertuju) — dari /persuratan/eksternal
    if (externalRecRes?.success && Array.isArray(externalRecRes.data)) {
      externalItems.value = externalRecRes.data.map((item: any) => ({
        label: item.nama,
        labelJob: item.nama,
        value: item.id,
        raw: item,
      }));
    }
  } catch {
    klasifikasiStatus.value = "error";
  }

  // Load sender list
  if (user.value?.position) await fetchSenderList(user.value.position);

  // A. EDIT MODE
  if (queryAction === 'edit' && refId) {
    loadingMessage.value = "Memuat data konsep...";
    isLoadingData.value = true;
    try {
      const result = await fetchKonsepDetail(refId);
      if (result) {
        const unwrappedData: any = (result as any).data || result;
        // ponytail: augment detail dengan aksi/from_position_id dari flow terbaru
        // (reject routing) — unwrappedData (naskah detail) tak punya field itu top-level.
        const _flows = Array.isArray(unwrappedData.flow) ? unwrappedData.flow : [];
        const _latestFlow = [..._flows]
          .filter((f: any) => f?.aksi || f?.detail?.aksi)
          .sort((a: any, b: any) =>
            new Date(b.created_at || b.tanggal).getTime() - new Date(a.created_at || a.tanggal).getTime(),
          )[0];
        detail.value = {
          ...unwrappedData,
          aksi: _latestFlow?.detail?.aksi || _latestFlow?.aksi || unwrappedData.aksi || '',
          from_position_id:
            _latestFlow?.from_position_id ||
            _latestFlow?.detail?.from_position_id ||
            _latestFlow?.pengirim?.position_id ||
            unwrappedData.from_position_id ||
            '',
          from_position_text:
            _latestFlow?.from_position_text ||
            _latestFlow?.detail?.from_position_text ||
            _latestFlow?.pengirim?.position_text ||
            '',
          from_nama:
            _latestFlow?.from_nama ||
            _latestFlow?.detail?.from_nama ||
            _latestFlow?.pengirim?.nama ||
            '',
          catatan_reject: _latestFlow?.detail?.catatan || unwrappedData.catatan_reject || '',
          data: { catatan_reject: _latestFlow?.detail?.catatan || unwrappedData.catatan_reject || '' },
        };
        editDraftId.value = unwrappedData.id || unwrappedData.konsep?.id;
        subject.value = unwrappedData.perihal || unwrappedData.konsep?.perihal || "";
        lampiranText.value = unwrappedData.lampiran || "";

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
        if (sifatStr) selectedSifat.value = sifatOptions.find(opt => opt.value === sifatStr.toLowerCase()) || sifatOptions[3];

        const klasCode = unwrappedData.naskah?.klasifikasi;
        if (klasCode) {
          const foundKlas = klasifikasiList.value.find(k => k.klasifikasi === klasCode);
          if (foundKlas) selectedKlasifikasiId.value = foundKlas.id;
        }

        editorContent.value = unwrappedData.konten || unwrappedData.naskah?.konten || "";

        // Pengirim
        if (unwrappedData.pengirim) {
          const posId = String(unwrappedData.pengirim.position_id || unwrappedData.pengirim.position || '');
          const senderMatch = senderItems.value.find(s => s.value === posId);
          selectedSender.value = senderMatch || {
            label: `${unwrappedData.pengirim.nama || ''} - ${unwrappedData.pengirim.position_text || ''}`,
            labelJob: unwrappedData.pengirim.position_text || '',
            value: posId,
            raw: unwrappedData.pengirim,
          };
        }

        // Tertuju: restore dari penerima eksternal
        if (unwrappedData.kepada && Array.isArray(unwrappedData.kepada)) {
          selectedTertuju.value = unwrappedData.kepada.map((p: any) => ({
            label: p.nama || p.label || '',
            labelJob: p.nama || p.label || '',
            value: String(p.id || p.value || ''),
            raw: p,
          }));
        }

        // Tembusan: restore dari internal
        if (unwrappedData.tembusan && Array.isArray(unwrappedData.tembusan)) {
          selectedTembusan.value = unwrappedData.tembusan.map((t: any) => {
            const posId = String(t.position || t.position_id || t.id || '');
            return internalItems.value.find(i => i.value === posId) || {
              label: `${t.nama || ''} - ${t.position_text || ''}`,
              labelJob: t.position_text || '',
              value: posId,
              raw: t,
            };
          });
        }

        if (unwrappedData.lampiran_files && Array.isArray(unwrappedData.lampiran_files)) {
          existingFiles.value = unwrappedData.lampiran_files.map((f: any) => ({
            id: f.id, fileName: f.filename || f.file_name || 'File',
            filePath: f.url || f.file_path || '', fileSize: f.size || 0,
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
              perihal: originFlow.naskah?.perihal || '',
              jenis: originFlow.naskah?.jenis || 'Naskah',
              jenis_label: originFlow.naskah?.jenis || 'Naskah',
              pengirim: originFlow.naskah?.pengirim || null,
              pengirim_nama: originFlow.naskah?.pengirim?.nama || '-',
              pengirim_jabatan: originFlow.naskah?.pengirim?.position_text || '-',
              kepada: originFlow.naskah?.penerima || [],
              tembusan: originFlow.naskah?.tembusan || [],
              catatan: originFlow.catatan || '',
              final_pdf_url: originFlow.naskah?.final_pdf || originFlow.pdf_snapshot || null,
              lampiran_files: originFlow.naskah?.lampiran_files || [],
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
        // When chain has multiple items, rawData is an array.
        // Find the item matching refId to get correct pengirim (the person who sent it to current user).
        const dataArray = Array.isArray(rawData) ? rawData : (rawData.raw?.flow?.length > 0 ? rawData.raw.flow : [rawData]);
        const rawFlow = dataArray.find((item: any) => item.id === refId) || dataArray[0] || rawData;
        refData.value = {
          id: rawFlow.id,
          nomor: rawFlow.nomor || '-',
          tanggal: rawFlow.tanggal,
          perihal: rawFlow.perihal,
          jenis: rawFlow.jenis,
          jenis_label: rawFlow.jenis === 'DI' ? 'DISPOSISI' : (rawFlow.jenis || 'SURAT'),
          pengirim: rawFlow.pengirim || null,
          pengirim_nama: rawFlow.pengirim?.nama || rawFlow.pengirim?.name || '-',
          pengirim_jabatan: rawFlow.pengirim?.positionText || rawFlow.pengirim?.position_text || '-',
          kepada: rawFlow.penerima || [],
          tembusan: rawFlow.tembusan || [],
          catatan: rawFlow.catatan,
          disposisi: rawFlow.disposisi,
          final_pdf_url: rawFlow.final_pdf_url || rawFlow.final_pdf || null,
          lampiran_files: rawFlow.lampiran_files || [],
        };
      }
    } catch (e) { console.error(e); }
    isLoadingData.value = false;
  }

  // C. DRAFT
  else if (draftId) {
    loadingMessage.value = "Memuat draft...";
    isLoadingData.value = true;
    try {
      editDraftId.value = draftId;
      const resDraft = await getKonsepDraftDetail(draftId);
      if (resDraft.success && resDraft.data) {
        const d = resDraft.data;
        subject.value = d.perihal || "";
        editorContent.value = d.konten || "";
        lampiranText.value = d.lampiran || "";
        message.value = d.catatan || "";
        english.value = Boolean(d.english);

        if (d.klasifikasi) {
          const klCode = String(d.klasifikasi).trim();
          const foundKlas = klasifikasiList.value.find((k: any) =>
            k.klasifikasi === klCode || k.kode === klCode || k.id === klCode
          );
          if (foundKlas) selectedKlasifikasiId.value = foundKlas.id;
        }

        // Restore pengirim
        if (d.from_position_id || d.pengirim_position_id) {
          const senderId = String(d.pengirim_position_id || d.from_position_id);
          const found = senderItems.value.find(s => s.value === senderId);
          if (found) selectedSender.value = found;
        }

        // Tertuju: eksternal — dari penerima array
        if (d.penerima && Array.isArray(d.penerima)) {
          selectedTertuju.value = d.penerima.map((item: any) => ({
            label: item.nama || item.label || '',
            labelJob: item.nama || item.label || '',
            value: String(item.id || item.value || ''),
            raw: item,
          }));
        }

        // Tembusan: internal — dari tembusan array
        if (d.tembusan && Array.isArray(d.tembusan)) {
          const tembusanIds = d.tembusan.map((t: any) =>
            typeof t === 'object' ? String(t.position_id || t.position || t.id || t.value) : String(t)
          );
          selectedTembusan.value = internalItems.value.filter(item =>
            tembusanIds.includes(String(item.value))
          );
          // Fallback: jika tidak cocok di internalItems, buat manual
          if (selectedTembusan.value.length === 0 && d.tembusan.length > 0) {
            selectedTembusan.value = d.tembusan.map((t: any) => ({
              label: `${t.nama || ''} - ${t.position_text || ''}`,
              labelJob: t.position_text || '',
              value: String(t.position_id || t.position || t.id || ''),
              raw: t,
            }));
          }
        }

        if (Array.isArray(d.lampiran_files)) {
          existingFiles.value = d.lampiran_files.map((f: any) => ({
            id: f.id, fileName: f.fileName || f.file_name,
            filePath: f.fileUrl || f.file_path, fileSize: f.fileSize || 0,
          }));
        }
        selectedSifat.value = sifatOptions.find(opt => opt.value === String(d.sifat || 'biasa').toLowerCase()) || sifatOptions[3];
        const tglStr = d.tanggal || d.tgl;
        if (tglStr) {
          const p = tglStr.split('T')[0].split('-');
          if (p.length === 3) date.value = new CalendarDate(Number(p[0]), Number(p[1]), Number(p[2]));
        }
      }
    } catch (e) { console.error(e); }
    isLoadingData.value = false;
  }

  // D. NEW
  else {
    isLoadingData.value = false;
  }
});
</script>

<style scoped>
:deep(.tox-tinymce) { border: none !important; }
.tox-fullscreen { z-index: 9999 !important; position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; }
.tox-dialog-wrap, .tox-dropzone, .tox-promotions { z-index: 10000 !important; }
</style>
