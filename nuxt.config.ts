// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // ArsipKu adalah dashboard internal authenticated, tidak butuh SEO/SSR.
  // Disable SSR = SPA mode → eliminasi semua hydration mismatch karena
  // state aplikasi (auth/user/localStorage) memang hanya ada di client.
  ssr: false,

  app: {
    head: {
      title: "ArsipKu",
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  compatibilityDate: "2025-07-15",

  devtools: {
    enabled: process.env.NUXT_DEVTOOLS_ENABLED === "true" || false,
  },

  modules: ["@nuxt/ui", "@nuxt/icon", "@nuxtjs/i18n"],

  build: {
    transpile: ["@vuepic/vue-datepicker"],
  },

  vite: {
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            tinymce: ["@tinymce/tinymce-vue"],
            lucide: ["lucide-vue-next"],
            datepicker: ["@vuepic/vue-datepicker"],
            "internationalized-date": ["@internationalized/date"],
            xlsx: ["xlsx"],
            "file-saver": ["file-saver"],
            chart: ["chart.js/auto"],
            "reka-ui": ["reka-ui"],
            zod: ["zod"],
            axios: ["axios"],
          },
        },
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
      pdfServiceUrl: process.env.NUXT_PUBLIC_PDF_SERVICE_URL || "http://172.20.16.115:3011",
      previewFileUrl: process.env.NUXT_PUBLIC_PREVIEW_FILE_URL || "http://172.20.16.115:3011",
    },
  },

  i18n: {
    defaultLocale: "id",
    langDir: "locales/",
    strategy: "no_prefix",
    locales: [
      { code: "id", name: "ID", file: "id.json" },
      { code: "en", name: "EN", file: "en.json" },
    ],
  },

  css: ["~/assets/css/main.css"],

  typescript: {
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: false,
      },
    },
  },

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
