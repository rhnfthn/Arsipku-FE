<template>
  <nav
    class="bg-[#F6F8FC] dark:bg-gray-900 dark:border-gray-800 h-20 flex items-center transition-colors duration-300 gap-3 md:gap-5 justify-between sticky top-0 z-[99]">

    <div class="flex items-center gap-3 flex-1">
      <button
        class="md:hidden me-2 mt-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        @click="$emit('open-mobile-sidebar')">
        <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
      </button>

      <h1 class="font-bold text-xl tracking-tight text-neutral-900 dark:text-white md:hidden">
        ArsipKu
      </h1>

      <UInput v-if="searchConfig.show" v-model="search" :placeholder="searchConfig.placeholder" variant="none" size="xl"
        class="hidden md:block w-full rounded-full [&>input]:placeholder-gray-500 [&>input]:dark:placeholder-gray-400"
        @keyup.enter="handleSearch" :ui="{
          base: 'py-3 px-5 bg-primary-50/80 dark:bg-gray-800 rounded-full focus:bg-white focus:shadow-md dark:focus:bg-gray-700 transition-all',
          icon: { trailing: { pointer: 'pointer-events-auto cursor-pointer' } }
        }">
        <template #trailing>
          <UButton v-if="search" color="gray" variant="link" icon="i-heroicons-x-mark" :padded="false"
            @click="handleReset" class="hover:text-gray-700 dark:hover:text-gray-200 w-5 h-5" />
          <UIcon v-else name="i-heroicons-magnifying-glass" class="text-gray-400 dark:text-gray-500 w-5 h-5" />
        </template>
      </UInput>
    </div>

    <div class="flex items-center gap-5">
      <UDropdownMenu :items="menuItems" :content="{ align: 'end' }" :ui="{
        content: 'w-72 dark:bg-gray-900 dark:ring-gray-800',
        item: 'px-4 py-3',
        itemLabel: 'text-sm',
      }">
        <div class="flex items-center gap-3 cursor-pointer group">
          <div class="flex flex-col items-end text-right leading-tight">
            <span class="hidden md:block text-sm font-semibold text-gray-900 dark:text-gray-100 text-nowrap">
              {{ user?.nama }}
            </span>
            <UTooltip :text="user?.positionText" :popper="{ placement: 'bottom-end' }">
              <span
                class="hidden md:block text-[11px] font-medium text-gray-500 dark:text-gray-400 tracking-tight truncate max-w-[150px] lg:max-w-[200px]">
                {{ user?.positionText }}
              </span>
            </UTooltip>
          </div>
          <UAvatar size="md"
            class="ring-2 ring-transparent group-hover:ring-primary-500/50 transition-all bg-primary-400 text-white font-semibold flex items-center justify-center">
            {{ getInitials(user?.nama) }}
          </UAvatar>
        </div>

        <template #delegation-item="{ item }">
          <div class="flex items-center justify-between w-full gap-2">
            <UTooltip :text="item.label" :popper="{ placement: 'left' }">
              <span class="text-sm truncate transition-colors"
                :class="item.isActive ? 'font-bold text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'">
                {{ item.label }}
              </span>
            </UTooltip>

            <UIcon v-if="item.isActive" name="i-heroicons-check-circle-20-solid"
              class="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
          </div>
        </template>

        <template #search v-if="searchConfig.show">
          <div class="block w-full md:hidden px-3 pt-3">
            <UInput v-model="search" :placeholder="searchConfig.placeholder" size="md" autofocus class="w-full"
              @keyup.enter="handleSearch">
            </UInput>
            <div class="h-px bg-gray-200 dark:bg-gray-800 mt-4 -mx-4"></div>
          </div>
        </template>

        <template #theme-label>
          <div class="flex items-center justify-between w-full px-3">
            <span class="text-sm text-gray-700 dark:text-gray-200">Tampilan</span>
            <div
              class="flex items-center p-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <button @click="isDark = false" class="p-1 rounded-full transition-all flex items-center justify-center"
                :class="!isDark ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'">
                <UIcon name="i-heroicons-sun" class="w-4 h-4" />
              </button>
              <button @click="isDark = true" class="p-1 rounded-full transition-all flex items-center justify-center"
                :class="isDark ? 'bg-gray-700 text-yellow-300 shadow-sm' : 'text-gray-400 hover:text-gray-600'">
                <UIcon name="i-heroicons-moon" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </template>

        <template #lang-label>
          <div class="flex items-center justify-between w-full px-3">
            <span class="text-sm text-gray-700 dark:text-gray-200">Bahasa</span>
            <div
              class="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5 border border-gray-200 dark:border-gray-700">
              <UButton v-for="lang in locales" :key="lang.code" :label="lang.name"
                :variant="currentLocale === lang.code ? 'solid' : 'ghost'" @click="setLocale(lang.code)"
                class="h-6 text-[10px] px-2" />
            </div>
          </div>
        </template>

      </UDropdownMenu>
    </div>
  </nav>

  <ConfirmPopup v-model="showLogoutPopup" type="warning" title="Keluar dari akun?"
    message="Anda akan keluar dari sistem. Pastikan semua pekerjaan sudah disimpan." confirmText="Keluar"
    cancelText="Batal" :isLoading="isLoggingOut" @confirm="confirmLogout" @cancel="showLogoutPopup = false" />

  <LoadingOverlay :loading="isSwitching" :message="switchingMessage" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useDark } from "@vueuse/core";
import type { DropdownMenuItem } from "#ui/types";
import { useAuth } from "~/composables/useAuth";
import ConfirmPopup from "~/components/ConfirmPopup.vue";
// [BARU] Import Loading Overlay
import LoadingOverlay from "~/components/LoadingOverlay.vue";
import { useDelegasi } from "~/composables/useDelegasi";

// --- INIT COMPOSABLES ---
const { user, getProfile, logout } = useAuth();
const { getAvailableRoles, switchRole } = useDelegasi();
const toast = useToast();
const route = useRoute();

// --- STATE ---
const showLogoutPopup = ref(false);
const isLoggingOut = ref(false);
const search = ref("");
const delegationRoles = ref<any[]>([]);

// [STATE BARU] Message untuk Loading Overlay
const switchingMessage = ref("");

// [STATE 1] Label Jabatan Asli (Untuk Tampilan Teks)
const getStoredOriginalRole = () => process.client ? localStorage.getItem('arsipku_original_position') : null;
const originalRoleLabel = ref(getStoredOriginalRole() || "Posisi Utama");

// [STATE 2] ID Delegasi Aktif (Untuk Checklist/Centang)
const activeDelegationId = ref<string | null>(null);

// --- LOGIC 1: MONITOR & INIT DATA ---
const initActiveState = () => {
  if (process.client) {
    activeDelegationId.value = localStorage.getItem('arsipku_active_delegation_id');
  }
};

watch(user, (newUser) => {
  if (newUser) {
    fetchDelegationRoles();

    if (!activeDelegationId.value) {
      originalRoleLabel.value = newUser.positionText;
      if (process.client) localStorage.setItem('arsipku_original_position', newUser.positionText);
    }
    else if (process.client) {
      const stored = localStorage.getItem('arsipku_original_position');
      if (stored) originalRoleLabel.value = stored;
    }
  }
}, { immediate: true });

const fetchDelegationRoles = async () => {
  if (!user.value) return;
  try {
    const roles = await getAvailableRoles();
    delegationRoles.value = roles || [];
  } catch (e) {
    console.error("Error fetch roles", e);
  }
};

// --- LOGIC 2: SWITCH ROLE (DENGAN LOADING) ---
const isSwitching = ref(false);

const handleSwitchRole = async (target: { type: 'delegasi' | 'reset', id?: string }) => {
  if (isSwitching.value) return;

  if (target.type === 'delegasi') {
    switchingMessage.value = "Mengalihkan ke Akun Delegasi...";
  } else {
    switchingMessage.value = "Kembali ke Akun Utama...";
  }

  isSwitching.value = true;

  try {
    let payload = {};
    if (target.type === 'delegasi' && target.id) {
      payload = { delegasiId: target.id };
    } else {
      payload = { resetToOriginal: true };
    }

    const res = await switchRole(payload);

    if (res?.success) {
      if (target.type === 'delegasi' && target.id) {
        // 1. Simpan ID Delegasi
        localStorage.setItem('arsipku_active_delegation_id', target.id);

        // 2. [BARU] Simpan Role Hasil Delegasi dari Response
        // Pastikan struktur response sesuai JSON yang Anda berikan (res.data.user.role)
        if (res.data?.user?.role) {
          localStorage.setItem('arsipku_active_delegation_role', res.data.user.role);
        }
      } else {
        // Hapus data saat reset
        localStorage.removeItem('arsipku_active_delegation_id');
        localStorage.removeItem('arsipku_active_delegation_role');
      }

      localStorage.setItem('switch_role_message', res.message || 'Berhasil mengganti role.');
      window.location.reload();
    } else {
      isSwitching.value = false;
    }
  } catch (error) {
    console.error("Gagal ganti role:", error);
    toast.add({ title: 'Gagal', description: 'Gagal mengganti role.', color: 'red' });
    isSwitching.value = false;
  }
};

const confirmLogout = async () => {
  if (process.client) {
    localStorage.removeItem('arsipku_original_position');
    localStorage.removeItem('arsipku_active_delegation_id');
    localStorage.removeItem('arsipku_active_delegation_role'); // Hapus juga role saat logout
  }

  isLoggingOut.value = true;
  await logout();
  isLoggingOut.value = false;
  showLogoutPopup.value = false;
  navigateTo("/");
};

// --- CONFIG LAINNYA ---
const searchConfig = computed(() => ({ show: false, placeholder: "", key: "" }));
const handleSearch = () => { };
const handleReset = () => { };
const isDark = useDark();
const currentLocale = ref("id");
const locales = [{ code: "id", name: "ID" }, { code: "en", name: "EN" }];
const setLocale = (code: string) => (currentLocale.value = code);

// --- MENU ITEMS CONFIG ---
const itemClass = "text-sm truncate transition-colors cursor-pointer";

const menuItems = computed<DropdownMenuItem[][]>(() => {
  const currentId = activeDelegationId.value;
  const isMainAccountActive = !currentId;

  const mainAccountItem = {
    label: originalRoleLabel.value,
    slot: 'delegation-item',
    isActive: isMainAccountActive,
    click: () => handleSwitchRole({ type: 'reset' }),
    onSelect: () => handleSwitchRole({ type: 'reset' })
  };

  const delegasiItems = delegationRoles.value.map(role => {
    return {
      label: role.position_text,
      slot: 'delegation-item',
      isActive: currentId === role.id,
      click: () => handleSwitchRole({ type: 'delegasi', id: role.id }),
      onSelect: () => handleSwitchRole({ type: 'delegasi', id: role.id })
    };
  });

  return [
    [mainAccountItem, ...delegasiItems],
    [
      { label: "Setting Notif Email", class: itemClass },
      { label: "Visualisasi Digsig (Visible)", class: itemClass },
      { label: "Setting Temporary File", class: itemClass },
    ],
    [{ slot: "theme-label", type: "label" }],
    [{ slot: "lang-label", type: "label" }],
    [{ label: "Keluar", class: "text-sm text-error", onSelect: () => openLogoutPopup() }],
  ];
});

// --- UTILS ---
onMounted(() => {
  if (process.client) {
    initActiveState();

    const successMsg = localStorage.getItem('switch_role_message');
    if (successMsg) {
      toast.add({ title: 'Berhasil', description: successMsg, icon: 'i-heroicons-check-circle', color: 'green' });
      localStorage.removeItem('switch_role_message');
    }
  }
  if (!user.value) getProfile();
});

const openLogoutPopup = () => { showLogoutPopup.value = true; };
// const confirmLogout = async () => {
//   if (process.client) {
//     localStorage.removeItem('arsipku_original_position');
//     localStorage.removeItem('arsipku_active_delegation_id');
//   }

//   isLoggingOut.value = true;
//   await logout();
//   isLoggingOut.value = false;
//   showLogoutPopup.value = false;
//   navigateTo("/");
// };

const getInitials = (name: string) => {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

defineEmits(["open-mobile-sidebar"]);
</script>
