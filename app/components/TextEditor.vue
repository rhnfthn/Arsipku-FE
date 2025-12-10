<template>
  <div class="flex flex-col h-full relative">

    <div class="flex-1 overflow-y-auto bg-gray-200 dark:bg-gray-900 transition-all duration-300 w-full"
      :class="isFullscreen ? 'p-0' : 'p-8'">

      <div class="bg-white shadow-xl relative transition-all duration-300 flex flex-col tn-roman"
        :class="{ 'fullscreen-editor': isFullscreen, 'editor-container mx-auto': !isFullscreen }">

        <div class="px-12 pt-4 shrink-0 select-none">
          <slot name="header"></slot>
        </div>

        <div ref="editorRef" class="editor-content h-auto flex-1 tn-roman-editor px-12"></div>

        <div class="px-12 pb-10 tn-roman shrink-0">
          <slot name="footer"></slot>
        </div>
      </div>

      <p v-if="!isFullscreen" class="text-center text-gray-500 mt-4 text-sm">
        *Tampilan edit tersambung. Klik <b>Preview PDF</b> untuk melihat hasil cetak.
      </p>
    </div>

    <div v-if="showCodeModal"
      class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">

        <div
          class="flex justify-between items-center px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 class="font-bold text-lg text-gray-700 dark:text-gray-200">Edit HTML Source</h3>
          <button @click="showCodeModal = false" class="text-gray-500 hover:text-red-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-hidden relative bg-[#282c34]">
          <textarea v-model="internalHtmlCode"
            class="w-full h-full bg-[#282c34] text-gray-200 font-mono text-sm p-4 outline-none resize-none border-none focus:ring-0"
            spellcheck="false" placeholder="Paste HTML code here..."></textarea>
        </div>

        <div class="px-4 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-2">
          <button @click="showCodeModal = false"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium text-sm">Batal</button>
          <button @click="saveSourceCode"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type Quill from 'quill'

// --- IMPORTS ---
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

// State untuk Modal HTML
const showCodeModal = ref(false)
const internalHtmlCode = ref('') // Variabel penampung kode HTML mentah

defineExpose({
  getQuill: () => quill,
  setHtml: (html: string) => {
    if (quill) quill.clipboard.dangerouslyPasteHTML(0, html)
  }
})

// --- HELPER: FORMAT HTML (Prettify) ---
// Membuat kode HTML rapi (indentasi) saat dibuka di textarea
function formatHTML(html: string) {
  let formatted = '';
  // Regex untuk memisahkan tag
  const reg = /(>)(<)(\/*)/g;
  html = html.replace(reg, '$1\r\n$2$3');
  let pad = 0;

  html.split('\r\n').forEach((node) => {
    let indent = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (node.match(/^<\/\w/)) {
      if (pad !== 0) pad -= 1;
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }

    let padding = '';
    for (let i = 0; i < pad; i++) {
      padding += '  ';
    }

    formatted += padding + node + '\r\n';
    pad += indent;
  });

  return formatted;
}

// --- HANDLER: BUKA MODAL ---
function openSourceCode() {
  if (!quill) return;

  // 1. Ambil HTML asli dari Quill
  const rawHtml = quill.root.innerHTML;

  // 2. Format agar rapi, lalu masukkan ke variabel textarea
  internalHtmlCode.value = formatHTML(rawHtml);

  // 3. Tampilkan modal
  showCodeModal.value = true;
}

// --- HANDLER: SIMPAN PERUBAHAN ---
function saveSourceCode() {
  if (!quill) return;

  // 1. Ambil nilai dari textarea
  const newHtml = internalHtmlCode.value;

  // 2. Masukkan kembali ke Quill Editor
  // dangerousPasteHTML(0, ...) mengganti seluruh isi editor
  quill.clipboard.dangerouslyPasteHTML(0, newHtml);

  // 3. Trigger update v-model
  emit('update:modelValue', newHtml);

  // 4. Tutup modal
  showCodeModal.value = false;
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  const QuillModule = await import('quill')
  const Quill = QuillModule.default

  // Import CSS
  await import('quill/dist/quill.snow.css')

  // Dynamic Import Table Better
  const QuillTableBetterModule = await import('quill-table-better')
  const QuillTableBetter = QuillTableBetterModule.default
  Quill.register({ 'modules/table-better': QuillTableBetter }, true)

  // Custom List Logic (Tetap dipertahankan)
  const BaseList = Quill.import('formats/list') as any;
  class CustomList extends BaseList {
    static formats(domNode: any) { return domNode.getAttribute('data-list') || super.formats(domNode) }
    static create(value: any) {
      const node = super.create(value);
      if (['lower-alpha', 'upper-alpha'].includes(value)) node.setAttribute('data-list', value);
      return node;
    }
  }
  CustomList.blotName = 'list'; CustomList.tagName = ['OL', 'UL']; Quill.register(CustomList, true);

  // --- REGISTER ICONS (HTML Preview + Undo + Redo) ---
  const icons = Quill.import('ui/icons') as any;

  // Icon HTML Preview
  icons['html-preview'] = `<svg viewbox="0 0 18 18">
    <polyline class="ql-even ql-stroke" points="5 7 3 9 5 11"/>
    <polyline class="ql-even ql-stroke" points="13 7 15 9 13 11"/>
    <line class="ql-stroke" x1="10" x2="8" y1="5" y2="13"/>
  </svg>`;

  // Icon Undo
  icons['undo'] = `<svg viewbox="0 0 18 18">
    <polygon class="ql-fill ql-stroke" points="6 10 4 12 2 10 6 10"></polygon>
    <path class="ql-stroke" d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"></path>
  </svg>`;

  // Icon Redo
  icons['redo'] = `<svg viewbox="0 0 18 18">
    <polygon class="ql-fill ql-stroke" points="12 10 14 12 16 10 12 10"></polygon>
    <path class="ql-stroke" d="M9.91,13.91A4.6,4.6,0,0,1,9,14,5,5,0,1,1,14,9"></path>
  </svg>`;

  if (editorRef.value) {
    quill = new Quill(editorRef.value, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: [
            ['undo', 'redo'], // <--- Menambahkan Undo Redo disini
            ['bold', 'italic', 'underline', 'strike'],
            // ['blockquote', 'code-block'],
            // ['link', 'image', 'video', 'formula'],
            // [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            // [{ 'direction': 'rtl' }],
            // [{ 'size': ['small', false, 'large', 'huge'] }],
            // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            // [{ 'color': [] }, { 'background': [] }],
            // [{ 'font': [] }],
            [{ 'align': [] }],
            ['clean'],
            ['table-better'],
            ['html-preview'] // Tombol Code View
          ],
          handlers: {
            'html-preview': openSourceCode,
            'undo': () => quill?.history.undo(), // <--- Fungsi Handler Undo
            'redo': () => quill?.history.redo()  // <--- Fungsi Handler Redo
          }
        },
        table: false,
        'table-better': {
          language: 'en_US',
          menus: ['column', 'row', 'merge', 'table', 'cell', 'wrap', 'copy', 'delete'],
          toolbarTable: true,
        },
        keyboard: {
          bindings: {
            ...QuillTableBetter.keyboardBindings,

            customEnter: {
              key: 13,
              handler(range, context) {
                if (context.format.list) {
                  quill?.insertText(range.index, '\n', context.format);
                  quill?.setSelection(range.index + 1, 0);
                  return false;
                }
                return true;
              }
            },

          }
        },
        history: { userOnly: true } // Pastikan module history aktif
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
    // Optional logic
  }
})
</script>

<style scoped>
[data-list="lower-alpha"] {
  list-style-type: lower-alpha !important;
}

[data-list="upper-alpha"] {
  list-style-type: upper-alpha !important;
}

:deep(.ql-editor li) {
  /* Properiti krusial yang direset Tailwind. Harus dikembalikan. */
  display: list-item !important;
  /* Pastikan posisi marker di luar teks */
  list-style-position: outside !important;
  padding-left: 0 !important;
  /* Biarkan OL/UL yang mengontrol indentasi */
  color: #000000 !important;
}

/* 2. Atur kontainer list (OL/UL) */
:deep(.ql-editor ol),
:deep(.ql-editor ul) {
  /* Kunci: set initial untuk mengatasi reset list: none; */
  list-style: initial !important;
  /* Beri padding cukup untuk menampung marker */
  padding-left: 2rem !important;
  list-style-position: outside !important;
  margin-left: 0 !important;
}

/* 3. Perkuat List Type Level 1 */
:deep(.ql-editor ol) {
  list-style-type: decimal !important;
}

:deep(.ql-editor ul) {
  list-style-type: disc !important;
}

/* 4. Perkuat List Type Level 2 dan seterusnya */
:deep(.ql-editor ol ol) {
  list-style-type: lower-alpha !important;
}

:deep(.ql-editor ol ol ol) {
  list-style-type: lower-roman !important;
}

:deep(.ql-editor li::before) {
  display: inline-block;
}

.tn-roman,
.tn-roman * {
  font-family: 'Times New Roman', Times, serif !important;
}

:deep(.ql-editor table) {
  width: unset;
}

.editor-container {
  width: 210mm;
  min-height: 297mm;
  background: white;
}

.fullscreen-editor {
  width: 100%;
  min-height: 100vh;
}

/* Dark Mode Overrides */
.dark :deep(.ql-toolbar) {
  background-color: rgb(55 65 81) !important;
  border-color: rgb(75 85 99) !important;
  color: white;
}

.dark :deep(.ql-toolbar button) {
  color: rgb(229 231 235);
}

.dark :deep(.ql-toolbar .ql-stroke) {
  stroke: rgb(229 231 235);
}

.dark :deep(.ql-toolbar .ql-fill) {
  fill: rgb(229 231 235);
}

.dark :deep(.ql-editor) {
  color: rgb(229 231 235);
  background-color: rgb(31 41 55);
}

table {
  page-break-inside: auto
}

tr {
  page-break-inside: avoid;
  page-break-after: auto
}

/* Font khusus coding */
textarea {
  font-family: 'Fira Code', 'Consolas', monospace;
}
</style>
