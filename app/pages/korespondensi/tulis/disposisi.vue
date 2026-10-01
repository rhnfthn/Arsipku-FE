<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== $t('dp_memuat')" :message="loadingMessage" />
    <PageHeader :title="$t('dp_tulis_disposisi')" :items="breadcrumbs" />

    <UCard variant="soft"
      :ui="{ root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm' }">

      <div v-if="isLoadingData && loadingMessage === $t('dp_memuat')" class="animate-pulse px-2 space-y-3">
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
        <TulisInputTanggal v-model="date" :label="$t('dp_tanggal_disposisi')" />
        <TulisInputSifat v-model="selectedSifat" />

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">{{ $t('dp_ref_nomor_surat') }}</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="refNumber"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                :placeholder="$t('dp_ketik_ref_nomor_surat')" />
            </div>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">{{ $t('dp_ref_perihal') }}</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="refPerihal"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                :placeholder="$t('dp_ketik_ref_perihal')" />
            </div>
          </div>
        </div>

        <TulisInputPenerima v-model="selectedTertuju" :label="$t('tertuju')" :placeholder="$t('dp_pilih_tertuju')"
          :items="recipientList" />

        <div class="flex flex-col py-3 gap-3 mb-6">
          <span class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{{ $t('dp_instruksi_disposisi') }}</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="opt in checklistOptions" :key="opt.value" class="flex gap-2 items-start group">
              <input type="checkbox" :id="opt.value" :value="opt.value" v-model="selectedChecklist"
                class="mt-0.5 w-4 h-4 shrink-0 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" />
              <label :for="opt.value"
                class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none leading-tight break-words">
                {{ $t(opt.label) }}
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
                  <div class="w-2/3 p-4 flex items-center gap-4">
                    <img src="/logoAirnav.png" alt="Logo" class="h-12 w-auto object-contain" />
                    <span class="font-bold text-xl tracking-wide">AirNav Indonesia</span>
                  </div>
                  <div class="w-1/3 p-2 flex flex-col justify-center text-center font-bold text-sm">
                    <div class="uppercase">DISPOSISI</div>
                  </div>
                </div>

                <div class="flex border-b-2 border-black">
                  <div class="w-[20%] border-r-2 border-black p-2 flex flex-col justify-between">
                    <div class="font-bold underline mb-4 uppercase">{{ $t('f_agenda') }}</div>
                    <div class="text-xs font-bold space-y-2">
                      <div>{{ $t('dp_no') }}: ........</div>
                      <div>{{ $t('dp_tgl') }}: ........</div>
                    </div>
                  </div>

                  <div class="w-[50%] border-r-2 border-black p-2 text-xs">
                    <table class="w-full">
                      <tbody>
                        <tr>
                          <td class="w-16 py-1">{{ $t('dp_surat_dari') }}</td>
                          <td class="py-1">: {{ user?.positionText || "....................." }}</td>
                        </tr>
                        <tr>
                          <td class="py-1">{{ $t('tanggal') }}</td>
                          <td class="py-1">: {{ formattedDate }}</td>
                        </tr>
                        <tr>
                          <td class="py-1">{{ $t('f_nomor') }}</td>
                          <td class="py-1">: {{ refNumber || "-" }}</td>
                        </tr>
                        <tr>
                          <td class="py-1 align-top">{{ $t('perihal') }}</td>
                          <td class="py-1 align-top">: {{ refPerihal || "-" }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div class="w-[30%] p-2 text-xs">
                    <div class="font-bold underline mb-2 uppercase">{{ $t('klasifikasi') }}</div>
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
                  <div class="font-bold underline mb-1">{{ $t('f_kepada_yth') }} :</div>
                  <div v-if="previewDispositionRecipients.length > 0" class="pl-4">
                    <ol :class="previewDispositionRecipients.length > 1 ? 'list-decimal ml-4' : 'list-none'">
                      <li v-for="(recipient, index) in previewDispositionRecipients" :key="`${index}-${recipient}`">
                        {{ recipient }}
                      </li>
                    </ol>
                  </div>
                  <div v-else class="pl-4 italic text-gray-500">
                    {{ $t('dp_pilih_penerima_atas') }}
                  </div>
                </div>

                <div class="border-b-2 border-black p-2 text-xs flex">
                  <div class="w-20 font-bold underline shrink-0 uppercase">{{ $t('disposisi') }} :</div>
                  <div class="flex-1 grid grid-cols-3 gap-2">
                    <div v-for="opt in checklistOptions" :key="opt.value" class="flex items-start gap-1">
                      <div
                        class="w-3 h-3 border border-black flex items-center justify-center text-[8px] mt-0.5 shrink-0">
                        {{ selectedChecklist.includes(opt.value) ? "✓" : "" }}
                      </div>
                      <span class="leading-tight">{{ $t(opt.label) }}</span>
                    </div>
                  </div>
                </div>

                <div class="p-0 min-h-[300px] relative group">
                  <div class="p-2 font-bold text-xs underline bg-gray-100 border-b border-gray-200 uppercase">{{ $t('k_catatan') }} :</div>
                  <div class="relative" v-if="showEditor" ref="editorContainerRef">
                    <div class="mb-3">
                      <AiDraftTriggerButton @click="isAiDraftOpen = true" />
                    </div>
                    <TinymceEditorAsync api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" />
                  </div>
                  <div class="absolute bottom-4 right-4 z-10 pointer-events-none">
                    <div
                      class="border-2 border-black w-24 h-16 flex items-center justify-center font-bold text-xs bg-white/50">
                      {{ $t('dp_paraf') }}
                    </div>
                  </div>
                </div>
                <div class="border-t-2 border-black p-1 text-[10px] font-bold text-left bg-gray-50">
                  {{ $t('dp_footer_disposisi') }}
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
              {{ $t('dp_tandai_prioritas') }}
            </label>
          </div>
        </div>

        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-800">
          <UButton v-if="hasPermission('utama.tulis.disposisi', 'create')" :label="$t('f_pratinjau')" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold"
            @click="handlePreview" />
        </div>
      </div>
    </UCard>

    <TulisPreviewSlideover v-model:open="isOpenPreview" :pdf-url="pdfUrl" :alert-is-open="alertState.isOpen"
      @save-draft="handleConfirmSaveDraft" @send="handleConfirmKirim" />

    <TulisDigsigPassphraseModal v-model:open="isSignMethodModalOpen" :signer-info="signerInfo"
      :is-loading="isLoadingData" :hide-bsre="bsreDisabled" :hide-qr="qrDisabled" :hide-basah="basahDisabled"
      :portal-mode="tteMode === 'portal'"
      ref="signMethodModalRef" @submit="handleSignMethodSubmit" />

    <AiDraftPanel v-model:open="isAiDraftOpen" naskah-type="disposisi" :editor="tinymceEditor" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";
import { useRoute } from 'vue-router';
import TinymceEditorAsync from '~/components/TinymceEditorAsync.vue';

import { validateDisposisiPayload, type DisposisiPayload } from "~/types/disposisi";
import { Alert } from "@/composables/useAlert";
import TulisInputLampiran from "@/components/Tulis/InputLampiranAsync.vue";
import TulisDigsigPassphraseModal from "@/components/Tulis/DigsigPassphraseModalAsync.vue";
definePageMeta({ middleware: ['auth', 'tulis-access'] })

const route = useRoute();
const alertState = useAlertState();
const { t } = useI18n();

const { user, getProfile, hasPermission } = useAuth();
const { canAccessPage } = useFeatureAccess();
const { getRecipients, sendDisposisi, saveDraft: saveDI, sendDraft, updateDraft, getDraftDetail, generatePdf } = useDisposisi();
const { renderedPositionLabel, renderedActorName } = useDelegationMode();

const { getConfigDigsig } = useDigsig();
const { getTteMode } = useTtePortal();

// ── Shared composable ────────────────────────────────────────────────────────
const {
  isLoadingData, loadingMessage, isOpenPreview,
  editDraftId, editorContent, tinymceEditor,
  date, selectedSifat, existingFiles, selectedTertuju,
  pdfBlob, pdfUrl, sifatOptions, tinyMceInit,
  formattedDate, tglDb, tglDisplay,
  buildFormData, mapApiToUI, mapLampiranFiles, setDateFromString, setSifatFromString,
  setPdfBlob, revokePdfUrl, confirmSaveDraft, confirmKirim,
  toastError, toastSuccess, redirectTerkirim, redirectDraf
} = useTulis();

const isAiDraftOpen = ref(false);

// ── Disposisi-specific state ──────────────────────────────────────────────────
const editorContainerRef = ref<HTMLElement | null>(null);
const selectedSendType = ref('qr_only');
const tteMode = ref<'bsre_direct' | 'portal'>('bsre_direct');

const isPriority = ref(false);
const refNumber = ref("-");
const refPerihal = ref("-");
const dispositionUnit = ref("");
const recipientList = ref<any[]>([]);
const selectedChecklist = ref<string[]>([]);

const isSignMethodModalOpen = ref(false);
const bsreDisabled = ref(false);
const signMethodModalRef = ref<any>(null);
const qrDisabled = ref(false);
const basahDisabled = ref(false);

const breadcrumbs = [
  { label: t('beranda'), to: "/beranda" },
  { label: t('dp_tulis_disposisi'), to: "#" },
];

const checklistOptions = [
  { label: 'dp_untuk_diketahui', value: 'Untuk Diketahui' },
  { label: 'dp_proses_lanjut', value: 'Proses Lanjut' },
  { label: 'dp_koordinasikan', value: 'Koordinasikan' },
  { label: 'dp_cek', value: 'Cek' },
  { label: 'dp_monitor', value: 'Monitor' },
  { label: 'dp_evaluasi', value: 'Evaluasi' },
  { label: 'dp_dikaji_kemungkinannya', value: 'Dikaji Kemungkinannya' },
  { label: 'dp_laporkan', value: 'Laporkan' },
  { label: 'dp_untuk_menjadi_perhatian', value: 'Untuk Menjadi Perhatian' },
  { label: 'dp_untuk_dijadikan_acuan', value: 'Untuk Dijadikan Acuan/Dipergunakan' },
  { label: 'dp_harap_mewakili', value: 'Harap Mewakili' },
  { label: 'dp_harap_mendampingi', value: 'Harap Mendampingi' },
  { label: 'dp_tunjuk_perwakilan', value: 'Tunjuk Perwakilan' },
  { label: 'dp_siapkan_bahan', value: 'Siapkan Bahan/Materi' },
  { label: 'dp_lainnya', value: 'Lainnya' },
];

const signerInfo = computed(() => ({
  name: toTitleCase(renderedActorName.value) || t('dp_nama_lengkap'),
  role: renderedPositionLabel.value || t('dp_jabatan'),
  label: t('dp_ditandatangani_digital')
}));

const defaultDisposisiPerihal = () => {
  const unit = String(
    dispositionUnit.value || user.value?.abbreviation || user.value?.subAreaText || user.value?.organizationText || ''
  ).trim();
  return unit ? `Disposisi ${unit}` : 'Disposisi';
};

const normalizeRefPerihal = (value: unknown) => {
  const text = String(value ?? '').trim();
  return text && text !== '-' ? text : defaultDisposisiPerihal();
};

const disposisiRecipientDisplay = (item: any) => {
  const raw = item?.raw?.raw ?? item?.raw ?? item;
  if (Number(raw?.chief) === 0) {
    return raw?.persnum_person_text || raw?.nama || item?.label || '-';
  }
  const position = raw?.position_text || raw?.positionText || item?.labelJob || item?.label || '-';
  const abbreviation = String(
    raw?.position_abbreviation || raw?.abbreviation || raw?.abbrivation || '',
  ).trim().toUpperCase();
  const isGeneralManager = abbreviation === 'GM' || /\bgeneral manager\b/i.test(position);
  if (!isGeneralManager) return position;

  const name = raw?.persnum_person_text || raw?.nama || '';
  const location = raw?.sub_area_text || raw?.subAreaText || raw?.area_text || raw?.areaText || '';
  return [name, position, location].filter(Boolean).join(' - ');
};

const previewDispositionRecipients = computed(() =>
  selectedTertuju.value
    .map(disposisiRecipientDisplay)
    .sort((a, b) => a.localeCompare(b, 'id')),
);

const showEditor = computed(() => selectedChecklist.value.includes("Lainnya"));

// ── Watchers ─────────────────────────────────────────────────────────────────

watch(showEditor, async (isShown) => {
  if (isShown) {
    await nextTick();
    if (editorContainerRef.value) {
      editorContainerRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => tinymceEditor.value?.focus(), 500);
    }
  }
});

// ── Payload & validation ─────────────────────────────────────────────────────
const validateAndToast = (payload: DisposisiPayload) => {
  // 1. Validasi bawaan dari schema Zod
  const check = validateDisposisiPayload(payload);
  if (!check.isValid) {
    const firstKey = Object.keys(check.errors || {})[0];
    const message = firstKey ? (check.errors || {})[firstKey] : t('dp_lengkapi_field_wajib');
    toastError(t('dp_validasi_gagal'), message);
    return false;
  }

  // 2. Validasi tambahan: Jika "Lainnya" dipilih, konten/catatan tidak boleh kosong
  if (selectedChecklist.value.includes("Lainnya")) {
    const strippedContent = (editorContent.value || "").replace(/<[^>]*>?/gm, '').trim(); // Hapus tag HTML
    if (!strippedContent) {
      toastError(t('dp_validasi_gagal'), t('dp_catatan_wajib_lainnya'));
      return false;
    }
  }

  return true;
};

const getBasePayload = (): DisposisiPayload => ({
  id_naskah: editDraftId.value || null,
  pengirim: renderedPositionLabel.value || user.value?.positionText || "",
  penandatangan: renderedActorName.value || "",
  tertuju: selectedTertuju.value.map(i => i.value),
  tanggal_disposisi: tglDb.value,
  tanggal_ui: tglDisplay.value,
  sifat: (typeof selectedSifat.value === 'object'
    ? selectedSifat.value?.value
    : selectedSifat.value) || "biasa",
  ref_nomor: refNumber.value || "-",
  ref_perihal: refPerihal.value || "-",
  catatan: showEditor.value ? editorContent.value : "",
  htmlContent: showEditor.value ? editorContent.value : "",
  disposisi: selectedChecklist.value,
  is_priority: isPriority.value,
  lampiran_temp_ids: existingFiles.value.map(f => f.id).filter(Boolean)
});

const createFormData = (payload: DisposisiPayload, includePdf = false) => {
  const safeName = (payload.ref_perihal || 'disposisi').replace(/[^a-z0-9]/gi, '_').substring(0, 20);
  return buildFormData(payload, {
    includePdf,
    skipKeys: ['tanggal_ui'],
    pdfFileName: `DI_${safeName}.pdf`
  });
};

// ── Handlers ─────────────────────────────────────────────────────────────────

const handlePriorityChange = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.checked) {
    isPriority.value = false;
    return;
  }
  target.checked = false;
  const isConfirmed = await Alert.confirm(t('dp_tandai_prioritas_konfirmasi'), t('dp_prioritas_desc'), t('dp_ya_prioritas'), t('k_batal'), false);
  Alert.close();
  if (isConfirmed) isPriority.value = true;
};

const handlePreview = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  isLoadingData.value = true;
  loadingMessage.value = t('dp_memproses_pratinjau');
  try {
    const blob = await generatePdf(createFormData(payload, false));
    setPdfBlob(blob);
    isOpenPreview.value = true;
  } catch (err) {
    toastError(t('dp_gagal_preview'));
  } finally {
    isLoadingData.value = false;
  }
};

const handleSaveDraft = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  loadingMessage.value = t('dp_menyimpan_draft');
  isLoadingData.value = true;
  try {
    const fd = createFormData(payload, false);
    if (editDraftId.value) {
      await updateDraft(fd, editDraftId.value);
    } else {
      await saveDI(fd);
    }
    toastSuccess(t('f_berhasil'), t('f_draft_tersimpan'));
    redirectDraf();
  } catch (e: any) {
    toastError(t('f_gagal'), e.response?.data?.message || t('dp_gagal_memperbarui_draft'));
  } finally {
    isLoadingData.value = false;
  }
};

const handleConfirmKirim = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  let configData = { digsig: false, ttdQr: false, ttdBasah: false };
  try {
    const res = await getConfigDigsig('DI');
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
  if (configData.digsig) {
    try {
      tteMode.value = await getTteMode('DI');
    } catch {
      toastError('Konfigurasi TTE tidak dapat dibaca', 'Silakan coba lagi.');
      return;
    }
  }
  isSignMethodModalOpen.value = true;
};

const handleSignMethodSubmit = async (data: { method: string; passphrase?: string; file?: File | null }) => {
  selectedSendType.value = data.method;
  await handleKirimDokumen(data.passphrase || '', data.file ?? undefined);
};

const handleKirimDokumen = async (passphrase = '', fileBasah?: File) => {
  if (selectedSendType.value === 'digsig' && tteMode.value === 'bsre_direct' && !passphrase.trim()) {
    signMethodModalRef.value?.setPassphraseError(t('dp_passphrase_kosong'));
    return;
  }

  const basePayload = getBasePayload();
  loadingMessage.value = t('dp_mengirim_disposisi');
  isLoadingData.value = true;

  try {
    const blob = await generatePdf(createFormData(basePayload, false));
    setPdfBlob(blob);

    const safeName = (basePayload.ref_perihal || 'disposisi').replace(/[^a-z0-9]/gi, '_').substring(0, 20);

    const kirimPayload: Record<string, any> = {
      ...basePayload,
      sign_option: selectedSendType.value,
    };

    if (selectedSendType.value === 'digsig' && tteMode.value === 'bsre_direct') {
      kirimPayload.passphrase = passphrase;
      if (!user.value?.nik) throw new Error(t('dp_nik_tidak_ditemukan'));
      kirimPayload.nik = user.value.nik;
    }

    const fdFinal = buildFormData(kirimPayload, {
      includePdf: true,
      skipKeys: ['tanggal_ui'],
      pdfFileName: `DI_${safeName}.pdf`
    });

    if (selectedSendType.value === 'ttd_basah' && fileBasah) {
      fdFinal.append('file_ttd_basah', fileBasah);
    }

    const res = editDraftId.value
      ? await sendDraft(fdFinal, editDraftId.value)
      : await sendDisposisi(fdFinal);

    const redirect = res?.data?.data?.tte_redirect ?? res?.data?.tte_redirect ?? res?.tte_redirect;
    if (redirect?.signingUrl) {
      isSignMethodModalOpen.value = false;
      window.location.href = redirect.signingUrl;
      return;
    }

    if (res?.data?.success || res?.success) {
      revokePdfUrl();
      toastSuccess(t('f_berhasil'), t('dp_disposisi_terkirim'));
      Alert.close();

      // Sama seperti tulis ND — ttd_basah redirect ke tertunda, selainnya ke terkirim
      if (selectedSendType.value === 'ttd_basah') {
        const naskahId = res?.data?.data?.id || res?.data?.id || res?.id;
        navigateTo(`/korespondensi/tertunda/${naskahId}?jenis=DI`);
      } else {
        redirectTerkirim();
      }
    } else {
      throw new Error(res?.data?.message || t('dp_pengiriman_gagal'));
    }
  } catch (e: any) {
    Alert.close();
    const errMsg = e.response?.data?.message || e.message || t('dp_gagal_kirim_dokumen');

    if (tteMode.value === 'bsre_direct' && (errMsg.toLowerCase().includes('passphrase') || errMsg.toLowerCase().includes('salah'))) {
      bsreDisabled.value = false;
      await nextTick();
      isSignMethodModalOpen.value = true;
      await nextTick();
      signMethodModalRef.value?.setPassphraseError(errMsg);
    } else {
      toastError(t('dp_gagal_mengirim'), errMsg);
    }
  } finally {
    isLoadingData.value = false;
  }
};

const handleConfirmSaveDraft = () => confirmSaveDraft(handleSaveDraft);

// ── onMounted ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (!canAccessPage()) return;
  loadingMessage.value = t('dp_memuat');
  isLoadingData.value = true;

  if (!user.value) await getProfile();
  refPerihal.value = normalizeRefPerihal(refPerihal.value);

  try {
    const res = await getRecipients(user.value?.position);
    dispositionUnit.value = String(
      res?.sender?.organization_abbreviation ||
      res?.sender?.sub_area_abbreviation ||
      res?.sender?.position_abbreviation ||
      ''
    ).trim();
    refPerihal.value = normalizeRefPerihal(refPerihal.value);
    recipientList.value = (res.recipients || []).map((r: any) => ({
      label: r.label || r.nama,
      labelJob: r.labelJob || r.positionText || r.position_text,
      value: String(r.value || r.id || r.position_id),
      raw: r
    }));

    const draftId = route.query.draft_id as string;
    if (draftId) {
      editDraftId.value = draftId;
      const resDraft = await getDraftDetail(draftId);

      if (resDraft.data?.flow?.[0]) {
        const d = resDraft.data.flow[0];
        refNumber.value = d.ref_nomor || d.nomor || "-";
        refPerihal.value = normalizeRefPerihal(d.ref_perihal || d.perihal);
        isPriority.value = d.is_priority === true || d.is_priority === 1 || String(d.is_priority) === "1";

        if (d.tanggal) setDateFromString(d.tanggal);
        setSifatFromString(d.sifat);

        editorContent.value = d.catatan || d.htmlContent || "";
        if (tinymceEditor.value) tinymceEditor.value.setContent(editorContent.value);

        selectedChecklist.value = Array.isArray(d.disposisi) ? d.disposisi : (typeof d.disposisi === 'string' ? d.disposisi.split('\n') : []);
        selectedTertuju.value = mapApiToUI(d.penerima || [], recipientList.value);
        existingFiles.value = mapLampiranFiles(d.lampiran_files || []);
      }
    }
  } catch (e) {
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
