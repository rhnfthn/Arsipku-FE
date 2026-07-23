<script setup lang="ts">
/**
 * /login redirect page
 * 
 * Tidak ada halaman login di ArsipKu — autentikasi via SSO AirNav.
 * Halaman ini hanya sebagai safety net: jika ada redirect lama / bookmark
 * yang mengarah ke /login, langsung redirect ke / (SSO landing page).
 */
definePageMeta({ layout: false })

navigateTo('/', { replace: true })
</script>
