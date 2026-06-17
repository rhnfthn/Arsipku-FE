<template>
  <div
    class="min-h-dvh w-full bg-[#F6F8FC] dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300"
  >
    <!-- GLOBAL ALERT BANNER -->
    <AlertBsre />

    <!-- ANNOUNCEMENT BANNER -->
    <AnnouncementBanner />

    <!-- SIDEBAR - top mengikuti tinggi alert -->
    <div
      class="fixed left-0 bottom-0 z-[93] transition-all duration-300"
      :style="{ top: alertHeight }"
    >
      <Sidebar ref="sidebarRef" v-model:collapsed="collapsed" />
    </div>

    <!-- MAIN CONTENT AREA -->
    <div
      class="flex flex-col min-h-dvh transition-all duration-300"
      :class="collapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-74'"
    >
      <!-- NAVBAR - Sticky top mengikuti tinggi alert -->
      <div
        class="sticky px-4 md:px-7 transition-colors duration-300 bg-[#F6F8FC]/90 dark:bg-gray-900 backdrop-blur-md z-[92]"
        :style="{ top: alertHeight }"
      >
        <Navbar @open-mobile-sidebar="openMobileSidebar" />
      </div>

      <!-- MAIN CONTENT -->
      <main class="flex-1 mx-4 sm:mx-8 z-[91]">
        <div class="mx-auto w-full">
          <NuxtPage />
          <Alert />
        </div>
      </main>

      <!-- FOOTER -->
      <footer class="p-4 text-center text-xs text-gray-400 dark:text-gray-600">
        &copy; 2026 Developed by
        <span class="font-bold text-primary-400">Team Dev Maganghub</span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDigsig } from '~/composables/useDigsig'
import Alert from '~/components/Alert.vue'

const collapsed = ref(false)
const sidebarRef = ref()

const { bsreAlert } = useDigsig()

const alertHeight = computed(() => {
  return bsreAlert.value?.isActive ? '52px' : '0px'
})

const openMobileSidebar = () => {
  if (sidebarRef.value && sidebarRef.value.openMobile) {
    sidebarRef.value.openMobile()
  }
}
</script>

<style>
html,
body {
  background-color: #f6f8fc;
  margin: 0;
  padding: 0;
  min-height: 100%;
}

html.dark,
html.dark body {
  background-color: #111827;
}
</style>
