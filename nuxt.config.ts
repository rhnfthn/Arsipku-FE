// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: "ArsipKu",
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  compatibilityDate: "2025-07-15",

  devtools: {
    enabled: process.env.NUXT_DEVTOOLS_ENABLED === "true" || true,
  },

  modules: ["@nuxt/ui", "@nuxt/icon", "@nuxtjs/i18n"],

  build: {
    transpile: ["@vuepic/vue-datepicker"],
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          tinymce: ["@tinymce/tinymce-vue"],
          lucide: ["lucide-vue-next"],
          datepicker: ["@vuepic/vue-datepicker"],
          "internationalized-date": ["@internationalized/date"],
        },
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || "",
      pdfServiceUrl: process.env.NUXT_PUBLIC_PDF_SERVICE_URL || "http://172.20.16.115:3011",
      previewFileUrl: process.env.NUXT_PUBLIC_PREVIEW_FILE_URL || "http://172.20.16.115:3011",
    },
  },

  i18n: {
    defaultLocale: "id",
    langDir: "locales/",
    lazy: true,
    strategy: "no_prefix",
    locales: [
      { code: "id", name: "ID", file: "id.json" },
      { code: "en", name: "EN", file: "en.json" },
    ],
  },

  css: ["~/assets/css/main.css"],

  ui: {
    fonts: true,
    colorMode: false,
    theme: {
      colors: [
        "primary",
        "secondary",
        "warning",
        "error",
        "success",
        "neutral",
      ],
      transitions: false,
      defaultVariants: {
        color: "neutral",
        size: "sm",
      },
    },
    experimental: {
      componentDetection: ["Modal", "Dropdown", "Popover"],
    },
  },
});
