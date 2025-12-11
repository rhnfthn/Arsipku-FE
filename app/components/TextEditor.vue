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
const internalHtmlCode = ref('')

defineExpose({
  getQuill: () => quill,
  setHtml: (html: string) => {
    if (quill) quill.clipboard.dangerouslyPasteHTML(0, html)
  }
})

// --- HELPER: FORMAT HTML (Prettify) ---
function formatHTML(html: string) {
  let formatted = '';
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
  const rawHtml = quill.root.innerHTML;
  internalHtmlCode.value = formatHTML(rawHtml);
  showCodeModal.value = true;
}

// --- HANDLER: SIMPAN PERUBAHAN ---
function saveSourceCode() {
  if (!quill) return;
  const newHtml = internalHtmlCode.value;
  quill.clipboard.dangerouslyPasteHTML(0, newHtml);
  emit('update:modelValue', newHtml);
  showCodeModal.value = false;
}

onMounted(async () => {
  if (typeof window === 'undefined') return
  const QuillModule = await import('quill')
  const Quill = QuillModule.default

  await import('quill/dist/quill.snow.css')

  const QuillTableBetterModule = await import('quill-table-better')
  const QuillTableBetter = QuillTableBetterModule.default
  Quill.register({ 'modules/table-better': QuillTableBetter }, true)

  // -----------------------------------------------------------
  // [REMOVED] CUSTOM LIST LOGIC DIHAPUS (Bawaan Quill Saja)
  // -----------------------------------------------------------

  // --- REGISTER ICONS ---
  const icons = Quill.import('ui/icons') as any;

  // Icon HTML Preview
  icons['html-preview'] = `<svg viewbox="0 0 18 18">
    <polyline class="ql-even ql-stroke" points="5 7 3 9 5 11"/>
    <polyline class="ql-even ql-stroke" points="13 7 15 9 13 11"/>
    <line class="ql-stroke" x1="10" x2="8" y1="5" y2="13"/>
  </svg>`;

  // Icon Undo & Redo
  icons['undo'] = `<svg viewbox="0 0 18 18">
    <polygon class="ql-fill ql-stroke" points="6 10 4 12 2 10 6 10"></polygon>
    <path class="ql-stroke" d="M8.09,13.91A4.6,4.6,0,0,0,9,14,5,5,0,1,0,4,9"></path>
  </svg>`;
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
            ['undo', 'redo'],
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
            'html-preview': openSourceCode,
            'undo': () => quill?.history.undo(),
            'redo': () => quill?.history.redo()
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
            // Hapus custom binding lainnya jika ada
          }
        },
        history: { userOnly: true }
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
    // Optional logic if needed for external updates
  }
})
</script>

<style scoped>
/* 1. HILANGKAN ELEMENT SAMPAH QUILL (.ql-ui)
   Ini adalah penyebab utama munculnya titik ganda aneh itu.
*/
:deep(.ql-editor .ql-ui) {
  display: none !important;
}

/* 2. RESET CSS TAILWIND & KEMBALIKAN STYLE NATIVE
   Tailwind me-reset list-style jadi 'none'. Kita harus paksa balik.
*/
:deep(.ql-editor ol),
:deep(.ql-editor ul) {
  padding-left: 1.5rem !important;
  /* Jarak indentasi kiri */
  margin-bottom: 1rem !important;
}

/* Pastikan Ordered List pakai Angka (1, 2, 3) */
:deep(.ql-editor ol) {
  list-style-type: decimal !important;
}

/* Pastikan Unordered List pakai Titik (Bullet) */
:deep(.ql-editor ul) {
  list-style-type: disc !important;
}

/* Aturan untuk List Item */
:deep(.ql-editor li) {
  display: list-item !important;
  /* Pastikan dianggap item list */
  list-style-position: outside !important;
  /* Titik di luar teks */
  margin-left: 0.5rem !important;
  /* Sedikit jarak */
}

/* 3. HANDLING NESTED LIST (List di dalam list) */
:deep(.ql-editor ol ol),
:deep(.ql-editor ul ol) {
  list-style-type: lower-alpha !important;
  /* a, b, c */
}

:deep(.ql-editor ol ul),
:deep(.ql-editor ul ul) {
  list-style-type: circle !important;
  /* Lingkaran kosong */
}

/* --- Styling Editor Umum --- */
.tn-roman,
.tn-roman * {
  font-family: 'Times New Roman', Times, serif !important;
}

/* Fix lebar tabel agar tidak overflow */
:deep(.ql-editor table) {
  width: 100%;
  border-collapse: collapse;
}

:deep(.ql-editor td),
:deep(.ql-editor th) {
  border: 1px solid #000;
  padding: 4px;
}

.editor-container {
  width: 210mm;
  min-height: 297mm;
  background: white;
  margin: 0 auto;
  /* Center editor */
}

.fullscreen-editor {
  width: 100%;
  min-height: 100vh;
}

/* Dark Mode Support */
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

/* Print CSS Helpers */
table {
  page-break-inside: auto;
}

tr {
  page-break-inside: avoid;
  page-break-after: auto;
}

/* --- 1. MEMBUAT TOOLBAR STICKY --- */
:deep(.ql-toolbar) {
  position: sticky !important;
  top: 0 !important; /* Jarak dari atas */
  z-index: 50 !important; /* Pastikan di atas konten teks */
  background-color: white !important; /* Wajib ada background agar teks tidak tembus */
  border-bottom: 1px solid #e5e7eb !important; /* Garis pemisah bawah */

  /* Opsional: Tambahkan shadow saat sticky agar terlihat melayang */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* --- 2. PENYESUAIAN DARK MODE --- */
.dark :deep(.ql-toolbar) {
  background-color: rgb(31 41 55) !important; /* bg-gray-800 */
  border-color: rgb(75 85 99) !important; /* border-gray-600 */
}
</style>
