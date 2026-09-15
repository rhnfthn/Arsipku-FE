// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // ArsipKu adalah dashboard internal authenticated, tidak butuh SEO/SSR.
  // Disable SSR = SPA mode → eliminasi semua hydration mismatch karena
  // state aplikasi (auth/user/localStorage) memang hanya ada di client.
  ssr: false,

  app: {
    head: {
      title: 'ArsipKu',
      link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
    },
  },

  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: process.env.NUXT_DEVTOOLS_ENABLED === 'true' || false,
  },

  modules: ['@nuxt/ui', '@nuxt/icon', '@nuxtjs/i18n', 'motion-v/nuxt'],

  icon: {
    // SPA mode (ssr: false): default provider 'iconify' fetch ke api.iconify.design.
    // Ganti ke 'server' — Nuxt dev/prod server serve icon dari @iconify-json/* lokal.
    // Tidak ada fetch ke Iconify API CDN saat runtime.
    serverBundle: 'local',
    provider: 'server',
    clientBundle: {
      // Pre-bundle icon yang ter-scan dari source code untuk first render cepat.
      // Icon dinamis akan di-fetch dari server endpoint lokal.
      scan: true,
    },
  },

  motionV: {
    components: true,
    utilities: true,
    directives: true,
  },

  build: {
    transpile: ['@vuepic/vue-datepicker'],
  },

  vite: {
    build: {
      // Entry chunk default ~1.8MB (Vue + Nuxt UI + reka-ui + motion-v + Sentry).
      // Naikkan limit agar warning hilang; vendor besar sudah di-split via
      // manualChunks di bawah, sisanya memang harus ada di entry (runtime inti).
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vendor besar → chunk terpisah agar cache browser lebih efisien
            // (vendor jarang berubah, app code sering berubah).
            if (id.includes('node_modules')) {
              if (id.includes('@sentry')) return 'sentry';
              if (id.includes('motion-v')) return 'motion';
              if (id.includes('reka-ui')) return 'reka-ui';
              if (id.includes('vue-i18n') || id.includes('@intlify')) return 'i18n';
              if (id.includes('lucide-vue-next')) return 'lucide';
              if (id.includes('@vuepic/vue-datepicker')) return 'datepicker';
              if (id.includes('@internationalized/date')) return 'internationalized-date';
              if (id.includes('xlsx')) return 'xlsx';
              if (id.includes('file-saver')) return 'file-saver';
              if (id.includes('chart.js')) return 'chart';
              if (id.includes('zod')) return 'zod';
              if (id.includes('axios')) return 'axios';
              if (id.includes('@tinymce/tinymce-vue')) return 'tinymce';
            }
          },
        },
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3011',
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'http://localhost:3011',
      authLocalBackendUrl:
        process.env.NUXT_PUBLIC_AUTH_LOCAL_BACKEND_URL || 'http://localhost:3011',
      authServerBackendUrl:
        process.env.NUXT_PUBLIC_AUTH_SERVER_BACKEND_URL ||
        process.env.NUXT_PUBLIC_API_BASE_URL ||
        'http://localhost:3011',
      pdfServiceUrl: process.env.NUXT_PUBLIC_PDF_SERVICE_URL || 'http://172.20.16.115:3011',
      previewFileUrl: process.env.NUXT_PUBLIC_PREVIEW_FILE_URL || 'http://172.20.16.115:3011',
      onlyofficeUrl: process.env.NUXT_PUBLIC_ONLYOFFICE_URL || 'http://localhost:80',
      // Sentry (frontend error monitoring) — no-op jika tidak di-set
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',
      sentryTracesSampleRate: process.env.NUXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '1.0',
    },
  },

  i18n: {
    defaultLocale: 'id',
    langDir: 'locales/',
    strategy: 'no_prefix',
    strictMessage: false,
    locales: [
      { code: 'id', name: 'ID', file: 'id.json' },
      { code: 'en', name: 'EN', file: 'en.json' },
    ],
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: false,
      },
    },
  },

  ui: {
    fonts: false,
    colorMode: false,
    theme: {
      colors: ['primary', 'secondary', 'warning', 'error', 'success', 'neutral'],
      transitions: false,
      defaultVariants: {
        color: 'neutral',
        size: 'sm',
      },
    },
    experimental: {
      componentDetection: ['Modal', 'Dropdown', 'Popover'],
    },
  },
});
