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
            class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">Berkas</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu
              v-model="senders_selected"
              :items="senders"
              value-key="value"
              placeholder="Pilih Pengirim"
              :search-input="{ placeholder: 'Cari berkas', size: 'lg' }"
              variant="none"
              class="w-full"
              :ui="{
                base: '!px-0 !bg-transparent w-full dark:text-white',
                ring: 'ring-0',
                shadow: 'shadow-none',
              }"
            >
              <template #default>
                <span
                  v-if="selectedSender"
                  class="truncate text-sm block w-full text-left dark:text-white"
                  >{{ selectedSender.label }}</span
                >
                <span
                  v-else
                  class="text-gray-400 dark:text-gray-500 text-sm block w-full text-left"
                  >Pilih berkas pengirim...</span
                >
              </template>
            </USelectMenu>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-800 relative gap-1 sm:gap-0"
        >
          <span
            class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">Tanggal
            Surat</span>
          <div class="relative w-full">
            <ClientOnly>
              <UPopover v-model:open="open" :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
                <div class="flex items-center gap-2 cursor-pointer w-full pr-2 h-[28px]" @click="open = true">
                  <UInputDate locale="id-ID" v-model="date" variant="none" size="sm" format="DD MMMM YYYY"
                    class="flex-1"
                    :ui="{ base: '!bg-transparent !text-sm !px-0 !ring-0 pointer-events-none inline-flex items-center h-8 dark:text-white' }" />
                  <UIcon name="i-lucide-calendar" class="size-4 text-gray-400 dark:text-gray-500 shrink-0 mr-0.5" />
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

        <!-- <div
          class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0">
          <span
            class="w-full sm:w-40 text-sm mt-0 sm:mt-1.5 text-gray-500 dark:text-gray-400 font-medium shrink-0">Tertuju</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu
              v-model="tertujuList"
              :items="items"
              multiple
              placeholder="Kepada ..."
              class="w-full p-0"
              :search-input="{ placeholder: 'Cari tertuju', size: 'lg' }"
              variant="none"
              :ui="{
                base: 'bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                wrapper: 'pr-10 w-full', input: 'pr-10 w-full dark:text-white', value: 'p-0 w-full', trigger: { base: 'px-0 py-1 w-full' }
              }">
              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[2.5rem] pr-10 w-full">
                  <UBadge v-for="item in tertujuList" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md">
                    <span class="text-xs font-medium text-left truncate max-w-[150px]">{{ item.label }}</span>
                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                      @click="removeTertuju(item, $event)" />
                  </UBadge>
                  <span v-if="!tertujuList.length" class="text-sm text-gray-400 dark:text-gray-500">Pilih
                    penerima...</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div> -->

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-40 text-sm mt-0 sm:mt-1 text-gray-500 font-medium shrink-0">Tertuju</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selected" :items="items" multiple placeholder="Kepada ..." class="w-full p-0"
              variant="none" :ui="{
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' },
              }">
              <template #item="{ item, selected: isSel }">
                <div class="flex items-start gap-3 w-full py-1 overflow-hidden">
                  <UCheckbox :model-value="isItemSelected(item)" class="pointer-events-none shrink-0"
                    :checked="isItemSelected(item)" />
                  <img v-if="item.image" :src="item.image" :alt="item.label"
                    class="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm text-left truncate w-full">
                      {{ item.label }}
                    </span>
                  </div>
                </div>
              </template>

              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[28px] pr-10 w-full">
                  <UBadge v-for="item in selected" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md max-w-full">
                    <img v-if="item.image" :src="item.image" :alt="item.label"
                      class="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                    <span class="text-xs font-medium text-left truncate max-w-[150px] sm:max-w-[220px]">
                      {{ item.label }}
                    </span>
                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                      @click="removeItem(item, $event)" />
                  </UBadge>

                  <span v-if="!selected.length" class="text-sm text-gray-400 dark:text-gray-500">
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
            <USelectMenu v-model="selected" :items="items" multiple placeholder="Kepada ..." class="w-full p-0"
              variant="none" :ui="{
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' },
              }">
              <template #item="{ item, selected: isSel }">
                <div class="flex items-start gap-3 w-full py-1 overflow-hidden">
                  <UCheckbox :model-value="isItemSelected(item)" class="pointer-events-none shrink-0"
                    :checked="isItemSelected(item)" />
                  <img v-if="item.image" :src="item.image" :alt="item.label"
                    class="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div class="flex-1 min-w-0">
                    <span class="block text-sm text-left truncate w-full">
                      {{ item.label }}
                    </span>
                  </div>
                </div>
              </template>

              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[28px] pr-10 w-full">
                  <UBadge v-for="item in selected" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md max-w-full">
                    <img v-if="item.image" :src="item.image" :alt="item.label"
                      class="w-3.5 h-3.5 rounded-full object-cover shrink-0" />
                    <span class="text-xs font-medium text-left truncate max-w-[150px] sm:max-w-[220px]">
                      {{ item.label }}
                    </span>
                    <UButton
                      icon="i-lucide-x"
                      size="2xs"
                      color="gray"
                      variant="ghost"
                      :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 dark:hover:bg-gray-700 rounded shrink-0"
                      @click="removeItem(item, $event)" />
                  </UBadge>

                  <span v-if="!selected.length" class="text-sm text-gray-400 dark:text-gray-500">
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
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 gap-1 sm:gap-0"
        >
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-40 text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Perihal</span>
            <input type="text" v-model="subject"
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
              <UModal v-model="isTemplateModalOpen" title="Pilih Template">
                <UButton
                  label="Pilih Template"
                  color="primary"
                  variant="soft"
                  icon="i-heroicons-adjustments-horizontal"
                />
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
                v-if="!isFullscreenEditor"
                icon="i-lucide-maximize"
                color="neutral"
                variant="soft"
                label="Fullscreen"
                @click="toggleFullscreenEditor"
              />
              <UButton
                icon="i-lucide-eye"
                color="neutral"
                variant="soft"
                label="Preview PDF"
                @click="openPreview"
              />
            </div>
          </div>

          <ClientOnly>
            <div
              class="flex flex-col bg-gray-100 dark:bg-gray-800 transition-all duration-300"
              :class="
                isFullscreenEditor
                  ? 'fixed inset-0 z-[9999] w-screen h-screen'
                  : 'relative h-screen border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'
              "
            >
              <div
                v-if="isFullscreenEditor"
                class="absolute top-4 right-6 z-[10000]"
              >
                <UButton
                  icon="i-lucide-minimize"
                  color="red"
                  variant="solid"
                  label="Keluar Fullscreen"
                  class="shadow-xl ring-2 ring-white dark:ring-gray-700 bg-white"
                  @click="toggleFullscreenEditor"
                />
              </div>

              <TextEditor
                ref="textEditorComponent"
                v-model="editorContent"
                :is-fullscreen="isFullscreenEditor"
                @ready="onEditorReady"
              >
                <template #header>
                  <div class="flex items-center pb-2 mb-6 select-none">
                    <div class="flex items-end gap-4">
                      <img
                        src="/logoAirnav.png"
                        alt="Logo AirNav"
                        class="h-16 w-auto object-contain"
                      />
                      <div class="flex flex-col mb-1">
                        <span
                          class="text-2xl font-bold tracking-wide text-[18px] text-black"
                          >AirNav Indonesia</span
                        >
                      </div>
                    </div>
                    <div
                      class="ml-auto text-[10px] leading-[1.1] text-gray-700 text-right"
                    >
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
                    <h1
                      class="text-xl font-bold decoration-2 underline-offset-4 text-[16px] uppercase tn-roman"
                    >
                      NOTA DINAS
                    </h1>
                    <p class="text-lg mt-1 text-[14px]">
                      Nomor : ..............................................
                    </p>
                  </div>

                  <table
                    class="w-full text-lg leading-relaxed mb-4 tn-roman select-none text-black"
                  >
                    <tbody>
                      <tr>
                        <td class="text-[14px] w-[120px] font-bold align-top">
                          Kepada Yth.
                        </td>
                        <td class="text-[14px] w-[20px] align-top">:</td>
                        <td class="text-[14px] align-top">
                          {{
                            tertujuList.length
                              ? tertujuList.map((s) => s.label).join(", ")
                              : "................................................"
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
                  <div
                    class="text-[12px] mt-2 w-full text-left select-none text-black"
                  >
                    <div class="font-bold underline mb-1">Tembusan :</div>
                    <ol
                      v-if="tembusanList.length > 0"
                      class="list-decimal ml-4 pl-2"
                    >
                      <li v-for="t in tembusanList" :key="t.value">
                        {{ t.label }}
                      </li>
                    </ol>
                    <div v-else class="text-gray-400 italic">...</div>
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
          class="py-6 gap-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end bg-white dark:bg-gray-800"
        >
          <UButton
            label="Simpan Draft"
            color="gray"
            variant="outline"
            size="lg"
            icon="i-heroicons-document-text"
            class="px-8"
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
                    tertujuList.length
                      ? tertujuList.map((s: any) => s.label).join(", ")
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
                  {{ selectedSender?.label || "..................." }}
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
                v-if="tembusanList.length > 0"
                style="
                  margin-left: 16px;
                  padding-left: 8px;
                  list-style-type: decimal;
                "
              >
                <li v-for="t in tembusanList" :key="t.value">{{ t.label }}</li>
              </ol>
              <div v-else style="font-style: italic; color: #000000">...</div>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { CalendarDate } from "@internationalized/date";
import TextEditor from "~/components/TextEditor.vue";

// --- STATE ---
const pdfSourceRef = ref<HTMLElement | null>(null);
const rawHtmlContent = ref("");
const editorContent = ref("");
const textEditorComponent = ref();
let quillInstance: any = null;

const date = ref<CalendarDate>();
const open = ref(false);
const senders_selected = ref("");
const subject = ref("");
const isFullscreenEditor = ref(false);
const uploadedFiles = ref<File[]>([]);
const isTemplateModalOpen = ref(false);
const tertujuList = ref([]);
const tembusanList = ref([]);

// --- MOCK DATA ---
const senders = [{ label: 'Berkas - OTP', value: 'tes1' }, { label: 'Berkas - Runway Cap', value: 'tes2' }]
const itemms = ref([{ label: 'Direksi Perum LPPNPI', value: 'direksi' }, { label: 'Setio Anggoro', value: 'setio' }])
const tembusanOptions = ref([{ label: 'Direksi Perum LPPNPI', value: 'direksi' }, { label: 'Setio Anggoro', value: 'setio' }])
const breadcrumbs = [{ label: 'Dashboard', to: '/user/dashboard' }, { label: 'Tulis Nota Dinas', to: '#' }]
const templates = [{ id: 1, name: 'Default', content: `<ol><li>Poin 1</li></ol>` }]
const sifatOptions = [{ label: 'Rahasia', value: 'rahasia' }, { label: 'Biasa', value: 'biasa' }]
const selectedSifat = ref()

const items = ref([
  { type: "label", label: "Grup Tertuju" },
  {
    label: "Direksi Perum LPPNPI",
    value: "direksi",
    image:
      "https://ui-avatars.com/api/?name=Direksi+Perum+LPPNPI&size=128&rounded=true&background=random",
  },
  {
    label: "Para Executive Vice President",
    value: "evp",
    image:
      "https://ui-avatars.com/api/?name=Executive+Vice+President&size=128&rounded=true&background=random",
  },
  { type: "separator" },
  { type: "label", label: "Tertuju" },
  {
    label: "PT / PH - (-) Ketua Dewan Pengawas Kantor Pusat",
    value: "ketua",
    image:
      "https://ui-avatars.com/api/?name=Ketua+Dewan+Pengawas&size=128&rounded=true&background=random",
  },
  {
    label: "Avirianto Suratno - (U) Direktur Utama Kantor Pusat",
    value: "avirianto",
    image:
      "https://ui-avatars.com/api/?name=Avirianto+Suratno&size=128&rounded=true&background=random",
  },
  {
    label:
      "Azizatun Azhimah - (K) Direktur Keuangan dan Manajemen Risiko Kantor Pusat",
    value: "azizah",
    image:
      "https://ui-avatars.com/api/?name=Azizatun+Azhimah&size=128&rounded=true&background=random",
  },
  {
    label: "Setio Anggoro - (O) Direktur Operasi Kantor Pusat",
    value: "setio",
    image:
      "https://ui-avatars.com/api/?name=Setio+Anggoro&size=128&rounded=true&background=random",
  },
]);

const selected = ref([]);

function isItemSelected(item: any) {
  return selected.value.some((s) => s.value === item.value);
}

function removeItem(item: any, event: Event) {
  event.stopPropagation();
  const index = selected.value.findIndex((i) => i.value === item.value);
  if (index > -1) {
    selected.value.splice(index, 1);
  }
}

onMounted(() => {
  const now = new Date();
  date.value = new CalendarDate(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );
});

// --- COMPUTED ---
const formattedDate = computed(() => {
  if (!date.value) return "-";
  const jsDate = new Date(
    date.value.year,
    date.value.month - 1,
    date.value.day,
  );
  return jsDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});
const selectedSender = computed(() =>
  senders.find((s) => s.value === senders_selected.value),
);

// --- HANDLERS ---
const onEditorReady = (q: any) => {
  quillInstance = q;
};
const applyTemplate = (t: any) => {
  if (textEditorComponent.value) textEditorComponent.value.setHtml(t.content);
  isTemplateModalOpen.value = false;
};
const cleanContent = (content: string) => content;
const handleFileUpload = (e: any) => {
  /* logic upload */
};
const removeFile = (i: number) => {
  uploadedFiles.value.splice(i, 1);
};
const toggleFullscreenEditor = () => {
  isFullscreenEditor.value = !isFullscreenEditor.value;
  document.body.style.overflow = isFullscreenEditor.value ? "hidden" : "";
};
const removeTertuju = (i: any, e: Event) => {
  e.stopPropagation();
  tertujuList.value = tertujuList.value.filter((x: any) => x.value !== i.value);
};
const removeTembusan = (i: any, e: Event) => {
  e.stopPropagation();
  tembusanList.value = tembusanList.value.filter(
    (x: any) => x.value !== i.value,
  );
};

// --- PDF GENERATOR ---
async function openPreview() {
  // 1. Sync Content
  // Pastikan konten terbaru dari editor diambil
  if (quillInstance) {
    rawHtmlContent.value = quillInstance.root.innerHTML;
  } else {
    rawHtmlContent.value = editorContent.value;
  }

  await nextTick();

  const element = pdfSourceRef.value;
  if (!element) {
    alert("Error: Template PDF tidak ditemukan.");
    return;
  }

  // 2. Clone Element
  const clone = element.cloneNode(true) as HTMLElement;

  // 3. INJECT STYLE (CSS FORCE - DIUPDATE AGAR SAMA DENGAN EDITOR)
  const style = document.createElement("style");
  style.innerHTML = `
    /* --- RESET & BASIC --- */
    * {
      box-sizing: border-box !important;
      color: #000000 !important;
      border-color: #000000 !important;
    }

    /* Paksa Font Times New Roman untuk semua elemen */
    body, div, p, span, li, td, th, .tn-roman {
       font-family: 'Times New Roman', serif !important;
       text-rendering: geometricPrecision !important;
    }

    /* --- PARAGRAPH & SPACING (Samakan dengan Editor) --- */
    p {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      line-height: 1.42 !important; /* Standar Quill line-height */
      padding-bottom: 0 !important; /* Hapus padding aneh jika ada */
    }

    /* Beri jarak antar paragraf kosong (simulasi <p><br></p>) */
    p:empty {
      height: 1.42em;
    }

    /* --- LIST STYLING (PENTING: Agar angka/bullet muncul) --- */
    ol, ul {
      padding-left: 1.5em !important; /* Jarak indent list */
      margin-top: 0 !important;
      margin-bottom: 0 !important;
    }
    li {
      padding-left: 0.5em !important;
    }
    ol { list-style-type: decimal !important; }
    ul { list-style-type: disc !important; }

    /* --- QUILL INDENTATION CLASSES (PENTING: Agar tabulasi jalan) --- */
    .ql-indent-1 { padding-left: 3em !important; }
    .ql-indent-2 { padding-left: 6em !important; }
    .ql-indent-3 { padding-left: 9em !important; }
    .ql-indent-4 { padding-left: 12em !important; }
    .ql-indent-5 { padding-left: 15em !important; }
    .ql-indent-6 { padding-left: 18em !important; }
    .ql-indent-7 { padding-left: 21em !important; }
    .ql-indent-8 { padding-left: 24em !important; }

    /* --- QUILL ALIGNMENT CLASSES --- */
    .ql-align-center { text-align: center !important; }
    .ql-align-right { text-align: right !important; }
    .ql-align-justify { text-align: justify !important; }

    /* --- TABLE STYLING --- */
    table {
      border-collapse: collapse !important;
      width: 100% !important;
      vertical-align: top !important;
    }

    td, th {
      border: 1px solid #000;
      padding: 4px !important;
    }

    /* --- PAGE BREAK RULES --- */
    /* Izinkan potong di teks biasa */
    p, div, span, li, ul, ol {
      page-break-inside: auto !important;
    }
    /* Jangan potong elemen penting */
    table, img, h1, h2, h3 {
      page-break-inside: avoid !important;
    }

    /* --- HIDE ELEMENTS --- */
    /* Sembunyikan elemen UI Quill yang mungkin terbawa */
    .ql-tooltip, .ql-clipboard {
       display: none !important;
    }
  `;
  clone.appendChild(style);

  // 4. GHOST DIV CONFIGURATION
  const ghostDiv = document.createElement("div");
  ghostDiv.style.position = "fixed";
  ghostDiv.style.top = "0";
  ghostDiv.style.left = "0";
  ghostDiv.style.zIndex = "-9999";
  ghostDiv.style.backgroundColor = "#ffffff";

  // Set lebar fix 180mm (A4 210mm - Margin Kiri 15mm - Margin Kanan 15mm)
  // Ini memastikan word-wrap di PDF sama persis dengan di editor
  ghostDiv.style.width = "180mm";
  ghostDiv.style.padding = "0";

  ghostDiv.appendChild(clone);
  document.body.appendChild(ghostDiv);

  // 5. Generate PDF
  try {
    const html2pdf = (await import("html2pdf.js")).default;

    const opt = {
      margin: [15, 15, 20, 15], // Top, Right, Bottom, Left (mm)
      filename: `Nota_Dinas_${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2, // Resolusi retina (tajam)
        useCORS: true, // Izinkan gambar eksternal
        letterRendering: true,
        scrollY: 0,
        // Penting: Hapus style bawaan bootstrap/tailwind yang mungkin konflik
        ignoreElements: (element: Element) => element.tagName === "LINK",
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    await html2pdf()
      .set(opt)
      .from(clone)
      .toPdf()
      .get("pdf")
      .then((pdf: any) => {
        const blobUrl = pdf.output("bloburl");
        window.open(blobUrl + "#toolbar=0&navpanes=0&scrollbar=0", "_blank");
      });
  } catch (err: any) {
    console.error("PDF Error:", err);
    alert("Gagal: " + err.message);
  } finally {
    document.body.removeChild(ghostDiv);
  }
}
</script>
