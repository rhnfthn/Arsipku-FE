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
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";

import { useAuth } from "~/composables/useAuth";
import { usePenomoran } from "~/composables/usePenomoran";

const { user, getProfile } = useAuth();
const {
  adminCounts,
  userCounts,
  getNomorRequestCountAdmin,
  getNomorRequestCountUser,
} = usePenomoran();

const route = useRoute();

// ✅ Helper untuk mendapatkan position ID yang valid
const getPositionId = (userValue) => {
  if (!userValue) return null;

  // Jika position adalah object dengan id
  if (userValue.position && typeof userValue.position === "object") {
    const id = userValue.position.id;
    return typeof id === "number"
      ? id
      : typeof id === "string"
        ? Number(id)
        : null;
  }

  // Jika position adalah number langsung
  if (typeof userValue.position === "number") {
    return userValue.position;
  }

  // Jika position adalah string number
  if (
    typeof userValue.position === "string" &&
    !isNaN(Number(userValue.position))
  ) {
    return Number(userValue.position);
  }

  console.error(
    "❌ Cannot extract valid position ID from:",
    userValue.position,
  );
  return null;
};

// Get current counts based on role
const currentCounts = computed(() => {
  const isAdmin =
    user.value?.role === "admin" || user.value?.role === "superadmin";

  console.log("🎯 Getting current counts:", {
    role: user.value?.role,
    isAdmin,
    adminCounts: adminCounts.value,
    userCounts: userCounts.value,
    returning: isAdmin ? "adminCounts" : "userCounts",
  });

  return isAdmin ? adminCounts.value : userCounts.value;
});

// Fetch counts based on role
const fetchCounts = async () => {
  try {
    if (!user.value) {
      console.warn("⚠️ User not loaded, skipping count fetch");
      return;
    }

    const isAdmin =
      user.value.role === "admin" || user.value.role === "superadmin";

    const positionId = getPositionId(user.value);

    console.log("🔄 Fetching counts:", {
      role: user.value.role,
      isAdmin,
      rawPosition: user.value.position,
      extractedPositionId: positionId,
      positionIdType: typeof positionId,
    });

    if (isAdmin) {
      console.log("📊 Fetching ADMIN counts...");
      await getNomorRequestCountAdmin();
      console.log("✅ Admin counts updated:", adminCounts.value);
    } else if (positionId && !isNaN(positionId)) {
      console.log("📊 Fetching USER counts for position:", positionId);
      await getNomorRequestCountUser(positionId);
      console.log("✅ User counts updated:", userCounts.value);
    } else {
      console.error("❌ Invalid or missing position ID:", {
        positionId,
        isNaN: isNaN(positionId),
        position: user.value.position,
      });
    }
  } catch (error) {
    console.error("❌ Error fetching counts:", error);
  }
};

let countInterval = null;

onMounted(async () => {
  try {
    // Ensure user is loaded first
    if (!user.value) {
      console.log("⏳ Loading user profile...");
      await getProfile();
    }

    // Wait a bit for user.value.position to be set
    await nextTick();

    const positionId = getPositionId(user.value);

    console.log("🚀 Sidebar mounted, user:", {
      role: user.value?.role,
      positionId: positionId,
      positionIdType: typeof positionId,
      position: user.value?.position,
      isValidNumber: positionId && !isNaN(positionId) && positionId > 0,
    });

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    // ✅ Only fetch if we have valid position or admin role
    const canFetch =
      user.value?.role === "admin" ||
      user.value?.role === "superadmin" ||
      (positionId && !isNaN(positionId) && positionId > 0);

    if (canFetch) {
      // Initial fetch with delay to ensure position is loaded
      setTimeout(async () => {
        console.log("⏰ Initial count fetch triggered");
        await fetchCounts();
      }, 200);

      // Poll setiap 30 detik untuk update counts
      countInterval = setInterval(() => {
        console.log("🔄 Polling count update...");
        fetchCounts();
      }, 30000);
    } else {
      console.warn("⚠️ Cannot fetch counts - invalid position or role:", {
        role: user.value?.role,
        positionId,
      });
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

    console.log("👤 User changed:", {
      oldPosition: oldPos,
      newPosition: newPos,
      newPositionValid: newPos && !isNaN(newPos) && newPos > 0,
      role: newUser?.role,
      rawPosition: newUser?.position,
    });

    // Only fetch if position is valid and changed
    if (
      newUser &&
      newPos &&
      !isNaN(newPos) &&
      newPos > 0 &&
      newPos !== oldPos
    ) {
      console.log("🔄 Position changed, fetching counts...");
      await fetchCounts();

      // ✅ FIX: Handle draft fetch - pastikan position adalah object dengan id yang valid
      const positionForDraft = {
        id: newPos,
        position_text:
          typeof newUser.position === "object"
            ? newUser.position.position_text
            : "",
      };

      console.log("📋 Fetching drafts for position:", positionForDraft);
      fetchDrafts(positionForDraft);
    }
  },
  { immediate: false, deep: true },
);

// Watch counts for debugging
watch(
  [adminCounts, userCounts],
  ([admin, userVal]) => {
    console.log("🔥 Counts updated:", {
      role: user.value?.role,
      position_id: getPositionId(user.value),
      adminCounts: admin,
      userCounts: userVal,
    });
  },
  { deep: true },
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

const userMenuUtama = computed(() => [
  {
    label: "Dashboard",
    to: "/user/dashboard",
    icon: "i-lucide-layout-dashboard",
  },
  {
    label: "Kotak Masuk",
    to: "/user/korespondensi/kotak-masuk",
    icon: "i-lucide-inbox",
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
  },
]);

const userMenuUtilitas = computed(() => {
  console.log("🔧 Building userMenuUtilitas, userCounts:", userCounts.value);

  return [
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
      badge:
        userCounts.value.belum_diajukan > 0
          ? userCounts.value.belum_diajukan
          : null,
    },
  ];
});

// =======================
// B. DATA MENU ADMIN
// =======================

const tulisChildrenByBod = computed(() => {
  const tag = user.value?.bodTag ?? "";

  const all = [
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
    { label: "Kajian", to: "/admin/korespondensi/tulis/kajian" },
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
    to: "/admin/dashboard",
    icon: "i-lucide-layout-dashboard",
  },
  {
    label: "Tulis",
    to: "/admin/korespondensi/tulis",
    icon: "i-lucide-edit",
    children: tulisChildrenByBod.value,
  },
  {
    label: "Kotak Masuk",
    to: "/admin/korespondensi/kotak-masuk",
    icon: "i-lucide-inbox",
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
  },
]);

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

const isAdminRole = computed(() => {
  return user.value?.role === "admin" || user.value?.role === "superadmin";
});

const adminMenuAdministrasi = computed(() => {
  console.log(
    "🔧 Building adminMenuAdministrasi, adminCounts:",
    adminCounts.value,
  );

  const base = [
    { label: "Delegasi", to: "/admin/delegasi", icon: "i-lucide-users" },
    {
      label: "Titelatur Inggris",
      to: "/admin/titelatur",
      icon: "i-lucide-languages",
    },
    {
      label: "Penomoran",
      icon: "i-lucide-hash",
      hasNotification: false,
      children: [
        {
          label: "Usulan",
          to: "/admin/penomoran/usulan",
          badge:
            adminCounts.value.belum_diajukan > 0
              ? adminCounts.value.belum_diajukan
              : null,
        },
        {
          label: "Verifikasi",
          to: "/admin/penomoran/verifikasi",
          badge:
            adminCounts.value.menunggu_verifikasi > 0
              ? adminCounts.value.menunggu_verifikasi
              : null,
        },
        { label: "Penomoran", to: "/admin/penomoran" },
      ],
    },

    {
      label: "Naskah Dinas",
      to: "/admin/naskah-dinas",
      icon: "i-lucide-file-text",
    },
  ];

  if (user.value?.role === "superadmin") {
    base.push({
      label: "Master Data",
      icon: "i-lucide-database",
      children: [
        {
          label: "Akun",
          to: "/admin/master/akun",
          icon: "i-lucide-user-round",
        },
        { label: "Tertuju Eksternal", to: "/admin/master/tertuju-eksternal" },
      ],
    });
  }

  return base;
});

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

// Check if Administrasi has notification
const hasAdministrasiNotification = computed(() => {
  const hasNotif =
    adminCounts.value.menunggu_verifikasi > 0 ||
    adminCounts.value.belum_diajukan > 0;

  console.log("🔔 Admin administrasi notification check:", {
    menunggu_verifikasi: adminCounts.value.menunggu_verifikasi,
    belum_diajukan: adminCounts.value.belum_diajukan,
    hasNotif,
  });

  return hasNotif;
});

// Check if Utilitas has notification (for user)
const hasUtilitasNotification = computed(() => {
  const hasNotif = userCounts.value.belum_diajukan > 0;

  console.log("🔔 User utilitas notification check:", {
    belum_diajukan: userCounts.value.belum_diajukan,
    hasNotif,
  });

  return hasNotif;
});

// --- 4. COMPUTED: APPS (DINAMIS BY ROUTE) ---
const apps = computed(() => {
  const isAdminRoute = route.path.startsWith("/admin");

  if (isAdminRoute) {
    const baseApps = [
      {
        id: "admin-utama",
        label: "Utama",
        icon: "i-heroicons-squares-2x2",
        menus: adminMenuUtama.value,
        hasNotification: false,
      },
      {
        id: "admin-utilitas",
        label: "Utilitas",
        icon: "i-heroicons-briefcase",
        menus: adminMenuUtilitas,
        hasNotification: false,
      },
    ];

    if (isAdminRole.value) {
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
    }

    return baseApps;
  }

  // USER ROUTE
  return [
    {
      id: "user-utama",
      label: "Utama",
      icon: "i-heroicons-home",
      menus: userMenuUtama.value,
      hasNotification: false,
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
