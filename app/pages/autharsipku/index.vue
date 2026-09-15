<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-50">
    <div class="text-center">
      <UIcon name="i-lucide-loader-circle" class="h-10 w-10 animate-spin text-primary-600" />
      <Paragraph variant="body2" as="p" class="mt-3 text-neutral-500">
        Menyelesaikan autentikasi…
      </Paragraph>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

// Fallback untuk deployment static yang tidak menjalankan Nitro server route.
// Deployment node-server akan meneruskan callback sebelum halaman ini dirender.
onMounted(() => {
  const route = useRoute();
  const config = useRuntimeConfig();
  const state = Array.isArray(route.query.state) ? route.query.state[0] : route.query.state;
  const baseUrl = String(
    String(state || '').startsWith('local.')
      ? config.public.authLocalBackendUrl
      : config.public.authServerBackendUrl
  ).replace(/\/$/, '');
  const callback = new URL(`${baseUrl}/auth/callback`);

  for (const key of ['code', 'state', 'error', 'error_description']) {
    const value = route.query[key];
    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized) callback.searchParams.set(key, String(normalized));
  }

  window.location.replace(callback.toString());
});
</script>
