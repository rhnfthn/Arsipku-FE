<template>
  <div>
    <div class="bg-white dark:bg-gray-900 z-30 p-4 sm:px-6 rounded-t-lg mb-0">
      <PageHeader title="Tulis Nota Dinas" :items="breadcrumbs" />
    </div>

    <UCard variant="soft" :ui="{ root: 'rounded-t-none ring-0 shadow-none bg-white' }">
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
                  Pilih berkas
                </span>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 relative gap-1 sm:gap-0">
          <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tanggal Surat</span>
          <div class="relative w-full">
            <UPopover v-model:open="open" :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
              <div class="flex items-center gap-2 cursor-pointer w-full pr-2" @click="open = true">
                <UInputDate locale="id-ID" ref="inputDateRef" v-model="date" variant="none" size="sm" class="flex-1"
                  :ui="{ base: '!bg-transparent !text-sm !px-0 !ring-0 pointer-events-none inline-flex items-center h-8' }" />
                <UIcon name="i-lucide-calendar" class="size-4 text-gray-400 shrink-0 mr-1" />
              </div>
              <template #content>
                <UCalendar v-model="date" class="p-2" @update:model-value="open = false" />
              </template>
            </UPopover>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-start py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <span class="w-full sm:w-32 text-sm mt-0 sm:mt-1.5 text-gray-500 font-medium shrink-0">Tertuju</span>
          <div class="flex flex-wrap gap-1 w-full items-center">
            <USelectMenu v-model="selected" :items="items" multiple placeholder="Kepada ..." class="w-full p-0"
              :search-input="{ placeholder: 'Cari tertuju', size: 'lg' }" variant="none" :ui="{
                base: 'bg-white dark:bg-gray-900 hover:border-gray-400 transition-colors w-full',
                wrapper: 'pr-10 w-full',
                input: 'pr-10 w-full',
                value: 'p-0 w-full',
                trigger: { base: 'px-0 py-1 w-full' }
              }">
              <template #default>
                <div class="flex items-center gap-1.5 flex-wrap min-h-[2.5rem] pr-10 w-full">
                  <UBadge v-for="item in selected" :key="item.value" color="primary" variant="soft" size="md"
                    class="gap-1.5 pl-2 pr-1 flex items-center justify-start rounded-md">
                    <span class="text-xs font-medium text-left truncate max-w-[150px]">{{ item.label }}</span>
                    <UButton icon="i-lucide-x" size="2xs" color="gray" variant="ghost" :padded="false"
                      class="w-4 h-4 hover:bg-gray-200 rounded shrink-0" @click="removeItem(item, $event)" />
                  </UBadge>
                  <span v-if="!selected.length" class="text-sm text-gray-400">Pilih tertuju</span>
                </div>
              </template>
            </USelectMenu>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-200 gap-1 sm:gap-0">
          <div class="flex flex-col sm:flex-row sm:items-center w-full">
            <span class="w-full sm:w-32 text-sm text-gray-500 font-medium shrink-0">Perihal</span>
            <input type="text" class="flex-1 outline-none text-gray-900 py-1 bg-transparent text-sm w-full"
              placeholder="Ketik perihal" />
          </div>
        </div>

        <div class="flex flex-col py-4">

          <div class="flex flex-wrap items-center justify-between w-full gap-3">
            <div class="flex flex-wrap gap-3 flex-shrink-0">
              <UModal v-model="isTemplateModalOpen" title="Pilih Template">
                <UButton label="Pilih Template" color="primary" variant="soft" icon="i-heroicons-adjustments-horizontal"
                  class="px-6 font-medium" />
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

              <UButton label="Template Saya" color="primary" variant="soft" icon="i-heroicons-rectangle-stack"
                class="px-6 font-medium" />
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <UDropdownMenu :items="insertMenuItems">
                <UButton color="neutral" variant="soft" icon="i-lucide-plus" trailing-icon="i-lucide-chevron-down"
                  label="Sisipkan" />
              </UDropdownMenu>
              <UButton :icon="isFullscreenEditor ? 'i-lucide-minimize' : 'i-lucide-maximize'" color="neutral"
                variant="soft" :label="isFullscreenEditor ? 'Exit Fullscreen' : 'Fullscreen'"
                @click="toggleFullscreenEditor" />
              <UButton icon="i-lucide-eye" color="neutral" variant="soft" label="Preview" @click="openPreview" />
            </div>
          </div>

          <ClientOnly>
            <div class="flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden transition-all duration-300"
              :class="isFullscreenEditor ? 'fixed inset-0 z-50' : 'h-screen'">

              <div class="bg-white dark:bg-gray-800 border-b border-gray-200 shadow-sm">
                <div class="py-3" :class="isFullscreenEditor ? 'max-w-full' : 'container mx-auto'">
                  <div id="toolbar"
                    class="flex flex-wrap gap-1 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600 mt-2">

                    <span class="ql-formats">
                      <button class="ql-undo" title="Undo"></button>
                      <button class="ql-redo" title="Redo"></button>
                    </span>

                    <span class="ql-formats">
                      <select class="ql-header" title="Format">
                        <option value="1">Heading 1</option>
                        <option value="2">Heading 2</option>
                        <option value="3">Heading 3</option>
                        <option selected>Normal</option>
                      </select>
                    </span>

                    <span class="ql-formats">
                      <button class="ql-bold" title="Bold"></button>
                      <button class="ql-italic" title="Italic"></button>
                      <button class="ql-underline" title="Underline"></button>
                      <button class="ql-strike" title="Strikethrough"></button>
                    </span>

                    <span class="ql-formats">
                      <button class="ql-align" value="" title="Align Left"></button>
                      <button class="ql-align" value="center" title="Align Center"></button>
                      <button class="ql-align" value="right" title="Align Right"></button>
                      <button class="ql-align" value="justify" title="Justify"></button>
                    </span>

                    <span class="ql-formats">
                      <button class="ql-list" value="ordered" title="Numbered List"></button>
                      <button class="ql-list" value="bullet" title="Bullet List"></button>
                    </span>

                    <span class="ql-formats">
                      <button class="ql-indent" value="-1" title="Decrease Indent"></button>
                      <button class="ql-indent" value="+1" title="Increase Indent"></button>
                    </span>

                    <span class="ql-formats">
                      <button class="ql-table" title="Insert Table"></button>
                    </span>

                    <span class="ql-formats">
                      <button class="ql-html" title="Edit HTML Source"></button>
                    </span>

                  </div>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto bg-gray-200 dark:bg-gray-900 transition-all duration-300"
                :class="isFullscreenEditor ? 'p-0' : 'p-8'">
                <div class="bg-white shadow-xl relative transition-all duration-300" :class="{
                  'fullscreen-editor': isFullscreenEditor,
                  'editor-container mx-auto max-w-[210mm]': !isFullscreenEditor
                }">
                  <div v-if="!isFullscreenEditor"
                    class="absolute top-0 left-0 right-0 h-[2.5cm] border-b border-gray-100 flex items-center justify-center text-gray-300 select-none pointer-events-none z-10">
                    Header
                  </div>

                  <div ref="editorRef" class="editor-content"></div>

                  <div v-if="!isFullscreenEditor"
                    class="absolute bottom-0 left-0 right-0 h-[2.5cm] border-t border-gray-100 flex items-center justify-center text-gray-300 select-none pointer-events-none z-10">
                    Footer
                  </div>
                </div>
                <p v-if="!isFullscreenEditor" class="text-center text-gray-500 mt-4 text-sm">
                  *Tampilan edit tersambung. Klik <b>Preview</b> untuk melihat pemisahan halaman fisik.
                </p>
              </div>
            </div>
          </ClientOnly>

          <div class="flex items-center justify-between py-3">
            <UFileUpload class="w-full" multiple position="inside" layout="list" label="Lampiran File"
              description="PDF, DOCX atau XLSX (max. 10MB)" />
          </div>
          <div class="flex items-center justify-between py-3">
            <UCheckbox v-model="isSecret" label="Rahasia" size="lg" help="Tandai dokumen ini sebagai dokumen rahasia" />
          </div>
        </div>

        <div class="py-4 gap-3 border-t border-gray-100 flex items-center justify-end bg-white">
          <!-- <UButton label="Lihat" color="neutral" size="lg" icon="i-heroicons-eye" /> -->
          <UButton label="Simpan Draft" color="warning" size="lg" icon="i-heroicons-document-text" />
          <UButton label="Kirim" color="primary" size="lg" icon="i-heroicons-paper-airplane" />
        </div>

      </div>
    </UCard>

    <UModal v-model:open="showPreview" fullscreen :ui="{ overlay: 'bg-gray-900/90 backdrop-blur-sm' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="font-bold text-lg">Preview Dokumen</h3>
          <div class="flex gap-2">
            <UButton color="neutral" variant="outline" icon="i-lucide-x" label="Tutup" @click="showPreview = false" />
            <UButton color="primary" icon="i-lucide-printer" label="Print PDF" @click="printContent" />
          </div>
        </div>
      </template>
      <template #body>
        <div class="h-full overflow-y-auto bg-gray-100 p-8">
          <div class="flex flex-col items-center gap-8 pb-8">
            <div v-for="(pageContent, index) in paginatedPages" :key="index"
              class="real-a4-page bg-white shadow-2xl relative flex flex-col">

              <!-- Header -->
              <div class="h-[4cm] px-10 py-4 flex items-center font-['Times_New_Roman']">

                <!-- KIRI: Logo + Nama -->
                <div class="flex items-end gap-4">
                  <img src="/logoAirnav.png" alt="Logo AirNav" class="h-24 w-auto object-contain" />
                  <div class="flex flex-col">
                    <span class="text-2xl font-semibold">AirNav Indonesia</span>
                  </div>
                </div>

                <!-- KANAN: Alamat -->
                <div class="ml-auto text-[12px] leading-[1.1] text-gray-700">
                  <div class="font-semibold">Kantor Pusat Perum LPPNPI</div>
                  <div>Gedung AirNav Indonesia</div>
                  <div>Jl. Ir. H. Juanda</div>
                  <div>Tangerang 15121</div>
                  <div>Banten – Indonesia</div>
                  <div>Telp: 021-5591 5000</div>
                  <div>Fax: 021-5591 5100</div>
                  <div>www.airnavindonesia.co.id</div>
                </div>
              </div>

              <!-- Content -->
              <div class="flex-1 px-10 py-6 overflow-hidden">
                <div class="prose prose-sm max-w-none ql-editor" v-html="pageContent"></div>
              </div>

              <!-- Footer -->
              <div class="h-[2cm] px-10 flex items-center shrink-0">
                <!-- <div class="w-full flex justify-between items-center text-xs text-gray-500">
                  <span class="font-medium">Rahasia & Terbatas</span>
                  <span>Halaman {{ index + 1 }} dari {{ paginatedPages.length }}</span>
                </div> -->
              </div>
            </div>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showHtmlModal" title="Edit HTML Source" :ui="{ width: 'w-full sm:max-w-4xl' }">
      <template #body>
        <div class="flex flex-col gap-4">
          <textarea v-model="htmlContent"
            class="w-full h-96 p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            spellcheck="false" />
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton label="Batal" color="gray" variant="soft" @click="showHtmlModal = false" />
          <UButton label="Simpan Perubahan" color="primary" icon="i-lucide-save" @click="saveHtmlContent" />
        </div>
      </template>
    </UModal>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import type Quill from 'quill'

// --- STATE MANAGEMENT ---
const isSecret = ref(false)
const open = ref(false)
const senders_selected = ref('')
const date = ref()
const selected = ref([])
const isFullscreenEditor = ref(false)
const showPreview = ref(false)

// HTML Edit State
const showHtmlModal = ref(false)
const htmlContent = ref('')

// Quill Refs
const editorRef = ref<HTMLElement>()
const paginatedPages = ref<string[]>([])
let quill: Quill | null = null

// --- DUMMY DATA ---
const senders = [
  { label: 'Berkas - On Time Performance (OTP)', value: 'tes1' },
  { label: 'Berkas - Analisis Runway Capacity', value: 'tes2' }
]

const items = ref([
  { label: 'Direksi Perum LPPNPI', value: 'direksi' },
  { label: 'Setio Anggoro', value: 'setio' }
])

const breadcrumbs = [
  { label: 'Dashboard', to: '/user/dashboard' },
  { label: 'Tulis Nota Dinas', to: '/admin/korespondensi/tulis/nota-dinas' }
]

const selectedSender = computed(() => senders.find(s => s.value === senders_selected.value))

// --- DROPDOWN INSERT ---
const insertMenuItems = computed(() => [
  [{ label: 'Berkas', icon: 'i-lucide-file' }],
  [{ label: 'Tanggal Surat', icon: 'i-lucide-calendar', click: () => insertTextAtCursor(new Date().toLocaleDateString('id-ID')) }]
])

// --- TEMPLATE LOGIC ---
const isTemplateModalOpen = ref(false)
const templates = [
  {
    id: 1,
    name: 'Default Numbering',
    preview: 'List angka sederhana...',
    content: `<ol><li>Poin pembahasan pertama</li><li>Poin pembahasan kedua</li></ol><p><br></p>`
  },
  {
    id: 2,
    name: 'Numbering With Child',
    preview: 'List angka dengan sub-poin a, b, c...',
    content: `<ol><li>Poin Utama<ol type="a"><li>Sub poin satu</li></ol></li></ol><p><br></p>`
  }
]

// Fungsi Apply Template (Fix: Insert tanpa hapus)
const applyTemplate = (template: any) => {
  if (!quill) return
  const range = quill.getSelection()
  const index = range ? range.index : quill.getLength()

  // Insert HTML di posisi kursor
  quill.clipboard.dangerouslyPasteHTML(index, template.content, 'user')

  // Beri space baru di bawahnya
  quill.insertText(index + template.content.length, '\n', 'user')
  isTemplateModalOpen.value = false
}

// --- HELPER FUNCTIONS ---
function isItemSelected(item: any) {
  return selected.value.some((s: any) => s.value === item.value)
}

function removeItem(item: any, event: Event) {
  event.stopPropagation()
  const index = selected.value.findIndex((i: any) => i.value === item.value)
  if (index > -1) selected.value.splice(index, 1)
}

function insertTextAtCursor(text: string) {
  if (!quill) return
  const range = quill.getSelection()
  if (range) {
    quill.insertText(range.index, text)
  }
}

function toggleFullscreenEditor() {
  isFullscreenEditor.value = !isFullscreenEditor.value
  document.body.style.overflow = isFullscreenEditor.value ? 'hidden' : ''
}

// --- HTML EDIT FUNCTIONS ---
function openHtmlEditor() {
  if (!quill) return
  htmlContent.value = quill.root.innerHTML
  showHtmlModal.value = true
}

function saveHtmlContent() {
  if (!quill) return
  // Replace konten editor dengan yang ada di textarea
  quill.root.innerHTML = htmlContent.value
  showHtmlModal.value = false
}

// --- PREVIEW PAGINATION LOGIC ---
function openPreview() {
  if (!quill) return
  const fullHtml = quill.root.innerHTML
  if (!fullHtml || fullHtml.trim() === '<p><br></p>') {
    paginatedPages.value = ['<p class="text-center text-gray-500">Belum ada konten.</p>']
    showPreview.value = true
    return
  }

  // Virtual rendering untuk hitung tinggi
  const tempDiv = document.createElement('div')
  Object.assign(tempDiv.style, {
    width: '170mm', visibility: 'hidden', position: 'absolute', top: '-9999px',
    fontFamily: '"Times New Roman", serif', fontSize: '12pt', lineHeight: '1.5'
  })
  tempDiv.className = 'ql-editor'
  tempDiv.innerHTML = fullHtml
  document.body.appendChild(tempDiv)

  const pages: string[] = []
  let currentNodes: HTMLElement[] = []
  let currentHeight = 0
  const MAX_HEIGHT = 870 // Pixel limit per A4 content area

  Array.from(tempDiv.children).forEach((child) => {
    const node = child as HTMLElement
    const h = node.offsetHeight
    if (currentHeight + h > MAX_HEIGHT && currentNodes.length > 0) {
      pages.push(currentNodes.map(n => n.outerHTML).join(''))
      currentNodes = [node]
      currentHeight = h
    } else {
      currentNodes.push(node)
      currentHeight += h
    }
  })
  if (currentNodes.length) pages.push(currentNodes.map(n => n.outerHTML).join(''))

  document.body.removeChild(tempDiv)
  paginatedPages.value = pages
  showPreview.value = true
}

function printContent() {
  window.print()
}

// --- INITIALIZATION ---
onMounted(async () => {
  if (typeof window === 'undefined') return

  const QuillModule = await import('quill')
  const Quill = QuillModule.default
  await import('quill/dist/quill.snow.css')
  const QuillBetterTable = (await import('quill-better-table')).default
  await import('quill-better-table/dist/quill-better-table.css')

  // Register Modules & Icons
  Quill.register({ 'modules/better-table': QuillBetterTable }, true)
  const icons = Quill.import('ui/icons')

  // Custom Icons
  icons['undo'] = '<svg viewBox="0 0 18 18"><polygon class="ql-fill" points="6 10 4 12 2 10 6 10"></polygon><path class="ql-stroke" d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"></path></svg>'
  icons['redo'] = '<svg viewBox="0 0 18 18"><polygon class="ql-fill" points="12 10 14 12 16 10 12 10"></polygon><path class="ql-stroke" d="M9.91,13.91A4.6,4.6,0,0,1,9,14a5,5,0,1,1,5-5"></path></svg>'
  // Icon untuk tombol HTML (Code brackets)
  icons['html'] = '<svg viewBox="0 0 18 18"><polyline class="ql-even ql-stroke" points="5 7 3 9 5 11"></polyline><polyline class="ql-even ql-stroke" points="13 7 15 9 13 11"></polyline><line class="ql-stroke" x1="10" x2="8" y1="5" y2="13"></line></svg>'

  if (editorRef.value) {
    quill = new Quill(editorRef.value, {
      theme: 'snow',
      modules: {
        table: false,
        toolbar: {
          container: '#toolbar',
          handlers: {
            undo: function () { this.quill.history.undo() },
            redo: function () { this.quill.history.redo() },
            table: function () { this.quill.getModule('better-table').insertTable(3, 3) },
            // HANDLER HTML BUTTON DISINI
            html: function () { openHtmlEditor() }
          }
        },
        history: { delay: 1000, maxStack: 100, userOnly: true },
        'better-table': {
          operationMenu: {
            items: {
              unmergeCells: { text: 'Unmerge Cells' },
              insertRowAbove: { text: 'Insert Row Above' },
              insertRowBelow: { text: 'Insert Row Below' },
              insertColumnLeft: { text: 'Insert Column Left' },
              insertColumnRight: { text: 'Insert Column Right' },
              deleteRow: { text: 'Delete Row' },
              deleteColumn: { text: 'Delete Column' }
            }
          }
        }
      },
      placeholder: 'Mulai mengetik dokumen Anda di sini...'
    })
  }
})
</script>

<style scoped>
/* Base Editor Styles */
.editor-container {
  width: 210mm;
  min-height: 297mm;
  padding-top: 2.5cm;
  padding-bottom: 2.5cm;
}

.fullscreen-editor {
  width: 100% !important;
  min-height: 100vh !important;
  max-width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  box-shadow: none !important;
}

.fullscreen-editor .ql-editor {
  min-height: calc(100vh - 140px) !important;
  padding: 3rem 6rem !important;
  max-width: 1400px !important;
  margin: 0 auto !important;
}

.ql-editor {
  min-height: 200mm;
  padding: 0 2.5cm;
  font-family: 'Times New Roman', serif;
  font-size: 12pt;
  line-height: 1.5;
  color: #1a1a1a;
}

/* Typography Overrides */
.ql-editor p {
  margin-bottom: 0.5em;
}

.ql-editor h1 {
  font-size: 2em;
  font-weight: bold;
  margin: 0.67em 0;
}

.ql-editor h2 {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.83em 0;
}

.ql-editor h3 {
  font-size: 1.17em;
  font-weight: bold;
  margin: 1em 0;
}

/* Toolbar Cleanups */
.ql-container.ql-snow,
.ql-toolbar.ql-snow {
  border: none !important;
}

.ql-toolbar.ql-snow {
  padding: 0;
  background: transparent;
}

.ql-toolbar button {
  width: 32px !important;
  height: 32px !important;
  padding: 4px !important;
  border-radius: 4px !important;
}

.ql-toolbar button:hover {
  background-color: rgba(0, 0, 0, 0.05) !important;
}

.ql-toolbar button.ql-active {
  background-color: rgba(59, 130, 246, 0.1) !important;
  color: rgb(59, 130, 246) !important;
}

.ql-toolbar select {
  height: 32px !important;
  border-radius: 4px !important;
  border: 1px solid #e5e7eb !important;
  padding: 0 8px !important;
}

/* SVG Icon Colors */
.ql-toolbar .ql-stroke {
  stroke: #444;
}

.ql-toolbar .ql-fill {
  fill: #444;
}

.ql-toolbar button:hover .ql-stroke {
  stroke: #06c;
}

.ql-toolbar button:hover .ql-fill {
  fill: #06c;
}

.ql-toolbar button.ql-active .ql-stroke {
  stroke: rgb(59, 130, 246);
}

.ql-toolbar button.ql-active .ql-fill {
  fill: rgb(59, 130, 246);
}

/* Preview & Print */
.real-a4-page {
  width: 210mm;
  height: 297mm;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

@media print {
  @page {
    size: A4;
    margin: 0;
  }

  body * {
    visibility: hidden;
  }

  .real-a4-page,
  .real-a4-page * {
    visibility: visible;
  }

  .real-a4-page {
    position: relative;
    margin: 0;
    page-break-after: always;
    box-shadow: none !important;
    width: 210mm;
    height: 297mm;
  }

  .real-a4-page:last-child {
    page-break-after: auto;
  }
}

/* Dark Mode */
.dark #toolbar {
  background-color: rgb(55 65 81) !important;
  border-color: rgb(75 85 99) !important;
}

.dark .ql-toolbar button {
  color: rgb(229 231 235);
}

.dark .ql-toolbar button:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.dark .ql-toolbar .ql-stroke,
.dark .ql-toolbar .ql-fill {
  stroke: rgb(229 231 235);
  fill: rgb(229 231 235);
}

.dark .ql-toolbar select {
  background-color: rgb(55 65 81);
  color: rgb(229 231 235);
  border-color: rgb(75 85 99) !important;
}

.dark .ql-editor {
  color: rgb(229 231 235);
  background-color: rgb(31 41 55);
}
</style>
