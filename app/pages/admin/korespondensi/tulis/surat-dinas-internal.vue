<template>
  <div class="relative min-h-screen">

    <div v-if="isLoadingData"
      class="fixed inset-0 z-[99999] flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity">
      <div class="flex flex-col items-center gap-2">
        <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
        <span class="text-gray-600 font-medium">Memproses Data...</span>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 z-10 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden transition-colors relative">
      <PageHeader title="Tulis Nota Dinas" :items="breadcrumbs" />
    </div>

    <UCard variant="soft" :ui="{
      root: 'rounded-t-none ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors',
    }">
      <div class="flex-1 overflow-y-auto space-y-1">

        <div
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
            Berkas
          </span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedBerkas" :items="berkasList" option-attribute="judulBerkas"
              placeholder="Pilih Berkas" :search-attributes="['judulBerkas', 'klasifikasi']" variant="none"
              class="w-full"
              :ui="{ base: '!px-0 !bg-transparent w-full dark:text-white', ring: 'ring-0', shadow: 'shadow-none' }">
              <template #label>
                <span v-if="selectedBerkas" class="truncate text-sm block w-full text-left dark:text-white font-medium">
                  {{ selectedBerkas.judulBerkas }}
                  <span class="text-gray-500 font-normal ml-2">({{ selectedBerkas.klasifikasi }})</span>
                </span>
                <span v-else class="text-gray-400 dark:text-gray-500 text-sm block w-full text-left">
                  Pilih berkas arsip...
                </span>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 relative gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tanggal Surat</span>
          <div class="relative w-full">
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton icon="i-heroicons-calendar-days-20-solid" :label="formattedDate" color="gray" variant="ghost"
                :padded="false" class="text-sm font-normal text-gray-900 dark:text-white hover:bg-transparent" />
              <template #panel="{ close }">
                <UCalendar v-model="date" @close="close" />
              </template>
            </UPopover>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1 text-gray-500 font-medium shrink-0">Tertuju</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedTertuju" :items="itemsTertuju" multiple placeholder="Kepada ..."
              class="w-full p-0" variant="none"
              :ui="{ base: 'bg-transparent w-full', trigger: { base: 'px-0 py-1 w-full' } }">

              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[28px] pr-10 w-full">
                  <UBadge v-for="item in selectedTertuju" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 rounded-md">
                    <span>{{ item.label }}</span>
                    <UIcon name="i-heroicons-x-mark" class="w-3 h-3 cursor-pointer"
                      @click.stop="removeItem(item, selectedTertuju)" />
                  </UBadge>
                  <span v-if="!selectedTertuju.length" class="text-sm text-gray-400">Pilih tertuju...</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1 text-gray-500 font-medium shrink-0">Tembusan</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedTembusan" :items="itemsTembusan" multiple placeholder="Tembusan ..."
              class="w-full p-0" variant="none"
              :ui="{ base: 'bg-transparent w-full', trigger: { base: 'px-0 py-1 w-full' } }">
              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[28px] pr-10 w-full">
                  <UBadge v-for="item in selectedTembusan" :key="item.value" color="gray" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 rounded-md">
                    <span>{{ item.label }}</span>
                    <UIcon name="i-heroicons-x-mark" class="w-3 h-3 cursor-pointer"
                      @click.stop="removeItem(item, selectedTembusan)" />
                  </UBadge>
                  <span v-if="!selectedTembusan.length" class="text-sm text-gray-400">Pilih tembusan...</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm text-gray-500 font-medium shrink-0">Sifat</span>
          <USelectMenu v-model="selectedSifat" :items="sifatOptions" placeholder="Pilih sifat" variant="none"
            class="w-full" />
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
          <input type="text" v-model="subject"
            class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400"
            placeholder="Ketik perihal surat..." />
        </div>

        <div class="flex flex-col py-4 gap-2">
          <div class="flex justify-between items-center">
            <label class="text-sm font-bold text-gray-700 dark:text-gray-300">Editor Naskah:</label>
          </div>

          <ClientOnly>
            <Editor api-key="no-api-key" v-model="editorContent" :init="tinyMceInit"
              class="shadow-sm border rounded-lg overflow-hidden" />
          </ClientOnly>
        </div>

        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end bg-white dark:bg-gray-800">
          <UButton label="Preview Dokumen" color="primary" size="lg" icon="i-heroicons-eye" class="px-8 font-bold"
            @click="openPreviewModal" />
        </div>

      </div>
    </UCard>

    <div ref="pdfContainer" style="position: fixed; left: -9999px; top: 0; width: 210mm;"></div>

    <USlideover v-model="isOpenPreview" side="bottom" :ui="{
      height: 'h-screen max-h-[90vh]',
      overlay: { background: 'bg-gray-900/75 backdrop-blur-sm' }
    }">
      <div class="flex flex-col h-full w-full bg-gray-100 dark:bg-gray-900">

        <div
          class="bg-white dark:bg-gray-800 border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
          <div class="flex items-center gap-3">
            <UButton icon="i-heroicons-x-mark" color="gray" variant="ghost" @click="isOpenPreview = false" />
            <h3 class="font-bold text-lg text-gray-900 dark:text-white">Preview Nota Dinas</h3>
          </div>
          <UButton label="Tutup Preview" color="white" variant="solid" @click="isOpenPreview = false" />
        </div>

        <div class="flex-1 w-full overflow-hidden flex justify-center p-4 relative bg-gray-500/10">
          <div v-if="isLoadingData" class="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary" />
          </div>

          <iframe v-if="pdfUrl" :src="pdfUrl"
            class="w-full h-full max-w-5xl rounded shadow-lg border border-gray-200 bg-white" />
        </div>

        <div
          class="bg-white dark:bg-gray-800 border-t border-gray-200 p-4 shrink-0 flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <UButton label="Simpan Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text"
            class="px-6" @click="handleSaveDraft" />
          <UButton label="Kirim Nota Dinas" color="primary" size="lg" icon="i-heroicons-paper-airplane"
            class="px-6 font-bold" @click="handleSend" />
        </div>

      </div>
    </USlideover>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import Editor from '@tinymce/tinymce-vue';
// Import html2pdf secara dinamis di dalam function nanti, atau pastikan sudah terinstall
// npm install html2pdf.js

// --- STATE ---
const breadcrumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Tulis Nota Dinas', to: '#' }];
const isLoadingData = ref(false);
const isOpenPreview = ref(false);
const pdfContainer = ref<HTMLElement | null>(null);
const pdfUrl = ref("");

// --- STATE BARU (DARI CODE B) ---
const date = ref(new Date());
const subject = ref("");
const selectedBerkas = ref<any>(null);
const selectedSifat = ref("Biasa");
const selectedTertuju = ref<any[]>([]);
const selectedTembusan = ref<any[]>([]);
const editorContent = ref("");

// Mock Data (Karena tidak ada API yang terlampir, saya buat data dummy agar UI jalan)
// Nanti bisa diganti dengan fetch API Anda
const berkasList = ref([
  { id: 1, judulBerkas: 'Laporan Keuangan', klasifikasi: 'KU.01' },
  { id: 2, judulBerkas: 'Pengadaan Barang', klasifikasi: 'LG.02' }
]);
const itemsRecipients = ref([
  { label: 'Direktur Utama', value: 'dirut' },
  { label: 'Direktur Operasi', value: 'dirops' },
  { label: 'AVP Enterprise Tech', value: 'avp_ent' },
  { label: 'Manager IT', value: 'mgr_it' }
]);
const sifatOptions = ['Biasa', 'Rahasia', 'Sangat Rahasia'];

// --- COMPUTED (DARI CODE B) ---
const formattedDate = computed(() => {
  return date.value.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
});

const itemsTembusan = computed(() => {
  return itemsRecipients.value.map(item => ({
    ...item,
    disabled: selectedTertuju.value.some(s => s.value === item.value)
  }));
});

const itemsTertuju = computed(() => {
  return itemsRecipients.value.map(item => ({
    ...item,
    disabled: selectedTembusan.value.some(s => s.value === item.value)
  }));
});

const removeItem = (item: any, list: any[]) => {
  const index = list.findIndex((s) => s.value === item.value);
  if (index > -1) list.splice(index, 1);
};

// --- KONFIGURASI TINYMCE ---
const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 600,
  menubar: false,
  statusbar: false,
  plugins: 'lists advlist link image table preview code fullscreen noneditable',
  toolbar:
    'fullscreen | undo redo | bold italic underline strikethrough | ' +
    'alignleft aligncenter alignright alignjustify | ' +
    'table bullist numlist outdent indent | ' +
    'code',
  noneditable_class: 'mceNonEditable',
  content_style: `
    body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 20px; }
    .mceNonEditable { background-color: #fafafa; border: 1px dashed #e5e7eb; user-select: none; pointer-events: none; }
    @media print { .mceNonEditable { border: none; background: none; } }
    table { border-collapse: collapse; width: 100%; }
    td { vertical-align: top; padding: 2px; }
  `
};

// --- HTML STRUKTUR (DIPERBARUI DENGAN VARIABEL BARU) ---
// Fungsi ini sekarang mengambil data real-time dari inputan form
// ... kode sebelumnya ...

const getTemplateHtml = () => {
  const strTertuju = selectedTertuju.value.length
    ? selectedTertuju.value.map(i => i.label).join(', ')
    : '...........................';

  const strDari = selectedBerkas.value
    ? `${selectedBerkas.value.judulBerkas} (${selectedBerkas.value.klasifikasi})`
    : '...........................';

  const header = `
    <div class="mceNonEditable header-section" contenteditable="false">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 15px;">
           <img src="/logoAirnav.png" alt="Logo" style="height: 70px; width: auto;" />
           <div style="font-size: 18px; font-weight: bold; font-family: Arial, sans-serif;">AirNav Indonesia</div>
        </div>
        <div style="font-size: 10px; text-align: right; font-family: Arial, sans-serif;">
          <div style="font-weight: bold;">Kantor Pusat Perum LPPNPI</div>
          <div>Jl. Ir. H. Juanda, Tangerang 15121</div>
        </div>
      </div>

      <div style="text-align: center; font-weight: bold; margin-bottom: 20px;">
        <span style="font-size: 16px; border-bottom: 3px double #000; display: inline-block; padding-bottom: 2px; text-transform: uppercase;">NOTA DINAS</span>
        <div style="font-size: 14px; font-weight: normal; margin-top: 5px;">Nomor: ND.     /${selectedBerkas.value?.klasifikasi || '...'}/.../${new Date().getFullYear()}</div>
      </div>

      <table class="header-table" style="width: 100%; margin-bottom: 15px;">
        <tr><td style="width: 100px; font-weight: bold;">Kepada Yth.</td><td style="width: 10px;">:</td><td>${strTertuju}</td></tr>
        <tr><td style="font-weight: bold;">Dari</td><td>:</td><td>${strDari}</td></tr>
        <tr><td style="font-weight: bold;">Perihal</td><td>:</td><td>${subject.value || '...........................'}</td></tr>
        <tr><td style="font-weight: bold;">Tanggal</td><td>:</td><td>${formattedDate.value}</td></tr>
        <tr><td style="font-weight: bold;">Sifat</td><td>:</td><td>${selectedSifat.value}</td></tr>
      </table>
      <div style="border-top: 1px solid #000; margin-bottom: 15px;"></div>
    </div>
  `;

  // ... sisa kode bodyPlaceholder dan footer sama ...
  const bodyPlaceholder = `
    <div class="content-body">
      <p>Yth. Bapak/Ibu,</p>
      <p>Sehubungan dengan...</p>
    </div>
  `;

  const footer = `
    <div class="mceNonEditable footer-section" contenteditable="false" style="margin-top: 50px;">
      <div style="display: flex; justify-content: flex-end;">
        <div style="text-align: left; width: 250px;">
          <div style="margin-bottom: 80px;">Tangerang, ${formattedDate.value}<br><b>AVP Enterprise Tech</b></div>
          <div style="font-weight: bold; text-decoration: underline;">Ivan Dwi Santoso</div>
          <div>NIK. 12345678</div>
        </div>
      </div>

      <div style="margin-top: 20px; font-size: 11px;">
        <div style="font-weight: bold; text-decoration: underline;">Tembusan:</div>
        <ol style="margin-top: 5px; padding-left: 15px;">
          ${selectedTembusan.value.length > 0
      ? selectedTembusan.value.map(t => `<li>${t.label}</li>`).join('')
      : '<li>-</li>'}
        </ol>
      </div>
    </div>
  `;

  return header + bodyPlaceholder + footer;
};

// --- METHODS ---
const resetEditorContent = () => {
  editorContent.value = getTemplateHtml();
};

// Watch perubahan input untuk update real-time header (Opsional, agak tricky dengan TinyMCE)
// Untuk simpelnya, kita biarkan user edit manual di editor, atau refresh template.

const openPreviewModal = async () => {
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
  pdfUrl.value = "";

  isOpenPreview.value = true; // Buka Slideover
  isLoadingData.value = true;

  await generatePdfUrl();
};

// ... kode sebelumnya ...

const generatePdfUrl = async () => {
  // 1. Ambil konten langsung dari Editor (karena Editor sudah memuat Header & Footer)
  // JANGAN menggabungkan string header/footer lagi disini agar tidak double.
  const contentHTML = editorContent.value;

  // 2. Buat elemen temporary
  const element = document.createElement('div');

  // 3. Masukkan konten
  element.innerHTML = contentHTML;

  // 4. INJEKSI CSS KHUSUS PDF (PENTING!)
  // Kita buat style tag di dalam elemen yang akan di-render ke PDF
  const style = document.createElement('style');
  style.innerHTML = `
    /* Reset & Font Global */
    body, div, p, span, td, li {
      font-family: 'Times New Roman', serif;
      color: #000000;
      -webkit-print-color-adjust: exact;
    }

    /* --- PERBAIKAN 1: TABLE BORDER --- */
    /* Paksa semua table memiliki border collapse */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      border-spacing: 0;
    }

    /* Paksa semua cell (td/th) memiliki border hitam 1px */
    td, th {
      border: 1px solid #000000 !important;
      padding: 4px;
      vertical-align: top;
    }

    /* KECUALI: Table Header (Kop Surat & Info Surat) jangan ada bordernya */
    /* Kita target class 'header-table' atau struktur header spesifik */
    .header-section table td,
    .header-section table th,
    table.header-table td,
    table[style*="border: none"] td {
      border: none !important;
      padding: 1px;
    }

    /* --- PERBAIKAN 2: DOUBLE UNDERLINE & ALIGNMENT --- */
    /* Pastikan border-bottom terbaca */
    .header-section span[style*="border-bottom"] {
      border-bottom: 3px double #000000 !important;
      display: inline-block; /* Penting agar border garisnya muncul rapi */
      line-height: 1.2;
    }

    /* Perbaikan List/Numbering agar tidak terlalu menjorok atau hilang */
    ul, ol { margin-top: 0; margin-bottom: 0; padding-left: 25px; }
    li { padding-left: 5px; }

    /* Helper Classes dari TinyMCE */
    .mceNonEditable { border: none !important; }

    /* Utility Text Align (jika inline style tidak terbaca) */
    .text-center { text-align: center; }
    .text-justify { text-align: justify; }
    .text-right { text-align: right; }
  `;

  // Masukkan style ke paling atas elemen
  element.prepend(style);

  // 5. Mount ke container tersembunyi
  if (pdfContainer.value) {
    pdfContainer.value.innerHTML = '';
    pdfContainer.value.appendChild(element);
  }

  // 6. Generate PDF
  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const opt = {
      margin: [15, 20, 20, 20], // Top, Left, Bottom, Right (mm)
      filename: 'Nota_Dinas_Preview.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2, // Tingkatkan scale agar teks tajam
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const pdfBlobUrl = await html2pdf().set(opt).from(element).output('bloburl');
    pdfUrl.value = pdfBlobUrl;

  } catch (error) {
    console.error("Gagal generate PDF", error);
    alert("Gagal membuat preview.");
  } finally {
    isLoadingData.value = false;
    // Bersihkan container (opsional, bisa dikomen untuk debug)
    if (pdfContainer.value) pdfContainer.value.innerHTML = '';
  }
};

const handleSaveDraft = () => {
  alert("Draft Disimpan!");
  isOpenPreview.value = false;
};

const handleSend = () => {
  const isConfirmed = confirm("Kirim Nota Dinas?");
  if (isConfirmed) {
    alert("Terkirim!");
    isOpenPreview.value = false;
  }
};

onMounted(() => {
  resetEditorContent();
});
</script>

<style scoped>
/* Style tambahan jika diperlukan */
:deep(ol) {
  list-style-type: decimal;
  padding-left: 20px;
}

:deep(ul) {
  list-style-type: disc;
  padding-left: 20px;
}
</style>
