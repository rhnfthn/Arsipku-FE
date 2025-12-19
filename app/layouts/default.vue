<template>
  <div
    class="min-h-dvh w-full bg-[#F6F8FC] dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">

    <div class="fixed top-0 left-0 bottom-0 z-50 h-screen transition-all duration-300">
      <Sidebar ref="sidebarRef" v-model:collapsed="collapsed" />
    </div>

    <div class="flex flex-col min-h-dvh transition-all duration-300"
      :class="collapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-74'">

      <div
        class="sticky top-0 z-40 px-4 md:px-6 py-1 transition-colors duration-300 bg-[#F6F8FC]/90 dark:bg-gray-900 backdrop-blur-md">
        <Navbar @open-mobile-sidebar="openMobileSidebar" />
      </div>

      <main class="flex-1 w-full px-4 md:px-6">
        <div class="mx-auto w-full">
          <NuxtPage />
        </div>
      </main>

      <footer class="p-4 mt-7 text-center text-xs text-gray-400 dark:text-gray-600">
        &copy; 2025 ArsipKu System
      </footer>
    </div>
    <Alert />
    <UNotifications />
  </div>
</template>

<script setup lang="ts">
const collapsed = ref(false);
const sidebarRef = ref();

const openMobileSidebar = () => {
  if (sidebarRef.value && sidebarRef.value.openMobile) {
    sidebarRef.value.openMobile();
  }
};
</script>

<style>
/* Reset dasar */
html,
body {
  background-color: #F6F8FC;
  margin: 0;
  padding: 0;
  /* PENTING: Gunakan min-height bukan height, agar bg tidak putus saat scroll */
  min-height: 100%;
}

/* Warna Dark Mode disamakan persis dengan class bg-gray-900 */
html.dark,
html.dark body {
  background-color: #111827;
}
</style>
