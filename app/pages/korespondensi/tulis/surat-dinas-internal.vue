<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import TinymceEditorAsync from '~/components/TinymceEditorAsync.vue';

import TulisInputKlasifikasi from "@/components/Tulis/InputKlasifikasi.vue";
import TulisInputLampiran from "@/components/Tulis/InputLampiranAsync.vue";
import TulisInputSifat from "@/components/Tulis/InputSifat.vue";
import TulisInputPenerima from "@/components/Tulis/InputPenerima.vue";
import TulisInputTanggal from "@/components/Tulis/InputTanggal.vue";
import TemplateManager from "@/components/Tulis/TemplateManager.vue";
import TulisKopSurat from "@/components/Tulis/KopSuratAsync.vue";
import TulisDigsigPassphraseModal from "@/components/Tulis/DigsigPassphraseModalAsync.vue";

import { Alert } from "@/composables/useAlert";
import { validateSDIPayload, type SDIPayloadInput, type SDIPayload } from "~/types/sdi";

definePageMeta({ middleware: ['auth', 'tulis-access'] })

const route = useRoute();
const toast = useToast();
const alertState = useAlertState();
const { t } = useI18n();

const { user, getProfile, hasPermission } = useAuth();
const { canAccessPage } = useFeatureAccess();
const { getKlasifikasi } = useKlasifikasi();
const { getRecipientGroups } = useRecipients();
const { getRecipients, sendSDI, saveDraft, updateDraft, sendDraft, generatePdf, getSDIDetail } = useSdi();
const { renderedPositionLabel } = useDelegationMode();


const { getConfigDigsig } = useDigsig();
const isSignMethodModalOpen = ref(false);
const bsreDisabled = ref(false);
const qrDisabled = ref(false);
const basahDisabled = ref(false);
const signMethodModalRef = ref<any>(null);
const selectedSendType = ref("qr_only");

// ── Shared composable ────────────────────────────────────────────────────────
const {
  // ui state
  isLoadingData, loadingMessage, isOpenPreview,
  // form state
  editDraftId, subject, editorContent, tinymceEditor,
  date, selectedKlasifikasiId, selectedSifat, existingFiles,
  // data state
  klasifikasiList, klasifikasiStatus, recipientGroups,
  selectedTertuju, selectedTembusan,
  pdfBlob, pdfUrl,
  // constants
  maxPerihal, sifatOptions, tinyMceInit,
  // computed
  selectedKlasifikasi, formattedDate, tglDb, tglDisplay,
  excludeTertujuList, excludeTembusanList,
  tertujuIndividu, tembusanIndividu, tertujuGrup, tembusanGrup,
  // helpers
  handleApplyTemplate, buildFormData,
  mapGroupsToUI, mapApiToUI, mergeGrupDanIndividu,
  mapLampiranFiles, setDateFromString, setSifatFromString,
  setPdfBlob, revokePdfUrl,
  // actions
  confirmSaveDraft,
  toastError, toastSuccess,
  redirectTerkirim, redirectDraf,
} = useTulis();

const isAiDraftOpen = ref(false);

// ── SDI-specific state ────────────────────────────────────────────────────────
const lampiranText = ref("");
const tertujuItems = ref<any[]>([]);
const tembusanItems = ref<any[]>([]);

const breadcrumbs = computed(() => [
  { label: t('beranda'), to: "/beranda" },
  { label: t('sdi_judul'), to: "#" },
]);

// ── Payload & validation ─────────────────────────────────────────────────────

const validateAndToast = (payload: SDIPayloadInput) => {
  const hasTertuju =
    (payload.tertuju?.length ?? 0) > 0 || (payload.penerima_grup?.length ?? 0) > 0;
  if (!hasTertuju) {
    toastError(t('sdi_validasi_gagal'), t('sdi_penerima_tertuju_wajib'));
    return false;
  }
  const check = validateSDIPayload(payload);
  if (!check.isValid) {
    const keys = Object.keys(check.errors).filter((k) => k !== "tertuju");
    if (keys.length > 0) {
      toastError(t('sdi_validasi_gagal'), check.errors[keys[0]!]);
      return false;
    }
  }
  return true;
};

const getPayload = (): SDIPayloadInput => ({
  id_naskah: editDraftId.value || null,
  pengirim: user.value?.position || "",
  tertuju: tertujuIndividu.value,
  tembusan: tembusanIndividu.value,
  penerima_grup: tertujuGrup.value,
  tembusan_grup: tembusanGrup.value,
  klasifikasi: selectedKlasifikasi.value?.klasifikasi || "",
  klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || "",
  sifat: selectedSifat.value?.value || "biasa",
  perihal: subject.value,
  lampiran: lampiranText.value,
  konten: editorContent.value,
  english: false,
  nama_tempat: user.value?.areaText || "",
  nama_jabatan: renderedPositionLabel.value || "",
  nama_lengkap: user.value?.nama || "",
  tgl: tglDb.value,
  tanggal: tglDisplay.value,
  lampiran_temp_ids: existingFiles.value.map((f) => f.id).filter(Boolean) as string[],
});

const createFormData = (payload: SDIPayloadInput, includePdf = false) => {
  const safeName = (payload.perihal || "dokumen").replace(/[^a-z0-9]/gi, "_").substring(0, 20);
  return buildFormData(payload, {
    includePdf,
    skipKeys: ["tanggal"],
    pdfFileName: `SDI_${safeName}.pdf`,
  });
};

// ── Handlers ─────────────────────────────────────────────────────────────────

const handlePreview = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) return;

  loadingMessage.value = t('sdi_memproses_pratinjau');
  isLoadingData.value = true;
  try {
    const blob = await generatePdf(createFormData(payload, false));
    setPdfBlob(blob);
    isOpenPreview.value = true;
  } catch {
    toastError(t('sdi_gagal_pratinjau'));
  } finally {
    isLoadingData.value = false;
  }
};

const handleSaveDraft = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) return;
  loadingMessage.value = t('sdi_menyimpan_draf');
  isLoadingData.value = true;
  try {
    const fd = createFormData(payload, false);
    if (editDraftId.value) {
      await updateDraft(fd, editDraftId.value);
    } else {
      await saveDraft(fd);
    }
    toastSuccess(t('f_berhasil'), t('f_draft_tersimpan'));
    redirectDraf();
  } catch (e: any) {
    toastError(t('f_gagal'), e.response?.data?.message || t('sdi_gagal_memperbarui_draf'));
  } finally {
    Alert.close();
    isLoadingData.value = false;
  }
};

const handleKirimDokumen = async (passphrase = '') => {
  if (selectedSendType.value === 'digsig' && !passphrase.trim()) {
    signMethodModalRef.value?.setPassphraseError(t('sdi_harap_passphrase'))
    return
  }

  const payload = getPayload();
  loadingMessage.value = t('sdi_mengirim');
  isLoadingData.value = true;
  try {
    const blob = await generatePdf(createFormData(payload, false));
    setPdfBlob(blob);

    const fd = createFormData(payload, true);
    fd.append("sign_option", selectedSendType.value);

    if (selectedSendType.value === 'digsig') {
      fd.append("passphrase", passphrase);
      if (!user.value?.nik) throw new Error(t('sdi_nik_tidak_ditemukan'));
      fd.append("nik", user.value.nik);
    }

    const res = editDraftId.value
      ? await sendDraft(fd, editDraftId.value)
      : await sendSDI(fd);

    if (res?.success || res?.data?.success) {
      revokePdfUrl();
      toastSuccess(t('f_berhasil'), t('sdi_berhasil_dikirim'));
      Alert.close();

      if (selectedSendType.value === 'ttd_basah') {
        const naskahId = res.data?.data?.id || res.data?.id;
        navigateTo(`/korespondensi/tertunda/${naskahId}?jenis=SDI`);
      } else {
        redirectTerkirim();
      }
    } else {
      throw new Error(res?.data?.message || t('sdi_pengiriman_gagal'));
    }
  } catch (e: any) {
    Alert.close();
    const errMsg = e.response?.data?.message || e.message || t('sdi_gagal_mengirim_dokumen');

    if (errMsg.toLowerCase().includes('passphrase') || errMsg.toLowerCase().includes('salah')) {
      bsreDisabled.value = false
      await nextTick()
      isSignMethodModalOpen.value = true
      await nextTick()
      signMethodModalRef.value?.setPassphraseError(errMsg)
    } else {
      toastError(t('sdi_gagal_mengirim'), errMsg);
    }
  } finally {
    isLoadingData.value = false
  }
};

const handleConfirmKirim = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) return;

  let configData = { digsig: false, ttdQr: false, ttdBasah: false }
  try {
    const res = await getConfigDigsig('SDI')
    configData = {
      digsig: res?.data?.digsig ?? false,
      ttdQr: res?.data?.ttdQr ?? false,
      ttdBasah: res?.data?.ttdBasah ?? false,
    }
  } catch {
    // semua false jika gagal fetch
  }

  bsreDisabled.value = !configData.digsig
  qrDisabled.value = !configData.ttdQr
  basahDisabled.value = !configData.ttdBasah
  isSignMethodModalOpen.value = true
};

const handleSignMethodSubmit = async (data: { method: string; passphrase?: string }) => {
  selectedSendType.value = data.method;
  await handleKirimDokumen(data.passphrase || '');
};

const handleConfirmSaveDraft = () => confirmSaveDraft(handleSaveDraft);

// const handleConfirmKirim = async () => {
//   const payload = getPayload();
//   if (!validateAndToast(payload)) return;
//   await confirmKirim("Dokumen akan dikirim.", handleKirimDokumen);
// };

// ── onMounted ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!canAccessPage()) return;
  loadingMessage.value = t('sdi_memuat');
  isLoadingData.value = true;

  const draftId = route.query.draft_id as string;

  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";
    klasifikasiList.value = await getKlasifikasi();
    klasifikasiStatus.value = "success";

    const resRec = await getRecipients();
    const rawRecipients = resRec.recipients || (resRec as any).data || [];

    // Sort by org hierarchy: Direktur > GM > VP > Manager > lainnya
    const hierarchyOrder: Record<string, number> = {
      'direktur utama': 1, 'president director': 1,
      'direktur': 2, 'director': 2,
      'general manager': 3, 'gm': 3,
      'vice president': 4, 'vp': 4,
      'evp': 3, 'senior vice president': 3, 'svp': 3,
    };
    const getHierarchyRank = (r: any) => {
      const text = (r.position_text || r.positionText || '').toLowerCase();
      for (const [keyword, rank] of Object.entries(hierarchyOrder)) {
        if (text.includes(keyword)) return rank;
      }
      // bod_tag fallback: lower number = higher rank
      if (r.bod_tag) return 5;
      return 10;
    };

    tertujuItems.value = rawRecipients
      .sort((a: any, b: any) => getHierarchyRank(a) - getHierarchyRank(b))
      .map((r: any) => ({
        label: `${r.persnum_person_text || r.persnum || "empty"} - (${r.position_abbreviation || r.abbreviation}) ${r.position_text || r.positionText}`,
        labelJob: r.position_text || r.positionText,
        organization: r.organization_text,
        value: String(r.position || r.position_id || r.id),
        raw: r,
      }));
    tembusanItems.value = tertujuItems.value;

    const groups = await getRecipientGroups("SDI");
    recipientGroups.value = groups.filter((g: any) => g.aktif);
  } catch {
    klasifikasiStatus.value = "error";
  }

  if (draftId) {
    try {
      editDraftId.value = draftId;
      const res = await getSDIDetail(draftId);

      if (res.success && res.data) {
        const d = res.data;

        subject.value = d.perihal || "";
        lampiranText.value = d.lampiran || "";
        editorContent.value = d.konten || "";
        if (tinymceEditor.value) tinymceEditor.value.setContent(d.konten || "");

        if (d.klasifikasi) {
          const found = klasifikasiList.value.find((k: any) => k.klasifikasi === d.klasifikasi);
          if (found) selectedKlasifikasiId.value = found.id;
        }

        const buildSelectedFiltered = (apiArr: any[], grupArr: any[]) => {
          if (!apiArr?.length) return [];

          // Kumpulkan semua position_ids dari semua grup
          const grupPositionIds = new Set<string>();
          (grupArr || []).forEach((grup: any) => {
            (grup.position_ids || []).forEach((posId: any) => {
              grupPositionIds.add(String(posId));
            });
          });

          // Kumpulkan persnum yang diwakili grup (via tertujuItems yang ada di list)
          const grupPersnums = new Set<string>();
          tertujuItems.value.forEach((item: any) => {
            const posId = String(item.raw?.position || '');
            if (grupPositionIds.has(posId)) {
              const persnum = String(item.raw?.persnum_person || '');
              if (persnum) grupPersnums.add(persnum);
            }
          });

          // Kumpulkan SEMUA persnum yang ada di tertujuItems (untuk deteksi individu sejati)
          const allKnownPersnums = new Set<string>();
          tertujuItems.value.forEach((item: any) => {
            const persnum = String(item.raw?.persnum_person || '');
            if (persnum) allKnownPersnums.add(persnum);
          });

          return apiArr
            .filter((item: any) => {
              const pn = String(item.persnum || '');
              if (!allKnownPersnums.has(pn) && grupPositionIds.size > 0) return false;
              // Buang jika tidak dikenal di tertujuItems DAN ada grup aktif
              // (berarti dia anggota grup yang tidak visible untuk user ini)
              if (!allKnownPersnums.has(pn) && grupPositionIds.size > 0) return false;
              return true;
            })
            .map((item: any) => {
              const found = tertujuItems.value.find(
                (m: any) => String(m.raw?.persnum_person) === String(item.persnum)
              );
              return found || {
                label: `${item.persnum} - () ${item.positionText || ''}`,
                labelJob: item.positionText || '',
                organization: item.organizationText || '',
                value: String(item.persnum),
                raw: item,
              };
            })
            .filter(Boolean);
        };

        selectedTertuju.value = mergeGrupDanIndividu(
          mapGroupsToUI(d.penerima_grup),
          buildSelectedFiltered(d.penerima || [], d.penerima_grup || [])
        );
        selectedTembusan.value = mergeGrupDanIndividu(
          mapGroupsToUI(d.tembusan_grup),
          buildSelectedFiltered(d.tembusan || [], d.tembusan_grup || [])
        );

        existingFiles.value = mapLampiranFiles(d.lampiran_files || []);
        setSifatFromString(d.sifat);
        if (d.tgl || d.tanggal) setDateFromString(d.tgl || d.tanggal);
      }
    } catch {
      toastError(t('sdi_gagal_muat_draf'));
    }
  }

  isLoadingData.value = false;
});

watch(
  existingFiles,
  (files) => {
    lampiranText.value = files?.length > 0 ? `${files.length} ${t('f_lampiran')}` : `0 ${t('f_lampiran')}`;
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <AccessDenied v-if="!canAccessPage()" />
  <div v-else class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== $t('sdi_memuat')" :message="loadingMessage" />
    <PageHeader :title="$t('sdi_judul')" :items="breadcrumbs" />

    <UCard variant="soft"
      :ui="{ root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm' }">

      <!-- Skeleton loading -->
      <div v-if="isLoadingData && loadingMessage === $t('sdi_memuat')" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
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
            <USkeleton v-for="j in 4" :key="j" class="h-3 w-full" />
          </div>
        </div>
        <USkeleton class="h-30 w-full rounded-md" />
        <div class="pt-6 border-t border-gray-100 dark:border-gray-800">
          <USkeleton class="h-10 w-32 rounded-lg" />
        </div>
      </div>

      <!-- Form -->
      <div v-else class="flex-1 overflow-y-auto space-y-1">
        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []"
          :loading="klasifikasiStatus === 'loading'" />
        <TulisInputTanggal v-model="date" :label="$t('f_tanggal_surat')" />

        <TulisInputPenerima v-model="selectedTertuju" :label="$t('tertuju')" :placeholder="$t('sdi_pilih_tertuju')" :items="tertujuItems"
          :groups="recipientGroups" :exclude-items="excludeTertujuList" :disabled-message="$t('sdi_sudah_dipilih')" />

        <TulisInputPenerima v-model="selectedTembusan" :label="$t('f_tembusan')" :placeholder="$t('sdi_pilih_tembusan')"
          :items="tembusanItems" :groups="recipientGroups" :exclude-items="excludeTembusanList"
          :disabled-message="$t('sdi_sudah_dipilih')" />

        <TulisInputSifat v-model="selectedSifat" />

        <!-- Perihal -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">{{ $t('perihal') }}</span>
            <div class="flex items-center flex-1 w-full gap-2">
              <input type="text" v-model="subject" :maxlength="maxPerihal"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                :placeholder="$t('sdi_ketik_perihal')" />
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
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">{{ $t('f_lampiran') }}</span>
            <input type="text" v-model="lampiranText" readonly tabindex="-1"
              class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600 cursor-default opacity-75"
              :placeholder="$t('sdi_lampiran_otomatis')" />
          </div>
        </div>

        <div class="flex flex-col py-4">
          <TemplateManager :current-content="editorContent" @apply="handleApplyTemplate" />

          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">
              <div class="bg-white pt-10 pb-10 border-b border-gray-100 select-none text-black min-h-[1000px]">

                <TulisKopSurat :alamat-info="user?.alamatInfo" class="px-6" />

                <div class="flex mb-4 text-[14px] px-10">
                  <div>{{ user?.areaText || "Tangerang" }}, {{ formattedDate }}</div>
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
                          <td class="align-top capitalize">{{ selectedSifat?.label || $t('sdi_biasa') }}</td>
                        </tr>
                        <tr>
                          <td class="align-top">{{ $t('f_lampiran') }}</td>
                          <td class="align-top">:</td>
                          <td class="align-top">{{ lampiranText || '-' }}</td>
                        </tr>
                        <tr>
                          <td class="align-top">{{ $t('perihal') }}</td>
                          <td class="align-top">:</td>
                          <td class="align-top font-bold text-justify">{{ subject ||
                            "................................................" }}</td>
                        </tr>
                      </tbody>
                    </table>
                    <div class="mt-5">{{ $t('f_kepada_yth') }}</div>
                    <div class="font-bold mb-1">
                      <div v-if="selectedTertuju.length > 5">{{ $t('sdi_periksa_alamat_terlampir') }}</div>
                      <div v-else-if="selectedTertuju.length > 0">
                        <div v-for="(p, idx) in selectedTertuju" :key="idx" class="leading-relaxed">
                          <span v-if="selectedTertuju.length > 1">{{ idx + 1 }}. </span>
                          {{ p.labelJob || p.label }}{{ p.organization ? ' - ' + p.organization : '' }}
                        </div>
                      </div>
                      <div v-else>................................................</div>
                    </div>
                    <div class="mb-1">{{ $t('sdi_di_tempat') }}</div>
                  </div>
                </div>

                <div class="min-h-[300px] relative group">
                  <div class="mb-3">
                    <AiDraftTriggerButton @click="isAiDraftOpen = true" />
                  </div>
                  <TinymceEditorAsync api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" />
                </div>

                <div class="flex mt-12 text-black px-10">
                  <div class="text-center min-w-[250px]">
                    <div class="mb-24 text-[14px]">
                      <div class="font-bold">{{ renderedPositionLabel || $t('sdi_nama_jabatan') }}</div>
                    </div>
                    <div class="font-bold text-[14px] underline">{{ toTitleCase(user?.nama) || $t('sdi_nama_lengkap') }}</div>
                  </div>
                </div>

                <div class="mt-8 text-[12px] text-black px-10">
                  <div class="font-bold underlinec mb-1">{{ $t('f_tembusan') }} :</div>
                  <div v-if="selectedTembusan.length > 5" class="ml-4 pl-2">{{ $t('sdi_periksa_alamat_terlampir') }}</div>
                  <ol v-else-if="selectedTembusan.length > 0" class="list-decimal ml-4 pl-2">
                    <li v-for="t in selectedTembusan" :key="t.value">
                      {{ t.labelJob || t.label }}{{ t.organization ? ' - ' + t.organization : '' }}
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
                          <tr>
                            <td class="align-top pr-2">{{ $t('sdi_lampiran_surat') }}</td>
                          </tr>
                          <tr>
                            <td class="align-top pr-2">{{ $t('sdi_nomor_surat') }} :</td>
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
                    <div class="font-bold text-[14px] mb-2 uppercase">{{ $t('f_kepada_yth') }} :</div>
                    <ol class="list-decimal ml-6 text-[14px] space-y-1">
                      <li v-for="item in selectedTertuju" :key="item.value">{{ item.labelJob || item.label }}{{
                        item.organization ? ' - ' + item.organization : '' }}</li>
                    </ol>
                  </div>
                  <div v-if="selectedTembusan.length > 5">
                    <div class="font-bold text-[14px] mb-2 uppercase">{{ $t('f_tembusan') }} :</div>
                    <ol class="list-decimal ml-6 text-[14px] space-y-1">
                      <li v-for="item in selectedTembusan" :key="item.value">{{ item.labelJob || item.label }}{{
                        item.organization ? ' - ' + item.organization : '' }}</li>
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
          <UButton v-if="hasPermission('utama.tulis.surat-dinas-internal', 'create')" :label="$t('f_pratinjau')" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold"
            @click="handlePreview" />
        </div>
      </div>
    </UCard>

    <TulisPreviewSlideover v-model:open="isOpenPreview" :pdf-url="pdfUrl" :alert-is-open="alertState.isOpen"
      @save-draft="handleConfirmSaveDraft" @send="handleConfirmKirim" />

    <TulisDigsigPassphraseModal v-model:open="isSignMethodModalOpen"
      :signer-info="{ name: toTitleCase(user?.nama) || $t('sdi_nama_lengkap'), role: renderedPositionLabel || $t('sdi_jabatan'), label: $t('sdi_ditandatangani_digital') }"
      :is-loading="isLoadingData" :hide-bsre="bsreDisabled" :hide-qr="qrDisabled" :hide-basah="basahDisabled"
      ref="signMethodModalRef" @submit="handleSignMethodSubmit" />

    <AiDraftPanel v-model:open="isAiDraftOpen" naskah-type="SDI" :editor="tinymceEditor" />

  </div>
</template>

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
