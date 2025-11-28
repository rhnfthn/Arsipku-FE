<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import SidebarItem from "./SidebarItem.vue";
import { badge } from "#build/ui";

const props = defineProps({
  collapsed: Boolean,
});
defineEmits(["update:collapsed"]);

const route = useRoute();
const isMobileOpen = ref(false);
const showMore = ref(false);

const closeMobile = () => (isMobileOpen.value = false);

defineExpose({
  openMobile: () => (isMobileOpen.value = true),
  closeMobile,
});

const userMenus = [
  { label: "Dashboard", to: "/user/dashboard", icon: "i-lucide-layout-dashboard" },
  { label: "Kotak Masuk", to: "/user/korespondensi/kotak-masuk", icon: "i-lucide-inbox", badge: 2 },
  { label: "Terkirim", to: "/user/korespondensi/terkirim", icon: "i-lucide-send" },
  { label: "Draft", to: "/user/korespondensi/draft", icon: "i-lucide-file-text", badge: 1 },
  { label: "Short URL", to: "/user/short-url", icon: "i-lucide-link" },
  { label: "Template", to: "/user/template", icon: "i-lucide-copy" },
  { label: "Titelatur Inggris", to: "/user/titelatur", icon: "i-lucide-languages" },
];

const adminMainMenus = [
  { label: "Dashboard", to: "/admin/dashboard", icon: "i-lucide-layout-dashboard" },
  {
    label: "Tulis",
    to: "/admin/korespondensi/tulis",
    icon: "i-lucide-edit",
    children: [
      { label: "Nota Dinas", to: "/admin/korespondensi/tulis/nota-dinas" },
      { label: "Disposisi", to: "/admin/korespondensi/tulis/disposisi" },
      { label: "Surat Dinas Internal", to: "/admin/korespondensi/tulis/surat-dinas-internal" },
      { label: "Surat Dinas Eksternal", to: "/admin/korespondensi/tulis/surat-dinas-eksternal" },
      { label: "Registrasi", to: "/admin/korespondensi/tulis/registrasi" },
    ]
  },
  { label: "Kotak Masuk", to: "/admin/korespondensi/kotak-masuk", icon: "i-lucide-inbox", badge: 2 },
  { label: "Terkirim", to: "/admin/korespondensi/terkirim", icon: "i-lucide-send" },
  { label: "Draft", to: "/admin/korespondensi/draft", icon: "i-lucide-file-text", badge: 1 },
  {
    label: "Digsig",
    icon: "i-lucide-signature",
    children: [{ label: "unknown", to: "/admin/digsig" }]
  },
  { label: "Short URL", to: "/admin/short-url", icon: "i-lucide-link" },
];

const adminMoreMenus = [
  { label: "Berkas", to: "/admin/berkas", icon: "i-lucide-folder" },
  { label: "Template", to: "/admin/template", icon: "i-lucide-copy" },
  { label: "Delegasi", to: "/admin/delegasi", icon: "i-lucide-users" },
  { label: "Titelatur Inggris", to: "/admin/titelatur", icon: "i-lucide-languages" },
  {
    label: "Penomoran",
    icon: "i-lucide-hash",
    children: [
      { label: "Usulan", to: "/admin/penomoran/usulan" },
      { label: "Verifikasi", to: "/admin/penomoran/verifikasi" },
      { label: "Penomoran", to: "/admin/penomoran/penomoran" },
    ]
  },
  { label: "Naskah Dinas", to: "/admin/naskah-dinas", icon: "i-lucide-file-text" },
  {
    label: "Master Data",
    icon: "i-lucide-database",
    children: [
      { label: "unknown", to: "/admin/master/" },
    ]
  },
  {
    label: "Laporan",
    icon: "i-lucide-bar-chart-3",
    children: [
      { label: "Rekap Naskah", to: "/admin/laporan/rekap-naskah" },
      { label: "Detail Naskah", to: "/admin/laporan/detail-naskah" },
      { label: "Naskah Masuk", to: "/admin/laporan/naskah-masuk" },
    ]
  },
];

const currentMainMenus = computed(() => route.path.startsWith("/admin") ? adminMainMenus : userMenus);
const currentMoreMenus = computed(() => route.path.startsWith("/admin") ? adminMoreMenus : []);
</script>

<template>
  <div v-if="isMobileOpen" class="fixed inset-0 bg-black/50 z-30 md:hidden" @click="closeMobile"></div>

  <aside :class="[
    collapsed ? 'w-20' : 'w-64',
    isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    'fixed left-0 top-0 h-screen z-50',
    'bg-white dark:bg-gray-900 shadow border-r border-gray-200 dark:border-gray-800',
    'transition-all duration-300 flex flex-col',
  ]">
    <div class="relative h-20 flex items-center border-b border-gray-200 dark:border-gray-800 flex-shrink-0"
      :class="collapsed ? 'justify-center' : 'justify-start px-4'">
      <div class="flex items-center gap-2 overflow-hidden">
        <img src="/logo.png" class="h-8 w-auto object-contain flex-shrink-0" />
        <h1 v-if="!collapsed"
          class="font-bold text-lg whitespace-nowrap dark:text-white transition-opacity duration-300">
          ArsipKu
        </h1>
      </div>
      <button @click="isMobileOpen = !isMobileOpen" class="md:hidden absolute right-4 z-20">
        <UIcon :name="isMobileOpen ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'" class="w-7 h-7" />
      </button>
    </div>

    <button @click="$emit('update:collapsed', !collapsed)"
      class="hidden md:flex absolute top-6 -right-4 z-50 w-7 h-7 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-300 dark:border-gray-700 items-center justify-center text-gray-500 hover:text-primary-500 transition-colors">
      <UIcon name="i-heroicons-chevron-left" :class="['w-4 h-4 transition-transform', collapsed && 'rotate-180']" />
    </button>

    <div class="flex-1 space-y-1 py-4 px-2 overflow-y-auto custom-scrollbar overflow-x-visible">

      <SidebarItem v-for="(item, index) in currentMainMenus" :key="'main-' + index" :item="item"
        :collapsed="collapsed" />

      <div v-if="currentMoreMenus.length > 0">
        <div class="mb-1">
          <button @click="showMore = !showMore" :class="[
            'flex items-center transition-all duration-200 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800',
            collapsed ? 'justify-center w-10 h-10 mx-auto' : 'w-full px-4 py-2 gap-3'
          ]">
            <UIcon
              :name="collapsed ? 'i-heroicons-ellipsis-horizontal' : (showMore ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down')"
              :class="collapsed ? 'w-6 h-6' : 'w-5 h-5'" />
            <span v-if="!collapsed" class="text-sm font-medium">{{ showMore ? 'Sembunyikan' : 'Lainnya' }}</span>
          </button>
        </div>

        <div v-show="showMore" class="space-y-1 transition-all">
          <SidebarItem v-for="(item, index) in currentMoreMenus" :key="'more-' + index" :item="item"
            :collapsed="collapsed" />
        </div>
      </div>

    </div>

    <!-- <div class="p-4 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div class="relative group">
        <button
          class="flex items-center w-full gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left overflow-hidden">
          <img src="https://i.pravatar.cc/150?img=33" alt="User"
            class="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700 flex-shrink-0" />
          <div v-if="!collapsed" class="flex-1 min-w-0 overflow-hidden">
            <p class="text-sm font-bold text-gray-900 dark:text-white truncate">Ivan Dwi Santoso</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">Administrator</p>
          </div>
        </button>
      </div>
    </div> -->
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 20px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #374151;
}
</style>