<template>
  <div class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== 'Memuat...'" :message="loadingMessage" />

    <PageHeader title="Lanjut Konsep Surat Dinas Internal" :items="breadcrumbs" />

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

        <!-- Tertuju: exclude yang sudah dipilih di TEMBUSAN -->
        <!-- Tertuju: exclude tembusan + anggota grup tembusan -->
        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju"
          :placeholder="isSenderSelected ? 'Pilih Tertuju' : 'Pilih pengirim terlebih dahulu'" :items="items"
          :groups="recipientGroups" :exclude-items="expandedExcludeTertuju" :disabled="!isSenderSelected"
          disabled-message="Sudah dipilih di Tembusan" />

        <!-- Tembusan: exclude tertuju + anggota grup tertuju -->
        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan"
          :placeholder="isSenderSelected ? 'Pilih Tembusan' : 'Pilih pengirim terlebih dahulu'" :items="items"
          :groups="recipientGroups" :exclude-items="expandedExcludeTembusan" :disabled="!isSenderSelected"
          disabled-message="Sudah dipilih di Tertuju" />
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

        <!-- Lampiran text -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
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
            <div
              class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">
              <div class="bg-white pt-10 pb-10 border-b border-gray-100 select-none text-black min-h-[1000px]">

                <TulisKopSurat :alamat-info="user?.alamatInfo" class="px-6" />

                <div class="flex mb-4 text-[14px] px-10">
                  <div>{{ user?.areaText || 'Tangerang' }}, {{ formattedDate }}</div>
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
                        <div v-for="(p, idx) in selectedTertuju" :key="idx" class="leading-relaxed">
                          <span v-if="selectedTertuju.length > 1">{{ idx + 1 }}. </span>
                          {{ p.labelJob || p.label }}
                        </div>
                      </div>
                      <div v-else>................................................</div>
                    </div>
                    <div class="mb-1">Di Tempat</div>
                  </div>
                </div>

                <div class="min-h-[300px] relative group">
                  <Editor api-key="no-api-key" v-model="editorContent" :initial-value="editorContent"
                    :init="tinyMceInit" />
                </div>

                <div class="flex justify-end mt-12 text-black px-10">
                  <div class="text-center min-w-[250px]">
                    <div class="mb-24 text-[14px]">
                      <div class="font-bold">{{ selectedSender?.labelJob || user?.positionText || 'Nama Jabatan' }}
                      </div>
                    </div>
                    <div class="font-bold text-[14px] underline">{{ selectedSender?.raw?.persnum_person_text ||
                      user?.nama || 'Nama Lengkap' }}</div>
                  </div>
                </div>

                <div class="mt-8 text-[12px] text-black px-10">
                  <div class="font-bold underline mb-1">Tembusan :</div>
                  <div v-if="selectedTembusan.length > 5" class="ml-4 pl-2">Periksa Alamat Terlampir</div>
                  <ol v-else-if="selectedTembusan.length > 0" class="list-decimal ml-4 pl-2">
                    <li v-for="t in selectedTembusan" :key="t.value">{{ t.labelJob || t.label }}</li>
                  </ol>
                  <div v-else class="ml-4 pl-2 text-gray-400 italic">...</div>
                </div>

                <div v-if="selectedTertuju.length > 5 || selectedTembusan.length > 5"
                  class="bg-white px-12 py-12 border-t-4 border-gray-200 text-black break-before-page mt-10">
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
                      <li v-for="item in selectedTertuju" :key="item.value">{{ item.labelJob || item.label }}</li>
                    </ol>
                  </div>
                  <div v-if="selectedTembusan.length > 5">
                    <div class="font-bold text-[14px] mb-2 uppercase">TEMBUSAN :</div>
                    <ol class="list-decimal ml-6 text-[14px] space-y-1">
                      <li v-for="item in selectedTembusan" :key="item.value">{{ item.labelJob || item.label }}</li>
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
import { Hash, Calendar, Tag } from "lucide-vue-next";
import type { Klasifikasi } from "~/types/klasifikasi";
import { validateDraftPayload, type DraftPayload } from "~/types/nota-dinas";
import { Alert } from "@/composables/useAlert";

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
const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
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

// excludeTertujuList = yang sudah dipilih di TEMBUSAN → di-disable di Tertuju
const excludeTertujuList = computed(() => selectedTembusan.value);
// excludeTembusanList = yang sudah dipilih di TERTUJU → di-disable di Tembusan
const excludeTembusanList = computed(() => selectedTertuju.value);

// Helper: ambil position IDs dari grup (handle kedua format API)
const getGrupPositionIds = (grupData: any): string[] => {
  if (!grupData) return [];
  // Format 1: langsung ada position_ids array (dari penerima_grup di konsep)
  if (Array.isArray(grupData.position_ids)) {
    return grupData.position_ids.map(String);
  }
  // Format 2: dari getRecipientGroups — position ada di details[].position
  if (Array.isArray(grupData.details)) {
    return grupData.details.map((d: any) => String(d.position));
  }
  return [];
};

const expandedExcludeTertuju = computed(() => {
  const result: any[] = [...selectedTembusan.value];

  selectedTembusan.value
    .filter((i: any) => i.isGroup)
    .forEach((grupItem: any) => {
      const rawId = String(grupItem.value).replace(/^GROUP_/, '');
      const grupData = recipientGroups.value.find((g: any) => String(g.id) === rawId)
        || grupItem.raw;
      const positionIds = getGrupPositionIds(grupData);

      positionIds.forEach((posId: string) => {
        const found = items.value.find((item: any) => String(item.value) === posId);
        if (found && !result.some((r: any) => r.value === found.value)) {
          result.push(found);
        }
      });
    });

  return result;
});

const expandedExcludeTembusan = computed(() => {
  const result: any[] = [...selectedTertuju.value];

  selectedTertuju.value
    .filter((i: any) => i.isGroup)
    .forEach((grupItem: any) => {
      const rawId = String(grupItem.value).replace(/^GROUP_/, '');
      const grupData = recipientGroups.value.find((g: any) => String(g.id) === rawId)
        || grupItem.raw;
      const positionIds = getGrupPositionIds(grupData);

      positionIds.forEach((posId: string) => {
        const found = items.value.find((item: any) => String(item.value) === posId);
        if (found && !result.some((r: any) => r.value === found.value)) {
          result.push(found);
        }
      });
    });

  return result;
});

// ── computed: pisah individu & grup, strip GROUP_ prefix ─────────────────────
const tertujuIndividu = computed(() =>
  selectedTertuju.value.filter((i: any) => !i.isGroup).map((i: any) => i.value)
);
const tembusanIndividu = computed(() =>
  selectedTembusan.value.filter((i: any) => !i.isGroup).map((i: any) => i.value)
);
const tertujuGrup = computed(() =>
  selectedTertuju.value
    .filter((i: any) => i.isGroup)
    .map((i: any) => String(i.value).replace(/^GROUP_/, ''))
);
const tembusanGrup = computed(() =>
  selectedTembusan.value
    .filter((i: any) => i.isGroup)
    .map((i: any) => String(i.value).replace(/^GROUP_/, ''))
);

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
    { label: "Lanjut Konsep Surat Dinas Internal", to: "#" },
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
    const res = await apiGet<{ success: boolean; data: { recipients: any } }>(
      `/SDI/get-recipient?pengirim=${senderPositionId}`
    );
    const recipientsData = res?.data?.recipients;
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
    const res = await apiGet<{ success: boolean; data: any[] }>(
      `/SDI/get-senders?pengirim=${posId}`
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
    lampiran: lampiranText.value,
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

  formData.append('jenis', 'SDI');
  formData.append('id_disposisi_referensi', refData.value?.id || '');
  formData.append('from_position_id', creatorId);
  formData.append('to_position_id', signerInfo.value || '');
  formData.append('pengirim_position_id', signerInfo.value || '');
  formData.append('penerima_position_ids', JSON.stringify(tertujuIndividu.value));
  formData.append('tembusan_position_ids', JSON.stringify(tembusanIndividu.value));
  formData.append('penerima_grup', JSON.stringify(tertujuGrup.value));
  formData.append('tembusan_grup', JSON.stringify(tembusanGrup.value));
  formData.append('tgl', tglDb);
  formData.append('klasifikasi', selectedKlasifikasi.value?.klasifikasi || '');
  formData.append('klasifikasi_text', selectedKlasifikasi.value?.nama || selectedKlasifikasi.value?.klasifikasi_text || '');
  formData.append('sifat', selectedSifat.value?.value || 'biasa');
  formData.append('perihal', subject.value);
  formData.append('lampiran', lampiranText.value);
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
  loadingMessage.value = "Memproses Pratinjau...";
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
    isRevision ? 'Perbaikan konsep akan dikirim.' : 'Konsep Surat Dinas Internal akan dikirim.',
    'Ya, Kirim',
    'Batal',
    false
  );
  if (!isConfirmed) return;

  loadingMessage.value = isRevision ? "Mengirim Perbaikan..." : "Membuat Konsep Surat Dinas Internal...";
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

      formData.append('jenis', 'SDI');
      formData.append('from_position_id', user.value?.position || '');
      formData.append('to_position_id', currentSender.value || '');
      formData.append('pengirim_position_id', currentSender.value || '');
      formData.append('penerima_position_ids', JSON.stringify(tertujuIndividu.value));
      formData.append('tembusan_position_ids', JSON.stringify(tembusanIndividu.value));
      formData.append('penerima_grup', JSON.stringify(tertujuGrup.value));
      formData.append('tembusan_grup', JSON.stringify(tembusanGrup.value));
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

     const konsepId = detail.value?.id || editDraftId.value;
if (!konsepId) throw new Error("ID Konsep tidak ditemukan untuk proses perbaikan (forward)");

      result = await forwardKonsep(konsepId, formData);
    } else {
      const formData = prepareKonsepFormData();
      result = await createKonsep(formData);
    }

    if (result.success) {
      toast.add({
        title: 'Berhasil',
        description: isRevision ? 'Perbaikan berhasil dikirim' : 'Konsep Surat Dinas Internal berhasil dibuat',
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
    klasifikasiList.value = await getKlasifikasi();
    klasifikasiStatus.value = "success";
    const groups = await getRecipientGroups("SDI");
    recipientGroups.value = groups.filter((g: any) => g.aktif);
  } catch { klasifikasiStatus.value = "error"; }

  // A. EDIT MODE
  if (queryAction === 'edit' && refId) {
    loadingMessage.value = "Memuat data konsep...";
    isLoadingData.value = true;
    try {
      const result = await fetchKonsepDetail(refId);
      if (result) {
        // fetchKonsepDetail return { flow: [...], ... } bukan raw array
        const rawArray: any[] = result.flow || [];

        if (rawArray.length === 0) {
          toast.add({ title: 'Gagal', description: 'Data konsep tidak ditemukan', color: 'error' });
          return;
        }

        // Cari konsep terbaru (jenis K)
        const konsepFlows = rawArray
          .filter((f: any) => f.jenis === 'K')
          .sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        const latestKonsep = konsepFlows[0];

        if (!latestKonsep) {
          toast.add({ title: 'Gagal', description: 'Data konsep tidak ditemukan', color: 'error' });
          return;
        }

        // Cari referensi disposisi (jenis DI)
        const refDisposisi = rawArray.find((f: any) => f.jenis === 'DI');

        if (!latestKonsep) {
          toast.add({ title: 'Gagal', description: 'Data konsep tidak ditemukan', color: 'error' });
          return;
        }

        detail.value = { ...latestKonsep, catatan_reject: result.catatan_reject };
        editDraftId.value = latestKonsep.id;
        subject.value = latestKonsep.perihal || "";
        editorContent.value = latestKonsep.konten || "";
        message.value = latestKonsep.detail?.catatan || "";

        // Tanggal
        const tglStr = latestKonsep.tanggal;
        if (tglStr) {
          const tglParts = new Date(tglStr);
          date.value = new CalendarDate(tglParts.getFullYear(), tglParts.getMonth() + 1, tglParts.getDate());
        }

        // Sifat
        const sifatStr = latestKonsep.sifat;
        if (sifatStr) {
          selectedSifat.value = sifatOptions.find(opt => opt.value === sifatStr.toLowerCase()) || sifatOptions[3];
        }

        // Klasifikasi
        if (latestKonsep.klasifikasi) {
          const foundKlas = klasifikasiList.value.find((k: any) => k.klasifikasi === latestKonsep.klasifikasi);
          if (foundKlas) selectedKlasifikasiId.value = foundKlas.id;
        }

        // Pengirim
        if (latestKonsep.pengirim) {
          const senderObj = mapPersonToUI(latestKonsep.pengirim);
          selectedSender.value = senderObj;
          await fetchSenderList(senderObj.value);
          await fetchRecipientsBySender(senderObj.value);
        }

        // Penerima & Tembusan — ambil dari detail.naskah_penerima atau root penerima
        // Gunakan logika sama persis dengan tulis SDI biasa (buildSelectedFiltered)
        const buildSelectedFiltered = (apiArr: any[], grupArr: any[]) => {
          if (!apiArr?.length) return [];

          const grupPositionIds = new Set<string>();
          (grupArr || []).forEach((grup: any) => {
            (grup.position_ids || []).forEach((posId: any) => {
              grupPositionIds.add(String(posId));
            });
          });

          const allKnownPositions = new Set<string>();
          items.value.forEach((item: any) => {
            allKnownPositions.add(String(item.value));
          });

          return apiArr
            .filter((item: any) => {
              const posId = String(item.position_id || '');
              // Buang jika position ada di grup
              if (grupPositionIds.has(posId)) return false;
              // Buang jika tidak dikenal DAN ada grup aktif
              if (!allKnownPositions.has(posId) && grupPositionIds.size > 0) return false;
              return true;
            })
            .map((item: any) => {
              const posId = String(item.position_id || '');
              const found = items.value.find((m: any) => String(m.value) === posId);
              return found || {
                label: `${item.nama || ''} - ${item.position_text || ''}`,
                labelJob: item.position_text || '',
                value: posId,
                raw: item,
              };
            })
            .filter(Boolean);
        };

        // Sumber data penerima: dari detail.naskah_penerima (expand dari grup) atau root penerima
        // Ambil dari detail, bukan root
        const rawPenerima = latestKonsep.detail?.naskah_penerima || [];
        const penerimaGrup = latestKonsep.detail?.penerima_grup || latestKonsep.penerima_grup || [];

        const rawTembusan = latestKonsep.detail?.naskah_tembusan || latestKonsep.tembusan || [];
        const tembusanGrupData = latestKonsep.detail?.tembusan_grup || latestKonsep.tembusan_grup || [];

        // buildSelectedFiltered sudah benar — filter individu yang ada di grup
        selectedTertuju.value = [
          ...mapGroupsToUI(penerimaGrup),
          ...buildSelectedFiltered(rawPenerima, penerimaGrup),
        ];
        selectedTembusan.value = [
          ...mapGroupsToUI(tembusanGrupData),
          ...buildSelectedFiltered(rawTembusan, tembusanGrupData),
        ];

        selectedTertuju.value = [
          ...mapGroupsToUI(penerimaGrup),
          ...buildSelectedFiltered(rawPenerima, penerimaGrup),
        ];
        selectedTembusan.value = [
          ...mapGroupsToUI(tembusanGrupData),
          ...buildSelectedFiltered(rawTembusan, tembusanGrupData),
        ];

        // Lampiran
        if (latestKonsep.lampiran_files?.length) {
          existingFiles.value = latestKonsep.lampiran_files.map((f: any) => ({
            id: f.id,
            fileName: f.file_name || f.fileName || 'File',
            filePath: f.file_url || f.file_path || '',
            fileSize: f.fileSize || 0,
          }));
        }

        // Referensi card — dari disposisi jika ada
        if (refDisposisi) {
          refData.value = {
            id: refDisposisi.id,
            nomor: refDisposisi.nomor || '-',
            tanggal: refDisposisi.tanggal,
            perihal: refDisposisi.perihal || refDisposisi.konten || '-',
            jenis: refDisposisi.jenis,
            jenis_label: 'DISPOSISI',
            pengirim_nama: refDisposisi.pengirim?.nama || '-',
            pengirim_jabatan: refDisposisi.pengirim?.position_text || '-',
            catatan: refDisposisi.detail?.catatan || refDisposisi.konten || '',
            final_pdf_url: refDisposisi.final_pdf_url || refDisposisi.final_pdf || null,
            lampiran_files: refDisposisi.lampiran_files || [],
          };
          isRefExpanded.value = false;
        }
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
        const rawFlow = rawData.raw?.flow?.length > 0 ? rawData.raw.flow[0] : rawData;
        refData.value = {
          id: rawFlow.id,
          nomor: rawFlow.nomor || '-',
          tanggal: rawFlow.tanggal,
          perihal: rawFlow.perihal,
          jenis: rawFlow.jenis,
          jenis_label: rawFlow.jenis === 'DI' ? 'DISPOSISI' : (rawFlow.jenis || 'SURAT'),
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

        if (user.value?.position) await fetchSenderList(user.value.position);

        // Restore pengirim
        if (d.from_position_id || d.pengirim_position_id) {
          const senderId = String(d.pengirim_position_id || d.from_position_id);
          const found = senderItems.value.find(s => s.value === senderId);
          if (found) {
            selectedSender.value = found;
            await fetchRecipientsBySender(senderId);
          }
        }

        const mapApiToUI = (list: any[]) => list?.map(item => {
          const posId = String(item.position_id || item.position || item.value);
          const master = items.value.find(m => m.value === posId);
          return master || {
            label: `${item.nama || ''} - ${item.position_text || item.positionText || ''}`,
            labelJob: item.position_text || item.positionText || '', value: posId, raw: item,
          };
        }) || [];

        selectedTertuju.value = [...mapGroupsToUI(d.penerima_grup || []), ...mapApiToUI(d.penerima || [])];
        selectedTembusan.value = [...mapGroupsToUI(d.tembusan_grup || []), ...mapApiToUI(d.tembusan || [])];

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
