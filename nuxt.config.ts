// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "@nuxt/icon", "@nuxtjs/i18n"],
  build: {
    transpile: ["@vuepic/vue-datepicker"],
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: "http://172.20.16.115:3011",
      // apiBaseUrl: "https://arsipku-api.rizan.app",
    },
  },

  i18n: {
    defaultLocale: "id",
    langDir: "locales/",
    lazy: true,

    locales: [
      { code: "id", name: "ID", file: "id.json" },
      { code: "en", name: "EN", file: "en.json" },
    ],
  },

  css: ["~/assets/css/main.css", "~/assets/css/quill-custom.css"],

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
  // devServer: {
  //   port: 7010,
  //   host: "0.0.0.0",
  //   host: "0.0.0.0", // kalau mau bisa diakses dari device lain di jaringan

  // },
});
