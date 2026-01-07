<template>
  <Teleport to="body" :disabled="!isFullscreen">

    <div :class="isFullscreen
        ? '!fixed !inset-0 !z-[99999] w-screen h-screen bg-gray-200 dark:bg-gray-900 flex flex-col'
        : 'flex flex-col h-full relative z-10'">

      <div class="flex-1 overflow-y-auto bg-gray-200 dark:bg-gray-900 transition-all duration-300 w-full"
        :class="isFullscreen ? 'p-0' : 'p-8'">

        <div class="bg-white shadow-xl relative transition-all duration-300 flex flex-col tn-roman"
          :class="{ 'fullscreen-editor': isFullscreen, 'editor-container mx-auto': !isFullscreen }">

          <div class="px-12 pt-10 shrink-0 select-none cursor-default" contenteditable="false">
            <slot name="header"></slot>
          </div>

          <div ref="editorRef" class="editor-content h-auto flex-1 tn-roman-editor px-12"></div>

          <div class="px-12 pb-10 tn-roman shrink-0 cursor-default" contenteditable="false">
            <slot name="footer"></slot>
          </div>
        </div>

        <p v-if="!isFullscreen" class="text-center text-gray-500 mt-4 text-sm print:hidden">
          *Tampilan edit tersambung. Klik <b>Preview Dokumen</b> untuk melihat hasil cetak PDF.
        </p>
      </div>

      <div v-if="showCodeModal"
        class="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
          <div
            class="flex justify-between items-center px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 class="font-bold text-lg text-gray-700 dark:text-gray-200">Edit HTML Source</h3>
            <button @click="showCodeModal = false" class="text-gray-500 hover:text-red-500 transition-colors">
              <span class="text-2xl">&times;</span>
            </button>
          </div>
          <div class="flex-1 overflow-hidden relative bg-[#282c34]">
            <textarea v-model="internalHtmlCode"
              class="w-full h-full bg-[#282c34] text-gray-200 font-mono text-sm p-4 outline-none resize-none border-none focus:ring-0"
              spellcheck="false"></textarea>
          </div>
          <div class="px-4 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-2">
            <button @click="showCodeModal = false"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium text-sm">Batal</button>
            <button @click="saveSourceCode"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm">Simpan</button>
          </div>
        </div>
      </div>

    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type Quill from 'quill'

// --- IMPORTS CSS ---
import 'quill/dist/quill.snow.css'
import 'quill-table-better/dist/quill-table-better.css'

const props = defineProps({
  modelValue: { type: String, default: '' },
  isFullscreen: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Ketik isi surat disini...' }
})

const emit = defineEmits(['update:modelValue', 'ready'])

const editorRef = ref<HTMLElement>()
let quill: Quill | null = null
const showCodeModal = ref(false)
const internalHtmlCode = ref('')

// Format HTML Helper
function formatHTML(html: string) {
  let formatted = '';
  const reg = /(>)(<)(\/*)/g;
  html = html.replace(reg, '$1\r\n$2$3');
  let pad = 0;
  html.split('\r\n').forEach((node) => {
    let indent = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) indent = 0;
    else if (node.match(/^<\/\w/)) { if (pad !== 0) pad -= 1; }
    else if (node.match(/^<\w[^>]*[^\/]>.*$/)) indent = 1;
    else indent = 0;
    let padding = '';
    for (let i = 0; i < pad; i++) padding += '  ';
    formatted += padding + node + '\r\n';
    pad += indent;
  });
  return formatted;
}

function openSourceCode() {
  if (!quill) return;
  internalHtmlCode.value = formatHTML(quill.root.innerHTML);
  showCodeModal.value = true;
}

function saveSourceCode() {
  if (!quill) return;
  quill.clipboard.dangerouslyPasteHTML(0, internalHtmlCode.value);
  emit('update:modelValue', internalHtmlCode.value);
  showCodeModal.value = false;
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  const QuillModule = await import('quill')
  const Quill = QuillModule.default

  const QuillTableBetterModule = await import('quill-table-better')
  const QuillTableBetter = QuillTableBetterModule.default
  Quill.register({ 'modules/table-better': QuillTableBetter }, true)

  const icons = Quill.import('ui/icons') as any;
  icons['html-preview'] = `<svg viewbox="0 0 18 18"><polyline class="ql-even ql-stroke" points="5 7 3 9 5 11"/><polyline class="ql-even ql-stroke" points="13 7 15 9 13 11"/><line class="ql-stroke" x1="10" x2="8" y1="5" y2="13"/></svg>`;

  if (editorRef.value) {
    quill = new Quill(editorRef.value, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['clean'],
            ['table-better'],
            ['html-preview']
          ],
          handlers: {
            'html-preview': openSourceCode
          }
        },
        table: false,
        'table-better': {
          language: 'en_US',
          menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'copy', 'delete'],
          toolbarTable: true,
        },
        keyboard: { bindings: QuillTableBetter.keyboardBindings }
      },
      placeholder: props.placeholder
    })

    if (props.modelValue) {
      quill.clipboard.dangerouslyPasteHTML(0, props.modelValue)
    }

    quill.on('text-change', () => {
      emit('update:modelValue', quill?.root.innerHTML)
    })

    emit('ready', quill)
  }
})

watch(() => props.modelValue, (newVal) => {
  if (quill && newVal !== quill.root.innerHTML) {
    // Optional: quill.clipboard.dangerouslyPasteHTML(0, newVal)
  }
})
</script>

<style scoped>
/* Styling Editor Container A4 */
.editor-container {
  width: 210mm;
  min-height: 297mm;
  background: white;
  margin: 0 auto;
}

/* Fullscreen Editor - Memastikan memenuhi layar */
.fullscreen-editor {
  width: 100%;
  min-height: 100vh;
}

.tn-roman,
.tn-roman * {
  font-family: 'Times New Roman', Times, serif !important;
  color: black;
}

/* Override Quill Default Styles */
:deep(.ql-editor) {
  padding: 10px 0;
  min-height: 200px;
  font-family: 'Times New Roman', Times, serif;
  font-size: 12pt;
  line-height: 1.5;
}

:deep(.ql-toolbar) {
  position: sticky !important;
  top: 0 !important;
  z-index: 50 !important;
  background-color: white !important;
  border: 1px solid #e5e7eb !important;
  border-left: none;
  border-right: none;
  border-top: none;
}

/* Dark Mode Toolbar Override */
.dark :deep(.ql-toolbar) {
  background-color: rgb(31 41 55) !important;
  border-color: rgb(75 85 99) !important;
}

/* Table Style Fixes */
:deep(table) {
  width: 100%;
  border-collapse: collapse;
}

:deep(td),
:deep(th) {
  border: 1px solid #000;
  padding: 4px;
}
</style>
