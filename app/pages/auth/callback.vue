<template>
  <main class="min-h-screen flex items-center justify-center bg-slate-50 px-6">
    <section class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
      <UIcon
        :name="errorMessage ? 'i-lucide-circle-alert' : 'i-lucide-loader-circle'"
        class="mx-auto mb-4 h-10 w-10 text-[#175fa4]"
        :class="{ 'animate-spin': !errorMessage }"
      />
      <h1 class="text-lg font-semibold text-slate-900">
        {{ errorMessage ? 'Login tidak dapat diselesaikan' : 'Menyelesaikan login' }}
      </h1>
      <p class="mt-2 text-sm text-slate-600">
        {{ errorMessage || 'Mohon tunggu, sesi ArsipKu sedang disiapkan.' }}
      </p>
      <UButton v-if="errorMessage" class="mt-6" @click="restartLogin"> Login kembali </UButton>
    </section>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const route = useRoute();
const { exchangeOidcCode, getProfile, getSSORedirectUrl, setUser, applyLoginDefaults } = useAuth();
const { clearTransaction } = useOidcPkce();
const errorMessage = ref('');

const queryValue = (value: unknown): string =>
  Array.isArray(value) ? String(value[0] || '') : String(value || '');

const restartLogin = async () => {
  const url = await getSSORedirectUrl('/beranda');
  if (url) await navigateTo(url, { external: true });
};

onMounted(async () => {
  const providerError = queryValue(route.query.error);
  const providerDescription = queryValue(route.query.error_description);
  const code = queryValue(route.query.code);
  const state = queryValue(route.query.state);

  // Credential callback tidak dibiarkan berada di browser history.
  window.history.replaceState({}, document.title, '/auth/callback');

  try {
    if (providerError) {
      clearTransaction();
      throw new Error(providerDescription || `Provider menolak login (${providerError})`);
    }
    if (!code || !state) throw new Error('Code atau state callback tidak ditemukan.');

    const result = await exchangeOidcCode(code, state);
    const profile = await getProfile(true);
    if (!profile && result.user) setUser(result.user);
    applyLoginDefaults();
    await navigateTo(result.returnTo || '/beranda', { replace: true });
  } catch (error: any) {
    clearTransaction();
    errorMessage.value = error?.data?.message || error?.message || 'Terjadi kesalahan saat login.';
  }
});
</script>
