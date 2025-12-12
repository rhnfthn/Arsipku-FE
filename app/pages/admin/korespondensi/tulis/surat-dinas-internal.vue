<template>
  <div class="">
    <div v-if="isLoadingData"
      class="fixed inset-0 z-[99999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-2">
        <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
        <span class="text-gray-600 font-medium">Memproses Data...</span>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden transition-colors">
      <PageHeader title="Tulis Surat Dinas Internal (SDI)" :items="breadcrumbs" />
    </div>

    <UCard variant="soft" :ui="{
      root: 'rounded-t-none ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors',
    }">
      <div class="flex-1 overflow-y-auto space-y-1">

        <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Pesan <span class="text-red-500">*</span>
            </span>
            <input type="text" v-model="pesan"
              class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400"
              placeholder="Masukkan Pesan" />
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Asal Instansi <span class="text-red-500">*</span>
            </span>
            <input type="text" v-model="asalInstansi"
              class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400"
              placeholder="Masukkan Nama Perusahaan Pengirim" />
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">
            Berkas <span class="text-red-500">*</span>
          </span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedBerkasId" :items="berkasList" value-key="id"
              :search-attributes="['judulBerkas', 'klasifikasi']" placeholder="Pilih Berkas"
              :search-input="{ placeholder: 'Cari berkas...', size: 'lg' }" variant="none" class="w-full" :ui="{
                base: '!px-0 !bg-transparent w-full dark:text-white',
                ring: 'ring-0',
                shadow: 'shadow-none',
              }">
              <template #default>
                <span v-if="selectedBerkas" class="truncate text-sm block w-full text-left dark:text-white font-medium">
                  {{ selectedBerkas.judulBerkas }}
                  <span class="text-gray-500 font-normal ml-2">({{ selectedBerkas.klasifikasi }})</span>
                </span>
                <span v-else class="text-gray-400 dark:text-gray-500 text-sm block w-full text-left">
                  Pilih Berkas
                </span>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 relative gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">
            Tanggal Surat <span class="text-red-500">*</span>
          </span>
          <div class="relative w-full">
            <ClientOnly>
              <UPopover v-model:open="openDate" :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
                <div class="flex items-center gap-2 cursor-pointer w-full pr-2" @click="openDate = true">
                  <UInputDate locale="id-ID" v-model="date" variant="none" size="sm" format="DD MMMM YYYY"
                    class="flex-1"
                    :ui="{ base: '!bg-transparent !text-sm !px-0 !ring-0 pointer-events-none inline-flex items-center h-8' }" />
                  <UIcon name="i-lucide-calendar" class="size-4 text-gray-400 shrink-0 mr-1" />
                </div>
                <template #content>
                  <UCalendar v-model="date" class="p-2" @update:model-value="openDate = false" />
                </template>
              </UPopover>
            </ClientOnly>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm text-gray-500 font-medium shrink-0">
            Sifat Naskah <span class="text-red-500">*</span>
          </span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedSifat" :items="sifatOptions" placeholder="Pilih Sifat Naskah" class="w-full p-0"
              variant="none">
              <template #default>
                <div class="flex items-center gap-1.5 min-h-[28px] pr-10 w-full">
                  <span v-if="selectedSifat" class="text-sm font-medium text-left truncate max-w-[200px]">
                    {{ selectedSifat.label }}
                  </span>
                  <span v-else class="text-sm text-gray-400">Pilih Sifat Naskah</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1 text-gray-500 font-medium shrink-0">
            Tertuju <span class="text-red-500">*</span>
          </span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedTertuju" :items="itemsTertuju" multiple placeholder="Pilih Penerima"
              class="w-full p-0" variant="none" :ui="{
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 transition-colors w-full',
                trigger: { base: 'px-0 py-1 w-full' },
              }">
              <template #item="{ item }">
                <div class="flex items-start gap-3 w-full py-1 overflow-hidden" :class="{ 'opacity-50': item.disabled }">
                  <UCheckbox :checked="isItemSelected(item, selectedTertuju)" :disabled="item.disabled" class="pointer-events-none shrink-0" />
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm text-left truncate">{{ item.label }}</span>
                  </div>
                </div>
              </template>
              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[28px] pr-10 w-full">
                  <UBadge v-for="item in selectedTertuju" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md">
                    <span class="text-xs font-medium truncate max-w-[200px]">{{ item.label }}</span>
                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                      @click="removeItem(item, selectedTertuju, $event)" />
                  </UBadge>
                  <span v-if="!selectedTertuju.length" class="text-sm text-gray-400">Pilih Penerima</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1 text-gray-500 font-medium shrink-0">Tembusan</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedTembusan" :items="itemsTembusan" multiple placeholder="Pilih Penerima"
              class="w-full p-0" variant="none">
               <template #item="{ item }">
                <div class="flex items-start gap-3 w-full py-1 overflow-hidden" :class="{ 'opacity-50': item.disabled }">
                  <UCheckbox :checked="isItemSelected(item, selectedTembusan)" :disabled="item.disabled" class="pointer-events-none shrink-0" />
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm text-left truncate">{{ item.label }}</span>
                  </div>
                </div>
              </template>
              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[28px] pr-10 w-full">
                  <UBadge v-for="item in selectedTembusan" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md">
                    <span class="text-xs font-medium truncate max-w-[200px]">{{ item.label }}</span>
                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                      @click="removeItem(item, selectedTembusan, $event)" />
                  </UBadge>
                  <span v-if="!selectedTembusan.length" class="text-sm text-gray-400">Pilih Penerima</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Perihal <span class="text-red-500">*</span>
            </span>
            <input type="text" v-model="subject"
              class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400"
              placeholder="Masukkan Perihal Surat" />
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              Lampiran
            </span>
            <input type="text" v-model="lampiranText"
              class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400"
              placeholder="Masukan Perihal Lampiran" />
          </div>
        </div>

        <div class="flex flex-col py-4">
           <div class="flex flex-wrap items-center justify-between w-full gap-3 mb-2">
            <div class="flex flex-wrap gap-2 flex-shrink-0">
               </div>
            <div class="flex flex-wrap items-center gap-3">
              <UButton v-if="!isFullscreenEditor" icon="i-lucide-maximize" color="neutral" variant="soft"
                label="Fullscreen" @click="toggleFullscreenEditor" />
              <UButton icon="i-lucide-eye" color="neutral" variant="soft" label="Preview PDF" @click="openPreview" />
            </div>
          </div>

           <ClientOnly>
            <div class="flex flex-col bg-gray-100 dark:bg-gray-800 transition-all duration-300" :class="isFullscreenEditor
              ? 'fixed inset-0 z-[9999] w-screen h-screen'
              : 'relative h-screen border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'
              ">
              <div v-if="isFullscreenEditor" class="absolute top-4 right-6 z-[10000]">
                <UButton icon="i-lucide-minimize" color="red" variant="solid" label="Keluar Fullscreen"
                  class="shadow-xl ring-2 ring-white" @click="toggleFullscreenEditor" />
              </div>

              <TextEditor ref="textEditorComponent" v-model="editorContent" :is-fullscreen="isFullscreenEditor"
                @ready="onEditorReady">
                <template #header>
                   <div class="p-4 border-b border-gray-200 bg-gray-50 text-gray-400 text-sm italic text-center">
                      Area penulisan isi surat (Header dan Footer akan digenerate otomatis saat Preview)
                   </div>
                </template>
              </TextEditor>
            </div>
          </ClientOnly>
        </div>

        <div class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end bg-white dark:bg-gray-800">
          <UButton label="Simpan Draft" color="neutral" variant="outline" size="lg" icon="i-heroicons-document-text"
            class="px-8" />
          <UButton label="Kirim Dokumen" color="primary" size="lg" icon="i-heroicons-paper-airplane"
            class="px-8 font-bold" @click="openPreview" />
        </div>

      </div>
    </UCard>

    <ClientOnly>
      <div class="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden">
        <div ref="pdfSourceRef" style="
            width: 100%;
            max-width: 800px;
            padding: 0;
            background-color: #ffffff;
            color: #000000;
            font-family: 'Times New Roman', serif;
            position: relative;
          ">
          <div style="display: flex; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 16px;">
            <div style="flex: 1;">
               <img src="/logoAirnav.png" alt="Logo" style="height: 60px; width: auto; object-fit: contain" />
               <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">AirNav Indonesia</div>
            </div>
             <div style="font-size: 10px; text-align: right; line-height: 1.2;">
              <div style="font-weight: bold;">Kantor Pusat Perum LPPNPI</div>
              <div>Gedung AirNav Indonesia</div>
              <div>Jl. Ir. H. Juanda, Tangerang 15121</div>
              <div>Banten – Indonesia</div>
              <div>Telp: 021-5591 5000</div>
              <div>Fax: 021-5591 5100</div>
              <div>www.airnavindonesia.co.id</div>
            </div>
          </div>

          <div style="text-align: right; margin-bottom: 20px; font-size: 14px;">
            <span style="border-bottom: 1px solid black; padding-bottom: 2px;">
              Tangerang, {{ formattedDate }}
            </span>
          </div>

          <table style="width: 100%; font-size: 14px; margin-bottom: 24px; border: none !important;">
            <tr>
              <td style="width: 80px; vertical-align: top;">Nomor</td>
              <td style="width: 15px; vertical-align: top;">:</td>
              <td style="vertical-align: top;">.............................................</td>
            </tr>
            <tr>
              <td style="width: 80px; vertical-align: top;">Sifat</td>
              <td style="width: 15px; vertical-align: top;">:</td>
              <td style="vertical-align: top;">{{ selectedSifat?.label || '-' }}</td>
            </tr>
            <tr>
              <td style="width: 80px; vertical-align: top;">Lampiran</td>
              <td style="width: 15px; vertical-align: top;">:</td>
              <td style="vertical-align: top;">{{ lampiranText || '-' }}</td>
            </tr>
            <tr>
              <td style="width: 80px; vertical-align: top;">Perihal</td>
              <td style="width: 15px; vertical-align: top;">:</td>
              <td style="vertical-align: top; font-weight: bold;">{{ subject || '...................' }}</td>
            </tr>
          </table>

          <div style="font-size: 14px; margin-bottom: 20px;">
            <div style="font-weight: bold; margin-bottom: 4px;">Kepada Yth.</div>
             <div v-if="selectedTertuju.length > 0">
                <div v-for="(t, index) in selectedTertuju" :key="index">
                   {{ index + 1 }}. {{ t.labelJob || t.label }}
                </div>
             </div>
             <div v-else>.............................................</div>
             <div style="margin-top: 4px;">Di Tempat</div>
          </div>

          <div class="pdf-editor-content" style="
              width: 100%;
              text-align: justify;
              font-size: 14px;
              line-height: 1.5;
              min-height: 100px;
              margin-bottom: 30px;
            " v-html="cleanContent(rawHtmlContent)">
          </div>

          <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
             <div style="text-align: left; min-width: 200px;">
                <div style="font-weight: bold; margin-bottom: 80px;">
                   {{ asalInstansi || 'Nama Jabatan' }}
                </div>
                <div style="font-weight: bold; text-decoration: underline;">
                   Nama Lengkap
                </div>
             </div>
          </div>

          <div style="font-size: 12px; margin-top: 20px;">
             <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">Tembusan :</div>
              <ol v-if="selectedTembusan.length > 0" style="padding-left: 18px; margin: 0;">
                <li v-for="t in selectedTembusan" :key="t.value">{{ t.labelJob || t.label }}</li>
              </ol>
              <div v-else class="italic">...</div>
          </div>

        </div>
      </div>
    </ClientOnly>

    <USlideover v-model:open="isOpenPreview" title="Preview Surat" side="bottom" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0'
    }">
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100">
          <iframe v-if="pdfUrl" :src="pdfUrl" class="w-full h-full border-none" />
          <div v-else class="flex flex-col items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary" />
            <span class="text-gray-500">Membuat PDF Preview...</span>
          </div>
        </div>
      </template>
    </USlideover>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { CalendarDate } from '@internationalized/date';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

// Components
import TextEditor from "~/components/TextEditor.vue"; // Asumsi path komponen sama

/* -------------------------------------------------------------------------- */
/* STATE & REFS                                                               */
/* -------------------------------------------------------------------------- */
const breadcrumbs = [{ label: 'Dashboard', to: '/' }, { label: 'Tulis SDI', to: '#' }];
const isLoadingData = ref(false);
const isFullscreenEditor = ref(false);
const isOpenPreview = ref(false);
const openDate = ref(false);

// Form Fields
const pesan = ref("");
const asalInstansi = ref("");
const selectedBerkasId = ref<string | null>(null);
const date = ref<CalendarDate>();
const selectedSifat = ref();
const subject = ref("");
const lampiranText = ref(""); // Teks biasa, bukan file
const editorContent = ref("<ol><li>Tulis isi surat di sini...</li></ol>");

// Select Menus Data (Mockup karena tanpa API)
const berkasList = ref<any[]>([]);
const sifatOptions = [{ label: 'Biasa', value: 'biasa' }, { label: 'Rahasia', value: 'rahasia' }, { label: 'Segera', value: 'segera' }];
const itemsRecipients = ref<any[]>([]);
const selectedTertuju = ref<any[]>([]);
const selectedTembusan = ref<any[]>([]);

// PDF Logic
const rawHtmlContent = ref("");
const pdfSourceRef = ref<HTMLElement | null>(null);
const pdfUrl = ref('');
let quillInstance: any = null;
const textEditorComponent = ref();

/* -------------------------------------------------------------------------- */
/* LIFECYCLE (MOCK DATA)                                                      */
/* -------------------------------------------------------------------------- */
onMounted(() => {
  // Set Default Date
  const now = new Date();
  date.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate());

  // Mock Data Berkas
  berkasList.value = [
    { id: '1', judulBerkas: 'Laporan Keuangan 2024', klasifikasi: 'KEU.01' },
    { id: '2', judulBerkas: 'Proyek Infrastruktur IT', klasifikasi: 'TEK.05' },
    { id: '3', judulBerkas: 'Surat Menyurat Umum', klasifikasi: 'UM.01' },
  ];

  // Mock Data Recipients (Jabatan)
  itemsRecipients.value = [
    { value: 'dirut', label: 'Direktur Utama', labelJob: 'Direktur Utama' },
    { value: 'dirops', label: 'Direktur Operasi', labelJob: 'Direktur Operasi' },
    { value: 'avp_it', label: 'AVP IT Planning', labelJob: 'AVP IT Planning' },
    { value: 'mgr_dev', label: 'Manager Development', labelJob: 'Manager Development' },
  ];
});

/* -------------------------------------------------------------------------- */
/* COMPUTED                                                                   */
/* -------------------------------------------------------------------------- */
const selectedBerkas = computed(() => berkasList.value.find((b) => b.id === selectedBerkasId.value));

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

// Logic agar Tertuju tidak bisa dipilih lagi di Tembusan (dan sebaliknya)
const itemsTertuju = computed(() => itemsRecipients.value.map(i => ({
  ...i, disabled: selectedTembusan.value.some(s => s.value === i.value)
})));

const itemsTembusan = computed(() => itemsRecipients.value.map(i => ({
  ...i, disabled: selectedTertuju.value.some(s => s.value === i.value)
})));

/* -------------------------------------------------------------------------- */
/* METHODS                                                                    */
/* -------------------------------------------------------------------------- */
const onEditorReady = (q: any) => {
  quillInstance = q;
  if (editorContent.value) q.clipboard.dangerouslyPasteHTML(0, editorContent.value);
};

const toggleFullscreenEditor = () => {
  isFullscreenEditor.value = !isFullscreenEditor.value;
  document.body.style.overflow = isFullscreenEditor.value ? "hidden" : "";
};

const isItemSelected = (item: any, list: any[]) => list.some((s) => s.value === item.value);

const removeItem = (item: any, list: any[], event: Event) => {
  event.stopPropagation();
  const index = list.findIndex((s) => s.value === item.value);
  if (index > -1) list.splice(index, 1);
};

const cleanContent = (content: string) => content;

// PDF Generation Logic (Client Side only using html2pdf / pdf-lib approach implied)
const getGeneratedPdfBlob = async (): Promise<Blob | null> => {
  if (quillInstance) rawHtmlContent.value = quillInstance.root.innerHTML;
  else rawHtmlContent.value = editorContent.value;

  await nextTick();
  const element = pdfSourceRef.value;
  if (!element) return null;

  // Clone elemen untuk diproses html2pdf
  const clone = element.cloneNode(true) as HTMLElement;

  // Inject style khusus print/pdf
  const style = document.createElement("style");
  style.innerHTML = `
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; color: #000000; -webkit-print-color-adjust: exact; }
    ol, ul { padding-left: 0; margin: 0; }
    li { list-style-position: inside; }
  `;
  clone.appendChild(style);

  // Ghost div agar tidak terlihat user saat rendering
  const ghostDiv = document.createElement("div");
  Object.assign(ghostDiv.style, {
    position: 'fixed', top: '0', left: '-9999px', zIndex: '-9999',
    backgroundColor: '#ffffff', width: '210mm', padding: '0'
  });
  ghostDiv.appendChild(clone);
  document.body.appendChild(ghostDiv);

  try {
    // Dynamic import library (asumsi project sudah install html2pdf.js)
    const html2pdf = (await import("html2pdf.js")).default;

    const opt = {
      margin: [20, 20, 20, 20], // Margin A4 standar
      filename: 'Surat_Dinas_Internal.pdf',
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    const pdfBlob = await html2pdf().set(opt).from(clone).output('blob');
    return pdfBlob;
  } catch (err) {
    console.error("Gagal generate PDF", err);
    return null;
  } finally {
    document.body.removeChild(ghostDiv);
  }
};

async function openPreview() {
  isOpenPreview.value = true;
  isLoadingData.value = true;

  // Bersihkan URL lama
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
  pdfUrl.value = '';

  const blob = await getGeneratedPdfBlob();
  isLoadingData.value = false;

  if (blob) {
    pdfUrl.value = URL.createObjectURL(blob);
  } else {
    alert("Gagal membuat preview PDF.");
    isOpenPreview.value = false;
  }
}
</script>

<style scoped>
/* Reset style khusus Quill di dalam Preview agar list number/bullet muncul benar di PDF */
:deep(.pdf-editor-content ol) {
  list-style-type: decimal !important;
  padding-left: 1.5em !important;
  margin-top: 0;
  margin-bottom: 0;
}
:deep(.pdf-editor-content ul) {
  list-style-type: disc !important;
  padding-left: 1.5em !important;
  margin-top: 0;
  margin-bottom: 0;
}
:deep(.pdf-editor-content li) {
  padding-left: 0.5em;
}
</style>
