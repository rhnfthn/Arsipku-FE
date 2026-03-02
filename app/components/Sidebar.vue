<template>
  <div
    v-if="isMobileOpen"
    class="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
    @click="closeMobile"
  ></div>

  <aside
    class="h-full z-50 flex transition-all duration-300 bg-[#F6F8FC] dark:bg-gray-900 shadow-xl md:shadow-none"
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
        class="flex-1 overflow-y-auto hover:overflow-y-scroll custom-scrollbar"
      >
        <SidebarItem
          v-for="(item, index) in currentAppData.menus"
          :key="index"
          :item="item"
          :collapsed="false"
        />

        <div v-if="activeApp.includes('utama')" class="mt-6 mb-4">
          <div class="flex items-center justify-between px-7 mb-2 group">
            <span class="text-[14px] font-bold text-gray-600 dark:text-gray-400"
              >Label</span
            >
            <button
              @click="openCreateLabelModal"
              class="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              title="Tambah Label Baru"
            >
              <UIcon name="i-lucide-plus" class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-0.5">
            <div v-if="isLoadingLabels" class="px-7 space-y-2 mt-2">
              <USkeleton
                class="h-8 w-full rounded-full bg-gray-200 dark:bg-gray-800"
                v-for="n in 3"
                :key="n"
              />
            </div>

            <div v-else>
              <SidebarLabelItem
                v-for="rootLabel in labelTree"
                :key="rootLabel.id"
                :item="rootLabel"
                :level="0"
                :labelCounts="labelCounts"
                @edit="openEditLabelModal"
                @delete="openDeleteConfirm"
              />
            </div>

            <div
              v-if="!isLoadingLabels && labels.length === 0"
              class="px-7 py-2 text-xs text-gray-400 italic"
            >
              Belum ada label
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <div
    v-if="showLabelModal"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4"
  >
    <div
      class="fixed inset-0 bg-black/50 transition-opacity"
      @click="closeLabelModal"
    ></div>

    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md relative z-10 overflow-hidden transform transition-all"
    >
      <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          {{ isEditing ? "Edit Label" : "Label baru" }}
        </h3>
      </div>

      <div class="p-6 space-y-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Masukkan nama label {{ isEditing ? "" : "baru" }}:
          </label>
          <input
            v-model="labelForm.nama"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-900 dark:text-white"
            placeholder="Contoh: Penting"
          />
        </div>

        <div class="flex items-center gap-2">
          <input
            v-model="labelForm.isNested"
            id="check-nest"
            type="checkbox"
            class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label
            for="check-nest"
            class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            Pilih label parent:
          </label>
        </div>

        <div>
          <select
            v-model="labelForm.parentId"
            :disabled="!labelForm.isNested"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400"
          >
            <option value="">Pilih Induk</option>
            <option v-for="l in availableParents" :key="l.id" :value="l.id">
              {{ l.nama }}
            </option>
          </select>
        </div>
      </div>

      <div
        class="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 flex justify-end gap-3"
      >
        <button
          @click="closeLabelModal"
          class="px-4 py-2 text-sm font-medium text-primary-600 bg-transparent hover:bg-primary-50 rounded-md transition-colors"
        >
          Batal
        </button>
        <button
          @click="saveLabel"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-400 hover:bg-primary-500 rounded-md shadow-sm transition-colors"
          :disabled="!labelForm.nama || isProcessing"
        >
          {{ isProcessing ? "Menyimpan..." : isEditing ? "Simpan" : "Buat" }}
        </button>
      </div>
    </div>
  </div>

  <div
    v-if="showDeleteModal"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4"
  >
    <div
      class="fixed inset-0 bg-black/50 transition-opacity"
      @click="showDeleteModal = false"
    ></div>
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm relative z-10 p-6"
    >
      <div class="text-center">
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="mx-auto h-12 w-12 text-red-500 mb-4"
        />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Hapus Label?
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Apakah Anda yakin ingin menghapus label "<strong>{{
            labelToDelete?.nama
          }}</strong
          >"? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div class="flex justify-center gap-3">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Batal
          </button>
          <button
            @click="confirmDelete"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
            :disabled="isProcessing"
          >
            {{ isProcessing ? "Menghapus..." : "Hapus" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  reactive,
} from "vue";
import { useRoute } from "vue-router";

import { useAuth } from "~/composables/useAuth";
import { usePenomoran } from "~/composables/usePenomoran";
import { useInboxCount } from "~/composables/useInboxCount";
import { useLabel } from "~/composables/useLabel";
import { buildLabelTree } from "~/utils/treeHelper";
import SidebarLabelItem from "~/components/SidebarLabelItem.vue";

const { user, getProfile } = useAuth();
const {
  adminCounts,
  userCounts,
  getNomorRequestCountAdmin,
  getNomorRequestCountUser,
} = usePenomoran();

const { unreadCount, fetchInboxCount } = useInboxCount();

const {
  labels,
  labelCounts,
  isLoadingLabels,
  fetchLabels,
  fetchLabelCounts,
  createLabel,
  updateLabel,
  deleteLabel,
} = useLabel();

const labelTree = computed(() => labels.value);

const route = useRoute();

const isAdminOrSuperadmin = computed(() =>
  ["admin", "superadmin"].includes(user.value?.role),
);

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

watch(
  () => user.value,
  async (newUser) => {
    if (newUser) {
      fetchLabels();
      fetchLabelCounts();

      const posId = getPositionId(newUser);
      await fetchCounts();

      if (posId && !isNaN(posId)) {
        await fetchInboxCount(posId);
      }
    }
  },
  { immediate: true },
);

onMounted(async () => {
  try {
    if (!user.value) {
      await getProfile();
    }
    await nextTick();

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    if (user.value) {
      fetchLabels();
      fetchLabelCounts();
    }

    countInterval = setInterval(() => {
      if (user.value) {
        fetchCounts();
        fetchLabelCounts();

        const positionId = getPositionId(user.value);
        if (positionId && !isNaN(positionId)) {
          fetchInboxCount(positionId);
        }
      }
    }, 30000);
  } catch (error) {
    console.error("❌ Error in sidebar mount:", error);
  }
});

const props = defineProps({
  collapsed: Boolean,
});
const emit = defineEmits(["update:collapsed"]);

const isMobileOpen = ref(false);
const isMobile = ref(false);
const activeApp = ref("");
const hoveredApp = ref(null);

const hasInboxUnread = computed(() => unreadCount.value > 0);
const { t } = useI18n();

const userMenuUtama = computed(() => {
  return [
    {
      label: "Dashboard",
      to: "/beranda",
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
      label: "Draf",
      to: "/korespondensi/draf",
      icon: "i-lucide-file-text",
    },
  ];
});

const userMenuUtilitas = computed(() => {
  const badgeCount = userCounts.value.belum_diajukan || 0;
  return [
    {
      label: "Penandatangan",
      to: "/penandatangan",
      icon: "i-lucide-signature",
    },
    {
      label: "Penyingkat Tautan",
      to: "/penyingkat-tautan",
      icon: "i-lucide-link",
    },
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

const tulisMenu = computed(() => ({
  label: t("tulis"),
  to: "/korespondensi/tulis",
  icon: "i-lucide-edit",
  children: tulisChildrenByBod.value,
}));

const tulisChildrenByBod = computed(() => {
  const tag = user.value?.bodTag ?? "";
  const all = [
    { label: t("nota_dinas"), to: "/korespondensi/tulis/nota-dinas" },
    { label: t("disposisi"), to: "/korespondensi/tulis/disposisi" },
    {
      label: t("surat_dinas_internal"),
      to: "/korespondensi/tulis/surat-dinas-internal",
    },
    {
      label: t("surat_dinas_eksternal"),
      to: "/korespondensi/tulis/surat-dinas-eksternal",
    },
    { label: t("kajian"), to: "/korespondensi/tulis/kajian" },
  ];

  if (tag === "BOD" || tag === "BOD-1") return all;
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
  { label: t("beranda"), to: "/beranda", icon: "i-lucide-layout-dashboard" },
  tulisMenu.value,
  {
    label: t("kotak_masuk"),
    to: "/korespondensi/kotak-masuk",
    icon: "i-lucide-inbox",
    badge: unreadCount.value > 0 ? unreadCount.value : null,
  },
  {
    label: t("terkirim"),
    to: "/korespondensi/terkirim",
    icon: "i-lucide-send",
  },
  { label: t("draft"), to: "/korespondensi/draf", icon: "i-lucide-file-text" },
]);

const adminMenuUtilitas = computed(() => {
  const menus = [
    {
      label: t("digsig"),
      icon: "i-lucide-signature",
      children: [
        { label: t("verifikasi"), to: "/digsig/verifikasi-dokumen" },
        { label: t("sign"), to: "/digsig/penandatanganan" },
        { label: t("check_dokumen"), to: "/digsig/cek-dokumen" },
        { label: "Log Digsig", to: "/digsig/log-digsig" },
      ],
    },
    {
      label: t("short_url"),
      to: "/penyingkat-tautan",
      icon: "i-lucide-link",
    },
    { label: t("template"), to: "/template", icon: "i-lucide-copy" },
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
    { label: t("delegasi"), to: "/delegasi", icon: "i-lucide-users" },
    {
      label: t("titelatur_inggris"),
      to: "/titelatur",
      icon: "i-lucide-languages",
    },
    {
      label: t("penomoran"),
      icon: "i-lucide-hash",
      hasNotification: false,
      children: [
        {
          label: t("usulan"),
          to: "/penomoran/usulan",
          badge:
            adminCounts.value.belum_diajukan > 0
              ? adminCounts.value.belum_diajukan
              : null,
        },
        {
          label: t("ver"),
          to: "/penomoran/verifikasi",
          badge:
            adminCounts.value.menunggu_verifikasi > 0
              ? adminCounts.value.menunggu_verifikasi
              : null,
        },
        { label: t("penomoran"), to: "/penomoran/nomor" },
      ],
    },
    {
      label: t("naskah_masuk"),
      to: "/naskah-dinas",
      icon: "i-lucide-file-text",
    },
  ];

  if (user.value?.role === "superadmin") {
    base.push(
      {
        label: t("master_data"),
        icon: "i-lucide-database",
        children: [
          {
            label: t("akun"),
            to: "/master/akun",
            icon: "i-lucide-user-round",
          },
          { label: t("tertuju"), to: "/master/tertuju-eksternal" },
          {
            label: t("perusahaan"),
            to: "/master/perusahaan",
            icon: "i-lucide-building-2",
          },
          { label: t("klasifikasi"), to: "/master/klasifikasi" },
          { label: t("jenis"), to: "/master/jenis" },
        ],
      },
      {
        label: t("konfigurasi"),
        to: "/konfigurasi-sistem",
        icon: "i-lucide-settings-2",
      },
    );
  }

  return base;
});

const adminMenuLaporan = computed(() => [
  {
    label: t("rekap"),
    to: "/laporan/rekap-naskah",
    icon: "i-lucide-file-bar-chart-2",
  },
  {
    label: t("detail"),
    to: "/laporan/detail-naskah",
    icon: "i-lucide-file-search",
  },
  {
    label: t("naskah"),
    to: "/laporan/naskah-masuk",
    icon: "i-lucide-folder-input",
  },
]);

const hasAdministrasiNotification = computed(() => {
  return adminCounts.value.menunggu_verifikasi > 0;
});

const hasUtilitasNotification = computed(() => {
  if (!isAdminOrSuperadmin.value) {
    return userCounts.value.belum_diajukan > 0;
  }
  return false;
});

const apps = computed(() => {
  if (isAdminOrSuperadmin.value) {
    const baseApps = [
      {
        id: "admin-utama",
        label: t("utama"),
        icon: "i-heroicons-squares-2x2",
        menus: adminMenuUtama.value,
        hasNotification: hasInboxUnread.value,
      },
      {
        id: "admin-utilitas",
        label: t("utilitas"),
        icon: "i-heroicons-briefcase",
        menus: adminMenuUtilitas.value,
        hasNotification: false,
      },
    ];
    baseApps.push(
      {
        id: "admin-administrasi",
        label: t("administrasi"),
        icon: "i-heroicons-cog-6-tooth",
        menus: adminMenuAdministrasi.value,
        hasNotification: hasAdministrasiNotification.value,
      },
      {
        id: "admin-laporan",
        label: t("laporan"),
        icon: "i-heroicons-presentation-chart-line",
        menus: adminMenuLaporan.value,
        hasNotification: false,
      },
    );
    return baseApps;
  }
  return [
    {
      id: "user-utama",
      label: t("utama"),
      icon: "i-heroicons-home",
      menus: userMenuUtama.value,
      hasNotification: hasInboxUnread.value,
    },
    {
      id: "user-utilitas",
      label: t("utilitas"),
      icon: "i-heroicons-squares-plus",
      menus: userMenuUtilitas.value,
      hasNotification: hasUtilitasNotification.value,
    },
  ];
});

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

// ==========================================
//        LOGIC LABEL MANAGEMENT
// ==========================================

const showLabelModal = ref(false);
const showDeleteModal = ref(false);
const isEditing = ref(false);
const isProcessing = ref(false);
const labelToDelete = ref(null);

const labelForm = reactive({
  id: null,
  name: "",
  isNested: false,
  parentId: "",
});

const availableParents = computed(() => {
  if (!isEditing.value) return labels.value;
  return labels.value.filter((l) => l.id !== labelForm.id);
});

const openCreateLabelModal = () => {
  isEditing.value = false;
  labelForm.id = null;
  labelForm.nama = "";
  labelForm.isNested = false;
  labelForm.parentId = "";
  showLabelModal.value = true;
};

const openEditLabelModal = (label) => {
  isEditing.value = true;
  labelForm.id = label.id;
  labelForm.nama = label.nama;
  labelForm.isNested = !!label.parent_id;
  labelForm.parentId = label.parent_id || "";
  showLabelModal.value = true;
};

const closeLabelModal = () => {
  showLabelModal.value = false;
  isProcessing.value = false;
};

const saveLabel = async () => {
  if (!labelForm.nama) return;
  isProcessing.value = true;

  const payload = {
    nama: labelForm.nama,
    idParent:
      labelForm.isNested && labelForm.parentId ? labelForm.parentId : null,
  };

  try {
    if (isEditing.value) {
      await updateLabel(labelForm.id, payload);
    } else {
      await createLabel(payload);
    }
    await fetchLabels();
    closeLabelModal();
  } catch (err) {
    console.error("Gagal menyimpan label:", err);
  } finally {
    isProcessing.value = false;
  }
};

const openDeleteConfirm = (label) => {
  labelToDelete.value = label;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (labelToDelete.value) {
    isProcessing.value = true;
    try {
      await deleteLabel(labelToDelete.value.id);
      await fetchLabels();
      showDeleteModal.value = false;
      labelToDelete.value = null;
    } catch (err) {
      console.error("Gagal menghapus label:", err);
    } finally {
      isProcessing.value = false;
    }
  }
};

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
  if (countInterval) {
    clearInterval(countInterval);
  }
});

defineExpose({ openMobile, closeMobile });
</script>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 20px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.custom-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
}

:is(.dark .custom-scrollbar)::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.15);
}

:is(.dark .custom-scrollbar):hover::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.25);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateX(-10px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateX(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>
