<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import Editor from "@tinymce/tinymce-vue";

import { validateDraftPayload, type DraftPayload } from "~/types/nota-dinas";
import { Alert } from "@/composables/useAlert";

definePageMeta({ middleware: ['auth', 'tulis-access'] })

const route = useRoute();
const toast = useToast();
const alertState = useAlertState();

const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { getRecipients, getRecipientGroups } = useRecipients();
const { getDraftDetail } = useDraft();
const { generatePdf, sendNotaDinas, saveDraft: saveND } = useNotaDinas();
const { getConfigDigsig } = useDigsig();

const isSignMethodModalOpen = ref(false);
const bsreDisabled = ref(false);
const qrDisabled = ref(false);
const basahDisabled = ref(false);
const signMethodModalRef = ref<any>(null);

// ── Shared composable ────────────────────────────────────────────────────────
const {
  isLoadingData, loadingMessage, isOpenPreview,
  editDraftId, subject, editorContent, tinymceEditor,
  date, selectedKlasifikasiId, selectedSifat, existingFiles,
  klasifikasiList, klasifikasiStatus, recipientGroups,
  selectedTertuju, selectedTembusan,
  pdfBlob, pdfUrl,
  maxPerihal, sifatOptions, tinyMceInit,
  selectedKlasifikasi, formattedDate, tglDb, tglDisplay,
  excludeTertujuList, excludeTembusanList,
  tertujuIndividu, tembusanIndividu, tertujuGrup, tembusanGrup,
  handleApplyTemplate, buildFormData,
  mapGroupsToUI, mapApiToUI, mergeGrupDanIndividu,
  mapLampiranFiles, setDateFromString, setSifatFromString,
  setPdfBlob, revokePdfUrl,
  confirmSaveDraft, confirmKirim,
  toastError, toastSuccess,
  redirectTerkirim, redirectDraf,
} = useTulis();

// ── ND-specific state ─────────────────────────────────────────────────────────
const english = ref(false);
const items = ref<any[]>([]);
const selectedSendType = ref("qr_only");

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Tulis Nota Dinas", to: "#" },
];

const signerInfo = computed(() => ({
  name: user.value?.nama || "Nama Lengkap",
  role: user.value?.positionText || "Jabatan",
  label: "Ditandatangani secara digital oleh",
}));

// ── Payload & validation ─────────────────────────────────────────────────────

const validateAndToast = (payload: DraftPayload) => {
  const result = validateDraftPayload(payload);
  if (!result.isValid) {
    const firstError = Object.values(result.errors ?? {})[0] ?? "Terjadi kesalahan input";
    toastError("Validasi Gagal", firstError);
    return false;
  }
  return true;
};

const getBasePayload = (): DraftPayload => ({
  id_naskah: editDraftId.value || null,
  pengirim: user.value?.position || "",
  penerima: tertujuIndividu.value,
  tembusan: tembusanIndividu.value,
  penerima_grup: tertujuGrup.value,
  tembusan_grup: tembusanGrup.value,
  klasifikasi: selectedKlasifikasi.value?.klasifikasi || null,
  klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || null,
  sifat: selectedSifat.value?.value || "biasa",
  perihal: subject.value,
  konten: String(editorContent.value || ""),
  htmlContent: String(editorContent.value || ""),
  english: english.value,
  nama_tempat: user.value?.areaText || "Kantor Pusat",
  nama_jabatan: user.value?.positionText || "",
  nama_lengkap: user.value?.nama || "",
  tgl: tglDb.value,
  tanggal: tglDisplay.value,
  lampiran_temp_ids: existingFiles.value.map((f) => f.id).filter(Boolean) as string[],
});

const createFormData = (payload: DraftPayload, includePdf = false) => {
  const safeDate = payload.tanggal?.replace(/\//g, "-") || "draft";
  return buildFormData(payload, {
    includePdf,
    pdfFileName: `nota_dinas_${safeDate}.pdf`,
  });
};

// ── Handlers ─────────────────────────────────────────────────────────────────

const handlePreview = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;
  loadingMessage.value = "Memproses Pratinjau...";
  isLoadingData.value = true;
  try {
    const blob = await generatePdf(createFormData(payload, false));
    setPdfBlob(blob);
    isOpenPreview.value = true;
  } catch {
    toastError("Gagal Preview");
  } finally {
    isLoadingData.value = false;
  }
};

const handleSaveDraft = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;
  loadingMessage.value = "Menyimpan Draft...";
  isLoadingData.value = true;
  try {
    await saveND(createFormData(payload, false), editDraftId.value);
    toastSuccess("Berhasil", "Draft berhasil disimpan");
    redirectDraf();
  } catch (e: any) {
    toastError("Gagal", e.response?.data?.message || "Gagal memperbarui draft");
  } finally {
    isLoadingData.value = false;
  }
};

const handleKirimDokumen = async (passphrase = '') => {
  if (selectedSendType.value === 'digsig' && !passphrase.trim()) {
    signMethodModalRef.value?.setPassphraseError('Harap masukkan passphrase Anda')
    return
  }

  const payload = getBasePayload();
  loadingMessage.value = "Mengirim Nota Dinas...";
  isLoadingData.value = true;
  try {
    const blob = await generatePdf(createFormData(payload, false));
    setPdfBlob(blob);

    const fd = createFormData(payload, true);
    fd.append("sign_option", selectedSendType.value);

    if (selectedSendType.value === 'digsig') {
      fd.append("passphrase", passphrase);
      if (!user.value?.nik) throw new Error("NIK pengguna tidak ditemukan untuk TTE.");
      fd.append("nik", user.value.nik);
    }

    const result = await sendNotaDinas(fd);
    if (result.data.success) {
      revokePdfUrl();
      toastSuccess("Berhasil", "Nota Dinas berhasil dikirim");
      Alert.close();

      if (selectedSendType.value === 'ttd_basah') {
        const naskahId = result.data?.data?.id || result.data?.id;
        console.log("naskahId:", naskahId, "| result:", result);
        navigateTo(`/korespondensi/tertunda/${naskahId}?jenis=ND`);
      } else {
        redirectTerkirim();
      }
    } else {
      throw new Error(result.data.message || "Pengiriman gagal");
    }
  } catch (e: any) {
    Alert.close();
    const errMsg = e.response?.data?.message || e.message || "Gagal mengirim dokumen";

    if (errMsg.toLowerCase().includes('passphrase') || errMsg.toLowerCase().includes('salah')) {
      bsreDisabled.value = false
      await nextTick()
      isSignMethodModalOpen.value = true
      await nextTick()
      signMethodModalRef.value?.setPassphraseError(errMsg)
    } else {
      toastError("Gagal Mengirim", errMsg);
    }
  } finally {
    isLoadingData.value = false
  }
};

const handleConfirmSaveDraft = () => confirmSaveDraft(handleSaveDraft);

const handleConfirmKirim = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  let configData = { digsig: false, ttdQr: false, ttdBasah: false }
  try {
    const res = await getConfigDigsig('ND')
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

// ── onMounted ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  loadingMessage.value = "Memuat...";
  isLoadingData.value = true;

  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";
    klasifikasiList.value = await getKlasifikasi();
    klasifikasiStatus.value = "success";

    const resRec = await getRecipients();
    items.value = (resRec.recipients || resRec.data || []).map((r: any) => ({
      label: `${r.persnum_person_text || r.persnum || "empty"} - (${r.position_abbreviation || r.abbreviation}) ${r.position_text || r.positionText}`,
      labelJob: r.position_text || r.positionText,
      value: String(r.position || r.position_id || r.id),
      raw: r,
    }));

    const groups = await getRecipientGroups("ND");
    recipientGroups.value = groups.filter((g: any) => g.aktif);
  } catch {
    klasifikasiStatus.value = "error";
  }

  const draftId = route.query.draft_id as string;
  if (draftId) {
    try {
      editDraftId.value = draftId;
      const res = await getDraftDetail(draftId);

      if (res.success && res.data) {
        const d = res.data;
        subject.value = d.perihal || "";
        editorContent.value = d.konten || "";
        english.value = Boolean(d.english);

        if (d.klasifikasi) {
          const found = klasifikasiList.value.find((k: any) => k.klasifikasi === d.klasifikasi);
          if (found) selectedKlasifikasiId.value = found.id;
        }

        selectedTertuju.value = mergeGrupDanIndividu(
          mapGroupsToUI(d.penerima_grup),
          mapApiToUI(d.penerima, items.value)
        );
        selectedTembusan.value = mergeGrupDanIndividu(
          mapGroupsToUI(d.tembusan_grup),
          mapApiToUI(d.tembusan, items.value)
        );

        existingFiles.value = mapLampiranFiles(d.lampiran_files || []);
        setSifatFromString(d.sifat);
        if (d.tanggal) setDateFromString(d.tanggal);
      }
    } catch {
      toastError("Gagal memuat data draft");
    }
  }

  isLoadingData.value = false;
});
</script>

<template>
  <div class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== 'Memuat...'" :message="loadingMessage" />
    <PageHeader title="Tulis Nota Dinas" :items="breadcrumbs" />

    <UCard variant="soft"
      :ui="{ root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm' }">

      <!-- Skeleton loading -->
      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
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
        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tertuju" :items="items"
          :groups="recipientGroups" :exclude-items="excludeTertujuList" disabled-message="Sudah dipilih" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan" :items="items"
          :groups="recipientGroups" :exclude-items="excludeTembusanList" disabled-message="Sudah dipilih" />

        <TulisInputSifat v-model="selectedSifat" />

        <!-- Perihal -->
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
                            : '................................................'
                            "></span>
                        </td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Dari</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top">{{ user?.positionText || 'Posisi' }}</td>
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
      @save-draft="handleConfirmSaveDraft" @send="handleConfirmKirim" />

    <TulisDigsigPassphraseModal v-model:open="isSignMethodModalOpen" :signer-info="signerInfo"
      :is-loading="isLoadingData" :hide-bsre="bsreDisabled" :hide-qr="qrDisabled" :hide-basah="basahDisabled"
      ref="signMethodModalRef" @submit="handleSignMethodSubmit" />

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
