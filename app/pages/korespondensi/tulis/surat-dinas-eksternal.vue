<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== $t('loading')" :message="loadingMessage" />

    <PageHeader :title="$t('sde_judul_halaman')" :items="breadcrumbs" />

    <UCard variant="soft" :ui="{
      root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm',
    }">

      <div v-if="isLoadingData && loadingMessage === $t('loading')" class="animate-pulse px-2 space-y-3">
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

        <TulisInputTanggal v-model="date" :label="$t('f_tanggal_surat')" />

        <TulisInputSifat v-model="selectedSifat" />

        <TulisInputPenerima v-model="selectedTertuju" :label="$t('tertuju')" :placeholder="$t('sde_pilih_tujuan_eksternal')"
          :items="externalItems" />

        <TulisInputPenerima v-model="selectedTembusan" :label="$t('f_tembusan')" :placeholder="$t('sde_pilih_tembusan')"
          :items="internalItems" />

        <!-- Garis Kewenangan (a.n.) — signer bertanda tangan atas nama pejabat pemberi kuasa -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <label class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0 flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="useGarisKewenangan" class="w-4 h-4 accent-primary-500" />
              Garis Kewenangan (a.n.)
            </label>
            <div class="flex items-center flex-1 w-full gap-2">
              <template v-if="useGarisKewenangan">
                <template v-if="isDirut">
                  <span class="text-sm text-gray-700 dark:text-gray-300">a.n Direksi</span>
                </template>
                <template v-else>
                  <!-- Auto-fill atasan (level 1 di atas, di direktorat sama). Tidak ada dropdown. -->
                  <span v-if="isLoadingAtasan" class="text-sm text-gray-400 italic">Memuat atasan...</span>
                  <span v-else-if="atasNamaLabel" class="text-sm text-gray-700 dark:text-gray-300">a.n {{ atasNamaLabel }}</span>
                  <span v-else class="text-sm text-gray-400 italic">Tidak ada atasan di direktorat ini</span>
                </template>
              </template>
              <span v-else class="text-xs text-gray-400">Centang untuk menandatangani atas nama pejabat pemberi kuasa (otomatis ditembuskan)</span>
            </div>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">{{ $t('perihal') }}</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="subject" :maxlength="maxPerihal"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                :placeholder="$t('sde_ketik_perihal')" />
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
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">{{ $t('f_lampiran') }}</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="lampiranText" readonly tabindex="-1"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 cursor-default opacity-75"
                :placeholder="$t('sde_lampiran_otomatis')" />
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
                          <td class="w-[80px] align-top">{{ $t('f_nomor') }}</td>
                          <td class="w-[10px] align-top">:</td>
                          <td class="align-top">................................................</td>
                        </tr>
                        <tr>
                          <td class="align-top">{{ $t('f_sifat') }}</td>
                          <td class="align-top">:</td>
                          <td class="align-top capitalize">{{ selectedSifat?.label || $t('sde_sifat_biasa') }}</td>
                        </tr>
                        <tr>
                          <td class="align-top">{{ $t('f_lampiran') }}</td>
                          <td class="align-top">:</td>
                          <td class="align-top">{{ lampiranText || '-' }}</td>
                        </tr>
                        <tr>
                          <td class="align-top">{{ $t('perihal') }}</td>
                          <td class="align-top">:</td>
                          <td class="align-top font-bold text-justify">
                            {{ subject || "................................................" }}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div class="mt-5">{{ $t('f_kepada_yth') }}</div>
                    <div class="font-bold mb-1">
                      <div v-if="selectedTertuju.length > 5">{{ $t('sde_periksa_alamat_terlampir') }}</div>
                      <div v-else-if="selectedTertuju.length > 0">
                        <div v-for="t in selectedTertuju" :key="t.value">{{ t.label }}</div>
                      </div>
                      <div v-else>
                        <div>................................................</div>
                      </div>
                    </div>
                    <div class="mb-1">{{ $t('sde_di_tempat') }}</div>
                  </div>
                </div>

                <div class="mb-3">
                  <AiDraftTriggerButton v-if="hasPermission('utama.tulis.surat-dinas-eksternal', 'generate-ai')" @click="isAiDraftOpen = true" />
                </div>

                <div class="min-h-[300px] relative group">
                  <TinymceEditorAsync api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" />
                  <div v-if="!editorContent"
                    class="absolute top-0 left-10 text-gray-400 pointer-events-none italic z-0 mt-2">
                    {{ $t('sde_ketik_isi_surat') }}
                  </div>
                </div>

                <div class="flex mt-12 text-black px-10">
                  <div class="text-center min-w-[250px]">
                    <div class="mb-24 text-[14px]">
                      <!-- Garis Kewenangan (a.n.) — live preview sebelum generate PDF -->
                      <div v-if="useGarisKewenangan && atasNamaLabel" class="font-bold mb-1">a.n {{ atasNamaLabel }}</div>
                      <div class="font-bold">{{ user?.positionText || 'Nama Jabatan' }}</div>
                    </div>
                    <div class="font-bold text-[14px] underline">{{ toTitleCase(user?.nama) || 'Nama Lengkap' }}</div>
                  </div>
                </div>

                <div class="mt-8 text-[12px] text-black px-10">
                  <div class="font-bold underline mb-1">{{ $t('f_tembusan') }} :</div>
                  <div v-if="selectedTembusan.length > 5" class="ml-4 pl-2">{{ $t('sde_periksa_alamat_terlampir') }}</div>
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
                            <td class="align-top pr-2">{{ $t('sde_lampiran_surat') }}</td>
                          </tr>
                          <tr>
                            <td class="align-top pr-2">{{ $t('sde_nomor_surat') }} :</td>
                            <td>.....................................</td>
                          </tr>
                          <tr>
                            <td class="align-top pr-2">{{ $t('f_tanggal_surat') }} :</td>
                            <td>{{ formattedDate }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div v-if="selectedTertuju.length > 5" class="mb-8">
                    <div class="font-bold text-[14px] mb-2 uppercase">{{ $t('f_kepada_yth').toUpperCase() }} :</div>
                    <ol class="list-decimal ml-6 text-[14px] space-y-1">
                      <li v-for="item in selectedTertuju" :key="item.value">{{ item.label }}</li>
                    </ol>
                  </div>
                  <div v-if="selectedTembusan.length > 5">
                    <div class="font-bold text-[14px] mb-2 uppercase">{{ $t('f_tembusan').toUpperCase() }} :</div>
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
              {{ $t('sde_aktifkan_format_english') }}
            </label>
          </div>

          <TulisInputLampiran v-model:existingFiles="existingFiles" />
        </div>

        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-800">
          <UButton v-if="hasPermission('utama.tulis.surat-dinas-eksternal', 'create')" :label="$t('f_pratinjau')" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold"
            @click="handlePreview" />
        </div>
      </div>
    </UCard>

    <TulisPreviewSlideover v-model:open="isOpenPreview" :pdf-url="pdfUrl" :alert-is-open="alertState.isOpen"
      @save-draft="handleConfirmSaveDraft" @send="handleConfirmKirim" />

    <TulisDigsigPassphraseModal v-model:open="isPassphraseModalOpen" :signer-info="signerInfo"
      :is-loading="isLoadingData" :hide-bsre="bsreDisabled" :hide-qr="qrDisabled" :hide-basah="basahDisabled"
      ref="signMethodModalRef" @submit="handleSignMethodSubmit" />

    <AiDraftPanel v-model:open="isAiDraftOpen" naskah-type="SDE" :editor="tinymceEditor" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import TinymceEditorAsync from '~/components/TinymceEditorAsync.vue';
import type { Editor as TinyMCEEditor } from 'tinymce';

// --- COMPONENTS ---
import TulisInputKlasifikasi from "@/components/Tulis/InputKlasifikasi.vue";
import TulisInputLampiran from "@/components/Tulis/InputLampiranAsync.vue";
import TulisInputSifat from "@/components/Tulis/InputSifat.vue";
import TulisInputPenerima from "@/components/Tulis/InputPenerima.vue";
import TulisInputTanggal from "@/components/Tulis/InputTanggal.vue";
import TemplateManager from '@/components/Tulis/TemplateManager.vue';
import TulisDigsigPassphraseModal from "@/components/Tulis/DigsigPassphraseModalAsync.vue";

// --- TYPES & COMPOSABLES ---
import { Alert } from "@/composables/useAlert";
import { useSde } from "~/composables/useSde";
import { validateSDEPayload } from "~/types/sde";

definePageMeta({ middleware: ['auth', 'tulis-access'] })

const route = useRoute();
const router = useRouter();

const { user, getProfile, hasPermission } = useAuth();
const { canAccessPage } = useFeatureAccess();
const { getKlasifikasi } = useKlasifikasi();
const { getConfigDigsig } = useDigsig();
const { saveDraft, updateDraft, sendSDE, getSDEDetail, generatePdf, getExternalRecipients, getRecipientInfo } = useSde();
const { api: apiInstance } = useApi();
const { t } = useI18n();

// POST /SDE/send-draft/{id} — dipakai saat edit mode (composable tidak punya sendDraft)
const sendDraftSDE = async (formData: FormData, id: string) => {
  return await apiInstance.put(`/SDE/send-draft/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

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

const isAiDraftOpen = ref(false);

const alertState = useAlertState();

// --- SDE SPECIFIC STATE ---
const lampiranText = ref("");
const isEnglish = ref(false);

const externalItems = ref<any[]>([]);
const internalItems = ref<any[]>([]);

const isPassphraseModalOpen = ref(false);
const selectedSendType = ref('digsig');

const bsreDisabled = ref(false);
const qrDisabled = ref(false);
const basahDisabled = ref(false);
const signMethodModalRef = ref<any>(null);

// --- GARIS KEWENANGAN (a.n.) ---
// Checkbox untuk aktifkan "atas nama". Kalau signer = Direktur Utama → fixed
// "a.n Direksi" (no dropdown). Else → dropdown atasan di direktorat sama.
const useGarisKewenangan = ref(false);
const atasanOptions = ref<any[]>([]);
const selectedAtasNamaId = ref<number | null>(null);
const isLoadingAtasan = ref(false);

const isDirut = computed(() =>
  /direktur\s+utama/i.test(user.value?.positionText || ''),
);

// Label pemberi kuasa untuk template "a.n <label>".
const atasNamaLabel = computed(() => {
  if (!useGarisKewenangan.value) return '';
  if (isDirut.value) return 'Direksi';
  const sel = atasanOptions.value.find(
    (x) => Number(x.position) === Number(selectedAtasNamaId.value),
  );
  return sel?.position_text || '';
});

const fetchAtasan = async () => {
  if (isDirut.value || !user.value?.position) return;
  isLoadingAtasan.value = true;
  try {
    const { apiGet } = useApi();
    const res = await apiGet<any>(`/org-data/atasnama/${user.value.position}`);
    atasanOptions.value = res?.data || [];
    // Auto-fill atasan pertama (paling senior di direktorat — e.g. Direktur
    // untuk signer EVP). Tidak ada dropdown, user tidak perlu pilih.
    selectedAtasNamaId.value = atasanOptions.value[0]?.position ?? null;
  } catch (e) {
    console.error('Gagal fetch atasan:', e);
    atasanOptions.value = [];
    selectedAtasNamaId.value = null;
  } finally {
    isLoadingAtasan.value = false;
  }
};

// Auto-tembusan: ketika atas nama dipilih (non-Dirut), add atasan ke tembusan.
// Shape sama dengan mapInternalItems (label/labelJob/raw) supaya tampil benar
// di template tembusan list. BE tetap force-CC jadi kalau FE kehapus, BE tambah lagi.
watch(selectedAtasNamaId, (newId) => {
  if (!newId) return;
  const r = atasanOptions.value.find(
    (x) => Number(x.position) === Number(newId),
  );
  if (!r) return;
  if (selectedTembusan.value.some((t: any) => Number(t.value) === Number(newId))) return;
  selectedTembusan.value.push({
    label: `${r.persnum_person_text || r.persnum_person || r.persnum} - (${r.position_abbreviation || r.abbreviation || '-'}) ${r.position_text}`,
    labelJob: r.position_text,
    value: String(r.position),
    raw: r,
  });
});

// Ketika checkbox on → fetch atasan (non-Dirut) atau re-select yang sudah ter-fetch.
// Kalau Dirut, skip (fixed label "Direksi"). Off → null + hapus atasan dari tembusan.
watch(useGarisKewenangan, (on) => {
  if (on && !isDirut.value) {
    if (atasanOptions.value.length > 0) {
      // Sudah pernah fetch → re-select atasan pertama (fix bug: re-check tidak muncul).
      selectedAtasNamaId.value = atasanOptions.value[0]?.position ?? null;
    } else {
      fetchAtasan(); // fetchAtasan auto-select atasan pertama.
    }
  }
  if (!on) {
    // Uncheck → hapus atasan auto-added dari tembusan + reset pilihan.
    const prevId = selectedAtasNamaId.value;
    if (prevId) {
      selectedTembusan.value = selectedTembusan.value.filter(
        (t: any) => Number(t.value) !== Number(prevId),
      );
    }
    selectedAtasNamaId.value = null;
  }
});

const breadcrumbs = [
  { label: t('beranda'), to: "/beranda" },
  { label: t('sde_judul_halaman'), to: "#" },
];

const signerInfo = computed(() => ({
  name: toTitleCase(user.value?.nama) || 'Nama Lengkap',
  role: user.value?.positionText || 'Jabatan',
  label: t('sign_ditandatangani_oleh')
}));

// --- METHODS: PAYLOAD & VALIDATION ---
const getPayload = () => {
  return {
    id_naskah: editDraftId.value || null,
    pengirim: user.value?.position || "",
    penerima: selectedTertuju.value.map(item => item.value),
    english: isEnglish.value || false,
    tembusan: selectedTembusan.value.map(i => i.value),
    klasifikasi: selectedKlasifikasi.value?.klasifikasi || "",
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || "",
    sifat: selectedSifat.value?.value || "biasa",
    perihal: subject.value,
    lampiran: lampiranText.value,
    konten: editorContent.value,
    htmlContent: editorContent.value,
    nama_tempat: user.value?.areaText || "Tangerang",
    nama_jabatan: user.value?.positionText || "",
    nama_lengkap: user.value?.nama || "",
    // Garis Kewenangan (a.n.)
    atas_nama: useGarisKewenangan.value ? atasNamaLabel.value : "",
    atas_nama_position_id: (useGarisKewenangan.value && !isDirut.value && selectedAtasNamaId.value) || null,
    tgl: tglDb.value,
    tanggal: tglDisplay.value,
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
  if (!payload.penerima || payload.penerima.length === 0) {
    toastError(t('sde_validasi_gagal'), t('sde_min_penerima_eksternal'));
    return false;
  }

  const check = validateSDEPayload(payload);
  if (!check.isValid) {
    const keys = Object.keys(check.errors).filter((k) => k !== 'penerima');
    if (keys.length > 0) {
      toastError(t('sde_validasi_gagal'), check.errors[keys[0]!]);
      return false;
    }
  }

  return true;
};

// --- ACTIONS ---
const handlePreview = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) return;

  isLoadingData.value = true;
  loadingMessage.value = t('sde_memproses_pratinjau');
  try {
    const fd = createFormData(payload, false);
    const blob = await generatePdf(fd);
    setPdfBlob(blob);
    isOpenPreview.value = true;
  } catch (err) {
    toastError(t('sde_gagal_membuat_preview'));
  } finally {
    isLoadingData.value = false;
  }
};

const handleSaveDraftAction = async () => {
  Alert.close();

  const payload = getPayload();
  if (!validateAndToast(payload)) return;

  loadingMessage.value = t('sde_menyimpan_draft');
  isLoadingData.value = true;

  try {
    const fd = createFormData(payload, false);

    // DEBUG: pastikan penerima & tembusan terkirim ke backend
    console.log('[SDE Save Draft] penerima:', payload.penerima);
    console.log('[SDE Save Draft] tembusan:', payload.tembusan);
    console.log('[SDE Save Draft] FormData penerima:', fd.get('penerima'));
    console.log('[SDE Save Draft] FormData tembusan:', fd.get('tembusan'));

    let res = editDraftId.value ? await updateDraft(fd, editDraftId.value) : await saveDraft(fd);

    if (res?.success) {
      toastSuccess(t('f_berhasil'), t('f_draft_tersimpan'));
      if (res.data?.id) editDraftId.value = res.data.id;
      redirectDraf();
    } else {
      throw new Error((res as any)?.data?.message || t('sde_gagal_menyimpan_draft'));
    }
  } catch (e: any) {
    toastError(t('f_gagal'), e.response?.data?.message || t('sde_gagal_memperbarui_draft'));
  } finally {
    isLoadingData.value = false;
  }
};

const handleConfirmSaveDraft = () => confirmSaveDraft(handleSaveDraftAction);

const handleKirimDokumen = async (passphrase = '') => {
  if (selectedSendType.value === 'digsig' && !passphrase.trim()) {
    signMethodModalRef.value?.setPassphraseError(t('sde_passphrase_harus_diisi'));
    return;
  }

  Alert.close();

  const payload = getPayload();
  loadingMessage.value = t('sde_mengirim');
  isLoadingData.value = true;

  try {
    const fdPreview = createFormData(payload, false);
    const blobResponse = await generatePdf(fdPreview);
    setPdfBlob(blobResponse);

    const fdFinal = createFormData(payload, true);
    fdFinal.append('sign_option', selectedSendType.value);

    if (selectedSendType.value === 'digsig') {
      fdFinal.append('passphrase', passphrase);
      if (!user.value?.nik) throw new Error(t('sde_nik_tidak_ditemukan'));
      fdFinal.append('nik', user.value.nik);
    }

    const res = editDraftId.value
      ? await sendDraftSDE(fdFinal, editDraftId.value)
      : await sendSDE(fdFinal);

    const isSuccess = (res as any)?.data?.success || (res as any)?.success;
    if (isSuccess) {
      revokePdfUrl();
      toastSuccess(t('f_berhasil'), t('sde_terkirim'));
      Alert.close();
      redirectTerkirim();
    } else {
      throw new Error((res as any)?.data?.message || (res as any)?.message || t('sde_pengiriman_gagal'));
    }
  } catch (e: any) {
    Alert.close();
    const errMsg = e.response?.data?.message || e.message || t('sde_gagal_mengirim_dokumen');

    if (errMsg.toLowerCase().includes('passphrase') || errMsg.toLowerCase().includes('salah')) {
      bsreDisabled.value = false;
      await nextTick();
      isPassphraseModalOpen.value = true;
      await nextTick();
      signMethodModalRef.value?.setPassphraseError(errMsg);
    } else {
      toastError(t('sde_gagal_mengirim'), errMsg);
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
    const res = await getConfigDigsig('SDE');
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

// --- LIFECYCLE ---
onMounted(async () => {
  if (!canAccessPage()) return;
  isLoadingData.value = true;
  loadingMessage.value = t('loading');
  if (!user.value) await getProfile();

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
      loadingMessage.value = t('sde_memuat_draft');

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

        // ── Tertuju (eksternal) ──────────────────────────────────────────
        if (d.penerima && Array.isArray(d.penerima)) {
          selectedTertuju.value = d.penerima.map((item: any) => {
            // Cari item yang matching di externalItems (coerce ke string agar tidak type-mismatch)
            const candidateIds = [
              String(item.id ?? ''),
              String(item.persuratan_eksternal_id ?? ''),
              String(item.value ?? ''),
            ].filter(Boolean);

            const found = externalItems.value.find(ext =>
              candidateIds.includes(String(ext.value))
            );
            if (found) return found;

            // Fallback: bentuk object dengan format yang sama seperti externalItems
            return {
              label: item.nama || item.name || String(item.id ?? ''),
              value: String(item.id ?? item.value ?? ''),
              raw: item,
            };
          });
        }

        // ── Tembusan (internal) ──────────────────────────────────────────
        if (d.tembusan && Array.isArray(d.tembusan)) {
          const tembusanIds = d.tembusan.map((t: any) => {
            if (typeof t !== 'object') return String(t);
            // Coba semua kemungkinan field id
            return String(t.position ?? t.position_id ?? t.id ?? t.value ?? '');
          }).filter(Boolean);

          selectedTembusan.value = internalItems.value.filter(item =>
            tembusanIds.includes(String(item.value))
          );
        }

        existingFiles.value = mapLampiranFiles(d.lampiran_files || []);
        setSifatFromString(d.sifat || 'biasa');
        if (d.tgl) setDateFromString(d.tgl);

        // Garis Kewenangan (a.n.): restore dari draft SDE.
        if (d.atas_nama) {
          useGarisKewenangan.value = true;
          if (d.atas_nama_position_id) {
            selectedAtasNamaId.value = Number(d.atas_nama_position_id) || null;
          }
          // Untuk non-Dirut tanpa position_id (legacy), pakai manual label.
          if (!isDirut.value && !selectedAtasNamaId.value) {
            // fetch atasan + cari yang match label
            await fetchAtasan();
            const match = atasanOptions.value.find((x: any) =>
              String(x.position_text || '').toLowerCase() === String(d.atas_nama).toLowerCase(),
            );
            if (match) selectedAtasNamaId.value = match.position;
          }
        }
      }
    }

  } catch (e) {
  } finally {
    isLoadingData.value = false;
  }
});

watch(existingFiles, (newFiles) => {
  const jumlah = newFiles ? newFiles.length : 0;
  lampiranText.value = jumlah > 0 ? `${jumlah} ${t('f_lampiran')}` : `0 ${t('f_lampiran')}`;
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
