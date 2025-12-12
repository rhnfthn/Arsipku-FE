<template>
  <div
    v-if="isMobileOpen"
    class="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
    @click="closeMobile"
  ></div>

  <aside
    class="fixed left-0 top-0 h-screen z-50 flex transition-all duration-300 bg-[#F6F8FC] dark:bg-gray-900 shadow-xl md:shadow-none"
    :class="[
      // Translasi (Keluar Masuk Layar)
      isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      // Lebar Sidebar
      collapsed && !isMobile ? 'w-[72px]' : 'w-[320px] md:w-[320px]',
    ]"
  >
    <div
      class="w-[72px] flex flex-col items-center py-4 bg-primary-50 dark:bg-gray-950 h-full flex-shrink-0 space-y-6 relative z-50 dark:border-r dark:border-gray-800"
    >
      <button
        @click="handleMenuClick"
        class="p-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 mb-2 transition-colors"
      >
        <UIcon
          :name="isMobile ? 'i-heroicons-x-mark' : 'i-heroicons-bars-3'"
          class="w-6 h-6 text-gray-700 dark:text-gray-200"
        />
      </button>

      <div class="flex flex-col gap-4 w-full items-center">
        <div
          v-for="app in apps"
          :key="app.id"
          @click="setActiveApp(app.id)"
          @mouseenter="hoveredApp = app.id"
          @mouseleave="hoveredApp = null"
          class="group flex flex-col items-center gap-1 cursor-pointer relative w-full"
        >
          <div
            class="w-14 h-8 rounded-full flex items-center justify-center relative transition-colors duration-200"
            :class="
              activeApp === app.id
                ? 'bg-blue-200 dark:bg-gray-800'
                : 'hover:bg-white/50 bg-transparent'
            "
          >
            <UIcon
              :name="app.icon"
              class="w-6 h-6 transition-colors"
              :class="
                activeApp === app.id
                  ? 'text-gray-800 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              "
            />
            <div
              v-if="app.badge"
              class="absolute -top-1 right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 rounded-full border-2 border-primary-50 dark:border-gray-900"
            >
              {{ app.badge }}
            </div>
          </div>
          <span
            class="text-[10px] font-medium transition-colors"
            :class="
              activeApp === app.id
                ? 'text-gray-900 font-bold dark:text-white'
                : 'text-gray-600 dark:text-gray-400'
            "
            >{{ app.label }}
          </span>

          <div
            v-if="collapsed && hoveredApp === app.id && !isMobile"
            class="absolute left-[60px] top-0 w-[260px] bg-[#F6F8FC] dark:bg-gray-800 shadow-2xl rounded-r-xl rounded-b-xl border border-gray-200 dark:border-gray-700 py-4 px-2 z-[60] animate-fade-in origin-top-left"
          >
            <div
              class="px-4 mb-4 border-b border-gray-200 dark:border-gray-700 pb-3"
            >
              <h3
                class="text-lg font-semibold text-gray-800 dark:text-white mb-2"
              >
                {{ app.label }}
              </h3>
            </div>
            <div class="max-h-[300px] overflow-y-auto custom-scrollbar">
              <SidebarItem
                v-for="(item, idx) in app.menus"
                :key="idx"
                :item="item"
                :collapsed="false"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-show="!collapsed || isMobile"
      class="flex-1 flex flex-col h-full overflow-hidden bg-[#F6F8FC] dark:bg-gray-900"
    >
      <div class="h-20 flex items-center px-4 gap-3 flex-shrink-0">
        <img src="/logoAirnav.png" alt="ArsipKu Logo" class="w-8 h-8" />
        <span class="text-xl text-gray-600 dark:text-gray-100 font-medium"
          >ArsipKu</span
        >
      </div>

      <div
        class="flex-1 overflow-y-auto hover:overflow-y-scroll custom-scrollbar pr-2"
      >
        <SidebarItem
          v-for="(item, index) in currentAppData.menus"
          :key="index"
          :item="item"
          :collapsed="false"
        />
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from '~/composables/Auth'
const { user } = useAuth()

// import SidebarItem from './SidebarItem.vue'

// --- 1. SETUP & PROPS ---
const props = defineProps({
  collapsed: Boolean,
});
const emit = defineEmits(["update:collapsed"]);

const route = useRoute();

// --- 2. STATE VARIABLES ---
const isMobileOpen = ref(false);
const isMobile = ref(false);
const activeApp = ref("");
const hoveredApp = ref(null);

// --- 3. DATA MENU STATIS ---

// =======================
// A. DATA MENU USER
// =======================

// 1. User - Utama (Fokus Korespondensi)
const userMenuUtama = [
  {
    label: "Dashboard",
    to: "/user/dashboard",
    icon: "i-lucide-layout-dashboard",
  },
  {
    label: "Kotak Masuk",
    to: "/user/korespondensi/kotak-masuk",
    icon: "i-lucide-inbox",
    badge: 2,
  },
  {
    label: "Terkirim",
    to: "/user/korespondensi/terkirim",
    icon: "i-lucide-send",
  },
  {
    label: "Draft",
    to: "/user/korespondensi/draft",
    icon: "i-lucide-file-text",
    badge: 1,
  },
];

// 2. User - Utilitas (Alat Bantu)
const userMenuUtilitas = [
  { label: "Short URL", to: "/user/short-url", icon: "i-lucide-link" },
  { label: "Template", to: "/user/template", icon: "i-lucide-copy" },
  {
    label: "Titelatur Inggris",
    to: "/user/titelatur",
    icon: "i-lucide-languages",
  },
  {
    label: "Usulan Penomoran",
    to: "/user/penomoran/usulan",
    icon: "i-lucide-hash",
  },
];

// =======================
// B. DATA MENU ADMIN
// =======================

// 1. Admin - Utama (Harian)
const adminMenuUtama = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    icon: "i-lucide-layout-dashboard",
  },
  {
    label: "Tulis",
    to: "/admin/korespondensi/tulis",
    icon: "i-lucide-edit",
    children: [
      { label: "Nota Dinas", to: "/admin/korespondensi/tulis/nota-dinas" },
      { label: "Disposisi", to: "/admin/korespondensi/tulis/disposisi" },
      {
        label: "Surat Dinas Internal",
        to: "/admin/korespondensi/tulis/surat-dinas-internal",
      },
      {
        label: "Surat Dinas Eksternal",
        to: "/admin/korespondensi/tulis/surat-dinas-eksternal",
      },
    ],
  },
  {
    label: "Kotak Masuk",
    to: "/admin/korespondensi/kotak-masuk",
    icon: "i-lucide-inbox",
    // badge: 2,
  },
  {
    label: "Terkirim",
    to: "/admin/korespondensi/terkirim",
    icon: "i-lucide-send",
  },
  {
    label: "Draft",
    to: "/admin/korespondensi/draft",
    icon: "i-lucide-file-text",
    // badge: 1,
  },
];

// 2. Admin - Utilitas
const adminMenuUtilitas = [
  {
    label: "Digsig",
    icon: "i-lucide-signature",
    children: [
      { label: "Verifikasi Dokumen", to: "/admin/digsig/verifikasi-dokumen" },
      { label: "Penandatanganan", to: "/admin/digsig/penandatanganan" },
      { label: "Cek Dokumen", to: "/admin/digsig/cek-dokumen" },
      { label: "Log Digsig", to: "/admin/digsig/log-digsig" },
    ],
  },
  { label: "Short URL", to: "/admin/short-url", icon: "i-lucide-link" },
  { label: "Berkas", to: "/admin/berkas", icon: "i-lucide-folder" },
  { label: "Template", to: "/admin/template", icon: "i-lucide-copy" },
];

// 3. Admin - Administrasi
const adminMenuAdministrasi = computed(() => {
  const menu = [
    { label: "Delegasi", to: "/admin/delegasi", icon: "i-lucide-users" },
    { label: "Titelatur Inggris", to: "/admin/titelatur", icon: "i-lucide-languages" },
    {
      label: "Penomoran",
      icon: "i-lucide-hash",
      children: [
        { label: "Usulan", to: "/admin/penomoran/usulan" },
        { label: "Verifikasi", to: "/admin/penomoran/verifikasi" },
        { label: "Penomoran", to: "/admin/penomoran" },
      ],
    },
    {
      label: "Naskah Dinas",
      to: "/admin/naskah-dinas",
      icon: "i-lucide-file-text",
    },
  ]

  // superadmin yang boleh melihat Master Data
  if (user.value?.role === "superadmin") {
    menu.push({
      label: "Master Data",
      icon: "i-lucide-database",
      children: [
        { label: "Akun", to: "/admin/master/akun" },
        { label: "Hak Akses", to: "/admin/master/hak-akses" },
        { label: "Unknown", to: "/admin/master/" },
      ],
    })
  }

  return menu
})

// 4. Admin - Laporan (FLAT / Tanpa Submenu)
const adminMenuLaporan = [
  {
    label: "Rekap Naskah",
    to: "/admin/laporan/rekap-naskah",
    icon: "i-lucide-file-bar-chart-2",
  },
  {
    label: "Detail Naskah",
    to: "/admin/laporan/detail-naskah",
    icon: "i-lucide-file-search",
  },
  {
    label: "Naskah Masuk",
    to: "/admin/laporan/naskah-masuk",
    icon: "i-lucide-folder-input",
  },
];

// --- 4. COMPUTED: APPS (DINAMIS BY ROUTE) ---
const apps = computed(() => {
  const isAdmin = route.path.startsWith("/admin");

  if (isAdmin) {
    return [
      {
        id: "admin-utama",
        label: "Utama",
        icon: "i-heroicons-squares-2x2",
        menus: adminMenuUtama,
      },
      {
        id: "admin-utilitas",
        label: "Utilitas",
        icon: "i-heroicons-briefcase",
        menus: adminMenuUtilitas,
      },
      {
        id: "admin-administrasi",
        label: "Administrasi",
        icon: "i-heroicons-cog-6-tooth",
        menus: adminMenuAdministrasi.value,
      },
      {
        id: "admin-laporan",
        label: "Laporan",
        icon: "i-heroicons-presentation-chart-line",
        menus: adminMenuLaporan,
      },
    ];
  } else {
    return [
      {
        id: "user-utama",
        label: "Utama",
        icon: "i-heroicons-home",
        actionLabel: "Tulis",
        actionIcon: "i-heroicons-pencil",
        menus: userMenuUtama,
      },
      {
        id: "user-utilitas",
        label: "Utilitas",
        icon: "i-heroicons-squares-plus",
        menus: userMenuUtilitas,
      },
    ];
  }
});

// --- 5. LOGIC SWITCHING & WATCHER ---
const setActiveApp = (appId) => {
  activeApp.value = appId;
};

const currentAppData = computed(() => {
  return apps.value.find((app) => app.id === activeApp.value) || apps.value[0];
});

// Reset activeApp saat route/apps berubah
watch(
  apps,
  (newApps) => {
    if (newApps.length > 0) {
      const exists = newApps.find((a) => a.id === activeApp.value);
      if (!exists) {
        activeApp.value = newApps[0].id;
      }
    }
  },
  { immediate: true },
);

// --- 6. LOGIC RESPONSIVE & EVENT HANDLERS ---
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768;
};

const handleMenuClick = () => {
  if (isMobile.value) {
    isMobileOpen.value = false;
  } else {
    emit("update:collapsed", !props.collapsed);
  }
};

const closeMobile = () => (isMobileOpen.value = false);
const openMobile = () => (isMobileOpen.value = true);

// Lifecycle Hooks
onMounted(() => {
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
});

defineExpose({ openMobile, closeMobile });
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.15s ease-out forwards;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 10px;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #dadce0;
}

.dark .custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: #444746;
}
</style>
