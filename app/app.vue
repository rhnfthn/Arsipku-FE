<template>
  <UApp :toaster="toaster">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- <UNotifications /> -->
    <!-- <USelectMenu /> -->
  </UApp>
</template>

<script setup lang="ts">
import { watch } from 'vue'

// commit check: small code comment for local change
const toaster = { position: 'top-right' } as const

// Notifikasi realtime SDE Massal dapat datang dari payload lama dan payload
// baru dengan metadata/icon berbeda. Deduplikasi di state global memastikan
// hanya satu kartu dengan judul dan isi yang sama yang dirender oleh UApp.
const globalToasts = useState<any[]>('toasts', () => [])

const normalizeToastText = (value: unknown) =>
  String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()

watch(
  globalToasts,
  (items) => {
    const seen = new Set<string>()
    const deduplicated = items
      .slice()
      .reverse()
      .filter((item) => {
        const title = normalizeToastText(item?.title)
        if (!title.startsWith('sde massal ')) return true

        const key = `${title}|${normalizeToastText(item?.description)}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .reverse()

    if (deduplicated.length !== items.length) {
      globalToasts.value = deduplicated
    }
  },
  { deep: true, flush: 'sync', immediate: true },
)
</script>

<style>
:root {
  --font-sans: "Montserrat", sans-serif;
}
</style>
