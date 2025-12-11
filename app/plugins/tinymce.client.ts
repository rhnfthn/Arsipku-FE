import { defineNuxtPlugin } from '#app'
import Editor from '@tinymce/tinymce-vue'

// Load core TinyMCE (agar tidak pakai CDN)
import 'tinymce/tinymce'

// icons & theme wajib
import 'tinymce/icons/default'
import 'tinymce/themes/silver'

// Plugins yang kamu gunakan
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/code'
import 'tinymce/plugins/table'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('TinymceEditor', Editor)
})
