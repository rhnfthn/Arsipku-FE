<template>
  <div class="editor-wrapper">
    <ClientOnly>
      <QuillEditor
        v-model:content="content"
        contentType="html"
        theme="snow"
        :toolbar="toolbarOptions"
        placeholder="Tulis sesuatu di sini..."
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])
const content = ref(props.modelValue)

// Sinkronisasi data
watch(content, (newVal) => {
  emit('update:modelValue', newVal)
})

watch(() => props.modelValue, (newVal) => {
  if (newVal !== content.value) {
    content.value = newVal
  }
})

/* KONFIGURASI TOOLBAR
   Perubahan:
   1. Menambahkan { 'list': 'check' } untuk checkbox.
   2. Menempatkan tombol Indent berdekatan dengan List agar user
      bisa mengubah tipe list (misal: 1 ke a) menggunakan tombol toolbar,
      bukan tombol Tab keyboard.
*/
const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],

  [{ 'header': 1 }, { 'header': 2 }],

  // BAGIAN LIST: Ordered, Bullet, dan Checkbox
  [
    { 'list': 'ordered'},
    { 'list': 'bullet' },
    { 'list': 'check' } // Menambahkan Checkbox List
  ],

  // BAGIAN INDENT: Tombol ini pengganti fungsi TAB keyboard untuk nesting (1 -> a -> i)
  [
    { 'indent': '-1'},
    { 'indent': '+1' }
  ],

  [{ 'script': 'sub'}, { 'script': 'super' }],
  [{ 'direction': 'rtl' }],

  [{ 'size': ['small', false, 'large', 'huge'] }],
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

  [{ 'color': [] }, { 'background': [] }],
  [{ 'font': [] }],
  [{ 'align': [] }],

  ['clean'],
  ['link', 'image', 'video']
]
</script>

<style>
/* --- LOGIKA CSS UNTUK TIPE LIST --- */

/* Level 0: Angka Biasa (1, 2, 3) */
.ql-editor ol > li {
  list-style-type: decimal;
}

/* Level 1 (Indent 1x - Klik tombol Indent Right 1x): Huruf Kecil (a, b, c) */
.ql-editor ol > li.ql-indent-1 {
  list-style-type: lower-alpha;
}

/* Level 2 (Indent 2x): Romawi Kecil (i, ii, iii) */
.ql-editor ol > li.ql-indent-2 {
  list-style-type: lower-roman;
}

/* Level 3 (Indent 3x): Huruf Besar (A, B, C) */
.ql-editor ol > li.ql-indent-3 {
  list-style-type: upper-alpha;
}

/* Level 4 (Indent 4x): Romawi Besar (I, II, III) */
.ql-editor ol > li.ql-indent-4 {
  list-style-type: upper-roman;
}

/* Memastikan Checkbox (Task List) tampil benar (menghilangkan bullet default) */
.ql-editor li[data-list=checked],
.ql-editor li[data-list=unchecked] {
    list-style-type: none !important;
}

/* Reset counter bawaan agar tidak bentrok */
.ql-editor li::before {
  display: none !important;
}

/* --- STYLING EDITOR --- */
.editor-wrapper {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.ql-toolbar {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ddd;
}
/* Agar tombol indent terlihat jelas sebagai bagian navigasi list */
.ql-formats button.ql-indent {
    margin-left: 2px;
}
.ql-container {
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  min-height: 200px;
  font-family: 'Arial', sans-serif;
  font-size: 16px;
}
</style>
