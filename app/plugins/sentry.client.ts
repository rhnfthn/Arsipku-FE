import * as Sentry from '@sentry/vue';

/**
 * Plugin Nuxt (client-only) untuk inisialisasi Sentry di frontend Arsipku.
 *
 * Sentry HANYA aktif jika runtimeConfig.public.sentryDsn di-set.
 * Jika sentryDsn kosong / tidak ada, plugin ini no-op (tidak melakukan
 * apa-apa) sehingga aplikasi tetap jalan normal tanpa Sentry.
 *
 * DSN dibaca dari runtimeConfig.public.sentryDsn yang di-set via
 * NUXT_PUBLIC_SENTRY_DSN environment variable di nuxt.config.ts.
 *
 * Keamanan:
 *  - beforeSend scrub field sensitif (password, token, authorization) dari event.
 *  - Jangan kirim data sensitif ke Sentry.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const dsn = config.public.sentryDsn as string | undefined;

  if (!dsn) {
    // Sentry tidak dikonfigurasi → skip inisialisasi (no-op)
    // eslint-disable-next-line no-console
    console.log('[Sentry] NUXT_PUBLIC_SENTRY_DSN not set — Sentry disabled (no-op).');
    return;
  }

  const environment = process.env.NODE_ENV || 'development';
  const tracesSampleRate = parseFloat(
    (config.public.sentryTracesSampleRate as string) ?? '1.0',
  );

  Sentry.init({
    app: nuxtApp.vueApp,
    dsn,
    environment,
    tracesSampleRate: Number.isNaN(tracesSampleRate) ? 1.0 : tracesSampleRate,
    // Scrub field sensitif sebelum event dikirim ke Sentry
    beforeSend(event: any): any {
      return scrubSentryEvent(event);
    },
  });

  // eslint-disable-next-line no-console
  console.log(`[Sentry] Initialized (env=${environment}).`);
});

/**
 * Scrub field sensitif dari Sentry event sebelum dikirim.
 */
function scrubSentryEvent(event: any): any {
  const sensitiveKeys = [
    'password',
    'passwd',
    'secret',
    'token',
    'authorization',
    'auth',
    'jwt',
    'apikey',
    'api_key',
    'privatekey',
    'private_key',
    'firebase',
  ];

  const scrubObject = (obj: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        result[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = scrubObject(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  };

  // Scrub request headers
  if (event.request?.headers) {
    event.request.headers = scrubObject(event.request.headers);
  }

  // Scrub extra data
  if (event.extra) {
    event.extra = scrubObject(event.extra);
  }

  return event;
}