<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#051321] text-gray-900 dark:text-white">
    
    <div class="fixed top-0 left-0 bottom-0 z-50 transition-all duration-300">
      <Sidebar ref="sidebarRef" v-model:collapsed="collapsed" />
    </div>

    <div
      class="flex flex-col min-h-screen transition-all duration-300"
      :class="collapsed ? 'ml-0 md:ml-20' : 'ml-0 md:ml-64'"
    >
      <Navbar @open-mobile-sidebar="openMobileSidebar" />

      <main class="flex-1 px-8 py-4">
        <NuxtPage />
      </main>

      <footer class="p-4 text-center text-xs text-gray-400">
        &copy; 2025 ArsipKu System
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Navbar from "~/components/Navbar.vue";
import Sidebar from "~/components/Sidebar.vue";

const collapsed = ref(false);
const sidebarRef = ref();

const openMobileSidebar = () => {
  if (sidebarRef.value && sidebarRef.value.openMobile) {
    sidebarRef.value.openMobile();
  }
};
</script>