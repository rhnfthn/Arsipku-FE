<template>
  <div
    v-if="isMobileOpen"
    class="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
    @click="closeMobile"
  ></div>

  <aside
    class="fixed left-0 top-0 h-screen z-50 flex transition-all duration-300 bg-[#F6F8FC] dark:bg-gray-900 shadow-xl md:shadow-none"
    :class="[
      isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
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
              v-if="app.hasNotification"
              class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-600 rounded-full border-2 border-white dark:border-gray-950 shadow-md z-10 animate-pulse"
            ></div>
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute } from "vue-router";

import { useAuth } from "~/composables/useAuth";
import { usePenomoran } from "~/composables/usePenomoran";
import { useInboxCount } from "~/composables/useInboxCount";

const { user, getProfile } = useAuth();
const {
  adminCounts,
  userCounts,
  getNomorRequestCountAdmin,
  getNomorRequestCountUser,
} = usePenomoran();

const { unreadCount, fetchInboxCount } = useInboxCount();

const route = useRoute();

// Role check helper
const isAdminOrSuperadmin = computed(() =>
  ["admin", "superadmin"].includes(user.value?.role),
);

// ✅ Helper untuk mendapatkan position ID yang valid
const getPositionId = (userValue) => {
  if (!userValue) return null;

  if (userValue.position && typeof userValue.position === "object") {
    const id = userValue.position.id;
    return typeof id === "number"
      ? id
      : typeof id === "string"
        ? Number(id)
        : null;
  }

  if (typeof userValue.position === "number") {
    return userValue.position;
  }

  if (
    typeof userValue.position === "string" &&
    !isNaN(Number(userValue.position))
  ) {
    return Number(userValue.position);
  }

  return null;
};

// Fetch counts based on role
const fetchCounts = async () => {
  try {
    if (!user.value) return;

    const isAdmin =
      user.value.role === "admin" || user.value.role === "superadmin";

    const positionId = getPositionId(user.value);

    if (isAdmin) {
      await getNomorRequestCountAdmin();
    } else if (positionId && !isNaN(positionId)) {
      await getNomorRequestCountUser(positionId);
    }
  } catch (error) {
    console.error("❌ Error fetching counts:", error);
  }
};

let countInterval = null;

onMounted(async () => {
  try {
    if (!user.value) {
      await getProfile();
    }
    await nextTick();

    const positionId = getPositionId(user.value);

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    if (positionId && !isNaN(positionId)) {
      await fetchInboxCount(positionId);
    }

    const canFetch =
      user.value?.role === "admin" ||
      user.value?.role === "superadmin" ||
      (positionId && !isNaN(positionId) && positionId > 0);

    if (canFetch) {
      setTimeout(async () => {
        await fetchCounts();
      }, 200);

      countInterval = setInterval(() => {
        fetchCounts();
        if (positionId && !isNaN(positionId)) {
          fetchInboxCount(positionId);
        }
      }, 30000);
    }
  } catch (error) {
    console.error("❌ Error in sidebar mount:", error);
  }
});

// Watch user changes
watch(
  () => user.value,
  async (newUser, oldUser) => {
    if (!newUser) return;

    const newPos = getPositionId(newUser);
    const oldPos = getPositionId(oldUser);

    if (
      newUser &&
      newPos &&
      !isNaN(newPos) &&
      newPos > 0 &&
      newPos !== oldPos
    ) {
      await fetchCounts();
      await fetchInboxCount(newPos);
    }
  },
  { immediate: false, deep: true },
);

// --- 1. SETUP & PROPS ---
const props = defineProps({
  collapsed: Boolean,
});
const emit = defineEmits(["update:collapsed"]);

// --- 2. STATE VARIABLES ---
const isMobileOpen = ref(false);
const isMobile = ref(false);
const activeApp = ref("");
const hoveredApp = ref(null);

// --- 3. DATA MENU (COMPUTED AGAR REAKTIF) ---
// =======================
// A. DATA MENU USER
// =======================

const hasInboxUnread = computed(() => unreadCount.value > 0);

const userMenuUtama = computed(() => {
  return [
    {
      label: "Dashboard",
      to: "/dashboard",
      icon: "i-lucide-layout-dashboard",
    },

    tulisMenu.value,

    {
      label: "Kotak Masuk",
      to: "/korespondensi/kotak-masuk",
      icon: "i-lucide-inbox",
      badge: unreadCount.value > 0 ? unreadCount.value : null,
    },
    {
      label: "Terkirim",
      to: "/korespondensi/terkirim",
      icon: "i-lucide-send",
    },
    {
      label: "Draft",
      to: "/korespondensi/draft",
      icon: "i-lucide-file-text",
    },
  ];
});

const userMenuUtilitas = computed(() => {
  const badgeCount = userCounts.value.belum_diajukan || 0;

  return [
    { label: "Short URL", to: "/short-url", icon: "i-lucide-link" },
    { label: "Template", to: "/template", icon: "i-lucide-copy" },
    {
      label: "Titelatur Inggris",
      to: "/titelatur",
      icon: "i-lucide-languages",
    },
    {
      label: "Usulan Penomoran",
      to: "/usulan-penomoran",
      icon: "i-lucide-hash",
      badge: badgeCount > 0 ? badgeCount : null,
    },
  ];
});

// =======================
// B. DATA MENU ADMIN
// =======================

const tulisMenu = computed(() => ({
  label: "Tulis",
  to: "/korespondensi/tulis",
  icon: "i-lucide-edit",
  children: tulisChildrenByBod.value, // 🔥 tetap pakai bodTag
}));

const tulisChildrenByBod = computed(() => {
  const tag = user.value?.bodTag ?? "";

  // Updated Paths
  const all = [
    { label: "Nota Dinas", to: "/korespondensi/tulis/nota-dinas" },
    { label: "Disposisi", to: "/korespondensi/tulis/disposisi" },
    {
      label: "Surat Dinas Internal",
      to: "/korespondensi/tulis/surat-dinas-internal",
    },
    {
      label: "Surat Dinas Eksternal",
      to: "/korespondensi/tulis/surat-dinas-eksternal",
    },
    { label: "Kajian", to: "/korespondensi/tulis/kajian" },
  ];

  if (tag === "BOD" || tag === "BOD-1") {
    return all;
  }

  if (tag === "BOD-2" || tag === "BOD-3") {
    return all.filter(
      (i) =>
        !["Surat Dinas Internal", "Surat Dinas Eksternal", "Kajian"].includes(
          i.label,
        ),
    );
  }

  return all.filter((i) => i.label === "Kajian");
});

const adminMenuUtama = computed(() => [
  {
    label: "Dashboard",
    to: "/dashboard", // Updated Path (Shared path with user, content handled by role)
    icon: "i-lucide-layout-dashboard",
  },
  tulisMenu.value,
  {
    label: "Kotak Masuk",
    to: "/korespondensi/kotak-masuk",
    icon: "i-lucide-inbox",
    badge: unreadCount.value > 0 ? unreadCount.value : null,
  },
  {
    label: "Terkirim",
    to: "/korespondensi/terkirim",
    icon: "i-lucide-send",
  },
  {
    label: "Draft",
    to: "/korespondensi/draft",
    icon: "i-lucide-file-text",
  },
]);

const adminMenuUtilitas = computed(() => {
  const menus = [
    {
      label: "Digsig",
      icon: "i-lucide-signature",
      // Updated Paths
      children: [
        { label: "Verifikasi Dokumen", to: "/digsig/verifikasi-dokumen" },
        { label: "Penandatanganan", to: "/digsig/penandatanganan" },
        { label: "Cek Dokumen", to: "/digsig/cek-dokumen" },
        { label: "Log Digsig", to: "/digsig/log-digsig" },
      ],
    },
    { label: "Short URL", to: "/short-url", icon: "i-lucide-link" },
    { label: "Berkas", to: "/berkas", icon: "i-lucide-folder" },
    { label: "Template", to: "/template", icon: "i-lucide-copy" },

    {
      label: "Usulan Penomoran",
      to: "/usulan-penomoran",
      icon: "i-lucide-hash",
      hasNotification: false,
      onlyUser: true,
      badge:
        userCounts.value.belum_diajukan > 0
          ? userCounts.value.belum_diajukan
          : null,
    },
  ];

  return menus.filter((menu) => !(menu.onlyUser && isAdminOrSuperadmin.value));
});

const adminMenuAdministrasi = computed(() => {
  const base = [
    { label: "Delegasi", to: "/delegasi", icon: "i-lucide-users" },
    {
      label: "Titelatur Inggris",
      to: "/titelatur",
      icon: "i-lucide-languages",
    },
    {
      label: "Penomoran",
      icon: "i-lucide-hash",
      hasNotification: false,
      children: [
        {
          label: "Usulan",
          to: "/penomoran/usulan",
          badge:
            adminCounts.value.belum_diajukan > 0
              ? adminCounts.value.belum_diajukan
              : null,
        },
        {
          label: "Verifikasi",
          to: "/penomoran/verifikasi",
          badge:
            adminCounts.value.menunggu_verifikasi > 0
              ? adminCounts.value.menunggu_verifikasi
              : null,
        },
        { label: "Penomoran", to: "/penomoran/penomoran" },
      ],
    },

    {
      label: "Naskah Dinas",
      to: "/naskah-dinas",
      icon: "i-lucide-file-text",
    },
  ];

  if (user.value?.role === "superadmin") {
    base.push({
      label: "Master Data",
      icon: "i-lucide-database",
      // Updated Paths
      children: [
        {
          label: "Akun",
          to: "/master/akun",
          icon: "i-lucide-user-round",
        },
        { label: "Tertuju Eksternal", to: "/master/tertuju-eksternal" },
      ],
    });
  }

  return base;
});

const adminMenuLaporan = [
  // Updated Paths
  {
    label: "Rekap Naskah",
    to: "/laporan/rekap-naskah",
    icon: "i-lucide-file-bar-chart-2",
  },
  {
    label: "Detail Naskah",
    to: "/laporan/detail-naskah",
    icon: "i-lucide-file-search",
  },
  {
    label: "Naskah Masuk",
    to: "/laporan/naskah-masuk",
    icon: "i-lucide-folder-input",
  },
];

// Check if Administrasi has notification
const hasAdministrasiNotification = computed(() => {
  return (
    adminCounts.value.menunggu_verifikasi > 0 ||
    adminCounts.value.belum_diajukan > 0
  );
});

// Check if Utilitas has notification (for user)
const hasUtilitasNotification = computed(() => {
  // Karena path sekarang /..., kita cek berdasarkan Role bukan path
  if (!isAdminOrSuperadmin.value) {
    return userCounts.value.belum_diajukan > 0;
  }
  return false;
});

// --- 4. COMPUTED: APPS (DINAMIS BY ROLE NOT ROUTE) ---
// Karena folder digabung ke /app, kita tidak bisa membedakan berdasarkan route.path
// Kita membedakan tampilan sidebar berdasarkan ROLE user.

const apps = computed(() => {
  // LOGIC BARU: Cek Role, bukan Path
  if (isAdminOrSuperadmin.value) {
    const baseApps = [
      {
        id: "admin-utama",
        label: "Utama",
        icon: "i-heroicons-squares-2x2",
        menus: adminMenuUtama.value,
        hasNotification: hasInboxUnread.value,
      },
      {
        id: "admin-utilitas",
        label: "Utilitas",
        icon: "i-heroicons-briefcase",
        menus: adminMenuUtilitas.value,
        hasNotification: false,
      },
    ];

    // Admin selalu dapat akses administrasi & laporan
    baseApps.push(
      {
        id: "admin-administrasi",
        label: "Administrasi",
        icon: "i-heroicons-cog-6-tooth",
        menus: adminMenuAdministrasi.value,
        hasNotification: hasAdministrasiNotification.value,
      },
      {
        id: "admin-laporan",
        label: "Laporan",
        icon: "i-heroicons-presentation-chart-line",
        menus: adminMenuLaporan,
        hasNotification: false,
      },
    );

    return baseApps;
  }

  // ELSE: USER ROLE
  return [
    {
      id: "user-utama",
      label: "Utama",
      icon: "i-heroicons-home",
      menus: userMenuUtama.value,
      hasNotification: hasInboxUnread.value,
    },
    {
      id: "user-utilitas",
      label: "Utilitas",
      icon: "i-heroicons-squares-plus",
      menus: userMenuUtilitas.value,
      hasNotification: hasUtilitasNotification.value,
    },
  ];
});

// --- 5. LOGIC SWITCHING & WATCHER ---
const setActiveApp = (appId) => {
  activeApp.value = appId;
};

const currentAppData = computed(() => {
  return apps.value.find((app) => app.id === activeApp.value) || apps.value[0];
});

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

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
  if (countInterval) {
    clearInterval(countInterval);
  }
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

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
