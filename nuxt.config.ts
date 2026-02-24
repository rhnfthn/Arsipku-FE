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
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || "",
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
