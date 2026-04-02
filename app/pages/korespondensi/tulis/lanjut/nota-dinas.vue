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
              style="animation-duration: 1.5s;"></div>
            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg relative z-10">
              <div class="plane-float">
                <UIcon name="i-lucide-plane" class="w-8 h-8 text-[#457fb6] -rotate-45" />
              </div>
            </div>
          </div>
          <div class="flex flex-col items-center gap-2">
            <span class="text-gray-900 font-semibold text-lg">{{ loadingMessage || 'Memproses Data' }}</span>
            <span class="text-sm text-gray-600">Mohon tunggu sebentar</span>
          </div>
        </div>
      </div>
    </Teleport>

    <PageHeader title="Tulis Lanjut Nota Dinas" :items="breadcrumbs" />
    <!-- {{refData?.[0]?.final_pdf_url}} -->
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
                {{ refData?.[0].nomor || '-' }} • {{ formatDateRef(refData?.[0].tanggal) }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-chevron-down" class="w-5 h-5 text-gray-400 transition-transform duration-200"
              :class="{ 'rotate-180': isRefExpanded }" />
          </div>
        </div>

        <div v-show="isRefExpanded" class="bg-gray-100 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
          <div v-if="refPdfUrl" class="w-full">
            <iframe :src="`${refPdfUrl}#toolbar=0&navpanes=0`" class="w-full h-[500px] border-none"
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

      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
        </div>
        <USkeleton class="h-30 w-full rounded-md mt-4" />
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
          <TemplateManager :current-content="editorContent" @apply="handleApplyTemplate" />

          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">
              <div class="bg-white pt-10 pb-10 border-b border-gray-100 select-none text-black">
                <div class="bg-white px-8 pt-8 pb-4 border-b border-gray-100 select-none">
                  <div class="flex items-center pb-2 mb-6">
                    <div class="flex items-end gap-4">
                      <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
                      <div class="flex flex-col mb-1">
                        <span class="text-2xl font-bold tracking-wide text-[18px] text-black">AirNav Indonesia</span>
                      </div>
                    </div>
                    <div class="ml-auto text-[10px] leading-[1.1] text-gray-700 text-left">
                      <div class="font-bold uppercase">{{ user?.alamatInfo?.kantor }}</div>
                      <div>{{ user?.alamatInfo?.gedung }} {{ user?.alamatInfo?.kota }}</div>
                      <div v-html="user?.alamatInfo?.alamat"></div>
                    </div>
                  </div>
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

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import Editor from "@tinymce/tinymce-vue";

import { validateDraftPayload, type DraftPayload } from "~/types/nota-dinas";
import { Alert } from "@/composables/useAlert";
import { useInbox } from "@/composables/useInbox";

definePageMeta({ middleware: ["auth"] });

const route = useRoute();
const toast = useToast();
const alertState = useAlertState();

const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { getRecipients, getRecipientGroups } = useRecipients();
const { getDraftDetail } = useDraft();
const { generatePdf, sendNotaDinas, saveDraft: saveND } = useNotaDinas();
const { getConfigDigsig } = useDigsig();
const { fetchInboxDetail } = useInbox();

const isSignMethodModalOpen = ref(false);
const bsreDisabled = ref(false);
const qrDisabled = ref(false);
const basahDisabled = ref(false);
const signMethodModalRef = ref<any>(null);

const {
  isLoadingData, loadingMessage, isOpenPreview,
  editDraftId, subject, editorContent, tinymceEditor,
  date, selectedKlasifikasiId, selectedSifat, existingFiles,
  klasifikasiList, klasifikasiStatus,
  selectedTertuju, selectedTembusan,
  recipientGroups,
  pdfBlob, pdfUrl,
  maxPerihal, sifatOptions, tinyMceInit,
  selectedKlasifikasi, formattedDate, tglDb, tglDisplay,
  excludeTertujuList, excludeTembusanList,
  tertujuIndividu, tembusanIndividu, tertujuGrup, tembusanGrup,
  handleApplyTemplate, buildFormData,
  mapApiToUI, mergeGrupDanIndividu, mapGroupsToUI,
  mapLampiranFiles, setDateFromString, setSifatFromString,
  setPdfBlob, revokePdfUrl,
  confirmSaveDraft,
  toastError, toastSuccess,
  redirectTerkirim, redirectDraf,
} = useTulis();

// ── Lanjut-ND specific state ──────────────────────────────────────────────────
const items = ref<any[]>([]);
const selectedSendType = ref("qr_only");
const refData = ref<any>(null);
const isRefExpanded = ref(false);

const breadcrumbs = computed(() => {
  const refId = route.query.ref_id as string || "";
  const refJenis = route.query.ref_jenis as string || "";
  return [
    { label: "Beranda", to: "/beranda" },
    { label: "Kotak Masuk", to: "/korespondensi/kotak-masuk" },
    { label: "Detail Surat", to: `/korespondensi/kotak-masuk/${refId}?jenis=${refJenis}` },
    { label: "Tulis Lanjut Nota Dinas", to: "#" },
  ];
});

const signerInfo = computed(() => ({
  name: user.value?.nama || "Nama Lengkap",
  role: user.value?.positionText || "Jabatan",
  label: "Ditandatangani secara digital oleh",
}));

const refPdfUrl = computed(() => {
  if (!refData.value?.length) return "";
  const item = refData.value[0];
  if (item.final_pdf_url) return item.final_pdf_url;
  if (item.lampiran_files?.length) {
    const f = item.lampiran_files[0];
    return f.file_url || f.file_path || f.url || "";
  }
  return "";
});

const formatDateRef = (dateString: string) => {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return dateString; }
};

// ── Payload ───────────────────────────────────────────────────────────────────

const validateAndToast = (payload: DraftPayload) => {
  // Debug: lihat field mana yang null
  console.log('Payload sebelum validasi:', JSON.stringify(payload, null, 2));

  const result = validateDraftPayload(payload);
  if (!result.isValid) {
    console.log('Validation errors:', result.errors);
    const firstError = Object.values(result.errors ?? {})[0] ?? "Terjadi kesalahan input";
    toastError("Validasi Gagal", firstError);
    return false;
  }
  return true;
};

const getBasePayload = (): DraftPayload => ({
  id_naskah: editDraftId.value || null,
  id_referensi_naskah: (route.query.ref_id as string) || null, // ← tetap ada
  pengirim: user.value?.position || "",
  penerima: tertujuIndividu.value,
  tembusan: tembusanIndividu.value,
  penerima_grup: tertujuGrup.value,
  tembusan_grup: tembusanGrup.value,
  klasifikasi: selectedKlasifikasi.value?.klasifikasi || "",
  klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || "",
  sifat: selectedSifat.value?.value || "biasa",
  perihal: subject.value,
  konten: String(editorContent.value || ""),
  htmlContent: String(editorContent.value || ""),
  english: false,
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

// ── Handlers ──────────────────────────────────────────────────────────────────

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

const handleConfirmSaveDraft = () => confirmSaveDraft(handleSaveDraft);

const handleKirimDokumen = async (passphrase = "", fileBasah?: File) => {
  if (selectedSendType.value === "digsig" && !passphrase.trim()) {
    signMethodModalRef.value?.setPassphraseError("Harap masukkan passphrase Anda");
    return;
  }

  const payload = getBasePayload();
  loadingMessage.value = "Mengirim Nota Dinas...";
  isLoadingData.value = true;
  try {
    const blob = await generatePdf(createFormData(payload, false));
    setPdfBlob(blob);

    const fd = createFormData(payload, true);
    fd.append("passphrase", passphrase);
    fd.append("sign_option", selectedSendType.value);

    if (selectedSendType.value === "digsig") {
      if (!user.value?.nik) throw new Error("NIK pengguna tidak ditemukan untuk TTE.");
      fd.append("nik", user.value.nik);
    }

    if (selectedSendType.value === "basah" && fileBasah) {
      fd.append("file_ttd_basah", fileBasah);
    }

    const result = await sendNotaDinas(fd);
    if (result.data.success) {
      revokePdfUrl();
      toastSuccess("Berhasil", "Nota Dinas berhasil dikirim");
      Alert.close();
      redirectTerkirim();
    } else {
      throw new Error(result.data.message || "Pengiriman gagal");
    }
  } catch (e: any) {
    Alert.close();
    const errMsg = e.response?.data?.message || e.message || "Gagal mengirim dokumen";
    if (errMsg.toLowerCase().includes("passphrase") || errMsg.toLowerCase().includes("salah")) {
      bsreDisabled.value = false;
      await nextTick();
      isSignMethodModalOpen.value = true;
      await nextTick();
      signMethodModalRef.value?.setPassphraseError(errMsg);
    } else {
      toastError("Gagal Mengirim", errMsg);
    }
  } finally {
    isLoadingData.value = false;
  }
};

const handleConfirmKirim = async () => {
  const payload = getBasePayload();
  if (!validateAndToast(payload)) return;

  let configData = { digsig: false, ttdQr: false, ttdBasah: false };
  try {
    const res = await getConfigDigsig("ND");
    configData = {
      digsig: res?.data?.digsig ?? false,
      ttdQr: res?.data?.ttdQr ?? false,
      ttdBasah: res?.data?.ttdBasah ?? false,
    };
  } catch { /* semua false jika gagal fetch */ }

  bsreDisabled.value = !configData.digsig;
  qrDisabled.value = !configData.ttdQr;
  basahDisabled.value = !configData.ttdBasah;
  isSignMethodModalOpen.value = true;
};

const handleSignMethodSubmit = async (data: { method: string; passphrase?: string; file?: File | null }) => {
  selectedSendType.value = data.method;
  await handleKirimDokumen(data.passphrase || "", data.file ?? undefined);
};

// ── onMounted ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  loadingMessage.value = "Memuat...";
  isLoadingData.value = true;

  if (!user.value) await getProfile();

  const refId = route.query.ref_id as string;
  const refJenis = route.query.ref_jenis as string;
  if (refId) {
    try {
      const result = await fetchInboxDetail(refId, refJenis);
      if (result) {
        // Normalisasi: pastikan selalu array
        refData.value = Array.isArray(result) ? result : [result];
      } else {
        toast.add({ title: "Info", description: "Data referensi tidak ditemukan", color: "gray" });
      }
    } catch {
      toast.add({ title: "Error", description: "Gagal memuat data referensi", color: "error" });
    }
  }

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
