<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50 px-6">
    <section class="w-full max-w-md rounded-card bg-white p-8 text-center shadow-sm">
      <UIcon
        :name="errorMessage ? 'i-lucide-circle-alert' : 'i-lucide-loader-circle'"
        class="mx-auto mb-4 h-10 w-10 text-primary-600"
        :class="{ 'animate-spin': !errorMessage }"
      />
      <Heading variant="heading9b" as="h1">
        {{ errorMessage ? 'Login tidak dapat diselesaikan' : 'Menyelesaikan login' }}
      </Heading>
      <Paragraph variant="body2" as="p" class="mt-2 text-neutral-500">
        {{ errorMessage || 'Mohon tunggu, sesi ArsipKu sedang disiapkan.' }}
      </Paragraph>
      <UButton v-if="errorMessage" class="mt-6" icon="i-lucide-log-in" @click="restartLogin">
        Login kembali
      </UButton>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const { restoreSession, getSSORedirectUrl, applyLoginDefaults } = useAuth();
const errorMessage = ref('');

const queryValue = (value: unknown): string =>
  Array.isArray(value) ? String(value[0] || '') : String(value || '');

const safeReturnTo = (value: string): string => {
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/auth') ||
    value.includes('\\')
  ) {
    return '/beranda';
  }
  return value;
};

const restartLogin = async () => {
  const url = await getSSORedirectUrl('/beranda');
  await navigateTo(url, { external: true });
};

onMounted(async () => {
  const providerError = queryValue(route.query.error);
  const code = queryValue(route.query.code);
  const state = queryValue(route.query.state);
  const returnTo = safeReturnTo(queryValue(route.query.redirect));

  // Mendukung redirect_uri yang terdaftar ke frontend. Pertukaran code tetap
  // dilakukan backend agar client_secret dan PKCE verifier tidak terekspos.
  if (code && state) {
    const baseUrl = String(useRuntimeConfig().public.apiBaseUrl || '').replace(/\/$/, '');
    const callback = new URL(`${baseUrl}/auth/callback`);
    callback.searchParams.set('code', code);
    callback.searchParams.set('state', state);
    window.location.replace(callback.toString());
    return;
  }

  window.history.replaceState({}, document.title, '/auth/callback');

  if (providerError) {
    errorMessage.value = providerError;
    return;
  }

  const sessionUser = await restoreSession();
  if (!sessionUser) {
    errorMessage.value = 'Sesi Auth v2 tidak ditemukan atau sudah kedaluwarsa.';
    return;
  }

  // Login baru selalu mulai dengan light mode + bahasa Indonesia.
  applyLoginDefaults();

  await navigateTo(returnTo, { replace: true });
});
</script>
