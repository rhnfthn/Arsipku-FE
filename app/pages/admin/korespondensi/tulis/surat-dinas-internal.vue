<template>
  <div class="relative">

    <div v-if="isLoadingData"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/20 backdrop-blur-[2px] transition-all">
      <div
        class="flex flex-col items-center gap-3 p-5 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700">
        <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
        <span class="text-gray-700 dark:text-gray-200 font-medium text-sm">
          {{ loadingMessage || 'Mohon Tunggu...' }}
        </span>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden transition-colors">
      <PageHeader title="Tulis Surat Dinas Internal" :items="breadcrumbs" />
    </div>

    <UCard variant="soft" :ui="{
      root: 'rounded-t-none ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors',
    }">
      <div class="flex-1 overflow-y-auto space-y-1">

        <TulisInputKlasifikasi v-model="selectedKlasifikasiId" :items="klasifikasiList || []"
          :loading="klasifikasiStatus === 'loading'" />

        <TulisInputTanggal v-model="date" label="Tanggal Surat" />

        <TulisInputSifat v-model="selectedSifat" />

        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Pilih Tertuju" :items="tertujuItems"
          :exclude-items="selectedTembusan" disabled-message="Sudah dipilih di Tembusan" />

        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Pilih Tembusan"
          :items="tembusanItems" :exclude-items="selectedTertuju" disabled-message="Sudah dipilih di Tertuju" />

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
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

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Lampiran</span>
            <div class="flex items-center flex-1 w-full gap-2">

              <input type="text" v-model="lampiranText" :maxlength="maxPerihal"
                class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
                placeholder="Ketik Lampiran" />

              <span class="text-[10px] font-mono shrink-0 transition-colors"
                :class="lampiranText.length >= maxPerihal ? 'text-red-500 font-bold' : 'text-gray-400'">
                {{ lampiranText.length }}/{{ maxPerihal }}
              </span>

            </div>
          </div>
        </div>

        <div class="flex flex-col py-4">
          <TemplateManager :current-content="editorContent" @apply="handleApplyTemplate" />

          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 dark:bg-gray-800 transition-all duration-300 relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mt-6 font-['Times_New_Roman']">

              <div
                class="bg-white dark:bg-gray-900 pt-10 pb-10 border-b border-gray-100 dark:border-gray-700 select-none text-black dark:text-white min-h-[1000px]">

                <div class="flex items-center pb-4 mb-6 px-10">
                  <div class="flex items-end gap-4">
                    <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
                    <div class="flex flex-col mb-1">
                      <span class="text-2xl font-bold tracking-wide text-[18px]">AirNav Indonesia</span>
                    </div>
                  </div>
                  <div class="ml-auto text-[10px] leading-[1.1] text-right">
                    <div class="font-bold">{{ user?.areaText || 'Kantor Pusat Perum LPPNPI' }}</div>
                    <div>Gedung AirNav Indonesia</div>
                    <div>Jl. Ir. H. Juanda, Tangerang 15121</div>
                    <div>Banten – Indonesia</div>
                    <div>Telp: 021-5591 5000</div>
                    <div>Fax: 021-5591 5100</div>
                    <div>www.airnavindonesia.co.id</div>
                  </div>
                </div>

                <div class="flex mb-4 text-[14px] px-10">
                  <div>{{ user?.areaText || "Tangerang" }}, {{ formattedDate }}</div>
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
                          <td class="align-top font-bold text-justify">
                            {{ subject || "................................................" }}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div class="mt-5">Kepada Yth.</div>
                    <div class="font-bold mb-1">
                      <div v-if="selectedTertuju.length > 0">
                        <div v-for="(p, idx) in selectedTertuju" :key="idx" class="leading-relaxed">
                          {{ p.labelJob || p.label }}
                        </div>
                      </div>
                      <div v-else>................................................</div>
                    </div>
                    <div class="mb-1">Di Tempat</div>
                  </div>
                </div>

                <div class="min-h-[300px] relative group">
                  <Editor api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" />

                  <div v-if="!editorContent"
                    class="absolute top-0 left-10 text-gray-400 pointer-events-none italic z-0 mt-2">
                    Ketik isi surat di sini...
                  </div>
                </div>

                <div class="flex justify-end mt-12 text-black dark:text-white px-10">
                  <div class="text-center min-w-[250px]">
                    <div class="mb-24 text-[14px]">
                      <div class="font-bold">{{ user?.positionText || 'Nama Jabatan' }}</div>
                    </div>
                    <div class="font-bold text-[14px] underline">{{ user?.nama || 'Nama Lengkap' }}</div>
                  </div>
                </div>

                <div class="mt-8 text-[12px] text-black dark:text-white px-10" v-if="selectedTembusan.length > 0">
                  <div class="font-bold underline mb-1">Tembusan :</div>
                  <ol class="list-decimal ml-4 pl-2">
                    <li v-for="t in selectedTembusan" :key="t.value">{{ t.labelJob || t.label }}</li>
                  </ol>
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

    <USlideover v-model:open="isOpenPreview" title="Pratinjau" side="bottom" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0',
      footer: 'p-4 border-t border-gray-200 dark:border-gray-800',
    }">
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full rounded-lg shadow-lg border border-gray-200" />
          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500">Memuat...</span>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex gap-4 w-full">
          <UButton label="Simpan Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text"
            class="px-8" :loading="isLoadingData" @click="confirmSaveDraft" />
          <UButton label="Kirim Dokumen" color="primary" size="lg" icon="i-heroicons-paper-airplane"
            class="px-8 font-bold" :loading="isLoadingData" @click="confirmKirimDokumen" />
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/* 1. IMPORTS & SETUP                                                         */
/* -------------------------------------------------------------------------- */
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from "@internationalized/date";
import Editor from '@tinymce/tinymce-vue';
import type { Editor as TinyMCEEditor } from 'tinymce';

// Components
import TulisInputKlasifikasi from "@/components/Tulis/InputKlasifikasi.vue";
import TulisInputLampiran from "@/components/Tulis/InputLampiran.vue";
import TulisInputSifat from "@/components/Tulis/InputSifat.vue";
import TulisInputPenerima from "@/components/Tulis/InputPenerima.vue";
import TulisInputTanggal from "@/components/Tulis/InputTanggal.vue";
import TemplateManager from '@/components/Tulis/TemplateManager.vue';

// Types & Validation
import type { Klasifikasi } from "~/types/klasifikasi";
import { validateSDIPayload, type SDIPayload } from "~/types/sdi";

// Config
const route = useRoute();
const router = useRouter();
const toast = useToast();
const alertState = useAlertState(); // Asumsi ada global alert state

const { user, getProfile } = useAuth();
const { getKlasifikasi } = useKlasifikasi();
const { getDraftDetail } = useDraft(); // Asumsi generic draft logic
const { getRecipients, sendSDI, saveDraft, sendDraft, generatePdf } = useSDI();

const breadcrumbs = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Tulis Surat Dinas Internal", to: "#" },
];

const maxPerihal = 200;

/* -------------------------------------------------------------------------- */
/* 2. STATE                                                                   */
/* -------------------------------------------------------------------------- */
const isLoadingData = ref(false);
const loadingMessage = ref("");
const isOpenPreview = ref(false);

const editDraftId = ref<string | null>(null);
const subject = ref("");
const lampiranText = ref("");
const editorContent = ref("");
const tinymceEditor = ref<TinyMCEEditor | null>(null);

// Date (Default Today)
const today = new Date();
const date = ref<CalendarDate>(new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()));

// Classification & Files
const klasifikasiList = ref<Klasifikasi[]>([]);
const klasifikasiStatus = ref("idle");
const selectedKlasifikasiId = ref<string | null>(null);
const existingFiles = ref<any[]>([]);

// Selection
const tertujuItems = ref<any[]>([]);
const tembusanItems = ref<any[]>([]);
const selectedTertuju = ref<any[]>([]);
const selectedTembusan = ref<any[]>([]);
const selectedSifat = ref<any>(null); // {label: 'Biasa', value: 'biasa'}

// PDF
const pdfBlob = ref<Blob | null>(null);
const pdfUrl = ref("");

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

/* -------------------------------------------------------------------------- */
/* 3. COMPUTED & HELPERS                                                      */
/* -------------------------------------------------------------------------- */
const selectedKlasifikasi = computed(() =>
  klasifikasiList.value.find((b) => b.id === selectedKlasifikasiId.value)
);

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

// GENERATE PAYLOAD
const getPayload = (): SDIPayload => {
  const tglDb = `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`;
  const tglDisplay = `${String(date.value.day).padStart(2, "0")}/${String(date.value.month).padStart(2, "0")}/${date.value.year}`;

  return {
    id_naskah: editDraftId.value || null,
    pengirim: user.value?.position || "",
    tertuju: selectedTertuju.value.map(i => i.value),
    tembusan: selectedTembusan.value.map(i => i.value),

    klasifikasi: selectedKlasifikasi.value?.klasifikasi || "",
    klasifikasi_text: selectedKlasifikasi.value?.klasifikasi_text || "",

    sifat: selectedSifat.value?.value || "biasa",
    perihal: subject.value,
    lampiran: lampiranText.value,
    konten: editorContent.value,
    english: false,

    nama_tempat: user.value?.areaText || "Tangerang",
    nama_jabatan: user.value?.positionText || "",
    nama_lengkap: user.value?.nama || "",

    tgl: tglDb,
    tanggal: tglDisplay, // UI Helper
    lampiran_temp_ids: existingFiles.value.map(f => f.id).filter(id => !!id)
  };
};

const createFormData = (payload: SDIPayload, includePdf: boolean = false) => {
  const formData = new FormData();

  Object.keys(payload).forEach((key) => {
    const k = key as keyof SDIPayload;

    // ✅ TAMBAHAN: Skip key 'tanggal' agar backend tidak error
    if (k === 'tanggal') return;

    const value = payload[k];
    if (Array.isArray(value)) {
      formData.append(k, JSON.stringify(value));
    } else if (value !== null && value !== undefined) {
      formData.append(k, String(value));
    }
  });

  if (includePdf && pdfBlob.value) {
    // Tambahkan fallback jika perihal kosong agar tidak error di .replace
    const judul = payload.perihal || 'dokumen';
    const safeName = judul.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
    formData.append("final_pdf", pdfBlob.value, `SDI_${safeName}.pdf`);
  }

  return formData;
};

const validateAndToast = (payload: SDIPayload) => {
  const check = validateSDIPayload(payload);
  if (!check.isValid) {
    const firstKey = Object.keys(check.errors)[0];
    toast.add({ title: 'Validasi Gagal', description: check.errors[firstKey], color: 'error' });
    return false;
  }
  return true;
};

/* -------------------------------------------------------------------------- */
/* 4. ACTIONS                                                                 */
/* -------------------------------------------------------------------------- */
const handleApplyTemplate = (content: string) => {
  if (tinymceEditor.value) tinymceEditor.value.setContent(content);
  editorContent.value = content;
};

const handlePreview = async () => {
  const payload = getPayload();
  if (!validateAndToast(payload)) return;

  isLoadingData.value = true;
  loadingMessage.value = "Membuat Pratinjau...";
  try {
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
    const fd = createFormData(payload, false);
    const blob = await generatePdf(fd);

    pdfBlob.value = new Blob([blob], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(pdfBlob.value);
    isOpenPreview.value = true;
  } catch (err) {
    console.error(err);
    toast.add({ title: 'Gagal membuat preview', color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const confirmKirimDokumen = async () => {
  // Logic confirm dialog disini (bisa pakai window.confirm atau custom component)
  if (!confirm("Apakah Anda yakin ingin mengirim dokumen ini?")) return;

  const payload = getPayload();
  isLoadingData.value = true;
  loadingMessage.value = "Mengirim...";

  try {
    // Regenerate PDF untuk memastikan konten terbaru
    const fdPreview = createFormData(payload, false);
    const blob = await generatePdf(fdPreview);
    pdfBlob.value = new Blob([blob], { type: 'application/pdf' });

    // Kirim Final
    const fdFinal = createFormData(payload, true);
    let res;

    if (editDraftId.value) {
      // Jika dari draft, pake endpoint PUT send-draft
      res = await sendDraft(fdFinal, editDraftId.value);
    } else {
      // Jika baru
      res = await sendSDI(fdFinal);
    }

    if (res?.success || res?.data?.success) {
      toast.add({ title: 'Berhasil', description: 'Surat Dinas Internal terkirim', color: 'success' });
      router.push("/admin/korespondensi/terkirim");
    }
  } catch (e: any) {
    toast.add({ title: 'Gagal Mengirim', description: e.response?.data?.message, color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

const confirmSaveDraft = async () => {
  const payload = getPayload();
  isLoadingData.value = true;
  loadingMessage.value = "Menyimpan Draft...";

  try {
    const fd = createFormData(payload, false); // Draft tidak wajib PDF binary
    await saveDraft(fd, editDraftId.value);
    toast.add({ title: 'Draft Disimpan', color: 'success' });
    router.push("/admin/korespondensi/draft");
  } catch (e: any) {
    toast.add({ title: 'Gagal Simpan Draft', description: e.response?.data?.message, color: 'error' });
  } finally {
    isLoadingData.value = false;
  }
};

/* -------------------------------------------------------------------------- */
/* 5. LIFECYCLE                                                               */
/* -------------------------------------------------------------------------- */
onMounted(async () => {
  isLoadingData.value = true;
  if (!user.value) await getProfile();

  try {
    klasifikasiStatus.value = "loading";
    const [klasRes, recRes] = await Promise.all([
      getKlasifikasi(),
      getRecipients(user.value?.position)
    ]);

    klasifikasiList.value = klasRes;

    // recRes.recipients sudah berupa array flat dengan property 'group' (REKAN, TEMBUSAN, dll)
    // hasil dari normalizeRecipients di useSDI
    const rawRec = recRes.recipients || [];

    // 1. Helper Mapping ke format UI Dropdown
    const mapToOption = (r: any) => ({
      label: `${r.persnum_person_text || r.persnum} - (${r.position_abbreviation || r.abbreviation}) ${r.position_text || r.positionText}`,
      labelJob: r.position_text || r.positionText,
      value: String(r.position || r.position_id || r.id),
      group: r.group, // Penting untuk filtering
      raw: r
    });

    // 2. Map semua data dulu
    const allMapped = rawRec.map(mapToOption);

    // 3. Filter untuk TERTUJU (Hanya REKAN)
    // Sesuaikan string 'REKAN' dengan key JSON response Anda
    tertujuItems.value = allMapped.filter(i => i.group === 'REKAN');

    // 4. Filter untuk TEMBUSAN (Merge REKAN + TEMBUSAN)
    tembusanItems.value = allMapped.filter(i => i.group === 'REKAN' || i.group === 'TEMBUSAN');

    klasifikasiStatus.value = "success";

    // ... (Logika load draft biarkan sama, tapi perbaiki pencarian masternya)
    // ...
    // Saat mapping draft, cari di 'allMapped' agar ketemu semua kemungkinan
    const mapApiToUI = (list: any[]) => {
      if (!list || list.length === 0) return [];
      return list.map(item => {
        const posId = String(item.position_id || item.position || item.value || item.id);
        // Cari di master list lengkap (allMapped)
        const master = allMapped.find(m => m.value === posId);
        if (master) return master;

        // Fallback
        return {
          label: `${item.persnum || ''} - ${item.positionText || item.labelJob || ''}`,
          labelJob: item.positionText || item.labelJob || item.label || '',
          value: posId,
          raw: item
        };
      });
    };
    // ...

  } catch (e) {
    console.error(e);
    // ...
  } finally {
    isLoadingData.value = false;
  }

  // Load Draft if exists (Logic similar to ND)
  const draftId = route.query.draft_id as string;
  if (draftId) {
    editDraftId.value = draftId;
    // ... (kode sebelumnya di dalam onMounted)

    // Load Draft Data if exists
    const draftId = route.query.draft_id as string;
    if (draftId) {
      try {
        loadingMessage.value = "Memuat data draft...";
        editDraftId.value = draftId;

        // Ambil detail draft
        const resDraft = await getDraftDetail(draftId);

        if (resDraft.success && resDraft.data) {
          const d = resDraft.data;

          // 1. Basic Fields (Perihal, Konten)
          subject.value = d.perihal || "";
          lampiranText.value = d.lampiran || "";
          editorContent.value = d.konten || "";
          // Update TinyMCE jika editor sudah siap
          if (tinymceEditor.value) {
            tinymceEditor.value.setContent(d.konten || "");
          }

          // 2. Klasifikasi
          // Mencari ID klasifikasi berdasarkan kode yang tersimpan
          if (d.klasifikasi) {
            const foundKlas = klasifikasiList.value.find(k => k.klasifikasi === d.klasifikasi);
            if (foundKlas) selectedKlasifikasiId.value = foundKlas.id;
          }

          // 3. Helper Mapping Recipient (API Object -> UI Dropdown Item)
          // Fungsi ini menangani jika data user belum ada di list 'items' awal
          const mapApiToUI = (list: any[]) => {
            if (!list || list.length === 0) return [];
            return list.map(item => {
              // Coba cari di master list 'items'
              const posId = String(item.position_id || item.position || item.value || item.id);
              const master = items.value.find(m => m.value === posId);

              if (master) return master;

              // Jika tidak ada di master list (misal pejabat lama), construct manual
              return {
                label: `${item.persnum || ''} - (${item.abbreviation || ''}) ${item.positionText || item.labelJob || ''}`,
                labelJob: item.positionText || item.labelJob || item.label || '',
                value: posId,
                raw: item
              };
            });
          };

          // 4. Set Tertuju & Tembusan
          selectedTertuju.value = mapApiToUI(d.tertuju);
          selectedTembusan.value = mapApiToUI(d.tembusan);

          // 5. Lampiran Files
          if (d.lampiran_files && Array.isArray(d.lampiran_files)) {
            existingFiles.value = d.lampiran_files.map((f: any) => ({
              id: f.id,
              fileName: f.fileName || f.file_name,
              filePath: f.fileUrl || f.file_path,
              fileSize: f.fileSize || 0
            }));
          }

          // 6. Sifat Surat
          // Kita definisikan opsi manual disini jika 'sifatOptions' tidak global
          const opsiSifat = [
            { label: "Sangat Rahasia", value: "sangat rahasia" },
            { label: "Rahasia", value: "rahasia" },
            { label: "Terbatas", value: "terbatas" },
            { label: "Biasa / Terbuka", value: "biasa" }
          ];
          const draftSifat = String(d.sifat || 'biasa').toLowerCase();
          selectedSifat.value = opsiSifat.find(opt => opt.value === draftSifat) || opsiSifat[3];

          // 7. Tanggal (Format: YYYY-MM-DD -> CalendarDate)
          if (d.tgl) {
            const parts = d.tgl.split('-');
            if (parts.length === 3) {
              date.value = new CalendarDate(Number(parts[0]), Number(parts[1]), Number(parts[2]));
            }
          }
        }
      } catch (error) {
        console.error("Error loading draft detail:", error);
        toast.add({ title: 'Gagal memuat data draft', color: 'error' });
      }
    }

    // Matikan loading setelah semua selesai
    isLoadingData.value = false;
  }
});
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}
</style>
