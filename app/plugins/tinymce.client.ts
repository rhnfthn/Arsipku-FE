import { defineNuxtPlugin } from '#app'
import Editor from '@tinymce/tinymce-vue'

// Lazy-load core TinyMCE (agar tidak pakai CDN) — dynamic import supaya
// TinyMCE (~700kB) tidak membebani entry chunk; hanya di-load saat plugin
// client pertama kali berjalan, sebelum komponen editor dirender.
export default defineNuxtPlugin(async (nuxtApp) => {
  // Komponen global tetap diregistrasi (dipakai e.g. nodin.vue);
  // @tinymce/tinymce-vue hanya wrapper tipis (~2kB), bukan sumber berat.
  nuxtApp.vueApp.component('TinymceEditor', Editor)

  // Lazy-load core TinyMCE (agar tidak pakai CDN) — dynamic import supaya
  // TinyMCE (~700kB) tidak membebani entry chunk; di-load saat plugin
  // client berjalan, sebelum komponen editor dirender.
  //
  // PENTING: core HARUS di-await duluan sebelum icons/theme/plugins.
  // File icons/theme/plugins membaca global `tinymce` di top-level module
  // (mis. `tinymce.IconManager.add(...)`, `tinymce.util.Tools.resolve(...)`).
  // Jika dimuat paralel dengan core (Promise.all), chunk mereka bisa
  // tereksekusi sebelum core men-set window.tinymce →
  // "ReferenceError: tinymce is not defined".
  await import('tinymce/tinymce')
  // Setelah global `tinymce` tersedia, sisanya aman dimuat paralel.
  await Promise.all([
    import('tinymce/icons/default'),
    import('tinymce/themes/silver'),
    // Plugins yang kamu gunakan
    import('tinymce/plugins/lists'),
    import('tinymce/plugins/link'),
    import('tinymce/plugins/image'),
    import('tinymce/plugins/code'),
    import('tinymce/plugins/table'),
  ])
})
