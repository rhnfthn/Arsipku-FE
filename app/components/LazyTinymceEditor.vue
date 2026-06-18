<template>
  <ClientOnly>
    <Suspense>
      <template #default>
        <Editor v-bind="$attrs" />
      </template>
      <template #fallback>
        <div class="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <span class="text-sm text-gray-500">Memuat editor...</span>
        </div>
      </template>
    </Suspense>
  </ClientOnly>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const Editor = defineAsyncComponent(() => import("@tinymce/tinymce-vue"));

/*
  Nuxt reserves the <Lazy...> prefix for auto-generated dynamic imports.
  Karena komponen ini secara manual lazy-load TinyMCE, kita sengaja memberi nama
  LazyTinymceEditor agar jelas. Runtime uji coba menunjukkan tetap berfungsi,
  tetapi warning di atas dapat diabaikan.
*/
</script>
