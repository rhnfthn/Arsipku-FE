<template>
  <div class="">
    <div
      class="bg-white dark:bg-gray-800 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden transition-colors"
    >
      <PageHeader title="Tulis Nota Dinas" :items="breadcrumbs" />
    </div>

    <UCard
      variant="soft"
      :ui="{
        root: 'rounded-t-none ring-0 shadow-none bg-white dark:bg-gray-800 print:hidden transition-colors',
      }"
    >
      <div class="flex-1 overflow-y-auto space-y-1">
        <div
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0"
        >
          <span
            class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0"
          >
            Berkas
          </span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu
              v-model="selectedBerkasId"
              :items="berkasList || []"
              :loading="berkasStatus === 'loading'"
              value-key="id"
              :search-attributes="['judulBerkas', 'klasifikasi', 'isiRingkas']"
              placeholder="Pilih Berkas"
              :search-input="{
                placeholder: 'Cari judul, klasifikasi, atau isi...',
                size: 'lg',
              }"
              variant="none"
              class="w-full"
              :ui="{
                base: '!px-0 !bg-transparent w-full dark:text-white',
                ring: 'ring-0',
                shadow: 'shadow-none',
              }"
            >
              <template #item="{ item }">
                <div class="flex flex-col truncate py-1">
                  <span
                    class="text-sm font-medium text-gray-900 dark:text-white truncate"
                  >
                    {{ item.judulBerkas }}
                  </span>
                  <span class="text-xs text-gray-500 truncate">
                    {{ item.klasifikasi }} - {{ item.isiRingkas }}
                  </span>
                </div>
              </template>

              <template #default>
                <span
                  v-if="selectedBerkas"
                  class="truncate text-sm block w-full text-left dark:text-white font-medium"
                >
                  {{ selectedBerkas.judulBerkas }}
                  <span class="text-gray-500 font-normal ml-2"
                    >({{ selectedBerkas.klasifikasi }})</span
                  >
                </span>
                <span
                  v-else
                  class="text-gray-400 dark:text-gray-500 text-sm block w-full text-left"
                >
                  Pilih berkas arsip...
                </span>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 relative gap-1 sm:gap-0"
        >
          <span
            class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0"
            >Tanggal Surat
          </span>
          <div class="relative w-full">
            <ClientOnly>
              <UPopover
                v-model:open="open"
                :content="{ align: 'start', side: 'bottom', sideOffset: 8 }"
              >
                <div
                  class="flex items-center gap-2 cursor-pointer w-full pr-2"
                  @click="open = true"
                >
                  <UInputDate
                    locale="id-ID"
                    v-model="date"
                    variant="none"
                    size="sm"
                    format="DD MMMM YYYY"
                    class="flex-1"
                    :ui="{
                      base: '!bg-transparent !text-sm !px-0 !ring-0 pointer-events-none inline-flex items-center h-8',
                    }"
                  />
                  <UIcon
                    name="i-lucide-calendar"
                    class="size-4 text-gray-400 shrink-0 mr-1"
                  />
                </div>
                <template #content>
                  <UCalendar
                    v-model="date"
                    class="p-2"
                    @update:model-value="open = false"
                  />
                </template>
              </UPopover>
            </ClientOnly>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0"
        >
          <span
            class="w-full sm:w-40 text-sm mt-0 sm:mt-1 text-gray-500 font-medium shrink-0"
            >Tertuju</span
          >
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu
              v-model="selectedTertuju"
              :items="itemsTertuju"
              multiple
              placeholder="Kepada ..."
              class="w-full p-0"
              variant="none"
              :ui="{
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' },
              }"
            >
              <template #item="{ item }">
                <div
                  class="flex items-start gap-3 w-full py-1 overflow-hidden"
                  :class="{ 'opacity-50 cursor-not-allowed': item.disabled }"
                >
                  <UCheckbox
                    :model-value="isItemSelected(item, selectedTertuju)"
                    class="pointer-events-none shrink-0"
                    :checked="isItemSelected(item, selectedTertuju)"
                    :disabled="item.disabled"
                  />
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.label"
                    class="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm text-left truncate w-full">
                      {{ item.label }}
                    </span>
                    <span
                      v-if="item.disabled"
                      class="text-xs text-red-500 italic"
                      >Sudah dipilih di Tembusan</span
                    >
                  </div>
                </div>
              </template>

              <template #default>
                <div
                  class="flex items-center gap-1.5 flex-wrap min-h-[28px] pr-10 w-full"
                >
                  <UBadge
                    v-for="item in selectedTertuju"
                    :key="item.value"
                    color="primary"
                    variant="soft"
                    size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md max-w-full"
                  >
                    <img
                      v-if="item.image"
                      :src="item.image"
                      :alt="item.label"
                      class="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                    />
                    <span
                      class="text-xs font-medium text-left truncate max-w-[150px] sm:max-w-[220px]"
                    >
                      {{ item.label }}
                    </span>
                    <UButton
                      icon="i-lucide-x"
                      size="2xs"
                      color="neutral"
                      variant="ghost"
                      :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                      @click="removeItem(item, selectedTertuju, $event)"
                    />
                  </UBadge>
                  <span
                    v-if="!selectedTertuju.length"
                    class="text-sm text-gray-400 dark:text-gray-500"
                  >
                    Pilih tertuju
                  </span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0"
        >
          <span
            class="w-full sm:w-40 text-sm mt-0 sm:mt-1 text-gray-500 font-medium shrink-0"
            >Tembusan</span
          >
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu
              v-model="selectedTembusan"
              :items="itemsTembusan"
              multiple
              placeholder="Kepada ..."
              class="w-full p-0"
              variant="none"
              :ui="{
                /* UI config sama... */
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' },
              }"
            >
              <template #item="{ item }">
                <div
                  class="flex items-start gap-3 w-full py-1 overflow-hidden"
                  :class="{ 'opacity-50 cursor-not-allowed': item.disabled }"
                >
                  <UCheckbox
                    :model-value="isItemSelected(item, selectedTembusan)"
                    class="pointer-events-none shrink-0"
                    :checked="isItemSelected(item, selectedTembusan)"
                    :disabled="item.disabled"
                  />
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.label"
                    class="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm text-left truncate w-full">
                      {{ item.label }}
                    </span>
                    <span
                      v-if="item.disabled"
                      class="text-xs text-red-500 italic"
                      >Sudah dipilih di Tertuju</span
                    >
                  </div>
                </div>
              </template>

              <template #default>
                <div
                  class="flex items-center gap-1.5 flex-wrap min-h-[28px] pr-10 w-full"
                >
                  <UBadge
                    v-for="item in selectedTembusan"
                    :key="item.value"
                    color="primary"
                    variant="soft"
                    size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md max-w-full"
                  >
                    <img
                      v-if="item.image"
                      :src="item.image"
                      :alt="item.label"
                      class="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                    />
                    <span
                      class="text-xs font-medium text-left truncate max-w-[150px] sm:max-w-[220px]"
                    >
                      {{ item.label }}
                    </span>
                    <UButton
                      icon="i-lucide-x"
                      size="2xs"
                      color="neutral"
                      variant="ghost"
                      :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                      @click="removeItem(item, selectedTembusan, $event)"
                    />
                  </UBadge>
                  <span
                    v-if="!selectedTembusan.length"
                    class="text-sm text-gray-400 dark:text-gray-500"
                  >
                    Pilih tembusan
                  </span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0"
        >
          <span
            class="w-full sm:w-40 text-sm text-gray-500 font-medium shrink-0"
            >Sifat</span
          >
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu
              v-model="selectedSifat"
              :items="sifatOptions"
              placeholder="Pilih sifat ..."
              class="w-full p-0"
              :search-input="{ placeholder: 'Cari sifat ...', size: 'lg' }"
              variant="none"
            >
              <template #default>
                <div
                  class="flex items-center gap-1.5 min-h-[28px] pr-10 w-full"
                >
                  <span
                    v-if="selectedSifat"
                    class="text-sm font-medium text-left truncate max-w-[200px]"
                  >
                    {{ selectedSifat.label }}
                  </span>
                  <span v-else class="text-sm text-gray-400">Pilih sifat</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0"
        >
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span
              class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0"
              >Perihal</span
            >
            <input
              type="text"
              v-model="subject"
              class="flex-1 outline-none text-gray-900 dark:text-white py-1 bg-transparent text-sm w-full placeholder-gray-400 dark:placeholder-gray-600"
              placeholder="Ketik perihal"
            />
          </div>
        </div>

        <div class="flex flex-col py-4">
          <div
            class="flex flex-wrap items-center justify-between w-full gap-3 mb-2"
          >
            <div class="flex flex-wrap gap-2 flex-shrink-0">
              <UButton
                  label="Pilih Template"
                  color="primary"
                  variant="soft"
                  @click="openTemplate"
                  icon="i-heroicons-adjustments-horizontal"
                />
              <UModal v-model:open="isTemplateModalOpen" title="Pilih Template">

                <template #body>
                  <div class="flex flex-col gap-2">
                    <UCard
                      v-for="template in templates"
                      :key="template.id"
                      class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      @click="applyTemplate(template)"
                    >
                      <div class="py-3">
                        <h3 class="font-bold dark:text-white">
                          {{ template.name }}
                        </h3>
                      </div>
                    </UCard>
                  </div>
                </template>
              </UModal>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <UButton
                icon="i-lucide-eye"
                color="neutral"
                variant="soft"
                label="Preview PDF"
                @click="openPreview"
              />
            </div>
          </div>

          <TinymceEditor
            v-model="content"
            :init="tinyMceInit"
          />

          <div class="flex flex-col py-3 gap-2 mt-4">
            <label class="text-sm font-medium text-gray-700"
              >Lampiran File</label
            >
            <FileUpload
              v-model="uploadedFiles"
              accept="application/pdf"
              :multiple="true"
              description="Klik atau drag & drop untuk upload file PDF"
            />
          </div>
        </div>

        <div
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end bg-white dark:bg-gray-800"
        >
          <UButton
            label="Simpan Draft"
            color="neutral"
            variant="outline"
            size="lg"
            icon="i-heroicons-document-text"
            class="px-8"
            :loading="isLoadingDraft"
            @click="handleSaveDraft"
          />
          <UButton
            label="Kirim Dokumen"
            color="primary"
            size="lg"
            icon="i-heroicons-paper-airplane"
            class="px-8 font-bold"
          />
        </div>
      </div>
    </UCard>

    <ClientOnly>
      <div
        class="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden"
      >
        <div
          ref="pdfSourceRef"
          style="
            width: 100%;
            max-width: 800px;
            padding: 0;
            background-color: #ffffff;
            color: #000000;
            font-family: &quot;Times New Roman&quot;, serif;
            position: relative;
          "
        >
          <div
            style="
              display: flex;
              align-items: center;
              padding-bottom: 8px;
              margin-bottom: 24px;
              position: relative;
              z-index: 10;
            "
          >
            <div
              style="display: flex; align-items: flex-end; gap: 16px; flex: 1"
            >
              <img
                src="/logoAirnav.png"
                alt="Logo"
                style="height: 80px; width: auto; object-fit: contain"
              />
              <div
                style="
                  display: flex;
                  flex-direction: column;
                  margin-bottom: 8px;
                "
              >
                <span
                  style="
                    font-size: 18px;
                    font-weight: bold;
                    letter-spacing: 0.025em;
                    color: #000000;
                  "
                  >AirNav Indonesia</span
                >
              </div>
            </div>
            <div
              style="
                font-size: 10px;
                line-height: 1.1;
                text-align: right;
                color: #000000;
              "
            >
              <div style="font-weight: bold">Kantor Pusat Perum LPPNPI</div>
              <div>Gedung AirNav Indonesia</div>
              <div>Jl. Ir. H. Juanda, Tangerang 15121</div>
              <div>Banten – Indonesia</div>
              <div>Telp: 021-5591 5000</div>
              <div>Fax: 021-5591 5100</div>
              <div>www.airnavindonesia.co.id</div>
            </div>
          </div>

          <div
            style="
              text-align: center;
              margin-bottom: 24px;
              position: relative;
              z-index: 10;
            "
          >
            <h1
              style="
                font-size: 16px;
                font-weight: bold;
                text-transform: uppercase;
                color: #000000;
                margin: 0;
              "
            >
              NOTA DINAS
            </h1>
            <p style="font-size: 14px; margin-top: 4px; color: #000000">
              Nomor : ..............................................
            </p>
          </div>

          <table
            style="
              font-size: 14px;
              line-height: 1.6;
              margin: 0 140px 24px 140px;
              color: #000000;
              border-collapse: collapse;
              position: relative;
              z-index: 10;
              table-layout: auto !important;
              width: auto !important;
              max-width: none !important;
              border: none !important;
            "
          >
            <tbody>
              <tr>
                <td
                  style="
                    border: none !important;
                    width: 100px;
                    font-weight: bold;
                    vertical-align: top;
                  "
                >
                  Kepada Yth.
                </td>
                <td
                  style="
                    border: none !important;
                    width: 10px;
                    vertical-align: top;
                  "
                >
                  :
                </td>

                <td style="border: none !important; vertical-align: top">
                  {{
                    selectedTertuju.length
                      ? selectedTertuju.map((s: any) => s.label).join(", ")
                      : "..................."
                  }}
                </td>
              </tr>
              <tr>
                <td
                  style="
                    border: none !important;
                    font-weight: bold;
                    vertical-align: top;
                  "
                >
                  Dari
                </td>
                <td style="border: none !important; vertical-align: top">:</td>
                <td style="border: none !important; vertical-align: top">
                  {{
                    selectedBerkas?.judulBerkas ||
                    "................................................"
                  }}
                </td>
              </tr>
              <tr>
                <td
                  style="
                    border: none !important;
                    font-weight: bold;
                    vertical-align: top;
                  "
                >
                  Perihal
                </td>
                <td style="border: none !important; vertical-align: top">:</td>
                <td style="border: none !important; vertical-align: top">
                  {{ subject || "..................." }}
                </td>
              </tr>
            </tbody>
          </table>

          <div
            class="pdf-editor-content"
            style="
              width: 100%;
              text-align: justify;
              color: #000000;
              min-height: 50px;
              position: relative;
              z-index: 10;
            "
            v-html="cleanContent(rawHtmlContent)"
          ></div>

          <div
            style="
              width: 100%;
              display: block;
              page-break-inside: avoid;
              break-inside: avoid;
              margin-top: 32px;
              position: relative;
              z-index: 10;
            "
          >
            <div
              style="
                display: flex;
                justify-content: flex-end;
                margin-bottom: 16px;
                color: #000000;
              "
            >
              <div style="text-align: center; min-width: 200px">
                <div style="margin-bottom: 96px; font-size: 14px">
                  <div>{{ user?.alamatInfo?.kota }}, {{ formattedDate }}</div>
                  <div style="margin-top: 2px; font-weight: bold">
                    AVP of Enterprise Technology Planning
                  </div>
                </div>
                <div style="font-weight: bold; font-size: 14px">
                  Ivan Dwi Santoso
                </div>
              </div>
            </div>

            <div
              style="
                font-size: 12px;
                margin-top: 8px;
                width: 100%;
                text-align: left;
                color: #000000;
              "
            >
              <div style="font-weight: bold; margin-bottom: 4px">
                Tembusan :
              </div>

              <ol
                v-if="selectedTembusan.length > 0"
                style="
                  margin-left: 0;
                  padding-left: 1.5rem;
                  list-style-type: decimal;
                  list-style-position: outside;
                "
              >
                <li
                  v-for="t in selectedTembusan"
                  :key="t.value"
                  style="padding-left: 0.25rem; text-indent: 0"
                >
                  {{ t.label }}
                </li>
              </ol>

              <div v-else style="font-style: italic; color: #000000">...</div>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>

    <USlideover
      v-model:open="isOpenPreview"
      title="Preview PDF"
      side="bottom"
      :ui="{
        content: 'h-screen max-h-screen',
        body: 'p-0',
      }"
    >
      <template #body>
        <div
          class="h-full w-full flex items-center justify-center bg-gray-100 bg-white"
        >
          <iframe
            v-if="pdfUrl"
            :src="pdfUrl"
            class="w-full h-full rounded-lg shadow-lg border border-gray-200"
          />
          <div v-else class="flex flex-col items-center gap-2">
            <UIcon
              name="i-lucide-loader-2"
              class="animate-spin w-8 h-8 text-primary-500"
            />
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
import { CalendarDate } from "@internationalized/date";
import TinymceEditorAsync from '~/components/TinymceEditorAsync.vue';
import { useAuth } from "@/composables/useAuth"; // <--- IMPORT USEAUTH

// Types
import type { Berkas } from "~/types/berkas";
import type { DraftPayload } from "~/types/draft";

/* -------------------------------------------------------------------------- */
/* COMPOSABLES                                                                */
/* -------------------------------------------------------------------------- */
const { saveDraft, isLoadingDraft } = useDraft();
const { getBerkasList } = useBerkas();
const { getRecipients } = useRecipients();
const { user, getProfile } = useAuth(); // <--- INIT USEAUTH

/* -------------------------------------------------------------------------- */
/* STATE & REFS                                                               */
/* -------------------------------------------------------------------------- */
// --- UI State ---
const breadcrumbs = [
  { label: "Beranda", to: "/beranda" },
  { label: "Tulis Nota Dinas", to: "#" },
];
const isFullscreenEditor = ref(false);
const isTemplateModalOpen = ref(false);
const isOpenPreview = ref(false);
const loading = ref(false);

// --- Form State ---
const date = ref<CalendarDate>();
const subject = ref("");
const selectedSifat = ref();
const uploadedFiles = ref<File[]>([]);
const english = ref(false);

// --- Data Lists & Select ---
const berkasList = ref<Berkas[]>([]);
const berkasStatus = ref<"idle" | "loading" | "success" | "error">("idle");
const selectedBerkasId = ref<string | null>(null);

// *** REVISI STATE SELECT ***
const items = ref<any[]>([]);
const selectedTertuju = ref<any[]>([]); // Pastikan array
const selectedTembusan = ref<any[]>([]); // Pastikan array

// --- Editor & PDF State ---
const content = ref(""); // Digunakan untuk v-model editor
const editorContent = ref("");
const pdfUrl = ref("");
let quillInstance: any = null;

// --- TinyMCE Config ---
const tinyMceInit = {
  base_url: '/tinymce',
  suffix: '.min',
  height: 400,
  menubar: false,
  promotion: false,
  branding: false,
  placeholder: 'Ketik konten disini...',
  plugins: 'lists advlist link image code table',
  toolbar: 'bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | table bullist numlist | code',
};

// --- Static Options ---
const templates = [
  { id: 1, name: "Default", content: `<ol><li>Contoh isi...</li></ol>` },
];
const sifatOptions = [
  { label: "Rahasia", value: "rahasia" },
  { label: "Biasa", value: "biasa" },
];

/* -------------------------------------------------------------------------- */
/* COMPUTED PROPERTIES                                                        */
/* -------------------------------------------------------------------------- */
const selectedBerkas = computed(() => {
  return berkasList.value.find((b) => b.id === selectedBerkasId.value);
});

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

/* -------------------------------------------------------------------------- */
/* HELPER METHODS                                                             */
/* -------------------------------------------------------------------------- */
const applyTemplate = (t: any) => {
  content.value = t.content;
  isTemplateModalOpen.value = false;
};

/* -------------------------------------------------------------------------- */
/* CORE FUNCTIONS (Preview & Save)                                            */
/* -------------------------------------------------------------------------- */

// --- 2. Preview PDF ---
async function openPreview() {
  loading.value = true;
  try {
    isOpenPreview.value = true;

    // Pastikan URL sebelumnya dibersihkan
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);

    const payload: any = {};

    // Map ke Label untuk Tampilan PDF
    payload.penerima = selectedTertuju.value.map(i => i.label);
    payload.tembusan = selectedTembusan.value.map(i => i.label);

    // Format Tanggal
    const tglStr = date.value
      ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
      : new Date().toISOString().split("T")[0];

    payload.tgl = tglStr;
    payload.perihal = subject.value;
    payload.sifat = selectedSifat.value?.value || 'biasa';
    payload.htmlContent = content.value; // Kirim konten HTML

    // Ambil Info Pengirim dari User Login
    payload.penandatangan = user.value?.nama || "Nama Tidak Diketahui";

    // FETCH PDF
    // Pastikan endpoint ini benar dan backend mengembalikan BLOB
    const response = await fetch("http://172.20.16.115:3011/ND/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if(!response.ok) throw new Error("Gagal generate PDF");

    const blob = await response.blob();
    pdfUrl.value = URL.createObjectURL(blob);

  } catch (err) {
    console.error("PDF generate error:", err);
    alert("Terjadi kesalahan saat generate PDF.");
    isOpenPreview.value = false;
  } finally {
    loading.value = false;
  }
}

// --- 3. Save Draft Action ---
const handleSaveDraft = async () => {
  if (!user.value) await getProfile(); // Safety check

  if (!selectedBerkas.value) {
    alert("Mohon pilih berkas arsip terlebih dahulu.");
    return;
  }

  const formData = new FormData();

  // 1. PENGIRIM (Ambil ID Jabatan User Login)
  formData.append("pengirim", user.value?.position || "0");

  // 2. PENERIMA & TEMBUSAN (Kirim VALUE / ID JABATAN)
  // Format array: penerima[] = "ID1", penerima[] = "ID2"
  selectedTertuju.value.forEach((i) => {
    formData.append("penerima[]", String(i.value));
  });

  selectedTembusan.value.forEach((i) => {
    formData.append("tembusan[]", String(i.value));
  });

  // 3. INFORMASI LAIN
  formData.append("klasifikasi", selectedBerkas.value.klasifikasi || "");
  formData.append("klasifikasi_text", selectedBerkas.value.judulBerkas || selectedBerkas.value.isiRingkas || ""); // Sesuaikan nama field berkas
  formData.append("sifat", selectedSifat.value?.value || "biasa");
  formData.append("perihal", subject.value);
  formData.append("konten", content.value); // Gunakan v-model editor

  // 4. INFO TANDA TANGAN (Ambil dari User Login)
  formData.append("nama_tempat", user.value?.areaText || "Tangerang");
  formData.append("nama_jabatan", user.value?.positionText || "Jabatan Tidak Diketahui");
  formData.append("tanda_tangan", "vsydc526d728g29uwedhwidciwdcbhbddy2"); // Hardcode/Generated ID
  formData.append("nama_lengkap", user.value?.nama || "Nama Tidak Diketahui");

  // 5. TANGGAL
  const tglStr = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(date.value.day).padStart(2, "0")}`
    : new Date().toISOString().split("T")[0];
  formData.append("tgl", tglStr);

  // 6. DUMMY PDF & LAMPIRAN
  formData.append("final_pdf", "Draft_Nota_Dinas.pdf"); // Backend butuh file asli atau generate ulang disana?

  uploadedFiles.value.forEach((file) => {
    formData.append("lampiran_files[]", file, file.name);
  });

  formData.append("english", String(english.value));

  try {
    // Panggil saveDraft dari composable
    await saveDraft(formData);
    // await navigateTo("/korespondensi/terkirim"); // Redirect jika perlu
  } catch (e) {
    console.error(e);
  }
};

/* -------------------------------------------------------------------------- */
/* LIFECYCLE HOOKS                                                            */
/* -------------------------------------------------------------------------- */
onMounted(async () => {
  // A. LOAD USER PROFILE (Agar Position ID tersedia)
  if (!user.value) {
    try {
      await getProfile();
    } catch (e) {
      console.error("Gagal load profile user");
      return;
    }
  }

  // B. FETCH BERKAS
  try {
    berkasStatus.value = "loading";
    const response = await getBerkasList();
    berkasList.value = Array.isArray(response) ? response : (response?.data ?? []);
    berkasStatus.value = "success";
  } catch (err) {
    console.error("Gagal mengambil daftar berkas", err);
    berkasStatus.value = "error";
  }

  // C. FETCH RECIPIENTS (Menggunakan Position ID User Login)
  try {
    // Ambil position ID user
    const userPositionId = user.value?.position || 70016581; // Fallback ID jika null

    console.log("Mengambil penerima untuk posisi:", userPositionId);

    const res = await getRecipients(userPositionId);
    const rawData = res.recipients || res.data || [];

    // MAPPING DATA AGAR KONSISTEN (BADGE & DROPDOWN)
    items.value = rawData.map((r: any) => {
      // 1. Tentukan Value (ID Jabatan)
      const safeValue = r.position || r.id || r.position_id || r.persnum;

      // 2. Format Label (Agar Dropdown & Badge sama)
      // Format: NAMA PEJABAT - (KODE) NAMA JABATAN
      const formattedLabel = `${r.persnum_person_text} - (${r.position_abbreviation}) ${r.position_text}`;

      return {
        label: formattedLabel, // Ini yang akan muncul di Dropdown & Badge (jika default USelectMenu)
        labelJob: r.position_text, // Simpan nama jabatan saja jika butuh
        value: safeValue ? String(safeValue) : "0", // Pastikan string ID
        raw: r,
      };
    });

  } catch (err) {
    console.error("Gagal mengambil daftar penerima", err);
  }
});
</script>

<style scoped>
/* --- RESET RESETAN TAILWIND --- */
:deep(.ql-editor ol),
:deep(.ql-editor ul) {
  padding-left: 0 !important;
  margin: 0 !important;
}

/* --- LOGIC UTAMA: TARGET ELEMEN TANPA LI --- */
:deep(.ql-editor) {
  counter-reset: list-0;
}

/* 2. STYLE UNTUK BULLET (data-list="bullet") */
:deep(ol[data-list="bullet"]),
:deep(ul[data-list="bullet"]) {
  position: relative;
  padding-left: 2.5em !important;
  margin-bottom: 0.2em;
}

/* Memunculkan Simbol Bullet di dalam span .ql-ui */
:deep([data-list="bullet"] > .ql-ui),
:deep([data-list="bullet"] .ql-ui) {
  position: absolute;
  left: 0.5em;
}

:deep([data-list="bullet"] > .ql-ui:before),
:deep([data-list="bullet"] .ql-ui:before) {
  content: "•" !important;
  font-size: 1.2em;
  font-weight: bold;
  display: inline-block;
}

/* 3. STYLE UNTUK ANGKA (data-list="ordered") */
:deep(ol[data-list="ordered"]) {
  position: relative;
  padding-left: 2.5em !important;
  margin-bottom: 0.2em;
  counter-increment: list-0;
}

/* Memunculkan Angka di dalam span .ql-ui */
:deep(ol[data-list="ordered"] > .ql-ui),
:deep(ol[data-list="ordered"] .ql-ui) {
  position: absolute;
  left: 0.5em;
}

:deep(ol[data-list="ordered"] > .ql-ui:before),
:deep(ol[data-list="ordered"] .ql-ui:before) {
  content: counter(list-0) ". " !important;
  font-weight: normal;
  display: inline-block;
}

/* --- FIX UNTUK HASIL PDF (Sama logicnya) --- */
:deep(.pdf-editor-content) {
  counter-reset: pdf-list-0;
}

:deep(.pdf-editor-content ol[data-list="ordered"]) {
  counter-increment: pdf-list-0;
  padding-left: 2.5em !important;
  position: relative;
}

:deep(.pdf-editor-content ol[data-list="ordered"] .ql-ui:before) {
  content: counter(pdf-list-0) ". " !important;
  position: absolute;
  left: 0;
}

:deep(.pdf-editor-content [data-list="bullet"]) {
  padding-left: 2.5em !important;
  position: relative;
}

:deep(.pdf-editor-content [data-list="bullet"] .ql-ui:before) {
  content: "•" !important;
  position: absolute;
  left: 0;
}

:deep(ol) {
  list-style-position: outside !important;
  padding-left: 1.8rem !important;
  margin-left: 0 !important;
}

:deep(ol li) {
  padding-left: 0 !important;
  text-indent: 0 !important;
}
</style>
