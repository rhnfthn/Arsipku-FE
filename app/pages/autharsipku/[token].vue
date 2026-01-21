<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0"
      enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div v-if="visible"
        class="fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-br from-white/75 to-[#e8eff6]/75 backdrop-blur-[2px]">

        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="w-[400px] h-[400px] rounded-full bg-gradient-radial from-white/95 via-white/60 to-transparent">
          </div>
        </div>

        <div class="relative flex flex-col items-center gap-6 z-10">

          <div class="relative flex items-center justify-center w-24 h-24">
            <div
              class="absolute inset-0 rounded-full border-4 border-transparent border-t-[#175fa4] border-r-[#749fc8] animate-spin"
              style="animation-duration: 1.5s;">
            </div>

            <div class="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-lg relative z-10">
              <div class="plane-float">
                <UIcon name="i-lucide-plane" class="w-8 h-8 text-[#175fa4] -rotate-45" />
              </div>
            </div>
          </div>

          <div class="flex flex-col items-center gap-2">
            <span class="text-gray-900 font-semibold text-lg">
              Memverifikasi Akses
            </span>
            <span class="text-sm text-gray-600">
              Mohon tunggu sebentar...
            </span>
          </div>

        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useRoute, navigateTo } from "#imports";

const { verifyToken } = useAuth();
const route = useRoute();

const visible = ref(true);

onMounted(async () => {
  const token = route.params.token;
  console.log("ROUTE FULL:", route.fullPath);
  console.log("TOKEN:", token);

  if (!token) {
    await delayWithFade();
    return navigateTo("/");
  }

  try {
    const result = await verifyToken(token);

    console.log("VERIFY RESULT:", result);

    await delayWithFade();

    if (result?.success) {
      const accessToken = result?.data?.accessToken;
      const sessionId = result?.data?.sessionId;
      const role = result?.data?.user?.role;

      if (!accessToken || !sessionId) {
        console.error("Token/sessionId missing from API response:", result);
        return navigateTo("/");
      }

      // Simpan token
      localStorage.setItem("token", accessToken);
      localStorage.setItem("sessionId", sessionId);

      // Routing Dinamis
      if (["admin", "superadmin", "user"].includes(role)) {
        return navigateTo("/dashboard");
      }

      // fallback
      return navigateTo("/");
    }
  } catch (error) {
    console.error("Verify token gagal:", error);
    await delayWithFade();
    return navigateTo("/login");
  }
});

function delayWithFade() {
  return new Promise((resolve) => {
    setTimeout(() => {
      visible.value = false;
      setTimeout(resolve, 300);
    }, 3000);
  });
}
</script>

<style scoped>
/* STYLE BARU */
@keyframes planeFloat {

  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-8px);
  }
}

.plane-float {
  animation: planeFloat 2s ease-in-out infinite;
}

.bg-gradient-radial {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.6) 40%, transparent 70%);
}
</style>
