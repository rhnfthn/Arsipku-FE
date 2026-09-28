<template>
  <div class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== 'Memuat...'" :message="loadingMessage" />

    <PageHeader title="Lanjut Konsep Nota Dinas" :items="breadcrumbs" />
    <!-- <div>{{ detail }}</div> -->
    <div v-if="refData" class="mb-4 mt-6">
      <div
        class="rounded-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm overflow-hidden">
        <div @click="isRefExpanded = !isRefExpanded"
          class="flex items-center align-center justify-between px-5 py-3 cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-primary-900/30 transition-colors border-b border-primary-100 dark:border-primary-800/50">
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
      <!-- DEBUG: Turunkan target info -->
      <div v-if="isTurunkanAction" class="mb-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3 py-2 text-[11px] font-mono text-yellow-800 dark:text-yellow-300">
        <p class="font-bold mb-1">DEBUG — Turunkan Target:</p>
        <p>turunkan_position_id: {{ $route.query.turunkan_position_id }}</p>
        <p>turunkan_nama: {{ $route.query.turunkan_nama }}</p>
        <p>isTurunkanAction: {{ isTurunkanAction }}</p>
        <p>isRejectAction: {{ isRejectAction }}</p>
        <p>forwardTargetInfo.position: {{ forwardTargetInfo?.position }}</p>
        <p>forwardTargetInfo.positionText: {{ forwardTargetInfo?.positionText }}</p>
        <p>refPengirimPositionId: {{ refPengirimPositionId }}</p>
        <p>selectedSender: {{ selectedSender?.value || selectedSender?.label || 'null' }}</p>
        <p>detail.from_position_id: {{ detail?.from_position_id }}</p>
        <p>detail.aksi: {{ detail?.aksi }}</p>
        <p>atasanLangsung.position: {{ atasanLangsungInfo?.position }}</p>
      </div>
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

    <div
      v-if="isTurunkanAction"
      class="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300"
    >
      Mode turunkan: konsep ini akan diteruskan ke bawahan untuk diperbaiki.
    </div>

    <div
      v-if="isReferenceLoading"
      class="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200"
    >
      Memuat data referensi surat...
    </div>

    <UCard
      variant="soft"
      :ui="{
        root: `rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm ${
          isRejectAction ? 'border border-red-300 dark:border-red-900/60' : ''
        }`
      }"
      :class="{ 'pointer-events-none opacity-70 select-none': isReferenceLoading }"
    >
      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
        </div>
      </div>

      <div v-else class="flex-1 overflow-y-auto space-y-1">

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
            :groups="recipientGroups" :exclude-items="excludeTertujuList" :disabled="!isSenderSelected"
            disabled-message="Sudah dipilih" />
        </div>

        <div :class="{ 'opacity-60 grayscale pointer-events-none': !isSenderSelected }">
          <TulisInputPenerima v-model="selectedTembusan" label="Tembusan"
            :placeholder="isSenderSelected ? 'Pilih Tembusan' : 'Pilih pengirim terlebih dahulu'" :items="items"
            :groups="recipientGroups" :exclude-items="excludeTembusanList" :disabled="!isSenderSelected"
            disabled-message="Sudah dipilih" />
        </div>

        <TulisInputSifat v-model="selectedSifat" />

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
                          <span v-else v-html="selectedTertuju.length
                            ? selectedTertuju.map((s: any, i: number) =>
                              selectedTertuju.length === 1
                                ? `<div>${s.labelJob || s.label}</div>`
                                : `<div style='margin-left:1em;text-indent:-1em'>${i + 1}. ${s.labelJob || s.label}</div>`
                            ).join('')
                            : '................................................'" />
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

                <TinymceEditorAsync api-key="no-api-key" v-model="editorContent" :initial-value="editorContent" :init="tinyMceInit"
                  class="min-h-[400px]" />

                <div class="bg-white px-8 pt-4 pb-8 border-t border-gray-100 select-none">
                  <div class="flex justify-end mb-4 text-black">
                    <div class="text-center min-w-[250px]">
                      <div class="mb-24 text-[14px]">
                        <div>{{ user?.alamatInfo?.kota || 'Tangerang' }}, {{ formattedDate }}</div>
                        <div class="font-bold">{{ selectedSender?.labelJob || user?.positionText || 'Nama Jabatan' }}
                        </div>
                      </div>
                      <div class="font-bold text-[14px]">{{ toTitleCase(selectedSender?.raw?.persnum_person_text || user?.nama) ||
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
import TinymceEditorAsync from '~/components/TinymceEditorAsync.vue';
import type { Editor as TinyMCEEditor } from 'tinymce';
import { pickKorespondensiListQuery } from "~/utils/korespondensi-list-state";
import type { Klasifikasi } from "~/types/klasifikasi";
import { validateDraftPayload, type DraftPayload } from "~/types/nota-dinas";
import { Alert } from "@/composables/useAlert";
import TulisInputLampiran from "@/components/Tulis/InputLampiranAsync.vue";
import TulisKopSurat from "@/components/Tulis/KopSuratAsync.vue";

definePageMeta({ middleware: "auth" });

interface RecipientItem {
  label: string;
  labelJob: string;
  value: string;
  isGroup?: boolean;
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

const {
  excludeTertujuList, excludeTembusanList,
  selectedTertuju, selectedTembusan,
  tertujuIndividu, tembusanIndividu, tertujuGrup, tembusanGrup,
  recipientGroups
} = useTulis();

const { createKonsep, getSendersById, previewPdf, getRecipientsBySender, forwardKonsep, createDraft, updateDraft, getKonsepDraftDetail } = useKonsep();
const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { fetchInboxDetail, fetchKonsepDetail } = useInbox();
const { getRecipientGroups } = useRecipients();

const route = useRoute();
const router = useRouter();
const draftListQuery = computed(() => pickKorespondensiListQuery(route.query));
const toast = useToast();
const alertState = useAlertState();

const sifatOptions: SifatOption[] = [
  { label: "Sangat Rahasia", value: "sangat_rahasia" },
  { label: "Rahasia", value: "rahasia" },
  { label: "Terbatas", value: "terbatas" },
  { label: "Biasa / Terbuka", value: "biasa" },
];

const isLoadingData = ref(false);
const detail = ref<any>(null);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const editDraftId = ref<string | null>(null);
const isExistingDraft = ref(false);
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
const selectedSifat = ref<any>(sifatOptions[3]);
const items = ref<RecipientItem[]>([]);
const senderItems = ref<RecipientItem[]>([]);
const selectedSender = ref<RecipientItem | undefined>();
const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");
const refData = ref<any>(null);
const isRefExpanded = ref(false);
const maxPerihal = 200;
const refPengirimPositionId = ref<string>('');
const restoredDraftTarget = ref<any>(null);
const isPopulating = ref(false);
const isReferenceLoading = ref(
  Boolean(route.query.ref_id) && Boolean(route.query.ref_jenis),
);

const atasanLangsungInfo = computed(() => user.value?.atasan_langsung || null);
const isRejectAction = computed(() => String(detail.value?.aksi || '').toLowerCase() === 'reject');
const isTurunkanAction = computed(() => Boolean(route.query.turunkan_position_id));
const isNewKonsepFromReference = computed(() =>
  String(route.query.workflow || '').toLowerCase() === 'konsep' &&
  String(route.query.action || '').toLowerCase() !== 'edit'
);
const forwardTargetInfo = computed(() => {
  // Turunkan: target = bawahan dari query param
  if (isTurunkanAction.value) {
    return {
      position: String(route.query.turunkan_position_id || ''),
      positionText: String(route.query.turunkan_nama || ''),
      nama: String(route.query.turunkan_person_nama || ''),
    };
  }
  // Reject ATAU turunkan mode edit (perbaiki sendiri): kirim balik ke pengirim
  // yang menolak/menurunkan (= atasan). Untuk turunkan, ini atasan yg delegate ke saya.
  if (isRejectAction.value || (String(detail.value?.aksi || '').toLowerCase() === 'turunkan' && !isTurunkanAction.value)) {
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
  if (restoredDraftTarget.value) return restoredDraftTarget.value;
  return atasanLangsungInfo.value;
});
const forwardTargetPositionId = computed(() => String(forwardTargetInfo.value?.position || ''));

const mapPersonToUI = (person: any): RecipientItem => {
  if (!person) return {} as RecipientItem;
  const nama = person.nama || person.persnum_person_text || person.name || person.persnum || '';
  const posisi = person.position_text || person.positionText || '';

  return {
    label: `${nama} - ${posisi}`,
    labelJob: posisi,
    value: String(person.position_id || person.position || ''),
    isGroup: false,
    raw: person,
  };
};

const mapGroupsToUI = (groups: any[]): RecipientItem[] => {
  if (!Array.isArray(groups)) return [];
  return groups.map((g: any) => {
    const rawId = String(g.id || g.value || '');
    const val = rawId.startsWith('GROUP_') ? rawId : `GROUP_${rawId}`;
    const master = recipientGroups.value.find((rg: any) => `GROUP_${rg.id}` === val);
    if (master) {
      return { label: master.nama, labelJob: master.nama, value: val, isGroup: true, raw: master };
    }

    return {
      label: g.nama || g.name || g.label || '',
      labelJob: g.nama || g.name || g.label || '',
      value: val,
      isGroup: true,
      raw: g,
    };
  });
};

const mergeGrupDanIndividu = (grupUI: RecipientItem[], indivUI: RecipientItem[]): RecipientItem[] => {
  const coveredIds = new Set<string>();
  grupUI.forEach(g => {
    const posIds = g.raw?.position_ids || [];
    posIds.forEach((id: any) => coveredIds.add(String(id)));
  });
  const filteredIndiv = indivUI.filter(indiv => !coveredIds.has(String(indiv.value)));
  return [...grupUI, ...filteredIndiv];
};

const mapGrupDirect = (arr: any[]): RecipientItem[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((g: any) => g?.id || g?.group_id)
    .map((g: any) => {
      const rawId = String(g.id || g.group_id || '');
      const val = `GROUP_${rawId}`;
      const master = recipientGroups.value.find((rg: any) => `GROUP_${rg.id}` === val);
      if (master) {
        return { label: master.nama, labelJob: master.nama, value: val, isGroup: true, raw: master };
      }
      const nama = g.nama || g.name || g.label || rawId;
      return { label: nama, labelJob: nama, value: val, isGroup: true, raw: g } as RecipientItem;
    });
};

const mapApiToUI = (list: any[]): RecipientItem[] => list?.map(item => {
  const posId = String(item.position_id || item.position || item.value);
  const master = items.value.find(m => m.value === posId);

  return master || {
    label: `${item.persnum_person_text || item.nama || item.persnum || ''} - ${item.position_text || item.positionText || item.labelJob || ''}`,
    labelJob: item.position_text || item.positionText || item.labelJob || '',
    value: posId,
    isGroup: false,
    raw: item,
  };
}) || [];

const extractDataArray = (result: any): any[] => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  if (Array.isArray(result?.flow)) return result.flow;
  if (result?.jenis) return [result];
  if (result && typeof result === 'object' && result.id) return [result];
  return [];
};

const formatDateRef = (value?: string) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch { return value; }
};

const refPdfUrl = computed(() => {
  if (!refData.value) return '';
  if (refData.value.final_pdf_url) return refData.value.final_pdf_url;
  if (refData.value.lampiran_files?.length > 0) {
    return refData.value.lampiran_files[0].file_url || refData.value.lampiran_files[0].file_path;
  }
  return '';
});

const isSenderSelected = computed(() => !!selectedSender.value);

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
        isGroup: false,
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
        isGroup: false,
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
  // 1. Validasi Manual Paling Awal untuk Pesan
  if (!message.value || message.value.trim() === '') {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Pesan wajib diisi',
      icon: 'i-heroicons-x-circle-20-solid',
      color: 'error'
    });
    return false; // Hentikan proses jika pesan kosong
  }

  // 2. Validasi dari Zod Schema
  const validationResult = validateDraftPayload(payload);
  if (!validationResult.isValid) {
    const errorKeys = Object.keys(validationResult.errors || {});
    const firstMessage = errorKeys.length > 0 && validationResult.errors
      ? validationResult.errors[errorKeys[0]]
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
  const currentSender = selectedSender.value || {};
  const senderRaw = (currentSender as any).raw || {};
  const tglDb = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : "";

  // Membersihkan elemen HTML kosongan yang dibuat otomatis oleh Text Editor (misal `<p></p>`)
  const strippedContent = editorContent.value.replace(/<[^>]*>?/gm, '').trim();

  return {
    id_naskah: editDraftId.value || null,
    pengirim: (currentSender as any).value || "", // Dikosongkan agar ditangkap Zod jika blm diisi
    penerima: tertujuIndividu.value || [],
    tembusan: tembusanIndividu.value || [],
    penerima_grup: tertujuGrup.value || [],
    tembusan_grup: tembusanGrup.value || [],
    tertuju: selectedTertuju.value.map(i => i.labelJob || i.label),
    klasifikasi: selectedKlasifikasi.value?.klasifikasi || "",
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || "",
    sifat: selectedSifat.value?.value || "",
    perihal: subject.value || "",
    konten: String(editorContent.value || ''),
    htmlContent: strippedContent ? String(editorContent.value) : "", // Dikembalikan empty jika text-only nya kosong
    english: english.value,
    nama_tempat: senderRaw.area_text || senderRaw.areaText || user.value?.areaText || "Kantor Pusat",
    nama_jabatan: senderRaw.position_text || senderRaw.positionText || (currentSender as any).labelJob || "",
    nama_lengkap: senderRaw.persnum_person_text || senderRaw.nama || user.value?.nama || "",
    tgl: tglDb,
    tanggal: formattedDate.value !== "-" ? formattedDate.value : "",
    lampiran_temp_ids: existingFiles.value.map((f) => f.id).filter(Boolean),
  } as any;
};

const createFormData = (payload: DraftPayload) => {
  const formData = new FormData();
  (Object.keys(payload) as Array<keyof DraftPayload>).forEach((key) => {
    const value = payload[key];
    if (Array.isArray(value)) formData.append(key, JSON.stringify(value));
    else if (value !== null && value !== undefined) formData.append(key, String(value));
  });
  return formData;
};

const prepareKonsepFormData = () => {
  const formData = new FormData();
  const signerInfo = selectedSender.value || {} as any;
  const signerRaw = signerInfo.raw || {};
  const tglDb = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : "";

  formData.append('jenis', 'ND');
  formData.append('id_disposisi_referensi', refData.value?.id || '');
  formData.append('from_position_id', user.value?.position || '');
  formData.append('to_position_id', forwardTargetPositionId.value);
  formData.append('pengirim_position_id', String(signerInfo.raw?.position_id || signerInfo.value || ''));
  formData.append('penerima_position_ids', JSON.stringify(tertujuIndividu.value));
  formData.append('tembusan_position_ids', JSON.stringify(tembusanIndividu.value));
  formData.append('penerima_grup', JSON.stringify(tertujuGrup.value));
  formData.append('tembusan_grup', JSON.stringify(tembusanGrup.value));
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
  formData.append('lampiran_temp_ids', JSON.stringify(existingFiles.value.map((f) => f.id).filter(Boolean)));
  formData.append('catatan', message.value.trim());
  // formData.append('catatan', message.value || '-');
  return formData;
};

const prepareRevisiFormData = () => {
  const formData = new FormData();
  const currentSender = selectedSender.value || {} as any;
  const signerRaw = currentSender.raw || {};
  const tglDb = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : "";

  formData.append('jenis', 'ND');
  formData.append('from_position_id', user.value?.position || '');
  formData.append('to_position_id', forwardTargetPositionId.value);
  // Turunkan: flag aksi='turunkan' (delegasi ke bawahan), else aksi='forward' (naik ke atasan)
  formData.append('is_turunkan', isTurunkanAction.value ? 'true' : 'false');
  formData.append('pengirim_position_id', String(currentSender.value || ''));
  formData.append('penerima_position_ids', JSON.stringify(tertujuIndividu.value));
  formData.append('tembusan_position_ids', JSON.stringify(tembusanIndividu.value));
  formData.append('penerima_grup', JSON.stringify(tertujuGrup.value));
  formData.append('tembusan_grup', JSON.stringify(tembusanGrup.value));
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
  formData.append('lampiran_temp_ids', JSON.stringify(existingFiles.value.map((f) => f.id).filter(Boolean)));
  // formData.append('catatan', message.value || '-');
  formData.append('catatan', message.value.trim());
  formData.append('lampiran', existingFiles.value.length > 0 ? '1' : '0');
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

  // Melakukan Pengecekan ZOD dengan ketat
  if (!validateAndToast(payload)) return;

  loadingMessage.value = "Memproses Pratinjau...";
  isLoadingData.value = true;
  try {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    const blobResponse = await previewPdf(prepareKonsepFormData());
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

const handleKirimDokumen = async () => {
  const payload = getBasePayload();

  // Memastikan kembali Validasi ZOD Lolos sebelum dikirim
  if (!validateAndToast(payload)) return;

  const isRevision = route.query.action === 'edit';

  const confirmTitle = isRevision
    ? (isRejectAction.value ? 'Kirim Perbaikan?' : isTurunkanAction.value ? 'Turunkan Konsep?' : 'Teruskan Konsep?')
    : 'Kirim Konsep?';

  const confirmDescription = isRevision
    ? (isRejectAction.value ? 'Perbaikan konsep akan dikirim.' : isTurunkanAction.value ? 'Konsep akan diturunkan ke bawahan.' : 'Konsep akan diteruskan.')
    : 'Konsep Nota Dinas akan dikirim.';

  const isConfirmed = await Alert.confirm(
    confirmTitle,
    confirmDescription,
    'Ya, Kirim', 'Batal', false
  );
  if (!isConfirmed) return;


  loadingMessage.value = isRevision ? "Mengirim Perbaikan..." : "Membuat Konsep Nota Dinas...";
  isLoadingData.value = true;

  try {
    let result;
    if (isRevision) {
      if (!editDraftId.value) throw new Error("ID Konsep tidak ditemukan untuk proses perbaikan");
      const revisiFormData = prepareRevisiFormData();
      /* log removed */
      for (const [key, value] of revisiFormData.entries()) {
        /* log removed */
      }
      result = await forwardKonsep(editDraftId.value, revisiFormData);
    } else {
      result = await createKonsep(prepareKonsepFormData());
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
    toast.add({ title: 'Gagal', description: e.response?.data?.message || e.message || 'Terjadi kesalahan saat mengirim', color: 'error' });
  } finally {
    isLoadingData.value = false;
    Alert.close();
  }
};

const handleSaveDraft = async () => {
  const payload = getBasePayload();

  // Wajib tervalidasi oleh ZOD saat save draft juga
  if (!validateAndToast(payload)) throw new Error("Validation failed");

  loadingMessage.value = "Menyimpan Draft...";
  isLoadingData.value = true;
  try {
    const fd = prepareKonsepFormData();
    if (editDraftId.value && isExistingDraft.value) {
      await updateDraft(editDraftId.value, fd);
    } else {
      await createDraft(fd);
    }
    toast.add({ title: 'Berhasil', description: 'Draft berhasil disimpan', color: 'success' });
    router.push({ path: "/korespondensi/draf", query: draftListQuery.value });
  } catch (e: any) {
    throw new Error(e.response?.data?.message || 'Gagal memperbarui draft');
  } finally {
    isLoadingData.value = false;
  }
};

const confirmSaveDraft = async () => {
  const isConfirmed = await Alert.confirm('Simpan sebagai Draft?', 'Dokumen akan disimpan ke folder draft dan bisa Anda edit kembali nanti.', 'Ya, Simpan', 'Batal', false);
  if (!isConfirmed) return;
  try {
    await handleSaveDraft();
    Alert.close();
  } catch {
    Alert.close();
  }
};

watch(editorContent, (newVal) => {
  if (tinymceEditor.value && newVal && tinymceEditor.value.getContent() !== newVal) {
    tinymceEditor.value.setContent(newVal);
  }
});

watch(selectedSender, async (newVal, oldVal) => {
  if (newVal?.value !== oldVal?.value && !isPopulating.value) {
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

watch(
  [
    () => detail.value?.aksi,
    () => detail.value?.from_position_id,
    () => atasanLangsungInfo.value?.position,
    () => refData.value?.pengirim?.position_id,
    () => refData.value?.pengirim?.position,
    () => route.query.workflow,
    () => route.query.action,
  ],
  () => {
    // Turunkan lagi: gunakan position_id dari query param
    if (isTurunkanAction.value && route.query.turunkan_position_id) {
      refPengirimPositionId.value = String(route.query.turunkan_position_id);
      return;
    }
    // Reject ATAU turunkan mode edit (perbaiki sendiri): kirim balik ke atasan (from_position_id)
    if (
      (isRejectAction.value ||
        (String(detail.value?.aksi || '').toLowerCase() === 'turunkan' && !isTurunkanAction.value)) &&
      detail.value?.from_position_id
    ) {
      refPengirimPositionId.value = String(detail.value.from_position_id);
      return;
    }
    if (isNewKonsepFromReference.value && refData.value?.pengirim) {
      refPengirimPositionId.value = String(refData.value.pengirim.position_id || refData.value.pengirim.position || '');
      return;
    }
    if (atasanLangsungInfo.value?.position) {
      refPengirimPositionId.value = String(atasanLangsungInfo.value.position);
    }
  },
  { immediate: true }
);

onMounted(async () => {
  const queryAction = route.query.action as string;
  const refId = route.query.ref_id as string;
  const refJenis = route.query.ref_jenis as string;
  const draftId = route.query.draft_id as string;

  // Blok form seawal mungkin jika halaman dibuka dengan referensi surat.
  if (refId && refJenis) {
    isReferenceLoading.value = true;
  }

  if (!user.value) await getProfile();
  if (atasanLangsungInfo.value?.position) {
    refPengirimPositionId.value = String(atasanLangsungInfo.value.position);
  }

  try {
    klasifikasiStatus.value = "loading";
    klasifikasiList.value = await getKlasifikasi();
    klasifikasiStatus.value = "success";
    const groups = await getRecipientGroups("ND");
    recipientGroups.value = groups.filter((g: any) => g.aktif);
  } catch {
    klasifikasiStatus.value = "error";
  }

  if (queryAction === 'edit' && refId) {
    loadingMessage.value = "Memuat...";
    isLoadingData.value = true;
    try {
      const result = await fetchKonsepDetail(refId);
      const dataArray = extractDataArray(result);
      const konsepFlows = dataArray.filter(
        (d: any) => String(d?.jenis || '').toUpperCase() === 'K'
      );
      const draftData =
        konsepFlows.find((d: any) => String(d?.id || '') === String(refId)) || konsepFlows[0];
      /* log removed */
      /* log removed */

      if (!draftData) {
        toast.add({ title: 'Gagal', description: 'Data konsep tidak ditemukan', color: 'error' });
        return;
      }

      detail.value = {
        aksi: draftData.detail?.aksi || '',
        from_position_id: draftData?.from_position_id || draftData?.detail?.from_position_id || draftData?.pengirim?.position_id || '',
        from_position_text: draftData?.from_position_text || draftData?.detail?.from_position_text || draftData?.pengirim?.position_text || '',
        from_nama: draftData?.from_nama || draftData?.detail?.from_nama || draftData?.pengirim?.nama || '',
        catatan_reject: draftData.detail?.catatan || '',
        data: { catatan_reject: draftData.detail?.catatan || '' },
      };

      editDraftId.value = draftData.id;
      subject.value = draftData.perihal || "";
      editorContent.value = draftData.konten || "";
      english.value = Boolean(draftData.english);

      if (draftData.klasifikasi) {
        const klCode = String(draftData.klasifikasi).trim();
        const foundKlas = klasifikasiList.value.find((k: any) =>
          k.klasifikasi === klCode || k.kode === klCode || k.id === klCode
        );
        if (foundKlas) selectedKlasifikasiId.value = foundKlas.id;
      }

      if (draftData.tanggal) {
        const parts = draftData.tanggal.split('T')[0].split('-');
        if (parts.length === 3) {
          date.value = new CalendarDate(Number(parts[0]), Number(parts[1]), Number(parts[2]));
        }
      }

      const sifatStr = String(draftData.sifat || 'biasa').toLowerCase();
      selectedSifat.value = sifatOptions.find(opt => opt.value === sifatStr) || sifatOptions[3];
      isPopulating.value = true;
      const pengirimDraft = draftData.detail?.naskah_pengirim || draftData.pengirim;
      if (pengirimDraft?.position_id || pengirimDraft?.position) {
        const senderObj = mapPersonToUI(pengirimDraft);
        await fetchSenderList(senderObj.value);
        const selectedFromList = senderItems.value.find(
          (s) => String(s.value) === String(senderObj.value),
        );
        selectedSender.value = selectedFromList || senderObj;
        await fetchRecipientsBySender(String(selectedSender.value?.value || senderObj.value));
      }

      const penerimaGrup = draftData.penerima_grup || [];
      const tembusanGrup = draftData.tembusan_grup || [];

      const idDalamGrupTertuju = new Set(
        penerimaGrup.flatMap((g: any) => (g.position_ids || []).map(String))
      );
      const idDalamGrupTembusan = new Set(
        tembusanGrup.flatMap((g: any) => (g.position_ids || []).map(String))
      );

      const rawPenerima = (draftData.detail?.naskah_penerima || [])
        .filter((p: any) => !idDalamGrupTertuju.has(String(p.position_id || p.id || '')));

      const rawTembusan = (draftData.detail?.naskah_tembusan || [])
        .filter((p: any) => !idDalamGrupTembusan.has(String(p.position_id || p.id || '')));

      selectedTertuju.value = mergeGrupDanIndividu(
        mapGrupDirect(penerimaGrup),
        mapApiToUI(rawPenerima)
      );

      selectedTembusan.value = mergeGrupDanIndividu(
        mapGrupDirect(tembusanGrup),
        mapApiToUI(rawTembusan)
      );

      isPopulating.value = false;

      existingFiles.value = (draftData.lampiran_files || []).map((f: any) => ({
        id: f.id,
        fileName: f.file_name || f.fileName || 'File',
        filePath: f.file_url || f.file_path || '',
        fileSize: f.size || f.fileSize || 0,
      }));

      // Pada mode edit, surat referensi adalah snapshot konsep yang diterima
      // dari konseptor sebelumnya. Jangan memakai node non-K (surat/disposisi
      // asal) dan jangan fallback ke lampiran karena lampiran bukan dokumen
      // konsep yang sedang direvisi.
      const referenceKonsepFlow =
        (draftData.final_pdf_url ? draftData : null) ||
        konsepFlows.find((flow: any) => Boolean(flow?.final_pdf_url)) ||
        draftData;

      if (referenceKonsepFlow) {
        refData.value = {
          id: referenceKonsepFlow.id,
          nomor: referenceKonsepFlow.nomor || '-',
          tanggal: referenceKonsepFlow.tanggal || referenceKonsepFlow.created_at,
          final_pdf_url: referenceKonsepFlow.final_pdf_url || null,
          lampiran_files: [],
          jenis: referenceKonsepFlow.jenis,
          pengirim: referenceKonsepFlow.pengirim || null,
        };
        refPengirimPositionId.value = isTurunkanAction.value && route.query.turunkan_position_id
          ? String(route.query.turunkan_position_id)
          : (isRejectAction.value && detail.value?.from_position_id
            ? String(detail.value.from_position_id)
            : (isNewKonsepFromReference.value
              ? String(referenceKonsepFlow.pengirim?.position_id || referenceKonsepFlow.pengirim?.position || '')
              : (atasanLangsungInfo.value?.position
                ? String(atasanLangsungInfo.value.position)
                : (referenceKonsepFlow.pengirim?.position_id || ''))));
      }

    } catch (e) {
      console.error("Error fetching edit data:", e);
      toast.add({ title: 'Error', description: 'Gagal memuat data edit', color: 'error' });
    } finally {
      isLoadingData.value = false;
    }
  }

  else if (refId && refJenis) {
    loadingMessage.value = "Memuat data referensi...";
    isLoadingData.value = true;
    isReferenceLoading.value = true;
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
          final_pdf_url: rawFlow.final_pdf_url,
          lampiran_files: rawFlow.lampiran_files || [],
          jenis: rawFlow.jenis,
          pengirim: rawFlow.pengirim || null,
        };
        refPengirimPositionId.value = isTurunkanAction.value && route.query.turunkan_position_id
          ? String(route.query.turunkan_position_id)
          : (isNewKonsepFromReference.value
            ? String(rawFlow.pengirim?.position_id || rawFlow.pengirim?.position || '')
            : (atasanLangsungInfo.value?.position
              ? String(atasanLangsungInfo.value.position)
              : (rawFlow.pengirim?.position_id || '')));
      }
    } catch (e) { console.error(e); }
    finally {
      isReferenceLoading.value = false;
    }

    if (user.value?.position) await fetchSenderList(user.value.position);
    if (selectedSender.value?.value) await fetchRecipientsBySender(selectedSender.value.value);
    isLoadingData.value = false;
  }

  else if (draftId) {
    loadingMessage.value = "Memuat...";
    isLoadingData.value = true;
    try {
      editDraftId.value = draftId;
      const resDraft = await getKonsepDraftDetail(draftId);
      if (resDraft.success && resDraft.data) {
        isExistingDraft.value = true;
        const d = resDraft.data;
        subject.value = d.perihal || "";
        editorContent.value = d.konten || "";
        message.value = d.catatan || "";
        english.value = Boolean(d.english);
        if (d.to_position_id) {
          refPengirimPositionId.value = String(d.to_position_id);
          restoredDraftTarget.value = {
            position: String(d.to_position_id),
            positionText: d.to_position_text || '',
            nama: d.to_nama || '',
          };
        }

        if (d.disposisi_referensi) {
          refData.value = {
            id: d.disposisi_referensi.id,
            nomor: d.disposisi_referensi.nomor || '-',
            tanggal: d.disposisi_referensi.tanggal,
            final_pdf_url: d.disposisi_referensi.final_pdf_url || null,
            lampiran_files: [],
            jenis: 'DI',
          };
          refPengirimPositionId.value = atasanLangsungInfo.value?.position
            ? String(atasanLangsungInfo.value.position)
            : (d.disposisi_referensi.pengirim?.position_id || '');
        }

        if (d.klasifikasi) {
          const klCode = String(d.klasifikasi).trim();
          const foundKlas = klasifikasiList.value.find((k: any) =>
            k.klasifikasi === klCode || k.kode === klCode || k.id === klCode
          );
          if (foundKlas) selectedKlasifikasiId.value = foundKlas.id;
        }

        isPopulating.value = true;

        if (user.value?.position) await fetchSenderList(user.value.position);

        // Restore pengirim
        if (d.pengirim?.position_id || d.from_position_id || d.pengirim_position_id) {
          const senderId = String(d.pengirim?.position_id || d.pengirim_position_id || d.from_position_id);
          const found = senderItems.value.find(s => s.value === senderId);
          if (found) selectedSender.value = found;
        }

        // Wajib load recipients dulu sebelum populate grup/individu
        if (selectedSender.value?.value) {
          await fetchRecipientsBySender(selectedSender.value.value);
        }

        // ── PERBAIKAN UTAMA: gunakan mapGroupsToUI + filter individu seperti tulis-nd ──
        const penerimaGrupRaw = d.penerima_grup || [];
        const tembusanGrupRaw = d.tembusan_grup || [];

        // Kumpulkan position_ids yang sudah diwakili grup
        const idDalamGrupTertuju = new Set<string>(
          penerimaGrupRaw.flatMap((g: any) => (g.position_ids || []).map(String))
        );
        const idDalamGrupTembusan = new Set<string>(
          tembusanGrupRaw.flatMap((g: any) => (g.position_ids || []).map(String))
        );

        // Filter individu yang TIDAK diwakili grup
        const rawPenerima = (d.penerima || []).filter(
          (p: any) => !idDalamGrupTertuju.has(String(p.position_id || p.position || ''))
        );
        const rawTembusan = (d.tembusan || []).filter(
          (p: any) => !idDalamGrupTembusan.has(String(p.position_id || p.position || ''))
        );

        // Helper map individu — cari di items dulu, fallback ke raw data
        const mapIndividu = (list: any[]): RecipientItem[] => list.map(item => {
          const posId = String(item.position_id || item.position || item.value || item.id || '');
          const master = items.value.find((m: any) => m.value === posId);
          return master || {
            label: `${item.nama || item.persnum_person_text || ''} - ${item.position_text || item.positionText || ''}`,
            labelJob: item.position_text || item.positionText || '',
            value: posId,
            isGroup: false,
            raw: item,
          };
        });

        selectedTertuju.value = mergeGrupDanIndividu(
          mapGroupsToUI(penerimaGrupRaw),   // ← nama grup (Para EVP, dll)
          mapIndividu(rawPenerima)           // ← individu di luar grup
        );
        selectedTembusan.value = mergeGrupDanIndividu(
          mapGroupsToUI(tembusanGrupRaw),   // ← nama grup (Para Direksi, dll)
          mapIndividu(rawTembusan)           // ← individu di luar grup
        );

        isPopulating.value = false;

        if (Array.isArray(d.lampiran_files)) {
          existingFiles.value = d.lampiran_files.map((f: any) => ({
            id: f.id,
            fileName: f.fileName || f.file_name,
            filePath: f.fileUrl || f.file_path,
            fileSize: f.fileSize || 0,
          }));
        }

        selectedSifat.value = sifatOptions.find(
          opt => opt.value === String(d.sifat || 'biasa').toLowerCase()
        ) || sifatOptions[3];

        const tglStr = d.tanggal || d.tgl;
        if (tglStr) {
          const p = tglStr.split('T')[0].split('-');
          if (p.length === 3) date.value = new CalendarDate(Number(p[0]), Number(p[1]), Number(p[2]));
        }
      }
    } catch (e) { console.error(e); }
    isLoadingData.value = false;
  }

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
