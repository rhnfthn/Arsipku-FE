<template>
  <div class="relative">
    <LoadingOverlay :loading="isLoadingData && loadingMessage !== 'Memuat...'" :message="loadingMessage" />
    <PageHeader title="Finalisasi Nota Dinas" :items="breadcrumbs" />

    <UCard variant="soft"
      :ui="{ root: 'rounded-t-lg ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors shadow-sm' }">

      <div v-if="isLoadingData && loadingMessage === 'Memuat...'" class="animate-pulse px-2 space-y-3">
        <div v-for="i in 6" :key="i" class="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-2">
          <USkeleton class="h-9 w-32 sm:w-40 shrink-0 rounded-md" />
          <USkeleton class="h-9 w-full sm:flex-1 rounded-md" />
        </div>
        <div class="border border-gray-200 dark:border-gray-700 rounded-lg h-[400px] p-6 space-y-5 bg-white dark:bg-gray-800">
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
      </div>

      <div v-else class="flex-1 overflow-y-auto space-y-1">
        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []"
          :loading="klasifikasiStatus === 'loading'" />
        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tertuju" :items="items"
          :groups="recipientGroups" :exclude-items="selectedTembusan" disabled-message="Sudah dipilih di Tembusan" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan" :items="items"
          :groups="recipientGroups" :exclude-items="selectedTertuju" disabled-message="Sudah dipilih di Tertuju" />

        <TulisInputSifat v-model="selectedSifat" />

        <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 gap-1 sm:gap-0">
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
            <div class="flex flex-col bg-gray-100 transition-all duration-300 relative border border-gray-200 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">
              <div class="bg-white pt-10 pb-10 border-b border-gray-100 select-none text-black">
                <div class="bg-white px-8 pt-8 pb-4 border-b border-gray-100 select-none">
                  <TulisKopSurat :alamat-info="user?.alamatInfo" />
                  <div class="text-center mb-6 text-black">
                    <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">NOTA DINAS</h1>
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
                        <td class="text-[14px] align-top">{{ subject || "................................................" }}</td>
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
                    <div v-else-if="selectedTembusan.length === 1" class="ml-4 pl-2">{{ selectedTembusan[0]?.labelJob || selectedTembusan[0]?.label }}</div>
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
                        <tr><td class="align-top pr-2">Lampiran Surat</td></tr>
                        <tr><td class="align-top pr-2">Nomor Surat :</td><td>.....................................</td></tr>
                        <tr><td class="align-top pr-2">Tanggal Surat :</td><td>{{ formattedDate }}</td></tr>
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

        <div class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center bg-white dark:bg-gray-800">
          <UButton label="Pratinjau & Finalisasi" color="primary" size="lg" icon="i-lucide-eye" class="px-8 font-bold"
            @click="handlePreview" />
        </div>
      </div>
    </UCard>

    <TulisPreviewSlideover v-model:open="isOpenPreview" :pdf-url="pdfUrl" :alert-is-open="alertState.isOpen"
      :show-save-draft="false" @send="handleConfirmFinalize" />

    <TulisDigsigPassphraseModal v-model:open="isSignMethodModalOpen" :signer-info="signerInfo"
      :is-loading="isLoadingData" :hide-bsre="bsreDisabled" :hide-qr="qrDisabled" :hide-basah="basahDisabled"
      ref="signMethodModalRef" @submit="handleFinalizeSubmit" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CalendarDate } from "@internationalized/date";
import Editor from "@tinymce/tinymce-vue";
import type { Editor as TinyMCEEditor } from 'tinymce';

import TulisInputKlasifikasi from "@/components/Tulis/InputKlasifikasi.vue";
import TulisInputLampiran from "@/components/Tulis/InputLampiran.vue";
import TulisInputSifat from "@/components/Tulis/InputSifat.vue";
import TulisInputPenerima from "@/components/Tulis/InputPenerima.vue";
import TulisInputTanggal from "@/components/Tulis/InputTanggal.vue";

import { validateDraftPayload, type DraftPayload } from "~/types/nota-dinas";
import { Alert } from "@/composables/useAlert";

import { useDigSign } from "@/composables/useDigSign";
import { useInbox } from "@/composables/useInbox";
import { useRecipients } from "@/composables/useRecipients";
import { useKonsep } from "@/composables/useKonsep";

definePageMeta({ middleware: "auth" });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const alertState = useAlertState();

// Composables Setup
const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { getRecipients, getRecipientGroups } = useRecipients();
const { generatePdf } = useNotaDinas();
const { getKtp } = useDigSign();
const { fetchKonsepDetail } = useInbox();
const { finalizeKonsep } = useKonsep();

/* --- LOCAL STATES --- */
const isLoadingData = ref(false);
const loadingMessage = ref("");
const isOpenPreview = ref(false);
const isSignMethodModalOpen = ref(false);
const signMethodModalRef = ref<any>(null);

const bsreDisabled = ref(false);
const qrDisabled = ref(false);
const basahDisabled = ref(false);
const selectedSendType = ref("qr_only");

const editDraftId = ref<string | null>(null);
const subject = ref("");
const editorContent = ref("");
const english = ref(false);
const tinymceEditor = ref<TinyMCEEditor | null>(null);

const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));

const klasifikasiList = ref<any[]>([]);
const klasifikasiStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const selectedKlasifikasiId = ref<string | null>(null);
const existingFiles = ref<any[]>([]);

const selectedSifat = ref<any>(null);
const items = ref<any[]>([]);
const recipientGroups = ref<any[]>([]);
const selectedTertuju = ref<any[]>([]);
const selectedTembusan = ref<any[]>([]);

const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");
const maxPerihal = 200;

const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Finalisasi Surat Dinas Eksternal", to: "#" },
];

const sifatOptions = [
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

/* --- COMPUTEDS --- */
const isFinalizeMode = computed(() => route.query.action === 'finalize' && !!route.query.ref_id);

const selectedKlasifikasi = computed(() =>
  klasifikasiList.value.find((b) => b.id === selectedKlasifikasiId.value)
);

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

const excludeTertujuList = computed(() => selectedTembusan.value || []);
const excludeTembusanList = computed(() => selectedTertuju.value || []);

const signerInfo = computed(() => ({
  name: user.value?.nama || "Nama Lengkap",
  role: user.value?.positionText || "Jabatan",
  label: "Ditandatangani secara digital oleh",
}));

/* --- HELPERS & MAPPERS --- */
const handleApplyTemplate = (htmlContent: string) => {
  if (tinymceEditor.value) {
    const cleanContent = htmlContent.trim().replace(/>\s+</g, '><');
    tinymceEditor.value.setContent(cleanContent);
    editorContent.value = tinymceEditor.value.getContent();
  }
};

const mapApiToUI = (list: any[]) => {
  if (!list || !Array.isArray(list)) return [];
  return list.map((item) => {
    const posId = String(item.position_id || item.position || item.value || item.id || item);
    const master = items.value.find((m) => m.value === posId);
    if (master) return master;

    const posText = item.position_text || item.positionText || item.labelJob || item.label || posId;
    return {
      label: posText !== posId ? `${item.persnum || ""} - (${item.abbreviation || ""}) ${posText}` : posId,
      labelJob: posText,
      value: posId,
      raw: item,
    };
  });
};

const mapGroupsToUI = (grupList: any[]) => {
  if (!grupList || !Array.isArray(grupList)) return [];
  return grupList.map(g => {
    const groupId = String(g.group_id || g.id || g.value);
    const master = recipientGroups.value.find(mg => String(mg.id) === groupId);
    return master ? { label: master.nama, labelJob: master.nama, value: `GROUP_${master.id}`, isGroup: true, raw: master } : null;
  }).filter(Boolean);
};

// Payload Standard untuk validasi dan Pratinjau
const getBasePayload = (): DraftPayload => {
  const tglDb = date.value ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}` : "";
  const tglPreview = date.value ? `${String(date.value.day).padStart(2, "0")}/${String(date.value.month).padStart(2, "0")}/${date.value.year}` : "";
  const lampiranIds = existingFiles.value.map((f) => f.id).filter(Boolean);

  return {
    id_naskah: editDraftId.value || null,
    pengirim: user.value?.position || "",
    penerima: selectedTertuju.value.filter(t => !t.isGroup).map(i => i.value),
    tembusan: selectedTembusan.value.filter(t => !t.isGroup).map(i => i.value),
    tertuju: selectedTertuju.value.map(i => i.labelJob || i.label),
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

const createFinalizeFormData = () => {
  const formData = new FormData();
  const tglDb = date.value ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}` : "";
  const userPosition = user.value?.position || "";
  const lampiranIds = existingFiles.value.map(f => f.id).filter(Boolean);

  formData.append("jenis", "ND");
  formData.append("from_position_id", userPosition);
  formData.append("to_position_id", userPosition);
  formData.append("pengirim_position_id", userPosition);

  formData.append("penerima_position_ids", JSON.stringify(selectedTertuju.value.filter(t => !t.isGroup).map(i => i.value)));
  formData.append("tembusan_position_ids", JSON.stringify(selectedTembusan.value.filter(t => !t.isGroup).map(i => i.value)));

  formData.append("tembusan_grup", JSON.stringify(selectedTertuju.value.filter(t => t.isGroup).map(i => String(i.value).replace('GROUP_', ''))));
  formData.append("penerima_grup", JSON.stringify(selectedTembusan.value.filter(t => t.isGroup).map(i => String(i.value).replace('GROUP_', ''))));

  formData.append("tgl", tglDb);
  formData.append("klasifikasi", selectedKlasifikasi.value?.klasifikasi || "");
  formData.append("klasifikasi_text", selectedKlasifikasi.value?.klasifikasi_text || "");
  formData.append("sifat", selectedSifat.value?.value || "biasa");
  formData.append("perihal", subject.value);
  formData.append("konten", String(editorContent.value || ''));
  formData.append("english", english.value ? "1" : "0");
  formData.append("nama_tempat", user.value?.areaText || "Kantor Pusat");
  formData.append("nama_jabatan", user.value?.positionText || "");
  formData.append("nama_lengkap", user.value?.nama || "");
  formData.append("lampiran_temp_ids", JSON.stringify(lampiranIds));
  formData.append("lampiran", lampiranIds.length > 0 ? "1" : "0");

  return formData;
};

/* --- EVENT HANDLERS --- */
const handlePreview = async () => {
  const payload = getBasePayload();
  const validationResult = validateDraftPayload(payload);
  if (!validationResult.isValid) {
    const errorMsg = Object.values(validationResult.errors || {})[0] || "Terjadi kesalahan input";
    toast.add({ title: 'Validasi Gagal', description: errorMsg, color: 'error' });
    return;
  }

  loadingMessage.value = "Memproses Pratinjau...";
  isLoadingData.value = true;
  try {
    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      const value = (payload as any)[key];
      if (Array.isArray(value)) formData.append(key, JSON.stringify(value));
      else if (value !== null && value !== undefined) formData.append(key, String(value));
    });

    const blobResponse = await generatePdf(formData);
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    pdfBlob.value = new Blob([blobResponse], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(pdfBlob.value);
    isOpenPreview.value = true;
  } catch (err) {
    toast.add({ title: 'Gagal Preview', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const handleConfirmFinalize = async () => {
  bsreDisabled.value = false;
  qrDisabled.value = false;
  basahDisabled.value = false;
  isSignMethodModalOpen.value = true;
};

const handleFinalizeSubmit = async (data: { method: string; passphrase?: string }) => {
  selectedSendType.value = data.method;

  if (selectedSendType.value === 'digsig' && (!data.passphrase || !data.passphrase.trim())) {
    signMethodModalRef.value?.setPassphraseError('Harap masukkan passphrase Anda');
    return;
  }

  loadingMessage.value = "Memfinalisasi Dokumen...";
  isLoadingData.value = true;

  try {
    let noktpValue = '';
    if (selectedSendType.value === 'digsig') {
      const ktpRes = await getKtp();
      if (ktpRes?.data?.noktp) noktpValue = ktpRes.data.noktp;
      else if (user.value?.nik) noktpValue = user.value.nik;
    }

    const fd = createFinalizeFormData();
    fd.append("sign_option", selectedSendType.value);
    if (selectedSendType.value === 'digsig') {
      fd.append("passphrase", data.passphrase || '');
      if (noktpValue) fd.append("nik", noktpValue);
    }

    if (!editDraftId.value) throw new Error("ID Konsep tidak ditemukan");

    const result = await finalizeKonsep(editDraftId.value, fd);

    if (result && (result.success || result.data?.success)) {
      if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
      toast.add({ title: 'Berhasil', description: 'Konsep berhasil difinalisasi', color: 'success' });
      Alert.close();
      router.push("/korespondensi/terkirim");
    } else {
      throw new Error(result?.message || result?.data?.message || "Finalisasi gagal");
    }
  } catch (e: any) {
    Alert.close();
    const errMsg = e.response?.data?.message || e.message || "Gagal memproses dokumen";

    if (errMsg.toLowerCase().includes('passphrase') || errMsg.toLowerCase().includes('salah')) {
      bsreDisabled.value = false;
      await nextTick();
      isSignMethodModalOpen.value = true;
      await nextTick();
      signMethodModalRef.value?.setPassphraseError(errMsg);
    } else {
      toast.add({ title: 'Gagal Memfinalisasi', description: errMsg, color: 'error' });
      isSignMethodModalOpen.value = false;
    }
  } finally {
    isLoadingData.value = false;
  }
};

/* --- ON MOUNTED --- */
onMounted(async () => {
  loadingMessage.value = "Memuat...";
  isLoadingData.value = true;

  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";
    const [klasRes, recRes, groupsRes] = await Promise.all([
      getKlasifikasi(),
      getRecipients(),
      getRecipientGroups().catch(() => [])
    ]);

    // Ekstrak langsung jika data terbungkus dalam properti .data
    klasifikasiList.value = Array.isArray(klasRes) ? klasRes : (klasRes?.data || klasRes?.klasifikasi || []);
    recipientGroups.value = Array.isArray(groupsRes) ? groupsRes.filter((g: any) => g.aktif) : [];

    const rawData = recRes.recipients || recRes.data || [];
    items.value = rawData.map((r: any) => ({
      label: `${r.persnum_person_text || r.persnum || "empty"} - (${r.position_abbreviation || r.abbreviation}) ${r.position_text || r.positionText}`,
      labelJob: r.position_text || r.positionText,
      value: String(r.position || r.position_id || r.id),
      raw: r,
    }));
    klasifikasiStatus.value = "success";
  } catch {
    klasifikasiStatus.value = "error";
  }

  const refId = route.query.ref_id as string;

  if (refId && isFinalizeMode.value) {
    try {
      editDraftId.value = refId;
      const resKonsep = await fetchKonsepDetail(refId);

      // JSON LOGIC FIX: Berdasarkan log Anda, data berada di root object lalu di dalam properti `.flow`
      const flowList = resKonsep?.flow || (resKonsep?.data && resKonsep.data.flow) || [];
      const rootData = resKonsep?.data || resKonsep;

      // Ambil elemen "Konsep" ("K") dari array flow
      let draftData = Array.isArray(flowList)
        ? flowList.find((d: any) => d.jenis === 'K')
        : null;

      // Fallback jika `.flow` tidak tersedia atau kosong, baca dari root
      if (!draftData) {
         draftData = Array.isArray(rootData)
            ? rootData.find((d: any) => d.jenis === 'K') || rootData[0]
            : rootData;
      }

      if (draftData) {
        console.log("Data Konsep Ditemukan:", draftData);

        // --- 1. Populate Text Editor & Basic ---
        subject.value = draftData.perihal || "";
        editorContent.value = draftData.konten || "";
        english.value = Boolean(draftData.english);

        // --- 2. Populate Klasifikasi ---
        if (draftData.klasifikasi) {
          const klCode = String(draftData.klasifikasi).trim();
          const found = klasifikasiList.value.find((k: any) =>
            k.klasifikasi === klCode || k.kode === klCode || k.id === klCode
          );
          if (found) {
            selectedKlasifikasiId.value = found.id;
          } else {
            // Pasang fallback kode asli jika UUID master belum cocok
            selectedKlasifikasiId.value = klCode;
          }
        }

        // FUNGSI NORMALISASI: mengubah API snake_case menjadi format mapApiToUI()
        const normalizeRecipients = (arr: any[]) => {
          if (!Array.isArray(arr)) return [];
          return arr.map(item => ({
            ...item,
            positionText: item.position_text || item.positionText || item.nama,
            position: item.position_id || item.position || item.id
          }));
        };

        // --- 3. Populate Penerima & Tembusan ---
        const detail = draftData.detail || {};

        // Gunakan properti .kepada jika ada (karena API juga memberikan rootData.kepada), fallback naskah_penerima
        const sourcePenerima = rootData.kepada?.length ? rootData.kepada :
                               detail.naskah_penerima?.length ? detail.naskah_penerima :
                               (draftData.penerima || []);

        const mappedPenerimaGrup = mapGroupsToUI(detail.penerima_grup || []) || [];
        const mappedPenerimaIndiv = mapApiToUI(normalizeRecipients(sourcePenerima)) || [];

        selectedTertuju.value = [...mappedPenerimaGrup, ...mappedPenerimaIndiv];

        const sourceTembusan = detail.naskah_tembusan?.length ? detail.naskah_tembusan : (draftData.tembusan || []);
        const mappedTembusanGrup = mapGroupsToUI(detail.tembusan_grup || []) || [];
        const mappedTembusanIndiv = mapApiToUI(normalizeRecipients(sourceTembusan)) || [];

        selectedTembusan.value = [...mappedTembusanGrup, ...mappedTembusanIndiv];

        // --- 4. Sisanya (Lampiran & Sifat) ---
        const lampiranSrc = draftData.lampiran_files || [];
        existingFiles.value = lampiranSrc.map((f: any) => ({
          id: f.id,
          fileName: f.fileName || f.file_name,
          filePath: f.fileUrl || f.file_path,
          fileSize: f.fileSize || 0
        }));

        const draftSifat = String(draftData.sifat || 'biasa').toLowerCase();
        selectedSifat.value = sifatOptions.find(opt => opt.value === draftSifat) || sifatOptions[3];

        if (draftData.tanggal) {
          const dateOnly = draftData.tanggal.split('T')[0];
          const parts = dateOnly.split('-');
          if (parts.length === 3) {
            date.value = new CalendarDate(Number(parts[0]), Number(parts[1]), Number(parts[2]));
          }
        }
      }
    } catch (error) {
      console.error("Gagal load konsep:", error);
      toast.add({ title: 'Gagal memuat data konsep', color: 'error' });
    }
  }

  isLoadingData.value = false;

  await nextTick();
  if (tinymceEditor.value && editorContent.value) {
    tinymceEditor.value.setContent(editorContent.value);
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
