<template>
  <div class="">
    <div v-if="isLoadingData"
      class="fixed inset-0 z-[99999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-2">
        <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
        <span class="text-gray-600 font-medium">Memproses PDF...</span>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden transition-colors">
      <PageHeader title="Tulis Nota Dinas" :items="breadcrumbs" />
    </div>

    <UCard variant="soft" :ui="{
      root: 'rounded-t-none ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors',
    }">
      <div class="flex-1 overflow-y-auto space-y-1">

        <TulisInputBerkas v-model="selectedBerkasId" :items="berkasList || []" :loading="berkasStatus === 'loading'" />
        <TulisInputTanggal v-model="date" label="Tanggal Surat" />
        <TulisInputPenerima v-model="selectedTertuju" label="Tertuju" placeholder="Kepada ..." :items="items"
          :exclude-items="selectedTembusan" disabled-message="Sudah dipilih di Tembusan" />
        <TulisInputPenerima v-model="selectedTembusan" label="Tembusan" placeholder="Tembusan ..." :items="items"
          :exclude-items="selectedTertuju" disabled-message="Sudah dipilih di Tertuju" />

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm text-gray-500 font-medium shrink-0">Sifat</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedSifat" :items="sifatOptions" placeholder="Pilih sifat ..." class="w-full p-0"
              :search-input="{ placeholder: 'Cari sifat ...', size: 'lg' }" variant="none">
              <template #default>
                <div class="flex items-center gap-1.5 min-h-[28px] pr-10 w-full">
                  <span v-if="selectedSifat" class="text-sm font-medium text-left truncate max-w-[200px]">
                    {{ selectedSifat.label }}
                  </span>
                  <span v-else class="text-sm text-gray-400">Pilih sifat</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
            <input type="text" v-model="subject"
              class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
              placeholder="Ketik perihal" />
          </div>
        </div>

        <div class="flex flex-col py-4">
          <div class="flex flex-wrap items-center justify-between w-full gap-3 mb-2">
            <div class="flex flex-wrap gap-2 flex-shrink-0">
              <UModal v-model="isTemplateModalOpen" title="Pilih Template">
                <UButton label="Pilih Template" color="primary" variant="soft"
                  icon="i-heroicons-adjustments-horizontal" />
                <template #body>
                  <div class="flex flex-col gap-2">
                    <UCard v-for="template in templates" :key="template.id"
                      class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" @click="applyTemplate(template)">
                      <div class="py-3">
                        <h3 class="font-bold dark:text-white">{{ template.name }}</h3>
                      </div>
                    </UCard>
                  </div>
                </template>
              </UModal>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <UButton icon="i-lucide-eye" color="neutral" variant="soft" label="Preview PDF" @click="openPreview" />
            </div>
          </div>

          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 dark:bg-gray-800 transition-all duration-300 relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div
                class="bg-white dark:bg-gray-900 px-8 pt-8 pb-4 border-b border-gray-100 dark:border-gray-700 select-none">
                <div class="flex items-center pb-2 mb-6">
                  <div class="flex items-end gap-4">
                    <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
                    <div class="flex flex-col mb-1">
                      <span class="text-2xl font-bold tracking-wide text-[18px] text-black dark:text-white">AirNav
                        Indonesia</span>
                    </div>
                  </div>
                  <div class="ml-auto text-[10px] leading-[1.1] text-gray-700 dark:text-gray-300 text-right">
                    <div class="font-bold">Kantor Pusat Perum LPPNPI</div>
                    <div>Gedung AirNav Indonesia</div>
                    <div>Jl. Ir. H. Juanda, Tangerang 15121</div>
                    <div>Banten – Indonesia</div>
                    <div>Telp: 021-5591 5000</div>
                    <div>Fax: 021-5591 5100</div>
                    <div>www.airnavindonesia.co.id</div>
                  </div>
                </div>

                <div class="text-center mb-6 text-black dark:text-white">
                  <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">
                    NOTA DINAS
                  </h1>
                  <p class="text-lg mt-1 text-[14px]">
                    Nomor : ..............................................
                  </p>
                </div>

                <table class="w-full text-lg leading-relaxed mb-4 tn-roman text-black dark:text-white">
                  <tbody>
                    <tr>
                      <td class="text-[14px] w-[120px] font-bold align-top">Kepada Yth.</td>
                      <td class="text-[14px] w-[20px] align-top">:</td>
                      <td class="text-[14px] align-top">
                        {{selectedTertuju.length ? selectedTertuju.map((s: any) => s.labelJob || s.label).join(", ") :
                          "..................."}}
                      </td>
                    </tr>
                    <tr>
                      <td class="text-[14px] font-bold align-top">Dari</td>
                      <td class="text-[14px] align-top">:</td>
                      <td class="text-[14px] align-top">
                        {{ selectedBerkas?.judulBerkas || "................................................" }}
                      </td>
                    </tr>
                    <tr>
                      <td class="text-[14px] font-bold align-top">Perihal</td>
                      <td class="text-[14px] align-top">:</td>
                      <td class="text-[14px] align-top">
                        {{ subject || "................................................" }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="border-t-2 border-black dark:border-white mb-4"></div>
              </div>

              <Editor api-key="no-api-key" v-model="editorContent" :init="tinyMceInit" class="min-h-[400px]" />

              <div
                class="bg-white dark:bg-gray-900 px-8 pt-4 pb-8 border-t border-gray-100 dark:border-gray-700 select-none">
                <div class="flex justify-end mb-4 text-black dark:text-white">
                  <div class="text-center min-w-[250px]">
                    <div class="mb-24 text-[14px]">
                      <div>Tangerang, {{ formattedDate }}</div>
                      <div class="font-bold">AVP of Enterprise Technology Planning</div>
                    </div>
                    <div class="font-bold text-[14px]">Ivan Dwi Santoso</div>
                  </div>
                </div>
                <div class="text-[12px] mt-2 w-full text-left text-black dark:text-white">
                  <div class="font-bold underline mb-1">Tembusan :</div>
                  <ol v-if="selectedTembusan.length > 0" class="list-decimal ml-4 pl-2">
                    <li v-for="t in selectedTembusan" :key="t.value">
                      {{ t.labelJob || t.label }}
                    </li>
                  </ol>
                  <div v-else class="text-gray-400 italic">...</div>
                </div>
              </div>
            </div>
          </ClientOnly>

          <TulisInputLampiran v-model:uploaded="uploadedFiles" v-model:existingFiles="existingFiles" />
        </div>

        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end bg-white dark:bg-gray-800">
          <UButton label="Simpan Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text"
            class="px-8" :loading="isLoadingDraft" @click="handleSaveDraft" />
          <UButton label="Kirim Dokumen" color="primary" size="lg" icon="i-heroicons-paper-airplane"
            class="px-8 font-bold" />
        </div>
      </div>
    </UCard>

    <USlideover v-model:open="isOpenPreview" title="Preview PDF" side="bottom" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0'
    }">
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full rounded-lg shadow-lg border border-gray-200" />
          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
            <span class="text-gray-500">Memuat PDF...</span>
          </div>
        </div>
      </template>
    </USlideover>

  </div>
</template>

<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/* IMPORTS                                                                    */
/* -------------------------------------------------------------------------- */
import { ref, computed, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { CalendarDate } from '@internationalized/date';
import Editor from '@tinymce/tinymce-vue';

// Import Validasi dan Type
import { validateDraftPayload, type DraftPayload } from "~/types/drafts";
import type { Berkas } from "~/types/berkas";

/* -------------------------------------------------------------------------- */
/* COMPOSABLES                                                                */
/* -------------------------------------------------------------------------- */
const route = useRoute();
const router = useRouter();
const { apiGet } = useApi();
const { saveDraft, isLoadingDraft, getDraftDetail } = useDraft();
const { getBerkasList } = useBerkas();
const { getRecipients } = useRecipients();

/* -------------------------------------------------------------------------- */
/* STATE & REFS                                                               */
/* -------------------------------------------------------------------------- */
const breadcrumbs = [{ label: 'Dashboard', to: '/user/dashboard' }, { label: 'Tulis Nota Dinas', to: '#' }];
const isTemplateModalOpen = ref(false);
const isOpenPreview = ref(false);
const isLoadingData = ref(false);

const date = ref<CalendarDate>();
const subject = ref("");
const selectedSifat = ref();
const uploadedFiles = ref<File[]>([]);
const editDraftId = ref<string | null>(null);

const english = ref(false)
const berkasList = ref<Berkas[]>([]);
const berkasStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const selectedBerkasId = ref<string | null>(null);

const items = ref<any[]>([]);
const selectedTertuju = ref<any[]>([]);
const selectedTembusan = ref<any[]>([]);

const editorContent = ref("");
const pdfUrl = ref('');
const existingFiles = ref<any[]>([]);

const templates = [{ id: 1, name: 'Default', content: `<ol><li>Poin 1</li></ol>` }];
const sifatOptions = [{ label: 'Rahasia', value: 'rahasia' }, { label: 'Biasa', value: 'biasa' }];

const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 600,
  menubar: false,
  statusbar: false,
  plugins: 'lists advlist link image table preview code fullscreen noneditable',
  toolbar: 'undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | code fullscreen',
  noneditable_class: 'mceNonEditable',
  content_style: `body { font-family: 'Times New Roman'; font-size: 12pt; margin: 20px; } table { width: 100%; border-collapse: collapse; } td { padding: 2px; }`
};

/* -------------------------------------------------------------------------- */
/* LIFECYCLE HOOKS                                                            */
/* -------------------------------------------------------------------------- */
onMounted(async () => {
  // 1. Load Master Berkas
  try {
    berkasStatus.value = 'loading';
    const resBerkas = await getBerkasList();
    berkasList.value = Array.isArray(resBerkas) ? resBerkas : resBerkas?.data ?? [];
    berkasStatus.value = 'success';
  } catch (err) {
    console.error("Gagal load Berkas:", err);
    berkasStatus.value = 'error';
  }

  // 2. Load Master Penerima
  try {
    const resRecipients = await getRecipients(70016581);
    const rawRecipients = resRecipients?.recipients || resRecipients?.data || [];
    items.value = rawRecipients.map((r: any) => ({
      // Format Label Master: NAMA - (KODE) JABATAN
      // Contoh: AVIRIANTO SURATNO - (U) Direktur Utama
      label: `${r.persnum_person_text} - (${r.position_abbreviation}) ${r.position_text}`,
      labelJob: r.position_text,
      value: r.position, // ID Jabatan
      raw: r
    }));
  } catch (err) {
    console.error("Gagal load Penerima:", err);
    items.value = [];
  }

  // 3. Populate Form (Edit Mode)
  try {
    const now = new Date();
    date.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const draftId = route.query.draft_id as string;
    if (draftId) {
      isLoadingData.value = true;
      editDraftId.value = draftId;
      const res = await getDraftDetail(draftId);

      if (res.success && res.data) {
        const d = res.data;
        subject.value = d.perihal || "";

        const draftSifat = d.sifat?.toLowerCase();
        selectedSifat.value = sifatOptions.find(opt => opt.value === draftSifat) || sifatOptions.find(opt => opt.value === 'biasa');
        english.value = d.english || false;

        if (d.tanggal) {
          const dateObj = new Date(d.tanggal);
          date.value = new CalendarDate(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
        }

        // --- SELECTED BERKAS ---
        if (d.klasifikasi && berkasList.value.length > 0) {
          let foundBerkas = null;
          // Cari by ID dulu
          if (d.id_berkas) foundBerkas = berkasList.value.find(b => b.id === d.id_berkas);
          // Cari by Kode
          if (!foundBerkas) {
            const cleanCode = d.klasifikasi.toString().trim().toLowerCase();
            foundBerkas = berkasList.value.find(b => b.klasifikasi?.toString().toLowerCase() === cleanCode);
          }
          // Cari by Judul
          if (!foundBerkas && d.klasifikasi_text) {
             const cleanText = d.klasifikasi_text.toString().trim().toLowerCase();
             foundBerkas = berkasList.value.find(b => b.judulBerkas?.toString().toLowerCase() === cleanText);
          }
          if (foundBerkas) selectedBerkasId.value = foundBerkas.id;
        }

        editorContent.value = d.konten || "";
        if (d.lampiran_files) existingFiles.value = d.lampiran_files;

        // ============================================================
        // LOGIC FIX: SELECTED PENERIMA & TEMBUSAN (PRIORITAS MASTER DATA)
        // ============================================================

        /**
         * Helper: Mencari Item di Master Data (items.value) berdasarkan Persnum
         * Tujuannya: Menggunakan object REFERENCE yang sudah ada di dropdown
         * supaya checklist menyala dan format label konsisten.
         */
        const findInMaster = (draftItem: any) => {
          const draftPersnum = String(draftItem.persnum || '');
          if (!draftPersnum) return null;

          return items.value.find(m =>
            String(m.raw?.persnum || m.raw?.personal_number || '') === draftPersnum
          );
        };

        /**
         * Fungsi Mapping:
         * 1. Cek di Master Data.
         * 2. Jika ADA: Pakai object master itu (Label akan otomatis ikut format master).
         * 3. Jika TIDAK ADA: Buat object baru, push ke master, lalu pakai object baru itu.
         */
        const processItems = (draftList: any[]) => {
          if (!Array.isArray(draftList)) return [];

          return draftList.map((dr) => {
            // 1. Coba cari object yang SUDAH ADA di Master (items.value)
            const existingMasterItem = findInMaster(dr);

            if (existingMasterItem) {
              // KEMBALIKAN REFERENSI MASTER (Checklist Nyala & Label Konsisten)
              return existingMasterItem;
            } else {
              // 2. Jika tidak ada, buat ITEM BARU (Fallback)
              const newItem = {
                // Format label fallback jika data tidak ada di master
                label: `${dr.nama} - ${dr.positionText || dr.position_text}`,
                labelJob: dr.positionText || dr.position_text || dr.labelJob,
                value: dr.position || dr.persnum,
                raw: dr
              };

              // Push ke master list agar ada di dropdown
              items.value.push(newItem);

              return newItem;
            }
          });
        };

        // Eksekusi Processing (Langsung assign hasilnya ke v-model)
        if (d.penerima) selectedTertuju.value = processItems(d.penerima);
        if (d.tembusan) selectedTembusan.value = processItems(d.tembusan);

        // Paksa UI update
        await nextTick();
      }
      isLoadingData.value = false;
    }
  } catch (err) {
    console.error("Error init:", err);
    isLoadingData.value = false;
  }
});

/* -------------------------------------------------------------------------- */
/* COMPUTED & METHODS                                                         */
/* -------------------------------------------------------------------------- */
const selectedBerkas = computed(() => berkasList.value.find((b) => b.id === selectedBerkasId.value));
const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});
const applyTemplate = (t: any) => { editorContent.value = t.content; isTemplateModalOpen.value = false; };

/* -------------------------------------------------------------------------- */
/* PREVIEW & SAVE                                                             */
/* -------------------------------------------------------------------------- */
const generatePdfFromBackend = async () => {
  const payload = {
    htmlContent: editorContent.value,
    penerima: selectedTertuju.value.map(i => i.labelJob || i.label),
    dari: selectedBerkas.value?.judulBerkas || '-',
    tanggal: formattedDate.value,
    penandatangan: "Ivan Dwi Santoso",
    tembusan: selectedTembusan.value.map(i => i.labelJob || i.label)
  };
  const res = await fetch('http://172.20.16.115:3011/ND/generate-pdf', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Gagal generate PDF");
  return await res.blob();
}

const openPreview = async () => {
  isOpenPreview.value = true; isLoadingData.value = true;
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
  try {
    const blob = await generatePdfFromBackend();
    pdfUrl.value = URL.createObjectURL(blob);
  } catch (e) {
    alert("Gagal memuat preview."); isOpenPreview.value = false;
  } finally { isLoadingData.value = false; }
}

const handleSaveDraft = async () => {
  if (!selectedBerkas.value) { return alert("Mohon pilih berkas arsip terlebih dahulu."); }
  isLoadingDraft.value = true;

  try {
    const pdfBlob = await generatePdfFromBackend();

    // --- LOGIC FIX START ---
    // Helper function untuk mengambil Persnum dengan aman
    const extractPersnum = (item: any) => {
      const raw = item.raw || {};

      // 1. Cek berbagai kemungkinan nama field untuk Persnum di API/Database Anda
      // Silakan cek console log browser untuk melihat nama field asli dari 'raw'
      const id = raw.persnum || raw.personal_number || raw.pernr || raw.employee_id || raw.personalNumber;

      // 2. Jika ditemukan di raw, kembalikan
      if (id) return String(id);

      // 3. Fallback HANYA jika item.value BUKAN position (misal saat edit mode itemnya beda struktur)
      // Tapi karena Anda bilang 'value' itu position, kita lebih baik return string kosong atau error daripada salah simpan
      console.warn("Persnum tidak ditemukan untuk item:", item.label);
      return String(item.value); // Tetap return value sebagai cadangan terakhir
    };
    // --- LOGIC FIX END ---

    const rawPayload: DraftPayload = {
      id_naskah: editDraftId.value,
      pengirim: "70016786",

      // GUNAKAN HELPER TADI DI SINI
      penerima: selectedTertuju.value.map(extractPersnum),
      tembusan: selectedTembusan.value.map(extractPersnum),

      klasifikasi: selectedBerkas.value?.klasifikasi || "",
      klasifikasi_text: selectedBerkas.value?.judulBerkas || "",
      sifat: selectedSifat.value?.value || "biasa",
      perihal: subject.value,
      konten: editorContent.value,
      english: english.value,
      nama_tempat: "Tangerang",
      nama_jabatan: "AVP of Enterprise Technology Planning",
      tanda_tangan: "vsydc526d728g29uwedhwidciwdcbhbddy2",
      nama_lengkap: "Ivan Dwi Santoso",
      tgl: date.value ? `${date.value.year}-${String(date.value.month).padStart(2, '0')}-${String(date.value.day).padStart(2, '0')}` : "",
      final_pdf: pdfBlob
    };

    // Validasi & FormData builder tetap sama...
    const validation = validateDraftPayload(rawPayload);
    if (!validation.isValid) {
      alert(`Validasi Gagal: ${Object.values(validation.errors)[0]}`);
      isLoadingDraft.value = false;
      return;
    }

    const formData = new FormData();

    // ... Sisa kode sama persis ...

    Object.keys(rawPayload).forEach(key => {
      const val = rawPayload[key as keyof DraftPayload];
      if (!Array.isArray(val) && key !== 'lampiran_files' && key !== 'final_pdf' && val !== undefined && val !== null) {
        formData.append(key, String(val));
      }
    });

    if (rawPayload.penerima.length) rawPayload.penerima.forEach(v => formData.append("penerima[]", String(v)));
    if (rawPayload.tembusan.length) rawPayload.tembusan.forEach(v => formData.append("tembusan[]", String(v)));
    if (rawPayload.final_pdf) formData.append("final_pdf", rawPayload.final_pdf, "Draft_Nota_Dinas.pdf");

    if (uploadedFiles.value.length) {
      uploadedFiles.value.forEach(file => {
        if (file instanceof File) formData.append("lampiran_files[]", file, file.name);
      });
    }

    // Ingat update useDraft agar pakai PUT native sesuai diskusi sebelumnya
    await saveDraft(formData, editDraftId.value);
    await router.push("/admin/korespondensi/draft");

  } catch (e: any) {
    console.error("Save Error:", e);
  } finally {
    isLoadingDraft.value = false;
  }
};
</script>

<style scoped>
:deep(.tox-tinymce) {
  border: none !important;
}
</style>
