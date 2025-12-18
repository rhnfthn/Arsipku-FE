<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
    >
      <div class="text-center">
        <div class="loader mx-auto mb-4"></div>
        <p class="text-gray-600 text-lg">
          Memverifikasi akses, mohon tunggu...
        </p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useRoute, navigateTo } from '#imports'

const { verifyToken } = useAuth()
const route = useRoute()

const visible = ref(true)

onMounted(async () => {
  const token = route.params.token
  console.log("ROUTE FULL:", route.fullPath)
  console.log("TOKEN:", token)


  if (!token) {
    await delayWithFade()
    return navigateTo('/')
  }

try {
  const result = await verifyToken(token)

  console.log("VERIFY RESULT:", result)

  await delayWithFade()

if (result?.success) {

  const accessToken = result?.data?.accessToken
  const sessionId = result?.data?.sessionId
  const role = result?.data?.user?.role   // ⬅️ ambil role

  if (!accessToken || !sessionId) {
    console.error("Token/sessionId missing from API response:", result)
    return navigateTo('/login')
  }

  // Simpan token
  localStorage.setItem("token", accessToken)
  localStorage.setItem("sessionId", sessionId)

  // ⬅️ ROUTING DINAMIS
  if (role === "admin" || role === "superadmin") {
    return navigateTo('/admin/dashboard')
  }

  if (role === "user") {
    return navigateTo('/user/dashboard')
  }

  // fallback jika role tidak dikenal
  return navigateTo('/')
}

} catch (error) {
  console.error("Verify token gagal:", error)
  await delayWithFade()
  return navigateTo('/login')
}
})

function delayWithFade() {
  return new Promise(resolve => {
    setTimeout(() => {
      visible.value = false
      setTimeout(resolve, 300)
    }, 3000)
  })
}
</script>

<style>
.loader {
  width: 45px;
  height: 45px;
  border: 4px solid #ddd;
  border-top-color: #457FB6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
