<template>
  <div>
    <div class="bg-white dark:bg-gray-900 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden">
      <PageHeader title="Tulis Disposisi" :items="breadcrumbs" />
    </div>

    <UCard variant="soft" :ui="{ root: 'rounded-t-none ring-0 shadow-none bg-white print:hidden' }">
      <div class="flex-1 overflow-y-auto space-y-1">

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 relative gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tanggal
            Disposisi</span>
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
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Sifat Naskah</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedSifat" :items="sifatOptions" placeholder="Pilih sifat ..." class="w-full p-0"
              :searchable="false" variant="none">
              <template #default>
                <div class="flex items-center gap-1.5 min-h-[2.5rem] pr-10 w-full">
                  <span v-if="selectedSifat" class="text-sm font-medium text-left truncate max-w-[200px]">{{
                    selectedSifat.label }}</span>
                  <span v-else class="text-sm text-gray-400">Pilih sifat...</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 font-medium shrink-0">Ref. Nomor Surat</span>
            <input type="text" v-model="refNumber"
              class="flex-1 outline-none text-gray-900 py-1 bg-transparent text-sm w-full"
              placeholder="Ketik nomor surat" />
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 font-medium shrink-0">Ref. Perihal Surat</span>
            <input type="text" v-model="subject"
              class="flex-1 outline-none text-gray-900 py-1 bg-transparent text-sm w-full"
              placeholder="Ketik perihal surat" />
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tertuju</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <!-- <USelectMenu v-model="tertujuList" :items="items" multiple placeholder="Kepada ..."
              class="w-full p-0" :search-input="{ placeholder: 'Cari tertuju', size: 'lg' }" variant="none" :ui="{
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' },
                transition: '',
                popper: { strategy: 'fixed' }
              }">
              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[2.5rem] pr-10 w-full">
                  <UBadge v-for="item in tertujuList" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md">
                    <span class="text-xs font-medium text-left truncate max-w-[150px]">{{ item.label }}</span>
                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 rounded shrink-0" @click="removeTertuju(item, $event)" />
                  </UBadge>
                  <span v-if="!tertujuList.length" class="text-sm text-gray-400">Pilih penerima...</span>
                </div>
              </template>
            </USelectMenu> -->
            <div class="w-full">
              <!-- Display Selected Items -->
              <div class="flex items-center gap-1.5 flex-wrap w-full">
                <UBadge v-for="item in tertujuList" :key="item.value" color="primary" variant="soft" size="md"
                  class="gap-1.5 pl-2 pr-1 flex items-center rounded-md">
                  <span class="text-xs font-medium text-left truncate max-w-[500px]">
                    {{ item.label }}
                  </span>
                  <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                    class="w-4 h-4 hover:bg-gray-200 rounded shrink-0" @click="removeTertuju(item)" />
                </UBadge>
                <!-- <span v-if="!tertujuList.length" class="text-sm text-gray-400">
                  Pilih penerima...
                </span> -->
              </div>

              <!-- CommandPalette with Virtualization -->
              <UPopover :disabled="isLoadingRecipient" :ui="{ content: 'p-0 w-full min-w-[500px]' }">
                <div class="w-full flex items-center justify-between py-1.5 cursor-pointer bg-transparent group"
                  :class="isLoadingRecipient ? 'cursor-wait' : ''">

                  <div class="flex items-center gap-2 text-sm text-gray-400 flex-1 overflow-hidden">
                    <UIcon v-if="isLoadingRecipient" name="i-lucide-loader-2"
                      class="animate-spin size-4 shrink-0 text-primary-500" />

                    <span class="truncate group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                      {{ isLoadingRecipient ? 'Sedang memuat data...' : 'Cari tertuju...' }}
                    </span>
                  </div>

                  <UIcon name="i-heroicons-chevron-down-20-solid" class="size-5 text-gray-400 shrink-0" />
                </div>

                <template #content="{ close }">
                  <UCommandPalette v-model="tertujuList" multiple virtualize placeholder="Cari tertuju..."
                    :groups="groups" :fuse="{
                      resultLimit: 20,
                      fuseOptions: {
                        threshold: 0.3,
                        keys: ['label', 'suffix']
                      }
                    }" class="w-full" :ui="{
                      input: '[&>input]:h-12 [&>input]:text-sm',
                      content: 'h-[360px]',
                      viewport: 'max-h-[350px]'
                    }" />
                </template>
              </UPopover>
            </div>
          </div>
        </div>

        <div class="flex flex-col py-3 border-b border-gray-200 gap-3">
          <span class="text-sm font-medium text-gray-500">Instruksi / Disposisi</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="opt in checklistOptions" :key="opt" class="flex items-center gap-2">
              <input type="checkbox" :id="opt" :value="opt" v-model="selectedChecklist"
                class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
              <label :for="opt" class="text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer select-none">
                {{ opt }}
              </label>
            </div>
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
            <div class="flex flex-col bg-gray-100 dark:bg-gray-900 transition-all duration-300"
              :class="isFullscreenEditor ? 'fixed inset-0 z-[9999] w-screen h-screen' : 'relative h-screen border border-gray-200 rounded-lg overflow-hidden'">

              <div v-if="isFullscreenEditor" class="absolute top-4 right-6 z-[10000]">
                <UButton icon="i-lucide-minimize" color="red" variant="solid" label="Keluar Fullscreen"
                  class="shadow-xl ring-2 ring-white" @click="toggleFullscreenEditor" />
              </div>

              <TextEditor ref="textEditorComponent" v-model="editorContent" :is-fullscreen="isFullscreenEditor"
                @ready="onEditorReady" placeholder="Ketik Catatan Disposisi disini...">

                <template #header>
                  <div class="w-full border-2 border-black font-serif text-black select-none bg-white">
                    <div class="flex border-b-2 border-black p-2">
                      <div class="w-1/2 flex items-center gap-2">
                        <img src="/logoAirnav.png" alt="Logo" class="h-12 w-auto object-contain" />
                        <span class="font-bold text-lg">AirNav Indonesia</span>
                      </div>
                      <div class="w-1/2 text-right font-bold text-sm flex flex-col justify-center">
                        <div>LEMBAR DISPOSISI</div>
                        <div>KEPALA DIVISI UMUM</div>
                      </div>
                    </div>

                    <div class="flex border-b-2 border-black">
                      <div class="w-2/3 border-r-2 border-black flex">
                        <div class="w-24 p-1 border-r border-black font-bold text-xs flex items-center">AGENDA</div>
                        <div class="flex-1 text-xs">
                          <div class="flex border-b border-black">
                            <div class="w-16 p-1 border-r border-black">Surat dari</div>
                            <div class="p-1 flex-1">: {{ selectedSender?.label || '-' }}</div>
                          </div>
                          <div class="flex border-b border-black">
                            <div class="w-16 p-1 border-r border-black">Tanggal</div>
                            <div class="p-1 flex-1">: {{ formattedDate }}</div>
                          </div>
                          <div class="flex border-b border-black">
                            <div class="w-16 p-1 border-r border-black">Nomor</div>
                            <div class="p-1 flex-1">: {{ refNumber || '-' }}</div>
                          </div>
                          <div class="flex">
                            <div class="w-16 p-1 border-r border-black">Perihal</div>
                            <div class="p-1 flex-1">: {{ subject || '-' }}</div>
                          </div>
                        </div>
                        <div class="w-24 p-1 border-l border-black font-bold text-xs flex flex-col justify-center">
                          <div>No:</div>
                          <div class="mt-2">Tgl:</div>
                        </div>
                      </div>
                      <div class="w-1/3 p-1 text-xs">
                        <div class="font-bold mb-1 border-b border-black pb-1">KLASIFIKASI</div>
                        <div class="flex flex-col gap-1">
                          <div class="flex items-center gap-1">
                            <span class="text-sm">{{ selectedSifat?.value === 'sangat_rahasia' ? '☑' : '☐' }}</span>
                            Sangat Rahasia
                          </div>
                          <div class="flex items-center gap-1">
                            <span class="text-sm">{{ selectedSifat?.value === 'rahasia' ? '☑' : '☐' }}</span> Rahasia
                          </div>
                          <div class="flex items-center gap-1">
                            <span class="text-sm">{{ selectedSifat?.value === 'terbatas' ? '☑' : '☐' }}</span> Terbatas
                          </div>
                          <div class="flex items-center gap-1">
                            <span class="text-sm">{{ selectedSifat?.value === 'biasa' ? '☑' : '☐' }}</span> Biasa
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="p-2 border-b-2 border-black text-xs">
                      <div class="mb-2">
                        <span class="font-bold">Kepada Yth. :</span>
                        {{tertujuList.length ? tertujuList.map(s => s.label).join(', ') :
                          '................................................'}}
                      </div>
                      <div class="flex justify-between mt-2">
                        <div class="flex items-center gap-1"><span class="text-lg">☐</span> MANAGER PELAYANAN UMUM</div>
                        <div class="flex items-center gap-1"><span class="text-lg">☐</span> MANAGER TATA USAHA DAN
                          DOKUMEN</div>
                      </div>
                      <div class="flex justify-end mt-1">
                        <div class="flex items-center gap-1"><span class="text-lg">☐</span> MANAGER FASILITAS DAN
                          PERLENGKAPAN PERKANTORAN</div>
                      </div>
                    </div>

                    <div class="p-1 border-b-2 border-black text-xs flex">
                      <div class="w-20 font-bold">DISPOSISI:</div>
                      <div class="flex-1 grid grid-cols-3 gap-x-2 gap-y-1">
                        <div v-for="opt in checklistOptions" :key="opt" class="flex items-center gap-1">
                          <span class="text-sm">{{ selectedChecklist.includes(opt) ? '☑' : '☐' }}</span> {{ opt }}
                        </div>
                      </div>
                    </div>

                    <div class="p-1 font-bold text-xs bg-white">
                      CATATAN :
                    </div>
                  </div>
                </template>

                <template #footer>
                  <div
                    class="w-full border-x-2 border-b-2 border-black font-serif text-black p-2 bg-white relative mt-[-2px] select-none">
                    <div class="flex justify-end mb-4">
                      <div class="border-2 border-black w-24 h-16 flex items-center justify-center font-bold text-xs">
                        Paraf
                      </div>
                    </div>

                    <div class="border-t-2 border-black pt-1 text-[10px] font-bold">
                      CATATAN<br>
                      Lembar disposisi ini menjadi bagian yang tidak terpisahkan dari nomor dan tanggal surat pada
                      agenda ini.
                    </div>
                  </div>
                </template>

              </TextEditor>
            </div>
          </ClientOnly>

          <div class="flex flex-col py-3 gap-2">
            <label class="text-sm font-medium text-gray-700">Lampiran File</label>
            <input type="file" accept="application/pdf" multiple @change="handleFileUpload"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer border border-gray-200 rounded-lg bg-gray-50 focus:outline-none" />
            <div v-if="uploadedFiles.length > 0" class="flex flex-col gap-2 mt-2">
              <div v-for="(file, index) in uploadedFiles" :key="index"
                class="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md">
                <span class="text-sm text-gray-700 truncate">{{ file.name }}</span>
                <UButton icon="i-lucide-x" color="red" variant="ghost" size="xs" :padded="false"
                  @click="removeFile(index)" />
              </div>
            </div>
          </div>
        </div>

        <div class="py-6 gap-4 border-t border-gray-100 flex items-center justify-end bg-white">
          <UButton label="Simpan Draft" color="gray" variant="outline" size="lg" icon="i-heroicons-document-text"
            class="px-8" />
          <UButton label="Kirim Dokumen" color="primary" size="lg" icon="i-heroicons-paper-airplane"
            class="px-8 font-bold" />
        </div>
      </div>
    </UCard>

    <ClientOnly>
      <div class="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden">
        <div ref="pdfSourceRef"
          style="width: 100%; max-width: 800px; padding: 0; background-color: #ffffff; color: #000000; font-family: 'Times New Roman', Times, serif; position: relative; box-sizing: border-box;">

          <table style="border-collapse: collapse; width: 100%; border: 2px solid #000; font-size: 11px;">

            <tr style="border-bottom: 2px solid #000;">
              <td colspan="2" style="width: 65%; padding: 5px 10px; vertical-align:top;">
                <div style="display: flex; align-items: center; gap: 15px;">
                  <img src="/logoAirnav.png" style="height: 50px; object-fit: contain;" alt="Logo" />
                  <span style="font-weight: bold; font-size: 18px;">AirNav Indonesia</span>
                </div>
              </td>
              <td style="width: 35%; text-align: right; padding: 5px 10px; vertical-align:top;">
                <div style="font-weight: bold; font-size: 12px;">LEMBAR DISPOSISI</div>
                <div style="font-weight: bold; font-size: 12px;">KEPALA DIVISI UMUM</div>
              </td>
            </tr>

            <tr style="border-bottom: 2px solid #000;">

              <td style="width: 15%; border-right: 2px solid #000; vertical-align:top; padding: 8px;">
                <div style="font-weight: bold; text-decoration: underline; margin-bottom: 25px;">AGENDA</div>
                <div style="margin-bottom: 15px;">No : <span
                    style="display:inline-block; border-bottom:1px solid #000; width: 40px;">&nbsp;</span></div>
                <div>Tgl : <span style="display:inline-block; border-bottom:1px solid #000; width: 40px;">&nbsp;</span>
                </div>
              </td>

              <td style="width: 55%; border-right: 2px solid #000; vertical-align:top; padding: 8px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                  <tr>
                    <td style="width: 70px; padding-bottom: 6px;">Surat dari</td>
                    <td style="padding-bottom: 6px;">: <b>{{ selectedSender?.label || '-' }}</b></td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 6px;">Tanggal</td>
                    <td style="padding-bottom: 6px;">: {{ formattedDate }}</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 6px;">Nomor</td>
                    <td style="padding-bottom: 6px;">: {{ refNumber || '-' }}</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 6px; vertical-align:top;">Perihal</td>
                    <td style="padding-bottom: 6px;">: {{ subject || '-' }}</td>
                  </tr>
                </table>
              </td>

              <td style="width: 30%; vertical-align:top; padding: 8px;">
                <div style="font-weight: bold; text-decoration: underline; margin-bottom: 8px;">KLASIFIKASI</div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <div style="display:flex; align-items: center;">
                    <span style="font-size:14px; margin-right:5px; line-height:1;">{{ selectedSifat?.value ===
                      'sangat_rahasia' ? '☑' : '☐' }}</span> Sangat Rahasia
                  </div>
                  <div style="display:flex; align-items: center;">
                    <span style="font-size:14px; margin-right:5px; line-height:1;">{{ selectedSifat?.value === 'rahasia'
                      ?
                      '☑' : '☐' }}</span> Rahasia
                  </div>
                  <div style="display:flex; align-items: center;">
                    <span style="font-size:14px; margin-right:5px; line-height:1;">{{ selectedSifat?.value ===
                      'terbatas' ?
                      '☑' : '☐' }}</span> Terbatas
                  </div>
                  <div style="display:flex; align-items: center;">
                    <span style="font-size:14px; margin-right:5px; line-height:1;">{{ selectedSifat?.value === 'biasa' ?
                      '☑'
                      : '☐' }}</span> Biasa
                  </div>
                </div>
              </td>
            </tr>

            <tr style="border-bottom: 2px solid #000;">
              <td colspan="3" style="padding: 10px;">
                <div style="font-weight: bold; margin-bottom: 10px; text-decoration: underline;">Kepada Yth. :</div>

                <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 11px;">
                  <div style="width: 32%; display:flex; gap: 5px;">
                    <span style="font-size:14px; line-height:1;">{{ false ? '☑' : '☐' }}</span>
                    <span>MANAGER PELAYANAN UMUM</span>
                  </div>
                  <div style="width: 34%; display:flex; gap: 5px;">
                    <span style="font-size:14px; line-height:1;">{{ false ? '☑' : '☐' }}</span>
                    <span>MANAGER TATA USAHA DAN DOKUMEN</span>
                  </div>
                  <div style="width: 32%; display:flex; gap: 5px;">
                    <span style="font-size:14px; line-height:1;">{{ false ? '☑' : '☐' }}</span>
                    <span>MANAGER FASILITAS DAN PERLENGKAPAN PERKANTORAN</span>
                  </div>
                </div>

                <div style="margin-top: 8px; margin-left: 18px;">
                  {{tertujuList.length ? tertujuList.map(e => e.label).join(', ') : ''}}
                </div>
              </td>
            </tr>

            <tr style="border-bottom: 2px solid #000;">
              <td colspan="3" style="padding: 10px;">
                <div style="display: flex; width: 100%;">
                  <div style="width: 90px; font-weight: bold; text-decoration: underline; padding-top: 2px;">DISPOSISI :
                  </div>
                  <div style="flex: 1;">
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 10px;">
                      <div v-for="opt in checklistOptions" :key="opt"
                        style="display: flex; align-items: center; white-space: nowrap;">
                        <span style="font-size: 14px; margin-right: 5px; line-height: 1;">
                          {{ selectedChecklist.includes(opt) ? '☑' : '☐' }}
                        </span>
                        <span>{{ opt }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td colspan="3" style="padding: 10px; vertical-align:top; position: relative;">

                <div style="font-weight: bold; margin-bottom: 8px; text-decoration: underline;">CATATAN :</div>

                <div v-html="cleanContent(rawHtmlContent)"
                  style="font-size: 11px; line-height: 1.4;margin-bottom: 40px;">
                </div>

                <div style="position: absolute; bottom: 10px; right: 15px;">
                  <div
                    style="border: 1px solid #000; width: 100px; height: 50px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                    Paraf
                  </div>
                </div>

              </td>
            </tr>

            <tr>
              <td colspan="3" style="border-top: 2px solid #000; padding: 5px 10px;">
                <div style="font-weight: bold; font-size: 10px; text-decoration: underline; margin-bottom: 2px;">CATATAN
                </div>
                <div style="font-size: 10px;">
                  Lembar disposisi ini menjadi bagian yang tidak terpisahkan dari nomor dan tanggal surat pada agenda
                  ini.
                </div>
              </td>
            </tr>

          </table>
        </div>
      </div>
    </ClientOnly>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { CalendarDate } from '@internationalized/date'
import TextEditor from '~/components/TextEditor.vue'

// --- STATE ---
const pdfSourceRef = ref<HTMLElement | null>(null)
const rawHtmlContent = ref('')
const editorContent = ref('')
const textEditorComponent = ref()
let quillInstance: any = null

const date = ref<CalendarDate>()
const open = ref(false)
const senders_selected = ref('')
const subject = ref('')
const refNumber = ref('') // Tambahan untuk Nomor Surat
const isFullscreenEditor = ref(false)
const uploadedFiles = ref<File[]>([])

const id = 70016581  // nanti bisa dari router kalau mau

// const { data, pending, error } = await useFetch(`/api/recipient/${id}`)

// hasil akhir USelectMenu
const { data, status, error } = await useFetch(`/api/recipient/${id}`, {
  lazy: true,
  server: false // Opsional: jika ingin fetch hanya terjadi di client side (mengurangi beban server nuxt)
})

const isLoadingRecipient = computed(() => status.value === 'pending')

// 3. Perbaiki computed items agar tidak error saat data belum ada (karena lazy)
const items = computed(() => {
  // Cek jika data belum ada atau struktur belum lengkap
  if (!data.value || !data.value.recipients) return []

  return [
    ...(data.value.recipients.ATASAN || []),
    ...(data.value.recipients.BAWAHAN || [])
  ]
})

const tertujuList = ref([])

// Format data items
const groups = computed(() => [{
  id: 'users',
  items: items.value || []
}])

function removeTertuju(item: any) {
  tertujuList.value = tertujuList.value.filter(i => i.value !== item.value)
}

// --- STATE: CHECKBOX MULTI-SELECT ---
const selectedChecklist = ref<string[]>([])
// Opsi sesuai gambar
const checklistOptions = [
  'Udk', 'Harap Mewakili', 'Monitor', 'Untuk Dijadikan Acuan',
  'Proses', 'Cek', 'Dikajikemungkinannya', 'Untuk Dapat Dipergunakan',
  'Evaluasi', 'Laporkan', 'Untuk Menjadi Perhatian'
]

// --- MOCK DATA ---
const senders = [{ label: 'Berkas - OTP', value: 'tes1' }, { label: 'Berkas - Runway Cap', value: 'tes2' }]
// const items = ref([{ label: 'Direksi Perum LPPNPI', value: 'direksi' }, { label: 'Setio Anggoro', value: 'setio' }])
const breadcrumbs = [{ label: 'Dashboard', to: '/user/dashboard' }, { label: 'Tulis Disposisi', to: '#' }]
const sifatOptions = [
  { label: 'Sangat Rahasia', value: 'sangat_rahasia' },
  { label: 'Rahasia', value: 'rahasia' },
  { label: 'Terbatas', value: 'terbatas' },
  { label: 'Biasa', value: 'biasa' }
]
const selectedSifat = ref()

onMounted(() => {
  const now = new Date()
  date.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
})

// --- COMPUTED ---
const formattedDate = computed(() => {
  if (!date.value) return '-'
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day)
  return jsDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
})
const selectedSender = computed(() => senders.find(s => s.value === senders_selected.value))

// --- HANDLERS ---
const onEditorReady = (q: any) => { quillInstance = q; }
const cleanContent = (content: string) => content
const handleFileUpload = (e: any) => { /* logic upload */ }
const removeFile = (i: number) => { uploadedFiles.value.splice(i, 1) }
const toggleFullscreenEditor = () => { isFullscreenEditor.value = !isFullscreenEditor.value; document.body.style.overflow = isFullscreenEditor.value ? 'hidden' : '' }
// const removeTertuju = (i: any, e: Event) => { e.stopPropagation(); tertujuList.value = tertujuList.value.filter((x: any) => x.value !== i.value) }

// --- PDF GENERATOR ---
async function openPreview() {
  if (quillInstance) {
    rawHtmlContent.value = quillInstance.root.innerHTML
  } else {
    rawHtmlContent.value = editorContent.value
  }

  await nextTick()

  const element = pdfSourceRef.value
  if (!element) {
    alert("Error: Template PDF tidak ditemukan.")
    return
  }

  const clone = element.cloneNode(true) as HTMLElement
  const style = document.createElement('style');
  style.innerHTML = `
    * { box-sizing: border-box !important; color: #000000 !important; border-color: #000000 !important; }
    .tn-roman, .tn-roman * { font-family: 'Times New Roman', serif !important; }
    p, div, span, li, ul, ol { page-break-inside: auto !important; }
    table, tr, td, th, img, h1, h2, h3 { page-break-inside: avoid !important; }
    p { margin: 0 !important; padding-bottom: 0.5em !important; line-height: 1.5 !important; }
    *:not(td):not(tr) { background-color: transparent !important; }
    svg, path { fill: #000000 !important; stroke: #000000 !important; }
  `;
  clone.appendChild(style);

  const ghostDiv = document.createElement('div')
  ghostDiv.style.position = 'fixed'; ghostDiv.style.top = '0'; ghostDiv.style.left = '0'; ghostDiv.style.zIndex = '-9999';
  ghostDiv.style.backgroundColor = '#ffffff'; ghostDiv.style.width = '180mm'; ghostDiv.style.padding = '0';
  ghostDiv.appendChild(clone)
  document.body.appendChild(ghostDiv)

  try {
    const html2pdf = (await import('html2pdf.js')).default
    const opt = {
      margin: [15, 15, 20, 15],
      filename: `Disposisi_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0, ignoreElements: (el: any) => el.tagName === 'LINK' || el.tagName === 'STYLE' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css'] }
    };

    await html2pdf().set(opt).from(clone).toPdf().get('pdf').then((pdf: any) => {
      window.open(pdf.output('bloburl') + '#toolbar=0&navpanes=0&scrollbar=0', '_blank');
    });
  } catch (err: any) {
    console.error("PDF Error:", err); alert("Gagal: " + err.message);
  } finally {
    document.body.removeChild(ghostDiv)
  }
}
</script>
