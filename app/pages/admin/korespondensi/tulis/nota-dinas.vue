<template>
  <div class="">
    <div class="bg-white dark:bg-gray-800 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden transition-colors">
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
            <USelectMenu v-model="selectedBerkasId" :items="berkasList || []" :loading="berkasStatus === 'loading'"
              value-key="id" :search-attributes="['judulBerkas', 'klasifikasi', 'isiRingkas']"
              placeholder="Pilih Berkas"
              :search-input="{ placeholder: 'Cari judul, klasifikasi, atau isi...', size: 'lg' }" variant="none"
              class="w-full" :ui="{
                base: '!px-0 !bg-transparent w-full dark:text-white',
                ring: 'ring-0',
                shadow: 'shadow-none',
              }">
              <template #item="{ item }">
                <div class="flex flex-col truncate py-1">
                  <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ item.judulBerkas }}
                  </span>
                  <span class="text-xs text-gray-500 truncate">
                    {{ item.klasifikasi }} - {{ item.isiRingkas }}
                  </span>
                </div>
              </template>

              <template #default>
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
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tanggal Surat </span>
          <div class="relative w-full">
            <ClientOnly>
              <UPopover v-model:open="open" :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
                <div class="flex items-center gap-2 cursor-pointer w-full pr-2" @click="open = true">
                  <UInputDate locale="id-ID" v-model="date" variant="none" size="sm" format="DD MMMM YYYY"
                    class="flex-1"
                    :ui="{ base: '!bg-transparent !text-sm !px-0 !ring-0 pointer-events-none inline-flex items-center h-8' }" />
                  <UIcon name="i-lucide-calendar" class="size-4 text-gray-400 shrink-0 mr-1" />
                </div>
                <template #content>
                  <UCalendar v-model="date" class="p-2" @update:model-value="open = false" />
                </template>
              </UPopover>
            </ClientOnly>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1 text-gray-500 font-medium shrink-0">Tertuju</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedTertuju" :items="itemsTertuju" multiple placeholder="Kepada ..."
              class="w-full p-0" variant="none" :ui="{
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' },
              }">
              <template #item="{ item }">
                <div class="flex items-start gap-3 w-full py-1 overflow-hidden"
                  :class="{ 'opacity-50 cursor-not-allowed': item.disabled }">
                  <UCheckbox :model-value="isItemSelected(item, selectedTertuju)" class="pointer-events-none shrink-0"
                    :checked="isItemSelected(item, selectedTertuju)" :disabled="item.disabled" />
                  <img v-if="item.image" :src="item.image" :alt="item.label"
                    class="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm text-left truncate w-full">
                      {{ item.label }}
                    </span>
                    <span v-if="item.disabled" class="text-xs text-red-500 italic">Sudah dipilih di Tembusan</span>
                  </div>
                </div>
              </template>

              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[28px] pr-10 w-full">
                  <UBadge v-for="item in selectedTertuju" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md max-w-full">
                    <img v-if="item.image" :src="item.image" :alt="item.label"
                      class="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                    <span class="text-xs font-medium text-left truncate max-w-[150px] sm:max-w-[220px]">
                      {{ item.label }}
                    </span>
                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                      @click="removeItem(item, selectedTertuju, $event)" />
                  </UBadge>
                  <span v-if="!selectedTertuju.length" class="text-sm text-gray-400 dark:text-gray-500">
                    Pilih tertuju
                  </span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1 text-gray-500 font-medium shrink-0">Tembusan</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedTembusan" :items="itemsTembusan" multiple placeholder="Kepada ..."
              class="w-full p-0" variant="none" :ui="{
                /* UI config sama... */
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' },
              }">
              <template #item="{ item }">
                <div class="flex items-start gap-3 w-full py-1 overflow-hidden"
                  :class="{ 'opacity-50 cursor-not-allowed': item.disabled }">
                  <UCheckbox :model-value="isItemSelected(item, selectedTembusan)" class="pointer-events-none shrink-0"
                    :checked="isItemSelected(item, selectedTembusan)" :disabled="item.disabled" />
                  <img v-if="item.image" :src="item.image" :alt="item.label"
                    class="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm text-left truncate w-full">
                      {{ item.label }}
                    </span>
                    <span v-if="item.disabled" class="text-xs text-red-500 italic">Sudah dipilih di Tertuju</span>
                  </div>
                </div>
              </template>

              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[28px] pr-10 w-full">
                  <UBadge v-for="item in selectedTembusan" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md max-w-full">
                    <img v-if="item.image" :src="item.image" :alt="item.label"
                      class="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                    <span class="text-xs font-medium text-left truncate max-w-[150px] sm:max-w-[220px]">
                      {{ item.label }}
                    </span>
                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                      @click="removeItem(item, selectedTembusan, $event)" />
                  </UBadge>
                  <span v-if="!selectedTembusan.length" class="text-sm text-gray-400 dark:text-gray-500">
                    Pilih tembusan
                  </span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

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
                  class="shadow-xl ring-2 ring-white dark:ring-gray-700 bg-white" @click="toggleFullscreenEditor" />
              </div>

              <TextEditor ref="textEditorComponent" v-model="editorContent" :is-fullscreen="isFullscreenEditor"
                @ready="onEditorReady">
                <template #header>
                  <div class="flex items-center pb-2 mb-6 select-none">
                    <div class="flex items-end gap-4">
                      <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
                      <div class="flex flex-col mb-1">
                        <span class="text-2xl font-bold tracking-wide text-[18px] text-black">AirNav Indonesia</span>
                      </div>
                    </div>
                    <div class="ml-auto text-[10px] leading-[1.1] text-gray-700 text-right">
                      <div class="font-bold">Kantor Pusat Perum LPPNPI</div>
                      <div>Gedung AirNav Indonesia</div>
                      <div>Jl. Ir. H. Juanda, Tangerang 15121</div>
                      <div>Banten – Indonesia</div>
                      <div>Telp: 021-5591 5000</div>
                      <div>Fax: 021-5591 5100</div>
                      <div>www.airnavindonesia.co.id</div>
                    </div>
                  </div>

                  <div class="text-center mb-6 select-none text-black">
                    <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">
                      NOTA DINAS
                    </h1>
                    <p class="text-lg mt-1 text-[14px]">
                      Nomor : ..............................................
                    </p>
                  </div>

                  <table class="w-full text-lg leading-relaxed mb-4 tn-roman select-none text-black">
                    <tbody>
                      <tr>
                        <td class="text-[14px] w-[120px] font-bold align-top">
                          Kepada Yth.
                        </td>
                        <td class="text-[14px] w-[20px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          {{
                            selectedTertuju.length
                              ? selectedTertuju.map((s: any) => s.label).join(", ")
                              : "..................."
                          }}
                        </td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Dari</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          {{
                            selectedSender?.label ||
                            "................................................"
                          }}
                        </td>
                      </tr>
                      <tr>
                        <td class="text-[14px] font-bold align-top">Perihal</td>
                        <td class="text-[14px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          {{
                            subject ||
                            "................................................"
                          }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </template>

                <template #footer>
                  <div class="flex justify-end mb-4 select-none text-black">
                    <div class="text-center min-w-[250px]">
                      <div class="mb-24 text-[14px]">
                        <div>Tangerang, {{ formattedDate }}</div>
                        <div class="font-bold">
                          AVP of Enterprise Technology Planning
                        </div>
                      </div>
                      <div class="font-bold text-[14px]">Ivan Dwi Santoso</div>
                    </div>
                  </div>
                  <div class="text-[12px] mt-2 w-full text-left select-none text-black">
                    <div class="font-bold underline mb-1">Tembusan :</div>

                    <ol v-if="selectedTembusan.length > 0" class="list-decimal ml-4 pl-2"
                      style="margin-left: 16px; padding-left: 8px; list-style-type: decimal;">
                      <li v-for="t in selectedTembusan" :key="t.value">
                        {{ t.label }}
                      </li>
                    </ol>

                    <div v-else class="text-gray-400 italic" style="font-style: italic; color: #000000">...</div>
                  </div>
                </template>
              </TextEditor>
            </div>
          </ClientOnly>

          <div class="flex flex-col py-3 gap-2 mt-4">
            <label class="text-sm font-medium text-gray-700">Lampiran File</label>
            <FileUpload v-model="uploadedFiles" accept="application/pdf" :multiple="true"
              description="Klik atau drag & drop untuk upload file PDF" />
          </div>
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

    <ClientOnly>
      <div class="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden">
        <div ref="pdfSourceRef" style="
            width: 100%;
            max-width: 800px;
            padding: 0;
            background-color: #ffffff;
            color: #000000;
            font-family: &quot;Times New Roman&quot;, serif;
            position: relative;
          ">
          <div style="
              display: flex;
              align-items: center;
              padding-bottom: 8px;
              margin-bottom: 24px;
              position: relative;
              z-index: 10;
            ">
            <div style="display: flex; align-items: flex-end; gap: 16px; flex: 1">
              <img src="/logoAirnav.png" alt="Logo" style="height: 80px; width: auto; object-fit: contain" />
              <div style="
                  display: flex;
                  flex-direction: column;
                  margin-bottom: 8px;
                ">
                <span style="
                    font-size: 18px;
                    font-weight: bold;
                    letter-spacing: 0.025em;
                    color: #000000;
                  ">AirNav Indonesia</span>
              </div>
            </div>
            <div style="
                font-size: 10px;
                line-height: 1.1;
                text-align: right;
                color: #000000;
              ">
              <div style="font-weight: bold">Kantor Pusat Perum LPPNPI</div>
              <div>Gedung AirNav Indonesia</div>
              <div>Jl. Ir. H. Juanda, Tangerang 15121</div>
              <div>Banten – Indonesia</div>
              <div>Telp: 021-5591 5000</div>
              <div>Fax: 021-5591 5100</div>
              <div>www.airnavindonesia.co.id</div>
            </div>
          </div>

          <div style="
              text-align: center;
              margin-bottom: 24px;
              position: relative;
              z-index: 10;
            ">
            <h1 style="
                font-size: 16px;
                font-weight: bold;
                text-transform: uppercase;
                color: #000000;
                margin: 0;
              ">
              NOTA DINAS
            </h1>
            <p style="font-size: 14px; margin-top: 4px; color: #000000">
              Nomor : ..............................................
            </p>
          </div>

          <table style="
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
            ">
            <tbody>
              <tr>
                <td style="
                    border: none !important;
                    width: 100px;
                    font-weight: bold;
                    vertical-align: top;
                  ">
                  Kepada Yth.
                </td>
                <td style="
                    border: none !important;
                    width: 10px;
                    vertical-align: top;
                  ">
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
                <td style="border: none !important; font-weight: bold; vertical-align: top;">Dari</td>
                <td style="border: none !important; vertical-align: top;">:</td>
                <td style="border: none !important; vertical-align: top;">
                  {{ selectedBerkas?.judulBerkas || "................................................" }}
                </td>
              </tr>
              <tr>
                <td style="
                    border: none !important;
                    font-weight: bold;
                    vertical-align: top;
                  ">
                  Perihal
                </td>
                <td style="border: none !important; vertical-align: top">:</td>
                <td style="border: none !important; vertical-align: top">
                  {{ subject || "..................." }}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pdf-editor-content" style="
              width: 100%;
              text-align: justify;
              color: #000000;
              min-height: 50px;
              position: relative;
              z-index: 10;
            " v-html="cleanContent(rawHtmlContent)"></div>

          <div style="
              width: 100%;
              display: block;
              page-break-inside: avoid;
              break-inside: avoid;
              margin-top: 32px;
              position: relative;
              z-index: 10;
            ">
            <div style="
                display: flex;
                justify-content: flex-end;
                margin-bottom: 16px;
                color: #000000;
              ">
              <div style="text-align: center; min-width: 200px">
                <div style="margin-bottom: 96px; font-size: 14px">
                  <div>Tangerang, {{ formattedDate }}</div>
                  <div style="margin-top: 2px; font-weight: bold">
                    AVP of Enterprise Technology Planning
                  </div>
                </div>
                <div style="font-weight: bold; font-size: 14px">
                  Ivan Dwi Santoso
                </div>
              </div>
            </div>

            <div style="
                font-size: 12px;
                margin-top: 8px;
                width: 100%;
                text-align: left;
                color: #000000;
              ">
              <div style="font-weight: bold; margin-bottom: 4px">
                Tembusan :
              </div>

              <ol v-if="selectedTembusan.length > 0" style="
                margin-left: 0;
                padding-left: 1.5rem;
                list-style-type: decimal;
                list-style-position: outside;
              ">
                <li v-for="t in selectedTembusan" :key="t.value" style="
                  padding-left: 0.25rem;
                  text-indent: 0;
                ">
                  {{ t.label }}
                </li>
              </ol>

              <div v-else style="font-style: italic; color: #000000">...</div>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>

    <USlideover v-model:open="isOpenPreview" title="Preview PDF" side="bottom" :ui="{
      content: 'h-screen max-h-screen',
      body: 'p-0'
    }">
      <template #body>
        <div class="h-full w-full flex items-center justify-center bg-gray-100 bg-white">
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
/* IMPORTS                                  */
/* -------------------------------------------------------------------------- */
import { ref, computed, onMounted, nextTick } from "vue";
import { CalendarDate } from '@internationalized/date';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

// Components
import TextEditor from "~/components/TextEditor.vue";

// Types
import type { Berkas } from "~/types/berkas";
import type { DraftPayload } from '~/types/draft';

/* -------------------------------------------------------------------------- */
/* COMPOSABLES                                */
/* -------------------------------------------------------------------------- */
const { saveDraft, isLoadingDraft } = useDraft();
const { getBerkasList } = useBerkas();
const { getRecipients } = useRecipients();

/* -------------------------------------------------------------------------- */
/* STATE & REFS                                 */
/* -------------------------------------------------------------------------- */
// --- UI State ---
const breadcrumbs = [{ label: 'Dashboard', to: '/user/dashboard' }, { label: 'Tulis Nota Dinas', to: '#' }];
const isFullscreenEditor = ref(false);
const isTemplateModalOpen = ref(false);
const isOpenPreview = ref(false);
const open = ref(false);

// --- Form State ---
const date = ref<CalendarDate>();
const subject = ref("");
const selectedSifat = ref();
const uploadedFiles = ref<File[]>([]);
// const english = ref(false); // Ref untuk bahasa (jika diperlukan)

// --- Data Lists & Select ---
const berkasList = ref<Berkas[]>([]);
const berkasStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
const selectedBerkasId = ref<string | null>(null);

const items = ref([]); // Raw recipients data
const selectedTertuju = ref([]);
const selectedTembusan = ref([]);

// --- Editor & PDF State ---
const editorContent = ref("");
const rawHtmlContent = ref("");
const textEditorComponent = ref();
const pdfSourceRef = ref<HTMLElement | null>(null);
const pdfUrl = ref('');
let quillInstance: any = null;

// --- Static Options ---
const templates = [{ id: 1, name: 'Default', content: `<ol><li>Poin 1</li></ol>` }];
const sifatOptions = [{ label: 'Rahasia', value: 'rahasia' }, { label: 'Biasa', value: 'biasa' }];

/* -------------------------------------------------------------------------- */
/* COMPUTED PROPERTIES                             */
/* -------------------------------------------------------------------------- */
const selectedBerkas = computed(() => {
  return berkasList.value.find((b) => b.id === selectedBerkasId.value);
});

const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day);
  return jsDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
});

const itemsTembusan = computed(() => {
  return items.value.map(item => ({
    ...item,
    disabled: selectedTertuju.value.some(s => s.value === item.value)
  }))
})

const itemsTertuju = computed(() => {
  return items.value.map(item => ({
    ...item,
    disabled: selectedTembusan.value.some(s => s.value === item.value)
  }))
})

/* -------------------------------------------------------------------------- */
/* HELPER METHODS                               */
/* -------------------------------------------------------------------------- */
const onEditorReady = (q: any) => {
  quillInstance = q;
};

const cleanContent = (content: string) => content;

const toggleFullscreenEditor = () => {
  isFullscreenEditor.value = !isFullscreenEditor.value;
  document.body.style.overflow = isFullscreenEditor.value ? "hidden" : "";
};

const applyTemplate = (t: any) => {
  if (textEditorComponent.value) textEditorComponent.value.setHtml(t.content);
  isTemplateModalOpen.value = false;
};

const isItemSelected = (item, list) =>
  list.some((s) => s.value === item.value)

const removeItem = (item, list, event) => {
  event.stopPropagation()
  const index = list.findIndex((s) => s.value === item.value)
  if (index > -1) list.splice(index, 1)
}

/* -------------------------------------------------------------------------- */
/* CORE FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

// --- 1. Generate PDF Blob ---
const getGeneratedPdfBlob = async (): Promise<Blob | null> => {
  // Sync Content Editor
  if (quillInstance) {
    rawHtmlContent.value = quillInstance.root.innerHTML
  } else {
    rawHtmlContent.value = editorContent.value
  }

  await nextTick()
  const element = pdfSourceRef.value
  if (!element) return null

  // Clone element untuk processing
  const clone = element.cloneNode(true) as HTMLElement

  // Inject Style (Sama seperti preview)
  const style = document.createElement("style")
  style.innerHTML = `
    * { box-sizing: border-box !important; color: #000000 !important; border-color: #000000 !important; }
    body, div, p, span, li, td, th, .tn-roman { font-family: 'Times New Roman', serif !important; }
    p { margin: 0 !important; line-height: 1.42 !important; }
    ol { list-style-type: decimal !important; padding-left: 1.5em !important; margin: 0 !important; }
    ul { list-style-type: disc !important; padding-left: 1.5em !important; margin: 0 !important; }
    li { padding-left: 0.5em !important; }
    table { border-collapse: collapse !important; width: 100% !important; }
    .ql-align-center { text-align: center !important; }
    .ql-align-right { text-align: right !important; }
    .ql-align-justify { text-align: justify !important; }
  `
  clone.appendChild(style)

  // Ghost Container
  const ghostDiv = document.createElement("div")
  Object.assign(ghostDiv.style, {
    position: 'fixed', top: '0', left: '-9999px', zIndex: '-9999',
    backgroundColor: '#ffffff', width: '180mm', padding: '0'
  })
  ghostDiv.appendChild(clone)
  document.body.appendChild(ghostDiv)

  try {
    const html2pdf = (await import("html2pdf.js")).default
    const { PDFDocument } = await import('pdf-lib')

    const opt = {
      margin: [15, 15, 20, 15],
      filename: `temp.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }

    // 1. Generate Main PDF dari HTML
    const mainPdfBuffer = await html2pdf().set(opt).from(clone).output('arraybuffer')

    // 2. Merge dengan PDF Lib
    const mergedPdf = await PDFDocument.create()
    const mainPdfDoc = await PDFDocument.load(mainPdfBuffer)
    const pages = await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices())
    pages.forEach(p => mergedPdf.addPage(p))

    // 3. Merge Lampiran (Jika ada)
    for (const file of uploadedFiles.value) {
      if (file.type === 'application/pdf') {
        try {
          const fileBuffer = await file.arrayBuffer()
          const attachmentDoc = await PDFDocument.load(fileBuffer)
          const attachmentPages = await mergedPdf.copyPages(attachmentDoc, attachmentDoc.getPageIndices())
          attachmentPages.forEach(p => mergedPdf.addPage(p))
        } catch (e) { console.error("Skip file error", e) }
      }
    }

    // 4. Return sebagai Blob
    const pdfBytes = await mergedPdf.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })

  } catch (err) {
    console.error("Gagal generate PDF Blob", err)
    return null
  } finally {
    document.body.removeChild(ghostDiv)
  }
}

// --- 2. Preview PDF ---
async function openPreview() {
  // Sync Content
  if (quillInstance) {
    rawHtmlContent.value = quillInstance.root.innerHTML;
  } else {
    rawHtmlContent.value = editorContent.value;
  }

  await nextTick();
  const element = pdfSourceRef.value;
  if (!element) return alert("Template PDF tidak ditemukan.");

  isOpenPreview.value = true;
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value);
  pdfUrl.value = '';

  const clone = element.cloneNode(true) as HTMLElement;

  const style = document.createElement("style");
  style.innerHTML = `
    * { box-sizing: border-box !important; color: #000000 !important; border-color: #000000 !important; }
    body, div, p, span, li, td, th, .tn-roman { font-family: 'Times New Roman', serif !important; }
    p { margin: 0 !important; line-height: 1.42 !important; }

    ol {
      list-style-type: decimal !important;
      padding-left: 1.5em !important;
      margin: 0 !important;
    }
    ul {
      list-style-type: disc !important;
      padding-left: 1.5em !important;
      margin: 0 !important;
    }
    li {
      padding-left: 0.5em !important;
    }

    table { border-collapse: collapse !important; width: 100% !important; }
    .ql-align-center { text-align: center !important; }
    .ql-align-right { text-align: right !important; }
    .ql-align-justify { text-align: justify !important; }
  `;
  clone.appendChild(style);

  const ghostDiv = document.createElement("div");
  Object.assign(ghostDiv.style, {
    position: 'fixed', top: '0', left: '-9999px', zIndex: '-9999',
    backgroundColor: '#ffffff', width: '180mm', padding: '0'
  });
  ghostDiv.appendChild(clone);
  document.body.appendChild(ghostDiv);

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const { PDFDocument } = await import('pdf-lib');

    const opt = {
      margin: [15, 15, 20, 15],
      filename: `Nota_Dinas.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    const mainPdfBuffer = await html2pdf().set(opt).from(clone).output('arraybuffer');
    const mergedPdf = await PDFDocument.create();
    const mainPdfDoc = await PDFDocument.load(mainPdfBuffer);
    (await mergedPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices())).forEach(p => mergedPdf.addPage(p));

    // Merge Uploaded Files
    for (const file of uploadedFiles.value) {
      if (file.type === 'application/pdf') {
        try {
          const fileBuffer = await file.arrayBuffer();
          const attachmentDoc = await PDFDocument.load(fileBuffer);
          (await mergedPdf.copyPages(attachmentDoc, attachmentDoc.getPageIndices())).forEach(p => mergedPdf.addPage(p));
        } catch (e) { console.error("Skip file error", e); }
      }
    }

    const blob = new Blob([await mergedPdf.save()], { type: 'application/pdf' });
    pdfUrl.value = URL.createObjectURL(blob);
  } catch (err: any) {
    alert("Gagal generate PDF: " + err.message);
    isOpenPreview.value = false;
  } finally {
    document.body.removeChild(ghostDiv);
  }
}

// --- 3. Save Draft Action ---
const handleSaveDraft = async () => {
  if (!selectedBerkas.value) {
    alert("Mohon pilih berkas arsip terlebih dahulu.")
    return
  }

  const pdfBlob = await getGeneratedPdfBlob()
  if (!pdfBlob) {
    alert("Gagal membuat PDF.")
    return
  }

  const formData = new FormData()

  // number
  formData.append("pengirim", 70016786)

  // --- ARRAY WAJIB FORMAT penerima[] ---
  selectedTertuju.value.forEach(i => {
    formData.append("penerima[]", i.value)
  })

  selectedTembusan.value.forEach(i => {
    formData.append("tembusan[]", i.value)
  })

  // informasi lain
  formData.append("klasifikasi", selectedBerkas.value.klasifikasi || "")
  formData.append("klasifikasi_text", selectedBerkas.value.isiRingkas || "")
  formData.append("sifat", selectedSifat.value?.value || "biasa")
  formData.append("perihal", subject.value)

  const contentHtml =
    quillInstance ? quillInstance.root.innerHTML : editorContent.value
  formData.append("konten", contentHtml)

  formData.append("nama_tempat", "Tangerang")
  formData.append("nama_jabatan", "AVP of Enterprise Technology Planning")
  formData.append("tanda_tangan", "vsydc526d728g29uwedhwidciwdcbhbddy2")
  formData.append("nama_lengkap", "Ivan Dwi Santoso")

  const tglStr = date.value
    ? `${date.value.year}-${String(date.value.month).padStart(2, "0")}-${String(
      date.value.day
    ).padStart(2, "0")}`
    : new Date().toISOString().split("T")[0]
  formData.append("tgl", tglStr)

  // FINAL PDF (dummy string sesuai request)
  formData.append("final_pdf", "Draft_Nota_Dinas.pdf")

  // Lampiran (kirim nama file saja)
  uploadedFiles.value.forEach((file) => {
    formData.append("lampiran_files[]", file.name)
  })

  // English default false
  formData.append("english", english.value ?? false)

  try {
    await saveDraft(formData)
    await navigateTo("/admin/korespondensi/terkirim")
  } catch (e) {
    console.error(e)
  }
}

/* -------------------------------------------------------------------------- */
/* LIFECYCLE HOOKS                              */
/* -------------------------------------------------------------------------- */
onMounted(async () => {
  // 1. Fetch Berkas
  try {
    berkasStatus.value = 'loading';
    const response = await getBerkasList();
    berkasList.value = Array.isArray(response) ? response : response?.data ?? [];
    berkasStatus.value = 'success';
  } catch (err) {
    console.error("Gagal mengambil daftar berkas", err);
    berkasStatus.value = 'error';
  }

  // 2. Fetch Recipients
  try {
    const res = await getRecipients(70016581)
    items.value = res.recipients.map(r => ({
      label: `${r.persnum_person_text} - (${r.position_abbreviation}) ${r.position_text}`,
      value: r.position,
      raw: r
    }))
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
  content: '•' !important;
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
  content: '•' !important;
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
