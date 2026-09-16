export default defineEventHandler((event) => {
  const query = getQuery(event);
  const code = Array.isArray(query.code) ? query.code[0] : query.code;
  const state = Array.isArray(query.state) ? query.state[0] : query.state;
  const providerError = Array.isArray(query.error) ? query.error[0] : query.error;
  const providerErrorDescription = Array.isArray(query.error_description)
    ? query.error_description[0]
    : query.error_description;

  const config = useRuntimeConfig(event);
  const isLocalFlow = String(state || '').startsWith('local.');
  const configuredBackend = isLocalFlow
    ? config.public.authLocalBackendUrl
    : config.public.authServerBackendUrl;
  // Avoid String(undefined): it produces the truthy URL "undefined/..." and
  // throws from new URL(), which Nuxt renders as an HTTP 500 callback page.
  const backendUrl = String(
    configuredBackend || config.public.apiBaseUrl || '',
  ).replace(/\/+$/, '');

  if (!backendUrl) {
    return sendRedirect(
      event,
      `/auth/callback?error=${encodeURIComponent('Alamat backend Auth v2 belum dikonfigurasi')}`,
      302
    );
  }

  const callback = new URL(`${backendUrl}/auth/callback`);
  if (code) callback.searchParams.set('code', String(code));
  if (state) callback.searchParams.set('state', String(state));
  if (providerError) callback.searchParams.set('error', String(providerError));
  if (providerErrorDescription) {
    callback.searchParams.set('error_description', String(providerErrorDescription));
  }

  if ((!code || !state) && !providerError) {
    return sendRedirect(
      event,
      `/auth/callback?error=${encodeURIComponent('Authorization code atau state tidak ditemukan')}`,
      302
    );
  }

  return sendRedirect(event, callback.toString(), 302);
});
