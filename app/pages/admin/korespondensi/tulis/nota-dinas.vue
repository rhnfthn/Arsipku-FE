<template>
  <div>
    <div class="bg-white dark:bg-gray-900 z-30 p-4 sm:px-6 rounded-t-lg mb-0 print:hidden">
      <PageHeader title="Tulis Nota Dinas" :items="breadcrumbs" />
    </div>

    <UCard variant="soft" :ui="{ root: 'rounded-t-none ring-0 shadow-none bg-white print:hidden' }">
      <div class="flex-1 overflow-y-auto space-y-1">

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Berkas</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="senders_selected" :items="senders" value-key="value" placeholder="Pilih Pengirim"
              :search-input="{ placeholder: 'Cari berkas', size: 'lg' }" variant="none" class="w-full" :ui="{
                base: '!px-0 !bg-transparent w-full',
                ring: 'ring-0',
                shadow: 'shadow-none',
              }">
              <template #item="{ item }">
                <div class="flex items-center gap-3 w-full py-1 overflow-hidden">
                  <span class="truncate text-sm">{{ item.label }}</span>
                </div>
              </template>
              <template #default>
                <span v-if="selectedSender" class="truncate text-sm block w-full text-left">
                  {{ selectedSender.label }}
                </span>
                <span v-else class="text-gray-400 text-sm block w-full text-left">
                  Pilih berkas pengirim...
                </span>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 relative gap-1 sm:gap-0">
          <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tanggal Surat</span>
          <div class="relative w-full">
            <ClientOnly>
              <UPopover v-model:open="open" :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
                <div class="flex items-center gap-2 cursor-pointer w-full pr-2" @click="open = true">
                  <UInputDate locale="id-ID" ref="inputDateRef" v-model="date" variant="none" size="sm"
                    format="DD MMMM YYYY" class="flex-1"
                    :ui="{ base: '!bg-transparent !text-sm !px-0 !ring-0 pointer-events-none inline-flex items-center h-8' }" />
                  <UIcon name="i-lucide-calendar" class="size-4 text-gray-400 shrink-0 mr-1" />
                </div>
                <template #content>
                  <UCalendar v-model="date" class="p-2" @update:model-value="open = false" />
                </template>
              </UPopover>
              <template #fallback>
                <div class="h-8 w-full bg-gray-50 animate-pulse rounded"></div>
              </template>
            </ClientOnly>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tertuju</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="tertujuList" :items="items" multiple placeholder="Kepada ..." class="w-full p-0"
              :search-input="{ placeholder: 'Cari tertuju', size: 'lg' }" variant="none" :ui="{
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' }
              }">
              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[2.5rem] pr-10 w-full">
                  <UBadge v-for="item in tertujuList" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md">
                    <span class="text-xs font-medium text-left truncate max-w-[150px]">
                      {{ item.label }}
                    </span>
                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 rounded shrink-0" @click="removeTertuju(item, $event)" />
                  </UBadge>
                  <span v-if="!tertujuList.length" class="text-sm text-gray-400">Pilih penerima...</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tembusan</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="tembusanList" :items="tembusanOptions" multiple placeholder="Tembusan ..."
              class="w-full p-0" :search-input="{ placeholder: 'Cari tertuju', size: 'lg' }" variant="none" :ui="{
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' }
              }">
              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[2.5rem] pr-10 w-full">
                  <UBadge v-for="item in tembusanList" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md">
                    <span class="text-xs font-medium text-left truncate max-w-[150px]">
                      {{ item.label }}
                    </span>
                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 rounded shrink-0" @click="removeTembusan(item, $event)" />
                  </UBadge>
                  <span v-if="!tembusanList.length" class="text-sm text-gray-400">Pilih penerima...</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">
            Sifat
          </span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selectedSifat" :items="sifatOptions" placeholder="Pilih sifat ..." class="w-full p-0"
              :searchable="false" variant="none" :ui="{
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' }
              }">
              <template #default>
                <div class="flex items-center gap-1.5 min-h-[2.5rem] pr-10 w-full">
                  <span v-if="selectedSifat" class="text-sm font-medium text-left truncate max-w-[200px]">
                    {{ selectedSifat.label }}
                  </span>
                  <span v-else class="text-sm text-gray-400">
                    Pilih sifat...
                  </span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-32 text-sm text-gray-500 font-medium shrink-0">Perihal</span>
            <input type="text" v-model="subject"
              class="flex-1 outline-none text-gray-900 py-1 bg-transparent text-sm w-full"
              placeholder="Ketik perihal" />
          </div>
        </div>

        <div class="flex flex-col py-4">
          <div class="flex flex-wrap items-center justify-between w-full gap-3 mb-2">
            <div class="flex flex-wrap gap-2 flex-shrink-0">
              <UModal v-model="isTemplateModalOpen" title="Pilih Template">
                <UButton label="Pilih Template" color="primary" variant="soft"
                  icon="i-heroicons-adjustments-horizontal" class="font-medium" />
                <template #body>
                  <div class="flex flex-col gap-2">
                    <UCard v-for="template in templates" :key="template.id"
                      class="cursor-pointer hover:bg-gray-50 transition" @click="applyTemplate(template)">
                      <div class="py-3">
                        <h3 class="font-bold">{{ template.name }}</h3>
                        <div class="text-sm text-gray-500 line-clamp-2" v-html="template.preview || template.content">
                        </div>
                      </div>
                    </UCard>
                  </div>
                </template>
              </UModal>
              <UDropdownMenu :items="insertMenuItems">
                <UButton color="primary" variant="soft" icon="i-lucide-file-text"
                  trailing-icon="i-lucide-chevron-down" label="Template" />
              </UDropdownMenu>
            </div>
            <div class="flex flex-wrap items-center gap-3">
              <UButton v-if="!isFullscreenEditor" icon="i-lucide-maximize" color="neutral" variant="soft"
                label="Fullscreen" @click="toggleFullscreenEditor" />
              <UButton icon="i-lucide-eye" color="neutral" variant="soft" label="Preview PDF" @click="openPreview" />
            </div>
          </div>

          <ClientOnly>
            <div class="flex flex-col bg-gray-100 dark:bg-gray-900 transition-all duration-300" :class="isFullscreenEditor
              ? 'fixed inset-0 z-[9999] w-screen h-screen'
              : 'relative h-screen border border-gray-200 rounded-lg overflow-hidden'">

              <div v-if="isFullscreenEditor" class="absolute top-4 right-6 z-[10000]">
                <UButton icon="i-lucide-minimize" color="red" variant="solid" label="Keluar Fullscreen"
                  class="shadow-xl ring-2 ring-white" @click="toggleFullscreenEditor" />
              </div>

              <div class="bg-white dark:bg-gray-800 border-b border-gray-200 shadow-sm shrink-0 z-[50]">
                <div class="py-3" :class="isFullscreenEditor ? 'w-full px-6' : 'container mx-auto'">
                  <div id="toolbar"
                    class="flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600 items-center">

                    <span class="ql-formats">
                      <button class="ql-undo !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded">
                        <UIcon name="i-lucide-undo-2" class="w-4 h-4" />
                      </button>
                      <button class="ql-redo !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded">
                        <UIcon name="i-lucide-redo-2" class="w-4 h-4" />
                      </button>
                    </span>

                    <span class="ql-formats">
                      <button class="ql-bold !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded">
                        <UIcon name="i-lucide-bold" class="w-4 h-4" />
                      </button>
                      <button class="ql-italic !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded">
                        <UIcon name="i-lucide-italic" class="w-4 h-4" />
                      </button>
                      <button class="ql-underline !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded">
                        <UIcon name="i-lucide-underline" class="w-4 h-4" />
                      </button>
                    </span>

                    <span class="ql-formats">
                      <button class="ql-align !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded" value="">
                        <UIcon name="i-lucide-align-left" class="w-4 h-4" />
                      </button>
                      <button class="ql-align !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded" value="center">
                        <UIcon name="i-lucide-align-center" class="w-4 h-4" />
                      </button>
                      <button class="ql-align !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded" value="right">
                        <UIcon name="i-lucide-align-right" class="w-4 h-4" />
                      </button>
                      <button class="ql-align !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded" value="justify">
                        <UIcon name="i-lucide-align-justify" class="w-4 h-4" />
                      </button>
                    </span>

                    <span class="ql-formats">
                      <button class="ql-list !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded" value="ordered">
                        <UIcon name="i-lucide-list-ordered" class="w-4 h-4" />
                      </button>
                      <button class="ql-list !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded" value="bullet">
                        <UIcon name="i-lucide-list" class="w-4 h-4" />
                      </button>
                    </span>

                    <span class="ql-formats">
                      <select class="ql-list h-8 !border-gray-300 rounded text-sm w-24">
                        <option value="" selected>Normal</option>
                        <option value="lower-alpha">a, b, c</option>
                        <option value="upper-alpha">A, B, C</option>
                        <option value="lower-roman">i, ii, iii</option>
                      </select>
                    </span>

                    <span class="ql-formats">
                      <button class="ql-indent !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded" value="-1">
                        <UIcon name="i-lucide-indent-decrease" class="w-4 h-4" />
                      </button>
                      <button class="ql-indent !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded" value="+1">
                        <UIcon name="i-lucide-indent-increase" class="w-4 h-4" />
                      </button>
                    </span>

                    <span class="ql-formats">
                      <button class="ql-html !w-8 !h-8 flex items-center justify-center hover:bg-gray-200 rounded">
                        <UIcon name="i-lucide-code" class="w-4 h-4" />
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto bg-gray-200 dark:bg-gray-900 transition-all duration-300 w-full"
                :class="isFullscreenEditor ? 'p-0' : 'p-8'">
                <div class="bg-white shadow-xl relative transition-all duration-300 flex flex-col tn-roman" :class="{
                  'fullscreen-editor': isFullscreenEditor,
                  'editor-container mx-auto': !isFullscreenEditor
                }">
                  <div class="px-12 py-4 flex items-center shrink-0 h-[3.5cm] border-gray-100 select-none">
                    <div class="w-full flex items-center pb-2">
                      <div class="flex items-end gap-4">
                        <img src="/logoAirnav.png" alt="Logo AirNav" class="h-16 w-auto object-contain" />
                        <div class="flex flex-col mb-1">
                          <span class="text-2xl font-bold tracking-wide text-[18px]">AirNav Indonesia</span>
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
                  </div>

                  <div class="px-12 mt-6 shrink-0 select-none">
                    <div class="text-center mb-6">
                      <h1 class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman">NOTA
                        DINAS
                      </h1>
                      <p class="text-lg mt-1 text-[14px]">Nomor : ..............................................</p>
                    </div>
                    <table class="w-full text-lg leading-relaxed mb-4 tn-roman">
                      <tbody>
                        <tr>
                          <td class="text-[14px] w-[120px] font-bold align-top">Kepada Yth.</td>
                          <td class="text-[14px] w-[20px] align-top">:</td>
                          <td class="text-[14px] align-top border-b border-dotted border-gray-300">
                            {{ tertujuList.length ? tertujuList.map(s => s.label).join(', ') :
                              '................................................' }}
                          </td>
                        </tr>
                        <tr>
                          <td class="text-[14px] font-bold align-top">Dari</td>
                          <td class="text-[14px] align-top">:</td>
                          <td class="text-[14px] align-top border-b border-dotted border-gray-300">
                            {{ selectedSender?.label || '................................................' }}
                          </td>
                        </tr>
                        <tr>
                          <td class="text-[14px] font-bold align-top">Perihal</td>
                          <td class="text-[14px] align-top">:</td>
                          <td class="text-[14px] align-top border-b border-dotted border-gray-300">
                            {{ subject || '................................................' }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div ref="editorRef" class="editor-content flex-1 tn-roman-editor"></div>

                  <div class="mt-8 px-12 pb-10 pt-4 tn-roman">
                    <div class="flex justify-end mb-4">
                      <div class="text-center min-w-[250px]">
                        <div class="mb-24 text-[14px]">
                          <div>Tangerang, {{ formattedDate }}</div>
                          <div class="font-bold">Nama Jabatan</div>
                        </div>
                        <div class="font-bold underline text-[14px]">NAMA LENGKAP</div>
                      </div>
                    </div>
                    <div class="text-[12px] mt-2 w-full text-left">
                      <div class="font-bold underline mb-1">Tembusan :</div>
                      <ol v-if="tembusanList.length > 0" class="list-decimal ml-4 pl-2">
                        <li v-for="t in tembusanList" :key="t.value">{{ t.label }}</li>
                      </ol>
                      <div v-else class="text-gray-400 italic">...</div>
                    </div>
                  </div>
                </div>

                <p v-if="!isFullscreenEditor" class="text-center text-gray-500 mt-4 text-sm">
                  *Tampilan edit tersambung. Klik <b>Preview PDF</b> untuk melihat hasil cetak.
                </p>
              </div>
            </div>
          </ClientOnly>

          <div class="flex flex-col py-3 gap-2">
            <label class="text-sm font-medium text-gray-700">Lampiran File</label>
            <div class="flex gap-2 items-center">
                 <input type="file" accept="application/pdf" multiple @change="handleFileUpload" ref="fileInputRef"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer border border-gray-200 rounded-lg bg-gray-50 focus:outline-none" />
            </div>

            <div v-if="uploadedFiles.length > 0" class="flex flex-col gap-2 mt-2">
                 <div v-for="(file, index) in uploadedFiles" :key="index" class="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md">
                     <div class="flex items-center gap-2 overflow-hidden">
                        <UIcon name="i-lucide-file-text" class="w-4 h-4 text-gray-500 shrink-0"/>
                        <span class="text-sm text-gray-700 truncate">{{ file.name }}</span>
                        <span class="text-xs text-gray-400 shrink-0">({{ (file.size / 1024).toFixed(1) }} KB)</span>
                     </div>
                     <UButton icon="i-lucide-x" color="red" variant="ghost" size="xs" @click="removeFile(index)" />
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

    <UModal v-model:open="showHtmlModal" title="Edit HTML Source" :ui="{ width: 'w-full sm:max-w-4xl' }">
      <template #body>
        <div class="flex flex-col gap-4">
          <textarea v-model="htmlContent"
            class="w-full h-96 p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-md focus:outline-none"
            spellcheck="false"></textarea>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Batal" color="gray" variant="soft" @click="showHtmlModal = false" />
          <UButton label="Simpan Perubahan" color="primary" icon="i-lucide-save" @click="saveHtmlContent" />
        </div>
      </template>
    </UModal>

    <ClientOnly>
      <div class="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none overflow-hidden">

        <div ref="pdfSourceRef"
          style="width: 100%; max-width: 800px; min-height: 297mm; padding: 0; background-color: #ffffff; color: #000000; font-family: 'Times New Roman', serif; position: relative;">

          <div
            style="display: flex; align-items: center; padding-bottom: 8px; margin-bottom: 24px; border-bottom: 2px solid #000000; position: relative; z-index: 10;">
            <div style="display: flex; align-items: flex-end; gap: 16px; flex: 1;">
              <img src="/logoAirnav.png" alt="Logo" style="height: 64px; width: auto; object-fit: contain;" />
              <div style="display: flex; flex-direction: column; margin-bottom: 4px;">
                <span style="font-size: 18px; font-weight: bold; letter-spacing: 0.025em; color: #000000;">AirNav
                  Indonesia</span>
              </div>
            </div>
            <div style="font-size: 10px; line-height: 1.1; text-align: right; color: #000000;">
              <div style="font-weight: bold;">Kantor Pusat Perum LPPNPI</div>
              <div>Gedung AirNav Indonesia</div>
              <div>Jl. Ir. H. Juanda, Tangerang 15121</div>
              <div>Banten – Indonesia</div>
              <div>Telp: 021-5591 5000 | Fax: 021-5591 5100</div>
              <div>www.airnavindonesia.co.id</div>
            </div>
          </div>

          <div style="text-align: center; margin-bottom: 24px; position: relative; z-index: 10;">
            <h1
              style="font-size: 16px; font-weight: bold; text-decoration: underline; text-underline-offset: 4px; text-transform: uppercase; color: #000000; margin: 0;">
              NOTA DINAS</h1>
            <p style="font-size: 14px; margin-top: 4px; color: #000000;">Nomor :
              ..............................................</p>
          </div>

          <table
            style="width: 100%; font-size: 14px; line-height: 1.6; margin-bottom: 24px; color: #000000; border-collapse: collapse; position: relative; z-index: 10;">
            <tbody>
              <tr>
                <td style="width: 100px; font-weight: bold; vertical-align: top;">Kepada Yth.</td>
                <td style="width: 10px; vertical-align: top;">:</td>
                <td style="vertical-align: top; border-bottom: 1px dotted #000000;">
                  {{ tertujuList.length ? tertujuList.map((s: any) => s.label).join(', ') : '...................' }}
                </td>
              </tr>
              <tr>
                <td style="font-weight: bold; vertical-align: top;">Dari</td>
                <td style="vertical-align: top;">:</td>
                <td style="vertical-align: top; border-bottom: 1px dotted #000000;">
                  {{ selectedSender?.label || '...................' }}
                </td>
              </tr>
              <tr>
                <td style="font-weight: bold; vertical-align: top;">Perihal</td>
                <td style="vertical-align: top;">:</td>
                <td style="vertical-align: top; font-weight: bold; border-bottom: 1px dotted #000000;">
                  {{ subject || '...................' }}
                </td>
              </tr>
              <tr>
                <td style="font-weight: bold; vertical-align: top;">Sifat</td>
                <td style="vertical-align: top;">:</td>
                <td style="vertical-align: top;">
                  {{ selectedSifat?.label || '-' }}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pdf-editor-content"
            style="width: 100%; text-align: justify; color: #000000; min-height: 50px; position: relative; z-index: 10;"
            v-html="cleanContent(rawHtmlContent)">
          </div>

          <div
            style="width: 100%; display: block; page-break-inside: avoid; break-inside: avoid; margin-top: 32px; position: relative; z-index: 10;">

            <div style="display: flex; justify-content: flex-end; margin-bottom: 16px; color: #000000;">
              <div style="text-align: center; min-width: 200px;">
                <div style="margin-bottom: 96px; font-size: 14px;">
                  <div>Tangerang, {{ formattedDate }}</div>
                  <div style="font-weight: bold;">Nama Jabatan</div>
                </div>
                <div style="font-weight: bold; text-decoration: underline; font-size: 14px;">NAMA LENGKAP</div>
              </div>
            </div>

            <div style="font-size: 12px; margin-top: 8px; width: 100%; text-align: left; color: #000000;">
              <div style="font-weight: bold; text-decoration: underline; margin-bottom: 4px;">Tembusan :</div>
              <ol v-if="tembusanList.length > 0"
                style="margin-left: 16px; padding-left: 8px; list-style-type: decimal;">
                <li v-for="t in tembusanList" :key="t.value">{{ t.label }}</li>
              </ol>
              <div v-else style="font-style: italic; color: #000000;">...</div>
            </div>

          </div>

        </div>
      </div>
    </ClientOnly>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import type Quill from 'quill'
import { CalendarDate } from '@internationalized/date'

const pdfSourceRef = ref<HTMLElement | null>(null)
const rawHtmlContent = ref('')

const date = ref<CalendarDate>()

onMounted(() => {
  const now = new Date()
  date.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
})

// STATE
const open = ref(false)
const senders_selected = ref('')
const subject = ref('')
const isFullscreenEditor = ref(false)
const uploadedFiles = ref<File[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const showHtmlModal = ref(false)
const htmlContent = ref('')
const tertujuList = ref([])
const tembusanList = ref([])
const editorRef = ref<HTMLElement>()
let quill: Quill | null = null

// COMPUTED
const formattedDate = computed(() => {
  if (!date.value) return '-'
  const jsDate = new Date(date.value.year, date.value.month - 1, date.value.day)
  return jsDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
})
const selectedSender = computed(() => senders.find(s => s.value === senders_selected.value))
const insertMenuItems = computed(() => [[{ label: 'Template Saya' }], [{ label: 'Simpan Template' }]])

// --- 2. FIX PDF GENERATION ---
async function openPreview() {
  if (!quill) return

  // 1. Ambil konten HTML & Update state
  rawHtmlContent.value = quill.root.innerHTML
  await nextTick()

  const element = pdfSourceRef.value
  if (!element) {
    alert("Error: Template PDF tidak ditemukan.")
    return
  }

  // 2. CLONE ELEMENT (Agar tidak merusak tampilan asli)
  const clone = element.cloneNode(true) as HTMLElement

  // 3. SANITIZE
  const allElements = clone.querySelectorAll('*')
  allElements.forEach((el: any) => {
    if (!el.tagName.toLowerCase().includes('ol') && !el.tagName.toLowerCase().includes('ul') && !el.tagName.toLowerCase().includes('li')) {
      el.removeAttribute('class')
    }
    el.style.color = '#000000'
    el.style.borderColor = '#000000'
    el.style.backgroundColor = 'transparent'

    if (el.classList.contains('ql-align-center')) el.style.textAlign = 'center'
    if (el.classList.contains('ql-align-right')) el.style.textAlign = 'right'
    if (el.classList.contains('ql-align-justify')) el.style.textAlign = 'justify'
  })

  // 4. Import & Generate
  const html2pdf = (await import('html2pdf.js')).default
  const opt = {
    margin: [10, 15, 15, 15],
    filename: `Nota_Dinas_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      ignoreElements: (element: Element) => element.tagName === 'LINK' || element.tagName === 'STYLE'
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  html2pdf().set(opt).from(clone).toPdf().get('pdf').then((pdf: any) => {
    window.open(pdf.output('bloburl'), '_blank');
  }).catch((err: any) => {
    console.error("PDF Error:", err)
    alert("Gagal membuat PDF: " + err.message)
  });
}

// Helper Content Cleaner
function cleanContent(content: string) {
  if (typeof document === 'undefined') return content;
  return content;
}

// --- DATA MOCKS ---
const senders = [{ label: 'Berkas - OTP', value: 'tes1' }, { label: 'Berkas - Runway Cap', value: 'tes2' }]
const items = ref([{ label: 'Direksi Perum LPPNPI', value: 'direksi' }, { label: 'Setio Anggoro', value: 'setio' }])
const tembusanOptions = ref([{ label: 'Direksi Perum LPPNPI', value: 'direksi' }, { label: 'Setio Anggoro', value: 'setio' }])
const breadcrumbs = [{ label: 'Dashboard', to: '/user/dashboard' }, { label: 'Tulis Nota Dinas', to: '#' }]
const templates = [{ id: 1, name: 'Default', content: `<ol><li>Poin 1</li></ol>` }]
const sifatOptions = [{ label: 'Rahasia', value: 'rahasia' }, { label: 'Biasa', value: 'biasa' }]
const selectedSifat = ref()

// --- HANDLERS ---
const isTemplateModalOpen = ref(false)
const applyTemplate = (t: any) => { if (quill) quill.clipboard.dangerouslyPasteHTML(quill.getSelection()?.index || 0, t.content) }
const toggleFullscreenEditor = () => { isFullscreenEditor.value = !isFullscreenEditor.value; document.body.style.overflow = isFullscreenEditor.value ? 'hidden' : '' }
const saveHtmlContent = () => { if (quill) quill.root.innerHTML = htmlContent.value; showHtmlModal.value = false }
const removeTertuju = (i: any, e: Event) => { e.stopPropagation(); tertujuList.value = tertujuList.value.filter((x: any) => x.value !== i.value) }
const removeTembusan = (i: any, e: Event) => { e.stopPropagation(); tembusanList.value = tembusanList.value.filter((x: any) => x.value !== i.value) }

// --- FILE UPLOAD HANDLERS UPDATED ---
const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
     Array.from(target.files).forEach(file => {
         // Cek duplikasi sederhana berdasarkan nama dan ukuran
         if(!uploadedFiles.value.some(f => f.name === file.name && f.size === file.size)){
             uploadedFiles.value.push(file)
         }
     });
     // Reset input agar bisa re-upload file yg sama jika sebelumnya dihapus
     target.value = '';
  }
}

const removeFile = (index: number) => {
    uploadedFiles.value.splice(index, 1);
}


// --- INIT ---
onMounted(async () => {
  if (typeof window === 'undefined') return
  const QuillModule = await import('quill')
  const Quill = QuillModule.default
  await import('quill/dist/quill.snow.css')

  // Setup List Custom untuk Alpha/Roman
  const BaseList = Quill.import('formats/list') as any; // Cast any
  class CustomList extends BaseList {
    static formats(domNode: any) { return domNode.getAttribute('data-list') || super.formats(domNode) }
    static create(value: any) {
      const node = super.create(value);
      if (['lower-alpha', 'upper-alpha', 'lower-roman'].includes(value)) {
          node.setAttribute('data-list', value);
      }
      return node;
    }
  }
  CustomList.blotName = 'list'; CustomList.tagName = ['OL', 'UL']; Quill.register(CustomList, true);

  if (editorRef.value) {
    quill = new Quill(editorRef.value, {
      theme: 'snow',
      modules: { toolbar: '#toolbar', history: { userOnly: true } },
      placeholder: 'Ketik isi surat disini...'
    })
  }
})
</script>

<style scoped>
/* Quill List Fixes */
/* PENTING: Selector ini harus spesifik agar menimpa style bawaan Quill */
:deep(ol[data-list="lower-alpha"]),
:deep(.ql-editor ol[data-list="lower-alpha"]) {
  list-style-type: lower-alpha !important;
}

:deep(ol[data-list="upper-alpha"]),
:deep(.ql-editor ol[data-list="upper-alpha"]) {
  list-style-type: upper-alpha !important;
}

:deep(ol[data-list="lower-roman"]),
:deep(.ql-editor ol[data-list="lower-roman"]) {
  list-style-type: lower-roman !important;
}

/* Fix padding standar */
:deep(.ql-editor ol),
:deep(.ql-editor ul) {
  padding-left: 1.5rem !important;
}

/* Pastikan Ordered biasa (1,2,3) tetap decimal */
:deep(.ql-editor ol:not([data-list])) {
  list-style-type: decimal !important;
}

:deep(.ql-editor ul) {
  list-style-type: disc !important;
}

/* Font Fix */
.tn-roman,
.tn-roman * {
  font-family: 'Times New Roman', Times, serif !important;
}

.editor-container {
  width: 210mm;
  min-height: 297mm;
  padding-bottom: 2cm;
  background: white;
  margin: 0 auto;
}

/* Dark Mode Overrides */
.dark #toolbar {
  background-color: rgb(55 65 81) !important;
  border-color: rgb(75 85 99) !important;
}

.dark .ql-toolbar button {
  color: rgb(229 231 235);
}

.dark .ql-toolbar button:hover,
.dark .ql-toolbar button.ql-active {
  color: rgb(17 24 39); /* Gray 900 */
}

.dark .ql-editor {
  color: rgb(229 231 235);
  background-color: rgb(31 41 55);
}
</style>
